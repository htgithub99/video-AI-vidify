import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();
import { requestContext } from "../utils/requestContext.js";
import { GEMINI_UNSUPPORTED_ERROR_KEYWORDS, GEMINI_RETRYABLE_ERROR_KEYWORDS, AVAILABLE_MODELS, GEMINI_RETRYABLE_STATUSES, GEMINI_QUOTA_STATUSES, GEMINI_RETRY_REGEX } from "../../constants";
import { getMessage, appLog, appLogStep, createAppError } from "../../lib/logger.js";
import { isNil, lt, lte, eq, some, includes, toLower, max, ceil, subtract } from "lodash";

export const isGeminiApiKeyAvailable = (): boolean => {
  const store = requestContext.getStore();
  return !!(store?.geminiKey || process.env.GEMINI_API_KEY);
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
  const store = requestContext.getStore();
  const activeApiKey = store?.geminiKey || process.env.GEMINI_API_KEY || "";

  const clientAi = activeApiKey
    ? new GoogleGenAI({
        apiKey: activeApiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      })
    : null;

  let lastError: any = null;
  const startIndex = currentModelIndex;
  const rotationLogs: string[] = [];

  const logStep = (key: string, ...args: any[]) => {
    const msg = getMessage(key, undefined, ...args);
    appLogStep(msg, rotationLogs);
  };

  logStep("GEMINI_START_ROTATION", AVAILABLE_MODELS.length, startIndex);

  for (let i = 0; lt(i, AVAILABLE_MODELS.length); i++) {
    const modelIndex = (startIndex + i) % AVAILABLE_MODELS.length;
    const model = AVAILABLE_MODELS[modelIndex];

    appLog("----------------------------------------------------");
    logStep("GEMINI_CALLING_MODEL", i + 1, AVAILABLE_MODELS.length, model, modelIndex);

    let attempt = 0;
    while (lte(attempt, retries)) {
      try {
        if (isNil(clientAi)) {
          throw createAppError("GEMINI_SDK_NOT_INIT");
        }

        const response = await clientAi.models.generateContent({
          model: model,
          contents: params.contents,
          config: params.config,
        });

        logStep("GEMINI_SUCCESS", model, attempt + 1);

        currentModelIndex = modelIndex;

        if (!eq(modelIndex, 0)) {
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

        const isUnsupportedModel = some(GEMINI_UNSUPPORTED_ERROR_KEYWORDS, (term) => some([errorMessage, errorStr], (str) => includes(toLower(str), toLower(term))));

        if (isUnsupportedModel) {
          logStep("GEMINI_UNSUPPORTED_FALLBACK", model);
          break;
        }

        const isRetryable = includes(GEMINI_RETRYABLE_STATUSES, error?.status) || some(GEMINI_RETRYABLE_ERROR_KEYWORDS, (term) => some([errorMessage, errorStr], (str) => includes(toLower(str), toLower(term))));

        let waitTime = delayMs;
        const retryMatch = errorMessage.match(GEMINI_RETRY_REGEX) || errorStr.match(GEMINI_RETRY_REGEX);
        if (!isNil(retryMatch)) {
          waitTime = ceil((parseFloat(retryMatch[1]) + 1.5) * 1000);
        } else if (includes(GEMINI_QUOTA_STATUSES, error?.status) || some([errorMessage, errorStr], (str) => includes(toLower(str), "quota"))) {
          waitTime = 8000;
        }

        if (lte(attempt, retries) && isRetryable) {
          logStep("GEMINI_RETRYABLE_ERROR", model, waitTime);
          await new Promise((resolve) => setTimeout(resolve, waitTime));
          delayMs = max([delayMs * 1.5, waitTime * 1.2]) || delayMs;
          continue;
        }

        logStep("GEMINI_MODEL_FAILED", model);
        break;
      }
    }

    if (lt(i, subtract(AVAILABLE_MODELS.length, 1))) {
      logStep("GEMINI_COOLDOWN");
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  const finalError = lastError || createAppError("GEMINI_GENERATION_FAILED_ALL");
  finalError.rotationLogs = rotationLogs;
  finalError.noRetry = true;
  logStep("GEMINI_ALL_FAILED", AVAILABLE_MODELS.length);
  throw finalError;
};
