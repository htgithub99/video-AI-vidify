import _ from "lodash";
import { HIGHLIGHT_ANCHOR_WEIGHT, HIGHLIGHT_ANCHORS, HIGHLIGHT_SIDE, type HighlightAnchor } from "../constants/highlightAnchor.js";
export const highlightColumn = (anchor: HighlightAnchor): 0 | 1 | 2 => (anchor[1] === "l" ? 0 : anchor[1] === "c" ? 1 : 2);
export const highlightRow = (anchor: HighlightAnchor): 0 | 1 | 2 => (anchor[0] === "t" ? 0 : anchor[0] === "m" ? 1 : 2);
const hash = (text: string): number => [...text].reduce((h, ch) => Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0, 2166136261);
export const pickHighlightAnchor = (opts: { seed: string; avoid?: HighlightAnchor[]; subjectX?: number }): HighlightAnchor => {
  const free = HIGHLIGHT_ANCHORS.filter((a) => !opts.avoid?.includes(a));
  const pool = free.length ? free : ["bl" as HighlightAnchor];
  const away = opts.subjectX === undefined ? undefined : opts.subjectX < HIGHLIGHT_SIDE.LEFT ? 2 : opts.subjectX > HIGHLIGHT_SIDE.RIGHT ? 0 : undefined;
  const score = (a: HighlightAnchor) => HIGHLIGHT_ANCHOR_WEIGHT[a] + (away === undefined ? 0 : highlightColumn(a) === away ? 3 : highlightColumn(a) === 1 ? 0 : -3);
  const best = _.max(pool.map(score))!;
  const top = pool.filter((a) => score(a) >= best - 1);
  const weights = top.map((a) => score(a) - best + 2);
  let roll = hash(opts.seed) % _.sum(weights);
  return top.find((_a, i) => (roll -= weights[i]) < 0) || top[0];
};
