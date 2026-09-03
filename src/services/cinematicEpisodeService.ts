import _ from "lodash";
import {
  CINEMATIC_ACTION_CHOREOGRAPHY_PROMPT_POLICY,
  CINEMATIC_DEFAULT_DIEGETIC_SFX,
  CINEMATIC_DEFAULT_SCENE_CONTEXT,
  CINEMATIC_PLATFORM_SAFE_ACTION_POLICY,
  CINEMATIC_POLICY_CONFIG,
  CINEMATIC_SCREENPLAY_CONTRACT_DIRECTIVE,
  CINEMATIC_TECHNICAL_FOUNDATION,
  CINEMATIC_TEXT_FREE_POLICY,
  hasCinematicCombatAction,
  resolveCinematicClipDuration,
} from "../constants/cinematicConstants";
import { GenerateType, StoryboardScene } from "../types";
import { ASPECT_RATIO_PARAM_REGEX } from "../constants/regexes";
import { CharacterConfig } from "../types";
import { createCharacterIdentityBlocks, resolveSceneCharacterIds } from "./sceneReferenceService";

const resolveBeatCount = (beats: StoryboardScene["cinematicBeats"]): number => {
  const count = _.size(beats);
  return count >= CINEMATIC_POLICY_CONFIG.MIN_BEAT_COUNT && count <= CINEMATIC_POLICY_CONFIG.MAX_BEAT_COUNT ? count : CINEMATIC_POLICY_CONFIG.MIN_BEAT_COUNT;
};

const normalizeComparablePromptText = (value?: string): string => _.toLower(_.trimEnd(_.trim(value), "."));

const buildSceneContextBlock = (scene: StoryboardScene): string => {
  const characterBlocking = _.isEqual(normalizeComparablePromptText(scene.characterBlocking), normalizeComparablePromptText(scene.script)) ? "" : scene.characterBlocking;
  const contextParts = _.compact([characterBlocking, scene.locationState, scene.lighting ? `Lighting: ${scene.lighting}.` : ""]);
  return !_.isEmpty(contextParts) ? _.join(contextParts, " ") : CINEMATIC_DEFAULT_SCENE_CONTEXT;
};

const buildCreativeBriefBlock = (scene: StoryboardScene, basePrompt: string): string => {
  const creativeBrief = _.trim(_.replace(basePrompt || scene.prompt, ASPECT_RATIO_PARAM_REGEX, ""));
  return _.isEmpty(creativeBrief) ? "" : `Creative brief: ${creativeBrief}`;
};

const buildSequenceHeader = (beatCount: number, cutCount: number, clipDurationSeconds: number): string =>
  `Create one continuous ${clipDurationSeconds}-second cinematic sequence with exactly ${beatCount} chronological shots and exactly ${cutCount} motivated cuts.`;

const resolveSpeakerName = (speakerCharacterId: string | undefined, characters: CharacterConfig[]): string =>
  _.find(characters, { id: speakerCharacterId })?.name || "the named visible character";

const formatSingleBeat = (
  beat: NonNullable<StoryboardScene["cinematicBeats"]>[number],
  index: number,
  beatCount: number,
  clipDurationSeconds: number,
  characters: CharacterConfig[],
): string => {
  const duration = clipDurationSeconds;
  const start = _.defaultTo(beat.startSecond, Number(((index * duration) / beatCount).toFixed(1)));
  const end = _.defaultTo(beat.endSecond, index === beatCount - 1 ? duration : Number((((index + 1) * duration) / beatCount).toFixed(1)));
  const shotSize = beat.shotSize || "Medium";
  const cameraAngle = beat.cameraAngle || "eye level";
  const shotLabel = `**${start}s–${end}s — Shot ${index + 1}: ${shotSize}, ${cameraAngle}**`;
  const actionDesc = _.trim(beat.visibleAction) || `Execute continuous narrative action for shot ${index + 1}.`;
  const normalizedAction = normalizeComparablePromptText(actionDesc);
  const normalizedReaction = normalizeComparablePromptText(beat.reaction);
  const reactionDesc = !_.isEmpty(normalizedReaction) && !_.isEqual(normalizedReaction, normalizedAction) ? ` ${beat.reaction}.` : "";
  const dialogue = _.trim(beat.spokenDialogue);
  const dialogueDesc = !_.isEmpty(dialogue)
    ? ` During this shot, ${resolveSpeakerName(beat.speakerCharacterId, characters)} says exactly: "${dialogue}"${beat.lipSyncRequired ? " with natural synchronized lip movement" : " while physically present in the same location"}. No other character speaks.`
    : "";
  const continuityHandoff = index > 0 ? `Continue directly from Shot ${index}. ` : "";
  return `${shotLabel}\n${continuityHandoff}${actionDesc}${reactionDesc}${dialogueDesc}`;
};

const buildShotDescriptionsBlock = (beats: StoryboardScene["cinematicBeats"], beatCount: number, clipDurationSeconds: number, characters: CharacterConfig[]): string => {
  const safeBeats = beats || [];
  return _.join(
    _.map(safeBeats, (beat, index) => formatSingleBeat(beat, index, beatCount, clipDurationSeconds, characters)),
    "\n\n",
  );
};

