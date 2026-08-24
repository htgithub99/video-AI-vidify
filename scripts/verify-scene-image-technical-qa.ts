import assert from "node:assert/strict";
import fs from "node:fs";
import { createTechnicalQaRegenerationPrompt, getSceneVisualRegenerationReasons, SCENE_VISUAL_QUALITY_CONFIG, shouldRegenerateSceneImage } from "../src/services/sceneVisualQualityService.ts";

const healthy = {
  anatomy: 96, subjectCount: 95, promptAlignment: 92, narrativeAlignment: 93,
  environmentRelevance: 90, characterConsistency: 91, composition: 90,
  styleConsistency: 94, editability: 90, unwantedText: false,
  multiPanelLayout: false, duplicatedSubjects: false, usableForVideo: true,
  blockingErrors: [], warnings: [],
};
assert.equal(shouldRegenerateSceneImage(healthy), false);
assert.equal(shouldRegenerateSceneImage({ ...healthy, anatomy: 45, blockingErrors: ["extra_arm_and_fused_hand"] }), true);
assert.equal(shouldRegenerateSceneImage({ ...healthy, duplicatedSubjects: true }), true);
assert.equal(shouldRegenerateSceneImage({ ...healthy, subjectCount: 50 }), true);
assert.equal(shouldRegenerateSceneImage({ ...healthy, unwantedText: true }, false), true);
assert.equal(shouldRegenerateSceneImage({ ...healthy, unwantedText: true }, true), false);
assert.equal(shouldRegenerateSceneImage({ ...healthy, usableForVideo: false, blockingErrors: ["anachronistic_modern_flag"] }), true);
assert.ok(getSceneVisualRegenerationReasons({ ...healthy, multiPanelLayout: true }).includes("unwanted_multi_panel_layout"));
assert.equal(SCENE_VISUAL_QUALITY_CONFIG.MAX_REGENERATION_ATTEMPTS, 2);
const correctedPrompt = createTechnicalQaRegenerationPrompt("cinematic scene --ar 16:9", ["invalid_anatomy_or_extra_limbs"]);
assert.match(correctedPrompt, /correcting only these detected technical defects/i);
assert.ok(correctedPrompt.endsWith("--ar 16:9"));

const pipeline = fs.readFileSync("src/hooks/useAutoVideoPipeline.ts", "utf8");
assert.match(pipeline, /regenerationAttempt <= SCENE_VISUAL_QUALITY_CONFIG\.MAX_REGENERATION_ATTEMPTS/);
assert.match(pipeline, /regenerationAttempt >= SCENE_VISUAL_QUALITY_CONFIG\.MAX_REGENERATION_ATTEMPTS/);
assert.match(pipeline, /!_\.isEqual\(scene\.assetStrategy, "archival"\)/);
assert.match(pipeline, /scene\.assetType !== GenerateType\.Video/);
assert.match(pipeline, /bypassCache: true/);
assert.match(pipeline, /adjacentAssetUrls/);
console.log("Scene image technical QA assertions passed.");
