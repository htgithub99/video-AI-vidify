import { Request, Response } from "express";
import { EXTERNAL_URLS, getBackendMsg, COMMON_STRINGS, FALLBACK_VOICES, HTTP_HEADERS, HTTP_METHODS } from "../../constants";
import { SecurityMessages, SecurityConstants } from "../../constants/security.js";
import { appWarn, createAppError } from "../../lib/logger.js";
import _ from 'lodash';
import { resolveApiKeys } from "../services/apiKeyResolver.js";

export const getVoices = async (request: Request, response: Response) => {
  const isVi = !_.eq(request.query.lang, COMMON_STRINGS.EN);
  try {
    const queryParams = new URLSearchParams(request.query as any).toString();
    const targetUrl = `${EXTERNAL_URLS.AI33_VOICES}?${queryParams}`;
    
    const keys = await resolveApiKeys();
    const apiKey = _.get(keys, SecurityConstants.REQ_BODY_AI33_KEY, SecurityConstants.EMPTY_STRING);

    if (_.isEmpty(apiKey)) {
      throw createAppError(SecurityMessages.MISSING_AI33_KEY);
    }

    const apiResponse = await fetch(targetUrl, {
      method: HTTP_METHODS.GET,
      headers: {
        accept: SecurityConstants.ACCEPT_ALL_JSON,
        [HTTP_HEADERS.XI_API_KEY]: apiKey,
      },
    });

    if (!apiResponse.ok) {
      throw createAppError(`${getBackendMsg("HTTP_STATUS_ERROR", isVi)}${apiResponse.status}`);
    }

    const data = await apiResponse.json();
    response.json(data);
  } catch (error: any) {
    appWarn("FETCH_VOICES_ERR", SecurityConstants.FETCH_VOICES_FALLBACK_WARN, error);

    let filtered = _.concat([], FALLBACK_VOICES);

    const reqLang = request.query.language as string;
    const reqGender = request.query.gender as string;
    const reqAge = request.query.age as string;
    const reqSearch = request.query.search as string;
    const reqPage = parseInt((request.query.page as string) || SecurityConstants.DEFAULT_PAGE_STR, SecurityConstants.RADIX_10);
    const reqPageSize = parseInt((request.query.page_size as string) || SecurityConstants.DEFAULT_PAGE_SIZE_STR, SecurityConstants.RADIX_10);

    if (!_.isEmpty(reqLang)) {
      filtered = _.filter(filtered, (voiceItem: any) => _.some([voiceItem.language, voiceItem.locale], (langStr) => _.includes(_.toLower(langStr), _.toLower(reqLang))));
    }
    if (!_.isEmpty(reqGender)) {
      filtered = _.filter(filtered, (voiceItem: any) => _.eq(_.toLower(voiceItem.gender), _.toLower(reqGender)));
    }
    if (!_.isEmpty(reqAge)) {
      filtered = _.filter(filtered, (voiceItem: any) => _.eq(_.toLower(voiceItem.age), _.toLower(reqAge)));
    }
    if (!_.isEmpty(reqSearch)) {
      const q = _.toLower(reqSearch);
      filtered = _.filter(filtered, (voiceItem: any) => _.some([voiceItem.name, _.defaultTo(voiceItem.description, SecurityConstants.EMPTY_STRING), voiceItem.voice_id || voiceItem.voiceId], (field) => _.includes(_.toLower(field), q)) || _.some(voiceItem.tags || [], (tagItem: string) => _.includes(_.toLower(tagItem), q)));
    }

    const startIndex = _.multiply(_.subtract(reqPage, 1), reqPageSize);
    const paginated = _.slice(filtered, startIndex, _.add(startIndex, reqPageSize));
    const hasMore = _.lt(_.add(startIndex, reqPageSize), filtered.length);

    response.json({
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
