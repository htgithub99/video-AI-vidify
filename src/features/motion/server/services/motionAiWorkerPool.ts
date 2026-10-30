import { MOTION_BROWSER_HANDOFF as C } from "../../../../constants/browserLifecycle.js";
export class MotionAiWorkerPool {
  private available: string[];
  private waiting: { take: (workerId: string) => void }[] = [];
  constructor(workerIds: readonly string[]) {
    this.available = [...workerIds];
  }
  async acquire(signal?: AbortSignal): Promise<{ workerId: string; release: () => void }> {
    signal?.throwIfAborted();
    const workerId = await new Promise<string>((resolve, reject) => {
      const stop = () => {
        this.waiting = this.waiting.filter((entry) => entry !== waiter);
        reject(signal?.reason);
      };
      const waiter = {
        take: (id: string) => {
          signal?.removeEventListener(C.ABORT, stop);
          resolve(id);
        },
      };
      const id = this.available.shift();
      if (id !== undefined) waiter.take(id);
      else {
        this.waiting.push(waiter);
        signal?.addEventListener(C.ABORT, stop, { once: true });
      }
    });
    let released = false;
    return {
      workerId,
      release: () => {
        if (released) return;
        released = true;
        const next = this.waiting.shift();
        if (next) next.take(workerId);
        else this.available.unshift(workerId);
      },
    };
  }
}
