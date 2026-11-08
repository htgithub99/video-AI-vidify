import * as RT_MAINTENANCE from "../../constants/runtime/maintenance.js";
import type { Page } from "playwright";
import { CHAT_ROOM_RECOVERY as C } from "../../constants/chromeBackup.js";
import { CINEMATIC_CHAT_PLANNING_CONFIG } from "../../constants/cinematicConstants.js";
export const isRecoverableChatRefusal = (error: unknown): boolean => {
  const failure = error as { message?: string; diagnostics?: { lastCandidate?: string } } | undefined;
  return failure?.message === CINEMATIC_CHAT_PLANNING_CONFIG.REFUSAL_RESPONSE_ERROR && C.GENERIC_REFUSAL.test(failure.diagnostics?.lastCandidate || "");
};
const popupOpens = (value: string | null): boolean => (C.POPUP_VALUES as readonly string[]).includes(value || "");
export const clickCurrentChatRetry = async (page: Page, signal?: AbortSignal): Promise<boolean> => {
  signal?.throwIfAborted();
  if (page.isClosed()) return false;
  const snackbarRetry = page.locator(C.SNACKBAR_SELECTOR).getByRole(C.BUTTON, { name: C.RETRY_NAME }).filter({ visible: true }).last();
  if ((await snackbarRetry.count()) && (await snackbarRetry.isEnabled())) {
    signal?.throwIfAborted();
    await snackbarRetry.click({ timeout: C.RETRY_TIMEOUT });
    return true;
  }
  const containers = page.locator(C.CONTAINER_SELECTOR).filter({ visible: true });
  const turn = (await containers.count()) ? containers.last() : page.locator(C.TURN_SELECTOR).filter({ visible: true }).last();
  if (!(await turn.count())) return false;
  if (
    await turn.evaluate((node, selector) => {
      const user = [...document.querySelectorAll(selector)].at(-1);
      return !!user && !!(node.compareDocumentPosition(user) & Node.DOCUMENT_POSITION_FOLLOWING);
    }, C.USER_SELECTOR)
  )
    return false;
  let retry = turn.getByRole(C.BUTTON, { name: C.RETRY_NAME }).filter({ visible: true }).last();
  if (!(await retry.count()) && !(await containers.count())) {
    const parent = turn.locator(C.PARENT);
    if ((await parent.locator(C.TURN_SELECTOR).count()) === 1) retry = parent.getByRole(C.BUTTON, { name: C.RETRY_NAME }).filter({ visible: true }).last();
  }
  const geminiTrigger = turn.locator(C.GEMINI_REGENERATE_SELECTOR).filter({ visible: true }).last();
  const isGeminiTrigger = (await geminiTrigger.count()) > 0;
  const trigger = isGeminiTrigger ? geminiTrigger : turn.getByRole(C.BUTTON, { name: C.RETRY_MENU_NAME }).filter({ visible: true }).last();
  if ((await trigger.count()) && (isGeminiTrigger || !(await retry.count()) || popupOpens(await trigger.getAttribute(C.ARIA_HASPOPUP)))) {
    if (!(await trigger.isEnabled())) return false;
    const triggerButton = trigger.locator(C.BUTTON).last();
    if ((await triggerButton.count()) && (!(await triggerButton.isEnabled()) || (await triggerButton.getAttribute(C.ARIA_DISABLED)) === RT_MAINTENANCE.TRUE)) return false;
    if ((await trigger.getAttribute(C.ARIA_DISABLED)) === RT_MAINTENANCE.TRUE) return false;
    const existingMenu = await trigger.getAttribute(C.ARIA_CONTROLS);
    const explicitPopup = popupOpens(await trigger.getAttribute(C.ARIA_HASPOPUP)) || (await trigger.getAttribute(C.GEM_MENU_TRIGGER)) !== null || Boolean(existingMenu);
    const classPopup = ((await trigger.getAttribute(RT_MAINTENANCE.CLASS)) || "").includes(C.MAT_MENU_TRIGGER_CLASS);
    const opensMenu = explicitPopup || classPopup;
    signal?.throwIfAborted();
    await trigger.click({ timeout: C.RETRY_TIMEOUT });
    if (isGeminiTrigger && !opensMenu) return true;
    const controlledMenu = existingMenu || (await trigger.getAttribute(C.ARIA_CONTROLS, { timeout: C.RETRY_TIMEOUT }).catch(() => null));
    const menu = controlledMenu ? page.locator(`${RT_MAINTENANCE.ID_3}${JSON.stringify(controlledMenu)}${RT_MAINTENANCE.CLOSE_BRACKET}`).or(page.locator(C.RETRY_MENU_SELECTOR)) : page.locator(C.RETRY_MENU_SELECTOR);
    retry = menu
      .getByRole(C.MENU_ITEM_ROLE, { name: C.RETRY_NAME })
      .or(menu.getByRole(C.BUTTON, { name: C.RETRY_NAME }))
      .or(menu.locator(C.GEMINI_RETRY_OPTION_SELECTOR))
      .filter({ visible: true })
      .last();
    try {
      await retry.waitFor({ state: RT_MAINTENANCE.VISIBLE, timeout: C.RETRY_TIMEOUT });
    } catch {
      signal?.throwIfAborted();
      return isGeminiTrigger && !explicitPopup;
    }
  }
  if (!(await retry.count()) || !(await retry.isEnabled())) return false;
  signal?.throwIfAborted();
  await retry.click({ timeout: C.RETRY_TIMEOUT });
  return true;
};
