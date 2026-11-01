import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { MOTION_SCENE_COMPOSITION as C } from "../src/constants/motionSceneComposition.js";
import { MOTION_ILLUSTRATION_PROFILES as profiles } from "../src/constants/motionIllustrationProfiles.js";
import { MOTION_VISUAL as V } from "../src/constants/motionVisual.js";
import { MOTION_CHARACTER_FRAMES } from "../src/constants/motionProfiles/characterFrames/index.js";
import { motionIllustrationDirection } from "../src/lib/motionIllustrationProfile.js";
import { motionIdentityMemory } from "../src/lib/motionIdentityMemory.js";
import { motionHorrorAppearance } from "../src/lib/motionHorrorIdentity.js";
import type { MotionRemotionProfile, MotionRemotionScene } from "../src/types/motionVisual.js";
const contextFor = (id: MotionRemotionProfile) => ({
  viewBox: "0 0 1280 720",
  artDirection: motionIllustrationDirection(id, "drawing"),
  cast: [{ key: "catcher", name: "Anh Bắt Ếch", look: "rough black hair; scar on left cheek; faded black tunic; dark brown rolled trousers; bare white feet", description: "A kind frog catcher" }],
  identityMemory: [{ entityId: "catcher", appearance: "rough black hair; scar on left cheek; faded black tunic; short legs; bare feet" }],
  identityContrast: [{ entityId: "catcher", name: "Anh Bắt Ếch", traits: ["scar on left cheek", "barefoot"] }],
  continuity: { notes: "catcher: black tunic; white feet. Place: wooden house beside the river" },
  scene: {
    text: "Anh bắt ếch ngồi trên ghế, nghe đôi chim báo chuyện ma da kéo chân người.",
    nodes: [
      { id: "catcher", kind: "character", entityId: "catcher", posture: "seated", support: "bench" },
      { id: "birds", kind: "prop", description: "Two birds resting on the window sill" },
    ],
  },
  renderBehavior: { version: 1, actors: "simple", camera: "gentle", sceneEffects: "gentle" },
});
const fingerprint = (id: MotionRemotionProfile) =>
  createHash("sha256")
    .update(JSON.stringify({ metadata: V.PROFILES[id], stages: ["planning", "design", "drawing", "review"].map((stage) => motionIllustrationDirection(id, stage as any)), prompt: C.PROMPT(contextFor(id)) }))
    .digest("hex");
const unchanged = { history: "b7c0832b7b72cdb829c54748bcf33a4e684002adc2a852b2148710b89be1d880", explainer: "83e164437f103bd17034ff95352b58829117b7c53a6230de1cd80e2b42667f20" };
for (const id of ["history", "explainer"] as const) {
  assert.equal(fingerprint(id), unchanged[id], `${id}: preserve exact metadata, all four directions and the complete drawing prompt`);
  assert.match(C.PROMPT(contextFor(id)), /short legs/);
}
const source = contextFor("horror");
const original = structuredClone(source);
const prompt = C.PROMPT(source);
const cleaned = JSON.parse(prompt.split("Context:\n")[1].split("\n")[0]);
assert.deepEqual(source, original, "Preparing horror prompts must not mutate project/cast/scene data");
assert.equal(cleaned.cast[0].look, "rough black hair; scar on left cheek; faded black tunic; dark brown rolled trousers");
assert.equal(cleaned.identityMemory[0].appearance, "rough black hair; scar on left cheek; faded black tunic");
assert.deepEqual(cleaned.identityContrast[0].traits, ["scar on left cheek"]);
assert.equal(cleaned.continuity.notes, "catcher: black tunic; Place: wooden house beside the river");
assert.deepEqual(cleaned.scene, source.scene, "Keep narration, body-support relation, poses and animal props intact");
assert.deepEqual(cleaned.renderBehavior, source.renderBehavior);
assert.ok(prompt.includes(MOTION_CHARACTER_FRAMES.horror));
assert.ok(!/short legs rather than|two simple short knees|horse\/person has connected articulated legs/.test(prompt));
assert.match(prompt, /NO LEGS, FEET OR SHOES/);
assert.match(profiles.horror.motion, /When actors=fixed[\s\S]*animations=\[\]/);
assert.match(profiles.horror.motion, /Animals retain their own connected anatomy/);
assert.match(profiles.horror.motion, /Camera follows the main visible action/);
assert.match(profiles.horror.identity, /never record legs, knees, feet or footwear/);
for (const posture of ["standing", "sitting", "kneeling", "lying"]) {
  const context = contextFor("horror");
  context.scene.nodes[0].posture = posture;
  const posePrompt = C.PROMPT(context);
  assert.match(posePrompt, /NO LEGS, FEET OR SHOES/);
  assert.match(posePrompt, /one unsplit base/);
  assert.equal(JSON.parse(posePrompt.split("Context:\n")[1].split("\n")[0]).scene.nodes[0].posture, posture);
}
assert.equal(motionHorrorAppearance("tóc đen; chân mày rậm; áo nâu; chân trần; bàn chân trắng; dép rơm"), "tóc đen; chân mày rậm; áo nâu");
assert.equal(motionHorrorAppearance("silver hair and bare feet; knee-length indigo robe; black sandals"), "silver hair; knee-length indigo robe");
const scene = { id: "next", nodes: [{ id: "catcher", kind: "character", entityId: "catcher" }] } as MotionRemotionScene;
for (const id of ["horror", "history", "explainer"] as const) {
  const previous = { id: "previous", nodes: [], build: { status: "accepted" }, composition: { profileId: id, profileRevision: V.PROFILES[id].revision, layers: [{ id: "catcher", kind: "character", entityId: "catcher", appearance: "black hair; brown tunic; short shins; bare feet" }] } } as unknown as MotionRemotionScene;
  assert.deepEqual(motionIdentityMemory(scene, [previous], id), [{ entityId: "catcher", appearance: id === "horror" ? "black hair; brown tunic" : "black hair; brown tunic; short shins; bare feet" }]);
  previous.composition!.profileRevision!--;
  assert.deepEqual(motionIdentityMemory(scene, [previous], id), [], "Old construction revisions cannot seed new character identity");
}
const repair = C.REPAIR(source, { svg: "<svg/>" }, ["character silhouette"]);
const repairContext = JSON.parse(repair.split("Context:\n")[1].split("\n")[0]);
assert.equal(repairContext.cast[0].look, cleaned.cast[0].look);
assert.equal(repairContext.identityMemory[0].appearance, cleaned.identityMemory[0].appearance);
assert.equal(V.PROFILES.horror.revision, 25);
process.stdout.write("Horror legless construction passed: all poses, motion, appearance cleanup, repair prompts, old-revision exclusion, immutable story data and byte-identical history/explainer prompts.\n");
