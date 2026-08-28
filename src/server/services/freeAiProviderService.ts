import _ from "lodash";
import { FREE_AI_PROVIDER_CONFIG, FREE_AI_PROVIDER_LOGS, GEMINI_REQUEST_POLICY } from "../../constants/config.js";
import { jsonUtils } from "../../lib/json.js";
import { appLogStep } from "../../lib/logger.js";
import { AiCallMetadata, AiTaskCapability, blockModel, isCircuitOpen, recordModelSuccess } from "./taskRouterService.js";

type FreeProviderId = "cerebras" | "groq";

interface FreeProviderRequest {
  contents: string | any;
  config?: any;
  task?: { capability?: AiTaskCapability };
}
interface FreeProviderResult {
  response?: any;
  lastError?: any;
  rotationLogs: string[];
}
interface FreeProviderKeys {
  cerebrasKey: string;
  groqKey: string;
}
interface ProviderCandidate {
  id: FreeProviderId;
  url: string;
  apiKey: string;
  models: readonly string[];
}

const resolveGroqModels = (requiresTools: boolean, capability?: AiTaskCapability): readonly string[] => (requiresTools ? FREE_AI_PROVIDER_CONFIG.GROQ.toolModels : capability === AiTaskCapability.ScriptWriting ? FREE_AI_PROVIDER_CONFIG.GROQ.scriptModels : FREE_AI_PROVIDER_CONFIG.GROQ.models);
const createGroqCandidate = (apiKey: string, requiresTools: boolean, capability?: AiTaskCapability): ProviderCandidate => ({ id: FREE_AI_PROVIDER_CONFIG.GROQ.id, url: FREE_AI_PROVIDER_CONFIG.GROQ.url, models: resolveGroqModels(requiresTools, capability), apiKey });
const createProviderCandidates = ({ cerebrasKey, groqKey }: FreeProviderKeys, requiresTools: boolean, capability?: AiTaskCapability): ProviderCandidate[] => {
  if (requiresTools) return _.isEmpty(groqKey) ? [] : [createGroqCandidate(groqKey, true, capability)];
  return _.compact([_.isEmpty(cerebrasKey) ? null : { ...FREE_AI_PROVIDER_CONFIG.CEREBRAS, apiKey: cerebrasKey }, _.isEmpty(groqKey) ? null : createGroqCandidate(groqKey, false, capability)]) as ProviderCandidate[];
};
const createRequestBody = (model: string, request: FreeProviderRequest) => ({
  model,
  messages: [{ role: "user", content: request.contents }],
  max_tokens: request.config?.maxOutputTokens || FREE_AI_PROVIDER_CONFIG.DEFAULT_MAX_OUTPUT_TOKENS,
  temperature: request.config?.temperature ?? FREE_AI_PROVIDER_CONFIG.DEFAULT_TEMPERATURE,
  ...(request.config?.responseMimeType === FREE_AI_PROVIDER_CONFIG.JSON_CONTENT_TYPE ? { response_format: { type: FREE_AI_PROVIDER_CONFIG.JSON_RESPONSE_TYPE } } : {}),
});
const createMetadata = (provider: ProviderCandidate, model: string, request: FreeProviderRequest, fallbackIndex: number, startedAt: number, usage: any): AiCallMetadata => ({
  capability: request.task?.capability || AiTaskCapability.TextPlanning,
  provider: provider.id,
  model,
  modelVersion: model,
  promptVersion: FREE_AI_PROVIDER_CONFIG.PROMPT_VERSION,
  estimatedCostUsd: 0,
  actualCostUsd: 0,
  latencyMs: Date.now() - startedAt,
  inputTokens: _.toNumber(usage?.prompt_tokens) || 0,
  outputTokens: _.toNumber(usage?.completion_tokens) || 0,
  fallbackIndex,
});
const createProviderError = (data: any, status: number): Error => Object.assign(new Error(_.toString(data?.error?.message || data?.message || status)), { status });
const getModelCooldown = (status: number): number => (status === 429 ? FREE_AI_PROVIDER_CONFIG.MODEL_RATE_LIMIT_COOLDOWN_MS : GEMINI_REQUEST_POLICY.TRANSIENT_COOLDOWN_MS);
const extractTextContents = (contents: unknown): string => {
  if (_.isString(contents)) return _.trim(contents);
  const textParts: string[] = [];
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
    const source = value as Record<string, unknown>;
    if (_.has(source, "inlineData") || _.has(source, "fileData")) return;
    if (_.isString(source.text)) textParts.push(source.text);
    else _.forEach(_.values(source), visit);
  };
  visit(contents);
  return _.trim(_.join(textParts, "\n\n"));
};
const containsMediaPayload = (contents: unknown): boolean => {
  if (_.isArray(contents)) return _.some(contents, containsMediaPayload);
  if (!_.isPlainObject(contents)) return false;
  const source = contents as Record<string, unknown>;
  if (_.has(source, "inlineData") || _.has(source, "fileData")) return true;
  return _.some(_.values(source), containsMediaPayload);
};

