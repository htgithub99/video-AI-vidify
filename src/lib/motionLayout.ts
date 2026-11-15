import { MOTION_LAYOUTS, MOTION_LAYOUT_DEFAULT, type MotionLayoutId } from "../constants/motionLayouts/index.js";
import { motionDrawStyle } from "./motionDrawStyle.js";
export const motionIsLayout = (value: unknown): value is MotionLayoutId => typeof value === "string" && Object.hasOwn(MOTION_LAYOUTS, value);
export const motionLayoutOf = (settings?: { profileId?: unknown; layout?: unknown }): MotionLayoutId => {
  const own = motionIsLayout(settings?.layout) ? settings.layout : MOTION_LAYOUT_DEFAULT;
  return own === MOTION_LAYOUT_DEFAULT ? motionDrawStyle(settings?.profileId).layout || MOTION_LAYOUT_DEFAULT : own;
};
export const motionLayoutPlanner = (settings?: { profileId?: unknown; layout?: unknown }): string => MOTION_LAYOUTS[motionLayoutOf(settings)].planner;
const SCALE_START = "SCALE: size people by shot and depth and never inflate them:";
const SCALE_END = "not by a bigger body.";
export const motionLayoutOutput = (output: string, layout?: MotionLayoutId): string => {
  const scale = layout ? MOTION_LAYOUTS[layout]?.scale : undefined;
  const start = output.indexOf(SCALE_START), end = output.indexOf(SCALE_END, start);
  return scale && start >= 0 && end > start ? output.slice(0, start) + scale + output.slice(end + SCALE_END.length).trimStart() : output;
};
export const motionLayoutFocal = (layout: MotionLayoutId | undefined, wide: boolean, fallback: { focal: number; wide: number }): number => {
  const spec = layout ? MOTION_LAYOUTS[layout] : undefined;
  return (wide ? spec?.focalWide : spec?.focal) ?? (wide ? fallback.wide : fallback.focal);
};
