// The size table covers the whole object library: every kind has a real height and length against a person, a place
// (ground, air, water, held, wall) and, for aircraft and rockets, the poses they are drawn in; each drawing's shape
// matches its real proportions.
import assert from "node:assert/strict";
import { chromium } from "playwright";
import { MOTION_OBJECT_CATALOG as C } from "../src/constants/motionObjectCatalog.js";
import { MOTION_OBJECT_SIZE as Z, motionObjectPlace } from "../src/constants/motionObjectSize.js";
import { motionFigureKitPage } from "../src/lib/motionFigures.js";

const ids = (C as { id: string; fn: string }[]).map((e) => e);
const missing = ids.filter((e) => !Z[e.id]);
assert.deepEqual(missing.map((e) => `${e.fn}:${e.id}`), [], "every library kind has a size");
const extra = Object.keys(Z).filter((id) => !ids.some((e) => e.id === id));
assert.deepEqual(extra, [], "no size for a kind the library does not have");
for (const [id, z] of Object.entries(Z)) assert.ok(z.h > 0 && z.l > 0 && ["ground", "air", "water", "held", "wall"].includes(z.place), id);
for (const id of ["fighter", "bomber", "jet", "helicopter", "attackHelicopter", "rocket", "missile", "drone", "balloon", "airship", "eagle", "fireArrow", "kite"]) assert.equal(Z[id].place, "air", id + " flies");
for (const id of ["wheelbarrow", "harrow", "scarecrow", "crown", "woodPlane", "boltRifle", "whetstone"]) assert.notEqual(Z[id].place, "air", id + " does not fly");
assert.equal(motionObjectPlace("plane", "parked"), "ground", "a parked plane stands on the ground");
assert.equal(motionObjectPlace("rocket", "launch"), "ground");
assert.deepEqual(Z.rocket.poses, ["fly", "launch"]);

// Each drawing's shape (width / height of what the kit paints) against its real proportions (l / h), for things whose
// side view is their length (not wall lines, held long things drawn standing, or scenery whose size varies by nature).
const SKIP = /^(mountain|volcano|glacier|dunes|karst|riceTerraces|cliff|waterfall|cave|caveMouth|villageCluster)$/;
const sample = ids.filter((e) => ["vehicle", "animal", "building"].includes(e.fn) && !SKIP.test(e.id));
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || "/usr/bin/google-chrome" });
const page = await browser.newPage();
await page.setContent(motionFigureKitPage(`<!doctype html><html><head></head><body><canvas id="motion-canvas" width="1280" height="720"></canvas><script>window.FIG = window.MotionFigures.use({}); window.motionScene = { ready: Promise.resolve(), renderAt: async () => {} };</script></body></html>`, { profile: "comic", proportion: "balanced", layout: "wide" } as never));
const shapes = await page.evaluate((list: { id: string; fn: string }[]) => {
  const c = (document.getElementById("motion-canvas") as HTMLCanvasElement).getContext("2d")!;
  // The painted extent of each drawing (soft shadows left out) on a clear canvas.
  return list.map(({ id, fn }) => {
    c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, 1280, 720);
    try { (window as any).FIG[fn](c, { kind: id, x: 640, y: 560, h: 120 }); } catch { return [id, null]; }
    const d = c.getImageData(0, 0, 1280, 720).data; let x0 = 1280, x1 = -1, y0 = 720, y1 = -1;
    for (let y = 0; y < 720; y += 2) for (let x = 0; x < 1280; x += 2) if (d[(y * 1280 + x) * 4 + 3] > 150) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    return [id, x1 > x0 && y1 > y0 ? (x1 - x0) / (y1 - y0) : null];
  });
}, sample);
await browser.close();
const off = shapes.filter(([id, k]) => k && (k as number) / (Z[id as string].l / Z[id as string].h) > 2.2 || k && (k as number) / (Z[id as string].l / Z[id as string].h) < 1 / 2.2);
// A drawing is a cartoon (a train is its engine, a carrier is short): only a shape far beyond that (×4) is wrong.
const wrong = shapes.filter(([id, k]) => k && Math.abs(Math.log((k as number) / (Z[id as string].l / Z[id as string].h))) > Math.log(4));
assert.deepEqual(wrong.map(([id]) => id), [], "no drawing is far from its real shape");
console.log(`Scale standard: ${ids.length} kinds sized; drawings far from their real shape (×2.2): ${off.length ? off.map(([id, k]) => `${id} ${(k as number).toFixed(2)} vs ${(Z[id as string].l / Z[id as string].h).toFixed(2)}`).join(", ") : "none"}`);
