import type { MotionIllustrationBrief } from "./types.js";
export const OUTLINED_BRIEF: MotionIllustrationBrief = {
  frame:
    "CHARACTER SVG FRAMES: the small SVGs below are this style's character construction and proportions, not the scene canvas. STAND is the base frame; WALK, KNEEL, SIT, RIDE or BACK follow when someone in this scene takes that position, and every person line names the frame to start from (STAND when none is named). Build every visible person from the named frame: the same rounded head wider than the torso, the compact torso, short arms with small palm-and-thumb hands, legs made of thigh, shin and rounded shoe, and the same dark outline weight; bend limbs only at the drawn hip, knee, ankle, shoulder and elbow. Copy the frame into a uniquely prefixed group per person and place that person once with an outer translate(x y) scale(s), uniform scale only; never scale head, torso or legs separately. Clothing, hair, headgear and held things come from the brief and the era; trousers, gaiters, boots and stripes are drawn inside that person's legs group.",
  rules: [
    "People are soft, compact 2D figures made of closed curved shapes with a dark (#28221f) outer contour on head, torso, arms, hands, legs and shoes; rounded joins; about 3-4px contours at 1280x720, finer inner lines.",
    "A standing figure is about 2.5 head heights with the head wider than the torso and short arms and legs; a long garment covers that body instead of lengthening it; distant people keep the same construction, only smaller.",
    "Chin overlaps the collar, shoulders flow into arms, elbows and knees overlap; no stick limbs, floating sleeves or pointed hands.",
    "Keep the frame's head outline, eyes with whites, brows, nose and mouth; a close view is the same head scaled up; add no ears, wrinkles, hatching or stubble texture.",
    "Fixed identifiers are at most three simple flat shapes on the head (hair, beard or moustache, scar, glasses), each one or two closed shapes; a hat brim sits above the brows and is at most 1.3 times the head width. A beard or moustache hugs the jaw and upper lip in the hair colour with a few inner strands; the mouth stays visible and it never covers the cheeks like a mask.",
    "Hair, facial hair, age, headwear, clothes, footwear and carried things follow the brief and the era; named people keep their fixed identifiers in every picture.",
    "Flat matte colours, clear contours, restrained shading and natural light; the setting, architecture and objects are era-correct and drawn by you.",
    "No captions, timestamps or watermarks; visible text only through label nodes with their exact text.",
    "Draw the people and things the brief lists, in the numbers it gives; add nothing the narration does not support.",
  ],
  skin: "Exposed skin (face, hands, arms, legs) is one flat colour per person: exactly the skin colour code given for that person or group in the brief, the same in every picture. Outlines and facial features stay dark and visible on any skin.",
  partIds: ["head", "torso", "arm_left", "arm_right", "hand_left", "hand_right", "legs"],
  legs: "Every whole person in this picture shows both legs and shoes: standing shoes rest on the ground, a seated person's shoes rest on the floor, a rider's near leg hangs along the animal's flank; no leg is cut by the bottom edge or lost behind a garment.",
};
