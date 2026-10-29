import { RUNTIME_TEXT as RT_SHARED } from "../../../constants/runtime/shared.js";
import { stringifyJson } from "../../../lib/jsonStringify.js";
import { MOTION_PROGRESS as MOTION_LOG_PROGRESS } from "../../../constants/motionProgress.js";
import { MOTION_PRODUCTION } from "../../../constants/motionProduction.js";
import type { MotionProductionResult } from "../../../types/motionVideo.js";
import { createMotionEditorialId } from "../lib/motionEditorial.js";
import { MOTION_EDITORIAL } from "../../../constants/motionEditorial.js";
import { mergeMotionLogHistory, motionRestoredStoryJobId } from "../lib/motionLogHistory.js";
import { PUPPET, PUPPET_KIT_API, PUPPET_STYLE_DEFAULT } from "../../../constants/motionPuppet.js";
import { missingMotionChapters } from "../../../lib/motionProduction.js";
import { MOTION_VISUAL_CONTRACT } from "../../../constants/motionVisualContract.js";
import { MOTION_ILLUSTRATION } from "../../../constants/motionIllustration.js";
import { MOTION_PACK } from "../../../constants/motionPack.js";
import { MOTION_BLOCKING } from "../../../constants/motionBlocking.js";
import { MOTION_EFFECTS } from "../../../constants/motionEffects.js";
import { collectPuppetLines, puppetVisualInputKey } from "../../../lib/motionPuppet.js";
import { puppetStoryboardCovers, puppetStoryboardInputKey } from "../../../lib/motionStoryboard.js";
import { motionNarratorCastKey } from "../../../lib/motionVoice.js";
import { createMotionCaptchaAlert, initMotionAlertAudio } from "../lib/motionAlertBeep.js";
import { MOTION_SOUND_CONFIG } from "../../../constants/motionSound.js";
import { MOTION_VOICE, MOTION_VOICE_LIBRARY } from "../../../constants/motionVoice.js";
import { motionVoiceCast, motionVoiceSignature, voiceChannelRef, withMotionVoiceMode } from "../../../lib/motionVoice.js";
import type { MotionCompiledPreview, MotionLogEntry, MotionSoundOverride, MotionStyleReference, MotionVoiceChannels } from "../../../types/motionVideo.js";
import { logMotionActivity, logStoryTerminal, loggedMotionAction } from "../services/motionWorkflowActivity";
import { WORKFLOW_ACTIVITY_CONFIG, storyActivityPrefixes, storyActivityRoutes, MOTION_ACTIVITY_PREFIX } from "../../../constants/workflowActivity";
import * as MR from "../../../constants/motionRuntime.js";
import { MOTION_VIDEO_GENRES, type MotionVideoGenre } from "../../../constants/motionGenre.js";
import { MOTION_MUSIC } from "../../../constants/motionMusic.js";
import _ from "lodash";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { loadMotionEngineClient, motionJobStatusUrl, motionRequest, pollMotionJob, type MotionEngineGlobal } from "../components/motionApi.js";
import { MOTION_JOB_POLLING } from "../constants/motionJobPolling.js";
import { API_ROUTES } from "../../../constants/apiRoutes.js";
import {
  MOTION_TEMPLATE_CANH_CHUA_DUNG_DUOC_BAM_DUNG_TIEP,
  MOTION_TEMPLATE_NAME_DEMO,
  MOTION_TEMPLATE_S,
  MOTION_TEMPLATE_SYMBOL_4,
  MOTION_TEXT_AI_ERROR,
  MOTION_TEXT_BEATS,
  MOTION_TEXT_CANCELLED,
  MOTION_TEXT_DARK,
  MOTION_TEXT_DA_DUNG_STOPPED,
  MOTION_TEXT_DELETE,
  MOTION_TEXT_ENGINE,
  MOTION_TEXT_MOTION,
  MOTION_TEXT_OK_2,
  MOTION_TEXT_SYMBOL_27,
  MOTION_TEXT_VI,
} from "../../../constants/motionRuntime.js";
import { MOTION_STORY_CONFIG, MOTION_VIDEO_CONSTANTS } from "../../../constants/motionVideo.js";
import { jsonUtils } from "../../../lib/json.js";
import { isMotionJobTerminal } from "../lib/motionJob.js";
import { getMotionErrorMessage } from "../../../lib/motionUtils.js";
import { AiPlanningChatModel, AiPlanningExecutionMode, AiPlanningFallbackProvider } from "../../../types.js";
import {
  MotionAspect,
  MotionEncoderPreference,
  MotionJobStatus,
  MotionQuality,
  MotionStoryJobKind,
  MotionStoryLength,
  type MotionJobState,
  type MotionResultItem,
  type MotionSpec,
  type MotionStoryAnalysis,
  type MotionStoryJobState,
  type MotionStoryScript,
  type MotionStorySource,
  type MotionVoiceTrack,
  type MotionSeoPack,
  type MotionThumbnail,
  type MotionSeriesState,
} from "../../../types/motionVideo.js";
import { retimeSeoPack } from "../../../lib/motionSeo.js";
import { MOTION_PARTS } from "../../../constants/motionParts.js";
import { motionCarryGen, motionPartAnalysis, motionSeriesStart } from "../../../lib/motionParts.js";
import { motionMainAiExecution, motionSceneAiExecution, type MotionSceneAiChoice } from "../lib/motionSceneAi.js";
import { MOTION_SCENE_AI } from "../../../constants/motionSceneLibrary.js";
import { motionVisualRequest, normalizeMotionVisualSettings, isRemotionSpec } from "../../../lib/motionVisual.js";
import { MOTION_VISUAL } from "../../../constants/motionVisual.js";
import { normalizeMotionRenderBehavior } from "../../../lib/motionRenderBehavior.js";
import type { MotionVisualSettings, MotionRemotionProfile, MotionRenderBehavior } from "../../../types/motionVisual.js";
import type { StorageCleanResult, StorageJunkReport } from "../../../types/storage.js";
import { captureMotionVisualDraft, forgetMotionVisualDraftResults, hasMotionVisualDraft, motionCompileStateKey, motionRenderStateKey, motionVisualDraftContextKey, motionVisualDraftKey, motionVisualDraftRuntime, recoverMotionVisualDraft, switchMotionVisualDraft, type MotionVisualDraft } from "../lib/motionVisualDraft.js";
import { motionVisualBeatGroups } from "../../../lib/motionScenePacing.js";
import { MOTION_SCENE_PACING } from "../../../constants/motionScenePacing.js";
import { createMotionSourceReader } from "../lib/motionSourceReader.js";
const STOPPED_TOAST = MOTION_TEXT_DA_DUNG_STOPPED;
const reportStoryError = (error: unknown): void => {
  const message = getMotionErrorMessage(error);
  if (message === MOTION_TEXT_CANCELLED) toast.info(STOPPED_TOAST);
  else toast.error(message);
};
interface PersistedState extends MotionSceneAiChoice {
  visualDrafts?: Record<string, MotionVisualDraft>;
  visualSettings: MotionVisualSettings;
  renderBehavior: MotionRenderBehavior;
  visualSettingsError?: string;
  remotionProfile?: MotionRemotionProfile;
  voiceChannelId?: string;
  multiVoice?: boolean;
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
  voiceHold?: string;
  aspect: MotionAspect;
  quality: MotionQuality;
  fps: number;
  encoder: MotionEncoderPreference;
  look: string;
  sfx: boolean;
  subtitles?: boolean;
  sfxVolume: number;
  soundOverrides: Record<string, MotionSoundOverride>;
  aiProvider: AiPlanningFallbackProvider;
  aiModel: AiPlanningChatModel;
  aiMode: AiPlanningExecutionMode;
  aiHeadless: boolean;
  aiReview: boolean;
  videoGenre?: MotionVideoGenre;
  stylePreset?: string;
  asrCheck?: boolean;
  musicMood?: string;
  musicVolume?: number;
  activeRenderJobId: string;
  lastRenderJobId?: string | null;
  renderSignature?: string;
  activeStoryJobId: string;
  activeStoryRunId?: string;
  productionId?: string;
  seoJobId?: string;
  editorialSessionId?: string;
  logHistory?: MotionLogEntry[];
  autoContinue: boolean;
  autoExport?: boolean;
  autoRun?: boolean;
  automationPaused?: boolean;
  parts?: number;
  series?: MotionSeriesState | null;
  seo: MotionSeoPack | null;
  thumbnail?: MotionThumbnail | null;
  thumbnails?: Record<number, MotionThumbnail>;
}
const DEFAULTS: PersistedState = {
  visualSettings: normalizeMotionVisualSettings(),
  renderBehavior: normalizeMotionRenderBehavior(),
  remotionProfile: RT_SHARED.HISTORY,
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
  subtitles: true,
  sfxVolume: 0.5,
  soundOverrides: {},
  aiProvider: AiPlanningFallbackProvider.GeminiChat,
  aiModel: AiPlanningChatModel.GeminiFlash,
  aiMode: AiPlanningExecutionMode.RoomOnly,
  aiHeadless: true,
  sceneAiProvider: MOTION_SCENE_AI.PRIMARY_PROVIDER,
  sceneAiModel: MOTION_SCENE_AI.PRIMARY_MODEL,
  sceneAiHeadless: true,
  aiReview: true,
  videoGenre: MOTION_VIDEO_GENRES.AUTO,
  stylePreset: PUPPET_STYLE_DEFAULT,
  asrCheck: true,
  multiVoice: true,
  musicMood: MOTION_MUSIC.AUTO,
  musicVolume: MOTION_MUSIC.DEFAULT_VOLUME,
  activeRenderJobId: MR.MOTION_TEXT_EMPTY,
  activeStoryJobId: MR.MOTION_TEXT_EMPTY,
  autoContinue: true,
  autoExport: false,
  autoRun: false,
  parts: MOTION_PARTS.DEFAULT,
  series: null,
  seo: null,
  thumbnail: null,
};
const analyzedState = (analysis: MotionStoryAnalysis, look: string): Partial<PersistedState> => ({ analysis, script: null, voice: null, uploadedAudio: null, seo: null, thumbnail: null, thumbnails: {}, soundOverrides: {}, look: analysis.look || look, activeRenderJobId: MR.MOTION_TEXT_EMPTY, lastRenderJobId: null });
const seriesState = (full: MotionStoryAnalysis, parts: number | undefined, language: string, look: string): Partial<PersistedState> => {
  const started = motionSeriesStart(full, parts || MOTION_PARTS.DEFAULT, language);
  return { ...analyzedState(started.analysis, look), series: started.series };
};
const chainOn = (s: PersistedState): boolean => !s.automationPaused && (s.autoContinue !== false || s.autoRun === true);
const exportOn = (s: PersistedState): boolean => !s.automationPaused && (s.autoExport === true || s.autoRun === true);
export interface MotionScenesRequest {
  scenes?: string[];
  beats?: string[];
  locations?: string[];
  restart?: boolean;
  restyle?: boolean;
  note?: string;
}
const compileStateKey = motionCompileStateKey;
export const narrationSignature = motionVoiceSignature;
const selectedChannelRef = (next: PersistedState, data: MotionVoiceChannels): string => voiceChannelRef(data.channels.find((item) => item.id === (next.voiceChannelId === undefined ? data.defaultId : next.voiceChannelId)));
const withVoiceConfig = (next: PersistedState, data: MotionVoiceChannels): PersistedState => {
  if (!next.script) return next;
  const wanted = selectedChannelRef(next, data);
  const script = withMotionVoiceMode(next.script, next.multiVoice !== false);
  if ((script.voiceChannel || MR.MOTION_TEXT_EMPTY) !== wanted) return { ...next, script: { ...script, voiceChannel: wanted || undefined } };
  return script === next.script ? next : { ...next, script };
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
  const visualRuntime = useRef({ compiled, renderJob });
  visualRuntime.current = { compiled, renderJob };
  const [checking, setChecking] = useState(false);
  const [voiceError, setVoiceError] = useState<string>(MR.MOTION_TEXT_EMPTY);
  const [compileError, setCompileError] = useState<string>(MR.MOTION_TEXT_EMPTY);
  const [flowCount, setFlowCount] = useState(0);
  const flowDepth = useRef(0);
  const [logHistory, setLogHistory] = useState<MotionLogEntry[]>([]);
  const logHistoryRef = useRef<MotionLogEntry[]>([]);
  const logCursors = useRef(new Map<string, { cursor: number; loading: boolean; queued: boolean; lines: string[] }>());
  const settledSeoJobs = useRef(new Set<string>());
  const alertCaptcha = useRef(createMotionCaptchaAlert());
  const trackLog = useCallback((id: string, kind: string, lines: string[] | undefined, startedAt?: number, job?: Pick<MotionLogEntry, "status" | "stage" | "error" | "stepStates">) => {
    alertCaptcha.current(id, lines);
    const next = mergeMotionLogHistory(logHistoryRef.current, id, kind, lines, startedAt, job && { status: job.status, stage: job.stage, error: job.error, stepStates: job.stepStates });
    if (next !== logHistoryRef.current) {
      logHistoryRef.current = next;
      jsonUtils.setItem(MOTION_EDITORIAL.LOG_STORAGE_KEY, next);
      setLogHistory(next);
    }
    const session = stateRef.current.editorialSessionId;
    const cursor = logCursors.current.get(id) || { cursor: 0, loading: false, queued: false, lines: [] };
    if (cursor.loading) {
      cursor.queued = true;
      return;
    }
    logCursors.current.set(id, cursor);
    cursor.loading = true;
    void (async () => {
      let after = cursor.cursor;
      const received: string[] = [];
      for (;;) {
        cursor.queued = false;
        const page = await motionRequest<{ lines: string[]; next: number; total: number }>(API_ROUTES.MOTION_STORY_LOGS + encodeURIComponent(id) + MOTION_EDITORIAL.LOG_CURSOR(after));
        if (stateRef.current.editorialSessionId !== session || !mounted.current || logCursors.current.get(id) !== cursor) return;
        received.push(...page.lines);
        if ((page.next <= after || page.next >= page.total) && !cursor.queued) {
          after = page.next;
          break;
        }
        after = page.next;
      }
      if (!received.length) return;
      const existing = logHistoryRef.current.find((entry) => entry.id === id);
      const canonical = [...cursor.lines, ...received];
      const entry = { ...existing, id, kind, ...(startedAt || existing?.startedAt ? { startedAt: startedAt || existing?.startedAt } : {}), lines: existing && existing.lines.length > canonical.length ? mergeMotionLogHistory([existing], id, kind, canonical)[0].lines : canonical };
      const updated = existing ? logHistoryRef.current.map((item) => (item.id === id ? entry : item)) : [...logHistoryRef.current, entry];
      cursor.cursor = after;
      cursor.lines = canonical;
      logHistoryRef.current = updated;
      jsonUtils.setItem(MOTION_EDITORIAL.LOG_STORAGE_KEY, updated);
      setLogHistory(updated);
    })()
      .catch(() => {})
      .finally(() => {
        cursor.loading = false;
      });
  }, []);
  const flowCancelled = useRef(false);
  const voiceRequested = useRef<string>(MR.MOTION_TEXT_EMPTY);
  const [voiceRequestVersion, setVoiceRequestVersion] = useState(0);
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
  const renderPollAbort = useRef<AbortController | null>(null);
  const patch = useCallback((p: Partial<PersistedState>) => {
    const runtime = visualRuntime.current;
    if (p.stylePreset !== undefined && stateRef.current.visualSettings.mode === RT_SHARED.LIBRARY) p = { ...p, visualSettings: { ...stateRef.current.visualSettings, packId: p.stylePreset } };
    if (p.visualSettings && stringifyJson(p.visualSettings) !== stringifyJson(stateRef.current.visualSettings)) {
      if (flowDepth.current > 0 || stateRef.current.activeRenderJobId || stateRef.current.activeStoryJobId) {
        toast.error(MOTION_VISUAL.BUSY);
        return;
      }
      const restored = switchMotionVisualDraft({ ...stateRef.current, ...p, visualSettings: stateRef.current.visualSettings, stylePreset: stateRef.current.stylePreset }, p.visualSettings, runtime);
      renderPollAbort.current?.abort();
      setCompiled(restored.compiled);
      setRenderJob(restored.renderJob);
      compiledSig.current = restored.compiled?.compilationKey || MR.MOTION_TEXT_EMPTY;
      compileRevision.current++;
      setCompileError(MR.MOTION_TEXT_EMPTY);
    }
    if (p.visualSettings) p = { ...p, visualSettingsError: undefined };
    const apply = (s: PersistedState): PersistedState => {
      let next = { ...s, ...p };
      next.renderBehavior = normalizeMotionRenderBehavior(p.renderBehavior ?? (p.characterMotion === undefined ? s.renderBehavior : { ...s.renderBehavior, actors: p.characterMotion ? RT_SHARED.SIMPLE : RT_SHARED.FIXED }), next.characterMotion);
      next.characterMotion = next.renderBehavior.actors === RT_SHARED.SIMPLE;
      if (p.visualSettings && stringifyJson(p.visualSettings) !== stringifyJson(s.visualSettings)) {
        next = switchMotionVisualDraft({ ...next, visualSettings: s.visualSettings, stylePreset: s.stylePreset }, p.visualSettings, runtime).state;
      }
      if (p.script === null) next.visualDrafts = {};
      if (p.rawText !== undefined && p.rawText !== s.rawText) next.source = null;
      const synced = withVoiceConfig(next, channelsRef.current);
      if (synced.script && p.script?.voiceTrack?.provider === MOTION_VOICE.PROVIDER && p.script.voiceTrack.signature === narrationSignature(synced.script, synced.analysis)) synced.voice = { ...p.script.voiceTrack, signature: p.script.voiceTrack.signature };
      return synced;
    };
    stateRef.current = apply(stateRef.current);
    setState((s) => {
      const synced = apply(s);
      stateRef.current = synced;
      return synced;
    });
  }, []);
  const pauseAutomation = useCallback(() => {
    flowCancelled.current = true;
    voiceRequested.current = MR.MOTION_TEXT_EMPTY;
    jsonUtils.setItem(MOTION_STORY_CONFIG.STORY_STOP_STORAGE_KEY, true);
    patch({ autoRun: false, automationPaused: true });
  }, [patch]);
  const resumeAutomation = useCallback(() => {
    if (!flowDepth.current) {
      if (stateRef.current.automationPaused) voiceAttempt.current = { signature: MR.MOTION_TEXT_EMPTY, count: 0 };
      jsonUtils.setItem(MOTION_STORY_CONFIG.STORY_STOP_STORAGE_KEY, false);
      patch({ automationPaused: false, voiceHold: MR.MOTION_TEXT_EMPTY });
    }
  }, [patch]);
  const requestVoice = useCallback((script: MotionStoryScript | null, analysis: MotionStoryAnalysis | null) => {
    voiceRequested.current = narrationSignature(script, analysis);
    voiceAttempt.current = { signature: voiceRequested.current, count: 0 };
    setVoiceRequestVersion((version) => version + 1);
  }, []);
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
    const disposeAlertAudio = initMotionAlertAudio();
    (async () => {
      const saved = await jsonUtils.getAsyncItem<Partial<PersistedState>>(MOTION_STORY_CONFIG.STORY_STORAGE_KEY, {});
      if (!mounted.current) return;
      const restored = { ...DEFAULTS, ...(saved as Partial<PersistedState>), multiVoice: saved.multiVoice ?? saved.script?.voiceSettings?.multiVoice ?? true, sceneAiHeadless: saved.sceneAiHeadless ?? saved.aiHeadless ?? DEFAULTS.sceneAiHeadless };
      try {
        restored.visualSettings = normalizeMotionVisualSettings(saved.visualSettings, restored.stylePreset);
        if (restored.visualSettings.mode === RT_SHARED.REMOTION) restored.remotionProfile = restored.visualSettings.profileId;
        restored.renderBehavior = normalizeMotionRenderBehavior(saved.renderBehavior, restored.characterMotion);
        restored.characterMotion = restored.renderBehavior.actors === RT_SHARED.SIMPLE;
      } catch (error) {
        reportStoryError(error);
        restored.visualSettingsError = getMotionErrorMessage(error);
        restored.automationPaused = true;
      }
      if (jsonUtils.getItem(MOTION_STORY_CONFIG.STORY_STOP_STORAGE_KEY, false) || !restored.activeStoryJobId) {
        restored.autoRun = false;
        restored.automationPaused = true;
      }
      flowCancelled.current = restored.automationPaused === true;
      stateRef.current = withVoiceConfig(restored, channelsRef.current);
      const visual = motionVisualDraftRuntime(stateRef.current, restored.visualDrafts?.[motionVisualDraftKey(restored.visualSettings)]);
      setCompiled(visual.compiled);
      setRenderJob(visual.renderJob);
      compiledSig.current = visual.compiled?.compilationKey || MR.MOTION_TEXT_EMPTY;
      const savedHistory = jsonUtils.getItem<MotionLogEntry[]>(MOTION_EDITORIAL.LOG_STORAGE_KEY, saved.logHistory || []);
      logHistoryRef.current = Array.isArray(savedHistory) ? savedHistory : saved.logHistory || [];
      setLogHistory(logHistoryRef.current);
      setState(stateRef.current);
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
      disposeAlertAudio();
      pollAbort.current?.abort();
      renderPollAbort.current?.abort();
    };
  }, []);
  const persist = useMemo(() => _.debounce((s: PersistedState) => void jsonUtils.setAsyncItem(MOTION_STORY_CONFIG.STORY_STORAGE_KEY, s), 600), []);
  useEffect(() => {
    if (hydrated) persist({ ...state, logHistory, visualDrafts: { ...state.visualDrafts, [motionVisualDraftKey(state.visualSettings)]: captureMotionVisualDraft(state, visualRuntime.current) } });
  }, [state, compiled, renderJob, logHistory, hydrated, persist]);
  useEffect(() => {
    const flush = () => {
      if (!hydrated) return;
      persist({ ...stateRef.current, logHistory: logHistoryRef.current, visualDrafts: { ...stateRef.current.visualDrafts, [motionVisualDraftKey(stateRef.current.visualSettings)]: captureMotionVisualDraft(stateRef.current, visualRuntime.current) } });
      persist.flush();
    };
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
  }, [persist, hydrated]);
  const stateRef = useRef(state);
  stateRef.current = state;
  const visualRecoveryAttempts = useRef(new Set<string>());
  const visualChoiceKey = motionVisualDraftKey(state.visualSettings);
  const visualContextKey = motionVisualDraftContextKey(state);
  useEffect(() => {
    if (!hydrated || state.activeStoryJobId || state.activeRenderJobId || !state.script || hasMotionVisualDraft(state)) return;
    const key = state.editorialSessionId + visualChoiceKey + visualContextKey;
    if (visualRecoveryAttempts.current.has(key)) return;
    visualRecoveryAttempts.current.add(key);
    const ctrl = new AbortController();
    const ids = [
      ...new Set(
        [
          state.productionId,
          state.editorialSessionId,
          ...logHistoryRef.current
            .filter((entry) => entry.kind === MotionStoryJobKind.PRODUCTION || entry.kind === MotionStoryJobKind.SCENES)
            .slice(-2)
            .reverse()
            .map((entry) => entry.id),
        ].filter(Boolean),
      ),
    ].slice(0, 3) as string[];
    void (async () => {
      for (const id of ids) {
        try {
          const { job } = await motionRequest<{ job: MotionStoryJobState }>(motionJobStatusUrl(API_ROUTES.MOTION_STORY_STATUS, id), undefined, undefined, ctrl.signal);
          if (ctrl.signal.aborted || !mounted.current || motionVisualDraftKey(stateRef.current.visualSettings) !== visualChoiceKey || motionVisualDraftContextKey(stateRef.current) !== visualContextKey || hasMotionVisualDraft(stateRef.current)) return;
          if (!job.result || !isMotionJobTerminal(job.status)) continue;
          const result = job.kind === MotionStoryJobKind.PRODUCTION ? (job.result as MotionProductionResult) : job.kind === MotionStoryJobKind.SCENES ? { script: job.result as MotionStoryScript } : undefined;
          const restored = result && recoverMotionVisualDraft(stateRef.current, result);
          if (!restored || !hasMotionVisualDraft(restored.state)) continue;
          patch({ analysis: restored.state.analysis, script: restored.state.script, lastRenderJobId: restored.state.lastRenderJobId, renderSignature: restored.state.renderSignature });
          setCompiled(restored.compiled);
          setRenderJob(restored.renderJob);
          compiledSig.current = restored.compiled?.compilationKey || MR.MOTION_TEXT_EMPTY;
          return;
        } catch {
          if (ctrl.signal.aborted) return;
        }
      }
    })();
    return () => {
      ctrl.abort();
      visualRecoveryAttempts.current.delete(key);
    };
  }, [hydrated, visualChoiceKey, visualContextKey, state.editorialSessionId, state.productionId, state.activeStoryJobId, state.activeRenderJobId, patch]);
  useEffect(() => {
    if (!hydrated || compiled || state.activeStoryJobId || state.activeRenderJobId) return;
    const restored = motionVisualDraftRuntime(state, state.visualDrafts?.[visualChoiceKey]);
    if (!restored.compiled) return;
    setCompiled(restored.compiled);
    setRenderJob(restored.renderJob);
    compiledSig.current = restored.compiled.compilationKey || MR.MOTION_TEXT_EMPTY;
  }, [hydrated, compiled, state, visualChoiceKey]);
  useEffect(() => {
    if (!hydrated || storyJob) return;
    const id = motionRestoredStoryJobId(state.activeStoryJobId, logHistoryRef.current, state.productionId);
    if (!id) return;
    patch({ activeStoryJobId: id });
    void resumeStoryJob(id);
  }, [hydrated]);
  useEffect(() => {
    if (!hydrated || !state.seoJobId) return;
    const ctrl = new AbortController();
    const id = state.seoJobId;
    const productionId = state.productionId;
    void pollMotionJob<MotionStoryJobState>(
      motionJobStatusUrl(API_ROUTES.MOTION_STORY_STATUS, id),
      (job) => {
        if (!mounted.current || stateRef.current.productionId !== productionId || stateRef.current.seoJobId !== id) return;
        const parent = logHistoryRef.current.find((entry) => entry.id === productionId);
        if (parent) trackLog(parent.id, parent.kind, undefined, parent.startedAt, { ...parent, stepStates: { ...parent.stepStates, [MOTION_PRODUCTION.STAGES.SEO]: { id, status: job.status, stage: job.stage, startedAt: job.startedAt, updatedAt: Date.now(), error: job.error } } });
        else trackLog(id, MotionStoryJobKind.SEO, job.log, job.startedAt, job);
      },
      (job) => isMotionJobTerminal(job.status),
      ctrl.signal,
      1500,
    )
      .then((job) => {
        if (!mounted.current || stateRef.current.productionId !== productionId || stateRef.current.seoJobId !== id) return;
        settledSeoJobs.current.add(id);
        if (!logHistoryRef.current.some((entry) => entry.id === productionId && entry.lines.some((line) => line.includes(MOTION_LOG_PROGRESS.SEO_SECTION)))) trackLog(id, MotionStoryJobKind.SEO, job.log, job.startedAt, job);
        patch({ seoJobId: undefined, ...(job.status === MotionJobStatus.COMPLETED ? { seo: job.result as MotionSeoPack } : {}) });
      })
      .catch((error) => {
        if (!ctrl.signal.aborted) reportStoryError(error);
      });
    return () => ctrl.abort();
  }, [hydrated, state.seoJobId, state.productionId, patch, trackLog]);
  const aiExecution = motionMainAiExecution(state);
  const runStoryJob = useCallback(
    async (url: string, body: unknown, onPartial?: (r: any) => void): Promise<any> => {
      if (flowCancelled.current) throw new Error(MOTION_TEXT_CANCELLED);
      pollAbort.current?.abort();
      const ctrl = new AbortController();
      pollAbort.current = ctrl;
      const prefix = storyActivityPrefixes[storyActivityRoutes[url]];
      logMotionActivity(prefix, WORKFLOW_ACTIVITY_CONFIG.EVENT_SUFFIX.start);
      let terminalLogged = false;
      try {
        const productionId = stateRef.current.editorialSessionId || createMotionEditorialId();
        patch({ editorialSessionId: productionId });
        body = { ...(body as object), productionId };
        if (_.includes([API_ROUTES.MOTION_STORY_ANALYZE, API_ROUTES.MOTION_STORY_SCRIPT, API_ROUTES.MOTION_STORY_SEO], url)) {
          const editorialSessionId = stateRef.current.editorialSessionId || createMotionEditorialId();
          patch({ editorialSessionId });
          body = { ...(body as object), editorialSessionId };
        }
        const { job } = await motionRequest<{ job: MotionStoryJobState }>(url, body);
        setStoryJob(job);
        trackLog(job.id, job.kind, job.log, job.startedAt, job);
        patch({ activeStoryJobId: job.id, activeStoryRunId: job.id });
        if (flowCancelled.current) await motionRequest(API_ROUTES.MOTION_STORY_CANCEL, { jobId: job.id }).catch(reportStoryError);
        const final = await pollMotionJob<MotionStoryJobState>(
          motionJobStatusUrl(API_ROUTES.MOTION_STORY_STATUS, job.id),
          (j) => {
            if (!mounted.current || ctrl.signal.aborted || stateRef.current.activeStoryJobId !== job.id) return;
            setStoryJob(j);
            trackLog(j.id, j.kind, j.log, j.startedAt, j);
            if (onPartial && j.result && stateRef.current.activeStoryJobId === job.id) onPartial(j.result);
          },
          (j) => isMotionJobTerminal(j.status),
          ctrl.signal,
          1200,
          () => mounted.current && setStoryJob((current) => (current?.id === job.id ? { ...current, stage: MOTION_JOB_POLLING.RECONNECTING } : current)),
        ).finally(() => mounted.current && !ctrl.signal.aborted && stateRef.current.activeStoryJobId === job.id && patch({ activeStoryJobId: MR.MOTION_TEXT_EMPTY, activeStoryRunId: MR.MOTION_TEXT_EMPTY }));
        if (mounted.current) {
          logStoryTerminal(final);
          terminalLogged = true;
        }
        if (final.status === MotionJobStatus.ERROR) throw new Error(final.error || MOTION_TEXT_AI_ERROR);
        if (final.status === MotionJobStatus.CANCELLED || flowCancelled.current) {
          pauseAutomation();
          throw new Error(MOTION_TEXT_CANCELLED);
        }
        return final.result;
      } catch (error) {
        pauseAutomation();
        if (!ctrl.signal.aborted && mounted.current && getMotionErrorMessage(error) !== MOTION_TEXT_CANCELLED) {
          if (!terminalLogged) logMotionActivity(prefix, WORKFLOW_ACTIVITY_CONFIG.EVENT_SUFFIX.fail, getMotionErrorMessage(error));
        }
        throw error;
      }
    },
    [pauseAutomation],
  );
  const applyProduction = useCallback(
    (job: MotionStoryJobState) => {
      if (job.kind !== MotionStoryJobKind.PRODUCTION || job.productionId !== stateRef.current.editorialSessionId) return;
      const result = job.result as MotionProductionResult | undefined;
      if (!result) return;
      patch({
        ...(result.analysis ? { analysis: result.analysis, series: result.series } : {}),
        ...(result.script ? { script: result.script } : {}),
        ...(result.voice?.signature ? { voice: { ...result.voice, signature: result.voice.signature }, uploadedAudio: null } : {}),
        ...(result.seo ? { seo: result.seo } : {}),
        ...(result.seoJobId && !settledSeoJobs.current.has(result.seoJobId) ? { seoJobId: result.seoJobId } : {}),
      });
      if (result.compiled) {
        compiledSig.current = compileStateKey(stateRef.current);
        setCompiled({ ...result.compiled, compilationKey: compiledSig.current });
      }
      if (result.rendered) {
        setResults((items) => [result.rendered!, ...items.filter((item) => item.id !== result.rendered!.id)]);
        setRenderJob({ id: result.rendered.id, status: MotionJobStatus.COMPLETED, progress: 1, framesDone: 0, framesTotal: 0, startedAt: job.startedAt, log: [], result: result.rendered });
        patch({ lastRenderJobId: result.rendered.id, renderSignature: motionRenderStateKey({ ...stateRef.current, ...result.renderSettings }) });
      }
    },
    [patch],
  );
  const resumeStoryJob = useCallback(
    async (jobId: string) => {
      const ctrl = new AbortController();
      pollAbort.current = ctrl;
      let cancellationRequested = false;
      try {
        const final = await pollMotionJob<MotionStoryJobState>(
          motionJobStatusUrl(API_ROUTES.MOTION_STORY_STATUS, jobId),
          (job) => {
            if (!mounted.current || stateRef.current.activeStoryJobId !== jobId) return;
            setStoryJob(job);
            trackLog(job.id, job.kind, job.log, job.startedAt, job);
            if (!isMotionJobTerminal(job.status) && !cancellationRequested && jsonUtils.getItem(MOTION_STORY_CONFIG.STORY_STOP_STORAGE_KEY, false)) {
              cancellationRequested = true;
              void motionRequest(API_ROUTES.MOTION_STORY_CANCEL, { jobId }).catch(reportStoryError);
            }
            if (job.kind === MotionStoryJobKind.PRODUCTION) applyProduction(job);
            else if ((job.kind === MotionStoryJobKind.SCRIPT || job.kind === MotionStoryJobKind.SCENES) && _.get(job.result, MOTION_TEXT_BEATS)) patch({ script: job.result as MotionStoryScript });
          },
          (job) => isMotionJobTerminal(job.status),
          ctrl.signal,
          1200,
        );
        if (!mounted.current || stateRef.current.activeStoryJobId !== jobId) return;
        logStoryTerminal(final);
        if (final.kind === MotionStoryJobKind.PRODUCTION) applyProduction(final);
        else if (final.status === MotionJobStatus.COMPLETED && final.result) {
          if (final.kind === MotionStoryJobKind.SCRIPT || final.kind === MotionStoryJobKind.SCENES) patch({ script: final.result as MotionStoryScript });
          if (final.kind === MotionStoryJobKind.ANALYZE) patch(seriesState(final.result as MotionStoryAnalysis, stateRef.current.parts, stateRef.current.language, stateRef.current.look));
          if (final.kind === MotionStoryJobKind.VOICE) {
            const track = final.result as MotionVoiceTrack;
            if (track.signature === narrationSignature(stateRef.current.script, stateRef.current.analysis)) patch({ voice: { ...track, signature: track.signature! }, uploadedAudio: null });
          }
          if (final.kind === MotionStoryJobKind.SEO) patch({ seo: final.result as MotionSeoPack });
          if (final.kind === MotionStoryJobKind.THUMBNAIL) patch({ thumbnail: { image: (final.result as any).thumbnail, prompt: (final.result as any).prompt } });
        }
        if (final.status === MotionJobStatus.ERROR) reportStoryError(new Error(final.error));
      } catch (error) {
        if (mounted.current && !ctrl.signal.aborted) reportStoryError(error);
      } finally {
        if (mounted.current && !ctrl.signal.aborted && stateRef.current.activeStoryJobId === jobId) patch({ activeStoryJobId: MR.MOTION_TEXT_EMPTY, activeStoryRunId: MR.MOTION_TEXT_EMPTY, autoRun: false, automationPaused: true });
      }
    },
    [patch, applyProduction, trackLog],
  );
  const sourceReader = useMemo(
    () =>
      createMotionSourceReader(
        async (text, signal) => (await motionRequest<{ source: MotionStorySource }>(API_ROUTES.MOTION_STORY_PARSE, { text }, undefined, signal)).source,
        (source, text) => {
          if (stateRef.current.rawText === text) patch({ source });
        },
      ),
    [patch],
  );
  useEffect(() => () => sourceReader.cancel(), [sourceReader]);
  const parseSource = useCallback(
    async (text: string) => {
      if (text !== stateRef.current.rawText) {
        renderPollAbort.current?.abort();
        setRenderJob(null);
        patch({ activeRenderJobId: MR.MOTION_TEXT_EMPTY, lastRenderJobId: null, source: null });
      }
      patch({ rawText: text });
      await sourceReader.load(text);
    },
    [patch, sourceReader],
  );
  const startProduction = useCallback(
    async (overrides: Record<string, unknown> = {}, resumeId?: string) => {
      const now = stateRef.current;
      if (!now.source || flowDepth.current) return;
      if (now.visualSettingsError) {
        toast.error(now.visualSettingsError);
        return;
      }
      resumeAutomation();
      const id = resumeId || createMotionEditorialId();
      await inFlow(async () => {
        try {
          if (!resumeId) {
            pollAbort.current?.abort();
            renderPollAbort.current?.abort();
            persist.cancel();
            logHistoryRef.current = [];
            logCursors.current.clear();
            settledSeoJobs.current.clear();
            visualRecoveryAttempts.current.clear();
            alertCaptcha.current = createMotionCaptchaAlert();
            voiceRequested.current = MR.MOTION_TEXT_EMPTY;
            voicePending.current = null;
            voiceAttempt.current = { signature: MR.MOTION_TEXT_EMPTY, count: 0 };
            compiledSig.current = MR.MOTION_TEXT_EMPTY;
            compileRevision.current++;
            restoredRenderJob.current = undefined;
            visualRuntime.current = { compiled: null, renderJob: null };
            jsonUtils.setItem(MOTION_EDITORIAL.LOG_STORAGE_KEY, []);
            setLogHistory([]);
            setStoryJob(null);
            setCompiled(null);
            setRenderJob(null);
            setVoiceError(MR.MOTION_TEXT_EMPTY);
            setCompileError(MR.MOTION_TEXT_EMPTY);
            patch({
              autoRun: true,
              automationPaused: false,
              productionId: id,
              editorialSessionId: id,
              logHistory: [],
              analysis: null,
              series: null,
              script: null,
              voice: null,
              seo: null,
              seoJobId: undefined,
              uploadedAudio: null,
              thumbnail: null,
              thumbnails: {},
              soundOverrides: {},
              visualDrafts: {},
              look: MR.MOTION_TEXT_EMPTY,
              voiceHold: MR.MOTION_TEXT_EMPTY,
              activeStoryJobId: MR.MOTION_TEXT_EMPTY,
              activeStoryRunId: MR.MOTION_TEXT_EMPTY,
              activeRenderJobId: MR.MOTION_TEXT_EMPTY,
              lastRenderJobId: null,
              renderSignature: undefined,
            });
            persist(stateRef.current);
            persist.flush();
            const storyIds = new Set([now.productionId, now.activeStoryJobId, now.seoJobId].filter(Boolean));
            for (const jobId of storyIds) await motionRequest(API_ROUTES.MOTION_STORY_CANCEL, { jobId });
            if (now.activeRenderJobId) await motionRequest(API_ROUTES.MOTION_VIDEO_CANCEL, { jobId: now.activeRenderJobId });
          } else patch({ autoRun: true, productionId: id, editorialSessionId: id });
          const body = resumeId
            ? { productionId: resumeId }
            : {
                source: now.source,
                productionId: id,
                language: now.language,
                length: now.length,
                parts: now.parts,
                styleReferences: now.styleReferences,
                characterMotion: now.characterMotion,
                aspect: now.aspect,
                aiExecution: motionMainAiExecution(now),
                sceneAiExecution: motionSceneAiExecution(now),
                videoGenre: now.videoGenre || MOTION_VIDEO_GENRES.AUTO,
                ...motionVisualRequest(now),
                voiceChannel: selectedChannelRef(now, channelsRef.current),
                multiVoice: now.multiVoice !== false,
                aiReview: now.aiReview,
                asrCheck: now.asrCheck,
                sfx: now.sfx,
                sfxVolume: now.sfxVolume,
                soundOverrides: stateRef.current.soundOverrides,
                subtitles: now.subtitles,
                quality: now.quality,
                fps: now.fps,
                encoder: now.visualSettings.mode === RT_SHARED.REMOTION ? MotionEncoderPreference.CPU : now.encoder,
                musicMood: now.musicMood,
                musicVolume: now.musicVolume,
                autoExport: now.autoExport === true,
                ...overrides,
              };
          const final = await runStoryJob(resumeId ? API_ROUTES.MOTION_PRODUCTION_RESUME : API_ROUTES.MOTION_PRODUCTION, body, (result) => applyProduction({ id, productionId: id, kind: MotionStoryJobKind.PRODUCTION, result } as MotionStoryJobState));
          applyProduction({ id, productionId: id, kind: MotionStoryJobKind.PRODUCTION, result: final } as MotionStoryJobState);
        } catch (error) {
          reportStoryError(error);
        } finally {
          if (stateRef.current.productionId === id) patch({ autoRun: false, automationPaused: true });
        }
      });
    },
    [inFlow, runStoryJob, patch, resumeAutomation, applyProduction, persist],
  );
  const analyze = useCallback(() => startProduction({ analyzeOnly: stateRef.current.autoContinue === false }), [startProduction]);
  const resumeProduction = useCallback(() => (stateRef.current.productionId ? startProduction({}, stateRef.current.productionId) : Promise.resolve()), [startProduction]);
  const writeScript = useCallback(
    async (chapterIds?: string[], analysisOverride?: MotionStoryAnalysis, resume = false, carryGen?: MotionSeriesState["carryGen"]) => {
      const now = stateRef.current;
      const analysis = analysisOverride || now.analysis;
      if (now.visualSettingsError) {
        toast.error(now.visualSettingsError);
        return;
      }
      if (!now.source || !analysis) return;
      resumeAutomation();
      await inFlow(async () => {
        try {
          const script = (await runStoryJob(
            API_ROUTES.MOTION_STORY_SCRIPT,
            {
              source: now.source,
              analysis,
              ...motionVisualRequest(now),
              language: now.language,
              length: now.length,
              aiExecution: motionMainAiExecution(now),
              keepBrowser: chainOn(stateRef.current),
              voiceChannel: selectedChannelRef(now, channelsRef.current),
              multiVoice: now.multiVoice !== false,
              voiceSettings: now.script?.voiceSettings,
              chapterIds,
              chapterDrafts: now.script?.chapterDrafts,
              beats: analysisOverride ? [] : now.script?.beats || [],
              gen: resume || chapterIds?.length ? now.script?.gen : undefined,
              carryGen: carryGen || (now.series?.index ? now.series.carryGen : undefined),
              aspect: now.aspect,
              resume,
            },
            (partial) => partial?.beats && patch({ script: partial }),
          )) as MotionStoryScript;
          patch({ script, seo: null });
          setCompiled(null);
          const missing = missingMotionChapters(script, analysis).length;
          if (missing) {
            toast.warning(MR.MOTION_TEMPLATE_CON_CHUONG_CHUA_VIET_DUOC_BAM_VIET_TIEP_CHUONG_CON_THIEU(missing));
            pauseAutomation();
            return;
          }
        } catch (e: any) {
          reportStoryError(e);
        } finally {
          if (stateRef.current.autoRun) patch({ autoRun: false });
        }
      });
    },
    [inFlow, state.source, state.analysis, state.language, state.length, state.autoContinue, state.script, state.aspect, state.aiProvider, state.aiModel, state.aiMode, state.aiHeadless, runStoryJob, patch, resumeAutomation, pauseAutomation],
  );
  const generateSeo = useCallback(
    async (scriptOverride?: MotionStoryScript, analysisOverride?: MotionStoryAnalysis, quiet = false) => {
      const script = scriptOverride || state.script;
      const analysis = analysisOverride || state.analysis;
      if (!script?.beats?.length || !analysis) return;
      const voiceMatches = !scriptOverride && state.voice && state.voice.durations?.length === script.beats.length;
      resumeAutomation();
      await inFlow(async () => {
        try {
          const seo = (await runStoryJob(API_ROUTES.MOTION_STORY_SEO, { analysis, script, source: stateRef.current.source, language: state.language, aiExecution, keepBrowser: quiet, durations: voiceMatches ? state.voice!.durations : undefined })) as MotionSeoPack;
          patch({ seo });
        } catch (e: any) {
          if (quiet) toast.warning(MR.MOTION_TEMPLATE_SEO(getMotionErrorMessage(e)));
          else reportStoryError(e);
        }
      });
    },
    [inFlow, state.script, state.analysis, state.language, state.voice, state.aiProvider, state.aiModel, state.aiMode, state.aiHeadless, runStoryJob, patch, resumeAutomation],
  );
  const seedKit = useCallback(
    async (styleId: string): Promise<{ sets: number; variants: number; props: number } | null> => {
      const now = stateRef.current;
      let report: { sets: number; variants: number; props: number } | null = null;
      resumeAutomation();
      await inFlow(async () => {
        try {
          report = await runStoryJob(PUPPET_KIT_API.URLS.SEED, { styleId, aiExecution: motionSceneAiExecution(now), mainAiExecution: motionMainAiExecution(now) });
        } catch (e: any) {
          reportStoryError(e);
        }
      });
      return report;
    },
    [inFlow, runStoryJob, resumeAutomation],
  );
  const generateThumbnail = useCallback(
    async (optionIndex = 0) => {
      const now = stateRef.current;
      if (now.visualSettingsError) {
        toast.error(now.visualSettingsError);
        return;
      }
      if (!now.analysis) return;
      resumeAutomation();
      await inFlow(async () => {
        try {
          const result = (await runStoryJob(API_ROUTES.MOTION_STORY_THUMBNAIL, { analysis: now.analysis, script: now.script, ...motionVisualRequest(now), seo: now.seo?.options?.[optionIndex], language: now.language, aspect: now.aspect, aiExecution: motionMainAiExecution(now) })) as { thumbnail: string; prompt: string };
          const newThumb: MotionThumbnail = { image: result.thumbnail, prompt: result.prompt, optionIndex };
          patch({ thumbnail: newThumb, thumbnails: { ...(stateRef.current.thumbnails || {}), [optionIndex]: newThumb } });
        } catch (e: any) {
          reportStoryError(e);
        }
      });
    },
    [inFlow, runStoryJob, patch, resumeAutomation],
  );
  const buildScenes = useCallback(
    async (req: MotionScenesRequest = {}, scriptOverride?: MotionStoryScript, analysisOverride?: MotionStoryAnalysis) => {
      if (stateRef.current.visualSettingsError) {
        toast.error(stateRef.current.visualSettingsError);
        return;
      }
      const script = withVoiceConfig({ ...stateRef.current, script: scriptOverride || stateRef.current.script }, channelsRef.current).script;
      const analysis = analysisOverride || stateRef.current.analysis;
      if (!script?.beats?.length || !analysis) return;
      resumeAutomation();
      const now = stateRef.current;
      return inFlow(async () => {
        try {
          const result = (await runStoryJob(
            API_ROUTES.MOTION_STORY_SCENES,
            { script, analysis, aspect: now.aspect, aiExecution: motionSceneAiExecution(now), mainAiExecution: motionMainAiExecution(now), asrCheck: now.asrCheck === true, styleReferences: now.styleReferences, ...motionVisualRequest(now), characterMotion: now.characterMotion, review: now.aiReview !== false, autoVoice: false, sfx: now.sfx, previews: !exportOn(now), ...req },
            (partial) => partial?.beats && patch({ script: partial }),
          )) as MotionStoryScript;
          if (!flowCancelled.current && !stateRef.current.automationPaused) requestVoice(result, analysis);
          patch({ script: result });
          setCompiled(null);
          const failed =
            (result.gen?.failed?.length || 0) +
            Object.values(result.gen?.remotion?.scenes || {})
              .flat()
              .filter((scene) => scene.build?.status === "failed").length;
          if (failed) toast.warning(result.gen?.remotion ? MOTION_VISUAL.RETRY_SCENES(failed) : MOTION_TEMPLATE_CANH_CHUA_DUNG_DUOC_BAM_DUNG_TIEP(String(failed)));
          else toast.success(PUPPET.TOAST_DONE);
          return result;
        } catch (e: any) {
          reportStoryError(e);
        }
      });
    },
    [inFlow, state.script, state.analysis, state.aspect, state.aiProvider, state.aiModel, state.aiMode, state.aiHeadless, state.sceneAiProvider, state.sceneAiModel, state.sceneAiHeadless, state.aiReview, state.styleReferences, state.characterMotion, runStoryJob, patch, resumeAutomation, requestVoice],
  );
  const voicePending = useRef<{ signature: string; promise: Promise<MotionVoiceTrack | undefined> } | null>(null);
  const generateVoice = useCallback(
    async (scriptOverride?: MotionStoryScript): Promise<MotionVoiceTrack | undefined> => {
      const snapshot = stateRef.current,
        script = withVoiceConfig({ ...snapshot, script: scriptOverride || snapshot.script }, channelsRef.current).script;
      if (!script?.beats?.length) return;
      const signature = narrationSignature(script, snapshot.analysis);
      if (voicePending.current?.signature === signature) return voicePending.current.promise;
      resumeAutomation();
      const promise = inFlow(async () => {
        try {
          setVoiceError(MR.MOTION_TEXT_EMPTY);
          if (stateRef.current.voiceHold) patch({ voiceHold: MR.MOTION_TEXT_EMPTY });
          const track = (await runStoryJob(API_ROUTES.MOTION_STORY_VOICE, { script, analysis: snapshot.analysis, aspect: snapshot.aspect, asrCheck: snapshot.asrCheck === true, aiExecution: motionMainAiExecution(snapshot) })) as MotionVoiceTrack;
          if (narrationSignature(stateRef.current.script, stateRef.current.analysis) !== signature || track.signature !== signature) return;
          const current = stateRef.current;
          const voiceCast = track.plan?.roles && current.script?.gen ? motionVoiceCast(current.script.gen.voiceCast, track.plan.roles) : undefined;
          const withCast = voiceCast && current.script?.gen ? { script: { ...current.script, gen: { ...current.script.gen, voiceCast } } } : {};
          const next = { ...current, ...withCast, voice: { ...track, signature }, uploadedAudio: null, ...(current.seo && current.analysis && track.durations?.length === script.beats.length ? { seo: retimeSeoPack(current.seo, script.beats, current.analysis.chapters, current.language !== MR.MOTION_TEXT_EN, track.durations) } : {}) };
          stateRef.current = next;
          setState(next);
          setCompiled(null);
          return track;
        } catch (e: any) {
          if (getMotionErrorMessage(e) === MOTION_TEXT_CANCELLED) patch({ voiceHold: signature });
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
    [runStoryJob, inFlow, resumeAutomation],
  );
  const cancelStory = useCallback(async () => {
    pauseAutomation();
    try {
      await motionRequest(API_ROUTES.MOTION_STORY_CANCEL, { jobId: storyJob?.id, editorialSessionId: stateRef.current.editorialSessionId });
    } catch (error) {
      reportStoryError(error);
    }
  }, [storyJob, pauseAutomation]);
  const voiceValid = state.voice?.provider === MOTION_VOICE.PROVIDER && state.voice.signature === narrationSignature(state.script, state.analysis);
  useEffect(() => {
    if (voiceValid) setVoiceError(MR.MOTION_TEXT_EMPTY);
  }, [voiceValid]);
  const compileRevision = useRef(0);
  const audioId = voiceValid ? state.voice?.audioId : state.uploadedAudio?.id;
  const compile = useCallback(
    async (scriptOverride?: MotionStoryScript): Promise<MotionCompiledPreview | null> => {
      const snapshot = stateRef.current;
      if (snapshot.visualSettingsError) throw new Error(snapshot.visualSettingsError);
      const script = scriptOverride || snapshot.script;
      if (!script?.beats?.length) return null;
      const revision = ++compileRevision.current;
      setCompileError(MR.MOTION_TEXT_EMPTY);
      const currentKey = compileStateKey({ ...snapshot, script });
      const r = await motionRequest<MotionCompiledPreview>(API_ROUTES.MOTION_STORY_COMPILE, {
        script,
        analysis: snapshot.analysis,
        ...motionVisualRequest(snapshot),
        fps: snapshot.fps,
        subtitles: snapshot.subtitles,
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
      const value = {
        ...r,
        compilationKey: currentKey,
        spec: isRemotionSpec(r.spec) ? r.spec : { ...r.spec, ...(r.spec.kit ? { kit: { ...r.spec.kit, motion: snapshot.characterMotion } } : {}), gen: r.spec.gen ? { ...r.spec.gen, characterMotion: snapshot.characterMotion } : undefined, fps: snapshot.fps, ...(snapshot.subtitles === false ? { subtitles: [] } : {}) },
        sfxCues: r.sfxCues,
        missing: r.missing || [],
      };
      if (revision === compileRevision.current) setCompiled(value);
      return value;
    },
    [state.script, state.analysis, state.aspect, state.look, state.voice, state.uploadedAudio, state.fps, state.characterMotion, state.renderBehavior, state.subtitles, state.sfx, state.sfxVolume, state.soundOverrides, audioId, voiceValid],
  );
  const compiledSig = useRef<string>(MR.MOTION_TEXT_EMPTY);
  useEffect(() => {
    if (!state.script?.beats?.length) {
      setCompiled(null);
      compiledSig.current = MR.MOTION_TEXT_EMPTY;
      return;
    }
    if (!hydrated || state.visualSettingsError || state.autoExport || (state.activeStoryJobId && state.activeStoryJobId === state.productionId)) return;
    if (state.visualSettings.mode === RT_SHARED.REMOTION && (!state.script.gen?.remotion || (state.script.gen.remotion.pacingRevision === MOTION_SCENE_PACING.REVISION ? motionVisualBeatGroups(state.script).some((group) => !state.script!.gen?.remotion?.scenes[group.id]?.length) : state.script.beats.some((beat) => !state.script!.gen?.remotion?.scenes[beat.id]?.length)))) {
      setCompiled(null);
      setCompileError(MR.MOTION_TEXT_EMPTY);
      return;
    }
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
  }, [hydrated, compile, state.script, state.analysis, state.aspect, state.look, state.voice, state.uploadedAudio, state.fps, state.characterMotion, state.renderBehavior, state.sfx, state.sfxVolume, state.soundOverrides, state.subtitles, state.visualSettings, voiceValid]);
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
  const recordRenderResult = useCallback((result: MotionResultItem) => setResults((items) => [result, ..._.reject(items, { id: result.id })]), []);
  const followRender = useCallback(
    async (jobId: string) => {
      const sourceText = stateRef.current.rawText;
      const visualKey = motionVisualDraftKey(stateRef.current.visualSettings);
      const sessionId = stateRef.current.editorialSessionId;
      const current = () => mounted.current && stateRef.current.editorialSessionId === sessionId && stateRef.current.rawText === sourceText && motionVisualDraftKey(stateRef.current.visualSettings) === visualKey;
      renderPollAbort.current?.abort();
      const ctrl = new AbortController();
      renderPollAbort.current = ctrl;
      let cancellationRequested = false;
      try {
        const final = await pollMotionJob<MotionJobState>(
          motionJobStatusUrl(API_ROUTES.MOTION_VIDEO_STATUS, jobId),
          (j) => {
            if (ctrl.signal.aborted || !current()) return;
            setRenderJob(j);
            trackLog(j.id, MOTION_STORY_CONFIG.RENDER_LOG_KIND, j.log, j.startedAt, j);
            if (!isMotionJobTerminal(j.status) && !cancellationRequested && jsonUtils.getItem(MOTION_STORY_CONFIG.STORY_STOP_STORAGE_KEY, false)) {
              cancellationRequested = true;
              void motionRequest(API_ROUTES.MOTION_VIDEO_CANCEL, { jobId }).catch(reportStoryError);
            }
          },
          (j) => isMotionJobTerminal(j.status),
          ctrl.signal,
          MOTION_VIDEO_CONSTANTS.POLL_INTERVAL_MS,
          () => !ctrl.signal.aborted && current() && setRenderJob((job) => (job?.id === jobId ? { ...job, stage: MOTION_JOB_POLLING.RECONNECTING } : job)),
        );
        if (ctrl.signal.aborted || !mounted.current) return;
        if (!current()) {
          if (final.result) recordRenderResult(final.result);
          return;
        }
        patch({ activeRenderJobId: MR.MOTION_TEXT_EMPTY, ...(final.status === MotionJobStatus.COMPLETED && final.result ? { lastRenderJobId: final.result.id } : {}) });
        logMotionActivity(MOTION_ACTIVITY_PREFIX.render, final.status === MotionJobStatus.COMPLETED ? WORKFLOW_ACTIVITY_CONFIG.EVENT_SUFFIX.done : final.status === MotionJobStatus.CANCELLED ? WORKFLOW_ACTIVITY_CONFIG.EVENT_SUFFIX.stop : WORKFLOW_ACTIVITY_CONFIG.EVENT_SUFFIX.fail, final.error || final.result?.fileName);
        if (final.status === MotionJobStatus.COMPLETED && final.result) {
          recordRenderResult(final.result);
          const series = stateRef.current.series;
          if (series) patch({ series: { ...series, done: [..._.reject(series.done, { index: series.index }), { index: series.index, title: stateRef.current.analysis?.title || final.result.title, videoUrl: final.result.videoUrl, fileName: final.result.fileName }] } });
          toast.success(final.result.fileName);
        } else if (final.status === MotionJobStatus.ERROR) toast.error(final.error);
        else if (final.status === MotionJobStatus.CANCELLED) toast.info(STOPPED_TOAST);
      } catch (error) {
        if (!ctrl.signal.aborted && current()) {
          logMotionActivity(MOTION_ACTIVITY_PREFIX.render, WORKFLOW_ACTIVITY_CONFIG.EVENT_SUFFIX.fail, getMotionErrorMessage(error));
          patch({ activeRenderJobId: MR.MOTION_TEXT_EMPTY });
        }
      }
    },
    [patch, recordRenderResult],
  );
  const restoredRenderJob = useRef<string>();
  useEffect(() => {
    if (!hydrated || renderJob) return;
    const partFile = state.series?.done.find((part) => part.index === state.series?.index)?.fileName;
    const jobId = state.activeRenderJobId || state.lastRenderJobId || (state.lastRenderJobId === undefined && partFile ? results.find((result) => result.fileName === partFile)?.id : undefined);
    if (!jobId || restoredRenderJob.current === jobId) return;
    restoredRenderJob.current = jobId;
    void followRender(jobId);
  }, [hydrated, state.activeRenderJobId, state.lastRenderJobId, state.series, results, renderJob, followRender]);
  const render = useCallback(async () => {
    if (stateRef.current.visualSettingsError) {
      toast.error(stateRef.current.visualSettingsError);
      return;
    }
    resumeAutomation();
    return inFlow(async () => {
      let renderRequested = false;
      const state = stateRef.current;
      try {
        let c = compiled;
        const puppet = state.script?.gen?.puppet;
        const selectedPack = MOTION_PACK.PRESETS[state.stylePreset || PUPPET_STYLE_DEFAULT] || (Object.values(MOTION_PACK.PRESETS).includes(state.stylePreset || MR.MOTION_TEXT_EMPTY) ? state.stylePreset : undefined);
        const rebuildPack = !!puppet && (puppet.illustrationVersion !== MOTION_ILLUSTRATION.VERSION || (!!selectedPack && (!puppet.pack || puppet.styleId !== selectedPack)));
        if (state.script?.gen && puppet && state.script.gen.characterMotion !== state.characterMotion) patch({ script: { ...state.script, gen: { ...state.script.gen, characterMotion: state.characterMotion } } });
        const sourceLines = state.script && state.analysis ? collectPuppetLines(state.script, MR.MOTION_TEXT_SCENE, motionNarratorCastKey(state.analysis)) : [];
        if (state.visualSettings.mode === RT_SHARED.REMOTION) {
          if (!state.script || !state.analysis) return;
          const rebuilt = await buildScenes({}, state.script, state.analysis);
          if (!rebuilt || rebuilt.gen?.failed?.length) return;
          c = await compile(rebuilt);
        } else if (
          state.script &&
          state.analysis &&
          (!puppet ||
            rebuildPack ||
            puppet.version !== PUPPET.VERSION ||
            puppet.blockingVersion !== MOTION_BLOCKING.VERSION ||
            puppet.effectsVersion !== MOTION_EFFECTS.VERSION ||
            puppet.visualContractVersion !== MOTION_VISUAL_CONTRACT.VERSION ||
            puppet.visualInputKey !== puppetVisualInputKey(sourceLines) ||
            !puppetStoryboardCovers(puppet.storyboard, sourceLines) ||
            puppet.storyboard?.inputKey !== puppetStoryboardInputKey(sourceLines, state.analysis) ||
            Object.keys(puppet.visualIssues || {}).length > 0 ||
            (state.sfx && state.script.gen?.soundPlanVersion !== MOTION_SOUND_CONFIG.VERSION))
        ) {
          const rebuilt = await buildScenes(rebuildPack ? { restart: true } : {});
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
        if (!stateRef.current.uploadedAudio && (c.voiceStale || !stateRef.current.voice || stateRef.current.voice.provider !== MOTION_VOICE.PROVIDER || stateRef.current.voice.signature !== narrationSignature(stateRef.current.script, stateRef.current.analysis))) {
          if (!(await generateVoice())) return;
          c = await compile();
          if (!c?.audioPreviewId) return;
        }
        if (c.missing.length) {
          toast.warning(MOTION_TEMPLATE_CANH_CHUA_DUNG_DUOC_BAM_DUNG_TIEP(String(c.missing.length)));
          return;
        }
        if (flowCancelled.current || stateRef.current.automationPaused) return;
        logMotionActivity(MOTION_ACTIVITY_PREFIX.render, WORKFLOW_ACTIVITY_CONFIG.EVENT_SUFFIX.start);
        renderRequested = true;
        const exportState = stateRef.current;
        const exportSignature = motionRenderStateKey(exportState);
        const { job } = await motionRequest<{ job: MotionJobState }>(API_ROUTES.MOTION_VIDEO_RENDER, {
          spec: isRemotionSpec(c.spec) ? c.spec : { ...c.spec, gen: c.spec.gen ? { ...c.spec.gen, characterMotion: state.characterMotion } : undefined },
          options: {
            quality: exportState.quality,
            aspect: exportState.aspect,
            fps: exportState.fps,
            encoder: isRemotionSpec(c.spec) ? MotionEncoderPreference.CPU : exportState.encoder,
            title: state.analysis?.title || state.script?.title || MOTION_TEXT_MOTION,
            audioId,
            mixedAudioId: c.audioPreviewId,
            sfxId: state.sfx ? c.sfxId : undefined,
            audioVolume: 1,
            sfxVolume: state.sfxVolume,
            music: exportState.musicMood === MOTION_MUSIC.OFF ? undefined : { mood: exportState.musicMood || MOTION_MUSIC.AUTO, volume: exportState.musicVolume ?? MOTION_MUSIC.DEFAULT_VOLUME },
            sfx: state.sfx ? { cues: c.sfxCues, mood: state.analysis?.sfxMood || state.analysis?.genre || MOTION_TEXT_DARK } : undefined,
          },
        });
        setRenderJob(job);
        patch({ activeRenderJobId: job.id, renderSignature: exportSignature });
        if (flowCancelled.current || stateRef.current.automationPaused) await motionRequest(API_ROUTES.MOTION_VIDEO_CANCEL, { jobId: job.id }).catch(reportStoryError);
        void followRender(job.id);
      } catch (e: any) {
        if (renderRequested) logMotionActivity(MOTION_ACTIVITY_PREFIX.render, WORKFLOW_ACTIVITY_CONFIG.EVENT_SUFFIX.fail, getMotionErrorMessage(e));
        toast.error(e?.message);
      }
    });
  }, [inFlow, compiled, compile, buildScenes, generateVoice, state.characterMotion, state.renderBehavior, state.quality, state.aspect, state.fps, state.encoder, state.analysis, state.script, state.sfx, state.sfxVolume, audioId, followRender, patch, resumeAutomation]);
  const setParts = useCallback(
    (parts: number) => {
      const current = stateRef.current;
      const full = current.series?.analysis || current.analysis;
      if (full && !current.script && (!current.series || current.series.index === 0)) patch({ parts, ...seriesState(full, parts, current.language, current.look) });
      else patch({ parts });
    },
    [patch],
  );
  const continuePart = useCallback(async () => {
    const current = stateRef.current;
    const series = current.series;
    if (!series || series.index + 1 >= series.parts.length) return;
    const index = series.index + 1;
    const analysis = motionPartAnalysis(series.analysis, series.parts, index, current.language);
    const done = _.some(series.done, { index: series.index }) ? series.done : [...series.done, { index: series.index, title: current.analysis?.title || series.analysis.title }];
    const carryGen = motionCarryGen(current.script?.gen) || series.carryGen;
    patch({ ...analyzedState(analysis, current.look), series: { ...series, index, done, carryGen } });
    setCompiled(null);
    setRenderJob(null);
    await startProduction({ analysis, series: { ...series, index, done, carryGen }, carryGen });
  }, [patch, startProduction]);
  const cancelRender = useCallback(async () => {
    pauseAutomation();
    await motionRequest(API_ROUTES.MOTION_VIDEO_CANCEL, { jobId: renderJob?.id }).catch(reportStoryError);
  }, [renderJob, pauseAutomation]);
  const deleteResult = useCallback(
    async (id: string): Promise<number> => {
      const r = await loggedMotionAction(MOTION_ACTIVITY_PREFIX.delete, () => motionRequest<{ freedBytes?: number }>(MOTION_TEMPLATE_SYMBOL_4(String(API_ROUTES.MOTION_VIDEO_RESULTS), String(id)), undefined, MOTION_TEXT_DELETE));
      setResults((rs) => _.reject(rs, { id }));
      setRenderJob((job) => (job?.result?.id === id ? null : job));
      patch({ ...(stateRef.current.lastRenderJobId === id ? { lastRenderJobId: null } : {}), visualDrafts: forgetMotionVisualDraftResults(stateRef.current.visualDrafts, id) });
      return _.toNumber(r.freedBytes) || 0;
    },
    [patch],
  );
  const scanJunk = useCallback(async (): Promise<StorageJunkReport> => (await motionRequest<{ report: StorageJunkReport }>(API_ROUTES.MOTION_STORAGE_JUNK)).report, []);
  const cleanJunk = useCallback(async (groups: string[]): Promise<StorageCleanResult> => loggedMotionAction(MOTION_ACTIVITY_PREFIX.clean, () => motionRequest<StorageCleanResult>(API_ROUTES.MOTION_STORAGE_CLEAN, { groups })), []);
  const deleteAllResults = useCallback(async (): Promise<number> => {
    const r = await loggedMotionAction(MOTION_ACTIVITY_PREFIX.delete, () => motionRequest<{ freedBytes?: number }>(API_ROUTES.MOTION_VIDEO_RESULTS, undefined, MOTION_TEXT_DELETE));
    setResults([]);
    setRenderJob((job) => (job?.status === MotionJobStatus.COMPLETED ? null : job));
    patch({ lastRenderJobId: null, visualDrafts: forgetMotionVisualDraftResults(stateRef.current.visualDrafts) });
    return _.toNumber(r.freedBytes) || 0;
  }, [patch]);
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
  const storyBusy = storyJobBusy || flowCount > 0 || (!!state.activeStoryJobId && (!storyJob || storyJob.id !== state.activeStoryJobId));
  const busy = storyBusy || renderBusy;
  const voiceAttempt = useRef<{ signature: string; count: number }>({ signature: MR.MOTION_TEXT_EMPTY, count: 0 });
  useEffect(() => {
    if (voiceValid) {
      voiceRequested.current = MR.MOTION_TEXT_EMPTY;
      return;
    }
    if (!hydrated || storyBusy || renderBusy || state.automationPaused || flowCancelled.current || state.uploadedAudio || voiceValid || !state.script?.beats?.length) return;
    if (!state.script.gen?.puppet) return;
    const signature = narrationSignature(state.script, state.analysis);
    if (voiceRequested.current !== signature) return;
    if (state.voiceHold === signature) return;
    if (voiceAttempt.current.signature !== signature) voiceAttempt.current = { signature, count: 0 };
    if (voiceAttempt.current.count >= MOTION_VOICE.AUTO_ATTEMPTS) return;
    const timer = setTimeout(
      () => {
        if (stateRef.current.automationPaused || flowCancelled.current || flowDepth.current || voiceRequested.current !== signature || narrationSignature(stateRef.current.script, stateRef.current.analysis) !== signature) return;
        voiceAttempt.current.count++;
        void generateVoice();
      },
      voiceAttempt.current.count ? MOTION_VOICE.RETRY_DELAY : MOTION_VOICE.AUTO_DELAY,
    );
    return () => clearTimeout(timer);
  }, [hydrated, storyBusy, renderBusy, state.automationPaused, state.uploadedAudio, voiceValid, state.script, state.analysis, state.voiceHold, voiceError, generateVoice, voiceRequestVersion]);
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
    audioPreparing: !state.automationPaused && !!state.script?.beats.length && ((!state.uploadedAudio && !voiceValid) || compiled?.compilationKey !== compileStateKey(state) || !compiled?.audioPreviewId) && !voiceError && !compileError,
    previewVideoUrl: renderJob?.status === MotionJobStatus.COMPLETED && compiled?.compilationKey === compileStateKey(state) && state.renderSignature === motionRenderStateKey(state) ? renderJob.result?.videoUrl : undefined,
    audioId,
    previewAudioId: compiled?.compilationKey === compileStateKey(state) ? (compiled.voiceStale ? undefined : compiled.audioPreviewId || audioId) : audioId,
    parseSource,
    analyze,
    resumeProduction,
    writeScript,
    buildScenes,
    compile,
    generateSeo,
    generateThumbnail,
    cancelStory,
    check,
    render,
    continuePart,
    setParts,
    cancelRender,
    deleteResult,
    deleteAllResults,
    scanJunk,
    cleanJunk,
    saveResult,
    loadDemo,
    seedKit,
  };
}
export type MotionStudio = ReturnType<typeof useMotionStudio>;
