import { MOTION_PRODUCTION as P } from "../constants/motionProduction.js";
import type { MotionChapterDraft, MotionStoryAnalysis, MotionStoryScript, MotionVoiceTrack } from "../types/motionVideo.js";
import { motionChapterPending } from "./motionChapterRepair.js";
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
    if (motionChapterPending([beat]).length || beat.utterances?.some((line) => typeof line?.text !== "string" || !line.text.trim() || !cast.has(line.speaker))) errors.push(beat.id);
  }
  const pending = (draft: MotionChapterDraft): boolean => !!draft.pending?.length || Object.values(draft.parts || {}).some(pending);
  for (const [chapter, draft] of Object.entries(script.chapterDrafts || {})) if (!draft || pending(draft)) errors.push(chapter);
  for (const chapter of analysis?.chapters || []) {
    const rows = script.beats.filter((beat) => beat.chapterId === chapter.id);
    if ((chapter.targetSeconds || 0) >= P.SCRIPT_MIN_CHAPTER_SECONDS && rows.reduce((sum, beat) => sum + beat.narration.trim().split(/\s+/u).length, 0) < chapter.targetSeconds! * P.SCRIPT_MIN_UNITS_PER_SECOND) errors.push(chapter.id);
  }
  if (!script.beats?.length || errors.length) throw new Error(P.SCRIPT_INVALID([...new Set(errors)]));
};
export const motionDurationRepairChapters = (script: MotionStoryScript, analysis: MotionStoryAnalysis, voice: MotionVoiceTrack): string[] => {
  const target = analysis.chapters.reduce((sum, chapter) => sum + (chapter.targetSeconds || 0), 0);
  let difference = voice.totalSeconds - target;
  if (!target || Math.abs(difference) <= target * P.DURATION_TOLERANCE) return [];
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
    if (Math.abs(difference) <= target * P.DURATION_TOLERANCE) break;
    selected.add(row.id);
    difference -= row.delta;
  }
  return analysis.chapters.filter((chapter) => selected.has(chapter.id)).map((chapter) => chapter.id);
};
