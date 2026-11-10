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
  await turn.scrollIntoViewIfNeeded().catch(() => undefined);
  await turn.hover({ timeout: C.RETRY_TIMEOUT }).catch(() => undefined);
  let retry = turn.getByRole(C.BUTTON, { name: C.RETRY_NAME }).filter({ visible: true }).last();
  if (!(await retry.count()) && !(await containers.count())) {
    const parent = turn.locator(C.PARENT);
    if ((await parent.locator(C.TURN_SELECTOR).count()) === 1) retry = parent.getByRole(C.BUTTON, { name: C.RETRY_NAME }).filter({ visible: true }).last();
  }
  const geminiTriggerCandidates = turn.locator(C.GEMINI_REGENERATE_SELECTOR);
  const geminiVisibleTrigger = geminiTriggerCandidates.filter({ visible: true }).last();
  const geminiTrigger = (await geminiVisibleTrigger.count()) ? geminiVisibleTrigger : geminiTriggerCandidates.first();
  const isGeminiTrigger = (await geminiTrigger.count()) > 0;
  const trigger = isGeminiTrigger ? geminiTrigger : turn.getByRole(C.BUTTON, { name: C.RETRY_MENU_NAME }).filter({ visible: true }).last();
  if ((await trigger.count()) && (isGeminiTrigger || !(await retry.count()) || popupOpens(await trigger.getAttribute(C.ARIA_HASPOPUP)))) {
    if (!(await trigger.isEnabled().catch(() => true))) return false;
    const triggerButton = trigger.locator(C.BUTTON).last();
    if ((await triggerButton.count()) && (!(await triggerButton.isEnabled()) || (await triggerButton.getAttribute(C.ARIA_DISABLED)) === RT_MAINTENANCE.TRUE)) return false;
    const isTriggerDisabled = await trigger
      .evaluate((el, disabledAttr) => {
        const host = el.closest("gem-icon-button") || el;
        return el.getAttribute(disabledAttr) === "true" || host.getAttribute(disabledAttr) === "true" || host.classList.contains("gem-button-disabled");
      }, C.ARIA_DISABLED)
      .catch(() => false);
    if (isTriggerDisabled) return false;
    const triggerMeta = await trigger
      .evaluate(
        (el, attrs) => {
          const host = el.closest("gem-icon-button") || el;
          return {
            existingMenu: el.getAttribute(attrs.ariaControls) || host.getAttribute(attrs.ariaControls),
            ariaHasPopup: el.getAttribute(attrs.ariaHasPopup) || host.getAttribute(attrs.ariaHasPopup),
            hasGemMenuTrigger: el.getAttribute(attrs.gemMenuTrigger) !== null || host.getAttribute(attrs.gemMenuTrigger) !== null,
            className: `${el.getAttribute(attrs.classAttr) || ""} ${host.getAttribute(attrs.classAttr) || ""}`,
          };
        },
        { ariaControls: C.ARIA_CONTROLS, ariaHasPopup: C.ARIA_HASPOPUP, gemMenuTrigger: C.GEM_MENU_TRIGGER, classAttr: RT_MAINTENANCE.CLASS },
      )
      .catch(() => ({ existingMenu: null, ariaHasPopup: null, hasGemMenuTrigger: false, className: "" }));
    const existingMenu = triggerMeta.existingMenu;
    const explicitPopup = popupOpens(triggerMeta.ariaHasPopup) || triggerMeta.hasGemMenuTrigger || Boolean(existingMenu);
    const classPopup = triggerMeta.className.includes(C.MAT_MENU_TRIGGER_CLASS);
    const opensMenu = explicitPopup || classPopup;
    signal?.throwIfAborted();
    const clickTarget = (await triggerButton.count()) ? triggerButton : trigger;
    await clickTarget.click({ timeout: C.RETRY_TIMEOUT }).catch(() => trigger.click({ timeout: C.RETRY_TIMEOUT }));
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
      const startedBusy = await page
        .locator(CINEMATIC_CHAT_PLANNING_CONFIG.GEMINI_BUSY_SELECTOR)
        .filter({ visible: true })
        .count()
        .then((count) => count > 0)
        .catch(() => false);
      return isGeminiTrigger && !opensMenu ? true : startedBusy;
    }
  }
  if (!(await retry.count()) || !(await retry.isEnabled())) return false;
  signal?.throwIfAborted();
  await retry.click({ timeout: C.RETRY_TIMEOUT });
  return true;
};
