export const MOTION_STYLE_PARTS = ["hair", "nose", "brows", "ears", "eyes", "mouth", "arms", "hands", "legs"] as const;
export const MOTION_STYLE_AXES = ["colour", "hair", "clothing", "height", "build", "accessories"] as const;
export const MOTION_STYLE_FX = ["fog", "rain", "snow", "glow", "particles", "beams", "shadows"] as const;
export const MOTION_STYLE_PATTERNS = {
  ABSENT: /^(none|no\b|omitted|absent|bald|without|not drawn|n\/a)(?!\s+or\b)|\b(omitted entirely|not drawn|not present)\b/i,
  HIDDEN: /\b(not visible|cropped|hidden by|out of frame|never shown)\b/i,
  SHARED: /\b(identical (white |same )?(head|face|body|figure|shape|silhouette)s?|same (body|silhouette|figure|shape|face layout)|single flat colou?r block)\b/i,
  NO_CLOTHING_DETAIL: /\b(no detail|no clothing|single flat colou?r block|unclothed)\b/i,
  HEX: /#[0-9a-f]{6}\b/i,
  FLAT: /\b(flat|vector)\b/i,
  CEL: /\bcel\b/i,
  SOFT: /\b(gradient|soft|painterly|watercolou?r|realistic|textured)\b/i,
  OUTLINE_NONE: /^(none|no outline)/i,
  OUTLINE_SILHOUETTE: /\b(silhouette|outer|outline only)\b/i,
  OUTLINE_THICK: /\b(thick|bold|heavy|carved|chunky)\b/i,
  OUTLINE_THIN: /\b(thin|fine|hairline|delicate)\b/i,
  NEGATE: /\b(no|zero|without|never|not)\b/i,
  CLAUSE: /[.;\n]+/,
  NIGHT_TINT: /\b(tint|overlay|darkening the whole|darken(?:ing)? the whole|whole-scene colou?r)/i,
  NIGHT_LIGHTS: /\b(glow|lamp|lantern|moonlight|window illumination|point light)/i,
  FRONT: /\b(front|straight-on|orthographic)\b/i,
  SIDE: /\bside view\b/i,
  THREE_QUARTER: /\bthree-quarter\b/i,
  DEEP: /\b(deep perspective|vanishing)\b/i,
  DETAIL: /^\s*(low|medium|moderate|high|rich)\b/i,
  HEADS_TOP_HALF: /\bheads?\b[^.]*\b(top|upper) half\b|\btorsos?\b[^.]*\bcropped\b/i,
  FX_WORDS: { fog: /\b(fog|mist|haze)\b/i, rain: /\brain\b/i, snow: /\bsnow\b/i, glow: /\b(glow|halo|bloom)\b/i, particles: /\b(particles?|dust|sparks?)\b/i, beams: /\b(beams?|shafts?|god ?rays)\b/i, shadows: /\b(cast shadows?|shadows?)\b/i } as Record<string, RegExp>,
} as const;
export const MOTION_STYLE_OUTLINE_WIDTH = { thin: [0.004, 0.014], medium: [0.012, 0.025], thick: [0.028, 0.05] } as Record<string, [number, number]>;
export const MOTION_STYLE_DEFAULT_WIDTH = { thin: 0.01, medium: 0.018, thick: 0.034 } as Record<string, number>;
export const MOTION_STYLE_RULES = {
  DISTINGUISH_DEFAULT: "Every character must have a clearly different silhouette from the others (height, build, hair, clothing shape) and the body parts the style shows (arms and hands when the style has them).",
  DISTINGUISH_AXES: (axes: string): string => `Tell characters apart only through what this style varies: ${axes}; everything else follows the kit. Draw only the body parts the style shows.`,
  SHARED: (axes: string): string => `All characters share one figure exactly as the kit describes – the same head shape, face layout, body shape and proportions; tell them apart only by ${axes}. Do not vary height, build, hair, clothing shape or accessories.`,
  FACE_DEFAULT: "where they say nothing, use a real skin tone (not the white/cream of clothing or background), eyes at least 1/8 of the head height and strokes at least 1/30 of the head width",
  FACE_FILL: (hex: string): string => `the face fill is exactly ${hex} as the kit states, even when it is white or not a skin tone; where the kit says nothing else, eyes at least 1/8 of the head height and strokes at least 1/30 of the head width`,
  ARMS_DEFAULT: "Arms hang outside the torso silhouette: with +Z toward the camera, rot z>0 swings a hanging limb toward +X, so the arm on the -X side uses a small negative z rotation and the arm on the +X side a positive one; hands must be visible from the front.",
  NO_ARMS: "This style draws no arms and no hands: do not add them.",
  NO_HANDS: "Arms hang outside the torso silhouette (with +Z toward the camera, rot z>0 swings a hanging limb toward +X) and end in rounded tips: this style draws no hands or fingers.",
  ABSENT: (parts: string): string => `NOT IN THIS STYLE – never draw these, not even as hidden parts: ${parts}.`,
  HIDDEN: (parts: string): string => `Never visible in this style: ${parts}. Keep the figure as the kit shows it (a closed base or a body cut by the frame); do not draw or pose them.`,
  GLIDE: "Characters in this style show no legs: moving characters glide along moveTo paths; never author leg poses or leg keyframes.",
  NO_OUTLINE_SHELLS: "The renderer draws every outline itself with the style's line weight: never add an enlarged dark copy of a shape behind it (a bigger black capsule, sphere, box or disc) to fake an outline – on round bodies and limbs it pokes through and turns the fill black.",
  PRECEDENCE: "STYLE PRECEDENCE: the style kit decides how everything looks – shapes, proportions, palette, linework, shading, lighting, effects and level of detail. Video DNA, the genre, the look line and the story choose only what is shown, the moment (day or night, inside or outside) and its mood.",
  FORBIDDEN_FX: (fx: string): string => `Effects this style never uses: ${fx} – do not add them, even when the genre or story suggests them.`,
  NIGHT_TINT: "Night in this style is shown by darkening the whole palette with a deep tint, not by light sources, glows or beams.",
  AXIS_WORDS: { colour: "body or clothing colour", hair: "hair", clothing: "clothing shape and pattern", height: "height", build: "build", accessories: "accessories" } as Record<string, string>,
  PART_WORDS: { hair: "hair", nose: "nose", brows: "eyebrows", ears: "ears", eyes: "eyes", mouth: "mouth", arms: "arms", hands: "hands or fingers", legs: "legs or feet" } as Record<string, string>,
  FX_WORDS: { fog: "fog or mist", rain: "rain", snow: "snow", glow: "glows or halos", particles: "particles", beams: "light beams", shadows: "cast shadows" } as Record<string, string>,
} as const;
export const MOTION_STYLE_PART = { HAIR: "hair", ARMS: "arms", LEGS: "legs", HANDS: "hands" } as const;
export const MOTION_STYLE_AXIS = { COLOUR: "colour", CLOTHING: "clothing", ACCESSORIES: "accessories", HAIR: "hair" } as const;
export const MOTION_STYLE_VALUES = {
  ARMS: MOTION_STYLE_PART.ARMS,
  LEGS: MOTION_STYLE_PART.LEGS,
  HANDS: MOTION_STYLE_PART.HANDS,
  HAIR: MOTION_STYLE_PART.HAIR,
  COLOUR: MOTION_STYLE_AXIS.COLOUR,
  CLOTHING: MOTION_STYLE_AXIS.CLOTHING,
  ACCESSORIES: MOTION_STYLE_AXIS.ACCESSORIES,
  ANY: "any",
  FLAT: "flat",
  CEL: "cel",
  SOFT: "soft",
  SILHOUETTE: "silhouette",
  THICK: "thick",
  THIN: "thin",
  DETAILS: "details",
  TINT: "tint",
  LIGHTS: "lights",
  FRONT: "front",
  SIDE: "side",
  THREE_QUARTER: "three-quarter",
  DEEP: "deep",
  MODERATE: "moderate",
  RICH: "rich",
} as const;
export const MOTION_STYLE_SILHOUETTE = "silhouette" as const;
export const MOTION_STYLE_SHADED = ["cel", "soft"] as string[];
export const MOTION_STYLE_SKIN_MATERIAL = "skin" as const;
export const MOTION_STYLE_PART_RE = {
  hair: /(^|_)(hair|bangs?|fringe|bun|ponytail|braids?|toc)(_|$)/i,
  nose: /(^|_)nose(_|$)/i,
  brows: /(^|_)(brows?|eyebrows?)(_|$|l|r)/i,
  ears: /(^|_)ears?(_|$|l|r)/i,
  arms: /(^|_)(arms?|forearms?|sleeves?)(_|$|l|r)/i,
  hands: /(^|_)(hands?|fingers?|fists?|palms?|thumbs?)(_|$|l|r)/i,
  legs: /(^|_)(legs?|thighs?|shins?|feet|foot|shoes?|boots?)(_|$|l|r)/i,
} as Record<string, RegExp>;
export const MOTION_STYLE_LOG = { ENFORCED: (cast: string, items: string): string => `${cast}: ẩn bộ phận style không có / chỉnh màu mặt theo style (${items})`, HIDDEN_PART: (part: string): string => `ẩn ${part}`, FACE_FILL: (hex: string): string => `màu mặt ${hex}` } as const;
export const MOTION_STYLE_FRAMING = { HEADS_TOP_HALF: "heads_top_half" } as const;
