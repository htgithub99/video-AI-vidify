import { MOTION_BROWSER_HANDOFF as C } from "../../../../constants/browserLifecycle.js";
export class MotionAiWorkerPool {
  private available: string[];
  private waiting: { take: (workerId: string) => void; accepts: (workerId: string) => boolean }[] = [];
  constructor(workerIds: readonly string[]) {
    this.available = [...workerIds];
  }
  async acquire(signal?: AbortSignal, seat?: { pin?: string; avoid?: string }): Promise<{ workerId: string; release: () => void }> {
    signal?.throwIfAborted();
    const accepts = (id: string) => (seat?.pin ? id === seat.pin : !seat?.avoid || id !== seat.avoid || this.available.length === 0);
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
        accepts,
      };
      const index = this.available.findIndex((id) => (seat?.pin ? id === seat.pin : !seat?.avoid || id !== seat.avoid));
      const fallback = !seat?.pin && index < 0 ? 0 : index;
      const id = fallback >= 0 ? this.available.splice(fallback, 1)[0] : undefined;
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
        const index = this.waiting.findIndex((entry) => entry.accepts(workerId));
        const next = index >= 0 ? this.waiting.splice(index, 1)[0] : undefined;
        if (next) next.take(workerId);
        else this.available.unshift(workerId);
      },
    };
  }
}
