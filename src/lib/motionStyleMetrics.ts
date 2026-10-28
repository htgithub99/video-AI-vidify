import { stringifyJson } from "./jsonStringify.js";
import _ from "lodash";
import * as MR from "../constants/motionRuntime.js";
import { MOTION_STYLE_METRIC_LIMITS as LIMITS, MOTION_STYLE_METRIC_VALUES as V, MOTION_STYLE_FIGURE as F } from "../constants/motionStyleMetrics.js";
import type { MotionReferenceStyle, MotionStyleMetrics, MotionStyleShotMix } from "../types/motionVideo.js";
type Vec3 = [number, number, number];
type Box = { min: Vec3; max: Vec3 };
type Mat3 = number[];
const DEG = Math.PI / 180;
const round = (value: number): number => Math.round(value * 1000) / 1000;
const numberIn = (value: unknown, key: string): number | undefined => {
  const n = typeof value === MR.MOTION_TEXT_STRING ? parseFloat(value as string) : (value as number);
  if (typeof n !== MR.MOTION_TEXT_NUMBER || !Number.isFinite(n)) return undefined;
  const [lo, hi] = LIMITS[key];
  return round(_.clamp(n, lo, hi));
};
const shotMixOf = (value: any): MotionStyleShotMix | undefined => {
  if (!value || typeof value !== MR.MOTION_TEXT_OBJECT) return undefined;
  const raw = _.map(V.SHOTS, (shot) => Math.max(0, Number(value[shot]) || 0));
  const total = _.sum(raw);
  if (!total) return undefined;
  return _.zipObject(
    V.SHOTS,
    _.map(raw, (n) => round(n / total)),
  ) as unknown as MotionStyleShotMix;
};
export const normalizeMotionStyleMetrics = (value: any): MotionStyleMetrics | undefined => {
  if (!value || typeof value !== MR.MOTION_TEXT_OBJECT || Array.isArray(value)) return undefined;
  const numbers = _.omitBy(
    _.mapValues(LIMITS, (_range, key) => numberIn(value[key], key)),
    _.isUndefined,
  );
  const metrics = _.omitBy({ ...numbers, bodyShape: _.includes(V.BODY_SHAPES, value.bodyShape) ? value.bodyShape : undefined, groundView: _.includes(V.GROUND_VIEWS, value.groundView) ? value.groundView : undefined, shotMix: shotMixOf(value.shotMix), calibrated: value.calibrated === true ? true : undefined }, _.isUndefined) as MotionStyleMetrics;
  return _.isEmpty(_.omit(metrics, V.CALIBRATED)) ? undefined : metrics;
};
export const motionMetricsText = (metrics: MotionStyleMetrics | undefined): string => (metrics ? stringifyJson(_.omit(metrics, V.CALIBRATED)) : MR.MOTION_TEXT_EMPTY);
export const motionGroundTilted = (style: MotionReferenceStyle | undefined, drawingMode?: string): boolean => drawingMode === MR.MOTION_TEXT_2D && style?.metrics?.groundView === V.TILTED;
const rotation = (rot?: number[]): Mat3 => {
  const [x, y, z] = _.map(rot || [0, 0, 0], (v) => (v || 0) * DEG);
  const cx = Math.cos(x),
    sx = Math.sin(x),
    cy = Math.cos(y),
    sy = Math.sin(y),
    cz = Math.cos(z),
    sz = Math.sin(z);
  return [cy * cz + sy * sx * sz, sy * sx * cz - cy * sz, sy * cx, cx * sz, cx * cz, -sx, cy * sx * sz - sy * cz, sy * sz + cy * sx * cz, cy * cx];
};
const apply = (m: Mat3, v: Vec3): Vec3 => [m[0] * v[0] + m[1] * v[1] + m[2] * v[2], m[3] * v[0] + m[4] * v[1] + m[5] * v[2], m[6] * v[0] + m[7] * v[1] + m[8] * v[2]];
const corners = (box: Box): Vec3[] => _.flatMap([box.min[0], box.max[0]], (x) => _.flatMap([box.min[1], box.max[1]], (y) => _.map([box.min[2], box.max[2]], (z): Vec3 => [x, y, z])));
const unite = (boxes: (Box | null)[]): Box | null => {
  const list = _.compact(boxes);
  if (!list.length) return null;
  return { min: [0, 1, 2].map((i) => _.min(_.map(list, (b) => b.min[i]))!) as Vec3, max: [0, 1, 2].map((i) => _.max(_.map(list, (b) => b.max[i]))!) as Vec3 };
};
const transformBox = (box: Box, node: any): Box => {
  const s: number[] = Array.isArray(node.scale) ? node.scale : typeof node.scale === MR.MOTION_TEXT_NUMBER ? [node.scale, node.scale, node.scale] : [1, 1, 1];
  const m = rotation(node.rot);
  const p: number[] = node.pos || [0, 0, 0];
  const points = _.map(corners(box), (c) => {
    const r = apply(m, [c[0] * s[0], c[1] * s[1], c[2] * s[2]]);
    return [r[0] + p[0], r[1] + p[1], r[2] + p[2]] as Vec3;
  });
  return { min: [0, 1, 2].map((i) => _.min(_.map(points, (q) => q[i]))!) as Vec3, max: [0, 1, 2].map((i) => _.max(_.map(points, (q) => q[i]))!) as Vec3 };
};
const half = (w: number, h: number, d: number): Box => ({ min: [-w / 2, -h / 2, -d / 2], max: [w / 2, h / 2, d / 2] });
const localBox = (node: any, defs: Record<string, any[]>, depth: number): Box | null => {
  const r = Number(node.radius) || 0;
  switch (node.shape) {
    case MR.MOTION_TEXT_BOX:
      return Array.isArray(node.size) ? half(node.size[0], node.size[1], node.size[2]) : null;
    case MR.MOTION_TEXT_CYLINDER:
    case MR.MOTION_TEXT_CONE: {
      const w = 2 * Math.max(r, Number(node.radiusTop) || 0, Number(node.radiusBottom) || 0);
      return half(w, Number(node.height) || 0, w);
    }
    case MR.MOTION_TEXT_SPHERE:
      return half(2 * r, 2 * r, 2 * r);
    case MR.MOTION_TEXT_CAPSULE:
      return half(2 * r, Math.max(Number(node.height) || 0, 2 * r), 2 * r);
    case MR.MOTION_TEXT_DISC:
    case MR.MOTION_TEXT_RING:
      return half(2 * r, 2 * r, 0.01);
    case MR.MOTION_TEXT_PLANE:
      return Array.isArray(node.size) ? half(node.size[0], node.size[1], 0.01) : null;
    case MR.MOTION_TEXT_EXTRUDE: {
      const pts: number[][] = Array.isArray(node.points) ? node.points : [];
      if (!pts.length) return null;
      const d = Number(node.depth) || 0;
      return { min: [_.min(_.map(pts, 0))!, _.min(_.map(pts, 1))!, -d / 2], max: [_.max(_.map(pts, 0))!, _.max(_.map(pts, 1))!, d / 2] };
    }
    case MR.MOTION_TEXT_GROUP:
      return unite(_.map(node.children || [], (child) => motionNodeBox(child, defs, depth + 1)));
    case MR.MOTION_TEXT_USE:
      return unite(_.map(defs[node.ref] || [], (child) => motionNodeBox(child, defs, depth + 1)));
    case MR.MOTION_TEXT_REPEAT: {
      const inner = node.node ? motionNodeBox(node.node, defs, depth + 1) : null;
      if (!inner) return null;
      const count: number[] = node.count || [1, 1, 1],
        step: number[] = node.step || [0, 0, 0];
      const ex = [0, 1, 2].map((i) => ((count[i] || 1) - 1) * (step[i] || 0));
      return { min: [0, 1, 2].map((i) => inner.min[i] + Math.min(0, ex[i])) as Vec3, max: [0, 1, 2].map((i) => inner.max[i] + Math.max(0, ex[i])) as Vec3 };
    }
    default:
      return null;
  }
};
export const motionNodeBox = (node: any, defs: Record<string, any[]> = {}, depth = 0): Box | null => {
  if (!node || depth > 8 || node.visible === false || node.shape === MR.MOTION_TEXT_LIGHT) return null;
  const box = localBox(node, defs, depth);
  return box ? transformBox(box, node) : null;
};
const colourOf = (node: any, materials: Record<string, any>): string | undefined => {
  const mat = typeof node?.mat === MR.MOTION_TEXT_STRING ? materials[node.mat] : node?.mat;
  return typeof mat?.color === MR.MOTION_TEXT_STRING ? mat.color : undefined;
};
const firstColour = (nodes: any[], materials: Record<string, any>): string | undefined => {
  for (const node of nodes || []) {
    const own = colourOf(node, materials) || firstColour(node.children || [], materials);
    if (own) return own;
  }
  return undefined;
};
const scaleNode = (node: any, k: number): any => {
  const out = { ...node };
  for (const key of [MR.MOTION_TEXT_RADIUS, V.RADIUS_TOP, V.RADIUS_BOTTOM, MR.MOTION_TEXT_HEIGHT]) if (typeof out[key] === MR.MOTION_TEXT_NUMBER && !(key === MR.MOTION_TEXT_HEIGHT && out.shape === MR.MOTION_TEXT_CYLINDER && Math.abs(out.rot?.[0] || 0) === F.ROT_X)) out[key] = round(out[key] * k);
  if (Array.isArray(out.size)) out.size = _.map(out.size, (v: number) => round(v * k));
  if (Array.isArray(out.points)) {
    const box = localBox(out, {}, 0);
    if (box) {
      const cx = (box.min[0] + box.max[0]) / 2,
        cy = (box.min[1] + box.max[1]) / 2;
      out.points = _.map(out.points, ([x, y]: number[]) => [round(cx + (x - cx) * k), round(cy + (y - cy) * k)]);
    }
  }
  if (Array.isArray(out.children)) out.children = _.map(out.children, (child) => scaleNode(child, k));
  return out;
};
