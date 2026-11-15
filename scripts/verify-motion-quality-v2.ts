import assert from "node:assert/strict";
import { MOTION_HTML_QUALITY } from "../src/constants/motionHtmlQuality.js";
import { motionSceneBlueprint, motionSafeSceneSource, motionSceneCastSeed, motionSceneCastLearn, type MotionCastLooks } from "../src/lib/motionSceneBlueprint.js";
import { MOTION_FIGURES } from "../src/constants/motionFigures.js";
import { motionHtmlFigures, motionHtmlFiguresIssue } from "../src/lib/motionFigures.js";
import { motionProductionReport } from "../src/lib/motionProductionReport.js";
import { motionSentencePieces } from "../src/features/motion/server/services/motionAudioService.js";
import { motionTrimBeatsToUnits } from "../src/features/motion/server/services/html/authoring.js";

// Motion rules: living motion on time, phases and keyframes from the figure table, and a map block of its own.
assert.match(MOTION_HTML_QUALITY.OUTPUT, /input\.time/);
assert.match(MOTION_HTML_QUALITY.OUTPUT, /MotionFigures\.phase\(input\.progress, 3, input\.cues\)/);
assert.match(MOTION_HTML_QUALITY.MAP_RULES, /FIG\.label/);
assert.doesNotMatch(MOTION_HTML_QUALITY.OUTPUT + MOTION_HTML_QUALITY.MAP_RULES, /MotionKit\./, "scenes never call the kit");
assert.ok(MOTION_HTML_QUALITY.TAIL_FROM > MOTION_HTML_QUALITY.END_PROGRESS && MOTION_HTML_QUALITY.TAIL_TO === 1);
console.log("rules ok");

// The figure table's phase helper follows the narration cues, and its keyframe reader is shared by both renderers.
const figures = (() => {
  const win: Record<string, any> = {};
  new Function("window", MOTION_FIGURES.SCRIPT)(win);
  return win.MotionFigures;
})();
assert.deepEqual(figures.phase(0.5, 2).index, 1);
const cues = [0, 0.2, 0.7];
assert.equal(figures.phase(0.1, 3, cues).index, 0);
assert.equal(figures.phase(0.25, 3, cues).index, 1);
assert.equal(figures.phase(0.69, 3, cues).index, 1);
assert.equal(figures.phase(0.75, 3, cues).index, 2);
assert.ok(Math.abs(figures.phase(0.45, 3, cues).k - 0.5) < 1e-9);
assert.equal(figures.phase(1, 3, cues).k, 1);
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
motionSceneCastLearn(looks, [{ id: "chelmsford", x: 0, y: 0, w: 0.1, h: 0.3, src: "fig", look: { top: "#111111", head: "helmet" } } as never]);
assert.deepEqual(looks.chelmsford, { top: "#b3362e", head: "helmet", trim: "#d4a93a", hairColor: "#eeeae0", skin: "#f0d5bd" });
console.log("cast seed ok");

// The code-built map.
const mapPlan = motionSceneBlueprint("5. REQUIRED: army (focal): the Gothic army; adrianople (support): the city; danube (support): the river\n6. MOTION: army marches south", { shot: "map", kind: "map", focalMin: 0.08 });
assert.ok(mapPlan?.map);
const mapPage = motionSafeSceneSource(mapPlan!);
assert.match(mapPage, /FIG\.label\(/);
assert.match(mapPage, /FIG\.arrow\(/);
assert.doesNotMatch(mapPage, /MotionKit/, "the fallback page is on the figure table");
assert.doesNotThrow(() => new Function("window", mapPage.slice(mapPage.indexOf("<script>") + 8, mapPage.lastIndexOf("</script>")).replace(/document\.getElementById\([^)]*\)/, "({getContext(){return {}}})"))({ MotionFigures: figures, __MOTION_HOST__: true }));
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
  const ph = figures.phase(0.5, 2);
  assert.equal(ph.of(0), 1);
  assert.equal(ph.of(1), 0);
  assert.ok(Math.abs(figures.phase(0.75, 2).of(1) - 0.5) < 1e-9);
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
  assert.ok(!("WRAP_TRAVEL" in MOTION_HTML_QUALITY), "the pipeline does not alter the scene's motion");
  assert.match(MOTION_HTML_QUALITY.OUTPUT, /MotionFigures\.track\(heroKeys, input\.progress\)/);
  console.log("layout sizes, phase.of and keyframe track ok");
}

