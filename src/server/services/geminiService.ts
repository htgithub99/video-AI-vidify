import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();
import { requestContext } from '../utils/requestContext.js';
import {
  GEMINI_UNSUPPORTED_ERROR_KEYWORDS,
  GEMINI_RETRYABLE_ERROR_KEYWORDS,
} from '../../constants/data.js';
import { getMessage, appLog, appLogStep, createAppError } from '../../lib/logger.js';

export { GoogleGenAI };

export const isGeminiApiKeyAvailable = (): boolean => {
  const store = requestContext.getStore();
  return !!(store?.geminiKey || process.env.GEMINI_API_KEY);
};

let currentModelIndex = 0;
const AVAILABLE_MODELS = [
  'gemini-3.5-flash',
  'gemini-3.1-flash-lite',
  'gemini-3.1-pro-preview',
];

export const generateContentWithRetry = async (params: {
  contents: string | any;
  config?: any;
}, retries = 3, delayMs = 1200): Promise<any> => {
  const store = requestContext.getStore();
  const activeApiKey = store?.geminiKey || process.env.GEMINI_API_KEY || '';

  const clientAi = activeApiKey
    ? new GoogleGenAI({
      apiKey: activeApiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
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

  logStep('GEMINI_START_ROTATION', AVAILABLE_MODELS.length, startIndex);

  for (let i = 0; i < AVAILABLE_MODELS.length; i++) {
    const modelIndex = (startIndex + i) % AVAILABLE_MODELS.length;
    const model = AVAILABLE_MODELS[modelIndex];

    appLog('----------------------------------------------------');
    logStep('GEMINI_CALLING_MODEL', i + 1, AVAILABLE_MODELS.length, model, modelIndex);

    let attempt = 0;
    while (attempt <= retries) {
      try {
        if (!clientAi) {
          throw createAppError('GEMINI_SDK_NOT_INIT');
        }

        const response = await clientAi.models.generateContent({
          model: model,
          contents: params.contents,
          config: params.config,
        });

        logStep('GEMINI_SUCCESS', model, attempt + 1);

        currentModelIndex = modelIndex;

        if (modelIndex !== 0) {
          setTimeout(() => {
            currentModelIndex = 0;
          }, 3 * 60 * 1000);
        }

        (response as any).rotationLogs = rotationLogs;
        return response;
      } catch (error: any) {
        lastError = error;
        attempt++;

        const errorStr = error?.toString() || '';
        const errorMessage = error?.message || '';

        logStep('GEMINI_ERROR', model, attempt, errorMessage);

        const isUnsupportedModel = GEMINI_UNSUPPORTED_ERROR_KEYWORDS.some(
          term => errorMessage.includes(term) || errorStr.includes(term)
        );

        if (isUnsupportedModel) {
          logStep('GEMINI_UNSUPPORTED_FALLBACK', model);
          break;
        }

        const isRetryable = error?.status === 'RESOURCE_EXHAUSTED' || error?.status === 'UNAVAILABLE' ||
          GEMINI_RETRYABLE_ERROR_KEYWORDS.some(
            term => errorMessage.includes(term) || errorStr.includes(term)
          );

        if (attempt <= retries && isRetryable) {
          logStep('GEMINI_RETRYABLE_ERROR', model, delayMs);
          await new Promise((resolve) => setTimeout(resolve, delayMs));
          delayMs *= 1.5;
          continue;
        }

        logStep('GEMINI_MODEL_FAILED', model);
        break;
      }
    }

    if (i < AVAILABLE_MODELS.length - 1) {
      logStep('GEMINI_COOLDOWN');
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  const finalError = lastError || createAppError('GEMINI_GENERATION_FAILED_ALL');
  finalError.rotationLogs = rotationLogs;
  logStep('GEMINI_ALL_FAILED', AVAILABLE_MODELS.length);
  throw finalError;
};
