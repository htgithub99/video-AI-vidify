import { CINEMATIC_CHAT_PLANNING_CONFIG } from "../constants/cinematicConstants.js";
import { PROMPT_REFERENCE_DOC, PROMPT_SOURCE_DATA } from "../constants/promptSourceData.js";
import { CHAT_PLANNING_RUNTIME as C } from "../constants/chatPlanningRuntime.js";
import { parseClaudeChatModel } from "../constants/claudeChatModels.js";
import { parseGeminiChatModel } from "../constants/geminiChatModels.js";
import { AiPlanningChatModel } from "../types.js";
import type { Locator } from "playwright";
import { createHash } from "node:crypto";
export const isPlanningChatModel = (value: unknown): value is AiPlanningChatModel => typeof value === C.STRING && (Object.values(AiPlanningChatModel).includes(value as AiPlanningChatModel) || !!parseClaudeChatModel(value) || !!parseGeminiChatModel(value));
export const throwIfPlanningCancelled = (signal?: AbortSignal): void => {
  if (signal?.aborted) throw new Error(CINEMATIC_CHAT_PLANNING_CONFIG.CANCELLED_ERROR);
};
export const planningPromptTransport = (prompt: string, submittedChars: number, requestedLimit?: number, singleMessage = false, separateData = false): { limit: number; parts: string[]; final?: string } => {
  const limit = Math.max(CINEMATIC_CHAT_PLANNING_CONFIG.PROMPT_MIN_MESSAGE_LIMIT, Math.min(CINEMATIC_CHAT_PLANNING_CONFIG.PROMPT_MESSAGE_MAX, Number.isFinite(requestedLimit) ? requestedLimit! : CINEMATIC_CHAT_PLANNING_CONFIG.PROMPT_MESSAGE_LIMIT));
  if (singleMessage) return { limit, parts: [] };
  const capacity = Math.min(CINEMATIC_CHAT_PLANNING_CONFIG.PROMPT_PART_CHARS, limit - CINEMATIC_CHAT_PLANNING_CONFIG.PROMPT_CONTEXT_RESERVE);
  const slices = (text: string): string[] => {
    const parts: string[] = [];
    const size = Math.ceil(text.length / Math.ceil(text.length / (capacity * (1 - CINEMATIC_CHAT_PLANNING_CONFIG.PROMPT_PART_BREAK_WINDOW))));
    for (let start = 0; start < text.length; ) {
      let end = Math.min(text.length, start + size);
      const nextLine = end < text.length ? text.indexOf(CINEMATIC_CHAT_PLANNING_CONFIG.PROMPT_PART_BREAK, end) + 1 : 0;
      const lineEnd = end < text.length ? (nextLine > 0 && nextLine - start <= capacity ? nextLine : text.lastIndexOf(CINEMATIC_CHAT_PLANNING_CONFIG.PROMPT_PART_BREAK, end - 1) + 1) : 0;
      if (lineEnd > start + size * (1 - CINEMATIC_CHAT_PLANNING_CONFIG.PROMPT_PART_BREAK_WINDOW)) end = lineEnd;
      else if (end < text.length && /[\uD800-\uDBFF]/.test(text[end - 1])) end--;
      parts.push(text.slice(start, end));
      start = end;
    }
    return parts;
  };
  const blocks = [...prompt.matchAll(PROMPT_SOURCE_DATA.BLOCK)];
  if (blocks.length && (separateData || submittedChars > limit)) {
    const parts: string[] = [];
    let final = prompt;
    for (const block of blocks) {
      const first = parts.length + 1;
      parts.push(...slices(block[1]).map((chunk) => PROMPT_SOURCE_DATA.OPEN + PROMPT_SOURCE_DATA.NEWLINE + chunk + PROMPT_SOURCE_DATA.NEWLINE + PROMPT_SOURCE_DATA.CLOSE));
      const ref = PROMPT_SOURCE_DATA.REF(first, parts.length);
      final = final.replace(block[0], () => ref);
    }
    if (submittedChars - (prompt.length - final.length) <= limit) return { limit, parts, final };
  }
  return { limit, parts: submittedChars > limit ? slices(prompt) : [] };
};
export const promptReferenceChat = (url: string): string | undefined => url.match(PROMPT_REFERENCE_DOC.CHAT_ID)?.[1];
export const promptReferenceDocs = (prompt: string, sent: ReadonlySet<string> = new Set()): { prompt: string; attachments: { name: string; mimeType: string; buffer: Buffer }[]; keys: string[] } => {
  const attachments: { name: string; mimeType: string; buffer: Buffer }[] = [];
  const keys: string[] = [];
  const next = prompt.replace(PROMPT_REFERENCE_DOC.BLOCK, (_match: string, name: string, body: string) => {
    const key = createHash(PROMPT_REFERENCE_DOC.HASH).update(name).update(body).digest(PROMPT_REFERENCE_DOC.HEX);
    if (sent.has(key)) return PROMPT_REFERENCE_DOC.REF_EARLIER(name);
    keys.push(key);
    attachments.push({ name, mimeType: PROMPT_REFERENCE_DOC.MIME, buffer: Buffer.from(body, PROMPT_REFERENCE_DOC.ENCODING) });
    return PROMPT_REFERENCE_DOC.REF(name);
  });
  return { prompt: next, attachments, keys };
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
