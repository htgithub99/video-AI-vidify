import _ from "lodash";
import { MOTION_ERA_SLACK, MOTION_ERA_WORDS, MOTION_PROP_TRAITS, MOTION_REGION_GROUP, MOTION_REGION_WORDS, MOTION_TRAITS_TEXT as T, MOTION_YEAR_RE, type MotionRegion, type MotionTraits } from "../constants/motionSceneTraits.js";
export const motionPhraseRe = (word: string): RegExp => new RegExp(T.PHRASE(_.escapeRegExp(word)), T.FLAGS);
export const motionPhraseHits = (text: string, res: RegExp[]): number => _.sumBy(res, (re) => (re.test(text) ? 1 : 0));
const REGION_RES = _.mapValues(MOTION_REGION_WORDS, (words) => _.map(words, motionPhraseRe));
const ERA_RES = _.map(MOTION_ERA_WORDS, (era) => ({ ...era, res: _.map(era.words, motionPhraseRe) }));
export const motionTextTraits = (value: unknown): MotionTraits => {
  const text = _.toLower(_.toString(value || T.EMPTY));
  if (!text) return {};
  const votes = _.map(_.toPairs(REGION_RES), ([region, res]) => ({ region: region as MotionRegion, hits: motionPhraseHits(text, res) }));
  const best = _.maxBy(votes, (v) => v.hits);
  const second = _.maxBy(
    _.filter(votes, (v) => v.region !== best?.region),
    (v) => v.hits,
  );
  const region = best && best.hits > 0 && best.hits > (second?.hits || 0) ? best.region : undefined;
  const years = _.map(text.match(MOTION_YEAR_RE) || [], Number);
  const era = years.length ? { from: _.min(years), to: _.max(years) } : _.find(ERA_RES, (e) => _.some(e.res, (re) => re.test(text)));
  return _.omitBy({ region, from: era?.from, to: era?.to }, _.isUndefined) as MotionTraits;
};
export const motionMergeTraits = (...list: MotionTraits[]): MotionTraits => {
  const out: MotionTraits = {};
  for (const t of list) {
    if (!out.region && t.region) out.region = t.region;
    if (out.from == null && t.from != null) {
      out.from = t.from;
      out.to = t.to;
    }
  }
  return out;
};
const traitYears = (list: MotionTraits[]): Pick<MotionTraits, "from" | "to"> => {
  const froms = _.compact(_.map(list, (t) => t.from)) as number[],
    tos = _.compact(_.map(list, (t) => t.to)) as number[];
  const from = froms.length ? _.max(froms) : undefined,
    to = tos.length ? _.min(tos) : undefined;
  return { from, to };
};
export const motionCombineTraits = (...list: MotionTraits[]): MotionTraits => {
  const { from, to } = traitYears(list);
  return _.omitBy({ region: _.find(_.map(list, (t) => t.region)), from, to: from != null && to != null && to < from ? undefined : to }, _.isUndefined) as MotionTraits;
};
export const motionPropTraits = (keys: string[]): MotionTraits => {
  const traits = _.compact(_.map(keys, (key) => MOTION_PROP_TRAITS[key]));
  const regions = _.countBy(_.compact(_.map(traits, (t) => t.region)));
  const ranked = _.orderBy(_.toPairs(regions), (pair) => pair[1], T.DESC);
  const top = ranked[0] && (!ranked[1] || ranked[0][1] > ranked[1][1]) ? ranked[0] : undefined;
  const { from, to } = traitYears(traits);
  return _.omitBy({ region: top ? (top[0] as MotionRegion) : undefined, ...(from != null && to != null && from > to ? {} : { from, to }) }, _.isUndefined) as MotionTraits;
};
export const motionRegionGroup = (region?: string): string | undefined => (region ? MOTION_REGION_GROUP[region as MotionRegion] : undefined);
export const motionRegionFits = (item?: MotionRegion, target?: MotionRegion): boolean => !item || !target || MOTION_REGION_GROUP[item] === MOTION_REGION_GROUP[target];
export const motionEraFits = (item: MotionTraits, year?: number): boolean => year == null || ((item.from ?? -Infinity) - MOTION_ERA_SLACK <= year && year <= (item.to ?? Infinity) + MOTION_ERA_SLACK);
export const motionTraitsFit = (item: MotionTraits, target: MotionTraits): boolean => motionRegionFits(item.region, target.region) && motionEraFits(item, target.from);
export const motionTraitsLabel = (t: MotionTraits): string => _.compact([t.region, t.from != null ? String(t.from) : T.EMPTY]).join(T.SPACE);
