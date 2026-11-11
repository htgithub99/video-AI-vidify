import * as RT_MAINTENANCE from "../../../../constants/runtime/maintenance.js";
export class MotionPriorityPool {
  private free: number;
  private queue: { priority: number; order: number; take: () => void }[] = [];
  private order = 0;
  private busyMs = 0;
  private busySince = new Map<number, number>();
  private nextTicket = 0;
  private readonly startedAt = Date.now();
  constructor(readonly size: number) {
    this.free = size;
  }
  async acquire(priority: number, signal?: AbortSignal): Promise<() => void> {
    signal?.throwIfAborted();
    if (this.free > 0 && !this.queue.length) this.free--;
    else
      await new Promise<void>((resolve, reject) => {
        const entry = { priority, order: this.order++, take: () => resolve() };
        const stop = () => {
          this.queue = this.queue.filter((item) => item !== entry);
          reject(signal?.reason);
        };
        signal?.addEventListener(RT_MAINTENANCE.ABORT, stop, { once: true });
        entry.take = () => {
          signal?.removeEventListener(RT_MAINTENANCE.ABORT, stop);
          resolve();
        };
        this.queue.push(entry);
        this.queue.sort((a, b) => a.priority - b.priority || a.order - b.order);
      });
    const ticket = this.nextTicket++;
    this.busySince.set(ticket, Date.now());
    let released = false;
    return () => {
      if (released) return;
      released = true;
      this.busyMs += Date.now() - (this.busySince.get(ticket) || Date.now());
      this.busySince.delete(ticket);
      const next = this.queue.shift();
      if (next) next.take();
      else this.free++;
    };
  }
  async run<T>(priority: number, task: () => Promise<T>, signal?: AbortSignal): Promise<T> {
    const release = await this.acquire(priority, signal);
    try {
      return await task();
    } finally {
      release();
    }
  }
  utilization(): number {
    const now = Date.now();
    const active = [...this.busySince.values()].reduce((sum, since) => sum + now - since, 0);
    const capacity = (now - this.startedAt) * this.size;
    return capacity > 0 ? Math.min(1, (this.busyMs + active) / capacity) : 0;
  }
}
