import { STUDIO_RUNTIME as XRT } from "../../constants/studioRuntime.js";
import * as SRT from "../../constants/sourceText.js";
import { observeChatUploads } from "./chatUploadObserver.js";
import type { Locator, Page } from "playwright";
import { DEEPSEEK_CHAT_CONFIG as D } from "../../constants/deepseekChat.js";
import { throwIfPlanningCancelled } from "../../lib/chatPlanningUtils.js";
import _ from "lodash";
import { CHAT_PLANNING_RUNTIME as C } from "../../constants/chatPlanningRuntime.js";
export const getDeepSeekComposerScope = async (input: Locator): Promise<Locator> => {
  const scope = input.locator(D.COMPOSER);
  if (!(await scope.count())) throw new Error(D.UPLOAD_NOT_READY);
  return scope;
};
export const observeDeepSeekUploads = (page: Page) =>
  observeChatUploads(page, (request) => {
    const url = new URL(request.url());
    return url.hostname === XRT.DEEPSEEK_HOST && D.UPLOAD_PATH.test(url.pathname);
  });
export const readDeepSeekUploadState = async (input: Locator) => {
  const scope = await getDeepSeekComposerScope(input);
  return scope.evaluate(
    (root, config) => {
      const { SRT, XRT } = config.studioTexts;
      const dom = {
        visible(node: Element) {
          if (!node.getClientRects().length) return false;
          for (let current: Element | null = node; current; current = current.parentElement) {
            const style = getComputedStyle(current);
            if (style.visibility === SRT.SOURCE_TEXT_HIDDEN || style.display === SRT.SOURCE_TEXT_NONE || Number(style.opacity) === 0) return false;
          }
          return true;
        },
        label(node: Element) {
          return [node instanceof HTMLElement ? node.innerText : node.textContent, ...Array.from(node.querySelectorAll(XRT.IMAGE_LABEL_SELECTOR)).map((child) => child.getAttribute(XRT.ALT) || child.getAttribute(SRT.SOURCE_TEXT_TITLE))].filter(Boolean).join(SRT.SOURCE_TEXT_SYMBOL_52);
        },
      };
      const chips = Array.from(root.querySelectorAll(config.ATTACHMENT)).filter(dom.visible);
      const alerts = Array.from(document.querySelectorAll(config.ALERT)).filter(dom.visible);
      const images = Array.from(root.querySelectorAll(SRT.SOURCE_TEXT_IMG)).filter(dom.visible) as HTMLImageElement[];
      return { count: chips.length, labels: chips.map(dom.label), busy: Array.from(root.querySelectorAll(config.UPLOAD_BUSY)).some(dom.visible) || images.some((img) => !img.complete || !img.naturalWidth), failed: [...chips, ...alerts].some((node) => config.UPLOAD_ERROR.test(dom.label(node))), sendReady: Array.from(root.querySelectorAll(config.SEND)).some(dom.visible) };
    },
    { ...D, studioTexts: { SRT: { SOURCE_TEXT_HIDDEN: SRT.SOURCE_TEXT_HIDDEN, SOURCE_TEXT_NONE: SRT.SOURCE_TEXT_NONE, SOURCE_TEXT_TITLE: SRT.SOURCE_TEXT_TITLE, SOURCE_TEXT_SYMBOL_52: SRT.SOURCE_TEXT_SYMBOL_52, SOURCE_TEXT_IMG: SRT.SOURCE_TEXT_IMG }, XRT: { IMAGE_LABEL_SELECTOR: XRT.IMAGE_LABEL_SELECTOR, ALT: XRT.ALT } } },
  );
};
type Attachment = { name: string; path?: string };
export const waitForDeepSeekUploads = async (input: Locator, attachments: Attachment[], timeoutMs: number, signal?: AbortSignal, observation?: Pick<ReturnType<typeof observeDeepSeekUploads>, "state">, requireSendReady = false): Promise<void> => {
  const deadline = Date.now() + timeoutMs;
  let readySince = 0;
  const normalize = (value: string) => value.normalize(SRT.SOURCE_TEXT_NFC).toLowerCase();
  while (Date.now() < deadline) {
    throwIfPlanningCancelled(signal);
    const state = await readDeepSeekUploadState(input);
    const network = observation?.state();
    if (state.failed || network?.failed) throw new Error(D.UPLOAD_FAILED);
    const labels = state.labels.map(normalize);
    const namesMatch = attachments.every((attachment) => {
      const name = normalize(attachment.path?.split(/[\\/]/).pop() || attachment.name);
      const filename = new RegExp(C.FILENAME_PATTERN(_.escapeRegExp(name)), SRT.SOURCE_TEXT_U_2);
      const index = labels.findIndex((label) => filename.test(label));
      if (index < 0) return false;
      labels.splice(index, 1);
      return true;
    });
    if (state.count === attachments.length && namesMatch && !state.busy && !network?.pending && (!requireSendReady || state.sendReady)) {
      readySince ||= Date.now();
      if (Date.now() - readySince >= D.UPLOAD_STABLE_MS) return;
    } else readySince = 0;
    await new Promise<void>((resolve) => setTimeout(resolve, 100));
  }
  throwIfPlanningCancelled(signal);
  throw new Error(D.UPLOAD_NOT_READY);
};
