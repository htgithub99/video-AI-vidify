import * as RT_MAINTENANCE from "../../../constants/runtime/maintenance.js";
import { RUNTIME_TEXT as RT_SHARED } from "../../../constants/runtime/shared.js";
import { RUNTIME_TEXT as RT_MOTION } from "../constants/runtimeText.js";
import { MOTION_VISUAL as V } from "../../../constants/motionVisual.js";
import { MOTION_TEXT_EMPTY } from "../../../constants/motionRuntime.js";
import { stringifyJson } from "../../../lib/jsonStringify.js";
import { cachedJson, hashJson, hashText } from "../../../lib/cachedJson.js";
import { normalizeMotionVisualSettings, motionPlanSettings, motionVisualSettingsFor } from "../../../lib/motionVisual.js";
import { motionVoiceSignature, motionVoiceAsrSatisfied } from "../../../lib/motionVoice.js";
import { motionEffectiveEncoder } from "../../../lib/motionOutputSettings.js";
import { MOTION_CAMERA_REVISION } from "../../../lib/motionCamera.js";
import { MotionJobStatus, type MotionStoryAnalysis, type MotionStoryScript, type MotionCompiledPreview, type MotionJobState, type MotionThumbnail, type MotionProductionResult, type MotionResultItem } from "../../../types/motionVideo.js";
import type { MotionVisualSettings } from "../../../types/motionVisual.js";
import { isMotionJobTerminal } from "./motionJob.js";
export interface MotionVisualDraft {
  contextKey: string;
  analysis: MotionStoryAnalysis | null;
  gen: MotionStoryScript["gen"];
  scriptSettings?: MotionVisualSettings;
  thumbnail?: MotionThumbnail | null;
  thumbnails?: Record<number, MotionThumbnail>;
  productionId?: string;
  editorialSessionId?: string;
  compiled?: MotionCompiledPreview | null;
  renderJob?: MotionJobState | null;
  lastRenderJobId?: string | null;
  renderSignature?: string;
}
interface VisualDraftContext {
  visualSettings: MotionVisualSettings;
  visualDrafts?: Record<string, MotionVisualDraft>;
  stylePreset?: string;
  remotionProfile?: string;
  analysis: MotionStoryAnalysis | null;
  script: MotionStoryScript | null;
  thumbnail?: MotionThumbnail | null;
  thumbnails?: Record<number, MotionThumbnail>;
  productionId?: string;
  editorialSessionId?: string;
  lastRenderJobId?: string | null;
  renderSignature?: string;
  aspect?: string;
  fps?: number;
  subtitles?: boolean;
  voice?: MotionStoryScript["voiceTrack"] | null;
  uploadedAudio?: { id: string } | null;
}
export const hasMotionVisualDraft = (state: VisualDraftContext) => !!Object.values(state.script?.gen?.remotion?.scenes || {}).some((scenes) => scenes.length);
export const motionVisualDraftKey = (settings: MotionVisualSettings) => stringifyJson(motionPlanSettings(normalizeMotionVisualSettings(settings)));
const compileKeys: { inputs: unknown[]; key: string }[] = [];
export const motionCompileStateKey = (state: object) => {
  const fields = state as Record<string, unknown>;
  const inputs = [...V.DRAFT_COMPILE_FIELDS.map((key) => fields[key]), fields.asrCheck, fields.videoGenre];
  const hit = compileKeys.find((entry) => entry.inputs.every((value, index) => value === inputs[index]));
  if (hit) return hit.key;
  const key = hashJson([
    ...V.DRAFT_COMPILE_FIELDS.map((key) => (key === RT_MAINTENANCE.VISUALSETTINGS ? motionVisualSettingsFor(fields) : key === RT_MOTION.SUBTITLES ? fields[key] !== false : key === RT_MOTION.STYLEPRESET && (fields.visualSettings as MotionVisualSettings)?.mode === RT_SHARED.REMOTION ? undefined : fields[key])),
    motionVoiceAsrSatisfied(fields.voice as MotionStoryScript["voiceTrack"], fields.asrCheck === true && !fields.uploadedAudio),
  ]);
  compileKeys.unshift({ inputs, key });
  compileKeys.length = Math.min(compileKeys.length, V.COMPILE_KEY_SLOTS);
  return key;
};
export const motionRenderStateKey = (state: object) => {
  const fields = state as Record<string, unknown>;
  return hashJson([MOTION_CAMERA_REVISION, motionCompileStateKey(state), fields.quality, motionEffectiveEncoder(fields), fields.musicMood, fields.musicVolume]);
};
const legacyKey = (key: unknown): key is string => typeof key === V.KEY_TYPE && (key as string).length > V.HASHED_KEY_MAX;
export const migrateMotionCompileKey = <T>(key: T): T => (legacyKey(key) ? (hashText(key) as T) : key);
export const migrateMotionRenderKey = <T>(key: T): T => {
  if (!legacyKey(key)) return key;
  const parts = JSON.parse(key) as unknown[];
  parts[1] = migrateMotionCompileKey(parts[1]);
  return hashText(JSON.stringify(parts)) as T;
};
export const migrateMotionVisualDraft = (draft: MotionVisualDraft): MotionVisualDraft => ({
  ...draft,
  renderSignature: migrateMotionRenderKey(draft.renderSignature),
  compiled: draft.compiled && { ...draft.compiled, compilationKey: migrateMotionCompileKey(draft.compiled.compilationKey) },
});
export const motionProductionOutputKeys = (state: object, result: MotionProductionResult) => {
  if (!result.outputSettings || result.outputSettings.version !== 1) return null;
  if (!motionVoiceAsrSatisfied(result.voice, result.outputSettings.asrCheck)) return null;
  const output = { ...state, ...result.outputSettings, analysis: result.analysis || (state as VisualDraftContext).analysis, script: result.script || (state as VisualDraftContext).script, voice: result.voice || null, uploadedAudio: null };
  return { compilationKey: motionCompileStateKey(output), renderSignature: motionRenderStateKey(output) };
};
export const motionRenderedPreview = (state: { lastRenderJobId?: string | null; renderSignature?: string }, job?: MotionJobState | null, saved: readonly MotionResultItem[] = []) => {
  const result = job?.status === MotionJobStatus.COMPLETED ? job.result : undefined;
  const current = result?.videoUrl && state.lastRenderJobId !== null && (!state.lastRenderJobId || state.lastRenderJobId === result.id) ? result.videoUrl : undefined;
  const stored = !current && (!job || isMotionJobTerminal(job.status)) && state.lastRenderJobId ? saved.find((item) => item.id === state.lastRenderJobId) : undefined;
  const videoUrl = current || stored?.videoUrl;
  return { videoUrl, result: videoUrl ? (current ? result : stored) : undefined, stale: !!videoUrl && (!state.renderSignature || state.renderSignature !== motionRenderStateKey(state)) };
};
export const motionVisualDraftContextKey = (state: Pick<VisualDraftContext, "analysis" | "script">) => {
  const analysis = state.analysis && { ...state.analysis, visualSettings: undefined, stylePreset: undefined };
  return cachedJson([analysis, state.script && { title: state.script.title, language: state.script.language, beats: state.script.beats }]);
};
export const captureMotionVisualDraft = (state: VisualDraftContext, runtime: Pick<MotionVisualDraft, "compiled" | "renderJob"> = {}): MotionVisualDraft => ({
  contextKey: motionVisualDraftContextKey(state),
  analysis: state.analysis,
  gen: state.script?.gen,
  scriptSettings: state.script?.visualSettings,
  thumbnail: state.thumbnail,
  thumbnails: state.thumbnails,
  productionId: state.productionId,
  editorialSessionId: state.editorialSessionId,
  lastRenderJobId: state.lastRenderJobId,
  renderSignature: state.renderSignature,
  ...runtime,
});
export const invalidateMotionVisualDraftOutput = (state: VisualDraftContext) => {
  const output = { renderSignature: undefined };
  return { ...output, visualDrafts: { ...state.visualDrafts, [motionVisualDraftKey(state.visualSettings)]: captureMotionVisualDraft({ ...state, ...output }, { compiled: null, renderJob: null }) } };
};
export const motionVisualDraftRuntime = (state: VisualDraftContext, draft?: MotionVisualDraft) => {
  const sameContext = draft?.contextKey === motionVisualDraftContextKey(state);
  const compiled = sameContext && draft.compiled?.compilationKey === motionCompileStateKey(state) ? draft.compiled : null;
  const savedJob = sameContext ? draft.renderJob : null;
  const exported = motionRenderedPreview(state, savedJob).videoUrl;
  return { compiled, renderJob: exported || (compiled && draft?.renderSignature === motionRenderStateKey(state)) ? savedJob || null : null };
};
export const forgetMotionVisualDraftResults = (drafts: Record<string, MotionVisualDraft> | undefined, id?: string) => Object.fromEntries(Object.entries(drafts || {}).map(([key, draft]) => [key, !id || draft.lastRenderJobId === id || draft.renderJob?.id === id || draft.renderJob?.result?.id === id ? { ...draft, renderJob: null, lastRenderJobId: null, renderSignature: undefined } : draft]));
export const switchMotionVisualDraft = <T extends VisualDraftContext>(state: T, requested: MotionVisualSettings, runtime: Pick<MotionVisualDraft, "compiled" | "renderJob"> = {}) => {
  const settings = normalizeMotionVisualSettings(requested);
  if (motionVisualDraftKey(settings) === motionVisualDraftKey(state.visualSettings) && stringifyJson(settings.pacing) === stringifyJson(state.visualSettings.pacing)) {
    const next = { ...state, visualSettings: settings, analysis: state.analysis && { ...state.analysis, visualSettings: settings }, script: state.script && { ...state.script, visualSettings: settings }, automationPaused: true } as T;
    return { state: next, ...motionVisualDraftRuntime(next, captureMotionVisualDraft(state, runtime)) };
  }
  const drafts = { ...state.visualDrafts, [motionVisualDraftKey(state.visualSettings)]: captureMotionVisualDraft(state, runtime) };
  const saved = drafts[motionVisualDraftKey(settings)];
  const target = saved?.contextKey === motionVisualDraftContextKey(state) ? saved : undefined;
  const pacingOnly = stringifyJson({ ...motionPlanSettings(state.visualSettings), pacing: undefined }) === stringifyJson({ ...motionPlanSettings(settings), pacing: undefined });
  const next = {
    ...state,
    visualSettings: settings,
    visualDrafts: drafts,
    remotionProfile: settings.profileId,
    analysis: target ? target.analysis : state.analysis && { ...state.analysis, visualSettings: settings, stylePreset: undefined,  },
    script: state.script && { ...state.script, visualSettings: target ? target.scriptSettings : settings, gen: target?.gen || (pacingOnly ? state.script.gen : undefined) },
    thumbnail: target?.thumbnail || null,
    thumbnails: target?.thumbnails || {},
    productionId: target?.productionId,
    editorialSessionId: target?.editorialSessionId || state.editorialSessionId,
    activeStoryRunId: undefined,
    activeStoryJobId: MOTION_TEXT_EMPTY,
    activeRenderJobId: MOTION_TEXT_EMPTY,
    lastRenderJobId: target?.lastRenderJobId || state.lastRenderJobId || null,
    renderSignature: target?.lastRenderJobId ? target.renderSignature : state.renderSignature,
    automationPaused: true,
  } as T;
  const restored = motionVisualDraftRuntime(next, target);
  return { state: next, ...restored };
};
export const recoverMotionVisualDraft = <T extends VisualDraftContext>(state: T, result: MotionProductionResult) => {
  const script = result.script;
  const analysis = result.analysis || state.analysis;
  if (!script?.gen || !state.script || !analysis) return null;
  const settings = normalizeMotionVisualSettings(script.visualSettings || analysis.visualSettings);
  if (motionVisualDraftKey(settings) !== motionVisualDraftKey(state.visualSettings) || motionVisualDraftContextKey({ script, analysis }) !== motionVisualDraftContextKey(state)) return null;
  const next = { ...state, analysis, script: { ...state.script, gen: script.gen, visualSettings: script.visualSettings } };
  const candidate = result.compiled;
  const spec = candidate?.spec;
  const outputKeys = motionProductionOutputKeys(next, result);
  const audioCompatible = !state.uploadedAudio && state.voice?.audioId === result.voice?.audioId && stringifyJson(state.voice?.durations) === stringifyJson(result.voice?.durations) && state.script.voiceChannel === script.voiceChannel && motionVoiceSignature(state.script, state.analysis) === motionVoiceSignature(script, analysis);
  const compatible = audioCompatible && spec && outputKeys?.compilationKey === motionCompileStateKey(next);
  const compiled = compatible ? { ...candidate, compilationKey: motionCompileStateKey(next) } : null;
  const item = result.rendered;
  const renderCompatible = outputKeys?.renderSignature === motionRenderStateKey(next);
  const renderJob: MotionJobState | null = compiled && item && renderCompatible ? { id: item.id, status: MotionJobStatus.COMPLETED, progress: 1, framesDone: 0, framesTotal: 0, startedAt: 0, log: [], result: item } : null;
  if (renderJob) {
    next.lastRenderJobId = item!.id;
    next.renderSignature = motionRenderStateKey(next);
  }
  return { state: next, compiled, renderJob };
};
