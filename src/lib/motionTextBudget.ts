import _ from "lodash";
import { MOTION_TEXT_BUDGET as B } from "../constants/motionTextBudget.js";
import { MOTION_HISTORY } from "../constants/motionHistory.js";
import type { MotionHud } from "../types/motionVideo.js";
const stop = new Set<string>(B.STOPWORDS);
export const motionTextWords = (value: unknown): string[] =>
  _.filter(
    _.toLower(_.toString(value ?? B.EMPTY))
      .replace(B.NUMBER_GROUP_RE, B.NUMBER_GROUP_REPLACE)
      .split(B.WORD_SPLIT_RE),
    (w) => w.length > 1 && !stop.has(w),
  );
export const motionTextCovered = (value: unknown, spoken: Set<string>): boolean => {
  const words = motionTextWords(value);
  return words.length >= B.MIN_WORDS && _.filter(words, (w) => spoken.has(w)).length / words.length >= B.COVERED_RATIO;
};
const budgetMap = (params: Record<string, any>, spoken: Set<string>): Record<string, any> => {
  const arrows: any[] = params.arrows || [],
    cities: any[] = params.cities || [];
  const labels = _.filter((params.labels || []) as any[], (l) => !motionTextCovered(l?.text, spoken));
  const M = B.MAP,
    R = B.RANK;
  const key = (kind: string, index: number): string => kind + M.SEP + index;
  const slots: { kind: string; index: number; rank: number }[] = [
    ..._.map(labels, (l, index) => ({ kind: M.LABELS, index, rank: l?.big ? R.BIG_LABEL : R.LABEL })),
    ..._.flatMap(arrows, (a, index) => (a?.label ? [{ kind: M.ARROWS, index, rank: motionTextCovered(a.label, spoken) ? R.SPOKEN_ARROW : R.ARROW }] : [])),
    ..._.map(cities, (c, index) => ({ kind: M.CITIES, index, rank: c?.capital ? R.CAPITAL : R.CITY })),
  ];
  const keep = new Set(_.map(_.take(_.sortBy(slots, M.RANK), B.MAP_TEXT_MAX), (s) => key(s.kind, s.index)));
  return {
    ...params,
    labels: _.filter(labels, (_l, index) => keep.has(key(M.LABELS, index))),
    arrows: _.map(arrows, (a, index) => (a?.label && !keep.has(key(M.ARROWS, index)) ? _.omit(a, M.LABEL) : a)),
    cities: _.map(cities, (c, index) => (keep.has(key(M.CITIES, index)) ? c : { ...c, [M.HIDE]: true })),
  };
};
export const budgetShotText = (template: string, params: Record<string, any>, narration: string, hud?: MotionHud): Record<string, any> => {
  const spoken = new Set(motionTextWords(narration));
  let out: Record<string, any> = { ...params };
  const secondary = B.SECONDARY[template] || [];
  for (const field of secondary) if (motionTextCovered(out[field], spoken)) out[field] = undefined;
  const max = B.SECONDARY_MAX[template];
  if (max != null) {
    const present = _.filter(secondary, (field) => !!out[field]);
    for (const field of _.drop(present, max)) out[field] = undefined;
  }
  if (hud?.date && B.HUD_DATE_FIELD[template]) out[B.HUD_DATE_FIELD[template]] = undefined;
  if (hud?.counter && B.HUD_COUNTER_FIELD[template]) out[B.HUD_COUNTER_FIELD[template]] = undefined;
  if (template === MOTION_HISTORY.GEOMAP) out = budgetMap(out, spoken);
  return _.omitBy(out, _.isUndefined);
};
