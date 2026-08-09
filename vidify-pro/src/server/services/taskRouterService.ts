import _ from "lodash";
import { AVAILABLE_MODELS } from "../../constants/index.js";
export enum AiTaskCapability {
  TextPlanning = "text_planning",
  ScriptWriting = "script_writing",
  FactualReview = "factual_review",
  VisualQa = "visual_qa",
  AudioQa = "audio_qa",
  Thumbnail = "thumbnail",
}
export interface AiTaskRequest {
  capability?: AiTaskCapability;
  estimatedInputTokens: number;
  maxOutputTokens: number;
  budgetUsd?: number;
}
export type AiProvider = "cerebras" | "groq" | "google";
export interface AiCallMetadata {
  capability: AiTaskCapability;
  provider: AiProvider;
  model: string;
  modelVersion: string;
  promptVersion: string;
  estimatedCostUsd: number;
  actualCostUsd: number;
  latencyMs: number;
  inputTokens: number;
  outputTokens: number;
  fallbackIndex: number;
}
const CONFIG = {
  DEFAULT_BUDGET_USD: 0.25,
  CIRCUIT_FAILURE_THRESHOLD: 3,
  CIRCUIT_COOLDOWN_MS: 300000,
  DEFAULT_MAX_OUTPUT_TOKENS: 2048,
  INPUT_USD_PER_MILLION: 0.5,
  OUTPUT_USD_PER_MILLION: 2,
  PROMPT_VERSION: "vidify-baseline-v2",
} as const;
const states = new Map<
  string,
  { failures: number; openedAt?: number; cooldownMs?: number }
>();
const supports = (_model: string, _capability: AiTaskCapability): boolean =>
  true;
const cost = (input: number, output: number) =>
  _.round(
    (input / 1e6) * CONFIG.INPUT_USD_PER_MILLION +
      (output / 1e6) * CONFIG.OUTPUT_USD_PER_MILLION,
    6,
  );
export const isCircuitOpen = (model: string, now = Date.now()): boolean => {
  const state = states.get(model);
  if (!state?.openedAt) return false;
  if (
    now - state.openedAt >=
    _.defaultTo(state.cooldownMs, CONFIG.CIRCUIT_COOLDOWN_MS)
  ) {
    states.delete(model);
    return false;
  }
  return true;
};
export const recordModelSuccess = (model: string): void => {
  states.delete(model);
};
export const recordModelFailure = (model: string): void => {
  const previous = states.get(model) || { failures: 0 };
  const failures = previous.failures + 1;
  states.set(model, {
    failures,
    openedAt:
      failures >= CONFIG.CIRCUIT_FAILURE_THRESHOLD
        ? Date.now()
        : previous.openedAt,
  });
};
export const blockModel = (model: string, cooldownMs: number): void => {
  states.set(model, {
    failures: CONFIG.CIRCUIT_FAILURE_THRESHOLD,
    openedAt: Date.now(),
    cooldownMs,
  });
};
export const routeAiTask = (request: AiTaskRequest) => {
  const capability = request.capability || AiTaskCapability.TextPlanning;
  const maxOutputTokens =
    request.maxOutputTokens || CONFIG.DEFAULT_MAX_OUTPUT_TOKENS;
  const estimatedCostUsd = cost(request.estimatedInputTokens, maxOutputTokens);
  const budgetUsd = _.defaultTo(request.budgetUsd, CONFIG.DEFAULT_BUDGET_USD);
  if (estimatedCostUsd > budgetUsd)
    throw new Error(
      `AI task cost estimate $${estimatedCostUsd} exceeds budget $${budgetUsd}.`,
    );
  const models = _.filter(
    AVAILABLE_MODELS,
    (model) => supports(model, capability) && !isCircuitOpen(model),
  );
  if (_.isEmpty(models))
    throw new Error(
      `No healthy provider/model supports capability ${capability}.`,
    );
  return {
    capability,
    models,
    estimatedCostUsd,
    maxOutputTokens,
    promptVersion: CONFIG.PROMPT_VERSION,
  };
};
export const createAiCallMetadata = (
  route: ReturnType<typeof routeAiTask>,
  model: string,
  fallbackIndex: number,
  latencyMs: number,
  usage: any,
): AiCallMetadata => {
  const inputTokens = _.toNumber(usage?.promptTokenCount) || 0;
  const outputTokens = _.toNumber(usage?.candidatesTokenCount) || 0;
  return {
    capability: route.capability,
    provider: "google",
    model,
    modelVersion: model,
    promptVersion: route.promptVersion,
    estimatedCostUsd: route.estimatedCostUsd,
    actualCostUsd: cost(inputTokens, outputTokens),
    latencyMs,
    inputTokens,
    outputTokens,
    fallbackIndex,
  };
};
