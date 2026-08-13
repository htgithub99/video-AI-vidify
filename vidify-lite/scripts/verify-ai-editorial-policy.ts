import { writeVerificationLog } from "./verificationLogger.ts";
import assert from "node:assert/strict";
import { evaluateEdit, evaluateSubtitles, evaluateThumbnail } from "../src/services/productionQualityService";
import { selectScenesForVisionQa } from "../src/services/qualityProfileService";
import { isSceneVisualQualityApproved } from "../src/services/sceneVisualQualityService";
import { normalizeStoryboardQuality } from "../src/services/storyboardQualityService";
import { normalizeContentSafety } from "../src/services/contentSafetyService";
import { QualityMode, SceneAssetStatus } from "../src/types";

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
};

assert.equal(isSceneVisualQualityApproved(lowScoreAiDecision), false, "Low-quality image passed the professional quality gate");
const thumbnail = evaluateThumbnail(lowScoreAiDecision);
assert.equal(thumbnail.passed, false);
assert.ok(thumbnail.warnings.some(warning => warning.includes("below_target")));

const invalidSubtitleReport = evaluateSubtitles([{
  id: "sc_subtitle",
  script: "A long subtitle",
  subtitle: "A long subtitle",
  duration: 1,
  subtitleCues: [{ text: "This subtitle cue contains far too many characters for one second", startOffsetSeconds: 0, durationSeconds: 1 }],
} as any]);
assert.equal(invalidSubtitleReport.passed, false);
assert.ok(invalidSubtitleReport.blockingErrors.includes("subtitle_reading_time_insufficient"));

const repetitiveEditReport = evaluateEdit(Array.from({ length: 8 }, (_, index) => ({
  id: `sc_edit_${index}`,
  cameraMotion: "push_in",
  transition: "cut",
  assetStatus: SceneAssetStatus.Approved,
})) as any[]);
assert.equal(repetitiveEditReport.passed, false);
assert.ok(repetitiveEditReport.blockingErrors.includes("edit_pattern_too_repetitive"));

assert.equal(normalizeContentSafety({}).allowed, true);
assert.ok(normalizeContentSafety({}).warnings.includes("content_safety_response_incomplete"));
assert.equal(normalizeContentSafety({
  sensitiveTopic: false,
  trueCase: false,
  minorsInvolved: false,
  sexualExploitationRisk: false,
  victimExploitationRisk: false,
  privacyRisk: false,
  likenessRisk: false,
  copyrightRisk: false,
  requiredDisclosures: [],
  blockingErrors: [],
  warnings: [],
}).allowed, true);

const storyboard = normalizeStoryboardQuality({
  continuityScore: 55,
  shotDiversityScore: 50,
  visibleActionScore: 60,
  editabilityScore: 58,
  blockingErrors: [],
  warnings: [],
});
assert.equal(storyboard.passed, false);
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
