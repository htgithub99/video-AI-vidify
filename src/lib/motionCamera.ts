import { MOTION_CAMERA as C } from "../constants/motionCamera.js";
import { stringifyJson } from "./jsonStringify.js";
export type MotionCameraMode = (typeof C.MODES)[number];
export interface MotionCameraInput {
  enabled: boolean;
  seconds: number;
  start: number;
  end: number;
  width: number;
  height: number;
  seed: string;
  mode?: MotionCameraMode;
  focus?: { x: number; y: number };
  origin?: { x: number; y: number };
  protectedRects?: { x: number; y: number; width: number; height: number }[];
}
export const MOTION_CAMERA_REVISION = 3;
function cameraFrame(input: MotionCameraInput, modes: readonly MotionCameraMode[], pace: Pick<typeof C, "MAX_ZOOM" | "SPEED">) {
  const [pushMode, leftMode, rightMode, upMode, downMode, pullMode, followMode, holdMode] = modes;
  const mode = input.mode || holdMode;
  const duration = Math.max(0, input.end - input.start);
  if (!input.enabled || mode === holdMode || duration < 2 || !(input.width > 0 && input.height > 0)) return { scale: 1, x: 0, y: 0, mode };
  const p = Math.max(0, Math.min(1, (input.seconds - input.start) / duration));
  const progress = p * p * (3 - 2 * p);
  let left = input.width,
    right = 0,
    top = input.height,
    bottom = 0;
  for (const rect of input.protectedRects || []) {
    if (![rect.x, rect.y, rect.width, rect.height].every(Number.isFinite)) continue;
    const l = Math.max(0, rect.x),
      r = Math.min(input.width, rect.x + rect.width);
    const t = Math.max(0, rect.y),
      b = Math.min(input.height, rect.y + rect.height);
    if (l >= r || t >= b) continue;
    left = Math.min(left, l);
    right = Math.max(right, r);
    top = Math.min(top, t);
    bottom = Math.max(bottom, b);
  }
  const amount = Math.max(0, Math.min(pace.MAX_ZOOM, duration * pace.SPEED, right > left ? input.width / (right - left) - 1 : 1, bottom > top ? input.height / (bottom - top) - 1 : 1));
  if (input.focus && [input.focus.x, input.focus.y, input.origin?.x ?? 0, input.origin?.y ?? 0].every(Number.isFinite) && (mode === followMode || mode === pushMode || mode === pullMode)) {
    const delta = amount * (mode === pushMode ? progress : mode === pullMode ? 1 - progress : 1),
      scale = 1 + delta;
    const origin = input.origin || input.focus;
    const desiredX = (input.width / 2 - origin.x) * delta - (mode === followMode ? (input.focus.x - origin.x) * scale : 0);
    const desiredY = (input.height / 2 - origin.y) * delta - (mode === followMode ? (input.focus.y - origin.y) * scale : 0);
    const mx = (delta * input.width) / 2,
      my = (delta * input.height) / 2;
    const minX = Math.max(-mx, right > left ? -left - (left - input.width / 2) * delta : -mx),
      maxX = Math.min(mx, right > left ? input.width - right - (right - input.width / 2) * delta : mx);
    const minY = Math.max(-my, bottom > top ? -top - (top - input.height / 2) * delta : -my),
      maxY = Math.min(my, bottom > top ? input.height - bottom - (bottom - input.height / 2) * delta : my);
    return { scale, x: Math.max(minX, Math.min(maxX, desiredX)), y: Math.max(minY, Math.min(maxY, desiredY)), mode };
  }
  const endpoints: { scale: number; x: number; y: number }[] = [];
  for (let endpoint = 0; endpoint <= 1; endpoint++) {
    const delta = amount * (mode === pushMode ? endpoint : mode === pullMode ? 1 - endpoint : 1);
    const mx = (delta * input.width) / 2,
      my = (delta * input.height) / 2;
    const desiredX = mode === leftMode || mode === rightMode ? (mode === leftMode ? -1 : 1) * (endpoint - 0.5) * amount * input.width : 0;
    const desiredY = mode === upMode || mode === downMode ? (mode === upMode ? -1 : 1) * (endpoint - 0.5) * amount * input.height : 0;
    const minX = Math.max(-mx, right > left ? -left - (left - input.width / 2) * delta : -mx);
    const maxX = Math.min(mx, right > left ? input.width - right - (right - input.width / 2) * delta : mx);
    const minY = Math.max(-my, bottom > top ? -top - (top - input.height / 2) * delta : -my);
    const maxY = Math.min(my, bottom > top ? input.height - bottom - (bottom - input.height / 2) * delta : my);
    endpoints.push({ scale: 1 + delta, x: Math.max(minX, Math.min(maxX, desiredX)), y: Math.max(minY, Math.min(maxY, desiredY)) });
  }
  return { scale: endpoints[0].scale + (endpoints[1].scale - endpoints[0].scale) * progress, x: endpoints[0].x + (endpoints[1].x - endpoints[0].x) * progress, y: endpoints[0].y + (endpoints[1].y - endpoints[0].y) * progress, mode };
}
export const motionCameraFrame = (input: MotionCameraInput) => cameraFrame(input, C.MODES, C);
export const motionCameraBrowserSource = (): string => C.BROWSER_SOURCE(cameraFrame.toString(), stringifyJson(C.MODES), stringifyJson({ MAX_ZOOM: C.MAX_ZOOM, SPEED: C.SPEED }));
