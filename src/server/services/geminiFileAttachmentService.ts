import { RUNTIME_TEXT as RT_SHARED } from "../../constants/runtime/shared.js";
import { RUNTIME_TEXT as RT_SERVER } from "../../constants/runtime/server.js";
import { stringifyJson } from "../../lib/jsonStringify.js";
import { randomUUID } from "node:crypto";
import { basename, extname } from "node:path";
import type { BrowserContext, ElementHandle, FileChooser, Locator, Page } from "playwright";
import { CINEMATIC_CHAT_PLANNING_CONFIG as CONFIG } from "../../constants/cinematicConstants.js";
import { readPlanningUi, throwIfPlanningCancelled } from "../../lib/chatPlanningUtils.js";
import { ChatUploadError, uploadFailure, isTerminalUploadMessage } from "./chatUploadRecovery.js";
import { readClaudeUploadState, attachmentNamesMatch } from "./claudeUploadReadiness.js";
import { geminiUploadPolicy } from "./geminiUploadReadiness.js";
import { AsyncTaskLimiter } from "../../lib/asyncTaskLimiter.js";
type LocalAttachment = { name: string; mimeType: string; path: string };
type FileInputTarget = Locator | ElementHandle<Node>;
const menuQueues = new WeakMap<BrowserContext, AsyncTaskLimiter>();
const ACTION_TIMEOUT = 8000;
export const reconcileGeminiQueuedFiles = async (page: Page, input: Locator, composer: Locator, files: LocalAttachment[]): Promise<LocalAttachment[]> => {
  const state = await readClaudeUploadState(input, geminiUploadPolicy);
  if (state.failed && isTerminalUploadMessage(state.errorMessage || state.labels.join(RT_SHARED.SYMBOL_36A9E7))) throw uploadFailure(geminiUploadPolicy.failedError, undefined, state.errorMessage || state.labels.join(RT_SHARED.SYMBOL_36A9E7));
  if (state.failed && !state.failedCount) throw uploadFailure(geminiUploadPolicy.failedError, undefined, state.errorMessage);
  if (!state.count) return files;
  const missing = [...files];
  const remove: number[] = [];
  for (const [index, file] of state.files.entries()) {
    const match = file.failed ? -1 : missing.findIndex((expected) => attachmentNamesMatch([file.label], [expected], geminiUploadPolicy));
    if (match < 0) remove.push(index);
    else missing.splice(match, 1);
  }
  if (state.files.length !== state.count) throw new ChatUploadError(RT_SERVER.GEMINI_ATTACHMENT_IDENTITY_UNKNOWN_KHONG_DOC_DUOC_DANH_TINH_TUNG, false);
  for (const index of remove.reverse()) {
    const chip = composer.locator(geminiUploadPolicy.attachment).nth(index);
    await chip.hover({ timeout: ACTION_TIMEOUT });
    await chip.locator(RT_SERVER.BUTTON_ARIA_LABEL_CLOSE_I_BUTTON_ARIA_LABEL_REMOVE_ATTACHMENT).first().click({ timeout: ACTION_TIMEOUT });
  }
  if (missing.length)
    await page.locator('input[type="file"]').evaluateAll((nodes) =>
      nodes.forEach((node) => {
        (node as HTMLInputElement).value = "";
      }),
    );
  return missing;
};
const withUploadMenu = async <T>(page: Page, signal: AbortSignal | undefined, action: () => Promise<T>): Promise<T> => {
  const queue = menuQueues.get(page.context()) || new AsyncTaskLimiter(1);
  menuQueues.set(page.context(), queue);
  const release = await queue.acquire(signal);
  try {
    throwIfPlanningCancelled(signal);
    return await action();
  } finally {
    release();
  }
};
const chooseInput = async (page: Page, composer: Locator, files: LocalAttachment[]): Promise<Locator | undefined> => {
  for (const scope of [composer, page]) {
    const inputs = scope.locator(RT_SERVER.INPUT_TYPE_FILE);
    const candidates = await inputs.evaluateAll((nodes) =>
      nodes.map((node) => {
        const input = node as HTMLInputElement;
        return { accept: input.accept.toLowerCase(), disabled: input.disabled, directory: input.webkitdirectory, multiple: input.multiple };
      }),
    );
    const index = candidates.findIndex((candidate) => {
      if (candidate.disabled || candidate.directory || (files.length > 1 && !candidate.multiple)) return false;
      const accepted = candidate.accept
        .split(RT_SHARED.SYMBOL_D03502)
        .map((entry) => entry.trim())
        .filter(Boolean);
      return files.every((file) => !accepted.length || accepted.some((entry) => entry === RT_SERVER.SYMBOL || entry === RT_SERVER.SYMBOL_799475 || entry === file.mimeType || entry === extname(file.path).toLowerCase() || (entry.endsWith(RT_SERVER.SYMBOL_766E01) && file.mimeType.startsWith(entry.slice(0, -1)))));
    });
    if (index >= 0) return inputs.nth(index);
  }
};
const fileInputHandle = async (input: FileInputTarget): Promise<ElementHandle<Node>> => {
  const handle = RT_SERVER.ELEMENTHANDLE in input ? await input.elementHandle({ timeout: ACTION_TIMEOUT }) : input;
  if (!handle) throw new ChatUploadError(RT_SERVER.GEMINI_FILE_INPUT_CHANGED_O_TAI_TEP_DA_THAY_DOI, true);
  return handle;
};
const alreadyAssigned = async (input: FileInputTarget, files: LocalAttachment[]): Promise<boolean> => {
  const handle = await fileInputHandle(input);
  const assigned = await handle.evaluate((node) => Array.from((node as HTMLInputElement).files || []).map((file) => file.name)).catch(() => []);
  return assigned.length === files.length && files.every((file, index) => assigned[index] === basename(file.path));
};
export const setGeminiLocalFilesViaCdp = async (page: Page, input: FileInputTarget, files: LocalAttachment[], signal?: AbortSignal): Promise<void> => {
  throwIfPlanningCancelled(signal);
  const handle = await fileInputHandle(input);
  if (await alreadyAssigned(handle, files)) return;
  const marker = `${RT_SERVER.VIDIFYFILEINPUT}${randomUUID().replaceAll(RT_SHARED.SYMBOL_3973E0, "")}`;
  await handle.evaluate((node, id) => {
    (window as unknown as Record<string, Node>)[id] = node;
  }, marker);
  const session = await page.context().newCDPSession(page);
  let objectId: string | undefined;
  let inputContextId: number | undefined;
  const contexts: number[] = [];
  const rememberContext = ({ context }: { context: { id: number } }) => {
    contexts.push(context.id);
  };
  session.on(RT_SERVER.RUNTIME_EXECUTIONCONTEXTCREATED, rememberContext);
  try {
    await session.send(RT_SERVER.RUNTIME_ENABLE);
    for (const contextId of contexts) {
      const evaluated = await session.send(RT_SERVER.RUNTIME_EVALUATE, { expression: `${RT_SERVER.WINDOW}${stringifyJson(marker)}${RT_SHARED.SYMBOL_CFAE0D}`, contextId }).catch(() => undefined);
      if (evaluated?.result.objectId) {
        objectId = evaluated.result.objectId;
        inputContextId = contextId;
        break;
      }
    }
    if (!objectId) throw new ChatUploadError(RT_SERVER.GEMINI_FILE_INPUT_CHANGED_O_TAI_TEP_DA_THAY_DOI, true);
    const { node } = await session.send(RT_SERVER.DOM_DESCRIBENODE, { objectId });
    throwIfPlanningCancelled(signal);
    await readPlanningUi(session.send(RT_SERVER.DOM_SETFILEINPUTFILES, { backendNodeId: node.backendNodeId, files: files.map((file) => file.path) }), signal, ACTION_TIMEOUT, RT_SERVER.GEMINI_FILE_INPUT);
  } finally {
    if (inputContextId !== undefined) await session.send(RT_SERVER.RUNTIME_EVALUATE, { expression: `${RT_SERVER.DELETE_WINDOW}${stringifyJson(marker)}${RT_SHARED.SYMBOL_CFAE0D}`, contextId: inputContextId }).catch(() => undefined);
    if (objectId) await session.send(RT_SERVER.RUNTIME_RELEASEOBJECT, { objectId }).catch(() => undefined);
    session.off(RT_SERVER.RUNTIME_EXECUTIONCONTEXTCREATED, rememberContext);
    await session.detach().catch(() => undefined);
  }
};
const attachGeminiLocalFilesInternal = async (page: Page, composer: Locator, files: LocalAttachment[], signal?: AbortSignal): Promise<string> => {
  throwIfPlanningCancelled(signal);
  if (!files.length || files.length > 10) throw new ChatUploadError(RT_SERVER.GEMINI_FILE_COUNT_INVALID_MOI_LUOT_DINH_KEM_TOI_DA, false);
  let input = await chooseInput(page, composer, files);
  if (input) {
    try {
      await setGeminiLocalFilesViaCdp(page, input, files, signal);
      return RT_SERVER.CDP;
    } catch (error) {
      throwIfPlanningCancelled(signal);
      if (await alreadyAssigned(input, files)) return RT_SERVER.CDP_RECONCILED;
      if (!(error instanceof Error) || !/not supported|not implemented|CDP|session|node|document/i.test(error.message)) throw error;
    }
  }
  return withUploadMenu(page, signal, async () => {
    input = await chooseInput(page, composer, files);
    if (input) {
      if (await alreadyAssigned(input, files)) return RT_SERVER.EXISTING_INPUT;
      await input.setInputFiles(
        files.map((file) => file.path),
        { timeout: ACTION_TIMEOUT },
      );
      return RT_SERVER.INPUT;
    }
    const button = composer.getByRole(RT_SHARED.BUTTON, { name: CONFIG.ATTACHMENT_BUTTON_NAME_PATTERN }).or(composer.locator(CONFIG.ATTACHMENT_BUTTON_SELECTOR)).filter({ visible: true }).last();
    let resolveChooser!: (chooser: FileChooser | undefined) => void;
    let capturedChooser: FileChooser | undefined;
    const chooserPromise = new Promise<FileChooser | undefined>((resolve) => {
      resolveChooser = resolve;
    });
    const onChooser = (chooser: FileChooser) => {
      capturedChooser = chooser;
      resolveChooser(chooser);
    };
    let timer: ReturnType<typeof setTimeout> | undefined;
    page.once(RT_SERVER.FILECHOOSER, onChooser);
    try {
      const upload = page
        .getByRole(RT_SERVER.MENUITEM, { name: CONFIG.UPLOAD_FILE_MENU_NAME_PATTERN })
        .or(page.getByRole(RT_SHARED.BUTTON, { name: CONFIG.ATTACHMENT_MENU_ITEM_NAME_PATTERN }))
        .filter({ visible: true })
        .last();
      if (!(await upload.isVisible())) await button.click({ timeout: ACTION_TIMEOUT, noWaitAfter: true });
      input = await chooseInput(page, composer, files);
      if (input) {
        await setGeminiLocalFilesViaCdp(page, input, files, signal);
        return RT_SERVER.MENU_CDP;
      }
      if (!capturedChooser) {
        const deadline = Date.now() + ACTION_TIMEOUT;
        while (!capturedChooser && !(await upload.isVisible()) && Date.now() < deadline) {
          throwIfPlanningCancelled(signal);
          await page.waitForTimeout(100);
        }
        if (!capturedChooser) {
          if (!(await upload.isVisible())) throw new ChatUploadError(RT_SERVER.GEMINI_UPLOAD_MENU_MISSING_KHONG_TIM_THAY_MUC_TAI_TEP, false);
          await upload.click({ timeout: ACTION_TIMEOUT, noWaitAfter: true });
        }
      }
      timer = setTimeout(() => resolveChooser(undefined), ACTION_TIMEOUT);
      const chooser = await chooserPromise;
      throwIfPlanningCancelled(signal);
      if (!chooser) throw new ChatUploadError(RT_SERVER.GEMINI_FILE_INPUT_MISSING_KHONG_NHAN_DUOC_O_CHON_TEP, false);
      const chooserInput = chooser.element();
      try {
        await setGeminiLocalFilesViaCdp(page, chooserInput, files, signal);
        return RT_SERVER.CHOOSER_CDP;
      } catch (error) {
        throwIfPlanningCancelled(signal);
        if (await alreadyAssigned(chooserInput, files)) return RT_SERVER.CHOOSER_CDP_RECONCILED;
        if (!(error instanceof Error) || !/not supported|not implemented|CDP|session|node|document/i.test(error.message)) throw error;
        await chooser.setFiles(
          files.map((file) => file.path),
          { timeout: ACTION_TIMEOUT },
        );
        return RT_SERVER.CHOOSER;
      }
    } finally {
      clearTimeout(timer);
      page.off(RT_SERVER.FILECHOOSER, onChooser);
    }
  });
};
export const attachGeminiLocalFiles = async (page: Page, composer: Locator, files: LocalAttachment[], signal?: AbortSignal): Promise<string> => {
  try {
    return await attachGeminiLocalFilesInternal(page, composer, files, signal);
  } finally {
    const openUpload = page
      .getByRole(RT_SERVER.MENUITEM, { name: CONFIG.UPLOAD_FILE_MENU_NAME_PATTERN })
      .or(page.getByRole(RT_SHARED.BUTTON, { name: CONFIG.ATTACHMENT_MENU_ITEM_NAME_PATTERN }))
      .filter({ visible: true });
    if (await openUpload.count().catch(() => 0)) {
      await page.keyboard.press(RT_SERVER.ESCAPE).catch(() => undefined);
      await openUpload
        .last()
        .waitFor({ state: RT_SHARED.HIDDEN, timeout: 1500 })
        .catch(() => undefined);
    }
  }
};
