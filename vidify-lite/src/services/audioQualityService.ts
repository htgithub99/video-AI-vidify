import _ from "lodash";
import { API_ROUTES, AUDIO_QUALITY_CONFIG, REFACTOR_CONSTANTS } from "../constants";
import { safeSystemFetch } from "../lib/shared-utils";
import { AudioQualityReport } from "../types";
import { evaluateAudioTiming } from "./productionQualityService";

export const validateAudioQuality = async (
  audioBase64: string,
  script: string,
  actualDurationSeconds: number,
  targetDurationSeconds: number,
  bypassCache = false,
): Promise<AudioQualityReport> => {
  const timing = evaluateAudioTiming(actualDurationSeconds, targetDurationSeconds);
  const response = await safeSystemFetch(API_ROUTES.PIPELINE_VALIDATE_AUDIO, {
    audioBase64,
    script,
    targetDurationSeconds,
    bypassCache,
  });
  if (!response.success || !response.data?.success) {
    return {
      ...timing,
      blockingErrors: timing.blockingErrors,
      warnings: _.uniq([...timing.warnings, AUDIO_QUALITY_CONFIG.QA_UNAVAILABLE_ERROR, REFACTOR_CONSTANTS.UNKNOWN_WARNING]),
      passed: false,
    };
  }
  const score = (key: string) => _.clamp(_.toNumber(_.get(response.data.quality, key)), 0, 100);
  const report = {
    ...timing,
    pronunciationScore: score("pronunciationScore"),
    pauseScore: score("pauseScore"),
    loudnessScore: score("loudnessScore"),
    naturalnessScore: score("naturalnessScore"),
    emotionTransitionScore: score("emotionTransitionScore"),
    blockingErrors: _.uniq([
      ...timing.blockingErrors,
      ..._.compact(_.castArray(_.get(response.data.quality, "blockingErrors", []))),
    ]),
    warnings: _.uniq([...timing.warnings, ..._.compact(_.castArray(_.get(response.data.quality, "warnings", [])))]),
    passed: false,
  };
  const perceptualScores = [
    report.pronunciationScore,
    report.pauseScore,
    report.loudnessScore,
    report.naturalnessScore,
    report.emotionTransitionScore,
  ];
  if (_.some(perceptualScores, value => value < AUDIO_QUALITY_CONFIG.MIN_SCORE)) {
    report.warnings = _.uniq([...report.warnings, AUDIO_QUALITY_CONFIG.BELOW_TARGET_WARNING]);
  }
  report.passed = actualDurationSeconds > 0
    && _.isEmpty(report.blockingErrors)
    && _.every(perceptualScores, value => value >= AUDIO_QUALITY_CONFIG.MIN_SCORE)
    && report.durationFit;
  return report;
};
