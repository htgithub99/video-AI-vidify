import { CHAT_PLANNING_RUNTIME as C } from "../../constants/chatPlanningRuntime.js";
import * as ST from "../../constants/sourceText.js";
import { throwIfPlanningCancelled as checkCancelled } from "../../lib/chatPlanningUtils.js";
import _ from "lodash";
import type { Locator, Page } from "playwright";
import { CINEMATIC_CHAT_PLANNING_CONFIG as CONFIG } from "../../constants/cinematicConstants.js";
import { CLAUDE_EFFORT_OPTIONS, parseClaudeChatModel } from "../../constants/claudeChatModels.js";
import { AiPlanningChatModel } from "../../types.js";
const modelLabelPattern = (label: string) => new RegExp(C.MODEL_LABEL_PATTERN(_.escapeRegExp(label)), ST.SOURCE_TEXT_I_2);
const closeMenu = async (page: Page) => {
  await page.keyboard.press(ST.SOURCE_TEXT_ESCAPE);
  await page.keyboard.press(ST.SOURCE_TEXT_ESCAPE);
  await page.getByRole(C.MENU).filter({ visible: true }).last().waitFor({ state: ST.SOURCE_TEXT_HIDDEN, timeout: CONFIG.MODEL_PICKER_TIMEOUT_MS });
};
const openPicker = async (page: Page, button: Locator) => {
  if ((await button.getAttribute(C.ARIA_EXPANDED)) !== ST.SOURCE_TEXT_TRUE) await button.click();
  await page.getByRole(C.MENU).filter({ visible: true }).first().waitFor({ state: ST.SOURCE_TEXT_VISIBLE, timeout: CONFIG.MODEL_PICKER_TIMEOUT_MS });
};
const waitUntil = async (page: Page, test: () => Promise<boolean>, signal?: AbortSignal) => {
  const deadline = Date.now() + CONFIG.MODEL_PICKER_TIMEOUT_MS;
  while (Date.now() < deadline) {
    checkCancelled(signal);
    if (await test()) return true;
    await page.waitForTimeout(100);
  }
  return false;
};
const unavailable = (label: string, phase: string = C.MODEL_PHASE) => Object.assign(new Error(phase === C.EFFORT_PHASE ? C.EFFORT_UNAVAILABLE(label) : C.MODEL_UNAVAILABLE(label)), { code: phase === C.EFFORT_PHASE ? C.CLAUDE_EFFORT_UNAVAILABLE_CODE : C.CLAUDE_MODEL_UNAVAILABLE_CODE, diagnostics: { phase } });
const openSubmenu = async (page: Page, name: RegExp, signal?: AbortSignal) => {
  const trigger = page.getByRole(ST.SOURCE_TEXT_MENUITEM, { name }).filter({ visible: true }).first();
  if (
    !(await trigger
      .waitFor({ state: ST.SOURCE_TEXT_VISIBLE, timeout: CONFIG.MODEL_PICKER_TIMEOUT_MS })
      .then(() => true)
      .catch(() => false))
  )
    return false;
  await trigger.hover();
  await page.waitForTimeout(200);
  if ((await trigger.getAttribute(C.ARIA_EXPANDED)) !== ST.SOURCE_TEXT_TRUE) {
    await trigger.focus();
    await page.keyboard.press(ST.SOURCE_TEXT_ARROWRIGHT);
  }
  return waitUntil(page, async () => (await trigger.getAttribute(C.ARIA_EXPANDED).catch(() => null)) === ST.SOURCE_TEXT_TRUE, signal);
};
const optionForModel = async (page: Page, id: string, label: string, signal?: AbortSignal): Promise<Locator> => {
  const exact = page.locator(C.MODEL_SELECTOR(id)).filter({ visible: true }).first();
  if (await exact.count()) return exact;
  await openSubmenu(page, C.MORE_MODELS_PATTERN, signal);
  const name = modelLabelPattern(label);
  return exact.or(page.getByRole(ST.SOURCE_TEXT_MENUITEMRADIO, { name })).filter({ visible: true }).first();
};
export const selectClaudeChatModel = async (page: Page, model?: AiPlanningChatModel, signal?: AbortSignal): Promise<void> => {
  if (!model || model === AiPlanningChatModel.ClaudeAuto) return;
  const selection = parseClaudeChatModel(model);
  if (!selection?.spec) throw unavailable(String(model));
  const { spec, effort } = selection;
  const button = page.locator(CONFIG.CLAUDE_MODEL_BUTTON_SELECTOR).filter({ visible: true }).last();
  checkCancelled(signal);
  if (!(await waitUntil(page, () => button.isVisible().catch(() => false), signal))) throw unavailable(spec.label);
  let phase: string = C.MODEL_PHASE;
  try {
    const label = modelLabelPattern(spec.label);
    if (!label.test((await button.innerText()).trim())) {
      await openPicker(page, button);
      const option = await optionForModel(page, spec.value, spec.label, signal);
      if (!(await waitUntil(page, () => option.isVisible().catch(() => false), signal))) throw unavailable(spec.label);
      const text = await option.innerText();
      if (!(await option.isEnabled()) || (await option.getAttribute(ST.SOURCE_TEXT_ARIA_DISABLED)) === ST.SOURCE_TEXT_TRUE || (await option.getAttribute(C.DATA_DISABLED)) !== null || C.UPGRADE_PATTERN.test(text)) throw unavailable(spec.label);
      if ((await option.getAttribute(ST.SOURCE_BROWSER_TEXT_ARIA_CHECKED)) !== ST.SOURCE_TEXT_TRUE) await option.click();
      await closeMenu(page);
    }
    if (!(await waitUntil(page, async () => label.test((await button.innerText()).trim()), signal))) throw unavailable(spec.label);
    if (effort) {
      phase = C.EFFORT_PHASE;
      const setting = CLAUDE_EFFORT_OPTIONS.find((entry) => entry.value === effort)!;
      const effortLabel = C.MODEL_EFFORT_LABEL(spec.label, setting.label);
      await openPicker(page, button);
      if (!(await openSubmenu(page, C.EFFORT_MENU_PATTERN, signal))) throw unavailable(effortLabel, phase);
      const option = page
        .locator(C.EFFORT_SELECTOR(effort))
        .or(page.getByRole(ST.SOURCE_TEXT_MENUITEMRADIO, { name: setting.pattern }))
        .filter({ visible: true })
        .last();
      if (!(await waitUntil(page, () => option.isVisible().catch(() => false), signal)) || !(await option.isEnabled()) || (await option.getAttribute(ST.SOURCE_TEXT_ARIA_DISABLED)) === ST.SOURCE_TEXT_TRUE || (await option.getAttribute(C.DATA_DISABLED)) !== null) throw unavailable(effortLabel, phase);
      if ((await option.getAttribute(ST.SOURCE_BROWSER_TEXT_ARIA_CHECKED)) !== ST.SOURCE_TEXT_TRUE) {
        await option.click();
        await closeMenu(page);
        await openPicker(page, button);
        if (!(await openSubmenu(page, C.EFFORT_MENU_PATTERN, signal))) throw unavailable(effortLabel, phase);
        if (!(await waitUntil(page, async () => (await option.getAttribute(ST.SOURCE_BROWSER_TEXT_ARIA_CHECKED).catch(() => null)) === ST.SOURCE_TEXT_TRUE, signal))) throw unavailable(effortLabel, phase);
      }
    }
    checkCancelled(signal);
  } catch (error) {
    checkCancelled(signal);
    if (error instanceof Error && (error.message.includes(C.CLAUDE_MODEL_UNAVAILABLE_CODE) || error.message.includes(C.CLAUDE_EFFORT_UNAVAILABLE_CODE))) throw error;
    throw Object.assign(unavailable(effort && phase === C.EFFORT_PHASE ? C.MODEL_EFFORT_LABEL(spec.label, CLAUDE_EFFORT_OPTIONS.find((entry) => entry.value === effort)!.label) : spec.label, phase), { cause: error });
  } finally {
    if (!page.isClosed()) await closeMenu(page).catch(() => undefined);
  }
};
