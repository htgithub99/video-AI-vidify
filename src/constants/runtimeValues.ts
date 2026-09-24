export const LANGUAGE_CODES = {
  VI: "vi",
  EN: "en",
} as const;

export const FLOW_BUSY_STATES = {
  PLANNING: "planning",
  GENERATING: "generating",
} as const;

export const FLOW_CLIP_STATUSES = {
  DONE: "done",
  FAILED: "failed",
  GENERATING: "generating",
} as const;

export const MUSIC_VIEW_MODES = {
  LYRICS: "lyrics",
  SEO: "seo",
  SPLIT: "split",
} as const;

export const AUDIO_FORMATS = {
  MP3: "mp3",
  WAV: "wav",
} as const;

export const SUNO_VOCAL_GENDERS = {
  MALE: "male",
  FEMALE: "female",
} as const;

export const COPY_KEYS = {
  EXCLUDE_STYLES: "excludeStyles",
} as const;
