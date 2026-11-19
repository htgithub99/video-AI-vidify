import { MOTION_CATALOG_ERRORS, MOTION_OBJECT_CATALOG } from "../constants/motionObjectCatalog.js";
import type { MotionCatalogEntry, MotionCatalogFn, MotionCatalogRuntime } from "../types/motionObjectCatalog.js";
export const motionCatalogWord = (value: unknown): string =>
  String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z]/g, "");
const inYears = (item: { from?: number; to?: number }, year: number | undefined): boolean => !(Number.isFinite(year) && ((item.from != null && year! < item.from) || (item.to != null && year! > item.to)));
export const MOTION_CATALOG_RUNTIME: MotionCatalogRuntime = (() => {
  const words: MotionCatalogRuntime["words"] = {};
  MOTION_OBJECT_CATALOG.forEach((entry, index) => {
    const table = (words[entry.fn] ||= {});
    for (const word of [entry.id, ...entry.names].map(motionCatalogWord)) {
      if (table[word] != null) throw new Error(MOTION_CATALOG_ERRORS.DUPLICATE(word, entry.fn));
      table[word] = index;
    }
  });
  return { entries: MOTION_OBJECT_CATALOG.map(({ names: _names, ...entry }) => entry), words };
})();
export const motionCatalogEntries = (fn: MotionCatalogFn, year?: number): MotionCatalogEntry[] => MOTION_OBJECT_CATALOG.filter((entry) => entry.fn === fn && inYears(entry, year) && entry.variants.some((variant) => variant.builds || inYears(variant, year)));
const CORE: Record<"vehicle" | "building" | "animal" | "tree" | "prop" | "wall", string[]> = {
  vehicle: ["wagon", "cart", "boat", "car", "truck", "tank"],
  building: ["house", "hut", "tent", "castle", "tower", "barn", "church", "temple", "pagoda", "ruins"],
  animal: ["horse", "dog", "ox", "cow", "chicken", "crow"],
  tree: ["oak", "pine", "birch", "willow", "palm", "bamboo", "banana", "dead", "bush"],
  prop: ["spear", "sword", "bow", "arrows", "shieldProp", "banner", "barrel", "crate", "sack", "basket", "campfire", "torch", "lantern", "table", "chair", "rock", "boulder", "log", "grass", "flowers", "haystack", "woodpile", "well", "fence", "rifle", "musket"],
  wall: ["palisade", "wall", "gate", "fence", "sandbags", "barbedWire", "stakeRow", "earthwork"],
};
const textWords = (text: string): Set<string> => {
  const list = text
    .toLowerCase()
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .split(/[^a-z]+/)
    .filter(Boolean);
  const raw = text
    .split(/[^A-Za-z]+/)
    .filter(Boolean)
    .map(motionCatalogWord);
  return new Set([...list, ...raw, ...list.slice(1).map((word, index) => list[index] + word)]);
};
export const motionCatalogKinds = (year?: number, text?: string): Record<"vehicle" | "building" | "animal" | "tree" | "prop" | "wall", string> => {
  const words = text == null ? null : textWords(text);
  const ids = (fn: "vehicle" | "building" | "animal" | "tree" | "prop" | "wall") =>
    motionCatalogEntries(fn, year)
      .filter((entry) => !words || CORE[fn].includes(entry.id) || [entry.id, ...entry.names].some((name) => words.has(motionCatalogWord(name))))
      .map((entry) => entry.id)
      .join(", ");
  return { vehicle: ids("vehicle"), building: ids("building"), animal: ids("animal"), tree: ids("tree"), prop: ids("prop"), wall: ids("wall") };
};
export type MotionCatalogGap = { fn: MotionCatalogFn; kind: string; build?: string; reason: "unknown" | "period" | "build" };
const THING_GAP_FNS: MotionCatalogFn[] = ["vehicle", "building", "prop", "animal", "tree"];
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
  if (!inYears(entry, year) || (!entry.variants.some((v) => !v.builds && inYears(v, year)) && !build)) return gap("period");
  if (build && entry.builds && !entry.builds.includes(motionCatalogWord(build))) return gap("build");
  return null;
};
