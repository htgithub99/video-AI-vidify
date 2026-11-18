import { AiPlanningExecutionMode, AiPlanningFallbackProvider } from "../../../types.js";
import type { ReupQuality, ReupStepId } from "../types/reup.js";
export const REUP_STEPS: readonly ReupStepId[] = ["source", "scenes", "script", "voice", "build", "package"];
export const REUP_API = {
  BASE: "/reup",
  SOURCE: "/source",
  START: "/start",
  APPROVE_SCRIPT: "/approve-script",
  RERUN: "/rerun",
  EXPORT: "/export",
  MUSIC: "/music",
  MUSIC_FILE: "/music/file",
  SAVE_VIDEO: "/save-video",
  CANCEL: "/cancel",
  STATUS: "/status/:jobId",
  FRAME: "/frame/:jobId",
  PICK_FOLDER: "/pick-folder",
  JOBS: "/jobs",
  DELETE: "/delete",
} as const;
export const REUP_URL = {
  SOURCE: "/api/reup/source",
  START: "/api/reup/start",
  APPROVE_SCRIPT: "/api/reup/approve-script",
  RERUN: "/api/reup/rerun",
  EXPORT: "/api/reup/export",
  MUSIC: (preset: string): string => `/api/reup/music?preset=${encodeURIComponent(preset)}`,
  MUSIC_FILE: (name: string): string => `/api/reup/music/file?name=${encodeURIComponent(name)}`,
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
  MIN_SHOT: 1.6,
  MAX_SHOT: 7,
  SECTION_SHOTS: 36,
  LANES: 2,
  /** Natural sound of the footage, in LU below the narration's loudness (none when off); ducked a little under the voice. */
  NATURAL_LU: { keep: -6, low: -12 } as Record<string, number>,
  /** Photo reports and old scripts: footage after a section without words (seconds), and its share of a video at most. */
  TAIL_MAX: 8,
  SILENT_SHARE: 0.15,
  /** Longest unbroken piece of a narrated cue's picture, and the shortest piece taken to fill one (seconds). */
  CUE_SHOT: 8,
  CUE_MIN: 3,
  /** Seconds kept clear around every shot used, so no sliver right next to it shows up later (it reads as a repeat). */
  GUARD: 2,
  LONG_MARGIN: 6,
  LOGO_ZOOM: 1.08,
  LOGO_BOX: 0.16,
  TITLE_HOOK_SECONDS: 4,
  TRUE_PEAK: -1.5,
  /** Peak limit of the final mix (linear, ≈ -1 dBFS). */
  LIMIT: 0.89,
  LRA: 11,
} as const;
/**
 * On-screen fonts by script, shared by the burned-in text (titles, chapter cards, captions, subtitles) and the
 * thumbnail: "heavy" for titles, "bold" for running text; first file found is used. Latin entries carry every
 * Vietnamese diacritic (stacked ones too: Ầ Ữ Ở), Japanese and Korean need their own glyphs. `css` is the same face
 * for the browser canvas (thumbnails).
 */
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
/** The same faces for the browser canvas (CSS font shorthand, `{size}` in px). */
export const REUP_CSS_FONTS: Record<ReupFontScript, string> = {
  latin: "900 {size}px 'Segoe UI Black', 'Segoe UI', Arial, 'Helvetica Neue', sans-serif",
  ja: "700 {size}px 'Yu Gothic UI', 'Yu Gothic', Meiryo, 'Noto Sans CJK JP', sans-serif",
  ko: "700 {size}px 'Malgun Gothic', 'Noto Sans CJK KR', sans-serif",
};
export const reupFontScript = (lang = "en"): ReupFontScript => (lang === "ja" || lang === "ko" ? lang : "latin");
/** Voice: busy retries, and the longest sentence read as one clip (VieNeu refuses past 1800 characters). */
export const REUP_VOICE = { RETRY_MS: 17000, RETRIES: 24, SENTENCE_MAX: 300, WORK_DIR: "reup", BUSY: /queue|429|too many|busy|limit|full|đầy|hàng đợi/i } as const;
/** Folder sources (photo reports): photos and clips laid end to end; a low-resolution proxy stands in for the source. */
export const REUP_FOLDER = { PHOTO_SECONDS: 5, IMAGE_EXT: /\.(jpe?g|png|webp|bmp)$/i, VIDEO_EXT: /\.(mp4|mov|m4v|mkv|avi|webm)$/i, PROXY_HEIGHT: 360, PROXY_FPS: 2, MAX_ITEMS: 400 } as const;
/** Chapter cards, callouts, the closing call to action, karaoke subtitles and narration subtitle lines (words or, for unspaced scripts, characters per line). */
export const REUP_OVERLAY = { CHAPTER_SECONDS: 2.5, CALLOUT_SECONDS: 2.6, CTA_SECONDS: 3.2, KARAOKE_WORDS: 4, KARAOKE_GAP: 0.6, SUB_ABOVE_CAPTION: 0.17, KEN_BURNS_ZOOM: 0.12, PHRASE_GAP: 0.45, PHRASE_MAX: 7, CUT_PAD: 0.08 } as const;
/**
 * On-screen text look shared with Video Motion. Subtitles: bold at 4 % of the height, wrapped across 86 % of the
 * width (glyph = average character width / font size), 4 % from the bottom, thin outline and faint shadow (shares of
 * the height). Titles and cards: outline and shadow as shares of the font size; line height for stacked lines.
 */
