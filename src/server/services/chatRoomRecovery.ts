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
  // Gemini's circular response button opens a menu; the actual Retry lives in an overlay.
  const geminiTrigger = turn.locator(C.GEMINI_REGENERATE_SELECTOR).filter({ visible: true }).last();
  const isGeminiTrigger = (await geminiTrigger.count()) > 0;
  const trigger = isGeminiTrigger ? geminiTrigger : turn.getByRole(C.BUTTON, { name: C.RETRY_MENU_NAME }).filter({ visible: true }).last();
  if ((await trigger.count()) && (isGeminiTrigger || !(await retry.count()) || popupOpens(await trigger.getAttribute(C.ARIA_HASPOPUP)))) {
    if (!(await trigger.isEnabled())) return false;
    const triggerButton = trigger.locator(C.BUTTON).last();
    if ((await triggerButton.count()) && !(await triggerButton.isEnabled())) return false;
    if ((await trigger.getAttribute(C.ARIA_DISABLED)) === "true") return false;
    const opensMenu = popupOpens(await trigger.getAttribute(C.ARIA_HASPOPUP));
    const existingMenu = await trigger.getAttribute(C.ARIA_CONTROLS);
    signal?.throwIfAborted();
    await trigger.click({ timeout: C.RETRY_TIMEOUT });
    // Gemini uses a direct regenerate action on some responses and a menu on refusals.
    if (isGeminiTrigger && !opensMenu) return true;
    const controlledMenu = existingMenu || (await trigger.getAttribute(C.ARIA_CONTROLS, { timeout: C.RETRY_TIMEOUT }));
    const menu = controlledMenu ? page.locator(`[id=${JSON.stringify(controlledMenu)}]`) : page.locator(C.RETRY_MENU_SELECTOR);
    retry = menu.getByRole(C.MENU_ITEM_ROLE, { name: C.RETRY_NAME }).or(menu.getByRole(C.BUTTON, { name: C.RETRY_NAME })).filter({ visible: true }).last();
    try {
      await retry.waitFor({ state: "visible", timeout: C.RETRY_TIMEOUT });
    } catch {
      signal?.throwIfAborted();
      // A provider may expose a direct Retry rather than a menu trigger.
      return false;
    }
  }
  if (!(await retry.count()) || !(await retry.isEnabled())) return false;
  signal?.throwIfAborted();
  await retry.click({ timeout: C.RETRY_TIMEOUT });
  return true;
};
