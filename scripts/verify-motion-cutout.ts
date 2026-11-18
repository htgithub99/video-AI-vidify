// "Cắt dán kể chuyện": the drawing style that moves like a cut-out storybook. A walker steps through held leg drawings and
// hops (drawn ahead of its even track mid-step, back on it at each footfall, lifted in an arc); the camera cuts the scene
// into shots at the narration cues, frames the lead person closer on alternate shots, pushes in briefly at each shot's
// start and then holds; the smooth styles keep their camera and walk.
import assert from "node:assert/strict";
import { chromium } from "playwright";
import { motionFigureView, motionFigureRenderKey } from "../src/lib/motionFigures.js";
import { motionFigureKitPage as motionHtmlFigures } from "../src/lib/motionFigures.js";
import { motionHtmlFrame } from "../src/lib/motionHtmlScene.js";
import { normalizeMotionVisualSettings } from "../src/lib/motionVisual.js";

assert.equal(motionFigureView({ profile: "cutout" }).movement, "cutout", "the cut-out style moves as a cut-out");
assert.equal(motionFigureView({ profile: "history" }).movement, "smooth", "other styles move smoothly");
// "Chuyển động" is its own choice: any drawing style can move as a cut-out, and the cut-out style can move smoothly.
assert.equal(motionFigureView({ profile: "history", movement: "cutout" }).movement, "cutout", "the chosen movement wins over the style's");
assert.equal(motionFigureView({ profile: "cutout", movement: "smooth" }).movement, "smooth", "the cut-out style can move smoothly");
assert.notEqual(motionFigureRenderKey({ profile: "history" }), motionFigureRenderKey({ profile: "history", movement: "cutout" }), "a picture shown with the other movement is out of date");
assert.equal(normalizeMotionVisualSettings({ version: 1, mode: "remotion", profileId: "history", movement: "cutout" }).movement, "cutout", "the movement is kept in the settings");
assert.equal(normalizeMotionVisualSettings({ version: 1, mode: "remotion", profileId: "history", movement: "bounce" }).movement, undefined, "an unknown movement is dropped");

// Time jumps dip to black: into a scene with a new date and out of the scene before one; other cuts stay straight.
const sceneAt = (id: string, start: number, timeLabel?: string) => ({ id, startFrame: start, endFrame: start + 150, ...(timeLabel ? { timeLabel } : {}) });
const scenes = [sceneAt("a", 0), sceneAt("b", 150, "1407"), sceneAt("c", 300)];
const spec = (movement?: string, profileId = "history") => ({ fps: 30, width: 1280, height: 720, motion: true, profileId, movement, scenes } as never);
const dipAt = (movement: string | undefined, at: number, frame: number) => motionHtmlFrame(spec(movement), scenes[at] as never, frame).dip || 0;
assert.equal(dipAt(undefined, 1, 150), 0, "the smooth movement cuts straight");
assert.equal(dipAt("cutout", 1, 150), 1, "a scene with a new date opens from black");
assert.ok(dipAt("cutout", 1, 165) === 0 && dipAt("cutout", 1, 155) > 0, "and is clear within half a second");
assert.ok(dipAt("cutout", 0, 149) > 0.9 && dipAt("cutout", 0, 100) === 0, "the scene before a time jump closes to black only at its end");
assert.equal(dipAt("cutout", 2, 300), 0, "a scene in the same time cuts straight");
assert.ok((motionHtmlFrame({ fps: 30, width: 1280, height: 720, motion: true, profileId: "cutout", scenes } as never, scenes[1] as never, 150).dip || 0) === 1, "the cut-out style dips by default");
assert.equal(motionHtmlFrame({ fps: 30, width: 1280, height: 720, motion: false, profileId: "cutout", scenes } as never, scenes[1] as never, 150).headerTime, 1.2, "a still frame shows the place and time title in full");

