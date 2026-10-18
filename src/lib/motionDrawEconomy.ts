import * as MR from "../constants/motionRuntime.js";
import _ from "lodash";
import { MOTION_DRAW_BUDGET as B } from "../constants/motionDrawBudget.js";
import { MOTION_ECONOMY_SHAPES as SH, MOTION_ECONOMY_FALLBACK as F } from "../constants/motionDrawEconomy.js";
import type { MotionStyleConstraints } from "./motionStyleConstraints.js";
export interface MotionPlaceRef { key: string; name?: string; description?: string; interior?: boolean; time?: string; }
export const motionPlaceTokens = (text: string): string[] =>
  _.uniq(
    _.toLower(_.toString(text))
      .normalize(MR.MOTION_TEXT_NFD)
      .replace(B.DIACRITICS, MR.MOTION_TEXT_EMPTY)
      .replace(B.D_STROKE, B.D_PLAIN)
      .split(B.TOKEN_SPLIT)
      .filter((token) => token && !_.includes(B.PLACE_STOPWORDS as readonly string[], token)),
  );
const similar = (a: string[], b: string[]): boolean => {
  if (!a.length || !b.length) return false;
  const shared = _.intersection(a, b).length;
  const [small, large] = a.length <= b.length ? [a, b] : [b, a];
  if (shared === small.length && small.length >= B.PLACE_MATCH_SUBSET_MIN && large.length >= small.length) return true;
  return shared / _.union(a, b).length >= B.PLACE_MATCH_JACCARD;
};
export const motionMatchPlace = (candidate: { key: string; name?: string }, places: MotionPlaceRef[]): string | undefined => {
  const keyTokens = motionPlaceTokens(candidate.key),
    nameTokens = motionPlaceTokens(candidate.name || MR.MOTION_TEXT_EMPTY);
  const hit = _.find(places, (place) => place.key !== candidate.key && (similar(keyTokens, motionPlaceTokens(place.key)) || (!!nameTokens.length && similar(nameTokens, motionPlaceTokens(place.name || MR.MOTION_TEXT_EMPTY)))));
  return hit?.key;
};
const walkNodes = (list: unknown, visit: (node: any) => void): void => {
  if (!Array.isArray(list)) return;
  for (const node of list) {
    if (!node || typeof node !== MR.MOTION_TEXT_OBJECT) continue;
    visit(node);
    walkNodes(node.children, visit);
    if (node.node) walkNodes([node.node], visit);
  }
};
const scaleCount = (count: unknown[], factor: number): unknown[] => {
  const axes = _.filter(count, (n) => Number(n) > 1).length || 1;
  const k = Math.pow(factor, 1 / axes);
  return _.map(count, (n) => (Number(n) > 1 ? Math.max(1, Math.floor(Number(n) * k)) : n));
};
const countTotal = (count: unknown[]): number => _.reduce(count, (product, n) => product * Math.max(1, Math.round(Number(n) || 1)), 1);
export const motionTrimRepeats = (raw: any, instances: number, max: number = B.MAX_INSTANCES): any => {
  if (!raw || typeof raw !== MR.MOTION_TEXT_OBJECT) return raw;
  const copy = _.cloneDeep(raw);
  const factor = instances > max ? (max / instances) * 0.9 : 1;
  const shrink = (node: any) => {
    if (node.shape !== SH.REPEAT || !Array.isArray(node.count)) return;
    const total = countTotal(node.count);
    if (total > B.MAX_REPEAT) node.count = scaleCount(node.count, (B.MAX_REPEAT / total) * 0.98);
    if (factor < 1) node.count = scaleCount(node.count, factor);
  };
  walkNodes(copy.nodes, shrink);
  _.forEach(copy.defs || {}, (def) => walkNodes(Array.isArray(def) ? def : def?.nodes, shrink));
  return copy;
};
export const motionLocationGroups = <T extends MotionPlaceRef>(places: T[], weight: (place: T) => number): T[][] => {
  const ordered = _.orderBy(places, [weight], [MR.MOTION_TEXT_DESC]);
  const groups: T[][] = [];
  let current: T[] = [],
    chars = 0;
  for (const place of ordered) {
    const size = _.size(place.description) + _.size(place.name);
    if (current.length && (current.length >= B.LOCATION_BATCH || chars + size > B.LOCATION_BATCH_CHARS)) {
      groups.push(current);
      current = [];
      chars = 0;
    }
    current.push(place);
    chars += size;
  }
  if (current.length) groups.push(current);
  return groups;
};
const luma = (hex: string): number => {
  const v = parseInt(hex.replace(F.HASH, MR.MOTION_TEXT_EMPTY), 16);
  return Number.isFinite(v) ? (((v >> 16) & 255) * 0.3 + ((v >> 8) & 255) * 0.59 + (v & 255) * 0.11) / 255 : 0.5;
};
const hexes = (palette: string[] | undefined): string[] => _.filter(palette || [], (c) => F.HEX.test(c));
const pick = (palette: string[], target: number, fallback: string): string => _.minBy(palette, (c) => Math.abs(luma(c) - target)) || fallback;
const flat = (color: string) => ({ color, roughness: 1, metalness: 0, unlit: true });
export const motionFallbackLocation = (place: MotionPlaceRef, palette: string[] | undefined): any => {
  const colors = hexes(palette);
  const night = _.includes(F.DARK_TIMES as readonly string[], place.time || MR.MOTION_TEXT_EMPTY);
  const ground = pick(colors, night ? 0.12 : 0.38, F.GROUND),
    wall = pick(colors, night ? 0.08 : 0.6, F.WALL),
    sky = pick(colors, night ? 0.05 : 0.62, F.SKY);
  const nodes = place.interior
    ? [
        { shape: SH.BOX, name: F.FLOOR_NAME, size: [24, 0.1, 14], pos: [0, -0.05, 0], mat: F.MAT_GROUND },
        { shape: SH.BOX, name: F.WALL_NAME, size: [24, 6, 0.2], pos: [0, 3, -4], mat: F.MAT_WALL },
      ]
    : [
        { shape: SH.BOX, name: F.FLOOR_NAME, size: [60, 0.1, 30], pos: [0, -0.05, 0], mat: F.MAT_GROUND },
        { shape: SH.BOX, name: F.WALL_NAME, size: [60, 2.4, 0.2], pos: [0, 1.2, -9], mat: F.MAT_WALL },
      ];
  return {
    name: place.name || place.key,
    interior: !!place.interior,
    time: place.time || (place.interior ? F.INTERIOR : F.DAY),
    materials: { [F.MAT_GROUND]: flat(ground), [F.MAT_WALL]: flat(wall) },
    ...(place.interior ? { background: wall } : { sky: { top: sky, horizon: wall } }),
    nodes,
    stage: { center: [0, 0], size: [8, 6] },
    camera: { pos: [0, 1.6, 9], target: [0, 1.2, 0], fov: 40 },
  };
};
export const motionFallbackCharacter = (constraints: MotionStyleConstraints, index: number, palette: string[] | undefined, bodyHexes: string[], drawingMode?: string): any => {
  const colors = bodyHexes.length ? bodyHexes : hexes(palette);
  const body = colors.length ? colors[index % colors.length] : F.BODY;
  const skin = constraints.faceFill || F.SKIN;
  const flat2d = drawingMode === F.MODE_2D;
  const head = flat2d ? { shape: SH.DISC, radius: 0.32, segments: 32, pos: [0, 0, 0], mat: F.MAT_SKIN } : { shape: SH.SPHERE, radius: 0.32, pos: [0, 0, 0], mat: F.MAT_SKIN };
  const feature = (id: string, x: number, y: number, r: number, sy: number) => ({ id, parent: F.HEAD, pos: [x, y, flat2d ? 0.02 : 0.31], nodes: [{ shape: SH.DISC, radius: r, segments: 24, scale: [1, sy, 1], pos: [0, 0, 0], mat: F.MAT_LINE }] });
  const arms = _.includes(constraints.absent, F.ARMS) ? [] : _.map([-1, 1], (side) => ({ id: side < 0 ? F.ARM_L : F.ARM_R, parent: F.BODY_ID, pos: [side * 0.27, 0.72, 0], nodes: [{ shape: SH.CAPSULE, radius: 0.06, height: 0.3, pos: [0, -0.17, 0], mat: F.MAT_BODY }] }));
  return {
    materials: { [F.MAT_SKIN]: flat(skin), [F.MAT_BODY]: flat(body), [F.MAT_LINE]: flat(F.LINE) },
    parts: [{ id: F.BODY_ID, pos: [0, 0, 0], nodes: [{ shape: SH.CAPSULE, radius: 0.27, height: 0.5, pos: [0, 0.5, 0], mat: F.MAT_BODY }] }, { id: F.HEAD, parent: F.BODY_ID, pos: [0, 1.15, 0], nodes: [head] }, feature(F.EYE_L, -0.12, 0, 0.04, 1.5), feature(F.EYE_R, 0.12, 0, 0.04, 1.5), ...(_.includes(constraints.absent, F.MOUTH) ? [] : [feature(F.MOUTH, 0, -0.15, 0.035, 1.2)]), ...arms],
    anchors: { body: F.BODY_ID, head: F.HEAD, base: F.BODY_ID },
    poses: { idle: {} },
    expressions: {},
  };
};
