import { CINEMATIC_CHAT_PLANNING_CONFIG } from "../constants/cinematicConstants.js";
import { CHAT_PLANNING_RUNTIME as C } from "../constants/chatPlanningRuntime.js";
import { parseClaudeChatModel } from "../constants/claudeChatModels.js";
import { parseGeminiChatModel } from "../constants/geminiChatModels.js";
import { AiPlanningChatModel } from "../types.js";
import type { Locator } from "playwright";
export const isPlanningChatModel = (value: unknown): value is AiPlanningChatModel => typeof value === C.STRING && (Object.values(AiPlanningChatModel).includes(value as AiPlanningChatModel) || !!parseClaudeChatModel(value) || !!parseGeminiChatModel(value));
export const throwIfPlanningCancelled = (signal?: AbortSignal): void => {
  if (signal?.aborted) throw new Error(CINEMATIC_CHAT_PLANNING_CONFIG.CANCELLED_ERROR);
};
export const planningPromptTransport = (prompt: string, submittedChars: number, requestedLimit?: number, singleMessage = false): { limit: number; parts: string[] } => {
  const limit = Math.max(CINEMATIC_CHAT_PLANNING_CONFIG.PROMPT_MIN_MESSAGE_LIMIT, Math.min(CINEMATIC_CHAT_PLANNING_CONFIG.PROMPT_MESSAGE_LIMIT, Number.isFinite(requestedLimit) ? requestedLimit! : CINEMATIC_CHAT_PLANNING_CONFIG.PROMPT_MESSAGE_LIMIT));
  const parts: string[] = [];
  if (!singleMessage && submittedChars > limit) {
    const size = Math.min(CINEMATIC_CHAT_PLANNING_CONFIG.PROMPT_PART_CHARS, limit - CINEMATIC_CHAT_PLANNING_CONFIG.PROMPT_CONTEXT_RESERVE);
    for (let start = 0; start < prompt.length; ) {
      let end = Math.min(prompt.length, start + size);
      if (end < prompt.length && /[\uD800-\uDBFF]/.test(prompt[end - 1])) end--;
      parts.push(prompt.slice(start, end));
      start = end;
    }
  }
  return { limit, parts };
};
export const readPlanningUi = <T>(task: Promise<T>, signal?: AbortSignal, timeout: number = CINEMATIC_CHAT_PLANNING_CONFIG.UI_READ_TIMEOUT_MS, operation?: string): Promise<T> => {
  throwIfPlanningCancelled(signal);
  return new Promise<T>((resolve, reject) => {
    const finish = (complete: () => void) => {
      clearTimeout(timer);
      signal?.removeEventListener(CINEMATIC_CHAT_PLANNING_CONFIG.UI_ABORT_EVENT, stop);
      complete();
    };
    const stop = () => finish(() => reject(new Error(CINEMATIC_CHAT_PLANNING_CONFIG.CANCELLED_ERROR)));
    const timer = setTimeout(() => finish(() => reject(Object.assign(new Error(CINEMATIC_CHAT_PLANNING_CONFIG.UI_READ_TIMEOUT_ERROR), operation ? { name: CINEMATIC_CHAT_PLANNING_CONFIG.UI_READ_TIMEOUT_NAME(operation) } : {}))), timeout);
    signal?.addEventListener(CINEMATIC_CHAT_PLANNING_CONFIG.UI_ABORT_EVENT, stop, { once: true });
    task.then(
      (value) => finish(() => resolve(value)),
      (error) => finish(() => reject(error)),
    );
  });
};
export const clickPlanningControl = async (control: Locator, signal?: AbortSignal, timeout: number = CINEMATIC_CHAT_PLANNING_CONFIG.MODEL_PICKER_TIMEOUT_MS): Promise<void> => {
  throwIfPlanningCancelled(signal);
  await control.click({ force: true, noWaitAfter: true, timeout });
};
