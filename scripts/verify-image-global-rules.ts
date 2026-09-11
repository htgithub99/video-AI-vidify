import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { GLOBAL_IMAGE_PROMPT_MASTER_RULE, IMAGE_PROMPT_FINAL_SECTION_ORDER, createGlobalImagePromptPlanningRules } from "../src/constants/imagePromptRules.ts";
import { getQuickVideoPlanningPrompt } from "../src/constants/prompts.ts";
import { prepareProjectMediaPrompt } from "../src/services/projectImageGenerationService.ts";
import { GenerateType } from "../src/types.ts";
import { writeVerificationLog } from "./verificationLogger.ts";
import { createBatchContinuityContext, createPromptCharacterCards } from "../src/server/services/imagePromptPlanningService.ts";
import { hasSourceGenderConflict } from "../src/services/visualContinuityService.ts";

assert.equal(Object.keys(GLOBAL_IMAGE_PROMPT_MASTER_RULE).length, 8);
assert.deepEqual(IMAGE_PROMPT_FINAL_SECTION_ORDER, ["STORY INTENT", "VISIBLE ACTION", "IDENTITY ANCHORS", "SETTING", "VISUAL STYLE", "USEFUL CONSTRAINTS"]);

const globalRules = createGlobalImagePromptPlanningRules();
assert.match(globalRules, /few strong style-compatible anchors/i);
assert.match(globalRules, /instead of filling a rigid template/i);

const plannerPrompt = getQuickVideoPlanningPrompt(
  "flat 2D cartoon",
  "bold black outlines and flat colors",
  JSON.stringify([{ id: "sc_1", script: "A bowl covers four pieces", prompt: "" }]),
  "16:9",
  JSON.stringify([{ id: "char_1", name: "Player" }]),
);
assert.match(plannerPrompt, /QUICK VIDEO production/i);
assert.match(plannerPrompt, /one coherent, descriptive English paragraph/i);
assert.match(plannerPrompt, /Set generationPrompt to an empty string/i);
assert.match(plannerPrompt, /script and subtitle are the exact voice\/narration content assigned to that scene/i);
assert.match(plannerPrompt, /Visual Bible:/i);
assert.match(plannerPrompt, /Adjacent-scene continuity:/i);
assert.match(plannerPrompt, /same compact immutable identity anchors/i);
assert.match(plannerPrompt, /Describe the scene instead of listing disconnected keywords/i);
assert.doesNotMatch(plannerPrompt, /3-5 chronological shots|cinematicBeats must agree/i);

const correctionPrompt = getQuickVideoPlanningPrompt(
  "flat 2D cartoon",
  "bold black outlines and flat colors",
  JSON.stringify([{ id: "sc_1", script: "A bowl covers four pieces", prompt: "" }]),
  "16:9",
  undefined,
  false,
  undefined,
  undefined,
  undefined,
  "auto",
  "auto",
  "default",
  "No reference image will be attached.",
  "",
  "",
  "",
  "",
  JSON.stringify(["sc_1:visibleAction:no_observable_physical_verb"]),
);
assert.match(correctionPrompt, /\[CORRECTION\]/i);
assert.match(correctionPrompt, /Return every source scene again as a complete object/i);
assert.match(correctionPrompt, /sc_1:visibleAction:no_observable_physical_verb/i);

const quickVideoPrompt = getQuickVideoPlanningPrompt(
  "cinematic realism",
  "",
  JSON.stringify([{ id: "sc_video", script: "A courier shuts the steel door before the pursuer reaches it." }]),
  "16:9",
  undefined,
  false,
  undefined,
  undefined,
  undefined,
  "auto",
  "auto",
  "default",
  "No reference image will be attached.",
  "",
  "",
  "",
  "",
  "",
  "action",
  GenerateType.Video,
);
assert.match(quickVideoPrompt, /one complete English video generationPrompt/i);
assert.match(quickVideoPrompt, /sent unchanged/i);
assert.match(quickVideoPrompt, /animate the same visual beat as the planned image and assigned voice segment/i);
assert.doesNotMatch(quickVideoPrompt, /cinematicBeats must agree|3-5 explicitly numbered timed shots/i);

const aiAuthoredVideoPrompt = "One continuous clip: the courier slams the steel door, the latch catches, and the pursuer collides with it.";
assert.equal(prepareProjectMediaPrompt({ sceneId: "sc_video", prompt: aiAuthoredVideoPrompt, generateType: GenerateType.Video }), aiAuthoredVideoPrompt);
const controllerSource = readFileSync(new URL("../src/server/controllers/pipelineController.ts", import.meta.url), "utf8");
const pipelineSource = readFileSync(new URL("../src/hooks/useAutoVideoPipeline.ts", import.meta.url), "utf8");
assert.match(controllerSource, /if \(isCinematicPlanning\)[\s\S]*getCinematicVideoPlanningPrompt[\s\S]*getQuickVideoPlanningPrompt/);
assert.match(controllerSource, /quickVideoPromptRequired \? \["generationPrompt"\] : \[\]/);
assert.match(pipelineSource, /prompt: prepareProjectMediaPrompt\(\{ sceneId: scene\.id, prompt: _\.toString\(scene\.generationPrompt\), generateType: GenerateType\.Video \}\)/);

const compactCards = createPromptCharacterCards([
  {
    id: "char_1",
    name: "Player",
    prompt: "blue bean torso",
    ethnicitySkinTone: "warm brown skin",
    faceShape: "oval face",
    eyes: "wide dark eyes",
    nose: "small straight nose",
    hair: "short black hair",
    silhouette: "compact silhouette",
    signatureClothing: "blue jacket",
    colorPalette: "blue and charcoal",
    accessories: "silver wristwatch",
    images: ["unused"],
  },
]);
assert.equal(compactCards[0].id, "char_1");
assert.equal(compactCards[0].name, "Player");
assert.match(String(compactCards[0].identityLock), /warm brown skin.*oval face.*wide dark eyes.*small straight nose.*short black hair.*blue jacket.*silver wristwatch/i);
assert.equal(compactCards[0].usesSharedStyleCore, true);
assert.deepEqual(createBatchContinuityContext([{ id: "a" }, { id: "b" }, { id: "c" }], 1, 1), { previousScene: { id: "a" }, nextScene: { id: "c" } });
assert.equal(hasSourceGenderConflict("Tại sao thật tệ khi là Gái Ngành?", [{ genderPresentation: "male" }] as any), true);
assert.equal(hasSourceGenderConflict("A story about a young woman", [{ genderPresentation: "female" }] as any), false);

writeVerificationLog("Global image-prompt rule assertions passed");
