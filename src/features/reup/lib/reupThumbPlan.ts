import _ from "lodash";
import { REUP_THUMBS as T } from "../constants/reupConfig.js";
import { THUMB_CAPTION, type ThumbCaption, type ThumbConcept } from "../../../constants/thumbConcepts.js";
import type { ReupThumbKind, ReupThumbLayout, ReupThumbSpot } from "../types/reup.js";
export interface ReupThumbSlot {
  layout: ReupThumbLayout;
  kind?: ReupThumbKind;
  ai: boolean;
  look?: string;
  lines: number;
}
export interface ReupThumbPast {
  layouts: string[];
  kinds: string[];
  looks: string[];
}
const seedOf = (text: string): number => [...text].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
const freshest = <V extends string>(options: readonly V[], past: string[], seed: number): V[] => {
  const age = (o: V): number => {
    const at = past.indexOf(o);
    return at < 0 ? Number.MAX_SAFE_INTEGER : at;
  };
  return _.orderBy(
    options.map((o, i) => ({ o, age: age(o), turn: (i + seed) % options.length })),
    ["age", "turn"],
    ["desc", "asc"],
  ).map((x) => x.o);
};
export const reupThumbCaption = (kind?: ReupThumbKind): ThumbCaption | "none" => (kind && kind !== "signature" ? THUMB_CAPTION[kind] : "none");
export const reupThumbFallback = (kind: ReupThumbKind): ReupThumbLayout => T.FALLBACK[kind];
export const reupThumbLines = (layout: ReupThumbLayout, kind?: ReupThumbKind): number => (kind === "signature" || layout === "cinema" ? 0 : layout === "badge" ? 1 : 2);
export const reupThumbSlots = (past: ReupThumbPast, preset: string, seedText: string): ReupThumbSlot[] => {
  const seed = seedOf(seedText);
  const worded = freshest(T.WORDED, past.layouts, seed)
    .slice(0, T.WORDED_KEEP)
    .map((layout): ReupThumbSlot => ({ layout, ai: false, lines: reupThumbLines(layout) }));
  const concepts = freshest((T.CONCEPTS[preset] || T.CONCEPTS.A) as readonly ThumbConcept[], past.kinds, 0)
    .slice(0, T.CONCEPT_KEEP)
    .map((kind): ReupThumbSlot => ({ layout: "ai", kind, ai: true, lines: reupThumbLines("ai", kind) }));
  const signature: ReupThumbSlot = { layout: "ai", kind: "signature", ai: true, lines: 0, look: freshest(T.LOOKS, past.looks, seed)[0] };
  return [signature, worded[0], concepts[0], worded[1], concepts[1]].filter(Boolean);
};
export const reupNextLook = (look: string | undefined, past: string[]): string => freshest(T.LOOKS, _.compact([look, ...past]), 0).find((l) => l !== look) || T.LOOKS[0];
export const reupThumbSpots = (slots: Pick<ReupThumbSlot, "layout" | "lines" | "kind">[], focus: (number | undefined)[], pastSpots: string[], seedText: string): (ReupThumbSpot | undefined)[] => {
  const seed = seedOf(seedText);
  const out: (ReupThumbSpot | undefined)[] = slots.map(() => undefined);
  const choices = slots.map(({ layout, kind }, i) => {
    const all = (layout === "ai" ? T.CAPTION_SPOTS[reupThumbCaption(kind)] : T.SPOTS[layout]) as readonly ReupThumbSpot[];
    const f = layout === "ai" ? undefined : focus[i];
    const clear = all.filter((s) => (f === undefined ? true : f < T.SUBJECT_LEFT ? s[1] !== "l" : f > T.SUBJECT_RIGHT ? s[1] !== "r" : s[1] !== "c"));
    return clear.length ? clear : all;
  });
  for (const ai of [false, true]) {
    const order = _.sortBy(
      slots.flatMap((s, i) => (s.lines && (s.layout === "ai") === ai ? [i] : [])),
      (i) => choices[i].length,
    );
    const ranked = new Map(order.map((i) => [i, freshest(choices[i], pastSpots, seed + i)]));
    const solve = (k: number, taken: ReupThumbSpot[]): ReupThumbSpot[] | undefined => {
      if (k === order.length) return taken;
      for (const spot of ranked.get(order[k])!)
        if (!taken.includes(spot)) {
          const done = solve(k + 1, [...taken, spot]);
          if (done) return done;
        }
      return undefined;
    };
    const best = solve(0, []);
    const used: ReupThumbSpot[] = [];
    order.forEach((i, k) => {
      const open = choices[i].filter((s) => !used.includes(s));
      const spot = best ? best[k] : freshest(open.length ? open : choices[i], [...used, ...pastSpots], seed + i)[0];
      used.push(spot);
      out[i] = spot;
    });
  }
  return out;
};
