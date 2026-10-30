import { RUNTIME_TEXT as RT_SHARED } from "../constants/runtime/shared.js";
import { MOTION_PROMPT as P } from "../constants/motionPrompt.js";
import type { MotionChapter, MotionStoryAnalysis } from "../types/motionVideo.js";
import { motionPromptGroups } from "./motionPrompt.js";
import { stringifyJson } from "./jsonStringify.js";
export const motionChapterParts = (chapter: MotionChapter, analysis: MotionStoryAnalysis, source: string, expectedUnits: number, outputUnits?: number): { points: string[]; source: string; seconds: number }[] => {
  const atoms = source.split(P.CHAPTER_SENTENCES).filter(Boolean);
  const contextChars = source.length + stringifyJson({ chapter, cast: analysis.cast, places: analysis.places, dna: analysis.videoDna }).length;
  const capacity = outputUnits || (contextChars <= P.TARGET_CHARS - P.WRAPPER_RESERVE ? P.CHAPTER_COMPACT_OUTPUT_UNITS : P.CHAPTER_OUTPUT_UNITS);
  if (atoms.length < 2 || expectedUnits <= capacity) return [];
  const desired = Math.max(2, Math.ceil(expectedUnits / capacity), Math.ceil(source.length / P.CHAPTER_SOURCE_CHARS));
  const groups = motionPromptGroups(atoms, (group) => group.join(RT_SHARED.SYMBOL_36A9E7), Math.max(1, Math.ceil(atoms.length / desired)), P.CHAPTER_SOURCE_CHARS);
  const weights = groups.map((group) => group.join(RT_SHARED.SYMBOL_36A9E7).length);
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  return groups.map((group, index) => ({ points: [], source: group.join(RT_SHARED.SYMBOL_36A9E7), seconds: ((chapter.targetSeconds || 120) * weights[index]) / total }));
};
