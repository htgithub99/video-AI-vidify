import { CINEMATIC_CHAT_MODEL_OPTIONS } from "../constants/cinematicConstants";
import { AiPlanningChatModel, AiPlanningFallbackProvider } from "../types";
const FLOW_VIDEO_DEFAULT_MODELS: Record<AiPlanningFallbackProvider, AiPlanningChatModel> = {
  [AiPlanningFallbackProvider.GeminiChat]: AiPlanningChatModel.GeminiFlash,
  [AiPlanningFallbackProvider.GrokChat]: AiPlanningChatModel.GrokAuto,
  [AiPlanningFallbackProvider.ChatGptUi]: AiPlanningChatModel.ChatGptAuto,
  [AiPlanningFallbackProvider.Disabled]: AiPlanningChatModel.GeminiFlash,
};
export const resolveFlowVideoPlanningModel = (provider: AiPlanningFallbackProvider, model: AiPlanningChatModel | undefined): AiPlanningChatModel => CINEMATIC_CHAT_MODEL_OPTIONS[provider]?.find((option) => option.value === model)?.value ?? FLOW_VIDEO_DEFAULT_MODELS[provider];
