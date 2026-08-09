export enum ThumbnailLayoutId {
  SubjectLeftTextRight = "subject_left_text_right",
  SubjectRightTextLeft = "subject_right_text_left",
  EmotionObjectContrast = "emotion_object_contrast",
  LayeredEnsembleHeadline = "layered_ensemble_headline",
  CastLineupTitle = "cast_lineup_title",
  BeforeAfterSplit = "before_after_split",
}

export const THUMBNAIL_LAYOUT_CATALOG = [
  {
    id: ThumbnailLayoutId.SubjectLeftTextRight,
    composition: "One dominant character or object fills the left 55-65%; reserve clean negative space on the right for a short headline; an optional hand-drawn arrow points from the headline toward the evidence.",
    bestFor: "one-person revelations, confessions, warnings, unusual objects, or a clear cause-and-effect reveal",
  },
  {
    id: ThumbnailLayoutId.SubjectRightTextLeft,
    composition: "One dominant character or object fills the right 55-65%; reserve clean negative space on the left for a short headline; use an optional arrow only when it clarifies the focal evidence.",
    bestFor: "single-subject stories whose pose, gaze, or prop reads more naturally toward the left",
  },
  {
    id: ThumbnailLayoutId.EmotionObjectContrast,
    composition: "Pair one large emotional face with one story-defining object or consequence; keep both readable at phone size and place a compact headline in the remaining negative space.",
    bestFor: "money traps, mistakes, discoveries, danger, loss, temptation, or reaction-driven stories",
  },
  {
    id: ThumbnailLayoutId.LayeredEnsembleHeadline,
    composition: "Build a layered group of two to four expressive people with clear depth and one dominant face; place a bold headline across the lower third while keeping the bottom-right timestamp area clear.",
    bestFor: "team conflict, investigations, group consequences, comedy ensembles, or stories involving several recognizable people",
  },
  {
    id: ThumbnailLayoutId.CastLineupTitle,
    composition: "Arrange a clean centered lineup of the key cast with distinct silhouettes and one visual hierarchy; reserve the upper band for a concise title and avoid extra scenery.",
    bestFor: "character introductions, literary stories, families, historical casts, or ensemble explainers",
  },
  {
    id: ThumbnailLayoutId.BeforeAfterSplit,
    composition: "Use a clean two-state comparison with a strong visual change from left to right; maintain one coherent canvas and avoid panel borders, tiny labels, or a generic versus symbol.",
    bestFor: "transformations, consequences, progress, decline, myths versus reality, or decisions with two outcomes",
  },
] as const;

export const THUMBNAIL_PROMPT_CONFIG = {
  DEFAULT_COUNT: 2,
  NO_TEXT_MODE: "no_text",
  MAX_TEXT_WORDS: 4,
  MAX_REFERENCE_IMAGES: 3,
  DEFAULT_STYLE: "Professional editorial thumbnail",
  DEFAULT_TYPOGRAPHY: "Bold condensed sans-serif with strong contrast",
  DEFAULT_COLOR: "High subject-background contrast with a restrained accent color",
  SAFE_ZONE: "keep the bottom-right timestamp zone and outer 5% edge margins free of faces, essential objects, and text",
  FULL_BLEED: "one full-bleed image, no frame, no collage border, no mockup, no interface chrome",
  PHONE_READABILITY: "readable at phone size with one dominant idea, a clear silhouette, and minimal clutter",
  TEXT_MODE_POLICIES: {
    auto: "Decide whether a short headline materially improves clarity and CTR. Use text only when it adds information the image cannot communicate alone.",
    no_text: "Do not use generated typography. Set hasText=false and textText to an empty string.",
    minimal: "Use one concise headline of one to four words.",
    moderate: "Use one concise main headline and at most one tiny supporting label when essential.",
    abundant: "Typography may be prominent, but retain one clear headline hierarchy and avoid paragraph-length copy.",
  },
  GENERATION_PREFIX: "Professional high-CTR YouTube thumbnail",
  LAYOUT_LABEL: "Selected layout",
  SUBJECT_LABEL: "Primary focus",
  TEXT_LABEL: "Visible headline",
  NO_TEXT_DIRECTIVE: "no generated text, letters, numbers, labels, logo, signature, or watermark",
  TEXT_DIRECTIVE: "render the exact supplied headline once in clean, correctly spelled typography",
  REFERENCE_DIRECTIVE: "Use attached thumbnail reference images for visual style and composition language without copying their people, words, logos, or story details.",
} as const;
