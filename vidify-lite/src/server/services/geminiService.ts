import { GoogleGenAI } from "@google/genai";
import { GEMINI_UNSUPPORTED_ERROR_KEYWORDS, GEMINI_RETRYABLE_ERROR_KEYWORDS, AVAILABLE_MODELS, GEMINI_RETRYABLE_STATUSES, GEMINI_QUOTA_STATUSES, GEMINI_RETRY_REGEX } from "../../constants";
import { SecurityMessages, SecurityConstants } from "../../constants/security.js";
import { getMessage, appLog, appLogStep, createAppError } from "../../lib/logger.js";
import _ from 'lodash';
import { delayAsync } from "../../lib/shared-utils.js";
import { resolveApiKeys } from "./apiKeyResolver.js";

export const isGeminiApiKeyAvailable = async (): Promise<boolean> => {
  const keys = await resolveApiKeys();
  return !_.isEmpty(_.get(keys, 'geminiKey'));
};

let currentModelIndex = 0;

export const generateContentWithRetry = async (
  params: {
    contents: string | any;
    config?: any;
  },
  retries = 3,
  delayMs = 1200,
): Promise<any> => {
  const keys = await resolveApiKeys();
  const activeApiKey = _.get(keys, 'geminiKey', '');

  if (_.isEmpty(activeApiKey)) {
    throw createAppError(SecurityMessages.MISSING_GEMINI_KEY);
  }

  const clientAi = new GoogleGenAI({
    apiKey: activeApiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });

  let lastError: any = null;
  const startIndex = currentModelIndex;
  const rotationLogs: string[] = [];

  const logStep = (key: string, ...args: any[]) => {
    const msg = getMessage(key, undefined, ...args);
    appLogStep(msg, rotationLogs);
  };

  logStep("GEMINI_START_ROTATION", AVAILABLE_MODELS.length, startIndex);

  for (let i = 0; _.lt(i, AVAILABLE_MODELS.length); i++) {
    const modelIndex = (startIndex + i) % AVAILABLE_MODELS.length;
    const model = AVAILABLE_MODELS[modelIndex];

    appLog(SecurityConstants.DIVIDER_LINE);
    logStep("GEMINI_CALLING_MODEL", i + 1, AVAILABLE_MODELS.length, model, modelIndex);

    let attempt = 0;
    while (_.lte(attempt, retries)) {
      try {
        const response = await clientAi.models.generateContent({
          model: model,
          contents: params.contents,
          config: params.config,
        });

        logStep("GEMINI_SUCCESS", model, attempt + 1);

        currentModelIndex = modelIndex;

        if (!_.eq(modelIndex, 0)) {
          setTimeout(
            () => {
              currentModelIndex = 0;
            },
            3 * 60 * 1000,
          );
        }

        (response as any).rotationLogs = rotationLogs;
        return response;
      } catch (error: any) {
        lastError = error;
        attempt++;

        const errorStr = error?.toString() || "";
        const errorMessage = error?.message || "";

        logStep("GEMINI_ERROR", model, attempt, errorMessage);

        const isUnsupportedModel = _.some(GEMINI_UNSUPPORTED_ERROR_KEYWORDS, (term) => _.some([errorMessage, errorStr], (str) => _.includes(_.toLower(str), _.toLower(term))));

        if (isUnsupportedModel) {
          logStep("GEMINI_UNSUPPORTED_FALLBACK", model);
          break;
        }

        const isRetryable = _.includes(GEMINI_RETRYABLE_STATUSES, error?.status) || _.some(GEMINI_RETRYABLE_ERROR_KEYWORDS, (term) => _.some([errorMessage, errorStr], (str) => _.includes(_.toLower(str), _.toLower(term))));

        let waitTime = delayMs;
        const retryMatch = errorMessage.match(GEMINI_RETRY_REGEX) || errorStr.match(GEMINI_RETRY_REGEX);
        if (!_.isNil(retryMatch)) {
          waitTime = _.ceil((parseFloat(retryMatch[1]) + 1.5) * 1000);
        } else if (_.includes(GEMINI_QUOTA_STATUSES, error?.status) || _.some([errorMessage, errorStr], (str) => _.includes(_.toLower(str), SecurityConstants.QUOTA_KEYWORD))) {
          waitTime = 8000;
        }

        if (_.lte(attempt, retries) && isRetryable) {
          logStep("GEMINI_RETRYABLE_ERROR", model, waitTime);
          await delayAsync(waitTime);
          delayMs = _.max([delayMs * 1.5, waitTime * 1.2]) || delayMs;
          continue;
        }

        logStep("GEMINI_MODEL_FAILED", model);
        break;
      }
    }

    if (_.lt(i, _.subtract(AVAILABLE_MODELS.length, 1))) {
      logStep("GEMINI_COOLDOWN");
      await delayAsync(2000);
    }
  }

  const finalError = lastError || createAppError("GEMINI_GENERATION_FAILED_ALL");
  finalError.rotationLogs = rotationLogs;
  finalError.noRetry = true;
  logStep("GEMINI_ALL_FAILED", AVAILABLE_MODELS.length);
  throw finalError;
};
