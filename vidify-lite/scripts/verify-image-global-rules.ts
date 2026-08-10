import assert from "node:assert/strict";
import { GLOBAL_IMAGE_PROMPT_MASTER_RULE, IMAGE_PROMPT_FINAL_SECTION_ORDER, createGlobalImagePromptPlanningRules } from "../src/constants/imagePromptRules.ts";
import { getOptimizePromptsBatchPrompt } from "../src/constants/prompts.ts";
import { writeVerificationLog } from "./verificationLogger.ts";
import { createBatchContinuityContext, createPromptCharacterCards, normalizeAiImagePromptPlan } from "../src/server/services/imagePromptPlanningService.ts";

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
assert.match(plannerPrompt, /application will append only one aspect-ratio suffix/i);
assert.match(plannerPrompt, /one concise, natural English paragraph/i);
assert.doesNotMatch(plannerPrompt, /45-90 words|complete canonical character blueprint/i);

const compactCards = createPromptCharacterCards([{ id: "char_1", name: "Player", prompt: "blue bean torso", ethnicitySkinTone: "unused", images: ["unused"] }]);
assert.deepEqual(compactCards, [{ id: "char_1", name: "Player", prompt: "blue bean torso" }]);
assert.deepEqual(createBatchContinuityContext([{ id: "a" }, { id: "b" }, { id: "c" }], 1, 1), { previousScene: { id: "a" }, nextScene: { id: "c" } });
assert.deepEqual(normalizeAiImagePromptPlan({ prompt: "  scene prompt  ", characterIds: ["char_1", "invalid"], expectedSubjectCount: 2, layout: "invalid", textAllowed: true }, new Set(["char_1"]), "auto"), { prompt: "scene prompt", characterIds: ["char_1"], expectedSubjectCount: 2, allowBackgroundPeople: false, layout: "single_frame", textAllowed: true });

writeVerificationLog("Global image-prompt rule assertions passed");
