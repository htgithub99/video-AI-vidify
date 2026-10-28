import { MOTION_VISUAL as V } from "../constants/motionVisual.js";
import { MOTION_TEXT_EMPTY } from "../constants/motionRuntime.js";
import { stringifyJson } from "./jsonStringify.js";
import { normalizeMotionVisualSettings } from "./motionVisual.js";
import { motionRenderBehaviorFor } from "./motionRenderBehavior.js";
import { MotionJobStatus, type MotionStoryAnalysis, type MotionStoryScript, type MotionCompiledPreview, type MotionJobState, type MotionThumbnail, type MotionProductionResult } from "../types/motionVideo.js";
import type { MotionVisualSettings } from "../types/motionVisual.js";
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
export const hasMotionVisualDraft = (state: VisualDraftContext) => (state.visualSettings.mode === "remotion" ? !!Object.values(state.script?.gen?.remotion?.scenes || {}).some((scenes) => scenes.length) : !!state.script?.gen && (!!state.script.gen.puppet || Object.keys(state.script.gen.cast || {}).length > 0 || Object.keys(state.script.gen.locations || {}).length > 0));
export const motionVisualDraftKey = (settings: MotionVisualSettings) => stringifyJson(normalizeMotionVisualSettings(settings));
export const motionCompileStateKey = (state: object) => {
  const fields = state as Record<string, unknown>;
  return stringifyJson(V.DRAFT_COMPILE_FIELDS.map((key) => (key === "subtitles" ? fields[key] !== false : key === "stylePreset" && (fields.visualSettings as MotionVisualSettings)?.mode === "remotion" ? undefined : fields[key])));
};
export const motionRenderStateKey = (state: object) => {
  const fields = state as Record<string, unknown>;
  return stringifyJson([motionCompileStateKey(state), fields.quality, fields.encoder, fields.musicMood, fields.musicVolume]);
};
export const motionVisualDraftContextKey = (state: Pick<VisualDraftContext, "analysis" | "script">) => {
  const analysis = state.analysis && { ...state.analysis, visualSettings: undefined, stylePreset: undefined, illustrationNeeds: undefined, illustrationCoverage: undefined };
  return stringifyJson([analysis, state.script && { title: state.script.title, language: state.script.language, beats: state.script.beats }]);
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
export const motionVisualDraftRuntime = (state: VisualDraftContext, draft?: MotionVisualDraft) => {
  const compiled = draft?.contextKey === motionVisualDraftContextKey(state) && draft.compiled?.compilationKey === motionCompileStateKey(state) ? draft.compiled : null;
  return { compiled, renderJob: compiled && draft?.renderSignature === motionRenderStateKey(state) ? draft.renderJob || null : null };
};
export const forgetMotionVisualDraftResults = (drafts: Record<string, MotionVisualDraft> | undefined, id?: string) => Object.fromEntries(Object.entries(drafts || {}).map(([key, draft]) => [key, !id || draft.lastRenderJobId === id || draft.renderJob?.id === id || draft.renderJob?.result?.id === id ? { ...draft, renderJob: null, lastRenderJobId: null, renderSignature: undefined } : draft]));
export const switchMotionVisualDraft = <T extends VisualDraftContext>(state: T, requested: MotionVisualSettings, runtime: Pick<MotionVisualDraft, "compiled" | "renderJob"> = {}) => {
  const settings = normalizeMotionVisualSettings(requested, state.stylePreset);
  const drafts = { ...state.visualDrafts, [motionVisualDraftKey(state.visualSettings)]: captureMotionVisualDraft(state, runtime) };
  const saved = drafts[motionVisualDraftKey(settings)];
  const target = saved?.contextKey === motionVisualDraftContextKey(state) ? saved : undefined;
  const pacingOnly = stringifyJson({ ...state.visualSettings, pacing: undefined }) === stringifyJson({ ...settings, pacing: undefined });
  const next = {
    ...state,
    visualSettings: settings,
    visualDrafts: drafts,
    ...(settings.mode === "remotion" ? { remotionProfile: settings.profileId } : { stylePreset: settings.packId }),
    analysis: target ? target.analysis : state.analysis && { ...state.analysis, visualSettings: settings, stylePreset: settings.mode === "library" ? settings.packId : undefined, ...(pacingOnly ? {} : { illustrationNeeds: undefined, illustrationCoverage: undefined }) },
    script: state.script && { ...state.script, visualSettings: target ? target.scriptSettings : settings, gen: target?.gen || (pacingOnly ? state.script.gen : undefined) },
    thumbnail: target?.thumbnail || null,
    thumbnails: target?.thumbnails || {},
    productionId: target?.productionId,
    editorialSessionId: target?.editorialSessionId || state.editorialSessionId,
    activeStoryRunId: undefined,
    activeStoryJobId: MOTION_TEXT_EMPTY,
    activeRenderJobId: MOTION_TEXT_EMPTY,
    lastRenderJobId: target?.lastRenderJobId || null,
    renderSignature: target?.renderSignature,
    automationPaused: true,
  } as T;
  const restored = motionVisualDraftRuntime(next, target);
  if (!restored.renderJob) next.lastRenderJobId = null;
  return { state: next, ...restored };
};
export const recoverMotionVisualDraft = <T extends VisualDraftContext>(state: T, result: MotionProductionResult) => {
  const script = result.script;
  const analysis = result.analysis || state.analysis;
  if (!script?.gen || !state.script || !analysis) return null;
  const settings = normalizeMotionVisualSettings(script.visualSettings || analysis.visualSettings, analysis.stylePreset);
  if (motionVisualDraftKey(settings) !== motionVisualDraftKey(state.visualSettings) || motionVisualDraftContextKey({ script, analysis }) !== motionVisualDraftContextKey(state)) return null;
  const next = { ...state, analysis, script: { ...state.script, gen: script.gen, visualSettings: script.visualSettings } };
  const candidate = result.compiled;
  const spec = candidate?.spec;
  const audioCompatible = !state.uploadedAudio && state.voice?.audioId === result.voice?.audioId && stringifyJson(state.voice?.durations) === stringifyJson(result.voice?.durations) && state.script.voiceChannel === script.voiceChannel;
  const compatible = audioCompatible && spec && spec.aspect === state.aspect && spec.fps === state.fps && !!spec.subtitles?.length === (state.subtitles !== false) && stringifyJson(motionRenderBehaviorFor(spec)) === stringifyJson(motionRenderBehaviorFor(state));
  const compiled = compatible ? { ...candidate, compilationKey: motionCompileStateKey(next) } : null;
  const item = result.rendered;
  const renderCompatible = !result.renderSettings || motionRenderStateKey({ ...next, ...result.renderSettings }) === motionRenderStateKey(next);
  const renderJob: MotionJobState | null = compiled && item && renderCompatible ? { id: item.id, status: MotionJobStatus.COMPLETED, progress: 1, framesDone: 0, framesTotal: 0, startedAt: 0, log: [], result: item } : null;
  if (renderJob) {
    next.lastRenderJobId = item!.id;
    next.renderSignature = motionRenderStateKey(next);
  }
  return { state: next, compiled, renderJob };
};
