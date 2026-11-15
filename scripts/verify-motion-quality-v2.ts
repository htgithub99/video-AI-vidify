import assert from "node:assert/strict";
import { MOTION_HTML_QUALITY } from "../src/constants/motionHtmlQuality.js";
import { MOTION_KIT_LAYOUT_FIX } from "../src/constants/motionKitLayoutFix.js";
import { motionSceneBlueprint, motionSafeSceneSource, motionSceneCastSeed, motionSceneCastLearn, motionSceneFixNotes, type MotionCastLooks } from "../src/lib/motionSceneBlueprint.js";
import { motionProductionReport } from "../src/lib/motionProductionReport.js";
import { motionSentencePieces } from "../src/features/motion/server/services/motionAudioService.js";
import { motionTrimBeatsToUnits } from "../src/features/motion/server/services/html/authoring.js";

// Motion rules: living motion on time, phases from the kit, and a map block of its own.
assert.match(MOTION_HTML_QUALITY.OUTPUT, /input\.time/);
assert.match(MOTION_HTML_QUALITY.OUTPUT, /MotionKit\.phase\(input\.progress, N\)/);
assert.match(MOTION_HTML_QUALITY.MAP_RULES, /MotionKit\.label/);
assert.ok(MOTION_HTML_QUALITY.TAIL_FROM > MOTION_HTML_QUALITY.END_PROGRESS && MOTION_HTML_QUALITY.TAIL_TO === 1);
for (const name of ["K.phase = ", "K.cues = ", "__motionKitFix.add", "STILL_POSES", "drawArrows"]) assert.ok(MOTION_KIT_LAYOUT_FIX.includes(name), name);
console.log("rules ok");

// The kit's phase helper follows the narration cues.
const fake = { __layoutFix: false } as Record<string, any>;
const kitPhase = (() => {
  const body = MOTION_KIT_LAYOUT_FIX;
  const start = body.indexOf("let cues = null;"),
    end = body.indexOf("// A map names its places");
  const n = (v: unknown, d: number) => (typeof v === "number" && isFinite(v) ? v : d);
  new Function("K", "n", body.slice(start, end))(fake, n);
  return fake;
})();
assert.deepEqual(kitPhase.phase(0.5, 2).index, 1);
kitPhase.cues([0, 0.2, 0.7]);
assert.equal(kitPhase.phase(0.1, 3).index, 0);
assert.equal(kitPhase.phase(0.25, 3).index, 1);
assert.equal(kitPhase.phase(0.69, 3).index, 1);
assert.equal(kitPhase.phase(0.75, 3).index, 2);
assert.ok(Math.abs(kitPhase.phase(0.45, 3).k - 0.5) < 1e-9);
assert.equal(kitPhase.phase(1, 3).k, 1);
console.log("phase ok");

// Cast looks seeded from the analysis and completed by the first drawing.
const looks: MotionCastLooks = {};
motionSceneCastSeed(looks, [{ key: "chelmsford", name: "Lord Chelmsford", look: "Red-coated senior officer uniform with gold trim, high-seated pith helmet, white moustache.", skin: "pale" }, { key: "x", name: "Al", look: "plain" }]);
assert.equal(looks.chelmsford.top, "#b3362e");
assert.equal(looks.chelmsford.trim, "#d4a93a");
assert.equal(looks.chelmsford.hairColor, "#eeeae0");
assert.equal(looks.chelmsford.skin, "#f0d5bd");
assert.equal(looks.chelmsford._seed, true);
assert.equal(looks.lord.top, "#b3362e");
assert.equal(Object.keys(looks).length, 2);
motionSceneCastLearn(looks, [{ id: "chelmsford", x: 0, y: 0, w: 0.1, h: 0.3, src: "kit", look: { top: "#111111", head: "helmet" } } as never]);
assert.deepEqual(looks.chelmsford, { top: "#b3362e", head: "helmet", trim: "#d4a93a", hairColor: "#eeeae0", skin: "#f0d5bd" });
console.log("cast seed ok");

