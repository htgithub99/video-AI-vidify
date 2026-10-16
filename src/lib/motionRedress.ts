import _ from "lodash";
import { MOTION_PROP_FALLBACK_TYPES, MOTION_PROP_SCALE, MOTION_PROP_SWAP_NEUTRAL, MOTION_PROP_TRAITS, MOTION_REDRESS as R, type MotionTraits } from "../constants/motionSceneTraits.js";
import { motionTraitsFit } from "./motionSceneTraits.js";
export interface MotionRedressProp { key: string; type: string; size: number[]; nodes: any[]; }
export interface MotionRedressResult { location: any; swapped: string[]; removed: string[]; }
const span = (size?: number[]): number => Math.max(0, ...(Array.isArray(size) ? size.map(Number).filter(Number.isFinite) : [])) || 1;
const traitsOf = (key: string): MotionTraits => MOTION_PROP_TRAITS[key] || {};
export const motionLocationPropKeys = (location: any): string[] => _.keys(location?.defs || {});
const dropUses = (nodes: unknown, refs: Set<string>): any[] =>
  (Array.isArray(nodes) ? nodes : []).flatMap((node: any) => {
    if (!node || typeof node !== R.OBJECT) return [node];
    if (node.shape === R.USE && refs.has(node.ref)) return [];
    const out = { ...node };
    if (Array.isArray(out.children)) out.children = dropUses(out.children, refs);
    if (out.node) {
      const inner = dropUses([out.node], refs);
      if (!inner.length) return [];
      out.node = inner[0];
    }
    return [out];
  });
export const motionRedressLocation = (source: any, target: MotionTraits, props: MotionRedressProp[]): MotionRedressResult => {
  const location = _.cloneDeep(source || {});
  const defs: Record<string, any> = location.defs || {};
  const byKey = _.keyBy(props, (p) => p.key);
  const swapped: string[] = [],
    removed: string[] = [];
  for (const key of _.keys(defs)) {
    const own = traitsOf(key);
    if (_.isEmpty(own) || motionTraitsFit(own, target)) continue;
    const original = byKey[key];
    const types = original ? [original.type, ...(MOTION_PROP_FALLBACK_TYPES[original.type] || [])] : [];
    const rank = (p: MotionRedressProp): number => (traitsOf(p.key).region && traitsOf(p.key).region === target.region ? R.PREFER_REGION : 0) + (p.type === original?.type ? R.PREFER_TYPE : 0);
    const neutral = !!original && _.includes(MOTION_PROP_SWAP_NEUTRAL, original.type);
    const choices = _.filter(props, (p) => p.key !== key && _.includes(types, p.type) && motionTraitsFit(traitsOf(p.key), target) && (neutral || (!!target.region && traitsOf(p.key).region === target.region)) && Array.isArray(p.nodes) && p.nodes.length > 0);
    const pick = _.first(_.orderBy(choices, [rank, (p) => Math.abs(Math.log(span(p.size) / span(original?.size)))], [R.DESC, R.ASC]));
    if (pick) {
      const k = _.clamp(span(original?.size) / span(pick.size), MOTION_PROP_SCALE.MIN, MOTION_PROP_SCALE.MAX);
      defs[key] = [{ shape: R.GROUP, name: pick.key, scale: [k, k, k], children: _.cloneDeep(pick.nodes) }];
      swapped.push(key + R.ARROW + pick.key);
    } else removed.push(key);
  }
  if (removed.length) {
    const refs = new Set(removed);
    _.forEach(removed, (key) => delete defs[key]);
    location.nodes = dropUses(location.nodes, refs);
    _.forEach(_.keys(defs), (key) => (defs[key] = dropUses(defs[key], refs)));
  }
  if (!_.isEmpty(defs) || location.defs) location.defs = defs;
  return { location, swapped, removed };
};
