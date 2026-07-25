import { requestContext } from '../utils/requestContext.js';
import { SecurityConstants, GasActions, SecurityMessages } from '../../constants/security.js';
import { appLog, appError } from '../../lib/logger.js';
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
  const userGeminiKey = _.get(ctx, 'geminiKey', '');
  const userAi33Key = _.get(ctx, 'ai33Key', '');
  const licenseKey = _.get(ctx, 'licenseKey', '');
  const planType = _.get(ctx, 'planType', '');

  let geminiKey = userGeminiKey;
  let ai33Key = userAi33Key;

  const isGeminiUserKey = !_.isEmpty(userGeminiKey);
  const isAi33UserKey = !_.isEmpty(userAi33Key);

  const isMissingAnyKey = _.some([isGeminiUserKey, isAi33UserKey], (hasKey) => _.eq(hasKey, false));

  if (isMissingAnyKey) {
    try {
      const response = await fetch(SecurityConstants.GAS_API_URL, {
        method: SecurityConstants.HTTP_POST,
        headers: { 'Content-Type': SecurityConstants.CONTENT_TYPE_JSON },
        body: JSON.stringify({
          action: GasActions.GET_API_KEYS,
          license_key: licenseKey,
          plan_id: planType
        })
      });

      const data: any = await response.json();
      const adminKeys = _.get(data, 'apiKeys', {});

      if (!isGeminiUserKey && !_.isEmpty(_.get(adminKeys, 'geminiKey'))) {
        geminiKey = _.get(adminKeys, 'geminiKey');
        appLog(SecurityMessages.LOG_USING_ADMIN_GEMINI_KEY);
      }

      if (!isAi33UserKey && !_.isEmpty(_.get(adminKeys, 'ai33Key'))) {
        ai33Key = _.get(adminKeys, 'ai33Key');
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
