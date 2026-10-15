import _ from "lodash";
import { CLAUDE_CHAT_MODEL_OPTIONS } from "../constants/claudeChatModels";
import { DEEPSEEK_CHAT_MODES } from "../constants/deepseekChat";
import { CINEMATIC_CHAT_DEFAULT_MODELS } from "../constants/cinematicConstants";
import { AiPlanningChatModel, AiPlanningExecutionMode, AiPlanningFallbackProvider, VideoProject } from "../types";
export interface PipelineAiExecutionInput { planningFallbackProvider?: AiPlanningFallbackProvider; planningChatModel?: AiPlanningChatModel; planningExecutionMode?: AiPlanningExecutionMode; planningChromeHeadless?: boolean; }
export interface ResolvedPipelineAiExecution { provider: AiPlanningFallbackProvider; model: AiPlanningChatModel; mode: AiPlanningExecutionMode; chromeHeadless: boolean; }
const resolveEnumValue = <T extends string>(values: T[], ...candidates: unknown[]): T | undefined => _.find(candidates, (candidate): candidate is T => _.includes(values, candidate as T));
export const resolvePipelineAiExecution = (incoming: PipelineAiExecutionInput, savedProject: VideoProject | null | undefined, isCinematicPipeline: boolean): ResolvedPipelineAiExecution => {
  const savedVisual = savedProject?.visualConfig;
  const savedConfig = savedProject?.config;
  let provider = resolveEnumValue(_.values(AiPlanningFallbackProvider), incoming.planningFallbackProvider, savedVisual?.planningFallbackProvider, savedConfig?.planningFallbackProvider);
  const savedMode = resolveEnumValue(_.values(AiPlanningExecutionMode), savedVisual?.planningExecutionMode, savedConfig?.planningExecutionMode);
  const mode = resolveEnumValue(_.values(AiPlanningExecutionMode), incoming.planningExecutionMode) || savedMode || (provider && !_.isEqual(provider, AiPlanningFallbackProvider.Disabled) ? AiPlanningExecutionMode.RoomOnly : isCinematicPipeline ? AiPlanningExecutionMode.RoomOnly : AiPlanningExecutionMode.ApiOnly);
  if (_.isEqual(mode, AiPlanningExecutionMode.RoomOnly) && (!provider || _.isEqual(provider, AiPlanningFallbackProvider.Disabled))) {
    provider = resolveEnumValue(_.values(AiPlanningFallbackProvider), savedVisual?.planningFallbackProvider, savedConfig?.planningFallbackProvider) || AiPlanningFallbackProvider.GeminiChat;
    if (_.isEqual(provider, AiPlanningFallbackProvider.Disabled)) provider = AiPlanningFallbackProvider.GeminiChat;
  }
  provider ||= AiPlanningFallbackProvider.Disabled;
  const availableModels = provider === AiPlanningFallbackProvider.ClaudeChat ? CLAUDE_CHAT_MODEL_OPTIONS.map((option) => option.value) : provider === AiPlanningFallbackProvider.DeepSeekChat ? DEEPSEEK_CHAT_MODES.map((option) => option.value) : _.values(AiPlanningChatModel);
  const model = resolveEnumValue(availableModels, incoming.planningChatModel, savedVisual?.planningChatModel, savedConfig?.planningChatModel) || CINEMATIC_CHAT_DEFAULT_MODELS[provider];
  const chromeHeadless = _.isBoolean(incoming.planningChromeHeadless) ? incoming.planningChromeHeadless : _.isBoolean(savedVisual?.planningChromeHeadless) ? savedVisual.planningChromeHeadless : _.isBoolean(savedConfig?.planningChromeHeadless) ? savedConfig.planningChromeHeadless : true;
  return { provider, model, mode, chromeHeadless };
};
