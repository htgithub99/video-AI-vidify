import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { PIPELINE_COMPLETION_CONFIG } from "../src/constants/config.ts";
import { getFinalCompletionReadiness, getRenderReadiness } from "../src/services/pipelineCompletionPolicyService.ts";

const pipelineController = fs.readFileSync(
  path.resolve("src/server/controllers/pipelineController.ts"),
  "utf8",
);
const autoPipeline = fs.readFileSync(
  path.resolve("src/hooks/useAutoVideoPipeline.ts"),
  "utf8",
);
const invalidation = fs.readFileSync(
  path.resolve("src/hooks/autoVideoPipelineUtils.ts"),
  "utf8",
);
assert.doesNotMatch(pipelineController, /getScriptRepairPrompt|getStoryboardRepairPrompt/);
assert.doesNotMatch(pipelineController, /getScriptEditorQaPrompt|getStoryboardDirectorQaPrompt/);
assert.doesNotMatch(invalidation, /scriptQa\?\.passed|storyboardQa\?\.passed/);
assert.doesNotMatch(autoPipeline, /evaluateVisualAssetQuality|validateFinalVideo|repairSubtitleCues|repairEditingPlan/);

const completeProject = {
  storyboard: [{ id: "scene_1", assetUrl: "real-scene-asset" }],
  voiceConfig: { audioBase64: "real-voice-audio" },
  renderedVideoUrl: "real-rendered-video",
  contentSafety: { allowed: true },
  finalMultimodalQa: { passed: false, reviewAvailable: false },
} as any;
assert.equal(getRenderReadiness(completeProject).ready, true);
assert.equal(getFinalCompletionReadiness(completeProject).ready, true);
assert.deepEqual(getRenderReadiness({ ...completeProject, voiceConfig: {} }).blockers, [PIPELINE_COMPLETION_CONFIG.NARRATION_MISSING]);
assert.deepEqual(getRenderReadiness({ ...completeProject, storyboard: [{ id: "scene_1" }] }).blockers, [PIPELINE_COMPLETION_CONFIG.SCENE_ASSETS_MISSING]);
assert.deepEqual(getFinalCompletionReadiness({ ...completeProject, renderedVideoUrl: undefined }).blockers, [PIPELINE_COMPLETION_CONFIG.FINAL_RENDER_MISSING]);

process.stdout.write("QA advisory-only assertions passed.\n");