const SCENE = `<!doctype html><html><head></head><body><canvas id="motion-canvas" width="1280" height="720"></canvas><script>
var FIG = window.MotionFigures.use({});
window.motionScene = { ready: Promise.resolve(), renderAt: async function (input) {
  var c = document.getElementById('motion-canvas').getContext('2d');
  c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = '#ddd'; c.fillRect(0, 0, 1280, 720);
  var p = input.progress || 0;
  FIG.person(c, { x: 300 + 500 * p, y: 600, h: 180, pose: 'walk', distance: 500 * p, mark: 'hero', facing: 1 });
  FIG.person(c, { x: 1000, y: 600, h: 180, pose: 'stand', mark: 'other' });
} };
</script></body></html>`;
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || "/usr/bin/google-chrome" });
const page = await browser.newPage();
page.on("pageerror", (error) => assert.fail(String(error)));

// The camera: three shots at the cues, the middle one framed closer on the hero, a short push-in at each shot's start.
await page.setContent(motionHtmlFigures(SCENE, { profile: "cutout", layout: "wide" } as never));
// tsx names inner functions through a helper that the page does not have.
await page.evaluate("window.__name = function (f) { return f; }");
const camera = await page.evaluate(async () => {
  const scene = (window as any).motionScene, canvas = document.getElementById("motion-canvas") as HTMLCanvasElement, c = canvas.getContext("2d")!;
  const input = (p: number) => ({ progress: p, time: p * 9, duration: 9, fps: 30, cues: [0, 0.34, 0.67], cameraEnabled: true });
  const zoomAt = async (p: number) => { let a = 0; const fill = c.fillRect; c.fillRect = function (...args: any[]) { if (!a) a = this.getTransform().a; return (fill as any).apply(this, args); }; await scene.renderAt(input(p)); c.fillRect = fill; return a; };
  await scene.renderAt(input(0));
  const plan = (window as any).__motionViewHooks.beats;
  return { shots: plan.shots.length, z: plan.shots.map((s: any) => s.z), start: await zoomAt(0.36), held: await zoomAt(0.55), late: await zoomAt(0.62), wide: await zoomAt(0.1) };
});
assert.equal(camera.shots, 3, "a shot for each line of the narration");
assert.ok(camera.z[1] > camera.z[0] * 1.3, "the second shot is framed closer on the lead person");
assert.ok(camera.held > camera.start && Math.abs(camera.late - camera.held) < 1e-6, "each shot pushes in briefly, then holds");
assert.ok(camera.wide >= 1 && camera.wide < 1.3, "the opening shot is the whole frame, with a little room to pan with a walker");

// The walk: drawn ahead of its even track mid-step, back on it at each footfall; lifted mid-step.
await page.setContent(motionHtmlFigures(SCENE.replace("person: function", "unused: function"), { profile: "cutout", layout: "wide" } as never));
await page.evaluate("window.__name = function (f) { return f; }");
const walk = await page.evaluate(async () => {
  const canvas = document.getElementById("motion-canvas") as HTMLCanvasElement, c = canvas.getContext("2d")!, F = (window as any).MotionFigures.use({});
  const box = (o: any) => { c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, 1280, 720); F.person(c, Object.assign({ y: 600, h: 300, view: "side", facing: 1, noShadow: true, outfit: "peasant" }, o)); const d = c.getImageData(0, 0, 1280, 720).data; let top = 720, minx = 1280, maxx = 0; for (let y = 0; y < 720; y += 2) for (let x = 0; x < 1280; x += 2) if (d[(y * 1280 + x) * 4 + 3] > 100) { if (y < top) top = y; if (x < minx) minx = x; if (x > maxx) maxx = x; } return { top, mid: (minx + maxx) / 2 }; };
  const out: any[] = [];
  for (let d = 0; d <= 160; d += 8) { const b = box({ x: 400 + d, pose: "walk", distance: d }); out.push([d, b.mid - (400 + d), b.top]); }
  return out;
});
const ahead = walk.map((w: number[]) => w[1]), tops = walk.map((w: number[]) => w[2]);
assert.ok(Math.max(...ahead) - Math.min(...ahead) > 4, "the walker hops ahead of its even track mid-step");
assert.ok(Math.max(...tops) - Math.min(...tops) >= 2, "the walker lifts as it steps");

