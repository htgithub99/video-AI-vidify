import { randomUUID } from "crypto";
import _ from "lodash";
import { MOTION_TEMPLATE_DANG_DUNG, MOTION_TEMPLATE_LOI, MOTION_TEMPLATE_MOTION_STORY_FAILED, MOTION_TEMPLATE_SYMBOL_7, MOTION_TEXT_ABORT, MOTION_TEXT_CANCELLED, MOTION_TEXT_CONTROLLER, MOTION_TEXT_DA_HUY, MOTION_TEXT_HOAN_TAT, MOTION_TEXT_STOPPING, MOTION_TEXT_VI_VN } from "../../constants/motionRuntime.js";
import { MOTION_VIDEO_CONSTANTS } from "../../constants/motionVideo.js";
import { logger } from "../../lib/logger.js";
import { MotionJobStatus, type MotionStoryJobKind, type MotionStoryJobState } from "../../types/motionVideo.js";
import { runInMotionAiSession } from "./motionStoryService.js";
type InternalJob = MotionStoryJobState & { controller: AbortController };
const jobs = new Map<string, InternalJob>();
const ACTIVE = [MotionJobStatus.QUEUED, MotionJobStatus.PREPARING, MotionJobStatus.RENDERING, MotionJobStatus.ENCODING];
export interface StoryJobContext {
  signal: AbortSignal;
  log: (line: string) => void;
  progress: (value: number, stage?: string) => void;
  partial: (result: unknown) => void;
}
const publicJob = (job: InternalJob): MotionStoryJobState => _.omit(job, [MOTION_TEXT_CONTROLLER]) as MotionStoryJobState;
export const startStoryJob = (kind: MotionStoryJobKind, run: (ctx: StoryJobContext) => Promise<unknown>): MotionStoryJobState => {
  const running = _.find([...jobs.values()], (j) => j.kind === kind && _.includes(ACTIVE, j.status));
  if (running) return publicJob(running);
  const job: InternalJob = { id: randomUUID(), kind, status: MotionJobStatus.RENDERING, progress: 0, log: [], startedAt: Date.now(), controller: new AbortController() };
  jobs.set(job.id, job);
  const ctx: StoryJobContext = {
    signal: job.controller.signal,
    log: (line) => {
      job.log = _.takeRight([...job.log, MOTION_TEMPLATE_SYMBOL_7(`${new Date().toLocaleTimeString(MOTION_TEXT_VI_VN)}`, `${line}`)], MOTION_VIDEO_CONSTANTS.MAX_LOG_LINES);
    },
    progress: (value, stage) => {
      job.progress = _.clamp(value, 0, 1);
      if (stage) job.stage = stage;
    },
    partial: (result) => {
      job.result = result;
    },
  };
  const stopped = new Promise<never>((_resolve, reject) => job.controller.signal.addEventListener(MOTION_TEXT_ABORT, () => reject(new Error(MOTION_TEXT_CANCELLED)), { once: true }));
  stopped.catch(_.noop);
  void (async () => {
    try {
      const result = await Promise.race([runInMotionAiSession(job.id, () => run(ctx)), stopped]);
      job.result = result;
      job.progress = 1;
      job.status = MotionJobStatus.COMPLETED;
      ctx.log(MOTION_TEXT_HOAN_TAT);
    } catch (error: any) {
      const aborted = job.controller.signal.aborted;
      job.status = aborted ? MotionJobStatus.CANCELLED : MotionJobStatus.ERROR;
      job.error = aborted ? undefined : _.toString(error?.message || error);
      ctx.log(aborted ? MOTION_TEXT_DA_HUY : MOTION_TEMPLATE_LOI(`${job.error}`));
      if (!aborted) logger.error(MOTION_TEMPLATE_MOTION_STORY_FAILED(`${kind}`), error);
    } finally {
      setTimeout(() => jobs.delete(job.id), MOTION_VIDEO_CONSTANTS.JOB_TTL_MS).unref();
    }
  })();
  return publicJob(job);
};
export const getStoryJob = (id: string): MotionStoryJobState | null => {
  const job = jobs.get(id);
  return job ? publicJob(job) : null;
};
export const cancelStoryJob = (id?: string): boolean => {
  let any = false;
  for (const job of id ? _.compact([jobs.get(id)]) : [...jobs.values()]) {
    if (!_.includes(ACTIVE, job.status)) continue;
    job.stage = MOTION_TEXT_STOPPING;
    job.log = _.takeRight([...job.log, MOTION_TEMPLATE_DANG_DUNG(`${new Date().toLocaleTimeString(MOTION_TEXT_VI_VN)}`)], MOTION_VIDEO_CONSTANTS.MAX_LOG_LINES);
    job.controller.abort();
    any = true;
  }
  return any;
};
