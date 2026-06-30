

interface CacheEntry {
  timestamp: number;
  data: any;
}

const geminiCache: Record<string, CacheEntry> = {};
const CACHE_TTL = 30 * 60 * 1000; 

function getCacheKey(endpoint: string, body: any): string {
  const clone = { ...body };
  
  delete clone.bypassCache;
  delete clone.timestamp;
  delete clone.projectId;
  return `${endpoint}:${JSON.stringify(clone)}`;
}

export function checkCache(endpoint: string, body: any, bypass = false): any | null {
  if (bypass) {
    console.log(`[Gemini Cache] Bypass explicitly requested for ${endpoint}`);
    return null;
  }
  const key = getCacheKey(endpoint, body);
  const entry = geminiCache[key];
  if (entry) {
    const age = Date.now() - entry.timestamp;
    if (age < CACHE_TTL) {
      console.log(`[Gemini Cache] Hit for ${endpoint}`);
      return entry.data;
    } else {
      console.log(`[Gemini Cache] Evicting expired cache for ${endpoint}`);
      delete geminiCache[key];
    }
  }
  return null;
}

export function setCache(endpoint: string, body: any, data: any) {
  try {
    const key = getCacheKey(endpoint, body);
    geminiCache[key] = {
      timestamp: Date.now(),
      data,
    };
    console.log(`[Gemini Cache] Cached new response for ${endpoint}`);
  } catch (err) {
    console.warn('[Gemini Cache Error] Failed to cache response:', err);
  }
}