import assert from "node:assert/strict";
import { motionSceneRigLines } from "../src/lib/motionSceneBrief.ts";
import { motionSceneActionLines } from "../src/lib/motionSceneActionBrief.ts";
const source = "AI author: hold the seated pose, exchange the scroll, then rest the hands; no walking.";
for (const id of ["history", "horror", "explainer"] as const) {
  const context: any = { artDirection: { id }, renderBehavior: { actors: "simple" }, sourceMotionIntents: [{ beatId: "b", narration: "They exchange a scroll", motionIntent: source }], scene: { purpose: "They exchange a scroll", nodes: [] } };
  assert.deepEqual(motionSceneRigLines(context), []);
  assert.ok(motionSceneActionLines(context).join("\n").includes(JSON.stringify(source)));
  assert.ok(!motionSceneActionLines(context).join("\n").includes("hip/knee/ankle"));
  assert.ok(motionSceneActionLines({ ...context, renderBehavior: { actors: "fixed" } }).join("\n").includes("animations: []"));
}
console.log("PASS: AI-written intent passes unchanged across profiles; code generates no choreography or rig action templates; motion off stays off.");
