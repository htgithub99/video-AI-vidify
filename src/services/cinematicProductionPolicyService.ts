import {
  SOURCE_TEMPLATE_ASSET_MISSING,
  SOURCE_TEMPLATE_DIALOGUE_COVERAGE_BELOW_TARGET,
  SOURCE_TEMPLATE_DIALOGUE_NOT_DETECTED,
  SOURCE_TEMPLATE_MISSING,
  SOURCE_TEMPLATE_VIDEO_MISSING,
  SOURCE_TEXT_CHAPTERS_MISSING,
  SOURCE_TEXT_CHAPTERS_NO_USABLE_SCRIPT_SEGMENT,
  SOURCE_TEXT_CONTENTSAFETY_BLOCKED,
  SOURCE_TEXT_OFF_SCREEN_DIALOGUE,
  SOURCE_TEXT_ON_SCREEN_DIALOGUE,
  SOURCE_TEXT_SCRIPT_MISSING,
  SOURCE_TEXT_STORYBOARD_MISSING_2,
  SOURCE_TEXT_STORYBOARD_SCENE_SCRIPT_MISSING_2,
} from "../constants/sourceText";
import _ from "lodash";
import { stringifyJson } from "../lib/jsonStringify.js";
import { CINEMATIC_POLICY_CONFIG, CINEMATIC_POLICY_REQUIRED_FIELDS, CINEMATIC_PRODUCTION_BLOCKER_PATTERNS, CINEMATIC_CHECKPOINT_CONFIG } from "../constants/cinematicConstants";
import { VideoGenre } from "../constants/enums";
import { Chapter, ContentSafetyReport, GenerateType, ImageGenerationMode, ImageGeneratorEngine, ScriptQualityReport, StoryboardQualityReport, StoryboardScene, ProjectLanguage, VisualConfig } from "../types";
import { hasSceneAsset } from "./projectImageGenerationService";
export const CINEMATIC_PRODUCTION_POLICY = {
  PLANNING_CHUNK_SIZE: CINEMATIC_POLICY_CONFIG.PLANNING_CHUNK_SIZE,
  PLANNING_CHUNK_MAX_INPUT_CHARACTERS: CINEMATIC_POLICY_CONFIG.PLANNING_CHUNK_MAX_INPUT_CHARACTERS,
  REQUIRED_TEXT_FIELDS: CINEMATIC_POLICY_REQUIRED_FIELDS,
} as const;
export const createCinematicPlanningBatches = <T>(items: T[]): T[][] => {
  const batches: T[][] = [];
  let currentBatch: T[] = [];
  let currentInputCharacters: number = CINEMATIC_POLICY_CONFIG.PLANNING_CHUNK_JSON_CONTAINER_CHARACTERS;
  _.forEach(items, (item) => {
    const itemInputCharacters = _.size(stringifyJson(item));
    const separatorCharacters = _.isEmpty(currentBatch) ? 0 : CINEMATIC_POLICY_CONFIG.PLANNING_CHUNK_JSON_SEPARATOR_CHARACTERS;
    const exceedsSceneLimit = _.gte(currentBatch.length, CINEMATIC_POLICY_CONFIG.PLANNING_CHUNK_SIZE);
    const exceedsInputLimit = !_.isEmpty(currentBatch) && _.gt(_.sum([currentInputCharacters, separatorCharacters, itemInputCharacters]), CINEMATIC_POLICY_CONFIG.PLANNING_CHUNK_MAX_INPUT_CHARACTERS);
    if (exceedsSceneLimit || exceedsInputLimit) {
      batches.push(currentBatch);
      currentBatch = [];
      currentInputCharacters = CINEMATIC_POLICY_CONFIG.PLANNING_CHUNK_JSON_CONTAINER_CHARACTERS;
    }
    currentInputCharacters = _.sum([currentInputCharacters, _.isEmpty(currentBatch) ? 0 : CINEMATIC_POLICY_CONFIG.PLANNING_CHUNK_JSON_SEPARATOR_CHARACTERS, itemInputCharacters]);
    currentBatch.push(item);
  });
  if (!_.isEmpty(currentBatch)) batches.push(currentBatch);
  return batches;
};
export const isCinematicEpisodeGenre = (genre?: string): boolean => _.isEqual(_.trim(genre), VideoGenre.CINEMATIC_EPISODE);
export const applyCinematicProductionPolicy = (source: VisualConfig, genre?: string, sceneCount: number = 0): VisualConfig => {
  if (!isCinematicEpisodeGenre(genre)) return source;
  const selectedEngineCannotGenerateVideo = _.isEqual(source.imageGeneratorEngine, ImageGeneratorEngine.Imagen);
  return {
    ...source,
    generationMode: ImageGenerationMode.LabsFlow,
    generateType: GenerateType.Video,
    maxVideoScenes: Math.max(sceneCount, _.defaultTo(source.maxVideoScenes, 0)),
    imageGeneratorEngine: selectedEngineCannotGenerateVideo ? ImageGeneratorEngine.Veo3 : source.imageGeneratorEngine,
  };
};
export const getCinematicSceneContractIssues = (scene: StoryboardScene, _requestedDuration?: string | number, _language?: ProjectLanguage): string[] => {
  const issues: string[] = [];
  _.forEach(CINEMATIC_PRODUCTION_POLICY.REQUIRED_TEXT_FIELDS, (field) => {
    if (_.isEmpty(_.trim(_.toString(scene[field])))) issues.push(SOURCE_TEMPLATE_MISSING(`${scene.id}`, `${field}`));
  });
  return issues;
};
export const getCinematicStoryboardContractIssues = (scenes: StoryboardScene[], requestedDuration?: string | number, language?: ProjectLanguage): string[] => _.uniq(_.flatMap(scenes, (scene) => getCinematicSceneContractIssues(scene, requestedDuration, language)));
export const getBlockingCinematicStoryboardContractIssues = (scenes: StoryboardScene[], requestedDuration?: string | number, language?: ProjectLanguage): string[] => getBlockingCinematicPlanningIssues(getCinematicStoryboardContractIssues(scenes, requestedDuration, language));
export const getBlockingCinematicPlanningIssues = (issues: string[]): string[] => _.filter(issues, (issue) => _.some(CINEMATIC_PRODUCTION_BLOCKER_PATTERNS, (pattern) => pattern.test(issue)));
export const getCinematicScriptReadinessIssues = (script: string, chapters: Chapter[], _quality?: ScriptQualityReport, contentSafety?: ContentSafetyReport): string[] =>
  _.uniq(_.compact([_.isEmpty(_.trim(script)) && SOURCE_TEXT_SCRIPT_MISSING, _.isEmpty(chapters) && SOURCE_TEXT_CHAPTERS_MISSING, !_.isEmpty(chapters) && !_.some(chapters, (chapter) => !_.isEmpty(_.trim(chapter.scriptSegment))) && SOURCE_TEXT_CHAPTERS_NO_USABLE_SCRIPT_SEGMENT, contentSafety && !contentSafety.allowed && SOURCE_TEXT_CONTENTSAFETY_BLOCKED]));
