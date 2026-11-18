// Plan lines the scene spec reads (REQUIRED ids, MOTION, the approved event), the layout's camera over the scene and the
// review prompt.
import assert from "node:assert/strict";
import { motionHtmlRequired } from "../src/lib/motionHtmlQuality.js";
import { MOTION_HTML } from "../src/constants/motionHtmlTemplate.js";

const template = "0. SCENE THEME & TYPE: x\n5. REQUIRED: king (focal): King Béla IV mounted; banner (support): crimson banner; Cattle: bawling cows\n6. MOTION: king rides right -> left";
const required = motionHtmlRequired(template);
assert.deepEqual(required, [
  { id: "king", focal: true },
  { id: "banner", focal: false },
  { id: "cattle", focal: false },
]);
assert.deepEqual(motionHtmlRequired("no list here"), []);
assert.deepEqual(motionHtmlRequired("REQUIRED: foot soldiers (support): Mongol foot soldiers; protagonist (focal): You"), [{ id: "footsoldiers", focal: false }, { id: "protagonist", focal: true }]);
assert.equal(motionHtmlRequired("REQUIRED: hero: you; rope: a rope")[0].focal, true, "first item becomes focal when none is marked");

const planText = MOTION_HTML.TEMPLATE;
assert.match(planText, /5\. REQUIRED:/);
assert.match(planText, /6\. MOTION:/);
// A layout is the camera over the scene the AI described once (planned in the page from the drawn people), never a
// drawing rule: the setting reaches the page as is, and an unknown value falls back to "Tự động".
const { motionLayoutOf } = await import("../src/lib/motionLayout.js");
{
  for (const id of ["wide", "stage", "medium", "cinematic", "close", "auto"]) assert.equal(motionLayoutOf({ layout: id }), id);
  assert.equal(motionLayoutOf({ layout: "nonsense" }), "auto", "an unknown layout is Tự động");
  assert.equal(motionLayoutOf({}), "auto");
}
const { MOTION_HTML_QUALITY: QQ } = await import("../src/constants/motionHtmlQuality.js");
const reviewPrompt = QQ.REVIEW_PROMPT({ narration: "You shove the rider off the bridge.", message: "You push the rider into the river", keyVisual: "you, the rider falling, the bridge", required: "protagonist (focal): You; rider (focal): Mongol rider", motion: "rider falls into the river", event: "the protagonist shoves a rider off the bridge" });
assert.match(reviewPrompt, /NARRATION: You shove/);
assert.match(reviewPrompt, /MUST BE VISIBLE: protagonist/);
assert.match(reviewPrompt, /JSON only/);
assert.match(reviewPrompt, /MESSAGE: You push the rider/);
assert.match(reviewPrompt, /"shows"/);
assert.equal("0. x\n6. MOTION: rider falls -> gone".match(QQ.MOTION_LINE)?.[1], "rider falls -> gone");
assert.equal("Exact approved event: a man runs.\n1. SUBJECTS".match(QQ.EVENT_LINE)?.[1], "a man runs.");
console.log("motion html quality ok");
