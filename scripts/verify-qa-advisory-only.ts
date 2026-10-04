import { resolveSourceTextConstants } from "./sourceTextAssertions";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { CINEMATIC_CONFIG, PIPELINE_COMPLETION_CONFIG } from "../src/constants/config.ts";
import { getFinalCompletionReadiness, getRenderReadiness } from "../src/services/pipelineCompletionPolicyService.ts";

const pipelineController = resolveSourceTextConstants(fs.readFileSync(
  path.resolve("src/server/controllers/pipelineController.ts"),
  "utf8",
));
const autoPipeline = resolveSourceTextConstants(fs.readFileSync(
  path.resolve("src/hooks/useAutoVideoPipeline.ts"),
  "utf8",
));
const invalidation = resolveSourceTextConstants(fs.readFileSync(
  path.resolve("src/hooks/autoVideoPipelineUtils.ts"),
  "utf8",
));
assert.doesNotMatch(pipelineController, /getScriptRepairPrompt|getStoryboardRepairPrompt/);
assert.doesNotMatch(pipelineController, /getScriptEditorQaPrompt|getStoryboardDirectorQaPrompt/);
assert.doesNotMatch(invalidation, /scriptQa\?\.passed|storyboardQa\?\.passed/);
assert.doesNotMatch(autoPipeline, /throw new Error\(REFACTOR_CONSTANTS\.ERR_SCRIPT_QUALITY_REJECTED\)/);
assert.doesNotMatch(autoPipeline, /cachedScriptQaRejected/);
assert.match(autoPipeline, /WARN_SCRIPT_QA_CONTINUED/);
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
assert.deepEqual(
  getRenderReadiness({ ...completeProject, voiceConfig: { provider: CINEMATIC_CONFIG.PIPELINE_PROFILE.VOICE_PROVIDER } }).blockers,
  [],
);
assert.deepEqual(getRenderReadiness({ ...completeProject, storyboard: [{ id: "scene_1" }] }).blockers, [PIPELINE_COMPLETION_CONFIG.SCENE_ASSETS_MISSING]);
assert.deepEqual(getFinalCompletionReadiness({ ...completeProject, renderedVideoUrl: undefined }).blockers, [PIPELINE_COMPLETION_CONFIG.FINAL_RENDER_MISSING]);

process.stdout.write("QA advisory-only assertions passed.\n");
