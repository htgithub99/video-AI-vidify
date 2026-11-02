export const MOTION_GENRE_VOCABULARY = {
  SHOTS: { WIDE: "wide", MEDIUM: "medium", CLOSE: "close", OVER_SHOULDER: "over_shoulder", LOW: "low", HIGH: "high", AERIAL: "aerial", INSERT: "insert", ESTABLISHING: "establishing", POV: "pov" },
  VISUALS: { SCENE: "scene", TITLE: "title", CHAPTER: "chapter", QUOTE: "quote", STATS: "stats", MAP: "map", TIMELINE: "timeline", VERDICT: "verdict", SCOREBOARD: "scoreboard" },
  FRAMES: { LIVED: "lived", TOLD: "told", HINDSIGHT: "hindsight" },
  HOOKS: { OPEN: "open", CLOSE: "close" },
  VI: /^vi/i,
} as const;
export const MOTION_GENRE_SHOT_LIST: readonly string[] = Object.values(MOTION_GENRE_VOCABULARY.SHOTS);
export const MOTION_GENRE_FRAME_LIST: readonly string[] = Object.values(MOTION_GENRE_VOCABULARY.FRAMES);
export const MOTION_GENRE_HOOK_LIST: readonly string[] = Object.values(MOTION_GENRE_VOCABULARY.HOOKS);
