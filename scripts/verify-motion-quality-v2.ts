import { MOTION_CATALOG_RUNTIME } from "../src/lib/motionObjectCatalog.js";
import assert from "node:assert/strict";
import { MOTION_HTML_QUALITY } from "../src/constants/motionHtmlQuality.js";
import { motionSceneBlueprint, motionSafeSceneSource, motionSceneCastSeed, motionSceneCastLearn, type MotionCastLooks } from "../src/lib/motionSceneBlueprint.js";
import { MOTION_FIGURES } from "../src/constants/motionFigures.js";
import { motionFigureRenderKey, motionFigureView, motionHtmlFigures, motionHtmlFiguresIssue } from "../src/lib/motionFigures.js";
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

// The plan shot sets the figure size of the scene (the layout only frames it), and a wrapped travel distance becomes one move.
{
  const template = "5. REQUIRED: king (focal): the king; guard (support): a guard\n6. MOTION: king walks in\n7. INTERACT: none";
  const sizeOf = (shot: string) => motionSceneBlueprint(template, { shot, focalMin: 0.18 })!.items.find((item) => item.id === "king")!.size;
  assert.ok(sizeOf("establishing") <= sizeOf("wide") && sizeOf("wide") <= sizeOf("medium") && sizeOf("medium") <= sizeOf("close"), "closer shots draw larger people");
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
    const win: Record<string, any> = { MotionKit: kit, __motionCatalog: MOTION_CATALOG_RUNTIME, __motionMarks: marks, motionMark: (_c: unknown, id: string, x: number, y: number, w: number, h: number) => marks.push({ id, x, y, w, h }) };
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
  // Kit drawings are measured from their pixels: a tiny raster stands in for the hidden canvas, and the fake kit paints
  // plain rectangles (a person 2r wide and 4.4r tall, a piece of wall 3p wide and 2p tall per piece).
  const raster = () => {
    let W = 0, H = 0, data = new Uint8ClampedArray(0);
    const ctx2 = {
      setTransform() {}, save() {}, restore() {}, translate() {}, scale() {},
      clearRect() { data.fill(0); },
      fillRect(x: number, y: number, w: number, h: number) { for (let j = Math.max(0, Math.floor(y)); j < Math.min(H, Math.ceil(y + h)); j++) for (let i = Math.max(0, Math.floor(x)); i < Math.min(W, Math.ceil(x + w)); i++) data[(j * W + i) * 4 + 3] = 255; },
      getImageData() { return { data }; },
    };
    return { get width() { return W; }, set width(v: number) { W = v; data = new Uint8ClampedArray(W * Math.max(H, v) * 4); }, get height() { return H; }, set height(v: number) { H = v; data = new Uint8ClampedArray(W * H * 4); }, getContext: () => ctx2 };
  };
  (globalThis as any).document = { createElement: () => raster() };
  const kitCalls: any[] = [];
  const K = {
    poses: ["stand", "walk"], animals: ["horse"], vehicles: ["wagon"], trees: ["oak"], props: ["barrel", "wall", "fence"],
    style: () => "outline", proportion: () => "",
    knows: (fn: string, kind: string) => ({ animal: ["horse"], vehicle: ["wagon"], tree: ["oak"], prop: ["barrel", "wall", "fence"] } as Record<string, string[]>)[fn]?.includes(kind) ?? false,
    person: (c: any, o: any) => { kitCalls.push(o); c.fillRect?.(o.x - o.r, o.y - 4.4 * o.r, 2 * o.r, 4.4 * o.r); return { hand: [o.x + o.r, o.y - 2 * o.r] }; },
    animal: (_c: unknown, o: any) => { kitCalls.push(o); return {}; },
    prop: (c: any, o: any) => { kitCalls.push(o); const w = 3 * o.p * (o.count || 1); c.fillRect?.(o.x - w / 2, o.y - 2 * o.p, w, 2 * o.p); return {}; },
    icons: ["swords"],
    icon: (c: any, o: any) => { kitCalls.push({ icon: o }); c.fillRect?.(o.x - o.r / 2, o.y - o.r / 2, o.r, o.r); },
    arrow: (_c: unknown, o: any) => { kitCalls.push({ arrow: o }); },
  };
  const kitRun = run(K);
  const kitFig = kitRun.F.use(own);
  calls.length = 0;
  const b = kitFig.person(ctx, { x: 400, y: 600, h: 132, w: 66, pose: "walk", top: "#aa0000", mark: "hero" });
  const call = kitCalls[kitCalls.length - 1];
  assert.ok(Math.abs(call.r - 30) < 1e-9, "height fitted: r = h / 4.4");
  assert.equal(call.y, 600, "feet on the scene's ground point");
  assert.equal(call.top, "#aa0000", "the scene's colours");
  assert.equal(call.mark, undefined, "the table marks the box once");
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
  // An icon fills the circle the scene gives whatever its pulse (pulse 0 is no ring, never a hidden icon); curve is px.
  kitFig.icon(ctx, { kind: "swords", x: 100, y: 100, r: 40, pop: 0 });
  const icon = kitCalls[kitCalls.length - 1].icon;
  assert.ok(Math.abs(icon.r - 80) < 2 && icon.pop === 1, "the symbol's painted half-size (r/2) fills r and shows fully");
  kitFig.arrow(ctx, { from: [0, 0], to: [400, 0], curve: 100 });
  assert.equal(kitCalls[kitCalls.length - 1].arrow.curve, 0.25, "a 100 px bend on a 400 px arrow");
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
  // The view over the scene: the style layer only for "Bộ vẽ chuẩn", the layout's shot for the scene, never for a map.
  const viewOf = (render: Parameters<typeof motionFigureView>[0]) => motionFigureView(render);
  assert.deepEqual(viewOf({ kit: false, profile: "comic", layout: "wide" }), { style: null, shot: "wide", focus: [], movement: "smooth" }, "Dựng cảnh AI · Toàn cảnh shows the scene as drawn");
  assert.equal(viewOf({ kit: true, profile: "comic", layout: "wide" }).style?.finish, "grain");
  assert.equal(viewOf({ kit: true, profile: "horror", layout: "wide" }).style?.finish, "vignette");
  assert.equal(viewOf({ kit: false, layout: "close", scene: { shot: "medium" } }).shot, "mcu");
  assert.equal(viewOf({ kit: false, layout: "close", scene: { shot: "medium", kind: "map" } }).shot, "wide");
  assert.deepEqual(viewOf({ kit: false, layout: "medium", scene: { shot: "medium", sceneTemplate: "5. REQUIRED: king (focal): the king; guard (support): a guard" } }).focus, ["king"]);
  assert.ok(motionHtmlFigures(page, { kit: false, layout: "close", scene: { shot: "medium" } }).includes('window.__motionView={"style":null,"shot":"mcu"'));
  assert.notEqual(motionFigureRenderKey({ kit: false, layout: "close" }), motionFigureRenderKey({ kit: false, layout: "wide" }), "a thumbnail knows the layout it was captured with");
  assert.equal(motionFigureRenderKey({ kit: false, profile: "comic" }), motionFigureRenderKey({ kit: false, profile: "sketch" }), "the drawing style does not change Dựng cảnh AI");
  console.log("figure table ok");
}
