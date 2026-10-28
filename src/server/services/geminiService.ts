import { RUNTIME_TEXT as RT_SHARED } from "../../constants/runtime/shared.js";
import { parseJson } from "../../lib/jsonStringify.js";
import {
  SOURCE_TEMPLATE_AI_ROOM_COMPLETED_WITHOUT_API_FALLBACK,
  SOURCE_TEMPLATE_REQUIRED_RESPONSE_CONTRACT_RETURN_ONLY_VALID,
  SOURCE_TEMPLATE_ROOM_MEDIA,
  SOURCE_TEXT_AISTUDIO_BUILD,
  SOURCE_TEXT_APPLICATION_OCTET_STREAM,
  SOURCE_TEXT_BASE64,
  SOURCE_TEXT_BASE64_2,
  SOURCE_TEXT_BIN,
  SOURCE_TEXT_CHAT_PLANNING_SCHEMA_MISMATCH,
  SOURCE_TEXT_ETIMEDOUT,
  SOURCE_TEXT_FILEDATA,
  SOURCE_TEXT_GEMINIKEY,
  SOURCE_TEXT_GEMINI_ALL_FAILED,
  SOURCE_TEXT_GEMINI_CALLING_MODEL,
  SOURCE_TEXT_GEMINI_COOLDOWN,
  SOURCE_TEXT_GEMINI_ERROR,
  SOURCE_TEXT_GEMINI_GENERATION_FAILED_ALL,
  SOURCE_TEXT_GEMINI_MODEL_FAILED,
  SOURCE_TEXT_GEMINI_RETRYABLE_ERROR,
  SOURCE_TEXT_GEMINI_START_ROTATION,
  SOURCE_TEXT_GEMINI_SUCCESS,
  SOURCE_TEXT_GEMINI_UNSUPPORTED_FALLBACK,
  SOURCE_TEXT_INLINEDATA,
  SOURCE_TEXT_JPG,
  SOURCE_TEXT_M4A,
  SOURCE_TEXT_MESSAGE,
  SOURCE_TEXT_MP3,
  SOURCE_TEXT_MP4,
  SOURCE_TEXT_PNG,
  SOURCE_TEXT_RESPONSEJSONSCHEMA,
  SOURCE_TEXT_ROLE,
  SOURCE_TEXT_ROOM_ONLY_AI_EXECUTION_HAS_NO,
  SOURCE_TEXT_ROOM_ONLY_AI_EXECUTION_RECEIVED_AN,
  SOURCE_TEXT_ROOM_ONLY_AI_EXECUTION_RECEIVED_NO,
  SOURCE_TEXT_ROOM_ONLY_AI_EXECUTION_REQUIRES_INLINE,
  SOURCE_TEXT_STATUS,
  SOURCE_TEXT_SYMBOL,
  SOURCE_TEXT_TEMPERATURE,
  SOURCE_TEXT_TEXT,
  SOURCE_TEXT_TOOLS,
  SOURCE_TEXT_TOPK,
  SOURCE_TEXT_TOPP,
  SOURCE_TEXT_WAV,
  SOURCE_TEXT_WEBP,
  SOURCE_TEXT_YOUR_PREVIOUS_RESPONSE_FAILED_STRICT_JSON,
} from "../../constants/sourceText";
import { GoogleGenAI } from "@google/genai";
import { CINEMATIC_CHAT_PLANNING_CONFIG, CINEMATIC_ROOM_STAGE, FREE_AI_PROVIDER_CONFIG, FREE_AI_PROVIDER_LOGS, GEMINI_REQUEST_POLICY } from "../../constants";
import { SecurityMessages, SecurityConstants } from "../../constants/security.js";
import { getMessage, appLog, appLogStep, createAppError } from "../../lib/logger.js";
import _ from "lodash";
import { stringifyJson } from "../../lib/jsonStringify.js";
import { delayAsync } from "../../lib/shared-utils.js";
import { resolveApiKeys } from "./apiKeyResolver.js";
import { AiTaskCapability, blockModel, createAiCallMetadata, recordModelFailure, recordModelSuccess, routeAiTask } from "./taskRouterService.js";
import { classifyGeminiError } from "./geminiErrorClassifier.js";
import { generateWithFreeProviders } from "./freeAiProviderService.js";
import { generatePlanningWithChatUi } from "./chatUiPlanningService.js";
import { assertResponseSchema } from "./responseSchemaValidationService.js";
import { requestContext } from "../utils/requestContext.js";
import { AiPlanningExecutionMode, AiPlanningFallbackProvider } from "../../types.js";
const getRoomOnlyContext = () => {
  const context = requestContext.getStore();
  return context?.aiExecutionMode === AiPlanningExecutionMode.RoomOnly ? context : undefined;
};
const getRoomExecution = () => {
  const context = getRoomOnlyContext();
  return context?.aiRoomProvider && context.aiRoomProvider !== AiPlanningFallbackProvider.Disabled ? context : undefined;
};
const resolveRoomWorkerId = (capability?: AiTaskCapability, explicitWorkerId?: string): string => {
  if (!_.isEmpty(explicitWorkerId)) return explicitWorkerId!;
  if (_.isEqual(capability, AiTaskCapability.Thumbnail)) return CINEMATIC_ROOM_STAGE.THUMBNAIL;
  if (_.includes([AiTaskCapability.VisualPlanning, AiTaskCapability.StyleExtraction], capability)) return CINEMATIC_ROOM_STAGE.PROMPT;
  if (_.includes([AiTaskCapability.VisualQa, AiTaskCapability.AudioQa], capability)) return CINEMATIC_ROOM_STAGE.VIDEO;
  return CINEMATIC_ROOM_STAGE.SCRIPT;
};
export const isAiProviderAvailable = async (): Promise<boolean> => {
  if (getRoomOnlyContext()) return true;
  const keys = await resolveApiKeys();
  return _.some([keys.cerebrasKey, keys.groqKey, keys.geminiKey], (key) => !_.isEmpty(key));
};
export const isGeminiProviderAvailable = async (): Promise<boolean> => {
  const keys = await resolveApiKeys();
  return !_.isEmpty(keys.geminiKey);
};
interface GeminiContentEstimate {
  textCharacters: number;
  estimatedTextTokens: number;
  mediaInputCount: number;
}
export const estimateGeminiContents = (contents: unknown): GeminiContentEstimate => {
  let textCharacters = 0;
  let mediaInputCount = 0;
  const visit = (value: unknown): void => {
    if (_.isString(value)) {
      textCharacters += _.size(value);
      return;
    }
    if (_.isArray(value)) {
      _.forEach(value, visit);
      return;
    }
    if (!_.isPlainObject(value)) return;
    const source = value as Record<string, unknown>;
    if (_.has(source, SOURCE_TEXT_INLINEDATA) || _.has(source, SOURCE_TEXT_FILEDATA)) {
      mediaInputCount += 1;
      return;
    }
    _.forEach(_.values(source), visit);
  };
  visit(contents);
  return { textCharacters, estimatedTextTokens: _.ceil(textCharacters / GEMINI_REQUEST_POLICY.TOKEN_ESTIMATE_CHARACTERS), mediaInputCount };
};
const createRoomRequestPayload = (contents: unknown): { prompt: string; attachments: Array<{ name: string; mimeType: string; buffer: Buffer }> } => {
  const textParts: string[] = [];
  const attachments: Array<{ name: string; mimeType: string; buffer: Buffer }> = [];
  const extensionByMimeType: Record<string, string> = { "image/jpeg": SOURCE_TEXT_JPG, "image/png": SOURCE_TEXT_PNG, "image/webp": SOURCE_TEXT_WEBP, "video/mp4": SOURCE_TEXT_MP4, "audio/mpeg": SOURCE_TEXT_MP3, "audio/mp4": SOURCE_TEXT_M4A, "audio/wav": SOURCE_TEXT_WAV };
  const visit = (value: unknown): void => {
    if (_.isString(value)) {
      textParts.push(value);
      return;
    }
    if (_.isArray(value)) {
      _.forEach(value, visit);
      return;
    }
    if (!_.isPlainObject(value)) return;
    const source = value as Record<string, any>;
    if (_.isPlainObject(source.inlineData)) {
      const mimeType = _.toString(source.inlineData.mimeType || SOURCE_TEXT_APPLICATION_OCTET_STREAM);
      const rawData = _.toString(source.inlineData.data);
      const encodedData = _.includes(rawData, SOURCE_TEXT_BASE64_2) ? _.last(_.split(rawData, SOURCE_TEXT_BASE64_2)) || "" : rawData;
      if (_.isEmpty(encodedData)) throw createAppError(SOURCE_TEXT_ROOM_ONLY_AI_EXECUTION_RECEIVED_AN);
      const extension = extensionByMimeType[mimeType] || _.replace(_.last(_.split(mimeType, SOURCE_TEXT_SYMBOL)) || SOURCE_TEXT_BIN, /[^a-z0-9]/gi, "");
      attachments.push({ name: SOURCE_TEMPLATE_ROOM_MEDIA(`${attachments.length + 1}`, `${extension || SOURCE_TEXT_BIN}`), mimeType, buffer: Buffer.from(encodedData, SOURCE_TEXT_BASE64) });
      return;
    }
    if (_.has(source, SOURCE_TEXT_FILEDATA)) throw createAppError(SOURCE_TEXT_ROOM_ONLY_AI_EXECUTION_REQUIRES_INLINE);
    if (_.isString(source.text)) textParts.push(source.text);
    _.forEach(_.omit(source, [SOURCE_TEXT_TEXT, SOURCE_TEXT_ROLE]), visit);
  };
  visit(contents);
  return { prompt: _.join(_.compact(_.map(textParts, _.trim)), RT_SHARED.SYMBOL_75A11D), attachments };
};
const isSchemaCompatibilityError = (error: unknown): boolean => {
  const normalizedError = _.toLower(_.join([_.toString(_.get(error, SOURCE_TEXT_MESSAGE)), _.toString(error), _.toString(_.get(error, SOURCE_TEXT_STATUS))], RT_SHARED.SYMBOL_36A9E7));
  return _.some(GEMINI_REQUEST_POLICY.INVALID_ARGUMENT_PATTERNS, (pattern) => _.includes(normalizedError, _.toLower(pattern)));
};
let currentModelIndex = 0;
export const generateContentWithRetry = async (params: { contents: string | any; config?: any; task?: { capability?: AiTaskCapability; budgetUsd?: number; promptVersion?: string; roomWorkerId?: string } }, retries: number = GEMINI_REQUEST_POLICY.DEFAULT_RETRIES, delayMs: number = GEMINI_REQUEST_POLICY.BASE_DELAY_MS): Promise<any> => {
  const roomOnlyContext = getRoomOnlyContext();
  const roomExecution = getRoomExecution();
  if (roomOnlyContext && !roomExecution) {
    throw createAppError(SOURCE_TEXT_ROOM_ONLY_AI_EXECUTION_HAS_NO);
  }
  if (roomExecution) {
    const roomPayload = createRoomRequestPayload(params.contents);
    if (_.isEmpty(roomPayload.prompt)) throw createAppError(SOURCE_TEXT_ROOM_ONLY_AI_EXECUTION_RECEIVED_NO);
    const schemaContract = params.config?.responseJsonSchema && params.config?.includeRoomSchemaContract !== false ? SOURCE_TEMPLATE_REQUIRED_RESPONSE_CONTRACT_RETURN_ONLY_VALID(`${stringifyJson(params.config.responseJsonSchema)}`) : "";
    let roomResponse: Awaited<ReturnType<typeof generatePlanningWithChatUi>> | undefined;
    let lastRoomError: unknown;
    for (let attempt = 0; attempt < CINEMATIC_CHAT_PLANNING_CONFIG.ROOM_RESPONSE_ATTEMPTS && !roomResponse; attempt++) {
      try {
        const fullRegenerationDirective = attempt > 0 ? SOURCE_TEXT_YOUR_PREVIOUS_RESPONSE_FAILED_STRICT_JSON : "";
        const candidateResponse = await generatePlanningWithChatUi({
          provider: roomExecution.aiRoomProvider!,
          model: roomExecution.aiRoomModel,
          prompt: `${roomPayload.prompt}${schemaContract}${fullRegenerationDirective}`,
          projectId: roomExecution.aiRoomProjectId || CINEMATIC_CHAT_PLANNING_CONFIG.DEFAULT_PROJECT_SCOPE,
          chromeHeadless: roomExecution.aiRoomChromeHeadless,
          attachments: roomPayload.attachments,
          workerId: resolveRoomWorkerId(params.task?.capability, params.task?.roomWorkerId),
          completionMarker: params.config?.roomCompletionMarker,
          artifactType: params.config?.roomArtifactType,
          requestId: params.config?.roomRequestId,
          closeRoomOnComplete: false,
        });
        if (params.config?.responseJsonSchema) {
          assertResponseSchema(parseJson(candidateResponse.text), params.config.responseJsonSchema, SOURCE_TEXT_CHAT_PLANNING_SCHEMA_MISMATCH);
        }
        roomResponse = candidateResponse;
      } catch (error) {
        lastRoomError = error;
        const message = _.toString(_.get(error, SOURCE_TEXT_MESSAGE, error));
        const responseWasInvalid = _.includes([CINEMATIC_CHAT_PLANNING_CONFIG.INVALID_JSON_RESPONSE_ERROR, CINEMATIC_CHAT_PLANNING_CONFIG.INVALID_RESPONSE_ERROR], message) || _.startsWith(message, SOURCE_TEXT_CHAT_PLANNING_SCHEMA_MISMATCH);
        if (!responseWasInvalid) throw error;
      }
    }
    if (!roomResponse) throw lastRoomError instanceof Error ? lastRoomError : createAppError(CINEMATIC_CHAT_PLANNING_CONFIG.INVALID_RESPONSE_ERROR);
    return { text: roomResponse.text, rotationLogs: [SOURCE_TEMPLATE_AI_ROOM_COMPLETED_WITHOUT_API_FALLBACK(`${roomResponse.provider}`)], aiMetadata: { provider: roomResponse.provider, model: roomExecution.aiRoomModel, executionMode: AiPlanningExecutionMode.RoomOnly } };
  }
  const keys = await resolveApiKeys();
  const activeApiKey = _.get(keys, SOURCE_TEXT_GEMINIKEY, "");
  const freeProviderResult = await generateWithFreeProviders(params, { cerebrasKey: keys.cerebrasKey, groqKey: keys.groqKey });
  if (freeProviderResult.response) return freeProviderResult.response;
  if (_.isEmpty(activeApiKey)) {
    const providerError = freeProviderResult.lastError || createAppError(SecurityMessages.MISSING_GEMINI_KEY);
    providerError.rotationLogs = freeProviderResult.rotationLogs;
    providerError.noRetry = true;
    throw providerError;
  }
  const clientAi = new GoogleGenAI({ apiKey: activeApiKey, httpOptions: { headers: { "User-Agent": SOURCE_TEXT_AISTUDIO_BUILD } } });
  const generateWithTimeout = async (): Promise<any> => {
    let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
    try {
      return await Promise.race([
        clientAi.models.generateContent({ model: activeModelForRequest, contents: params.contents, config: geminiConfigForRequest }),
        new Promise((_resolve, reject) => {
          timeoutHandle = setTimeout(() => reject(_.assign(new Error(GEMINI_REQUEST_POLICY.REQUEST_TIMEOUT_ERROR), { status: 504, code: SOURCE_TEXT_ETIMEDOUT })), GEMINI_REQUEST_POLICY.REQUEST_TIMEOUT_MS);
        }),
      ]);
    } finally {
      if (timeoutHandle) clearTimeout(timeoutHandle);
    }
  };
  let activeModelForRequest = "";
  let geminiConfigForRequest: any = {};
  let lastError: any = null;
  const rotationLogs: string[] = [...freeProviderResult.rotationLogs];
  const contentEstimate = estimateGeminiContents(params.contents);
  let route: ReturnType<typeof routeAiTask>;
  try {
    route = routeAiTask({ capability: params.task?.capability, estimatedInputTokens: contentEstimate.estimatedTextTokens, mediaInputCount: contentEstimate.mediaInputCount, maxOutputTokens: params.config?.maxOutputTokens, budgetUsd: params.task?.budgetUsd });
  } catch (routeError: any) {
    routeError.rotationLogs = rotationLogs;
    throw routeError;
  }
  const startIndex = currentModelIndex % route.models.length;
  const geminiConfig = _.omit(params.config || {}, [SOURCE_TEXT_TEMPERATURE, SOURCE_TEXT_TOPP, SOURCE_TEXT_TOPK]);
  const tryToollessFreeFallback = async (category: string): Promise<any> => {
    if (!_.includes(FREE_AI_PROVIDER_CONFIG.TOOLLESS_FALLBACK_CATEGORIES, category as never) || _.isEmpty(params.config?.tools) || !_.isString(params.contents)) return null;
    appLogStep(FREE_AI_PROVIDER_LOGS.TOOLLESS_FALLBACK, rotationLogs);
    const fallback = await generateWithFreeProviders({ ...params, contents: `${FREE_AI_PROVIDER_CONFIG.TOOLLESS_FALLBACK_DIRECTIVE}${RT_SHARED.SYMBOL_75A11D}${params.contents}`, config: _.omit(params.config || {}, [SOURCE_TEXT_TOOLS]) }, { cerebrasKey: keys.cerebrasKey, groqKey: keys.groqKey });
    if (!fallback.response) return null;
    fallback.response.rotationLogs = [...rotationLogs, ...fallback.rotationLogs];
    return fallback.response;
  };
  const logStep = (key: string, ...args: any[]) => {
    const msg = getMessage(key, undefined, ...args);
    appLogStep(msg, rotationLogs);
  };
  logStep(SOURCE_TEXT_GEMINI_START_ROTATION, route.models.length, startIndex);
  for (let i = 0; _.lt(i, route.models.length); i++) {
    const modelIndex = (startIndex + i) % route.models.length;
    const model = route.models[modelIndex];
    activeModelForRequest = model;
    geminiConfigForRequest = geminiConfig;
    let usedRelaxedConfig = false;
    appLog(SecurityConstants.DIVIDER_LINE);
    logStep(SOURCE_TEXT_GEMINI_CALLING_MODEL, i + 1, route.models.length, model, modelIndex);
    let attempt = 0;
    while (_.lte(attempt, retries)) {
      try {
        const callStartedAt = Date.now();
        const response = await generateWithTimeout();
        logStep(SOURCE_TEXT_GEMINI_SUCCESS, model, attempt + 1);
        recordModelSuccess(model);
        currentModelIndex = modelIndex;
        if (!_.eq(modelIndex, 0)) {
          setTimeout(() => {
            currentModelIndex = 0;
          }, GEMINI_REQUEST_POLICY.MODEL_INDEX_RESET_MS);
        }
        (response as any).rotationLogs = rotationLogs;
        (response as any).aiMetadata = createAiCallMetadata(route, model, i, Date.now() - callStartedAt, (response as any).usageMetadata);
        return response;
      } catch (error: any) {
        lastError = error;
        attempt++;
        const errorMessage = error?.message || "";
        logStep(SOURCE_TEXT_GEMINI_ERROR, model, attempt, errorMessage);
        if (!usedRelaxedConfig && _.has(geminiConfigForRequest, SOURCE_TEXT_RESPONSEJSONSCHEMA) && isSchemaCompatibilityError(error)) {
          geminiConfigForRequest = _.omit(geminiConfigForRequest, GEMINI_REQUEST_POLICY.RELAXED_CONFIG_KEYS);
          usedRelaxedConfig = true;
          attempt = _.max([SecurityConstants.ZERO, _.subtract(attempt, SecurityConstants.DEFAULT_AMOUNT)]) || SecurityConstants.ZERO;
          continue;
        }
        const decision = classifyGeminiError(error);
        const toolFreeResponse = await tryToollessFreeFallback(decision.category);
        if (toolFreeResponse) return toolFreeResponse;
        if (!decision.retryable) {
          blockModel(model, decision.cooldownMs);
          logStep(SOURCE_TEXT_GEMINI_UNSUPPORTED_FALLBACK, model);
          break;
        }
        const retryLimit = _.isEqual(route.models.length, 1) ? _.min([retries, decision.retryLimit]) || 0 : 0;
        const waitTime = _.ceil(_.max([delayMs, decision.waitMs])! * (GEMINI_REQUEST_POLICY.RETRY_JITTER_MIN + Math.random() * GEMINI_REQUEST_POLICY.RETRY_JITTER_RANGE));
        if (_.lte(attempt, retryLimit)) {
          logStep(SOURCE_TEXT_GEMINI_RETRYABLE_ERROR, model, waitTime);
          await delayAsync(waitTime);
          delayMs = _.max([delayMs * GEMINI_REQUEST_POLICY.BACKOFF_MULTIPLIER, waitTime * GEMINI_REQUEST_POLICY.WAIT_BACKOFF_MULTIPLIER]) || delayMs;
          continue;
        }
        recordModelFailure(model);
        logStep(SOURCE_TEXT_GEMINI_MODEL_FAILED, model);
        break;
      }
    }
    if (_.lt(i, _.subtract(route.models.length, 1))) {
      logStep(SOURCE_TEXT_GEMINI_COOLDOWN);
      await delayAsync(GEMINI_REQUEST_POLICY.MODEL_SWITCH_DELAY_MS);
    }
  }
  const finalError = lastError || createAppError(SOURCE_TEXT_GEMINI_GENERATION_FAILED_ALL);
  finalError.rotationLogs = rotationLogs;
  finalError.noRetry = true;
  logStep(SOURCE_TEXT_GEMINI_ALL_FAILED, route.models.length);
  throw finalError;
};
