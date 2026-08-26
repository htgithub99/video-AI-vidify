import _ from "lodash";
import { GenerateType, StoryboardScene } from "../types";

export const createCinematicScreenplayDirective = (language: string, targetDuration: string): string => `
[DEDICATED AI FILM SCREENPLAY CONTRACT]
You are the head screenwriter and story editor for a ${targetDuration} original film, not a narrator-led YouTube video.
- Write playable screen events in ${language === "vi" ? "natural contemporary Vietnamese" : "natural contemporary English"}. Characters must have distinct vocabulary, rhythm, status and subtext appropriate to their world.
- Build a concrete protagonist objective, opposing force, escalating choices, an irreversible midpoint/turn, climax caused by the protagonist's decision, and an earned visual aftermath.
- Open inside a playable situation rather than explaining the world. Reveal lore through what characters attempt, fear, joke about, conceal, discover or pay for. Establish one concrete object, destination, threat or promise early and keep returning to its changing condition until the payoff.
- Build ensemble chemistry through contrast: each recurring character has a recognizable conversational tactic, such as blunt challenge, dry humor, caution, deflection, command or curiosity. Dialogue must change the relationship, plan or available information; never let several characters paraphrase the same fact.
- Alternate pressure and release. After danger, allow a short human reaction, joke, disagreement or practical task; after calm, introduce a visible warning or decision. Humor must emerge from character and circumstance without cancelling real stakes.
- A silent stretch is still dramatic action. Use listening, preparation, spatial exploration, exchanged looks, prop handling and environmental response to create anticipation instead of filling every second with speech.
- Use an A/B story only when the secondary line changes how the main line is understood: for example, heroes discover an objective while an opposing group reveals why it matters. Enter the secondary line on a shared prop, threat, destination or decision and return with new dramatic pressure; never intercut unrelated exposition.
- Every approximately ten-second clip unit contains exactly three chronological, editable camera setups from one continuous event: setup/objective, action/obstacle, consequence/payoff. Each setup changes the visible information; never fill runtime with a person merely walking, looking, standing, holding an object or explaining the plot.
- Select the three-setup coverage by scene function: dialogue uses spatial master -> speaker/prop coverage -> listener reaction or changed decision; discovery uses approach/context -> evidence insert/reveal -> consequence reaction; action uses geography/threat -> decisive contact/evasion -> physical result and new position. Do not force all three characters to move simultaneously and do not cut merely because a timer elapsed.
- VEO-SAFE ACTION DESIGN: Clarity outranks spectacle. Never ask one generated clip to simulate a full battle, long chase, complex martial-arts exchange, crowd collision, vehicle crash, character acrobatics or several simultaneous attacks. Decompose action into three low-complexity shots: (1) readable geography plus threat/intent, (2) one short decisive movement by one foreground subject, preferably partially occluded or ending at contact, (3) a stable aftermath showing changed position, damage, dropped prop, blocked route, escape or reaction. Use inserts, silhouettes, off-screen impact, dust/light/environmental response and production sound to imply scale. The audience must understand the event even when the most complex instant happens between cuts.
- Keep no more than two clearly articulated foreground performers in physical conflict. Other forces remain distant, soft-focus, occluded, silhouetted or represented by their effect on the environment. Use one movement direction and one action axis; keep feet grounded, hand/weapon ownership explicit and the camera stable enough to read anatomy.
- Prefer concise speakable dialogue, interruptions, silence and reactions. No exposition speeches, generic motivational lines, trailer narration, omniscient summary or repeated statement of facts already visible.
- Dialogue must be short enough for natural lip-sync inside its planned shot. Preserve the exact chosen output language and never mix languages unless the story explicitly requires it.
- The finished film must use character dialogue and production sound, never narration or voice-over. Convey exposition through playable conversation, behavior, props and consequences. A beat without dialogue is silent_action with diegetic ambience; off_screen_dialogue is allowed only when the named speaker is physically present in the same location.
- Establish geography before action, preserve prop ownership and wardrobe/damage progression, and design entrances/exits that the next clip can continue.
- Design production sound as narrative information: establish stable room tone, give recurring locations/forces a restrained sonic motif, let footsteps, mechanisms, breath, cloth, weather or distant threats anticipate visible events, and carry ambience across connected clips. Avoid constant trailer music, generic impacts and a whoosh at every cut.
- End each sequence on a changed objective, new danger, discovery, sacrifice or consequence. The ending must pay off the opening dramatic question.
Return the existing required JSON contract only.`;