// The puppet drawings: a repeated action switches between two held drawings; an entering person is unseen, then in;
// a person the narration has speaking opens and closes the mouth.
const puppet = await page.evaluate(async () => {
  const K = (window as any).MotionKit, c = (document.getElementById("motion-canvas") as HTMLCanvasElement).getContext("2d")!;
  const ink = (o: any) => { c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, 1280, 720); K.person(c, Object.assign({ x: 640, y: 600, r: 40, facing: 1, noShadow: true }, o)); const d = c.getImageData(0, 0, 1280, 720).data; let n = 0, sx = 0; for (let i = 3; i < d.length; i += 16) if (d[i] > 100) { n++; sx += ((i - 3) / 4) % 1280; } return { n, mx: n ? sx / n : 0 }; };
  const hands = new Set<string>();
  for (let t = 0; t < 3; t += 0.05) { const res = K.person(c, { x: 640, y: 600, r: 40, pose: "chop", hold: "axe", t, noShadow: true }); hands.add(res.hand.map((v: number) => Math.round(v)).join(",")); }
  // A walker is one held drawing carried along: at each footfall (no hop, no rock) the figure is the same picture.
  const step = 2 * 0.28 * (1.25 + 1.1) * 40, at = (d: number) => { const res = K.person(c, { x: 640, y: 600, r: 40, pose: "walk", distance: d, t: 0, noShadow: true }); return [res.hand[0] - 640, res.hand[1], res.backHand[0] - 640].map((v: number) => Math.round(v)).join(","); };
  const held = new Set([at(step + 0.01), at(2 * step + 0.01), at(5 * step + 0.01)]).size;
  // Animals and vehicles move the same way: at each footfall a running horse and a cart are the same picture (above the
  // ground line: the soft ground shadow is not part of the drawing).
  const pic = (fn: string, o: any) => { c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, 1280, 720); K[fn](c, Object.assign({ x: 640, y: 600, r: 30, facing: 1, noShadow: true, t: 0 }, o)); return Array.from(c.getImageData(400, 300, 480, 288).data).join(","); };
  const horse = new Set([1, 2, 4].map((k) => pic("animal", { kind: "horse", pose: "run", distance: k * 45 }))).size;
  const cart = new Set([1, 3].map((k) => pic("vehicle", { kind: "cart", moving: true, distance: k * 1.3 * 30 }))).size;
  return { horse, cart, held, hands: hands.size, hidden: ink({ pose: "stand", t: 0.5, enter: { at: 1, from: "left" } }).n, coming: ink({ pose: "stand", t: 1.05, enter: { at: 1, from: "left" } }).mx, arrived: ink({ pose: "stand", t: 2, enter: { at: 1, from: "left" } }).mx };
});
assert.ok(puppet.hands <= 2, "a repeated action switches between two held drawings");
assert.equal(puppet.held, 1, "a walker is one held drawing carried along (the legs do not step)");
assert.equal(puppet.horse, 1, "a running horse is one held drawing carried along");
assert.equal(puppet.cart, 1, "a moving cart is one held drawing (the wheels do not turn)");
assert.equal(puppet.hidden, 0, "a person entering later is unseen before it enters");
assert.ok(puppet.coming < puppet.arrived - 20 && Math.abs(puppet.arrived - 640) < 40, "and comes in from its side to its place");
const talk = await page.evaluate(async () => {
  const scene = (window as any).motionScene, c = (document.getElementById("motion-canvas") as HTMLCanvasElement).getContext("2d")!;
  const shot = async (speaking: unknown[], time: number) => { await scene.renderAt({ progress: 0.2, time, duration: 9, fps: 30, cameraEnabled: false, speaking }); return Array.from(c.getImageData(900, 380, 200, 120).data).join(","); };
  let moved = 0;
  for (const time of [1.8, 1.85, 1.9, 1.95]) if ((await shot([], time)) !== (await shot([{ entityId: "other", start: 0, end: 5 }], time))) moved++;
  return { moved };
});
assert.ok(talk.moved > 0, "the person the narration has speaking moves the mouth");

