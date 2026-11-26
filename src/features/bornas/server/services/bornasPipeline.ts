import { randomUUID } from "crypto";
import _ from "lodash";
import { logger } from "../../../../lib/logger.js";
import { runInMotionAiSession, closeMotionStandaloneBrowser } from "../../../motion/server/services/motionStoryService.js";
import { HEAVY_RENDER, HEAVY_VOICE, runHeavyJob } from "../../../../server/utils/heavyJobQueue.js";
import { HEAVY_JOB_TEXT } from "../../../../constants/mediaEncoder.js";
import { motionLanguageCode } from "../../../../lib/motionLanguage.js";
import { packageBornasVideo } from "./bornasPackage.js";
import { BORNAS_AI_DEFAULT, bornasAiSettings, bornasGenre, bornasMusicChoice, BORNAS_STEPS, BORNAS_VIDEO_STEPS } from "../../constants/bornasConfig.js";
import { BORNAS_ERROR, BORNAS_LOG } from "../../constants/bornasServerText.js";
import type { BornasAiSettings, BornasChannel, BornasJob, BornasScript, BornasStepId, BornasVideo } from "../../types/bornas.js";
import { annotateBornasLibrary, prepareBornasAssets } from "./bornasAssets.js";
import { buildBornasVideo, checkBornasVideo, renderBornasVideo } from "./bornasRender.js";
import { analyzeBornasSample, dropBornasAnalysis, inspectBornasSample } from "./bornasSample.js";
import { cleanBornasScript, writeBornasScripts } from "./bornasScript.js";
import { planBornasShots, type BornasPlan } from "./bornasShots.js";
import { bornasController, bornasEmptySteps, bornasLog, bornasStep, getBornasJob, saveBornasJob, setBornasController } from "./bornasStore.js";
import { BORNAS_ABORTED, isBornasAbort, readJson } from "./bornasTools.js";
import { bornasVideoDir, voiceBornasVideo } from "./bornasVoice.js";
const errText = (error: unknown): string => String((error as Error)?.message || error);
const cleanChannel = (raw: Partial<BornasChannel> | undefined): BornasChannel => {
  if (!raw?.id) throw new Error(BORNAS_ERROR.NO_CHANNEL);
  return {
    id: String(raw.id),
    name: String(raw.name || raw.id).slice(0, 80),
    topic: raw.topic || "world",
    voiceChannel: String(raw.voiceChannel || ""),
    language: motionLanguageCode(raw.language),
    genre: bornasGenre(raw.genre),
    music: bornasMusicChoice(raw.music),
    count: _.clamp(Math.round(Number(raw.count) || 1), 1, 10),
    seconds: _.clamp(Math.round(Number(raw.seconds) || 120), 30, 1200),
    review: raw.review === true,
  };
};
const cleanAi = (raw: Partial<BornasAiSettings> | undefined): BornasAiSettings => bornasAiSettings(raw);
const heavy = <T>(job: BornasJob, kind: string, step: string, signal: AbortSignal, run: () => Promise<T>): Promise<T> =>
  runHeavyJob(kind, HEAVY_JOB_TEXT.LABEL(HEAVY_JOB_TEXT.SCREEN.BORNAS, `${job.channel.name} · ${step}`), run, { signal, onWait: (holder) => bornasLog(job, HEAVY_JOB_TEXT.WAIT(kind, holder)), onStart: (waited) => waited >= 1 && bornasLog(job, HEAVY_JOB_TEXT.START(step, waited)) }).catch((error) => {
    throw signal.aborted ? new Error(BORNAS_ABORTED) : error;
  });
