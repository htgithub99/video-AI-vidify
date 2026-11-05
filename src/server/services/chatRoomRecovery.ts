import type { Page } from "playwright";
import { CHAT_ROOM_RECOVERY as C } from "../../constants/chromeBackup.js";
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
  if (!(await retry.count()) || !(await retry.isEnabled())) return false;
  signal?.throwIfAborted();
  await retry.click({ timeout: C.RETRY_TIMEOUT });
  return true;
};
