import { SCENE_DIRECTION as S } from "../sceneDirection.js";
import { HORROR_CHARACTER_DIRECTION as H } from "./characterDirection.js";
import type { MotionIllustrationProfile } from "../types.js";
import { HORROR_BRIEF } from "./brief.js";
export const HORROR_ART_DIRECTION: MotionIllustrationProfile = {
  grammar:
    "HORROR CHARACTER CONSTRUCTION: a large round flat white (#ffffff) mask head with a thick near-black (#08090b) outer contour (about 6-8px at 1280x720), two large solid black vertical oval eyes and a small black oval mouth. No realistic nose, ears, brows, pupils or neck. Head touches a rounded arch/tombstone clothed body with almost vertical sides and one continuous garment base. NO LEGS, FEET OR SHOES in any pose. Use the approved CHARACTER SVG FRAME geometry when supplied. Body width about 1.05-1.15 head diameters, height about 1.65 head diameters; whole standing character about 2.6 head diameters. Rounded simple arms match clothing, resting down unless a source-required gesture needs them raised. Use clean filled closed silhouettes and readable dark outer contours, flat muted colors, few interior details. Hair/headwear may surround the mask when required; do not force baldness. Only this structure is fixed: hair, age, clothes, garment details and accessories follow the story within the continuous silhouette. Children scale the structure down; supernatural figures change palette/transparency when appropriate. Animals keep their own anatomy. No realistic long limbs or history-style human face.",
  brief: HORROR_BRIEF,
  storyContract: S.story,
  planning:
    "Plan atmospheric Vietnamese folk-horror illustrations literally showing the covered lines and actual story people, clothing, setting and props. All people and human-like spirits use a mask head, arms and continuous arch-shaped clothed body: NO LEGS, FEET OR SHOES. Show standing/sitting/kneeling through body orientation and base/support contact, lying through the intact horizontal body. Source mentions of footsteps or legs preserve the event through the lower garment/base without adding limbs. Animals keep their own anatomy. Choose one readable moment. Use the view each beat asks for: establishing for a place without people, close for one mask face carrying fear or a spoken taboo, detail for a household or taboo object, medium for people talking. Do not invent raised arms, ghosts or scary props merely because the genre is horror; the kỳ-truyện devices (a shadow thrown on a wall, an object alone in the dark, incense or cooking smoke, a face lit by one lamp, day against night) are used only when the covered narration itself names the shadow, object, smoke, lamp or hour. Describe posture and support in words; leave drawing coordinates to the drawing AI.",
  design: S.layout,
  hardRules: ["Keep the mask-head, arch-body, legless character construction and the cast identities.", "Draw exactly the people and objects listed in the scene nodes.", "Follow the framing of the requested view.", "No captions, timestamps or watermarks; text only through label nodes.", "Add no ghost, prop or gesture the covered narration does not name."],
  framing: {
    detail: "FRAMING detail: the named household or taboo object alone in a small pool of lamp or moon light, the rest of the frame in muted dark tones; hands with the mask-body construction only when the narration has someone hold it.",
    establishing: "FRAMING establishing: no people; the house, yard, river, bridge or lane under the stated hour, lit by one source (lamp, moon, dawn), muted cold tones, main shapes readable.",
  },
  devices: { card: "DEVICE card: a panel of rough dó paper or coarse cloth with the exact text in a plain handwritten-looking serif on a dark ground.", comparison: "DEVICE comparison: present the supplied people, objects or evidence in comparable positions with exact supplied labels, using the folk-horror visual style and the light required by the story. Choose the layout from the actual comparison. Add a physical scale, offering tray or other symbolic prop only when the source or explicit scene brief requests that object.", map: "DEVICE map: a hand-drawn village sketch on dó paper with the few named places marked.", timeline: "DEVICE timeline: a line of lunar months or years written on a paper strip, the current one circled." },
  drawing: "Draw the complete folk-horror scene yourself using the mask-head rounded-body construction. Muted cold surroundings, flat matte fills, simple outlined architecture and props. Adapt daylight/night to the story; atmospheric darkness must leave the main action readable. No compulsory vignette or haunted-room template.",
  anatomy: H.anatomy,
  staging: S.layout,
  identity: [S.identity, H.identity].join("\n"),
  closeUps: "Choose framing for the story; a small held object normally remains visible with its owner. Use an insert when the narration needs that detail.",
  text: S.text,
  motion: H.motion,
  review: [S.review, H.identity].join("\n"),
};
