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
const MOTION_STYLE_PART = { HAIR: "hair", ARMS: "arms", LEGS: "legs", HANDS: "hands" } as const;
const MOTION_STYLE_AXIS = { COLOUR: "colour", CLOTHING: "clothing", ACCESSORIES: "accessories", HAIR: "hair" } as const;
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
export const MOTION_STYLE_FRAMING = { HEADS_TOP_HALF: "heads_top_half" } as const;
