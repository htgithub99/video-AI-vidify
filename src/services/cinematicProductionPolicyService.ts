import _ from "lodash";
import { VideoGenre } from "../constants/enums";
import { GenerateType, ImageGenerationMode, ImageGeneratorEngine, StoryboardScene, VisualConfig } from "../types";

export const CINEMATIC_PRODUCTION_POLICY = {
  PLANNING_CHUNK_SIZE: 2,
  REQUIRED_TEXT_FIELDS: [
    "sequenceId", "shotId", "shotRole", "dialogueMode", "characterBlocking",
    "eyelineDirection", "screenDirection", "actionStartState", "actionEndState",
    "locationState", "wardrobeState", "propState",
  ] as const,
} as const;

export const isCinematicEpisodeGenre = (genre?: string): boolean =>
  _.isEqual(_.trim(genre), VideoGenre.CINEMATIC_EPISODE);

/**
 * A cinematic episode is a video-only production mode. The selected model,
 * aspect ratio and duration remain untouched; only the media policy is locked.
 */
export const applyCinematicProductionPolicy = (
  source: VisualConfig,
  genre?: string,
  sceneCount: number = 0,
): VisualConfig => {
  if (!isCinematicEpisodeGenre(genre)) return source;
  const selectedEngineCannotGenerateVideo = _.every([
    !_.isEqual(source.generationMode, ImageGenerationMode.GeminiChat),
    _.isEqual(source.imageGeneratorEngine, ImageGeneratorEngine.Imagen),
  ], Boolean);
  return {
    ...source,
    generateType: GenerateType.Video,
    maxVideoScenes: Math.max(sceneCount, _.defaultTo(source.maxVideoScenes, 0)),
    imageGeneratorEngine: selectedEngineCannotGenerateVideo
      ? ImageGeneratorEngine.Veo3
      : source.imageGeneratorEngine,
  };
};

export const getCinematicSceneContractIssues = (scene: StoryboardScene): string[] => {
  const issues: string[] = [];
  _.forEach(CINEMATIC_PRODUCTION_POLICY.REQUIRED_TEXT_FIELDS, field => {
    if (_.isEmpty(_.trim(_.toString(scene[field])))) issues.push(`${scene.id}:${field}:missing`);
  });
  if (!_.isBoolean(scene.lipSyncRequired)) issues.push(`${scene.id}:lipSyncRequired:missing`);
  if (!_.isArray(scene.soundDesignCues) || _.isEmpty(scene.soundDesignCues)) {
    issues.push(`${scene.id}:soundDesignCues:missing`);
  }
  if (_.isEqual(scene.dialogueMode, "on_screen_dialogue")) {
    if (_.isEmpty(_.trim(scene.spokenDialogue))) issues.push(`${scene.id}:spokenDialogue:missing`);
    if (_.isEmpty(_.trim(scene.speakerCharacterId))) issues.push(`${scene.id}:speakerCharacterId:missing`);
    if (!_.isEqual(scene.lipSyncRequired, true)) issues.push(`${scene.id}:lipSyncRequired:must_be_true`);
  }
  if (!_.isArray(scene.cinematicBeats) || !_.inRange(scene.cinematicBeats.length, 2, 4)) {
    issues.push(`${scene.id}:cinematicBeats:requires_2_or_3_ai_planned_shots`);
  }
  return issues;
};

export const getCinematicStoryboardContractIssues = (scenes: StoryboardScene[]): string[] => {
  const issues = _.flatMap(scenes, getCinematicSceneContractIssues);
  const signatures = _.map(scenes, scene => _.join([
    _.lowerCase(scene.locationId || scene.locationState || ""),
    _.lowerCase(scene.visibleAction || ""),
    _.lowerCase(scene.shotSize || ""),
    _.lowerCase(scene.composition || ""),
  ], "|"));
  _.forEach(_.groupBy(signatures), (indexes, signature) => {
    if (signature && indexes.length > 1) issues.push(`storyboard:duplicate_visual_plan:${signature}`);
  });
  return issues;
};

const normalizedCharacterSet = (scene: StoryboardScene): string =>
  _.join(_.sortBy(_.uniq(scene.characterIds || [])), "|");

const canShareGeneratedClip = (bundle: StoryboardScene[], candidate: StoryboardScene): boolean => {
  const first = _.first(bundle);
  if (!first || bundle.length >= 3) return false;
  const dialogueShots = _.filter([...bundle, candidate], scene =>
    _.isEqual(scene.dialogueMode, "on_screen_dialogue") && scene.lipSyncRequired);
  return _.every([
    _.isEqual(first.sequenceId || first.chapterId, candidate.sequenceId || candidate.chapterId),
    _.isEqual(first.locationId || first.locationState, candidate.locationId || candidate.locationState),
    _.isEqual(normalizedCharacterSet(first), normalizedCharacterSet(candidate)),
    dialogueShots.length <= 1,
  ], Boolean);
};

const toCinematicBeat = (scene: StoryboardScene, index: number): NonNullable<StoryboardScene["cinematicBeats"]>[number] => ({
  sourceSceneId: scene.id,
  shotId: scene.shotId || scene.id,
  shotRole: scene.shotRole || "coverage",
  shotSize: scene.shotSize || "medium shot",
  cameraAngle: scene.cameraAngle || "eye level",
  visibleAction: scene.visibleAction || scene.actionEndState || scene.script,
  reaction: scene.reaction || "",
  transition: index === 0 ? "hard_cut" : (_.isEqual(scene.shotRole, "insert") ? "match_cut" : "motivated_reframe"),
  dialogueMode: scene.dialogueMode || "silent_action",
  spokenDialogue: scene.spokenDialogue || "",
  speakerCharacterId: scene.speakerCharacterId || "",
  lipSyncRequired: Boolean(scene.lipSyncRequired),
});

