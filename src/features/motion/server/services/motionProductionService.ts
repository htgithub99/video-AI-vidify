import * as COMMON_RUNTIME from "../../../../constants/sourceText.js";
import { RUNTIME_VALUES } from "../../../../constants/runtime/values.js";
import { RUNTIME_TEXT as RT_SHARED } from "../../../../constants/runtime/shared.js";
import { RUNTIME_TEXT as RT_SERVER } from "../../../../constants/runtime/server.js";
import { parseJson, stringifyJson } from "../../../../lib/jsonStringify.js";
import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { setTimeout as delay } from "node:timers/promises";
import { MOTION_PRODUCTION as P } from "../../../../constants/motionProduction.js";
import { MOTION_QA as Q } from "../../../../constants/motionQa.js";
import { MOTION_PROGRESS as PROGRESS } from "../../../../constants/motionProgress.js";
import { motionDurationQa } from "../../../../lib/motionQa.js";
import { MOTION_VOICE_LIBRARY } from "../../../../constants/motionVoice.js";
import { MOTION_VIDEO_CONSTANTS } from "../../../../constants/motionVideo.js";
import { MotionJobStatus as S, MotionStoryJobKind as K, type MotionStoryJobState, type MotionStoryAnalysis, type MotionStoryScript, type MotionVoiceTrack, type MotionSeoPack, type MotionResultItem, type MotionProductionResult } from "../../../../types/motionVideo.js";
import { logger } from "../../../../lib/logger.js";
import { checkMotionMediaTools } from "./motionMediaValidation.js";
import { checkMotionProductionVoice } from "./motionProductionPreflight.js";
import { findVoiceChannel, voiceChannelRef } from "./motionVoiceLibraryService.js";
import { assertMotionScriptComplete, assertMotionProductionMode, motionDurationRepairChapters } from "../../../../lib/motionProduction.js";
import { speechUnits } from "./motionSpeechRateService.js";
import { motionSeriesStart } from "../../../../lib/motionParts.js";
import { motionVoiceSignature, withMotionVoiceMode } from "../../../../lib/motionVoice.js";
import { motionInputKey } from "./motionFileUtils.js";
import { getMotionRootDirectory } from "./motionLibraryService.js";
import { getStoryJob, cancelStoryJob } from "./motionStoryJobService.js";
import { getMotionJob, cancelMotionJob, detectEncoders } from "./motionRenderService.js";
import { MotionProductionStore, motionProcessAlive, type MotionProductionOwner } from "./motionProductionStore.js";
import { puppetPackStoryCapabilities } from "./puppet/packCatalog.js";
import { closedPuppetPackId } from "./puppet/packPolicy.js";
import { type PuppetPlanReadiness } from "./puppet/planReadiness.js";
import { recoverMotionIllustrationPlan, type MotionPlanRecoveryState } from "./motionPlanRecoveryService.js";
import { retimeMotionSeo, seoScriptKey } from "./motionSeoService.js";
import { MotionLogStore } from "./motionLogStore.js";
import { analyzeMotionStoryInput, scriptMotionStoryInput, scenesMotionStoryInput, voiceMotionStoryInput, seoMotionStoryInput, compileMotionStoryInput, startMotionVideoRenderInput, editorialSession, aiExec } from "./motionProductionActions.js";
import { runInMotionAiSession } from "./motionStoryService.js";
import { motionVisualRequest, motionVisualSettingsFor, isRemotionSpec } from "../../../../lib/motionVisual.js";
import { MOTION_VISUAL as VISUAL } from "../../../../constants/motionVisual.js";
import { motionRenderBehaviorFor } from "../../../../lib/motionRenderBehavior.js";
import { MOTION_RENDER_BEHAVIOR as B } from "../../../../constants/motionRenderBehavior.js";
import { checkRemotionRuntime } from "./motionRemotionRenderService.js";
import { remotionStoryRenderable, remotionStoryBuildStatus, remotionStoryRecoveryPending } from "./remotion/sceneKeys.js";
import { MOTION_REMOTION_LAYOUT as L } from "../../../../constants/motionRemotionLayout.js";
import { MOTION_SCENE_PACING as PACING } from "../../../../constants/motionScenePacing.js";
interface ProductionRecord {
  illustration?: PuppetPlanReadiness;
  illustrationRecovery?: MotionPlanRecoveryState;
  durationRepair?: { round: number; rate: number; chapters?: string[]; done?: boolean };
  version: number;
  input: Record<string, any>;
  inputKey: string;
  job: MotionStoryJobState;
  result: MotionProductionResult;
  steps: Record<string, { id: string; done?: boolean; log?: string[]; retries?: number; retryAt?: number; inputKey?: string; status?: S; stage?: string; progress?: number; startedAt?: number; updatedAt?: number; error?: string; recoveryStopped?: boolean }>;
  owner?: MotionProductionOwner;
}
const productionDependencies = { analyzeMotionStoryInput, scriptMotionStoryInput, scenesMotionStoryInput, voiceMotionStoryInput, seoMotionStoryInput, compileMotionStoryInput, startMotionVideoRenderInput, getStoryJob, cancelStoryJob, getMotionJob, cancelMotionJob, detectEncoders, checkMotionMediaTools, checkMotionProductionVoice, checkRemotionRuntime, recoverMotionIllustrationPlan };
export const createMotionProductionService = (dependencies: Partial<typeof productionDependencies> = {}, directory = path.join(getMotionRootDirectory(), P.RUN_FOLDER), pollMs: number = P.POLL_MS, serviceRetryMs: number = P.SERVICE_RETRY_MS, seoWaitMs: number = P.SEO_WAIT_MS) => {
  const { analyzeMotionStoryInput, scriptMotionStoryInput, scenesMotionStoryInput, voiceMotionStoryInput, seoMotionStoryInput, compileMotionStoryInput, startMotionVideoRenderInput, getStoryJob, cancelStoryJob, getMotionJob, cancelMotionJob, detectEncoders, checkMotionMediaTools, checkMotionProductionVoice, checkRemotionRuntime, recoverMotionIllustrationPlan } = {
    ...productionDependencies,
    ...dependencies,
  };
  const store = new MotionProductionStore<ProductionRecord>(directory);
  const logs = new MotionLogStore(path.join(directory, P.LOG_FOLDER));
  const active = new Map<string, { record: ProductionRecord; controller: AbortController; owner: MotionProductionOwner }>();
  const failedSnapshots = new Map<string, ProductionRecord>();
  const terminal = (status: S): boolean => [S.COMPLETED, S.CANCELLED, S.ERROR].includes(status);
  const seoMatches = (seo: any, script?: MotionStoryScript): seo is MotionSeoPack => !!script && Array.isArray(seo?.options) && seo.options.length > 0 && Array.isArray(seo.chapters) && seo.scriptKey === seoScriptKey(script);
  const read = (id: string): ProductionRecord | undefined => {
    const record = failedSnapshots.get(id) || store.read(id);
    return record?.version === P.RUN_VERSION && record.job?.id === id && record.input && record.inputKey === motionInputKey(record.input) ? record : undefined;
  };
  const log = (record: ProductionRecord, line: string): void => {
    const entry = PROGRESS.TIME.test(line) ? line : PROGRESS.STAMP(line);
    const prior = record.job.log;
    record.job.log = [...prior, entry].slice(-MOTION_VIDEO_CONSTANTS.MAX_LOG_LINES);
    logs.seed(record.job.id, prior);
    logs.append(record.job.id, entry);
  };
  const publicJob = (record: ProductionRecord): MotionStoryJobState => {
    const job = structuredClone({ ...record.job, result: record.result });
    job.stepStates = Object.fromEntries(Object.entries(record.steps).flatMap(([name, task]) => (task.status || task.done ? [[name, { id: task.id, status: task.done ? S.COMPLETED : task.status!, stage: task.stage, progress: task.progress, startedAt: task.startedAt, updatedAt: task.updatedAt, error: task.error }]] : [])));
    if (job.result.rendered) job.result.renderSettings = { quality: record.input.quality, encoder: record.input.encoder, musicMood: record.input.musicMood, musicVolume: record.input.musicVolume };
    if (record.steps[P.STAGES.SEO]?.done) delete job.result.seoJobId;
    return job;
  };
  const run = async (record: ProductionRecord, controller: AbortController, owner: MotionProductionOwner, seoOnly = false): Promise<void> => {
    const signal = controller.signal;
    try {
      const base: Record<string, any> = { ...structuredClone(record.input), productionId: record.job.id, editorialSessionId: record.job.id, keepBrowser: true };
      base.renderBehavior = motionRenderBehaviorFor(base);
      base.characterMotion = base.renderBehavior.actors === RT_SHARED.SIMPLE;
      log(record, B.LOG(base.renderBehavior.actors, base.renderBehavior.sceneEffects, base.renderBehavior.camera));
      const result = record.result;
      const save = (): void => {
        signal.throwIfAborted();
        if (store.read(record.job.id)?.job.status === S.CANCELLED) {
          controller.abort();
          signal.throwIfAborted();
        }
        record.job.result = result;
        store.save(record.job.id, record, owner);
      };
      const running = new Set<string>();
      const waiting = new Map<string, string>();
      const stage = () => [...running].map((name) => waiting.get(name) || name).join(P.SEPARATOR);
      const activities = new Map<string, MotionStoryJobState["activeAi"]>();
      const syncStep = (name: string, state: Pick<MotionStoryJobState, "id" | "status" | "stage" | "progress" | "startedAt" | "error">): void => {
        const task = record.steps[name];
        if (task) Object.assign(task, { status: state.status, stage: state.stage, progress: state.progress, startedAt: state.startedAt, updatedAt: Date.now(), error: state.error });
      };
      const mediaProgress = { scenes: 0, voice: 0 };
      const syncSeo = (): void => {
        const task = record.steps[P.STAGES.SEO];
        if (!task || task.recoveryStopped || (task.done && seoMatches(result.seo, result.script))) return;
        const job = getStoryJob(task.id);
        if (!job) {
          startSeo();
          return;
        }
        const previous = task.log || [];
        let overlap = Math.min(previous.length, job.log.length);
        while (overlap && previous.slice(-overlap).some((line, index) => line !== job.log[index])) overlap--;
        for (const line of job.log.slice(overlap)) log(record, PROGRESS.SCOPE(P.STAGES.SEO, line));
        task.log = [...job.log];
        syncStep(P.STAGES.SEO, job);
        if (!terminal(job.status)) return;
        if (job.status === S.COMPLETED && seoMatches(job.result, result.script) && task.inputKey === seoScriptKey(result.script!)) {
          result.seo = result.voice ? retimeMotionSeo(job.result, result.script!, result.analysis!, result.voice.durations) : job.result;
          task.done = true;
          task.status = S.COMPLETED;
        } else {
          if (task.status !== job.status) log(record, PROGRESS.SCOPE(P.STAGES.SEO, P.OPTIONAL_FAILED(P.STAGES.SEO, job.error || P.SEO_INTERRUPTED)));
          task.done = false;
          task.status = job.status;
        }
        delete result.seoJobId;
        if (!task.done) startSeo();
      };
      const startSeo = (): void => {
        signal.throwIfAborted();
        if (base.seo === false) return;
        const inputKey = seoScriptKey(result.script!);
        const previous = record.steps[P.STAGES.SEO];
        const sameScript = previous?.inputKey === inputKey;
        if (sameScript) {
          if (seoMatches(result.seo, result.script)) {
            previous.done = true;
            delete result.seoJobId;
            return;
          }
          previous.done = false;
          if (previous.recoveryStopped) return;
          const state = previous.id && getStoryJob(previous.id);
          if (state && state.status === S.COMPLETED && seoMatches(state.result, result.script)) {
            result.seo = result.voice ? retimeMotionSeo(state.result, result.script!, result.analysis!, result.voice.durations) : state.result;
            previous.done = true;
            previous.status = S.COMPLETED;
            delete result.seoJobId;
            return;
          }
          if (state && !terminal(state.status)) {
            result.seoJobId = previous.id;
            syncStep(P.STAGES.SEO, state);
            return;
          }
          if ((previous.retries || 0) >= P.SEO_RETRIES) {
            previous.recoveryStopped = true;
            delete result.seoJobId;
            log(record, PROGRESS.SCOPE(P.STAGES.SEO, P.SEO_EXHAUSTED));
            return;
          }
          log(record, PROGRESS.SCOPE(P.STAGES.SEO, P.SEO_RETRY((previous.retries || 0) + 1)));
        }
        if (previous?.id) cancelStoryJob(previous.id);
        delete result.seo;
        delete result.seoJobId;
        record.steps[P.STAGES.SEO] = { id: "", inputKey, retries: sameScript ? (previous.retries || 0) + 1 : 0 };
        try {
          const response = seoMotionStoryInput({ ...base, analysis: result.analysis, script: structuredClone(result.script) });
          record.steps[P.STAGES.SEO].id = response.job.id;
          syncStep(P.STAGES.SEO, response.job);
          result.seoJobId = response.job.id;
        } catch (error) {
          record.steps[P.STAGES.SEO].status = S.ERROR;
          log(record, PROGRESS.SCOPE(P.STAGES.SEO, P.OPTIONAL_FAILED(P.STAGES.SEO, String((error as Error).message))));
        }
        save();
      };
      const finishSeo = async (): Promise<void> => {
        if (!record.steps[P.STAGES.SEO] || !result.voice) return;
        const deadline = Date.now() + seoWaitMs;
        for (;;) {
          signal.throwIfAborted();
          syncSeo();
          const task = record.steps[P.STAGES.SEO];
          if (task.done || task.recoveryStopped) break;
          if (Date.now() >= deadline) {
            if (task.id) cancelStoryJob(task.id);
            task.status = S.CANCELLED;
            task.recoveryStopped = true;
            delete result.seoJobId;
            log(record, PROGRESS.SCOPE(P.STAGES.SEO, P.SEO_PENDING));
            break;
          }
          await delay(Math.min(pollMs, Math.max(1, deadline - Date.now())), undefined, { signal });
        }
        if (seoMatches(result.seo, result.script)) result.seo = retimeMotionSeo(result.seo, result.script!, result.analysis!, result.voice.durations);
        save();
      };
      if (seoOnly) {
        record.job.stage = P.STAGES.SEO;
        startSeo();
        await finishSeo();
        signal.throwIfAborted();
        record.job.status = S.COMPLETED;
        record.job.stage = result.rendered ? P.STAGES.DONE : P.PREVIEW_DONE;
        return;
      }
      const step = async <T>(name: string, start: () => Promise<{ job: { id: string } }> | { job: { id: string } }, receive: (value: T) => void, offset: number, size: number, render = false, media?: keyof typeof mediaProgress): Promise<void> => {
        signal.throwIfAborted();
        if (record.steps[name]?.done) {
          if (media) mediaProgress[media] = 1;
          return;
        }
        running.add(name);
        record.job.stage = stage();
        const get = (id: string) => (render ? getMotionJob(id) : getStoryJob(id));
        for (;;) {
          const pending = record.steps[name];
          if (pending?.retryAt) {
            waiting.set(name, P.SERVICE_WAIT(name, pending.retries!));
            record.job.stage = stage();
            save();
            await delay(Math.max(0, pending.retryAt - Date.now()), undefined, { signal });
            delete pending.retryAt;
            waiting.delete(name);
          }
          let state = record.steps[name] && get(record.steps[name].id);
          if (!state || state.status === S.ERROR || state.status === S.CANCELLED) {
            const response = await start();
            record.steps[name] = { ...record.steps[name], id: response.job.id, log: [], done: false, status: S.QUEUED, error: undefined, startedAt: Date.now() };
            if (signal.aborted) {
              cancelStoryJob(response.job.id);
              cancelMotionJob(response.job.id);
              signal.throwIfAborted();
            }
            save();
            state = get(response.job.id);
          }
          while (state) {
            signal.throwIfAborted();
            syncSeo();
            const saved = record.steps[name];
            const prior = saved.log || [];
            let overlap = Math.min(prior.length, state.log.length);
            while (overlap && prior.slice(-overlap).some((line, index) => line !== state!.log[index])) overlap--;
            for (const line of state.log.slice(overlap)) log(record, PROGRESS.SCOPE(name, line));
            saved.log = [...state.log];
            syncStep(name, state);
            record.job.stage = [...running].map((item) => (item === name && state.stage ? item + P.SEPARATOR + state.stage : waiting.get(item) || item)).join(P.SEPARATOR);
            if (media && state.status !== S.ERROR && state.status !== S.CANCELLED) mediaProgress[media] = state.status === S.COMPLETED ? 1 : state.progress;
            record.job.progress = Math.max(record.job.progress, media ? P.MEDIA_PROGRESS.BASE + P.MEDIA_PROGRESS.SCENES * mediaProgress.scenes + P.MEDIA_PROGRESS.VOICE * mediaProgress.voice : offset + state.progress * size);
            activities.set(name, (state as MotionStoryJobState).activeAi || {});
            record.job.activeAi = Object.assign({}, ...activities.values());
            if (state.result && !render) receive(state.result as T);
            save();
            if (terminal(state.status)) {
              if (state.status !== S.COMPLETED) {
                if (state.status === S.ERROR && P.SERVICE_ERROR_RE.test(state.error || "") && (saved.retries || 0) < P.SERVICE_RETRIES) {
                  saved.retries = (saved.retries || 0) + 1;
                  saved.retryAt = Date.now() + serviceRetryMs;
                  saved.status = S.PREPARING;
                  saved.stage = P.SERVICE_WAIT(name, saved.retries);
                  delete saved.error;
                  log(record, P.SERVICE_WAIT(name, saved.retries));
                  save();
                  break;
                }
                throw new Error(P.STEP_FAILED(name, state.error || P.INTERRUPTED));
              }
              receive(state.result as T);
              saved.done = true;
              running.delete(name);
              activities.delete(name);
              record.job.activeAi = Object.assign({}, ...activities.values());
              save();
              return;
            }
            await delay(pollMs, undefined, { signal });
            state = get(saved.id);
          }
          if (!record.steps[name]?.retryAt) throw new Error(P.STEP_FAILED(name, P.INTERRUPTED));
        }
      };
      if (record.input.visualSettings || record.input.analysis?.visualSettings || record.input.script?.visualSettings) Object.assign(base, motionVisualRequest(record.input));
      const visualSettings = motionVisualSettingsFor(base);
      const buildStatus = visualSettings.mode === RT_SHARED.REMOTION && result.script && result.analysis ? remotionStoryBuildStatus(result.script, result.analysis) : RT_SHARED.READY;
      if (result.script && ((buildStatus !== RT_SHARED.READY && buildStatus !== COMMON_RUNTIME.SOURCE_TEXT_PARTIAL) || (buildStatus === COMMON_RUNTIME.SOURCE_TEXT_PARTIAL && remotionStoryRecoveryPending(result.script)))) {
        for (const name of Object.keys(record.steps)) if (name === P.STAGES.SCENES || name.startsWith(P.STAGES.SCENES + RT_SHARED.SYMBOL_588DA4) || name === P.STAGES.RENDER) delete record.steps[name];
        delete result.compiled;
        delete result.rendered;
        if (buildStatus === RT_SERVER.OUTDATED) record.job.progress = Math.min(record.job.progress, P.MEDIA_PROGRESS.BASE + (record.steps[P.STAGES.VOICE]?.done ? P.MEDIA_PROGRESS.VOICE : 0));
        log(record, buildStatus === RT_SERVER.OUTDATED ? L.LOG_REPLAN(result.script.beats.length) : buildStatus === RT_SERVER.INVALID ? VISUAL.LOG_INVALID_SCENES : VISUAL.LOG_CONTINUE);
      }
      record.job.status = S.PREPARING;
      record.job.stage = P.STAGES.PREFLIGHT;
      save();
      const directory = getMotionRootDirectory();
      fs.accessSync(directory, fs.constants.W_OK);
      const disk = fs.statfsSync(directory);
      if (!base.source?.segments?.length || disk.bavail * disk.bsize < P.MIN_FREE_BYTES || (visualSettings.mode === RT_SHARED.LIBRARY && closedPuppetPackId(base.stylePreset) && !puppetPackStoryCapabilities(base.stylePreset))) throw new Error(P.PREFLIGHT_FAILED);
      log(record, VISUAL.LOG_MODE(visualSettings.mode));
      if (visualSettings.mode === RT_SHARED.REMOTION) {
        if (base.encoder === RT_SERVER.GPU) throw new Error(VISUAL.CPU_ONLY);
        await checkRemotionRuntime(signal);
      }
      if (!base.analyzeOnly) {
        await checkMotionMediaTools(signal);
        await checkMotionProductionVoice(base.voiceChannel, signal);
        if (base.autoExport !== false && !(await detectEncoders()).length) throw new Error(P.PREFLIGHT_FAILED);
      }
      signal.throwIfAborted();
      record.job.status = S.RENDERING;
      await step<MotionStoryAnalysis>(
        P.STAGES.ANALYZE,
        () => analyzeMotionStoryInput(base),
        (full) => {
          if (!result.analysis) Object.assign(result, motionSeriesStart(full, Number(base.parts) || 1, base.language));
        },
        0,
        0.1,
      );
      if (base.analyzeOnly) {
        record.job.status = S.COMPLETED;
        record.job.progress = 1;
        record.job.stage = P.ANALYSIS_DONE;
        return;
      }
      if (visualSettings.mode === RT_SHARED.LIBRARY) {
        record.steps[P.INVENTORY_STAGE] = { id: record.job.id, status: S.RENDERING, startedAt: Date.now() };
        record.job.stage = P.INVENTORY_STAGE;
        save();
        let ready: Awaited<ReturnType<typeof recoverMotionIllustrationPlan>>;
        try {
          ready = await runInMotionAiSession(
            record.job.id,
            () =>
              recoverMotionIllustrationPlan(
                { ...result.analysis!, stylePreset: base.stylePreset || result.analysis?.stylePreset },
                {
                  verifyCoverage: true,
                  exec: base.aiExecution || {},
                  signal,
                  log: (line) => log(record, line),
                  state: (record.illustrationRecovery ||= { attempts: 0, errors: [] }),
                  save: (analysis) => {
                    result.analysis = analysis;
                    save();
                  },
                },
              ),
            (line) => log(record, line),
            true,
            signal,
            editorialSession(base, base.source, aiExec(base.aiExecution)),
          );
          Object.assign(record.steps[P.INVENTORY_STAGE], { done: true, status: S.COMPLETED, updatedAt: Date.now() });
        } catch (error) {
          Object.assign(record.steps[P.INVENTORY_STAGE], { status: signal.aborted ? S.CANCELLED : S.ERROR, error: String((error as Error).message), updatedAt: Date.now() });
          throw error;
        }
        record.illustration = ready.illustration;
        result.analysis = ready.analysis;
      } else result.analysis = { ...result.analysis!, visualSettings, stylePreset: undefined };
      save();
      await step<MotionStoryScript>(
        P.STAGES.SCRIPT,
        () => scriptMotionStoryInput({ ...base, analysis: result.analysis, resume: true, beats: result.script?.beats || [], gen: result.script?.gen, chapterDrafts: result.script?.chapterDrafts, voiceSettings: result.script?.voiceSettings, carryGen: base.carryGen }),
        (script) => {
          result.script = script;
        },
        0.1,
        0.2,
      );
      if (base.voiceChannel) result.script!.voiceChannel = base.voiceChannel;
      if (typeof base.multiVoice === "boolean") result.script = withMotionVoiceMode(result.script!, base.multiVoice);
      const buildMedia = async (round = 0, media: "both" | "voice" | "scenes" = RT_SERVER.BOTH) => {
        assertMotionScriptComplete(result.script!, result.analysis);
        startSeo();
        const voicedScript = structuredClone(result.script!);
        const stage = (name: string) => (round ? P.DURATION_STEP(name, round) : name);
        const jobs: Promise<void>[] = [];
        if (media !== RT_SHARED.VOICE)
          jobs.push(
            step<MotionStoryScript>(
              stage(P.STAGES.SCENES),
              () => scenesMotionStoryInput({ ...base, analysis: result.analysis, script: result.script, illustration: record.illustration, aiExecution: base.sceneAiExecution || base.aiExecution, mainAiExecution: base.aiExecution, autoVoice: false, review: base.aiReview !== false, previews: false }),
              (script) => {
                result.script = { ...script, ...(result.voice ? { voiceTrack: result.voice } : {}) };
              },
              0.3,
              0.3,
              false,
              RT_SHARED.SCENES,
            ),
          );
        if (media !== RT_SHARED.SCENES)
          jobs.push(
            step<MotionVoiceTrack>(
              stage(P.STAGES.VOICE),
              () => voiceMotionStoryInput({ ...base, analysis: result.analysis, script: voicedScript, aiExecution: base.aiExecution }),
              (voice) => {
                result.voice = voice;
                if (result.script) result.script.voiceTrack = voice;
              },
              0.3,
              0.3,
              false,
              RT_SHARED.VOICE,
            ),
          );
        let firstFailure: unknown;
        const outcomes = await Promise.allSettled(
          jobs.map((job) =>
            job.catch((error) => {
              firstFailure ??= error;
              for (const task of Object.values(record.steps))
                if (!task.done) {
                  cancelStoryJob(task.id);
                  cancelMotionJob(task.id);
                }
              throw error;
            }),
          ),
        );
        const failed = outcomes.find((outcome) => outcome.status === RT_SERVER.REJECTED) as PromiseRejectedResult | undefined;
        if (failed) throw firstFailure || failed.reason;
      };
      if (!record.durationRepair || record.durationRepair.done) await buildMedia();
      const targetSeconds = result.analysis!.chapters.reduce((sum, chapter) => sum + (chapter.targetSeconds || 0), 0);
      const durationTolerance = Q.DURATION_TOLERANCE;
      const durationFits = () => Number.isFinite(result.voice!.totalSeconds) && result.voice!.totalSeconds > 0;
      const repairMediaPending = () => {
        const repair = record.durationRepair;
        if (!repair || repair.done) return false;
        return (record.steps[P.DURATION_STEP(P.STAGES.SCRIPT, repair.round)]?.done && (!record.steps[P.DURATION_STEP(P.STAGES.SCENES, repair.round)]?.done || !record.steps[P.DURATION_STEP(P.STAGES.VOICE, repair.round)]?.done)) || result.voice?.signature !== motionVoiceSignature(result.script, result.analysis);
      };
      while (!durationFits() || repairMediaPending()) {
        if (!Number.isFinite(result.voice!.totalSeconds) || result.voice!.totalSeconds <= 0) throw new Error(P.AUDIO_REQUIRED);
        const previous = record.durationRepair;
        if (!previous || previous.done) {
          if ((previous?.round || 0) >= P.DURATION_REPAIRS) throw new Error(P.DURATION_FAILED(result.voice!.totalSeconds, targetSeconds));
          record.durationRepair = { round: (previous?.round || 0) + 1, rate: speechUnits(result.script!.beats.map((beat) => beat.narration).join(P.SEPARATOR)) / result.voice!.totalSeconds, chapters: motionDurationRepairChapters(result.script!, result.analysis!, result.voice!, durationTolerance) };
          log(record, P.DURATION_REPAIR(result.voice!.totalSeconds, targetSeconds));
          save();
        }
        const repair = record.durationRepair!;
        repair.chapters ||= motionDurationRepairChapters(result.script!, result.analysis!, result.voice!, durationTolerance);
        await step<MotionStoryScript>(
          P.DURATION_STEP(P.STAGES.SCRIPT, repair.round),
          () =>
            scriptMotionStoryInput({
              ...base,
              analysis: result.analysis,
              beats: result.script!.beats,
              gen: result.script?.gen,
              chapterDrafts: result.script?.chapterDrafts,
              voiceSettings: result.script?.voiceSettings,
              durationRepairStates: result.script?.durationRepairStates,
              chapterIds: repair.chapters,
              durationRepair: true,
              durationRepairScope: P.DURATION_STEP(record.job.id, repair.round),
              speechRate: repair.rate,
              editorPass: false,
            }),
          (script) => {
            result.script = script;
          },
          0.1,
          0.2,
        );
        await buildMedia(repair.round, RT_SHARED.VOICE);
        if (durationFits()) await buildMedia(repair.round, RT_SHARED.SCENES);
        repair.done = true;
        save();
      }
      if (record.durationRepair && !record.durationRepair.done) {
        record.durationRepair.done = true;
        save();
      }
      if (motionDurationQa(result.voice!.totalSeconds, targetSeconds) !== Q.LEVEL.OK) log(record, Q.DURATION_WARNING(result.voice!.totalSeconds, targetSeconds));
      await finishSeo();
      signal.throwIfAborted();
      record.job.stage = P.STAGES.COMPILE;
      if (!result.voice?.audioId || result.voice.signature !== motionVoiceSignature(result.script, result.analysis)) throw new Error(P.AUDIO_REQUIRED);
      result.compiled = await compileMotionStoryInput({ ...base, analysis: result.analysis, script: result.script, voiceTrack: result.voice, durations: result.voice.durations, audioId: result.voice.audioId });
      if (isRemotionSpec(result.compiled.spec) && base.fps && result.compiled.spec.fps !== base.fps) throw new Error(VISUAL.SETTINGS_CHANGED);
      result.compiled.spec = { ...result.compiled.spec, fps: base.fps || result.compiled.spec.fps, ...(base.subtitles === false ? { subtitles: [] } : {}) };
      if (isRemotionSpec(result.compiled.spec)) {
        const short = (result.compiled.spec.scenes || []).filter((scene) => (scene.endFrame - scene.startFrame) / result.compiled!.spec.fps < PACING.SHORT_SECONDS).length;
        if (short) log(record, PACING.SHORT_LOG(short));
      }
      if (result.compiled.missing.length || result.compiled.voiceStale) throw new Error(P.AUDIO_REQUIRED);
      save();
      if (base.autoExport !== false)
        await step<MotionResultItem>(
          P.STAGES.RENDER,
          () =>
            startMotionVideoRenderInput({
              spec: result.compiled!.spec,
              options: {
                editorialSessionId: record.job.id,
                quality: base.quality,
                aspect: base.aspect,
                fps: base.fps,
                encoder: base.encoder,
                title: result.script?.title,
                audioId: result.voice!.audioId,
                mixedAudioId: result.compiled?.audioPreviewId,
                sfxId: base.sfx ? result.compiled?.sfxId : undefined,
                sfxVolume: base.sfxVolume,
                requireAudio: true,
                speechRanges: result.voice!.clips?.map(({ start, end }) => ({ start, end })),
                music: { mood: base.musicMood, volume: base.musicVolume ?? 0 },
              },
            }),
          (rendered) => {
            result.rendered = rendered;
          },
          P.RENDER_PROGRESS.BASE,
          P.RENDER_PROGRESS.SIZE,
          true,
        );
      signal.throwIfAborted();
      record.job.status = S.COMPLETED;
      record.job.progress = 1;
      const failedScenes = result.script?.gen?.remotion
        ? Object.values(result.script.gen.remotion.scenes)
            .flat()
            .filter((scene) => scene.build?.status === COMMON_RUNTIME.SOURCE_TEXT_FAILED).length
        : 0;
      record.job.stage = (result.rendered ? P.STAGES.DONE : P.PREVIEW_DONE) + (failedScenes ? `${RUNTIME_VALUES.CON_8DEBC8BA}${failedScenes}${RUNTIME_VALUES.CANH_LOI_CO_THE_TAO_LAI_RIENG_21C9AE12}` : "");
      if (failedScenes) log(record, record.job.stage);
    } catch (error) {
      record.job.status = signal.aborted ? S.CANCELLED : S.ERROR;
      record.job.error = signal.aborted ? undefined : String((error as Error).message);
      try {
        log(record, signal.aborted ? P.RUN_STOPPED : record.job.error!);
      } catch (failure) {
        logger.error(P.SAVE_FAILED, failure);
      }
    } finally {
      const seo = record.steps[P.STAGES.SEO];
      try {
        if (seo?.id && !seo.done) cancelStoryJob(seo.id);
      } catch (error) {
        logger.error(P.SAVE_FAILED, error);
      }
      record.job.activeAi = {};
      for (const task of Object.values(record.steps))
        if (!task.done && task.status && !terminal(task.status)) {
          task.status = S.CANCELLED;
          task.updatedAt = Date.now();
        }
      delete record.owner;
      if (store.owns(record.job.id, owner)) {
        if (store.read(record.job.id)?.job.status === S.CANCELLED) record.job.status = S.CANCELLED;
        try {
          store.save(record.job.id, record, owner);
          failedSnapshots.delete(record.job.id);
        } catch (error) {
          if (record.job.status !== S.CANCELLED) {
            record.job.status = S.ERROR;
            record.job.error = P.SAVE_FAILED + RT_SHARED.SYMBOL_45822F + String((error as Error)?.message || error);
          }
          failedSnapshots.set(record.job.id, record);
          logger.error(P.SAVE_FAILED, error);
        } finally {
          try {
            store.release(record.job.id, owner);
          } catch (error) {
            logger.error(P.SAVE_FAILED, error);
          }
        }
      }
      if (active.get(record.job.id)?.owner.token === owner.token) active.delete(record.job.id);
    }
  };
  const launch = (record: ProductionRecord, seoOnly = false): MotionStoryJobState => {
    const owner = store.acquire(record.job.id);
    const controller = new AbortController();
    record.owner = owner;
    record.job.status = S.QUEUED;
    try {
      store.save(record.job.id, record, owner);
    } catch (error) {
      store.release(record.job.id, owner);
      throw error;
    }
    active.set(record.job.id, { record, controller, owner });
    void run(record, controller, owner, seoOnly).catch((error) => {
      record.job.status = controller.signal.aborted ? S.CANCELLED : S.ERROR;
      record.job.error = controller.signal.aborted ? undefined : String((error as Error)?.message || error);
      record.job.activeAi = {};
      delete record.owner;
      failedSnapshots.set(record.job.id, record);
      try {
        if (store.owns(record.job.id, owner)) {
          try {
            store.save(record.job.id, record, owner);
          } finally {
            store.release(record.job.id, owner);
          }
        }
      } catch (failure) {
        logger.error(P.SAVE_FAILED, failure);
      } finally {
        if (active.get(record.job.id)?.owner.token === owner.token) active.delete(record.job.id);
      }
      logger.error(P.SAVE_FAILED, error);
    });
    return publicJob(record);
  };
  const startMotionProduction = (input: Record<string, any>, resume = false): MotionStoryJobState => {
    assertMotionProductionMode(input);
    const id = String(input.productionId || randomUUID());
    const existing = read(id);
    const normalized = parseJson(stringifyJson({ ...input, productionId: id })) as Record<string, any>;
    if (!resume || !existing) {
      if (input.visualSettings || input.analysis?.visualSettings || input.script?.visualSettings) Object.assign(normalized, motionVisualRequest(input));
      normalized.renderBehavior = motionRenderBehaviorFor(normalized);
      normalized.characterMotion = normalized.renderBehavior.actors === RT_SHARED.SIMPLE;
    }
    if (normalized.voiceChannel) {
      const profile = findVoiceChannel(normalized.voiceChannel);
      if (profile && !String(normalized.voiceChannel).includes(MOTION_VOICE_LIBRARY.REF_SEPARATOR)) normalized.voiceChannel = voiceChannelRef(profile);
    }
    const key = motionInputKey(normalized);
    const running = active.get(id);
    if (running) {
      if (running.record.inputKey !== key) throw new Error(P.INVALID_RUN);
      if (resume && running.controller.signal.aborted) throw new Error(P.STOP_PENDING);
      return publicJob(running.record);
    }
    const previous = read(id);
    if (!previous && store.exists(id)) throw new Error(P.SNAPSHOT_INVALID);
    if (previous) {
      if (previous.inputKey !== key) throw new Error(P.INVALID_RUN);
      const outdatedRemotion = previous.result.script && previous.result.analysis && motionVisualSettingsFor({ script: previous.result.script, analysis: previous.result.analysis }).mode === RT_SHARED.REMOTION && (!remotionStoryRenderable(previous.result.script, previous.result.analysis) || remotionStoryRecoveryPending(previous.result.script));
      const seoOnly = previous.job.status === S.COMPLETED && !outdatedRemotion;
      if (!resume || (seoOnly && (previous.input.seo === false || seoMatches(previous.result.seo, previous.result.script)))) return publicJob(previous);
      const seo = previous.steps[P.STAGES.SEO];
      if (seo && !seoMatches(previous.result.seo, previous.result.script)) {
        seo.done = false;
        seo.retries = 0;
        delete seo.recoveryStopped;
      }
      previous.job.error = undefined;
      log(previous, seoOnly ? P.SEO_RESUMED : P.RUN_RESUMED);
      if (!seoOnly) log(previous, PACING.RESUME_LOG);
      return launch(previous, seoOnly);
    }
    const result: MotionProductionResult = structuredClone({ ...(normalized.analysis ? { analysis: normalized.analysis, series: normalized.series || null } : {}), ...(normalized.script ? { script: normalized.script } : {}) });
    const record: ProductionRecord = { version: P.RUN_VERSION, input: normalized, inputKey: key, job: { id, productionId: id, kind: K.PRODUCTION, status: S.QUEUED, progress: 0, log: [P.RUN_STARTED], startedAt: Date.now() }, result, steps: {} };
    if (result.analysis) record.steps[P.STAGES.ANALYZE] = { id, done: true };
    if (result.analysis && result.script) {
      assertMotionScriptComplete(result.script, result.analysis);
      record.steps[P.STAGES.SCRIPT] = { id, done: true };
    }
    return launch(record);
  };
  const getMotionProduction = (id: string): MotionStoryJobState | undefined => {
    const record = active.get(id)?.record || read(id);
    if (!record) {
      if (!store.exists(id)) return undefined;
      const saved = store.read(id);
      return structuredClone({ id, productionId: id, kind: K.PRODUCTION, status: S.ERROR, progress: saved?.job?.progress || 0, startedAt: saved?.job?.startedAt || 0, log: [...(Array.isArray(saved?.job?.log) ? saved.job.log : []), P.SNAPSHOT_INVALID], error: P.SNAPSHOT_INVALID, result: saved?.result });
    }
    const seo = record.steps[P.STAGES.SEO];
    if (seo && !seoMatches(record.result.seo, record.result.script) && !active.has(id)) {
      const job = getStoryJob(seo.id);
      if (job?.status === S.COMPLETED && seoMatches(job.result, record.result.script) && record.result.script && record.result.analysis && seo.inputKey === seoScriptKey(record.result.script)) {
        let owner: MotionProductionOwner | undefined;
        try {
          owner = store.acquire(id);
          record.result.seo = record.result.voice ? retimeMotionSeo(job.result as MotionSeoPack, record.result.script, record.result.analysis, record.result.voice.durations) : (job.result as MotionSeoPack);
          seo.done = true;
          delete record.result.seoJobId;
          store.save(id, record, owner);
        } catch (error) {
          logger.error(P.SAVE_FAILED, error);
        } finally {
          if (owner) store.release(id, owner);
        }
      }
    }
    return publicJob(record);
  };
  const resumeMotionProduction = (id: string): MotionStoryJobState => {
    const record = read(id);
    if (!record) throw new Error(P.INVALID_RUN);
    return startMotionProduction(record.input, true);
  };
  const cancelMotionProduction = (id: string): boolean => {
    const running = active.get(id);
    const record = running?.record || read(id);
    if (!record) return false;
    const optional = record.steps[P.STAGES.SEO];
    if (optional && !optional.done) cancelStoryJob(optional.id);
    if (terminal(record.job.status)) return false;
    if (!running && record.owner && motionProcessAlive(record.owner.pid)) throw new Error(P.BUSY_RUN);
    const owner = running?.owner || store.acquire(id);
    try {
      record.job.status = S.CANCELLED;
      record.job.stage = P.RUN_STOPPED;
      store.save(id, record, owner);
      running?.controller.abort();
      for (const task of Object.values(record.steps))
        if (!task.done) {
          cancelStoryJob(task.id);
          cancelMotionJob(task.id);
        }
    } finally {
      if (!running) store.release(id, owner);
    }
    return true;
  };
  const recoverMotionProductions = (): void => {
    for (const id of store.ids()) {
      const record = read(id);
      if (!record || terminal(record.job.status) || (record.owner && motionProcessAlive(record.owner.pid))) continue;
      log(record, P.RUN_RESUMED);
      try {
        launch(record);
      } catch (error) {
        record.job.error = String((error as Error).message);
      }
    }
  };
  const getMotionProductionLogs = (id: string, after = 0) => {
    const record = active.get(id)?.record || read(id);
    if (!record) return undefined;
    logs.seed(id, record.job.log);
    return logs.read(id, after);
  };
  return { startMotionProduction, getMotionProduction, resumeMotionProduction, cancelMotionProduction, recoverMotionProductions, getMotionProductionLogs };
};
export const { startMotionProduction, getMotionProduction, resumeMotionProduction, cancelMotionProduction, recoverMotionProductions, getMotionProductionLogs } = createMotionProductionService();
