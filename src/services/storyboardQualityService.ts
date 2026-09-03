import _ from "lodash";
import { FLEXIBLE_DURATION_CONFIG, SCRIPT_SPEECH_RATE_CONFIG, STORYBOARD_QUALITY_CONFIG } from "../constants/config.js";
import { StoryboardQualityReport } from "../types.js";
import { calculateStoryboardScriptCoverage } from "./storyboardFallbackService.js";

const normalizeScore = (input: unknown): number => _.clamp(_.toNumber(input), 0, 100);

export const normalizeStoryboardQuality = (value: Partial<StoryboardQualityReport>): StoryboardQualityReport => {
  const report: StoryboardQualityReport = {
    continuityScore: normalizeScore(value.continuityScore),
    shotDiversityScore: normalizeScore(value.shotDiversityScore),
    visibleActionScore: normalizeScore(value.visibleActionScore),
    editabilityScore: normalizeScore(value.editabilityScore),
    scriptCoverageScore: value.scriptCoverageScore === undefined ? undefined : normalizeScore(value.scriptCoverageScore),
    pacingCoverageScore: value.pacingCoverageScore === undefined ? undefined : normalizeScore(value.pacingCoverageScore),
    blockingErrors: _.uniq(_.compact(_.castArray(value.blockingErrors))),
    warnings: _.uniq(_.compact(_.castArray(value.warnings))),
    passed: false,
  };
  const scores = [report.continuityScore, report.shotDiversityScore, report.visibleActionScore, report.editabilityScore];
  if (_.some(scores, (score) => score < STORYBOARD_QUALITY_CONFIG.MIN_SCORE)) {
    report.warnings = _.uniq([...report.warnings, STORYBOARD_QUALITY_CONFIG.BELOW_TARGET_WARNING]);
  }
  report.passed = _.isEmpty(report.blockingErrors) && _.every(scores, (score) => score >= STORYBOARD_QUALITY_CONFIG.MIN_SCORE);
  return report;
};

export const applyDeterministicStoryboardCoverage = (
  report: StoryboardQualityReport,
  script: string,
  scenes: Array<{ script?: string; subtitle?: string; duration?: number }>,
  wordsPerMinute: number = SCRIPT_SPEECH_RATE_CONFIG.ENGLISH_WORDS_PER_MINUTE,
): StoryboardQualityReport => {
  const scriptCoverageScore = _.round(calculateStoryboardScriptCoverage(script, scenes) * 100);
  const safeWordsPerMinute = _.gt(wordsPerMinute, 0) ? wordsPerMinute : SCRIPT_SPEECH_RATE_CONFIG.ENGLISH_WORDS_PER_MINUTE;
  const scenePacingScores = _.map(scenes, (scene) => {
    const sceneWordCount = _.size(_.words(scene.script || scene.subtitle));
    const sceneDurationSeconds = _.toFinite(scene.duration);
    if (!_.gt(sceneWordCount, 0) || !_.gt(sceneDurationSeconds, 0)) return 0;
    const maximumWords = (sceneDurationSeconds / 60) * safeWordsPerMinute * FLEXIBLE_DURATION_CONFIG.MAXIMUM_RATIO;
    return _.round(_.clamp((maximumWords / sceneWordCount) * 100, 0, 100));
  });
  const pacingCoverageScore = _.min(scenePacingScores) || 0;
  const warnings = _.uniq(
    _.compact([
      ...report.warnings,
      scriptCoverageScore < STORYBOARD_QUALITY_CONFIG.MIN_SCORE ? STORYBOARD_QUALITY_CONFIG.SCRIPT_COVERAGE_WARNING : "",
      pacingCoverageScore < STORYBOARD_QUALITY_CONFIG.MIN_SCORE ? STORYBOARD_QUALITY_CONFIG.PACING_COVERAGE_WARNING : "",
    ]),
  );
  return {
    ...report,
    scriptCoverageScore,
    pacingCoverageScore,
    warnings,
    passed: report.passed && scriptCoverageScore >= STORYBOARD_QUALITY_CONFIG.MIN_SCORE && pacingCoverageScore >= STORYBOARD_QUALITY_CONFIG.MIN_SCORE,
  };
};
