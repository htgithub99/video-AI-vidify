import { HEAVY_JOB } from "../../constants/mediaEncoder.js";
type Waiter = { label: string; resolve: () => void; signal?: AbortSignal };
const running = new Map<string, string[]>();
const waiting = new Map<string, Waiter[]>();
const slots = (kind: string): number => HEAVY_JOB.SLOTS[kind] || 1;
const wake = (kind: string): void => {
  const queue = waiting.get(kind) || [];
  while (queue.length && (running.get(kind)?.length || 0) < slots(kind)) {
    const next = queue.shift()!;
    if (next.signal?.aborted) continue;
    running.set(kind, [...(running.get(kind) || []), next.label]);
    next.resolve();
  }
};
export const heavyJobHolders = (kind: string): string[] => running.get(kind) || [];
export const runHeavyJob = async <T>(kind: string, label: string, run: () => Promise<T>, opts: { signal?: AbortSignal; onWait?: (holder: string) => void; onStart?: (waitedSeconds: number) => void } = {}): Promise<T> => {
  const started = Date.now();
  if ((running.get(kind)?.length || 0) >= slots(kind)) {
    opts.onWait?.(heavyJobHolders(kind).join(", "));
    await new Promise<void>((resolve, reject) => {
      const waiter: Waiter = { label, resolve, signal: opts.signal };
      waiting.set(kind, [...(waiting.get(kind) || []), waiter]);
      opts.signal?.addEventListener(
        "abort",
        () => {
          waiting.set(
            kind,
            (waiting.get(kind) || []).filter((w) => w !== waiter),
          );
          reject(opts.signal?.reason instanceof Error ? opts.signal.reason : new Error(String(opts.signal?.reason || "aborted")));
        },
        { once: true },
      );
    });
  } else running.set(kind, [...(running.get(kind) || []), label]);
  opts.onStart?.((Date.now() - started) / 1000);
  try {
    return await run();
  } finally {
    const list = running.get(kind) || [];
    const at = list.indexOf(label);
    if (at >= 0) list.splice(at, 1);
    running.set(kind, list);
    wake(kind);
  }
};
export const HEAVY_RENDER = HEAVY_JOB.RENDER;
export const HEAVY_VOICE = HEAVY_JOB.VOICE;
