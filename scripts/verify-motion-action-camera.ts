import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { normalizeFirstSceneComposition } from "../src/lib/motionSceneComposition.js";
import { motionSceneSubjectPoint, motionSceneCameraDirection } from "../src/lib/motionSceneCamera.js";
import { motionSceneCameraFrame } from "../src/features/motion/lib/motionRemotionEffects.js";
import { normalizeMotionRenderBehavior, applyMotionRenderBehavior } from "../src/lib/motionRenderBehavior.js";
import { motionCameraFrame } from "../src/lib/motionCamera.js";
import type { MotionRemotionSpec, MotionRemotionTimedScene } from "../src/types/motionVisual.js";
const on = normalizeMotionRenderBehavior({ version: 1, actors: "simple", sceneEffects: "off", camera: "fixed" });
const off = normalizeMotionRenderBehavior({ version: 1, actors: "fixed", sceneEffects: "gentle", camera: "gentle" });
assert.equal(on.camera, "gentle", "Old camera-fixed state migrates to the master switch");
assert.equal(off.camera, "fixed");
const node: any = { id: "hero", kind: "character", entityId: "hero", description: "main traveler", pose: "running", slot: "center", evidence: "fixture" };
const raw = {
  design: { camera: "wide", cameraMotion: { mode: "follow", subjectId: "hero", focus: { x: 0.4, y: 0.5 } }, placements: [{ id: "hero", box: { x: 0.35, y: 0.28, width: 0.1, height: 0.45 } }] },
  svg: "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1280 720'><g id='land'><rect width='1280' height='720' fill='#cbd3c4'/><path d='M0 525H1280V720H0Z' fill='#8f9a6e'/><path d='M120 525V180H170V525M1050 525V220H1100V525' fill='#82604d'/></g><g transform='translate(256 0) scale(2 1)'><g id='hero' transform='translate(128 0)'><circle cx='0' cy='240' r='26' fill='#fff' stroke='#28221f' stroke-width='4'/><path d='M-20 270H20L27 440H-27Z' fill='#527995' stroke='#28221f' stroke-width='4'/><path id='leg' d='M-12 440V525M12 440V525' stroke='#28221f' stroke-width='8'/></g></g></svg>",
  layers: [
    { id: "land", kind: "background" },
    { id: "hero", kind: "character", entityId: "hero" },
  ],
  animations: [
    {
      target: "hero",
      channel: "actor",
      attribute: "transform",
      keyframes: [
        { at: 0, value: "translate(0 0)" },
        { at: 8, value: "translate(40 0)" },
      ],
    },
    {
      target: "leg",
      channel: "actor",
      attribute: "transform",
      period: 2,
      keyframes: [
        { at: 0, value: "rotate(0 0 440)" },
        { at: 1, value: "rotate(10 0 440)" },
        { at: 2, value: "rotate(0 0 440)" },
      ],
    },
  ],
};
const built = normalizeFirstSceneComposition(raw, "camera", "camera", "action camera", [node], new Set(["hero"]), 1280, 720);
const scene: MotionRemotionTimedScene = { id: "camera", beatId: "beat", fromLineId: "line", toLineId: "line", purpose: "main actor travels right", text: "", environment: "field", sourceKey: "camera", nodes: [{ ...node, x: 448, y: 200, width: 128, height: 324, depth: 1 }], composition: built.composition, startFrame: 0, endFrame: 240 };
const assets = { camera: built.asset };
const subjectStart = { x: 512, y: 360 };
assert.deepEqual(motionSceneSubjectPoint(built.composition, built.asset, "hero", subjectStart, 0), subjectStart);
assert.deepEqual(motionSceneSubjectPoint(built.composition, built.asset, "hero", subjectStart, 8), { x: 592, y: 360 }, "Nested parent scaling applies to authored translation exactly once");
assert.deepEqual(motionSceneSubjectPoint(built.composition, built.asset, "hero", subjectStart, 1), motionSceneSubjectPoint({ ...built.composition, animations: [built.composition.animations[0]] }, built.asset, "hero", subjectStart, 1), "Camera ignores swinging child limbs");
let before = motionSceneCameraFrame(on, 0, scene, 1280, 720, 30, [scene], assets);
const start = before;
for (let frame = 1; frame <= 240; frame++) {
  const current = motionSceneCameraFrame(on, frame / 30, scene, 1280, 720, 30, [scene], assets);
  assert.equal(current.mode, "follow");
  assert.ok(Math.abs(current.x - before.x) * 30 <= 1280 * 0.0055, "Camera pans slowly even while actor travels faster");
  assert.ok(current.scale <= 1.045 && Math.abs(current.x) <= (1280 * (current.scale - 1)) / 2 + 1e-6, "No empty borders");
  const hero = motionSceneSubjectPoint(built.composition, built.asset, "hero", { x: 448, y: 200 }, frame / 30);
  const x = (1280 / 2) * (1 - current.scale) + current.x;
  assert.ok(x + hero.x * current.scale >= 0 && x + (hero.x + 128) * current.scale <= 1280, "Main actor remains visible");
  before = current;
}
assert.ok(before.x < start.x, "Camera pans against rightward image travel, following the actor rather than a random direction");
assert.deepEqual(motionSceneCameraFrame(on, 3, scene, 1280, 720, 30, [scene], assets), motionSceneCameraFrame(on, 3, scene, 1280, 720, 30, [scene], assets), "Seeking is deterministic");
assert.deepEqual(motionSceneCameraFrame(off, 4, scene, 1280, 720, 30, [scene], assets), { mode: "follow", scale: 1, x: 0, y: 0 });
assert.equal(motionSceneCameraDirection({ ...scene, composition: { ...built.composition, design: { camera: "wide", placements: [] }, animations: [] } }, built.asset, 4, 8).mode, "hold", "No subject information means hold, not seeded pan");
const malformed = normalizeFirstSceneComposition({ ...raw, design: { ...raw.design, cameraMotion: { mode: "spin", subjectId: "missing", focus: { x: 100, y: NaN } } } }, "camera", "camera", "camera", [node], new Set(["hero"]), 1280, 720);
assert.equal(malformed.composition.design?.cameraMotion, undefined, "Optional bad camera metadata does not reject the artwork");
for (const mode of ["push", "pull"] as const) {
  const options = { enabled: true, start: 0, end: 8, width: 1280, height: 720, seed: "ignored", mode, focus: subjectStart };
  assert.notDeepEqual(motionCameraFrame({ ...options, seconds: 0 }), motionCameraFrame({ ...options, seconds: 8 }));
}
if (process.argv.includes("--render")) {
  const { renderRemotionStill } = await import("../src/features/motion/server/services/motionRemotionRenderService.js");
  const root = path.resolve("scratch/motion-action-camera-20261031");
  await fs.mkdir(root, { recursive: true });
  const spec: MotionRemotionSpec = { engine: "remotion", version: 1, title: "Action camera check", aspect: "16:9", fps: 30, duration: 8, width: 1280, height: 720, motion: true, renderBehavior: on, profileId: "history", assets, scenes: [scene], subtitles: [] };
  const push = { ...spec, scenes: [{ ...scene, composition: { ...built.composition, animations: [], design: { ...built.composition.design!, cameraMotion: { mode: "push" as const, subjectId: "hero", focus: { x: 0.4, y: 0.5 } } } } }] };
  for (const [name, document] of [
    ["follow", spec],
    ["camera-only", push],
    ["off", applyMotionRenderBehavior(spec, off)],
  ] as const) {
    for (const frame of [0, 120]) await renderRemotionStill(document, path.join(root, `${name}-${frame}.png`), frame);
    const same = (await fs.readFile(path.join(root, `${name}-0.png`))).equals(await fs.readFile(path.join(root, `${name}-120.png`)));
    assert.equal(same, name === "off", "Actual production rendering obeys action-led camera and static master");
  }
  await fs.writeFile(path.join(root, "scene.json"), JSON.stringify(spec, null, 2));
}
console.log("Action camera passed: one master, actual parent transforms, child-motion isolation, safe framing, bounded tracking speed, hold fallback, deterministic seek and malformed metadata tolerance.");
