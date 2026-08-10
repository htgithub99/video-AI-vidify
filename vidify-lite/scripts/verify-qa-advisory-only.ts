import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

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
const prompts = fs.readFileSync(path.resolve("src/constants/prompts.ts"), "utf8");

assert.doesNotMatch(pipelineController, /getScriptCorrectivePrompt|repairRound|repairedMap/);
assert.doesNotMatch(autoPipeline, /correctivePrompt|SceneAssetStatus\.Retrying/);
assert.doesNotMatch(invalidation, /scriptQa\?\.passed|storyboardQa\?\.passed/);
assert.doesNotMatch(prompts, /correctivePrompt|senior script editor\. Correct/);
assert.match(autoPipeline, /WARN_VISUAL_QA_RESULT/);
assert.match(autoPipeline, /WARN_FINAL_QA_RESULT/);

process.stdout.write("QA advisory-only assertions passed.\n");
