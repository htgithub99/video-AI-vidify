import assert from "node:assert/strict";
import { motionSceneBlueprint } from "../src/lib/motionSceneBlueprint.js";
import { motionSceneSpecFallback, motionSceneSpecFix } from "../src/lib/motionSceneSpec.js";
import { MOTION_SCENE_BLUEPRINT as B } from "../src/constants/motionSceneBlueprint.js";
import { MotionAiWorkerPool } from "../src/features/motion/server/services/motionAiWorkerPool.js";

const camp = [
  "0. SCENE THEME & TYPE: Story scene, kind here, shot medium.",
  "2. THREE-LAYER SETTING & CAMERA: Clear dry day, dusty trampled ground of the camp.",
  "5. REQUIRED: refugee (focal): barefoot man; protagonist (focal): you; miklos (support): comrade; shield (support): round shield; wagon (support): covered wagon; tent (support): army tent",
  "6. MOTION: refugee runs in from the right -> grabs your sleeve; ambient dust.",
  "7. INTERACT: refugee -> protagonist",
].join("\n");
const plan = motionSceneBlueprint(camp, { shot: "medium", kind: "here" })!;
const by = Object.fromEntries(plan.items.map((item) => [item.id, item]));
assert.equal(plan.shot, "medium");
assert.equal(plan.ground, "dirt");
assert.equal(by.refugee.target, "protagonist");
assert.equal(by.refugee.facing * Math.sign(by.protagonist.x - by.refugee.x), 1, "the actor faces its target");
assert.equal(by.protagonist.facing * Math.sign(by.refugee.x - by.protagonist.x), 1, "the target faces the actor");
const between = plan.items.filter((item) => item.fn === "person" && item.id !== "refugee" && item.id !== "protagonist" && (item.x - by.refugee.x) * (item.x - by.protagonist.x) < 0);
assert.equal(between.length, 0, "nobody stands between an interacting pair");
assert.equal(by.shield.owner, "protagonist");
assert.ok(by.refugee.travelFrom !== undefined && Math.abs(by.refugee.travelFrom - by.refugee.x) > 100, "a travelling subject really travels");
assert.equal(by.wagon.fn, "vehicle");
assert.equal(by.tent.fn, "building");
// Large items keep clear of each other and of the frame edge.
const large = plan.items.filter((item) => item.fn === "vehicle" || item.fn === "building");
for (const item of large) assert.ok(item.x >= B.WORLD.left && item.x <= B.WORLD.right);
assert.ok(Math.abs(large[0].x - large[1].x) > 300, "large items do not overlap");
// Many items shrink together instead of leaving the frame.
const crowded = motionSceneBlueprint("5. REQUIRED: " + ["king", "queen", "bishop", "knight", "squire", "herald", "jester", "cook"].map((id) => `${id} (focal): x`).join("; "), { shot: "close" })!;
assert.ok(crowded.items.every((item) => item.x >= B.WORLD.left && item.x <= B.WORLD.right));
// Two focal people without an INTERACT line still face each other.
const duo = motionSceneBlueprint("5. REQUIRED: sergeant (focal): x; recruit (focal): y", { shot: "wide" })!;
assert.equal(duo.items[0].facing, -duo.items[1].facing);
// Night, snow and mist come from the setting section.
const night = motionSceneBlueprint("2. SETTING: pitch dark night, snow and mist by the river.\n5. REQUIRED: riders (focal): horsemen", { shot: "wide" })!;
assert.deepEqual([night.time, night.ground, night.mist, night.items[0].fn], ["night", "snow", true, "crowd"]);
// Every fallback scene is a spec the fixer accepts, with one focal thing inside the frame.
const map = motionSceneBlueprint("5. REQUIRED: army (focal): tokens; pest (support): marker", { shot: "overhead", kind: "map" })!;
assert.ok(map.items.length > 0);
for (const [template, input] of [[camp, { shot: "medium", kind: "here" }], ["2. SETTING: pitch dark night, snow and mist by the river.\n5. REQUIRED: riders (focal): horsemen", { shot: "wide" }]] as const) {
  const spec = motionSceneSpecFallback(template, input)!;
  assert.ok(spec.items.length > 0, "the fallback has items");
  motionSceneSpecFix(spec, { year: 1241, template, castLooks: {}, gaps: [] });
  assert.equal(spec.items.filter((item) => item.focal).length, 1, "one focal thing");
  for (const item of spec.items) assert.ok(item.x >= 0 && item.x <= 1280, `${item.id} inside the frame`);
}
const tall = motionSceneSpecFallback(camp, { shot: "medium", kind: "here", frame: [720, 1280] })!;
assert.deepEqual(tall.frame, [720, 1280]);
assert.ok(tall.items.every((item) => item.x <= 720), "a 9:16 fallback is laid out across its own width");
assert.equal(motionSceneBlueprint(""), undefined);

// Redraws go ahead of scenes that are still waiting for their first drawing.
(async () => {
  const pool = new MotionAiWorkerPool(["tab"]);
  const first = await pool.acquire();
  const order: string[] = [];
  const wait = (name: string, urgent?: boolean) => pool.acquire(undefined, { urgent }).then((slot) => (order.push(name), slot.release()));
  const all = [wait("scene-2"), wait("scene-3"), wait("redraw-1", true), wait("redraw-0b", true)];
  first.release();
  await Promise.all(all);
  assert.deepEqual(order, ["redraw-1", "redraw-0b", "scene-2", "scene-3"]);
  console.log("motion scene blueprint ok");
})();

// Cast looks given to later scenes in the prompt.
import { motionSceneCastPrompt } from "../src/lib/motionSceneBlueprint.js";
assert.match(motionSceneCastPrompt({ you: { top: "#7a2e2a", head: "kettle" } }, ["you", "miklos"])!, /you \{"top":"#7a2e2a","head":"kettle"\}/);

// The plan's FIGURES line gives each id its options in the vocabulary's words; the scene drawn by code from the plan
// wears them (a value per phase when it changes).
{
  const { motionSceneFigures, motionSceneBlueprint: plan } = await import("../src/lib/motionSceneBlueprint.js");
  const template = "5. REQUIRED: you (focal): crossbowman; drover (focal): limping man\n8. FIGURES: you: person, outfit soldier, top #6e5038, hold crossbow, pose sit -> sit, expression worried -> surprised; drover: person, outfit peasant, wounded, pose walk -> point; log: prop log";
  assert.deepEqual(motionSceneFigures(template), { you: { outfit: "soldier", top: "#6e5038", hold: "crossbow", pose: ["sit", "sit"], expression: ["worried", "surprised"] }, drover: { outfit: "peasant", wounded: true, pose: ["walk", "point"] }, log: {} });
  const items = plan(template, { shot: "medium" })!.items;
  assert.deepEqual(items.find((item) => item.id === "you")?.look?.hold, "crossbow", "the fallback scene carries the FIGURES options");
  console.log("FIGURES line: options per id for the fallback scene.");
}
