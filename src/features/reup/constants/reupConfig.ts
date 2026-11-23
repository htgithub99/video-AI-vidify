import type { ThumbCaption, ThumbConcept } from "../../../constants/thumbConcepts.js";
import { AiPlanningExecutionMode, AiPlanningFallbackProvider } from "../../../types.js";
import type { ReupQuality, ReupStepId } from "../types/reup.js";
export const REUP_STEPS: readonly ReupStepId[] = ["source", "scenes", "script", "package", "voice", "build"];
export const REUP_API = { BASE: "/reup", SOURCE: "/source", START: "/start", APPROVE_SCRIPT: "/approve-script", RERUN: "/rerun", EXPORT: "/export", SAVE_VIDEO: "/save-video", CANCEL: "/cancel", STATUS: "/status/:jobId", FRAME: "/frame/:jobId", PICK_FOLDER: "/pick-folder", JOBS: "/jobs", DELETE: "/delete", THUMB: "/thumb", STYLE: "/style" } as const;
export const REUP_URL = {
  SOURCE: "/api/reup/source",
  START: "/api/reup/start",
  APPROVE_SCRIPT: "/api/reup/approve-script",
  RERUN: "/api/reup/rerun",
  EXPORT: "/api/reup/export",
  SAVE_VIDEO: "/api/reup/save-video",
  CANCEL: "/api/reup/cancel",
  STATUS: (jobId: string): string => `/api/reup/status/${encodeURIComponent(jobId)}`,
  FRAME: (jobId: string, time: number): string => `/api/reup/frame/${encodeURIComponent(jobId)}?t=${time.toFixed(2)}`,
  PICK_FOLDER: "/api/reup/pick-folder",
  JOBS: "/api/reup/jobs",
  DELETE: "/api/reup/delete",
  THUMB: "/api/reup/thumb",
  STYLE: "/api/reup/style",
  STREAM: (file: string): string => `/api/shorts/stream-source?path=${encodeURIComponent(file)}`,
} as const;
export const REUP_STORAGE = { STATE: "reup_state_v1" } as const;
export const REUP_DIR = { OUTPUT: "output", ROOT: "reup", SHEETS: "sheets", VOICE: "voice", SECTIONS: "sections", OUT: "out", PACKAGE: "package", FRAMES: "frames", JOB_FILE: "job.json", LIMIT_FILE: "ai-upload-limits.json", ASSETS_URL: "/assets/reup/" } as const;
export const REUP_UPLOAD = {
  MAX: { [AiPlanningFallbackProvider.GeminiChat]: 10, [AiPlanningFallbackProvider.ChatGptUi]: 10, [AiPlanningFallbackProvider.ClaudeChat]: 20, [AiPlanningFallbackProvider.GrokChat]: 4, [AiPlanningFallbackProvider.MetaAi]: 1 } as Record<string, number>,
  API_BYTES: 14 * 1024 * 1024,
  API_MODE: AiPlanningExecutionMode.ApiOnly as string,
  FALLBACK_BATCH: 1,
  CHAT_SHEETS: 1,
  PACKAGE_FRAMES: 6,
  NO_VISION: [AiPlanningFallbackProvider.DeepSeekChat] as string[],
  HALVINGS: 3,
} as const;
export const REUP_SHEET = { COLS: 6, ROWS: 5, TILE_WIDTH: 400, JPEG_Q: 4, SHORT_SOURCE: 300, MIN_INTERVAL: 2 } as const;
export const REUP_WATERMARK = { WIDTH: 640, HEIGHT: 360, RADIUS: 3, MIN_FRAMES: 20, BOX: { W: 0.35, H: 0.1 }, PERCENTILE: 0.99, MIN_SCORE: 6, RATIO: 1.6, CROP: 0.12 } as const;
export const REUP_QUALITY = { SCALE: 320, MERGE_GAP: 3, MIN_BAD: 2, DIM: 60, DIM_MIN: 1.5, DIM_TARGET: 85, GAMMA_POWER: 0.6, GAMMA_MAX: 1.7, LIFT_BRIGHT: 0.02, LIFT_SAT: 1.06, DIM_SHOT: 2.5 } as const;
export const REUP_BUILD = {
  FPS: 30,
  PRESET: "veryfast",
  AUDIO_RATE: 48000,
  AUDIO_BITRATE: "192k",
  QUALITY: { auto: { size: [1920, 1080], crf: 21 }, draft: { size: [1280, 720], crf: 28 }, standard: { size: [1920, 1080], crf: 23 }, high: { size: [1920, 1080], crf: 20 }, ultra: { size: [3840, 2160], crf: 18 } } as Record<ReupQuality, { size: [number, number]; crf: number }>,
  MIN_SHOT: 1.6,
  MAX_SHOT: 7,
  SECTION_SHOTS: 36,
  LANES_CPU: 4,
  LANES_GPU: 3,
  CPUS_PER_LANE: 3,
  AUTO_SMALL_HEIGHT: 600,
  AUTO_SMALL_SIZE: [1280, 720] as [number, number],
  CACHE_KEY_EXT: ".key",
  NATURAL_LU: { keep: -6, low: -12 } as Record<string, number>,
  TAIL_MAX: 8,
  SILENT_SHARE: 0.15,
  CUE_SHOT: 8,
  CUE_MIN: 3,
  GUARD: 2,
  LONG_MARGIN: 6,
  LOGO_ZOOM: 1.08,
  VERTICAL: { BAND: 1, TOP: 0.18, BLUR: "boxblur=24:2,eq=brightness=-0.08:saturation=0.85" },
  LOGO_BOX: 0.16,
  TITLE_HOOK_SECONDS: 4,
  TRUE_PEAK: -1.5,
  LIMIT: 0.89,
  LRA: 11,
} as const;
export type ReupFontScript = "latin" | "ja" | "ko";
export type ReupFontWeight = "heavy" | "bold";
export interface ReupFontFace {
  file: string;
  family: string;
}
export const REUP_FONTS: Record<ReupFontScript, Record<ReupFontWeight, ReupFontFace[]>> = {
  latin: {
    heavy: [
      { file: "C:/Windows/Fonts/seguibl.ttf", family: "Segoe UI Black" },
      { file: "C:/Windows/Fonts/segoeuib.ttf", family: "Segoe UI" },
      { file: "C:/Windows/Fonts/arialbd.ttf", family: "Arial" },
      { file: "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", family: "DejaVu Sans" },
      { file: "/System/Library/Fonts/Supplemental/Arial Bold.ttf", family: "Arial" },
    ],
    bold: [
      { file: "C:/Windows/Fonts/segoeuib.ttf", family: "Segoe UI" },
      { file: "C:/Windows/Fonts/arialbd.ttf", family: "Arial" },
      { file: "C:/Windows/Fonts/tahomabd.ttf", family: "Tahoma" },
      { file: "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", family: "DejaVu Sans" },
      { file: "/System/Library/Fonts/Supplemental/Arial Bold.ttf", family: "Arial" },
    ],
  },
  ja: {
    heavy: [
      { file: "C:/Windows/Fonts/YuGothB.ttc", family: "Yu Gothic" },
      { file: "C:/Windows/Fonts/meiryob.ttc", family: "Meiryo" },
      { file: "C:/Windows/Fonts/msgothic.ttc", family: "MS Gothic" },
      { file: "/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc", family: "Noto Sans CJK JP" },
    ],
    bold: [
      { file: "C:/Windows/Fonts/YuGothB.ttc", family: "Yu Gothic" },
      { file: "C:/Windows/Fonts/meiryob.ttc", family: "Meiryo" },
      { file: "C:/Windows/Fonts/msgothic.ttc", family: "MS Gothic" },
      { file: "/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc", family: "Noto Sans CJK JP" },
    ],
  },
  ko: {
    heavy: [
      { file: "C:/Windows/Fonts/malgunbd.ttf", family: "Malgun Gothic" },
      { file: "C:/Windows/Fonts/malgun.ttf", family: "Malgun Gothic" },
      { file: "/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc", family: "Noto Sans CJK KR" },
    ],
    bold: [
      { file: "C:/Windows/Fonts/malgunbd.ttf", family: "Malgun Gothic" },
      { file: "C:/Windows/Fonts/malgun.ttf", family: "Malgun Gothic" },
      { file: "/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc", family: "Noto Sans CJK KR" },
    ],
  },
};
export const REUP_CSS_FONTS: Record<ReupFontScript, string> = { latin: "900 {size}px 'Segoe UI Black', 'Segoe UI', Arial, 'Helvetica Neue', sans-serif", ja: "700 {size}px 'Yu Gothic UI', 'Yu Gothic', Meiryo, 'Noto Sans CJK JP', sans-serif", ko: "700 {size}px 'Malgun Gothic', 'Noto Sans CJK KR', sans-serif" };
export const reupFontScript = (lang = "en"): ReupFontScript => (lang === "ja" || lang === "ko" ? lang : "latin");
export const REUP_VOICE = { RETRY_MS: 17000, RETRIES: 24, SENTENCE_MAX: 300, WORK_DIR: "reup", BUSY: /queue|429|too many|busy|limit|full|đầy|hàng đợi/i } as const;
export const REUP_FOLDER = { PHOTO_SECONDS: 5, IMAGE_EXT: /\.(jpe?g|png|webp|bmp)$/i, VIDEO_EXT: /\.(mp4|mov|m4v|mkv|avi|webm)$/i, PROXY_HEIGHT: 360, PROXY_FPS: 2, MAX_ITEMS: 400 } as const;
export const REUP_PACE = { QUICK: 180, MID: 480 } as const;
export const REUP_THUMBS = {
  COUNT: 5,
  WORDED_KEEP: 2,
  CONCEPT_KEEP: 2,
  PLAIN: ["cinema"],
  WORDED: ["hero", "badge", "collage", "split", "circle"],
  FRAMES: { hero: 1, cinema: 1, badge: 1, split: 2, circle: 2, collage: 3, ai: 1 },
  SPOTS: { hero: ["tl", "tc", "tr", "bl", "bc"], badge: ["tl", "tr", "bl"], collage: ["tl", "bl"], split: ["tc", "bc"], circle: ["tl", "bl"], cinema: ["bl"], ai: ["tc"] },
  CAPTION_SPOTS: { top: ["tc"], topleft: ["tl"], topright: ["tr"], bottom: ["bc"], none: ["tc"] } as Record<ThumbCaption | "none", readonly string[]>,
  PREFER: { A: ["tl", "tc", "tr", "bl", "bc"], C: ["bc", "tc", "bl", "tl", "tr"], D: ["bl", "bc", "tl", "tc", "tr"], F: ["tc", "bc", "tl", "tr", "bl"], G: ["tl", "tr", "tc", "bl", "bc"], H: ["tl", "tr", "bl", "tc", "bc"] } as Record<string, readonly string[]>,
  CONCEPTS: { A: ["action", "trophy", "split"], C: ["curiosity", "trophy", "action"], D: ["trophy", "action", "split"], F: ["split", "trophy", "action"], G: ["split", "trophy", "curiosity"], H: ["trophy", "action", "split"] } as Record<string, readonly ThumbConcept[]>,
  FALLBACK: { signature: "cinema", trophy: "hero", split: "split", action: "hero", curiosity: "circle", mood: "cinema" },
  LOOKS: ["right:door", "left:back", "right:tool", "left:door", "right:back", "left:tool"],
  AI: { ATTEMPTS: 2, MIN_BYTES: 20000, REFS: 3, STYLE_REFS: 1, TEXT_MIN: 110, KEEP_MIN: 90, BAND: 0.36, CORNER: 0.62, BAND_LINES: 2, WORDS: 4, SMALL: 168, FLAT: 30, PUNCH: 1.18 },
  STYLE: { MAX: 8, DIR: "style", WIDTH: 1280, BYTES: 15 * 1024 * 1024, MIME: /^data:image\/(png|jpe?g|webp);base64,/ },
  SUBJECT_LEFT: 0.4,
  SUBJECT_RIGHT: 0.6,
  HISTORY: 3,
  CANDIDATE: {
    LEAD: 0.6,
    APART: 5,
    SUBJECT: /(?<!\p{L})(person|man|woman|girl|boy|he|she|camper|builder|dog|cat|puppy|horse|fire|flames?|stove|lantern|lamp|campfire|embers|glow|người|anh|ông|cô|chị|chó|mèo|ngựa|lửa|bếp|đèn|than)(?!\p{L})/iu,
    SUBJECT_BONUS: 1.5,
    PERSON: /(?<!\p{L})(person|man|woman|girl|boy|he|she|camper|builder|người|anh|ông|cô|chị)(?!\p{L})/iu,
    COMPANION: /(?<!\p{L})(dog|cat|puppy|horse|cabin|tent|shelter|hut|house|truck|car|van|chó|mèo|ngựa|nhà|chòi|lều|xe)(?!\p{L})/iu,
    PAIR_BONUS: 1.5,
    TAG: /(?<!\p{L})(dog|dogs|cat|puppy|horse|fish|snow|chó|mèo|ngựa|cá|tuyết)(?!\p{L})/iu,
    TAG_ALIASES: { dog: ["dog", "chó", "puppy"], dogs: ["dog", "chó"], chó: ["chó", "dog", "puppy"], cat: ["cat", "mèo"], mèo: ["mèo", "cat"], puppy: ["puppy", "dog", "chó"], horse: ["horse", "ngựa"], ngựa: ["ngựa", "horse"], fish: ["fish", "cá"], cá: ["cá", "fish"], snow: ["snow", "tuyết"], tuyết: ["tuyết", "snow"] } as Record<string, string[]>,
    PICKED_BONUS: 1,
    SHOWN: 8,
    SHOWN_BONUS: 2,
    DARK: 45,
    DARK_PENALTY: 3,
    DIM_PENALTY: 1,
    REPEAT_PENALTY: 3,
  },
} as const;
export const REUP_SCORE_OK = 75;
export const REUP_SCORE_REVIEW = 55;
export const REUP_OVERLAY = { SUB_ABOVE_CAPTION: 0.17, KEN_BURNS_ZOOM: 0.12, PHRASE_GAP: 0.45, PHRASE_MAX: 7 } as const;
export const REUP_TEXT = {
  SUB_SIZE: 0.04,
  SUB_MIN_PX: 20,
  SUB_WIDTH: 0.86,
  SUB_ROWS: 2,
  SUB_GLYPH: 0.55,
  SUB_GLYPH_CJK: 1,
  SUB_BOTTOM: 0.04,
  SUB_BOTTOM_VERTICAL: 0.14,
  SUB_OUTLINE: 0.0025,
  SUB_SHADOW: 0.0012,
  OUTLINE: 0.06,
  SHADOW: 0.035,
  LINE_HEIGHT: 1.25,
  THUMB_OUTLINE: 0.07,
  THUMB_LINE_HEIGHT: 1.22,
  THUMB_BLOCK: 0.44,
  TITLE_FIT: 0.9,
  TITLE_GLYPH: 0.68,
  TITLE_GLYPH_CJK: 1.05,
  TITLE_GAP: 0.3,
  TITLE_TOP_MIN: 0.09,
} as const;
export const REUP_HIGHLIGHT = {
  FONT_DIR: "assets/fonts/reup",
  FAMILY: "Playfair Display",
  ACCENT: "#E8C46A",
  LABEL: 0.034,
  LABEL_SPACING: 2,
  TITLE: 0.056,
  SUB: 0.036,
  LEAD: { label: 1.35, title: 1.0, sub: 1.12 },
  TITLE_WIDTH: 0.56,
  GLYPH: 0.5,
  MARGIN_X: 0.045,
  SLIDE: 0.02,
  FADE_MS: 400,
  OUTLINE: 0.0028,
  SHADOW: 0.002,
  NORMAL_FACTOR: 0.6,
  GAP_FACTOR: 0.5,
  MIN_GAP: 20,
  TAIL: 1,
  TITLE_WORDS: 8,
  LABEL_CHARS: 24,
  SUB_CHARS: 48,
  SHORT: { SHOT_MAX: 3.2, TAIL: 3, JUMP: 1.6, SPACING: 8, EVERY: 7, PER_SECTION: 3, MIN_GAP: 5, FIRST: 1.4, SECONDS: 1.8, MAX: 5, WORDS: 4, LOOKS: ["main", "alt"], RISE: 0.35, RISE_MS: 160, FADE: [80, 160], STING: { SECONDS: 0.32, AMP: 0.16, HIGHPASS: 1400, LOWPASS: 9000, LEAD: 0.06, FADE_IN: 0.03 } },
} as const;
export type ReupPopKind = "caption" | "editorial" | "tag";
export interface ReupPopTheme {
  kind: ReupPopKind;
  accent: string;
}
export const REUP_POP_THEME: Record<string, ReupPopTheme> = { A: { kind: "caption", accent: "#FFD23F" }, C: { kind: "tag", accent: "#FFD23F" }, D: { kind: "editorial", accent: "#E8C46A" }, F: { kind: "caption", accent: "#FFC83D" }, G: { kind: "editorial", accent: "#F0B260" }, H: { kind: "editorial", accent: "#FF7A50" } };
export const REUP_TYPE = {
  BASE: 720,
  LANDSCAPE: 960,
  MARGIN: 48,
  HEAVY: { file: "InterDisplay-Black.otf", family: "Inter Display Black" },
  FONT: { display: "Inter Display Black", head: "Inter Display ExtraBold", label: "Inter SemiBold", serif: "Lora" },
  GLYPH: { display: 0.66, head: 0.56, serif: 0.5, label: 0.62, cjk: 1 },
  SIZE: { caption: { label: 30, title: 62 }, editorial: { label: 24, title: 54, sub: 30 }, tag: { label: 22, title: 54, pill: 36, pillPad: 18, pillGap: 8 } },
  LEAD: { caps: 0.95, title: 1.0, serifTitle: 0.98, label: 1.4, sub: 1.12, box: 1.25 },
  SPACING: { label: 2 },
  OUTLINE: 3.6,
  SHADOW: 2.6,
  GLOW: 8,
  GLOW_BLUR: 10,
  GLOW_ALPHA: "80",
  SCRIM_ALPHA: "50",
  SCRIM_BLUR: 60,
  SCRIM_PAD: 2.2,
  CAPTION_LIFT: 2.4,
  TITLE_WIDTH: { caption: 1, editorial: 0.8, tag: 0.8 },
  SUB_COLOR: "#E6E6E6",
  INK: "#141414",
  SAFE_TOP: 0.08,
  SAFE_BOTTOM: 0.1,
  SUBS_BOTTOM: 0.24,
} as const;
export const REUP_MUSIC_ZONE = {
  LUFS: -24,
  GAIN: { gap: 4, ending: 3, sting: 2, hook: 0, bed: 0 } as Record<string, number>,
  TONE: "highshelf=f=4000:g=-6,lowpass=f=8000",
  VOICE_DUCK: "threshold=0.03:ratio=5:attack=25:release=800",
  LEVEL_MIN: 2,
  GAP: 6,
  GAP_PAD: 0.4,
  MERGE: 3,
  MIN: 3,
  STING: 5,
  STING_LEAD: 0.5,
  REST: 2,
  HOOK_MAX: 20,
  HOOK_NONE: 8,
  ENDING_MAX: 30,
  FADE_IN: 1.5,
  FADE_OUT: 2.5,
  SILENCE_DB: -40,
  NATURAL_DUCK: "threshold=0.05:ratio=3:attack=30:release=700",
  ANALYSIS_DIR: ".analysis",
  ANALYSIS_RATE: 8000,
  QUIET_DB: 2,
  CALM_TARGET: -0.5,
  REUSE_PENALTY: 6,
} as const;
export const REUP_MUSIC = { DIR: "reup-music", EXT: /\.(mp3|wav|m4a|flac|ogg)$/i, NAME: /reup[\s_-]*bgm[\s_-]*([a-h])(?![a-z])/i, CROSSFADE: 3, FADE_IN: 2, FADE_OUT: 4 } as const;
export const REUP_NARRATION = { sound: { share: [0.55, 0.7] as [number, number], cueGap: 1.2, tailMax: 10 }, silent: { share: [0.72, 0.82] as [number, number], cueGap: 0.8, tailMax: 6 }, HEADROOM: 0.1, SHARE_MAX: 0.88, COVER_SLACK: 0.04, SHORT_OK: 0.9, QUICK_OK: 1 } as const;
export const REUP_LANG_UNIT = { en: { factor: 1, unit: "words" }, vi: { factor: 1.65, unit: "words (Vietnamese syllables)" }, ja: { factor: 3.2, unit: "Japanese characters" }, ko: { factor: 1, unit: "words" } } as const;
export const REUP_REVIEW = { PAST_RUNS: 5, PHRASES: 10, PHRASE_RUNS: 2, PHRASE_LETTERS: 12, GRAMS: [4, 3], SENTENCE_UNITS: 6, SENTENCE_OVERLAP: 0.5, QUOTES: 12, REWRITE_MIN: 3, EXTEND_SECTIONS: 4, SHORT_WEIGHT: 10, STRAY_WEIGHT: 3 } as const;
export const REUP_FILL = { AHEAD: 90, VALUE_WEIGHT: 0.04, USED_PENALTY: 1, USED_SHARE: 0.5 } as const;
export const REUP_TALK = { MIN_WORDS: 3, REACH: 3, TAIL_MAX: 10, PAD: 0.3, SHARE_MAX: 0.1, QUOTE_WORDS: 8, HEARD_MIN: 0.6, SECTION_SECONDS: 60 } as const;
export const REUP_HOLD = { FOLDER_FACTOR: 2, LONG_HOLD: 3, OVER: 1.3 } as const;
export const REUP_SPANS = { OVERLAP_REVIEW: 0.5, PROMPT_MAX: 20 } as const;
export const REUP_MOMENT = { MAX: 4, MIN_GAP: 2, END_GAP: 0.5, EVEN_STEP: 10, LEAD: 0.4, APART: 15 } as const;
export const REUP_FINGERPRINT_BYTES = 4 * 1024 * 1024;
export const REUP_LIMITS = { ANGLE_MIN: 20, LOGS: 400, TEXT: 4000, NOTE: 800, PATH: 1024, FRAMES: 10, POLL_MS: 1200, BROWSER_CLOSE_TRIES: 3, BROWSER_CLOSE_WAIT_MS: 3000, TARGET_SOURCE: { video: 0.6, folder: 1 }, FOLDER_OVERLAP: 0.7 } as const;
