import { MOTION_GENRE_CRAFT_TEXT as T } from "../constants/motionGenreCraft.js";
import { motionGenreCraftFindings, type MotionGenreCraftFinding } from "./motionGenreCraft.js";
import { motionRepetitionFindings } from "./motionStoryTimeline.js";
import { motionWritingReviewAnchors } from "./motionWriting.js";
import { motionGestureEchoFindings } from "./motionEchoFindings.js";
import type { MotionBeat, MotionStoryAnalysis } from "../types/motionVideo.js";
export const motionHtmlEditorialFindings = (beats: MotionBeat[], analysis: MotionStoryAnalysis, language: string): MotionGenreCraftFinding[] => {
  const merged = new Map<string, string[]>();
  for (const finding of [...motionGenreCraftFindings(beats, analysis.videoGenre, language), ...motionRepetitionFindings(beats, language, motionWritingReviewAnchors(analysis)), ...motionGestureEchoFindings(beats)]) merged.set(finding.id, [...(merged.get(finding.id) || []), finding.issue]);
  return [...merged].map(([id, issues]) => ({ id, issue: issues.join(T.JOIN) }));
};
