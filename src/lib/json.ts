import { appError } from "./logger";
import _ from "lodash";
import { JSON_UTILS_CONFIG } from "../constants/config";
import { storageUtils } from "./storage";
import { stringifyJson } from "./jsonStringify";

export const jsonUtils = {
  safeParse: <T = unknown>(str: string | null | undefined, fallback: T): T => {
    if (_.isNil(str) || _.isEmpty(_.trim(str))) return fallback;
    try {
      return JSON.parse(str) as T;
    } catch (error) {
      appError(JSON_UTILS_CONFIG.PARSE_ERROR_EVENT, error, { preview: str.slice(0, JSON_UTILS_CONFIG.PREVIEW_LENGTH) });
      return fallback;
    }
  },

  safeStringify: (
    obj: unknown,
    replacer?: (number | string)[] | null | ((this: unknown, key: string, value: unknown) => unknown),
    space?: string | number,
    fallback: string = JSON_UTILS_CONFIG.EMPTY_FALLBACK,
  ): string => {
    try {
      return stringifyJson(obj, replacer, space);
    } catch (error) {
      appError(JSON_UTILS_CONFIG.STRINGIFY_ERROR_EVENT, error);
      return fallback;
    }
  },

  getItem: <T = unknown>(key: string, fallback: T): T => {
    const raw = storageUtils.get(key);
    return jsonUtils.safeParse<T>(raw, fallback);
  },

  setItem: <T = unknown>(key: string, value: T): void => {
    const serialized = jsonUtils.safeStringify(value);
    storageUtils.set(key, serialized);
  },

  removeItem: (key: string): void => {
    storageUtils.remove(key);
  },

  getAsyncItem: async <T = unknown>(key: string, fallback: T): Promise<T> => {
    const raw = await storageUtils.getAsync(key);
    return jsonUtils.safeParse<T>(raw, fallback);
  },

  setAsyncItem: async <T = unknown>(key: string, value: T): Promise<void> => {
    const serialized = jsonUtils.safeStringify(value);
    await storageUtils.setAsync(key, serialized);
  },

  removeAsyncItem: async (key: string): Promise<void> => {
    await storageUtils.removeAsync(key);
  },
};
