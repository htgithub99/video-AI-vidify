import { appLog, appError, createAppError } from "./logger";
import { STORAGE_KEYS, LOG_ERROR_SYMBOLS, LOG_WARN_SYMBOLS, ERROR_MESSAGES, API_HEADERS, REFACTOR_CONSTANTS } from "../constants";
import { BatchDelayOption } from "../types";
import _ from 'lodash';
import { storageUtils } from './storage';
import { jsonUtils } from "./json";

export const getStoredApiKey = (keyName: string): string => {
  return storageUtils.get(keyName) || REFACTOR_CONSTANTS.VD_EMPTY_STRING;
};

export const safeSystemFetch = async (url: string, payload: any, signal?: AbortSignal) => {
  try {
    const geminiKey = getStoredApiKey(STORAGE_KEYS.GEMINI_API_KEY);
    const cerebrasKey = getStoredApiKey(STORAGE_KEYS.CEREBRAS_API_KEY);
    const groqKey = getStoredApiKey(STORAGE_KEYS.GROQ_API_KEY);
    const ai33Key = getStoredApiKey(STORAGE_KEYS.AI33_API_KEY);
    const licenseKey = getStoredApiKey(STORAGE_KEYS.LICENSE_KEY);

    const response = await fetch(url, {
      method: REFACTOR_CONSTANTS.HTTP_METHOD_POST,
      headers: {
        [REFACTOR_CONSTANTS.HEADER_CONTENT_TYPE]: REFACTOR_CONSTANTS.MIME_JSON,
        [API_HEADERS.GEMINI_API_KEY]: geminiKey,
        [API_HEADERS.CEREBRAS_API_KEY]: cerebrasKey,
        [API_HEADERS.GROQ_API_KEY]: groqKey,
        [API_HEADERS.AI33_API_KEY]: ai33Key,
        [API_HEADERS.LICENSE_KEY]: licenseKey,
      },
      body: jsonUtils.safeStringify(payload),
      signal,
    });

    const data = await response.json().catch(() => null);

    if (!_.isNil(data) && _.isArray(data.rotationLogs)) {
      _.forEach(data.rotationLogs, (log: string) => {
        if (_.some(LOG_ERROR_SYMBOLS, (sym) => _.includes(log, sym))) appError(log);
        else if (_.some(LOG_WARN_SYMBOLS, (sym) => _.includes(log, sym))) appLog(log);
        else appLog(log);
      });
    }

    if (_.eq(response.ok, false)) {
      throw createAppError(data?.error || `${ERROR_MESSAGES.API_ERROR_PREFIX}${response.status}`);
    }

    return { success: true, data };
  } catch (error: any) {
    appError(ERROR_MESSAGES.SYSTEM_FLOW_ERROR, url, error);
    return { success: false, error: error.message };
  }
};

export const safeSystemFetchStream = async (
  url: string,
  payload: any,
  onLine: (data: any) => void,
  onComplete?: () => void,
  onError?: (err: any) => void,
  cancelRef?: { current: boolean }
) => {
  try {
    const geminiKey = getStoredApiKey(STORAGE_KEYS.GEMINI_API_KEY);
    const cerebrasKey = getStoredApiKey(STORAGE_KEYS.CEREBRAS_API_KEY);
    const groqKey = getStoredApiKey(STORAGE_KEYS.GROQ_API_KEY);
    const ai33Key = getStoredApiKey(STORAGE_KEYS.AI33_API_KEY);
    const licenseKey = getStoredApiKey(STORAGE_KEYS.LICENSE_KEY);

    const response = await fetch(url, {
      method: REFACTOR_CONSTANTS.HTTP_METHOD_POST,
      headers: {
        [REFACTOR_CONSTANTS.HEADER_CONTENT_TYPE]: REFACTOR_CONSTANTS.MIME_JSON,
        [API_HEADERS.GEMINI_API_KEY]: geminiKey,
        [API_HEADERS.CEREBRAS_API_KEY]: cerebrasKey,
        [API_HEADERS.GROQ_API_KEY]: groqKey,
        [API_HEADERS.AI33_API_KEY]: ai33Key,
        [API_HEADERS.LICENSE_KEY]: licenseKey
      },
      body: jsonUtils.safeStringify(payload),
    });

    if (!response.ok) {
      throw new Error(_.join(
        [ERROR_MESSAGES.API_ERROR_PREFIX, response.status],
        REFACTOR_CONSTANTS.VD_EMPTY_STRING,
      ));
    }

    if (!response.body) {
      throw new Error(ERROR_MESSAGES.STREAM_NOT_SUPPORTED);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    let isReading = true;
    while (isReading) {
      if (cancelRef && cancelRef.current) {
        reader.cancel().catch(() => {});
        isReading = false;
        break;
      }

      const { value, done } = await reader.read();
      if (done) {
        isReading = false;
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = _.split(buffer, "\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (_.isEmpty(_.trim(line))) continue;
        try {
          const result = jsonUtils.safeParse<any>(line, null);
          if (result) {
            onLine(result);
          }
        } catch (e) {
        }
      }
    }
    if (onComplete) onComplete();
  } catch (error: any) {
    appError(ERROR_MESSAGES.STREAM_FLOW_ERROR, url, error);
    if (onError) onError(error);
    throw error;
  }
};

export const delayAsync = (ms: number) => new Promise((res) => setTimeout(res, ms));

export const randomDelay = (min: number = 1000, max: number = 2000): Promise<number> => {
  const ms = _.random(min, max);
  return new Promise((resolve) => setTimeout(() => resolve(ms), ms));
};

export const logSystemAction = (actionName: string) => {
  appLog("SYSTEM_ACTION_START", actionName);
};

export const getBatchDelayMs = (option?: BatchDelayOption | string): number => {
  const opt = (option || BatchDelayOption.Default) as BatchDelayOption;
  if (_.eq(opt, BatchDelayOption.OneSecond)) return 1000;
  if (_.eq(opt, BatchDelayOption.TwoSeconds)) return 2000;
  if (_.eq(opt, BatchDelayOption.ThreeSeconds)) return 3000;
  if (_.eq(opt, BatchDelayOption.Random123)) {
    return _.sample([1000, 2000, 3000]) || 1000;
  }
  return _.random(1000, 2000);
};

export const readFilesAsDataURL = (files: FileList, callback: (result: string) => void): void => {
  _.forEach(_.toArray(files), (file) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (_.isString(reader.result)) {
        callback(reader.result);
      }
    };
    reader.readAsDataURL(file);
  });
};

export const generateRandomString = (): string => {
  return Math.random()
    .toString(REFACTOR_CONSTANTS.RADIX_36)
    .substring(REFACTOR_CONSTANTS.RANDOM_STRING_START, REFACTOR_CONSTANTS.RANDOM_STRING_END);
};

