import _ from "lodash";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { loadMotionEngineClient, motionJobStatusUrl, motionRequest, pollMotionJob, readFileBase64, type MotionEngineGlobal } from "../components/motion-video/motionApi.js";
import { API_ROUTES } from "../constants/apiRoutes.js";
import {
  MOTION_TEMPLATE_AI_CHUONG_NHAN_VAT,
  MOTION_TEMPLATE_CANH_CHUA_DUNG_DUOC_BAM_DUNG_TIEP,
  MOTION_TEMPLATE_NAME_DEMO,
  MOTION_TEMPLATE_S,
  MOTION_TEMPLATE_SYMBOL_4,
  MOTION_TEXT_AI_ERROR,
  MOTION_TEXT_ARTENGINE,
  MOTION_TEXT_ARTREVIEW,
  MOTION_TEXT_BEATS,
  MOTION_TEXT_CANCELLED,
  MOTION_TEXT_DARK,
  MOTION_TEXT_DA_DUNG_STOPPED,
  MOTION_TEXT_DA_DUNG_XONG_CAC_CANH_3D,
  MOTION_TEXT_DELETE,
  MOTION_TEXT_ENGINE,
  MOTION_TEXT_MOTION,
  MOTION_TEXT_NARRATION,
  MOTION_TEXT_OK_2,
  MOTION_TEXT_RENDERMODE,
  MOTION_TEXT_SYMBOL_26,
  MOTION_TEXT_SYMBOL_27,
  MOTION_TEXT_TOONSTYLE,
  MOTION_TEXT_USEART,
  MOTION_TEXT_VI,
} from "../constants/motionRuntime.js";
import { MOTION_STORY_CONFIG, MOTION_VIDEO_CONSTANTS } from "../constants/motionVideo.js";
import { jsonUtils } from "../lib/json.js";
import { isMotionJobTerminal } from "../lib/motionJob.js";
import { getMotionErrorMessage } from "../lib/motionUtils.js";
import { AiPlanningChatModel, AiPlanningExecutionMode, AiPlanningFallbackProvider } from "../types.js";
import { MotionAspect, MotionEncoderPreference, MotionJobStatus, MotionQuality, MotionStoryJobKind, MotionStoryLength, type MotionEnvironmentInfo, type MotionJobState, type MotionResultItem, type MotionSpec, type MotionStoryAnalysis, type MotionStoryJobState, type MotionStoryScript, type MotionStorySource, type MotionVoiceTrack } from "../types/motionVideo.js";
import type { StorageCleanResult, StorageJunkReport } from "../types/storage.js";
const STOPPED_TOAST = MOTION_TEXT_DA_DUNG_STOPPED;
const reportStoryError = (error: unknown): void => {
  const message = getMotionErrorMessage(error);
  if (message === MOTION_TEXT_CANCELLED) toast.info(STOPPED_TOAST);
  else toast.error(message);
};
interface PersistedState {
  rawText: string;
  source: MotionStorySource | null;
  language: string;
  length: MotionStoryLength;
  analysis: MotionStoryAnalysis | null;
  script: MotionStoryScript | null;
  voice: (MotionVoiceTrack & { signature: string }) | null;
  uploadedAudio: { id: string; name: string; durationSeconds: number } | null;
  voiceId: string;
  voiceName: string;
  voiceSpeed: number;
  aspect: MotionAspect;
  quality: MotionQuality;
  fps: number;
  encoder: MotionEncoderPreference;
  look: string;
  sfx: boolean;
  sfxVolume: number;
  aiProvider: AiPlanningFallbackProvider;
  aiModel: AiPlanningChatModel;
  aiMode: AiPlanningExecutionMode;
  aiHeadless: boolean;
  aiReview: boolean;
  activeRenderJobId: string;
  activeStoryJobId: string;
  autoContinue: boolean;
}
const DEFAULTS: PersistedState = {
  rawText: "",
  source: null,
  language: MOTION_TEXT_VI,
  length: MotionStoryLength.FULL,
  analysis: null,
  script: null,
  voice: null,
  uploadedAudio: null,
  voiceId: "",
  voiceName: "",
  voiceSpeed: 1,
  aspect: MotionAspect.LANDSCAPE,
  quality: MotionQuality.HIGH,
  fps: 30,
  encoder: MotionEncoderPreference.AUTO,
  look: "",
  sfx: true,
  sfxVolume: 0.5,
  aiProvider: AiPlanningFallbackProvider.GeminiChat,
  aiModel: AiPlanningChatModel.GeminiFlash,
  aiMode: AiPlanningExecutionMode.RoomOnly,
  aiHeadless: true,
  aiReview: true,
  activeRenderJobId: "",
  activeStoryJobId: "",
  autoContinue: true,
};
export interface MotionScenesRequest {
  beats?: string[];
  locations?: string[];
  restart?: boolean;
  restyle?: boolean;
  note?: string;
}
export const narrationSignature = (script: MotionStoryScript | null): string => (script ? _.map(script.beats, MOTION_TEXT_NARRATION).join(MOTION_TEXT_SYMBOL_26) : "");
export function useMotionStudio() {
  const [state, setState] = useState<PersistedState>(DEFAULTS);
  const [hydrated, setHydrated] = useState(false);
  const [ME, setME] = useState<MotionEngineGlobal | null>(null);
  const [engineError, setEngineError] = useState("");
  const [storyJob, setStoryJob] = useState<MotionStoryJobState | null>(null);
  const [renderJob, setRenderJob] = useState<MotionJobState | null>(null);
  const [results, setResults] = useState<MotionResultItem[]>([]);
  const [envInfo, setEnvInfo] = useState<MotionEnvironmentInfo | null>(null);
  const [compiled, setCompiled] = useState<{ spec: MotionSpec; sfxCues: { t: number; kind: string }[]; missing: string[] } | null>(null);
  const [checking, setChecking] = useState(false);
  const mounted = useRef(true);
  const pollAbort = useRef<AbortController | null>(null);
  const patch = useCallback((p: Partial<PersistedState>) => setState((s) => ({ ...s, ...p })), []);
  useEffect(() => {
    mounted.current = true;
    (async () => {
      const saved = await jsonUtils.getAsyncItem<Partial<PersistedState>>(MOTION_STORY_CONFIG.STORY_STORAGE_KEY, {});
      if (!mounted.current) return;
      setState({ ...DEFAULTS, ...(_.omit(saved || {}, [MOTION_TEXT_RENDERMODE, MOTION_TEXT_TOONSTYLE, MOTION_TEXT_USEART, MOTION_TEXT_ARTENGINE, MOTION_TEXT_ARTREVIEW]) as Partial<PersistedState>) });
      setHydrated(true);
    })();
    (async () => {
      try {
        const engine = await loadMotionEngineClient();
        if (!mounted.current) return;
        setME(engine);
      } catch (e: any) {
        setEngineError(e?.message || MOTION_TEXT_ENGINE);
      }
    })();
    motionRequest<{ items: MotionResultItem[] }>(API_ROUTES.MOTION_VIDEO_RESULTS)
      .then((r) => mounted.current && setResults(r.items || []))
      .catch(_.noop);
    motionRequest<{ info: MotionEnvironmentInfo }>(API_ROUTES.MOTION_VIDEO_ENVIRONMENT)
      .then((r) => mounted.current && setEnvInfo(r.info))
      .catch(_.noop);
    return () => {
      mounted.current = false;
      pollAbort.current?.abort();
    };
  }, []);
  const persist = useMemo(() => _.debounce((s: PersistedState) => void jsonUtils.setAsyncItem(MOTION_STORY_CONFIG.STORY_STORAGE_KEY, s), 600), []);
  useEffect(() => {
    if (hydrated) persist(state);
  }, [state, hydrated, persist]);
  useEffect(() => {
    if (!hydrated || !state.activeRenderJobId || renderJob) return;
    void followRender(state.activeRenderJobId);
  }, [hydrated]);
  useEffect(() => {
    if (!hydrated || !state.activeStoryJobId || storyJob) return;
    void resumeStoryJob(state.activeStoryJobId);
  }, [hydrated]);
  const aiExecution = { provider: state.aiProvider, model: state.aiModel, mode: state.aiMode, chromeHeadless: state.aiHeadless };
  const runStoryJob = useCallback(async (url: string, body: unknown, onPartial?: (r: any) => void): Promise<any> => {
    pollAbort.current?.abort();
    const ctrl = new AbortController();
    pollAbort.current = ctrl;
    const { job } = await motionRequest<{ job: MotionStoryJobState }>(url, body);
    setStoryJob(job);
    patch({ activeStoryJobId: job.id });
    const final = await pollMotionJob<MotionStoryJobState>(
      motionJobStatusUrl(API_ROUTES.MOTION_STORY_STATUS, job.id),
      (j) => {
        if (!mounted.current) return;
        setStoryJob(j);
        if (onPartial && j.result) onPartial(j.result);
      },
      (j) => isMotionJobTerminal(j.status),
      ctrl.signal,
      1200,
    ).finally(() => mounted.current && !ctrl.signal.aborted && patch({ activeStoryJobId: "" }));
    if (final.status === MotionJobStatus.ERROR) throw new Error(final.error || MOTION_TEXT_AI_ERROR);
    if (final.status === MotionJobStatus.CANCELLED) throw new Error(MOTION_TEXT_CANCELLED);
    return final.result;
  }, []);
  const resumeStoryJob = useCallback(
    async (jobId: string) => {
      const ctrl = new AbortController();
      pollAbort.current = ctrl;
      try {
        const final = await pollMotionJob<MotionStoryJobState>(
          motionJobStatusUrl(API_ROUTES.MOTION_STORY_STATUS, jobId),
          (j) => {
            if (!mounted.current) return;
            setStoryJob(j);
            if ((j.kind === MotionStoryJobKind.SCRIPT || j.kind === MotionStoryJobKind.SCENES) && _.get(j.result, MOTION_TEXT_BEATS)) patch({ script: j.result as MotionStoryScript });
          },
          (j) => isMotionJobTerminal(j.status),
          ctrl.signal,
          1200,
        );
        if (!mounted.current || final.status !== MotionJobStatus.COMPLETED || !final.result) return;
        if (final.kind === MotionStoryJobKind.SCRIPT || final.kind === MotionStoryJobKind.SCENES) patch({ script: final.result as MotionStoryScript });
        if (final.kind === MotionStoryJobKind.ANALYZE) patch({ analysis: final.result as MotionStoryAnalysis, script: null, voice: null });
        setCompiled(null);
      } catch {
        if (mounted.current && !ctrl.signal.aborted) setStoryJob(null);
      } finally {
        if (mounted.current && !ctrl.signal.aborted) patch({ activeStoryJobId: "" });
      }
    },
    [patch],
  );
  const parseSource = useCallback(
    async (text: string) => {
      patch({ rawText: text });
      if (_.trim(text).length < 40) return patch({ source: null });
      try {
        const r = await motionRequest<{ source: MotionStorySource }>(API_ROUTES.MOTION_STORY_PARSE, { text });
        patch({ source: r.source });
      } catch {
        patch({ source: null });
      }
    },
    [patch],
  );
  const writeScriptRef = useRef<((chapterIds?: string[], analysisOverride?: MotionStoryAnalysis) => Promise<void>) | null>(null);
  const analyze = useCallback(async () => {
    if (!state.source) return;
    try {
      const analysis = (await runStoryJob(API_ROUTES.MOTION_STORY_ANALYZE, { source: state.source, language: state.language, length: state.length, aiExecution })) as MotionStoryAnalysis;
      patch({ analysis, script: null, voice: null, look: analysis.look || state.look });
      setCompiled(null);
      toast.success(MOTION_TEMPLATE_AI_CHUONG_NHAN_VAT(`${analysis.chapters.length}`, `${analysis.cast.length}`));
      if (state.autoContinue !== false && writeScriptRef.current) await writeScriptRef.current(undefined, analysis);
    } catch (e: any) {
      reportStoryError(e);
    }
  }, [state.source, state.language, state.length, state.autoContinue, state.aiProvider, state.aiModel, state.aiMode, state.aiHeadless, runStoryJob, patch]);
  const writeScript = useCallback(
    async (chapterIds?: string[], analysisOverride?: MotionStoryAnalysis) => {
      const analysis = analysisOverride || state.analysis;
      if (!state.source || !analysis) return;
      try {
        const script = (await runStoryJob(API_ROUTES.MOTION_STORY_SCRIPT, { source: state.source, analysis, language: state.language, aiExecution, chapterIds, beats: analysisOverride ? [] : state.script?.beats || [], gen: chapterIds?.length ? state.script?.gen : undefined, aspect: state.aspect }, (partial) => partial?.beats && patch({ script: partial }))) as MotionStoryScript;
        patch({ script });
        setCompiled(null);
        if (state.autoContinue !== false && scenesRef.current) await scenesRef.current({}, script, analysis);
      } catch (e: any) {
        reportStoryError(e);
      }
    },
    [state.source, state.analysis, state.language, state.script, state.aspect, state.aiProvider, state.aiModel, state.aiMode, state.aiHeadless, runStoryJob, patch],
  );
  writeScriptRef.current = writeScript;
  const scenesRef = useRef<((req: MotionScenesRequest, scriptOverride?: MotionStoryScript, analysisOverride?: MotionStoryAnalysis) => Promise<void>) | null>(null);
  const buildScenes = useCallback(
    async (req: MotionScenesRequest = {}, scriptOverride?: MotionStoryScript, analysisOverride?: MotionStoryAnalysis) => {
      const script = scriptOverride || state.script;
      const analysis = analysisOverride || state.analysis;
      if (!script?.beats?.length || !analysis) return;
      try {
        const result = (await runStoryJob(API_ROUTES.MOTION_STORY_SCENES, { script, analysis, aspect: state.aspect, aiExecution, review: state.aiReview !== false, ...req }, (partial) => partial?.beats && patch({ script: partial }))) as MotionStoryScript;
        patch({ script: result });
        setCompiled(null);
        const failed = result.gen?.failed?.length || 0;
        if (failed) toast.warning(MOTION_TEMPLATE_CANH_CHUA_DUNG_DUOC_BAM_DUNG_TIEP(`${failed}`));
        else toast.success(MOTION_TEXT_DA_DUNG_XONG_CAC_CANH_3D);
      } catch (e: any) {
        reportStoryError(e);
      }
    },
    [state.script, state.analysis, state.aspect, state.aiProvider, state.aiModel, state.aiMode, state.aiHeadless, state.aiReview, runStoryJob, patch],
  );
  scenesRef.current = buildScenes;
  const generateVoice = useCallback(async () => {
    if (!state.script?.beats?.length || !state.voiceId) return;
    try {
      const track = (await runStoryJob(API_ROUTES.MOTION_STORY_VOICE, { beats: state.script.beats, voiceId: state.voiceId, speed: state.voiceSpeed })) as MotionVoiceTrack;
      patch({ voice: { ...track, signature: narrationSignature(state.script) }, uploadedAudio: null });
      setCompiled(null);
    } catch (e: any) {
      reportStoryError(e);
    }
  }, [state.script, state.voiceId, state.voiceSpeed, runStoryJob, patch]);
  const uploadVoice = useCallback(
    async (file: File) => {
      try {
        const base64 = await readFileBase64(file);
        const r = await motionRequest<{ audio: { id: string; name: string; durationSeconds: number } }>(API_ROUTES.MOTION_VIDEO_AUDIO, { name: file.name, base64 });
        patch({ uploadedAudio: r.audio, voice: null });
        setCompiled(null);
      } catch (e: any) {
        toast.error(e?.message);
      }
    },
    [patch],
  );
  const cancelStory = useCallback(async () => {
    await motionRequest(API_ROUTES.MOTION_STORY_CANCEL, { jobId: storyJob?.id }).catch(_.noop);
  }, [storyJob]);
  const voiceValid = !!state.voice && state.voice.signature === narrationSignature(state.script);
  const compile = useCallback(async (): Promise<{ spec: MotionSpec; sfxCues: { t: number; kind: string }[] } | null> => {
    if (!state.script?.beats?.length) return null;
    const r = await motionRequest<{ spec: MotionSpec; sfxCues: { t: number; kind: string }[]; missing: string[] }>(API_ROUTES.MOTION_STORY_COMPILE, {
      script: state.script,
      analysis: state.analysis,
      aspect: state.aspect,
      look: state.look || undefined,
      durations: voiceValid ? state.voice?.durations : undefined,
      uploadedAudioSeconds: !voiceValid && state.uploadedAudio ? state.uploadedAudio.durationSeconds : undefined,
    });
    const value = { spec: { ...r.spec, fps: state.fps }, sfxCues: r.sfxCues, missing: r.missing || [] };
    setCompiled(value);
    return value;
  }, [state.script, state.analysis, state.aspect, state.look, state.voice, state.uploadedAudio, state.fps, voiceValid]);
  const compiledSig = useRef("");
  useEffect(() => {
    if (!hydrated || !state.script?.beats?.length) return;
    const sig = JSON.stringify([state.script, state.analysis, state.aspect, state.look, voiceValid ? state.voice?.durations : null, state.uploadedAudio?.durationSeconds, state.fps]);
    if (sig === compiledSig.current) return;
    const t = setTimeout(() => {
      compiledSig.current = sig;
      void compile().catch(() => (compiledSig.current = ""));
    }, 400);
    return () => clearTimeout(t);
  }, [hydrated, compile, state.script, state.analysis, state.aspect, state.look, state.voice, state.uploadedAudio, state.fps, voiceValid]);
  const audioId = voiceValid ? state.voice?.audioId : state.uploadedAudio?.id;
  const check = useCallback(async () => {
    const c = compiled || (await compile());
    if (!c) return;
    setChecking(true);
    try {
      const r = await motionRequest<{ errors: { t: number; shot: string; error: string }[] }>(API_ROUTES.MOTION_VIDEO_CHECK, { spec: c.spec });
      if (_.isEmpty(r.errors)) toast.success(MOTION_TEXT_OK_2);
      else toast.error(_.map(_.take(r.errors, 4), (e) => MOTION_TEMPLATE_S(`${e.t}`, `${e.shot}`, `${e.error}`)).join(MOTION_TEXT_SYMBOL_27));
    } catch (e: any) {
      toast.error(e?.message);
    } finally {
      setChecking(false);
    }
  }, [compiled, compile]);
  const followRender = useCallback(
    async (jobId: string) => {
      try {
        const final = await pollMotionJob<MotionJobState>(
          motionJobStatusUrl(API_ROUTES.MOTION_VIDEO_STATUS, jobId),
          (j) => mounted.current && setRenderJob(j),
          (j) => isMotionJobTerminal(j.status),
          undefined,
          MOTION_VIDEO_CONSTANTS.POLL_INTERVAL_MS,
        );
        if (!mounted.current) return;
        patch({ activeRenderJobId: "" });
        if (final.status === MotionJobStatus.COMPLETED && final.result) {
          setResults((rs) => [final.result!, ..._.reject(rs, { id: final.result!.id })]);
          toast.success(final.result.fileName);
        } else if (final.status === MotionJobStatus.ERROR) toast.error(final.error);
        else if (final.status === MotionJobStatus.CANCELLED) toast.info(STOPPED_TOAST);
      } catch {
        if (mounted.current) patch({ activeRenderJobId: "" });
      }
    },
    [patch],
  );
  const render = useCallback(async () => {
    try {
      const c = compiled || (await compile());
      if (!c) return;
      const { job } = await motionRequest<{ job: MotionJobState }>(API_ROUTES.MOTION_VIDEO_RENDER, {
        spec: c.spec,
        options: {
          quality: state.quality,
          aspect: state.aspect,
          fps: state.fps,
          encoder: state.encoder,
          title: state.analysis?.title || state.script?.title || MOTION_TEXT_MOTION,
          audioId,
          audioVolume: 1,
          sfxVolume: state.sfxVolume,
          sfx: state.sfx ? { cues: c.sfxCues, mood: state.analysis?.genre || MOTION_TEXT_DARK } : undefined,
        },
      });
      setRenderJob(job);
      patch({ activeRenderJobId: job.id });
      void followRender(job.id);
    } catch (e: any) {
      toast.error(e?.message);
    }
  }, [compiled, compile, state.quality, state.aspect, state.fps, state.encoder, state.analysis, state.script, state.sfx, state.sfxVolume, audioId, followRender, patch]);
  const cancelRender = useCallback(async () => {
    await motionRequest(API_ROUTES.MOTION_VIDEO_CANCEL, { jobId: renderJob?.id }).catch(_.noop);
  }, [renderJob]);
  const deleteResult = useCallback(async (id: string): Promise<number> => {
    const r = await motionRequest<{ freedBytes?: number }>(MOTION_TEMPLATE_SYMBOL_4(`${API_ROUTES.MOTION_VIDEO_RESULTS}`, `${id}`), undefined, MOTION_TEXT_DELETE);
    setResults((rs) => _.reject(rs, { id }));
    return _.toNumber(r.freedBytes) || 0;
  }, []);
  const scanJunk = useCallback(async (): Promise<StorageJunkReport> => (await motionRequest<{ report: StorageJunkReport }>(API_ROUTES.MOTION_STORAGE_JUNK)).report, []);
  const cleanJunk = useCallback(async (groups: string[]): Promise<StorageCleanResult> => motionRequest(API_ROUTES.MOTION_STORAGE_CLEAN, { groups }), []);
  const deleteAllResults = useCallback(async (): Promise<number> => {
    const r = await motionRequest<{ freedBytes?: number }>(API_ROUTES.MOTION_VIDEO_RESULTS, undefined, MOTION_TEXT_DELETE);
    setResults([]);
    return _.toNumber(r.freedBytes) || 0;
  }, []);
  const saveResult = useCallback(async (item: MotionResultItem) => {
    try {
      const pick = await motionRequest<{ cancelled?: boolean; token?: string }>(API_ROUTES.MOTION_VIDEO_SELECT_SAVE_DESTINATION, { suggestedName: item.fileName });
      if (pick.cancelled || !pick.token) return;
      const r = await motionRequest<{ savedPath: string }>(API_ROUTES.MOTION_VIDEO_SAVE_VIDEO, { token: pick.token, fileName: item.fileName });
      toast.success(r.savedPath);
    } catch (e: any) {
      toast.error(e?.message);
    }
  }, []);
  const loadDemo = useCallback(async () => {
    try {
      const r = await motionRequest<{ spec: MotionSpec }>(MOTION_TEMPLATE_NAME_DEMO(`${API_ROUTES.MOTION_VIDEO_DEMO}`));
      setCompiled({ spec: { ...r.spec, aspect: state.aspect }, sfxCues: [], missing: [] });
    } catch (e: any) {
      toast.error(e?.message);
    }
  }, [state.aspect]);
  const storyBusy = !!storyJob && !isMotionJobTerminal(storyJob.status);
  const renderBusy = !!renderJob && !isMotionJobTerminal(renderJob.status);
  return {
    state,
    patch,
    hydrated,
    ME,
    engineError,
    storyJob,
    storyBusy,
    renderJob,
    renderBusy,
    results,
    envInfo,
    compiled,
    checking,
    voiceValid,
    audioId,
    parseSource,
    analyze,
    writeScript,
    buildScenes,
    generateVoice,
    uploadVoice,
    cancelStory,
    compile,
    check,
    render,
    cancelRender,
    deleteResult,
    deleteAllResults,
    scanJunk,
    cleanJunk,
    saveResult,
    loadDemo,
  };
}
export type MotionStudio = ReturnType<typeof useMotionStudio>;
