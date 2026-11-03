export const MOTION_POSTURES = ["stand", "sit", "sit_ground", "kneel", "crouch", "slump", "lie", "mounted", "dismount", "lead", "carry", "aim", "walk", "run", "hand_over", "fall", "back"] as const;
export type MotionPosture = (typeof MOTION_POSTURES)[number];
export const MOTION_ANIMALS = ["horse", "ox", "dog", "cat", "bird", "pig", "goat"] as const;
export type MotionAnimal = (typeof MOTION_ANIMALS)[number];
export const MOTION_FACINGS = ["front", "side", "back"] as const;
export type MotionFacing = (typeof MOTION_FACINGS)[number];
export const MOTION_GAITS = ["stand", "walk", "run", "gallop", "lie", "fly"] as const;
export type MotionGait = (typeof MOTION_GAITS)[number];
export const MOTION_DETAIL_SUBJECTS = ["face", "handsWithObject", "object", "document", "map", "bodyPart"] as const;
export type MotionDetailSubject = (typeof MOTION_DETAIL_SUBJECTS)[number];
export const MOTION_SHOT_SIZES = ["close", "medium_close", "medium"] as const;
export type MotionShotSize = (typeof MOTION_SHOT_SIZES)[number];
export interface MotionShotFrame {
  head: readonly [number, number];
  top: number;
}
export interface MotionProfileScene {
  identityParts: RegExp;
  headPart: RegExp;
  postures: Partial<Record<MotionPosture, string>>;
  standingHeadRatio: number;
  lowPostures: readonly MotionPosture[];
  shotSizes: Record<MotionShotSize, MotionShotFrame>;
  animals: Record<MotionAnimal, string>;
  animalNotes: Record<MotionAnimal, string>;
  ghostOpacity: boolean;
  legs: "required" | "forbidden";
  hatWidth?: number;
}
const B = "(?<![\\p{L}\\p{N}-])";
const E = "(?![\\p{L}\\p{N}])";
const word = (body: string): RegExp => new RegExp(`${B}(?:${body})${E}`, "iu");
export const MOTION_SCENE_SPEC = {
  POSTURE_MATCH: [
    ["dismount", word("dismount\\w*|gets? off (?:the|his|her) horse|climbs? down from (?:the|his|her) horse|xuống ngựa")],
    ["lead", word("leads? (?:the|a|his|her|their) horses?|leading (?:the|a|his|her|their) horses?|holding (?:the |his |her |their )?horses? (?:at|by) the reins?|at the reins?|dắt ngựa")],
    ["mounted", word("riding|rides|ridden|mounted|on horseback|astride|in the saddle|from (?:the|their|his|her) saddles?|gallop\\w*|trott\\w*|cavalry|cavalrym[ae]n|horsem[ae]n|riders?|lancers?|dragoons?|hussars?|on (?:his|her|their) (?:horses?|mounts?|chargers?)|kỵ binh|cưỡi ngựa|cưỡi|trên lưng ngựa")],
    ["slump", word("slump\\w*|head (?:down )?on the table|asleep (?:at|over) the table|collapsed over the table|gục(?: đầu)?(?: xuống)? bàn|gục")],
    ["lie", word("lying|lies|lie down|laid|asleep|sleeping|collaps\\w*|crumpl\\w*|fallen|falls? (?:dead|backward|backwards|forward|down|to the ground)|spins? and falls?|prone|supine|reclin\\w*|nằm|ngủ say|ngủ|ngã xuống|gục ngã")],
    ["kneel", word("kneel\\w*|knelt|on (?:his|her|their|one|both) knees?|quỳ")],
    ["crouch", word("crouch\\w*|squat\\w*|duck(?:s|ing)?|hunched low|ngồi xổm|khom người|lom khom")],
    ["sit_ground", word("sits? on the ground|sitting on the ground|cross-legged|on the floor|ngồi bệt|ngồi xếp bằng|ngồi dưới đất")],
    ["sit", word("sits?|sitting|seated|sat|ngồi")],
    ["fall", word("falls? into|falling into|plung\\w*|drown\\w*|sinking|submerged|ngã xuống nước|chìm|đuối nước|rơi xuống nước")],
    ["carry", word("shoulder pole|carr(?:y|ies|ying) (?:a|the) (?:load|pole|basket|sack)|gánh|quảy|vác")],
    ["aim", word("aim\\w*|takes? aim|levels? (?:his|her|the|a) (?:rifle|musket|gun)|ngắm bắn|nhắm bắn")],
    ["run", word("run|runs|running|ran|sprint\\w*|flee\\w*|fled|charg\\w*|chạy")],
    ["walk", word("walk\\w*|march\\w*|strid\\w*|trudg\\w*|đi bộ|bước đi|hành quân")],
    ["hand_over", word("hand(?:s|ing)? (?:over|him|her|the)|giv(?:e|es|ing)|deliver\\w*|offer\\w*|trao|đưa cho")],
    ["back", word("from behind|back to (?:the )?camera|seen from behind|turn(?:s|ing)? (?:his|her|their) back|quay lưng")],
  ] as const,
  ANIMAL_MATCH: [
    ["horse", word("horses?|stallions?|mares?|pon(?:y|ies)|steeds?|mounts?|ngựa")],
    ["ox", word("ox|oxen|cattle|cows?|bulls?|buffalo\\w*|trâu|bò")],
    ["dog", word("dogs?|hounds?|pupp(?:y|ies)|chó")],
    ["cat", word("cats?|kittens?|mèo")],
    ["goat", word("goats?|dê")],
    ["pig", word("pigs?|boars?|hogs?|swine|lợn|heo")],
    ["bird", word("birds?|chickens?|hens?|roosters?|ducks?|geese|goose|crows?|herons?|ravens?|owls?|gà|vịt|chim|ngỗng|cò|quạ|le le|bìm bịp")],
  ] as const,
  GHOST: word("ghost\\w*|spirit\\w*|phantom\\w*|apparition\\w*|wraith\\w*|ma|hồn|vong|ma nữ|bóng ma"),
  EFFECT_LAYERS: "Atmospheric effect layers (fog, mist, smoke, steam, haze) sit behind the character layers in the SVG; only rain or snow may cross in front of people. People are fully opaque unless the scene node is a ghost or spirit.",
  MAX_POSE_NOTES: 3,
  MAX_ANIMAL_FRAMES: 2,
  POSE_PROMPT: "poseNotes describe how this style's character construction usually shows the actions in this scene; adapt them freely to the scene and compose the picture yourself.",
  ANIMAL_PROMPT: "animalFrames are construction references for the animals in this scene: keep their anatomy (joint directions, neck and leg proportions, head shape) and the style's line and fill treatment; change pose, gait, head direction, coat color and size freely to fit the scene.",
} as const;
