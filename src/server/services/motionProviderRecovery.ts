import { RUNTIME_TEXT as RT_SHARED } from "../../constants/runtime/shared.js";
import { MOTION_AI_RECOVERY as R } from "../../constants/motionAiRecovery.js";
type Recovery = { owner: string; done: Promise<{ error?: unknown }>; finish: (result: { error?: unknown }) => void; expires: number; finished: boolean };
export class MotionProviderRecovery {
  private entries = new Map<string, Recovery>();
  private current(key: string): Recovery | undefined {
    const entry = this.entries.get(key);
    if (entry && entry.expires <= Date.now()) {
      this.entries.delete(key);
      return undefined;
    }
    return entry;
  }
  waiting(key: string, owner: string): boolean {
    const entry = this.current(key);
    return !!entry && (entry.owner !== owner || entry.finished);
  }
  claim(key: string, owner: string): boolean {
    const entry = this.current(key);
    if (entry) return entry.owner === owner && !entry.finished;
    let finish!: Recovery["finish"];
    const done = new Promise<{ error?: unknown }>((resolve) => {
      finish = resolve;
    });
    this.entries.set(key, { owner, done, finish, expires: Infinity, finished: false });
    return true;
  }
  async wait(key: string, owner: string, signal?: AbortSignal): Promise<void> {
    signal?.throwIfAborted();
    const entry = this.current(key);
    if (!entry || (entry.owner === owner && !entry.finished)) return;
    const result = await new Promise<{ error?: unknown }>((resolve, reject) => {
      const cancel = () => {
        signal?.removeEventListener(RT_SHARED.ABORT, cancel);
        reject(signal?.reason);
      };
      signal?.addEventListener(RT_SHARED.ABORT, cancel, { once: true });
      entry.done.then((value) => {
        signal?.removeEventListener(RT_SHARED.ABORT, cancel);
        resolve(value);
      });
    });
    signal?.throwIfAborted();
    if (result.error !== undefined) throw result.error;
  }
  finish(key: string, owner: string, error?: unknown): void {
    const entry = this.current(key);
    if (!entry || entry.owner !== owner || entry.finished) return;
    entry.finished = true;
    entry.expires = Date.now() + R.PROVIDER_ERROR_COOLDOWN_MS;
    entry.finish({ error });
    if (error === undefined) this.entries.delete(key);
  }
}
