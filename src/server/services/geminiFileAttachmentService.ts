import { randomUUID } from "node:crypto";
import { basename, extname } from "node:path";
import type { BrowserContext, ElementHandle, FileChooser, Locator, Page } from "playwright";
import { CINEMATIC_CHAT_PLANNING_CONFIG as CONFIG } from "../../constants/cinematicConstants.js";
import { readPlanningUi, throwIfPlanningCancelled } from "../../lib/chatPlanningUtils.js";
import { ChatUploadError, uploadFailure, isTerminalUploadMessage } from "./chatUploadRecovery.js";
import { readClaudeUploadState, attachmentNamesMatch } from './claudeUploadReadiness.js';
import { geminiUploadPolicy } from './geminiUploadReadiness.js';
import { AsyncTaskLimiter } from '../../lib/asyncTaskLimiter.js';

type LocalAttachment = { name: string; mimeType: string; path: string };
type FileInputTarget = Locator | ElementHandle<Node>;
const menuQueues = new WeakMap<BrowserContext, AsyncTaskLimiter>();
const ACTION_TIMEOUT = 8000;

export const reconcileGeminiQueuedFiles = async (page: Page, input: Locator, composer: Locator, files: LocalAttachment[]): Promise<LocalAttachment[]> => {
  const state = await readClaudeUploadState(input, geminiUploadPolicy);
  if (state.failed && isTerminalUploadMessage(state.errorMessage || state.labels.join(' '))) throw uploadFailure(geminiUploadPolicy.failedError, undefined, state.errorMessage || state.labels.join(' '));
  if (state.failed && !state.failedCount) throw uploadFailure(geminiUploadPolicy.failedError, undefined, state.errorMessage);
  if (!state.count) return files;
  const missing = [...files];
  const remove: number[] = [];
  for (const [index, file] of state.files.entries()) {
    const match = file.failed ? -1 : missing.findIndex((expected) => attachmentNamesMatch([file.label], [expected], geminiUploadPolicy));
    if (match < 0) remove.push(index);
    else missing.splice(match, 1);
  }
  if (state.files.length !== state.count) throw new ChatUploadError('gemini_attachment_identity_unknown – Không đọc được danh tính từng tệp đang đính kèm. Chưa upload thêm để tránh trùng.', false);
  for (const index of remove.reverse()) {
    const chip = composer.locator(geminiUploadPolicy.attachment).nth(index);
    // The close control is only visible on hover in the current Gemini UI.
    await chip.hover({ timeout: ACTION_TIMEOUT });
    await chip.locator('button[aria-label^="close " i], button[aria-label*="remove attachment" i], button[aria-label*="remove file" i], button[aria-label*="xóa tệp" i], button[aria-label*="xoá tệp" i]').first().click({ timeout: ACTION_TIMEOUT });
  }
  if (missing.length) await page.locator('input[type="file"]').evaluateAll((nodes) => nodes.forEach((node) => { (node as HTMLInputElement).value = ''; }));
  return missing;
};

// File selection is short and serialized. Network uploads continue concurrently.
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
    const inputs = scope.locator('input[type="file"]');
    const candidates = await inputs.evaluateAll((nodes) => nodes.map((node) => {
      const input = node as HTMLInputElement;
      return { accept: input.accept.toLowerCase(), disabled: input.disabled, directory: input.webkitdirectory, multiple: input.multiple };
    }));
    const index = candidates.findIndex((candidate) => {
      if (candidate.disabled || candidate.directory || (files.length > 1 && !candidate.multiple)) return false;
      const accepted = candidate.accept.split(",").map((entry) => entry.trim()).filter(Boolean);
      return files.every((file) => !accepted.length || accepted.some((entry) => entry === "*" || entry === "*/*" || entry === file.mimeType || entry === extname(file.path).toLowerCase() || (entry.endsWith("/*") && file.mimeType.startsWith(entry.slice(0, -1)))));
    });
    if (index >= 0) return inputs.nth(index);
  }
};

const fileInputHandle = async (input: FileInputTarget): Promise<ElementHandle<Node>> => {
  const handle = "elementHandle" in input ? await input.elementHandle({ timeout: ACTION_TIMEOUT }) : input;
  if (!handle) throw new ChatUploadError("gemini_file_input_changed – Ô tải tệp đã thay đổi trước khi đính kèm.", true);
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
  const marker = `__vidifyFileInput_${randomUUID().replaceAll("-", "")}`;
  // Gemini can use a detached input created by its upload menu.
  await handle.evaluate((node, id) => { (window as unknown as Record<string, Node>)[id] = node; }, marker);
  const session = await page.context().newCDPSession(page);
  let objectId: string | undefined;
  let inputContextId: number | undefined;
  const contexts: number[] = [];
  const rememberContext = ({ context }: { context: { id: number } }) => { contexts.push(context.id); };
  session.on("Runtime.executionContextCreated", rememberContext);
  try {
    await session.send("Runtime.enable");
    // FileChooser handles can belong to Playwright's isolated execution world.
    for (const contextId of contexts) {
      const evaluated = await session.send("Runtime.evaluate", { expression: `window[${JSON.stringify(marker)}]`, contextId }).catch(() => undefined);
      if (evaluated?.result.objectId) {
        objectId = evaluated.result.objectId;
        inputContextId = contextId;
        break;
      }
    }
    if (!objectId) throw new ChatUploadError("gemini_file_input_changed – Ô tải tệp đã thay đổi trước khi đính kèm.", true);
    const { node } = await session.send("DOM.describeNode", { objectId });
    throwIfPlanningCancelled(signal);
    await readPlanningUi(session.send("DOM.setFileInputFiles", { backendNodeId: node.backendNodeId, files: files.map((file) => file.path) }), signal, ACTION_TIMEOUT, "gemini-file-input");
  } finally {
    if (inputContextId !== undefined) await session.send("Runtime.evaluate", { expression: `delete window[${JSON.stringify(marker)}]`, contextId: inputContextId }).catch(() => undefined);
    if (objectId) await session.send("Runtime.releaseObject", { objectId }).catch(() => undefined);
    session.off("Runtime.executionContextCreated", rememberContext);
    await session.detach().catch(() => undefined);
  }
};

