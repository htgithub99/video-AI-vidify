import { randomUUID } from "crypto";
import _ from "lodash";
import { MOTION_TEMPLATE_DANG_DUNG, MOTION_TEMPLATE_LOI, MOTION_TEMPLATE_MOTION_STORY_FAILED, MOTION_TEMPLATE_SYMBOL_7, MOTION_TEXT_ABORT, MOTION_TEXT_CANCELLED, MOTION_TEXT_CONTROLLER, MOTION_TEXT_DA_HUY, MOTION_TEXT_HOAN_TAT, MOTION_TEXT_STOPPING, MOTION_TEXT_VI_VN } from "../../constants/motionRuntime.js";
import { MOTION_VIDEO_CONSTANTS } from "../../constants/motionVideo.js";
import { MOTION_AI_RECOVERY as AIR } from "../../constants/motionAiRecovery.js";
import { logger } from "../../lib/logger.js";
import { MotionJobStatus, MotionStoryJobKind, type MotionStoryJobState, type MotionAiLog } from "../../types/motionVideo.js";
import { runInMotionAiSession, type MotionEditorialSession } from "./motionStoryService.js";
import { saveMotionStoryCheckpoint, readMotionStoryCheckpoint } from "./motionStoryCheckpointService.js";
import { MOTION_PRODUCTION as PRODUCTION } from "../../constants/motionProduction.js";
import { motionStoryLogs } from "./motionLogStore.js";
type InternalJob = MotionStoryJobState & { controller: AbortController; editorialSessionId?: string; editorialRevision?: string; requestKey?: string };
const jobs = new Map<string, InternalJob>();
const ACTIVE = [MotionJobStatus.QUEUED, MotionJobStatus.PREPARING, MotionJobStatus.RENDERING, MotionJobStatus.ENCODING];
export interface StoryJobContext {
  signal: AbortSignal;
  log: MotionAiLog;
  progress: (value: number, stage?: string) => void;
  partial: (result: unknown) => void;
}
const publicJob = (job: InternalJob): MotionStoryJobState => _.omit(job, [MOTION_TEXT_CONTROLLER, "editorialSessionId", "editorialRevision", "requestKey"]) as MotionStoryJobState;
export const startStoryJob = (keepBrowser: boolean, kind: MotionStoryJobKind, run: (ctx: StoryJobContext) => Promise<unknown>, editorial?: MotionEditorialSession, requestKey?: string): MotionStoryJobState => {
  const running = _.find([...jobs.values()], (j) => !!(requestKey || editorial?.id) && j.kind === kind && j.requestKey === requestKey && j.editorialSessionId === editorial?.id && j.editorialRevision === editorial?.revision && _.includes(ACTIVE, j.status));
  if (running) return publicJob(running);
  if (editorial) for (const previous of jobs.values()) if (previous.editorialSessionId === editorial.id && previous.editorialRevision !== editorial.revision && _.includes(ACTIVE, previous.status)) previous.controller.abort();
  const job: InternalJob = { id: randomUUID(), kind, status: MotionJobStatus.RENDERING, progress: 0, log: [], startedAt: Date.now(), controller: new AbortController(), editorialSessionId: editorial?.id, editorialRevision: editorial?.revision, requestKey };
  jobs.set(job.id, job);
  const logs = motionStoryLogs();
  let persistenceError: unknown;
  let pendingSave: ReturnType<typeof setTimeout> | undefined;
  const save = () => {
    if (pendingSave) clearTimeout(pendingSave);
    pendingSave = undefined;
    saveMotionStoryCheckpoint({ ...publicJob(job), ...(job.controller.signal.aborted && !persistenceError ? { status: MotionJobStatus.CANCELLED, activeAi: {} } : {}) });
  };
  const failedSave = (error: unknown) => {
    persistenceError ||= error;
    job.status = MotionJobStatus.ERROR;
    job.error = PRODUCTION.SAVE_FAILED + ": " + String((persistenceError as Error)?.message || persistenceError);
    logger.error(PRODUCTION.SAVE_FAILED, error);
    if (!job.controller.signal.aborted) job.controller.abort(error);
  };
  const safeSave = () => {
    try {
      save();
    } catch (error) {
      failedSave(error);
    }
  };
  const scheduleSave = () => {
    if (!pendingSave) pendingSave = setTimeout(safeSave, PRODUCTION.SNAPSHOT_DELAY);
  };
  try {
    save();
  } catch (error) {
    jobs.delete(job.id);
    throw error;
  }
  job.controller.signal.addEventListener(MOTION_TEXT_ABORT, safeSave, { once: true });
  const ctx: StoryJobContext = {
    signal: job.controller.signal,
    log: (line, activity) => {
      if (activity && _.includes(ACTIVE, job.status) && !job.controller.signal.aborted) {
        job.activeAi ||= {};
        if (activity.phase === AIR.PHASE.DONE) delete job.activeAi[activity.workerId];
        else job.activeAi[activity.workerId] = activity;
      }
      if (line) {
        const entry = MOTION_TEMPLATE_SYMBOL_7(String(new Date().toLocaleTimeString(MOTION_TEXT_VI_VN)), String(line));
        try {
          logs.append(job.id, entry);
        } catch (error) {
          failedSave(error);
          throw error;
        }
        job.log = _.takeRight([...job.log, entry], MOTION_VIDEO_CONSTANTS.MAX_LOG_LINES);
      }
      scheduleSave();
    },
    progress: (value, stage) => {
      if (!_.includes(ACTIVE, job.status) || job.controller.signal.aborted) return;
      if (Number.isFinite(value)) job.progress = Math.max(job.progress, _.clamp(value, 0, 0.99));
      if (stage) job.stage = stage;
      scheduleSave();
    },
    partial: (result) => {
      if (job.controller.signal.aborted || !_.includes(ACTIVE, job.status)) return;
      job.result = result;
      try {
        save();
      } catch (error) {
        failedSave(error);
        throw error;
      }
    },
  };
  const stopped = new Promise<never>((_resolve, reject) => job.controller.signal.addEventListener(MOTION_TEXT_ABORT, () => reject(new Error(MOTION_TEXT_CANCELLED)), { once: true }));
  stopped.catch(_.noop);
  void (async () => {
    try {
      const result = await Promise.race([kind === MotionStoryJobKind.VOICE ? run(ctx) : runInMotionAiSession(job.id, () => run(ctx), ctx.log, keepBrowser, ctx.signal, editorial), stopped]);
      job.controller.signal.throwIfAborted();
      job.result = result;
      job.progress = 1;
      job.status = MotionJobStatus.COMPLETED;
      job.stage = MOTION_TEXT_HOAN_TAT;
      ctx.log(MOTION_TEXT_HOAN_TAT);
    } catch (error: any) {
      const aborted = job.controller.signal.aborted && !persistenceError;
      job.status = aborted ? MotionJobStatus.CANCELLED : MotionJobStatus.ERROR;
      job.error = aborted ? undefined : persistenceError ? PRODUCTION.SAVE_FAILED + ": " + String((persistenceError as Error)?.message || persistenceError) : _.toString(error?.message || error);
      try {
        ctx.log(aborted ? MOTION_TEXT_DA_HUY : MOTION_TEMPLATE_LOI(String(job.error)));
      } catch (writeError) {
        failedSave(writeError);
      }
      if (!aborted) logger.error(MOTION_TEMPLATE_MOTION_STORY_FAILED(String(kind)), error);
    } finally {
      job.activeAi = {};
      safeSave();
      setTimeout(() => jobs.delete(job.id), MOTION_VIDEO_CONSTANTS.JOB_TTL_MS).unref();
    }
  })();
  return publicJob(job);
};
export const getStoryJob = (id: string): MotionStoryJobState | null => {
  const job = jobs.get(id);
  return job ? publicJob(job) : readMotionStoryCheckpoint(id);
};
export const cancelStoryJob = (id?: string, editorialSessionId?: string): boolean => {
  let any = false;
  let failure: unknown;
  for (const job of id ? _.compact([jobs.get(id)]) : [...jobs.values()]) {
    if (!id && editorialSessionId && job.editorialSessionId !== editorialSessionId) continue;
    if (!_.includes(ACTIVE, job.status)) continue;
    job.stage = MOTION_TEXT_STOPPING;
    const entry = MOTION_TEMPLATE_DANG_DUNG(String(new Date().toLocaleTimeString(MOTION_TEXT_VI_VN)));
    try {
      motionStoryLogs().append(job.id, entry);
      job.log = _.takeRight([...job.log, entry], MOTION_VIDEO_CONSTANTS.MAX_LOG_LINES);
    } catch (error) {
      failure ||= error;
    } finally {
      job.controller.abort();
    }
    any = true;
  }
  if (failure) throw failure;
  return any;
};
