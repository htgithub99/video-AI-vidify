import { STUDIO_RUNTIME as XRT } from "../../constants/studioRuntime.js";
import * as SRT from "../../constants/sourceText.js";
import { createHash } from "crypto";
import fs from "fs";
import path from "path";
import { MOTION_REFERENCE_CONFIG as C, MOTION_REFERENCE_PROMPTS } from "../../constants/motionReference.js";
import { normalizeMotionReferences, normalizeMotionReferenceStyle } from "../../lib/motionReference.js";
import { throwIfPlanningCancelled } from "../../lib/chatPlanningUtils.js";
import type { MotionReferenceStyle } from "../../types/motionVideo.js";
import { getMotionRootDirectory } from "./motionLibraryService.js";
import { writeMotionJsonAtomic } from "./motionFileUtils.js";
const pending = new Map<string, Promise<unknown>>();
const usableStyle = (value: unknown, count: number): MotionReferenceStyle | undefined => {
  const style = normalizeMotionReferenceStyle(value);
  return style?.kit && !MOTION_REFERENCE_PROMPTS.STYLE_UNSEEN.test(style.description) && Array.from({ length: count }, (_, index) => C.NAME_PREFIX + (index + 1)).every((name) => style.images?.some((image) => image.name === name)) ? style : undefined;
};
export const withCachedMotionReferenceStyle = async (value: unknown, analyze: () => Promise<MotionReferenceStyle | undefined>, options: { signal?: AbortSignal; log?: (line: string) => void } = {}): Promise<MotionReferenceStyle> => {
  const references = normalizeMotionReferences(value);
  const fingerprints = references.map((reference) =>
    createHash(SRT.SOURCE_TEXT_SHA256)
      .update(Buffer.from(C.DATA_URL.exec(reference.dataUrl)![2], SRT.SOURCE_TEXT_BASE64))
      .digest(SRT.SOURCE_TEXT_HEX),
  );
  const key = createHash(SRT.SOURCE_TEXT_SHA256).update(JSON.stringify(fingerprints)).digest(SRT.SOURCE_TEXT_HEX);
  const directory = path.join(getMotionRootDirectory(), C.CACHE_FOLDER);
  const file = path.join(directory, XRT.JSON_FILENAME(key));
  const previous = pending.get(file);
  let release!: () => void;
  const completed = new Promise<void>((resolve) => {
    release = resolve;
  });
  const queued = (previous || Promise.resolve()).then(() => completed);
  pending.set(file, queued);
  void queued.then(() => {
    if (pending.get(file) === queued) pending.delete(file);
  });
  try {
    if (previous)
      await new Promise<void>((resolve, reject) => {
        const abort = () => {
          options.signal?.removeEventListener(SRT.SOURCE_TEXT_ABORT, abort);
          reject(new Error(XRT.CHAT_PLANNING_CANCELLED));
        };
        options.signal?.addEventListener(SRT.SOURCE_TEXT_ABORT, abort, { once: true });
        if (options.signal?.aborted) abort();
        void previous.then(() => {
          options.signal?.removeEventListener(SRT.SOURCE_TEXT_ABORT, abort);
          resolve();
        });
      });
    throwIfPlanningCancelled(options.signal);
    try {
      const stored = JSON.parse(fs.readFileSync(file, SRT.SOURCE_TEXT_UTF8));
      const style = stored.version === C.CACHE_VERSION && stored.key === key ? usableStyle(stored.style, references.length) : undefined;
      if (style) {
        options.log?.(C.CACHE_HIT_LOG);
        return style;
      }
    } catch {}
    const style = usableStyle(await analyze(), references.length);
    throwIfPlanningCancelled(options.signal);
    if (!style) throw new Error(MOTION_REFERENCE_PROMPTS.STYLE_FAILED);
    fs.mkdirSync(directory, { recursive: true });
    writeMotionJsonAtomic(file, { version: C.CACHE_VERSION, key, style });
    options.log?.(C.CACHE_SAVED_LOG);
    return style;
  } finally {
    release();
  }
};
