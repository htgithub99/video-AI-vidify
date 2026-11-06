import type { MotionAnimal, MotionProfileScene } from "./sceneSpec.js";
import { OUTLINED_ANIMAL_FRAMES } from "./animalFrames/outlined.js";
import { OUTLINED_OBJECT_FRAMES } from "./objectFrames/outlined.js";
import { OUTLINED_UNIT_FRAMES } from "./unitFrames/outlined.js";
import { MOTION_MORE_ANIMAL_NOTES } from "./animalNotes.js";
export const OUTLINED_SCENE: MotionProfileScene = {
  identityParts: /(?:^|[_-])(?:heads?|faces?|hair|hat|cap|helmet|turban|hood|veil|beard|moustache|mustache|brows?|eyes?|scar|earrings?|crown|wig|bun|ponytail|braid|headband|headscarf)(?:[_-]|$)/i,
  headPart: /(?:^|[_-])heads?(?:[_-]|$)/i,
  postures: {
    mounted: "Mounted: the rider sits in the saddle on the horse's back with the hips on the saddle; the far leg is hidden behind the horse's body and the near leg hangs along its flank; the hands hold the reins near the neck. The rider never stands beside or in front of the horse.",
    dismount: "Dismounting: one foot already on the ground beside the horse, the other leg still crossing the saddle or just landing, one hand on the saddle or reins, the body leaning toward the horse.",
    lead: "Leading a horse: the person stands at the horse's head holding slack reins or a halter rope; the horse follows half a step behind.",
    sit: "Sitting on a chair, bench, crate or bed: the hips rest on the seat surface, thighs roughly level, lower legs down to the floor with the shoes on the ground; the whole figure is about three quarters of its standing height and the seat stays visible under the hips.",
    sit_ground: "Sitting on the ground: hips on the ground with the short legs bent or crossed in front; the whole figure is about half its standing height.",
    kneel: "Kneeling: one or both knees on the ground with the lower legs folded back, torso upright or leaning toward the task; about two thirds of standing height.",
    crouch: "Crouching: knees deeply bent, hips low above the heels, torso leaning forward; about two thirds of standing height.",
    slump: "Slumped: the body sags forward over its support with the head low; at a table the head and folded arms rest on its top, on a horse the rider leans over its neck still seated in the saddle, on the ground the person sits with the torso bent over the knees.",
    lie: "Lying: the whole figure turned horizontal on its support (bed, mat, ground), head at one end; nothing of the body stands upright.",
    carry: "Carrying a shoulder pole or load: the pole rests across one shoulder with both loads hanging level, one hand steadying it, the body leaning slightly under the weight.",
    aim: "Aiming a rifle: the butt against the shoulder, cheek near the stock, the front hand under the barrel and the rear hand at the trigger; the barrel points at the target.",
    walk: "Walking: one leg forward and one back, arms swinging opposite to the legs.",
    run: "Running: torso leaning forward, legs in a long stride, arms bent and swinging.",
    hand_over: "Handing over an object: two people face each other and the object is held between their hands at chest height.",
    fall: "Falling: the body tips off balance toward the ground with the arms flung out and one leg lifting; in water the lower body is below the water line and the arms reach up; the person stays fully opaque and solid.",
    back: "Seen from behind (over the shoulder): the back of the head with hair or headgear, the collar and shoulders fill one side edge at about a third of the frame; a readable silhouette, never a featureless dark blob.",
  },
  standingHeadRatio: 0.41,
  lowPostures: ["sit", "sit_ground", "kneel", "crouch", "slump"],
  shotSizes: {
    close: { head: [0.2, 0.7], top: 0.03 },
    medium_close: { head: [0.12, 0.75], top: 0.03 },
    medium: { head: [0.06, 0.5], top: 0.03 },
  },
  animals: OUTLINED_ANIMAL_FRAMES,
  objects: OUTLINED_OBJECT_FRAMES,
  units: OUTLINED_UNIT_FRAMES,
  animalNotes: {
    ...(MOTION_MORE_ANIMAL_NOTES as Record<MotionAnimal, string>),
    horse: "Horse: the neck is about half the body length and rises from the chest; front knees bend forward, hind hocks bend backward; long head with ears up; a rider sits on saddle_anchor.",
    ox: "Ox or buffalo: heavy barrel body, short thick legs, low head with horns, tail with a tuft.",
    dog: "Dog: walks on its toes, front legs straight, hind legs angled at the hock, tail continues the spine.",
    cat: "Cat: small round head with pointed ears, long curved tail, legs slim and short.",
    bird: "Bird: round body, small head with a beak, two thin legs under the body, wing folded on the side.",
    pig: "Pig: round body, short legs, flat snout disk, small ears, curly tail.",
    goat: "Goat: slim body, thin legs, horns curving back, small beard.",
  },
  ghostOpacity: false,
  legs: "required",
  hatWidth: 1.45,
};
