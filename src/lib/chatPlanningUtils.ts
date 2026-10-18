import { CINEMATIC_CHAT_PLANNING_CONFIG } from "../constants/cinematicConstants.js";
import { CHAT_PLANNING_RUNTIME as C } from "../constants/chatPlanningRuntime.js";
import { parseClaudeChatModel } from "../constants/claudeChatModels.js";
import { parseGeminiChatModel } from "../constants/geminiChatModels.js";
import { AiPlanningChatModel } from "../types.js";
export const isPlanningChatModel = (value: unknown): value is AiPlanningChatModel => typeof value === C.STRING && (Object.values(AiPlanningChatModel).includes(value as AiPlanningChatModel) || !!parseClaudeChatModel(value) || !!parseGeminiChatModel(value));
export const throwIfPlanningCancelled = (signal?: AbortSignal): void => {
  if (signal?.aborted) throw new Error(CINEMATIC_CHAT_PLANNING_CONFIG.CANCELLED_ERROR);
};