// Code repair notes and the code-built map.
assert.equal(motionSceneFixNotes({ add: [{ fn: "prop", kind: "chain", mark: "chain" }] }).length, 1);
const mapPlan = motionSceneBlueprint("5. REQUIRED: army (focal): the Gothic army; adrianople (support): the city; danube (support): the river\n6. MOTION: army marches south", { shot: "map", kind: "map", focalMin: 0.08 });
assert.ok(mapPlan?.map);
const mapPage = motionSafeSceneSource(mapPlan!);
assert.match(mapPage, /MotionKit\.label\(/);
assert.match(mapPage, /MotionKit\.arrow\(/);
assert.doesNotThrow(() => new Function(mapPage.slice(mapPage.indexOf("<script>") + 8, mapPage.lastIndexOf("</script>")).replace(/document\.getElementById\([^)]*\)/, "({getContext(){return {}}})").replace("window.motionScene", "var motionScene")));
console.log("map ok");

// Sentences for the voice and the code length trim.
assert.deepEqual(motionSentencePieces("The army crossed the river at dawn. Dr. Smith watched from the hill above the camp. No. Nobody moved for a long time after that."), ["The army crossed the river at dawn.", "Dr. Smith watched from the hill above the camp.", "No. Nobody moved for a long time after that."]);
assert.equal(motionSentencePieces("One short line only here.").length, 1);
const cut = motionTrimBeatsToUnits([{ narration: "Valens rode out of Adrianople on 9 August 378. The heat was simply terrible for everyone there. His scouts counted 10000 Goths." }, { narration: "Dialogue stays.", utterances: [{ text: "Dialogue stays." }] }], 16);
assert.equal(cut.dropped, 1);
assert.equal(cut.beats[0].narration, "Valens rode out of Adrianople on 9 August 378. His scouts counted 10000 Goths.");
assert.equal(cut.beats[1].narration, "Dialogue stays.");
console.log("voice and length ok");

// Report.
const report = motionProductionReport({ id: "p1", input: { length: 120, language: "en" }, steps: { scenes: { seconds: 125, retries: 1 }, idle: { seconds: 0 } }, scenes: [{ id: "a", html: {} }, { id: "b", html: { attempts: 2 } }, { id: "c", html: { warnings: ["x|y"] } }, { id: "d", html: { fallback: true, attempts: 3 } }, { id: "e" }] });
assert.match(report.summary, /4 cảnh · đạt ngay 1 · có cảnh báo 1 · vẽ lại 1 · dự phòng 1 · 7 lượt AI/);
assert.match(report.text, /scenes: 2 phút 5 giây \(thử lại 1 lần\)/);
assert.ok(!report.text.includes("idle") && report.text.includes("x/y"));
console.log("motion quality v2 ok");

// The chosen layout sets the figure size of the layout plan, and a wrapped travel distance becomes one move.
{
  const { motionLayoutShares } = await import("../src/lib/motionLayout.js");
  const template = "5. REQUIRED: king (focal): the king; guard (support): a guard\n6. MOTION: king walks in\n7. INTERACT: none";
  const sizeOf = (layout: string, shot: string) => motionSceneBlueprint(template, { shot, focalMin: 0.18, shares: motionLayoutShares(layout as never) })!.items.find((item) => item.id === "king")!.size;
  const share = (r: number) => (r * 4.1) / 720;
  assert.ok(share(sizeOf("wide", "medium")) <= 0.28 && share(sizeOf("wide", "close")) <= 0.29 && share(sizeOf("wide", "establishing")) >= 0.14, "wide layout keeps people 16-28%");
  assert.ok(share(sizeOf("close", "close")) >= 0.58 && share(sizeOf("close", "close")) <= 0.72 && share(sizeOf("medium", "medium")) >= 0.38 && share(sizeOf("medium", "medium")) <= 0.48);
  assert.ok(share(sizeOf("stage", "medium")) >= 0.32 && share(sizeOf("stage", "medium")) <= 0.4 && share(sizeOf("cinematic", "medium")) >= 0.5 && share(sizeOf("cinematic", "medium")) <= 0.65);
  for (const layout of ["stage", "cinematic", "wide", "medium", "close"]) for (const shot of ["establishing", "wide", "medium", "close"]) assert.ok(sizeOf(layout, shot) > 0);
  const fixed = "const riderTravel = (time * 26) % 1400;\nconst volleyP = (time * 0.55) % 1;\nconst marchShift = (time * 28) % 320;".replace(MOTION_HTML_QUALITY.WRAP_TRAVEL, (all, head: string, expr: string, length: string) => (Number(length) > MOTION_HTML_QUALITY.WRAP_MIN ? `${head}Math.min(${expr}, ${length});` : all));
  assert.equal(fixed, "const riderTravel = Math.min((time * 26), 1400);\nconst volleyP = (time * 0.55) % 1;\nconst marchShift = Math.min((time * 28), 320);");
  kitPhase.cues(null);
  const ph = kitPhase.phase(0.5, 2);
  assert.equal(ph.of(0), 1);
  assert.equal(ph.of(1), 0);
  assert.ok(Math.abs(kitPhase.phase(0.75, 2).of(1) - 0.5) < 1e-9);
  console.log("layout sizes, steady travel and phase.of ok");
}
