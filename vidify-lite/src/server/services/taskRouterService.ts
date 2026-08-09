import _ from "lodash";
import { AI_TASK_ROUTER_CONFIG, AVAILABLE_MODELS } from "../../constants/index.js";

export enum AiTaskCapability { TextPlanning = "text_planning", ScriptWriting = "script_writing", FactualReview = "factual_review", VisualQa = "visual_qa", AudioQa = "audio_qa", Thumbnail = "thumbnail" }
export interface AiTaskRequest { capability?: AiTaskCapability; estimatedInputTokens: number; maxOutputTokens: number; budgetUsd?: number; }
export type AiProvider = "cerebras" | "groq" | "google";
export interface AiCallMetadata { capability: AiTaskCapability; provider: AiProvider; model: string; modelVersion: string; promptVersion: string; estimatedCostUsd: number; actualCostUsd: number; latencyMs: number; inputTokens: number; outputTokens: number; fallbackIndex: number; }

const circuitState = new Map<string, { failures: number; openedAt?: number; cooldownMs?: number }>();
const supports = (_model: string, _capability: AiTaskCapability): boolean => true;
const estimateCost = (input: number, output: number): number => _.round(
  input / AI_TASK_ROUTER_CONFIG.TOKENS_PER_MILLION * AI_TASK_ROUTER_CONFIG.INPUT_USD_PER_MILLION
  + output / AI_TASK_ROUTER_CONFIG.TOKENS_PER_MILLION * AI_TASK_ROUTER_CONFIG.OUTPUT_USD_PER_MILLION,
  AI_TASK_ROUTER_CONFIG.COST_DECIMAL_PLACES,
);

const createCostExceededError = (estimatedCostUsd: number, budgetUsd: number): Error => new Error(
  AI_TASK_ROUTER_CONFIG.COST_EXCEEDED_TEMPLATE
    .replace("{estimatedCostUsd}", _.toString(estimatedCostUsd))
    .replace("{budgetUsd}", _.toString(budgetUsd)),
);

const createUnsupportedCapabilityError = (capability: AiTaskCapability): Error => new Error(
  AI_TASK_ROUTER_CONFIG.NO_MODEL_TEMPLATE.replace("{capability}", capability),
);

export const isCircuitOpen = (model: string, now = Date.now()): boolean => {
  const state = circuitState.get(model);
  if (!state?.openedAt) return false;
  const cooldownMs = _.defaultTo(state.cooldownMs, AI_TASK_ROUTER_CONFIG.CIRCUIT_COOLDOWN_MS);
  if (now - state.openedAt < cooldownMs) return true;
  circuitState.delete(model);
  return false;
};

export const recordModelSuccess = (model: string): void => {
  circuitState.delete(model);
};

export const recordModelFailure = (model: string): void => {
  const previous = circuitState.get(model) || { failures: 0 };
  const failures = previous.failures + 1;
  const openedAt = failures >= AI_TASK_ROUTER_CONFIG.CIRCUIT_FAILURE_THRESHOLD ? Date.now() : previous.openedAt;
  circuitState.set(model, { failures, openedAt });
};

export const blockModel = (model: string, cooldownMs: number): void => {
  circuitState.set(model, {
    failures: AI_TASK_ROUTER_CONFIG.CIRCUIT_FAILURE_THRESHOLD,
    openedAt: Date.now(),
    cooldownMs,
  });
};

export const routeAiTask = (request: AiTaskRequest) => {
  const capability = request.capability || AiTaskCapability.TextPlanning;
  const maxOutputTokens = request.maxOutputTokens || AI_TASK_ROUTER_CONFIG.DEFAULT_MAX_OUTPUT_TOKENS;
  const estimatedCostUsd = estimateCost(request.estimatedInputTokens, maxOutputTokens);
  const budgetUsd = _.defaultTo(request.budgetUsd, AI_TASK_ROUTER_CONFIG.DEFAULT_BUDGET_USD);
  if (estimatedCostUsd > budgetUsd) throw createCostExceededError(estimatedCostUsd, budgetUsd);
  const models = _.filter(AVAILABLE_MODELS, model => supports(model, capability) && !isCircuitOpen(model));
  if (_.isEmpty(models)) throw createUnsupportedCapabilityError(capability);
  return { capability, models, estimatedCostUsd, maxOutputTokens, promptVersion: AI_TASK_ROUTER_CONFIG.PROMPT_VERSION };
};

export const createAiCallMetadata = (route: ReturnType<typeof routeAiTask>, model: string, fallbackIndex: number, latencyMs: number, usage: any): AiCallMetadata => {
  const inputTokens = _.toNumber(usage?.promptTokenCount) || 0;
  const outputTokens = _.toNumber(usage?.candidatesTokenCount) || 0;
  return {
    capability: route.capability,
    provider: "google",
    model,
    modelVersion: model,
    promptVersion: route.promptVersion,
    estimatedCostUsd: route.estimatedCostUsd,
    actualCostUsd: estimateCost(inputTokens, outputTokens),
    latencyMs,
    inputTokens,
    outputTokens,
    fallbackIndex,
  };
};