// A thought bubble or inset hands its picture a box with the bubble's centre and radius.
const DEVICE = `<!doctype html><html><head></head><body><canvas id="motion-canvas" width="1280" height="720"></canvas><script>
var FIG = window.MotionFigures.use({});
window.motionScene = { ready: Promise.resolve(), renderAt: async function () {
  var c = document.getElementById('motion-canvas').getContext('2d');
  FIG.device(c, { kind: 'inset', x: 640, y: 300, r: 80 }, function (dc, box) { window.__box = box; FIG.prop(dc, { kind: 'whetstone', x: box.cx, y: box.cy, w: 50, h: 30 }); });
} };
</script></body></html>`;
await page.setContent(motionHtmlFigures(DEVICE, { profile: "cutout", layout: "wide" } as never));
await page.evaluate("window.__name = function (f) { return f; }");
const device = await page.evaluate(async () => { await (window as any).motionScene.renderAt({ progress: 0.5, time: 1, duration: 4, cameraEnabled: false }); const b = (window as any).__box; return { cx: b && b.cx, cy: b && b.cy, r: b && b.r }; });
assert.deepEqual([device.cx, device.cy, device.r], [640, 300, 80], "the bubble's box gives its centre and radius");

// A thing called without a kind is named by its mark ('wagons' is a wagon, drawn by the kit); a rider's banner and a
// banner prop wear the scene's colour.
const NAMED = `<!doctype html><html><head></head><body><canvas id="motion-canvas" width="1280" height="720"></canvas><script>
var FIG = window.MotionFigures.use({});
window.motionScene = { ready: Promise.resolve(), renderAt: async function () {
  var c = document.getElementById('motion-canvas').getContext('2d'); window.__wagon = 0; c.fillStyle = '#ffffff'; c.fillRect(0, 0, 1280, 720);
  window.__wagon = FIG.vehicle(c, { mark: 'wagons', x: 200, y: 600, w: 220, h: 110 }).box ? 1 : 0;
  FIG.animal(c, { kind: 'horse', x: 640, y: 600, h: 260, facing: 1, rider: { pose: 'ride', hold: 'banner', itemColor: '#1f60ff', head: 'helmet' } });
  FIG.prop(c, { kind: 'banner', x: 1050, y: 600, w: 120, h: 300, color: '#00c040' });
} };
</script></body></html>`;
await page.setContent(motionHtmlFigures(NAMED, { profile: "cutout", layout: "wide", year: 1241 } as never));
await page.evaluate("window.__name = function (f) { return f; }");
const named = await page.evaluate(async () => {
  const c = (document.getElementById("motion-canvas") as HTMLCanvasElement).getContext("2d")!;
  await (window as any).motionScene.renderAt({ progress: 0.5, time: 1, duration: 4, cameraEnabled: false });
  const count = (x: number, w: number, test: (r: number, g: number, b: number) => boolean) => { const d = c.getImageData(x, 0, w, 720).data; let n = 0; for (let i = 0; i < d.length; i += 4) if (test(d[i], d[i + 1], d[i + 2])) n++; return n; };
  return { wagon: (window as any).__wagon, blue: count(450, 400, (r, g, b) => b > 200 && r < 80), green: count(950, 250, (r, g, b) => g > 150 && r < 60 && b < 100) };
});
assert.equal(named.wagon, 1, "a wagon named only by its mark is drawn by the kit");
assert.ok(named.blue > 300, "a rider's banner is drawn in the scene's colour");
assert.ok(named.green > 300, "a banner prop's cloth is the scene's colour");

