import type { Locator, Page } from "playwright";
import { CINEMATIC_CHAT_PLANNING_CONFIG as CONFIG, GEMINI_CHAT_BASE_MODEL_LABELS } from "../../constants/cinematicConstants.js";
import { GEMINI_MODEL_ENCODING, GEMINI_MODEL_UI as UI, GEMINI_THINKING_LEVEL_OPTIONS, parseGeminiChatModel } from "../../constants/geminiChatModels.js";
import { CHAT_PLANNING_RUNTIME as C } from "../../constants/chatPlanningRuntime.js";
import { throwIfPlanningCancelled } from "../../lib/chatPlanningUtils.js";
import type { AiPlanningChatModel } from "../../types.js";
const waitUntil = async (page: Page, test: () => Promise<boolean>, signal?: AbortSignal) => {
  const deadline = Date.now() + CONFIG.MODEL_PICKER_TIMEOUT_MS;
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
const optionFor = (page: Page, name: RegExp): Locator => page.getByRole(UI.MENU_ITEM_RADIO, { name }).or(page.getByRole(UI.MENU_ITEM, { name })).or(page.getByRole(UI.OPTION, { name })).filter({ visible: true }).first();
const available = async (option: Locator): Promise<boolean> => (await visible(option)) && (await option.isEnabled().catch(() => false)) && (await option.getAttribute(UI.ARIA_DISABLED)) !== UI.TRUE && (await option.getAttribute(C.DATA_DISABLED)) === null;
const checked = async (option: Locator): Promise<boolean> => {
  const hasAttribute = async (name: string, value: string): Promise<boolean> => (await option.getAttribute(name).catch(() => null)) === value;
  if ((await hasAttribute(UI.ARIA_CHECKED, UI.TRUE)) || (await hasAttribute(UI.ARIA_SELECTED, UI.TRUE)) || (await hasAttribute(UI.DATA_STATE, UI.CHECKED))) return true;
  return await option
    .locator(UI.CHECK_ICON_SELECTOR)
    .filter({ visible: true })
    .evaluateAll((nodes, { selector, pattern, empty }) => nodes.some((node) => node.matches(selector) || pattern.test(node.textContent?.trim() || empty)), { selector: UI.CHECK_MARKER_SELECTOR, pattern: UI.CHECK_TEXT_PATTERN, empty: C.EMPTY });
};
const openThinkingMenu = async (page: Page, button: Locator, option: Locator, signal?: AbortSignal): Promise<boolean> => {
  await button.click();
  const trigger = page
    .getByRole(UI.MENU_ITEM, { name: CONFIG.THINKING_LEVEL_NAME_PATTERN })
    .or(page.getByRole(UI.BUTTON, { name: CONFIG.THINKING_LEVEL_NAME_PATTERN }))
    .filter({ visible: true })
    .first();
  if (!(await waitUntil(page, () => visible(trigger), signal))) return false;
  await trigger.hover();
  if (!(await visible(option))) await trigger.click();
  return true;
};
export const selectGeminiThinkingModel = async (page: Page, model: AiPlanningChatModel, signal?: AbortSignal): Promise<void> => {
  const selection = parseGeminiChatModel(model);
  const level = GEMINI_THINKING_LEVEL_OPTIONS.find((option) => option.value === selection?.level);
  const baseLabel = selection && GEMINI_CHAT_BASE_MODEL_LABELS[selection.model];
  const unavailable = () => new Error(GEMINI_MODEL_ENCODING.UNAVAILABLE(model));
  if (!selection || !level || !baseLabel) throw unavailable();
  const button = page.locator(CONFIG.GEMINI_MODEL_BUTTON_SELECTOR).and(page.locator(UI.MODEL_BUTTON_SELECTOR)).filter({ visible: true }).last();
  try {
    throwIfPlanningCancelled(signal);
    if (!(await waitUntil(page, () => visible(button), signal))) throw unavailable();
    await closeMenus(page);
    if (!baseLabel.test((await button.innerText()).trim())) {
      await button.click();
      const option = optionFor(page, baseLabel);
      if (!(await waitUntil(page, () => available(option), signal))) throw unavailable();
      await option.click();
      await closeMenus(page);
    }
    if (!(await waitUntil(page, async () => baseLabel.test((await button.innerText()).trim()), signal))) throw unavailable();
    const option = optionFor(page, level.pattern);
    if (!(await openThinkingMenu(page, button, option, signal)) || !(await waitUntil(page, () => available(option), signal))) throw unavailable();
    if (!(await checked(option))) {
      await option.click();
      await closeMenus(page);
      if (!(await openThinkingMenu(page, button, option, signal)) || !(await waitUntil(page, () => checked(option), signal))) throw unavailable();
    }
    throwIfPlanningCancelled(signal);
  } catch (error) {
    throwIfPlanningCancelled(signal);
    throw new Error(unavailable().message, { cause: error });
  } finally {
    if (!page.isClosed()) await closeMenus(page).catch(() => undefined);
  }
};
