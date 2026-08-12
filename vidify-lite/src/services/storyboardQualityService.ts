import _ from "lodash";
import { STORYBOARD_QUALITY_CONFIG } from "../constants/config.js";
import { StoryboardQualityReport } from "../types.js";

const normalizeScore = (input: unknown): number => _.clamp(_.toNumber(input), 0, 100);

export const normalizeStoryboardQuality = (
  value: Partial<StoryboardQualityReport>,
): StoryboardQualityReport => {
  const report: StoryboardQualityReport = {
    continuityScore: normalizeScore(value.continuityScore),
    shotDiversityScore: normalizeScore(value.shotDiversityScore),
    visibleActionScore: normalizeScore(value.visibleActionScore),
    editabilityScore: normalizeScore(value.editabilityScore),
    blockingErrors: _.uniq(_.compact(_.castArray(value.blockingErrors))),
    warnings: _.uniq(_.compact(_.castArray(value.warnings))),
    passed: false,
  };
  const scores = [
    report.continuityScore,
    report.shotDiversityScore,
    report.visibleActionScore,
    report.editabilityScore,
  ];
  if (_.some(scores, score => score < STORYBOARD_QUALITY_CONFIG.MIN_SCORE)) {
    report.warnings = _.uniq([
      ...report.warnings,
      STORYBOARD_QUALITY_CONFIG.BELOW_TARGET_WARNING,
    ]);
  }
  report.passed = _.isEmpty(report.blockingErrors)
    && _.every(scores, score => score >= STORYBOARD_QUALITY_CONFIG.MIN_SCORE);
  return report;
};
