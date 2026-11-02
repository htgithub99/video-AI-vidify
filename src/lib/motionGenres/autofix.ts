import _ from "lodash";
import { MOTION_GENRE_AUTOFIX as A } from "../../constants/motionGenreAutofix.js";
import { MOTION_GENRE_VOCABULARY as X } from "../../constants/motionGenres/vocabulary.js";
import { MOTION_STORY_CONFIG } from "../../constants/motionVideo.js";
import { motionGenreSpec, motionVideoGenre } from "../../constants/motionGenre.js";
import { MOTION_GENRE_SPECS } from "../../constants/motionGenres/index.js";
import { motionLineSimilarity } from "../motionGenreReview.js";
import { motionWritingProtectedMotifs } from "../motionWriting.js";
import type { MotionBeat, MotionStoryAnalysis, MotionUtterance, MotionWritingChapter, MotionWritingPlan } from "../../types/motionVideo.js";
import { motionNarratorCastKey } from "../motionVoice.js";
const S = X.SHOTS;
const GENRE_VISUALS = new Set(Object.values(MOTION_GENRE_SPECS).flatMap((spec) => spec.GRAMMAR.visuals.filter((visual) => visual !== X.VISUALS.SCENE)));
export interface MotionGenreAutofixResult {
  beats: MotionBeat[];
  dropped: string[];
  visuals: number;
  shots: number;
  speech: number;
}
export const motionSplitReportedSpeech = (beat: MotionBeat, analysis: Pick<MotionStoryAnalysis, "cast">): MotionBeat | undefined => {
  if ((beat.utterances || []).some((line) => line.role !== A.SPEECH.NARRATION)) return undefined;
  const match = A.SPEECH.PATTERN.exec(beat.narration || "");
  const groups = match?.groups;
  if (!groups || (groups.quote.match(/\S+/g) || []).length < A.SPEECH.MIN_QUOTE_WORDS) return undefined;
  const narrator = motionNarratorCastKey(analysis as MotionStoryAnalysis);
  const speaker = analysis.cast
    .filter((member) => member.key !== narrator && !member.narrator)
    .map((member) => ({ key: member.key, at: Math.max(...[member.name, member.alias].filter((name): name is string => !!name).map((name) => groups.before.lastIndexOf(name))) }))
    .filter((entry) => entry.at >= 0)
    .sort((a, b) => b.at - a.at)[0];
  if (!speaker) return undefined;
  const base = beat.utterances?.[0];
  const line = (index: number, role: MotionUtterance["role"], who: string, text: string): MotionUtterance => ({ id: `${beat.id}_${index}`, speaker: who, role, text, emotion: base?.emotion || A.SPEECH.NEUTRAL, speed: base?.speed ?? A.SPEECH.SPEED, pauseBefore: base?.pauseBefore ?? 0, pauseAfter: base?.pauseAfter ?? 0, emphasis: [] });
  const utterances = [line(1, A.SPEECH.NARRATION, A.SPEECH.NARRATOR, groups.before.trim()), line(2, A.SPEECH.DIALOGUE, speaker.key, groups.quote.trim()), ...(groups.after.trim() ? [line(3, A.SPEECH.NARRATION, A.SPEECH.NARRATOR, groups.after.trim())] : [])];
  return { ...beat, utterances, cast: (beat.cast || []).includes(speaker.key) ? beat.cast : [...(beat.cast || []), speaker.key] };
};
export const motionGenreInferShot = (beat: MotionBeat, allowed: readonly string[]): string => {
  const pick = (...candidates: string[]): string => candidates.find((candidate) => allowed.includes(candidate)) || allowed[0] || S.MEDIUM;
  const cast = beat.cast || [];
  const text = beat.narration || "";
  if (!cast.length && !A.EMOTION.test(text)) return pick(S.ESTABLISHING, S.WIDE, S.MEDIUM);
  if (cast.length >= 3 || A.CROWD.test(text)) return pick(S.WIDE, S.MEDIUM);
  if (cast.length === 1 && A.EMOTION.test(text)) return pick(S.CLOSE, S.MEDIUM);
  return pick(S.MEDIUM, S.WIDE);
};
export const motionGenreAutofix = (beats: MotionBeat[], analysis: MotionStoryAnalysis, language: string): MotionGenreAutofixResult => {
  const spec = motionGenreSpec(analysis.videoGenre);
  const motifs = motionWritingProtectedMotifs(analysis);
  const dropped: string[] = [];
  let visuals = 0;
  let shots = 0;
  let speech = 0;
  const kept: MotionBeat[] = [];
  for (const beat of beats) {
    const previous = kept.at(-1);
    const protectedBeat = _.some(beat.utterances, (line) => _.includes(MOTION_STORY_CONFIG.EDIT_KEEP_ROLES, line.role)) || motifs.some((motif) => beat.narration.includes(motif));
    const siblings = beats.filter((other) => other.chapterId === beat.chapterId && other.id !== beat.id && !dropped.includes(other.id));
    if (previous && previous.chapterId === beat.chapterId && !protectedBeat && siblings.length && motionLineSimilarity(previous.narration, beat.narration, language) >= A.DUPLICATE.RATIO && (beat.narration.match(/\S+/g) || []).length >= A.DUPLICATE.SHARED) {
      dropped.push(beat.id);
      continue;
    }
    let next = beat;
    if (GENRE_VISUALS.has(beat.visual) && !spec.GRAMMAR.visuals.includes(beat.visual)) {
      next = { ...next, visual: X.VISUALS.SCENE };
      visuals++;
    }
    if (next.visual === X.VISUALS.SCENE && (!beat.shot || !spec.GRAMMAR.shots.includes(beat.shot))) {
      next = { ...next, shot: motionGenreInferShot(next, spec.GRAMMAR.shots) };
      shots++;
    }
    const split = motionSplitReportedSpeech(next, analysis);
    if (split) {
      next = split;
      speech++;
    }
    kept.push(next);
  }
  return { beats: kept, dropped, visuals, shots, speech };
};
export const motionGenreShotMix = (beats: MotionBeat[], genre: unknown): string => {
  const spec = motionGenreSpec(genre);
  const total = Math.max(1, beats.length);
  const counts = _.countBy(beats, (beat) => (beat.visual && beat.visual !== X.VISUALS.SCENE ? beat.visual : beat.shot || S.MEDIUM));
  return Object.keys(spec.GRAMMAR.mix)
    .map((key) => `${key} ${Math.round(((counts[key] || 0) / total) * 100)}%/${spec.GRAMMAR.mix[key]}%`)
    .join(", ");
};
export const motionGenreShotMixOff = (beats: MotionBeat[], genre: unknown): boolean => {
  const spec = motionGenreSpec(genre);
  const total = Math.max(1, beats.length);
  const counts = _.countBy(beats, (beat) => (beat.visual && beat.visual !== X.VISUALS.SCENE ? beat.visual : beat.shot || S.MEDIUM));
  return Object.keys(spec.GRAMMAR.mix).some((key) => Math.abs(((counts[key] || 0) / total) * 100 - spec.GRAMMAR.mix[key]) > A.MIX_TOLERANCE);
};
export const motionGenreWritingPlan = (analysis: Pick<MotionStoryAnalysis, "videoGenre" | "writingPlan">): MotionWritingPlan | undefined => {
  if (!analysis.writingPlan) return undefined;
  if (motionVideoGenre(analysis.videoGenre) === "verdict") return analysis.writingPlan;
  return undefined;
};
export const motionGenreChapterWriting = (analysis: Pick<MotionStoryAnalysis, "videoGenre">, writing?: MotionWritingChapter): MotionWritingChapter | undefined => {
  if (!writing) return undefined;
  const fields = motionGenreSpec(analysis.videoGenre).PLAN_FIELDS;
  return _.pick(writing, fields) as MotionWritingChapter;
};
