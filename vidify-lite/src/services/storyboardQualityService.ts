import _ from "lodash";
import { STORYBOARD_QUALITY_CONFIG } from "../constants/config.js";
import { StoryboardQualityReport } from "../types.js";

const normalizeScore = (input: unknown): number => _.clamp(_.toNumber(input), 0, 100);

const calculatePercentage = (matched: number, total: number): number => (
  total > 0 ? _.round(matched / total * 100) : 0
);

const calculateDiversityScore = (scenes: any[]): number => {
  const sampleSize = _.min([_.size(scenes), STORYBOARD_QUALITY_CONFIG.DIVERSITY_SAMPLE_SIZE]) || 1;
  const values = _.flatMap(
    STORYBOARD_QUALITY_CONFIG.DIVERSITY_FIELDS,
    key => _.uniq(_.compact(_.map(scenes, key))),
  );
  return normalizeScore(calculatePercentage(_.size(_.uniq(values)), sampleSize));
};

const hasCompleteSceneContent = (scene: any): boolean => _.every([
  !_.isEmpty(_.trim(_.toString(scene?.script || scene?.scriptSegment))),
  !_.isEmpty(_.trim(_.toString(scene?.prompt || scene?.imagePrompt))),
], Boolean);

const isEditableScene = (scene: any): boolean => _.every([
  _.toNumber(scene?.duration) >= STORYBOARD_QUALITY_CONFIG.MIN_SCENE_DURATION_SECONDS,
  _.some([scene?.cameraMotion, scene?.transition], value => !_.isEmpty(value)),
], Boolean);

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
  report.passed = _.isEmpty(report.blockingErrors);
  return report;
};

export const evaluateFallbackStoryboardQuality = (scenes: any[]): StoryboardQualityReport => {
  const sceneCount = _.size(scenes);
  const completeScenes = _.filter(scenes, hasCompleteSceneContent);
  const editableScenes = _.filter(completeScenes, isEditableScene);
  const completeSceneCount = _.size(completeScenes);
  const blockingErrors = _.compact([
    sceneCount === 0 && STORYBOARD_QUALITY_CONFIG.EMPTY_STORYBOARD_ERROR,
    sceneCount > 0
      && completeSceneCount < sceneCount
      && STORYBOARD_QUALITY_CONFIG.INCOMPLETE_SCENE_ERROR,
  ]) as string[];
  return normalizeStoryboardQuality({
    continuityScore: calculatePercentage(completeSceneCount, sceneCount),
    shotDiversityScore: calculateDiversityScore(scenes),
    visibleActionScore: calculatePercentage(completeSceneCount, sceneCount),
    editabilityScore: calculatePercentage(_.size(editableScenes), sceneCount),
    blockingErrors,
    warnings: [STORYBOARD_QUALITY_CONFIG.FALLBACK_WARNING],
  });
};
