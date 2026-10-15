import { STUDIO_RUNTIME as XRT } from "../../constants/studioRuntime.js";
import { EXTERNAL_URLS } from "../../constants/apiRoutes.js";
import * as SRT from "../../constants/sourceText.js";
import type { BrowserContext, Page } from "playwright";
import { DEEPSEEK_CHAT_CONFIG as D } from "../../constants/deepseekChat.js";
import { throwIfPlanningCancelled } from "../../lib/chatPlanningUtils.js";
import { appLog } from "../../lib/logger.js";
const retrySlots = new WeakMap<BrowserContext, number>();
const comparable = (text: string): string => text.replace(/\s+/g, SRT.SOURCE_TEXT_SYMBOL_52).trim();
export const createDeepSeekRetryRecovery = (page: Page, prompt: string | undefined, signal?: AbortSignal): (() => Promise<boolean>) => {
  let attempts = 0;
  let nextAttemptAt = Date.now() + D.RETRY_DELAY_MS;
  return async () => {
    throwIfPlanningCancelled(signal);
    if (!prompt || page.isClosed()) return false;
    const message = page.locator(D.USER_MESSAGE).last();
    const retry = message.locator(D.RETRY).filter({ visible: true }).first();
    if (!(await retry.count())) return false;
    const content = await message.locator(XRT.DEEPSEEK_USER_CONTENT).innerText();
    if (comparable(content) !== comparable(prompt)) return false;
    const row = message.locator(XRT.RESPONSE_ROW_ANCESTOR);
    if (!(await row.getByText(D.CONCURRENT_MESSAGE).filter({ visible: true }).count())) return false;
    if (Date.now() < nextAttemptAt) return true;
    const context = page.context();
    const otherRooms = context.pages().filter((other) => other !== page && other.url().startsWith(EXTERNAL_URLS.DEEPSEEK_CHAT));
    const busyRooms = await Promise.all(
      otherRooms.map((other) =>
        other
          .locator(D.BUSY)
          .filter({ visible: true })
          .count()
          .catch(() => 0),
      ),
    );
    throwIfPlanningCancelled(signal);
    if (busyRooms.some((count) => count > 0) || Date.now() < (retrySlots.get(context) || 0)) return true;
    if (attempts >= D.RETRY_LIMIT) throw new Error(D.RETRY_EXHAUSTED);
    retrySlots.set(context, Date.now() + D.RETRY_DELAY_MS);
    throwIfPlanningCancelled(signal);
    await retry.click({ timeout: D.RETRY_CLICK_TIMEOUT_MS });
    attempts++;
    nextAttemptAt = Date.now() + Math.min(D.RETRY_MAX_DELAY_MS, D.RETRY_DELAY_MS * 2 ** (attempts - 1));
    appLog(D.RETRY_LOG.replace(XRT.ATTEMPT_PLACEHOLDER, String(attempts)));
    return true;
  };
};
