import {
  SOURCE_TEMPLATE_SYMBOL_51,
  SOURCE_TEXT_AI33,
  SOURCE_TEXT_AI33_API_KEY,
  SOURCE_TEXT_AI33_KEY,
  SOURCE_TEXT_AI3_KEY,
  SOURCE_TEXT_CEREBRAS,
  SOURCE_TEXT_CEREBRAS_API_KEY,
  SOURCE_TEXT_CEREBRAS_KEY,
  SOURCE_TEXT_GEMINI,
  SOURCE_TEXT_GEMINI_API_KEY,
  SOURCE_TEXT_GEMINI_KEY,
  SOURCE_TEXT_GOOGLE_SHEET,
  SOURCE_TEXT_GROQ,
  SOURCE_TEXT_GROQ_API_KEY,
  SOURCE_TEXT_GROQ_KEY,
  SOURCE_TEXT_MISSING,
  SOURCE_TEXT_USER_CONFIG,
} from "../../constants/sourceText";
import { requestContext } from "../utils/requestContext.js";
import { SecurityConstants, GasActions, SecurityMessages, PlanType } from "../../constants/security.js";
import { REFACTOR_CONSTANTS } from "../../constants/refactor.js";
import { appLog, appError } from "../../lib/logger.js";
import { jsonUtils } from "../../lib/json.js";
import _ from "lodash";
export interface ResolvedApiKeys {
  geminiKey: string;
  cerebrasKey: string;
  groqKey: string;
  ai33Key: string;
  isUserKey: {
    gemini: boolean;
    cerebras: boolean;
    groq: boolean;
    ai33: boolean;
  };
  source: {
    gemini: "user_config" | "google_sheet" | "missing";
    cerebras: "user_config" | "google_sheet" | "missing";
    groq: "user_config" | "google_sheet" | "missing";
    ai33: "user_config" | "google_sheet" | "missing";
  };
}
function extractFirstNonEmptyString(sources: any[]): string {
  const value = _.find(sources, (candidate) => _.isString(candidate) && !_.isEmpty(_.trim(candidate))) as string | undefined;
  return _.trim(value || SecurityConstants.EMPTY_STRING);
}
function extractApiKeyFromResponse(data: any, keyNames: string[]): string {
  if (_.isNil(data)) return SecurityConstants.EMPTY_STRING;
  const adminKeys = _.get(data, SecurityConstants.API_KEYS_KEY, {});
  const sources = [adminKeys, _.get(data, SecurityConstants.DATA_KEY), data];
  const candidatePaths = _.flatMap(sources, (source) => _.map(keyNames, (name) => _.get(source, name)));
  return extractFirstNonEmptyString(candidatePaths);
}
const API_KEY_ALIASES = {
  gemini: [SecurityConstants.REQ_BODY_GEMINI_KEY, REFACTOR_CONSTANTS.KEY_NAME_GEMINI_API_KEY, SOURCE_TEXT_GEMINI_KEY, SOURCE_TEXT_GEMINI_API_KEY],
  cerebras: [SecurityConstants.REQ_BODY_CEREBRAS_KEY, REFACTOR_CONSTANTS.KEY_NAME_CEREBRAS_API_KEY, SOURCE_TEXT_CEREBRAS_KEY, SOURCE_TEXT_CEREBRAS_API_KEY],
  groq: [SecurityConstants.REQ_BODY_GROQ_KEY, REFACTOR_CONSTANTS.KEY_NAME_GROQ_API_KEY, SOURCE_TEXT_GROQ_KEY, SOURCE_TEXT_GROQ_API_KEY],
  ai33: [SecurityConstants.REQ_BODY_AI33_KEY, REFACTOR_CONSTANTS.KEY_NAME_AI33_API_KEY, SOURCE_TEXT_AI33_KEY, SOURCE_TEXT_AI33_API_KEY, SOURCE_TEXT_AI3_KEY],
} as const;
export function getResolvedLicenseKey(req?: any): string {
  const ctx = requestContext.getStore();
  const sources = [
    process.env.VIDIFY_LICENSE_KEY,
    process.env.VITE_LICENSE_KEY,
    process.env.LICENSE_KEY,
    _.get(req, [REFACTOR_CONSTANTS.REQ_PROP_HEADERS, SecurityConstants.HEADER_LICENSE_KEY]),
    _.get(ctx, SecurityConstants.STORE_LICENSE_KEY),
    _.get(req, [REFACTOR_CONSTANTS.REQ_PROP_BODY, SecurityConstants.STORE_LICENSE_KEY]),
    _.get(req, [REFACTOR_CONSTANTS.REQ_PROP_BODY, SecurityConstants.PROP_LICENSE_KEY_GAS]),
    SecurityConstants.DEFAULT_LICENSE_KEY,
  ];
  return extractFirstNonEmptyString(sources);
}
interface CachedResolvedApiKeys {
  keys: ResolvedApiKeys;
  timestamp: number;
}
const resolvedApiKeysCache = new Map<string, CachedResolvedApiKeys>();
const RESOLVER_CACHE_TTL_MS = 600000;
export async function resolveApiKeys(): Promise<ResolvedApiKeys> {
  const ctx = requestContext.getStore();
  const userGeminiKey = extractFirstNonEmptyString([_.get(ctx, SecurityConstants.REQ_BODY_GEMINI_KEY), process.env.GEMINI_API_KEY]);
  const userCerebrasKey = extractFirstNonEmptyString([_.get(ctx, SecurityConstants.REQ_BODY_CEREBRAS_KEY), process.env.CEREBRAS_API_KEY]);
  const userGroqKey = extractFirstNonEmptyString([_.get(ctx, SecurityConstants.REQ_BODY_GROQ_KEY), process.env.GROQ_API_KEY]);
  const userAi33Key = extractFirstNonEmptyString([_.get(ctx, SecurityConstants.REQ_BODY_AI33_KEY), process.env.AI33_API_KEY]);
  const licenseKey = extractFirstNonEmptyString([_.get(ctx, SecurityConstants.STORE_LICENSE_KEY), getResolvedLicenseKey(), SecurityConstants.DEFAULT_LICENSE_KEY]);
  const planType = extractFirstNonEmptyString([_.get(ctx, SecurityConstants.STORE_PLAN_TYPE_KEY), PlanType.PRO_LIFETIME]);
  let geminiKey = userGeminiKey;
  let cerebrasKey = userCerebrasKey;
  let groqKey = userGroqKey;
  let ai33Key = userAi33Key;
  const isGeminiUserKey = !_.isEmpty(userGeminiKey);
  const isCerebrasUserKey = !_.isEmpty(userCerebrasKey);
  const isGroqUserKey = !_.isEmpty(userGroqKey);
  const isAi33UserKey = !_.isEmpty(userAi33Key);
  const isMissingAnyKey = _.includes([isGeminiUserKey, isCerebrasUserKey, isGroqUserKey, isAi33UserKey], false);
  if (!isMissingAnyKey) {
    return {
      geminiKey,
      cerebrasKey,
      groqKey,
      ai33Key,
      isUserKey: { gemini: true, cerebras: true, groq: true, ai33: true },
      source: { gemini: SOURCE_TEXT_USER_CONFIG, cerebras: SOURCE_TEXT_USER_CONFIG, groq: SOURCE_TEXT_USER_CONFIG, ai33: SOURCE_TEXT_USER_CONFIG },
    };
  }
  const cacheKey = SOURCE_TEMPLATE_SYMBOL_51(`${licenseKey}`, `${planType}`);
  const cached = resolvedApiKeysCache.get(cacheKey);
  if (cached && _.lt(_.subtract(Date.now(), cached.timestamp), RESOLVER_CACHE_TTL_MS)) {
    const cachedGemini = isGeminiUserKey ? userGeminiKey : cached.keys.geminiKey || geminiKey;
    const cachedCerebras = isCerebrasUserKey ? userCerebrasKey : cached.keys.cerebrasKey || cerebrasKey;
    const cachedGroq = isGroqUserKey ? userGroqKey : cached.keys.groqKey || groqKey;
    const cachedAi33 = isAi33UserKey ? userAi33Key : cached.keys.ai33Key || ai33Key;
    return {
      geminiKey: cachedGemini,
      cerebrasKey: cachedCerebras,
      groqKey: cachedGroq,
      ai33Key: cachedAi33,
      isUserKey: {
        gemini: isGeminiUserKey,
        cerebras: isCerebrasUserKey,
        groq: isGroqUserKey,
        ai33: isAi33UserKey,
      },
      source: {
        gemini: isGeminiUserKey ? SOURCE_TEXT_USER_CONFIG : !_.isEmpty(cachedGemini) ? SOURCE_TEXT_GOOGLE_SHEET : SOURCE_TEXT_MISSING,
        cerebras: isCerebrasUserKey ? SOURCE_TEXT_USER_CONFIG : !_.isEmpty(cachedCerebras) ? SOURCE_TEXT_GOOGLE_SHEET : SOURCE_TEXT_MISSING,
        groq: isGroqUserKey ? SOURCE_TEXT_USER_CONFIG : !_.isEmpty(cachedGroq) ? SOURCE_TEXT_GOOGLE_SHEET : SOURCE_TEXT_MISSING,
        ai33: isAi33UserKey ? SOURCE_TEXT_USER_CONFIG : !_.isEmpty(cachedAi33) ? SOURCE_TEXT_GOOGLE_SHEET : SOURCE_TEXT_MISSING,
      },
    };
  }
  appLog(
    SecurityMessages.LOG_RESOLVER_CTX,
    jsonUtils.safeStringify({
      hasLicenseKey: !_.isEmpty(licenseKey),
      planType,
      hasUserGeminiKey: isGeminiUserKey,
      hasUserCerebrasKey: isCerebrasUserKey,
      hasUserGroqKey: isGroqUserKey,
      hasUserAi33Key: isAi33UserKey,
      isMissingAnyKey,
    }),
  );
  try {
    const payload = {
      [SecurityConstants.PROP_ACTION]: GasActions.GET_API_KEYS,
      [SecurityConstants.PROP_LICENSE_KEY_GAS]: licenseKey,
      [SecurityConstants.PROP_PLAN_ID_GAS]: planType,
      [SecurityConstants.PROP_PLAN_TYPE_GAS]: planType,
    };
    appLog(
      SecurityMessages.LOG_RESOLVER_FETCH,
      jsonUtils.safeStringify({
        hasLicenseKey: !_.isEmpty(licenseKey),
        planType,
        missingProviders: _.compact([!isGeminiUserKey && SOURCE_TEXT_GEMINI, !isCerebrasUserKey && SOURCE_TEXT_CEREBRAS, !isGroqUserKey && SOURCE_TEXT_GROQ, !isAi33UserKey && SOURCE_TEXT_AI33]),
      }),
    );
    const response = await fetch(SecurityConstants.GAS_API_URL, {
      method: SecurityConstants.HTTP_POST,
      headers: { [SecurityConstants.HEADER_CONTENT_TYPE]: SecurityConstants.CONTENT_TYPE_JSON },
      body: jsonUtils.safeStringify(payload),
    });
    const data: any = await response.json();
    const keyAvailability = {
      hasGeminiKey: !_.isEmpty(extractApiKeyFromResponse(data, [...API_KEY_ALIASES.gemini])),
      hasCerebrasKey: !_.isEmpty(extractApiKeyFromResponse(data, [...API_KEY_ALIASES.cerebras])),
      hasGroqKey: !_.isEmpty(extractApiKeyFromResponse(data, [...API_KEY_ALIASES.groq])),
      hasAi33Key: !_.isEmpty(extractApiKeyFromResponse(data, [...API_KEY_ALIASES.ai33])),
    };
    appLog(SecurityMessages.LOG_RESOLVER_RESP, jsonUtils.safeStringify(keyAvailability));
    const fetchedGemini = extractApiKeyFromResponse(data, [...API_KEY_ALIASES.gemini]);
    if (!isGeminiUserKey && !_.isEmpty(fetchedGemini)) {
      geminiKey = fetchedGemini;
      appLog(SecurityMessages.LOG_USING_ADMIN_GEMINI_KEY);
    }
    const fetchedCerebras = extractApiKeyFromResponse(data, [...API_KEY_ALIASES.cerebras]);
    if (!isCerebrasUserKey && !_.isEmpty(fetchedCerebras)) cerebrasKey = fetchedCerebras;
    const fetchedGroq = extractApiKeyFromResponse(data, [...API_KEY_ALIASES.groq]);
    if (!isGroqUserKey && !_.isEmpty(fetchedGroq)) groqKey = fetchedGroq;
    const fetchedAi33 = extractApiKeyFromResponse(data, [...API_KEY_ALIASES.ai33]);
    if (!isAi33UserKey && !_.isEmpty(fetchedAi33)) {
      ai33Key = fetchedAi33;
      appLog(SecurityMessages.LOG_USING_ADMIN_AI33_KEY);
    }
  } catch (error) {
    appError(SecurityMessages.LOG_RESOLVER_ERROR, error);
    if (cached) return cached.keys;
  }
  const result: ResolvedApiKeys = {
    geminiKey,
    cerebrasKey,
    groqKey,
    ai33Key,
    isUserKey: {
      gemini: isGeminiUserKey,
      cerebras: isCerebrasUserKey,
      groq: isGroqUserKey,
      ai33: isAi33UserKey,
    },
    source: {
      gemini: isGeminiUserKey ? SOURCE_TEXT_USER_CONFIG : !_.isEmpty(geminiKey) ? SOURCE_TEXT_GOOGLE_SHEET : SOURCE_TEXT_MISSING,
      cerebras: isCerebrasUserKey ? SOURCE_TEXT_USER_CONFIG : !_.isEmpty(cerebrasKey) ? SOURCE_TEXT_GOOGLE_SHEET : SOURCE_TEXT_MISSING,
      groq: isGroqUserKey ? SOURCE_TEXT_USER_CONFIG : !_.isEmpty(groqKey) ? SOURCE_TEXT_GOOGLE_SHEET : SOURCE_TEXT_MISSING,
      ai33: isAi33UserKey ? SOURCE_TEXT_USER_CONFIG : !_.isEmpty(ai33Key) ? SOURCE_TEXT_GOOGLE_SHEET : SOURCE_TEXT_MISSING,
    },
  };
  if (!_.isEmpty(geminiKey) || !_.isEmpty(cerebrasKey) || !_.isEmpty(groqKey)) {
    resolvedApiKeysCache.set(cacheKey, { keys: result, timestamp: Date.now() });
  }
  return result;
}
