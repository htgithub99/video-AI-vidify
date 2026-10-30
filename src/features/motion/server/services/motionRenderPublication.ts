import { parseJson } from "../../../../lib/jsonStringify.js";
import fs from "node:fs";
import path from "node:path";
import { MOTION_RENDER_VALIDATION as V } from "../../../../constants/motionRenderValidation.js";
import { MOTION_PRODUCTION as P } from "../../../../constants/motionProduction.js";
import { MotionJobStatus, type MotionResultItem } from "../../../../types/motionVideo.js";
import { logger } from "../../../../lib/logger.js";
import { getMotionRootDirectory, addMotionResult } from "./motionLibraryService.js";
import { validateMotionMedia } from "./motionMediaValidation.js";
import { writeMotionJsonAtomic } from "./motionFileUtils.js";
const manifestFile = (id: string): string => {
  if (!P.ID_RE.test(id)) throw new Error(P.INVALID_RUN);
  const directory = path.join(getMotionRootDirectory(), V.CHECKPOINT_FOLDER);
  fs.mkdirSync(directory, { recursive: true });
  return path.join(directory, id + V.PUBLICATION);
};
export const publishMotionResult = (pending: string, item: MotionResultItem, audio = false): void => {
  const root = getMotionRootDirectory();
  if (path.dirname(path.resolve(pending)) !== path.resolve(root) || path.basename(item.fileName) !== item.fileName) throw new Error(P.OUTPUT_INVALID);
  writeMotionJsonAtomic(manifestFile(item.id), { version: V.CHECKPOINT_VERSION, pending: path.basename(pending), item, audio });
  fs.renameSync(pending, path.join(root, item.fileName));
  addMotionResult(item);
};
export const finishMotionPublication = (id: string): void => {
  fs.rmSync(manifestFile(id), { force: true });
};
export const recoverMotionRenderPublications = async (validate: typeof validateMotionMedia = validateMotionMedia): Promise<void> => {
  const root = getMotionRootDirectory();
  const directory = path.join(root, V.CHECKPOINT_FOLDER);
  if (!fs.existsSync(directory)) return;
  for (const name of fs.readdirSync(directory).filter((name) => name.endsWith(V.PUBLICATION))) {
    try {
      const manifest = parseJson(fs.readFileSync(path.join(directory, name), P.ENCODING));
      const item = manifest.item as MotionResultItem;
      if (manifest.version !== V.CHECKPOINT_VERSION || !item || name !== item.id + V.PUBLICATION || !P.ID_RE.test(item.id) || path.basename(item.fileName) !== item.fileName || typeof manifest.pending !== "string" || path.basename(manifest.pending) !== manifest.pending) throw new Error(P.OUTPUT_INVALID);
      const output = path.join(root, item.fileName);
      const pending = path.join(root, manifest.pending);
      const jobFile = path.join(directory, item.id + P.EXT);
      const cancelled = () => fs.existsSync(jobFile) && parseJson(fs.readFileSync(jobFile, P.ENCODING))?.job?.status === MotionJobStatus.CANCELLED;
      if (cancelled()) continue;
      const file = fs.existsSync(output) ? output : pending;
      await validate(file, { seconds: item.durationSeconds, width: item.width, height: item.height, fps: item.fps, audio: manifest.audio === true, decode: true });
      if (cancelled()) continue;
      if (file === pending) fs.renameSync(pending, output);
      addMotionResult(item);
      writeMotionJsonAtomic(path.join(directory, item.id + P.EXT), { version: V.CHECKPOINT_VERSION, job: { id: item.id, status: MotionJobStatus.COMPLETED, progress: 1, framesDone: Math.round(item.durationSeconds * item.fps), framesTotal: Math.round(item.durationSeconds * item.fps), startedAt: Date.parse(item.createdAt), stage: P.STAGES.DONE, log: [P.STAGES.DONE], result: item } });
      finishMotionPublication(item.id);
    } catch (error) {
      logger.error(V.PUBLICATION_FAILED, error);
    }
  }
};
