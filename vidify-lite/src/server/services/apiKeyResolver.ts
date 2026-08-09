import { requestContext } from '../utils/requestContext.js';
import { SecurityConstants, GasActions, SecurityMessages } from '../../constants/security.js';
import { REFACTOR_CONSTANTS } from '../../constants/refactor.js';
import { appLog, appError } from '../../lib/logger.js';
import { jsonUtils } from '../../lib/json.js';
import _ from 'lodash';

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
    gemini: 'user_config' | 'google_sheet' | 'missing';
    cerebras: 'user_config' | 'google_sheet' | 'missing';
    groq: 'user_config' | 'google_sheet' | 'missing';
    ai33: 'user_config' | 'google_sheet' | 'missing';
  };
}

export function extractFirstNonEmptyString(sources: any[]): string {
  const value = _.find(sources, (candidate) => _.isString(candidate) && !_.isEmpty(_.trim(candidate))) as string | undefined;
  return _.trim(value || SecurityConstants.EMPTY_STRING);
}

export function extractApiKeyFromResponse(data: any, keyNames: string[]): string {
  if (_.isNil(data)) return SecurityConstants.EMPTY_STRING;
  const adminKeys = _.get(data, SecurityConstants.API_KEYS_KEY, {});
  const sources = [adminKeys, _.get(data, SecurityConstants.DATA_KEY), data];
  
  const candidatePaths = _.flatMap(sources, (source) => _.map(keyNames, (name) => _.get(source, name)));
  return extractFirstNonEmptyString(candidatePaths);
}

const API_KEY_ALIASES = {
  gemini: [
    SecurityConstants.REQ_BODY_GEMINI_KEY,
    REFACTOR_CONSTANTS.KEY_NAME_GEMINI_API_KEY,
    'GEMINI_KEY',
    'GEMINI_API_KEY',
  ],
  cerebras: [
    SecurityConstants.REQ_BODY_CEREBRAS_KEY,
    REFACTOR_CONSTANTS.KEY_NAME_CEREBRAS_API_KEY,
    'CEREBRAS_KEY',
    'CEREBRAS_API_KEY',
  ],
  groq: [
    SecurityConstants.REQ_BODY_GROQ_KEY,
    REFACTOR_CONSTANTS.KEY_NAME_GROQ_API_KEY,
    'GROQ_KEY',
    'GROQ_API_KEY',
  ],
  ai33: [
    SecurityConstants.REQ_BODY_AI33_KEY,
    REFACTOR_CONSTANTS.KEY_NAME_AI33_API_KEY,
    'AI33_KEY',
    'AI33_API_KEY',
    'AI3_KEY',
  ],
} as const;

export function getResolvedLicenseKey(req?: any): string {
  const ctx = requestContext.getStore();
  const sources = [
    _.get(req, [REFACTOR_CONSTANTS.REQ_PROP_HEADERS, SecurityConstants.HEADER_LICENSE_KEY]),
    _.get(ctx, SecurityConstants.STORE_LICENSE_KEY),
    _.get(req, [REFACTOR_CONSTANTS.REQ_PROP_BODY, SecurityConstants.STORE_LICENSE_KEY]),
    _.get(req, [REFACTOR_CONSTANTS.REQ_PROP_BODY, SecurityConstants.PROP_LICENSE_KEY_GAS])
  ];
  return extractFirstNonEmptyString(sources);
}

export async function resolveApiKeys(): Promise<ResolvedApiKeys> {
  const ctx = requestContext.getStore();
  const userGeminiKey = extractFirstNonEmptyString([_.get(ctx, SecurityConstants.REQ_BODY_GEMINI_KEY), process.env.GEMINI_API_KEY]);
  const userCerebrasKey = extractFirstNonEmptyString([_.get(ctx, SecurityConstants.REQ_BODY_CEREBRAS_KEY), process.env.CEREBRAS_API_KEY]);
  const userGroqKey = extractFirstNonEmptyString([_.get(ctx, SecurityConstants.REQ_BODY_GROQ_KEY), process.env.GROQ_API_KEY]);
  const userAi33Key = extractFirstNonEmptyString([_.get(ctx, SecurityConstants.REQ_BODY_AI33_KEY), process.env.AI33_API_KEY]);
  const licenseKey = _.get(ctx, SecurityConstants.STORE_LICENSE_KEY, SecurityConstants.EMPTY_STRING);
  const planType = _.get(ctx, SecurityConstants.STORE_PLAN_TYPE_KEY, SecurityConstants.EMPTY_STRING);

  let geminiKey = userGeminiKey;
  let cerebrasKey = userCerebrasKey;
  let groqKey = userGroqKey;
  let ai33Key = userAi33Key;

  const isGeminiUserKey = !_.isEmpty(userGeminiKey);
  const isCerebrasUserKey = !_.isEmpty(userCerebrasKey);
  const isGroqUserKey = !_.isEmpty(userGroqKey);
  const isAi33UserKey = !_.isEmpty(userAi33Key);

  const isMissingAnyKey = _.includes([isGeminiUserKey, isCerebrasUserKey, isGroqUserKey, isAi33UserKey], false);

  appLog(SecurityMessages.LOG_RESOLVER_CTX, jsonUtils.safeStringify({ hasLicenseKey: !_.isEmpty(licenseKey), planType, hasUserGeminiKey: isGeminiUserKey, hasUserCerebrasKey: isCerebrasUserKey, hasUserGroqKey: isGroqUserKey, hasUserAi33Key: isAi33UserKey, isMissingAnyKey }));

  if (isMissingAnyKey) {
    try {
      const payload = {
        [SecurityConstants.PROP_ACTION]: GasActions.GET_API_KEYS,
        [SecurityConstants.PROP_LICENSE_KEY_GAS]: licenseKey,
        [SecurityConstants.PROP_PLAN_ID_GAS]: planType,
        [SecurityConstants.PROP_PLAN_TYPE_GAS]: planType
      };
      appLog(SecurityMessages.LOG_RESOLVER_FETCH, jsonUtils.safeStringify({
        hasLicenseKey: !_.isEmpty(licenseKey),
        planType,
        missingProviders: _.compact([
          !isGeminiUserKey && 'gemini',
          !isCerebrasUserKey && 'cerebras',
          !isGroqUserKey && 'groq',
          !isAi33UserKey && 'ai33',
        ]),
      }));

      const response = await fetch(SecurityConstants.GAS_API_URL, {
        method: SecurityConstants.HTTP_POST,
        headers: { [SecurityConstants.HEADER_CONTENT_TYPE]: SecurityConstants.CONTENT_TYPE_JSON },
        body: jsonUtils.safeStringify(payload)
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
    }
  }

  return {
    geminiKey,
    cerebrasKey,
    groqKey,
    ai33Key,
    isUserKey: {
      gemini: isGeminiUserKey,
      cerebras: isCerebrasUserKey,
      groq: isGroqUserKey,
      ai33: isAi33UserKey
    },
    source: {
      gemini: isGeminiUserKey ? 'user_config' : (!_.isEmpty(geminiKey) ? 'google_sheet' : 'missing'),
      cerebras: isCerebrasUserKey ? 'user_config' : (!_.isEmpty(cerebrasKey) ? 'google_sheet' : 'missing'),
      groq: isGroqUserKey ? 'user_config' : (!_.isEmpty(groqKey) ? 'google_sheet' : 'missing'),
      ai33: isAi33UserKey ? 'user_config' : (!_.isEmpty(ai33Key) ? 'google_sheet' : 'missing')
    }
  };
}
