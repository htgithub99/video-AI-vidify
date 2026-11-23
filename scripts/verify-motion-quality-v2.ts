import assert from "node:assert/strict";
import { MOTION_FIGURES } from "../src/constants/motionFigures.js";
import { motionSceneCastSeed, motionSceneBlueprint, type MotionCastLooks } from "../src/lib/motionSceneBlueprint.js";
import { motionSceneSpecCastLearn } from "../src/lib/motionSceneSpec.js";
import { motionFigureRenderKey, motionFigureView } from "../src/lib/motionFigures.js";
import { motionProductionReport } from "../src/lib/motionProductionReport.js";
import { motionSentencePieces } from "../src/features/motion/server/services/motionAudioService.js";
import { motionTrimBeatsToUnits } from "../src/features/motion/server/services/html/authoring.js";

// The figure table's keyframe reader, which the scene engine moves every item with.
const figures = (() => {
  const win: Record<string, any> = {};
  new Function("window", MOTION_FIGURES.SCRIPT)(win);
  return win.MotionFigures;
})();

// Cast looks seeded from the analysis and completed by the first scene (identity only: headgear changes with the scene).
const looks: MotionCastLooks = {};
motionSceneCastSeed(looks, [{ key: "chelmsford", name: "Lord Chelmsford", look: "Red-coated senior officer uniform with gold trim, high-seated pith helmet, white moustache.", skin: "pale" }, { key: "x", name: "Al", look: "plain" }]);
assert.equal(looks.chelmsford.top, "#b3362e");
assert.equal(looks.chelmsford.trim, "#d4a93a");
assert.equal(looks.chelmsford.hairColor, "#eeeae0");
assert.equal(looks.chelmsford.skin, "#f0d5bd");
assert.equal(looks.chelmsford._seed, true);
assert.equal(looks.lord.top, "#b3362e");
assert.equal(Object.keys(looks).length, 2);
motionSceneSpecCastLearn(looks, { version: 1, horizon: 300, items: [{ id: "chelmsford", fn: "person", x: 400, y: 600, h: 200, look: { top: "#111111", pants: "#f4f0e6", head: "helmet" } }] } as never);
assert.deepEqual(looks.chelmsford, { top: "#b3362e", pants: "#f4f0e6", trim: "#d4a93a", hairColor: "#eeeae0", skin: "#f0d5bd" });
console.log("cast seed ok");

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

// The plan shot sets the fallback scene's figure size (the layout only frames it); keyframes are read with easing.
{
  const template = "5. REQUIRED: king (focal): the king; guard (support): a guard\n6. MOTION: king walks in\n7. INTERACT: none";
  const sizeOf = (shot: string) => motionSceneBlueprint(template, { shot, focalMin: 0.18 })!.items.find((item) => item.id === "king")!.size;
  assert.ok(sizeOf("establishing") <= sizeOf("wide") && sizeOf("wide") <= sizeOf("medium") && sizeOf("medium") <= sizeOf("close"), "closer shots draw larger people");
  // The scene's own keyframes are read with easing: continuous, gentle at both ends, and never past the last keyframe.
  const host = figures;
  const keys = [{ at: 0, x: 100, y: 600, pose: "stand", facing: 1 }, { at: 0.4, x: 500, y: 600, pose: "walk" }, { at: 0.7, x: 500, y: 600, pose: "point" }, { at: 1, x: 500, y: 600, pose: "stand" }];
  assert.equal(host.track(keys, 0).x, 100);
  assert.ok(host.track(keys, 0.2).x > 300 && host.track(keys, 0.2).x < 500, "on the way");
  assert.ok(host.track(keys, 0.02).x > 110, "a move that starts on the first frame is already under way (no stall after the cut)");
  assert.equal(host.track(keys, 0.2).moving, true);
  assert.equal(host.track(keys, 0.5).moving, false);
  assert.equal(host.track(keys, 0.5).pose, "walk");
  assert.equal(host.track(keys, 0.75).pose, "point");
  assert.equal(host.track(keys, 1).x, 500);
  assert.equal(host.track(keys, 1).distance, 400);
  let previous = 100;
  for (let step = 0; step <= 200; step++) { const x = host.track(keys, step / 200).x; assert.ok(x >= previous - 1e-9 && x - previous < 12, "no jump and no step back"); previous = x; }
  // A move written as several keyframes keeps its speed through them: no stop at an inner keyframe.
  const ride = [{ at: 0, x: 0 }, { at: 0.3, x: 300 }, { at: 0.6, x: 600 }, { at: 1, x: 1000 }];
  for (const at of [0.3, 0.6]) { const before = host.track(ride, at - 0.01).x, after = host.track(ride, at + 0.01).x; assert.ok(after - before > 15, "keeps moving through the keyframe at " + at); assert.equal(host.track(ride, at).moving, true); }
  let last = 0;
  for (let step = 1; step <= 400; step++) { const x = host.track(ride, step / 400).x; assert.ok(x >= last - 1e-9, "never steps back"); last = x; }
  // A hold keyframe still stops the move, and the value never overshoots a keyframe.
  const hold = [{ at: 0, x: 0 }, { at: 0.4, x: 400 }, { at: 0.6, x: 400 }, { at: 1, x: 100 }];
  for (let step = 0; step <= 400; step++) { const x = host.track(hold, step / 400).x; assert.ok(x <= 400 + 1e-9 && x >= -1e-9, "no overshoot"); }
  assert.equal(host.track(hold, 0.5).moving, false);
  console.log("layout sizes and keyframe track ok");
}

// The view over the scene: the drawing style's finish, the layout, the plan's shot and kind, the spec's focal thing.
{
  assert.equal(motionFigureView({ profile: "comic", layout: "wide" }).style?.finish, "grain");
  assert.equal(motionFigureView({ profile: "horror", layout: "wide" }).style?.finish, "vignette");
  // The page plans its own shots from the drawn people: the view carries the layout, the plan's shot and kind (a map is
  // never cut) and the focal thing, never a fixed shot size.
  const close = motionFigureView({ layout: "close", scene: { shot: "medium", kind: "map" } });
  assert.equal(close.layout, "close");
  assert.deepEqual({ shot: close.scene.shot, kind: close.scene.kind }, { shot: "medium", kind: "map" });
  assert.equal((close as { shot?: unknown }).shot, undefined, "no fixed shot size");
  assert.deepEqual(motionFigureView({ layout: "medium", scene: { shot: "medium" } }, "king").focus, ["king"]);
  assert.deepEqual(motionFigureView({ layout: "auto" }).focus, []);
  assert.notEqual(motionFigureRenderKey({ layout: "close" }), motionFigureRenderKey({ layout: "wide" }), "a thumbnail knows the layout it was captured with");
  assert.notEqual(motionFigureRenderKey({ profile: "comic" }), motionFigureRenderKey({ profile: "sketch" }), "and the drawing style");
  console.log("view ok");
}
