import { logMotionActivity, logStoryTerminal, loggedMotionAction } from "../services/motionWorkflowActivity";
import { WORKFLOW_ACTIVITY_CONFIG, storyActivityPrefixes, storyActivityRoutes, MOTION_ACTIVITY_PREFIX } from "../constants/workflowActivity";
import * as MR from "../constants/motionRuntime.js";
import _ from "lodash";
import { bindVideoDnaSettings, reconcileCharacterMode, sceneExecutionKey } from "../lib/motionVideoDna.js";
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
import { MotionAspect, MotionEncoderPreference, MotionJobStatus, MotionQuality, MotionStoryJobKind, MotionStoryLength, type MotionJobState, type MotionResultItem, type MotionSpec, type MotionStoryAnalysis, type MotionStoryJobState, type MotionStoryScript, type MotionStorySource, type MotionVoiceTrack, type MotionSeoPack, type MotionThumbnail } from "../types/motionVideo.js";
import { retimeSeoPack } from "../lib/motionSeo.js";
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
  voice:
    | (MotionVoiceTrack & { signature: string; })
    | null;
  uploadedAudio: { id: string; name: string; durationSeconds: number; } | null;
  voiceId: string;
  voiceName: string;
  voiceSpeed: number;
  aspect: MotionAspect;
  quality: MotionQuality;
  fps: number;
  encoder: MotionEncoderPreference;
  look: string;
  sfx: boolean;
  customCharacters: boolean;
  drawingMode: "2d" | "3d";
  subtitles?: boolean;
  sfxVolume: number;
  aiProvider: AiPlanningFallbackProvider;
  aiModel: AiPlanningChatModel;
  aiMode: AiPlanningExecutionMode;
  aiHeadless: boolean;
  aiReview: boolean;
  activeRenderJobId: string;
  activeStoryJobId: string;
  autoContinue: boolean;
  seo: MotionSeoPack | null;
  thumbnail?: MotionThumbnail | null;
  thumbnails?: Record<number, MotionThumbnail>;
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
  customCharacters: false,
  drawingMode: MR.MOTION_TEXT_3D,
  subtitles: true,
  sfxVolume: 0.5,
  aiProvider: AiPlanningFallbackProvider.GeminiChat,
  aiModel: AiPlanningChatModel.GeminiFlash,
  aiMode: AiPlanningExecutionMode.RoomOnly,
  aiHeadless: true,
  aiReview: true,
  activeRenderJobId: "",
  activeStoryJobId: "",
  autoContinue: true,
  seo: null,
  thumbnail: null,
};
export interface MotionScenesRequest { beats?: string[]; locations?: string[]; restart?: boolean; restyle?: boolean; note?: string; }
export const narrationSignature = (script: MotionStoryScript | null): string => (script ? _.map(script.beats, MOTION_TEXT_NARRATION).join(MOTION_TEXT_SYMBOL_26) : "");
export function useMotionStudio() {
  const [state, setState] = useState<PersistedState>(DEFAULTS);
  const [hydrated, setHydrated] = useState(false);
  const [ME, setME] = useState<MotionEngineGlobal | null>(null);
  const [engineError, setEngineError] = useState("");
  const [storyJob, setStoryJob] = useState<MotionStoryJobState | null>(null);
  const [renderJob, setRenderJob] = useState<MotionJobState | null>(null);
  const [results, setResults] = useState<MotionResultItem[]>([]);
  const [compiled, setCompiled] = useState<{ spec: MotionSpec; sfxCues: { t: number; kind: string; }[]; missing: string[]; } | null>(null);
  const [checking, setChecking] = useState(false);
  const mounted = useRef(true);
  const pollAbort = useRef<AbortController | null>(null);
  const patch = useCallback(
    (p: Partial<PersistedState>) =>
      setState((s) => {
        const next = { ...s, ...p };
        const changedInput = p.rawText !== undefined && p.rawText !== s.rawText;
        const changedNarration = (p.length !== undefined && p.length !== s.length) || (p.language !== undefined && p.language !== s.language);
        if (changedInput || changedNarration) {
          next.analysis = null;
          next.script = null;
          next.voice = null;
          if (changedInput) next.source = null;
        } else if (next.analysis?.videoDna) {
          next.analysis = bindVideoDnaSettings(next.analysis, { language: next.language === MR.MOTION_TEXT_EN ? MR.MOTION_TEXT_EN : MR.MOTION_TEXT_VI, length: next.length, drawingMode: next.drawingMode, characterMode: next.customCharacters ? MR.MOTION_TEXT_DRAWN : MR.MOTION_TEXT_MANNEQUIN, aspect: next.aspect });
        }
        next.script = reconcileCharacterMode(next.script, next.customCharacters);
        return next;
      }),
    [],
  );
  useEffect(() => {
    mounted.current = true;
    (async () => {
      const saved = await jsonUtils.getAsyncItem<Partial<PersistedState>>(MOTION_STORY_CONFIG.STORY_STORAGE_KEY, {});
      if (!mounted.current) return;
      const restored = { ...DEFAULTS, ...(_.omit(saved || {}, [MOTION_TEXT_RENDERMODE, MOTION_TEXT_TOONSTYLE, MOTION_TEXT_USEART, MOTION_TEXT_ARTENGINE, MOTION_TEXT_ARTREVIEW]) as Partial<PersistedState>) };
      restored.script = reconcileCharacterMode(restored.script, restored.customCharacters);
      setState(restored);
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
    motionRequest<{ items: MotionResultItem[]; }>(API_ROUTES.MOTION_VIDEO_RESULTS)
      .then((r) => mounted.current && setResults(r.items || []))
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
    const flush = () => persist.flush();
    const onHidden = () => document.visibilityState === MR.MOTION_TEXT_HIDDEN && flush();
    window.addEventListener(MR.MOTION_TEXT_PAGEHIDE, flush);
    window.addEventListener(MR.MOTION_TEXT_BEFOREUNLOAD, flush);
    document.addEventListener(MR.MOTION_TEXT_VISIBILITYCHANGE, onHidden);
    return () => {
      window.removeEventListener(MR.MOTION_TEXT_PAGEHIDE, flush);
      window.removeEventListener(MR.MOTION_TEXT_BEFOREUNLOAD, flush);
      document.removeEventListener(MR.MOTION_TEXT_VISIBILITYCHANGE, onHidden);
      flush();
    };
  }, [persist]);
  const stateRef = useRef(state);
  stateRef.current = state;
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
    const prefix = storyActivityPrefixes[storyActivityRoutes[url]];
    logMotionActivity(prefix, WORKFLOW_ACTIVITY_CONFIG.EVENT_SUFFIX.start);
    let terminalLogged = false;
    try {
      const { job } = await motionRequest<{ job: MotionStoryJobState; }>(url, body);
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
      if (mounted.current) {
        logStoryTerminal(final);
        terminalLogged = true;
      }
      if (final.status === MotionJobStatus.ERROR) throw new Error(final.error || MOTION_TEXT_AI_ERROR);
      if (final.status === MotionJobStatus.CANCELLED) throw new Error(MOTION_TEXT_CANCELLED);
      return final.result;
    } catch (error) {
      if (!ctrl.signal.aborted && mounted.current && getMotionErrorMessage(error) !== MOTION_TEXT_CANCELLED) {
        if (!terminalLogged) logMotionActivity(prefix, WORKFLOW_ACTIVITY_CONFIG.EVENT_SUFFIX.fail, getMotionErrorMessage(error));
      }
      throw error;
    }
  }, []);
  const resumeStoryJob = useCallback(
    async (jobId: string) => {
      const ctrl = new AbortController();
      pollAbort.current = ctrl;
      let chainAfterResume: (() => Promise<unknown> | undefined) | null = null;
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
        if (!mounted.current) return;
        logStoryTerminal(final);
        if (final.status !== MotionJobStatus.COMPLETED || !final.result) return;
        if (final.kind === MotionStoryJobKind.SCRIPT || final.kind === MotionStoryJobKind.SCENES) patch({ script: final.result as MotionStoryScript });
        if (final.kind === MotionStoryJobKind.ANALYZE) patch({ analysis: final.result as MotionStoryAnalysis, script: null, voice: null, seo: null, thumbnail: null });
        if (final.kind === MotionStoryJobKind.VOICE) {
          const track = final.result as MotionVoiceTrack;
          setState((s) => (s.script ? { ...s, voice: { ...track, signature: narrationSignature(s.script) }, uploadedAudio: null, ...(s.seo && s.analysis && track.durations?.length === s.script.beats.length ? { seo: retimeSeoPack(s.seo, s.script.beats, s.analysis.chapters, s.language !== MR.MOTION_TEXT_EN, track.durations) } : {}) } : s));
        }
        if (final.kind === MotionStoryJobKind.THUMBNAIL) patch({ thumbnail: { image: (final.result as any).thumbnail, prompt: (final.result as any).prompt } });
        if (final.kind === MotionStoryJobKind.SEO) patch({ seo: final.result as MotionSeoPack });
        setCompiled(null);
        if (stateRef.current.autoContinue !== false) {
          if (final.kind === MotionStoryJobKind.ANALYZE) chainAfterResume = () => writeScriptRef.current?.(undefined, final.result as MotionStoryAnalysis);
          if (final.kind === MotionStoryJobKind.SCRIPT && stateRef.current.analysis) {
            const script = final.result as MotionStoryScript;
            const analysis = stateRef.current.analysis;
            chainAfterResume = async () => {
              await seoRef.current?.(script, analysis, true);
              await scenesRef.current?.({}, script, analysis);
            };
          }
        }
      } catch {
        if (mounted.current && !ctrl.signal.aborted) setStoryJob(null);
      } finally {
        if (mounted.current && !ctrl.signal.aborted) patch({ activeStoryJobId: "" });
      }
      if (chainAfterResume && mounted.current) setTimeout(() => void chainAfterResume?.(), 0);
    },
    [patch],
  );
  const parseSource = useCallback(
    async (text: string) => {
      patch({ rawText: text });
      if (_.trim(text).split(/\s+/).length < 3 && !/https?:\/\/\S+/i.test(text)) return patch({ source: null });
      try {
        const r = await motionRequest<{ source: MotionStorySource; }>(API_ROUTES.MOTION_STORY_PARSE, { text });
        patch({ source: r.source });
      } catch {
        patch({ source: null });
      }
    },
    [patch],
  );
  const writeScriptRef = useRef<((chapterIds?: string[], analysisOverride?: MotionStoryAnalysis, resume?: boolean) => Promise<void>) | null>(null);
  const analyze = useCallback(async () => {
    if (!state.source) return;
    try {
      const analysis = (await runStoryJob(API_ROUTES.MOTION_STORY_ANALYZE, { source: state.source, language: state.language, length: state.length, drawingMode: state.drawingMode, customCharacters: state.customCharacters, aspect: state.aspect, aiExecution })) as MotionStoryAnalysis;
      patch({ analysis, script: null, voice: null, seo: null, thumbnail: null, look: analysis.look || state.look });
      setCompiled(null);
      toast.success(MOTION_TEMPLATE_AI_CHUONG_NHAN_VAT(MR.MOTION_TEMPLATE_SYMBOL_58(analysis.chapters.length), MR.MOTION_TEMPLATE_SYMBOL_59(analysis.cast.length)));
      if (state.autoContinue !== false && writeScriptRef.current) await writeScriptRef.current(undefined, analysis);
    } catch (e: any) {
      reportStoryError(e);
    }
  }, [state.source, state.language, state.length, state.drawingMode, state.customCharacters, state.aspect, state.autoContinue, state.aiProvider, state.aiModel, state.aiMode, state.aiHeadless, runStoryJob, patch]);
  const writeScript = useCallback(
    async (chapterIds?: string[], analysisOverride?: MotionStoryAnalysis, resume = false) => {
      const analysis = analysisOverride || state.analysis;
      if (!state.source || !analysis) return;
      try {
        const script = (await runStoryJob(
          API_ROUTES.MOTION_STORY_SCRIPT,
          { source: state.source, analysis, language: state.language, length: state.length, customCharacters: state.customCharacters, drawingMode: state.drawingMode, aiExecution, chapterIds, beats: analysisOverride ? [] : state.script?.beats || [], gen: chapterIds?.length ? state.script?.gen : undefined, aspect: state.aspect, resume, },
          (partial) => partial?.beats && patch({ script: partial }),
        )) as MotionStoryScript;
        patch({ script, seo: null });
        setCompiled(null);
        const missing = _.filter(analysis.chapters, (c) => !_.some(script.beats, { chapterId: c.id })).length;
        if (missing) toast.warning(MR.MOTION_TEMPLATE_CON_CHUONG_CHUA_VIET_DUOC_BAM_VIET_TIEP_CHUONG_CON_THIEU(missing));
        if (state.autoContinue !== false && seoRef.current) await seoRef.current(script, analysis, true);
        if (state.autoContinue !== false && scenesRef.current) await scenesRef.current({}, script, analysis);
      } catch (e: any) {
        reportStoryError(e);
      }
    },
    [state.source, state.analysis, state.language, state.length, state.autoContinue, state.customCharacters, state.drawingMode, state.script, state.aspect, state.aiProvider, state.aiModel, state.aiMode, state.aiHeadless, runStoryJob, patch],
  );
  writeScriptRef.current = writeScript;
  const seoRef = useRef<((scriptOverride?: MotionStoryScript, analysisOverride?: MotionStoryAnalysis, quiet?: boolean) => Promise<void>) | null>(null);
  const generateSeo = useCallback(
    async (scriptOverride?: MotionStoryScript, analysisOverride?: MotionStoryAnalysis, quiet = false) => {
      const script = scriptOverride || state.script;
      const analysis = analysisOverride || state.analysis;
      if (!script?.beats?.length || !analysis) return;
      const voiceMatches = !scriptOverride && state.voice && state.voice.durations?.length === script.beats.length;
      try {
        const seo = (await runStoryJob(API_ROUTES.MOTION_STORY_SEO, { analysis, script, language: state.language, aiExecution, durations: voiceMatches ? state.voice!.durations : undefined })) as MotionSeoPack;
        patch({ seo });
      } catch (e: any) {
        if (quiet) toast.warning(MR.MOTION_TEMPLATE_SEO(getMotionErrorMessage(e)));
        else reportStoryError(e);
      }
    },
    [state.script, state.analysis, state.language, state.voice, state.aiProvider, state.aiModel, state.aiMode, state.aiHeadless, runStoryJob, patch],
  );
  seoRef.current = generateSeo;
  const generateThumbnail = useCallback(
    async (optionIndex = 0) => {
      if (!state.analysis) return;
      try {
        const result = (await runStoryJob(API_ROUTES.MOTION_STORY_THUMBNAIL, { analysis: state.analysis, seo: state.seo?.options?.[optionIndex], language: state.language, aspect: state.aspect, aiExecution })) as { thumbnail: string; prompt: string; };
        const newThumb: MotionThumbnail = { image: result.thumbnail, prompt: result.prompt, optionIndex };
        patch({ thumbnail: newThumb, thumbnails: { ...(state.thumbnails || {}), [optionIndex]: newThumb }, });
      } catch (e: any) {
        reportStoryError(e);
      }
    },
    [state.analysis, state.seo, state.language, state.aspect, state.aiProvider, state.aiModel, state.aiMode, state.aiHeadless, state.thumbnails, runStoryJob, patch],
  );
  const scenesRef = useRef<((req: MotionScenesRequest, scriptOverride?: MotionStoryScript, analysisOverride?: MotionStoryAnalysis) => Promise<MotionStoryScript | undefined>) | null>(null);
  const buildScenes = useCallback(
    async (req: MotionScenesRequest = {}, scriptOverride?: MotionStoryScript, analysisOverride?: MotionStoryAnalysis) => {
      const script = scriptOverride || state.script;
      const analysis = analysisOverride || state.analysis;
      if (!script?.beats?.length || !analysis) return;
      try {
        const result = (await runStoryJob(API_ROUTES.MOTION_STORY_SCENES, { script, analysis, aspect: state.aspect, aiExecution, customCharacters: state.customCharacters === true, drawingMode: state.drawingMode, review: state.aiReview !== false, ...req }, (partial) => partial?.beats && patch({ script: partial }))) as MotionStoryScript;
        patch({ script: result });
        setCompiled(null);
        const failed = result.gen?.failed?.length || 0;
        if (failed) toast.warning(MOTION_TEMPLATE_CANH_CHUA_DUNG_DUOC_BAM_DUNG_TIEP(MR.MOTION_TEMPLATE_SYMBOL_60(failed)));
        else toast.success(MOTION_TEXT_DA_DUNG_XONG_CAC_CANH_3D);
        return result;
      } catch (e: any) {
        reportStoryError(e);
      }
    },
    [state.script, state.analysis, state.aspect, state.aiProvider, state.aiModel, state.aiMode, state.aiHeadless, state.aiReview, state.customCharacters, state.drawingMode, runStoryJob, patch],
  );
  scenesRef.current = buildScenes;
  const generateVoice = useCallback(async () => {
    if (!state.script?.beats?.length || !state.voiceId) return;
    try {
      const track = (await runStoryJob(API_ROUTES.MOTION_STORY_VOICE, { beats: state.script.beats, voiceId: state.voiceId, speed: state.voiceSpeed })) as MotionVoiceTrack;
      patch({ voice: { ...track, signature: narrationSignature(state.script) }, uploadedAudio: null, ...(state.seo && state.analysis && track.durations?.length === state.script.beats.length ? { seo: retimeSeoPack(state.seo, state.script.beats, state.analysis.chapters, state.language !== MR.MOTION_TEXT_EN, track.durations) } : {}) });
      setCompiled(null);
    } catch (e: any) {
      reportStoryError(e);
    }
  }, [state.script, state.voiceId, state.voiceSpeed, state.seo, state.analysis, state.language, runStoryJob, patch]);
  const uploadVoice = useCallback(
    async (file: File) => {
      try {
        const base64 = await readFileBase64(file);
        const r = await loggedMotionAction(
          MOTION_ACTIVITY_PREFIX.audio,
          () =>
            motionRequest<{ audio: { id: string; name: string; durationSeconds: number; }; }>(API_ROUTES.MOTION_VIDEO_AUDIO, { name: file.name, base64 }),
          file.name,
        );
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
  const compile = useCallback(
    async (
      scriptOverride?: MotionStoryScript,
    ): Promise<{ spec: MotionSpec; sfxCues: { t: number; kind: string; }[]; missing: string[]; } | null> => {
      const script = scriptOverride || state.script;
      if (!script?.beats?.length) return null;
      const r = await motionRequest<{ spec: MotionSpec; sfxCues: { t: number; kind: string; }[]; missing: string[]; }>(
        API_ROUTES.MOTION_STORY_COMPILE,
        { script, analysis: state.analysis, aspect: state.aspect, look: state.look || undefined, durations: voiceValid ? state.voice?.durations : undefined, uploadedAudioSeconds: !voiceValid && state.uploadedAudio ? state.uploadedAudio.durationSeconds : undefined, },
      );
      const value = { spec: { ...r.spec, fps: state.fps, ...(state.subtitles === false ? { subtitles: [] } : {}) }, sfxCues: r.sfxCues, missing: r.missing || [] };
      setCompiled(value);
      return value;
    },
    [state.script, state.analysis, state.aspect, state.look, state.voice, state.uploadedAudio, state.fps, state.subtitles, voiceValid],
  );
  const compiledSig = useRef("");
  useEffect(() => {
    if (!state.script?.beats?.length) {
      setCompiled(null);
      compiledSig.current = "";
      return;
    }
    if (!hydrated) return;
    const sig = JSON.stringify([state.script, state.analysis, state.aspect, state.look, voiceValid ? state.voice?.durations : null, state.uploadedAudio?.durationSeconds, state.fps, state.subtitles !== false]);
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
    logMotionActivity(MOTION_ACTIVITY_PREFIX.check, WORKFLOW_ACTIVITY_CONFIG.EVENT_SUFFIX.start);
    try {
      const r = await motionRequest<{ errors: { t: number; shot: string; error: string; }[]; }>(API_ROUTES.MOTION_VIDEO_CHECK, { spec: c.spec });
      logMotionActivity(MOTION_ACTIVITY_PREFIX.check, r.errors.length ? WORKFLOW_ACTIVITY_CONFIG.EVENT_SUFFIX.fail : WORKFLOW_ACTIVITY_CONFIG.EVENT_SUFFIX.done, r.errors[0]?.error, r.errors.length || undefined);
      if (_.isEmpty(r.errors)) toast.success(MOTION_TEXT_OK_2);
      else toast.error(_.map(_.take(r.errors, 4), (e) => MOTION_TEMPLATE_S(MR.MOTION_TEMPLATE_SYMBOL_61(e.t), MR.MOTION_TEMPLATE_SYMBOL_62(e.shot), MR.MOTION_TEMPLATE_SYMBOL_63(e.error))).join(MOTION_TEXT_SYMBOL_27));
    } catch (e: any) {
      logMotionActivity(MOTION_ACTIVITY_PREFIX.check, WORKFLOW_ACTIVITY_CONFIG.EVENT_SUFFIX.fail, getMotionErrorMessage(e));
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
        logMotionActivity(MOTION_ACTIVITY_PREFIX.render, final.status === MotionJobStatus.COMPLETED ? WORKFLOW_ACTIVITY_CONFIG.EVENT_SUFFIX.done : final.status === MotionJobStatus.CANCELLED ? WORKFLOW_ACTIVITY_CONFIG.EVENT_SUFFIX.stop : WORKFLOW_ACTIVITY_CONFIG.EVENT_SUFFIX.fail, final.error || final.result?.fileName);
        if (final.status === MotionJobStatus.COMPLETED && final.result) {
          setResults((rs) => [final.result!, ..._.reject(rs, { id: final.result!.id })]);
          toast.success(final.result.fileName);
        } else if (final.status === MotionJobStatus.ERROR) toast.error(final.error);
        else if (final.status === MotionJobStatus.CANCELLED) toast.info(STOPPED_TOAST);
      } catch (error) {
        if (mounted.current) logMotionActivity(MOTION_ACTIVITY_PREFIX.render, WORKFLOW_ACTIVITY_CONFIG.EVENT_SUFFIX.fail, getMotionErrorMessage(error));
        if (mounted.current) patch({ activeRenderJobId: "" });
      }
    },
    [patch],
  );
  const render = useCallback(async () => {
    let renderRequested = false;
    try {
      let c = compiled;
      const requestedMode = state.customCharacters ? MR.MOTION_TEXT_DRAWN : MR.MOTION_TEXT_MANNEQUIN;
      const changedScenePlan = !!state.analysis?.videoDna && state.script?.beats.some((beat) => beat.visual === MR.MOTION_TEXT_SCENE && state.script?.gen?.scenePlanKeys?.[beat.id] !== sceneExecutionKey(beat));
      if (state.script && state.analysis && (changedScenePlan || (state.script.gen?.characterMode || MR.MOTION_TEXT_MANNEQUIN) !== requestedMode || (state.script.gen?.drawingMode || MR.MOTION_TEXT_3D) !== state.drawingMode)) {
        const rebuilt = await buildScenes({});
        if (!rebuilt || rebuilt.gen?.failed?.length) return;
        c = await compile(rebuilt);
      } else {
        if (state.script?.gen?.failed?.length) {
          toast.warning(MOTION_TEMPLATE_CANH_CHUA_DUNG_DUOC_BAM_DUNG_TIEP(MR.MOTION_TEMPLATE_SYMBOL_64(state.script.gen.failed.length)));
          return;
        }
        c = c || (await compile());
      }
      if (!c) return;
      if (c.missing.length) {
        toast.warning(MOTION_TEMPLATE_CANH_CHUA_DUNG_DUOC_BAM_DUNG_TIEP(MR.MOTION_TEMPLATE_SYMBOL_65(c.missing.length)));
        return;
      }
      logMotionActivity(MOTION_ACTIVITY_PREFIX.render, WORKFLOW_ACTIVITY_CONFIG.EVENT_SUFFIX.start);
      renderRequested = true;
      const { job } = await motionRequest<{ job: MotionJobState; }>(API_ROUTES.MOTION_VIDEO_RENDER, {
        spec: c.spec,
        options: { quality: state.quality, aspect: state.aspect, fps: state.fps, encoder: state.encoder, title: state.analysis?.title || state.script?.title || MOTION_TEXT_MOTION, audioId, audioVolume: 1, sfxVolume: state.sfxVolume, sfx: state.sfx ? { cues: c.sfxCues, mood: state.analysis?.sfxMood || state.analysis?.genre || MOTION_TEXT_DARK } : undefined, },
      });
      setRenderJob(job);
      patch({ activeRenderJobId: job.id });
      void followRender(job.id);
    } catch (e: any) {
      if (renderRequested) logMotionActivity(MOTION_ACTIVITY_PREFIX.render, WORKFLOW_ACTIVITY_CONFIG.EVENT_SUFFIX.fail, getMotionErrorMessage(e));
      toast.error(e?.message);
    }
  }, [compiled, compile, buildScenes, state.customCharacters, state.drawingMode, state.quality, state.aspect, state.fps, state.encoder, state.analysis, state.script, state.sfx, state.sfxVolume, audioId, followRender, patch]);
  const cancelRender = useCallback(async () => {
    await motionRequest(API_ROUTES.MOTION_VIDEO_CANCEL, { jobId: renderJob?.id }).catch(_.noop);
  }, [renderJob]);
  const deleteResult = useCallback(async (id: string): Promise<number> => {
    const r = await loggedMotionAction(MOTION_ACTIVITY_PREFIX.delete, () =>
      motionRequest<{ freedBytes?: number; }>(MOTION_TEMPLATE_SYMBOL_4(MR.MOTION_TEMPLATE_SYMBOL_66(API_ROUTES.MOTION_VIDEO_RESULTS), MR.MOTION_TEMPLATE_SYMBOL_67(id)), undefined, MOTION_TEXT_DELETE),
    );
    setResults((rs) => _.reject(rs, { id }));
    return _.toNumber(r.freedBytes) || 0;
  }, []);
  const scanJunk = useCallback(
    async (): Promise<StorageJunkReport> =>
      (
        await motionRequest<{ report: StorageJunkReport; }>(API_ROUTES.MOTION_STORAGE_JUNK)
      ).report,
    [],
  );
  const cleanJunk = useCallback(async (groups: string[]): Promise<StorageCleanResult> => loggedMotionAction(MOTION_ACTIVITY_PREFIX.clean, () => motionRequest<StorageCleanResult>(API_ROUTES.MOTION_STORAGE_CLEAN, { groups })), []);
  const deleteAllResults = useCallback(async (): Promise<number> => {
    const r = await loggedMotionAction(MOTION_ACTIVITY_PREFIX.delete, () =>
      motionRequest<{ freedBytes?: number; }>(API_ROUTES.MOTION_VIDEO_RESULTS, undefined, MOTION_TEXT_DELETE),
    );
    setResults([]);
    return _.toNumber(r.freedBytes) || 0;
  }, []);
  const saveResult = useCallback(async (item: MotionResultItem) => {
    try {
      const pick = await motionRequest<{ cancelled?: boolean; token?: string; }>(API_ROUTES.MOTION_VIDEO_SELECT_SAVE_DESTINATION, { suggestedName: item.fileName });
      if (pick.cancelled || !pick.token) return;
      const r = await loggedMotionAction(
        MOTION_ACTIVITY_PREFIX.save,
        () =>
          motionRequest<{ savedPath: string; }>(API_ROUTES.MOTION_VIDEO_SAVE_VIDEO, { token: pick.token, fileName: item.fileName }),
        item.fileName,
      );
      toast.success(r.savedPath);
    } catch (e: any) {
      toast.error(e?.message);
    }
  }, []);
  const loadDemo = useCallback(async () => {
    try {
      const r = await motionRequest<{ spec: MotionSpec; }>(MOTION_TEMPLATE_NAME_DEMO(MR.MOTION_TEMPLATE_SYMBOL_68(API_ROUTES.MOTION_VIDEO_DEMO)));
      setCompiled({ spec: { ...r.spec, aspect: state.aspect }, sfxCues: [], missing: [] });
    } catch (e: any) {
      toast.error(e?.message);
    }
  }, [state.aspect]);
  const storyBusy = !!storyJob && !isMotionJobTerminal(storyJob.status);
  const renderBusy = !!renderJob && !isMotionJobTerminal(renderJob.status);
  return { state, patch, ME, engineError, storyJob, storyBusy, renderJob, renderBusy, results, compiled, checking, voiceValid, audioId, parseSource, analyze, writeScript, buildScenes, generateVoice, generateSeo, generateThumbnail, uploadVoice, cancelStory, check, render, cancelRender, deleteResult, deleteAllResults, scanJunk, cleanJunk, saveResult, loadDemo };
}
export type MotionStudio = ReturnType<typeof useMotionStudio>;