// One scene, two renderers: the figure table runs the scene's own functions, or the kit fitted into the scene's box.
{
  const run = (kit?: Record<string, any>) => {
    const marks: any[] = [];
    const win: Record<string, any> = { MotionKit: kit, __motionMarks: marks, motionMark: (_c: unknown, id: string, x: number, y: number, w: number, h: number) => marks.push({ id, x, y, w, h }) };
    new Function("window", MOTION_FIGURES.SCRIPT)(win);
    return { F: win.MotionFigures, marks };
  };
  const calls: string[] = [];
  const ctx = { save() {}, restore() {}, translate() {}, scale(sx: number) { calls.push("scale " + sx.toFixed(3)); } };
  // AI renderer: the scene's own function draws and its result comes back with the box filled in.
  const ai = run();
  const own = { person: (_c: unknown, o: any) => { calls.push("own person " + o.x); return { hand: [o.x + 10, o.y - 50] }; } };
  const aiFig = ai.F.use(own);
  const a = aiFig.person(ctx, { x: 400, y: 600, h: 120, w: 50, pose: "walk", top: "#aa0000", mark: "hero" });
  assert.deepEqual(a.box, { x: 375, y: 480, w: 50, h: 120 });
  assert.deepEqual(a.hand, [410, 550]);
  assert.equal(ai.marks[0].id, "hero");
  assert.equal(ai.marks[0].look.top, "#aa0000");
  assert.equal(aiFig.tree(ctx, { kind: "zzz", x: 1, y: 2, h: 3, w: 4 }).box.h, 3, "a kind without a function still has a box");
  // Kit renderer: the kit person gets the size that makes it exactly h tall, a sideways stretch to w (within limits), and
  // its hand comes back through the same stretch; the scene's own function is not called.
  const kitCalls: any[] = [];
  const K = {
    poses: ["stand", "walk"], animals: ["horse"], vehicles: ["wagon"], trees: ["oak"], props: ["barrel", "wall", "fence"], icons: ["swords"],
    style: () => "outline", proportion: () => "",
    knows: (fn: string, kind: string) => ({ animal: ["horse"], vehicle: ["wagon"], tree: ["oak"], prop: ["barrel", "wall", "fence"] } as Record<string, string[]>)[fn]?.includes(kind) ?? false,
    size: (fn: string, o: any) => (fn === "person" ? { width: 2 * o.r, height: 4.4 * o.r } : { width: 3 * o.p * (o.count || 1), height: 2 * o.p, left: 1.5 * o.p, right: 1.5 * o.p }),
    person: (_c: unknown, o: any) => { kitCalls.push(o); return { hand: [o.x + o.r, o.y - 2 * o.r] }; },
    animal: (_c: unknown, o: any) => { kitCalls.push(o); return {}; },
    prop: (_c: unknown, o: any) => { kitCalls.push(o); return {}; },
  };
  const kitRun = run(K);
  const kitFig = kitRun.F.use(own);
  calls.length = 0;
  const b = kitFig.person(ctx, { x: 400, y: 600, h: 132, w: 66, pose: "walk", top: "#aa0000", mark: "hero" });
  assert.ok(Math.abs(kitCalls[0].r - 30) < 1e-9, "height fitted: r = h / 4.4");
  assert.equal(kitCalls[0].y, 600, "feet on the scene's ground point");
  assert.equal(kitCalls[0].top, "#aa0000", "the scene's colours");
  assert.equal(kitCalls[0].mark, undefined, "the table marks the box once");
  assert.ok(calls.includes("scale 1.100"), "width fitted by a sideways stretch: 66 / 60");
  assert.deepEqual(b.hand, [400 + 30 * 1.1, 540]);
  assert.deepEqual(b.box, { x: 367, y: 468, w: 66, h: 132 });
  assert.ok(!calls.some((line) => line.startsWith("own person")), "the kit draws, not the scene's own function");
  kitFig.person(ctx, { x: 0, y: 0, h: 132, w: 300 });
  assert.ok(calls.includes("scale 1.250"), "the stretch never distorts past its limit");
  kitFig.person(ctx, { x: 0, y: 0, h: 132, w: 60, pose: "juggle" });
  assert.equal(kitCalls[kitCalls.length - 1].pose, "stand", "a pose the kit lacks becomes a plain stand");
  // A kind the kit has no drawing for stays the scene's own drawing.
  let ownTree = 0;
  kitRun.F.use({ tree: () => { ownTree++; return {}; } }).tree(ctx, { kind: "baobab", x: 0, y: 0, h: 100, w: 80 });
  assert.equal(ownTree, 1);
  // Walls along a length are a row of kit pieces sized to the height.
  kitFig.wall(ctx, { kind: "fence", x: 500, y: 600, h: 40, w: 600 });
  assert.equal(kitCalls[kitCalls.length - 1].count, 10);
  // Keyframes and phases are the same for both renderers.
  const keys = [{ at: 0, x: 0 }, { at: 0.3, x: 300 }, { at: 0.6, x: 600 }, { at: 1, x: 1000 }];
  assert.ok(kitRun.F.track(keys, 0.31).x - kitRun.F.track(keys, 0.29).x > 15, "speed carries through a keyframe");
  assert.ok(kitRun.F.track(keys, 0.01).x > 5, "a move under way when the scene opens has no pause");
  assert.equal(kitRun.F.phase(0.25, 3, [0, 0.2, 0.7]).index, 1);
  // The page: only scenes written for the table get it, and the kit only for "Bộ vẽ chuẩn".
  const page = "<html><head></head><body><script>const FIG = window.MotionFigures.use({});</script></body></html>";
  assert.ok(motionHtmlFigures(page).includes(MOTION_FIGURES.ATTR) && !motionHtmlFigures(page).includes("data-motion-kit"));
  assert.ok(motionHtmlFigures(page, { kit: true, profile: "sketch" }).includes("data-motion-kit"));
  assert.equal(motionHtmlFigures("<html><head></head><body></body></html>", { kit: true, profile: "sketch" }), "<html><head></head><body></body></html>", "older scenes are left as they were drawn");
  assert.ok(motionHtmlFiguresIssue("MotionKit.person(ctx, {})") && !motionHtmlFiguresIssue(page));
  console.log("figure table ok");
}
