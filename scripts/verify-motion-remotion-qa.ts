import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { MOTION_AI_RECOVERY as R } from "../src/constants/motionAiRecovery.js";
import { MOTION_PRODUCTION as P } from "../src/constants/motionProduction.js";
import { MOTION_VISUAL as V } from "../src/constants/motionVisual.js";
import { normalizeMotionVector, parseRemotionAssetReply } from "../src/lib/motionVectorAsset.js";
import { canReuseRemotionCharacter, remotionScenePreview, validateRemotionSpec } from "../src/lib/motionRemotion.js";
import { mergeRemotionSceneDraft } from "../src/server/services/remotion/sceneContract.js";
import { puppetBeatLines } from "../src/lib/motionPuppet.js";
import { remotionSceneProgress } from "../src/lib/motionRemotionProgress.js";
const valid = '<svg viewBox="0 0 100 200"><rect x="10" y="10" width="80" height="180"/></svg>';
const reply = { artifactType: V.ARTIFACT_ASSET, requestId: "current-request", svg: valid, anchors: { base: { x: 0.5, y: 0.98 } } };
assert.deepEqual(parseRemotionAssetReply(JSON.stringify(reply) + ',"anchors":{"base":{"x":0.5,"y":0.98}}}```'), reply);
assert.equal(parseRemotionAssetReply('{"svg":"unterminated'), undefined);
assert.equal(parseRemotionAssetReply('{"other":1}'), undefined);
const realReply = parseRemotionAssetReply(fs.readFileSync("scripts/fixtures/motion-remotion-svg-response-20261027.txt", "utf8")) as any;
assert.equal(realReply.requestId, "motion_remotion_asset-e2cdee3a");
normalizeMotionVector(realReply.svg, "real-reply", "real-reply", "rice bowl");
for (const sample of JSON.parse(fs.readFileSync("scripts/fixtures/motion-remotion-unclosed-svg-20261027.json", "utf8"))) assert.throws(() => normalizeMotionVector(sample.svg, "unclosed", "unclosed", sample.kind), /Thiếu thẻ đóng:.*svg/);
assert.deepEqual(parseRemotionAssetReply(JSON.stringify(reply).replaceAll("<", "\\u003c")), reply);
assert.ok(R.VECTOR_INSTRUCTION.includes("\\u003c"));
for (const svg of [valid, '```svg\n<?xml version="1.0"?><!-- description -->' + valid + "\n```", valid.replace('viewBox="0 0 100 200"', 'width="100px" height="200"'), valid.replace("0 0 100 200", "-10 -20 100 200")]) assert.equal(normalizeMotionVector(svg, "a", "a", "").width, 100);
for (const svg of [valid.replace("<rect", "<script/><rect"), valid.replace("<rect", '<image href="https://example.com"/><rect'), valid.replace("<rect", '<rect onload="x"/><rect'), valid.replace("<rect", "<foreignObject/><rect"), "<!DOCTYPE svg>" + valid, valid.replace("0 0 100 200", "0 0 0 200")]) assert.throws(() => normalizeMotionVector(svg, "a", "a", ""));
assert.ok(R.VECTOR_ARTIFACT.test(V.ARTIFACT_ASSET));
assert.ok(!R.VECTOR_ARTIFACT.test(V.ARTIFACT_SCENE));
const lines = [{ key: "l1", text: "Chị Hai đứng trước bàn thờ." }];
const character: any = { id: "sister", kind: "character", entityId: "sister", description: "A tired woman", pose: "standing quietly facing the altar with weary eyes", slot: "left", evidence: "Chị hai đứng trước bàn thờ" };
assert.ok(canReuseRemotionCharacter(character, "A middle aged woman"));
assert.ok(!canReuseRemotionCharacter({ ...character, appearanceChanged: true }, "A woman"));
assert.ok(!canReuseRemotionCharacter({ ...character, poseEssential: true }, "A woman"));
assert.ok(!canReuseRemotionCharacter({ ...character, description: "white robe" }, "brown robe"));
assert.ok(!canReuseRemotionCharacter({ ...character, pose: "lying on bed" }, "A woman"));
const plan: any = { fromLineId: "l1", toLineId: "l1", purpose: "Sister by altar", environment: "Wooden house", nodes: [character] };
assert.deepEqual(mergeRemotionSceneDraft({ scenes: [plan] }, [], lines, new Set(["sister"])).errors, []);
const noEvidence = structuredClone(plan);
delete noEvidence.nodes[0].evidence;
delete noEvidence.nodes[0].pose;
noEvidence.nodes[0].relation = null;
assert.deepEqual(mergeRemotionSceneDraft({ scenes: [noEvidence] }, [], lines, new Set(["sister"])).errors, []);
const simplified = mergeRemotionSceneDraft(
  {
    scenes: [
      {
        ...plan,
        nodes: [
          { ...character, essential: false, pose: "seated", relation: "on", target: "bench" },
          { id: "bench", kind: "prop", description: "bench", slot: "right" },
        ],
      },
    ],
  },
  [],
  lines,
  new Set(["sister"]),
);
assert.deepEqual(simplified.errors, []);
assert.equal(simplified.accepted[0].nodes[0].pose, "standing");
assert.equal(simplified.accepted[0].nodes[0].relation, "beside");
const rejected = mergeRemotionSceneDraft({ scenes: [{ ...plan, nodes: [character, { ...character, id: "wrong", entityId: "unknown" }] }] }, [], lines, new Set(["sister"]));
assert.ok(rejected.errors.some((error) => error.includes("wrong") && error.includes("entityId")));
const repaired = mergeRemotionSceneDraft({ scenes: [{ fromLineId: "l1", nodes: [{ id: "wrong", entityId: "sister" }] }] }, rejected.drafts, lines, new Set(["sister"]));
assert.deepEqual(repaired.errors, []);
assert.equal(repaired.value.scenes[0].nodes.length, 2);
const duplicate = mergeRemotionSceneDraft({ scenes: [{ ...plan, nodes: [character, character] }] }, [], lines, new Set(["sister"]));
assert.ok(duplicate.errors.length);
assert.ok(mergeRemotionSceneDraft({ scenes: [{ ...plan, nodes: undefined }] }, [], lines, new Set(["sister"])).errors.length);
assert.ok(mergeRemotionSceneDraft({ scenes: [{ ...plan, nodes: [null] }] }, [], lines, new Set(["sister"])).errors.length);
assert.ok(mergeRemotionSceneDraft({ scenes: [{ ...plan, nodes: [{ ...character, relation: "beside", target: "missing" }] }] }, [], lines, new Set(["sister"])).errors.length);
const root = fs.mkdtempSync(path.join(os.tmpdir(), "motion-remotion-qa-"));
const prior = process.env.VIDIFY_STORAGE_DIR;
process.env.VIDIFY_STORAGE_DIR = root;
try {
  const { buildRemotionScenes } = await import("../src/server/services/remotion/scenePipeline.js");
  const { recoverMotionAiContractState } = await import("../src/server/services/motionAiContractService.js");
  const recovered = recoverMotionAiContractState({ rejected: 6, errors: ["previous error"] }, V.RECOVERY_REVISION);
  assert.equal(recovered.rejected, 0);
  assert.equal(recoverMotionAiContractState({ ...recovered, rejected: 6 }, V.RECOVERY_REVISION).rejected, 6);
  const settings: any = { version: 1, mode: "remotion", engine: "remotion", profileId: "horror", componentRevision: 1 };
  const analysis: any = { visualSettings: settings, era: "folk", cast: [{ key: "sister", name: "Chị Hai", look: "A middle aged woman" }], places: [{ key: "house", name: "House" }] };
  const script: any = { title: "Offline QA", language: "vi", visualSettings: settings, beats: [0, 1, 2, 3, 4].map((n) => ({ id: `b${n}`, place: "house", narration: "Chị Hai đứng trước bàn thờ." })) };
  let latest: any;
  let assetCalls = 0,
    anchorRepairs = 0,
    variants = 0;
  const completed = new Set<string>();
  const ai: any = async (prompt: string, artifact: string) => {
    if (artifact === V.ARTIFACT_SCENE) {
      const context = JSON.parse(prompt.split("Context:\n")[1].split("\n")[0]);
      if (context.beat.id === "b0") throw Object.assign(new Error("bad plan"), { [P.CONTRACT_EXHAUSTED]: true });
      completed.add(context.beat.id);
      const source = puppetBeatLines(script.beats.find((beat: any) => beat.id === context.beat.id));
      return { scenes: [{ ...plan, fromLineId: source[0].key, toLineId: source.at(-1)!.key, nodes: [character, { id: "vase", kind: "prop", description: "vase", pose: "resting", slot: "right", relation: "heldBy", target: "sister" }] }] };
    }
    if (prompt.startsWith("The SVG code below is accepted")) {
      anchorRepairs++;
      return { anchors: { grip: { x: "0.7", y: "0.5" } } };
    }
    assert.equal(artifact, V.ARTIFACT_ASSET);
    assetCalls++;
    const context = JSON.parse(prompt.split("Context:\n")[1]);
    if (context.identity) variants++;
    return { svg: valid, anchors: { base: { x: 0.5, y: 0.98 } } };
  };
  await assert.rejects(
    buildRemotionScenes(script, analysis, {
      exec: {},
      log: () => {},
      review: false,
      ai,
      scope: "qa",
      partial: (value) => {
        latest = value;
      },
    }),
    /bad plan/,
  );
  assert.equal(completed.size, 4);
  assert.equal(variants, 0);
  assert.equal(anchorRepairs, 2);
  assert.ok(assetCalls > 0);
  assert.ok(latest.gen.remotion.failures.b0);
  assert.ok(!latest.gen.remotion.failures.b4);
  const state = latest.gen.remotion;
  const expanded = { ...latest, beats: [script.beats[1], script.beats[2], ...Array.from({ length: 15 }, (_, i) => ({ ...script.beats[0], id: `future-${i}` }))] };
  const progress = remotionSceneProgress(expanded, false);
  assert.equal(progress.ready, 2);
  assert.equal(progress.total, 17);
  assert.equal(progress.entries[2].status, "stopped");
  assert.equal(remotionSceneProgress(expanded, true).entries[2].status, "waiting");
  assert.ok(!remotionSceneProgress(latest, false).entries.some((entry) => entry.status === "waiting"));
  const scene = state.scenes.b4[0];
  assert.ok(scene.nodes[0].assetKey.startsWith("character:sister:"));
  const preview = remotionScenePreview(scene, state);
  assert.ok(preview);
  validateRemotionSpec(preview);
  assert.equal(preview!.scenes.length, 1);
  const incomplete = structuredClone(scene);
  delete incomplete.nodes[0].assetKey;
  assert.equal(remotionScenePreview(incomplete, state), undefined);
  const before = assetCalls;
  const resumed = await buildRemotionScenes(latest, analysis, { exec: {}, log: () => {}, review: false, ai, scope: "qa", onlyBeats: ["b1", "b2", "b3", "b4"] }).catch(() => latest);
  assert.equal(assetCalls, before);
  assert.ok(resumed.gen.remotion.scenes.b4.length);
  let regionsRepairs = 0,
    regionArtCalls = 0;
  const regionsScript: any = { ...script, beats: [script.beats[1]], gen: undefined };
  const regionAi: any = async (prompt: string, artifact: string) => {
    if (artifact === V.ARTIFACT_SCENE) {
      const source = puppetBeatLines(regionsScript.beats[0]);
      return { scenes: [{ ...plan, fromLineId: source[0].key, toLineId: source.at(-1)!.key, nodes: [{ id: "door", kind: "prop", description: "wooden door", slot: "left", mount: "doorway", role: "fixture", essential: true }] }] };
    }
    if (prompt.startsWith("The SVG code below is accepted")) {
      regionsRepairs++;
      return { regions: { doorway: { x: 0.1, y: 0.1, width: 0.2, height: 0.7 } } };
    }
    regionArtCalls++;
    return { svg: valid, anchors: { base: { x: 0.5, y: 0.98 } } };
  };
  const withRegions = await buildRemotionScenes(regionsScript, analysis, { exec: {}, log: () => {}, review: false, ai: regionAi, scope: "qa-regions" });
  assert.equal(regionsRepairs, 1);
  assert.equal(regionArtCalls, 2);
  const variantScript: any = { ...script, beats: [script.beats[1], script.beats[2]], gen: undefined };
  const drawnStates: string[] = [];
  const stateAi: any = async (prompt: string, artifact: string) => {
    const context = JSON.parse(prompt.split("Context:\n")[1].split("\n")[0]);
    if (artifact === V.ARTIFACT_SCENE) {
      const source = puppetBeatLines(variantScript.beats.find((b: any) => b.id === context.beat.id));
      return { scenes: [{ ...plan, fromLineId: source[0].key, toLineId: source.at(-1)!.key, nodes: [{ id: "pot", objectId: "same-pot", kind: "prop", description: "clay pot", slot: "center", state: context.beat.id === "b1" ? "full" : "empty", stateEvidence: context.beat.id === "b2" ? "ate the rice" : undefined }] }] };
    }
    if (context.kind === "prop") drawnStates.push(context.state);
    return { svg: valid, anchors: { base: { x: 0.5, y: 0.98 } } };
  };
  const variantsByState = await buildRemotionScenes(variantScript, analysis, { exec: {}, log: () => {}, review: false, ai: stateAi, scope: "qa-states" });
  assert.deepEqual(drawnStates.sort(), ["empty", "full"]);
  assert.notEqual(variantsByState.gen!.remotion!.scenes.b1[0].nodes[0].assetKey, variantsByState.gen!.remotion!.scenes.b2[0].nodes[0].assetKey);
  await buildRemotionScenes(variantsByState, analysis, { exec: {}, log: () => {}, review: false, ai: stateAi, scope: "qa-states" });
  assert.equal(drawnStates.length, 2);
  await buildRemotionScenes(withRegions, analysis, { exec: {}, log: () => {}, review: false, ai: regionAi, scope: "qa-regions", renderBehavior: { version: 1, actors: "simple", sceneEffects: "off", camera: "fixed" } });
  assert.equal(regionsRepairs, 1);
  assert.equal(regionArtCalls, 2);
  const actualJob = path.resolve("storage/output/motion-video/story-jobs/cacf62c0-254e-4722-97a9-3b4c0175aa38.json");
  if (fs.existsSync(actualJob)) {
    const real = JSON.parse(fs.readFileSync(actualJob, "utf8")).job.result.gen.remotion;
    assert.equal(Object.values(real.assets).length, 6);
    for (const asset of Object.values(real.assets) as any[]) normalizeMotionVector(asset.svg, asset.key, asset.inputKey, asset.description);
    const realScene = real.scenes.c1_event_a18b7b739f0c[0];
    validateRemotionSpec(remotionScenePreview(realScene, real));
  }
  console.log("Relaxed Remotion QA verified: formatted SVG, safe rejection, optional evidence/pose, node-only repair, independent failed scene, anchor-only repair, character reuse, checkpoint reuse and partial previews. No live AI/TTS/video.");
} finally {
  if (prior === undefined) delete process.env.VIDIFY_STORAGE_DIR;
  else process.env.VIDIFY_STORAGE_DIR = prior;
  const resolved = path.resolve(root);
  assert.equal(path.dirname(resolved), path.resolve(os.tmpdir()));
  assert.ok(path.basename(resolved).startsWith("motion-remotion-qa-"));
  fs.rmSync(resolved, { recursive: true, force: true });
}
