import { writeVerificationLog } from "./verificationLogger.ts";
import assert from "node:assert/strict";
import { evaluateThumbnail } from "../src/services/productionQualityService";
import { selectScenesForVisionQa } from "../src/services/qualityProfileService";
import { isSceneVisualQualityApproved } from "../src/services/sceneVisualQualityService";
import { normalizeStoryboardQuality } from "../src/services/storyboardQualityService";
import { QualityMode } from "../src/types";

const lowScoreAiDecision = {
  anatomy: 45,
  subjectCount: 50,
  promptAlignment: 55,
  characterConsistency: 48,
  composition: 52,
  styleConsistency: 51,
  editability: 49,
  usableForVideo: true,
  blockingErrors: [],
  warnings: ["composition could be stronger"],
  correctivePrompt: "Improve focal separation.",
};

assert.equal(isSceneVisualQualityApproved(lowScoreAiDecision), true, "AI usable decision must not be overridden by a rigid score threshold");
const thumbnail = evaluateThumbnail(lowScoreAiDecision);
assert.equal(thumbnail.passed, true);
assert.ok(thumbnail.warnings.some(warning => warning.includes("below_target")));

const storyboard = normalizeStoryboardQuality({
  continuityScore: 55,
  shotDiversityScore: 50,
  visibleActionScore: 60,
  editabilityScore: 58,
  blockingErrors: [],
  warnings: [],
});
assert.equal(storyboard.passed, true);
assert.ok(storyboard.warnings.includes("storyboard_quality_below_target"));

const scenes = Array.from({ length: 24 }, (_, index) => ({
  id: `sc_${index + 1}`,
  script: index % 3 === 0 ? "A character reacts" : "An empty landscape changes",
  prompt: index % 3 === 0 ? "medium shot of a character" : "wide landscape",
})) as any[];
const balancedSelection = selectScenesForVisionQa(scenes, QualityMode.Balanced);
assert.ok(balancedSelection.length < scenes.length, "Balanced QA must sample by risk instead of charging for every scene");
assert.equal(selectScenesForVisionQa(scenes, QualityMode.Premium).length, scenes.length);

writeVerificationLog("AI editorial policy and request-budget checks passed.");
