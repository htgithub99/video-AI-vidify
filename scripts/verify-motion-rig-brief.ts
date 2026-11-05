import assert from "node:assert/strict";
import { motionSceneBrief, motionSceneRigLines } from "../src/lib/motionSceneBrief.ts";
import { MOTION_SCENE_BRIEF as B } from "../src/constants/motionSceneBrief.ts";
const simple = { version: 1, actors: "simple", sceneEffects: "gentle", camera: "gentle" };
const context = (profile: "history" | "horror" | "explainer", text: string, extra: Record<string, unknown> = {}): any => ({
  width: 1280,
  height: 720,
  viewBox: "0 0 1280 720",
  artDirection: { id: profile },
  renderBehavior: simple,
  scene: {
    purpose: text,
    text,
    view: "wide",
    nodes: [
      { id: "hero", kind: "character", entityId: "hero", description: "rider", pose: "riding", slot: "center", evidence: text },
      { id: "horse_1", kind: "prop", animal: "horse", description: "horse", pose: "galloping", slot: "center", evidence: text },
      { id: "cart_1", kind: "prop", description: "cart", pose: "", slot: "right", evidence: text },
    ],
    objects: [
      { id: "horse_1", class: "mount", description: "brown horse", term: "horse" },
      { id: "cart_1", class: "wheeled", description: "wooden cart", term: "cart", kind: "cart" },
    ],
    ...extra,
  },
  cast: [{ key: "hero", name: "Hero" }],
});
const join = (lines: string[]) => lines.join("\n");
// Motion on, a journey: limbs, 4-leg animal, wheels, water and seamless scroll layers are requested.
const ride = join(motionSceneRigLines(context("history", "Anh phi ngựa qua cánh đồng")));
assert.ok(ride.startsWith(B.IDS_RIG.HEADING), "Rig section has its heading");
assert.ok(ride.includes("hero_leg_left") || ride.includes("<id>_leg_left"), "People get separate legs");
assert.ok(ride.includes("horse_1_leg_front_left") && ride.includes("horse_1_tail"), "Four-legged animal gets four leg groups and a tail");
assert.ok(ride.includes("cart_1_wheel_1"), "Wheeled object gets one group per wheel");
assert.ok(ride.includes("effectKind water"), "Water gets its own effect layer");
assert.ok(ride.includes("_scroll") && ride.includes("2560"), "Journey scenes get seamless scroll layers two canvas widths wide");
// Not a journey: no scroll layers (drawing stays a normal single scene).
assert.ok(!join(motionSceneRigLines(context("history", "Anh đứng nhìn dòng sông"))).includes("_scroll"), "No scroll layers for a still moment");
// Motion off: nothing extra is requested.
assert.deepEqual(motionSceneRigLines({ ...context("history", "phi ngựa"), renderBehavior: { ...simple, actors: "fixed" } }), [], "No rig rules when scene motion is off");
// Horror humans are legless: no leg groups for people, animals keep their anatomy.
const horror = join(motionSceneRigLines(context("horror", "phi ngựa")));
assert.ok(!horror.includes("<id>_leg_left"), "Horror humans never get leg groups");
assert.ok(horror.includes("horse_1_leg_front_left"), "Horror animals keep their legs");
// Crowds, units and close-ups do not get per-limb rules.
assert.ok(!join(motionSceneRigLines(context("history", "đám đông", { nodes: [{ id: "crowd_1", kind: "character", anonymous: true, description: "villagers", pose: "", slot: "center", evidence: "x" }], objects: [] }))).includes("_leg_left"), "Crowds are not limb-rigged");
// The full brief includes the rig lines inside IDS REQUIRED.
const brief = motionSceneBrief(context("explainer", "Chiếc xe chạy trên đường"));
const ids = brief.slice(brief.indexOf(`${B.HEADINGS.IDS}:`));
assert.ok(ids.includes(B.IDS_RIG.HEADING), "Rig rules appear in the IDS REQUIRED section of the drawing prompt");
process.stdout.write("PASS: drawing brief asks for movable parts (limbs, 4 legs + tail, wheels, rotors, water, journey scroll layers) only when scene motion is on; horror humans stay legless; crowds/still scenes unchanged.\n");