export const REUP_TEXT = {
  SUB_SIZE: 0.04,
  SUB_MIN_PX: 20,
  SUB_WIDTH: 0.86,
  SUB_ROWS: 2,
  SUB_GLYPH: 0.55,
  SUB_GLYPH_CJK: 1,
  SUB_BOTTOM: 0.04,
  SUB_BOTTOM_VERTICAL: 0.18,
  SUB_OUTLINE: 0.0025,
  SUB_SHADOW: 0.0012,
  OUTLINE: 0.06,
  SHADOW: 0.035,
  LINE_HEIGHT: 1.25,
  THUMB_OUTLINE: 0.07,
  THUMB_LINE_HEIGHT: 1.22,
  THUMB_BLOCK: 0.44,
} as const;
/**
 * Background music library (tracks made on Suno for each video type): a folder in the data directory, the type read
 * from a sub-folder named A…H or from "Reup BGM X" in the file name. A track is looped with crossfades to the video's
 * length, faded in and out, and mixed at Video Motion's level under the voice.
 */
export const REUP_MUSIC = { DIR: "reup-music", EXT: /\.(mp3|wav|m4a|flac|ogg)$/i, NAME: /reup[\s_-]*bgm[\s_-]*([a-h])(?![a-z])/i, CROSSFADE: 3, FADE_IN: 2, FADE_OUT: 4, VOLUME: 0.35 } as const;
/**
 * Narrated videos made from footage: the share of the length carrying words (min, max), the pause after each cue,
 * the longest stretch of footage without words after a section — by how much natural sound there is to carry the
 * quiet parts. With natural sound off, words carry more and pauses stay short.
 */
export const REUP_NARRATION = {
  sound: { share: [0.55, 0.7] as [number, number], cueGap: 1.2, tailMax: 10 },
  silent: { share: [0.72, 0.82] as [number, number], cueGap: 0.8, tailMax: 6 },
} as const;
/**
 * Scene moments the narration points at: at most MAX per scene, MIN_GAP seconds apart, never in the last END_GAP
 * seconds of a scene; old maps get one every EVEN_STEP seconds. LEAD: the picture starts this much before the moment.
 * APART: hook/teaser moments and body moments of one scene stay this far apart (a static view would look repeated).
 */
export const REUP_MOMENT = { MAX: 4, MIN_GAP: 2, END_GAP: 0.5, EVEN_STEP: 10, LEAD: 0.4, APART: 15 } as const;
/** Bytes read from each end of a source video for its fingerprint. */
export const REUP_FINGERPRINT_BYTES = 4 * 1024 * 1024;
export const REUP_LIMITS = { ANGLE_MIN: 20, LOGS: 400, TEXT: 4000, NOTE: 800, PATH: 1024, FRAMES: 10, POLL_MS: 1200 } as const;
