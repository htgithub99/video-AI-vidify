import type { BrowserContext, Locator, Page } from "playwright";
import { EXTERNAL_URLS } from "../../constants/apiRoutes.js";
import { GEMINI_ACTIVITY_CLEANUP as C } from "../../constants/geminiActivityCleanup.js";
import { throwIfPlanningCancelled } from "../../lib/chatPlanningUtils.js";
import { appLog, appWarn } from "../../lib/logger.js";
import { writeMusicDiagnostic } from "./musicDiagnosticService.js";
type Log = (line: string) => void;
interface CleanupState {
  active: number;
  revision: number;
  cleaned: number;
  closed: boolean;
  pending?: { owner?: string; signal?: AbortSignal; log?: Log };
  failed: boolean;
  flight?: Promise<boolean>;
}
const contexts = new WeakMap<BrowserContext, CleanupState>();
const flights = new Set<Promise<boolean>>();
const stateFor = (context: BrowserContext): CleanupState => {
  let state = contexts.get(context);
  if (!state) {
    state = { active: 0, revision: 1, cleaned: 0, closed: false, failed: false };
    contexts.set(context, state);
    context.once("close", () => {
      state!.closed = true;
    });
  }
  return state;
};
const emit = (state: CleanupState, line: string): void => {
  appLog(line);
  state.pending?.log?.(line);
};
const audit = async (state: CleanupState, status: string, error?: string): Promise<void> => {
  await writeMusicDiagnostic(C.LOG_STAGE, { runId: state.pending?.owner, status, revision: state.revision, errorMessage: error }).catch(() => undefined);
};
const visible = (locator: Locator) => locator.filter({ visible: true }).first();
const verifyDeleted = async (page: Page): Promise<boolean> => {
  await page.reload({ waitUntil: "domcontentloaded", timeout: C.ACTION_TIMEOUT_MS });
  await visible(page.getByRole("button", { name: C.DELETE, exact: true }))
    .or(visible(page.getByText(C.EMPTY, { exact: true })))
    .first()
    .waitFor({ state: "visible", timeout: C.ACTION_TIMEOUT_MS });
  if (await visible(page.getByText(C.EMPTY, { exact: true })).count()) return true;
  return !(await visible(page.getByText(C.TODAY, { exact: true })).count());
};
export const deleteGeminiActivityLastDay = async (page: Page, signal: AbortSignal): Promise<"deleted" | "empty"> => {
  let committed = false;
  const check = () => {
    signal.throwIfAborted();
  };
  const closeOnAbort = () => {
    void page.close().catch(() => undefined);
  };
  signal.addEventListener("abort", closeOnAbort, { once: true });
  try {
    for (let attempt = 0; attempt < C.ATTEMPTS; attempt++) {
      check();
      try {
        if (!committed) {
          await page.goto(EXTERNAL_URLS.GEMINI_ACTIVITY, { waitUntil: "domcontentloaded", timeout: C.ACTION_TIMEOUT_MS });
          const remove = visible(page.getByRole("button", { name: C.DELETE, exact: true }));
          await remove
            .or(visible(page.getByText(C.EMPTY, { exact: true })))
            .first()
            .waitFor({ state: "visible", timeout: C.ACTION_TIMEOUT_MS });
          if (await visible(page.getByText(C.EMPTY, { exact: true })).count()) return "empty";
          check();
          await remove.click({ timeout: C.ACTION_TIMEOUT_MS });
          const day = visible(
            page
              .getByRole("menuitem", { name: C.LAST_DAY, exact: true })
              .or(page.getByRole("button", { name: C.LAST_DAY, exact: true }))
              .or(page.getByText(C.LAST_DAY, { exact: true })),
          );
          await day.waitFor({ state: "visible", timeout: C.ACTION_TIMEOUT_MS });
          check();
          committed = true;
          await day.click({ timeout: C.ACTION_TIMEOUT_MS });
        }
        let confirmed = false;
        let settledAt = 0;
        const deadline = Date.now() + C.RESULT_TIMEOUT_MS;
        while (Date.now() < deadline) {
          check();
          const dialog = visible(
            page
              .getByRole("dialog")
              .or(page.getByRole("alertdialog"))
              .filter({ has: page.getByRole("heading", { name: C.CONFIRM_HEADING }) }),
          );
          const success = visible(page.getByRole("heading", { name: C.SUCCESS_HEADING }).or(page.getByText(C.SUCCESS, { exact: true })).or(page.getByText(C.SUCCESS_TEXT)));
          if (!(await dialog.count()) && (await success.count())) {
            await visible(page.getByRole("button", { name: C.DISMISS })).click({ timeout: C.POLL_MS * 5 }).catch(() => undefined);
            return "deleted";
          }
          if (!confirmed && (await dialog.count())) {
            const confirm = visible(dialog.getByRole("button", { name: C.DELETE, exact: true }));
            check();
            confirmed = true;
            await confirm.click({ timeout: C.ACTION_TIMEOUT_MS });
          }
          if (confirmed && (await visible(page.getByText(C.EMPTY, { exact: true })).count()) && !(await dialog.count())) return "deleted";
          const settled = confirmed && !(await dialog.count()) && !(await visible(page.getByText(C.PROGRESS)).count());
          if (!settled) settledAt = 0;
          else if (!settledAt) settledAt = Date.now();
          else if (Date.now() - settledAt >= C.SETTLE_MS && (await verifyDeleted(page))) return "deleted";
          await new Promise<void>((resolve) => setTimeout(resolve, C.POLL_MS));
        }
        throw new Error(C.ERROR);
      } catch (error) {
        check();
        if (committed || attempt + 1 >= C.ATTEMPTS || page.isClosed()) throw error;
        appWarn(C.RETRY(attempt + 2));
        await new Promise<void>((resolve) => setTimeout(resolve, C.RETRY_MS));
      }
    }
    throw new Error(C.ERROR);
  } finally {
    signal.removeEventListener("abort", closeOnAbort);
  }
};
export const waitForGeminiBrowserClose = async (): Promise<void> => {
  while (flights.size) await Promise.allSettled([...flights]);
};
export const acquireGeminiActivityUse = async (context: BrowserContext, signal?: AbortSignal): Promise<() => void> => {
  const state = stateFor(context);
  while (state.flight) await state.flight;
  throwIfPlanningCancelled(signal);
  if (state.closed) throw new Error(C.CLOSED);
  state.active++;
  state.revision++;
  let released = false;
  return () => {
    if (!released) {
      released = true;
      state.active--;
    }
  };
};
export const requestGeminiActivityCleanup = (context: BrowserContext, owner?: string, signal?: AbortSignal, log?: Log): void => {
  const state = stateFor(context);
  if (state.closed || state.cleaned >= state.revision) return;
  state.pending = { owner, signal, log };
  state.failed = false;
  void audit(state, C.PENDING_STATUS);
};
export const hasPendingGeminiActivityCleanup = (context: BrowserContext): boolean => !!contexts.get(context)?.pending;
export const closeAfterGeminiActivityCleanup = async (context: BrowserContext, close: () => Promise<boolean>): Promise<boolean> => {
  const state = stateFor(context);
  if (state.flight) return state.flight;
  if (state.active || state.failed) {
    if (state.pending && !state.failed) {
      emit(state, C.DEFERRED);
      void audit(state, C.DEFERRED_STATUS);
    }
    return false;
  }
  const work = Promise.resolve().then(async () => {
    if (state.pending) {
      const pending = state.pending;
      let page: Page | undefined;
      const signal = pending.signal ? AbortSignal.any([pending.signal, AbortSignal.timeout(C.TIMEOUT_MS)]) : AbortSignal.timeout(C.TIMEOUT_MS);
      try {
        signal.throwIfAborted();
        emit(state, C.START);
        page = await context.newPage();
        const result = await deleteGeminiActivityLastDay(page, signal);
        state.cleaned = state.revision;
        emit(state, result === "empty" ? C.NO_ACTIVITY : C.COMPLETE);
        await audit(state, C.SUCCESS_STATUS);
        state.pending = undefined;
      } catch (error) {
        emit(state, pending.signal?.aborted ? C.CANCELLED : C.FAILED(String((error as Error)?.message || error)));
        await audit(state, C.FAILURE_STATUS, String((error as Error)?.message || error));
        state.pending = undefined;
        state.cleaned = state.revision;
      } finally {
        await page?.close().catch(() => undefined);
      }
    }
    return close();
  });
  state.flight = work;
  flights.add(work);
  try {
    return await work;
  } finally {
    state.flight = undefined;
    flights.delete(work);
  }
};
