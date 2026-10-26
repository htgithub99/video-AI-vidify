import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { setTimeout as delay } from "node:timers/promises";
import { MOTION_PRODUCTION as P } from "../../constants/motionProduction.js";
import { MOTION_QA as Q } from "../../constants/motionQa.js";
import { MOTION_PROGRESS as PROGRESS } from "../../constants/motionProgress.js";
import { motionDurationQa } from "../../lib/motionQa.js";
import { MOTION_VOICE_LIBRARY } from "../../constants/motionVoice.js";
import { MOTION_VIDEO_CONSTANTS } from "../../constants/motionVideo.js";
import { MotionJobStatus as S, MotionStoryJobKind as K, type MotionStoryJobState, type MotionStoryAnalysis, type MotionStoryScript, type MotionVoiceTrack, type MotionSeoPack, type MotionResultItem, type MotionProductionResult } from "../../types/motionVideo.js";
import { logger } from "../../lib/logger.js";
import { checkMotionMediaTools } from "./motionMediaValidation.js";
import { checkMotionProductionVoice } from "./motionProductionPreflight.js";
import { findVoiceChannel, voiceChannelRef } from "./motionVoiceLibraryService.js";
import { assertMotionScriptComplete, assertMotionProductionMode, motionDurationRepairChapters } from "../../lib/motionProduction.js";
import { speechUnits } from "./motionSpeechRateService.js";
import { motionSeriesStart } from "../../lib/motionParts.js";
import { motionVoiceSignature } from "../../lib/motionVoice.js";
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
interface ProductionRecord {
  illustration?: PuppetPlanReadiness;
  illustrationRecovery?: MotionPlanRecoveryState;
  durationRepair?: { round: number; rate: number; chapters?: string[]; done?: boolean };
  version: number;
  input: Record<string, any>;
  inputKey: string;
  job: MotionStoryJobState;
  result: MotionProductionResult;
  steps: Record<string, { id: string; done?: boolean; log?: string[]; retries?: number; retryAt?: number; inputKey?: string }>;
  owner?: MotionProductionOwner;
}
const productionDependencies = { analyzeMotionStoryInput, scriptMotionStoryInput, scenesMotionStoryInput, voiceMotionStoryInput, seoMotionStoryInput, compileMotionStoryInput, startMotionVideoRenderInput, getStoryJob, cancelStoryJob, getMotionJob, cancelMotionJob, detectEncoders, checkMotionMediaTools, checkMotionProductionVoice };
export const createMotionProductionService = (dependencies: Partial<typeof productionDependencies> = {}, directory = path.join(getMotionRootDirectory(), P.RUN_FOLDER), pollMs: number = P.POLL_MS, serviceRetryMs: number = P.SERVICE_RETRY_MS) => {
  const { analyzeMotionStoryInput, scriptMotionStoryInput, scenesMotionStoryInput, voiceMotionStoryInput, seoMotionStoryInput, compileMotionStoryInput, startMotionVideoRenderInput, getStoryJob, cancelStoryJob, getMotionJob, cancelMotionJob, detectEncoders, checkMotionMediaTools, checkMotionProductionVoice } = { ...productionDependencies, ...dependencies };
  const store = new MotionProductionStore<ProductionRecord>(directory);
  const logs = new MotionLogStore(path.join(directory, P.LOG_FOLDER));
  const active = new Map<string, { record: ProductionRecord; controller: AbortController; owner: MotionProductionOwner }>();
  const terminal = (status: S): boolean => [S.COMPLETED, S.CANCELLED, S.ERROR].includes(status);
  const read = (id: string): ProductionRecord | undefined => {
    const record = store.read(id);
    return record?.version === P.RUN_VERSION && record.job?.id === id && record.input && record.inputKey === motionInputKey(record.input) ? record : undefined;
  };
  const log = (record: ProductionRecord, line: string): void => {
    const entry = PROGRESS.TIME.test(line) ? line : PROGRESS.STAMP(line);
    logs.seed(record.job.id, record.job.log);
    logs.append(record.job.id, entry);
    record.job.log = [...record.job.log, entry].slice(-MOTION_VIDEO_CONSTANTS.MAX_LOG_LINES);
  };
  const publicJob = (record: ProductionRecord): MotionStoryJobState => {
    const job = structuredClone({ ...record.job, result: record.result });
    if (record.steps[P.STAGES.SEO]?.done) delete job.result.seoJobId;
    return job;
  };
  const run = async (record: ProductionRecord, controller: AbortController, owner: MotionProductionOwner): Promise<void> => {
    const signal = controller.signal;
    const base: Record<string, any> = { ...structuredClone(record.input), productionId: record.job.id, editorialSessionId: record.job.id, keepBrowser: true };
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
    const mediaProgress = { scenes: 0, voice: 0 };
    const syncSeo = (): void => {
      const task = record.steps[P.STAGES.SEO];
      if (!task?.id || task.done) return;
      const job = getStoryJob(task.id);
      if (!job) return;
      const previous = task.log || [];
      let overlap = Math.min(previous.length, job.log.length);
      while (overlap && previous.slice(-overlap).some((line, index) => line !== job.log[index])) overlap--;
      for (const line of job.log.slice(overlap)) log(record, PROGRESS.SCOPE(P.STAGES.SEO, line));
      task.log = [...job.log];
      if (!terminal(job.status)) return;
      if (job.status === S.COMPLETED && job.result && task.inputKey === seoScriptKey(result.script!)) result.seo = result.voice ? retimeMotionSeo(job.result as MotionSeoPack, result.script!, result.analysis!, result.voice.durations) : (job.result as MotionSeoPack);
      else if (job.error) log(record, P.OPTIONAL_FAILED(P.STAGES.SEO, job.error));
      task.done = true;
      delete result.seoJobId;
    };
    const startSeo = (): void => {
      if (base.seo === false) return;
      const inputKey = seoScriptKey(result.script!);
      const previous = record.steps[P.STAGES.SEO];
      if (previous?.inputKey === inputKey) return;
      if (previous?.id) cancelStoryJob(previous.id);
      delete result.seo;
      delete result.seoJobId;
      record.steps[P.STAGES.SEO] = { id: "", inputKey };
      try {
        const response = seoMotionStoryInput({ ...base, analysis: result.analysis, script: structuredClone(result.script) });
        record.steps[P.STAGES.SEO].id = response.job.id;
        result.seoJobId = response.job.id;
      } catch (error) {
        log(record, P.OPTIONAL_FAILED(P.STAGES.SEO, String((error as Error).message)));
      }
      save();
    };
    const finishSeo = async (): Promise<void> => {
      const task = record.steps[P.STAGES.SEO];
      if (!task?.id || !result.voice) return;
      const deadline = Date.now() + P.SEO_WAIT_MS;
      for (;;) {
        signal.throwIfAborted();
        syncSeo();
        const job = getStoryJob(task.id);
        if (!job || terminal(job.status)) {
          if (job?.status === S.COMPLETED && job.result && task.inputKey === seoScriptKey(result.script!)) {
            result.seo = retimeMotionSeo(job.result as MotionSeoPack, result.script!, result.analysis!, result.voice.durations);
            task.done = true;
          } else if (job?.error) log(record, P.OPTIONAL_FAILED(P.STAGES.SEO, job.error));
          break;
        }
        if (Date.now() >= deadline) {
          cancelStoryJob(task.id);
          log(record, P.SEO_PENDING);
          break;
        }
        await delay(Math.min(pollMs, Math.max(1, deadline - Date.now())), undefined, { signal });
      }
      save();
    };
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
          record.steps[name] = { ...record.steps[name], id: response.job.id, log: [] };
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
    try {
      record.job.status = S.PREPARING;
      record.job.stage = P.STAGES.PREFLIGHT;
      save();
      const directory = getMotionRootDirectory();
      fs.accessSync(directory, fs.constants.W_OK);
      const disk = fs.statfsSync(directory);
      if (!base.source?.segments?.length || disk.bavail * disk.bsize < P.MIN_FREE_BYTES || (closedPuppetPackId(base.stylePreset) && !puppetPackStoryCapabilities(base.stylePreset))) throw new Error(P.PREFLIGHT_FAILED);
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
      const ready = await runInMotionAiSession(
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
      record.illustration = ready.illustration;
      result.analysis = ready.analysis;
      save();
      await step<MotionStoryScript>(
        P.STAGES.SCRIPT,
        () => scriptMotionStoryInput({ ...base, analysis: result.analysis, resume: true, beats: result.script?.beats || [], gen: result.script?.gen, chapterDrafts: result.script?.chapterDrafts, carryGen: base.carryGen }),
        (script) => {
          result.script = script;
        },
        0.1,
        0.2,
      );
      if (base.voiceChannel) result.script!.voiceChannel = base.voiceChannel;
      assertMotionScriptComplete(result.script!, result.analysis);
      const buildMedia = async (round = 0) => {
        startSeo();
        const voicedScript = structuredClone(result.script!);
        const stage = (name: string) => (round ? P.DURATION_STEP(name, round) : name);
        const jobs = [
          step<MotionStoryScript>(
            stage(P.STAGES.SCENES),
            () => scenesMotionStoryInput({ ...base, analysis: result.analysis, script: result.script, illustration: record.illustration, aiExecution: base.sceneAiExecution || base.aiExecution, autoVoice: false, review: base.aiReview !== false, previews: false }),
            (script) => {
              result.script = { ...script, ...(result.voice ? { voiceTrack: result.voice } : {}) };
            },
            0.3,
            0.3,
            false,
            "scenes",
          ),
          step<MotionVoiceTrack>(
            stage(P.STAGES.VOICE),
            () => voiceMotionStoryInput({ ...base, analysis: result.analysis, script: voicedScript, aiExecution: base.sceneAiExecution || base.aiExecution }),
            (voice) => {
              result.voice = voice;
              if (result.script) result.script.voiceTrack = voice;
            },
            0.3,
            0.3,
            false,
            "voice",
          ),
        ];
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
        const failed = outcomes.find((outcome) => outcome.status === "rejected") as PromiseRejectedResult | undefined;
        if (failed) throw firstFailure || failed.reason;
      };
      await buildMedia();
      const targetSeconds = result.analysis!.chapters.reduce((sum, chapter) => sum + (chapter.targetSeconds || 0), 0);
      const durationFits = () => motionDurationQa(result.voice!.totalSeconds, targetSeconds) !== Q.LEVEL.ERROR;
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
          record.durationRepair = { round: (previous?.round || 0) + 1, rate: speechUnits(result.script!.beats.map((beat) => beat.narration).join(P.SEPARATOR)) / result.voice!.totalSeconds, chapters: motionDurationRepairChapters(result.script!, result.analysis!, result.voice!) };
          log(record, P.DURATION_REPAIR(result.voice!.totalSeconds, targetSeconds));
          save();
        }
        const repair = record.durationRepair!;
        repair.chapters ||= motionDurationRepairChapters(result.script!, result.analysis!, result.voice!);
        await step<MotionStoryScript>(
          P.DURATION_STEP(P.STAGES.SCRIPT, repair.round),
          () => scriptMotionStoryInput({ ...base, analysis: result.analysis, beats: result.script!.beats, gen: result.script?.gen, chapterDrafts: result.script?.chapterDrafts, durationRepairStates: result.script?.durationRepairStates, chapterIds: repair.chapters, durationRepair: true, speechRate: repair.rate, editorPass: false }),
          (script) => {
            result.script = script;
          },
          0.1,
          0.2,
        );
        await buildMedia(repair.round);
        repair.done = true;
        save();
      }
      if (record.durationRepair && !record.durationRepair.done) {
        record.durationRepair.done = true;
        save();
      }
      if (motionDurationQa(result.voice!.totalSeconds, targetSeconds) === Q.LEVEL.WARNING) log(record, Q.DURATION_WARNING(result.voice!.totalSeconds, targetSeconds));
      await finishSeo();
      signal.throwIfAborted();
      record.job.stage = P.STAGES.COMPILE;
      if (!result.voice?.audioId || result.voice.signature !== motionVoiceSignature(result.script, result.analysis)) throw new Error(P.AUDIO_REQUIRED);
      result.compiled = await compileMotionStoryInput({ ...base, analysis: result.analysis, script: result.script, voiceTrack: result.voice, durations: result.voice.durations, audioId: result.voice.audioId });
      result.compiled.spec = { ...result.compiled.spec, fps: base.fps, ...(base.subtitles === false ? { subtitles: [] } : {}) };
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
      record.job.stage = result.rendered ? P.STAGES.DONE : P.PREVIEW_DONE;
    } catch (error) {
      record.job.status = signal.aborted ? S.CANCELLED : S.ERROR;
      record.job.error = signal.aborted ? undefined : String((error as Error).message);
      log(record, signal.aborted ? P.RUN_STOPPED : record.job.error!);
    } finally {
      const seo = record.steps[P.STAGES.SEO];
      if (seo?.id && !seo.done) cancelStoryJob(seo.id);
      record.job.activeAi = {};
      delete record.owner;
      if (store.owns(record.job.id, owner)) {
        if (store.read(record.job.id)?.job.status === S.CANCELLED) record.job.status = S.CANCELLED;
        try {
          store.save(record.job.id, record, owner);
        } catch (error) {
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
  const launch = (record: ProductionRecord): MotionStoryJobState => {
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
    void run(record, controller, owner);
    return publicJob(record);
  };
  const startMotionProduction = (input: Record<string, any>, resume = false): MotionStoryJobState => {
    assertMotionProductionMode(input);
    const id = String(input.productionId || randomUUID());
    const normalized = JSON.parse(JSON.stringify({ ...input, productionId: id })) as Record<string, any>;
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
      if (!resume || previous.job.status === S.COMPLETED) return publicJob(previous);
      previous.job.error = undefined;
      log(previous, P.RUN_RESUMED);
      return launch(previous);
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
    if (seo && !seo.done && !active.has(id)) {
      const job = getStoryJob(seo.id);
      if (job?.status === S.COMPLETED && record.result.script && record.result.analysis && seo.inputKey === seoScriptKey(record.result.script)) {
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
    const record = active.get(id)?.record || store.read(id);
    if (!record) return undefined;
    logs.seed(id, record.job.log);
    return logs.read(id, after);
  };
  return { startMotionProduction, getMotionProduction, resumeMotionProduction, cancelMotionProduction, recoverMotionProductions, getMotionProductionLogs };
};
export const { startMotionProduction, getMotionProduction, resumeMotionProduction, cancelMotionProduction, recoverMotionProductions, getMotionProductionLogs } = createMotionProductionService();
