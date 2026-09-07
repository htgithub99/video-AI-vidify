import { writeVerificationLog } from "./verificationLogger.ts";
import assert from "node:assert/strict";
import fs from "node:fs";
import { evaluateEdit, evaluateSubtitles, evaluateThumbnail } from "../src/services/productionQualityService";
import { isSceneVisualQualityApproved } from "../src/services/sceneVisualQualityService";
import { normalizeStoryboardQuality } from "../src/services/storyboardQualityService";
import { normalizeContentSafety } from "../src/services/contentSafetyService";
import { SceneAssetStatus, SubtitleMode } from "../src/types";

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
assert.equal(thumbnail.passed, true);
assert.ok(thumbnail.warnings.some(warning => warning.includes("below_target")));

const invalidSubtitleReport = evaluateSubtitles([{
  id: "sc_subtitle",
  script: "A long subtitle",
  subtitle: "A long subtitle",
  duration: 1,
  subtitleCues: [{ text: "This subtitle cue contains far too many characters for one second", startOffsetSeconds: 0, durationSeconds: 1 }],
} as any]);
assert.equal(invalidSubtitleReport.passed, true);
assert.ok(invalidSubtitleReport.warnings.includes("subtitle_reading_time_insufficient"));
const disabledSubtitleReport = evaluateSubtitles([], SubtitleMode.None);
assert.equal(disabledSubtitleReport.passed, true);
assert.deepEqual(disabledSubtitleReport.blockingErrors, []);

const repetitiveEditReport = evaluateEdit(Array.from({ length: 8 }, (_, index) => ({
  id: `sc_edit_${index}`,
  cameraMotion: "push_in",
  transition: "cut",
  assetStatus: SceneAssetStatus.Approved,
})) as any[]);
assert.equal(repetitiveEditReport.passed, true);
assert.ok(repetitiveEditReport.warnings.includes("edit_pattern_too_repetitive"));

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
assert.equal(storyboard.passed, true);
assert.ok(storyboard.warnings.includes("storyboard_quality_below_target"));

const autoPipeline = fs.readFileSync("src/hooks/useAutoVideoPipeline.ts", "utf8");
assert.match(autoPipeline, /validateSceneImage/);
assert.doesNotMatch(autoPipeline, /evaluateVisualAssetQuality|validateFinalVideo/);

writeVerificationLog("AI editorial policy and request-budget checks passed.");
