import { requestContext } from '../utils/requestContext.js';
import { SecurityConstants, GasActions, SecurityMessages } from '../../constants/security.js';
import { appLog, appError } from '../../lib/logger.js';
import { jsonUtils } from '../../lib/json.js';
import _ from 'lodash';

export interface ResolvedApiKeys {
  geminiKey: string;
  ai33Key: string;
  isUserKey: {
    gemini: boolean;
    ai33: boolean;
  };
}

export async function resolveApiKeys(): Promise<ResolvedApiKeys> {
  const ctx = requestContext.getStore();
  const userGeminiKey = _.get(ctx, SecurityConstants.REQ_BODY_GEMINI_KEY, SecurityConstants.EMPTY_STRING);
  const userAi33Key = _.get(ctx, SecurityConstants.REQ_BODY_AI33_KEY, SecurityConstants.EMPTY_STRING);
  const licenseKey = _.get(ctx, SecurityConstants.STORE_LICENSE_KEY, SecurityConstants.EMPTY_STRING);
  const planType = _.get(ctx, SecurityConstants.STORE_PLAN_TYPE_KEY, SecurityConstants.EMPTY_STRING);

  let geminiKey = userGeminiKey;
  let ai33Key = userAi33Key;

  const isGeminiUserKey = !_.isEmpty(userGeminiKey);
  const isAi33UserKey = !_.isEmpty(userAi33Key);

  const isMissingAnyKey = _.includes([isGeminiUserKey, isAi33UserKey], false);

  appLog(SecurityMessages.LOG_RESOLVER_CTX, jsonUtils.safeStringify({ licenseKey, planType, userGeminiKey, userAi33Key, isMissingAnyKey }));

  if (isMissingAnyKey) {
    try {
      const payload = {
        [SecurityConstants.PROP_ACTION]: GasActions.GET_API_KEYS,
        [SecurityConstants.PROP_LICENSE_KEY_GAS]: licenseKey,
        [SecurityConstants.PROP_PLAN_ID_GAS]: planType,
        [SecurityConstants.PROP_PLAN_TYPE_GAS]: planType
      };
      appLog(SecurityMessages.LOG_RESOLVER_FETCH, jsonUtils.safeStringify(payload));

      const response = await fetch(SecurityConstants.GAS_API_URL, {
        method: SecurityConstants.HTTP_POST,
        headers: { [SecurityConstants.HEADER_CONTENT_TYPE]: SecurityConstants.CONTENT_TYPE_JSON },
        body: jsonUtils.safeStringify(payload)
      });

      const data: any = await response.json();
      appLog(SecurityMessages.LOG_RESOLVER_RESP, jsonUtils.safeStringify(data));
      
      const adminKeys = _.get(data, SecurityConstants.API_KEYS_KEY, {});

      if (!isGeminiUserKey && !_.isEmpty(_.get(adminKeys, SecurityConstants.REQ_BODY_GEMINI_KEY))) {
        geminiKey = _.get(adminKeys, SecurityConstants.REQ_BODY_GEMINI_KEY);
        appLog(SecurityMessages.LOG_USING_ADMIN_GEMINI_KEY);
      }

      if (!isAi33UserKey && !_.isEmpty(_.get(adminKeys, SecurityConstants.REQ_BODY_AI33_KEY))) {
        ai33Key = _.get(adminKeys, SecurityConstants.REQ_BODY_AI33_KEY);
        appLog(SecurityMessages.LOG_USING_ADMIN_AI33_KEY);
      }
    } catch (error) {
      appError(SecurityMessages.LOG_RESOLVER_ERROR, error);
    }
  }

  return {
    geminiKey,
    ai33Key,
    isUserKey: {
      gemini: isGeminiUserKey,
      ai33: isAi33UserKey
    }
  };
}
