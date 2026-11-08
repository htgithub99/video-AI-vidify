import { AsyncLocalStorage } from "node:async_hooks";
import { CHROME_BACKUP as C } from "../../constants/chromeBackup.js";
export const waitChromeTask = <T>(pending: Promise<T>, signal?: AbortSignal): Promise<T> => {
  signal?.throwIfAborted();
  if (!signal) return pending;
  return new Promise((resolve, reject) => {
    const abort = () => reject(signal.reason);
    signal.addEventListener(C.ABORT, abort, { once: true });
    pending.then(resolve, reject).finally(() => signal.removeEventListener(C.ABORT, abort));
  });
};
export class ChromeTaskCoordinator {
  private context = new AsyncLocalStorage<boolean>();
  private active = new Set<Promise<void>>();
  private unsettledResponses = new Set<string>();
  private transition?: Promise<void>;
  private transitionFailure?: unknown;
  private failure?: Error;
  private failedAt = 0;
  generation = 0;
  get switching(): boolean {
    return !!this.transition;
  }
  get nested(): boolean {
    return !!this.context.getStore();
  }
  get failureMessage(): string | undefined {
    return this.coolingDown() ? this.failure?.message : undefined;
  }
  private coolingDown(): boolean {
    return !!this.failure && Date.now() - this.failedAt < C.FAILURE_COOLDOWN_MS;
  }
  async run<T>(work: () => Promise<T>, signal?: AbortSignal): Promise<T> {
    if (this.context.getStore()) return work();
    while (this.transition) await waitChromeTask(this.transition, signal);
    signal?.throwIfAborted();
    let finish!: () => void;
    const done = new Promise<void>((resolve) => {
      finish = resolve;
    });
    this.active.add(done);
    try {
      return await this.context.run(true, work);
    } finally {
      this.active.delete(done);
      finish();
    }
  }
  switch(expected: number, work: () => Promise<void>, log?: (line: string) => void): Promise<void> {
    if (this.transition) return this.transition;
    if (expected !== this.generation) return Promise.resolve();
    if (this.coolingDown()) return Promise.reject(this.failure);
    this.failure = undefined;
    this.transitionFailure = undefined;
    const transition = (async () => {
      log?.(C.WAIT);
      let timer: ReturnType<typeof setTimeout> | undefined;
      try {
        await Promise.race([
          Promise.all([...this.active]),
          new Promise<never>((_, reject) => {
            timer = setTimeout(() => reject(new Error(C.DRAIN_FAILED)), C.DRAIN_MS);
          }),
        ]);
        if (this.transitionFailure) throw this.transitionFailure;
        if (this.unsettledResponses.size) throw new Error(C.DRAIN_FAILED);
        log?.(C.SWITCHING);
        await work();
        this.generation++;
        log?.(C.SWITCHED);
      } catch (error) {
        const failure = Object.assign(error instanceof Error ? error : new Error(String(error)), { [C.ERROR_FLAG]: true });
        this.failure = failure;
        this.failedAt = Date.now();
        log?.(C.SWITCH_FAILED(failure.message));
        throw failure;
      } finally {
        clearTimeout(timer);
        this.transitionFailure = undefined;
      }
    })();
    this.transition = transition;
    void transition
      .finally(() => {
        if (this.transition === transition) this.transition = undefined;
      })
      .catch(() => undefined);
    return transition;
  }
  resetFailure(): void {
    if (this.transition) return;
    this.failure = undefined;
    this.failedAt = 0;
  }
  trackResponse(key: string, unsettled: boolean): void {
    if (unsettled) this.unsettledResponses.add(key);
    else this.unsettledResponses.delete(key);
  }
  fail(error: unknown): boolean {
    if (!this.transition) return false;
    this.transitionFailure = error;
    return true;
  }
}
export const sharedChromeTasks = new ChromeTaskCoordinator();
