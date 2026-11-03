import type { MotionIllustrationBrief } from "./types.js";
export const OUTLINED_BRIEF: MotionIllustrationBrief = {
  frame: "CHARACTER SVG FRAME: the small SVG below is this style's character construction and proportions, not the scene canvas. Build every visible person from it: the same rounded head wider than the torso, the compact torso, short arms with small palm-and-thumb hands, short legs with distinct rounded shoes, and the same dark outline weight. Re-articulate the limbs for the pose of the scene (bend the knees to sit or kneel, lift an arm to point or aim) instead of pasting the standing pose. Copy it into a uniquely prefixed group per person and place that person once with an outer translate(x y) scale(s), uniform scale only; never scale head, torso or legs separately. Clothing, hair, headgear and held things come from the brief and the era.",
  rules: [
    "People are soft, compact 2D figures made of closed curved shapes with a dark (#28221f) outer contour on head, torso, arms, hands, legs and shoes; rounded joins; about 3-4px contours at 1280x720, finer inner lines.",
    "A standing figure is about 2.5 head heights; a long garment covers that body instead of lengthening it; distant people keep the same construction, only smaller.",
    "Chin overlaps the collar, shoulders flow into arms, elbows overlap; small expressive eyes with whites; no stick limbs, floating sleeves or pointed hands.",
    "Hair, facial hair, age, headwear, clothes, footwear and carried things follow the brief and the era; named people keep their fixed identifiers in every picture.",
    "Flat matte colours, clear contours, restrained shading and natural light; the setting, architecture and objects are era-correct and drawn by you.",
    "No captions, timestamps or watermarks; visible text only through label nodes with their exact text.",
    "Draw the people and things the brief lists, in the numbers it gives; add nothing the narration does not support.",
  ],
  skin: "Exposed skin (face, hands, arms, legs) is one flat colour per person: the skin named for that person or group in the brief; when none is named use flat white #ffffff. Outlines and facial features stay dark and visible on any skin.",
};
