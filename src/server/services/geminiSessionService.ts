import type { Page } from 'playwright';
import { setTimeout as pause } from 'node:timers/promises';
import { CINEMATIC_CHAT_PLANNING_CONFIG as CONFIG } from '../../constants/cinematicConstants.js';
import type { MusicUploadProgress } from '../../types/musicDownloadProgress.js';
import { throwIfPlanningCancelled } from '../../lib/chatPlanningUtils.js';
import { ChatUploadError } from './chatUploadRecovery.js';

export const geminiSessionInterruption = async (page: Page): Promise<'verification' | 'login' | undefined> => {
  if (page.isClosed()) return;
  const url = new URL(page.url());
  if (url.hostname === 'accounts.google.com') return 'login';
  if (/(^|\.)google\.com$/.test(url.hostname) && url.pathname.startsWith('/sorry')) return 'verification';
  if (url.hostname === 'gemini.google.com' && await page.locator('form[action*="/sorry/"], iframe[src*="/recaptcha/"][src*="/bframe"], iframe[src*="/recaptcha/"][src*="/anchor"]').filter({ visible: true }).count().catch(() => 0)) return 'verification';
};

interface SessionWaitOptions {
  signal?: AbortSignal;
  expected?: number;
  onProgress?: (progress: MusicUploadProgress) => void;
  retainBrowser: () => () => void;
  pollMs?: number;
}

// Only observe the challenge. Its controls belong to the user.
export const waitForGeminiSession = async (page: Page, options: SessionWaitOptions): Promise<number> => {
  throwIfPlanningCancelled(options.signal);
  const interruption = await geminiSessionInterruption(page);
  if (!interruption) return 0;
  const started = Date.now();
  const releaseBrowser = options.retainBrowser();
  let lastNotice = 0;
  try {
    await page.bringToFront().catch(() => undefined);
    for (;;) {
      throwIfPlanningCancelled(options.signal);
      if (page.isClosed()) throw new ChatUploadError('gemini_verification_tab_closed – Tab chờ xác minh đã bị đóng. Hãy chạy lại tác vụ khi sẵn sàng.', false);
      const blocked = await geminiSessionInterruption(page);
      const isGemini = new URL(page.url()).hostname === 'gemini.google.com';
      if (!blocked && isGemini && await page.locator(CONFIG.GEMINI_INPUT_SELECTOR).filter({ visible: true }).last().isEditable().catch(() => false)) {
        options.onProgress?.({ phase: 'verification-resumed', expected: options.expected || 0, elapsedMs: Date.now() - started, message: 'Gemini đã sẵn sàng sau xác minh; đang tiếp tục tác vụ.' });
        return Math.max(1, Date.now() - started);
      }
      if (!lastNotice || Date.now() - lastNotice >= 30000) {
        options.onProgress?.({ phase: 'verification-waiting', expected: options.expected || 0, elapsedMs: Date.now() - started, message: interruption === 'login' ? 'Đang chờ bạn đăng nhập trong tab Chrome đang mở và trở lại Gemini. Tác vụ đang được giữ.' : 'Đang chờ bạn xác minh Google trong tab Chrome đang mở và trở lại Gemini. Tác vụ đang được giữ.' });
        lastNotice = Date.now();
      }
      await pause(options.pollMs ?? 1000, undefined, { signal: options.signal }).catch((error) => { throwIfPlanningCancelled(options.signal); throw error; });
    }
  } finally { releaseBrowser(); }
};

// Retrying here is safe only for reading/preparing UI, never for sending a prompt.
export const withGeminiSession = async <T>(page: Page, operation: () => Promise<T>, options: SessionWaitOptions): Promise<T> => {
  for (;;) {
    await waitForGeminiSession(page, options);
    try { return await operation(); }
    catch (error) {
      throwIfPlanningCancelled(options.signal);
      if (!await geminiSessionInterruption(page)) throw error;
    }
  }
};
