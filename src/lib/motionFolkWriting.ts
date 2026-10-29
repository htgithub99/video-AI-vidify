import { MOTION_FOLK_WRITING as W } from "../constants/motionFolkWriting.js";
import { MOTION_STORY_LANGUAGE as L } from "../constants/motionStoryLanguage.js";
import { motionGenreCreative } from "../constants/motionGenre.js";
import type { MotionBeat } from "../types/motionVideo.js";
export interface MotionFolkStyleFinding {
  id: string;
  reason: "long_sentences" | "heavy_wording";
}
const units = (text: string): number => text.split(/\s+/u).filter((word) => /[\p{L}\p{N}]/u.test(word)).length;
export const motionFolkStyleFindings = (beats: MotionBeat[], language: string, genre: unknown): MotionFolkStyleFinding[] => {
  if (!motionGenreCreative(genre) || !L.VI_RE.test(language.trim())) return [];
  const passages = beats.map((beat) => ({
    id: beat.id,
    text: beat.utterances?.length
      ? beat.utterances
          .filter((line) => line.role === "narration")
          .map((line) => line.text)
          .join(" ")
      : beat.narration,
  }));
  const sentences = passages.flatMap((passage) => (passage.text.match(/[^.!?…]+(?:[.!?…]+|$)/gu) || []).map((text) => ({ id: passage.id, units: units(text) })).filter((sentence) => sentence.units > 0));
  const long = sentences.filter((sentence) => sentence.units > W.LONG_SENTENCE);
  const overloaded = sentences.length >= W.MIN_SENTENCES && long.length / sentences.length >= W.LONG_SHARE && sentences.reduce((sum, sentence) => sum + sentence.units, 0) / sentences.length > W.MEAN_WARNING;
  return passages.flatMap((passage): MotionFolkStyleFinding[] => {
    if (overloaded && long.some((sentence) => sentence.id === passage.id)) return [{ id: passage.id, reason: "long_sentences" }];
    if ([...passage.text.matchAll(W.HEAVY_PHRASES)].length >= 2) return [{ id: passage.id, reason: "heavy_wording" }];
    return [];
  });
};
export const motionScriptEditorialPlan = (beats: MotionBeat[], options: { language: string; genre: unknown; chapterCount: number; complete: boolean; editorPass?: boolean; only?: string[]; resume?: boolean }): { focusIds?: string[]; findings: MotionFolkStyleFinding[] } | undefined => {
  if (!options.complete || options.editorPass === false || (options.only?.length && options.resume !== true)) return;
  const findings = motionFolkStyleFindings(beats, options.language, options.genre);
  if (options.chapterCount > 1) return { findings };
  if (findings.length) return { findings, focusIds: [...new Set(findings.map((finding) => finding.id))] };
};
