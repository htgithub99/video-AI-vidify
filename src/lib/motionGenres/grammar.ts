import * as RT_MAINTENANCE from "../../constants/runtime/maintenance.js";
import { MOTION_GENRE_GRAMMAR_REVIEW as G } from "../../constants/motionGenreGrammarReview.js";
import { MOTION_GENRE_VOCABULARY as X } from "../../constants/motionGenres/vocabulary.js";
import { MOTION_VIDEO_GENRES, motionGenreSpec, motionVideoGenre } from "../../constants/motionGenre.js";
import type { MotionBeat, MotionStoryAnalysis } from "../../types/motionVideo.js";
import { motionNarratorCastKey } from "../motionVoice.js";
import { motionSpeakerNames } from "./autofix.js";
export interface MotionGenreGrammarFinding {
  id: string;
  issue: string;
}
const V = X.VISUALS;
const S = X.SHOTS;
const protagonist = (member: { key: string; name: string; alias?: string; role?: string; narrator?: boolean }, narrator?: string): boolean => member.key === narrator || !!member.narrator || [member.key, member.name, member.alias].some((value) => !!value && G.DIALOGUE.PROTAGONIST.test(value.trim())) || G.DIALOGUE.PROTAGONIST_ROLE.test(member.role || "");
export const motionDialogueFindings = (beats: MotionBeat[], analysis: Pick<MotionStoryAnalysis, "chapters" | "videoGenre" | "cast" | "videoDna">, sourceText = ""): MotionGenreGrammarFinding[] => {
  const rule = motionGenreSpec(analysis.videoGenre).DIALOGUE;
  const minLines = rule.minLines;
  if (!minLines || (rule.needsSourceQuotes && !G.DIALOGUE.SOURCE_QUOTE.test(sourceText))) return [];
  const narrator = motionNarratorCastKey(analysis as MotionStoryAnalysis);
  const findings: MotionGenreGrammarFinding[] = [];
  for (const chapter of analysis.chapters) {
    const own = beats.filter((beat) => beat.chapterId === chapter.id && beat.narration?.trim());
    for (const member of analysis.cast) {
      if (rule.skipProtagonist && protagonist(member, narrator)) continue;
      const present = own.filter((beat) => (beat.cast || []).includes(member.key) || beat.narration.includes(member.name));
      if (present.length < G.DIALOGUE.MIN_PRESENT_BEATS) continue;
      const spoken = own.filter((beat) => (beat.utterances || []).some((line) => line.role !== RT_MAINTENANCE.NARRATION && line.speaker === member.key)).length;
      if (spoken >= minLines) continue;
      const names = motionSpeakerNames(member);
      const candidate = present.find((beat) => names.some((name) => beat.narration.includes(name)) && (G.DIALOGUE.SPEECH_VERB.test(beat.narration) || G.DIALOGUE.SOURCE_QUOTE.test(beat.narration)) && !(beat.utterances || []).some((line) => line.role !== RT_MAINTENANCE.NARRATION));
      if (candidate && !findings.some((finding) => finding.id === candidate.id)) findings.push({ id: candidate.id, issue: G.DIALOGUE.ISSUE(member.name, member.key) });
    }
  }
  return findings;
};
export const motionDialogueSummary = (beats: MotionBeat[]): string => {
  const lines = beats.flatMap((beat) => (beat.utterances || []).filter((line) => line.role !== RT_MAINTENANCE.NARRATION));
  return G.DIALOGUE.LOG(lines.length, new Set(lines.map((line) => line.speaker)).size);
};
export const motionGenreGrammarFindings = (beats: MotionBeat[], analysis: Pick<MotionStoryAnalysis, "chapters" | "videoGenre" | "writingPlan">): MotionGenreGrammarFinding[] => {
  const genre = motionVideoGenre(analysis.videoGenre);
  const spec = motionGenreSpec(genre);
  const findings: MotionGenreGrammarFinding[] = [];
  const add = (id: string, issue: string) => {
    if (!findings.some((finding) => finding.id === id)) findings.push({ id, issue });
  };
  const chapters = analysis.chapters.map((chapter) => ({ chapter, beats: beats.filter((beat) => beat.chapterId === chapter.id && beat.narration?.trim()) }));
  for (const { chapter, beats: own } of chapters) {
    if (!own.length) continue;
    if (genre === MOTION_VIDEO_GENRES.CHRONICLE && chapter !== chapters[0].chapter && ![V.CHAPTER, V.TIMELINE].includes(own[0].visual as typeof V.CHAPTER)) add(own[0].id, G.ERA_ISSUE);
    if (genre === MOTION_VIDEO_GENRES.WITNESS) {
      if (!own.some((beat) => beat.shot === S.INSERT)) {
        const candidate = own.find((beat) => beat.subject && G.PREACH.test(beat.subject) === false && !(beat.cast || []).length) || own[Math.floor(own.length / 2)];
        add(candidate.id, G.OBJECT_ISSUE);
      }
      if (chapter === chapters.at(-1)?.chapter) for (const beat of own.slice(-spec.CLOSING.maxBeats - 2)) if (G.PREACH.test(beat.narration)) add(beat.id, G.PREACH_ISSUE);
    }
  }
  for (const beat of beats) if (beat.visual === V.SCENE && beat.subject !== undefined && beat.subject.trim().length < G.SUBJECT_MIN_CHARS) add(beat.id, G.SUBJECT_ISSUE);
  return findings;
};
