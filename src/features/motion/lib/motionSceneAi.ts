import { MOTION_SCENE_AI } from "../../../constants/motionSceneLibrary.js";
import { CINEMATIC_CHAT_DEFAULT_MODELS, CINEMATIC_CHAT_MODEL_OPTIONS } from "../../../constants/cinematicConstants.js";
import { AiPlanningChatModel, AiPlanningExecutionMode, AiPlanningFallbackProvider } from "../../../types.js";
import type { MotionAiExecution } from "../../../types/motionVideo.js";
export interface MotionAiChoice {
  aiProvider: AiPlanningFallbackProvider;
  aiModel: AiPlanningChatModel;
  aiMode: AiPlanningExecutionMode;
  aiHeadless: boolean;
}
export interface MotionSceneAiChoice {
  sceneAiProvider: AiPlanningFallbackProvider;
  sceneAiModel: AiPlanningChatModel;
  sceneAiHeadless: boolean;
}
export const motionMainAiExecution = (state: MotionAiChoice) => ({ provider: state.aiProvider, model: state.aiModel, mode: state.aiMode, chromeHeadless: state.aiHeadless });
export const resolveMotionSceneExecution = (exec: MotionAiExecution) => {
  const provider = exec.provider && exec.provider !== AiPlanningFallbackProvider.Disabled && Object.hasOwn(CINEMATIC_CHAT_MODEL_OPTIONS, exec.provider) ? (exec.provider as AiPlanningFallbackProvider) : MOTION_SCENE_AI.PRIMARY_PROVIDER;
  const model = CINEMATIC_CHAT_MODEL_OPTIONS[provider].find((option) => option.value === exec.model)?.value || CINEMATIC_CHAT_DEFAULT_MODELS[provider];
  return { provider, model, mode: AiPlanningExecutionMode.RoomOnly, chromeHeadless: exec.chromeHeadless !== false };
};
export const motionSceneAiExecution = (state: MotionAiChoice & Partial<MotionSceneAiChoice>) => resolveMotionSceneExecution({ provider: state.sceneAiProvider || MOTION_SCENE_AI.PRIMARY_PROVIDER, model: state.sceneAiModel || (state.sceneAiProvider ? undefined : MOTION_SCENE_AI.PRIMARY_MODEL), chromeHeadless: state.sceneAiHeadless ?? state.aiHeadless });
