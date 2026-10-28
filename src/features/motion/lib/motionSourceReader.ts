import { RUNTIME_TEXT as RT_SHARED } from "../../../constants/runtime/shared.js";
import { MOTION_PATTERNS as P } from "../../../constants/motionPatterns.js";
import { MOTION_STORY_CONFIG as C } from "../../../constants/motionVideo.js";
import type { MotionStorySource } from "../../../types/motionVideo.js";
export const createMotionSourceReader = (read: (text: string, signal: AbortSignal) => Promise<MotionStorySource>, receive: (source: MotionStorySource | null, text: string) => void, delay = C.SOURCE_PARSE_DELAY_MS) => {
  let current: AbortController | undefined;
  const cancel = () => {
    current?.abort();
    current = undefined;
  };
  const load = async (text: string): Promise<void> => {
    cancel();
    const controller = new AbortController();
    current = controller;
    if (text.trim().split(P.WHITESPACE).length < 3 && !P.URL.test(text)) {
      receive(null, text);
      return;
    }
    try {
      await new Promise<void>((resolve) => {
        const stop = () => {
          clearTimeout(timer);
          resolve();
        };
        const timer = setTimeout(() => {
          controller.signal.removeEventListener(RT_SHARED.ABORT, stop);
          resolve();
        }, delay);
        controller.signal.addEventListener(RT_SHARED.ABORT, stop, { once: true });
      });
      if (controller.signal.aborted) return;
      const source = await read(text, controller.signal);
      if (!controller.signal.aborted && current === controller) receive(source, text);
    } catch {
      if (!controller.signal.aborted && current === controller) receive(null, text);
    }
  };
  return { load, cancel };
};
