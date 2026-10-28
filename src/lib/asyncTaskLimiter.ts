import { RUNTIME_TEXT as RT_CORE } from "../constants/runtime/core.js";
import { RUNTIME_TEXT as RT_SHARED } from "../constants/runtime/shared.js";
export class AsyncTaskLimiter {
  private active = 0;
  private readonly waiting: Array<() => void> = [];
  constructor(private readonly concurrency: number) {
    if (!Number.isInteger(concurrency) || concurrency < 1) throw new Error(RT_CORE.INVALID_TASK_CONCURRENCY);
  }
  async acquire(signal?: AbortSignal): Promise<() => void> {
    signal?.throwIfAborted();
    await new Promise<void>((resolve, reject) => {
      const start = () => {
        signal?.removeEventListener(RT_SHARED.ABORT, cancel);
        this.active++;
        resolve();
      };
      const cancel = () => {
        const index = this.waiting.indexOf(start);
        if (index >= 0) this.waiting.splice(index, 1);
        signal?.removeEventListener(RT_SHARED.ABORT, cancel);
        reject(signal?.reason || new Error(RT_CORE.TASK_CANCELLED));
      };
      if (this.active < this.concurrency) start();
      else {
        this.waiting.push(start);
        signal?.addEventListener(RT_SHARED.ABORT, cancel, { once: true });
        if (signal?.aborted) cancel();
      }
    });
    let released = false;
    const release = () => {
      if (released) return;
      released = true;
      this.active--;
      this.waiting.shift()?.();
    };
    if (signal?.aborted) {
      release();
      signal.throwIfAborted();
    }
    return release;
  }
  async run<T>(action: () => Promise<T>, signal?: AbortSignal): Promise<T> {
    const release = await this.acquire(signal);
    try {
      signal?.throwIfAborted();
      return await action();
    } finally {
      release();
    }
  }
}
