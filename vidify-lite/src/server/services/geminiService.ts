import { GoogleGenAI } from "@google/genai";
import { FREE_AI_PROVIDER_CONFIG, FREE_AI_PROVIDER_LOGS, GEMINI_REQUEST_POLICY } from "../../constants";
import { SecurityMessages, SecurityConstants } from "../../constants/security.js";
import { getMessage, appLog, appLogStep, createAppError } from "../../lib/logger.js";
import _ from 'lodash';
import { delayAsync } from "../../lib/shared-utils.js";
import { resolveApiKeys } from "./apiKeyResolver.js";
import { AiTaskCapability, blockModel, createAiCallMetadata, recordModelFailure, recordModelSuccess, routeAiTask } from "./taskRouterService.js";
import { classifyGeminiError } from "./geminiErrorClassifier.js";
import { generateWithFreeProviders } from "./freeAiProviderService.js";

export const isAiProviderAvailable = async (): Promise<boolean> => {
  const keys = await resolveApiKeys();
  return _.some([keys.cerebrasKey, keys.groqKey, keys.geminiKey], (key) => !_.isEmpty(key));
};

let currentModelIndex = 0;

export const generateContentWithRetry = async (
  params: {
    contents: string | any;
    config?: any;
    task?: { capability?: AiTaskCapability; budgetUsd?: number; promptVersion?: string };
  },
  retries: number = GEMINI_REQUEST_POLICY.DEFAULT_RETRIES,
  delayMs: number = GEMINI_REQUEST_POLICY.BASE_DELAY_MS,
): Promise<any> => {
  const keys = await resolveApiKeys();
  const activeApiKey = _.get(keys, 'geminiKey', '');

  const freeProviderResult = await generateWithFreeProviders(params, { cerebrasKey: keys.cerebrasKey, groqKey: keys.groqKey });
  if (freeProviderResult.response) return freeProviderResult.response;

  if (_.isEmpty(activeApiKey)) {
    const providerError = freeProviderResult.lastError || createAppError(SecurityMessages.MISSING_GEMINI_KEY);
    providerError.rotationLogs = freeProviderResult.rotationLogs;
    providerError.noRetry = true;
    throw providerError;
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
  const rotationLogs: string[] = [...freeProviderResult.rotationLogs];
  const estimatedInputTokens = _.ceil(_.size(_.toString(typeof params.contents === "string" ? params.contents : JSON.stringify(params.contents))) / GEMINI_REQUEST_POLICY.TOKEN_ESTIMATE_CHARACTERS);
  let route: ReturnType<typeof routeAiTask>;
  try {
    route = routeAiTask({ capability: params.task?.capability, estimatedInputTokens, maxOutputTokens: params.config?.maxOutputTokens, budgetUsd: params.task?.budgetUsd });
  } catch (routeError: any) {
    routeError.rotationLogs = rotationLogs;
    throw routeError;
  }
  const startIndex = currentModelIndex % route.models.length;
  const geminiConfig = _.omit(params.config || {}, ["temperature", "topP", "topK"]);
  const tryToollessFreeFallback = async (category: string): Promise<any> => {
    if (!_.includes(FREE_AI_PROVIDER_CONFIG.TOOLLESS_FALLBACK_CATEGORIES, category as never) || _.isEmpty(params.config?.tools) || !_.isString(params.contents)) return null;
    appLogStep(FREE_AI_PROVIDER_LOGS.TOOLLESS_FALLBACK, rotationLogs);const fallback = await generateWithFreeProviders({ ...params, contents: `${FREE_AI_PROVIDER_CONFIG.TOOLLESS_FALLBACK_DIRECTIVE}\n\n${params.contents}`, config: _.omit(params.config || {}, ["tools"]) }, { cerebrasKey: keys.cerebrasKey, groqKey: keys.groqKey });
    if (!fallback.response) return null;fallback.response.rotationLogs = [...rotationLogs, ...fallback.rotationLogs];return fallback.response;
  };

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
          config: geminiConfig,
        });

        logStep("GEMINI_SUCCESS", model, attempt + 1);
        recordModelSuccess(model);

        currentModelIndex = modelIndex;

        if (!_.eq(modelIndex, 0)) {
          setTimeout(
            () => {
              currentModelIndex = 0;
            },
            GEMINI_REQUEST_POLICY.MODEL_INDEX_RESET_MS,
          );
        }

        (response as any).rotationLogs = rotationLogs;
        (response as any).aiMetadata = createAiCallMetadata(route, model, i, Date.now() - callStartedAt, (response as any).usageMetadata);
        return response;
      } catch (error: any) {
        lastError = error;
        attempt++;

        const errorMessage = error?.message || "";

        logStep("GEMINI_ERROR", model, attempt, errorMessage);

        const decision = classifyGeminiError(error);
        const toolFreeResponse = await tryToollessFreeFallback(decision.category);if (toolFreeResponse) return toolFreeResponse;
        if (!decision.retryable) {
          blockModel(model, decision.cooldownMs);
          logStep("GEMINI_UNSUPPORTED_FALLBACK", model);
          break;
        }
        const retryLimit = _.min([retries, decision.retryLimit]) || 0;
        const waitTime = _.ceil(_.max([delayMs, decision.waitMs])! * (GEMINI_REQUEST_POLICY.RETRY_JITTER_MIN + Math.random() * GEMINI_REQUEST_POLICY.RETRY_JITTER_RANGE));
        if (_.lte(attempt, retryLimit)) {
          logStep("GEMINI_RETRYABLE_ERROR", model, waitTime);
          await delayAsync(waitTime);
          delayMs = _.max([delayMs * GEMINI_REQUEST_POLICY.BACKOFF_MULTIPLIER, waitTime * GEMINI_REQUEST_POLICY.WAIT_BACKOFF_MULTIPLIER]) || delayMs;
          continue;
        }
        recordModelFailure(model);
        logStep("GEMINI_MODEL_FAILED", model);
        break;
      }
    }

    if (_.lt(i, _.subtract(route.models.length, 1))) {
      logStep("GEMINI_COOLDOWN");
      await delayAsync(GEMINI_REQUEST_POLICY.MODEL_SWITCH_DELAY_MS);
    }
  }

  const finalError = lastError || createAppError("GEMINI_GENERATION_FAILED_ALL");
  finalError.rotationLogs = rotationLogs;
  finalError.noRetry = true;
  logStep("GEMINI_ALL_FAILED", route.models.length);
  throw finalError;
};
