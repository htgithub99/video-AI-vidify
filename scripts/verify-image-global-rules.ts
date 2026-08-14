import assert from "node:assert/strict";
import { GLOBAL_IMAGE_PROMPT_MASTER_RULE, IMAGE_PROMPT_FINAL_SECTION_ORDER, createGlobalImagePromptPlanningRules } from "../src/constants/imagePromptRules.ts";
import { getOptimizePromptsBatchPrompt } from "../src/constants/prompts.ts";
import { writeVerificationLog } from "./verificationLogger.ts";
import { createBatchContinuityContext, createPromptCharacterCards } from "../src/server/services/imagePromptPlanningService.ts";

assert.equal(Object.keys(GLOBAL_IMAGE_PROMPT_MASTER_RULE).length, 8);
assert.deepEqual(IMAGE_PROMPT_FINAL_SECTION_ORDER, [
  "STORY INTENT",
  "VISIBLE ACTION",
  "IDENTITY ANCHORS",
  "SETTING",
  "VISUAL STYLE",
  "USEFUL CONSTRAINTS",
]);

const globalRules = createGlobalImagePromptPlanningRules();
assert.match(globalRules, /few strong style-compatible anchors/i);
assert.match(globalRules, /instead of filling a rigid template/i);

const plannerPrompt = getOptimizePromptsBatchPrompt(
  "flat 2D cartoon",
  "bold black outlines and flat colors",
  JSON.stringify([{ id: "sc_1", script: "A bowl covers four pieces", prompt: "" }]),
  "16:9",
  JSON.stringify([{ id: "char_1", name: "Player" }]),
);
assert.match(plannerPrompt, /PROJECT STYLE LOCK/i);
assert.match(plannerPrompt, /subject.*context.*style|style lock.*subject.*action.*setting/is);
assert.match(plannerPrompt, /Every visible person.*exactly the same character type/i);
assert.match(plannerPrompt, /Keep prompts concise and below 120 English words/i);
assert.match(plannerPrompt, /complete concise Gemini prompt without --ar/i);
assert.doesNotMatch(plannerPrompt, /Action Contract|complete canonical character blueprint/i);

const compactCards = createPromptCharacterCards([{ id: "char_1", name: "Player", prompt: "blue bean torso", ethnicitySkinTone: "unused", images: ["unused"] }]);
assert.deepEqual(compactCards, [{ id: "char_1", name: "Player", identityLock: "", usesSharedStyleCore: true }]);
assert.deepEqual(createBatchContinuityContext([{ id: "a" }, { id: "b" }, { id: "c" }], 1, 1), { previousScene: { id: "a" }, nextScene: { id: "c" } });

writeVerificationLog("Global image-prompt rule assertions passed");
