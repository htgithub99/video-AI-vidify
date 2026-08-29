import _ from "lodash";
import { CINEMATIC_DEFAULT_DIEGETIC_SFX, CINEMATIC_DEFAULT_SCENE_CONTEXT, CINEMATIC_POLICY_CONFIG, CINEMATIC_SCREENPLAY_CONTRACT_DIRECTIVE, CINEMATIC_TECHNICAL_FOUNDATION, CINEMATIC_TEXT_FREE_POLICY, resolveCinematicClipDuration } from "../constants/cinematicConstants";
import { GenerateType, StoryboardScene } from "../types";

const resolveBeatCount = (beats: StoryboardScene["cinematicBeats"]): number => {
  const count = _.size(beats);
  return count >= CINEMATIC_POLICY_CONFIG.MIN_BEAT_COUNT && count <= CINEMATIC_POLICY_CONFIG.MAX_BEAT_COUNT ? count : CINEMATIC_POLICY_CONFIG.MIN_BEAT_COUNT;
};

const buildSceneContextBlock = (scene: StoryboardScene): string => {
  const contextParts = _.compact([scene.characterBlocking, scene.locationState, scene.lighting ? `Lighting: ${scene.lighting}.` : ""]);
  return !_.isEmpty(contextParts) ? _.join(contextParts, " ") : CINEMATIC_DEFAULT_SCENE_CONTEXT;
};

const buildSequenceHeader = (beatCount: number, cutCount: number, clipDurationSeconds: number): string => `Create one continuous ${clipDurationSeconds}-second cinematic sequence with exactly ${beatCount} chronological shots and exactly ${cutCount} motivated cuts.`;

const formatSingleBeat = (beat: NonNullable<StoryboardScene["cinematicBeats"]>[number], index: number, beatCount: number, clipDurationSeconds: number): string => {
  const duration = clipDurationSeconds;
  const start = _.defaultTo(beat.startSecond, Number(((index * duration) / beatCount).toFixed(1)));
  const end = _.defaultTo(beat.endSecond, index === beatCount - 1 ? duration : Number((((index + 1) * duration) / beatCount).toFixed(1)));
  const shotSize = beat.shotSize || "Medium";
  const cameraAngle = beat.cameraAngle || "eye level";
  const shotLabel = `**${start}s–${end}s — Shot ${index + 1}: ${shotSize}, ${cameraAngle}**`;
  const actionDesc = _.trim(beat.visibleAction) || `Execute continuous narrative action for shot ${index + 1}.`;
  const reactionDesc = beat.reaction ? ` ${beat.reaction}.` : "";
  return `${shotLabel}\n${actionDesc}${reactionDesc}`;
};

const buildShotDescriptionsBlock = (beats: StoryboardScene["cinematicBeats"], beatCount: number, clipDurationSeconds: number): string => {
  const safeBeats = beats || [];
  return _.join(
    _.map(safeBeats, (beat, index) => formatSingleBeat(beat, index, beatCount, clipDurationSeconds)),
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

const buildNegativeConstraintsBlock = (beatCount: number, cutCount: number): string => `Exactly ${beatCount} shots. Exactly ${cutCount} clean motivated cuts. No extra shots, montage, location reset, repeated action, camera shake, whip-pan, dissolve, flash transition, crash zoom, morphing, duplicated characters, extra limbs, distorted face, wardrobe or weapon changes.`;

const buildAudioBlock = (scene: StoryboardScene, beats: StoryboardScene["cinematicBeats"]): string => {
  const dialogueBeat = _.find(beats, (b) => _.isEqual(b.dialogueMode, "on_screen_dialogue") && b.lipSyncRequired);
  const spokenLine = _.trim(dialogueBeat?.spokenDialogue || scene.spokenDialogue || "");
  const speakerId = dialogueBeat?.speakerCharacterId || scene.speakerCharacterId || "the active character";
  const sfxCues = !_.isEmpty(scene.soundDesignCues) ? _.join(scene.soundDesignCues, ", ") : CINEMATIC_DEFAULT_DIEGETIC_SFX;

  if (!_.isEmpty(spokenLine)) {
    return `Dialogue: The visible speaker ${speakerId} delivers exactly this line with natural synchronized lip movement: "${spokenLine}". Ambient sound: Only natural diegetic sound (${sfxCues}). No narration, voice-over, or unrelated background music.`;
  }
  return `No dialogue, narration, voice-over, lip movement or background music. Only natural diegetic ambience and physical interactions: ${sfxCues}.`;
};

export const createCinematicScreenplayDirective = (language: string, targetDuration: string): string => CINEMATIC_SCREENPLAY_CONTRACT_DIRECTIVE(language, targetDuration);

export const createCinematicVideoPrompt = (scene: StoryboardScene, basePrompt: string, generateType: GenerateType, requestedDuration?: string | number): string => {
  if (!_.isEqual(generateType, GenerateType.Video)) return basePrompt;

  const beats = scene.cinematicBeats || [];
  const beatCount = resolveBeatCount(beats);
  const cutCount = beatCount - 1;
  const clipDurationSeconds = resolveCinematicClipDuration(requestedDuration || scene.duration);

  return _.join([CINEMATIC_TECHNICAL_FOUNDATION, buildSceneContextBlock(scene), buildSequenceHeader(beatCount, cutCount, clipDurationSeconds), buildShotDescriptionsBlock(beats, beatCount, clipDurationSeconds), buildContinuityBlock(scene), buildNegativeConstraintsBlock(beatCount, cutCount), buildAudioBlock(scene, beats), CINEMATIC_TEXT_FREE_POLICY], "\n\n");
};
