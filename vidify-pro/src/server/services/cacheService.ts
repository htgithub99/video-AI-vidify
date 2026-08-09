import { jsonUtils } from "../../lib/json.js";
import { appLog } from "../../lib/logger.js";
import _ from "lodash";

interface CacheEntry {
  timestamp: number;
  data: any;
}

const geminiCache: Record<string, CacheEntry> = {};
const CACHE_TTL = 30 * 60 * 1000;

const getCacheKey = (endpoint: string, body: any): string => {
  const clone = _.omit(body, ["bypassCache", "timestamp", "projectId"]);
  return `${endpoint}:${jsonUtils.safeStringify(clone)}`;
};

export const checkCache = (
  endpoint: string,
  body: any,
  bypass = false,
): any | null => {
  if (_.eq(bypass, true)) {
    appLog("CACHE_BYPASS", endpoint);
    return null;
  }
  const key = getCacheKey(endpoint, body);
  const entry = geminiCache[key];
  if (!_.isNil(entry)) {
    const age = Date.now() - entry.timestamp;
    if (_.lt(age, CACHE_TTL)) {
      appLog("CACHE_HIT", endpoint);
      return entry.data;
    } else {
      appLog("CACHE_EVICT", endpoint);
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
    appLog("CACHE_NEW", endpoint);
  } catch (err) {
    appLog("CACHE_ERROR", err);
  }
};
