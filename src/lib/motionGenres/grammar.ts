import { MOTION_GENRE_GRAMMAR_REVIEW as G } from "../../constants/motionGenreGrammarReview.js";
import { MOTION_GENRE_REVIEW as R } from "../../constants/motionGenreReview.js";
import { MOTION_GENRE_VOCABULARY as X } from "../../constants/motionGenres/vocabulary.js";
import { MOTION_VIDEO_GENRES, motionGenreSpec, motionVideoGenre } from "../../constants/motionGenre.js";
import type { MotionBeat, MotionStoryAnalysis } from "../../types/motionVideo.js";
import { motionNarratorCastKey } from "../motionVoice.js";
export interface MotionGenreGrammarFinding {
  id: string;
  issue: string;
}
const V = X.VISUALS;
const S = X.SHOTS;
export const motionDialogueFindings = (beats: MotionBeat[], analysis: Pick<MotionStoryAnalysis, "chapters" | "videoGenre" | "cast" | "videoDna">): MotionGenreGrammarFinding[] => {
  const minLines = G.DIALOGUE.MIN_LINES[motionVideoGenre(analysis.videoGenre)];
  if (!minLines) return [];
  const narrator = motionNarratorCastKey(analysis as MotionStoryAnalysis);
  const findings: MotionGenreGrammarFinding[] = [];
  for (const chapter of analysis.chapters) {
    const own = beats.filter((beat) => beat.chapterId === chapter.id && beat.narration?.trim());
    for (const member of analysis.cast) {
      if (member.key === narrator || member.narrator) continue;
      const present = own.filter((beat) => (beat.cast || []).includes(member.key) || beat.narration.includes(member.name));
      if (present.length < G.DIALOGUE.MIN_PRESENT_BEATS) continue;
      const spoken = own.filter((beat) => (beat.utterances || []).some((line) => line.role !== "narration" && line.speaker === member.key)).length;
      if (spoken >= minLines) continue;
      const candidate = present.find((beat) => G.DIALOGUE.SPEECH_VERB.test(beat.narration) && !(beat.utterances || []).some((line) => line.role !== "narration")) || present.find((beat) => !(beat.utterances || []).some((line) => line.role !== "narration"));
      if (candidate && !findings.some((finding) => finding.id === candidate.id)) findings.push({ id: candidate.id, issue: G.DIALOGUE.ISSUE(member.name, member.key) });
    }
  }
  return findings;
};
export const motionDialogueSummary = (beats: MotionBeat[]): string => {
  const lines = beats.flatMap((beat) => (beat.utterances || []).filter((line) => line.role !== "narration"));
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
    const stages = chapter.stages || [];
    if (genre === MOTION_VIDEO_GENRES.VERDICT && stages.includes(R.CANDIDATE_STAGE) && !own.some((beat) => beat.visual === V.VERDICT)) add(own[Math.min(own.length - 1, Math.floor(own.length / 2))].id, G.DEVICE_ISSUE(analysis.writingPlan?.device || ""));
    if (genre === MOTION_VIDEO_GENRES.VERDICT && chapter === chapters.at(-1)?.chapter && chapters.length > 1 && !own.some((beat) => beat.visual === V.SCOREBOARD)) add(own[Math.max(0, own.length - 2)].id, G.SCOREBOARD_ISSUE);
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
