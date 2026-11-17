// One AI request per scene: what the checks find is a warning, never a new drawing; what code can repair (erasing
// composite modes, typographic quotes, a cut-off end) is repaired in place; a drawing that cannot run gets exactly one
// new drawing, then the scene drawn by code from the plan stands in. The scene's own figure functions are read for things
// they draw outside their options.
import assert from "node:assert/strict";
import { motionHtmlRepairDraw } from "../src/lib/motionHtmlPrompt.js";
import { motionHtmlSource } from "../src/lib/motionHtmlScene.js";
import { motionHtmlScriptIssue } from "../src/lib/motionHtmlQuality.js";
import { motionFigureOwnExtras } from "../src/lib/motionFigures.js";
import { MOTION_HTML } from "../src/constants/motionHtmlTemplate.js";
import { MOTION_SCENE_BLUEPRINT } from "../src/constants/motionSceneBlueprint.js";

// Repairs in place.
const notes: string[] = [];
const erased = motionHtmlRepairDraw("<script>ctx.globalCompositeOperation = 'destination-out'; ctx.fill();</script>", notes);
assert.ok(!MOTION_HTML.ERASE_PATTERN.test(erased) && erased.includes("source-over"), "an erasing composite mode is painted normally");
assert.deepEqual(notes, [MOTION_HTML.ERASE_REPAIRED], "and the repair is kept as a warning");
const quoted = motionHtmlSource("<!doctype html><html><body><script>const a = “hello”; window.motionScene = { ready: Promise.resolve(), renderAt: async function () { return a; } };</script></body></html>");
assert.equal(motionHtmlScriptIssue(quoted), undefined, "typographic quotes used as code quotes are straightened");
const cut = motionHtmlSource("<!doctype html><html><body><script>window.motionScene = { ready: Promise.resolve(), renderAt: async function () { const f = () => { return 1;");
assert.equal(motionHtmlScriptIssue(cut), undefined, "a cut-off end is closed");
assert.equal(MOTION_SCENE_BLUEPRINT.EXEC_LIMIT, 2, "a drawing that cannot run gets exactly one new drawing");

// Things a scene's figure function draws outside its options.
const own = `const FIG = window.MotionFigures.use({
  person(ctx, o) {
    drawBody(ctx, o);
    if (o.hold === 'crossbow') drawCrossbow(ctx, o);
    const crossbowLen = o.h * 0.4;
    ctx.lineTo(crossbowLen, 0);
    return { box: {} };
  },
  vehicle(ctx, o) { drawWheel(ctx, o); }
});`;
assert.deepEqual(motionFigureOwnExtras(own), ["person: crossbow"], "a held thing drawn into the person function outside hold is found; the hold option and the figure's own parts are not");

// The pipeline: a drawing whose focal subject is missing is kept with a warning after one request.
const { generateMotionHtmlScene } = await import("../src/features/motion/server/services/html/scenePipeline.js");
const page = `<!doctype html><html><head><meta charset="utf-8"></head><body><canvas id="motion-canvas" width="1280" height="720"></canvas><script>
const FIG = window.MotionFigures.use({ person(ctx, o) { ctx.fillStyle = '#334'; ctx.fillRect(o.x - 10, o.y - o.h, 20, o.h); return { box: { x: o.x - 10, y: o.y - o.h, w: 20, h: o.h } }; } });
window.motionScene = { ready: Promise.resolve(), renderAt: async function (input = {}) { const c = document.getElementById('motion-canvas'); const ctx = c.getContext('2d'); ctx.globalCompositeOperation = 'xor'; ctx.fillStyle = '#9b9'; ctx.fillRect(0, 0, 1280, 720); FIG.person(ctx, { mark: 'other', x: 300 + 400 * (input.progress || 0), y: 600, h: 120, pose: 'walk', distance: 400 * (input.progress || 0) }); } };
</script></body></html>`;
let calls = 0;
const logs: string[] = [];
const scene: any = { id: "c1_b1:html:0", sceneTemplate: "0. A drover limps in.\n5. REQUIRED: drover (focal): limping man\n6. MOTION: drover walk -> stop", message: "A drover limps in." };
await generateMotionHtmlScene(scene, { width: 1280, height: 720, seconds: 6, profile: "history", scope: "t-one-request-" + Date.now(), language: "en", motion: true } as any, {
  exec: { provider: "gemini-chat", model: "gemini-flash" } as any,
  ai: (async () => { calls++; return page; }) as any,
  log: (line: string) => logs.push(line),
} as any);
assert.equal(calls, 1, "one request: a missing focal subject is a warning, not a new drawing");
assert.equal(scene.html?.status, "ready");
assert.ok((scene.html?.warnings || []).some((w: string) => /drover/.test(w)), "the missing subject is a warning on the scene");
assert.ok((scene.html?.warnings || []).includes(MOTION_HTML.ERASE_REPAIRED), "the erasing mode was repaired in place");
assert.ok(!/globalCompositeOperation = 'xor'/.test(scene.html.html), "the stored scene is the repaired one");

// A drawing that cannot run: one new drawing, then the scene drawn by code from the plan.
let broken = 0;
const scene2: any = { id: "c1_b1:html:1", sceneTemplate: "0. A drover limps in.\n5. REQUIRED: drover (focal): limping man\n6. MOTION: drover walk -> stop", message: "A drover limps in." };
await generateMotionHtmlScene(scene2, { width: 1280, height: 720, seconds: 6, profile: "history", scope: "t-one-request-b-" + Date.now(), language: "en", motion: true } as any, {
  exec: { provider: "gemini-chat", model: "gemini-flash" } as any,
  ai: (async () => { broken++; return page.replace("FIG.person(ctx,", "undefinedThing.call(); FIG.person(ctx,"); }) as any,
  log: (line: string) => logs.push(line),
} as any);
assert.equal(broken, 2, "a drawing that cannot run gets exactly one new drawing");
assert.equal(scene2.html?.fallback, true, "then the scene drawn by code from the plan stands in");
console.log("One request per scene: checks are warnings, code repairs in place, one new drawing only for a drawing that cannot run, then the plan's scene.");
process.exit(0);
