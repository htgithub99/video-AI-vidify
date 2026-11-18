// The object catalogue: every word names one thing, every kit drawing it points to exists in the kit, and the figure
// runtime picks the drawing by the story's year and the build the scene gives (a word it does not list, a thing outside
// its years or a build it cannot draw stays the scene's own drawing).
import assert from "node:assert/strict";
import { chromium } from "playwright";
import { MOTION_OBJECT_CATALOG } from "../src/constants/motionObjectCatalog.js";
import { MOTION_CATALOG_RUNTIME, motionCatalogEntries, motionCatalogWord } from "../src/lib/motionObjectCatalog.js";
import { motionFigureKitPage as motionHtmlFigures } from "../src/lib/motionFigures.js";

const SCENE = `<!doctype html><html><head></head><body><canvas id="motion-canvas" width="1280" height="720"></canvas><script>
const FIG = window.MotionFigures.use({});
window.motionScene = { ready: Promise.resolve(), renderAt: async () => {} };
</script></body></html>`;

// Words: ids and other names are unique per FIG function (the runtime table throws on a clash when built).
for (const entry of MOTION_OBJECT_CATALOG) for (const word of [entry.id, ...entry.names]) assert.equal(MOTION_CATALOG_RUNTIME.words[entry.fn][motionCatalogWord(word)], MOTION_OBJECT_CATALOG.indexOf(entry), `${entry.fn}:${word}`);
// Years filter what a scene may name.
const at = (fn: Parameters<typeof motionCatalogEntries>[0], year?: number) => motionCatalogEntries(fn, year).map((entry) => entry.id);
assert.ok(!at("vehicle", 1241).includes("tank") && at("vehicle", 1241).includes("wagon") && at("vehicle", 1942).includes("tank"));
assert.ok(at("vehicle").includes("tank"), "no year: every entry");

const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || "/usr/bin/google-chrome" });
const page = await browser.newPage();
const open = async (year?: number) => page.setContent(motionHtmlFigures(SCENE, { profile: "stick", proportion: "balanced", layout: "wide", year }));
await open();
// Every kit drawing the catalogue points to is one the kit draws (bridges are drawn by the figure runtime).
const targets = [...new Set(MOTION_OBJECT_CATALOG.flatMap((entry) => entry.variants.map((variant) => variant.kit.join(":"))))].filter((target) => !target.startsWith("bridge:"));
const missing = await page.evaluate((list) => list.filter((target) => { const [fn, kind] = target.split(":"); const K = (window as any).MotionKit; return !K.knows(fn === "wall" ? "prop" : fn, kind); }), targets);
assert.deepEqual(missing, [], "kit drawings the catalogue points to");
// The runtime's pick: draws through the kit (out.box) or draws nothing when the kit has no fitting drawing (the spec
// fixer drops such items before the page is built).
const drawn = async (year: number | undefined, fn: string, o: Record<string, unknown>) => {
  await open(year);
  return page.evaluate(([fn, o]) => {
    const c = (document.getElementById("motion-canvas") as HTMLCanvasElement).getContext("2d")!;
    const out = (window as any).MotionFigures.use({})[fn as string](c, Object.assign({ x: 400, y: 600, w: 160, h: 120 }, o));
    return out && out.box ? "kit" : "none";
  }, [fn, o] as const);
};
assert.equal(await drawn(1241, "building", { kind: "house" }), "kit", "a medieval house");
assert.equal(await drawn(1241, "vehicle", { kind: "tank" }), "none", "no tank in 1241");
assert.equal(await drawn(1942, "vehicle", { kind: "tank" }), "kit", "a tank in 1942");
assert.equal(await drawn(1241, "building", { kind: "stall" }), "kit", "a market stall from the library");
assert.equal(await drawn(1241, "prop", { kind: "hammer" }), "kit", "a hammer from the library");
assert.equal(await drawn(1241, "prop", { kind: "fluxCapacitor" }), "none", "a thing the library lacks is not drawn");
assert.equal(await drawn(1900, "prop", { kind: "crossbow" }), "none", "no crossbow in 1900");
assert.equal(await drawn(1000, "prop", { kind: "teapot" }), "none", "no teapot in 1000");
assert.equal(await drawn(1241, "building", { kind: "house", build: "mud" }), "kit", "a mud house");
assert.equal(await drawn(1241, "vehicle", { kind: "junk" }), "kit", "a junk in 1241");
assert.equal(await drawn(1241, "prop", { kind: "Covered wagon" }), "kit", "a covered wagon, any spelling, called through FIG.prop");
assert.equal(await drawn(1241, "vehicle", { kind: "wagon", build: "iron" }), "none", "a build the kit cannot draw");
assert.equal(await drawn(1241, "wall", { kind: "gate" }), "none", "a gate not said to be stone is not drawn");
assert.equal(await drawn(1241, "wall", { kind: "gate", build: "stone" }), "kit", "a stone gate");
assert.equal(await drawn(1241, "vehicle", { kind: "ferry" }), "kit", "a medieval ferry is a flat raft");
assert.equal(await drawn(1950, "vehicle", { kind: "ferry" }), "none", "no modern ferry");
await browser.close();
// Everyday kinds take the look of their time: one variant for each year, none overlapping.
const eraKit = (id: string, year: number): string => { const hits = MOTION_OBJECT_CATALOG.find((entry) => entry.id === id)!.variants.filter((v) => (v.from == null || year >= v.from) && (v.to == null || year <= v.to)); assert.equal(hits.length, 1, `${id} ${year}`); return hits[0].kit[1]; };
assert.deepEqual([-450, 50, 1066, 1250, 1540, 1870, 1916, 1990].map((year) => eraKit("helmetProp", year)), ["corinthianHelmet", "galeaHelmet", "nasalHelmet", "greatHelm", "morionHelmet", "pickelhaube", "brodieHelmet", "helmetProp"]);
assert.deepEqual([1890, 1920, 1960].map((year) => eraKit("phone", year)), ["wallPhone", "candlestickPhone", "phone"]);
assert.deepEqual([1880, 1925, 1980].map((year) => [eraKit("bus", year), eraKit("taxi", year)]), [["horseBus", "hansomCab"], ["vintageBus", "vintageTaxi"], ["bus", "taxi"]]);
assert.deepEqual([-50, 1300, 1944].map((year) => eraKit("tent", year)), ["tent", "pavilionTent", "tent"]);
console.log(`Object catalogue: ${MOTION_OBJECT_CATALOG.length} things, ${targets.length} kit drawings, picked by year and build.`);
