import { MOTION_BROWSER_HANDOFF as C } from "../constants/browserLifecycle.js";
export const waitForMotionBrowser = <T>(pending: Promise<T>, signal?: AbortSignal): Promise<T> => {
  if (!signal) return pending;
  signal.throwIfAborted();
  return new Promise<T>((resolve, reject) => {
    const abort = () => reject(signal.reason);
    signal.addEventListener(C.ABORT, abort, { once: true });
    pending.then(
      (value) => {
        signal.removeEventListener(C.ABORT, abort);
        resolve(value);
      },
      (error) => {
        signal.removeEventListener(C.ABORT, abort);
        reject(error);
      },
    );
  });
};
const reservation = () => {
  let finish!: () => void;
  const done = new Promise<void>((resolve) => (finish = resolve));
  return { done, finish };
};
export class MotionBrowserLifecycle {
  private sessions = new Set<Promise<void>>();
  private render?: ReturnType<typeof reservation>;
  async acquireSession(signal?: AbortSignal): Promise<() => void> {
    while (this.render) await waitForMotionBrowser(this.render.done, signal);
    signal?.throwIfAborted();
    const session = reservation();
    this.sessions.add(session.done);
    return () => {
      this.sessions.delete(session.done);
      session.finish();
    };
  }
  async acquireRender(signal?: AbortSignal, waiting?: (count: number) => void): Promise<() => void> {
    while (this.render) await waitForMotionBrowser(this.render.done, signal);
    signal?.throwIfAborted();
    const render = reservation();
    this.render = render;
    const release = () => {
      if (this.render === render) this.render = undefined;
      render.finish();
    };
    try {
      if (this.sessions.size) waiting?.(this.sessions.size);
      await waitForMotionBrowser(Promise.all([...this.sessions]), signal);
      signal?.throwIfAborted();
      return release;
    } catch (error) {
      release();
      throw error;
    }
  }
}
