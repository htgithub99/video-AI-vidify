import _ from "lodash";
import { REUP_THUMBS as T } from "../constants/reupConfig.js";
import type { ThumbConcept } from "../../../constants/thumbConcepts.js";
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
export const reupThumbSpots = (slots: Pick<ReupThumbSlot, "layout" | "lines">[], focus: (number | undefined)[], pastSpots: string[], seedText: string): (ReupThumbSpot | undefined)[] => {
  const used: ReupThumbSpot[] = [];
  const seed = seedOf(seedText);
  const out: (ReupThumbSpot | undefined)[] = slots.map(() => undefined);
  const choices = slots.map(({ layout }, i) => {
    const all = T.SPOTS[layout] as readonly ReupThumbSpot[];
    const f = focus[i];
    const clear = all.filter((s) => (f === undefined ? true : f < T.SUBJECT_LEFT ? s[1] !== "l" : f > T.SUBJECT_RIGHT ? s[1] !== "r" : s[1] !== "c"));
    return clear.length ? clear : all;
  });
  for (const i of _.sortBy(
    slots.flatMap((s, i) => (s.lines ? [i] : [])),
    (i) => choices[i].length,
  )) {
    const open = choices[i].filter((s) => !used.includes(s));
    const spot = freshest(open.length ? open : choices[i], [...used, ...pastSpots], seed + i)[0];
    used.push(spot);
    out[i] = spot;
  }
  return out;
};
