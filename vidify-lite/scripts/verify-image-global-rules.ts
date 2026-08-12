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
assert.match(plannerPrompt, /flexible checklist, not a mandatory template/i);
assert.match(plannerPrompt, /Privately decide what the viewer should understand/i);
assert.match(plannerPrompt, /few strong anchors/i);
assert.match(plannerPrompt, /Do not force realistic skin, nose, eye, anatomy/i);
assert.match(plannerPrompt, /deterministically compiles that data/i);
assert.match(plannerPrompt, /semantic shot data only/i);
assert.doesNotMatch(plannerPrompt, /45-90 words|complete canonical character blueprint/i);

const compactCards = createPromptCharacterCards([{ id: "char_1", name: "Player", prompt: "blue bean torso", ethnicitySkinTone: "unused", images: ["unused"] }]);
assert.deepEqual(compactCards, [{ id: "char_1", name: "Player", prompt: "blue bean torso" }]);
assert.deepEqual(createBatchContinuityContext([{ id: "a" }, { id: "b" }, { id: "c" }], 1, 1), { previousScene: { id: "a" }, nextScene: { id: "c" } });

writeVerificationLog("Global image-prompt rule assertions passed");