const requestModel = async (provider: ProviderCandidate, model: string, request: FreeProviderRequest, fallbackIndex: number): Promise<any> => {
  const startedAt = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FREE_AI_PROVIDER_CONFIG.REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(provider.url, {
      method: "POST",
      headers: { [FREE_AI_PROVIDER_CONFIG.AUTHORIZATION_HEADER]: `${FREE_AI_PROVIDER_CONFIG.BEARER_PREFIX}${provider.apiKey}`, [FREE_AI_PROVIDER_CONFIG.CONTENT_TYPE_HEADER]: FREE_AI_PROVIDER_CONFIG.JSON_CONTENT_TYPE },
      body: jsonUtils.safeStringify(createRequestBody(model, request)),
      signal: controller.signal,
    });
    const data: any = await response.json().catch(() => ({}));
    if (!response.ok) throw createProviderError(data, response.status);
    const text = _.toString(_.get(data, "choices[0].message.content"));
    if (_.isEmpty(_.trim(text))) throw new Error(FREE_AI_PROVIDER_CONFIG.EMPTY_RESPONSE_ERROR);
    const aiMetadata = createMetadata(provider, model, request, fallbackIndex, startedAt, data?.usage);
    return { text, usageMetadata: { promptTokenCount: aiMetadata.inputTokens, candidatesTokenCount: aiMetadata.outputTokens }, aiMetadata, rotationLogs: [] };
  } finally {
    clearTimeout(timeout);
  }
};

export const generateWithFreeProviders = async (request: FreeProviderRequest, keys: FreeProviderKeys): Promise<FreeProviderResult> => {
  const rotationLogs: string[] = [];
  const log = (message: string) => appLogStep(message, rotationLogs);
  const providers = createProviderCandidates(keys, !_.isEmpty(request.config?.tools), request.task?.capability);
  if (_.isEmpty(providers)) {
    log(FREE_AI_PROVIDER_LOGS.NO_KEYS);
    return { rotationLogs };
  }
  if (containsMediaPayload(request.contents)) {
    log(FREE_AI_PROVIDER_LOGS.TOOL_REQUIRED);
    return { rotationLogs };
  }
  const normalizedContents = extractTextContents(request.contents);
  if (_.isEmpty(normalizedContents)) {
    log(FREE_AI_PROVIDER_LOGS.TOOL_REQUIRED);
    return { rotationLogs };
  }
  const normalizedRequest = { ...request, contents: normalizedContents };
  let lastError: any;
  let fallbackIndex = 0;
  for (const provider of providers) {
    const providerCircuitKey = `${provider.id}:provider`;
    if (isCircuitOpen(providerCircuitKey)) continue;
    for (const model of _.take(provider.models, FREE_AI_PROVIDER_CONFIG.MAX_MODELS_PER_PROVIDER)) {
      const circuitKey = `${provider.id}:${model}`;
      if (isCircuitOpen(circuitKey)) continue;
      try {
        log(FREE_AI_PROVIDER_LOGS.CALLING(provider.id, model));
        const response = await requestModel(provider, model, normalizedRequest, fallbackIndex);
        recordModelSuccess(circuitKey);
        recordModelSuccess(providerCircuitKey);
        log(FREE_AI_PROVIDER_LOGS.SUCCESS(provider.id, model));
        response.rotationLogs = rotationLogs;
        return { response, rotationLogs };
      } catch (error: any) {
        lastError = error;
        const status = _.toNumber(error?.status);
        log(FREE_AI_PROVIDER_LOGS.FAILED(provider.id, model, _.toString(error?.message || error)));
        fallbackIndex += 1;
        if (_.includes(FREE_AI_PROVIDER_CONFIG.PROVIDER_BLOCK_STATUSES, status as never)) {
          blockModel(providerCircuitKey, FREE_AI_PROVIDER_CONFIG.PROVIDER_BLOCK_COOLDOWN_MS);
          break;
        }
        blockModel(circuitKey, getModelCooldown(status));
      }
    }
  }
  log(FREE_AI_PROVIDER_LOGS.FALLBACK);
  return { lastError, rotationLogs };
};
