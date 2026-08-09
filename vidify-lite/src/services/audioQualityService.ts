import _ from "lodash";
import { API_ROUTES, REFACTOR_CONSTANTS } from "../constants";
import { safeSystemFetch } from "../lib/shared-utils";
import { AudioQualityReport } from "../types";
import { evaluateAudioTiming } from "./productionQualityService";

const TARGET_AUDIO_SCORE = 80;
export const validateAudioQuality = async (audioBase64: string, script: string, actualDurationSeconds: number, targetDurationSeconds: number): Promise<AudioQualityReport> => {
  const timing = evaluateAudioTiming(actualDurationSeconds, targetDurationSeconds);
  const response = await safeSystemFetch(API_ROUTES.PIPELINE_VALIDATE_AUDIO, { audioBase64, script, targetDurationSeconds });
  if (!response.success || !response.data?.success) return { ...timing, blockingErrors: timing.blockingErrors, warnings: _.uniq([...timing.warnings, REFACTOR_CONSTANTS.UNKNOWN_WARNING, "audio_perceptual_qa_unavailable"]), passed: actualDurationSeconds > 0 };
  const score = (key: string) => _.clamp(_.toNumber(_.get(response.data.quality, key)), 0, 100);
  const report = { ...timing, pronunciationScore: score("pronunciationScore"), pauseScore: score("pauseScore"), loudnessScore: score("loudnessScore"), naturalnessScore: score("naturalnessScore"), emotionTransitionScore: score("emotionTransitionScore"), blockingErrors: _.uniq([...timing.blockingErrors, ..._.compact(_.castArray(_.get(response.data.quality, "blockingErrors", [])))]), warnings: _.uniq(_.compact(_.castArray(_.get(response.data.quality, "warnings", [])))), passed: false };
  const perceptualScores = [report.pronunciationScore, report.pauseScore, report.loudnessScore, report.naturalnessScore, report.emotionTransitionScore];
  if (_.some(perceptualScores, value => value < TARGET_AUDIO_SCORE)) report.warnings = _.uniq([...report.warnings, "audio_quality_below_target"]);
  report.passed = actualDurationSeconds > 0 && _.isEmpty(report.blockingErrors);
  return report;
};
