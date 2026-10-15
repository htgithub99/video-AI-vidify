import { CINEMATIC_CHAT_MODEL_OPTIONS, CINEMATIC_CHAT_DEFAULT_MODELS } from "../constants/cinematicConstants";
import { AiPlanningChatModel, AiPlanningFallbackProvider } from "../types";
export const resolveFlowVideoPlanningModel = (provider: AiPlanningFallbackProvider, model: AiPlanningChatModel | undefined): AiPlanningChatModel => CINEMATIC_CHAT_MODEL_OPTIONS[provider]?.find((option) => option.value === model)?.value ?? CINEMATIC_CHAT_DEFAULT_MODELS[provider];
