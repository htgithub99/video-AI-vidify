import _ from "lodash";

export const IMAGE_PROMPT_PIPELINE_VERSION = "full-bleed-media-v14-archival-grounding";

export const GLOBAL_IMAGE_PROMPT_MASTER_RULE = {
  STORY: "Make the scene's meaning immediately understandable through a concrete subject, action, reaction, setting, or consequence.",
  STYLE: "Express the supplied style through a small set of distinctive traits such as line work, proportions, coloring, shading, texture, and background treatment without mixing incompatible media.",
  CHARACTERS: "Keep recurring characters recognizable with a few strong style-compatible anchors while allowing natural changes in pose, expression, action, and framing.",
  CONTINUITY: "Preserve recurring character, object, location, and timeline details that matter to adjacent scenes without repeating the same composition.",
  DIRECTION: "Choose the clearest composition, camera distance, perspective, lighting, and amount of environment for the individual scene instead of filling a rigid template.",
  TEXT: "Prefer visual storytelling; request readable text only when exact wording is essential and otherwise keep the image free of invented writing.",
  REFERENCES: "Use an attached style reference only for visual language and never copy its subjects or composition unless the scene explicitly requires them.",
  OUTPUT:
    "Write one natural, self-contained generation prompt with no commentary or model-specific aspect-ratio parameter. The generated scene must fill the entire canvas edge to edge, never appearing inside a white margin, picture frame, mat, card, page, mockup, interface, letterbox, or pillarbox.",
} as const;

export const IMAGE_PROMPT_FINAL_SECTION_ORDER = ["STORY INTENT", "VISIBLE ACTION", "IDENTITY ANCHORS", "SETTING", "VISUAL STYLE", "USEFUL CONSTRAINTS"] as const;

export const IMAGE_PROMPT_CONDITIONAL_RULES = {
  SINGLE_FRAME: "Single continuous composition, one wide-angle frame, strictly no collage, no split screen, and no multiple panels.",
  CHARACTER_COUNT: "Show exactly {0} primary character{1}.",
  SUBJECT_COUNT: "Show exactly {0} primary visual subject{1}.",
  NO_EXTRA_CHARACTERS: "Do not add unrelated background characters.",
  OBJECT_ONLY: "This scene contains objects or environment only; do not add people.",
  NO_TEXT: "Completely text-free image, strictly no readable text, no letters, no words, no numbers, no subtitles, no logos, and no watermarks.",
  CHARACTER_IDENTITY: "Keep each character visually distinct and preserve their identity, hairstyle, clothing colors, and accessories.",
  ANATOMY_STICKFIGURE: "Simplified minimalist stickfigure anatomy: pure spherical white head, two simple solid black dot eyes, no realistic facial features, bean-shaped torso, clean thin black stick limbs with simple rounded hands (no realistic fingers).",
  STYLE_REFERENCE_ROLE: "use image {0} only for style, proportions, line work, palette, shading, and rendering",
  CHARACTER_REFERENCE_ROLE: "use image {0} only to preserve the identity and appearance of {1}",
  SCENE_REFERENCE_ROLE: "use image {0} for scene context and composition without copying unwanted text",
  REFERENCE_PREFIX: "Attached reference roles in upload order:",
  THUMBNAIL_SAFE_ZONE: "Bottom-right 20% corner must remain completely clean as a safe zone for video timestamps.",
} as const;

export const createGlobalImagePromptPlanningRules = (): string =>
  _.join(
    _.map(GLOBAL_IMAGE_PROMPT_MASTER_RULE, (rule, section) => `${section}: ${rule}`),
    "\n",
  );

export const IMAGE_PROMPT_FINAL_ORDER_RULE = `Use these as a flexible checklist, not a mandatory template: ${_.join(IMAGE_PROMPT_FINAL_SECTION_ORDER, " -> ")}. Omit anything that does not improve the image.`;

export const VIDEO_GENERATION_MOTION_DIRECTIVE =
  "Video motion direction: one continuous coherent editorial shot animating only the visible action described in this prompt; show a readable action arc with a clear initiation, physical progression, and natural consequence by the final frame; begin close to the source composition and preserve the same character identity, face, hair, anatomy, clothing, props, environment, lighting, and art style throughout; let subject motion carry the story while the camera remains stable or makes one subtle motivated move; include only physically plausible secondary environmental motion; no invented dialogue or lip-sync, unrelated gestures, idle posing, repeated action loop, internal cut, montage, scene change, crash zoom, whip pan, sudden reframing, frozen opening, end-card pose, flicker, duplicated subject, or visual morphing.";

export const VIDEO_GENERATION_MULTISHOT_DIRECTIVE =
  "Video editorial direction: execute the three timed chronological shots already specified above with exactly two clean motivated cuts; every shot must continue from the observable result of the previous shot and reveal new story information; preserve character identity, wardrobe, props, location geography, lighting direction, eyelines and screen direction across both cuts; use stable readable framing and physically plausible action; no extra shot, repeated action, unrelated montage, location reset, crash zoom, whip pan, camera shake, frozen opening, end-card pose, duplicated subject or visual morphing.";
