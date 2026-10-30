import { MOTION_GENRE_STAGE as S } from "../constants/motionGenreStage.js";
import { motionVideoGenre } from "../constants/motionGenre.js";
import { motionNarratorCastKey } from "./motionVoice.js";
import { MOTION_STORY_TIMELINE as T } from "../constants/motionStoryTimeline.js";
import type { MotionBeat, MotionStoryAnalysis } from "../types/motionVideo.js";
export interface MotionGenreStageFinding {
  id: string;
  issue: string;
}
const C = S.CHECK;
const M = S.MOTIF;
const words = (text: string): string[] => (text.toLowerCase().match(M.WORD) || []).filter((word) => word.length >= M.MIN_WORD);
export const motionMotifWords = (motif: string): Set<string> => new Set(words(motif));
export const motionHasMotif = (text: string, motif: string): boolean => {
  const need = motionMotifWords(motif);
  if (!need.size) return false;
  const have = new Set(words(text));
  const matched = [...need].filter((word) => have.has(word)).length;
  return matched === need.size || (matched >= 2 && matched / need.size >= M.MATCH);
};
export const motionMotifsLost = (before: string, after: string, motifs: string[] = []): string[] => motifs.filter((motif) => motionHasMotif(before, motif) && !motionHasMotif(after, motif));
export const motionChapterEchoFindings = (beats: MotionBeat[], language: string, motifs: string[] = []): MotionGenreStageFinding[] => {
  const E = S.ECHO;
  const min = E.MIN_LENGTH[E.VI.test(language.trim()) ? "vi" : "en"];
  const motifWords = new Set(motifs.flatMap((motif) => [...motionMotifWords(motif)]));
  const vi = E.VI.test(language.trim());
  const tokens = (text: string): Set<string> => {
    const list = (text.toLowerCase().match(E.WORD) || []).filter((word) => word.length >= min && !motifWords.has(word) && !T.REPEAT.STOP.test(word));
    return new Set(vi ? list.slice(1).map((word, index) => list[index] + " " + word) : list);
  };
  const findings: MotionGenreStageFinding[] = [];
  const seen = new Map<string, { id: string; text: string; set: Set<string> }[]>();
  for (const beat of beats) {
    if (!beat.narration?.trim()) continue;
    const set = tokens(beat.narration);
    const earlier = seen.get(beat.chapterId) || [];
    const match = earlier.find((entry) => {
      const shared = [...set].filter((word) => entry.set.has(word)).length;
      return shared >= E.MIN_SHARED && shared / Math.max(1, Math.min(set.size, entry.set.size)) >= E.RATIO;
    });
    if (match) findings.push({ id: beat.id, issue: E.ISSUE(match.id, match.text.slice(0, E.QUOTE)) });
    seen.set(beat.chapterId, [...earlier, { id: beat.id, text: beat.narration.trim(), set }]);
  }
  return findings;
};
export const motionGenreStageFindings = (beats: MotionBeat[], analysis: Pick<MotionStoryAnalysis, "chapters" | "videoGenre"> & Partial<Pick<MotionStoryAnalysis, "cast" | "motifs" | "videoDna">>): MotionGenreStageFinding[] => {
  const genre = motionVideoGenre(analysis.videoGenre);
  const chapters = analysis.chapters;
  const last = chapters.length - 1;
  const findings: MotionGenreStageFinding[] = [];
  const add = (id: string, issue: string) => {
    const known = findings.find((finding) => finding.id === id);
    if (!known) findings.push({ id, issue });
    else if (!known.issue.includes(issue)) known.issue += "; " + issue;
  };
  const motifs = analysis.motifs || [];
  chapters.forEach((chapter, index) => {
    const lines = beats.filter((beat) => beat.chapterId === chapter.id && beat.narration?.trim());
    if (!lines.length) return;
    const staged = !!chapter.stages?.length;
    const closing = staged ? chapter.stages!.includes(C.TIME_JUMP_STAGE) : index === last;
    if (C.TIME_JUMP_GENRES.includes(genre) && !closing && index < last)
      for (const beat of lines) if ((beat.narration.match(C.SENTENCE) || []).some((sentence) => C.TIME_JUMP.test(sentence) && !C.FUTURE.test(sentence))) add(beat.id, C.TIME_JUMP_ISSUE);
    if (C.STAMP_GENRES.includes(genre) && !(C.STAMP_SKIP_LAST.includes(genre) && index === last)) {
      const planned = [chapter.summary, ...(chapter.keyPoints || []).map((point) => point.replace(C.POINT_PREFIX, ""))].join(" ");
      if (C.PLAN_STAMP.test(planned) && !lines.slice(0, C.STAMP_BEATS).some((beat) => C.STAMP.test(beat.narration))) add(lines[0].id, C.STAMP_ISSUE[genre]);
    }
    const candidate = staged ? chapter.stages!.includes(C.QUESTION_STAGE) : index > 0 && index < last;
    if (C.QUESTION_GENRES.includes(genre) && candidate && !lines.some((beat) => C.QUESTION.test(beat.narration))) add(lines.at(-1)!.id, C.QUESTION_ISSUE);
    const motifStage = M.STAGE_GENRES[genre];
    const motifChapter = staged ? chapter.stages!.includes(motifStage) : index > 0 && index < last;
    if (motifs.length && motifStage && motifChapter && !lines.some((beat) => motifs.some((motif) => motionHasMotif(beat.narration, motif)))) add(lines.at(-1)!.id, M.STAGE_ISSUE(motifs));
    if (motifs.length && index === last && M.FINAL_GENRES.includes(genre) && !lines.slice(-C.STAMP_BEATS * 2).some((beat) => motifs.some((motif) => motionHasMotif(beat.narration, motif)))) add(lines.at(-1)!.id, M.FINAL_ISSUE(motifs));
  });
  const P = S.COMPANION;
  const closing = beats.filter((beat) => beat.chapterId === chapters[last]?.id && beat.narration?.trim());
  if (P.GENRES.includes(genre) && analysis.cast?.length && chapters.length > 2 && closing.length) {
    const narrator = motionNarratorCastKey(analysis as MotionStoryAnalysis);
    const chapterIndex = new Map(chapters.map((chapter, index) => [chapter.id, index]));
    const dropped = analysis.cast
      .filter((member) => member.key !== narrator)
      .filter((member) => {
        const names = [member.name, member.alias].filter((name): name is string => !!name?.trim()).flatMap((name) => name.match(P.NAME_TOKEN) || []).map((name) => name.toLowerCase());
        const present = beats.filter((beat) => beat.utterances?.some((line) => line.speaker === member.key) || names.some((name) => P.BOUNDARY(name).test(beat.narration)));
        const lastSeen = Math.max(-1, ...present.map((beat) => chapterIndex.get(beat.chapterId) ?? -1));
        return present.length >= P.MIN_LINES && lastSeen < last - 1;
      })
      .map((member) => member.name);
    if (dropped.length) add(closing.at(-1)!.id, P.ISSUE(dropped));
  }
  return findings;
};
