export const APP_CONFIG = {
  TOAST_DURATION: 3000,
};

export const PIPELINE_CONFIG = {
  BATCH_CHUNK_SIZE_REWRITE: 25,
  BATCH_CHUNK_SIZE_OPTIMIZE: 8,
  DELAY_BETWEEN_CHUNKS_MS: 1500,
  DELAY_LONG_CHUNKS_MS: 3000,
  STEP5_DELAY_MS: 2000,
  INDEX_INVALID: -1,
  MS_PER_SEC: 1000,
  BATCH_CHUNK_SIZE_REWRITE_CHARACTER: 25,
  DEFAULT_CHAPTER_COUNT: 3,
  WORDS_PER_CHAPTER: 100,
  MOUSE_MOVE_BOUNDS: {
    START_X_BASE: 100,
    START_X_RANDOM: 800,
    START_Y_BASE: 100,
    START_Y_RANDOM: 600,
    TARGET_OFFSET_X: 10,
    TARGET_OFFSET_Y: 5,
  },
  TYPING_DELAYS: {
    BASE: 10,
    RANDOM: 25,
    PAUSE_BASE: 30,
    PAUSE_RANDOM: 50,
  },
  DEFAULT_TARGET_DURATION_SECONDS: 15,
  SCENES_PER_PAGE: 12,
  PROJECT_COMPARE_KEYS: [
    "name", "description", "input", "config", "hookConfig", "voiceConfig", 
    "visualConfig", "storyboard", "thumbnails", "chapters", "seoConfig", 
    "seo", "assets", "currentStep", "creditsUsed", "storyboardSourceMode"
  ],
};
