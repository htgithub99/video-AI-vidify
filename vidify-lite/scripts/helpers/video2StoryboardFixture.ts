import _ from "lodash";
import { STORYBOARD_QUALITY_CONFIG } from "../../src/constants/config.ts";
import { formatTimeHelper } from "../../src/lib/timeUtils.ts";
import { smartSplitSentences } from "../../src/lib/textProcessor.ts";
import { StoryboardQualityReport, StoryboardScene } from "../../src/types.ts";

const FIXTURE_MOTIONS = ["Zoom In", "Pan Left", "Push In", "Slow Reveal"] as const;
const FIXTURE_TRANSITIONS = ["Cut", "Cross Dissolve", "Brightness Fade"] as const;
const FIXTURE_CAMERA_ANGLES = ["close-up", "medium shot", "wide shot", "overhead"] as const;
const FIXTURE_SCENE_PREFIX = "fixture_scene_";
const FIXTURE_PROMPT_PREFIX = "Editorial illustration depicting this exact narration beat:";
const PERCENTAGE_BASE = 100;

const calculatePercentage = (matched: number, total: number): number => (
  total > 0 ? _.round(matched / total * PERCENTAGE_BASE) : 0
);

export const createVideo2StoryboardFixture = (
  narration: string,
  durationSeconds: number,
): StoryboardScene[] => {
  const narrationSegments = smartSplitSentences(narration);
  const totalWords = _.sumBy(narrationSegments, segment => _.size(_.words(segment)));
  let currentTime = 0;
  return _.map(narrationSegments, (script, index) => {
    const isLastScene = _.eq(index, _.subtract(_.size(narrationSegments), 1));
    const weightedDuration = _.multiply(_.divide(_.size(_.words(script)), totalWords), durationSeconds);
    const sceneDuration = isLastScene
      ? _.subtract(durationSeconds, currentTime)
      : weightedDuration;
    const startTime = currentTime;
    const endTime = _.add(startTime, sceneDuration);
    currentTime = endTime;
    return {
      id: `${FIXTURE_SCENE_PREFIX}${_.add(index, 1)}`,
      script,
      subtitle: script,
      prompt: `${FIXTURE_PROMPT_PREFIX} ${script}`,
      duration: sceneDuration,
      startTime: formatTimeHelper(startTime),
      endTime: formatTimeHelper(endTime),
      cameraAngle: FIXTURE_CAMERA_ANGLES[index % _.size(FIXTURE_CAMERA_ANGLES)],
      cameraMotion: FIXTURE_MOTIONS[index % _.size(FIXTURE_MOTIONS)],
      transition: FIXTURE_TRANSITIONS[index % _.size(FIXTURE_TRANSITIONS)],
    } as StoryboardScene;
  });
};

export const evaluateVideo2StoryboardFixture = (
  scenes: StoryboardScene[],
): StoryboardQualityReport => {
  const sceneCount = _.size(scenes);
  const completeSceneCount = _.size(_.filter(scenes, scene => _.every([
    !_.isEmpty(scene.script),
    !_.isEmpty(scene.prompt),
    _.gt(scene.duration, 0),
  ], Boolean)));
  const diversityScore = calculatePercentage(
    _.size(_.uniq(_.flatMap(scenes, scene => [scene.cameraAngle, scene.cameraMotion, scene.transition]))),
    _.min([sceneCount, _.size(FIXTURE_CAMERA_ANGLES) + _.size(FIXTURE_MOTIONS) + _.size(FIXTURE_TRANSITIONS)]) || sceneCount,
  );
  const completeScore = calculatePercentage(completeSceneCount, sceneCount);
  const scores = [completeScore, diversityScore, completeScore, completeScore];
  return {
    continuityScore: completeScore,
    shotDiversityScore: diversityScore,
    visibleActionScore: completeScore,
    editabilityScore: completeScore,
    blockingErrors: completeSceneCount === sceneCount ? [] : ["fixture_storyboard_incomplete"],
    warnings: [],
    passed: sceneCount > 0 && _.every(scores, score => score >= STORYBOARD_QUALITY_CONFIG.MIN_SCORE),
  };
};
