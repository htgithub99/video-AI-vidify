import _ from "lodash";
import { AiPlanningChatModel, AiPlanningExecutionMode, AiPlanningFallbackProvider, VideoProject } from "../types";
export interface PipelineAiExecutionInput {
  planningFallbackProvider?: AiPlanningFallbackProvider;
  planningChatModel?: AiPlanningChatModel;
  planningExecutionMode?: AiPlanningExecutionMode;
  planningChromeHeadless?: boolean;
}
export interface ResolvedPipelineAiExecution {
  provider: AiPlanningFallbackProvider;
  model: AiPlanningChatModel;
  mode: AiPlanningExecutionMode;
  chromeHeadless: boolean;
}
const resolveEnumValue = <T extends string>(values: T[], ...candidates: unknown[]): T | undefined => _.find(candidates, (candidate): candidate is T => _.includes(values, candidate as T));
const resolveDefaultRoomModel = (provider: AiPlanningFallbackProvider): AiPlanningChatModel => {
  if (_.isEqual(provider, AiPlanningFallbackProvider.GrokChat)) return AiPlanningChatModel.GrokAuto;
  if (_.isEqual(provider, AiPlanningFallbackProvider.ChatGptUi)) return AiPlanningChatModel.ChatGptAuto;
  return AiPlanningChatModel.GeminiFlash;
};
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
  const model = resolveEnumValue(_.values(AiPlanningChatModel), incoming.planningChatModel, savedVisual?.planningChatModel, savedConfig?.planningChatModel) || resolveDefaultRoomModel(provider);
  const chromeHeadless = _.isBoolean(incoming.planningChromeHeadless) ? incoming.planningChromeHeadless : _.isBoolean(savedVisual?.planningChromeHeadless) ? savedVisual.planningChromeHeadless : _.isBoolean(savedConfig?.planningChromeHeadless) ? savedConfig.planningChromeHeadless : true;
  return { provider, model, mode, chromeHeadless };
};
