import { AI_LOAD } from "../../constants/aiLoad.js";
import { isLowSpecMode } from "./chromeBackupService.js";
type Waiter = { priority: number; seq: number; grant: () => void };
let active = 0;
let order = 0;
const queue: Waiter[] = [];
const capacity = (): number => (isLowSpecMode() ? AI_LOAD.LOW_SPEC_SLOTS : Number.POSITIVE_INFINITY);
const pump = (): void => {
  queue.sort((a, b) => a.priority - b.priority || a.seq - b.seq);
  while (queue.length && active < capacity()) {
    active++;
    queue.shift()!.grant();
  }
};
const releaser = (): (() => void) => {
  let done = false;
  return () => {
    if (done) return;
    done = true;
    active = Math.max(0, active - 1);
    pump();
  };
};
export const aiLoadPriority = (artifact?: string): number => (artifact ? AI_LOAD.PRIORITY[artifact] : undefined) ?? AI_LOAD.DEFAULT_PRIORITY;
export const acquireAiLoadSlot = (priority: number, signal?: AbortSignal): Promise<() => void> => {
  signal?.throwIfAborted();
  if (!queue.length && active < capacity()) {
    active++;
    return Promise.resolve(releaser());
  }
  return new Promise((resolve, reject) => {
    const waiter: Waiter = {
      priority,
      seq: order++,
      grant: () => {
        signal?.removeEventListener(AI_LOAD.ABORT_EVENT, stop);
        resolve(releaser());
      },
    };
    const stop = () => {
      const index = queue.indexOf(waiter);
      if (index >= 0) queue.splice(index, 1);
      reject(signal?.reason ?? new Error(AI_LOAD.ABORTED));
    };
    signal?.addEventListener(AI_LOAD.ABORT_EVENT, stop, { once: true });
    queue.push(waiter);
    pump();
  });
};
export const refreshAiLoadSlots = (): void => pump();
export const aiLoadBusy = (): boolean => active > 0 || queue.length > 0;
