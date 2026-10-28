import { RUNTIME_TEXT as RT_SERVER } from "../../constants/runtime/server.js";
import { RUNTIME_TEXT as RT_SHARED } from "../../constants/runtime/shared.js";
import type { Page } from "playwright";
import { CHAT_PLANNING_RUNTIME as C } from "../../constants/chatPlanningRuntime.js";
import { attachmentNamesMatch } from "./claudeUploadReadiness.js";
import { CINEMATIC_CHAT_PLANNING_CONFIG as CONFIG } from "../../constants/cinematicConstants.js";
import { SOURCE_TEXT_POST } from "../../constants/sourceText.js";
import { observeChatUploads } from "./chatUploadObserver.js";
import type { ChatUploadPolicy } from "./claudeUploadReadiness.js";
import { ChatUploadError } from "./chatUploadRecovery.js";
export const assertGeminiSessionAvailable = (page: Pick<Page, "url">): void => {
  const url = new URL(page.url());
  if (/(^|\.)google\.com$/.test(url.hostname) && url.pathname.startsWith(RT_SERVER.SORRY_6F4FF7)) {
    throw new ChatUploadError(RT_SERVER.GEMINI_USER_VERIFICATION_REQUIRED_GOOGLE_YEU_CAU_XAC_MINH_NGUOI, false);
  }
  if (url.hostname === RT_SERVER.ACCOUNTS_GOOGLE_COM) {
    throw new ChatUploadError(RT_SERVER.GEMINI_LOGIN_REQUIRED_HAY_DANG_NHAP_LAI_GEMINI_TRONG_CHROME, false);
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
  ready: RT_SERVER.GEM_ATTACHMENT_CONTENT,
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
  const normalizedPrompt = prompt.replace(/\s+/g, RT_SHARED.SYMBOL_36A9E7).trim();
  while (Date.now() < deadline) {
    signal?.throwIfAborted();
    deadline += (await waitForSession?.()) || 0;
    const queries = await page.locator("user-query").evaluateAll(
      (nodes, __runtimePayload) => {
        const { RT_SHARED, RT_SERVER } = __runtimePayload.texts;
        return nodes.map((node) => ({ text: (node.textContent || "").replace(/\s+/g, RT_SHARED.SYMBOL_36A9E7).trim(), count: node.querySelectorAll(RT_SERVER.USER_QUERY_FILE_PREVIEW).length, labels: Array.from(node.querySelectorAll(RT_SERVER.USER_QUERY_FILE_PREVIEW_BUTTON_ARIA_LABEL)).map((button) => button.getAttribute(RT_SERVER.ARIA_LABEL) || "") }));
      },
      { value: undefined, texts: { RT_SHARED: { SYMBOL_36A9E7: RT_SHARED.SYMBOL_36A9E7 }, RT_SERVER: { USER_QUERY_FILE_PREVIEW: RT_SERVER.USER_QUERY_FILE_PREVIEW, USER_QUERY_FILE_PREVIEW_BUTTON_ARIA_LABEL: RT_SERVER.USER_QUERY_FILE_PREVIEW_BUTTON_ARIA_LABEL, ARIA_LABEL: RT_SERVER.ARIA_LABEL } } },
    );
    if (queries.slice(initialQueries).some((query) => query.text.includes(normalizedPrompt) && query.count === files.length && query.labels.length === files.length && attachmentNamesMatch(query.labels, files, geminiUploadPolicy))) return;
    await page.waitForTimeout(250);
  }
  throw new ChatUploadError(RT_SERVER.GEMINI_ATTACHMENT_SUBMISSION_UNCONFIRMED_DA_BAM_GUI_NHUNG_CHUA_XAC, false);
};
