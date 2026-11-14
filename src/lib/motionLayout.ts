import { MOTION_LAYOUTS, MOTION_LAYOUT_DEFAULT, type MotionLayoutId } from "../constants/motionLayouts/index.js";
import { motionDrawStyle } from "./motionDrawStyle.js";
export const motionIsLayout = (value: unknown): value is MotionLayoutId => typeof value === "string" && Object.hasOwn(MOTION_LAYOUTS, value);
export const motionLayoutOf = (settings?: { profileId?: unknown; layout?: unknown }): MotionLayoutId => {
  const own = motionIsLayout(settings?.layout) ? settings.layout : MOTION_LAYOUT_DEFAULT;
  return own === MOTION_LAYOUT_DEFAULT ? motionDrawStyle(settings?.profileId).layout || MOTION_LAYOUT_DEFAULT : own;
};
export const motionLayoutPlanner = (settings?: { profileId?: unknown; layout?: unknown }): string => MOTION_LAYOUTS[motionLayoutOf(settings)].planner;
