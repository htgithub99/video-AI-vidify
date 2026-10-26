import type { Page } from "playwright";
import { CHAT_PLANNING_RUNTIME as C } from "../../constants/chatPlanningRuntime.js";
import { CINEMATIC_CHAT_PLANNING_CONFIG as CONFIG } from "../../constants/cinematicConstants.js";
import { SOURCE_TEXT_POST } from "../../constants/sourceText.js";
import { observeChatUploads } from "./chatUploadObserver.js";
import type { ChatUploadPolicy } from "./claudeUploadReadiness.js";
export const geminiUploadPolicy: ChatUploadPolicy = {
  scope: CONFIG.GEMINI_UPLOAD_SCOPE_SELECTOR,
  composerAncestor: CONFIG.GEMINI_COMPOSER_ANCESTOR_SELECTOR,
  send: CONFIG.GEMINI_SEND_SELECTOR,
  remove: CONFIG.GEMINI_REMOVE_ATTACHMENT_SELECTOR,
  attachment: CONFIG.GEMINI_ATTACHMENT_SELECTOR,
  busy: CONFIG.GEMINI_UPLOAD_BUSY_SELECTOR,
  errorSelector: CONFIG.GEMINI_UPLOAD_ERROR_SELECTOR,
  failure: CONFIG.GEMINI_UPLOAD_ERROR_PATTERN,
  failedError: CONFIG.GEMINI_UPLOAD_FAILED_ERROR,
  notReadyError: CONFIG.GEMINI_UPLOAD_NOT_READY_ERROR,
  matchImageNames: true,
  omitImageExtension: true,
};
export const observeGeminiUploads = (page: Page) =>
  observeChatUploads(page, (request) => {
    const url = new URL(request.url());
    return C.GEMINI_UPLOAD_HOST_PATTERN.test(url.hostname) && C.UPLOAD_PATH_PATTERN.test(url.pathname) && (request.method() === SOURCE_TEXT_POST || request.method() === C.UPLOAD_PUT);
  });
