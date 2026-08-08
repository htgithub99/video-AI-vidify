import _ from "lodash";
import { FREE_AI_PROVIDER_CONFIG, FREE_AI_PROVIDER_LOGS, GEMINI_REQUEST_POLICY } from "../../constants/config.js";
import { jsonUtils } from "../../lib/json.js";
import { appLogStep } from "../../lib/logger.js";
import { AiCallMetadata, AiTaskCapability, blockModel, isCircuitOpen, recordModelSuccess } from "./taskRouterService.js";

interface FreeProviderRequest { contents: string | any; config?: any; task?: { capability?: AiTaskCapability }; }
interface FreeProviderResult { response?: any; lastError?: any; rotationLogs: string[]; }
interface ProviderCandidate { id: "cerebras" | "groq"; url: string; apiKey: string; models: readonly string[]; }

const createProviderCandidates = (cerebrasKey: string, groqKey: string): ProviderCandidate[] => _.compact([_.isEmpty(cerebrasKey) ? null : { ...FREE_AI_PROVIDER_CONFIG.CEREBRAS, apiKey: cerebrasKey }, _.isEmpty(groqKey) ? null : { ...FREE_AI_PROVIDER_CONFIG.GROQ, apiKey: groqKey }]) as ProviderCandidate[];
const requestModel = async (provider: ProviderCandidate, model: string, request: FreeProviderRequest, fallbackIndex: number): Promise<any> => {
  const startedAt = Date.now();const controller = new AbortController();const timeout = setTimeout(() => controller.abort(), FREE_AI_PROVIDER_CONFIG.REQUEST_TIMEOUT_MS);
  try {
    const body = { model, messages: [{ role: "user", content: request.contents }], max_tokens: request.config?.maxOutputTokens || FREE_AI_PROVIDER_CONFIG.DEFAULT_MAX_OUTPUT_TOKENS, temperature: request.config?.temperature ?? FREE_AI_PROVIDER_CONFIG.DEFAULT_TEMPERATURE, ...(request.config?.responseMimeType === FREE_AI_PROVIDER_CONFIG.JSON_CONTENT_TYPE ? { response_format: { type: FREE_AI_PROVIDER_CONFIG.JSON_RESPONSE_TYPE } } : {}) };
    const response = await fetch(provider.url, { method: "POST", headers: { [FREE_AI_PROVIDER_CONFIG.AUTHORIZATION_HEADER]: `${FREE_AI_PROVIDER_CONFIG.BEARER_PREFIX}${provider.apiKey}`, [FREE_AI_PROVIDER_CONFIG.CONTENT_TYPE_HEADER]: FREE_AI_PROVIDER_CONFIG.JSON_CONTENT_TYPE }, body: jsonUtils.safeStringify(body), signal: controller.signal });
    const data: any = await response.json().catch(() => ({}));if (!response.ok) throw Object.assign(new Error(_.toString(data?.error?.message || data?.message || response.status)), { status: response.status });
    const text = _.toString(_.get(data, "choices[0].message.content"));if (_.isEmpty(_.trim(text))) throw new Error("empty_provider_response");const usage = data?.usage || {};
    const aiMetadata: AiCallMetadata = { capability: request.task?.capability || AiTaskCapability.TextPlanning, provider: provider.id, model, modelVersion: model, promptVersion: FREE_AI_PROVIDER_CONFIG.PROMPT_VERSION, estimatedCostUsd: 0, actualCostUsd: 0, latencyMs: Date.now() - startedAt, inputTokens: _.toNumber(usage.prompt_tokens) || 0, outputTokens: _.toNumber(usage.completion_tokens) || 0, fallbackIndex };
    return { text, usageMetadata: { promptTokenCount: aiMetadata.inputTokens, candidatesTokenCount: aiMetadata.outputTokens }, aiMetadata, rotationLogs: [] };
  } finally { clearTimeout(timeout); }
};

export const generateWithFreeProviders = async (request: FreeProviderRequest, keys: { cerebrasKey: string; groqKey: string }): Promise<FreeProviderResult> => {
  const rotationLogs: string[] = [];const log = (message: string) => appLogStep(message, rotationLogs);const providers = createProviderCandidates(keys.cerebrasKey, keys.groqKey);
  if (_.isEmpty(providers)) { log(FREE_AI_PROVIDER_LOGS.NO_KEYS);return { rotationLogs }; }
  if (!_.isString(request.contents) || !_.isEmpty(request.config?.tools)) { log(FREE_AI_PROVIDER_LOGS.TOOL_REQUIRED);return { rotationLogs }; }
  let lastError: any;let fallbackIndex = 0;
  for (const provider of providers) { const providerCircuitKey = `${provider.id}:provider`;if (isCircuitOpen(providerCircuitKey)) continue;for (const model of provider.models) { const circuitKey = `${provider.id}:${model}`;if (isCircuitOpen(circuitKey)) continue;try { log(FREE_AI_PROVIDER_LOGS.CALLING(provider.id, model));const response = await requestModel(provider, model, request, fallbackIndex);recordModelSuccess(circuitKey);recordModelSuccess(providerCircuitKey);log(FREE_AI_PROVIDER_LOGS.SUCCESS(provider.id, model));response.rotationLogs = rotationLogs;return { response, rotationLogs }; } catch (error: any) { lastError = error;log(FREE_AI_PROVIDER_LOGS.FAILED(provider.id, model, _.toString(error?.message || error)));fallbackIndex += 1;if (_.includes(FREE_AI_PROVIDER_CONFIG.PROVIDER_BLOCK_STATUSES, _.toNumber(error?.status) as never)) { blockModel(providerCircuitKey, FREE_AI_PROVIDER_CONFIG.PROVIDER_BLOCK_COOLDOWN_MS);break; }blockModel(circuitKey, GEMINI_REQUEST_POLICY.TRANSIENT_COOLDOWN_MS); } } }
  log(FREE_AI_PROVIDER_LOGS.FALLBACK);return { lastError, rotationLogs };
};
