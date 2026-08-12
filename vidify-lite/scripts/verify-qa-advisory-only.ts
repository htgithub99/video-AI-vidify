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

assert.match(pipelineController, /getScriptRepairPrompt/);
assert.match(invalidation, /scriptQa\?\.passed|storyboardQa\?\.passed/);
assert.match(prompts, /surgical production rewrite/i);
assert.match(autoPipeline, /ERR_IMAGE_PROMPT_QUALITY_REJECTED/);
assert.match(autoPipeline, /ERR_FINAL_QUALITY_REJECTED/);

process.stdout.write("QA advisory-only assertions passed.\n");
