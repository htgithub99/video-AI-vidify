import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { motionHtmlErrorSignature, motionHtmlFocalMoved, motionHtmlMissing, motionHtmlRequired, motionHtmlRuntimeFeedback, motionHtmlScriptIssue } from "../src/lib/motionHtmlQuality.js";
import { motionHtmlSource } from "../src/lib/motionHtmlScene.js";
import { MOTION_HTML } from "../src/constants/motionHtmlTemplate.js";

const dir = path.resolve("storage/tmp/quality1114");
const read = (name: string) => (fs.existsSync(path.join(dir, name)) ? fs.readFileSync(path.join(dir, name), "utf8") : undefined);

const html = (script: string) => `<!doctype html><html><head></head><body><canvas id="motion-canvas"></canvas><script>${script}</script></body></html>`;
const flatBroken = "const canvas = document.getElementById('motion-canvas')function clamp(v,a,b){return v<a?a:v>b?b:v}" + "x=x+1;".repeat(400);
const flat = motionHtmlScriptIssue(html(flatBroken));
assert.ok(flat?.flattened, "single-line broken script is reported as a lost-newline transport issue");
assert.equal(motionHtmlScriptIssue(html("const a = 1;\nfunction f(){ return a; }")), undefined, "valid script passes");
const multi = motionHtmlScriptIssue(html("const a = 1\nfunction f( { return a }"));
assert.ok(multi && !multi.flattened && /SyntaxError/.test(multi.reason), "multi-line syntax error is a normal execution issue");
assert.equal(motionHtmlScriptIssue(html("const a=1;function f(){return a;}" + "y=y+2;".repeat(400))), undefined, "valid minified single line is accepted");

const meta = read("f9ad55_attempt-2.txt");
if (meta) assert.ok(motionHtmlScriptIssue(motionHtmlSource(meta))?.flattened, "real Meta AI answer is detected as flattened");
const metaOk = read("f9ad55_attempt-7.txt");
if (metaOk) assert.equal(motionHtmlScriptIssue(motionHtmlSource(metaOk)), undefined, "real Meta answer with semicolons still passes");

