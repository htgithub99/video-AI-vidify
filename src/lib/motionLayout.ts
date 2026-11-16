import { MOTION_CAMERA_SHOTS, MOTION_LAYOUTS, MOTION_LAYOUT_DEFAULT, type MotionCameraShot, type MotionLayoutId } from "../constants/motionLayouts/index.js";
import { motionDrawStyle } from "./motionDrawStyle.js";
import { motionSceneShot } from "./motionSceneBlueprint.js";
export const motionIsLayout = (value: unknown): value is MotionLayoutId => typeof value === "string" && Object.hasOwn(MOTION_LAYOUTS, value);
// "Tự động" follows the drawing style's own layout in "Bộ vẽ chuẩn"; in "Dựng cảnh AI" (no drawing style) it is the AI's frame.
export const motionLayoutOf = (settings?: { profileId?: unknown; layout?: unknown; figureKit?: unknown }): MotionLayoutId => {
  const own = motionIsLayout(settings?.layout) ? settings.layout : MOTION_LAYOUT_DEFAULT;
  return own === MOTION_LAYOUT_DEFAULT ? (settings?.figureKit === true && motionDrawStyle(settings.profileId).layout) || MOTION_LAYOUT_DEFAULT : own;
};
// The camera's shot size for one scene: the layout's size for a medium scene, one size out for an establishing or wide
// scene, one in for a close scene. "Toàn cảnh" (and a map, which is never cut) keeps the AI's whole frame.
export const motionCameraShot = (layout: MotionLayoutId, scene: { shot?: string; kind?: string } = {}): MotionCameraShot => {
  const base = MOTION_CAMERA_SHOTS.indexOf(MOTION_LAYOUTS[layout]?.shot || "wide");
  if (base <= 0 || String(scene.kind || "").toLowerCase() === "map") return "wide";
  const shot = motionSceneShot(scene.shot);
  const step = shot === "close" ? 1 : shot === "medium" ? 0 : -1;
  return MOTION_CAMERA_SHOTS[Math.max(0, Math.min(MOTION_CAMERA_SHOTS.length - 1, base + step))];
};
