import assert from "node:assert/strict";
import { planningPromptTransport } from "../src/lib/chatPlanningUtils.js";
import { motionPromptBudget, motionPromptMeasurement, motionPromptSingleMessage } from "../src/lib/motionPrompt.js";
import { MOTION_SCENE_COMPOSITION as SCENE } from "../src/constants/motionSceneComposition.js";
import { MOTION_VISUAL as V } from "../src/constants/motionVisual.js";
import { MOTION_PROMPT } from "../src/constants/motionPrompt.js";
import { motionIllustrationDirection } from "../src/lib/motionIllustrationProfile.js";
import { withMotionResponsePrompt } from "../src/lib/motionResponseContract.js";
import { CINEMATIC_CHAT_PLANNING_CONFIG as C } from "../src/constants/cinematicConstants.js";
const source = "Một đoạn nguồn 🛶 có lời kể. ".repeat(900);
for (const requested of [6000, 12000, 16000, 24000]) {
  const transport = planningPromptTransport(source, source.length + 150, requested);
  assert.equal(transport.limit, requested);
  assert.equal(transport.parts.join(""), source);
  for (const [index, part] of transport.parts.entries()) {
    const message = C.CONTEXT_PART("fixture_" + index, "fixture", index + 1, transport.parts.length, part);
    assert.ok(message.length + 150 < requested);
    assert.ok(!/[\uD800-\uDBFF]$/.test(part));
  }
}
assert.deepEqual(planningPromptTransport("short", 300, 16000).parts, []);
assert.equal(planningPromptTransport("short", 300, -1).limit, 6000);
const budget = motionPromptBudget("motion-puppet-read", "gemini-chat", "gemini-flash::low");
const wrapped = "x".repeat(budget + 1);
const measured = motionPromptMeasurement("x", wrapped, 0, 2, budget);
assert.equal(measured.overflow, true);
assert.equal(measured.wrapperChars, budget);
assert.equal(measured.images, 2);
assert.ok(planningPromptTransport(wrapped, wrapped.length, measured.budget).parts.length > 1);
assert.ok(SCENE.PROMPT({ artDirection: motionIllustrationDirection("history", "drawing") }).includes("{design,svg,layers,animations,continuityNotes}"));
for (const profileId of Object.keys(V.PROFILES) as (keyof typeof V.PROFILES)[]) {
  const prompt = SCENE.PROMPT({ profile: V.PROFILES[profileId].direction, artDirection: motionIllustrationDirection(profileId, "drawing"), scene: { text: "Keep the source facts." } });
  const full = MOTION_PROMPT.SCENE_OUTPUT(withMotionResponsePrompt(SCENE.ARTIFACT, prompt), '"artifactType":"motion_remotion_composition","requestId":"fixture"');
  const single = motionPromptSingleMessage(SCENE.ARTIFACT);
  assert.equal(single, true);
  assert.ok(full.startsWith(prompt));
  assert.ok(full.includes("in the requested json code block"));
  assert.ok(!full.includes("no markdown fences"));
  assert.deepEqual(planningPromptTransport(full, full.length + MOTION_PROMPT.SCENE_RESPONSE_DIRECTIVE.length, budget, single).parts, []);
  const measurement = motionPromptMeasurement(prompt, full, 0, 0, budget, single);
  assert.equal(measurement.overflow, full.length > budget);
  assert.equal(measurement.action, "direct");
}
assert.equal(motionPromptSingleMessage("motion_remotion_scene"), false);
const draft = { svg: "<svg><g id='keep'/></svg>", layers: [{ id: "keep", kind: "background" }] };
for (const context of [
  { artDirection: motionIllustrationDirection("history", "drawing"), scene: { text: "KEEP_FACT" }, drawingReference: "DROP_REFERENCE", continuity: { svg: "DROP_PREVIOUS" }, acceptedScene: { svg: "DROP_ACCEPTED_COPY" } },
  SCENE.PROMPT({ artDirection: motionIllustrationDirection("history", "drawing"), scene: { text: "KEEP_FACT" }, drawingReference: "DROP_REFERENCE", continuity: { svg: "DROP_PREVIOUS" } }),
]) {
  const repair = SCENE.REPAIR(context, draft, ["Only correct one group"]);
  assert.ok(repair.includes("KEEP_FACT"));
  assert.ok(repair.includes(JSON.stringify(draft)));
  assert.ok(!/DROP_REFERENCE|DROP_PREVIOUS|DROP_ACCEPTED_COPY|FINAL REMINDER/.test(repair));
  assert.ok(repair.length < 16000);
}
assert.ok(!SCENE.REPAIR("MALFORMED_CONTEXT_SENTINEL", draft, []).includes("MALFORMED_CONTEXT_SENTINEL"));
console.log(JSON.stringify({ passed: true, finalWrapperBudget: true, transportUsesTaskBudget: true, preservedThreeStylePrompt: true, singleSceneMessage: true, scopedRepairContext: true, unicodeIntact: true, videoCreated: false }));
