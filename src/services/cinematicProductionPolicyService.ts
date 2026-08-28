import _ from "lodash";
import { CINEMATIC_DEFAULT_SOUND_CUES, CINEMATIC_DEFAULTS, CINEMATIC_POLICY_CONFIG, CINEMATIC_POLICY_REQUIRED_FIELDS } from "../constants/cinematicConstants";
import { VideoGenre } from "../constants/enums";
import { GenerateType, ImageGenerationMode, ImageGeneratorEngine, StoryboardScene, VisualConfig } from "../types";

export const CINEMATIC_PRODUCTION_POLICY = { PLANNING_CHUNK_SIZE: CINEMATIC_POLICY_CONFIG.PLANNING_CHUNK_SIZE, REQUIRED_TEXT_FIELDS: CINEMATIC_POLICY_REQUIRED_FIELDS } as const;

export const isCinematicEpisodeGenre = (genre?: string): boolean => _.isEqual(_.trim(genre), VideoGenre.CINEMATIC_EPISODE);

export const applyCinematicProductionPolicy = (source: VisualConfig, genre?: string, sceneCount: number = 0): VisualConfig => {
  if (!isCinematicEpisodeGenre(genre)) return source;
  const selectedEngineCannotGenerateVideo = _.isEqual(source.imageGeneratorEngine, ImageGeneratorEngine.Imagen);
  return { ...source, generationMode: ImageGenerationMode.LabsFlow, generateType: GenerateType.Video, maxVideoScenes: Math.max(sceneCount, _.defaultTo(source.maxVideoScenes, 0)), imageGeneratorEngine: selectedEngineCannotGenerateVideo ? ImageGeneratorEngine.Veo3 : source.imageGeneratorEngine };
};

export const getCinematicSceneContractIssues = (scene: StoryboardScene): string[] => {
  const issues: string[] = [];
  _.forEach(CINEMATIC_PRODUCTION_POLICY.REQUIRED_TEXT_FIELDS, (field) => {
    if (_.isEmpty(_.trim(_.toString(scene[field])))) issues.push(`${scene.id}:${field}:missing`);
  });
  if (!_.isBoolean(scene.lipSyncRequired)) issues.push(`${scene.id}:lipSyncRequired:missing`);
  if (!_.isArray(scene.soundDesignCues) || _.isEmpty(scene.soundDesignCues)) issues.push(`${scene.id}:soundDesignCues:missing`);
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
  if (!_.isArray(scene.cinematicBeats) || scene.cinematicBeats.length < CINEMATIC_POLICY_CONFIG.MIN_BEAT_COUNT || scene.cinematicBeats.length > CINEMATIC_POLICY_CONFIG.MAX_BEAT_COUNT) {
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
      if (index > 0 && Math.abs(start - _.toNumber(scene.cinematicBeats?.[index - 1]?.endSecond)) > CINEMATIC_POLICY_CONFIG.EPSILON_TOLERANCE) issues.push(`${scene.id}:cinematicBeats:${index}:timeline_gap`);
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
    if (Math.abs(firstStart - 0) > CINEMATIC_POLICY_CONFIG.EPSILON_TOLERANCE || Math.abs(lastEnd - CINEMATIC_POLICY_CONFIG.CLIP_DURATION_SECONDS) > CINEMATIC_POLICY_CONFIG.EPSILON_TOLERANCE) issues.push(`${scene.id}:cinematicBeats:must_cover_full_clip`);
    if (!_.includes(["payoff", "reaction", "reveal"], _.toString(_.last(scene.cinematicBeats)?.shotRole))) issues.push(`${scene.id}:cinematicBeats:final_shot_must_show_consequence`);
  }
  return issues;
};

export const getCinematicStoryboardContractIssues = (scenes: StoryboardScene[]): string[] => {
  const issues = _.flatMap(scenes, getCinematicSceneContractIssues);
  _.forEach(_.tail(scenes), (scene, index) => {
    const previous = scenes[index];
    if (!_.isEqual(previous.sequenceId || previous.chapterId, scene.sequenceId || scene.chapterId)) return;
    if (!_.isEqual(scene.continuityFrom, previous.id)) issues.push(`${scene.id}:continuityFrom:must_reference_previous_clip`);
    const previousEnd = _.lowerCase(_.trim(previous.actionEndState || "")),
      currentStart = _.lowerCase(_.trim(scene.actionStartState || ""));
    if (!_.isEmpty(previousEnd) && !_.isEqual(previousEnd, currentStart)) issues.push(`${scene.id}:actionStartState:must_match_previous_end_state`);
    const previousDirection = _.lowerCase(_.trim(previous.screenDirection || "")),
      currentDirection = _.lowerCase(_.trim(scene.screenDirection || ""));
    if (!_.includes(["", "not_applicable", "static_axis"], previousDirection) && !_.includes(["", "not_applicable", "static_axis"], currentDirection) && !_.isEqual(previousDirection, currentDirection)) issues.push(`${scene.id}:screenDirection:continuity_break`);
  });
  return _.uniq(issues);
};

