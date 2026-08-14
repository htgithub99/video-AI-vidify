import _ from "lodash";

export const IMAGE_PROMPT_PIPELINE_VERSION = "gemini-simple-style-lock-v6";

export const GLOBAL_IMAGE_PROMPT_MASTER_RULE = {
  STORY: "Make the scene's meaning immediately understandable through a concrete subject, action, reaction, setting, or consequence.",
  STYLE: "Express the supplied style through a small set of distinctive traits such as line work, proportions, coloring, shading, texture, and background treatment without mixing incompatible media.",
  CHARACTERS: "Keep recurring characters recognizable with a few strong style-compatible anchors while allowing natural changes in pose, expression, action, and framing.",
  CONTINUITY: "Preserve recurring character, object, location, and timeline details that matter to adjacent scenes without repeating the same composition.",
  DIRECTION: "Choose the clearest composition, camera distance, perspective, lighting, and amount of environment for the individual scene instead of filling a rigid template.",
  TEXT: "Prefer visual storytelling; request readable text only when exact wording is essential and otherwise keep the image free of invented writing.",
  REFERENCES: "Use an attached style reference only for visual language and never copy its subjects or composition unless the scene explicitly requires them.",
  OUTPUT: "Write one natural, self-contained generation prompt with no commentary or model-specific aspect-ratio parameter.",
} as const;

export const IMAGE_PROMPT_FINAL_SECTION_ORDER = [
  "STORY INTENT",
  "VISIBLE ACTION",
  "IDENTITY ANCHORS",
  "SETTING",
  "VISUAL STYLE",
  "USEFUL CONSTRAINTS",
] as const;

export const IMAGE_PROMPT_CONDITIONAL_RULES = {
  SINGLE_FRAME: "Use one continuous composition, not a collage, split screen, or multiple panels.",
  CHARACTER_COUNT: "Show exactly {0} primary character{1}.",
  SUBJECT_COUNT: "Show exactly {0} primary visual subject{1}.",
  NO_EXTRA_CHARACTERS: "Do not add unrelated background characters.",
  OBJECT_ONLY: "This scene contains objects or environment only; do not add people.",
  NO_TEXT: "Keep the image completely free of readable text, letters, numbers, logos, and watermarks.",
  CHARACTER_IDENTITY: "Keep each character visually distinct and preserve their identity, hairstyle, clothing colors, and accessories.",
  STYLE_REFERENCE_ROLE: "use image {0} only for style, proportions, line work, palette, shading, and rendering",
  CHARACTER_REFERENCE_ROLE: "use image {0} only to preserve the identity and appearance of {1}",
  SCENE_REFERENCE_ROLE: "use image {0} for scene context and composition without copying unwanted text",
  REFERENCE_PREFIX: "Attached reference roles in upload order:",
} as const;

export const createGlobalImagePromptPlanningRules = (): string => _.join(
  _.map(GLOBAL_IMAGE_PROMPT_MASTER_RULE, (rule, section) => `${section}: ${rule}`),
  "\n",
);

export const IMAGE_PROMPT_FINAL_ORDER_RULE = `Use these as a flexible checklist, not a mandatory template: ${_.join(IMAGE_PROMPT_FINAL_SECTION_ORDER, " -> ")}. Omit anything that does not improve the image.`;
