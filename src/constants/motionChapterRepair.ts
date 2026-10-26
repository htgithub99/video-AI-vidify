import { MOTION_QA as Q } from "./motionQa.js";
export const MOTION_CHAPTER_REPAIR = {
  ATTEMPTS: 3,
  MIN_RATIO: Q.CHAPTER_MIN_RATIO,
  MAX_RATIO: Q.CHAPTER_MAX_RATIO,
  SPACE: /\s+/u,
  WORDS: /[\p{L}\p{N}\p{M}]+/gu,
  FAILED: (chapter: string, reason: string): string => `Chương ${chapter}: ${reason}. Đã giữ bản nháp và các chương đạt để tiếp tục.`,
  ID: (chapter: string, index: number): string => `${chapter}:beat:${index + 1}`,
  FIELDS: ["narration", "utterances", "visual", "place", "cast", "scenePlan", "action", "time", "weather", "shot", "sceneMood", "data", "hud"],
} as const;