const normalizedCharacterSet = (scene: StoryboardScene): string => _.join(_.sortBy(_.uniq(scene.characterIds || [])), "|");

const canShareGeneratedClip = (bundle: StoryboardScene[], candidate: StoryboardScene): boolean => {
  const first = _.first(bundle);
  if (!first || bundle.length >= CINEMATIC_POLICY_CONFIG.MAX_BEAT_COUNT) return false;
  const dialogueShots = _.filter([...bundle, candidate], (scene) => _.isEqual(scene.dialogueMode, "on_screen_dialogue") && scene.lipSyncRequired);
  return _.every([_.isEqual(first.sequenceId || first.chapterId, candidate.sequenceId || candidate.chapterId), _.isEqual(first.locationId || first.locationState, candidate.locationId || candidate.locationState), _.isEqual(normalizedCharacterSet(first), normalizedCharacterSet(candidate)), dialogueShots.length <= 1], Boolean);
};

const toCinematicBeat = (scene: StoryboardScene, index: number): NonNullable<StoryboardScene["cinematicBeats"]>[number] => ({
  sourceSceneId: scene.id,
  shotId: scene.shotId || scene.id,
  shotRole: scene.shotRole || "coverage",
  shotSize: scene.shotSize || "medium shot",
  cameraAngle: scene.cameraAngle || "eye level",
  visibleAction: scene.visibleAction || scene.actionEndState || scene.script,
  reaction: scene.reaction || "",
  transition: index === 0 ? "hard_cut" : _.isEqual(scene.shotRole, "insert") ? "match_cut" : "motivated_reframe",
  dialogueMode: scene.dialogueMode || "silent_action",
  spokenDialogue: scene.spokenDialogue || "",
  speakerCharacterId: scene.speakerCharacterId || "",
  lipSyncRequired: Boolean(scene.lipSyncRequired),
});

const timeCinematicBeats = (beats: NonNullable<StoryboardScene["cinematicBeats"]>): NonNullable<StoryboardScene["cinematicBeats"]> => {
  const duration = CINEMATIC_POLICY_CONFIG.CLIP_DURATION_SECONDS;
  return _.map(beats, (beat, index) => ({
    ...beat,
    startSecond: Number(((index * duration) / beats.length).toFixed(2)),
    endSecond: index === beats.length - 1 ? duration : Number((((index + 1) * duration) / beats.length).toFixed(2)),
  }));
};

const ensureValidCinematicBeats = (scene: StoryboardScene, group: StoryboardScene[]): NonNullable<StoryboardScene["cinematicBeats"]> => {
  if (scene.cinematicBeats && scene.cinematicBeats.length >= CINEMATIC_POLICY_CONFIG.MIN_BEAT_COUNT && scene.cinematicBeats.length <= CINEMATIC_POLICY_CONFIG.MAX_BEAT_COUNT) return timeCinematicBeats(scene.cinematicBeats);
  if (group.length >= CINEMATIC_POLICY_CONFIG.MIN_BEAT_COUNT && group.length <= CINEMATIC_POLICY_CONFIG.MAX_BEAT_COUNT) return timeCinematicBeats(_.map(group, toCinematicBeat));
  if (group.length === 2) {
    const firstBeat = toCinematicBeat(group[0], 0);
    firstBeat.shotRole = "master";
    firstBeat.shotSize = "wide shot";
    const secondBeat = toCinematicBeat(group[1], 1);
    secondBeat.shotRole = "coverage";
    secondBeat.shotSize = "medium tracking";
    const thirdBeat: NonNullable<StoryboardScene["cinematicBeats"]>[number] = { ...secondBeat, shotId: `${secondBeat.shotId}_reaction`, shotRole: "reaction", shotSize: "close up", visibleAction: group[1].reaction || group[1].actionEndState || `Visible aftermath and consequence of ${secondBeat.visibleAction}`, transition: "motivated_reframe" };
    return timeCinematicBeats([firstBeat, secondBeat, thirdBeat]);
  }
  const action = scene.visibleAction || scene.actionEndState || scene.script || CINEMATIC_DEFAULTS.VISIBLE_ACTION;
  const reaction = scene.reaction || scene.actionEndState || `Subject assesses the outcome of ${action}`;
  return timeCinematicBeats([
    { sourceSceneId: scene.id, shotId: `${scene.shotId || scene.id}_setup`, shotRole: "master", shotSize: "wide shot", cameraAngle: scene.cameraAngle || "low angle", visibleAction: `Establishing the location and staging: ${scene.characterBlocking || action}`, reaction: "", transition: "hard_cut", dialogueMode: "silent_action", spokenDialogue: "", speakerCharacterId: "", lipSyncRequired: false },
    { sourceSceneId: scene.id, shotId: `${scene.shotId || scene.id}_action`, shotRole: "coverage", shotSize: "medium tracking", cameraAngle: scene.cameraAngle || "eye level", visibleAction: action, reaction: "", transition: "motivated_reframe", dialogueMode: scene.dialogueMode || "silent_action", spokenDialogue: scene.spokenDialogue || "", speakerCharacterId: scene.speakerCharacterId || "", lipSyncRequired: Boolean(scene.lipSyncRequired) },
    { sourceSceneId: scene.id, shotId: `${scene.shotId || scene.id}_reaction`, shotRole: "reaction", shotSize: "close up", cameraAngle: scene.cameraAngle || "eye level", visibleAction: reaction, reaction: reaction, transition: "match_cut", dialogueMode: "silent_action", spokenDialogue: "", speakerCharacterId: "", lipSyncRequired: false },
  ]);
};

