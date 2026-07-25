import { Request, Response } from "express";
import { EXTERNAL_URLS, getBackendMsg, COMMON_STRINGS, FALLBACK_VOICES, HTTP_HEADERS } from "../../constants";
import { SecurityMessages, SecurityConstants } from "../../constants/security.js";
import { appWarn, createAppError } from "../../lib/logger.js";
import _ from 'lodash';
import { resolveApiKeys } from "../services/apiKeyResolver.js";

export const getVoices = async (req: Request, res: Response) => {
  const isVi = !_.eq(req.query.lang, COMMON_STRINGS.EN);
  try {
    const queryParams = new URLSearchParams(req.query as any).toString();
    const targetUrl = `${EXTERNAL_URLS.AI33_VOICES}?${queryParams}`;
    
    const keys = await resolveApiKeys();
    const apiKey = _.get(keys, 'ai33Key', '');

    if (_.isEmpty(apiKey)) {
      throw createAppError(SecurityMessages.MISSING_AI33_KEY);
    }

    const response = await fetch(targetUrl, {
      method: "GET",
      headers: {
        accept: SecurityConstants.ACCEPT_ALL_JSON,
        [HTTP_HEADERS.XI_API_KEY]: apiKey,
      },
    });

    if (!response.ok) {
      throw createAppError(`${getBackendMsg("HTTP_STATUS_ERROR", isVi)}${response.status}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (error: any) {
    appWarn("FETCH_VOICES_ERR", SecurityConstants.FETCH_VOICES_FALLBACK_WARN, error);

    let filtered = _.concat([], FALLBACK_VOICES);

    const reqLang = req.query.language as string;
    const reqGender = req.query.gender as string;
    const reqAge = req.query.age as string;
    const reqSearch = req.query.search as string;
    const reqPage = parseInt((req.query.page as string) || "1", 10);
    const reqPageSize = parseInt((req.query.page_size as string) || "30", 10);

    if (!_.isEmpty(reqLang)) {
      filtered = _.filter(filtered, (v: any) => _.some([v.language, v.locale], (l) => _.includes(_.toLower(l), _.toLower(reqLang))));
    }
    if (!_.isEmpty(reqGender)) {
      filtered = _.filter(filtered, (v: any) => _.eq(_.toLower(v.gender), _.toLower(reqGender)));
    }
    if (!_.isEmpty(reqAge)) {
      filtered = _.filter(filtered, (v: any) => _.eq(_.toLower(v.age), _.toLower(reqAge)));
    }
    if (!_.isEmpty(reqSearch)) {
      const q = _.toLower(reqSearch);
      filtered = _.filter(filtered, (v: any) => _.some([v.name, v.description || "", v.voice_id || v.voiceId], (field) => _.includes(_.toLower(field), q)) || _.some(v.tags || [], (t: string) => _.includes(_.toLower(t), q)));
    }

    const startIndex = _.multiply(_.subtract(reqPage, 1), reqPageSize);
    const paginated = _.slice(filtered, startIndex, _.add(startIndex, reqPageSize));
    const hasMore = _.lt(_.add(startIndex, reqPageSize), filtered.length);

    res.json({
      success: true,
      data: paginated,
      pagination: {
        page: reqPage,
        page_size: reqPageSize,
        total: filtered.length,
        has_more: hasMore,
      },
    });
  }
};
