import type { Locator, Page } from "playwright";
import { CHAT_PLANNING_RUNTIME as C } from "../../constants/chatPlanningRuntime.js";
import { CINEMATIC_CHAT_PLANNING_CONFIG as CONFIG } from "../../constants/cinematicConstants.js";
import { SOURCE_TEXT_INPUT_TYPE_FILE, SOURCE_TEXT_POST } from "../../constants/sourceText.js";
import { observeChatUploads } from "./chatUploadObserver.js";
import { getClaudeComposerScope, type ChatUploadPolicy } from "./claudeUploadReadiness.js";
export const chatGptUploadPolicy: ChatUploadPolicy = {
  scope: CONFIG.CHATGPT_UPLOAD_SCOPE_SELECTOR,
  send: CONFIG.CHATGPT_SEND_SELECTOR,
  remove: CONFIG.CHATGPT_REMOVE_ATTACHMENT_SELECTOR,
  attachment: CONFIG.CHATGPT_ATTACHMENT_SELECTOR,
  busy: CONFIG.CLAUDE_UPLOAD_BUSY_SELECTOR,
  failure: CONFIG.CLAUDE_UPLOAD_ERROR_PATTERN,
  failedError: CONFIG.CHATGPT_UPLOAD_FAILED_ERROR,
  notReadyError: CONFIG.CHATGPT_UPLOAD_NOT_READY_ERROR,
};
export const observeChatGptUploads = (page: Page) => observeChatUploads(page, (request) => C.UPLOAD_PATH_PATTERN.test(new URL(request.url()).pathname) && (request.method() === SOURCE_TEXT_POST || request.method() === C.UPLOAD_PUT));
export const assertChatGptUploadsAvailable = async (input: Locator): Promise<void> => {
  const scope = await getClaudeComposerScope(input, chatGptUploadPolicy);
  const inputs = scope.locator(SOURCE_TEXT_INPUT_TYPE_FILE);
  if ((await inputs.count()) && !(await inputs.evaluateAll((nodes) => nodes.some((node) => !(node as HTMLInputElement).disabled)))) throw new Error(CONFIG.CHATGPT_UPLOAD_UNAVAILABLE_ERROR);
};
