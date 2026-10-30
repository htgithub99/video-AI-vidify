import { GeminiErrorCategory } from "../../constants/runtime/enums.js";
import { RUNTIME_TEXT as RT_SHARED } from "../../constants/runtime/shared.js";
import { SOURCE_TEXT_404, SOURCE_TEXT_429, SOURCE_TEXT_DAILYQUOTA, SOURCE_TEXT_FATAL, SOURCE_TEXT_QUOTA, SOURCE_TEXT_RATELIMIT, SOURCE_TEXT_RESOURCE_EXHAUSTED, SOURCE_TEXT_TRANSIENT, SOURCE_TEXT_UNSUPPORTEDMODEL, SOURCE_TEXT_ZEROQUOTA } from "../../constants/sourceText";
import _ from "lodash";
import { GEMINI_DAILY_QUOTA_PATTERNS, GEMINI_NON_RETRYABLE_MODEL_PATTERNS, GEMINI_QUOTA_STATUSES, GEMINI_RETRY_REGEX, GEMINI_RETRYABLE_ERROR_KEYWORDS, GEMINI_RETRYABLE_STATUSES, GEMINI_USER_MESSAGES, GEMINI_ZERO_QUOTA_PATTERNS } from "../../constants/index.js";
import { GEMINI_REQUEST_POLICY } from "../../constants/config.js";
export { GeminiErrorCategory };
export interface GeminiErrorDecision {
  category: GeminiErrorCategory;
  retryable: boolean;
  retryLimit: number;
  waitMs: number;
  cooldownMs: number;
}
const includesPattern = (value: string, patterns: readonly string[]): boolean => _.some(patterns, (pattern) => _.includes(value, _.toLower(pattern)));
const resolveRetryWaitMs = (value: string): number => {
  const match = value.match(GEMINI_RETRY_REGEX);
  return match ? _.ceil((_.toNumber(match[1]) + GEMINI_REQUEST_POLICY.RETRY_BUFFER_SECONDS) * 1000) : GEMINI_REQUEST_POLICY.DEFAULT_QUOTA_WAIT_MS;
};
export const classifyGeminiError = (error: any): GeminiErrorDecision => {
  const value = _.toLower(_.join([_.toString(error?.message), _.toString(error), _.toString(error?.status), _.toString(error?.code)], RT_SHARED.SYMBOL_36A9E7));
  if (includesPattern(value, GEMINI_NON_RETRYABLE_MODEL_PATTERNS) || _.includes(value, SOURCE_TEXT_404)) return { category: GeminiErrorCategory.UnsupportedModel, retryable: false, retryLimit: 0, waitMs: 0, cooldownMs: GEMINI_REQUEST_POLICY.UNSUPPORTED_COOLDOWN_MS };
  if (includesPattern(value, GEMINI_ZERO_QUOTA_PATTERNS)) return { category: GeminiErrorCategory.ZeroQuota, retryable: false, retryLimit: 0, waitMs: 0, cooldownMs: GEMINI_REQUEST_POLICY.ZERO_QUOTA_COOLDOWN_MS };
  if (includesPattern(value, GEMINI_DAILY_QUOTA_PATTERNS)) return { category: GeminiErrorCategory.DailyQuota, retryable: false, retryLimit: 0, waitMs: 0, cooldownMs: GEMINI_REQUEST_POLICY.DAILY_QUOTA_COOLDOWN_MS };
  const isQuota = _.includes(GEMINI_QUOTA_STATUSES, error?.status) || _.includes(value, SOURCE_TEXT_RESOURCE_EXHAUSTED) || _.includes(value, SOURCE_TEXT_429) || _.includes(value, SOURCE_TEXT_QUOTA);
  if (isQuota) return { category: GeminiErrorCategory.RateLimit, retryable: true, retryLimit: GEMINI_REQUEST_POLICY.RATE_LIMIT_RETRY_LIMIT, waitMs: resolveRetryWaitMs(value), cooldownMs: GEMINI_REQUEST_POLICY.TRANSIENT_COOLDOWN_MS };
  const isTransient = _.includes(GEMINI_RETRYABLE_STATUSES, error?.status) || includesPattern(value, GEMINI_RETRYABLE_ERROR_KEYWORDS);
  return isTransient ? { category: GeminiErrorCategory.Transient, retryable: true, retryLimit: GEMINI_REQUEST_POLICY.TRANSIENT_RETRY_LIMIT, waitMs: GEMINI_REQUEST_POLICY.BASE_DELAY_MS, cooldownMs: GEMINI_REQUEST_POLICY.TRANSIENT_COOLDOWN_MS } : { category: GeminiErrorCategory.Fatal, retryable: false, retryLimit: 0, waitMs: 0, cooldownMs: GEMINI_REQUEST_POLICY.TRANSIENT_COOLDOWN_MS };
};
export const getGeminiUserMessage = (error: any, isVi: boolean): string => {
  const messages = isVi ? GEMINI_USER_MESSAGES.vi : GEMINI_USER_MESSAGES.en;
  const category = classifyGeminiError(error).category;
  const messageKey = { [GeminiErrorCategory.UnsupportedModel]: SOURCE_TEXT_UNSUPPORTEDMODEL, [GeminiErrorCategory.ZeroQuota]: SOURCE_TEXT_ZEROQUOTA, [GeminiErrorCategory.DailyQuota]: SOURCE_TEXT_DAILYQUOTA, [GeminiErrorCategory.RateLimit]: SOURCE_TEXT_RATELIMIT, [GeminiErrorCategory.Transient]: SOURCE_TEXT_TRANSIENT, [GeminiErrorCategory.Fatal]: SOURCE_TEXT_FATAL }[
    category
  ] as keyof typeof messages;
  return messages[messageKey];
};
