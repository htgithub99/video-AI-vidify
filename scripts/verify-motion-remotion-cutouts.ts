import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { MOTION_VISUAL as V } from "../src/constants/motionVisual.js";
import { MOTION_REMOTION_PROMPTS as P } from "../src/constants/motionRemotionPrompts.js";
import { normalizeMotionVector } from "../src/lib/motionVectorAsset.js";
import { motionVectorCutoutIssue } from "../src/lib/motionVectorCutout.js";
import { remotionSceneReadiness, validateRemotionSpec } from "../src/lib/motionRemotion.js";
import { createVectorCutoutInspector, checkRemotionCutoutLayers } from "../src/server/services/remotion/vectorCutoutInspector.js";
const svg = (content: string, attrs = "") => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" ${attrs}>${content}</svg>`;
const isolated = svg('<path d="M35 10H65L80 90H20Z" fill="#fff"/>');
const background = svg('<rect width="100" height="100" fill="#eee"/>');
const gradient = svg('<defs><linearGradient id="paper"><stop stop-color="#fff"/><stop offset="1" stop-color="#e8ddc7"/></linearGradient></defs><rect width="100" height="100" fill="url(#paper)"/>');
const normalize = (source: string) => normalizeMotionVector(source, "fixture", "fixture", "fixture");
const inspector = createVectorCutoutInspector();
try {
  assert.equal(motionVectorCutoutIssue(background), V.CUTOUT.BACKDROP);
  assert.equal(motionVectorCutoutIssue(isolated), undefined);
  assert.equal(await inspector.check(normalize(isolated)), undefined);
  assert.equal(await inspector.check(normalize(svg('<ellipse cx="50" cy="60" rx="35" ry="20" fill="white"/>'))), undefined);
  assert.equal(await inspector.check(normalize(gradient)), V.CUTOUT.BACKDROP);
  assert.equal(await inspector.check(normalize(svg('<path d="M0 0H100V100H0Z" fill="white"/>'))), V.CUTOUT.BACKDROP);
  assert.equal(await inspector.check(normalize(svg('<rect width="100" height="100" fill="none"/>'))), V.CUTOUT.EMPTY);
  for (const source of [
    svg('<rect width="100" height="100" fill="white"/>', 'opacity="0.5"'),
    svg('<rect width="100" height="100" fill="white" display="none"/>' + '<circle cx="50" cy="50" r="20"/>'),
    svg('<defs><rect width="100" height="100" fill="white"/></defs><circle cx="50" cy="50" r="20"/>'),
    svg('<defs><clipPath id="small"><circle cx="50" cy="50" r="20"/></clipPath></defs><rect width="100" height="100" fill="white" clip-path="url(#small)"/>'),
    svg('<rect width="100" height="100"/>', 'fill="none"').replace('<rect width="100" height="100"/>', '<rect width="100" height="100"/><circle cx="50" cy="50" r="20" fill="white"/>'),
  ]) {
    assert.equal(motionVectorCutoutIssue(source), undefined);
    assert.equal(await inspector.check(normalize(source)), undefined);
  }
  const originals = JSON.parse(fs.readFileSync("scripts/fixtures/motion-remotion-opaque-props-20261027.json", "utf8"));
  assert.equal(originals.length, 2);
  for (const original of originals) assert.equal(await inspector.check(original), V.CUTOUT.BACKDROP);
} finally {
  await inspector.close();
}
for (const profile of Object.values(V.PROFILES)) {
  const prompt = P.ASSET({ kind: "prop", profile: profile.direction });
  assert.ok(prompt.includes("outer canvas MUST stay transparent") && prompt.includes("Preserve white"));
}
const root = fs.mkdtempSync(path.join(os.tmpdir(), "motion-cutouts-"));
const prior = process.env.VIDIFY_STORAGE_DIR;
process.env.VIDIFY_STORAGE_DIR = root;
try {
  const { buildRemotionScenes } = await import("../src/server/services/remotion/scenePipeline.js");
  const settings: any = { version: 1, mode: "remotion", engine: "remotion", profileId: "history", componentRevision: 1 };
  const analysis: any = { visualSettings: settings, era: "folk", cast: [{ key: "ghost", name: "Bóng áo trắng", look: "white robe" }], places: [{ key: "house", name: "House" }] };
  const script: any = { title: "Cutout regression", language: "vi", visualSettings: settings, beats: [{ id: "b1", place: "house", narration: "Bóng áo trắng đứng cạnh lư hương." }] };
  let rejected = false;
  let calls = 0;
  let sceneCalls = 0;
  const logs: string[] = [];
  const ai: any = async (prompt: string, artifact: string) => {
    calls++;
    const context = JSON.parse(prompt.split("Context:\n")[1].split("\n")[0]);
    if (artifact === V.ARTIFACT_SCENE) {
      sceneCalls++;
      return {
        scenes: [
          {
            fromLineId: context.lines[0].id,
            toLineId: context.lines[0].id,
            purpose: "Ghost by incense burner",
            environment: "House at night",
            nodes: [
              { id: "ghost", kind: "character", entityId: "ghost", description: "white robe", slot: "left" },
              { id: "burner", kind: "prop", description: "incense burner", slot: "right" },
            ],
          },
        ],
      };
    }
    assert.equal(artifact, V.ARTIFACT_ASSET);
    assert.ok(["background", "character", "prop"].includes(context.kind));
    if (context.kind === "prop" && !rejected) {
      rejected = true;
      return { svg: gradient, anchors: { base: { x: 0.5, y: 0.9 } } };
    }
    return { svg: context.kind === "background" ? background : isolated, anchors: { base: { x: 0.5, y: 0.9 } } };
  };
  const options: any = {
    exec: {},
    ai,
    review: false,
    log: (line: string) => logs.push(line),
    partial: (value: any) => {
      for (const asset of Object.values(value.gen.remotion.assets) as any[]) assert.notEqual(asset.svg, gradient);
    },
  };
  const built = await buildRemotionScenes(script, analysis, options);
  assert.ok(rejected && logs.some((line) => line.includes(V.CUTOUT.BACKDROP)));
  const state = built.gen!.remotion!;
  const scene = state.scenes.b1[0];
  const preview = remotionSceneReadiness(scene, state).preview!;
  validateRemotionSpec(preview);
  await checkRemotionCutoutLayers(preview);
  const propKey = scene.nodes.find((node) => node.kind === "prop")!.assetKey!;
  const original = JSON.parse(fs.readFileSync("scripts/fixtures/motion-remotion-opaque-props-20261027.json", "utf8"))[0];
  const cached = structuredClone(built);
  cached.gen!.remotion!.assets[propKey] = { ...state.assets[propKey], svg: original.svg, width: original.width, height: original.height };
  cached.gen!.remotion!.scenes.b1[0].reviewKey = "obsolete-review";
  assert.ok(remotionSceneReadiness(cached.gen!.remotion!.scenes.b1[0], cached.gen!.remotion).error?.includes(V.CUTOUT.BACKDROP));
  const badSpec = structuredClone(preview);
  badSpec.assets[propKey] = cached.gen!.remotion!.assets[propKey];
  assert.throws(() => validateRemotionSpec(badSpec), /nền phủ kín/);
  badSpec.assets[propKey] = { ...state.assets[propKey], svg: gradient };
  await assert.rejects(checkRemotionCutoutLayers(badSpec), /nền phủ kín/);
  const before = calls;
  const repaired = await buildRemotionScenes(cached, analysis, options);
  assert.equal(calls - before, 1);
  const fixed = repaired.gen!.remotion!;
  assert.equal(fixed.invalidAssets![propKey].asset.svg, original.svg);
  assert.equal(fixed.scenes.b1[0].reviewKey, undefined);
  assert.equal(fixed.assets[propKey].svg, isolated);
  for (const [key, asset] of Object.entries(state.assets)) if (key !== propKey) assert.deepEqual(fixed.assets[key], asset);
  const last = calls;
  await buildRemotionScenes(repaired, analysis, options);
  assert.equal(calls, last);
  const horrorSettings = { ...settings, profileId: "horror" };
  const horrorAnalysis = { ...analysis, visualSettings: horrorSettings };
  const horrorScript = { ...script, visualSettings: horrorSettings };
  const horrorBuilt = await buildRemotionScenes(horrorScript, horrorAnalysis, options);
  const legacyHorror = structuredClone(horrorBuilt);
  delete legacyHorror.gen!.remotion!.profileRevision;
  legacyHorror.gen!.remotion!.scenes.b1[0].reviewKey = "old-style-review";
  const priorPlan = structuredClone(legacyHorror.gen!.remotion!.scenes.b1);
  const priorAssets = structuredClone(legacyHorror.gen!.remotion!.assets);
  const styleBefore = calls;
  const plansBefore = sceneCalls;
  const restyled = await buildRemotionScenes(legacyHorror, horrorAnalysis, options);
  assert.equal(restyled.gen!.remotion!.profileRevision, V.PROFILES.horror.revision);
  assert.equal(sceneCalls, plansBefore);
  assert.equal(calls - styleBefore, Object.keys(priorAssets).length);
  assert.equal(restyled.beats, legacyHorror.beats);
  assert.deepEqual(
    restyled.gen!.remotion!.scenes.b1.map(({ reviewKey, ...scene }) => ({ ...scene, reviewKey: undefined })),
    priorPlan.map(({ reviewKey, ...scene }) => ({ ...scene, reviewKey: undefined })),
  );
  for (const [key, asset] of Object.entries(priorAssets)) assert.deepEqual(restyled.gen!.remotion!.invalidAssets![key], { asset, reason: V.STYLE_REFRESH_REASON });
  assert.ok(logs.some((line) => line.includes("Cập nhật nét vẽ Truyện ma")));
  const afterStyle = calls;
  await buildRemotionScenes(restyled, horrorAnalysis, options);
  assert.equal(calls, afterStyle);
  const legacyHistory = structuredClone(repaired);
  delete legacyHistory.gen!.remotion!.profileRevision;
  await buildRemotionScenes(legacyHistory, analysis, options);
  assert.equal(calls, afterStyle);
  console.log("Cutout QA passed: real opaque props, gradients, paths, transparent white subjects, background bypass, rejected candidate isolation, one-layer cache repair, retained originals, renderer preflight and reuse. No live AI/TTS/video.");
} finally {
  if (prior === undefined) delete process.env.VIDIFY_STORAGE_DIR;
  else process.env.VIDIFY_STORAGE_DIR = prior;
  assert.equal(path.dirname(path.resolve(root)), path.resolve(os.tmpdir()));
  assert.ok(path.basename(root).startsWith("motion-cutouts-"));
  fs.rmSync(root, { recursive: true, force: true });
}