const buildContinuityBlock = (scene: StoryboardScene): string => {
  const wardLock = scene.wardrobeState ? ` (${scene.wardrobeState})` : "";
  const propLock = scene.propState ? ` (${scene.propState})` : "";
  const locLock = scene.locationState ? ` (${scene.locationState})` : "";
  const screenDir = scene.screenDirection ? `, screen direction ${scene.screenDirection}` : "";
  const eyeline = scene.eyelineDirection ? `, eyeline ${scene.eyelineDirection}` : "";
  return `Maintain identical character identity, face, hairstyle, wardrobe${wardLock}, weapon and props${propLock}, lighting direction, geography${locLock}${eyeline}${screenDir} across all shots.`;
};

const buildCharacterIdentityBlock = (scene: StoryboardScene, characters: CharacterConfig[]): string => {
  const charactersById = _.keyBy(characters, "id");
  const visibleCharacters = _.compact(_.map(resolveSceneCharacterIds(scene, characters), (characterId) => charactersById[characterId]));
  if (_.isEmpty(visibleCharacters)) return "";
  return `${createCharacterIdentityBlocks(visibleCharacters)}\nThe attached character images are identity-only references. Preserve these faces, hair, body builds and distinguishing features exactly; the current prompt controls pose, action, wardrobe, props, location and lighting. Do not copy a reference pose or reference background.`;
};

const buildNegativeConstraintsBlock = (beatCount: number, cutCount: number): string =>
  `Exactly ${beatCount} shots. Exactly ${cutCount} clean motivated cuts. No extra shots, montage, location reset, repeated action, camera shake, whip-pan, dissolve, flash transition, crash zoom, morphing, duplicated characters, extra limbs, distorted face, wardrobe or weapon changes.`;

const buildAudioBlock = (scene: StoryboardScene, beats: StoryboardScene["cinematicBeats"], characters: CharacterConfig[]): string => {
  const dialogueBeat = _.find(beats, (b) => _.isEqual(b.dialogueMode, "on_screen_dialogue") && b.lipSyncRequired);
  const spokenLine = _.trim(dialogueBeat?.spokenDialogue || scene.spokenDialogue || "");
  const speakerName = resolveSpeakerName(dialogueBeat?.speakerCharacterId || scene.speakerCharacterId, characters);
  const sfxCues = !_.isEmpty(scene.soundDesignCues) ? _.join(scene.soundDesignCues, ", ") : CINEMATIC_DEFAULT_DIEGETIC_SFX;

  if (!_.isEmpty(spokenLine)) {
    return `Dialogue lock: ${speakerName} is the only speaker and audibly delivers exactly "${spokenLine}" in the selected language. Preserve natural performance, complete words and synchronized lips. Ambient sound: only natural diegetic sound (${sfxCues}). No narrator, voice-over, third-person commentary, translated duplicate, extra dialogue or unrelated background music.`;
  }
  return `No dialogue, narration, voice-over, lip movement or background music. Only natural diegetic ambience and physical interactions: ${sfxCues}.`;
};

const buildActionPolicyBlock = (scene: StoryboardScene, beats: StoryboardScene["cinematicBeats"]): string => {
  const choreographyText = _.join(
    _.compact([scene.script, scene.visibleAction, scene.reaction, scene.actionStartState, scene.actionEndState, ..._.flatMap(beats || [], (beat) => [beat.visibleAction, beat.reaction])]),
    " ",
  );
  return hasCinematicCombatAction(choreographyText)
    ? _.join([CINEMATIC_ACTION_CHOREOGRAPHY_PROMPT_POLICY, CINEMATIC_PLATFORM_SAFE_ACTION_POLICY], " ")
    : CINEMATIC_PLATFORM_SAFE_ACTION_POLICY;
};

export const createCinematicScreenplayDirective = (language: string, targetDuration: string): string => CINEMATIC_SCREENPLAY_CONTRACT_DIRECTIVE(language, targetDuration);

export const createCinematicVideoPrompt = (
  scene: StoryboardScene,
  basePrompt: string,
  generateType: GenerateType,
  requestedDuration?: string | number,
  characters: CharacterConfig[] = [],
): string => {
  if (!_.isEqual(generateType, GenerateType.Video)) return basePrompt;

  const beats = scene.cinematicBeats || [];
  const beatCount = resolveBeatCount(beats);
  const cutCount = beatCount - 1;
  const clipDurationSeconds = resolveCinematicClipDuration(requestedDuration || scene.duration);

  return _.join(
    [
      CINEMATIC_TECHNICAL_FOUNDATION,
      buildCreativeBriefBlock(scene, basePrompt),
      buildCharacterIdentityBlock(scene, characters),
      buildSceneContextBlock(scene),
      buildSequenceHeader(beatCount, cutCount, clipDurationSeconds),
      buildShotDescriptionsBlock(beats, beatCount, clipDurationSeconds, characters),
      buildContinuityBlock(scene),
      buildNegativeConstraintsBlock(beatCount, cutCount),
      buildAudioBlock(scene, beats, characters),
      buildActionPolicyBlock(scene, beats),
      CINEMATIC_TEXT_FREE_POLICY,
    ],
    "\n\n",
  );
};
