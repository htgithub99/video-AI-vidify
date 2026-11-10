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
export interface MotionPlanAiChoice {
  planAiProvider?: AiPlanningFallbackProvider;
  planAiModel?: AiPlanningChatModel;
  planAiHeadless?: boolean;
  planAiFallback?: boolean;
}
export interface MotionLightAiChoice {
  lightAiProvider?: AiPlanningFallbackProvider;
  lightAiModel?: AiPlanningChatModel;
  lightAiHeadless?: boolean;
  lightAiFallback?: boolean;
}
export const motionLightAiExecution = (state: MotionAiChoice & MotionLightAiChoice) => {
  const provider = state.lightAiProvider && state.lightAiProvider !== AiPlanningFallbackProvider.Disabled && Object.hasOwn(CINEMATIC_CHAT_MODEL_OPTIONS, state.lightAiProvider) ? state.lightAiProvider : state.aiProvider;
  const requested = state.lightAiProvider ? state.lightAiModel : state.aiModel;
  const model = CINEMATIC_CHAT_MODEL_OPTIONS[provider]?.find((option) => option.value === requested)?.value || CINEMATIC_CHAT_DEFAULT_MODELS[provider] || requested;
  return { provider, model, chromeHeadless: state.lightAiHeadless ?? state.aiHeadless, allowFallback: (state.lightAiFallback ?? state.aiFallback) !== false };
};
export const motionPlanAiExecution = (state: MotionAiChoice & MotionPlanAiChoice) => {
  const provider = state.planAiProvider && state.planAiProvider !== AiPlanningFallbackProvider.Disabled && Object.hasOwn(CINEMATIC_CHAT_MODEL_OPTIONS, state.planAiProvider) ? state.planAiProvider : state.aiProvider;
  const requested = state.planAiProvider ? state.planAiModel : state.aiModel;
  const model = CINEMATIC_CHAT_MODEL_OPTIONS[provider]?.find((option) => option.value === requested)?.value || CINEMATIC_CHAT_DEFAULT_MODELS[provider] || requested;
  return { provider, model, mode: AiPlanningExecutionMode.RoomOnly, chromeHeadless: state.planAiHeadless ?? state.aiHeadless, allowFallback: (state.planAiFallback ?? state.aiFallback) !== false };
};
export const motionMainAiExecution = (state: MotionAiChoice & MotionLightAiChoice) => ({ provider: state.aiProvider, model: state.aiModel, mode: state.aiMode, chromeHeadless: state.aiHeadless, allowFallback: state.aiFallback !== false, ...(state.lightAiProvider ? { light: motionLightAiExecution(state) } : {}) });
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
