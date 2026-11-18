import { MOTION_LAYOUTS, MOTION_LAYOUT_DEFAULT, type MotionLayoutId } from "../constants/motionLayouts/index.js";
export const motionIsLayout = (value: unknown): value is MotionLayoutId => typeof value === "string" && Object.hasOwn(MOTION_LAYOUTS, value);
// The layout chosen ("Bố cục"); "Tự động" stays automatic and is decided per scene by the camera from the kind of scene.
export const motionLayoutOf = (settings?: { layout?: unknown }): MotionLayoutId => (motionIsLayout(settings?.layout) ? settings.layout : MOTION_LAYOUT_DEFAULT);
