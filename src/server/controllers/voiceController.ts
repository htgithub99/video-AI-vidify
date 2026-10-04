import { SOURCE_TEMPLATE_SYMBOL_59, SOURCE_TEXT_FETCH_VOICES_ERR, SOURCE_TEXT_HTTP_STATUS_ERROR } from "../../constants/sourceText";
import { Request, Response } from "express";
import { EXTERNAL_URLS, getBackendMsg, COMMON_STRINGS, HTTP_HEADERS, HTTP_METHODS, HTTP_STATUS_CODES, REFACTOR_CONSTANTS } from "../../constants";
import { SecurityMessages, SecurityConstants } from "../../constants/security.js";
import { appWarn, createAppError } from "../../lib/logger.js";
import _ from "lodash";
import { resolveApiKeys } from "../services/apiKeyResolver.js";
export const getVoices = async (request: Request, response: Response) => {
  const isVi = !_.eq(request.query.lang, COMMON_STRINGS.EN);
  try {
    const queryParams = new URLSearchParams(request.query as any).toString();
    const targetUrl = SOURCE_TEMPLATE_SYMBOL_59(`${EXTERNAL_URLS.AI33_VOICES}`, `${queryParams}`);
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
      throw createAppError(`${getBackendMsg(SOURCE_TEXT_HTTP_STATUS_ERROR, isVi)}${apiResponse.status}`);
    }
    const data = await apiResponse.json();
    response.json(data);
  } catch (error: any) {
    appWarn(SOURCE_TEXT_FETCH_VOICES_ERR, REFACTOR_CONSTANTS.VOICES_ERR_FAILED_TO_FETCH, error);
    response.status(HTTP_STATUS_CODES.SERVICE_UNAVAILABLE).json({
      success: false,
      error: REFACTOR_CONSTANTS.VOICES_ERR_FAILED_TO_FETCH,
    });
  }
};
