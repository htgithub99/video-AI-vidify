import { MOTION_GENRE_CRAFT, MOTION_GENRE_CRAFT_MARKERS, MOTION_GENRE_CRAFT_TEXT as T } from "../constants/motionGenreCraft.js";
import { MOTION_VIDEO_GENRES } from "../constants/motionGenre.js";
import { motionLanguageCode } from "./motionLanguage.js";
import type { MotionBeat } from "../types/motionVideo.js";
export interface MotionGenreCraftFinding {
  id: string;
  issue: string;
}
export const motionGenreCraft = (genre: unknown) => MOTION_GENRE_CRAFT[String(genre)] || MOTION_GENRE_CRAFT[MOTION_VIDEO_GENRES.CHRONICLE];
export const motionGenreCraftFindings = (beats: MotionBeat[], genre: unknown, language: unknown): MotionGenreCraftFinding[] => {
  const m = MOTION_GENRE_CRAFT_MARKERS[motionLanguageCode(language)];
  if (!m) return [];
  const findings = new Map<string, string[]>();
  const add = (id: string, issue: string) => {
    const list = findings.get(id) || [];
    if (!list.includes(issue)) list.push(issue);
    findings.set(id, list);
  };
  const lived = genre === MOTION_VIDEO_GENRES.POV || genre === MOTION_VIDEO_GENRES.WITNESS;
  const self = genre === MOTION_VIDEO_GENRES.POV ? m.viewer : m.first;
  const watched = new Map<string, number>();
  const chapterSize = new Map<string, number>();
  for (const beat of beats) chapterSize.set(beat.chapterId, (chapterSize.get(beat.chapterId) || 0) + 1);
  let listed = 0;
  let hindsight = 0;
  for (const beat of beats) {
    const spoken = String(beat.narration || T.SPACE).replace(T.QUOTED, T.SPACE).trim();
    if (!spoken) continue;
    const sentences = spoken.split(m.sentence).map((line) => line.trim()).filter(Boolean);
    const voiced = (beat.utterances || []).some((line) => line.role === T.DIALOGUE);
    if (lived) {
      const own = sentences.filter((line) => self.test(line)).length;
      const outside = sentences.some((line) => m.collective.test(line) && !self.test(line));
      if (!voiced && (own / Math.max(1, sentences.length) < T.DETACHED_SHARE || outside)) add(beat.id, genre === MOTION_VIDEO_GENRES.POV ? T.ISSUES.DETACHED : T.ISSUES.FIRST);
      if (sentences.some((line) => m.omniscient.test(line) && !m.hearsay.test(line))) add(beat.id, T.ISSUES.OMNISCIENT);
      if (sentences.some((line) => m.number.test(line) && !m.hearsay.test(line) && !self.test(line))) add(beat.id, T.ISSUES.STATISTIC);
      if (!m.sense.test(spoken)) add(beat.id, T.ISSUES.SENSE);
      if (m.hindsight.test(spoken) && ++hindsight > T.HINDSIGHT_MAX) add(beat.id, T.ISSUES.HINDSIGHT);
    }
    if (lived && m.watching.test(spoken)) {
      const count = (watched.get(beat.chapterId) || 0) + 1;
      watched.set(beat.chapterId, count);
      if (count > Math.max(1, Math.ceil((chapterSize.get(beat.chapterId) || 0) / T.WATCHING_EVERY))) add(beat.id, T.ISSUES.WATCHING);
    }
    if (genre === MOTION_VIDEO_GENRES.CHRONICLE) {
      listed = m.cause.test(spoken) ? 0 : listed + 1;
      if (listed >= T.LIST_RUN) {
        add(beat.id, T.ISSUES.LIST);
        listed = 0;
      }
    }
  }
  if (genre === MOTION_VIDEO_GENRES.VERDICT && beats.length) {
    const opening = beats.slice(0, T.QUESTION_BEATS);
    if (!opening.some((beat) => m.question.test(String(beat.narration || T.SPACE)))) add(beats[0].id, T.ISSUES.QUESTION);
    const ending = beats.slice(-T.VERDICT_BEATS);
    if (!ending.some((beat) => m.verdict.test(String(beat.narration || T.SPACE)))) add(beats[beats.length - 1].id, T.ISSUES.VERDICT);
  }
  return [...findings].map(([id, issues]) => ({ id, issue: issues.join(T.JOIN) }));
};
