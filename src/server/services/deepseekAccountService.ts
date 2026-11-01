import type { Page } from "playwright";
import { DEEPSEEK_CHAT_CONFIG as D } from "../../constants/deepseekChat.js";
export const isDeepSeekAccountUnavailable = (error: unknown): boolean => error instanceof Error && error.message === D.ACCOUNT_UNAVAILABLE_ERROR;
export const throwIfDeepSeekAccountUnavailable = async (page: Page): Promise<void> => {
  const notices = await page
    .getByText(D.ACCOUNT_UNAVAILABLE)
    .filter({ visible: true })
    .evaluateAll((elements, excluded) => elements.filter((element) => !element.closest(excluded)).map((element) => (element as HTMLElement).innerText || element.textContent || ""), D.ACCOUNT_CONTENT_EXCLUDE);
  const notice = notices.find((text) => D.ACCOUNT_UNAVAILABLE.test(text));
  if (!notice) return;
  const until = Date.parse(notice.match(D.ACCOUNT_UNTIL)?.[1] || "");
  throw Object.assign(new Error(D.ACCOUNT_UNAVAILABLE_ERROR), { retryAt: Number.isFinite(until) && until > Date.now() ? until : Date.now() + D.ACCOUNT_RECHECK_MS });
};
