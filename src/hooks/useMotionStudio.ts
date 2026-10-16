import { MOTION_PATTERNS as MP } from "../constants/motionPatterns.js";
import { MOTION_AUDIO_DIRECTION } from "../constants/motionAudioDirection.js";
import { MOTION_SCENE_LIBRARY_MODES, type MotionSceneLibraryMode } from "../constants/motionSceneCatalog.js";
import { MOTION_SOUND_CONFIG } from "../constants/motionSound.js";
import { MOTION_VOICE, MOTION_VOICE_LIBRARY } from "../constants/motionVoice.js";
import { motionVoiceSignature, voiceChannelRef } from "../lib/motionVoice.js";
import type { MotionCompiledPreview, MotionLogEntry, MotionSoundOverride, MotionStyleReference, MotionVoiceChannels } from "../types/motionVideo.js";
import { logMotionActivity, logStoryTerminal, loggedMotionAction } from "../services/motionWorkflowActivity";
import { WORKFLOW_ACTIVITY_CONFIG, storyActivityPrefixes, storyActivityRoutes, MOTION_ACTIVITY_PREFIX } from "../constants/workflowActivity";
import * as MR from "../constants/motionRuntime.js";
import { MOTION_VIDEO_GENRES, type MotionVideoGenre } from "../constants/motionGenre.js";
import { MOTION_STYLE_PRESET_NONE } from "../constants/motionStylePresets.js";
import { MOTION_MUSIC } from "../constants/motionMusic.js";
import _ from "lodash";
import { needsAuthoredCharacters, sceneExecutionKey } from "../lib/motionVideoDna.js";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { loadMotionEngineClient, motionJobStatusUrl, motionRequest, pollMotionJob, type MotionEngineGlobal } from "../components/motion-video/motionApi.js";
import { API_ROUTES } from "../constants/apiRoutes.js";
import {
  MOTION_TEMPLATE_AI_CHUONG_NHAN_VAT,
  MOTION_TEMPLATE_CANH_CHUA_DUNG_DUOC_BAM_DUNG_TIEP,
  MOTION_TEMPLATE_NAME_DEMO,
  MOTION_TEMPLATE_S,
  MOTION_TEMPLATE_SYMBOL_4,
  MOTION_TEXT_AI_ERROR,
  MOTION_TEXT_BEATS,
  MOTION_TEXT_CANCELLED,
  MOTION_TEXT_DARK,
  MOTION_TEXT_DA_DUNG_STOPPED,
  MOTION_TEXT_DA_DUNG_XONG_CAC_CANH_3D,
  MOTION_TEXT_DELETE,
  MOTION_TEXT_ENGINE,
  MOTION_TEXT_MOTION,
  MOTION_TEXT_OK_2,
  MOTION_TEXT_SYMBOL_27,
  MOTION_TEXT_VI,
} from "../constants/motionRuntime.js";
import { MOTION_STORY_CONFIG, MOTION_VIDEO_CONSTANTS } from "../constants/motionVideo.js";
import { jsonUtils } from "../lib/json.js";
import { isMotionJobTerminal } from "../lib/motionJob.js";
import { getMotionErrorMessage } from "../lib/motionUtils.js";
import { AiPlanningChatModel, AiPlanningExecutionMode, AiPlanningFallbackProvider } from "../types.js";
import { MotionAspect, MotionEncoderPreference, MotionJobStatus, MotionQuality, MotionStoryJobKind, MotionStoryLength, type MotionJobState, type MotionResultItem, type MotionSpec, type MotionStoryAnalysis, type MotionStoryJobState, type MotionStoryScript, type MotionStorySource, type MotionVoiceTrack, type MotionSeoPack, type MotionThumbnail } from "../types/motionVideo.js";
import { retimeSeoPack } from "../lib/motionSeo.js";
import { motionMainAiExecution, motionSceneAiExecution } from "../lib/motionSceneAi.js";
import type { StorageCleanResult, StorageJunkReport } from "../types/storage.js";
const STOPPED_TOAST = MOTION_TEXT_DA_DUNG_STOPPED;
const reportStoryError = (error: unknown): void => {
  const message = getMotionErrorMessage(error);
  if (message === MOTION_TEXT_CANCELLED) toast.info(STOPPED_TOAST);
  else toast.error(message);
};
interface PersistedState {
  voiceChannelId?: string;
  styleReferences: MotionStyleReference[];
  characterMotion: boolean;
  rawText: string;
  source: MotionStorySource | null;
  language: string;
  length: MotionStoryLength;
  analysis: MotionStoryAnalysis | null;
  script: MotionStoryScript | null;
  voice: (MotionVoiceTrack & { signature: string }) | null;
  uploadedAudio: { id: string; name: string; durationSeconds: number } | null;
  aspect: MotionAspect;
  quality: MotionQuality;
  fps: number;
  encoder: MotionEncoderPreference;
  look: string;
  sfx: boolean;
  drawingMode: "2d" | "3d";
  subtitles?: boolean;
  sfxVolume: number;
  soundOverrides: Record<string, MotionSoundOverride>;
  aiProvider: AiPlanningFallbackProvider;
  aiModel: AiPlanningChatModel;
  aiMode: AiPlanningExecutionMode;
  aiHeadless: boolean;
  aiReview: boolean;
  libraryMode?: MotionSceneLibraryMode;
  videoGenre?: MotionVideoGenre;
  stylePreset?: string;
  asrCheck?: boolean;
  musicMood?: string;
  musicVolume?: number;
  activeRenderJobId: string;
  renderSignature?: string;
  activeStoryJobId: string;
  autoContinue: boolean;
  seo: MotionSeoPack | null;
  thumbnail?: MotionThumbnail | null;
  thumbnails?: Record<number, MotionThumbnail>;
}
const DEFAULTS: PersistedState = {
  styleReferences: [],
  characterMotion: false,
  rawText: MR.MOTION_TEXT_EMPTY,
  source: null,
  language: MOTION_TEXT_VI,
  length: MotionStoryLength.FULL,
  analysis: null,
  script: null,
  voice: null,
  uploadedAudio: null,
  aspect: MotionAspect.LANDSCAPE,
  quality: MotionQuality.HIGH,
  fps: 30,
  encoder: MotionEncoderPreference.AUTO,
  look: MR.MOTION_TEXT_EMPTY,
  sfx: true,
  drawingMode: MR.MOTION_TEXT_3D,
  subtitles: true,
  sfxVolume: 0.5,
  soundOverrides: {},
  aiProvider: AiPlanningFallbackProvider.GeminiChat,
  aiModel: AiPlanningChatModel.GeminiFlash,
  aiMode: AiPlanningExecutionMode.RoomOnly,
  aiHeadless: true,
  aiReview: true,
  libraryMode: MOTION_SCENE_LIBRARY_MODES.AUTO,
  videoGenre: MOTION_VIDEO_GENRES.AUTO,
  stylePreset: MOTION_STYLE_PRESET_NONE,
  asrCheck: false,
  musicMood: MOTION_MUSIC.AUTO,
  musicVolume: MOTION_MUSIC.DEFAULT_VOLUME,
  activeRenderJobId: MR.MOTION_TEXT_EMPTY,
  activeStoryJobId: MR.MOTION_TEXT_EMPTY,
  autoContinue: true,
  seo: null,
  thumbnail: null,
};
const analyzedState = (analysis: MotionStoryAnalysis, look: string): Partial<PersistedState> => ({ analysis, script: null, voice: null, uploadedAudio: null, seo: null, thumbnail: null, thumbnails: {}, soundOverrides: {}, look: analysis.look || look });
export interface MotionScenesRequest { beats?: string[]; locations?: string[]; restart?: boolean; restyle?: boolean; note?: string; }
const compileStateKey = (state: PersistedState): string => JSON.stringify([state.script, state.analysis, state.aspect, state.look, state.voice, state.uploadedAudio, state.fps, state.characterMotion, state.subtitles !== false, state.sfx, state.sfxVolume, state.soundOverrides]);
export const narrationSignature = motionVoiceSignature;
const selectedChannelRef = (next: PersistedState, data: MotionVoiceChannels): string => voiceChannelRef(data.channels.find((item) => item.id === (next.voiceChannelId === undefined ? data.defaultId : next.voiceChannelId)));
const withVoiceChannel = (next: PersistedState, data: MotionVoiceChannels): PersistedState => {
  if (!next.script) return next;
  const wanted = selectedChannelRef(next, data);
  return (next.script.voiceChannel || MR.MOTION_TEXT_EMPTY) === wanted ? next : { ...next, script: { ...next.script, voiceChannel: wanted || undefined } };
};
export function useMotionStudio() {
  const [state, setState] = useState<PersistedState>(DEFAULTS);
  const [voiceChannels, setVoiceChannels] = useState<MotionVoiceChannels>({ channels: [] });
  const channelsRef = useRef<MotionVoiceChannels>({ channels: [] });
  const [hydrated, setHydrated] = useState(false);
  const [ME, setME] = useState<MotionEngineGlobal | null>(null);
  const [engineError, setEngineError] = useState<string>(MR.MOTION_TEXT_EMPTY);
  const [storyJob, setStoryJob] = useState<MotionStoryJobState | null>(null);
  const [renderJob, setRenderJob] = useState<MotionJobState | null>(null);
  const [results, setResults] = useState<MotionResultItem[]>([]);
  const [compiled, setCompiled] = useState<MotionCompiledPreview | null>(null);
  const [checking, setChecking] = useState(false);
  const [voiceError, setVoiceError] = useState<string>(MR.MOTION_TEXT_EMPTY);
  const [compileError, setCompileError] = useState<string>(MR.MOTION_TEXT_EMPTY);
  const [flowCount, setFlowCount] = useState(0);
  const flowDepth = useRef(0);
  const [logHistory, setLogHistory] = useState<MotionLogEntry[]>([]);
  const trackLog = useCallback((id: string, kind: string, lines: string[] | undefined) => {
    setLogHistory((history) => {
      const entry = { id, kind, lines: lines || [] };
      const index = history.findIndex((item) => item.id === id);
      if (index < 0) return _.takeRight([...history, entry], MOTION_STORY_CONFIG.LOG_HISTORY_JOBS);
      if (_.isEqual(history[index].lines, entry.lines)) return history;
      const next = history.slice();
      next[index] = entry;
      return next;
    });
  }, []);
  const flowCancelled = useRef(false);
  const inFlow = useCallback(async <T>(fn: () => Promise<T>): Promise<T> => {
    if (!flowDepth.current) flowCancelled.current = false;
    flowDepth.current++;
    setFlowCount(flowDepth.current);
    try {
      return await fn();
    } finally {
      flowDepth.current--;
      if (mounted.current) setFlowCount(flowDepth.current);
    }
  }, []);
  const mounted = useRef(true);
  const pollAbort = useRef<AbortController | null>(null);
  const patch = useCallback(
    (p: Partial<PersistedState>) =>
      setState((s) => {
        const next = { ...s, ...p };
        if (p.rawText !== undefined && p.rawText !== s.rawText) next.source = null;
        const synced = withVoiceChannel(next, channelsRef.current);
        if (synced.script && p.script?.voiceTrack?.provider === MOTION_VOICE.PROVIDER && p.script.voiceTrack.signature === narrationSignature(synced.script, synced.analysis)) synced.voice = { ...p.script.voiceTrack, signature: p.script.voiceTrack.signature };
        stateRef.current = synced;
        return synced;
      }),
    [],
  );
  const reloadVoiceChannels = useCallback(async (): Promise<MotionVoiceChannels> => {
    try {
      const data = await motionRequest<MotionVoiceChannels>(MOTION_VOICE_LIBRARY.CHANNELS_URL);
      const next = { channels: data.channels || [], ...(data.defaultId ? { defaultId: data.defaultId } : {}) };
      channelsRef.current = next;
      if (mounted.current) setVoiceChannels(next);
      patch({});
      return next;
    } catch {
      return channelsRef.current;
    }
  }, [patch]);
  useEffect(() => {
    mounted.current = true;
    (async () => {
      const saved = await jsonUtils.getAsyncItem<Partial<PersistedState>>(MOTION_STORY_CONFIG.STORY_STORAGE_KEY, {});
      if (!mounted.current) return;
      const restored = { ...DEFAULTS, ...(saved as Partial<PersistedState>), sfx: true, sfxVolume: MOTION_AUDIO_DIRECTION.SFX_VOLUME, soundOverrides: {}, uploadedAudio: null };
      if (restored.script?.voiceSettings) restored.script = { ...restored.script, voiceSettings: undefined };
      setState(withVoiceChannel(restored, channelsRef.current));
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
    void reloadVoiceChannels();
    motionRequest<{ items: MotionResultItem[] }>(API_ROUTES.MOTION_VIDEO_RESULTS)
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
  const aiExecution = motionMainAiExecution(state);
  const sceneAiExecution = motionSceneAiExecution(state);
  const runStoryJob = useCallback(async (url: string, body: unknown, onPartial?: (r: any) => void): Promise<any> => {
    if (flowCancelled.current) throw new Error(MOTION_TEXT_CANCELLED);
    pollAbort.current?.abort();
    const ctrl = new AbortController();
    pollAbort.current = ctrl;
    const prefix = storyActivityPrefixes[storyActivityRoutes[url]];
    logMotionActivity(prefix, WORKFLOW_ACTIVITY_CONFIG.EVENT_SUFFIX.start);
    let terminalLogged = false;
    try {
      const { job } = await motionRequest<{ job: MotionStoryJobState }>(url, body);
      setStoryJob(job);
      trackLog(job.id, job.kind, job.log);
      patch({ activeStoryJobId: job.id });
      const final = await pollMotionJob<MotionStoryJobState>(
        motionJobStatusUrl(API_ROUTES.MOTION_STORY_STATUS, job.id),
        (j) => {
          if (!mounted.current) return;
          setStoryJob(j);
          trackLog(j.id, j.kind, j.log);
          if (onPartial && j.result) onPartial(j.result);
        },
        (j) => isMotionJobTerminal(j.status),
        ctrl.signal,
        1200,
      ).finally(() => mounted.current && !ctrl.signal.aborted && patch({ activeStoryJobId: MR.MOTION_TEXT_EMPTY }));
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
            trackLog(j.id, j.kind, j.log);
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
        if (final.kind === MotionStoryJobKind.ANALYZE) patch(analyzedState(final.result as MotionStoryAnalysis, stateRef.current.look));
        if (final.kind === MotionStoryJobKind.VOICE) {
          const track = final.result as MotionVoiceTrack;
          setState((s) =>
            s.script && track.provider === MOTION_VOICE.PROVIDER && track.signature === narrationSignature(s.script, s.analysis)
              ? { ...s, voice: { ...track, signature: track.signature }, uploadedAudio: null, ...(s.seo && s.analysis && track.durations?.length === s.script.beats.length ? { seo: retimeSeoPack(s.seo, s.script.beats, s.analysis.chapters, s.language !== MR.MOTION_TEXT_EN, track.durations) } : {}) }
              : s,
          );
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
        if (mounted.current && !ctrl.signal.aborted) patch({ activeStoryJobId: MR.MOTION_TEXT_EMPTY });
      }
      if (chainAfterResume && mounted.current) setTimeout(() => void chainAfterResume?.(), 0);
    },
    [patch],
  );
  const parseSource = useCallback(
    async (text: string) => {
      patch({ rawText: text });
      if (_.trim(text).split(MP.WHITESPACE).length < 3 && !MP.URL.test(text)) return patch({ source: null });
      try {
        const r = await motionRequest<{ source: MotionStorySource }>(API_ROUTES.MOTION_STORY_PARSE, { text });
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
    setLogHistory([]);
    await inFlow(async () => {
      try {
        const analysis = (await runStoryJob(API_ROUTES.MOTION_STORY_ANALYZE, {
          source: state.source,
          language: state.language,
          length: state.length,
          drawingMode: state.drawingMode,
          styleReferences: state.styleReferences,
          characterMotion: state.characterMotion,
          aspect: state.aspect,
          aiExecution,
          keepBrowser: state.autoContinue !== false,
          libraryMode: state.libraryMode || MOTION_SCENE_LIBRARY_MODES.AUTO,
          videoGenre: state.videoGenre || MOTION_VIDEO_GENRES.AUTO,
          stylePreset: state.styleReferences?.length ? MOTION_STYLE_PRESET_NONE : state.stylePreset || MOTION_STYLE_PRESET_NONE,
        })) as MotionStoryAnalysis;
        patch(analyzedState(analysis, stateRef.current.look));
        setCompiled(null);
        toast.success(MOTION_TEMPLATE_AI_CHUONG_NHAN_VAT(String(analysis.chapters.length), String(analysis.cast.length)));
        if (state.autoContinue !== false && writeScriptRef.current) await writeScriptRef.current(undefined, analysis);
      } catch (e: any) {
        reportStoryError(e);
      }
    });
  }, [inFlow, state.source, state.language, state.length, state.drawingMode, state.styleReferences, state.characterMotion, state.aspect, state.libraryMode, state.videoGenre, state.stylePreset, state.autoContinue, state.aiProvider, state.aiModel, state.aiMode, state.aiHeadless, runStoryJob, patch]);
  const writeScript = useCallback(
    async (chapterIds?: string[], analysisOverride?: MotionStoryAnalysis, resume = false) => {
      const analysis = analysisOverride || state.analysis;
      if (!state.source || !analysis) return;
      await inFlow(async () => {
        try {
          const script = (await runStoryJob(
            API_ROUTES.MOTION_STORY_SCRIPT,
            {
              source: state.source,
              analysis,
              language: state.language,
              length: state.length,
              drawingMode: state.drawingMode,
              aiExecution,
              keepBrowser: state.autoContinue !== false,
              voiceChannel: selectedChannelRef(state, channelsRef.current),
              chapterIds,
              beats: analysisOverride ? [] : state.script?.beats || [],
              gen: chapterIds?.length ? state.script?.gen : undefined,
              aspect: state.aspect,
              resume,
            },
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
      });
    },
    [inFlow, state.source, state.analysis, state.language, state.length, state.autoContinue, state.drawingMode, state.script, state.aspect, state.aiProvider, state.aiModel, state.aiMode, state.aiHeadless, runStoryJob, patch],
  );
  writeScriptRef.current = writeScript;
  const seoRef = useRef<((scriptOverride?: MotionStoryScript, analysisOverride?: MotionStoryAnalysis, quiet?: boolean) => Promise<void>) | null>(null);
  const generateSeo = useCallback(
    async (scriptOverride?: MotionStoryScript, analysisOverride?: MotionStoryAnalysis, quiet = false) => {
      const script = scriptOverride || state.script;
      const analysis = analysisOverride || state.analysis;
      if (!script?.beats?.length || !analysis) return;
      const voiceMatches = !scriptOverride && state.voice && state.voice.durations?.length === script.beats.length;
      await inFlow(async () => {
        try {
          const seo = (await runStoryJob(API_ROUTES.MOTION_STORY_SEO, { analysis, script, language: state.language, aiExecution, keepBrowser: quiet, durations: voiceMatches ? state.voice!.durations : undefined })) as MotionSeoPack;
          patch({ seo });
        } catch (e: any) {
          if (quiet) toast.warning(MR.MOTION_TEMPLATE_SEO(getMotionErrorMessage(e)));
          else reportStoryError(e);
        }
      });
    },
    [inFlow, state.script, state.analysis, state.language, state.voice, state.aiProvider, state.aiModel, state.aiMode, state.aiHeadless, runStoryJob, patch],
  );
  seoRef.current = generateSeo;
  const generateThumbnail = useCallback(
    async (optionIndex = 0) => {
      if (!state.analysis) return;
      await inFlow(async () => {
        try {
          const result = (await runStoryJob(API_ROUTES.MOTION_STORY_THUMBNAIL, { analysis: state.analysis, seo: state.seo?.options?.[optionIndex], language: state.language, aspect: state.aspect, aiExecution })) as { thumbnail: string; prompt: string };
          const newThumb: MotionThumbnail = { image: result.thumbnail, prompt: result.prompt, optionIndex };
          patch({ thumbnail: newThumb, thumbnails: { ...(state.thumbnails || {}), [optionIndex]: newThumb } });
        } catch (e: any) {
          reportStoryError(e);
        }
      });
    },
    [inFlow, state.analysis, state.seo, state.language, state.aspect, state.aiProvider, state.aiModel, state.aiMode, state.aiHeadless, state.thumbnails, runStoryJob, patch],
  );
  const scenesRef = useRef<((req: MotionScenesRequest, scriptOverride?: MotionStoryScript, analysisOverride?: MotionStoryAnalysis) => Promise<MotionStoryScript | undefined>) | null>(null);
  const buildScenes = useCallback(
    async (req: MotionScenesRequest = {}, scriptOverride?: MotionStoryScript, analysisOverride?: MotionStoryAnalysis) => {
      const script = scriptOverride || state.script;
      const analysis = analysisOverride || state.analysis;
      if (!script?.beats?.length || !analysis) return;
      return inFlow(async () => {
        try {
          const result = (await runStoryJob(
            API_ROUTES.MOTION_STORY_SCENES,
            { script, analysis, aspect: state.aspect, aiExecution: sceneAiExecution, mainAiExecution: aiExecution, asrCheck: state.asrCheck === true, drawingMode: state.drawingMode, styleReferences: state.styleReferences, characterMotion: state.characterMotion, review: state.aiReview !== false, ...req },
            (partial) => partial?.beats && patch({ script: partial }),
          )) as MotionStoryScript;
          patch({ script: result });
          setCompiled(null);
          const failed = result.gen?.failed?.length || 0;
          if (failed) toast.warning(MOTION_TEMPLATE_CANH_CHUA_DUNG_DUOC_BAM_DUNG_TIEP(String(failed)));
          else toast.success(MOTION_TEXT_DA_DUNG_XONG_CAC_CANH_3D);
          return result;
        } catch (e: any) {
          reportStoryError(e);
        }
      });
    },
    [inFlow, state.script, state.analysis, state.aspect, state.aiProvider, state.aiModel, state.aiMode, state.aiHeadless, state.aiReview, state.drawingMode, state.styleReferences, state.characterMotion, runStoryJob, patch],
  );
  scenesRef.current = buildScenes;
  const voicePending = useRef<{ signature: string; promise: Promise<MotionVoiceTrack | undefined> } | null>(null);
  const generateVoice = useCallback(
    async (scriptOverride?: MotionStoryScript): Promise<MotionVoiceTrack | undefined> => {
      const snapshot = stateRef.current,
        script = scriptOverride || snapshot.script;
      if (!script?.beats?.length) return;
      const signature = narrationSignature(script, snapshot.analysis);
      if (voicePending.current?.signature === signature) return voicePending.current.promise;
      const promise = inFlow(async () => {
        try {
          setVoiceError(MR.MOTION_TEXT_EMPTY);
          const track = (await runStoryJob(API_ROUTES.MOTION_STORY_VOICE, { script, analysis: snapshot.analysis, aspect: snapshot.aspect, asrCheck: snapshot.asrCheck === true, aiExecution: { provider: snapshot.aiProvider, model: snapshot.aiModel, mode: snapshot.aiMode, chromeHeadless: snapshot.aiHeadless } })) as MotionVoiceTrack;
          if (narrationSignature(stateRef.current.script, stateRef.current.analysis) !== signature || track.signature !== signature) return;
          const current = stateRef.current;
          const next = { ...current, voice: { ...track, signature }, uploadedAudio: null, ...(current.seo && current.analysis && track.durations?.length === script.beats.length ? { seo: retimeSeoPack(current.seo, script.beats, current.analysis.chapters, current.language !== MR.MOTION_TEXT_EN, track.durations) } : {}) };
          stateRef.current = next;
          setState(next);
          setCompiled(null);
          return track;
        } catch (e: any) {
          setVoiceError(getMotionErrorMessage(e));
          reportStoryError(e);
        }
      });
      voicePending.current = { signature, promise };
      try {
        return await promise;
      } finally {
        if (voicePending.current?.promise === promise) voicePending.current = null;
      }
    },
    [runStoryJob, inFlow],
  );
  const cancelStory = useCallback(async () => {
    if (flowDepth.current) flowCancelled.current = true;
    await motionRequest(API_ROUTES.MOTION_STORY_CANCEL, { jobId: storyJob?.id }).catch(_.noop);
  }, [storyJob]);
  const voiceValid = state.voice?.provider === MOTION_VOICE.PROVIDER && state.voice.signature === narrationSignature(state.script, state.analysis);
  useEffect(() => {
    if (voiceValid) setVoiceError(MR.MOTION_TEXT_EMPTY);
  }, [voiceValid]);
  const compileRevision = useRef(0);
  const audioId = voiceValid ? state.voice?.audioId : state.uploadedAudio?.id;
  const compile = useCallback(
    async (scriptOverride?: MotionStoryScript): Promise<MotionCompiledPreview | null> => {
      const snapshot = stateRef.current;
      const script = scriptOverride || snapshot.script;
      if (!script?.beats?.length) return null;
      const revision = ++compileRevision.current;
      setCompileError(MR.MOTION_TEXT_EMPTY);
      const currentKey = compileStateKey({ ...snapshot, script });
      const r = await motionRequest<MotionCompiledPreview>(API_ROUTES.MOTION_STORY_COMPILE, {
        script,
        analysis: snapshot.analysis,
        aspect: snapshot.aspect,
        audioId: snapshot.voice?.signature === narrationSignature(script, snapshot.analysis) ? snapshot.voice?.audioId : snapshot.uploadedAudio?.id,
        voiceTrack: snapshot.voice?.provider === MOTION_VOICE.PROVIDER && snapshot.voice.signature === narrationSignature(script, snapshot.analysis) ? snapshot.voice : undefined,
        characterMotion: snapshot.characterMotion,
        sfx: snapshot.sfx,
        sfxVolume: snapshot.sfxVolume,
        soundOverrides: snapshot.soundOverrides,
        look: snapshot.look || undefined,
        durations: snapshot.voice?.signature === narrationSignature(script, snapshot.analysis) ? snapshot.voice?.durations : undefined,
        uploadedAudioSeconds: snapshot.voice?.signature !== narrationSignature(script, snapshot.analysis) && snapshot.uploadedAudio ? snapshot.uploadedAudio.durationSeconds : undefined,
      });
      if (compileStateKey(stateRef.current) !== currentKey) return null;
      const value = { ...r, compilationKey: currentKey, spec: { ...r.spec, gen: r.spec.gen ? { ...r.spec.gen, characterMotion: snapshot.characterMotion } : undefined, fps: snapshot.fps, ...(snapshot.subtitles === false ? { subtitles: [] } : {}) }, sfxCues: r.sfxCues, missing: r.missing || [] };
      if (revision === compileRevision.current) setCompiled(value);
      return value;
    },
    [state.script, state.analysis, state.aspect, state.look, state.voice, state.uploadedAudio, state.fps, state.characterMotion, state.subtitles, state.sfx, state.sfxVolume, state.soundOverrides, audioId, voiceValid],
  );
  const compiledSig = useRef<string>(MR.MOTION_TEXT_EMPTY);
  useEffect(() => {
    if (!state.script?.beats?.length) {
      setCompiled(null);
      compiledSig.current = MR.MOTION_TEXT_EMPTY;
      return;
    }
    if (!hydrated) return;
    const sig = compileStateKey(state);
    if (sig === compiledSig.current) return;
    compileRevision.current++;
    const t = setTimeout(() => {
      compiledSig.current = sig;
      void compile().catch((error) => {
        compiledSig.current = MR.MOTION_TEXT_EMPTY;
        setCompileError(getMotionErrorMessage(error));
      });
    }, 400);
    return () => clearTimeout(t);
  }, [hydrated, compile, state.script, state.analysis, state.aspect, state.look, state.voice, state.uploadedAudio, state.fps, state.characterMotion, state.sfx, state.sfxVolume, state.soundOverrides, state.subtitles, voiceValid]);
  const check = useCallback(async () => {
    const c = compiled || (await compile());
    if (!c) return;
    setChecking(true);
    logMotionActivity(MOTION_ACTIVITY_PREFIX.check, WORKFLOW_ACTIVITY_CONFIG.EVENT_SUFFIX.start);
    try {
      const r = await motionRequest<{ errors: { t: number; shot: string; error: string }[] }>(API_ROUTES.MOTION_VIDEO_CHECK, { spec: c.spec });
      logMotionActivity(MOTION_ACTIVITY_PREFIX.check, r.errors.length ? WORKFLOW_ACTIVITY_CONFIG.EVENT_SUFFIX.fail : WORKFLOW_ACTIVITY_CONFIG.EVENT_SUFFIX.done, r.errors[0]?.error, r.errors.length || undefined);
      if (_.isEmpty(r.errors)) toast.success(MOTION_TEXT_OK_2);
      else toast.error(_.map(_.take(r.errors, 4), (e) => MOTION_TEMPLATE_S(String(e.t), String(e.shot), String(e.error))).join(MOTION_TEXT_SYMBOL_27));
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
          (j) => {
            if (!mounted.current) return;
            setRenderJob(j);
            trackLog(j.id, MOTION_STORY_CONFIG.RENDER_LOG_KIND, j.log);
          },
          (j) => isMotionJobTerminal(j.status),
          undefined,
          MOTION_VIDEO_CONSTANTS.POLL_INTERVAL_MS,
        );
        if (!mounted.current) return;
        patch({ activeRenderJobId: MR.MOTION_TEXT_EMPTY });
        logMotionActivity(MOTION_ACTIVITY_PREFIX.render, final.status === MotionJobStatus.COMPLETED ? WORKFLOW_ACTIVITY_CONFIG.EVENT_SUFFIX.done : final.status === MotionJobStatus.CANCELLED ? WORKFLOW_ACTIVITY_CONFIG.EVENT_SUFFIX.stop : WORKFLOW_ACTIVITY_CONFIG.EVENT_SUFFIX.fail, final.error || final.result?.fileName);
        if (final.status === MotionJobStatus.COMPLETED && final.result) {
          setResults((rs) => [final.result!, ..._.reject(rs, { id: final.result!.id })]);
          toast.success(final.result.fileName);
        } else if (final.status === MotionJobStatus.ERROR) toast.error(final.error);
        else if (final.status === MotionJobStatus.CANCELLED) toast.info(STOPPED_TOAST);
      } catch (error) {
        if (mounted.current) logMotionActivity(MOTION_ACTIVITY_PREFIX.render, WORKFLOW_ACTIVITY_CONFIG.EVENT_SUFFIX.fail, getMotionErrorMessage(error));
        if (mounted.current) patch({ activeRenderJobId: MR.MOTION_TEXT_EMPTY });
      }
    },
    [patch],
  );
  const render = useCallback(
    async () =>
      inFlow(async () => {
        let renderRequested = false;
        try {
          let c = compiled;
          const changedScenePlan = !!state.analysis?.videoDna && state.script?.beats.some((beat) => beat.visual === MR.MOTION_TEXT_SCENE && state.script?.gen?.scenePlanKeys?.[beat.id] !== sceneExecutionKey(beat));
          if (
            state.script &&
            state.analysis &&
            (changedScenePlan ||
              (state.sfx && state.script.gen?.soundPlanVersion !== MOTION_SOUND_CONFIG.VERSION) ||
              state.script.gen?.characterMotion !== state.characterMotion ||
              needsAuthoredCharacters(
                state.script,
                state.analysis.cast.map((member) => member.key),
              ) ||
              (state.script.gen?.characterMode || MR.MOTION_TEXT_DRAWN) !== MR.MOTION_TEXT_DRAWN ||
              (state.script.gen?.drawingMode || MR.MOTION_TEXT_3D) !== state.drawingMode)
          ) {
            const rebuilt = await buildScenes({});
            if (!rebuilt || rebuilt.gen?.failed?.length) return;
            c = await compile(rebuilt);
          } else {
            if (state.script?.gen?.failed?.length) {
              toast.warning(MOTION_TEMPLATE_CANH_CHUA_DUNG_DUOC_BAM_DUNG_TIEP(String(state.script.gen.failed.length)));
              return;
            }
            c = await compile();
          }
          if (!c) return;
          if (!stateRef.current.uploadedAudio && (!stateRef.current.voice || stateRef.current.voice.provider !== MOTION_VOICE.PROVIDER || stateRef.current.voice.signature !== narrationSignature(stateRef.current.script, stateRef.current.analysis))) {
            if (!(await generateVoice())) return;
            c = await compile();
            if (!c?.audioPreviewId) return;
          }
          if (c.missing.length) {
            toast.warning(MOTION_TEMPLATE_CANH_CHUA_DUNG_DUOC_BAM_DUNG_TIEP(String(c.missing.length)));
            return;
          }
          logMotionActivity(MOTION_ACTIVITY_PREFIX.render, WORKFLOW_ACTIVITY_CONFIG.EVENT_SUFFIX.start);
          renderRequested = true;
          const { job } = await motionRequest<{ job: MotionJobState }>(API_ROUTES.MOTION_VIDEO_RENDER, {
            spec: { ...c.spec, gen: c.spec.gen ? { ...c.spec.gen, characterMotion: state.characterMotion } : undefined },
            options: {
              quality: state.quality,
              aspect: state.aspect,
              fps: state.fps,
              encoder: state.encoder,
              title: state.analysis?.title || state.script?.title || MOTION_TEXT_MOTION,
              audioId,
              mixedAudioId: c.audioPreviewId,
              sfxId: state.sfx ? c.sfxId : undefined,
              audioVolume: 1,
              sfxVolume: state.sfxVolume,
              music: state.musicMood === MOTION_MUSIC.OFF ? undefined : { mood: state.musicMood || MOTION_MUSIC.AUTO, volume: state.musicVolume ?? MOTION_MUSIC.DEFAULT_VOLUME },
              sfx: state.sfx ? { cues: c.sfxCues, mood: state.analysis?.sfxMood || state.analysis?.genre || MOTION_TEXT_DARK } : undefined,
            },
          });
          setRenderJob(job);
          patch({ activeRenderJobId: job.id, renderSignature: c.compilationKey });
          void followRender(job.id);
        } catch (e: any) {
          if (renderRequested) logMotionActivity(MOTION_ACTIVITY_PREFIX.render, WORKFLOW_ACTIVITY_CONFIG.EVENT_SUFFIX.fail, getMotionErrorMessage(e));
          toast.error(e?.message);
        }
      }),
    [inFlow, compiled, compile, buildScenes, generateVoice, state.drawingMode, state.characterMotion, state.quality, state.aspect, state.fps, state.encoder, state.analysis, state.script, state.sfx, state.sfxVolume, audioId, followRender, patch],
  );
  const cancelRender = useCallback(async () => {
    await motionRequest(API_ROUTES.MOTION_VIDEO_CANCEL, { jobId: renderJob?.id }).catch(_.noop);
  }, [renderJob]);
  const deleteResult = useCallback(async (id: string): Promise<number> => {
    const r = await loggedMotionAction(MOTION_ACTIVITY_PREFIX.delete, () => motionRequest<{ freedBytes?: number }>(MOTION_TEMPLATE_SYMBOL_4(String(API_ROUTES.MOTION_VIDEO_RESULTS), String(id)), undefined, MOTION_TEXT_DELETE));
    setResults((rs) => _.reject(rs, { id }));
    return _.toNumber(r.freedBytes) || 0;
  }, []);
  const scanJunk = useCallback(async (): Promise<StorageJunkReport> => (await motionRequest<{ report: StorageJunkReport }>(API_ROUTES.MOTION_STORAGE_JUNK)).report, []);
  const cleanJunk = useCallback(async (groups: string[]): Promise<StorageCleanResult> => loggedMotionAction(MOTION_ACTIVITY_PREFIX.clean, () => motionRequest<StorageCleanResult>(API_ROUTES.MOTION_STORAGE_CLEAN, { groups })), []);
  const deleteAllResults = useCallback(async (): Promise<number> => {
    const r = await loggedMotionAction(MOTION_ACTIVITY_PREFIX.delete, () => motionRequest<{ freedBytes?: number }>(API_ROUTES.MOTION_VIDEO_RESULTS, undefined, MOTION_TEXT_DELETE));
    setResults([]);
    return _.toNumber(r.freedBytes) || 0;
  }, []);
  const saveResult = useCallback(async (item: MotionResultItem) => {
    try {
      const pick = await motionRequest<{ cancelled?: boolean; token?: string }>(API_ROUTES.MOTION_VIDEO_SELECT_SAVE_DESTINATION, { suggestedName: item.fileName });
      if (pick.cancelled || !pick.token) return;
      const r = await loggedMotionAction(MOTION_ACTIVITY_PREFIX.save, () => motionRequest<{ savedPath: string }>(API_ROUTES.MOTION_VIDEO_SAVE_VIDEO, { token: pick.token, fileName: item.fileName }), item.fileName);
      toast.success(r.savedPath);
    } catch (e: any) {
      toast.error(e?.message);
    }
  }, []);
  const loadDemo = useCallback(async () => {
    try {
      const r = await motionRequest<{ spec: MotionSpec }>(MOTION_TEMPLATE_NAME_DEMO(String(API_ROUTES.MOTION_VIDEO_DEMO)));
      setCompiled({ spec: { ...r.spec, aspect: state.aspect }, sfxCues: [], missing: [] });
    } catch (e: any) {
      toast.error(e?.message);
    }
  }, [state.aspect]);
  const storyJobBusy = !!storyJob && !isMotionJobTerminal(storyJob.status);
  const renderBusy = !!renderJob && !isMotionJobTerminal(renderJob.status);
  const storyBusy = storyJobBusy || flowCount > 0;
  const busy = storyBusy || renderBusy;
  const voiceAttempt = useRef<{ signature: string; count: number }>({ signature: MR.MOTION_TEXT_EMPTY, count: 0 });
  useEffect(() => {
    if (!hydrated || storyBusy || renderBusy || state.uploadedAudio || voiceValid || !state.script?.beats?.length) return;
    if (state.script.beats.some((beat) => beat.visual === MR.MOTION_TEXT_SCENE && !state.script?.gen?.staging?.[beat.id])) return;
    const signature = narrationSignature(state.script, state.analysis);
    if (voiceAttempt.current.signature !== signature) voiceAttempt.current = { signature, count: 0 };
    if (voiceAttempt.current.count >= MOTION_VOICE.AUTO_ATTEMPTS) return;
    const timer = setTimeout(
      () => {
        voiceAttempt.current.count++;
        void generateVoice();
      },
      voiceAttempt.current.count ? MOTION_VOICE.RETRY_DELAY : MOTION_VOICE.AUTO_DELAY,
    );
    return () => clearTimeout(timer);
  }, [hydrated, storyBusy, renderBusy, state.uploadedAudio, voiceValid, state.script, state.analysis, voiceError, generateVoice]);
  return {
    state,
    patch,
    voiceChannels,
    reloadVoiceChannels,
    ME,
    engineError,
    storyJob,
    storyBusy,
    storyJobBusy,
    busy,
    logHistory,
    renderJob,
    renderBusy,
    results,
    compiled,
    checking,
    voiceValid,
    voiceError: voiceError || compileError,
    audioPreparing: !!state.script?.beats.length && ((!state.uploadedAudio && !voiceValid) || compiled?.compilationKey !== compileStateKey(state) || !compiled?.audioPreviewId) && !voiceError && !compileError,
    previewVideoUrl: renderJob?.status === MotionJobStatus.COMPLETED && compiled?.compilationKey === compileStateKey(state) && state.renderSignature === compiled.compilationKey ? renderJob.result?.videoUrl : undefined,
    audioId,
    previewAudioId: compiled?.compilationKey === compileStateKey(state) ? compiled.audioPreviewId || audioId : audioId,
    parseSource,
    analyze,
    writeScript,
    buildScenes,
    generateSeo,
    generateThumbnail,
    cancelStory,
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
