import * as RT_MAINTENANCE from "../constants/runtime/maintenance.js";
import _ from "lodash";
import { MOTION_STORYTELLING as S, type MotionStorytellingMode, type MotionStorytellingPreset } from "../constants/motionStorytelling.js";
import { motionVideoGenre } from "../constants/motionGenre.js";
export const motionStorytelling = (value: unknown): MotionStorytellingMode => S.ALIASES[String(value)] || (_.includes(S.CHOICES, value) ? (value as MotionStorytellingMode) : S.DEFAULT);
export const motionStorytellingPreset = (value: unknown): MotionStorytellingPreset => S.PRESETS[motionStorytelling(value)];
export const motionStorytellingExpansion = (value: unknown, genre: unknown): number => {
  const preset = motionStorytellingPreset(value);
  if (preset.shortSource === RT_MAINTENANCE.STRICT) return 1;
  return S.EXPANSION[preset.shortSource][motionVideoGenre(genre)] || 1;
};
export const motionStorytellingSilent = (_value?: unknown) => S.SILENT_FIXED;
export const motionStorytellingText = (language: unknown) =>
  String(language || "")
    .toLowerCase()
    .startsWith(RT_MAINTENANCE.EN)
    ? S.TEXT.en
    : S.TEXT.vi;
