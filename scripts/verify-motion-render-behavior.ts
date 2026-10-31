import { motionCameraBrowserSource } from "../src/lib/motionCamera.js";
import { canReuseRemotionCharacter } from "./legacy-motion-remotion/characterReuse.js";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { chromium } from "playwright";
import { normalizeMotionRenderBehavior, applyMotionRenderBehavior, motionRenderBehaviorFor } from "../src/lib/motionRenderBehavior.js";
import { layoutRemotionNodes, validateRemotionSpec, normalizeRemotionPlacement } from "../src/lib/motionRemotion.js";
import { remotionEffectGeometry, remotionSceneEffects, motionActorScale, motionSceneCameraFrame, motionFrameSeconds, remotionSceneView } from "../src/features/motion/lib/motionRemotionEffects.js";
import { remotionRole } from "../src/lib/motionRemotionGeometry.js";
import { normalizeMotionVector } from "../src/lib/motionVectorAsset.js";
import { resolveRemotionContinuity } from "./legacy-motion-remotion/sceneContinuity.js";
import { findNativeChrome } from "../src/server/services/nativeProxyBrowser.js";
import type { MotionRemotionNode, MotionRemotionSpec, MotionVectorAsset, MotionRenderBehavior } from "../src/types/motionVisual.js";
const output = path.resolve("scratch/motion-behavior-20261027");
fs.mkdirSync(output, { recursive: true });
const combinations: MotionRenderBehavior[] = [
  { version: 1, actors: "fixed", sceneEffects: "off", camera: "fixed" },
  { version: 1, actors: "simple", sceneEffects: "gentle", camera: "gentle" },
];
assert.equal(normalizeMotionRenderBehavior(undefined, true).actors, "simple");
assert.equal(normalizeMotionRenderBehavior(undefined, true).camera, "gentle");
for (const fps of [24, 30, 60]) assert.equal(motionFrameSeconds(fps * 4, fps), 4);
assert.throws(() => normalizeMotionRenderBehavior({ version: 9 }));
const vector = (id: string, w: number, h: number, shape: string, anchors: MotionVectorAsset["anchors"] = { base: { x: 0.5, y: 0.98 } }): MotionVectorAsset => ({ ...normalizeMotionVector(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}">${shape}</svg>`, id, id, id), anchors });
const assets: Record<string, MotionVectorAsset> = {
  background: {
    ...vector("background", 800, 450, '<rect width="800" height="450" fill="#666b6f"/><rect x="20" y="30" width="220" height="310" fill="#192b38"/><path d="M0 340H800V450H0Z" fill="#63564b"/>'),
    regions: { floor: { x: 0, y: 0.74, width: 1, height: 0.2 }, outdoors: { x: 0.025, y: 0.065, width: 0.275, height: 0.69 }, doorway: { x: 0.025, y: 0.065, width: 0.275, height: 0.69 }, pillar: { x: 0.32, y: 0.08, width: 0.035, height: 0.7 }, wall: { x: 0.72, y: 0.15, width: 0.13, height: 0.3 } },
  },
  person: vector("person", 100, 300, '<circle cx="50" cy="38" r="24" fill="#ded5c8"/><path d="M25 65H75L85 230H15Z" fill="#424b64"/><path d="M30 230V294M70 230V294" stroke="#211e1b" stroke-width="10"/>', { base: { x: 0.5, y: 0.98 }, seat: { x: 0.5, y: 0.6 }, body: { x: 0.5, y: 0.5 }, grip: { x: 0.65, y: 0.55 } }),
  bench: vector("bench", 300, 150, '<rect x="10" y="15" width="280" height="25" fill="#745033"/><path d="M35 40V147M265 40V147" stroke="#402c1c" stroke-width="15"/>', { base: { x: 0.5, y: 0.98 }, surface: { x: 0.5, y: 0.1 } }),
  tray: vector("tray", 300, 90, '<ellipse cx="150" cy="50" rx="140" ry="30" fill="#956b46"/><ellipse cx="150" cy="40" rx="120" ry="15" fill="#d4c2a8"/>', { base: { x: 0.5, y: 0.88 }, grip: { x: 0.5, y: 0.8 } }),
  door: vector("door", 200, 400, '<rect x="5" y="5" width="190" height="390" fill="#2b211d"/><path d="M100 10V390" stroke="#85735b" stroke-width="6"/>'),
  incense: vector("incense", 100, 100, '<path d="M20 72Q50 110 80 72Z" fill="#806957"/><path d="M50 74V10" stroke="#352b26" stroke-width="3"/>', { base: { x: 0.5, y: 0.95 }, emitter: { x: 0.5, y: 0.1 } }),
};
const node = (id: string, kind: MotionRemotionNode["kind"], assetKey: string, extra: Partial<MotionRemotionNode> = {}): MotionRemotionNode => ({ id, kind, assetKey, entityId: kind === "character" ? id : undefined, description: id, pose: "standing", slot: "right", evidence: "fixture", ...extra });
const nodes = [
  node("door", "prop", "door", { role: "fixture", mount: "doorway" }),
  node("bench", "prop", "bench", { role: "support", slot: "center" }),
  node("person", "character", "person", { pose: "seated", relation: "on", target: "bench", contact: "seat" }),
  node("tray", "prop", "tray", { relation: "heldBy", target: "person", role: "object" }),
  node("incense", "prop", "incense", { slot: "left", role: "object" }),
];
assert.equal(remotionRole({ ...nodes[2], description: "woman beside a doorway" }), "object");
assert.equal(remotionRole({ ...nodes[3], role: undefined, description: "portrait on altar table" }), "object");
assert.equal(remotionRole({ ...nodes[3], role: undefined, description: "footprints across threshold" }), "decal");
assert.ok(!canReuseRemotionCharacter(nodes[2], "woman"));
const mountedPortrait = node("portrait", "prop", "tray", { description: "portrait on altar table", mount: "wall" });
assert.equal(normalizeRemotionPlacement([mountedPortrait, node("altar", "prop", "bench", { description: "altar table", role: "support" })])[0].relation, undefined);
for (const [width, height] of [
  [800, 450],
  [450, 800],
  [640, 640],
  [640, 800],
]) {
  const placed = layoutRemotionNodes(nodes, assets, width, height, assets.background);
  const person = placed.find((n) => n.id === "person")!,
    bench = placed.find((n) => n.id === "bench")!,
    tray = placed.find((n) => n.id === "tray")!,
    door = placed.find((n) => n.id === "door")!;
  assert.ok(Math.abs(person.y + person.height * 0.6 - bench.y - bench.height * 0.1) < 1e-6);
  assert.ok(person.y + person.height * 0.98 > bench.y + bench.height * 0.1);
  assert.ok(Math.abs(tray.x + tray.width * 0.5 - person.x - person.width * 0.65) < 1e-6);
  assert.ok(Math.abs(tray.y + tray.height * 0.8 - person.y - person.height * 0.55) < 1e-6);
  assert.ok(tray.width <= person.width * 0.851);
  assert.ok(Math.abs(door.y + door.height - (0.065 + 0.69) * height) < 1);
  assert.ok(placed.every((n) => n.x >= 0 && n.y >= 0 && n.x + n.width <= width + 1 && n.y + n.height <= height + 1));
}
const fixture: MotionRemotionSpec = {
  engine: "remotion",
  version: 1,
  title: "Offline behavior fixture",
  aspect: "16:9",
  fps: 30,
  duration: 6,
  width: 800,
  height: 450,
  motion: false,
  profileId: "horror",
  assets,
  subtitles: [],
  scenes: [
    {
      id: "s1",
      beatId: "b1",
      fromLineId: "l1",
      toLineId: "l1",
      purpose: "Rain outside, seated person and incense",
      text: "",
      sourceKey: "fixture",
      place: "room",
      time: "night",
      backgroundKey: "background",
      startFrame: 0,
      endFrame: 180,
      nodes: layoutRemotionNodes(nodes, assets, 800, 450, assets.background),
      effects: [
        { id: "rain", kind: "rain", region: "outdoors" },
        { id: "smoke", kind: "smoke", source: "incense", anchor: "emitter" },
      ],
    },
  ],
};
validateRemotionSpec(fixture);
const fx = remotionEffectGeometry(fixture.scenes[0], assets, 800, 450, combinations[1]);
const source = fixture.scenes[0].nodes.find((n) => n.id === "incense")!;
assert.equal(fx.find((e) => e.kind === "smoke")!.x, source.x + source.width * 0.5);
assert.equal(fx.find((e) => e.kind === "smoke")!.y, source.y + source.height * 0.1);
assert.equal(fx.find((e) => e.kind === "rain")!.region!.width, 800 * 0.275);
assert.deepEqual(remotionEffectGeometry({ ...fixture.scenes[0], effects: [{ id: "bad", kind: "smoke", source: "absent" }] }, assets, 800, 450), []);
const stillClue = remotionEffectGeometry({ ...fixture.scenes[0], effects: [{ id: "smoke", kind: "smoke", source: "incense", essential: true }] }, assets, 800, 450, combinations[0]);
assert.equal(stillClue.length, 1);
assert.equal(stillClue[0].static, true);
for (const behavior of combinations) {
  const restored = JSON.parse(JSON.stringify(behavior));
  assert.deepEqual(normalizeMotionRenderBehavior(restored), behavior);
  const remotion = applyMotionRenderBehavior(fixture, behavior);
  assert.deepEqual(motionRenderBehaviorFor(remotion), behavior);
  const library = applyMotionRenderBehavior({ title: "library", kit: { motion: false }, gen: { characterMotion: false } } as any, behavior);
  assert.deepEqual(motionRenderBehaviorFor(library), behavior);
  assert.equal(library.kit.motion, behavior.actors === "simple");
  assert.equal(motionActorScale(behavior, 2, "a", true), 1);
  assert.equal(remotionEffectGeometry(fixture.scenes[0], assets, 800, 450, behavior).length, behavior.sceneEffects === "gentle" ? 2 : 0);
}
assert.equal(remotionSceneView({ ...fixture.scenes[0], view: "detail" }, 800, 450).scale >= 1, true);
const focalScene = {
  ...fixture.scenes[0],
  view: "detail" as const,
  focus: ["clue"],
  nodes: [
    { ...fixture.scenes[0].nodes[0], id: "clue", x: 540, y: 210, width: 70, height: 60 },
    { ...fixture.scenes[0].nodes[0], id: "incidental", x: 30, y: 30, width: 150, height: 300 },
  ],
};
const focalView = remotionSceneView(focalScene, 800, 450);
assert.equal(focalView.scale, 1.8);
assert.ok(540 * focalView.scale + focalView.x >= 0 && 610 * focalView.scale + focalView.x <= 800);
assert.ok(210 * focalView.scale + focalView.y >= 0 && 270 * focalView.scale + focalView.y <= 450);
const portraitScene = { ...focalScene, focus: ["reaction"], nodes: [{ ...focalScene.nodes[0], id: "reaction", kind: "character" as const, x: 320, y: 150, width: 90, height: 250 }] };
const portraitView = remotionSceneView(portraitScene, 800, 450);
assert.ok(portraitView.scale > 1.8);
assert.ok(320 * portraitView.scale + portraitView.x >= 0 && 410 * portraitView.scale + portraitView.x <= 800);
assert.ok(150 * portraitView.scale + portraitView.y >= 0 && 250 * portraitView.scale + portraitView.y <= 450);
assert.deepEqual(remotionSceneView({ ...portraitScene, view: "wide" }, 800, 450), { scale: 1, x: 0, y: 0 });
const correctedEffects = remotionSceneEffects({
  ...fixture.scenes[0],
  effects: [
    { id: "candle", kind: "flame", source: "candle", anchor: "portrait" },
    { id: "rain", kind: "rain", source: "puddle", anchor: "puddle", region: "background" },
    { id: "mouth-smoke", kind: "smoke", source: "person", anchor: "grip" },
  ],
});
assert.equal(correctedEffects[0].anchor, "flame");
assert.equal(correctedEffects[1].anchor, undefined);
assert.equal(correctedEffects[1].source, undefined);
assert.equal(correctedEffects[1].region, "outdoors");
assert.equal(correctedEffects[2].anchor, "grip");
assert.deepEqual(remotionSceneEffects({ ...fixture.scenes[0], effects: correctedEffects }), correctedEffects);
for (const fps of [24, 30, 60]) {
  const lateScene = { ...fixture.scenes[0], id: "camera-shot", nodes: [], startFrame: fps * 120, endFrame: fps * 156 };
  const start = motionSceneCameraFrame(combinations[1], 120, lateScene, 800, 450, fps);
  const end = motionSceneCameraFrame(combinations[1], 156, lateScene, 800, 450, fps);
  assert.deepEqual(start, end, "Hold without a main subject or authored camera direction");
  assert.ok(end.scale <= 1.045);
  assert.deepEqual(motionSceneCameraFrame(combinations[0], 155, lateScene, 800, 450, fps), { scale: 1, x: 0, y: 0, mode: end.mode });
  const next = { ...lateScene, id: "next-shot", startFrame: fps * 156, endFrame: fps * 192 };
  assert.deepEqual(motionSceneCameraFrame(combinations[1], 156, next, 800, 450, fps, [lateScene, next]), motionSceneCameraFrame(combinations[1], 156, next, 800, 450, fps));
  const first = { ...lateScene, composition: { assetKey: "reused" } } as any;
  const reused = { ...next, composition: { assetKey: "reused" } } as any;
  assert.deepEqual(motionSceneCameraFrame(combinations[1], 156, first, 800, 450, fps, [first, reused]), motionSceneCameraFrame(combinations[1], 156, reused, 800, 450, fps, [first, reused]));
}
const emittingActor = { ...fixture.scenes[0], nodes: [{ ...fixture.scenes[0].nodes.find((n) => n.id === "person")!, relation: undefined, target: undefined }], effects: [{ id: "actor-smoke", kind: "smoke" as const, source: "person", anchor: "grip" }] };
const emitter = remotionEffectGeometry(emittingActor, assets, 800, 450, combinations[1], 2)[0];
const actor = emittingActor.nodes[0],
  actorBaseY = actor.y + actor.height * 0.98;
assert.ok(Math.abs(emitter.y - (actorBaseY + (actor.y + actor.height * 0.55 - actorBaseY) * motionActorScale(combinations[1], 2, "person"))) < 1e-6);
const scene = (id: string, nodes: MotionRemotionNode[], extra = {}) => ({ ...fixture.scenes[0], id, beatId: id, nodes, startFrame: undefined, endFrame: undefined, time: undefined, weather: undefined, ...extra });
const pot = node("pot", "prop", "tray", { objectId: "pot", state: "full", description: "full clay pot", persistent: true, slot: "left" });
const continuity: any = {
  gen: {
    remotion: {
      assets,
      locations: {},
      scenes: { a: [scene("a", [pot])], b: [scene("b", [{ ...pot, id: "changed-local-id", state: "empty", description: "empty pot", slot: "right" }])], c: [scene("c", [], { time: "morning" })], d: [scene("d", [{ ...pot, state: "empty", description: "empty pot", stateEvidence: "ate the rice" }])], e: [scene("e", [], { removedObjects: ["pot"] })] },
      layoutRevision: 0,
    },
  },
  beats: [
    { id: "a", place: "room", time: "night" },
    { id: "b", place: "room" },
    { id: "c", place: "room", time: "morning" },
    { id: "d", place: "room" },
    { id: "e", place: "room" },
  ],
};
resolveRemotionContinuity(continuity, { places: [] } as any);
assert.equal(continuity.gen.remotion.scenes.b[0].nodes[0].state, "full");
assert.equal(continuity.gen.remotion.scenes.b[0].nodes[0].slot, "left");
assert.equal(continuity.gen.remotion.scenes.c[0].nodes[0].objectId, "pot");
assert.equal(continuity.gen.remotion.scenes.c[0].time, "morning");
continuity.gen.remotion.scenes.a[0].nodes[0].state = "sealed";
continuity.gen.remotion.scenes.a[0].nodes[0].description = "sealed clay pot";
resolveRemotionContinuity(continuity, { places: [] } as any);
assert.equal(continuity.gen.remotion.scenes.b[0].nodes[0].state, "sealed");
assert.equal(continuity.gen.remotion.scenes.c[0].nodes[0].state, "sealed");
assert.equal(continuity.gen.remotion.scenes.d[0].nodes[0].state, "empty");
continuity.gen.remotion.scenes.b[0].removedObjects = ["pot"];
continuity.gen.remotion.scenes.b[0].nodes = [];
resolveRemotionContinuity(continuity, { places: [] } as any);
assert.equal(continuity.gen.remotion.scenes.c[0].nodes.length, 0);
const owned: any = {
  beats: [
    { id: "a", place: "room" },
    { id: "b", place: "room" },
  ],
  gen: { remotion: { scenes: { a: [scene("a", [nodes[2], { ...pot, relation: "heldBy", target: "person" }])], b: [scene("b", [])] } } },
};
resolveRemotionContinuity(owned, { places: [] } as any);
assert.equal(owned.gen.remotion.scenes.b[0].nodes.length, 0);
const supported: any = {
  beats: [
    { id: "a", place: "room" },
    { id: "b", place: "room" },
  ],
  gen: { remotion: { scenes: { a: [scene("a", [nodes[1], { ...pot, relation: "on", target: "bench" }])], b: [scene("b", [])] } } },
};
resolveRemotionContinuity(supported, { places: [] } as any);
assert.ok(supported.gen.remotion.scenes.b[0].nodes.some((n: MotionRemotionNode) => n.id === "bench"));
const collision: any = {
  beats: [
    { id: "a", place: "room" },
    { id: "b", place: "room" },
  ],
  gen: { remotion: { scenes: { a: [scene("a", [pot])], b: [scene("b", [{ ...pot, objectId: "second-pot", persistent: false }])] } } },
};
resolveRemotionContinuity(collision, { places: [] } as any);
assert.equal(collision.gen.remotion.scenes.b[0].nodes.length, 2);
assert.equal(new Set(collision.gen.remotion.scenes.b[0].nodes.map((n: MotionRemotionNode) => n.id)).size, 2);
const { validateSpec } = await import("../src/features/motion/server/services/motionProductionActions.js");
assert.deepEqual(motionRenderBehaviorFor(validateSpec(JSON.stringify(fixture))), normalizeMotionRenderBehavior());
const { motionRemotionSourceFingerprint } = await import("../src/features/motion/server/services/motionRemotionRenderService.js");
const dependencyFolder = path.join(output, "dependency-fixture");
fs.mkdirSync(dependencyFolder, { recursive: true });
fs.writeFileSync(path.join(dependencyFolder, "root.ts"), 'export { value } from "./child.js";');
fs.writeFileSync(path.join(dependencyFolder, "child.ts"), 'export { value } from "./grandchild.js";');
fs.writeFileSync(path.join(dependencyFolder, "grandchild.ts"), "export const value = 1;");
const firstFingerprint = motionRemotionSourceFingerprint([path.join(dependencyFolder, "root.ts")]);
fs.writeFileSync(path.join(dependencyFolder, "grandchild.ts"), "export const value = 2;");
assert.notEqual(motionRemotionSourceFingerprint([path.join(dependencyFolder, "root.ts")]), firstFingerprint);
assert.equal(continuity.gen.remotion.scenes.d[0].nodes[0].state, "empty");
assert.equal(continuity.gen.remotion.scenes.e[0].nodes.length, 0);
const once = JSON.stringify(continuity);
resolveRemotionContinuity(continuity, { places: [] } as any);
assert.equal(JSON.stringify(continuity), once);
continuity.beats[0].time = "day";
const propagated = resolveRemotionContinuity(continuity, { places: [] } as any);
assert.equal(continuity.gen.remotion.scenes.b[0].time, "day");
assert.ok(propagated.has("b"));
assert.equal(continuity.gen.remotion.scenes.c[0].time, "morning");
const browser = await chromium.launch({ executablePath: findNativeChrome(), headless: true });
try {
  const page = await browser.newPage();
  await page.setContent('<canvas width="640" height="360"></canvas>');
  await page.addScriptTag({ content: "globalThis.__name=(value)=>value" });
  for (const file of ["motion-engine/texts.js", "motion-engine/core.js", "motion-engine/puppet2d.js"]) await page.addScriptTag({ content: fs.readFileSync(file, "utf8") });
  await page.addScriptTag({ content: `MotionEngine.cameraFrame = ${motionCameraBrowserSource()}` });
  const samples = await page.evaluate(async (combinations) => {
    const me = (window as any).MotionEngine,
      canvas = document.querySelector("canvas")!,
      g = canvas.getContext("2d")!,
      results = [];
    for (const behavior of combinations) {
      const kit = { renderBehavior: behavior, motion: false, sets: { room: { svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080"><rect width="1920" height="1080" fill="#555f6a"/><rect x="200" y="100" width="300" height="700" fill="#141c24"/><path d="M0 820H1920V1080H0Z" fill="#6d5341"/></svg>', floorY: 820 } }, characters: { person: { top: "#75533c", skin: "#ddd1b8" } } };
      const frame = { start: 0, end: 12, set: "room", shot: "wide", actors: [{ char: "person", pose: "idle", face: "front", x: 0.65 }], overlays: ["rain"], camera: { move: "follow", subject: "person" } };
      const ctx: any = { spec: { kit }, params: { frames: [frame] }, W: 640, H: 360, abs: 1 };
      ctx.state = me.PUPPET2D.init(ctx);
      await me.PUPPET_PRELOAD(ctx.spec);
      const draw = (t: number) => {
        g.setTransform(1, 0, 0, 1, 0, 0);
        g.clearRect(0, 0, 640, 360);
        ctx.abs = t;
        me.PUPPET2D.draw(g, ctx);
        return canvas.toDataURL();
      };
      const first = draw(1),
        later = draw(4),
        again = draw(1);
      results.push({ behavior, changed: first !== later, deterministic: first === again, actors: ctx.state.motion, effects: ctx.state.effects, camera: ctx.state.camera });
    }
    return results;
  }, combinations);
  for (const sample of samples) {
    assert.ok(sample.deterministic);
    assert.equal(sample.actors, sample.behavior.actors === "simple");
    assert.equal(sample.effects, sample.behavior.sceneEffects === "gentle");
    assert.equal(sample.camera, sample.behavior.camera === "gentle");
    assert.equal(sample.changed, sample.behavior.actors === "simple" || sample.behavior.sceneEffects === "gentle" || sample.behavior.camera === "gentle");
  }
  fs.writeFileSync(path.join(output, "library-matrix.json"), JSON.stringify(samples, null, 2));
} finally {
  await browser.close();
}
if (process.argv.includes("--render")) {
  const { renderRemotionStill, motionRemotionSourceFingerprint } = await import("../src/features/motion/server/services/motionRemotionRenderService.js");
  const fingerprints = motionRemotionSourceFingerprint([path.resolve("src/features/motion/remotion/Root.tsx")]);
  assert.equal(fingerprints.length, 64);
  const hashes = [];
  for (const behavior of combinations) {
    const document = applyMotionRenderBehavior({ ...fixture, scenes: fixture.scenes.map((scene) => ({ ...scene, nodes: scene.nodes.filter((n) => n.id !== "tray" && n.id !== "bench").map((n) => (n.id === "person" ? { ...n, relation: undefined, target: undefined } : n)) })) }, behavior);
    const key = `${behavior.actors}-${behavior.sceneEffects}-${behavior.camera}`;
    const files = [0, 90].map((frame) => path.join(output, `${key}-${frame}.png`));
    for (const [index, file] of files.entries()) await renderRemotionStill(document, file, index * 90);
    const [a, b] = files.map((file) => createHash("sha256").update(fs.readFileSync(file)).digest("hex"));
    assert.equal(a !== b, behavior.actors === "simple" || behavior.sceneEffects === "gentle" || behavior.camera === "gentle", key);
    hashes.push({ key, changed: a !== b, files });
  }
  fs.writeFileSync(path.join(output, "remotion-matrix.json"), JSON.stringify(hashes, null, 2));
}
if (process.argv.includes("--lighting")) {
  const { renderRemotionStill } = await import("../src/features/motion/server/services/motionRemotionRenderService.js");
  const hashes: Record<string, string> = {};
  for (const revision of [0, 2])
    for (const time of ["day", "night"]) {
      const document = { ...fixture, assets: { ...assets, background: { ...assets.background, layerRevision: revision } }, scenes: [{ ...fixture.scenes[0], time }] };
      const file = path.join(output, `lighting-${revision}-${time}.png`);
      await renderRemotionStill(document, file);
      hashes[`${revision}-${time}`] = createHash("sha256").update(fs.readFileSync(file)).digest("hex");
    }
  assert.equal(hashes["0-day"], hashes["0-night"]);
  assert.notEqual(hashes["2-day"], hashes["2-night"]);
}
process.stdout.write("Behavior QA passed: 2 master-motion states in both adapters, real Canvas frames, deterministic seek, fps, seated/held contacts, mounted fixtures across 4 aspects, source-bound effects, static core clues, ordered continuity and idempotent reload. No live AI/TTS or production video.");
