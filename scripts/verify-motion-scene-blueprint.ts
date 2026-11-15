import assert from "node:assert/strict";
import { motionSceneBlueprint, motionSafeSceneSource } from "../src/lib/motionSceneBlueprint.js";
import { motionHtmlScriptIssue } from "../src/lib/motionHtmlQuality.js";
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
// Every fallback scene is valid script.
const map = motionSceneBlueprint("5. REQUIRED: army (focal): tokens; pest (support): marker", { shot: "overhead", kind: "map" })!;
for (const scene of [plan, crowded, duo, night, map]) {
  const page = motionSafeSceneSource(scene);
  assert.equal(motionHtmlScriptIssue(page), undefined);
  assert.match(page, /window\.MotionFigures\.use\(own\)/, "the fallback scene is written on the figure table");
  assert.doesNotMatch(page, /MotionKit/);
}
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

// Relation checks on a finished drawing use the boxes the figure table recorded.
import { motionSceneRelationIssues } from "../src/lib/motionSceneBlueprint.js";
{
  const kit = (id: string, x: number, w = 0.08) => ({ id, x, y: 0.5, w, h: 0.35, src: "fig" as const });
  const good = motionSceneRelationIssues(plan, [kit("refugee", 0.5), kit("protagonist", 0.4), kit("miklos", 0.62)]);
  assert.deepEqual([good.apart.length, good.blocked.length, good.stacked.length], [0, 0, 0]);
  const bad = motionSceneRelationIssues(plan, [kit("refugee", 0.7), kit("protagonist", 0.3), kit("miklos", 0.5)]);
  assert.deepEqual(bad.apart, [["refugee", "protagonist"]]);
  assert.deepEqual(bad.blocked, [["refugee", "protagonist", "miklos"]]);
  const wagons = [{ id: "~vehicle:wagon", x: 0.6, y: 0.4, w: 0.3, h: 0.3, large: true }, { id: "~vehicle:wagon", x: 0.62, y: 0.41, w: 0.3, h: 0.3, large: true }];
  assert.equal(motionSceneRelationIssues(plan, wagons).stacked.length, 1);
  assert.equal(motionSceneRelationIssues(duo, [kit("sergeant", 0.1), kit("recruit", 0.8)]).apart.length, 0, "implicit pairs are not enforced");
  assert.equal(motionSceneRelationIssues(plan, [wagons[0], { ...wagons[1], id: "~building:tent" }]).stacked.length, 0, "a wagon in front of a tent is a normal camp");
  // The protagonist with two partners stands between them, and the bystander goes outside.
  const hub = motionSceneBlueprint("5. REQUIRED: refugee (focal): a; you (focal): b; miklos (support): c; istvan (focal): d\n7. INTERACT: refugee -> you; istvan -> you", { shot: "medium" })!;
  const order = hub.items.filter((item) => item.fn === "person").sort((a, b) => a.x - b.x).map((item) => item.id);
  assert.equal(Math.abs(order.indexOf("you") - order.indexOf("refugee")), 1);
  assert.equal(Math.abs(order.indexOf("you") - order.indexOf("istvan")), 1);
  // Reacting to something far away, or a group acting on a place, is not a pair that must stand together.
  const far = motionSceneBlueprint("5. REQUIRED: you (focal): a; flashes (support): b; soldiers (support): c; bridge (support): d\n7. INTERACT: you -> flashes; soldiers -> bridge", { shot: "close" })!;
  const distant = [kit("you", 0.2), { ...kit("flashes", 0.8), h: 0.05 }, kit("soldiers", 0.1), kit("bridge", 0.7)];
  assert.equal(motionSceneRelationIssues(far, distant).apart.length, 0);
  const bare = motionSceneBlueprint("0. Story scene. A column of soldiers passes a wagon near the castle.", { shot: "wide" })!;
  assert.deepEqual(bare.items.map((item) => item.fn), ["person", "crowd", "vehicle", "building"]);
  console.log("relations ok");
}

// Cast looks: learned once from the first scene that draws a person, then given to later scenes in the prompt.
import { motionSceneCastLearn, motionSceneCastPrompt } from "../src/lib/motionSceneBlueprint.js";
{
  const looks: Record<string, Record<string, string | number | boolean>> = {};
  motionSceneCastLearn(looks, [{ id: "You", x: 0, y: 0, w: 0.1, h: 0.3, src: "fig", look: { top: "#7a2e2a", head: "kettle" } }, { id: "column", x: 0, y: 0, w: 0.3, h: 0.2, src: "fig" }]);
  motionSceneCastLearn(looks, [{ id: "you", x: 0, y: 0, w: 0.1, h: 0.3, src: "fig", look: { top: "#00ff00" } }]);
  assert.deepEqual(looks, { you: { top: "#7a2e2a", head: "kettle" } }, "the first scene defines a person; later scenes do not change it");
  motionSceneCastLearn(looks, [{ id: "miklos", x: 0, y: 0, w: 0.1, h: 0.3, look: { top: "#555555" } }]);
  assert.equal(looks.miklos, undefined, "only figure-table marks teach looks");
  assert.match(motionSceneCastPrompt(looks, ["you", "miklos"])!, /CAST LOOK .*you \{"top":"#7a2e2a","head":"kettle"\}/);
  console.log("cast looks ok");
}
