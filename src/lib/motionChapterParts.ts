import { MOTION_PROMPT as P } from "../constants/motionPrompt.js";
import type { MotionChapter, MotionStoryAnalysis } from "../types/motionVideo.js";
import { motionPromptGroups } from "./motionPrompt.js";
export const motionChapterParts = (chapter: MotionChapter, analysis: MotionStoryAnalysis, source: string, creative: boolean, expectedUnits: number): { points: string[]; source: string; seconds: number }[] => {
  const points = chapter.keyPoints?.filter((point) => point.trim()) || [];
  const events = points.length ? points : analysis.storySpine?.steps.filter((step) => step.chapterId === chapter.id).map((step) => [step.cause, step.event, step.consequence].join(" ")) || [];
  const atoms = creative ? events : source.split(P.CHAPTER_SENTENCES).filter(Boolean);
  if (atoms.length < 2 || (expectedUnits <= P.CHAPTER_OUTPUT_UNITS && (creative || source.length <= P.CHAPTER_SOURCE_CHARS))) return [];
  const desired = Math.max(2, Math.ceil(expectedUnits / P.CHAPTER_OUTPUT_UNITS), creative ? 1 : Math.ceil(source.length / P.CHAPTER_SOURCE_CHARS));
  const groups = motionPromptGroups(atoms, (group) => group.join(" "), Math.max(1, Math.ceil(atoms.length / desired)), P.CHAPTER_SOURCE_CHARS);
  const weights = groups.map((group) => (creative ? group.length : group.join(" ").length));
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  return groups.map((group, index) => ({ points: creative ? group : [], source: creative ? source : group.join(" "), seconds: ((chapter.targetSeconds || 120) * weights[index]) / total }));
};