const stepProgress = (job: BornasJob, step: BornasStepId): void => {
  const n = Math.max(1, job.videos.length);
  const order = BORNAS_VIDEO_STEPS.indexOf(step);
  const done = job.videos.filter((v) => v.status === "done" || (v.stage && BORNAS_VIDEO_STEPS.indexOf(v.stage) > order)).length;
  job.steps[step].progress = done / n;
};
const runVideo = async (job: BornasJob, video: BornasVideo, script: BornasScript, from: BornasStepId, signal: AbortSignal): Promise<void> => {
  const log = (text: string, level?: "info" | "warn" | "error") => bornasLog(job, text, level, video.index);
  video.status = "running";
  video.error = undefined;
  log(BORNAS_LOG.VIDEO(video.index + 1, job.videos.length, video.title));
  let plan: BornasPlan | undefined = readJson<BornasPlan | undefined>(bornasVideoDir(job, video, "plan.json"), undefined);
  for (const step of BORNAS_VIDEO_STEPS.slice(BORNAS_VIDEO_STEPS.indexOf(from))) {
    signal.throwIfAborted();
    video.stage = step;
    bornasStep(job, step, { status: "running", message: BORNAS_LOG.VIDEO(video.index + 1, job.videos.length, video.title) });
    if (step === "voice") await heavy(job, HEAVY_VOICE, step, signal, () => voiceBornasVideo(job, video, script, log, signal));
    if (step === "assets") await prepareBornasAssets(job, video, script, log, signal);
    if (step === "shots") plan = await planBornasShots(job, video, script, log, signal);
    if (step === "build") {
      await buildBornasVideo(job, video, plan!, log, signal);
      await checkBornasVideo(job, video, log, signal);
    }
    if (step === "package") {
      await packageBornasVideo(job, video, script, log, signal);
      if (from === "package" && video.outputUrl) {
        stepProgress(job, step);
        bornasStep(job, step, { status: "done", message: "" });
        break;
      }
    }
    if (step === "render" && job.channel.review && from !== "render") {
      video.status = "waiting";
      bornasStep(job, "render", { status: "waiting", message: BORNAS_LOG.WAIT_RENDER });
      log(BORNAS_LOG.WAIT_RENDER);
      saveBornasJob(job);
      return;
    }
    if (step === "render") await heavy(job, HEAVY_RENDER, step, signal, () => renderBornasVideo(video, log, signal));
    stepProgress(job, step);
    bornasStep(job, step, { status: job.steps[step].progress >= 1 ? "done" : "idle", message: "" });
    saveBornasJob(job);
  }
  video.status = "done";
  video.stage = undefined;
  log(BORNAS_LOG.VIDEO_DONE(video.index + 1));
};
const finishSteps = (job: BornasJob): void => {
  for (const step of BORNAS_VIDEO_STEPS) {
    stepProgress(job, step);
    const anyError = job.videos.some((v) => v.status === "error" && v.stage === step);
    job.steps[step] = { ...job.steps[step], status: anyError ? "error" : job.steps[step].progress >= 1 ? "done" : job.steps[step].status === "running" ? "idle" : job.steps[step].status, message: "" };
  }
};
const runVideos = async (job: BornasJob, from: BornasStepId, signal: AbortSignal, only?: number[]): Promise<void> => {
  for (const video of job.videos) {
    if (only && !only.includes(video.index)) continue;
    if (!only && (video.status === "done" || video.status === "waiting")) continue;
    try {
      await runVideo(job, video, job.scripts![video.index], only ? from : video.stage && BORNAS_VIDEO_STEPS.includes(video.stage) ? video.stage : from, signal);
    } catch (error) {
      if (isBornasAbort(error) || signal.aborted) throw error;
      video.status = "error";
      video.error = errText(error);
      bornasLog(job, BORNAS_LOG.VIDEO_FAIL(video.index + 1, video.error), "error", video.index);
      if (video.stage) bornasStep(job, video.stage, { status: "error", message: video.error });
    }
    saveBornasJob(job);
  }
};
const execute = async (job: BornasJob, from: BornasStepId, only?: number[]): Promise<void> => {
  const controller = new AbortController();
  setBornasController(job.id, controller);
  const signal = controller.signal;
  job.status = "running";
  job.error = undefined;
  saveBornasJob(job, true);
  const log = (text: string, level?: "info" | "warn" | "error") => bornasLog(job, text, level);
  try {
    await runInMotionAiSession(
      job.id,
      async () => {
        if (from === "sample") {
          bornasStep(job, "sample", { status: "running", progress: 0 });
          log(BORNAS_LOG.SAMPLE(job.sample.name, job.sample.duration, job.sample.width, job.sample.height));
          job.analysis = await analyzeBornasSample(job, log, signal);
          bornasStep(job, "sample", { status: "done", progress: 1, message: "" });
        }
        if (from === "sample" || from === "script") {
          bornasStep(job, "script", { status: "running", progress: 0 });
          job.scripts = await writeBornasScripts(job, log, signal);
          job.videos = job.scripts.map((s, index) => ({ index, title: s.title, status: "idle" }));
          if (job.channel.review) {
            bornasStep(job, "script", { status: "waiting", progress: 1, message: BORNAS_LOG.WAIT_REVIEW });
            job.status = "waiting";
            log(BORNAS_LOG.WAIT_REVIEW);
            return;
          }
          bornasStep(job, "script", { status: "done", progress: 1, message: "" });
        }
        await runVideos(job, BORNAS_VIDEO_STEPS.includes(from) ? from : "voice", signal, only);
        finishSteps(job);
        if (job.videos.some((v) => v.status === "waiting")) {
          job.status = "waiting";
          return;
        }
        const ok = job.videos.filter((v) => v.status === "done").length;
        log(BORNAS_LOG.DONE(ok, job.videos.length));
        job.status = ok === job.videos.length ? "done" : "error";
        if (job.status === "error") job.error = job.videos.find((v) => v.error)?.error;
      },
      (line) => line && log(line),
      false,
      signal,
    );
  } catch (error) {
    const aborted = isBornasAbort(error) || signal.aborted;
    job.status = aborted ? "cancelled" : "error";
    job.error = aborted ? BORNAS_ERROR.ABORTED : errText(error);
    for (const step of BORNAS_STEPS) if (job.steps[step].status === "running") job.steps[step] = { ...job.steps[step], status: aborted ? "idle" : "error", message: job.error };
    for (const v of job.videos) if (v.status === "running") v.status = aborted ? "idle" : "error";
    if (!aborted) logger.warn(job.error);
    bornasLog(job, job.error, aborted ? "warn" : "error");
  } finally {
    setBornasController(job.id);
    saveBornasJob(job, true);
    await closeMotionStandaloneBrowser().catch(_.noop);
  }
};
export const inspectBornasSource = inspectBornasSample;
export const startBornas = async (body: { path?: string; channel?: Partial<BornasChannel>; ai?: Partial<BornasAiSettings> }): Promise<BornasJob> => {
  const channel = cleanChannel(body.channel);
  if (!channel.voiceChannel) throw new Error(BORNAS_ERROR.NO_VOICE);
  const sample = await inspectBornasSample(String(body.path || ""));
  const now = Date.now();
  const job: BornasJob = { id: randomUUID(), createdAt: now, updatedAt: now, status: "running", channel, ai: cleanAi(body.ai), sample, videos: [], steps: bornasEmptySteps(), logs: [], warnings: [] };
  saveBornasJob(job, true);
  void execute(job, "sample");
  return job;
};
export const approveBornas = (jobId: string, scripts: unknown): BornasJob => {
  const job = getBornasJob(jobId);
  if (!job) throw new Error(BORNAS_ERROR.NO_JOB);
  if (job.status !== "waiting") throw new Error(BORNAS_ERROR.NOT_WAITING);
  const waitingRender = job.videos.filter((v) => v.status === "waiting").map((v) => v.index);
  if (waitingRender.length) {
    void execute(job, "render", waitingRender);
    return job;
  }
  const list = _.compact((Array.isArray(scripts) ? scripts : job.scripts || []).map(cleanBornasScript));
  if (!list.length) throw new Error(BORNAS_ERROR.NO_SCRIPTS);
  job.scripts = list;
  job.videos = list.map((s, index) => ({ index, title: s.title, status: "idle" }));
  bornasStep(job, "script", { status: "done", progress: 1, message: "" });
  void execute(job, "voice");
  return job;
};
export const rerunBornas = (jobId: string, step: BornasStepId, video?: number, ai?: Partial<BornasAiSettings>): BornasJob => {
  const job = getBornasJob(jobId);
  if (!job) throw new Error(BORNAS_ERROR.NO_JOB);
  if (job.status === "running") throw new Error(BORNAS_ERROR.BUSY);
  if (!BORNAS_STEPS.includes(step)) throw new Error(BORNAS_ERROR.NO_JOB);
  if (ai) job.ai = cleanAi(ai);
  const at = BORNAS_STEPS.indexOf(step);
  const seoOnly = step === "package" && video !== undefined && !!job.videos[video]?.outputUrl;
  for (const id of seoOnly ? [step] : BORNAS_STEPS.slice(at)) job.steps[id] = { status: "idle", progress: 0, message: "" };
  if (step === "sample" || step === "script") {
    if (step === "sample") dropBornasAnalysis(job.sample.key);
    job.videos = [];
    void execute(job, step);
    return job;
  }
  const only = video !== undefined ? [video] : job.videos.filter((v) => v.status !== "done").map((v) => v.index);
  for (const v of job.videos) if (only.includes(v.index)) Object.assign(v, { status: "idle", stage: undefined, error: undefined });
  void execute(job, step, only);
  return job;
};
export const cancelBornas = (jobId: string): BornasJob | undefined => {
  const job = getBornasJob(jobId);
  bornasController(jobId)?.abort();
  return job;
};
const libRuns = new Map<string, { status: "running" | "done" | "error"; log: string[]; result?: { sprites: number; bgs: number }; error?: string }>();
export const bornasLibraryAnnotation = (lib: string) => libRuns.get(lib) || null;
export const annotateLibrary = (lib: string, ai?: Partial<BornasAiSettings>): boolean => {
  if (libRuns.get(lib)?.status === "running") return false;
  const run: { status: "running" | "done" | "error"; log: string[]; result?: { sprites: number; bgs: number }; error?: string } = { status: "running", log: [] };
  libRuns.set(lib, run);
  const log = (text: string) => {
    run.log = [...run.log, text].slice(-60);
    logger.info(text);
  };
  void runInMotionAiSession(`bornas-ann-${lib}`, () => annotateBornasLibrary(lib, { ...BORNAS_AI_DEFAULT, ...ai }, log), log, false)
    .then((r) => Object.assign(run, { status: "done", result: r }))
    .catch((error) => Object.assign(run, { status: "error", error: String((error as Error)?.message || error) }));
  return true;
};
