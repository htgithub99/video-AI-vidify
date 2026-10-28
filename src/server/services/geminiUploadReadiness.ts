import type { Page } from "playwright";
import { CHAT_PLANNING_RUNTIME as C } from "../../constants/chatPlanningRuntime.js";
import { attachmentNamesMatch } from './claudeUploadReadiness.js';
import { CINEMATIC_CHAT_PLANNING_CONFIG as CONFIG } from "../../constants/cinematicConstants.js";
import { SOURCE_TEXT_POST } from "../../constants/sourceText.js";
import { observeChatUploads } from "./chatUploadObserver.js";
import type { ChatUploadPolicy } from "./claudeUploadReadiness.js";
import { ChatUploadError } from "./chatUploadRecovery.js";
export const assertGeminiSessionAvailable = (page: Pick<Page, "url">): void => {
  const url = new URL(page.url());
  if (/(^|\.)google\.com$/.test(url.hostname) && url.pathname.startsWith("/sorry/")) {
    throw new ChatUploadError("gemini_user_verification_required – Google yêu cầu xác minh người dùng. Hãy hoàn tất xác minh trong Chrome rồi thử lại.", false);
  }
  if (url.hostname === "accounts.google.com") {
    throw new ChatUploadError("gemini_login_required – Hãy đăng nhập lại Gemini trong Chrome rồi thử lại.", false);
  }
};
export const geminiUploadPolicy: ChatUploadPolicy = {
  scope: CONFIG.GEMINI_UPLOAD_SCOPE_SELECTOR,
  composerAncestor: CONFIG.GEMINI_COMPOSER_ANCESTOR_SELECTOR,
  send: CONFIG.GEMINI_SEND_SELECTOR,
  remove: CONFIG.GEMINI_REMOVE_ATTACHMENT_SELECTOR,
  attachment: CONFIG.GEMINI_ATTACHMENT_SELECTOR,
  busy: CONFIG.GEMINI_UPLOAD_BUSY_SELECTOR,
  errorSelector: CONFIG.GEMINI_UPLOAD_ERROR_SELECTOR,
  ready: '.gem-attachment-content',
  failure: CONFIG.GEMINI_UPLOAD_ERROR_PATTERN,
  failedError: CONFIG.GEMINI_UPLOAD_FAILED_ERROR,
  notReadyError: CONFIG.GEMINI_UPLOAD_NOT_READY_ERROR,
  matchImageNames: true,
  omitImageExtension: true,
  omitAudioExtension: true,
};
export const observeGeminiUploads = (page: Page) =>
  observeChatUploads(page, (request) => {
    const url = new URL(request.url());
    return C.GEMINI_UPLOAD_HOST_PATTERN.test(url.hostname) && C.UPLOAD_PATH_PATTERN.test(url.pathname) && (request.method() === SOURCE_TEXT_POST || request.method() === C.UPLOAD_PUT);
  });

export const verifyGeminiSubmittedFiles = async (page: Page, files: Array<{ name: string; mimeType: string; path?: string }>, initialQueries: number, prompt: string, signal?: AbortSignal, timeoutMs = 15000, waitForSession?: () => Promise<number>): Promise<void> => {
  let deadline = Date.now() + timeoutMs;
  const normalizedPrompt = prompt.replace(/\s+/g, ' ').trim();
  while (Date.now() < deadline) {
    signal?.throwIfAborted();
    deadline += await waitForSession?.() || 0;
    const queries = await page.locator('user-query').evaluateAll((nodes) => nodes.map((node) => ({
      text: (node.textContent || '').replace(/\s+/g, ' ').trim(),
      count: node.querySelectorAll('user-query-file-preview').length,
      labels: Array.from(node.querySelectorAll('user-query-file-preview button[aria-label]')).map((button) => button.getAttribute('aria-label') || ''),
    })));
    if (queries.slice(initialQueries).some((query) => query.text.includes(normalizedPrompt) && query.count === files.length && query.labels.length === files.length && attachmentNamesMatch(query.labels, files, geminiUploadPolicy))) return;
    await page.waitForTimeout(250);
  }
  throw new ChatUploadError('gemini_attachment_submission_unconfirmed – Đã bấm gửi nhưng chưa xác nhận tin nhắn chứa đủ đúng tệp. Không tự gửi lại để tránh trùng yêu cầu.', false);
};
