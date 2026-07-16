import { appError } from './logger';
import _ from 'lodash';

export const jsonUtils = {
  /**
   * Safely parses a JSON string, returning a fallback value if parsing fails.
   */
  safeParse: <T = any>(str: string | null | undefined, fallback: T): T => {
    if (_.isNil(str) || _.isEmpty(_.trim(str))) return fallback;
    try {
      return JSON.parse(str) as T;
    } catch (error) {
      appError('ERROR_PARSING_JSON', error, { preview: str.slice(0, 100) });
      return fallback;
    }
  },
  
  /**
   * Safely stringifies an object, returning a fallback string if it fails.
   */
  safeStringify: (
    obj: any, 
    replacer?: (number | string)[] | null | ((this: any, key: string, value: any) => any), 
    space?: string | number,
    fallback: string = ""
  ): string => {
    try {
      return JSON.stringify(obj, replacer as any, space);
    } catch (error) {
      appError('ERROR_STRINGIFYING_JSON', error);
      return fallback;
    }
  }
};
