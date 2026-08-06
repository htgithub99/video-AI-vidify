import { GoogleGenAI } from "@google/genai";
import { GEMINI_UNSUPPORTED_ERROR_KEYWORDS, GEMINI_RETRYABLE_ERROR_KEYWORDS, GEMINI_RETRYABLE_STATUSES, GEMINI_QUOTA_STATUSES, GEMINI_RETRY_REGEX } from "../../constants";
import { SecurityMessages, SecurityConstants } from "../../constants/security.js";
import { getMessage, appLog, appLogStep, createAppError } from "../../lib/logger.js";
import _ from 'lodash';
import { delayAsync } from "../../lib/shared-utils.js";
import { resolveApiKeys } from "./apiKeyResolver.js";
import { AiTaskCapability, createAiCallMetadata, recordModelFailure, recordModelSuccess, routeAiTask } from "./taskRouterService.js";

export const isGeminiApiKeyAvailable = async (): Promise<boolean> => {
  const keys = await resolveApiKeys();
  return !_.isEmpty(_.get(keys, 'geminiKey'));
};

let currentModelIndex = 0;

export const generateContentWithRetry = async (
  params: {
    contents: string | any;
    config?: any;
    task?: { capability?: AiTaskCapability; budgetUsd?: number; promptVersion?: string };
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
  const estimatedInputTokens = _.ceil(_.size(_.toString(typeof params.contents === "string" ? params.contents : JSON.stringify(params.contents))) / 4);
  const route = routeAiTask({ capability: params.task?.capability, estimatedInputTokens, maxOutputTokens: params.config?.maxOutputTokens, budgetUsd: params.task?.budgetUsd });
  const startIndex = currentModelIndex % route.models.length;
  const rotationLogs: string[] = [];

  const logStep = (key: string, ...args: any[]) => {
    const msg = getMessage(key, undefined, ...args);
    appLogStep(msg, rotationLogs);
  };

  logStep("GEMINI_START_ROTATION", route.models.length, startIndex);

  for (let i = 0; _.lt(i, route.models.length); i++) {
    const modelIndex = (startIndex + i) % route.models.length;
    const model = route.models[modelIndex];

    appLog(SecurityConstants.DIVIDER_LINE);
    logStep("GEMINI_CALLING_MODEL", i + 1, route.models.length, model, modelIndex);

    let attempt = 0;
    while (_.lte(attempt, retries)) {
      try {
        const callStartedAt = Date.now();
        const response = await clientAi.models.generateContent({
          model: model,
          contents: params.contents,
          config: params.config,
        });

        logStep("GEMINI_SUCCESS", model, attempt + 1);
        recordModelSuccess(model);

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
        (response as any).aiMetadata = createAiCallMetadata(route, model, i, Date.now() - callStartedAt, (response as any).usageMetadata);
        return response;
      } catch (error: any) {
        lastError = error;
        recordModelFailure(model);
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
        waitTime = _.ceil(waitTime * (0.8 + Math.random() * 0.4));

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

    if (_.lt(i, _.subtract(route.models.length, 1))) {
      logStep("GEMINI_COOLDOWN");
      await delayAsync(2000);
    }
  }

  const finalError = lastError || createAppError("GEMINI_GENERATION_FAILED_ALL");
  finalError.rotationLogs = rotationLogs;
  finalError.noRetry = true;
  logStep("GEMINI_ALL_FAILED", route.models.length);
  throw finalError;
};
