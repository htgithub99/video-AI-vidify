import _ from "lodash";
import {
  CINEMATIC_ACTION_CHOREOGRAPHY_CONFIG,
  CINEMATIC_DIALOGUE_CONFIG,
  CINEMATIC_POLICY_CONFIG,
  CINEMATIC_POLICY_REQUIRED_FIELDS,
  hasCinematicCombatAction,
  resolveCinematicClipDuration,
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

const getDialogueContractIssues = (scene: StoryboardScene, language?: ProjectLanguage): string[] => {
  if (!_.includes(CINEMATIC_DIALOGUE_CONFIG.MODES, _.toString(scene.dialogueMode))) return [];
  const dialogue = _.trim(scene.spokenDialogue);
  const issues: string[] = [];
  if (CINEMATIC_DIALOGUE_CONFIG.NARRATION_PATTERN.test(dialogue)) issues.push(`${scene.id}:spokenDialogue:third_person_narration_forbidden`);
  if (!_.isEmpty(scene.characterIds) && !_.includes(scene.characterIds, scene.speakerCharacterId)) issues.push(`${scene.id}:speakerCharacterId:must_reference_visible_character`);
  if (_.isEqual(language, ProjectLanguage.VI) && !CINEMATIC_DIALOGUE_CONFIG.VIETNAMESE_CHARACTER_PATTERN.test(dialogue) && !CINEMATIC_DIALOGUE_CONFIG.VIETNAMESE_WORD_PATTERN.test(dialogue))
    issues.push(`${scene.id}:spokenDialogue:must_be_vietnamese`);
  if (_.isEqual(language, ProjectLanguage.EN) && (CINEMATIC_DIALOGUE_CONFIG.VIETNAMESE_CHARACTER_PATTERN.test(dialogue) || !CINEMATIC_DIALOGUE_CONFIG.ENGLISH_WORD_PATTERN.test(dialogue)))
    issues.push(`${scene.id}:spokenDialogue:must_be_english`);
  return issues;
};

export const getCinematicSceneContractIssues = (scene: StoryboardScene, requestedDuration?: string | number, language?: ProjectLanguage): string[] => {
  const clipDurationSeconds = resolveCinematicClipDuration(requestedDuration);
  const issues: string[] = [];
  _.forEach(CINEMATIC_PRODUCTION_POLICY.REQUIRED_TEXT_FIELDS, (field) => {
    if (_.isEmpty(_.trim(_.toString(scene[field])))) issues.push(`${scene.id}:${field}:missing`);
  });
  if (!_.isEqual(scene.assetStrategy, "ai_generated")) issues.push(`${scene.id}:assetStrategy:cinematic_requires_ai_generated_video`);
  if (!_.isInteger(scene.expectedSubjectCount) || _.lt(scene.expectedSubjectCount, 0)) issues.push(`${scene.id}:expectedSubjectCount:invalid`);
  if (!_.isBoolean(scene.allowBackgroundPeople)) issues.push(`${scene.id}:allowBackgroundPeople:missing`);
  if (!_.isBoolean(scene.textAllowed)) issues.push(`${scene.id}:textAllowed:missing`);
  if (!_.isArray(scene.characterIds)) issues.push(`${scene.id}:characterIds:must_be_array`);
  if (!_.isArray(scene.propIds)) issues.push(`${scene.id}:propIds:must_be_array`);
  if (!_.isBoolean(scene.lipSyncRequired)) issues.push(`${scene.id}:lipSyncRequired:missing`);
  if (!_.isArray(scene.soundDesignCues) || _.isEmpty(scene.soundDesignCues)) issues.push(`${scene.id}:soundDesignCues:missing`);
  if (!_.includes(CINEMATIC_DIALOGUE_CONFIG.MODES, _.toString(scene.dialogueMode))) issues.push(`${scene.id}:dialogueMode:invalid`);
  if (_.isEqual(scene.dialogueMode, "on_screen_dialogue")) {
    if (_.isEmpty(scene.characterIds)) issues.push(`${scene.id}:characterIds:dialogue_speaker_required`);
    if (_.isEmpty(_.trim(scene.spokenDialogue))) issues.push(`${scene.id}:spokenDialogue:missing`);
    if (_.isEmpty(_.trim(scene.speakerCharacterId))) issues.push(`${scene.id}:speakerCharacterId:missing`);
    if (!_.isEqual(scene.lipSyncRequired, true)) issues.push(`${scene.id}:lipSyncRequired:must_be_true`);
  }
  if (_.isEqual(scene.dialogueMode, "off_screen_dialogue")) {
    if (_.isEmpty(scene.characterIds)) issues.push(`${scene.id}:characterIds:dialogue_speaker_required`);
    if (_.isEmpty(_.trim(scene.spokenDialogue))) issues.push(`${scene.id}:spokenDialogue:missing`);
    if (_.isEmpty(_.trim(scene.speakerCharacterId))) issues.push(`${scene.id}:speakerCharacterId:missing`);
    if (_.isEqual(scene.lipSyncRequired, true)) issues.push(`${scene.id}:lipSyncRequired:must_be_false`);
  }
  if (_.isEqual(scene.dialogueMode, "silent_action")) {
    if (!_.isEmpty(_.trim(scene.spokenDialogue))) issues.push(`${scene.id}:spokenDialogue:must_be_empty_for_silent_action`);
    if (!_.isEmpty(_.trim(scene.speakerCharacterId))) issues.push(`${scene.id}:speakerCharacterId:must_be_empty_for_silent_action`);
    if (_.isEqual(scene.lipSyncRequired, true)) issues.push(`${scene.id}:lipSyncRequired:must_be_false_for_silent_action`);
  }
  if (_.isEqual(scene.dialogueMode, "narration")) issues.push(`${scene.id}:dialogueMode:narration_forbidden_in_ai_film`);
  issues.push(...getDialogueContractIssues(scene, language));
  const choreographyText = _.join(
    _.compact([
      scene.script,
      scene.prompt,
      scene.visibleAction,
      scene.reaction,
      scene.actionStartState,
      scene.actionEndState,
      ..._.flatMap(scene.cinematicBeats || [], (beat) => [beat.visibleAction, beat.reaction]),
    ]),
    " ",
  );
  if (hasCinematicCombatAction(choreographyText)) {
    const choreographyChecks = [
      ["initiator_missing", CINEMATIC_ACTION_CHOREOGRAPHY_CONFIG.INITIATOR_PATTERN],
      ["target_missing", CINEMATIC_ACTION_CHOREOGRAPHY_CONFIG.TARGET_PATTERN],
      ["footwork_missing", CINEMATIC_ACTION_CHOREOGRAPHY_CONFIG.FOOTWORK_PATTERN],
      ["weight_transfer_missing", CINEMATIC_ACTION_CHOREOGRAPHY_CONFIG.WEIGHT_TRANSFER_PATTERN],
      ["wind_up_missing", CINEMATIC_ACTION_CHOREOGRAPHY_CONFIG.WIND_UP_PATTERN],
      ["limb_or_weapon_ownership_missing", CINEMATIC_ACTION_CHOREOGRAPHY_CONFIG.OWNERSHIP_PATTERN],
      ["contact_or_evasion_missing", CINEMATIC_ACTION_CHOREOGRAPHY_CONFIG.CONTACT_PATTERN],
      ["caused_reaction_missing", CINEMATIC_ACTION_CHOREOGRAPHY_CONFIG.REACTION_PATTERN],
      ["aftermath_missing", CINEMATIC_ACTION_CHOREOGRAPHY_CONFIG.OUTCOME_PATTERN],
    ] as const;
    _.forEach(choreographyChecks, ([issue, pattern]) => {
      if (!pattern.test(choreographyText)) issues.push(`${scene.id}:actionChoreography:${issue}`);
    });
  }
  if (
    !_.isArray(scene.cinematicBeats) ||
    scene.cinematicBeats.length < CINEMATIC_POLICY_CONFIG.MIN_BEAT_COUNT ||
    scene.cinematicBeats.length > CINEMATIC_POLICY_CONFIG.MAX_BEAT_COUNT
  ) {
    issues.push(`${scene.id}:cinematicBeats:requires_between_3_and_5_ai_planned_shots`);
  } else {
    const beatActions = _.map(scene.cinematicBeats, (beat) => _.lowerCase(_.trim(beat.visibleAction || "")));
    const beatShotIds = _.map(scene.cinematicBeats, (beat) => _.lowerCase(_.trim(beat.shotId || "")));
    if (_.some(beatActions, _.isEmpty)) issues.push(`${scene.id}:cinematicBeats:action_missing`);
    if (_.some(beatShotIds, _.isEmpty)) issues.push(`${scene.id}:cinematicBeats:shot_id_missing`);
    if (_.uniq(beatActions).length !== beatActions.length) issues.push(`${scene.id}:cinematicBeats:repeated_action`);
    if (_.uniq(beatShotIds).length !== beatShotIds.length) issues.push(`${scene.id}:cinematicBeats:shot_ids_not_unique`);
    _.forEach(scene.cinematicBeats, (beat, index) => {
      const start = _.toNumber(beat.startSecond),
        end = _.toNumber(beat.endSecond);
      if (!_.lt(start, end) || _.lt(end - start, 0.5)) issues.push(`${scene.id}:cinematicBeats:${index}:unplayable_timing`);
      if (index > 0 && Math.abs(start - _.toNumber(scene.cinematicBeats?.[index - 1]?.endSecond)) > CINEMATIC_POLICY_CONFIG.EPSILON_TOLERANCE)
        issues.push(`${scene.id}:cinematicBeats:${index}:timeline_gap`);
      const dialogueMode = _.toString(beat.dialogueMode),
        dialogue = _.trim(_.toString(beat.spokenDialogue)),
        speaker = _.trim(_.toString(beat.speakerCharacterId));
      if (_.includes(["on_screen_dialogue", "off_screen_dialogue"], dialogueMode)) {
        if (_.isEmpty(dialogue)) issues.push(`${scene.id}:cinematicBeats:${index}:dialogue_missing`);
        if (_.isEmpty(speaker)) issues.push(`${scene.id}:cinematicBeats:${index}:speaker_missing`);
      }
      if (_.isEqual(dialogueMode, "on_screen_dialogue") && !beat.lipSyncRequired) issues.push(`${scene.id}:cinematicBeats:${index}:lip_sync_required`);
      if (!_.isEqual(dialogueMode, "on_screen_dialogue") && beat.lipSyncRequired) issues.push(`${scene.id}:cinematicBeats:${index}:lip_sync_must_be_false`);
    });
    const firstStart = _.toNumber(scene.cinematicBeats[0]?.startSecond),
      lastEnd = _.toNumber(_.last(scene.cinematicBeats)?.endSecond);
    if (Math.abs(firstStart - 0) > CINEMATIC_POLICY_CONFIG.EPSILON_TOLERANCE || Math.abs(lastEnd - clipDurationSeconds) > CINEMATIC_POLICY_CONFIG.EPSILON_TOLERANCE)
      issues.push(`${scene.id}:cinematicBeats:must_cover_0_to_${clipDurationSeconds}_seconds`);
    if (!_.includes(["payoff", "reaction", "reveal"], _.toString(_.last(scene.cinematicBeats)?.shotRole)))
      issues.push(`${scene.id}:cinematicBeats:final_shot_must_show_consequence`);
  }
  return issues;
};

export const getCinematicStoryboardContractIssues = (scenes: StoryboardScene[], requestedDuration?: string | number, language?: ProjectLanguage): string[] => {
  const issues = _.flatMap(scenes, (scene) => getCinematicSceneContractIssues(scene, requestedDuration, language));
  const characterLedScenes = _.filter(scenes, (scene) => !_.isEmpty(scene.characterIds));
  const dialogueSceneCount = _.size(
    _.filter(characterLedScenes, (scene) => _.includes(["on_screen_dialogue", "off_screen_dialogue"], scene.dialogueMode) && !_.isEmpty(_.trim(scene.spokenDialogue))),
  );
  const minimumDialogueScenes = Math.max(1, Math.ceil(characterLedScenes.length * CINEMATIC_POLICY_CONFIG.MIN_DIALOGUE_SCENE_RATIO));
  if (_.gt(characterLedScenes.length, 1) && _.lt(dialogueSceneCount, minimumDialogueScenes))
    issues.push(`storyboard:dialogue_coverage:requires_at_least_${minimumDialogueScenes}_playable_dialogue_scenes`);
  const dialogueOwners = _.groupBy(
    _.filter(scenes, (scene) => !_.isEmpty(_.trim(scene.spokenDialogue))),
    (scene) => _.lowerCase(_.trim(scene.spokenDialogue)),
  );
  _.forEach(dialogueOwners, (matchingScenes) => {
    if (_.size(matchingScenes) < 2) return;
    _.forEach(_.tail(matchingScenes), (scene) => issues.push(`${scene.id}:spokenDialogue:duplicate_story_line`));
  });
  _.forEach(_.tail(scenes), (scene, index) => {
    const previous = scenes[index];
    if (!_.isEqual(previous.sequenceId || previous.chapterId, scene.sequenceId || scene.chapterId)) return;
    if (!_.isEqual(scene.continuityFrom, previous.id)) issues.push(`${scene.id}:continuityFrom:must_reference_previous_clip`);
    const previousEnd = _.lowerCase(_.trim(previous.actionEndState || "")),
      currentStart = _.lowerCase(_.trim(scene.actionStartState || ""));
    if (!_.isEmpty(previousEnd) && !_.isEqual(previousEnd, currentStart)) issues.push(`${scene.id}:actionStartState:must_match_previous_end_state`);
    const previousDirection = _.lowerCase(_.trim(previous.screenDirection || "")),
      currentDirection = _.lowerCase(_.trim(scene.screenDirection || ""));
    if (
      !_.includes(["", "not_applicable", "static_axis"], previousDirection) &&
      !_.includes(["", "not_applicable", "static_axis"], currentDirection) &&
      !_.isEqual(previousDirection, currentDirection)
    )
      issues.push(`${scene.id}:screenDirection:continuity_break`);
  });
  return _.uniq(issues);
};

export const getBlockingCinematicStoryboardContractIssues = (scenes: StoryboardScene[], requestedDuration?: string | number, language?: ProjectLanguage): string[] =>
  getBlockingCinematicPlanningIssues(getCinematicStoryboardContractIssues(scenes, requestedDuration, language));

const CINEMATIC_PRODUCTION_BLOCKER_PATTERNS = [
  /:result:missing_scene$/,
  /:id:(?:duplicate|unexpected)$/,
  /:generationPrompt:missing$/,
] as const;

export const getBlockingCinematicPlanningIssues = (issues: string[]): string[] =>
  _.filter(issues, (issue) => _.some(CINEMATIC_PRODUCTION_BLOCKER_PATTERNS, (pattern) => pattern.test(issue)));

export const getCinematicScriptReadinessIssues = (
  script: string,
  chapters: Chapter[],
  quality?: ScriptQualityReport,
  contentSafety?: ContentSafetyReport,
): string[] =>
  _.uniq(
    _.compact([
      _.isEmpty(_.trim(script)) && "script:missing",
      _.isEmpty(chapters) && "chapters:missing",
      !_.isEmpty(chapters) && !_.some(chapters, (chapter) => !_.isEmpty(_.trim(chapter.scriptSegment))) && "chapters:no_usable_script_segment",
      quality && !_.isEmpty(quality.blockingErrors) && "scriptQa:failed",
      contentSafety && !contentSafety.allowed && "contentSafety:blocked",
    ]),
  );

export const getCinematicStoryboardReadinessIssues = (
  scenes: StoryboardScene[],
  _expectedClipCount: number,
  _quality?: StoryboardQualityReport,
): string[] =>
  _.uniq(
    _.compact([
      _.isEmpty(scenes) && "storyboard:missing",
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
    _.filter(scenes, (scene) => _.includes(["on_screen_dialogue", "off_screen_dialogue"], _.toString(scene.dialogueMode))),
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