// A lying figure's head point is where its head is drawn (a bandage, an emote or a held thing follows it), in every style;
// a ferry before engines is a railed scow, not a raft.
for (const profile of ["cutout", "history"]) {
  const page = await browser.newPage();
  await page.setContent(motionHtmlFigures(`<!doctype html><html><head></head><body><canvas id="motion-canvas" width="1280" height="720"></canvas><script>
var FIG = window.MotionFigures.use({});
window.motionScene = { ready: Promise.resolve(), renderAt: async function () { var c = document.getElementById('motion-canvas').getContext('2d'); window.__lie = FIG.person(c, { x: 400, y: 600, h: 200, pose: 'lie', wounded: true }); window.__stand = FIG.person(c, { x: 800, y: 600, h: 200, pose: 'stand' }); } };
</script></body></html>`, { profile, layout: "wide", year: 1241 } as never));
  const heads = await page.evaluate(async () => { const W = window as any; await W.motionScene.renderAt({ progress: 0.5, time: 1, duration: 4 }); return { lie: W.__lie.head, stand: W.__stand.head }; });
  await page.close();
  assert.ok(heads.lie[1] > 600 - 200 * 0.35 && Math.abs(heads.lie[0] - 400) > 200 * 0.25, `${profile}: a lying figure's head is low beside its body`);
  assert.ok(heads.stand[1] < 600 - 200 * 0.6, `${profile}: a standing figure's head is at the top`);
}
{
  const { MOTION_CATALOG_RUNTIME } = await import("../src/lib/motionObjectCatalog.js");
  const ferry = MOTION_CATALOG_RUNTIME.entries[MOTION_CATALOG_RUNTIME.words.vehicle.ferry];
  assert.deepEqual(ferry.variants[0].kit, ["vehicle", "ferry"], "a ferry before engines is drawn as a ferry");
}

// The place and time title: a storybook caption at the top centre, shown at the scene's start and gone after a few seconds;
// the dip covers the whole frame.
const TITLED = SCENE.replace("FIG.person(c, { x: 1000", "FIG.header(c, { text: 'Thăng Long, 1407' }); FIG.person(c, { x: 1000");
await page.setContent(motionHtmlFigures(TITLED, { profile: "cutout", layout: "wide" } as never));
await page.evaluate("window.__name = function (f) { return f; }");
const title = await page.evaluate(async () => {
  const scene = (window as any).motionScene, c = (document.getElementById("motion-canvas") as HTMLCanvasElement).getContext("2d")!;
  const at = async (time: number, dip = 0) => { await scene.renderAt({ progress: time / 9, time, duration: 9, fps: 30, cameraEnabled: false, dip }); const d = c.getImageData(340, 30, 600, 120).data; let light = 0; for (let i = 0; i < d.length; i += 4) if (d[i] > 236 && d[i + 2] < 218) light++; const m = c.getImageData(640, 400, 1, 1).data; return { light, centre: m[0] + m[1] + m[2] }; };
  return { shown: await at(1.2), gone: await at(6.5), black: await at(6.5, 1) };
});
assert.ok(title.shown.light > 300, "the place and year show at the top at the scene's start");
assert.equal(title.gone.light, 0, "and fade away after a few seconds");
assert.equal(title.black.centre, 0, "the dip covers the frame");
await browser.close();
console.log("Cut-out movement (its own choice): puppet drawings (two held drawings per repeated action, entrances, speaking mouths), dips at time jumps, a storybook title, shots at the narration cues with a closer frame and a short push-in, people, animals and vehicles carried along as one held drawing that hops and rocks; things named by their mark, banners in the scene's colour.");
