export const MOTION_SCENE_GROUPS = ["character", "location", "vehicle", "tree", "building", "prop"] as const;
export type MotionSceneGroup = (typeof MOTION_SCENE_GROUPS)[number];
export interface MotionSceneTypeDef { id: string; group: MotionSceneGroup; vi: string; en: string; senior?: boolean; animal?: boolean; }
export const MOTION_SCENE_TYPES: MotionSceneTypeDef[] = [
  { id: "old_man", group: "character", vi: "Ông lão", en: "old man", senior: true },
  { id: "old_woman", group: "character", vi: "Bà cụ", en: "old woman", senior: true },
  { id: "middle_man", group: "character", vi: "Đàn ông trung niên", en: "middle-aged man" },
  { id: "middle_woman", group: "character", vi: "Phụ nữ trung niên", en: "middle-aged woman" },
  { id: "young_man", group: "character", vi: "Thanh niên", en: "young man" },
  { id: "young_woman", group: "character", vi: "Thiếu nữ", en: "young woman" },
  { id: "boy", group: "character", vi: "Bé trai", en: "boy (child)" },
  { id: "girl", group: "character", vi: "Bé gái", en: "girl (child)" },
  { id: "baby", group: "character", vi: "Em bé", en: "baby" },
  { id: "ghost_woman", group: "character", vi: "Ma nữ", en: "female ghost" },
  { id: "ghost_man", group: "character", vi: "Hồn ma nam", en: "male ghost" },
  { id: "ghost_child", group: "character", vi: "Ma trẻ con", en: "child ghost" },
  { id: "monster", group: "character", vi: "Quỷ / yêu quái", en: "demon or monster" },
  { id: "monk", group: "character", vi: "Sư thầy / ni cô", en: "buddhist monk or nun" },
  { id: "shaman", group: "character", vi: "Thầy cúng / bà đồng", en: "shaman, exorcist, medium" },
  { id: "police", group: "character", vi: "Công an / bộ đội", en: "police officer or soldier" },
  { id: "medic", group: "character", vi: "Bác sĩ / y tá", en: "doctor or nurse" },
  { id: "cat", group: "character", vi: "Mèo", en: "cat", animal: true },
  { id: "dog", group: "character", vi: "Chó", en: "dog", animal: true },
  { id: "bird", group: "character", vi: "Chim (quạ, cú, gà)", en: "bird (crow, owl, rooster)", animal: true },
  { id: "farm_animal", group: "character", vi: "Trâu bò, lợn", en: "buffalo, cow or pig", animal: true },
  { id: "village_road", group: "location", vi: "Đường làng", en: "village road or path" },
  { id: "rice_field", group: "location", vi: "Cánh đồng", en: "rice field or farmland" },
  { id: "cemetery", group: "location", vi: "Nghĩa địa", en: "cemetery or graveyard" },
  { id: "shrine", group: "location", vi: "Đền, miếu, đình", en: "shrine, temple or communal house" },
  { id: "pagoda", group: "location", vi: "Chùa", en: "buddhist pagoda" },
  { id: "house_interior", group: "location", vi: "Trong nhà (gian thờ, phòng khách)", en: "house interior, living or altar room" },
  { id: "bedroom", group: "location", vi: "Phòng ngủ", en: "bedroom" },
  { id: "kitchen", group: "location", vi: "Gian bếp", en: "kitchen" },
  { id: "house_exterior", group: "location", vi: "Sân, ngoài nhà", en: "house exterior or yard" },
  { id: "abandoned_house", group: "location", vi: "Nhà hoang", en: "abandoned house" },
  { id: "town_street", group: "location", vi: "Phố, hẻm", en: "town street or alley" },
  { id: "school", group: "location", vi: "Trường học", en: "school" },
  { id: "hospital", group: "location", vi: "Bệnh viện, nhà xác", en: "hospital or morgue" },
  { id: "mountain_road", group: "location", vi: "Đường đèo, núi", en: "mountain road or pass" },
  { id: "river", group: "location", vi: "Sông, bến đò, hồ, ao", en: "river, ferry landing, lake or pond" },
  { id: "forest", group: "location", vi: "Rừng, rừng tre", en: "forest or bamboo grove" },
  { id: "market", group: "location", vi: "Chợ, quán", en: "market or roadside stall" },
  { id: "village_gate", group: "location", vi: "Cổng làng, gốc đa, giếng", en: "village gate, banyan tree or well" },
  { id: "bicycle", group: "vehicle", vi: "Xe đạp", en: "bicycle" },
  { id: "motorbike", group: "vehicle", vi: "Xe máy", en: "motorbike" },
  { id: "car", group: "vehicle", vi: "Ô tô con", en: "car" },
  { id: "truck", group: "vehicle", vi: "Xe tải", en: "truck" },
  { id: "bus", group: "vehicle", vi: "Xe khách", en: "bus or coach" },
  { id: "special_vehicle", group: "vehicle", vi: "Xe cứu thương, xe tang", en: "ambulance or hearse" },
  { id: "cart", group: "vehicle", vi: "Xe trâu, xích lô", en: "ox cart or cyclo" },
  { id: "boat", group: "vehicle", vi: "Thuyền, đò, thúng", en: "boat, sampan or basket boat" },
  { id: "big_tree", group: "tree", vi: "Cây đa, cây gạo", en: "banyan or kapok tree" },
  { id: "bamboo", group: "tree", vi: "Tre", en: "bamboo" },
  { id: "palm", group: "tree", vi: "Dừa, cau, chuối", en: "coconut, areca or banana palm" },
  { id: "small_tree", group: "tree", vi: "Cây khác", en: "other tree" },
  { id: "house", group: "building", vi: "Nhà", en: "house" },
  { id: "religious_building", group: "building", vi: "Miếu, cổng chùa", en: "shrine or pagoda gate" },
  { id: "village_structure", group: "building", vi: "Cổng làng, giếng, cầu", en: "village gate, well or bridge" },
  { id: "grave", group: "building", vi: "Mộ, bia, quan tài", en: "grave, headstone or coffin" },
  { id: "light_prop", group: "prop", vi: "Đèn, nến", en: "lamp, lantern or candle" },
  { id: "ritual_prop", group: "prop", vi: "Bàn thờ, bát hương", en: "altar or incense" },
  { id: "furniture", group: "prop", vi: "Đồ gỗ, giường, bàn ghế", en: "furniture" },
  { id: "household_prop", group: "prop", vi: "Đồ vật khác", en: "household object" },
];
export const MOTION_SCENE_TYPE_OTHER = "other";
export const MOTION_SCENE_LIBRARY_MODES = { AUTO: "auto", AI: "ai", OFF: "off" } as const;
export type MotionSceneLibraryMode = (typeof MOTION_SCENE_LIBRARY_MODES)[keyof typeof MOTION_SCENE_LIBRARY_MODES];
export const MOTION_CHARACTER_ROLES = {
  top: ["top", "shirt", "blouse", "jacket", "coat", "robe", "dress", "tunic", "sweater", "vest", "uniform", "raincoat", "gown", "torso", "body_cloth"],
  bottom: ["bottom", "pant", "trouser", "skirt", "short", "jean", "leg_cloth"],
  hair: ["hair", "bun", "ponytail", "pigtail", "braid", "fringe", "bang"],
  accent: ["accent", "scarf", "hat", "cap", "belt", "bag", "headband", "headwrap", "khan", "ribbon"],
} as const;
export type MotionCharacterRole = keyof typeof MOTION_CHARACTER_ROLES;
export const MOTION_CHARACTER_SKIP = ["skin", "face", "eye", "pupil", "mouth", "lip", "brow", "nose", "teeth", "tongue", "cheek", "blush", "hand", "finger"];
export const MOTION_CHARACTER_OPTIONAL_PREFIX = "opt_";
export const MOTION_CHARACTER_FACE_PARTS = { brow: ["brow"], mouth: ["mouth"], eye: ["eye"] } as const;
export const MOTION_CHARACTER_PALETTE: Record<MotionCharacterRole, { hex: string; en: string }[]> = {
  top: [
    { hex: "#7a5230", en: "brown" },
    { hex: "#2f3e66", en: "indigo" },
    { hex: "#e8e2d4", en: "off-white" },
    { hex: "#3d5a3a", en: "dark green" },
    { hex: "#6e2b2b", en: "maroon" },
    { hex: "#5b6b7a", en: "slate blue" },
    { hex: "#c8b38a", en: "beige" },
    { hex: "#2a2a2e", en: "black" },
  ],
  bottom: [
    { hex: "#1e1e1e", en: "black" },
    { hex: "#4a3424", en: "dark brown" },
    { hex: "#23304a", en: "navy" },
    { hex: "#555b63", en: "grey" },
    { hex: "#8a7b5a", en: "khaki" },
  ],
  hair: [
    { hex: "#1b1b1b", en: "black" },
    { hex: "#3b2a20", en: "dark brown" },
    { hex: "#2a2420", en: "very dark brown" },
  ],
  accent: [
    { hex: "#9c3b2f", en: "rust red" },
    { hex: "#2e5d7a", en: "teal blue" },
    { hex: "#b98b2e", en: "mustard" },
    { hex: "#4d4d4d", en: "charcoal" },
  ],
};
export const MOTION_CHARACTER_SENIOR_HAIR = [
  { hex: "#d9d9d9", en: "white" },
  { hex: "#a9a9a9", en: "grey" },
  { hex: "#c4c0b8", en: "silver" },
];
export const MOTION_CHARACTER_VARIANT = {
  HEIGHT: [1, 0.95, 1.05, 0.97, 1.03],
  WIDTH: [1, 1.08, 0.94, 1.04, 0.97],
  BROW_ROT: [0, 6, -6, 3, -3],
  MOUTH_SCALE: [1, 0.88, 1.12, 0.94, 1.06],
  EYE_SCALE: [1, 1.08, 0.92, 1.04, 0.96],
  LOOK: (colours: string): string => `Clothing colours in this video: ${colours}.`,
  COLOUR: (role: string, colour: string): string => `${role} ${colour}`,
  JOIN: ", ",
} as const;
export const MOTION_SCENE_CATALOG_PROMPT = {
  TYPES: (list: string): string => `ASSET TYPES – give every "cast" entry and every "places" entry a "type" id from this list (use "other" only when nothing fits):
${list}`,
  COLOURS: `For every cast entry add "colors": the clothing and hair colours the STORY ITSELF states, as hex, e.g. {"top":"#f2b234","bottom":"#2c2f38","hair":"#1a191a","accent":"#d4a32b"}; leave out every colour the story does not mention.`,
  CHARACTER_SCHEMA: `MATERIAL NAMES (needed so the drawing can be reused and recoloured later): give materials these exact names when the character has them: "skin", "hair", "top" (shirt/blouse/dress/robe/jacket), "bottom" (trousers/skirt/shorts), "shoes", "accent" (scarf/hat/belt/bag), plus any extra names you need. Optionally add 1-2 hidden accessory parts with ids starting "opt_" (e.g. opt_hat, opt_glasses, opt_beard, opt_scarf) drawn in place with "visible":false.`,
};
export const MOTION_SCENE_SHOWROOM = {
  KEY_PREFIX: "showroom_",
  NAME: "Showroom",
  TIME: "day",
  DESCRIPTION: (items: string): string =>
    `A neutral display yard for drawing reusable assets: flat plain ground, no walls, no buildings, soft even daylight, simple sky. Draw ONLY the objects listed below, each as its own entry in "defs" with EXACTLY the given def name, built around its own origin and standing on y=0 at real size, with recognisable details in the project style. Place each def once with "use" in a single row along X with 3 m gaps between objects. Draw nothing else.
${items}`,
  ITEM: (def: string, description: string): string => `- def "${def}": ${description}`,
  THUMB_KEY: "p",
  THUMB_LOCATION: "library_prop_stage",
  THUMB_SHOT: "library-prop-",
} as const;
export interface MotionSeedCast { type: string; name: string; gender: "male" | "female"; role: string; look: string; tags: string[]; }
export interface MotionSeedPlace { type: string; name: string; time: string; interior: boolean; description: string; tags: string[]; }
export interface MotionSeedProp { type: string; def: string; name: string; description: string; tags: string[]; }
export const motionSceneType = (id: unknown): MotionSceneTypeDef | undefined => MOTION_SCENE_TYPES.find((type) => type.id === id);
export const motionSceneTypesPrompt = (): string =>
  MOTION_SCENE_TYPES.filter((type) => type.group === "character" || type.group === "location")
    .map((type) => `${type.id} = ${type.en} (${type.group})`)
    .join("\n");
