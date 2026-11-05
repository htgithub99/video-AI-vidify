import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
const root = fs.mkdtempSync(path.join(os.tmpdir(), "motion-clip-director-"));
const priorStorage = process.env.VIDIFY_STORAGE_DIR;
process.env.VIDIFY_STORAGE_DIR = root;
const { MOTION_SCENE_COMPOSITION: C } = await import("../src/constants/motionSceneComposition.js");
const { MOTION_VISUAL: V } = await import("../src/constants/motionVisual.js");
const { MOTION_CLIP_DIRECTOR: D } = await import("../src/constants/motionClipDirector.js");
const { compositionFrameSvg } = await import("../src/lib/motionSceneComposition.js");
const { motionSceneSubjectPoint } = await import("../src/lib/motionSceneCamera.js");
const { puppetBeatLines } = await import("../src/lib/motionPuppet.js");
const { buildRemotionScenes } = await import("../src/features/motion/server/services/remotion/scenePipeline.js");
const behavior = { version: 1 as const, actors: "simple" as const, sceneEffects: "gentle" as const, camera: "fixed" as const };
const settings = { version: 1 as const, mode: "remotion" as const, engine: "remotion" as const, profileId: "history" as const, componentRevision: 1 };
const node: any = { id: "person", kind: "character", entityId: "uncle", description: "man waving", pose: "standing, waving", slot: "center", evidence: "Chú vẫy tay." };
const design = { camera: "wide eye-level view", palette: ["#303741"], placements: [{ id: "person", box: { x: 0.3, y: 0.2, width: 0.1, height: 0.5 }, depth: 2, supportId: "floor", contact: { x: 0.35, y: 0.7 }, construction: "Connected adult standing on floor" }] };
// The person group carries a base transform, so pivots must be measured in its local space.
const illustration = {
  svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720"><g id="room"><rect width="1280" height="720" fill="#303741"/></g><g id="river"><rect x="0" y="560" width="1280" height="80" fill="#4aa3d8"/></g><g id="person" transform="translate(400 200)"><path d="M0 0L40 0L40 200L0 200Z" fill="#605d76"/><g id="person_arm"><path d="M30 20L30 120" stroke="#e0ac69" stroke-width="10"/></g><path id="mouth" d="M10 20Q20 20 30 20" fill="none" stroke="#000"/></g></svg>`,
  layers: [
    { id: "room", kind: "background" },
    { id: "river", kind: "effect", effectKind: "water" },
    { id: "person", kind: "character", entityId: "uncle" },
  ],
  animations: [{ target: "person", channel: "actor", attribute: "transform", period: 4, keyframes: [{ at: 0, value: "translate(0 0)" }, { at: 2, value: "translate(0 -1)" }, { at: 4, value: "translate(0 0)" }] }],
  design,
};
const analysis: any = { title: "Clip director", visualSettings: settings, era: "rural Vietnam", cast: [{ key: "uncle", name: "Chú", look: "purple shirt" }], places: [{ key: "house", name: "Nhà", description: "riverside house" }], chapters: [{ id: "chapter", targetSeconds: 6 }] };
const script: any = { title: "Clip director", language: "vi", visualSettings: settings, beats: [{ id: "beat", chapterId: "chapter", visual: "scene", place: "house", narration: "Chú vẫy tay bên dòng sông đang chảy.", utterances: [{ id: "n", speaker: "narrator", role: "narration", text: "Chú vẫy tay bên dòng sông đang chảy." }] }] };
const calls: Record<string, number> = {};
const prompts: string[] = [];
const logs: string[] = [];
let directorMode: "repair" | "fail" | "salvage" = "repair";
const ai: any = async (prompt: string, artifact: string) => {
  calls[artifact] = (calls[artifact] || 0) + 1;
  if (artifact === V.ARTIFACT_SCENE) {
    const lines = puppetBeatLines(script.beats[0]);
    return { scenes: [{ fromLineId: lines[0].key, toLineId: lines.at(-1)!.key, purpose: "uncle waves by the river", environment: "riverside", nodes: [node] }] };
  }
  if (artifact === C.ARTIFACT) return structuredClone(illustration);
  if (artifact === D.ARTIFACT) {
    prompts.push(prompt);
    // A part that does not exist: the contract must reject it and ask for a repair, never guess.
    if (directorMode === "fail" || calls[artifact] === 1) return { clips: [{ op: "swing", target: "person_leg" }] };
    // Repair answer with one bad clip among valid ones: the valid part is kept and the bad clip is logged.
    if (directorMode === "salvage") return { clips: [{ op: "swing", target: "person_arm", amount: "medium" }, { op: "flow", target: "river" }, { op: "emit", at: "bottom", particle: "dust" }] };
    return {
      temperament: "lively",
      clips: [
        { op: "swing", target: "person_arm", joint: "top", amount: "large", cycle: 0.8 },
        { op: "flow", target: "river", dir: "left", speed: "medium" },
      ],
      bible: [{ subject: "uncle", note: "vẫy tay nhanh, biên độ lớn" }],
    };
  }
  throw new Error(`Unexpected AI call: ${artifact}`);
};
const opts: any = { exec: {}, ai, scope: "clip-director", review: false, renderBehavior: behavior, log: (line: string) => logs.push(line) };
try {
  const generated = await buildRemotionScenes(script, analysis, opts);
  const state = generated.gen!.remotion!;
  const scene = state.scenes.beat[0];
  const composition = scene.composition!;
  const asset = state.assets[composition.assetKey];
  assert.equal(calls[D.ARTIFACT], 2, "Invalid motion is repaired once, not guessed");
  assert.ok(prompts[0].includes('"person_arm"') && prompts[0].includes('"river"'), "Director sees measured part ids");
  assert.ok(!prompts[0].includes("<svg"), "Director prompt is text-only (no SVG)");
  assert.ok(prompts[1].startsWith("TEXT CODING TASK: repair only the rejected motion clips"), "Second request is the motion repair prompt");
  assert.equal(composition.motion?.clips.length, 2);
  assert.equal(state.motionBible?.uncle, "vẫy tay nhanh, biên độ lớn", "Motion bible is stored for later scenes");
  const arm = composition.motion!.rig.parts.find((part) => part.id === "person_arm")!;
  assert.equal(arm.parent, "person");
  // getBBox ignores stroke width: the stroke-only arm measures as a hairline at x=30 in the person's local space.
  assert.ok(Math.abs(arm.box.x + arm.box.width / 2 - 30) < 0.01 && Math.abs(arm.box.y - 20) < 0.01 && arm.box.height === 100, `Arm box stays in the person's local space: ${JSON.stringify(arm.box)}`);
  assert.ok(Math.abs(arm.canvas!.x - 430) < 1 && Math.abs(arm.canvas!.y - 220) < 1, "Canvas box includes the base transform");
  // Rendering: clips replace drawn actor keyframes and code defaults, pivot is local, effects follow the toggle.
  const frame = (t: number, b: typeof behavior = behavior) => compositionFrameSvg(asset, composition, t, b, new Set(), "history", 6);
  const at = frame(0.9);
  assert.match(at, /id="person_arm" transform="rotate\(-?[\d.]+ 30 20\)"/, "Arm rotates around its local shoulder");
  assert.match(at, /id="person" transform="translate\(400 200\)"/, "Drawn whole-body keyframes are not applied when AI clips direct the scene");
  assert.notEqual(frame(0.9), frame(1.3), "Scene moves over time");
  assert.ok(at.includes("motion_flow"), "Flow overlay is rendered");
  assert.ok(!frame(0.9, { ...behavior, sceneEffects: "off" } as never).includes("motion_flow"), "sceneEffects=off removes flow overlays");
  assert.equal(frame(0.9, { ...behavior, actors: "fixed" } as never), asset.svg, "actors=fixed freezes the whole scene");
  assert.ok(!logs.some((line) => line.includes("lắc nhẹ tại chỗ")), "No default sway is added to a directed scene");
  assert.deepEqual(motionSceneSubjectPoint(composition, asset, "person", { x: 420, y: 300 }, 2), { x: 420, y: 300 }, "Camera ignores drawn keyframes that are no longer rendered");
  // Rebuild: no new director request for an unchanged scene.
  const before = calls[D.ARTIFACT];
  await buildRemotionScenes(generated, analysis, opts);
  assert.equal(calls[D.ARTIFACT], before, "Unchanged scenes keep their accepted motion");
  // Exhausted director: the scene is still accepted with its drawn motion, and is not re-asked on rebuild.
  directorMode = "fail";
  const failedScope = { ...opts, scope: "clip-director-fail" };
  const fallback = await buildRemotionScenes(script, analysis, failedScope);
  const failedScene = fallback.gen!.remotion!.scenes.beat[0];
  assert.equal(failedScene.build?.status, "accepted", "Motion failure never fails the drawing");
  assert.equal(failedScene.composition!.motion, undefined);
  assert.ok(logs.some((line) => line.includes("chưa nhận được chuyển động hợp lệ")), "Failure is logged with its reason");
  const failedCalls = calls[D.ARTIFACT];
  await buildRemotionScenes(fallback, analysis, failedScope);
  assert.equal(calls[D.ARTIFACT], failedCalls, "A failed scene is not re-asked on every rebuild");
  // Repair answer partly invalid: keep the valid clips instead of losing all motion.
  directorMode = "salvage";
  const salvaged = await buildRemotionScenes(script, analysis, { ...opts, scope: "clip-director-salvage" });
  const kept = salvaged.gen!.remotion!.scenes.beat[0].composition!.motion;
  assert.equal(kept?.clips.length, 2, "Valid clips of a partly invalid repair answer are kept");
  assert.ok(logs.some((line) => line.includes("bỏ 1 chuyển động AI không hợp lệ")), "Dropped clips are logged");
  // actors=fixed: the director is never called.
  const fixedCalls = calls[D.ARTIFACT];
  await buildRemotionScenes(script, analysis, { ...opts, scope: "clip-director-fixed", renderBehavior: { ...behavior, actors: "fixed" } });
  assert.equal(calls[D.ARTIFACT], fixedCalls, "No director request when scene motion is switched off");
  process.stdout.write("PASS: pipeline motion director — measured local rig, repair on invalid parts, clips replace drawn/default motion, effects/actors toggles, camera isolation, motion bible, idempotent rebuilds, failure keeps the drawing, repair answers keep their valid clips.\n");
} finally {
  if (priorStorage === undefined) delete process.env.VIDIFY_STORAGE_DIR;
  else process.env.VIDIFY_STORAGE_DIR = priorStorage;
  fs.rmSync(root, { recursive: true, force: true });
}

