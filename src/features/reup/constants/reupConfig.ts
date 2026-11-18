import { AiPlanningExecutionMode, AiPlanningFallbackProvider } from "../../../types.js";
import type { ReupQuality, ReupStepId } from "../types/reup.js";
export const REUP_STEPS: readonly ReupStepId[] = ["source", "scenes", "script", "voice", "build", "package"];
export const REUP_API = {
  BASE: "/reup",
  SOURCE: "/source",
  START: "/start",
  APPROVE_SCRIPT: "/approve-script",
  RERUN: "/rerun",
  CANCEL: "/cancel",
  STATUS: "/status/:jobId",
  FRAME: "/frame/:jobId",
  PICK_FOLDER: "/pick-folder",
  JOBS: "/jobs",
} as const;
export const REUP_URL = {
  SOURCE: "/api/reup/source",
  START: "/api/reup/start",
  APPROVE_SCRIPT: "/api/reup/approve-script",
  RERUN: "/api/reup/rerun",
  CANCEL: "/api/reup/cancel",
  STATUS: (jobId: string): string => `/api/reup/status/${encodeURIComponent(jobId)}`,
  FRAME: (jobId: string, time: number): string => `/api/reup/frame/${encodeURIComponent(jobId)}?t=${time.toFixed(2)}`,
  PICK_FOLDER: "/api/reup/pick-folder",
  JOBS: "/api/reup/jobs",
  STREAM: (file: string): string => `/api/shorts/stream-source?path=${encodeURIComponent(file)}`,
} as const;
export const REUP_STORAGE = { STATE: "reup_state_v1" } as const;
export const REUP_DIR = { OUTPUT: "output", ROOT: "reup", SHEETS: "sheets", VOICE: "voice", SECTIONS: "sections", OUT: "out", PACKAGE: "package", FRAMES: "frames", JOB_FILE: "job.json", LIMIT_FILE: "ai-upload-limits.json", ASSETS_URL: "/assets/reup/" } as const;
/** Images per message each chat AI accepts (checked 18/11/2026); learned lower values override these. */
export const REUP_UPLOAD = {
  MAX: { [AiPlanningFallbackProvider.GeminiChat]: 10, [AiPlanningFallbackProvider.ChatGptUi]: 10, [AiPlanningFallbackProvider.ClaudeChat]: 20, [AiPlanningFallbackProvider.GrokChat]: 4, [AiPlanningFallbackProvider.MetaAi]: 1 } as Record<string, number>,
  /** Gemini API inline payload cap is 20 MB; keep headroom for the prompt and base64 growth. */
  API_BYTES: 14 * 1024 * 1024,
  API_MODE: AiPlanningExecutionMode.ApiOnly as string,
  FALLBACK_BATCH: 10,
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
  /** Export quality (same choices as Video Motion): frame size of the long side, x264 CRF. */
  QUALITY: { draft: { size: [1280, 720], crf: 28 }, standard: { size: [1920, 1080], crf: 23 }, high: { size: [1920, 1080], crf: 20 }, ultra: { size: [3840, 2160], crf: 18 } } as Record<ReupQuality, { size: [number, number]; crf: number }>,
  /** Video Motion's generated score is mastered quiet (about -36 LUFS); it sits under the voice as is. */
  MUSIC_VOLUME: 1,
  MIN_SHOT: 1.6,
  MAX_SHOT: 7,
  SECTION_SHOTS: 36,
  LANES: 2,
  NATURAL_LEVEL: { keep: 0.9, low: 0.35, off: 0 } as Record<string, number>,
  TAIL_MAX: 12,
  LONG_MARGIN: 6,
  LOGO_ZOOM: 1.08,
  LOGO_BOX: 0.16,
  TITLE_HOOK_SECONDS: 4,
  TRUE_PEAK: -1,
  LRA: 11,
} as const;
/** Bold fonts by script, first one found is used (Japanese and Korean need their own glyphs). */
export const REUP_FONTS: Record<"latin" | "ja" | "ko", { file: string; family: string }[]> = {
  latin: [
    { file: "C:/Windows/Fonts/arialbd.ttf", family: "Arial" },
    { file: "C:/Windows/Fonts/segoeuib.ttf", family: "Segoe UI" },
    { file: "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", family: "DejaVu Sans" },
    { file: "/System/Library/Fonts/Supplemental/Arial Bold.ttf", family: "Arial" },
  ],
  ja: [
    { file: "C:/Windows/Fonts/YuGothB.ttc", family: "Yu Gothic" },
    { file: "C:/Windows/Fonts/meiryob.ttc", family: "Meiryo" },
    { file: "C:/Windows/Fonts/msgothic.ttc", family: "MS Gothic" },
    { file: "/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc", family: "Noto Sans CJK JP" },
  ],
  ko: [
    { file: "C:/Windows/Fonts/malgunbd.ttf", family: "Malgun Gothic" },
    { file: "C:/Windows/Fonts/malgun.ttf", family: "Malgun Gothic" },
    { file: "/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc", family: "Noto Sans CJK KR" },
  ],
};
export const REUP_VOICE = { RETRY_MS: 17000, RETRIES: 24, BUSY: /queue|429|too many|busy|limit|full|đầy|hàng đợi/i } as const;
/** Folder sources (photo reports): photos and clips laid end to end; a low-resolution proxy stands in for the source. */
export const REUP_FOLDER = { PHOTO_SECONDS: 5, IMAGE_EXT: /\.(jpe?g|png|webp|bmp)$/i, VIDEO_EXT: /\.(mp4|mov|m4v|mkv|avi|webm)$/i, PROXY_HEIGHT: 360, PROXY_FPS: 2, MAX_ITEMS: 400 } as const;
/** Chapter cards, callouts, the closing call to action, karaoke subtitles and narration subtitle lines (words or, for unspaced scripts, characters per line). */
export const REUP_OVERLAY = { CHAPTER_SECONDS: 2.5, CALLOUT_SECONDS: 2.6, CTA_SECONDS: 3.2, KARAOKE_WORDS: 4, KARAOKE_GAP: 0.6, SUB_WORDS: 8, SUB_CHARS: 18, SUB_ABOVE_CAPTION: 0.17, KEN_BURNS_ZOOM: 0.12, PHRASE_GAP: 0.45, PHRASE_MAX: 7, CUT_PAD: 0.08 } as const;
export const REUP_LIMITS = { LOGS: 400, TEXT: 4000, NOTE: 800, PATH: 1024, FRAMES: 10, POLL_MS: 1200 } as const;
