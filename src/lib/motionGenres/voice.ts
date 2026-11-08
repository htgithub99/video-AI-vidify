import * as RT_MAINTENANCE from "../../constants/runtime/maintenance.js";
import { MOTION_GENRE_VOICE as V } from "../../constants/motionGenreVoice.js";
import { MOTION_GENRE_VOCABULARY as X } from "../../constants/motionGenres/vocabulary.js";
import { motionGenreSpec, motionVideoGenre } from "../../constants/motionGenre.js";
import { motionLanguage, motionLanguageMaxUnits, motionSpeechUnits, motionSplitSentences } from "../motionLanguage.js";
import type { MotionBeat } from "../../types/motionVideo.js";
export interface MotionGenreVoiceFinding {
  id: string;
  issue: string;
}
export const motionGenreVoiceFindings = (beats: MotionBeat[], language: string, genre: unknown): MotionGenreVoiceFinding[] => {
  const voice = motionGenreSpec(genre).VOICE;
  const profile = motionLanguage(language);
  const findings: MotionGenreVoiceFinding[] = [];
  const add = (id: string, issue: string) => {
    const known = findings.find((finding) => finding.id === id);
    if (known) known.issue += RT_MAINTENANCE.SEMICOLON_SPACE + issue;
    else findings.push({ id, issue });
  };
  const hindsightByChapter = new Map<string, number>();
  const detachedByChapter = new Map<string, number>();
  for (const beat of beats) {
    const narration = beat.narration?.trim();
    if (!narration) continue;
    const spoken = narration.replace(V.QUOTE, RT_MAINTENANCE.SPACE);
    const maxUnits = motionLanguageMaxUnits(language, motionVideoGenre(genre), voice.maxUnits);
    if (motionSplitSentences(narration).some((sentence) => motionSpeechUnits(sentence) > maxUnits)) add(beat.id, voice.longIssue);
    if (voice.detached && voice.detachedIssue && !profile.markers.viewer.test(spoken) && !(beat.utterances || []).some((line) => line.role !== V.NARRATION) && beat.frame !== X.FRAMES.HINDSIGHT && beat.visual === X.VISUALS.SCENE && (detachedByChapter.get(beat.chapterId) || 0) < V.DETACHED_PER_CHAPTER) {
      detachedByChapter.set(beat.chapterId, (detachedByChapter.get(beat.chapterId) || 0) + 1);
      add(beat.id, voice.detachedIssue);
    }
    if (voice.perceptionFrame && voice.toldIssue && beat.frame === X.FRAMES.TOLD && profile.markers.perception.test(spoken)) add(beat.id, voice.toldIssue);
    if (voice.hindsightIssue && beat.frame === X.FRAMES.HINDSIGHT) {
      const count = (hindsightByChapter.get(beat.chapterId) || 0) + 1;
      hindsightByChapter.set(beat.chapterId, count);
      if (count > V.HINDSIGHT_PER_CHAPTER) add(beat.id, voice.hindsightIssue);
    }
  }
  return findings;
};
