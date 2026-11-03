import type { MotionProfileScene } from "../sceneSpec.js";
import { HORROR_ANIMAL_FRAMES } from "../animalFrames/horror.js";
import { HORROR_OBJECT_FRAMES } from "../objectFrames/horror.js";
import { OUTLINED_SCENE } from "../outlinedScene.js";
export const HORROR_SCENE: MotionProfileScene = {
  identityParts: /(?:^|[_-])(?:heads?|mask|faces?|hair|hat|non|cap|helmet|hood|veil|scarf|khan|headband|headscarf|bun|braid|eyes?|mouth|beard|brows?|scar|earrings?)(?:[_-]|$)/i,
  headPart: /(?:^|[_-])(?:heads?|mask)(?:[_-]|$)/i,
  postures: {
    mounted: "Mounted: the dome body sits on the saddle on the horse's back with its lower part hidden by the horse's body; the hands hold the reins; never standing beside or in front of the horse.",
    dismount: "Dismounting: the dome base already touches the ground beside the horse, one hand still on the saddle or reins.",
    lead: "Leading a horse: the dome body stands at the horse's head, one hand holding slack reins.",
    sit: "Sitting on a chair, bench, crate or bed: the dome base rests on the seat and the body is shorter than standing, about three quarters; the seat stays visible below and around it.",
    sit_ground: "Sitting on the ground: the flat dome base rests on the ground and the body is about half its standing height.",
    kneel: "Kneeling: the dome base rests on the ground, the body is shorter than standing and leans toward the task.",
    crouch: "Crouching: a low dome leaning forward, about two thirds of standing height.",
    slump: "Slumped at a table: the dome body tilts forward at least forty-five degrees and the mask rests on the table top beside the arms.",
    lie: "Lying: the whole dome body is turned horizontal on its support with the mask at one end.",
    carry: "Carrying a shoulder pole: the pole lies across one shoulder of the dome with the loads hanging level and one hand steadying it.",
    walk: "Walking: the dome body leans slightly in the direction of travel and the garment hem flutters; no legs appear.",
    run: "Running: the dome body leans strongly forward with the arms swinging and the hem flying back; no legs appear.",
    hand_over: OUTLINED_SCENE.postures.hand_over!,
    fall: "Falling into water: the lower dome is below the water line and the arms reach up; the person stays fully opaque.",
    back: "Seen from behind: the back of the hair, headgear or mask edge and the dome shoulders fill one side edge at about a third of the frame; a readable silhouette, never a featureless dark blob.",
  },
  standingHeadRatio: 0.39,
  lowPostures: ["sit", "sit_ground", "kneel", "crouch", "slump"],
  shotSizes: {
    close: { head: [0.2, 0.7], top: 0.03 },
    medium_close: { head: [0.12, 0.75], top: 0.03 },
    medium: { head: [0.06, 0.5], top: 0.03 },
  },
  animals: HORROR_ANIMAL_FRAMES,
  objects: HORROR_OBJECT_FRAMES,
  animalNotes: OUTLINED_SCENE.animalNotes,
  ghostOpacity: true,
  legs: "forbidden",
};
