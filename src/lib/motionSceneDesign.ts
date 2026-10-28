import { RUNTIME_TEXT as RT_SHARED } from "../constants/runtime/shared.js";
import { RUNTIME_TEXT as RT_CORE } from "../constants/runtime/core.js";
import { MOTION_SCENE_DESIGN as D, MOTION_SCENE_DESIGN_SCHEMA } from "../constants/motionSceneDesign.js";
import { motionResponseErrors } from "./motionResponseContract.js";
import type { MotionSceneDesign, MotionRemotionNode } from "../types/motionVisual.js";
export const normalizeMotionSceneDesign = (raw: unknown, nodes: MotionRemotionNode[]): MotionSceneDesign => {
  if (motionResponseErrors(raw, MOTION_SCENE_DESIGN_SCHEMA).length) throw new Error(D.INVALID);
  const design = raw as MotionSceneDesign;
  const ids = new Set(design.placements.map((item) => item.id));
  const finite = (value: unknown) => typeof value === "number" && Number.isFinite(value);
  const point = (value: { x: number; y: number }) => finite(value?.x) && finite(value?.y) && Math.abs(value.x) <= 2 && Math.abs(value.y) <= 2;
  if (ids.size !== design.placements.length || nodes.some((node) => node.kind !== RT_SHARED.LABEL && !ids.has(node.id))) throw new Error(D.INVALID);
  for (const item of design.placements) {
    if (
      !point(item.box) ||
      !finite(item.box.width) ||
      !finite(item.box.height) ||
      item.box.width <= 0 ||
      item.box.height <= 0 ||
      item.box.width > 2 ||
      item.box.height > 2 ||
      !finite(item.depth) ||
      (item.contact && !point(item.contact)) ||
      (item.supportId && ((!ids.has(item.supportId) && !([RT_SHARED.FLOOR, RT_CORE.WALL, RT_CORE.CEILING, RT_SHARED.WATER] as string[]).includes(item.supportId)) || item.supportId === item.id))
    )
      throw new Error(D.INVALID);
  }
  if (design.floor && (!finite(design.floor.horizon) || !design.floor.outline.every(point))) throw new Error(D.INVALID);
  return structuredClone(design);
};
