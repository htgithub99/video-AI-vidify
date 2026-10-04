import { SOURCE_TEMPLATE_SYMBOL_8, SOURCE_TEXT_BYPASSCACHE, SOURCE_TEXT_CACHE_BYPASS, SOURCE_TEXT_CACHE_ERROR, SOURCE_TEXT_CACHE_EVICT, SOURCE_TEXT_CACHE_HIT, SOURCE_TEXT_CACHE_NEW, SOURCE_TEXT_HEX, SOURCE_TEXT_PROJECTID, SOURCE_TEXT_SHA256, SOURCE_TEXT_TIMESTAMP } from "../../constants/sourceText";
import { jsonUtils } from "../../lib/json.js";
import { appLog } from "../../lib/logger.js";
import _ from "lodash";
import { createHash } from "node:crypto";
interface CacheEntry {
  timestamp: number;
  data: any;
}
const geminiCache: Record<string, CacheEntry> = {};
const CACHE_TTL = 30 * 60 * 1000;
const getCacheKey = (endpoint: string, body: any): string => {
  const clone = _.omit(body, [SOURCE_TEXT_BYPASSCACHE, SOURCE_TEXT_TIMESTAMP, SOURCE_TEXT_PROJECTID]);
  const digest = createHash(SOURCE_TEXT_SHA256).update(jsonUtils.safeStringify(clone)).digest(SOURCE_TEXT_HEX);
  return SOURCE_TEMPLATE_SYMBOL_8(`${endpoint}`, `${digest}`);
};
export const checkCache = (endpoint: string, body: any, bypass = false): any | null => {
  if (_.eq(bypass, true)) {
    appLog(SOURCE_TEXT_CACHE_BYPASS, endpoint);
    return null;
  }
  const key = getCacheKey(endpoint, body);
  const entry = geminiCache[key];
  if (!_.isNil(entry)) {
    const age = Date.now() - entry.timestamp;
    if (_.lt(age, CACHE_TTL)) {
      appLog(SOURCE_TEXT_CACHE_HIT, endpoint);
      return entry.data;
    } else {
      appLog(SOURCE_TEXT_CACHE_EVICT, endpoint);
      delete geminiCache[key];
    }
  }
  return null;
};
export const setCache = (endpoint: string, body: any, data: any): void => {
  try {
    const key = getCacheKey(endpoint, body);
    geminiCache[key] = {
      timestamp: Date.now(),
      data,
    };
    appLog(SOURCE_TEXT_CACHE_NEW, endpoint);
  } catch (err) {
    appLog(SOURCE_TEXT_CACHE_ERROR, err);
  }
};
