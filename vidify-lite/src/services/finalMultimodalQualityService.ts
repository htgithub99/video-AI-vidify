import _ from "lodash";
import { API_ROUTES, FINAL_MULTIMODAL_QA_CONFIG, REFACTOR_CONSTANTS } from "../constants";
import { safeSystemFetch } from "../lib/shared-utils";
import { FinalMultimodalQualityReport } from "../types";

const createUnavailableReport = (error?: string): FinalMultimodalQualityReport => ({
  visualScore: 0,
  cropScore: 0,
  continuityScore: 0,
  pacingScore: 0,
  transitionVarietyScore: 0,
  promiseAlignmentScore: 0,
  audioMixScore: 0,
  subtitleLegibilityScore: 0,
  blockingErrors: [FINAL_MULTIMODAL_QA_CONFIG.UNAVAILABLE_ERROR],
  warnings: [
    error || REFACTOR_CONSTANTS.UNKNOWN_WARNING,
    FINAL_MULTIMODAL_QA_CONFIG.UNAVAILABLE_WARNING,
  ],
  passed: false,
  reviewAvailable: false,
});

export const validateFinalVideo = async (
  videoUrl: string,
  script: string,
  viewerPromise: string,
): Promise<FinalMultimodalQualityReport> => {
  const response = await safeSystemFetch(
    API_ROUTES.PIPELINE_VALIDATE_FINAL_VIDEO,
    { videoUrl, script, viewerPromise },
  );
  if (!response.success || !response.data?.success) return createUnavailableReport(response.error);
  const quality = response.data.quality;
  const scores = _.map(
    FINAL_MULTIMODAL_QA_CONFIG.SCORE_FIELDS,
    field => _.clamp(_.toNumber(_.get(quality, field)), 0, 100),
  );
  const [
    visualScore,
    cropScore,
    continuityScore,
    pacingScore,
    transitionVarietyScore,
    promiseAlignmentScore,
    audioMixScore,
    subtitleLegibilityScore,
  ] = scores;
  const report: FinalMultimodalQualityReport = {
    visualScore,
    cropScore,
    continuityScore,
    pacingScore,
    transitionVarietyScore,
    promiseAlignmentScore,
    audioMixScore,
    subtitleLegibilityScore,
    blockingErrors: _.uniq(_.compact(_.castArray(quality.blockingErrors))),
    warnings: _.uniq(_.compact(_.castArray(quality.warnings))),
    passed: false,
    reviewAvailable: true,
  };
  if (_.some(scores, score => score < FINAL_MULTIMODAL_QA_CONFIG.TARGET_SCORE)) {
    report.warnings = _.uniq([
      ...report.warnings,
      FINAL_MULTIMODAL_QA_CONFIG.BELOW_TARGET_WARNING,
    ]);
  }
  report.passed = _.isEmpty(report.blockingErrors)
    && _.every(scores, score => score >= FINAL_MULTIMODAL_QA_CONFIG.TARGET_SCORE);
  return report;
};
