import { AiPlanningExecutionMode, AiPlanningFallbackProvider } from "../../../types.js";
import type { ReupQuality, ReupStepId } from "../types/reup.js";
export const REUP_STEPS: readonly ReupStepId[] = ["source", "scenes", "script", "package", "voice", "build"];
export const REUP_API = { BASE: "/reup", SOURCE: "/source", START: "/start", APPROVE_SCRIPT: "/approve-script", RERUN: "/rerun", EXPORT: "/export", SAVE_VIDEO: "/save-video", CANCEL: "/cancel", STATUS: "/status/:jobId", FRAME: "/frame/:jobId", PICK_FOLDER: "/pick-folder", JOBS: "/jobs", DELETE: "/delete" } as const;
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
  NO_VISION: [AiPlanningFallbackProvider.DeepSeekChat] as string[],
  HALVINGS: 3,
} as const;
export const REUP_SHEET = { COLS: 6, ROWS: 5, TILE_WIDTH: 400, JPEG_Q: 4, SHORT_SOURCE: 300, MIN_INTERVAL: 2 } as const;
export const REUP_QUALITY = { SCALE: 320, MERGE_GAP: 3, MIN_BAD: 2 } as const;
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
export const REUP_SCORE_OK = 75;
export const REUP_SCORE_REVIEW = 55;
export const REUP_OVERLAY = { CALLOUT_SECONDS: 2.6, CTA_SECONDS: 3.2, KARAOKE_WORDS: 4, KARAOKE_GAP: 0.6, SUB_ABOVE_CAPTION: 0.17, KEN_BURNS_ZOOM: 0.12, PHRASE_GAP: 0.45, PHRASE_MAX: 7, CUT_PAD: 0.08 } as const;
export const REUP_TEXT = { SUB_SIZE: 0.04, SUB_MIN_PX: 20, SUB_WIDTH: 0.86, SUB_ROWS: 2, SUB_GLYPH: 0.55, SUB_GLYPH_CJK: 1, SUB_BOTTOM: 0.04, SUB_BOTTOM_VERTICAL: 0.18, SUB_OUTLINE: 0.0025, SUB_SHADOW: 0.0012, OUTLINE: 0.06, SHADOW: 0.035, LINE_HEIGHT: 1.25, THUMB_OUTLINE: 0.07, THUMB_LINE_HEIGHT: 1.22, THUMB_BLOCK: 0.44 } as const;
export const REUP_HIGHLIGHT = {
  FONT_DIR: "assets/fonts/reup",
  FONT_FILES: ["PlayfairDisplay-Bold.ttf", "PlayfairDisplay-Italic.ttf"],
  FAMILY: "Playfair Display",
  ACCENT: "#E8C46A",
  LABEL: 0.034,
  LABEL_SPACING: 2,
  TITLE: 0.056,
  SUB: 0.036,
  LIFT_WITH_SUBS: 0.24,
  TITLE_WIDTH: 0.56,
  GLYPH: 0.5,
  MARGIN_X: 0.045,
  BOTTOM: 0.1,
  TOP: 0.08,
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
export const REUP_NARRATION = { sound: { share: [0.55, 0.7] as [number, number], cueGap: 1.2, tailMax: 10 }, silent: { share: [0.72, 0.82] as [number, number], cueGap: 0.8, tailMax: 6 } } as const;
export const REUP_MOMENT = { MAX: 4, MIN_GAP: 2, END_GAP: 0.5, EVEN_STEP: 10, LEAD: 0.4, APART: 15 } as const;
export const REUP_FINGERPRINT_BYTES = 4 * 1024 * 1024;
export const REUP_LIMITS = { ANGLE_MIN: 20, LOGS: 400, TEXT: 4000, NOTE: 800, PATH: 1024, FRAMES: 10, POLL_MS: 1200 } as const;
