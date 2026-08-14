import _ from "lodash";
import {
  DEFAULT_SCENE_CAMERA_MOTION,
  DEFAULT_SCENE_EFFECTS,
  DEFAULT_SCENE_LIGHTING_EFFECT,
  DEFAULT_SCENE_TRANSITION,
  IMAGE_PROMPT_METADATA_CONFIG,
  SecurityConstants,
  SplitStrategy,
  STORYBOARD_FALLBACK_CONFIG,
} from "../constants";
import { smartSplitSentences, splitSentenceSafely } from "../lib/textProcessor";
import { Chapter, ShotPurpose, StoryboardScene, VisualBible } from "../types";
import { assignStoryboardChapterIds } from "../utils/storyboardChapterUtils";
import { compileImagePrompt, compileStoryboardPrompts } from "./imagePromptCompilerService";

export interface StoryboardFallbackOptions {
  rewrittenScript: string;
  chapters?: Chapter[];
  splitStrategy?: SplitStrategy;
  aspectRatio?: string;
  targetStyle?: string;
  visualBible?: VisualBible;
}

const DENSE_SPLIT_STRATEGIES: SplitStrategy[] = [
  SplitStrategy.WORD,
  SplitStrategy.ULTRADENSE,
  SplitStrategy.HYPERDENSE,
  SplitStrategy.SHORT_SENTENCE,
  SplitStrategy.HIGHPACED,
];

const PARAGRAPH_SPLIT_STRATEGIES: SplitStrategy[] = [
  SplitStrategy.PARAGRAPH,
  SplitStrategy.EPIC,
  SplitStrategy.SLOWPACED,
  SplitStrategy.SUPER_SLOW,
];

const createNarrationSegments = (script: string, splitStrategy: SplitStrategy): string[] => {
  const maxWords = _.includes(DENSE_SPLIT_STRATEGIES, splitStrategy)
    ? STORYBOARD_FALLBACK_CONFIG.SHORT_SCENE_MAX_WORDS
    : STORYBOARD_FALLBACK_CONFIG.LONG_SCENE_MAX_WORDS;
  const sentenceFragments = _.flatMap(smartSplitSentences(script), sentence => splitSentenceSafely(sentence, maxWords));
  const sentenceCount = _.includes(DENSE_SPLIT_STRATEGIES, splitStrategy)
    ? SecurityConstants.DEFAULT_AMOUNT
    : _.includes(PARAGRAPH_SPLIT_STRATEGIES, splitStrategy)
      ? STORYBOARD_FALLBACK_CONFIG.PARAGRAPH_SCENE_SENTENCE_COUNT
      : STORYBOARD_FALLBACK_CONFIG.STANDARD_SCENE_SENTENCE_COUNT;
  return _.map(_.chunk(sentenceFragments, sentenceCount), segment => _.join(segment, " "));
};

const normalizeCoverageText = (value: unknown): string => _.join(
  _.words(_.deburr(_.toLower(_.toString(value))), /[\p{L}\p{N}]+/gu),
  " ",
);

export const calculateStoryboardScriptCoverage = (
  script: string,
  scenes: Array<Partial<Pick<StoryboardScene, "script" | "subtitle">>>,
): number => {
  const scriptTokens = _.words(normalizeCoverageText(script), /[^\s]+/g);
  if (_.isEmpty(scriptTokens)) return 1;
  const sceneText = normalizeCoverageText(_.join(_.map(scenes, scene => scene.script || scene.subtitle), " "));
  const sceneTokenCounts = _.countBy(_.words(sceneText, /[^\s]+/g));
  const matchedTokens = _.sumBy(_.toPairs(_.countBy(scriptTokens)), ([token, count]) => (
    _.min([count, _.get(sceneTokenCounts, token, 0)]) || 0
  ));
  return _.divide(matchedTokens, _.size(scriptTokens));
};

