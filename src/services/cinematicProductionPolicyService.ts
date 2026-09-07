import _ from "lodash";
import {
  CINEMATIC_POLICY_CONFIG,
  CINEMATIC_POLICY_REQUIRED_FIELDS,
  CINEMATIC_PRODUCTION_BLOCKER_PATTERNS,
  CINEMATIC_CHECKPOINT_CONFIG,
} from "../constants/cinematicConstants";
import { VideoGenre } from "../constants/enums";
import {
  Chapter,
  ContentSafetyReport,
  GenerateType,
  ImageGenerationMode,
  ImageGeneratorEngine,
  ScriptQualityReport,
  StoryboardQualityReport,
  StoryboardScene,
  ProjectLanguage,
  VisualConfig,
} from "../types";
import { hasSceneAsset } from "./projectImageGenerationService";

export const CINEMATIC_PRODUCTION_POLICY = { PLANNING_CHUNK_SIZE: CINEMATIC_POLICY_CONFIG.PLANNING_CHUNK_SIZE, REQUIRED_TEXT_FIELDS: CINEMATIC_POLICY_REQUIRED_FIELDS } as const;

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

export const getCinematicSceneContractIssues = (
  scene: StoryboardScene,
  _requestedDuration?: string | number,
  _language?: ProjectLanguage,
): string[] => {
  const issues: string[] = [];
  _.forEach(CINEMATIC_PRODUCTION_POLICY.REQUIRED_TEXT_FIELDS, (field) => {
    if (_.isEmpty(_.trim(_.toString(scene[field])))) issues.push(`${scene.id}:${field}:missing`);
  });
  return issues;
};

export const getCinematicStoryboardContractIssues = (
  scenes: StoryboardScene[],
  requestedDuration?: string | number,
  language?: ProjectLanguage,
): string[] => _.uniq(_.flatMap(scenes, (scene) => getCinematicSceneContractIssues(scene, requestedDuration, language)));

export const getBlockingCinematicStoryboardContractIssues = (scenes: StoryboardScene[], requestedDuration?: string | number, language?: ProjectLanguage): string[] =>
  getBlockingCinematicPlanningIssues(getCinematicStoryboardContractIssues(scenes, requestedDuration, language));

export const getBlockingCinematicPlanningIssues = (issues: string[]): string[] =>
  _.filter(issues, (issue) => _.some(CINEMATIC_PRODUCTION_BLOCKER_PATTERNS, (pattern) => pattern.test(issue)));

export const getCinematicScriptReadinessIssues = (
  script: string,
  chapters: Chapter[],
  _quality?: ScriptQualityReport,
  contentSafety?: ContentSafetyReport,
): string[] =>
  _.uniq(
    _.compact([
      _.isEmpty(_.trim(script)) && "script:missing",
      _.isEmpty(chapters) && "chapters:missing",
      !_.isEmpty(chapters) && !_.some(chapters, (chapter) => !_.isEmpty(_.trim(chapter.scriptSegment))) && "chapters:no_usable_script_segment",
      contentSafety && !contentSafety.allowed && "contentSafety:blocked",
    ]),
  );

export const getCinematicStoryboardReadinessIssues = (
  scenes: StoryboardScene[],
  expectedClipCount: number,
  _quality?: StoryboardQualityReport,
): string[] =>
  _.uniq(
    _.compact([
      _.isEmpty(scenes) && "storyboard:missing",
      !_.isEmpty(scenes) &&
        !_.isEqual(scenes.length, expectedClipCount) &&
        CINEMATIC_CHECKPOINT_CONFIG.SCENE_COUNT_MISMATCH_TEMPLATE.replace(
          CINEMATIC_CHECKPOINT_CONFIG.ACTUAL_COUNT_TOKEN,
          _.toString(scenes.length),
        ).replace(CINEMATIC_CHECKPOINT_CONFIG.EXPECTED_COUNT_TOKEN, _.toString(expectedClipCount)),
      _.some(scenes, (scene) => _.isEmpty(_.trim(scene.script))) && "storyboard:scene_script_missing",
    ]),
  );

export const getCinematicGeneratedTakeIssues = (scenes: StoryboardScene[], _expectedClipCount: number): string[] =>
  _.uniq([
    ..._.flatMap(scenes, (scene) =>
      _.compact([
        !hasSceneAsset(scene) && `${scene.id}:asset_missing`,
        !_.isEqual(scene.assetType, GenerateType.Video) && `${scene.id}:video_missing`,
      ]),
    ),
  ]);

export const getCinematicDialogueTakeIssues = (scenes: StoryboardScene[]): string[] =>
  _.flatMap(
    _.filter(
      scenes,
      (scene) =>
        _.includes(["on_screen_dialogue", "off_screen_dialogue"], _.toString(scene.dialogueMode)) && _.isBoolean(scene.cinematicDialogueDetected),
    ),
    (scene) =>
      _.compact([
        !scene.cinematicDialogueDetected && `${scene.id}:dialogue:not_detected`,
        _.lt(_.defaultTo(scene.cinematicDialogueCoverageScore, 0), CINEMATIC_POLICY_CONFIG.MIN_DIALOGUE_COVERAGE_SCORE) && `${scene.id}:dialogue:coverage_below_target`,
      ]),
  );

export const bundleCinematicScenesForGeneration = (scenes: StoryboardScene[], _targetClipCount?: number): StoryboardScene[] => scenes;

export const applyCinematicContinuityHandoffs = (scenes: StoryboardScene[]): StoryboardScene[] => scenes;

export const repairCinematicStoryboardContract = (
  scenes: StoryboardScene[],
  _language: ProjectLanguage,
  _requestedDuration?: string | number,
): StoryboardScene[] => scenes;