export const getCinematicStoryboardReadinessIssues = (scenes: StoryboardScene[], expectedClipCount: number, _quality?: StoryboardQualityReport): string[] =>
  _.uniq(
    _.compact([
      _.isEmpty(scenes) && SOURCE_TEXT_STORYBOARD_MISSING_2,
      !_.isEmpty(scenes) &&
        !_.isEqual(_.size(_.reject(scenes, (scene) => Boolean(scene.isFilmIntro))), expectedClipCount) &&
        CINEMATIC_CHECKPOINT_CONFIG.SCENE_COUNT_MISMATCH_TEMPLATE.replace(CINEMATIC_CHECKPOINT_CONFIG.ACTUAL_COUNT_TOKEN, _.toString(_.size(_.reject(scenes, (scene) => Boolean(scene.isFilmIntro))))).replace(CINEMATIC_CHECKPOINT_CONFIG.EXPECTED_COUNT_TOKEN, _.toString(expectedClipCount)),
      _.some(scenes, (scene) => _.isEmpty(_.trim(scene.script))) && SOURCE_TEXT_STORYBOARD_SCENE_SCRIPT_MISSING_2,
    ]),
  );
export const getCinematicGeneratedTakeIssues = (scenes: StoryboardScene[], _expectedClipCount: number): string[] => _.uniq([..._.flatMap(scenes, (scene) => _.compact([!hasSceneAsset(scene) && SOURCE_TEMPLATE_ASSET_MISSING(`${scene.id}`), !_.isEqual(scene.assetType, GenerateType.Video) && SOURCE_TEMPLATE_VIDEO_MISSING(`${scene.id}`)]))]);
export const isCinematicVideoTakeRenderable = (scene: StoryboardScene): boolean => hasSceneAsset(scene) && _.isEqual(scene.assetType, GenerateType.Video);
export const getCinematicDialogueTakeIssues = (scenes: StoryboardScene[]): string[] =>
  _.flatMap(
    _.filter(scenes, (scene) => _.includes([SOURCE_TEXT_ON_SCREEN_DIALOGUE, SOURCE_TEXT_OFF_SCREEN_DIALOGUE] as string[], _.toString(scene.dialogueMode)) && _.isBoolean(scene.cinematicDialogueDetected)),
    (scene) => _.compact([!scene.cinematicDialogueDetected && SOURCE_TEMPLATE_DIALOGUE_NOT_DETECTED(`${scene.id}`), _.lt(_.defaultTo(scene.cinematicDialogueCoverageScore, 0), CINEMATIC_POLICY_CONFIG.MIN_DIALOGUE_COVERAGE_SCORE) && SOURCE_TEMPLATE_DIALOGUE_COVERAGE_BELOW_TARGET(`${scene.id}`)]),
  );
export const bundleCinematicScenesForGeneration = (scenes: StoryboardScene[], _targetClipCount?: number): StoryboardScene[] => scenes;
export const applyCinematicContinuityHandoffs = (scenes: StoryboardScene[]): StoryboardScene[] => scenes;
export const repairCinematicStoryboardContract = (scenes: StoryboardScene[], _language: ProjectLanguage, _requestedDuration?: string | number): StoryboardScene[] => scenes;
