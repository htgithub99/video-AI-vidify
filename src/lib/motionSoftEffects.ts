import { RUNTIME_VALUES } from "../constants/runtime/values.js";
import { MOTION_SCENE_COMPOSITION as C } from "../constants/motionSceneComposition.js";
import type { MotionSceneComposition, MotionVectorAsset } from "../types/motionVisual.js";
const S = C.SOFT;
const cache = new WeakMap<MotionVectorAsset, WeakMap<MotionSceneComposition, string>>();
const opacity = (tag: string): number => Math.min(1, ...[...tag.matchAll(S.OPACITY)].map((match) => Number(match[1])).filter(Number.isFinite));
const groupEnd = (svg: string, start: number): number => {
  const pattern = new RegExp(S.GROUP_TAG.source, RUNTIME_VALUES.G_CD0AA985);
  pattern.lastIndex = start;
  let depth = 0;
  for (let match = pattern.exec(svg); match; match = pattern.exec(svg)) {
    if (match[2]) continue;
    depth += match[1] ? -1 : 1;
    if (!depth) return match.index;
  }
  return -1;
};
const parentOf = (svg: string, index: number): number => {
  const pattern = new RegExp(S.ANY_TAG.source, RUNTIME_VALUES.G_CD0AA985);
  const stack: number[] = [];
  for (let match = pattern.exec(svg); match && match.index < index; match = pattern.exec(svg)) {
    if (match[2]) continue;
    if (match[1]) stack.pop();
    else stack.push(match.index);
  }
  return stack.at(-1) ?? -1;
};
const behindPeople = (svg: string, composition: MotionSceneComposition, start: number, end: number): string => {
  const parent = parentOf(svg, start);
  const first = composition.layers
    .filter((layer) => layer.kind === RUNTIME_VALUES.CHARACTER_4BCEF3DE)
    .map((layer) => S.OPEN(layer.id).exec(svg)?.index ?? -1)
    .filter((index) => index >= 0 && index < start && parentOf(svg, index) === parent)
    .sort((a, b) => a - b)[0];
  if (first === undefined) return svg;
  const stop = end + S.GROUP_CLOSE.length;
  return svg.slice(0, first) + svg.slice(start, stop) + svg.slice(first, start) + svg.slice(stop);
};
const softGroup = (inner: string): boolean => {
  const shapes = [...inner.matchAll(S.SHAPE)];
  if (!shapes.length) return false;
  const veiled = [...inner.matchAll(S.GROUP)].some((group) => opacity(group[0]) < S.OPACITY_LIMIT);
  const soft = shapes.filter((shape) => !S.STROKE_ONLY.includes(shape[1]) && !S.NO_FILL.test(shape[0]) && (veiled || opacity(shape[0]) < S.OPACITY_LIMIT));
  return soft.length / shapes.length >= S.SHARE;
};
export const motionSoftEffectsSvg = (asset: MotionVectorAsset, composition: MotionSceneComposition): string => {
  const known = cache.get(asset)?.get(composition);
  if (known !== undefined) return known;
  let svg = asset.svg;
  let changed = false;
  for (const layer of composition.layers) {
    if (layer.kind !== RUNTIME_VALUES.EFFECT_DCB57642) continue;
    const open = S.OPEN(layer.id).exec(svg);
    if (!open || S.HAS_FILTER.test(open[0])) continue;
    const end = groupEnd(svg, open.index);
    if (end < 0 || !softGroup(svg.slice(open.index, end))) continue;
    const tag = S.APPLY(open[0], S.FILTER_ID);
    svg = behindPeople(svg.slice(0, open.index) + tag + svg.slice(open.index + open[0].length), composition, open.index, end + tag.length - open[0].length);
    changed = true;
  }
  const result = changed ? svg.replace(S.ROOT, S.DEFS(S.FILTER_ID, Number((asset.height * S.BLUR).toFixed(1)))) : asset.svg;
  if (!cache.has(asset)) cache.set(asset, new WeakMap());
  cache.get(asset)!.set(composition, result);
  return result;
};