const attachGeminiLocalFilesInternal = async (page: Page, composer: Locator, files: LocalAttachment[], signal?: AbortSignal): Promise<string> => {
  throwIfPlanningCancelled(signal);
  if (!files.length || files.length > 10) throw new ChatUploadError("gemini_file_count_invalid – Mỗi lượt đính kèm tối đa 10 tệp.", false);
  let input = await chooseInput(page, composer, files);
  if (input) {
    try {
      await setGeminiLocalFilesViaCdp(page, input, files, signal);
      return "cdp";
    } catch (error) {
      throwIfPlanningCancelled(signal);
      if (await alreadyAssigned(input, files)) return "cdp-reconciled";
      // Do not choose files a second time after an ambiguous CDP assignment.
      if (!(error instanceof Error) || !/not supported|not implemented|CDP|session|node|document/i.test(error.message)) throw error;
    }
  }
  return withUploadMenu(page, signal, async () => {
    input = await chooseInput(page, composer, files);
    if (input) {
      if (await alreadyAssigned(input, files)) return "existing-input";
      await input.setInputFiles(files.map((file) => file.path), { timeout: ACTION_TIMEOUT });
      return "input";
    }
    const button = composer.getByRole("button", { name: CONFIG.ATTACHMENT_BUTTON_NAME_PATTERN }).or(composer.locator(CONFIG.ATTACHMENT_BUTTON_SELECTOR)).filter({ visible: true }).last();
    // Register before opening the menu, suppressing a native dialog if this opens one.
    let resolveChooser!: (chooser: FileChooser | undefined) => void;
    let capturedChooser: FileChooser | undefined;
    const chooserPromise = new Promise<FileChooser | undefined>((resolve) => { resolveChooser = resolve; });
    const onChooser = (chooser: FileChooser) => { capturedChooser = chooser; resolveChooser(chooser); };
    let timer: ReturnType<typeof setTimeout> | undefined;
    page.once("filechooser", onChooser);
    try {
      const upload = page.getByRole('menuitem', { name: CONFIG.UPLOAD_FILE_MENU_NAME_PATTERN }).or(page.getByRole('button', { name: CONFIG.ATTACHMENT_MENU_ITEM_NAME_PATTERN })).filter({ visible: true }).last();
      // Reuse an already open upload menu; clicking its toggle again would close it.
      if (!(await upload.isVisible())) await button.click({ timeout: ACTION_TIMEOUT, noWaitAfter: true });
      input = await chooseInput(page, composer, files);
      if (input) {
        await setGeminiLocalFilesViaCdp(page, input, files, signal);
        return "menu-cdp";
      }
      if (!capturedChooser) {
        const deadline = Date.now() + ACTION_TIMEOUT;
        while (!capturedChooser && !(await upload.isVisible()) && Date.now() < deadline) {
          throwIfPlanningCancelled(signal);
          await page.waitForTimeout(100);
        }
        if (!capturedChooser) {
          if (!(await upload.isVisible())) throw new ChatUploadError('gemini_upload_menu_missing – Không tìm thấy mục Tải tệp lên trong menu Gemini.', false);
          await upload.click({ timeout: ACTION_TIMEOUT, noWaitAfter: true });
        }
      }
      timer = setTimeout(() => resolveChooser(undefined), ACTION_TIMEOUT);
      const chooser = await chooserPromise;
      throwIfPlanningCancelled(signal);
      if (!chooser) throw new ChatUploadError("gemini_file_input_missing – Không nhận được ô chọn tệp sau khi chọn Tải tệp lên.", false);
      const chooserInput = chooser.element();
      try {
        await setGeminiLocalFilesViaCdp(page, chooserInput, files, signal);
        return "chooser-cdp";
      } catch (error) {
        throwIfPlanningCancelled(signal);
        if (await alreadyAssigned(chooserInput, files)) return "chooser-cdp-reconciled";
        if (!(error instanceof Error) || !/not supported|not implemented|CDP|session|node|document/i.test(error.message)) throw error;
        await chooser.setFiles(files.map((file) => file.path), { timeout: ACTION_TIMEOUT });
        return "chooser";
      }
    } finally {
      clearTimeout(timer);
      page.off("filechooser", onChooser);
    }
  });
};

export const attachGeminiLocalFiles = async (page: Page, composer: Locator, files: LocalAttachment[], signal?: AbortSignal): Promise<string> => {
  try {
    return await attachGeminiLocalFilesInternal(page, composer, files, signal);
  } finally {
    // Dismiss this page's upload menu on every path, including direct CDP assignment.
    const openUpload = page.getByRole('menuitem', { name: CONFIG.UPLOAD_FILE_MENU_NAME_PATTERN }).or(page.getByRole('button', { name: CONFIG.ATTACHMENT_MENU_ITEM_NAME_PATTERN })).filter({ visible: true });
    if (await openUpload.count().catch(() => 0)) {
      await page.keyboard.press('Escape').catch(() => undefined);
      await openUpload.last().waitFor({ state: 'hidden', timeout: 1500 }).catch(() => undefined);
    }
  }
};
