import { MOTION_LAYOUTS, MOTION_LAYOUT_DEFAULT, type MotionLayoutId } from "../constants/motionLayouts/index.js";
export const motionIsLayout = (value: unknown): value is MotionLayoutId => typeof value === "string" && Object.hasOwn(MOTION_LAYOUTS, value);
export const motionLayoutOf = (settings?: { layout?: unknown }): MotionLayoutId => (motionIsLayout(settings?.layout) ? settings.layout : MOTION_LAYOUT_DEFAULT);
