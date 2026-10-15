import { observeChatUploads } from "./chatUploadObserver.js";
import { CHAT_PLANNING_RUNTIME as C } from "../../constants/chatPlanningRuntime.js";
import * as ST from "../../constants/sourceText.js";
import _ from "lodash";
import type { Locator, Page } from "playwright";
import { CINEMATIC_CHAT_PLANNING_CONFIG as CONFIG } from "../../constants/cinematicConstants.js";
type Attachment = { name: string; mimeType: string; path?: string };
type UploadState = { count: number; labels: string[]; busy: boolean; failed: boolean; sendReady: boolean };
export const getClaudeComposerScope = async (input: Locator): Promise<Locator> => {
  const knownScope = input.locator(C.COMPOSER_ANCESTOR_SELECTOR);
  if (await knownScope.count()) return knownScope;
  let scope = input;
  for (let depth = 0; depth < 12; depth++) {
    scope = scope.locator(ST.SOURCE_TEXT_SYMBOL_38);
    if (await scope.evaluate((node) => node === document.body || node === document.documentElement)) break;
    if (await scope.locator(CONFIG.CLAUDE_SEND_SELECTOR).count()) return scope;
  }
  throw new Error(CONFIG.CLAUDE_UPLOAD_NOT_READY_ERROR);
};
export const readClaudeUploadState = async (input: Locator): Promise<UploadState> =>
  input.evaluate(
    (element, config) => {
      const { ST, C } = config.sharedTexts;
      const dom = {
        visible(node: Element) {
          return node.getClientRects().length > 0 && getComputedStyle(node).visibility !== ST.SOURCE_TEXT_HIDDEN;
        },
        label(node: Element) {
          const parts: string[] = [];
          const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
          while (walker.nextNode()) parts.push(walker.currentNode.textContent || C.EMPTY);
          return [...parts, node.getAttribute(ST.SOURCE_TEXT_ARIA_LABEL), node.getAttribute(ST.SOURCE_TEXT_TITLE), node.getAttribute(C.ALT), ...Array.from(node.querySelectorAll(C.LABEL_ATTRIBUTES_SELECTOR)).flatMap((child) => [child.getAttribute(ST.SOURCE_TEXT_TITLE), child.getAttribute(C.ALT)])].filter(Boolean).join(ST.SOURCE_TEXT_SYMBOL_52);
        },
      };
      let scope = element.closest(config.scope);
      if (!scope) {
        let parent = element.parentElement;
        while (parent && parent !== document.body) {
          if (parent.querySelector(config.send)) {
            scope = parent;
            break;
          }
          parent = parent.parentElement;
        }
      }
      if (!scope) return { count: 0, labels: [], busy: false, failed: false, sendReady: false };
      const removes = Array.from(scope.querySelectorAll(config.remove)).filter(dom.visible);
      const chips = Array.from(scope.querySelectorAll(config.attachment)).filter((node) => dom.visible(node) && !node.querySelector(config.attachment));
      const images = Array.from(scope.querySelectorAll(ST.SOURCE_TEXT_IMG)).filter((node): node is HTMLImageElement => dom.visible(node) && C.UPLOAD_IMAGE_URL_PATTERN.test(node.getAttribute(ST.SOURCE_BROWSER_TEXT_SRC) || C.EMPTY));
      const labels = removes.length ? removes.map((node) => dom.label(node.closest(config.attachment) || node.parentElement || node)) : chips.map(dom.label);
      const statuses = Array.from(scope.querySelectorAll(C.STATUS_SELECTOR)).filter(dom.visible).map(dom.label).join(ST.SOURCE_TEXT_SYMBOL_52);
      const busy = Array.from(scope.querySelectorAll(config.busy)).some(dom.visible) || C.UPLOAD_BUSY_TEXT_PATTERN.test(statuses) || images.some((img) => !img.complete || !img.naturalWidth);
      const explicitError = Array.from(scope.querySelectorAll(C.UPLOAD_ERROR_SELECTOR)).some(dom.visible);
      const alerts = Array.from(document.querySelectorAll(ST.SOURCE_TEXT_ROLE_ALERT)).filter(dom.visible);
      const failed = explicitError || alerts.some((node) => config.failure.test(dom.label(node))) || labels.some((text) => config.failure.test(text));
      const sendReady = Array.from(scope.querySelectorAll(config.send)).some((node) => dom.visible(node) && !node.hasAttribute(ST.SOURCE_BROWSER_TEXT_DISABLED) && node.getAttribute(ST.SOURCE_TEXT_ARIA_DISABLED) !== ST.SOURCE_TEXT_TRUE);
      return { count: Math.max(removes.length, chips.length, images.length), labels, busy, failed, sendReady };
    },
    {
      scope: CONFIG.CLAUDE_UPLOAD_SCOPE_SELECTOR,
      send: CONFIG.CLAUDE_SEND_SELECTOR,
      remove: CONFIG.CLAUDE_REMOVE_ATTACHMENT_SELECTOR,
      attachment: CONFIG.CLAUDE_ATTACHMENT_SELECTOR,
      busy: CONFIG.CLAUDE_UPLOAD_BUSY_SELECTOR,
      failure: CONFIG.CLAUDE_UPLOAD_ERROR_PATTERN,
      sharedTexts: {
        ST: {
          SOURCE_TEXT_HIDDEN: ST.SOURCE_TEXT_HIDDEN,
          SOURCE_TEXT_ARIA_LABEL: ST.SOURCE_TEXT_ARIA_LABEL,
          SOURCE_TEXT_TITLE: ST.SOURCE_TEXT_TITLE,
          SOURCE_TEXT_SYMBOL_52: ST.SOURCE_TEXT_SYMBOL_52,
          SOURCE_TEXT_IMG: ST.SOURCE_TEXT_IMG,
          SOURCE_BROWSER_TEXT_SRC: ST.SOURCE_BROWSER_TEXT_SRC,
          SOURCE_TEXT_ROLE_ALERT: ST.SOURCE_TEXT_ROLE_ALERT,
          SOURCE_BROWSER_TEXT_DISABLED: ST.SOURCE_BROWSER_TEXT_DISABLED,
          SOURCE_TEXT_ARIA_DISABLED: ST.SOURCE_TEXT_ARIA_DISABLED,
          SOURCE_TEXT_TRUE: ST.SOURCE_TEXT_TRUE,
        },
        C: { EMPTY: C.EMPTY, ALT: C.ALT, LABEL_ATTRIBUTES_SELECTOR: C.LABEL_ATTRIBUTES_SELECTOR, STATUS_SELECTOR: C.STATUS_SELECTOR, UPLOAD_ERROR_SELECTOR: C.UPLOAD_ERROR_SELECTOR, UPLOAD_IMAGE_URL_PATTERN: C.UPLOAD_IMAGE_URL_PATTERN, UPLOAD_BUSY_TEXT_PATTERN: C.UPLOAD_BUSY_TEXT_PATTERN },
      },
    },
  );
