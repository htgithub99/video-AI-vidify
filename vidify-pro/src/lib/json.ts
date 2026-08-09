import { appError } from "./logger";
import _ from "lodash";
import { JSON_UTILS_CONFIG } from "../constants/config";

export const jsonUtils = {
  safeParse: <T = unknown>(str: string | null | undefined, fallback: T): T => {
    if (_.isNil(str) || _.isEmpty(_.trim(str))) return fallback;
    try {
      return JSON.parse(str) as T;
    } catch (error) {
      appError(JSON_UTILS_CONFIG.PARSE_ERROR_EVENT, error, {
        preview: str.slice(0, JSON_UTILS_CONFIG.PREVIEW_LENGTH),
      });
      return fallback;
    }
  },

  safeStringify: (
    obj: unknown,
    replacer?:
      | (number | string)[]
      | null
      | ((this: unknown, key: string, value: unknown) => unknown),
    space?: string | number,
    fallback: string = JSON_UTILS_CONFIG.EMPTY_FALLBACK,
  ): string => {
    try {
      return JSON.stringify(obj, replacer as never, space);
    } catch (error) {
      appError(JSON_UTILS_CONFIG.STRINGIFY_ERROR_EVENT, error);
      return fallback;
    }
  },
};
