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
    // Film clips are always generated through the Gemini UI workflow. Keep
    // imageGeneratorEngine untouched so the user's selected video model is
    // still authoritative inside Gemini.
    generationMode: ImageGenerationMode.GeminiChat,
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
  if (_.isEqual(scene.dialogueMode, "off_screen_dialogue")) {
    if (_.isEmpty(_.trim(scene.spokenDialogue))) issues.push(`${scene.id}:spokenDialogue:missing`);
    if (_.isEmpty(_.trim(scene.speakerCharacterId))) issues.push(`${scene.id}:speakerCharacterId:missing`);
    if (_.isEqual(scene.lipSyncRequired, true)) issues.push(`${scene.id}:lipSyncRequired:must_be_false`);
  }
  if (_.isEqual(scene.dialogueMode, "narration")) issues.push(`${scene.id}:dialogueMode:narration_forbidden_in_ai_film`);
  if (!_.isArray(scene.cinematicBeats) || scene.cinematicBeats.length !== 3) {
    issues.push(`${scene.id}:cinematicBeats:requires_exactly_3_ai_planned_shots`);
  } else {
    const beatActions = _.map(scene.cinematicBeats, beat => _.lowerCase(_.trim(beat.visibleAction || "")));
    const beatShotIds = _.map(scene.cinematicBeats, beat => _.lowerCase(_.trim(beat.shotId || "")));
    if (_.some(beatActions, _.isEmpty)) issues.push(`${scene.id}:cinematicBeats:action_missing`);
    if (_.uniq(beatActions).length !== 3) issues.push(`${scene.id}:cinematicBeats:action_repeated`);
    if (_.some(beatShotIds, _.isEmpty) || _.uniq(beatShotIds).length !== 3) issues.push(`${scene.id}:cinematicBeats:shot_id_repeated`);
    _.forEach(scene.cinematicBeats, (beat, index) => {
      const start = _.toNumber(beat.startSecond);
      const end = _.toNumber(beat.endSecond);
      if (!_.lt(start, end) || _.lt(end - start, 1.5)) issues.push(`${scene.id}:cinematicBeats:${index}:unplayable_timing`);
      if (index > 0 && !_.isEqual(start, _.toNumber(scene.cinematicBeats?.[index - 1]?.endSecond))) {
        issues.push(`${scene.id}:cinematicBeats:${index}:timeline_gap`);
      }
    });
    if (!_.isEqual(_.toNumber(scene.cinematicBeats[0].startSecond), 0)
      || !_.isEqual(_.toNumber(_.last(scene.cinematicBeats)?.endSecond), 10)) {
      issues.push(`${scene.id}:cinematicBeats:must_cover_full_clip`);
    }
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

const timeCinematicBeats = (
  beats: NonNullable<StoryboardScene["cinematicBeats"]>,
): NonNullable<StoryboardScene["cinematicBeats"]> => _.map(beats, (beat, index) => ({
  ...beat,
  startSecond: Number(((index * 10) / beats.length).toFixed(2)),
  endSecond: index === beats.length - 1 ? 10 : Number((((index + 1) * 10) / beats.length).toFixed(2)),
}));

/**
 * Packs adjacent coverage from one uninterrupted story event into a single
 * generated clip. Location, cast and action axis remain locked, while the
 * model must perform three deliberate editorial setups inside ~10s.
 */
export const bundleCinematicScenesForGeneration = (scenes: StoryboardScene[], targetClipCount?: number): StoryboardScene[] => {
  let authoredScenes = _.cloneDeep(scenes);
  const maximumBeatCount = targetClipCount ? targetClipCount * 3 : 0;
  if (maximumBeatCount && authoredScenes.length > maximumBeatCount) {
    const compacted: StoryboardScene[] = [];
    const baseSize = Math.floor(authoredScenes.length / maximumBeatCount);
    let extra = authoredScenes.length % maximumBeatCount;
    let cursor = 0;
    for (let index = 0; index < maximumBeatCount; index++) {
      const size = baseSize + (extra-- > 0 ? 1 : 0);
      const sourceGroup = _.slice(authoredScenes, cursor, cursor + size);
      cursor += size;
      const first = _.cloneDeep(sourceGroup[0]);
      const last = _.last(sourceGroup)!;
      compacted.push({
        ...first,
        id: _.join(_.map(sourceGroup, "id"), "__"),
        script: _.join(_.compact(_.map(sourceGroup, "script")), " "),
        visibleAction: _.join(_.compact(_.map(sourceGroup, "visibleAction")), " Then "),
        reaction: _.join(_.compact(_.map(sourceGroup, "reaction")), " Then "),
        visualIntent: _.join(_.compact(_.map(sourceGroup, "visualIntent")), " Then "),
        storyEvidence: _.join(_.compact(_.map(sourceGroup, "storyEvidence")), "; "),
        actionEndState: last.actionEndState || last.visibleAction,
        continuityNotes: `Compacted AI-authored coverage: ${_.join(_.map(sourceGroup, "id"), ", ")}. ${first.continuityNotes || ""}`,
      });
    }
    authoredScenes = compacted;
  }
  // The current film planner returns complete 10-second clip plans itself.
  // Do not post-process or dilute those AI-authored shot plans.
  if (_.every(authoredScenes, scene => _.isEqual(_.size(scene.cinematicBeats), 3))
    && (!targetClipCount || authoredScenes.length <= targetClipCount)) {
    return authoredScenes;
  }
  const groups: StoryboardScene[][] = [];
  _.forEach(authoredScenes, scene => {
    const current = _.last(groups);
    if (current && canShareGeneratedClip(current, scene)) current.push(scene);
    else groups.push([scene]);
  });

  // The AI remains responsible for authoring every story beat. If its repaired
  // response still fragments a short episode into too many requests, repack
  // those authored beats into the user's fixed 10-second generation budget.
  // This changes request packaging only; it does not invent dialogue or action.
  if (targetClipCount && groups.length > targetClipCount && authoredScenes.length <= targetClipCount * 3) {
    groups.length = 0;
    const baseSize = Math.floor(authoredScenes.length / targetClipCount);
    let extra = authoredScenes.length % targetClipCount;
    let cursor = 0;
    for (let index = 0; index < targetClipCount; index++) {
      const size = baseSize + (extra-- > 0 ? 1 : 0);
      groups.push(_.slice(authoredScenes, cursor, cursor + size));
      cursor += size;
    }
  }

  return _.map(groups, group => {
    const first = _.cloneDeep(group[0]);
    if (group.length === 1) return { ...first, cinematicBeats: timeCinematicBeats([toCinematicBeat(first, 0)]) };
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
      cinematicBeats: timeCinematicBeats(_.map(group, toCinematicBeat)),
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
