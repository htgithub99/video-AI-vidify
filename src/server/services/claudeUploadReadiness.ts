import { RUNTIME_TEXT as RT_SERVER } from "../../constants/runtime/server.js";
import { RUNTIME_TEXT as RT_SHARED } from "../../constants/runtime/shared.js";
import { observeChatUploads } from "./chatUploadObserver.js";
import { CHAT_PLANNING_RUNTIME as C } from "../../constants/chatPlanningRuntime.js";
import * as ST from "../../constants/sourceText.js";
import _ from "lodash";
import type { Locator, Page } from "playwright";
import { CINEMATIC_CHAT_PLANNING_CONFIG as CONFIG } from "../../constants/cinematicConstants.js";
import { uploadFailure } from "./chatUploadRecovery.js";
type Attachment = { name: string; mimeType: string; path?: string };
export type UploadState = { count: number; labels: string[]; files: Array<{ label: string; busy: boolean; failed: boolean; ready: boolean }>; busy: boolean; failed: boolean; sendReady: boolean; readyCount: number; busyCount: number; failedCount: number; errorMessage?: string };
export type ChatUploadPolicy = { scope: string; send: string; remove: string; attachment: string; busy: string; failure: RegExp; failedError: string; notReadyError: string; composerAncestor?: string; errorSelector?: string; ready?: string; matchImageNames?: boolean; omitImageExtension?: boolean; omitAudioExtension?: boolean };
const claudePolicy: ChatUploadPolicy = {
  scope: CONFIG.CLAUDE_UPLOAD_SCOPE_SELECTOR,
  send: CONFIG.CLAUDE_SEND_SELECTOR,
  remove: CONFIG.CLAUDE_REMOVE_ATTACHMENT_SELECTOR,
  attachment: CONFIG.CLAUDE_ATTACHMENT_SELECTOR,
  busy: CONFIG.CLAUDE_UPLOAD_BUSY_SELECTOR,
  failure: CONFIG.CLAUDE_UPLOAD_ERROR_PATTERN,
  failedError: CONFIG.CLAUDE_UPLOAD_FAILED_ERROR,
  notReadyError: CONFIG.CLAUDE_UPLOAD_NOT_READY_ERROR,
};
export const getClaudeComposerScope = async (input: Locator, policy: ChatUploadPolicy = claudePolicy): Promise<Locator> => {
  const knownScope = input.locator(policy.composerAncestor || C.COMPOSER_ANCESTOR_SELECTOR);
  if (await knownScope.count()) return knownScope;
  let scope = input;
  for (let depth = 0; depth < 12; depth++) {
    scope = scope.locator(ST.SOURCE_TEXT_SYMBOL_38);
    if (await scope.evaluate((node) => node === document.body || node === document.documentElement)) break;
    if (await scope.locator(policy.send).count()) return scope;
  }
  throw new Error(policy.notReadyError);
};
export const readClaudeUploadState = async (input: Locator, policy: ChatUploadPolicy = claudePolicy): Promise<UploadState> =>
  input.evaluate(
    (element, __runtimePayload) => {
      const { RT_SERVER, RT_SHARED } = __runtimePayload.texts;
      const config = __runtimePayload.value;
      const { ST, C } = config.sharedTexts;
      const dom = {
        visible(node: Element) {
          return node.getClientRects().length > 0 && getComputedStyle(node).visibility !== ST.SOURCE_TEXT_HIDDEN;
        },
        has(node: Element, selector: string) {
          return node.matches(selector) || Array.from(node.querySelectorAll(selector)).some(dom.visible);
        },
        label(node: Element) {
          const parts: string[] = [];
          const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
          while (walker.nextNode()) parts.push(walker.currentNode.textContent || C.EMPTY);
          const labelledNodes = [node, ...Array.from(node.querySelectorAll(RT_SERVER.ARIA_LABEL_TITLE_ALT_ARIA_DESCRIBEDBY))];
          return (
            [
              ...parts,
              ...labelledNodes.flatMap(
                (child) =>
                  [
                    child.getAttribute(ST.SOURCE_TEXT_ARIA_LABEL),
                    child.getAttribute(ST.SOURCE_TEXT_TITLE),
                    child.getAttribute(C.ALT),
                    ...(child.getAttribute(RT_SERVER.ARIA_DESCRIBEDBY) || "")
                      .split(/\s+/)
                      .filter(Boolean)
                      .map((id) => document.getElementById(id)?.textContent),
                  ] as string[],
              ),
            ] as string[]
          )
            .filter(Boolean)
            .join(ST.SOURCE_TEXT_SYMBOL_52);
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
      if (!scope) return { count: 0, labels: [], files: [], busy: false, failed: false, sendReady: false, readyCount: 0, busyCount: 0, failedCount: 0 };
      const removes = Array.from(scope.querySelectorAll(config.remove)).filter(dom.visible);
      const chips = Array.from(scope.querySelectorAll(config.attachment)).filter((node) => dom.visible(node) && !node.querySelector(config.attachment));
      const images = Array.from(scope.querySelectorAll(ST.SOURCE_TEXT_IMG)).filter((node): node is HTMLImageElement => dom.visible(node) && C.UPLOAD_IMAGE_URL_PATTERN.test(node.getAttribute(ST.SOURCE_BROWSER_TEXT_SRC) || C.EMPTY));
      const labels = chips.length ? chips.map(dom.label) : removes.map((node) => dom.label(node.closest(config.attachment) || node.parentElement || node));
      const fileStates = chips.map((node) => {
        const busy = dom.has(node, config.busy);
        const failed = dom.has(node, config.errorSelector) || config.failure.test(dom.label(node));
        return { label: dom.label(node), busy, failed, ready: !busy && !failed && (!config.ready || dom.has(node, config.ready)) };
      });
      const statuses = Array.from(scope.querySelectorAll(C.STATUS_SELECTOR)).filter(dom.visible).map(dom.label).join(ST.SOURCE_TEXT_SYMBOL_52);
      const busy = Array.from(scope.querySelectorAll(config.busy)).some(dom.visible) || C.UPLOAD_BUSY_TEXT_PATTERN.test(statuses) || images.some((img) => !img.complete || !img.naturalWidth);
      const errorNodes = Array.from(scope.querySelectorAll(config.errorSelector)).filter(dom.visible);
      const explicitError = errorNodes.length > 0;
      const alerts = Array.from(document.querySelectorAll(ST.SOURCE_TEXT_ROLE_ALERT)).filter(dom.visible);
      const failed = explicitError || alerts.some((node) => config.failure.test(dom.label(node))) || labels.some((text) => config.failure.test(text));
      const sendReady = Array.from(scope.querySelectorAll(config.send)).some((node) => dom.visible(node) && !node.hasAttribute(ST.SOURCE_BROWSER_TEXT_DISABLED) && node.getAttribute(ST.SOURCE_TEXT_ARIA_DISABLED) !== ST.SOURCE_TEXT_TRUE);
      const errorMessage = [...errorNodes, ...alerts.filter((node) => config.failure.test(dom.label(node)))].map(dom.label).filter(Boolean).join(RT_SHARED.SYMBOL_36A9E7).slice(0, 400);
      return { count: Math.max(removes.length, chips.length, images.length), labels, files: fileStates, busy, failed, sendReady, errorMessage, readyCount: chips.length ? fileStates.filter((file) => file.ready).length : !config.ready && !busy && !failed ? labels.length : 0, busyCount: fileStates.filter((file) => file.busy).length, failedCount: fileStates.filter((file) => file.failed).length };
    },
    {
      value: {
        scope: policy.scope,
        send: policy.send,
        remove: policy.remove,
        attachment: policy.attachment,
        busy: policy.busy,
        ready: policy.ready,
        failure: policy.failure,
        errorSelector: policy.errorSelector || C.UPLOAD_ERROR_SELECTOR,
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
      texts: { RT_SERVER: { ARIA_LABEL_TITLE_ALT_ARIA_DESCRIBEDBY: RT_SERVER.ARIA_LABEL_TITLE_ALT_ARIA_DESCRIBEDBY, ARIA_DESCRIBEDBY: RT_SERVER.ARIA_DESCRIBEDBY }, RT_SHARED: { SYMBOL_36A9E7: RT_SHARED.SYMBOL_36A9E7 } },
    },
  );
export const observeClaudeUploads = (page: Page) =>
  observeChatUploads(page, (request) => {
    const url = new URL(request.url());
    const contentType = request.headers()[ST.SOURCE_TEXT_CONTENT_TYPE_2] || C.EMPTY;
    return url.hostname === C.CLAUDE_HOST && request.method() === ST.SOURCE_TEXT_POST && (C.UPLOAD_PATH_PATTERN.test(url.pathname) || C.MULTIPART_PATTERN.test(contentType));
  });
type UploadObservation = Pick<ReturnType<typeof observeClaudeUploads>, "state">;
export const attachmentNamesMatch = (labels: string[], attachments: Attachment[], policy: ChatUploadPolicy): boolean => {
  const normalize = (value: string) => value.normalize(ST.SOURCE_TEXT_NFC).toLowerCase();
  const names = labels.map(normalize);
  return attachments.every((attachment) => {
    const name = normalize(attachment.path?.split(/[\\/]/).pop() || attachment.name);
    const image = attachment.mimeType.startsWith(ST.SOURCE_TEXT_IMAGE_2);
    if (image && !policy.matchImageNames) return true;
    const omitExtension = (image && policy.omitImageExtension) || (attachment.mimeType.startsWith(RT_SERVER.AUDIO) && policy.omitAudioExtension);
    const candidates = omitExtension ? [name, name.replace(image ? C.IMAGE_EXTENSION_PATTERN : /\.[a-z0-9]+$/i, C.EMPTY)] : [name];
    const filenames = candidates.map((candidate) => new RegExp(C.FILENAME_PATTERN(_.escapeRegExp(candidate)), ST.SOURCE_TEXT_U_2));
    const index = names.findIndex((label) => filenames.some((filename) => filename.test(label)));
    if (index < 0) return false;
    names.splice(index, 1);
    return true;
  });
};
export const waitForClaudeUploads = async (
  input: Locator,
  attachments: Attachment[],
  timeoutMs: number,
  signal?: AbortSignal,
  observation?: UploadObservation,
  stableMs = CONFIG.CLAUDE_UPLOAD_STABLE_MS,
  requireSendReady = false,
  policy: ChatUploadPolicy = claudePolicy,
  onProgress?: (state: UploadState & { namesMatch: boolean; pending: number }) => void,
  waitForSession?: () => Promise<number>,
): Promise<void> => {
  let deadline = Date.now() + timeoutMs;
  let readySince = 0;
  while (Date.now() < deadline) {
    signal?.throwIfAborted();
    const pausedMs = (await waitForSession?.()) || 0;
    deadline += pausedMs;
    if (pausedMs) readySince = 0;
    const state = await readClaudeUploadState(input, policy);
    const network = observation?.state();
    const namesMatch = attachmentNamesMatch(state.labels, attachments, policy);
    onProgress?.({ ...state, namesMatch, pending: network?.pending || 0 });
    if (state.failed || network?.failed) throw uploadFailure(policy.failedError, network, state.errorMessage);
    if (state.count === attachments.length && namesMatch && (!policy.ready || state.readyCount === attachments.length) && !state.busy && (!requireSendReady || state.sendReady) && !network?.pending) {
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
  const finalState = await readClaudeUploadState(input, policy);
  const matched = attachmentNamesMatch(finalState.labels, attachments, policy);
  throw uploadFailure(
    policy.notReadyError,
    observation?.state(),
    ([finalState.errorMessage, `${finalState.count}${RT_SHARED.SYMBOL_8A5EDA}${attachments.length}${RT_SERVER.TEP_SAN_SANG}${finalState.readyCount}${RT_SERVER.TEN}${matched ? RT_SERVER.KHOP : RT_SERVER.CHUA_KHOP}${RT_SERVER.DANG_XU_LY}${finalState.busyCount}${RT_SERVER.LOI}${finalState.failedCount}`] as string[]).filter(Boolean).join(RT_SHARED.SYMBOL_588DA4),
  );
};
