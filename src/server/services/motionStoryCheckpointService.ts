import fs from "node:fs";
import path from "node:path";
import { MOTION_PRODUCTION as P } from "../../constants/motionProduction.js";
import { MotionJobStatus, MotionStoryJobKind, type MotionStoryJobState } from "../../types/motionVideo.js";
import { getMotionRootDirectory } from "./motionLibraryService.js";
import { writeMotionJsonAtomic } from "./motionFileUtils.js";
const fileOf = (id: string): string | undefined => (P.ID_RE.test(id) ? path.join(getMotionRootDirectory(), P.SNAPSHOT_FOLDER, id + P.EXT) : undefined);
export const saveMotionStoryCheckpoint = (job: MotionStoryJobState): void => {
  const file = fileOf(job.id);
  if (!file) return;
  fs.mkdirSync(path.dirname(file), { recursive: true });
  writeMotionJsonAtomic(file, { version: P.SNAPSHOT_VERSION, job });
};
export const readMotionStoryCheckpoint = (id: string): MotionStoryJobState | null => {
  const file = fileOf(id);
  if (!file) return null;
  if (!fs.existsSync(file)) return null;
  try {
    const saved = JSON.parse(fs.readFileSync(file, P.ENCODING));
    const job = saved.job as MotionStoryJobState;
    if (saved.version !== P.SNAPSHOT_VERSION || job?.id !== id || !Object.values(MotionJobStatus).includes(job.status) || !Array.isArray(job.log)) throw new Error(P.SNAPSHOT_INVALID);
    if (![MotionJobStatus.COMPLETED, MotionJobStatus.CANCELLED, MotionJobStatus.ERROR].includes(job.status)) {
      Object.assign(job, { status: MotionJobStatus.ERROR, error: P.INTERRUPTED, stage: P.RECOVERED, activeAi: {}, interrupted: true });
      job.log.push(P.RECOVERED);
      saveMotionStoryCheckpoint(job);
    }
    return job;
  } catch {
    return { id, kind: MotionStoryJobKind.SCRIPT, status: MotionJobStatus.ERROR, error: P.SNAPSHOT_INVALID, stage: P.RECOVERED, progress: 0, startedAt: 0, log: [P.SNAPSHOT_INVALID], interrupted: true };
  }
};
