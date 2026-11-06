import { setTimeout as delay } from "node:timers/promises";
import { MOTION_PRODUCTION as P } from "../../../../constants/motionProduction.js";
import { MOTION_PROGRESS as PROGRESS } from "../../../../constants/motionProgress.js";
import { motionEarlySceneInput, type MotionEarlySceneInput } from "../../../../lib/motionProduction.js";
import { MotionJobStatus as S, type MotionStoryAnalysis, type MotionStoryJobState, type MotionStoryScript } from "../../../../types/motionVideo.js";

export interface MotionEarlyScenes {
  offer: (script: MotionStoryScript) => void;
  settle: () => Promise<MotionStoryScript["gen"] | undefined>;
  stop: () => void;
}
interface MotionEarlySceneOptions {
  stage: string;
  text: { START: (ready: number, total: number) => string; WAIT: string; STOPPED: (reason: string) => string };
  analysis: () => MotionStoryAnalysis | undefined;
  start: (input: MotionEarlySceneInput, first: boolean) => { job: { id: string } };
  getJob: (id: string) => MotionStoryJobState | null | undefined;
  cancel: (id: string) => void;
  log: (line: string) => void;
  signal: AbortSignal;
  pollMs: number;
}
const TERMINAL = new Set<S>([S.COMPLETED, S.CANCELLED, S.ERROR]);
export const createMotionEarlyScenes = (opts: MotionEarlySceneOptions): MotionEarlyScenes => {
  let wanted: MotionStoryScript | undefined;
  let running: Promise<void> | undefined;
  let jobId: string | undefined;
  let doneKey = "";
  let closed = false;
  let gen: MotionStoryScript["gen"];
  let runs = 0;
  const follow = async (id: string): Promise<void> => {
    let previous: string[] = [];
    for (;;) {
      const job = opts.getJob(id);
      if (!job) return;
      let overlap = Math.min(previous.length, job.log.length);
      while (overlap && previous.slice(-overlap).some((line, index) => line !== job.log[index])) overlap--;
      for (const line of job.log.slice(overlap)) opts.log(PROGRESS.SCOPE(opts.stage, line));
      previous = [...job.log];
      if (job.result) gen = (job.result as MotionStoryScript).gen || gen;
      if (TERMINAL.has(job.status)) {
        if (job.status !== S.COMPLETED && !opts.signal.aborted) opts.log(PROGRESS.SCOPE(opts.stage, opts.text.STOPPED(job.error || P.INTERRUPTED)));
        return;
      }
      await delay(opts.pollMs, undefined, { signal: opts.signal });
    }
  };
  const pump = (): void => {
    if (running || closed) return;
    running = (async () => {
      while (wanted && !closed) {
        opts.signal.throwIfAborted();
        const input = motionEarlySceneInput(wanted, opts.analysis());
        wanted = undefined;
        if (!input || input.key === doneKey) continue;
        doneKey = input.key;
        opts.log(PROGRESS.SCOPE(opts.stage, opts.text.START(input.ready, input.total)));
        jobId = opts.start({ ...input, script: { ...input.script, gen: gen || input.script.gen } }, runs === 0).job.id;
        runs++;
        await follow(jobId);
        jobId = undefined;
      }
    })()
      .catch((error: unknown) => {
        if (!opts.signal.aborted) opts.log(PROGRESS.SCOPE(opts.stage, opts.text.STOPPED(String((error as Error)?.message || error))));
      })
      .finally(() => {
        running = undefined;
        if (wanted && !closed) pump();
      });
  };
  return {
    offer: (script) => {
      if (closed) return;
      wanted = script;
      pump();
    },
    settle: async () => {
      closed = true;
      wanted = undefined;
      if (running) opts.log(PROGRESS.SCOPE(opts.stage, opts.text.WAIT));
      await running;
      return gen;
    },
    stop: () => {
      closed = true;
      wanted = undefined;
      if (jobId) opts.cancel(jobId);
    },
  };
};
