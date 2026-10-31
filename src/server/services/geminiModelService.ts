import type { Locator, Page } from "playwright";
import { CINEMATIC_CHAT_PLANNING_CONFIG as CONFIG, GEMINI_CHAT_BASE_MODEL_LABELS } from "../../constants/cinematicConstants.js";
import { GEMINI_MODEL_ENCODING, GEMINI_MODEL_UI as UI, GEMINI_THINKING_LEVEL_OPTIONS, parseGeminiChatModel } from "../../constants/geminiChatModels.js";
import { CHAT_PLANNING_RUNTIME as C } from "../../constants/chatPlanningRuntime.js";
import { clickPlanningControl, throwIfPlanningCancelled } from "../../lib/chatPlanningUtils.js";
import type { AiPlanningChatModel } from "../../types.js";
import { MOTION_TEXT_ROOMPAGE } from "../../constants/motionRuntime.js";
const waitUntil = async (page: Page, test: () => Promise<boolean>, signal?: AbortSignal, timeout: number = CONFIG.MODEL_PICKER_TIMEOUT_MS) => {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    throwIfPlanningCancelled(signal);
    if (await test()) return true;
    await page.waitForTimeout(UI.POLL_MS);
  }
  return false;
};
const closeMenus = async (page: Page) => {
  await page.keyboard.press(UI.ESCAPE);
  await page.keyboard.press(UI.ESCAPE);
  await page.getByRole(UI.MENU).filter({ visible: true }).last().waitFor({ state: UI.HIDDEN, timeout: CONFIG.MODEL_PICKER_TIMEOUT_MS });
};
const visible = (option: Locator): Promise<boolean> => option.isVisible().catch(() => false);
const editableInput = async (input: Locator): Promise<boolean> => {
  if (!(await input.isEditable().catch(() => false))) return false;
  return input.evaluate((element) => (element as HTMLElement).isContentEditable || element instanceof HTMLTextAreaElement || element instanceof HTMLInputElement).catch(() => false);
};
const optionFor = (page: Page, name: RegExp): Locator => page.getByRole(UI.MENU_ITEM_RADIO, { name }).or(page.getByRole(UI.MENU_ITEM, { name })).or(page.getByRole(UI.OPTION, { name })).filter({ visible: true }).first();
const available = async (option: Locator): Promise<boolean> => (await visible(option)) && (await option.isEnabled().catch(() => false)) && (await option.getAttribute(UI.ARIA_DISABLED)) !== UI.TRUE && (await option.getAttribute(C.DATA_DISABLED)) === null;
const disabled = async (option: Locator): Promise<boolean> => (await visible(option)) && (!(await option.isEnabled()) || (await option.getAttribute(UI.ARIA_DISABLED)) === UI.TRUE || (await option.getAttribute(C.DATA_DISABLED)) !== null);
export const getGeminiModelButton = async (page: Page): Promise<Locator> => {
  const primary = page.locator(UI.PRIMARY_MODEL_SELECTOR);
  const primaryVisible = primary.filter({ visible: true }).last();
  if (await visible(primaryVisible)) return primaryVisible;
  return (await primary.count()) ? primary.last() : page.locator(CONFIG.GEMINI_MODEL_BUTTON_SELECTOR).and(page.locator(UI.MODEL_BUTTON_SELECTOR)).filter({ visible: true }).last();
};
const uiError = (page: Page, phase: string, model?: AiPlanningChatModel, cause?: unknown, readiness?: Record<string, unknown>): Error => {
  const previous = cause && typeof cause === "object" ? (cause as Record<string, any>)[GEMINI_MODEL_ENCODING.DIAGNOSTICS] : undefined;
  const error = new Error(GEMINI_MODEL_ENCODING.UI_NOT_READY(phase), { cause });
  Object.defineProperty(error, MOTION_TEXT_ROOMPAGE, { value: page });
  return Object.assign(error, { [GEMINI_MODEL_ENCODING.DIAGNOSTICS]: { phase, model, reason: cause instanceof Error ? cause.message : undefined, readiness: readiness || previous?.readiness } });
};
export const waitForGeminiModelUi = async (page: Page, signal?: AbortSignal): Promise<void> => {
  const inputs = page
    .locator(UI.PRIMARY_INPUT_SELECTOR)
    .or(page.locator(CONFIG.GEMINI_INPUT_SELECTOR).and(page.locator(UI.EDITABLE_INPUT_SELECTOR)))
    .filter({ visible: true });
  const started = Date.now();
  let stable = 0;
  let previous: string = C.EMPTY;
  let focusAttempts = 0;
  let lastFocus = 0;
  let readiness: Record<string, unknown> = {};
  const ready = await waitUntil(
    page,
    async () => {
      if (page.isClosed()) throw uiError(page, UI.PHASE.READY, undefined, undefined, { ...readiness, pageClosed: true });
      const button = await getGeminiModelButton(page);
      let input = inputs.last();
      let inputEditable = false;
      for (let index = (await inputs.count()) - 1; index >= 0; index--) {
        const candidate = inputs.nth(index);
        if (await editableInput(candidate)) {
          input = candidate;
          inputEditable = true;
          break;
        }
      }
      const modelVisible = await visible(button);
      const modelEnabled = modelVisible && (await available(button));
      const collapsed = page.locator(UI.COLLAPSED_COMPOSER_SELECTOR).filter({ visible: true }).last();
      if ((!modelVisible || !modelEnabled || !inputEditable) && focusAttempts < UI.FOCUS_ATTEMPTS && Date.now() - lastFocus >= UI.FOCUS_RETRY_MS) {
        const control = (await visible(collapsed)) ? collapsed : inputEditable && !modelEnabled ? input : undefined;
        if (control) {
          lastFocus = Date.now();
          focusAttempts++;
          await clickPlanningControl(control, signal, UI.FOCUS_TIMEOUT_MS).catch(() => undefined);
          throwIfPlanningCancelled(signal);
        }
      }
      const label = (await button.innerText({ timeout: UI.POLL_MS }).catch(() => C.EMPTY)).trim();
      const usable = !!label && modelEnabled && inputEditable;
      stable = usable && label === previous ? stable + 1 : usable ? 1 : 0;
      previous = label;
      readiness = { inputVisible: await visible(input), inputEditable, modelVisible, modelEnabled, modelLabel: label, stablePolls: stable, focusAttempts, elapsedMs: Date.now() - started, pageClosed: page.isClosed() };
      return stable >= UI.READY_POLLS;
    },
    signal,
    CONFIG.PAGE_READY_TIMEOUT_MS,
  );
  if (!ready) throw uiError(page, UI.PHASE.READY, undefined, undefined, { ...readiness, elapsedMs: Date.now() - started });
};
const checked = async (option: Locator): Promise<boolean> => {
  const hasAttribute = async (name: string, value: string): Promise<boolean> => (await option.getAttribute(name).catch(() => null)) === value;
  if ((await hasAttribute(UI.ARIA_CHECKED, UI.TRUE)) || (await hasAttribute(UI.ARIA_SELECTED, UI.TRUE)) || (await hasAttribute(UI.DATA_STATE, UI.CHECKED))) return true;
  return await option
    .locator(UI.CHECK_ICON_SELECTOR)
    .filter({ visible: true })
    .evaluateAll((nodes, { selector, pattern, empty }) => nodes.some((node) => node.matches(selector) || pattern.test(node.textContent?.trim() || empty)), { selector: UI.CHECK_MARKER_SELECTOR, pattern: UI.CHECK_TEXT_PATTERN, empty: C.EMPTY });
};
const openThinkingMenu = async (page: Page, button: Locator, option: Locator, signal?: AbortSignal): Promise<boolean> => {
  await clickPlanningControl(button, signal);
  const trigger = page
    .getByRole(UI.MENU_ITEM, { name: CONFIG.THINKING_LEVEL_NAME_PATTERN })
    .or(page.getByRole(UI.BUTTON, { name: CONFIG.THINKING_LEVEL_NAME_PATTERN }))
    .filter({ visible: true })
    .first();
  if (!(await waitUntil(page, () => visible(trigger), signal))) return false;
  await trigger.hover({ force: true, timeout: CONFIG.MODEL_PICKER_TIMEOUT_MS });
  if (!(await visible(option))) await clickPlanningControl(trigger, signal);
  return true;
};
export const selectGeminiThinkingModel = async (page: Page, model: AiPlanningChatModel, signal?: AbortSignal): Promise<void> => {
  const selection = parseGeminiChatModel(model);
  const level = GEMINI_THINKING_LEVEL_OPTIONS.find((option) => option.value === selection?.level);
  const baseLabel = selection && GEMINI_CHAT_BASE_MODEL_LABELS[selection.model];
  const unavailable = () => new Error(GEMINI_MODEL_ENCODING.UNAVAILABLE(model));
  if (!selection || !level || !baseLabel) throw unavailable();
  for (let attempt = 0; attempt < UI.SELECTION_ATTEMPTS; attempt++) {
    let phase: string = UI.PHASE.READY;
    try {
      throwIfPlanningCancelled(signal);
      await waitForGeminiModelUi(page, signal);
      const button = await getGeminiModelButton(page);
      await closeMenus(page);
      if (!baseLabel.test((await button.innerText()).trim())) {
        phase = UI.PHASE.BASE;
        await clickPlanningControl(button, signal);
        const option = optionFor(page, baseLabel);
        if (!(await waitUntil(page, () => available(option), signal))) {
          if (await disabled(option)) throw unavailable();
          throw uiError(page, phase, model);
        }
        await clickPlanningControl(option, signal);
        await closeMenus(page);
      }
      phase = UI.PHASE.BASE_VERIFY;
      if (!(await waitUntil(page, async () => baseLabel.test((await button.innerText()).trim()), signal))) throw uiError(page, phase, model);
      phase = UI.PHASE.LEVEL;
      const option = optionFor(page, level.pattern);
      if (!(await openThinkingMenu(page, button, option, signal))) throw uiError(page, phase, model);
      if (!(await waitUntil(page, () => available(option), signal))) {
        if (await disabled(option)) throw unavailable();
        throw uiError(page, phase, model);
      }
      if (!(await checked(option))) {
        await clickPlanningControl(option, signal);
        await closeMenus(page);
        phase = UI.PHASE.LEVEL_VERIFY;
        if (!(await openThinkingMenu(page, button, option, signal)) || !(await waitUntil(page, () => checked(option), signal))) throw uiError(page, phase, model);
      }
      phase = UI.PHASE.BASE_VERIFY;
      if (!baseLabel.test((await button.innerText()).trim())) throw uiError(page, phase, model);
      throwIfPlanningCancelled(signal);
      return;
    } catch (error) {
      throwIfPlanningCancelled(signal);
      if (error instanceof Error && error.message.includes(GEMINI_MODEL_ENCODING.UNAVAILABLE_CODE)) throw Object.assign(error, { [MOTION_TEXT_ROOMPAGE]: page, [GEMINI_MODEL_ENCODING.DIAGNOSTICS]: { phase, model } });
      if (attempt + 1 === UI.SELECTION_ATTEMPTS) throw uiError(page, phase, model, error);
    } finally {
      if (!page.isClosed()) await closeMenus(page).catch(() => undefined);
    }
  }
};