const createScriptGroundedScene = (script: string, index: number): StoryboardScene => ({
  id: _.join([STORYBOARD_FALLBACK_CONFIG.SCENE_ID_PREFIX, _.add(index, SecurityConstants.DEFAULT_AMOUNT)], ""),
  chapterId: STORYBOARD_FALLBACK_CONFIG.DEFAULT_CHAPTER_ID,
  startTime: STORYBOARD_FALLBACK_CONFIG.DEFAULT_CHAPTER_ID,
  endTime: STORYBOARD_FALLBACK_CONFIG.DEFAULT_CHAPTER_ID,
  duration: SecurityConstants.ZERO,
  script,
  subtitle: script,
  prompt: STORYBOARD_FALLBACK_CONFIG.DEFAULT_CHAPTER_ID,
  cameraMotion: DEFAULT_SCENE_CAMERA_MOTION,
  effects: DEFAULT_SCENE_EFFECTS,
  lightingEffect: DEFAULT_SCENE_LIGHTING_EFFECT,
  transition: DEFAULT_SCENE_TRANSITION,
  shotPurpose: ShotPurpose.Action,
  visualIntent: _.replace(
    STORYBOARD_FALLBACK_CONFIG.VISUAL_INTENT_TEMPLATE,
    STORYBOARD_FALLBACK_CONFIG.SCRIPT_TOKEN,
    script,
  ),
  visibleAction: script,
  shotSize: STORYBOARD_FALLBACK_CONFIG.SHOT_SIZES[index % STORYBOARD_FALLBACK_CONFIG.SHOT_SIZES.length],
  cameraAngle: STORYBOARD_FALLBACK_CONFIG.CAMERA_ANGLES[index % STORYBOARD_FALLBACK_CONFIG.CAMERA_ANGLES.length],
  composition: STORYBOARD_FALLBACK_CONFIG.COMPOSITIONS[index % STORYBOARD_FALLBACK_CONFIG.COMPOSITIONS.length],
  layout: IMAGE_PROMPT_METADATA_CONFIG.DEFAULT_LAYOUT as StoryboardScene["layout"],
  textAllowed: false,
});

const hydrateScriptGroundedScene = (scene: StoryboardScene, index: number): StoryboardScene => {
  const script = _.trim(scene.script || scene.subtitle);
  const baseline = createScriptGroundedScene(script, index);
  return {
    ...baseline,
    ...scene,
    script,
    subtitle: _.trim(scene.subtitle || script),
    visualIntent: scene.visualIntent || baseline.visualIntent,
    visibleAction: scene.visibleAction || baseline.visibleAction,
    shotSize: scene.shotSize || baseline.shotSize,
    cameraAngle: scene.cameraAngle || baseline.cameraAngle,
    composition: scene.composition || baseline.composition,
    cameraMotion: scene.cameraMotion || baseline.cameraMotion,
    effects: scene.effects || baseline.effects,
    lightingEffect: scene.lightingEffect || baseline.lightingEffect,
    transition: scene.transition || baseline.transition,
  };
};

export const ensureScriptGroundedSceneDetails = (
  scenes: StoryboardScene[],
  options: Omit<StoryboardFallbackOptions, "rewrittenScript" | "chapters" | "splitStrategy"> = {},
): StoryboardScene[] => _.map(scenes, (scene, index) => {
  const hydratedScene = hydrateScriptGroundedScene(scene, index);
  return _.isEmpty(_.trim(scene.prompt))
    ? { ...hydratedScene, prompt: compileImagePrompt(hydratedScene, options) }
    : hydratedScene;
});

export const createScriptGroundedStoryboard = ({
  rewrittenScript,
  chapters = [],
  splitStrategy = SplitStrategy.LONG_SENTENCE,
  aspectRatio,
  targetStyle,
  visualBible,
}: StoryboardFallbackOptions): StoryboardScene[] => {
  const scenes = _.map(
    createNarrationSegments(_.trim(rewrittenScript), splitStrategy),
    createScriptGroundedScene,
  );
  const chapteredScenes = assignStoryboardChapterIds(scenes, chapters);
  return compileStoryboardPrompts(chapteredScenes, {
    aspectRatio,
    targetStyle,
    visualBible,
  });
};

export const ensureStoryboardScriptCoverage = (
  scenes: StoryboardScene[],
  options: StoryboardFallbackOptions,
): StoryboardScene[] => {
  const coverage = calculateStoryboardScriptCoverage(options.rewrittenScript, scenes);
  const fallbackScenes = createScriptGroundedStoryboard(options);
  const sourceSegments = createNarrationSegments(_.trim(options.rewrittenScript), options.splitStrategy || SplitStrategy.LONG_SENTENCE);
  const maximumSceneWords = _.max(_.map(scenes, scene => _.size(_.words(scene.script || scene.subtitle)))) || 0;
  const coverageTooSparse = _.size(scenes) < _.size(sourceSegments)
    || maximumSceneWords > STORYBOARD_FALLBACK_CONFIG.LONG_SCENE_MAX_WORDS;
  return coverage < STORYBOARD_FALLBACK_CONFIG.MIN_COVERAGE_RATIO || coverageTooSparse
    ? fallbackScenes
    : ensureScriptGroundedSceneDetails(scenes, options);
};
