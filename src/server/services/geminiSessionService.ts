import { RUNTIME_TEXT as RT_SERVER } from "../../constants/runtime/server.js";
import { RUNTIME_TEXT as RT_SHARED } from "../../constants/runtime/shared.js";
import type { Page } from "playwright";
import { setTimeout as pause } from "node:timers/promises";
import { CINEMATIC_CHAT_PLANNING_CONFIG as CONFIG } from "../../constants/cinematicConstants.js";
import type { MusicUploadProgress } from "../../types/musicDownloadProgress.js";
import { throwIfPlanningCancelled } from "../../lib/chatPlanningUtils.js";
import { ChatUploadError } from "./chatUploadRecovery.js";
import { reportCaptchaAlert } from "./captchaAlertService.js";
import { CAPTCHA_ALERT } from "../../constants/captchaAlert.js";
export const geminiSessionInterruption = async (page: Page): Promise<"verification" | "login" | undefined> => {
  if (page.isClosed()) return;
  const url = new URL(page.url());
  if (url.hostname === RT_SERVER.ACCOUNTS_GOOGLE_COM) return RT_SERVER.LOGIN;
  if (/(^|\.)google\.com$/.test(url.hostname) && url.pathname.startsWith(RT_SERVER.SORRY)) return RT_SERVER.VERIFICATION;
  if (
    url.hostname === RT_SERVER.GEMINI_GOOGLE_COM &&
    (await page
      .locator(RT_SERVER.FORM_ACTION_SORRY_IFRAME_SRC_RECAPTCHA_SRC_BFRAME_IFRAME_SRC)
      .filter({ visible: true })
      .count()
      .catch(() => 0))
  )
    return RT_SERVER.VERIFICATION;
};
interface SessionWaitOptions {
  signal?: AbortSignal;
  expected?: number;
  onProgress?: (progress: MusicUploadProgress) => void;
  retainBrowser: () => () => void;
  pollMs?: number;
}
export const waitForGeminiSession = async (page: Page, options: SessionWaitOptions): Promise<number> => {
  throwIfPlanningCancelled(options.signal);
  const interruption = await geminiSessionInterruption(page);
  if (!interruption) return 0;
  if (interruption === RT_SERVER.VERIFICATION) reportCaptchaAlert(CAPTCHA_ALERT.SOURCE.GEMINI_CHAT);
  const started = Date.now();
  const releaseBrowser = options.retainBrowser();
  let lastNotice = 0;
  try {
    await page.bringToFront().catch(() => undefined);
    for (;;) {
      throwIfPlanningCancelled(options.signal);
      if (page.isClosed()) throw new ChatUploadError(RT_SERVER.GEMINI_VERIFICATION_TAB_CLOSED_TAB_CHO_XAC_MINH_DA_BI, false);
      const blocked = await geminiSessionInterruption(page);
      const isGemini = new URL(page.url()).hostname === RT_SERVER.GEMINI_GOOGLE_COM;
      if (
        !blocked &&
        isGemini &&
        (await page
          .locator(CONFIG.GEMINI_INPUT_SELECTOR)
          .filter({ visible: true })
          .last()
          .isEditable()
          .catch(() => false))
      ) {
        options.onProgress?.({ phase: RT_SHARED.VERIFICATION_RESUMED, expected: options.expected || 0, elapsedMs: Date.now() - started, message: RT_SERVER.GEMINI_DA_SAN_SANG_SAU_XAC_MINH_DANG_TIEP_TUC });
        return Math.max(1, Date.now() - started);
      }
      if (!lastNotice || Date.now() - lastNotice >= 30000) {
        options.onProgress?.({ phase: RT_SHARED.VERIFICATION_WAITING, expected: options.expected || 0, elapsedMs: Date.now() - started, message: interruption === RT_SERVER.LOGIN ? RT_SERVER.DANG_CHO_BAN_DANG_NHAP_TRONG_TAB_CHROME_DANG_MO : RT_SERVER.DANG_CHO_BAN_XAC_MINH_GOOGLE_TRONG_TAB_CHROME_DANG });
        lastNotice = Date.now();
      }
      await pause(options.pollMs ?? 1000, undefined, { signal: options.signal }).catch((error) => {
        throwIfPlanningCancelled(options.signal);
        throw error;
      });
    }
  } finally {
    releaseBrowser();
  }
};
export const withGeminiSession = async <T>(page: Page, operation: () => Promise<T>, options: SessionWaitOptions): Promise<T> => {
  for (;;) {
    await waitForGeminiSession(page, options);
    try {
      return await operation();
    } catch (error) {
      throwIfPlanningCancelled(options.signal);
      if (!(await geminiSessionInterruption(page))) throw error;
    }
  }
};
