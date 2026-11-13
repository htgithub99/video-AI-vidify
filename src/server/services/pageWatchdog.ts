import type { Page } from "playwright";
import { setTimeout as delay } from "node:timers/promises";
import { PAGE_WATCHDOG as W } from "../../constants/pageWatchdog.js";
import { appWarn } from "../../lib/logger.js";
import { isLowSpecMode } from "./chromeBackupService.js";
const watched = new WeakSet<Page>();
const responsive = (page: Page): Promise<boolean> =>
  Promise.race([
    page.evaluate(() => true).then(
      () => true,
      () => true,
    ),
    delay(W.PROBE_TIMEOUT_MS, false, { ref: false }),
  ]);
export const watchHungPage = <T extends Page | null | undefined>(page: T, label: string): T => {
  if (!page || page.isClosed() || watched.has(page)) return page;
  watched.add(page);
  let misses = 0;
  let busy = false;
  const stop = () => clearInterval(timer);
  const timer = setInterval(() => {
    if (busy) return;
    if (page.isClosed()) return stop();
    busy = true;
    void responsive(page)
      .then(async (alive) => {
        misses = alive ? 0 : misses + 1;
        const limit = isLowSpecMode() ? W.LOW_SPEC_MAX_MISSES : W.MAX_MISSES;
        if (misses < limit || page.isClosed()) return;
        stop();
        appWarn(W.HUNG_LOG(label, Math.round((misses * (W.INTERVAL_MS + W.PROBE_TIMEOUT_MS)) / 1000)));
        await Promise.race([page.close({ runBeforeUnload: false }), delay(W.CLOSE_TIMEOUT_MS, undefined, { ref: false })]).catch(() => undefined);
      })
      .finally(() => {
        busy = false;
      });
  }, W.INTERVAL_MS);
  timer.unref?.();
  page.once(W.CLOSE_EVENT, stop);
  return page;
};
