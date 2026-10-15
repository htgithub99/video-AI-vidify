import { CINEMATIC_CHAT_PLANNING_CONFIG } from "../constants/cinematicConstants.js";
import { parseClaudeChatModel } from "../constants/claudeChatModels.js";
import { AiPlanningChatModel } from "../types.js";
export const isPlanningChatModel = (value: unknown): value is AiPlanningChatModel => typeof value === "string" && (Object.values(AiPlanningChatModel).includes(value as AiPlanningChatModel) || !!parseClaudeChatModel(value));
export const throwIfPlanningCancelled = (signal?: AbortSignal): void => {
  if (signal?.aborted) throw new Error(CINEMATIC_CHAT_PLANNING_CONFIG.CANCELLED_ERROR);
};
