import type { MotionIllustrationBrief } from "../types.js";
export const HORROR_BRIEF: MotionIllustrationBrief = {
  frame: "CHARACTER SVG FRAMES: the small SVGs below are this style's character construction, not the scene canvas. Build every visible person and human-like spirit from it: the large round flat white mask head with a thick near-black contour, two large solid black vertical oval eyes and a small black oval mouth, arms, and one continuous arch-shaped clothed body with NO legs, feet or shoes. STAND is the base frame; SIT or BACK follow when someone in this scene takes that position and every person line names the frame to start from. Standing puts the garment base on its support, sitting, kneeling and riding put that same intact base on the seat, the ground or the saddle with a shorter body, lying turns the whole intact body horizontal. Copy it into a uniquely prefixed group per person and place that person once with an outer translate(x y) scale(s), uniform scale only. Hair, headgear, clothing colours and accessories come from the brief; animals keep their own anatomy.",
  rules: [
    "Vietnamese folk-horror illustration: muted cold surroundings, flat matte fills, simple outlined architecture and props, one light source (lamp, moon, dawn) where the hour needs it; darkness never hides the main action.",
    "Every human has the mask head and legless arch body; never add legs, knees, feet, shoes or sandals, and never divide the garment into trouser legs.",
    "Fear is shown by the tilt of the mask, the hands and the darkness around, not by changing the mask.",
    "Named people keep their fixed identifiers (hair, headgear, scarf, accessories) in every picture; ghosts and spirits may be translucent, living people are fully opaque. A beard or moustache hugs the mask's jaw and upper lip; the mouth stays visible and it never covers the mask like a second face.",
    "Household and taboo objects are drawn accurately for the village setting of the story; no modern things.",
    "No captions, timestamps or watermarks; visible text only through label nodes with their exact text.",
    "Draw the people and things the brief lists, in the numbers it gives; add no ghost, prop or gesture the narration does not name.",
  ],
  skin: "The mask is always flat white #ffffff. Hands and arms use the skin named for the person in the brief; when none is named they are flat white #ffffff. Contours stay near-black.",
  partIds: ["head", "torso", "arm_left", "arm_right", "hand_left", "hand_right"],
  legs: "No person has legs, knees, feet or shoes: the garment base rests on the ground, the seat or the saddle.",
};
