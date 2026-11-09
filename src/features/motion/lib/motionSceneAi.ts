import { MOTION_SCENE_AI } from "../../../constants/motionSceneLibrary.js";
import { CINEMATIC_CHAT_DEFAULT_MODELS, CINEMATIC_CHAT_MODEL_OPTIONS } from "../../../constants/cinematicConstants.js";
import { AiPlanningChatModel, AiPlanningExecutionMode, AiPlanningFallbackProvider } from "../../../types.js";
import type { MotionAiExecution } from "../../../types/motionVideo.js";
import type { MotionVisualSettings } from "../../../types/motionVisual.js";
export interface MotionAiChoice {
  aiProvider: AiPlanningFallbackProvider;
  aiModel: AiPlanningChatModel;
  aiMode: AiPlanningExecutionMode;
  aiHeadless: boolean;
  aiFallback?: boolean;
}
export interface MotionSceneAiChoice {
  sceneAiProvider: AiPlanningFallbackProvider;
  sceneAiModel: AiPlanningChatModel;
  sceneAiHeadless: boolean;
  sceneAiFallback?: boolean;
  sceneMultiRooms?: boolean;
}
export const motionMainAiExecution = (state: MotionAiChoice) => ({ provider: state.aiProvider, model: state.aiModel, mode: state.aiMode, chromeHeadless: state.aiHeadless, allowFallback: state.aiFallback !== false });
export const resolveMotionSceneExecution = (exec: MotionAiExecution) => {
  const provider = exec.provider && exec.provider !== AiPlanningFallbackProvider.Disabled && Object.hasOwn(CINEMATIC_CHAT_MODEL_OPTIONS, exec.provider) ? (exec.provider as AiPlanningFallbackProvider) : MOTION_SCENE_AI.PRIMARY_PROVIDER;
  const model = CINEMATIC_CHAT_MODEL_OPTIONS[provider].find((option) => option.value === exec.model)?.value || CINEMATIC_CHAT_DEFAULT_MODELS[provider];
  return {
    provider,
    model,
    mode: AiPlanningExecutionMode.RoomOnly,
    chromeHeadless: exec.chromeHeadless !== false,
    allowFallback: exec.allowFallback !== false,
    ...(exec.multiSceneRooms === false ? { multiSceneRooms: false } : {}),
  };
};
export const motionSceneAiExecution = (state: MotionAiChoice & Partial<MotionSceneAiChoice> & { visualSettings?: MotionVisualSettings }) =>
  resolveMotionSceneExecution({ provider: state.sceneAiProvider || MOTION_SCENE_AI.PRIMARY_PROVIDER, model: state.sceneAiModel || (state.sceneAiProvider ? undefined : MOTION_SCENE_AI.PRIMARY_MODEL), chromeHeadless: state.sceneAiHeadless ?? state.aiHeadless, allowFallback: state.sceneAiFallback !== false, multiSceneRooms: state.sceneMultiRooms !== false });