export const bundleCinematicScenesForGeneration = (scenes: StoryboardScene[], targetClipCount?: number): StoryboardScene[] => {
  let authoredScenes = _.cloneDeep(scenes);
  const maximumBeatCount = targetClipCount ? targetClipCount * CINEMATIC_POLICY_CONFIG.MAX_BEAT_COUNT : 0;
  if (maximumBeatCount && authoredScenes.length > maximumBeatCount) {
    const compacted: StoryboardScene[] = [];
    const baseSize = Math.floor(authoredScenes.length / maximumBeatCount);
    let extra = authoredScenes.length % maximumBeatCount,
      cursor = 0;
    for (let index = 0; index < maximumBeatCount; index++) {
      const size = baseSize + (extra-- > 0 ? 1 : 0);
      const sourceGroup = _.slice(authoredScenes, cursor, cursor + size);
      cursor += size;
      const first = _.cloneDeep(sourceGroup[0]),
        last = _.last(sourceGroup)!;
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
  if (_.every(authoredScenes, (scene) => _.size(scene.cinematicBeats) >= CINEMATIC_POLICY_CONFIG.MIN_BEAT_COUNT && _.size(scene.cinematicBeats) <= CINEMATIC_POLICY_CONFIG.MAX_BEAT_COUNT) && (!targetClipCount || authoredScenes.length <= targetClipCount)) return authoredScenes;

  const groups: StoryboardScene[][] = [];
  _.forEach(authoredScenes, (scene) => {
    const current = _.last(groups);
    if (current && canShareGeneratedClip(current, scene)) current.push(scene);
    else groups.push([scene]);
  });

  if (targetClipCount && groups.length > targetClipCount && authoredScenes.length <= targetClipCount * CINEMATIC_POLICY_CONFIG.MAX_BEAT_COUNT) {
    groups.length = 0;
    const baseSize = Math.floor(authoredScenes.length / targetClipCount);
    let extra = authoredScenes.length % targetClipCount,
      cursor = 0;
    for (let index = 0; index < targetClipCount; index++) {
      const size = baseSize + (extra-- > 0 ? 1 : 0);
      groups.push(_.slice(authoredScenes, cursor, cursor + size));
      cursor += size;
    }
  }

  return _.map(groups, (group, groupIndex) => {
    const first = _.cloneDeep(group[0]),
      last = _.last(group)!;
    const dialogueScene = _.find(group, (scene) => _.isEqual(scene.dialogueMode, "on_screen_dialogue") && scene.lipSyncRequired);
    const validBeats = ensureValidCinematicBeats(first, group);
    const defaultSoundCues = !_.isEmpty(first.soundDesignCues) ? first.soundDesignCues : [...CINEMATIC_DEFAULT_SOUND_CUES];
    return {
      ...first,
      id: _.join(_.map(group, "id"), "__"),
      sequenceId: first.sequenceId || first.chapterId || `seq_${groupIndex + 1}`,
      shotId: _.join(
        _.map(group, (scene) => scene.shotId || scene.id),
        "+",
      ),
      shotRole: last.shotRole || first.shotRole || "coverage",
      characterBlocking: first.characterBlocking || first.visibleAction || CINEMATIC_DEFAULTS.CHARACTER_BLOCKING,
      eyelineDirection: first.eyelineDirection || CINEMATIC_DEFAULTS.EYELINE_DIRECTION,
      screenDirection: first.screenDirection || CINEMATIC_DEFAULTS.SCREEN_DIRECTION,
      actionStartState: first.actionStartState || CINEMATIC_DEFAULTS.ACTION_START_STATE,
      actionEndState: last.actionEndState || last.visibleAction || CINEMATIC_DEFAULTS.ACTION_END_STATE,
      locationState: first.locationState || first.locationId || CINEMATIC_DEFAULTS.LOCATION_STATE,
      wardrobeState: first.wardrobeState || CINEMATIC_DEFAULTS.WARDROBE_STATE,
      propState: first.propState || CINEMATIC_DEFAULTS.PROP_STATE,
      script: _.join(_.map(group, "script"), " "),
      subtitle: dialogueScene?.spokenDialogue || first.subtitle || "",
      visualIntent: _.join(_.compact(_.map(group, "visualIntent")), " Then "),
      visibleAction: _.join(_.compact(_.map(group, "visibleAction")), " Then ") || first.visibleAction || CINEMATIC_DEFAULTS.VISIBLE_ACTION,
      reaction: _.join(_.compact(_.map(group, "reaction")), " Then ") || first.reaction || CINEMATIC_DEFAULTS.REACTION,
      storyEvidence: _.join(_.compact(_.map(group, "storyEvidence")), "; "),
      dialogueMode: dialogueScene?.dialogueMode || first.dialogueMode || "silent_action",
      spokenDialogue: dialogueScene?.spokenDialogue || "",
      speakerCharacterId: dialogueScene?.speakerCharacterId || "",
      lipSyncRequired: Boolean(dialogueScene?.lipSyncRequired),
      propIds: _.uniq(_.flatMap(group, (scene) => scene.propIds || [])),
      soundDesignCues: !_.isEmpty(_.flatMap(group, (scene) => scene.soundDesignCues || [])) ? _.uniq(_.flatMap(group, (scene) => scene.soundDesignCues || [])) : defaultSoundCues,
      cinematicBeats: validBeats,
      continuityNotes: `Bundled source shots: ${_.join(_.map(group, "id"), ", ")}. ${first.continuityNotes || ""}`,
    };
  });
};

export const applyCinematicContinuityHandoffs = (scenes: StoryboardScene[]): StoryboardScene[] => {
  let previous: StoryboardScene | undefined;
  return _.map(scenes, (source) => {
    const scene = _.cloneDeep(source);
    const sameSequence = previous && _.isEqual(previous.sequenceId || previous.chapterId, scene.sequenceId || scene.chapterId);
    if (!previous || !sameSequence) {
      if (scene.continuityFrom) scene.continuityFrom = "";
      if (scene.cinematicContinuityHandoff) scene.cinematicContinuityHandoff = undefined;
      previous = scene;
      return scene;
    }

    const previousEndState = previous.actionEndState || previous.visibleAction || CINEMATIC_DEFAULTS.PREVIOUS_FINAL_POSE;
    const plannedOpeningState = scene.actionStartState,
      requiredOpeningState = previousEndState;
    const screenDirectionLock = _.includes(["not_applicable", ""], scene.screenDirection || "") ? previous.screenDirection || CINEMATIC_DEFAULTS.STATIC_AXIS : scene.screenDirection || previous.screenDirection || CINEMATIC_DEFAULTS.STATIC_AXIS;
    const eyelineLock = _.isEqual(scene.shotRole, "reaction") ? scene.eyelineDirection || `the reciprocal eyeline established by ${previous.id}` : scene.eyelineDirection || previous.eyelineDirection || CINEMATIC_DEFAULTS.ESTABLISHED_EYELINE;

    scene.continuityFrom = previous.id;
    scene.actionStartState = requiredOpeningState;
    scene.screenDirection = screenDirectionLock;
    scene.eyelineDirection = eyelineLock;
    scene.cinematicContinuityHandoff = {
      previousClipId: previous.id,
      previousEndState,
      requiredOpeningState,
      locationLock: scene.locationState || previous.locationState || scene.locationId || previous.locationId || CINEMATIC_DEFAULTS.LOCATION_LOCK,
      wardrobeLock: scene.wardrobeState || previous.wardrobeState || CINEMATIC_DEFAULTS.WARDROBE_LOCK,
      propLock: scene.propState || previous.propState || CINEMATIC_DEFAULTS.PROP_LOCK,
      screenDirectionLock,
      eyelineLock,
      lightingLock: scene.lighting || previous.lighting || CINEMATIC_DEFAULTS.LIGHTING_LOCK,
    };
    scene.continuityNotes = _.join(_.compact([scene.continuityNotes, `First frame inherits the final state of ${previous.id}: ${previousEndState}.`, plannedOpeningState && !_.isEqual(plannedOpeningState, previousEndState) ? `After the matched cut, continue naturally toward the planned beat: ${plannedOpeningState}.` : ""]), " ");
    previous = scene;
    return scene;
  });
};
