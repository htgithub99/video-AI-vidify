import { OUTLINED_CHARACTERS } from "../outlinedCharacters.js";
import { SCENE_DIRECTION as S } from "../sceneDirection.js";
import type { MotionIllustrationProfile } from "../types.js";
export const HISTORY_ART_DIRECTION: MotionIllustrationProfile = {
  grammar: OUTLINED_CHARACTERS,
  storyContract: S.story,
  planning:
    "Plan literal people-centered historical illustrations from the covered lines with source-appropriate era, clothing, objects and locations. Wide for crowds/battles, medium for interaction, close for emotion. Anonymous crowds support the action without invented named identities. Maps/timelines only when needed by narration. Choose one readable moment per scene. Describe posture and support in words; leave drawing coordinates to the drawing AI.",
  design: S.layout,
  drawing: "Draw the complete historical setting and people yourself from scene context. Keep setting spacious and era-appropriate. Flat matte colors, clear contours, restrained shading and natural light.",
  anatomy: S.poses,
  staging: S.layout,
  identity: S.identity,
  closeUps: "Choose framing for the story; a small held object normally remains visible with its owner. Use an insert when the narration needs that detail.",
  text: S.text,
  motion: S.motion,
  review: S.review,
};