const heroHtml = read("c1_b11_html_4.html") || html("function draw(){ ctx.fillRect(0, heroY, 10, 10); }\nconst y = heroY + 2;");
const feedback = motionHtmlRuntimeFeedback("page.evaluate: Error: heroY is not defined\n    at <anonymous>:4:282", heroHtml);
assert.match(feedback, /^PREVIOUS ANSWER FAILED WHEN RUN: Error: heroY is not defined\./);
assert.match(feedback, /heroY/);
assert.ok(!/<anonymous>/.test(feedback), "host stack frame is dropped");
const syntaxFeedback = motionHtmlRuntimeFeedback("SyntaxError: Unexpected token '}'", html("const a = 1;\nfunction f( { return a }"));
assert.match(syntaxFeedback, /function f\( \{ return a \}/);
assert.equal(
  motionHtmlErrorSignature("page.evaluate: Error: heroY is not defined\n    at <anonymous>:4:282"),
  motionHtmlErrorSignature("page.evaluate: Error: heroY is not defined\n    at <anonymous>:9:17"),
  "same error at another position has the same signature",
);
assert.notEqual(motionHtmlErrorSignature("Error: heroY is not defined"), motionHtmlErrorSignature("Error: groundY is not defined"));

const template = "0. SCENE THEME & TYPE: x\n5. REQUIRED: king (focal): King Béla IV mounted; banner (support): crimson banner; Cattle: bawling cows\n6. MOTION: king rides right -> left";
const required = motionHtmlRequired(template);
assert.deepEqual(required, [
  { id: "king", focal: true },
  { id: "banner", focal: false },
  { id: "cattle", focal: false },
]);
assert.deepEqual(motionHtmlRequired("no list here"), []);
assert.deepEqual(motionHtmlRequired("REQUIRED: foot soldiers (support): Mongol foot soldiers; protagonist (focal): You"), [{ id: "footsoldiers", focal: false }, { id: "protagonist", focal: true }]);
assert.deepEqual(motionHtmlMissing([{ id: "footsoldiers", focal: false }], [{ id: "foot_soldiers", x: 0.5, y: 0.5, w: 0.1, h: 0.1 }]), [], "ids match across spaces and underscores");
assert.deepEqual(motionHtmlMissing([{ id: "hero", focal: true }], [{ id: "hero", x: 0.5, y: 0.5, w: 0.04, h: 0.09 }], 0.08), [], "wide shots accept a smaller focal subject");
assert.equal(motionHtmlRequired("REQUIRED: hero: you; rope: a rope")[0].focal, true, "first item becomes focal when none is marked");

assert.deepEqual(motionHtmlMissing(required, [
  { id: "king", x: 0.4, y: 0.3, w: 0.08, h: 0.2 },
  { id: "banner", x: 0.5, y: 0.1, w: 0.02, h: 0.2 },
  { id: "cattle", x: 0.1, y: 0.6, w: 0.1, h: 0.08 },
]), []);
const missing = motionHtmlMissing(required, [
  { id: "king", x: 0.8, y: 0.6, w: 0.03, h: 0.05 },
  { id: "cattle", x: 1.2, y: 0.5, w: 0.1, h: 0.1 },
]);
assert.equal(missing.length, 3);
assert.match(missing.join("|"), /king \(5% of the frame/);
assert.match(missing.join("|"), /banner \(not drawn or not marked\)/);
assert.match(missing.join("|"), /cattle \(mostly outside the frame\)/);
assert.deepEqual(motionHtmlMissing(required, [
  { id: "King", x: 0.1, y: 0.5, w: 0.05, h: 0.07 },
  { id: "king", x: 0.15, y: 0.4, w: 0.05, h: 0.1 },
  { id: "banner", x: 0.2, y: 0.2, w: 0.02, h: 0.1 },
  { id: "cattle", x: 0.6, y: 0.6, w: 0.1, h: 0.1 },
]), [], "several marks of one id are merged into one box");

assert.equal(motionHtmlFocalMoved(required, [{ id: "king", x: 0.4, y: 0.3, w: 0.1, h: 0.2 }], [{ id: "king", x: 0.41, y: 0.3, w: 0.1, h: 0.2 }]), false, "1% drift is not a move");
assert.equal(motionHtmlFocalMoved(required, [{ id: "king", x: 0.4, y: 0.3, w: 0.1, h: 0.2 }], [{ id: "king", x: 0.2, y: 0.3, w: 0.1, h: 0.2 }]), true, "travel is a move");
assert.equal(motionHtmlFocalMoved(required, [{ id: "king", x: 0.4, y: 0.3, w: 0.1, h: 0.2 }], [{ id: "king", x: 0.4, y: 0.3, w: 0.1, h: 0.24 }]), true, "a raised arm or push-in is a move");

const planText = MOTION_HTML.TEMPLATE;
assert.match(planText, /5\. REQUIRED:/);
assert.match(planText, /6\. MOTION:/);
assert.match(MOTION_HTML.ON_SCREEN_TEXT(undefined, true), /names every place/);
assert.match(MOTION_HTML.ON_SCREEN_TEXT(undefined, false), /no place sign/);
// A layout is the camera over the scene the AI drew once: the shot size per layout and plan shot, never a drawing rule.
const { motionCameraShot, motionLayoutOf } = await import("../src/lib/motionLayout.js");
{
  assert.match(MOTION_HTML.OUTPUT, /SCALE: size people by shot/, "the scene keeps one generic size rule");
  assert.equal(motionCameraShot("wide", { shot: "close" }), "wide", "Toàn cảnh is the AI's whole frame");
  assert.equal(motionCameraShot("stage", { shot: "medium" }), "full");
  assert.equal(motionCameraShot("medium", { shot: "medium" }), "cowboy");
  assert.equal(motionCameraShot("cinematic", { shot: "medium" }), "medium");
  assert.equal(motionCameraShot("close", { shot: "medium" }), "mcu");
  assert.equal(motionCameraShot("medium", { shot: "establishing" }), "full", "an establishing scene steps one size out");
  assert.equal(motionCameraShot("cinematic", { shot: "close" }), "mcu", "a close scene steps one size in");
  assert.equal(motionCameraShot("close", { shot: "close" }), "mcu", "never past the closest size");
  assert.equal(motionCameraShot("close", { shot: "medium", kind: "map" }), "wide", "a map is never cut");
  assert.equal(motionLayoutOf({ profileId: "sketch" }), "auto", "Tự động in Dựng cảnh AI is the whole frame");
  assert.equal(motionLayoutOf({ profileId: "sketch", figureKit: true }), "stage", "Tự động in Bộ vẽ chuẩn follows the style");
}
const { MOTION_HTML_QUALITY: QQ } = await import("../src/constants/motionHtmlQuality.js");
const reviewPrompt = QQ.REVIEW_PROMPT("You shove the rider off the bridge.", "protagonist (focal): You; rider (focal): Mongol rider", "rider falls into the river", "the protagonist shoves a rider off the bridge");
assert.match(reviewPrompt, /NARRATION: You shove/);
assert.match(reviewPrompt, /MUST BE VISIBLE: protagonist/);
assert.match(reviewPrompt, /JSON only/);
assert.equal("0. x\n6. MOTION: rider falls -> gone".match(QQ.MOTION_LINE)?.[1], "rider falls -> gone");
assert.equal("Exact approved event: a man runs.\n1. SUBJECTS".match(QQ.EVENT_LINE)?.[1], "a man runs.");
console.log("motion html quality ok");
