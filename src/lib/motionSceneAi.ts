import { MOTION_SCENE_AI } from "../constants/motionSceneLibrary.js";
import { AiPlanningChatModel, AiPlanningExecutionMode, AiPlanningFallbackProvider } from "../types.js";
export interface MotionAiChoice { aiProvider: AiPlanningFallbackProvider; aiModel: AiPlanningChatModel; aiMode: AiPlanningExecutionMode; aiHeadless: boolean; }
export const motionMainAiExecution = (state: MotionAiChoice) => ({ provider: state.aiProvider, model: state.aiModel, mode: state.aiMode, chromeHeadless: state.aiHeadless });
export const motionSceneAiExecution = (state: MotionAiChoice) => ({
  provider: MOTION_SCENE_AI.PRIMARY_PROVIDER,
  model: MOTION_SCENE_AI.PRIMARY_MODEL,
  mode: state.aiMode === AiPlanningExecutionMode.ApiOnly ? AiPlanningExecutionMode.RoomOnly : state.aiMode,
  chromeHeadless: state.aiHeadless,
});
