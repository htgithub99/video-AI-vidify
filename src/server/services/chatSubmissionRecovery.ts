import type { Page } from "playwright";
import { CINEMATIC_CHAT_PLANNING_CONFIG as C } from "../../constants/cinematicConstants.js";
import { MOTION_AI_RECOVERY as R } from "../../constants/motionAiRecovery.js";
import { DEEPSEEK_CHAT_CONFIG as D } from "../../constants/deepseekChat.js";
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
  attempted: boolean;
  completed: boolean;
  pending?: ChatPendingSubmission;
}
export const isFinalChatResponseError = (error: unknown): boolean => {
  const message = error instanceof Error ? error.message : String(error);
  return [C.REFUSAL_RESPONSE_ERROR, C.INVALID_JSON_RESPONSE_ERROR, C.PROVIDER_ERROR_RESPONSE_ERROR, C.CLAUDE_RATE_LIMIT_ERROR, C.GROK_RATE_LIMIT_ERROR, D.RATE_LIMIT_ERROR].some((code) => message === code);
};
export const uncertainChatSubmission = (provider: string): Error => Object.assign(new Error(R.UNCERTAIN(provider)), { [R.UNCERTAIN_FLAG]: true });
