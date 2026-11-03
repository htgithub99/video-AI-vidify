import { OUTLINED_CHARACTERS } from "../outlinedCharacters.js";
import { SCENE_DIRECTION as S } from "../sceneDirection.js";
import { MOTION_PROFILE_MOTION } from "../../motionProfileMotion.js";
import type { MotionIllustrationProfile } from "../types.js";
export const HISTORY_ART_DIRECTION: MotionIllustrationProfile = {
  grammar: OUTLINED_CHARACTERS,
  storyContract: S.story,
  planning:
    "Plan literal people-centered historical illustrations from the covered lines with source-appropriate era, clothing, objects and locations. Anonymous crowds support the action without invented named identities. Use the view each beat asks for; maps, timelines, comparison devices and cards are drawn when the beat's visual or format asks for them. Choose one readable moment per picture. Describe posture and support in words; leave drawing coordinates to the drawing AI.",
  design: S.layout,
  drawing: "Draw the complete historical setting and people yourself from scene context. Era-appropriate clothing, objects and architecture. Flat matte colors, clear contours, restrained shading and natural light.",
  hardRules: ["Keep the outlined character construction and the cast identities.", "Draw exactly the people and objects listed in the scene nodes.", "Follow the framing of the requested view.", "No captions, timestamps or watermarks; text only through label nodes.", "Add no event, gesture or prop the covered narration does not support."],
  devices: { map: "DEVICE map: an aged parchment map with inked coastlines and a few marked places; routes as drawn lines with small arrowheads.", comparison: "DEVICE comparison: a brass balance scale or a wooden ledger on a plain backdrop; candidate cards as small parchment tags with the exact labels; a candidate figure, when listed, stands beside it in full outlined construction.", card: "DEVICE card: a wooden plaque or parchment panel carrying the exact text in a plain serif.", timeline: "DEVICE timeline: a ribbon of parchment with year markers, the current year highlighted in red ink." },
  anatomy: S.poses,
  staging: S.layout,
  identity: S.identity,
  closeUps: "Choose framing for the story; a small held object normally remains visible with its owner. Use an insert when the narration needs that detail.",
  text: S.text,
  motion: [S.motion, MOTION_PROFILE_MOTION.history.prompt].join("\n"),
  review: S.review,
};
