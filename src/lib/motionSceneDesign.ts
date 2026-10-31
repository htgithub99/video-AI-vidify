import { RUNTIME_TEXT as RT_SHARED } from "../constants/runtime/shared.js";
import { RUNTIME_TEXT as RT_CORE } from "../constants/runtime/core.js";
import { MOTION_SCENE_DESIGN as D, MOTION_SCENE_PLACEMENT_SCHEMA } from "../constants/motionSceneDesign.js";
import { motionResponseErrors } from "./motionResponseContract.js";
import type { MotionSceneDesign, MotionRemotionNode } from "../types/motionVisual.js";
const toCanvasShare = (design: MotionSceneDesign, size?: { width: number; height: number }): MotionSceneDesign => {
  if (!size?.width || !size.height) return design;
  const points = [...design.placements.flatMap((item) => [item?.box, item?.contact]), ...(Array.isArray(design.floor?.outline) ? design.floor.outline : [])].filter((point) => point && typeof point === "object");
  const values = points.flatMap((point: any) => [point.x, point.y, point.width, point.height]).filter((value) => typeof value === "number" && Number.isFinite(value));
  if (!values.some((value) => Math.abs(value) > D.PIXEL_LIMIT)) return design;
  const scale = (point: any) => {
    if (!point || typeof point !== "object") return;
    for (const key of ["x", "width"] as const) if (typeof point[key] === "number") point[key] /= size.width;
    for (const key of ["y", "height"] as const) if (typeof point[key] === "number") point[key] /= size.height;
  };
  points.forEach(scale);
  if (design.floor && typeof design.floor.horizon === "number" && Math.abs(design.floor.horizon) > D.PIXEL_LIMIT) design.floor.horizon /= size.height;
  return design;
};
export const normalizeMotionSceneDesign = (raw: unknown, nodes: MotionRemotionNode[], size?: { width: number; height: number }): MotionSceneDesign => {
  if (!raw || typeof raw !== "object" || Array.isArray(raw) || !Array.isArray((raw as MotionSceneDesign).placements)) throw new Error(D.INVALID);
  const design = toCanvasShare(structuredClone(raw) as MotionSceneDesign, size);
  const finite = (value: unknown) => typeof value === "number" && Number.isFinite(value);
  const point = (value: { x: number; y: number }) => finite(value?.x) && finite(value?.y) && Math.abs(value.x) <= 2 && Math.abs(value.y) <= 2;
  const wanted = new Set(nodes.filter((node) => node.kind !== RT_SHARED.LABEL).map((node) => node.id));
  const seen = new Set<string>();
  design.placements = design.placements.filter((item) => {
    if (motionResponseErrors(item, MOTION_SCENE_PLACEMENT_SCHEMA).length || seen.has(item.id) || !point(item.box) || !finite(item.box.width) || !finite(item.box.height) || item.box.width <= 0 || item.box.height <= 0 || item.box.width > 2 || item.box.height > 2) return false;
    seen.add(item.id);
    return true;
  });
  if (!design.placements.length || (wanted.size && !design.placements.some((item) => wanted.has(item.id)))) throw new Error(D.INVALID);
  for (const item of design.placements) {
    if (!finite(item.depth)) item.depth = 0;
    if (typeof item.construction !== "string") item.construction = "";
    if (item.contact && !point(item.contact)) delete item.contact;
    if (item.supportId && ((!seen.has(item.supportId) && !([RT_SHARED.FLOOR, RT_CORE.WALL, RT_CORE.CEILING, RT_SHARED.WATER] as string[]).includes(item.supportId)) || item.supportId === item.id)) delete item.supportId;
  }
  if (typeof design.camera !== "string") design.camera = "";
  if (design.floor && (!finite(design.floor.horizon) || !Array.isArray(design.floor.outline) || !design.floor.outline.every(point))) delete design.floor;
  return design;
};
