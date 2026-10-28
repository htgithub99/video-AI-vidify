/** Limits active work without holding a slot for aborted callers. */
export class AsyncTaskLimiter {
  private active = 0;
  private readonly waiting: Array<() => void> = [];
  constructor(private readonly concurrency: number) {
    if (!Number.isInteger(concurrency) || concurrency < 1) throw new Error("Invalid task concurrency");
  }
  async acquire(signal?: AbortSignal): Promise<() => void> {
    signal?.throwIfAborted();
    await new Promise<void>((resolve, reject) => {
      const start = () => {
        signal?.removeEventListener("abort", cancel);
        this.active++;
        resolve();
      };
      const cancel = () => {
        const index = this.waiting.indexOf(start);
        if (index >= 0) this.waiting.splice(index, 1);
        signal?.removeEventListener("abort", cancel);
        reject(signal?.reason || new Error("Task cancelled"));
      };
      if (this.active < this.concurrency) start();
      else {
        this.waiting.push(start);
        signal?.addEventListener("abort", cancel, { once: true });
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
    if (signal?.aborted) { release(); signal.throwIfAborted(); }
    return release;
  }
  async run<T>(action: () => Promise<T>, signal?: AbortSignal): Promise<T> {
    const release = await this.acquire(signal);
    try { signal?.throwIfAborted(); return await action(); }
    finally { release(); }
  }
}
