import { SCENE_DIRECTION as S } from "../sceneDirection.js";
import { HORROR_CHARACTER_DIRECTION as H } from "./characterDirection.js";
import type { MotionIllustrationProfile } from "../types.js";
export const HORROR_ART_DIRECTION: MotionIllustrationProfile = {
  grammar:
    "HORROR CHARACTER CONSTRUCTION: a large round flat white (#ffffff) mask head with a thick near-black (#08090b) outer contour (about 6-8px at 1280x720), two large solid black vertical oval eyes and a small black oval mouth. No realistic nose, ears, brows, pupils or neck. Head touches a rounded arch/tombstone clothed body with almost vertical sides and one continuous garment base. NO LEGS, FEET OR SHOES in any pose. Use the approved CHARACTER SVG FRAME geometry when supplied. Body width about 1.05-1.15 head diameters, height about 1.65 head diameters; whole standing character about 2.6 head diameters. Rounded simple arms match clothing, resting down unless a source-required gesture needs them raised. Use clean filled closed silhouettes and readable dark outer contours, flat muted colors, few interior details. Hair/headwear may surround the mask when required; do not force baldness. Only this structure is fixed: hair, age, clothes, garment details and accessories follow the story within the continuous silhouette. Children scale the structure down; supernatural figures change palette/transparency when appropriate. Animals keep their own anatomy. No realistic long limbs or history-style human face.",
  storyContract: S.story,
  planning:
    "Plan atmospheric Vietnamese folk-horror illustrations literally showing the covered lines and actual story people, clothing, setting and props. All people and human-like spirits use a mask head, arms and continuous arch-shaped clothed body: NO LEGS, FEET OR SHOES. Show standing/sitting/kneeling through body orientation and base/support contact, lying through the intact horizontal body. Source mentions of footsteps or legs preserve the event through the lower garment/base without adding limbs. Animals keep their own anatomy. Choose one readable moment. Use wide views for places and medium views for interaction. Do not invent raised arms, ghosts or scary props merely because the genre is horror. Describe posture and support in words; leave drawing coordinates to the drawing AI.",
  design: S.layout,
  drawing: "Draw the complete folk-horror scene yourself using the mask-head rounded-body construction. Muted cold surroundings, flat matte fills, simple outlined architecture and props. Adapt daylight/night to the story; atmospheric darkness must leave the main action readable. No compulsory vignette or haunted-room template.",
  anatomy: H.anatomy,
  staging: S.layout,
  identity: [S.identity, H.identity].join("\n"),
  closeUps: "Choose framing for the story; a small held object normally remains visible with its owner. Use an insert when the narration needs that detail.",
  text: S.text,
  motion: H.motion,
  review: [S.review, H.identity].join("\n"),
};
