import { MOTION_GENRE_STYLE as G } from "../constants/motionGenreStyle.js";
import { motionVideoGenre } from "../constants/motionGenre.js";
import type { MotionBeat } from "../types/motionVideo.js";
export interface MotionGenreStyleFinding {
  id: string;
  issue: string;
}
export const motionGenreStyleFindings = (beats: MotionBeat[], language: string, genre: unknown): MotionGenreStyleFinding[] => {
  const rule = G.RULES[motionVideoGenre(genre)];
  if (!rule) return [];
  const vi = G.VI.test(language.trim());
  const marker = vi ? rule.vi : rule.en;
  const spoken = beats.filter((beat) => beat.narration?.trim());
  const missing = spoken.filter((beat) => !marker.test(beat.narration.replace(G.QUOTE, "")));
  const findings: MotionGenreStyleFinding[] = spoken.length && missing.length / spoken.length > rule.maxMissing ? missing.map((beat) => ({ id: beat.id, issue: rule.issue })) : [];
  if (vi && rule.maxUnits && rule.longIssue) {
    for (const beat of spoken) {
      if (findings.some((finding) => finding.id === beat.id)) continue;
      const long = (beat.narration.match(G.SENTENCE) || []).some((sentence) => (sentence.match(G.WORD) || []).length > rule.maxUnits!);
      if (long) findings.push({ id: beat.id, issue: rule.longIssue });
    }
  }
  return findings;
};
