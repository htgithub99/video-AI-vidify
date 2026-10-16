import _ from "lodash";
import { MOTION_COSTUME as C, type MotionCostume, type MotionUniform } from "../constants/motionCostume.js";
import { MOTION_TRAITS_TEXT as T } from "../constants/motionSceneTraits.js";
import { motionPhraseHits, motionPhraseRe, motionRegionGroup } from "./motionSceneTraits.js";
import type { MotionCastMember } from "../types/motionVideo.js";
const NATION_RES = _.mapValues(C.NATION_WORDS, (words) => _.map(words, motionPhraseRe));
const RANK_RES = _.mapValues(C.RANK_WORDS, (words) => _.map(words, motionPhraseRe));
const memberText = (member: MotionCastMember): string => _.toLower(_.compact([member.name, member.role, member.description, member.look, ...(member.tags || [])]).join(T.SPACE));
export const motionCostumeNation = (text: string): string | undefined => {
  const votes = _.map(_.toPairs(NATION_RES), ([nation, res]) => ({ nation, hits: motionPhraseHits(text, res) }));
  const best = _.maxBy(votes, (v) => v.hits);
  return best && best.hits > 0 ? best.nation : undefined;
};
const rankOf = (text: string, type?: string): string | undefined => _.find(C.RANK_ORDER, (rank) => motionPhraseHits(text, RANK_RES[rank]) > 0) || (_.includes(C.MILITARY_TYPES, type) || _.includes(C.ROYAL_TYPES, type) ? type : undefined);
const uniformFor = (nation: string, year?: number): MotionUniform | undefined => {
  const list = C.UNIFORMS[nation] || [];
  return (year == null ? undefined : _.find(list, (u) => u.from <= year && year <= u.to)) || (year == null ? _.first(list) : _.minBy(list, (u) => Math.min(Math.abs(year - u.from), Math.abs(year - u.to))));
};
export const motionCostumeFor = (member: MotionCastMember, year?: number, storyNation?: string): MotionCostume | undefined => {
  const text = memberText(member);
  const nation = motionCostumeNation(text) || (_.includes(C.MILITARY_TYPES, member.type) ? storyNation : undefined);
  const rank = rankOf(text, member.type);
  if (!rank) return undefined;
  const region = nation ? C.NATION_REGION[nation] : undefined;
  if (rank === C.RANK_ORDER[0]) {
    if (!nation || motionRegionGroup(region) === C.LOCAL_GROUP) return undefined;
    return { top: C.ROYAL.top, bottom: C.ROYAL.bottom, hat: C.ROYAL.hat, extras: [...C.ROYAL.extras], label: C.LABEL(nation, rank, year, C.ROYAL.hat), rank, region };
  }
  if (rank === C.RANK_ORDER[1]) {
    if (!nation || motionRegionGroup(region) === C.LOCAL_GROUP) return undefined;
    const old = year != null && year < C.POLITICIAN.oldBefore;
    const hat = old ? C.POLITICIAN.oldHat : undefined;
    const mustache = year != null && year >= C.MUSTACHE_YEARS.from && year <= C.MUSTACHE_YEARS.to;
    return { top: C.POLITICIAN.top, bottom: C.POLITICIAN.bottom, hat, extras: mustache && member.gender !== C.FEMALE ? [...C.POLITICIAN.extras] : [...C.POLITICIAN.modernExtras], label: C.LABEL(nation, rank, year, hat), rank, region };
  }
  if (!nation) return undefined;
  const uniform = uniformFor(nation, year);
  if (!uniform) return undefined;
  const kit = rank === C.RANK_ORDER[2] ? uniform.officer : uniform.soldier;
  return { top: kit.top, bottom: kit.bottom, hat: kit.hat, extras: rank === C.RANK_ORDER[2] ? [C.COSTUME_KEYS.MEDALS] : [], label: C.LABEL(nation, rank, year, kit.hat), rank, region };
};
export const motionCostumeType = (costume: MotionCostume | undefined, type?: string): string | undefined => (costume ? C.RANK_TYPES[costume.rank] || type : type);
const shade = (hex: string, factor: number): string => {
  const n = parseInt(hex.slice(1), 16);
  const ch = (shift: number) => Math.round(((n >> shift) & 255) * factor);
  return C.HASH + ((1 << 24) + (ch(16) << 16) + (ch(8) << 8) + ch(0)).toString(16).slice(1);
};
const paint = (node: any, materials: Record<string, any>, costume: MotionCostume, done: Set<string>): void => {
  if (!node || typeof node !== C.OBJECT) return;
  const name = _.toString(node.name);
  const base = C.TOP_RE.test(name) ? costume.top : C.BOTTOM_RE.test(name) ? costume.bottom : undefined;
  if (base) {
    const color = C.SHADOW_RE.test(name) ? shade(base, C.SHADE) : base;
    if (node.mat && typeof node.mat === C.OBJECT) node.mat = { ...node.mat, color };
    else if (typeof node.mat === C.STRING && materials[node.mat] && !done.has(node.mat)) {
      materials[node.mat] = { ...materials[node.mat], color };
      done.add(node.mat);
    }
  }
  _.forEach(Array.isArray(node.children) ? node.children : [], (child) => paint(child, materials, costume, done));
  if (node.node) paint(node.node, materials, costume, done);
};
const wearable = (id: string, wardrobe: Record<string, any>, parent: string): any | null => {
  if (wardrobe[id]) return { ..._.cloneDeep(wardrobe[id]), id: C.COSTUME_ID + id, visible: true };
  const built = C.BUILT[id];
  return built ? { id: C.COSTUME_ID + id, parent, pos: [0, 0, 0], nodes: _.cloneDeep(built) } : null;
};
export const motionStripParts = (design: any, test: (id: string) => boolean): any => {
  if (!design || !Array.isArray(design.parts)) return design;
  const out = _.cloneDeep(design);
  out.parts = _.filter(out.parts, (part) => !test(_.toString(part.id)));
  return out;
};
export const motionApplyCostume = (source: any, costume: MotionCostume, wardrobe: Record<string, any>): any => {
  if (!source || !Array.isArray(source.parts)) return source;
  const formal = _.includes(C.FORMAL_RANKS, costume.rank);
  const parents = _.fromPairs(_.map(source.parts, (part) => [_.toString(part.id), _.toString(part.parent)]));
  const design = motionStripParts(source, (id) => (!!costume.hat && C.HEADGEAR_RE.test(id)) || (formal && _.includes(C.FORMAL_STRIP_PARENTS, parents[id]) && !_.includes(C.BODY_KEEP, id) && !_.includes(C.LEG_PARTS, id)));
  if (costume.hat)
    _.forEach(design.parts, (part) => {
      if (part.id === C.HAIR_PART && Array.isArray(part.nodes)) part.nodes = _.filter(part.nodes, (node) => !_.includes(C.HAT_HAIR_DROP, node?.shape));
    });
  const materials: Record<string, any> = design.materials || {};
  const done = new Set<string>();
  _.forEach(design.parts, (part) => _.forEach(Array.isArray(part.nodes) ? part.nodes : [], (node) => paint(node, materials, costume, done)));
  if (!_.isEmpty(materials)) design.materials = materials;
  const has = (id: string) => _.some(design.parts, (part) => part.id === id || part.id === C.COSTUME_ID + id);
  const head = _.some(design.parts, (part) => part.id === C.HEAD_PARENT);
  if (costume.hat && head) {
    const hat = wearable(costume.hat, wardrobe, C.HEAD_PARENT);
    if (hat) design.parts.push(hat);
  }
  for (const extra of costume.extras) {
    if (has(extra)) continue;
    const parent = extra === C.COSTUME_KEYS.MUSTACHE ? C.HEAD_PARENT : C.BODY_PARENT;
    const part = wearable(extra, wardrobe, parent);
    if (part && _.some(design.parts, (p) => p.id === part.parent)) design.parts.push(part);
  }
  return design;
};
