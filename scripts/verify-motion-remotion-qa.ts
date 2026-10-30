import assert from "node:assert/strict";
import fs from "node:fs";
import { MOTION_AI_RECOVERY as R } from "../src/constants/motionAiRecovery.js";
import { MOTION_VISUAL as V } from "../src/constants/motionVisual.js";
import { normalizeMotionVector, parseRemotionAssetReply } from "../src/lib/motionVectorAsset.js";
import { canReuseRemotionCharacter } from "./legacy-motion-remotion/characterReuse.js";
import { mergeRemotionSceneDraft } from "../src/features/motion/server/services/remotion/sceneContract.js";
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
assert.equal(normalizeMotionVector(valid.replace("/>", "/>>"), "extra-delimiter", "extra-delimiter", "").svg, valid.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"'));
assert.throws(() => normalizeMotionVector(valid.replace("</svg>", ">bad</svg>"), "invalid-text", "invalid-text", ""));
assert.equal(normalizeMotionVector(valid.replace("/>", "/"), "missing-delimiter", "missing-delimiter", "").svg, normalizeMotionVector(valid, "valid", "valid", "").svg);
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
const mutual = {
  ...plan,
  nodes: [
    { ...character, relation: "beside", target: "brother" },
    { ...character, id: "brother", entityId: "brother", relation: "behind", target: "sister" },
  ],
};
const recoveredMutual = mergeRemotionSceneDraft({ scenes: [] }, [mutual], lines, new Set(["sister", "brother"]));
assert.deepEqual(recoveredMutual.errors, []);
assert.equal(recoveredMutual.accepted[0].nodes.filter((node: any) => node.target).length, 1);
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
console.log("Remotion response QA: complete and partial JSON, escaped SVG, XML safety, optional pose/evidence, semantic repair and source coverage passed. Whole-scene recovery is verified in verify-motion-composition.ts.");
