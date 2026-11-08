import { MOTION_PRODUCTION as P } from "../constants/motionProduction.js";
import type { MotionChapterDraft, MotionStoryAnalysis, MotionStoryScript, MotionVoiceTrack } from "../types/motionVideo.js";
import type { MotionRemotionState } from "../types/motionVisual.js";
import { motionChapterPending } from "./motionChapterRepair.js";
import { motionHtmlPlanCurrent, motionHtmlPlanSource } from "./motionHtmlScene.js";
import { motionVisualBeatGroups } from "./motionScenePacing.js";
import { motionVisualSettingsFor } from "./motionVisual.js";
import { MOTION_VOICE } from "../constants/motionVoice.js";
export const assertMotionProductionMode = (input: Record<string, any>): void => {
  const modes = [input.drawingMode, input.settings?.drawingMode, input.analysis?.videoDna?.settings?.drawingMode, input.script?.gen?.drawingMode].filter(Boolean);
  if (modes.some((mode) => mode !== P.DRAWING_MODE)) throw new Error(P.MODE_UNSUPPORTED);
};
export const missingMotionChapters = (script: MotionStoryScript | null | undefined, analysis: MotionStoryAnalysis | null | undefined) => (Array.isArray(analysis?.chapters) ? analysis.chapters : []).filter((chapter) => !Array.isArray(script?.beats) || !script.beats.some((beat) => beat?.chapterId === chapter.id && typeof beat.narration === "string" && beat.narration.trim()));
export const assertMotionScriptComplete = (script: MotionStoryScript, analysis: MotionStoryAnalysis | null | undefined): void => {
  if (!Array.isArray(script?.beats) || script.beats.some((beat) => !beat || typeof beat !== "object" || typeof beat.id !== "string" || typeof beat.narration !== "string" || (beat.utterances !== undefined && !Array.isArray(beat.utterances)))) throw new Error(P.SCRIPT_INVALID([P.STAGES.SCRIPT]));
  const missing = missingMotionChapters(script, analysis);
  if (missing.length) throw new Error(P.MISSING_CHAPTERS(missing.map((chapter) => chapter.title || chapter.id).join(P.SEPARATOR)));
  const ids = new Set<string>();
  const chapters = new Set(analysis?.chapters?.map((chapter) => chapter.id) || []);
  const cast = new Set([MOTION_VOICE.NARRATOR, ...(analysis?.cast || []).map((character) => character.key)]);
  const errors: string[] = [];
  for (const beat of script.beats || []) {
    if (!beat?.id || ids.has(beat.id) || !beat.narration?.trim() || (chapters.size && !chapters.has(beat.chapterId))) errors.push(beat?.id || P.STAGES.SCRIPT);
    ids.add(beat?.id);
    if (motionChapterPending([beat], undefined, undefined, false, script.voiceSettings?.multiVoice !== false).length || beat.utterances?.some((line) => typeof line?.text !== "string" || !line.text.trim() || !cast.has(line.speaker))) errors.push(beat.id);
  }
  const pending = (draft: MotionChapterDraft): boolean => !!draft.pending?.length || Object.values(draft.parts || {}).some(pending);
  for (const [chapter, draft] of Object.entries(script.chapterDrafts || {})) if (!draft || pending(draft)) errors.push(chapter);
  for (const chapter of analysis?.chapters || []) {
    const rows = script.beats.filter((beat) => beat.chapterId === chapter.id);
    if ((chapter.targetSeconds || 0) >= P.SCRIPT_MIN_CHAPTER_SECONDS && rows.reduce((sum, beat) => sum + beat.narration.trim().split(/\s+/u).length, 0) < chapter.targetSeconds! * P.SCRIPT_MIN_UNITS_PER_SECOND) errors.push(chapter.id);
  }
  if (!script.beats?.length || errors.length) throw new Error(P.SCRIPT_INVALID([...new Set(errors)]));
};
export const motionDurationRepairChapters = (script: MotionStoryScript, analysis: MotionStoryAnalysis, voice: MotionVoiceTrack, tolerance: number = P.DURATION_TOLERANCE): string[] => {
  const target = analysis.chapters.reduce((sum, chapter) => sum + (chapter.targetSeconds || 0), 0);
  let difference = voice.totalSeconds - target;
  if (!target || Math.abs(difference) <= target * tolerance) return [];
  const direction = Math.sign(difference);
  const measured = voice.durations?.reduce((sum, duration) => sum + (Number.isFinite(duration) ? duration : 0), 0) || 0;
  const rows = analysis.chapters
    .map((chapter) => {
      const actual = measured > 0 ? script.beats.reduce((sum, beat, index) => sum + (beat.chapterId === chapter.id ? ((voice.durations[index] || 0) * voice.totalSeconds) / measured : 0), 0) : (voice.totalSeconds * (chapter.targetSeconds || 0)) / target;
      return { id: chapter.id, delta: actual - (chapter.targetSeconds || 0) };
    })
    .filter((row) => row.delta * direction > 0)
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
  const selected = new Set<string>();
  for (const row of rows) {
    if (Math.abs(difference) <= target * tolerance) break;
    selected.add(row.id);
    difference -= row.delta;
  }
  return analysis.chapters.filter((chapter) => selected.has(chapter.id)).map((chapter) => chapter.id);
};
export interface MotionEarlySceneInput {
  key: string;
  ready: number;
  total: number;
  script: MotionStoryScript;
  analysis: MotionStoryAnalysis;
}
export const motionEarlySceneInput = (script: MotionStoryScript | undefined, analysis: MotionStoryAnalysis | undefined): MotionEarlySceneInput | undefined => {
  if (!script?.readyChapterIds?.length || !analysis?.chapters?.length) return undefined;
  const ready = new Set(script.readyChapterIds);
  const prefix: MotionStoryAnalysis["chapters"] = [];
  for (const chapter of analysis.chapters) {
    if (!ready.has(chapter.id) || !script.beats.some((beat) => beat.chapterId === chapter.id && beat.narration?.trim())) break;
    prefix.push(chapter);
  }
  if (!prefix.length || prefix.length >= analysis.chapters.length) return undefined;
  const ids = new Set(prefix.map((chapter) => chapter.id));
  return { key: prefix.map((chapter) => chapter.id).join(P.EARLY_SCENES.KEY_SEPARATOR), ready: prefix.length, total: analysis.chapters.length, script: { ...script, readyChapterIds: undefined, chapterDrafts: undefined, beats: script.beats.filter((beat) => ids.has(beat.chapterId)) }, analysis: { ...analysis, chapters: prefix } };
};
export const motionEarlyHtmlSceneInput = (script: MotionStoryScript | undefined, analysis: MotionStoryAnalysis | undefined): MotionEarlySceneInput | undefined => {
  if (!script?.beats?.length || !analysis?.chapters?.length) return undefined;
  const state = script.gen?.remotion;
  if (state?.renderer !== "html-canvas") return motionEarlySceneInput(script, analysis);
  const pendingDraft = (draft: MotionChapterDraft): boolean => !!draft.pending?.length || Object.values(draft.parts || {}).some(pendingDraft);
  const allChaptersWritten = missingMotionChapters(script, analysis).length === 0 && !Object.values(script.chapterDrafts || {}).some((draft) => draft && pendingDraft(draft));
  if (allChaptersWritten && motionHtmlPlanCurrent(script, analysis)) return undefined;
  const settings = motionVisualSettingsFor({ analysis, script });
  const groups = motionVisualBeatGroups(script, 1001, settings.pacing);
  const plannedGroups: typeof groups = [];
  const blockedChapters = new Set<string>();
  for (const group of groups) {
    const chapterId = group.beats[0]?.chapterId;
    if (!chapterId || blockedChapters.has(chapterId)) continue;
    const isPlanned = !!state.scenes[group.id]?.length && state.htmlPlanSources?.[group.id] === motionHtmlPlanSource(group.beats, analysis, settings, state.notes?.[group.id] || undefined, state.htmlSfx !== false);
    if (isPlanned) plannedGroups.push(group);
    else blockedChapters.add(chapterId);
  }
  if (!plannedGroups.length) return undefined;
  const plannedBeats = plannedGroups.flatMap((group) => group.beats);
  const chapterIds = new Set(plannedBeats.map((beat) => beat.chapterId));
  const chapters = analysis.chapters.filter((chapter) => chapterIds.has(chapter.id)).map((chapter) => ({ ...chapter, targetSeconds: 1 }));
  if (!chapters.length) return undefined;
  return {
    key: plannedGroups.map((group) => group.id).join(P.EARLY_SCENES.KEY_SEPARATOR),
    ready: chapters.length,
    total: analysis.chapters.length,
    script: { ...script, readyChapterIds: undefined, chapterDrafts: undefined, beats: plannedBeats },
    analysis: { ...analysis, chapters },
  };
};
export const mergeMotionRemotionState = (base: MotionRemotionState | undefined, incoming: MotionRemotionState | undefined): MotionRemotionState | undefined => {
  if (!incoming) return base;
  if (!base) return structuredClone(incoming);
  if (base.renderer === "html-canvas" || incoming.renderer === "html-canvas") {
    const merged: MotionRemotionState = structuredClone(base.renderer === "html-canvas" ? base : incoming);
    const other = base.renderer === "html-canvas" ? incoming : base;
    merged.updatedAt = Math.max(base.updatedAt || 0, incoming.updatedAt || 0);
    merged.scenes ||= {};
    merged.inputKeys ||= {};
    merged.htmlPlanSources ||= {};
    merged.notes ||= {};
    for (const [groupId, scenes] of Object.entries(other.scenes || {})) {
      if (!merged.scenes[groupId]?.length && scenes?.length) {
        merged.scenes[groupId] = structuredClone(scenes);
      } else if (merged.scenes[groupId]?.length && scenes?.length) {
        const byId = new Map(scenes.map((scene) => [scene.id, scene]));
        merged.scenes[groupId] = merged.scenes[groupId].map((target) => {
          const match = byId.get(target.id);
          if (!match) return target;
          if (!target.html && match.html) return { ...target, html: structuredClone(match.html), htmlRequest: structuredClone(match.htmlRequest), build: structuredClone(match.build) };
          if (target.html && match.html && (match.html.status === "ready" || match.html.status === "rendered") && target.html.status !== "ready" && target.html.status !== "rendered") {
            return { ...target, html: structuredClone(match.html), htmlRequest: structuredClone(match.htmlRequest), build: structuredClone(match.build) };
          }
          return target;
        });
      }
      if (!merged.inputKeys[groupId] && other.inputKeys?.[groupId]) merged.inputKeys[groupId] = other.inputKeys[groupId];
      if (!merged.htmlPlanSources[groupId] && other.htmlPlanSources?.[groupId]) merged.htmlPlanSources[groupId] = other.htmlPlanSources[groupId];
      if (!merged.notes[groupId] && other.notes?.[groupId]) merged.notes[groupId] = other.notes[groupId];
    }
    return merged;
  }
  return (incoming.updatedAt || 0) >= (base.updatedAt || 0) ? structuredClone(incoming) : base;
};
