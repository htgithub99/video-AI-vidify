import { OUTLINED_CHARACTERS } from "../outlinedCharacters.js";
import { SCENE_DIRECTION as S } from "../sceneDirection.js";
import { MOTION_PROFILE_MOTION } from "../../motionProfileMotion.js";
import type { MotionIllustrationProfile } from "../types.js";
export const EXPLAINER_ART_DIRECTION: MotionIllustrationProfile = {
  grammar: OUTLINED_CHARACTERS,
  storyContract: S.story,
  planning:
    "Plan clear educational illustrations from the covered lines. People use exactly the history character construction. Use the view each beat asks for; diagram, process, comparison, map, timeline, cutaway and card pictures are drawn when the beat's visual or format asks for them. Labels and arrows convey source-supported information without covering people. Choose one readable moment per picture. Describe posture and support in words; leave drawing coordinates to the drawing AI.",
  design: S.layout,
  drawing: "Draw the complete explanation yourself from scene context. People use the same outlined construction as history. Give diagrams generous spacing and a clear reading order; show people only when relevant. Flat matte colors, clear contours, restrained shading and natural light.",
  hardRules: ["Keep the outlined character construction and the cast identities.", "Draw exactly the people and objects listed in the scene nodes.", "Follow the framing of the requested view.", "Text only through label nodes, in a plain sans-serif.", "Add no fact, arrow or part the covered narration does not support."],
  framing: { detail: "FRAMING detail: the object or mechanism large and centred on a flat tone, parts separated by clean contours; hands only when the action needs them." },
  devices: { map: "DEVICE map: a flat, clean map with few place dots and a clear route arrow.", comparison: "DEVICE comparison: two or more columns or a simple balance with icon-sized items and the exact labels.", card: "DEVICE card: a flat panel with the exact text and one icon.", diagram: "DEVICE diagram: boxes and arrows with generous spacing and a single reading direction." },
  anatomy: S.poses,
  staging: S.layout,
  identity: S.identity,
  closeUps: "Choose framing for the story; a small held object normally remains visible with its owner. Use an insert when the narration needs that detail.",
  text: S.text,
  motion: [S.motion, MOTION_PROFILE_MOTION.explainer.prompt].join("\n"),
  review: S.review,
};