/**
 * Packs adjacent coverage from one uninterrupted story event into a single
 * generated clip. Location, cast and action axis remain locked, while the
 * model may perform two or three deliberate editorial cuts inside ~10s.
 */
export const bundleCinematicScenesForGeneration = (scenes: StoryboardScene[]): StoryboardScene[] => {
  // The current film planner returns complete 10-second clip plans itself.
  // Do not post-process or dilute those AI-authored shot plans.
  if (_.every(scenes, scene => _.inRange(_.size(scene.cinematicBeats), 2, 4))) {
    return _.cloneDeep(scenes);
  }
  const groups: StoryboardScene[][] = [];
  _.forEach(scenes, scene => {
    const current = _.last(groups);
    if (current && canShareGeneratedClip(current, scene)) current.push(scene);
    else groups.push([scene]);
  });

  return _.map(groups, group => {
    const first = _.cloneDeep(group[0]);
    if (group.length === 1) return { ...first, cinematicBeats: [toCinematicBeat(first, 0)] };
    const last = _.last(group)!;
    const dialogueScene = _.find(group, scene => _.isEqual(scene.dialogueMode, "on_screen_dialogue") && scene.lipSyncRequired);
    return {
      ...first,
      id: _.join(_.map(group, "id"), "__"),
      shotId: _.join(_.map(group, scene => scene.shotId || scene.id), "+"),
      script: _.join(_.map(group, "script"), " "),
      subtitle: dialogueScene?.spokenDialogue || "",
      visualIntent: _.join(_.compact(_.map(group, "visualIntent")), " Then "),
      visibleAction: _.join(_.compact(_.map(group, "visibleAction")), " Then "),
      reaction: _.join(_.compact(_.map(group, "reaction")), " Then "),
      storyEvidence: _.join(_.compact(_.map(group, "storyEvidence")), "; "),
      actionEndState: last.actionEndState,
      shotRole: last.shotRole || first.shotRole,
      dialogueMode: dialogueScene?.dialogueMode || first.dialogueMode,
      spokenDialogue: dialogueScene?.spokenDialogue || "",
      speakerCharacterId: dialogueScene?.speakerCharacterId || "",
      lipSyncRequired: Boolean(dialogueScene?.lipSyncRequired),
      propIds: _.uniq(_.flatMap(group, scene => scene.propIds || [])),
      soundDesignCues: _.uniq(_.flatMap(group, scene => scene.soundDesignCues || [])),
      cinematicBeats: _.map(group, toCinematicBeat),
      continuityNotes: `Bundled source shots: ${_.join(_.map(group, "id"), ", ")}. ${first.continuityNotes || ""}`,
    };
  });
};

/** Builds explicit A-to-B edit continuity after shot bundling. */
export const applyCinematicContinuityHandoffs = (scenes: StoryboardScene[]): StoryboardScene[] => {
  let previous: StoryboardScene | undefined;
  return _.map(scenes, source => {
    const scene = _.cloneDeep(source);
    const sameSequence = previous && _.isEqual(
      previous.sequenceId || previous.chapterId,
      scene.sequenceId || scene.chapterId,
    );
    if (!previous || !sameSequence) {
      scene.continuityFrom = "";
      scene.cinematicContinuityHandoff = undefined;
      previous = scene;
      return scene;
    }

    const previousEndState = previous.actionEndState || previous.visibleAction || "the exact final pose of the previous clip";
    const plannedOpeningState = scene.actionStartState;
    const requiredOpeningState = previousEndState;
    const screenDirectionLock = _.includes(["not_applicable", ""], scene.screenDirection || "")
      ? (previous.screenDirection || "static_axis")
      : (scene.screenDirection || previous.screenDirection || "static_axis");
    const eyelineLock = _.isEqual(scene.shotRole, "reaction")
      ? (scene.eyelineDirection || `the reciprocal eyeline established by ${previous.id}`)
      : (scene.eyelineDirection || previous.eyelineDirection || "established eyeline");

    scene.continuityFrom = previous.id;
    scene.actionStartState = requiredOpeningState;
    scene.screenDirection = screenDirectionLock;
    scene.eyelineDirection = eyelineLock;
    scene.cinematicContinuityHandoff = {
      previousClipId: previous.id,
      previousEndState,
      requiredOpeningState,
      locationLock: scene.locationState || previous.locationState || scene.locationId || previous.locationId || "unchanged set geography",
      wardrobeLock: scene.wardrobeState || previous.wardrobeState || "unchanged wardrobe and wear state",
      propLock: scene.propState || previous.propState || "unchanged prop ownership, hand and condition",
      screenDirectionLock,
      eyelineLock,
      lightingLock: scene.lighting || previous.lighting || "unchanged motivated light direction and time",
    };
    scene.continuityNotes = _.join(_.compact([
      scene.continuityNotes,
      `First frame inherits the final state of ${previous.id}: ${previousEndState}.`,
      plannedOpeningState && !_.isEqual(plannedOpeningState, previousEndState)
        ? `After the matched cut, continue naturally toward the planned beat: ${plannedOpeningState}.`
        : "",
    ]), " ");
    previous = scene;
    return scene;
  });
};
