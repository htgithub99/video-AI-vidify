import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { normalizeMotionRenderBehavior, applyMotionRenderBehavior } from "../src/lib/motionRenderBehavior.js";
import { normalizeFirstSceneComposition, compositionFrameSvg } from "../src/lib/motionSceneComposition.js";
import { compositionActorMotion, compositionEffectMotion } from "../src/lib/motionCompositionMotion.js";
import { MOTION_SCENE_COMPOSITION as C } from "../src/constants/motionSceneComposition.js";
import { motionIllustrationDirection } from "../src/lib/motionIllustrationProfile.js";
import { motionRemotionRenderConcurrency } from "../src/lib/motionRemotionPerformance.js";
import type { MotionRemotionSpec } from "../src/types/motionVisual.js";
const on = normalizeMotionRenderBehavior(undefined, true);
const off = normalizeMotionRenderBehavior({ version: 1, actors: "fixed", sceneEffects: "gentle", camera: "gentle" });
assert.deepEqual(off, { version: 1, actors: "fixed", sceneEffects: "off", camera: "fixed" });
assert.equal(on.sceneEffects, "gentle");
assert.equal(motionRemotionRenderConcurrency(8, 1.9 * 1073741824), 1);
assert.equal(motionRemotionRenderConcurrency(8, 4 * 1073741824), 2);
assert.equal(motionRemotionRenderConcurrency(1, 4 * 1073741824), 1);
assert.equal(normalizeMotionRenderBehavior({ ...on, sceneEffects: "off" }).sceneEffects, "gentle");
const raw = {
  svg: "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1280 720'><g id='land'><rect width='1280' height='720' fill='#cbd3c4'/><path d='M0 450H1280V720H0Z' fill='#8f9a6e'/></g><g id='river'><path d='M0 500H1280V680H0Z' fill='#648c9e'/><g id='water'><path d='M0 555Q150 535 300 555T600 555T900 555T1280 555' stroke='#ccdfe3' stroke-width='5' fill='none'/></g></g><g id='wind'><path id='cloth' d='M950 180Q1000 160 1050 180L1050 230Q1000 210 950 230Z' fill='#be6a56'/></g><g id='horse' transform='translate(300 300)'><path d='M0 40Q100 0 180 40L190 90H0Z' fill='#82604d' stroke='#30251f' stroke-width='5'/><path id='horse_leg' d='M35 75L35 155' stroke='#30251f' stroke-width='18'/><path d='M150 75L150 155M170 50L200 -10L220 0L200 90' stroke='#30251f' stroke-width='18' fill='none'/></g><g id='runner'><path d='M720 260V370' stroke='#395360' stroke-width='35'/><circle cx='720' cy='230' r='25' fill='#fff'/><path id='runner_leg' d='M720 360V445' stroke='#30251f' stroke-width='15'/></g></svg>",
  layers: [
    { id: "land", kind: "background" },
    { id: "river", kind: "prop" },
    { id: "water", kind: "effect", effectKind: "water", sourceId: "river" },
    { id: "wind", kind: "effect", effectKind: "wind" },
    { id: "horse", kind: "prop" },
    { id: "runner", kind: "character", entityId: "person" },
  ],
  animations: [
    {
      target: "horse_leg",
      channel: "actor",
      attribute: "transform",
      period: 2,
      keyframes: [
        { at: 0, value: "rotate(0 35 75)" },
        { at: 1, value: "rotate(20 35 75)" },
        { at: 2, value: "rotate(0 35 75)" },
      ],
    },
    {
      target: "runner_leg",
      channel: "actor",
      attribute: "transform",
      period: 2,
      keyframes: [
        { at: 0, value: "rotate(0 720 360)" },
        { at: 1, value: "rotate(-20 720 360)" },
        { at: 2, value: "rotate(0 720 360)" },
      ],
    },
    {
      target: "water",
      channel: "effect",
      attribute: "transform",
      period: 2,
      keyframes: [
        { at: 0, value: "translate(0 0)" },
        { at: 1, value: "translate(12 0)" },
        { at: 2, value: "translate(0 0)" },
      ],
    },
    {
      target: "cloth",
      channel: "effect",
      attribute: "d",
      period: 2,
      keyframes: [
        { at: 0, value: "M950 180Q1000 160 1050 180L1050 230Q1000 210 950 230Z" },
        { at: 1, value: "M950 180Q1000 200 1050 180L1050 230Q1000 250 950 230Z" },
        { at: 2, value: "M950 180Q1000 160 1050 180L1050 230Q1000 210 950 230Z" },
      ],
    },
  ],
};
const nodes: any[] = [
  { id: "runner", kind: "character", entityId: "person", posture: "running", pose: "running", support: "ground", description: "runner" },
  { id: "horse", kind: "prop", description: "running horse" },
];
const cast = new Set(["person"]);
const built = normalizeFirstSceneComposition(raw, "test", "test", "motion fixture", nodes, cast, 1280, 720);
assert.equal(built.composition.animations.length, 4, "Accept animal, leg, wind and water tracks");
assert.equal(compositionActorMotion(built.composition, built.asset, nodes, cast, on, "history").removed, 0, "Keep articulated running legs");
assert.equal(compositionEffectMotion(built.composition, built.asset, nodes, cast, on, "history").added, 0, "Keep authored environment motion");
for (const t of [0, 0.5, 1, 1.5, 9]) assert.equal(compositionFrameSvg(built.asset, built.composition, t, off, new Set(["person"])), built.asset.svg);
assert.notEqual(compositionFrameSvg(built.asset, built.composition, 1, on, new Set()), built.asset.svg);
assert.equal(built.composition.animations.length, 4, "Switching off playback preserves authored tracks for re-enabling");
for (const profile of ["history", "explainer", "horror"] as const) {
  const prompt = C.PROMPT({ viewBox: "0 0 1280 720", artDirection: motionIllustrationDirection(profile, "drawing"), renderBehavior: on, scene: { nodes } });
  assert.match(prompt, /running horse\/person/);
  assert.match(prompt, /rivers move local ripples\/currents/);
  assert.match(prompt, /entire scene is frozen/);
}
if (process.argv.includes("--render")) {
  const { renderRemotionStill } = await import("../src/features/motion/server/services/motionRemotionRenderService.js");
  const root = path.resolve("scratch/motion-control-export-audit-20261031");
  fs.mkdirSync(root, { recursive: true });
  const spec: MotionRemotionSpec = {
    engine: "remotion",
    version: 1,
    title: "Motion switch check",
    aspect: "16:9",
    fps: 30,
    duration: 2,
    width: 1280,
    height: 720,
    motion: true,
    renderBehavior: on,
    profileId: "history",
    assets: { test: built.asset },
    scenes: [{ id: "test", beatId: "beat", fromLineId: "line", toLineId: "line", purpose: "wind, running horse and river", text: "", environment: "field", sourceKey: "test", composition: built.composition, nodes: nodes.map((n, depth) => ({ ...n, x: 0, y: 0, width: 1280, height: 720, depth })), startFrame: 0, endFrame: 60 }],
    subtitles: [],
  };
  for (const [name, behavior] of [
    ["on", on],
    ["off", off],
  ] as const)
    for (const frame of [0, 30]) await renderRemotionStill(applyMotionRenderBehavior(spec, behavior), path.join(root, `${name}-${frame}.png`), frame);
  assert.deepEqual(fs.readFileSync(path.join(root, "off-0.png")), fs.readFileSync(path.join(root, "off-30.png")), "Actual tool render is pixel-identical when off");
  assert.notDeepEqual(fs.readFileSync(path.join(root, "on-0.png")), fs.readFileSync(path.join(root, "on-30.png")), "Actual tool render visibly moves when on");
}
console.log("Scene master motion: defaults, stale settings, animal props, running legs, wind/water, static playback and three profile prompts passed.");
