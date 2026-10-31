import { OUTLINED_CHARACTERS } from "../outlinedCharacters.js";
import { SCENE_DIRECTION as S } from "../sceneDirection.js";
import type { MotionIllustrationProfile } from "../types.js";
export const EXPLAINER_ART_DIRECTION: MotionIllustrationProfile = {
  grammar: OUTLINED_CHARACTERS,
  storyContract: S.story,
  planning:
    "Plan clear educational illustrations from the covered lines. People use exactly the history character construction. Use contextual scenes for human actions and diagram/process/comparison/map/cutaway only when it clarifies the subject. Labels and arrows convey source-supported information without covering people. Choose one readable moment per scene. Describe posture and support in words; leave drawing coordinates to the drawing AI.",
  design: S.layout,
  drawing: "Draw the complete explanation yourself from scene context. People use the same outlined construction as history. Give diagrams generous spacing and a clear reading order; show people only when relevant. Flat matte colors, clear contours, restrained shading and natural light.",
  anatomy: S.poses,
  staging: S.layout,
  identity: S.identity,
  closeUps: "Choose framing for the story; a small held object normally remains visible with its owner. Use an insert when the narration needs that detail.",
  text: S.text,
  motion: S.motion,
  review: S.review,
};
