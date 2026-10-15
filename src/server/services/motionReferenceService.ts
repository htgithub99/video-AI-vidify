import * as MR from "../../constants/motionRuntime.js";
import fs from "fs";
import os from "os";
import path from "path";
import { spawnSync } from "child_process";
import { getFfmpegPath } from "./shortsPreprocessService.js";
import { MOTION_REFERENCE_CONFIG as C, MOTION_REFERENCE_TEXTS as T } from "../../constants/motionReference.js";
import { normalizeMotionReferences } from "../../lib/motionReference.js";
import type { MotionAiImage } from "./motionStoryService.js";
export const withMotionReferenceFiles = async <R>(value: unknown, task: (images: MotionAiImage[]) => Promise<R>): Promise<R> => {
  const references = normalizeMotionReferences(value);
  if (!references.length) return task([]);
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), C.TEMP_PREFIX));
  try {
    const images = references.map((reference) => {
      const [, mimeType, base64] = C.DATA_URL.exec(reference.dataUrl)!;
      const bytes = Buffer.from(base64, MR.MOTION_TEXT_BASE64);
      const valid = mimeType === C.MIME_PNG ? bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) : mimeType === C.MIME_JPEG ? bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255 : bytes.toString(MR.MOTION_TEXT_ASCII, 0, 4) === MR.MOTION_TEXT_RIFF && bytes.toString(MR.MOTION_TEXT_ASCII, 8, 12) === MR.MOTION_TEXT_WEBP;
      if (!valid || bytes.length > C.MAX_BYTES) throw new Error(T.vi.invalid);
      const name = reference.name + C.EXTENSIONS[mimeType as keyof typeof C.EXTENSIONS];
      const file = path.join(directory, name);
      fs.writeFileSync(file, bytes);
      const small = path.join(directory, reference.name + C.UPLOAD_SUFFIX);
      const scaled = spawnSync(getFfmpegPath(), C.UPLOAD_ARGS(file, small, C.UPLOAD_MAX_SIDE), { windowsHide: true, timeout: C.UPLOAD_TIMEOUT_MS });
      if (scaled.status === 0 && fs.existsSync(small) && fs.statSync(small).size > 0) return { name: reference.name + C.EXTENSIONS[C.MIME_JPEG as keyof typeof C.EXTENSIONS], mimeType: C.MIME_JPEG, path: small };
      return { name, mimeType, path: file };
    });
    return await task(images);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
};
