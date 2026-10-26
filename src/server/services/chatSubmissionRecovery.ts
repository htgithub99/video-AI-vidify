import type { Page } from "playwright";
import { CINEMATIC_CHAT_PLANNING_CONFIG as C } from "../../constants/cinematicConstants.js";
import { MOTION_AI_RECOVERY as R } from "../../constants/motionAiRecovery.js";
import { DEEPSEEK_CHAT_CONFIG as D } from "../../constants/deepseekChat.js";
import { MOTION_PRODUCTION as P } from "../../constants/motionProduction.js";
export interface ChatPendingSubmission {
  page: Page;
  prompt: string;
  initialCount: number;
  initialResponseSnapshots: { identity: string; text: string }[];
  expectedSceneIds: string[];
  completionMarker?: string;
  artifactType?: string;
  requestId?: string;
  responseSelector: string;
  busySelector: string;
  url: string;
}
export interface ChatPlanningSubmission {
  onAttempt?: () => void;
  attempted: boolean;
  completed: boolean;
  abandoned?: boolean;
  pending?: ChatPendingSubmission;
}
export const isChatAttachmentError = (error: unknown): boolean => {
  const message = error instanceof Error ? error.message : String(error);
  return [C.ATTACHMENT_SUBMIT_BLOCKED_ERROR, C.GEMINI_UPLOAD_FAILED_ERROR, C.GEMINI_UPLOAD_NOT_READY_ERROR, C.CHATGPT_UPLOAD_FAILED_ERROR, C.CHATGPT_UPLOAD_NOT_READY_ERROR, C.CHATGPT_UPLOAD_UNAVAILABLE_ERROR, C.CLAUDE_UPLOAD_FAILED_ERROR, C.CLAUDE_UPLOAD_NOT_READY_ERROR, D.UPLOAD_FAILED, D.UPLOAD_NOT_READY].some((code) => message === code) || message.startsWith(C.ATTACHMENT_FALLBACK_ERROR_PREFIX);
};
export const isFinalChatResponseError = (error: unknown): boolean => {
  const message = error instanceof Error ? error.message : String(error);
  return [C.REFUSAL_RESPONSE_ERROR, C.INVALID_JSON_RESPONSE_ERROR, C.PROVIDER_ERROR_RESPONSE_ERROR, C.PROMPT_LIMIT_RESPONSE_ERROR, C.CHATGPT_UPLOAD_UNAVAILABLE_ERROR, C.CHATGPT_RATE_LIMIT_ERROR, C.CLAUDE_RATE_LIMIT_ERROR, C.GROK_RATE_LIMIT_ERROR, D.RATE_LIMIT_ERROR].some((code) => message === code);
};
export const isMotionContentResponseError = (error: unknown): boolean => error instanceof Error && error.message === C.INVALID_JSON_RESPONSE_ERROR;
export const exhaustedMotionRoom = (provider: string): Error => Object.assign(new Error(R.EXHAUSTED(provider)), { [R.EXHAUSTED_FLAG]: true });
export const isTerminalMotionAiError = (error: unknown, signal?: AbortSignal): boolean => !!signal?.aborted || !!(error as Record<string, unknown> | null)?.[R.UNCERTAIN_FLAG] || !!(error as Record<string, unknown> | null)?.[R.EXHAUSTED_FLAG] || !!(error as Record<string, unknown> | null)?.[P.CONTRACT_EXHAUSTED];
export const uncertainChatSubmission = (provider: string): Error => Object.assign(new Error(R.UNCERTAIN(provider)), { [R.UNCERTAIN_FLAG]: true });
