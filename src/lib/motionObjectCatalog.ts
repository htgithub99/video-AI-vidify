import { MOTION_OBJECT_CATALOG } from "../constants/motionObjectCatalog.js";
import type { MotionCatalogEntry, MotionCatalogFn, MotionCatalogRuntime } from "../types/motionObjectCatalog.js";

// Words are compared lower case without separators ("Covered wagon", "covered_wagon" and "coveredWagon" are one word).
export const motionCatalogWord = (value: unknown): string => String(value ?? "").toLowerCase().replace(/[^a-z]/g, "");

const inYears = (item: { from?: number; to?: number }, year: number | undefined): boolean => !(Number.isFinite(year) && ((item.from != null && year! < item.from) || (item.to != null && year! > item.to)));

// What the figure runtime reads (window.__motionCatalog).
export const MOTION_CATALOG_RUNTIME: MotionCatalogRuntime = (() => {
  const words: MotionCatalogRuntime["words"] = {};
  MOTION_OBJECT_CATALOG.forEach((entry, index) => {
    const table = (words[entry.fn] ||= {});
    for (const word of [entry.id, ...entry.names].map(motionCatalogWord)) {
      if (table[word] != null) throw new Error(`motion catalogue: "${word}" names two ${entry.fn} entries`);
      table[word] = index;
    }
  });
  return { entries: MOTION_OBJECT_CATALOG.map(({ names: _names, ...entry }) => entry), words };
})();

// The entries a scene in this year may call by name (all of them when the story names no year).
export const motionCatalogEntries = (fn: MotionCatalogFn, year?: number): MotionCatalogEntry[] => MOTION_OBJECT_CATALOG.filter((entry) => entry.fn === fn && inYears(entry, year) && entry.variants.some((variant) => variant.builds || inYears(variant, year)));

// The kinds every scene of a period is offered (scenery and props most scenes use), beside the ones its own text names.
const CORE: Record<"vehicle" | "building" | "animal" | "tree" | "prop" | "wall", string[]> = {
  vehicle: ["wagon", "cart", "boat", "car", "truck", "tank"],
  building: ["house", "hut", "tent", "castle", "tower", "barn", "church", "temple", "pagoda", "ruins"],
  animal: ["horse", "dog", "ox", "cow", "chicken", "crow"],
  tree: ["oak", "pine", "birch", "willow", "palm", "bamboo", "banana", "dead", "bush"],
  prop: ["spear", "sword", "bow", "arrows", "shieldProp", "banner", "barrel", "crate", "sack", "basket", "campfire", "torch", "lantern", "table", "chair", "rock", "boulder", "log", "grass", "flowers", "haystack", "woodpile", "well", "fence", "rifle", "musket"],
  wall: ["palisade", "wall", "gate", "fence", "sandbags", "barbedWire", "stakeRow", "earthwork"],
};
// The words of a text, lower case, single and each pair joined ("covered wagon" also as "coveredwagon").
const textWords = (text: string): Set<string> => {
  const list = text.toLowerCase().replace(/([a-z])([A-Z])/g, "$1 $2").split(/[^a-z]+/).filter(Boolean);
  const raw = text.split(/[^A-Za-z]+/).filter(Boolean).map(motionCatalogWord);
  return new Set([...list, ...raw, ...list.slice(1).map((word, index) => list[index] + word)]);
};

// The figure table's contract for a scene in this year: each FIG function lists the period's core kinds and every kind the
// scene's text names (all of the period's kinds when no text is given). Anything else is still called by its plain name.
export const motionCatalogKinds = (year?: number, text?: string): Record<"vehicle" | "building" | "animal" | "tree" | "prop" | "wall", string> => {
  const words = text == null ? null : textWords(text);
  const ids = (fn: "vehicle" | "building" | "animal" | "tree" | "prop" | "wall") =>
    motionCatalogEntries(fn, year)
      .filter((entry) => !words || CORE[fn].includes(entry.id) || [entry.id, ...entry.names].some((name) => words.has(motionCatalogWord(name))))
      .map((entry) => entry.id)
      .join(", ");
  return { vehicle: ids("vehicle"), building: ids("building"), animal: ids("animal"), tree: ids("tree"), prop: ids("prop"), wall: ids("wall") };
};

// A FIG call the kit cannot draw, so the scene's own drawing shows it: the word is not in the catalogue, names a thing
// of another time, or asks for a build the thing is never made of.
export type MotionCatalogGap = { fn: MotionCatalogFn; kind: string; build?: string; reason: "unknown" | "period" | "build" };
const THING_GAP_FNS: MotionCatalogFn[] = ["vehicle", "building", "prop", "animal", "tree"];

// The catalogue's answer for one call, the same as the figure runtime's (a thing called through another thing function
// is still that thing).
// The catalogue entry a word names for one function (a thing called through another thing function is still that thing).
export const motionCatalogEntryOf = (fn: MotionCatalogFn, kind: string): MotionCatalogEntry | undefined => {
  const word = motionCatalogWord(kind);
  const words = MOTION_CATALOG_RUNTIME.words;
  let at = words[fn]?.[word];
  if (at == null && THING_GAP_FNS.includes(fn)) for (const other of THING_GAP_FNS) if ((at = words[other]?.[word]) != null) break;
  return at == null ? undefined : MOTION_OBJECT_CATALOG[at];
};
export const motionCatalogGap = (fn: MotionCatalogFn, kind: string, build: string | undefined, year?: number): MotionCatalogGap | null => {
  const gap = (reason: MotionCatalogGap["reason"]): MotionCatalogGap => ({ fn, kind, ...(build ? { build } : {}), reason });
  const entry = motionCatalogEntryOf(fn, kind);
  if (!entry) return gap("unknown");
  if (!inYears(entry, year) || !entry.variants.some((v) => !v.builds && inYears(v, year)) && !build) return gap("period");
  if (build && entry.builds && !entry.builds.includes(motionCatalogWord(build))) return gap("build");
  return null;
};
