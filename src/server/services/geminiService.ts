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
    if (_.has(source, "inlineData") || _.has(source, "fileData")) {
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
  const extensionByMimeType: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "video/mp4": "mp4",
    "audio/mpeg": "mp3",
    "audio/mp4": "m4a",
    "audio/wav": "wav",
  };
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
      const mimeType = _.toString(source.inlineData.mimeType || "application/octet-stream");
      const rawData = _.toString(source.inlineData.data);
      const encodedData = _.includes(rawData, ";base64,") ? _.last(_.split(rawData, ";base64,")) || "" : rawData;
      if (_.isEmpty(encodedData)) throw createAppError("Room-only AI execution received an empty inline media attachment.");
      const extension = extensionByMimeType[mimeType] || _.replace(_.last(_.split(mimeType, "/")) || "bin", /[^a-z0-9]/gi, "");
      attachments.push({
        name: `room-media-${attachments.length + 1}.${extension || "bin"}`,
        mimeType,
        buffer: Buffer.from(encodedData, "base64"),
      });
      return;
    }
    if (_.has(source, "fileData")) throw createAppError("Room-only AI execution requires inline media data so it can upload the file to the selected room.");
    if (_.isString(source.text)) textParts.push(source.text);
    _.forEach(_.omit(source, ["text", "role"]), visit);
  };
  visit(contents);
  return { prompt: _.join(_.compact(_.map(textParts, _.trim)), "\n\n"), attachments };
};

const isSchemaCompatibilityError = (error: unknown): boolean => {
  const normalizedError = _.toLower(_.join([_.toString(_.get(error, "message")), _.toString(error), _.toString(_.get(error, "status"))], " "));
  return _.some(GEMINI_REQUEST_POLICY.INVALID_ARGUMENT_PATTERNS, (pattern) => _.includes(normalizedError, _.toLower(pattern)));
};

let currentModelIndex = 0;

