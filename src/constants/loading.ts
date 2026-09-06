export const LOADING_CONFIG = {
  ELEMENT_ID: "app-loading",
  FADE_OUT_CLASS: "fade-out",
  FONT_TIMEOUT_MS: 1500,
  REMOVE_DELAY_MS: 400,
  GOOGLE_FONTS_URL:
    "https://fonts.googleapis.com/css2?family=Merienda:wght@300..900&family=Montserrat:wght@300..900&family=JetBrains+Mono:ital,wght@0,100..900;1,100..900&display=swap",
} as const;

export const LOADING_KEYS = { GENERATE_DETAILED_PROMPT_PREFIX: "generateDetailedPrompt_", RENDER_SCENE_PREFIX: "renderScene_" } as const;

export const MEDIA_MIX_CONFIG = { DEFAULT_MAX_VIDEOS: 3, DEFAULT_TRIM_SECONDS: 0.25, MIN_VIDEOS: 1, MAX_VIDEOS: 10, VIDEO_COUNT_OPTIONS: [1, 2, 3, 4, 5, 6, 8, 10] } as const;