export const createCinematicVideoPrompt = (
  scene: StoryboardScene,
  basePrompt: string,
  generateType: GenerateType,
): string => {
  if (!_.isEqual(generateType, GenerateType.Video)) return basePrompt;
  const dialogueBeat = _.find(scene.cinematicBeats || [], beat => _.isEqual(beat.dialogueMode, "on_screen_dialogue") && beat.lipSyncRequired);
  const offScreenDialogueBeat = _.find(scene.cinematicBeats || [], beat => _.isEqual(beat.dialogueMode, "off_screen_dialogue") && !_.isEmpty(_.trim(beat.spokenDialogue)));
  const dialogueDirective = dialogueBeat || (_.isEqual(scene.dialogueMode, "on_screen_dialogue") && scene.lipSyncRequired)
    ? `The visible speaker ${dialogueBeat?.speakerCharacterId || scene.speakerCharacterId || "identified in the character plan"} delivers exactly this line with natural synchronized mouth movement and no other spoken words: "${_.trim(dialogueBeat?.spokenDialogue || scene.spokenDialogue || scene.subtitle)}".`
    : offScreenDialogueBeat || _.isEqual(scene.dialogueMode, "off_screen_dialogue")
      ? `The physically present but off-camera speaker ${offScreenDialogueBeat?.speakerCharacterId || scene.speakerCharacterId || "identified in the character plan"} says exactly: "${_.trim(offScreenDialogueBeat?.spokenDialogue || scene.spokenDialogue || scene.subtitle)}". Keep every visible mouth closed and generate no additional words.`
      : "No spoken words, narration, voice-over or lip movement. Use only diegetic production sound and ambience motivated by the visible action.";
  const beats = scene.cinematicBeats || [];
  const handoff = scene.cinematicContinuityHandoff;
  const bundledShotDirective = beats.length === 3
    ? `Create one ten-second cinematic clip containing exactly ${beats.length} chronological camera setups and exactly two motivated cuts from the same continuous story event. ${_.join(_.map(beats, (beat, index) => `Seconds ${_.defaultTo(beat.startSecond, index === 0 ? 0 : undefined)}-${_.defaultTo(beat.endSecond, index === beats.length - 1 ? 10 : undefined)}, shot ${index + 1}: ${beat.shotSize}, ${beat.cameraAngle}, ${beat.shotRole}; ${beat.visibleAction}${beat.reaction ? `; reaction: ${beat.reaction}` : ""}${index < beats.length - 1 ? `; then ${beats[index + 1].transition}` : "; finish on the visible consequence or decision"}.`), " ")} Each shot must add new visible story information and begin from the observable result of the preceding shot. The viewer must understand the action, change and final consequence without narration. No dissolve, flash, whip-pan, camera shake or decorative transition.`
    : `INVALID FILM PLAN: do not generate this clip unless exactly three AI-authored chronological camera setups are supplied.`;
  return _.join(_.compact([
    basePrompt,
    bundledShotDirective,
    handoff ? `EDIT CONTINUITY BRIDGE FROM ${handoff.previousClipId}: The opening 0.5-1.0 seconds must match the previous clip's final moment, not reset the scene. Previous end state: ${handoff.previousEndState}. Required opening state: ${handoff.requiredOpeningState}. Preserve set geography: ${handoff.locationLock}; wardrobe and wear: ${handoff.wardrobeLock}; prop ownership, hand and condition: ${handoff.propLock}; screen direction: ${handoff.screenDirectionLock}; eyeline: ${handoff.eyelineLock}; motivated light direction and exposure: ${handoff.lightingLock}. Continue the action only after this visual match.` : "",
    `Begin with ${scene.actionStartState || "the established opening pose and environment state"}; stage ${scene.characterBlocking || scene.visibleAction}; preserve eyeline ${scene.eyelineDirection || "established by the scene"} and screen direction ${scene.screenDirection || "without crossing the action axis"}; end with ${scene.actionEndState || "one clean readable completed action"}.`,
    `Continuity locks: location ${scene.locationState || scene.locationId || "unchanged"}; wardrobe ${scene.wardrobeState || "unchanged"}; props ${scene.propState || _.join(scene.propIds || [], ", ") || "unchanged"}. Do not add, remove, swap or teleport characters, wardrobe, weapons or props during the shot.`,
    "For any physical action, prioritize readable story causality over spectacle: no prolonged combat choreography, acrobatics, crowd collision, simultaneous attacks or complex body-to-body grappling. Show threat and geography, one short decisive foreground movement, then a stable visible aftermath. The hardest impact may occur between cuts and be communicated by reaction, displaced prop, dust, light, sound or changed position. Keep at most two clear foreground performers, one movement direction and grounded anatomy.",
    dialogueDirective,
    !_.isEmpty(scene.soundDesignCues) ? `Visible timing should support these production sound beats: ${_.join(scene.soundDesignCues, "; ")}. Maintain one coherent room-tone bed across all three setups, let motivated sound anticipate or confirm the visible action, and do not generate unrelated music, impacts or dialogue.` : "",
    beats.length === 3
      ? "Keep stable facial identity, wardrobe, props, lighting direction, geography and action continuity across every internal cut. Preserve physically possible body mechanics: no sliding feet, reversed motion, impossible hand swaps, object teleportation, morphing, duplicated action, location change, montage or embedded subtitles. Each next setup begins from the observable result of the previous setup."
      : "Do not generate an incomplete film plan.",
  ]), " ");
};
