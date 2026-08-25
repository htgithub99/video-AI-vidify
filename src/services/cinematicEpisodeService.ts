import _ from "lodash";
import { GenerateType, StoryboardScene } from "../types";

export const createCinematicVideoPrompt = (
  scene: StoryboardScene,
  basePrompt: string,
  generateType: GenerateType,
): string => {
  if (!_.isEqual(generateType, GenerateType.Video)) return basePrompt;
  const dialogueBeat = _.find(scene.cinematicBeats || [], beat => _.isEqual(beat.dialogueMode, "on_screen_dialogue") && beat.lipSyncRequired);
  const dialogueDirective = dialogueBeat || (_.isEqual(scene.dialogueMode, "on_screen_dialogue") && scene.lipSyncRequired)
    ? `The visible speaker ${dialogueBeat?.speakerCharacterId || scene.speakerCharacterId || "identified in the character plan"} delivers exactly this line with natural synchronized mouth movement and no other spoken words: "${_.trim(dialogueBeat?.spokenDialogue || scene.spokenDialogue || scene.subtitle)}".`
    : "No invented speech or lip movement; preserve narration-led performance.";
  const beats = scene.cinematicBeats || [];
  const handoff = scene.cinematicContinuityHandoff;
  const bundledShotDirective = beats.length > 1
    ? `Create one ten-second cinematic clip containing exactly ${beats.length} chronological camera setups from the same readable story event. ${_.join(_.map(beats, (beat, index) => `Seconds ${_.defaultTo(beat.startSecond, index === 0 ? 0 : undefined)}-${_.defaultTo(beat.endSecond, index === beats.length - 1 ? 10 : undefined)}, Beat ${index + 1}: ${beat.shotSize}, ${beat.cameraAngle}, ${beat.shotRole}; ${beat.visibleAction}${beat.reaction ? `; visible reaction and performance: ${beat.reaction}` : ""}${index < beats.length - 1 ? `; cut by ${beats[index + 1].transition} into new story information` : "; end on a clear consequence or decision"}.`), " ")} The viewer must understand who acts, what changes, and why the final image matters without narration. Cuts must feel motivated by action or eyeline, with no dissolve, flash, whip-pan, shake, or decorative transition.`
    : `Single continuous cinematic shot ${scene.shotId || scene.id} in sequence ${scene.sequenceId || scene.chapterId || "main"}; role: ${scene.shotRole || "coverage"}.`;
  return _.join(_.compact([
    basePrompt,
    bundledShotDirective,
    handoff ? `EDIT CONTINUITY BRIDGE FROM ${handoff.previousClipId}: The opening 0.5-1.0 seconds must match the previous clip's final moment, not reset the scene. Previous end state: ${handoff.previousEndState}. Required opening state: ${handoff.requiredOpeningState}. Preserve set geography: ${handoff.locationLock}; wardrobe and wear: ${handoff.wardrobeLock}; prop ownership, hand and condition: ${handoff.propLock}; screen direction: ${handoff.screenDirectionLock}; eyeline: ${handoff.eyelineLock}; motivated light direction and exposure: ${handoff.lightingLock}. Continue the action only after this visual match.` : "",
    `Begin with ${scene.actionStartState || "the established opening pose and environment state"}; stage ${scene.characterBlocking || scene.visibleAction}; preserve eyeline ${scene.eyelineDirection || "established by the scene"} and screen direction ${scene.screenDirection || "without crossing the action axis"}; end with ${scene.actionEndState || "one clean readable completed action"}.`,
    `Continuity locks: location ${scene.locationState || scene.locationId || "unchanged"}; wardrobe ${scene.wardrobeState || "unchanged"}; props ${scene.propState || _.join(scene.propIds || [], ", ") || "unchanged"}. Do not add, remove, swap or teleport characters, wardrobe, weapons or props during the shot.`,
    dialogueDirective,
    !_.isEmpty(scene.soundDesignCues) ? `Visible timing should support these production sound beats: ${_.join(scene.soundDesignCues, "; ")}. Do not generate unrelated music, impacts or dialogue.` : "",
    beats.length > 1
      ? "Keep stable facial identity, wardrobe, props, lighting direction, geography and action continuity across every internal cut. No morphing, no duplicated action, no location change, no montage and no embedded subtitles."
      : "Use physically continuous body motion, stable facial identity, consistent lighting and geometry, one camera move at most, no morphing, no jump cuts, no scene change, no montage and no embedded subtitles.",
  ]), " ");
};
