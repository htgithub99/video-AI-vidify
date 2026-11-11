import * as RT_MAINTENANCE from "../constants/runtime/maintenance.js";
import _ from "lodash";
import { MOTION_STORYTELLING as S, MOTION_STORYTELLING_MODES, type MotionStorytellingMode, type MotionStorytellingPreset } from "../constants/motionStorytelling.js";
import { motionVideoGenre } from "../constants/motionGenre.js";
export const motionStorytelling = (value: unknown): MotionStorytellingMode => (_.includes(_.values(MOTION_STORYTELLING_MODES), value) ? (value as MotionStorytellingMode) : S.DEFAULT);
export const motionStorytellingPreset = (value: unknown): MotionStorytellingPreset => S.PRESETS[motionStorytelling(value)];
export const motionStorytellingExpansion = (value: unknown, genre: unknown): number => {
  const preset = motionStorytellingPreset(value);
  if (preset.shortSource === RT_MAINTENANCE.STRICT) return 1;
  return S.EXPANSION[preset.shortSource][motionVideoGenre(genre)] || 1;
};
export const motionStorytellingSilent = (value: unknown) => {
  const preset = motionStorytellingPreset(value);
  return preset.shortSource === RT_MAINTENANCE.STRICT ? undefined : S.SILENT[preset.shortSource];
};
export const motionStorytellingText = (language: unknown) =>
  String(language || "")
    .toLowerCase()
    .startsWith(RT_MAINTENANCE.EN)
    ? S.TEXT.en
    : S.TEXT.vi;