export const observeClaudeUploads = (page: Page) =>
  observeChatUploads(page, (request) => {
    const url = new URL(request.url());
    const contentType = request.headers()[ST.SOURCE_TEXT_CONTENT_TYPE_2] || C.EMPTY;
    return url.hostname === C.CLAUDE_HOST && request.method() === ST.SOURCE_TEXT_POST && (C.UPLOAD_PATH_PATTERN.test(url.pathname) || C.MULTIPART_PATTERN.test(contentType));
  });
type UploadObservation = Pick<ReturnType<typeof observeClaudeUploads>, "state">;
export const waitForClaudeUploads = async (input: Locator, attachments: Attachment[], timeoutMs: number, signal?: AbortSignal, observation?: UploadObservation, stableMs = CONFIG.CLAUDE_UPLOAD_STABLE_MS, requireSendReady = false): Promise<void> => {
  const deadline = Date.now() + timeoutMs;
  let readySince = 0;
  const normalize = (value: string) => value.normalize(ST.SOURCE_TEXT_NFC).toLowerCase();
  const expected = attachments.map((attachment) => ({ name: normalize(attachment.path?.split(/[\\/]/).pop() || attachment.name), image: attachment.mimeType.startsWith(ST.SOURCE_TEXT_IMAGE_2) }));
  while (Date.now() < deadline) {
    signal?.throwIfAborted();
    const state = await readClaudeUploadState(input);
    const network = observation?.state();
    if (state.failed || network?.failed) throw new Error(CONFIG.CLAUDE_UPLOAD_FAILED_ERROR);
    const names = state.labels.map(normalize);
    const namesMatch = expected.every((item) => {
      if (item.image) return true;
      const filename = new RegExp(C.FILENAME_PATTERN(_.escapeRegExp(item.name)), ST.SOURCE_TEXT_U_2);
      const index = names.findIndex((label) => filename.test(label));
      if (index < 0) return false;
      names.splice(index, 1);
      return true;
    });
    if (state.count === attachments.length && namesMatch && !state.busy && (!requireSendReady || state.sendReady) && !network?.pending) {
      if (!readySince) readySince = Date.now();
      if (Date.now() - readySince >= stableMs) {
        signal?.throwIfAborted();
        return;
      }
    } else readySince = 0;
    await new Promise<void>((resolve, reject) => {
      const cancel = () => {
        clearTimeout(timer);
        signal?.removeEventListener(ST.SOURCE_TEXT_ABORT, cancel);
        reject(signal?.reason || new Error(CONFIG.CANCELLED_ERROR));
      };
      const timer = setTimeout(
        () => {
          signal?.removeEventListener(ST.SOURCE_TEXT_ABORT, cancel);
          resolve();
        },
        Math.min(CONFIG.SUBMISSION_POLL_MS, Math.max(1, deadline - Date.now())),
      );
      signal?.addEventListener(ST.SOURCE_TEXT_ABORT, cancel, { once: true });
      if (signal?.aborted) cancel();
    });
  }
  throw new Error(CONFIG.CLAUDE_UPLOAD_NOT_READY_ERROR);
};
