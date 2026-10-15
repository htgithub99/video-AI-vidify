import { encodeClaudeChatModel } from "../constants/claudeChatModels.js";
import { MOTION_SCENE_AI } from "../constants/motionSceneLibrary.js";
import { AiPlanningChatModel, AiPlanningExecutionMode, AiPlanningFallbackProvider } from "../types.js";
export interface MotionAiChoice { aiProvider: AiPlanningFallbackProvider; aiModel: AiPlanningChatModel; aiMode: AiPlanningExecutionMode; aiHeadless: boolean; }
export const motionMainAiExecution = (state: MotionAiChoice) => ({ provider: state.aiProvider, model: state.aiModel, mode: state.aiMode, chromeHeadless: state.aiHeadless });
export const motionSceneAiExecution = (state: MotionAiChoice) => ({
  provider: AiPlanningFallbackProvider.ClaudeChat,
  model: encodeClaudeChatModel(MOTION_SCENE_AI.MODEL, MOTION_SCENE_AI.EFFORT),
  mode: state.aiMode === AiPlanningExecutionMode.ApiOnly ? AiPlanningExecutionMode.RoomOnly : state.aiMode,
  chromeHeadless: state.aiHeadless,
});