export const generateContentWithRetry = async (
  params: {
    contents: string | any;
    config?: any;
    task?: { capability?: AiTaskCapability; budgetUsd?: number; promptVersion?: string; roomWorkerId?: string };
  },
  retries: number = GEMINI_REQUEST_POLICY.DEFAULT_RETRIES,
  delayMs: number = GEMINI_REQUEST_POLICY.BASE_DELAY_MS,
): Promise<any> => {
  const roomOnlyContext = getRoomOnlyContext();
  const roomExecution = getRoomExecution();
  if (roomOnlyContext && !roomExecution) {
    throw createAppError("Room-only AI execution has no valid room provider configured.");
  }
  if (roomExecution) {
    const roomPayload = createRoomRequestPayload(params.contents);
    if (_.isEmpty(roomPayload.prompt)) throw createAppError("Room-only AI execution received no textual task instruction for the selected room.");
    const schemaContract = params.config?.responseJsonSchema && params.config?.includeRoomSchemaContract !== false
      ? `\n\n[REQUIRED RESPONSE CONTRACT]\nReturn only valid JSON matching this JSON Schema exactly:\n${stringifyJson(params.config.responseJsonSchema)}`
      : "";
    let roomResponse: Awaited<ReturnType<typeof generatePlanningWithChatUi>> | undefined;
    let lastRoomError: unknown;
    for (let attempt = 0; attempt < CINEMATIC_CHAT_PLANNING_CONFIG.ROOM_RESPONSE_ATTEMPTS && !roomResponse; attempt++) {
      try {
        const fullRegenerationDirective =
          attempt > 0
            ? "\n\nYour previous response failed strict JSON or the required schema. Generate the entire requested JSON value again from the beginning. Verify every required field, array length, enum and request identity before submitting. Do not continue, patch, quote, concatenate, or repeat any part of the previous response."
            : "";
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
          assertResponseSchema(JSON.parse(candidateResponse.text), params.config.responseJsonSchema, "chat_planning_schema_mismatch");
        }
        roomResponse = candidateResponse;
      } catch (error) {
        lastRoomError = error;
        const message = _.toString(_.get(error, "message", error));
        const responseWasInvalid = _.includes(
          [CINEMATIC_CHAT_PLANNING_CONFIG.INVALID_JSON_RESPONSE_ERROR, CINEMATIC_CHAT_PLANNING_CONFIG.INVALID_RESPONSE_ERROR],
          message,
        ) || _.startsWith(message, "chat_planning_schema_mismatch");
        if (!responseWasInvalid) throw error;
      }
    }
    if (!roomResponse) throw lastRoomError instanceof Error ? lastRoomError : createAppError(CINEMATIC_CHAT_PLANNING_CONFIG.INVALID_RESPONSE_ERROR);
    return {
      text: roomResponse.text,
      rotationLogs: [`[AI Room] ${roomResponse.provider}: completed without API fallback.`],
      aiMetadata: {
        provider: roomResponse.provider,
        model: roomExecution.aiRoomModel,
        executionMode: AiPlanningExecutionMode.RoomOnly,
      },
    };
  }
  const keys = await resolveApiKeys();
  const activeApiKey = _.get(keys, "geminiKey", "");

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

  const generateWithTimeout = async (): Promise<any> => {
    let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
    try {
      return await Promise.race([
        clientAi.models.generateContent({
          model: activeModelForRequest,
          contents: params.contents,
          config: geminiConfigForRequest,
        }),
        new Promise((_, reject) => {
          timeoutHandle = setTimeout(
            () => reject(Object.assign(new Error(GEMINI_REQUEST_POLICY.REQUEST_TIMEOUT_ERROR), { status: 504, code: "ETIMEDOUT" })),
            GEMINI_REQUEST_POLICY.REQUEST_TIMEOUT_MS,
          );
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
    route = routeAiTask({
      capability: params.task?.capability,
      estimatedInputTokens: contentEstimate.estimatedTextTokens,
      mediaInputCount: contentEstimate.mediaInputCount,
      maxOutputTokens: params.config?.maxOutputTokens,
      budgetUsd: params.task?.budgetUsd,
    });
  } catch (routeError: any) {
    routeError.rotationLogs = rotationLogs;
    throw routeError;
  }
  const startIndex = currentModelIndex % route.models.length;
  const geminiConfig = _.omit(params.config || {}, ["temperature", "topP", "topK"]);
  const tryToollessFreeFallback = async (category: string): Promise<any> => {
    if (!_.includes(FREE_AI_PROVIDER_CONFIG.TOOLLESS_FALLBACK_CATEGORIES, category as never) || _.isEmpty(params.config?.tools) || !_.isString(params.contents)) return null;
    appLogStep(FREE_AI_PROVIDER_LOGS.TOOLLESS_FALLBACK, rotationLogs);
    const fallback = await generateWithFreeProviders(
      { ...params, contents: `${FREE_AI_PROVIDER_CONFIG.TOOLLESS_FALLBACK_DIRECTIVE}\n\n${params.contents}`, config: _.omit(params.config || {}, ["tools"]) },
      { cerebrasKey: keys.cerebrasKey, groqKey: keys.groqKey },
    );
    if (!fallback.response) return null;
    fallback.response.rotationLogs = [...rotationLogs, ...fallback.rotationLogs];
    return fallback.response;
  };

  const logStep = (key: string, ...args: any[]) => {
    const msg = getMessage(key, undefined, ...args);
    appLogStep(msg, rotationLogs);
  };

  logStep("GEMINI_START_ROTATION", route.models.length, startIndex);

  for (let i = 0; _.lt(i, route.models.length); i++) {
    const modelIndex = (startIndex + i) % route.models.length;
    const model = route.models[modelIndex];
    activeModelForRequest = model;
    geminiConfigForRequest = geminiConfig;
    let usedRelaxedConfig = false;

    appLog(SecurityConstants.DIVIDER_LINE);
    logStep("GEMINI_CALLING_MODEL", i + 1, route.models.length, model, modelIndex);

    let attempt = 0;
    while (_.lte(attempt, retries)) {
      try {
        const callStartedAt = Date.now();
        const response = await generateWithTimeout();

        logStep("GEMINI_SUCCESS", model, attempt + 1);
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

        logStep("GEMINI_ERROR", model, attempt, errorMessage);

        if (!usedRelaxedConfig && _.has(geminiConfigForRequest, "responseJsonSchema") && isSchemaCompatibilityError(error)) {
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
          logStep("GEMINI_UNSUPPORTED_FALLBACK", model);
          break;
        }
        const retryLimit = _.isEqual(route.models.length, 1) ? _.min([retries, decision.retryLimit]) || 0 : 0;
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
