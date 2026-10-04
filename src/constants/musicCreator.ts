export const MUSIC_CREATOR_RUNTIME = {
  ABORT_ERROR_NAME: "AbortError",
  SEO_SECTION_SEPARATOR: "\n\n",
  SEO_OPTION_SEPARATOR: "\n----------------------------------------\n\n",
  MUSIC_PLAN_STAGE: "music-plan",
  SEO_TRACKLIST_HEADING: "DANH SÁCH CA KHÚC:",
  DEFAULT_PLAYLIST_NAME: "Playlist",
} as const;
export const MUSIC_CREATOR_REGEXES = {
  TIMESTAMP_LINE: /^(\s*(?:\d{1,2}:)?\d{1,2}:\d{2})\s+\S.*$/,
  NUMBERED_LINE: /^\s*\d+[.)]\s+/,
  EMOJI: /\p{Extended_Pictographic}/gu,
  EMOJI_PREFIX: /^\s*\p{Extended_Pictographic}\uFE0F?\s+/u,
} as const;
export const MUSIC_DIAGNOSTIC_EVENTS = {
  PLAN_VALIDATION_FAILED: "plan_validation_failed",
  PLAN_STARTED: "plan_started",
  PLAN_COMPLETED: "plan_completed",
  PLAN_FAILED: "plan_failed",
  IMAGE_PROMPT_STARTED: "music_image_prompt_started",
  IMAGE_PROMPT_COMPLETED: "music_image_prompt_completed",
  IMAGE_PROMPT_FAILED: "music_image_prompt_failed",
  IMAGE_GENERATION_FAILED: "music_image_generation_failed",
} as const;
