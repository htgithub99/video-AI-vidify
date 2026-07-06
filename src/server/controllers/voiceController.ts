import { Request, Response } from 'express';

import { EXTERNAL_URLS, DEFAULT_AI33_API_KEY, FALLBACK_VOICES_PREVIEWS, getBackendMsg, COMMON_STRINGS, FALLBACK_VOICES } from '../../constants';
import { requestContext } from '../utils/requestContext.js';
import { appWarn, createAppError } from '../../lib/logger.js';

export const getVoices = async (req: Request, res: Response) => {
  const isVi = req.query.lang !== COMMON_STRINGS.EN;
  try {
    const queryParams = new URLSearchParams(req.query as any).toString();
    const targetUrl = `${EXTERNAL_URLS.AI33_VOICES}?${queryParams}`;
    const store = requestContext.getStore();
    const apiKey = store?.ai33Key || process.env.AI33_API_KEY || DEFAULT_AI33_API_KEY;

    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'accept': 'application/json, text/plain, */*',
        'xi-api-key': apiKey
      }
    });

    if (!response.ok) {
      throw createAppError(`${getBackendMsg('HTTP_STATUS_ERROR', isVi)}${response.status}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (error: any) {
    appWarn('FETCH_VOICES_ERR', 'External voice registry load failed. Falling back to high-quality local voices database.', error);

    
    let filtered = [...FALLBACK_VOICES];

    const reqLang = req.query.language as string;
    const reqGender = req.query.gender as string;
    const reqAge = req.query.age as string;
    const reqSearch = req.query.search as string;
    const reqPage = parseInt(req.query.page as string || '1', 10);
    const reqPageSize = parseInt(req.query.page_size as string || '30', 10);

    if (reqLang) {
      filtered = filtered.filter((v: any) => v.language?.toLowerCase() === reqLang.toLowerCase() || v.locale?.toLowerCase().startsWith(reqLang.toLowerCase()));
    }
    if (reqGender) {
      filtered = filtered.filter((v: any) => v.gender?.toLowerCase() === reqGender.toLowerCase());
    }
    if (reqAge) {
      filtered = filtered.filter((v: any) => v.age?.toLowerCase() === reqAge.toLowerCase());
    }
    if (reqSearch) {
      const q = reqSearch.toLowerCase();
      filtered = filtered.filter((v: any) => [v.name, v.description || '', v.voice_id || v.voiceId].some(field => field?.toLowerCase().includes(q)) || (v.tags || []).some((t: string) => t.toLowerCase().includes(q)));
    }

    const startIndex = (reqPage - 1) * reqPageSize;
    const paginated = filtered.slice(startIndex, startIndex + reqPageSize);
    const hasMore = startIndex + reqPageSize < filtered.length;

    res.json({
      success: true,
      data: paginated,
      pagination: {
        page: reqPage,
        page_size: reqPageSize,
        total: filtered.length,
        has_more: hasMore
      }
    });
  }
};
