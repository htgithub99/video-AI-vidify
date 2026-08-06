import _ from "lodash";
import { AVAILABLE_MODELS } from "../../constants/index.js";

export enum AiTaskCapability { TextPlanning = "text_planning", ScriptWriting = "script_writing", FactualReview = "factual_review", VisualQa = "visual_qa", AudioQa = "audio_qa", Thumbnail = "thumbnail" }
export interface AiTaskRequest { capability?: AiTaskCapability; estimatedInputTokens: number; maxOutputTokens: number; budgetUsd?: number; }
export interface AiCallMetadata { capability: AiTaskCapability; provider: "google"; model: string; modelVersion: string; promptVersion: string; estimatedCostUsd: number; actualCostUsd: number; latencyMs: number; inputTokens: number; outputTokens: number; fallbackIndex: number; }

const ROUTER_CONFIG = { DEFAULT_BUDGET_USD: 0.25, CIRCUIT_FAILURE_THRESHOLD: 3, CIRCUIT_COOLDOWN_MS: 60_000, DEFAULT_MAX_OUTPUT_TOKENS: 2048, INPUT_USD_PER_MILLION: 0.5, OUTPUT_USD_PER_MILLION: 2, PROMPT_VERSION: "vidify-baseline-v1" } as const;
const circuitState = new Map<string, { failures: number; openedAt?: number }>();
const supports = (model: string, capability: AiTaskCapability) => _.includes([AiTaskCapability.AudioQa, AiTaskCapability.FactualReview], capability) ? !_.includes(model, "lite") : true;
const estimateCost = (input: number, output: number) => _.round(input / 1_000_000 * ROUTER_CONFIG.INPUT_USD_PER_MILLION + output / 1_000_000 * ROUTER_CONFIG.OUTPUT_USD_PER_MILLION, 6);

export const isCircuitOpen = (model: string, now = Date.now()): boolean => { const state = circuitState.get(model); if (!state?.openedAt) return false; if (now - state.openedAt >= ROUTER_CONFIG.CIRCUIT_COOLDOWN_MS) { circuitState.delete(model); return false; } return true; };
export const recordModelSuccess = (model: string): void => { circuitState.delete(model); };
export const recordModelFailure = (model: string): void => { const previous = circuitState.get(model) || { failures: 0 }; const failures = previous.failures + 1; circuitState.set(model, { failures, openedAt: failures >= ROUTER_CONFIG.CIRCUIT_FAILURE_THRESHOLD ? Date.now() : previous.openedAt }); };
export const routeAiTask = (request: AiTaskRequest) => {
  const capability = request.capability || AiTaskCapability.TextPlanning;
  const maxOutputTokens = request.maxOutputTokens || ROUTER_CONFIG.DEFAULT_MAX_OUTPUT_TOKENS;
  const estimatedCostUsd = estimateCost(request.estimatedInputTokens, maxOutputTokens);
  const budgetUsd = _.defaultTo(request.budgetUsd, ROUTER_CONFIG.DEFAULT_BUDGET_USD);
  if (estimatedCostUsd > budgetUsd) throw new Error(`AI task cost estimate $${estimatedCostUsd} exceeds budget $${budgetUsd}.`);
  const models = _.filter(AVAILABLE_MODELS, model => supports(model, capability) && !isCircuitOpen(model));
  if (_.isEmpty(models)) throw new Error(`No healthy provider/model supports capability ${capability}.`);
  return { capability, models, estimatedCostUsd, maxOutputTokens, promptVersion: ROUTER_CONFIG.PROMPT_VERSION };
};
export const createAiCallMetadata = (route: ReturnType<typeof routeAiTask>, model: string, fallbackIndex: number, latencyMs: number, usage: any): AiCallMetadata => { const inputTokens = _.toNumber(usage?.promptTokenCount) || 0; const outputTokens = _.toNumber(usage?.candidatesTokenCount) || 0; return { capability: route.capability, provider: "google", model, modelVersion: model, promptVersion: route.promptVersion, estimatedCostUsd: route.estimatedCostUsd, actualCostUsd: estimateCost(inputTokens, outputTokens), latencyMs, inputTokens, outputTokens, fallbackIndex }; };
