import { MOTION_SCENE_CROP as K } from "../constants/motionSceneCrop.js";
import type { MotionSceneCrop } from "../types/motionVisual.js";
export const motionSceneCropPush = (progress: number): { scale: number; x: number; y: number } => ({ scale: 1 + K.PUSH * Math.max(0, Math.min(1, progress)), x: 0, y: 0 });
const cropCache = new Map<string, Map<string, string>>();
export const motionCropSvg = (svg: string, crop: MotionSceneCrop): string => {
  const key = `${crop.x}|${crop.y}|${crop.width}|${crop.height}`;
  const known = cropCache.get(svg)?.get(key);
  if (known !== undefined) return known;
  const root = svg.match(K.SVG_ROOT)?.[0];
  if (!root) return svg;
  const box = root.match(K.VIEWBOX)?.[2].match(K.NUMBERS)?.map(Number);
  const width = box?.[2] ?? Number(root.match(K.WIDTH)?.[2]),
    height = box?.[3] ?? Number(root.match(K.HEIGHT)?.[2]);
  if (!(width > 0) || !(height > 0)) return svg;
  const left = (box?.[0] ?? 0) + crop.x * width,
    top = (box?.[1] ?? 0) + crop.y * height;
  const viewBox = ` viewBox="${Number(left.toFixed(3))} ${Number(top.toFixed(3))} ${Number((crop.width * width).toFixed(3))} ${Number((crop.height * height).toFixed(3))}" preserveAspectRatio="${K.SLICE}"`;
  const next = svg.replace(root, root.replace(K.VIEWBOX, "").replace(K.ASPECT, "").replace(K.ROOT_END, `${viewBox}>`));
  if (cropCache.size >= K.CACHE) cropCache.clear();
  const entry = cropCache.get(svg) || new Map<string, string>();
  entry.set(key, next);
  cropCache.set(svg, entry);
  return next;
};
