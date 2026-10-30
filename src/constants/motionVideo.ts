import { PA } from "./motionPuppetAssets.js";
import { MotionAspect, MotionQuality, MotionStoryLength } from "../types/motionVideo.js";
export const MOTION_STORY_LENGTH_SECONDS: Partial<Record<MotionStoryLength, number>> = {
  [MotionStoryLength.ONE]: 60,
  [MotionStoryLength.TWO]: 120,
  [MotionStoryLength.THREE]: 180,
  [MotionStoryLength.FOUR]: 240,
  [MotionStoryLength.FIVE]: 300,
  [MotionStoryLength.TEN]: 600,
  [MotionStoryLength.FIFTEEN]: 900,
  [MotionStoryLength.TWENTY]: 1200,
  [MotionStoryLength.THIRTY]: 1800,
  [MotionStoryLength.FORTY]: 2400,
  [MotionStoryLength.FIFTY]: 3000,
  [MotionStoryLength.SIXTY]: 3600,
  [MotionStoryLength.SEVENTY_FIVE]: 4500,
  [MotionStoryLength.NINETY]: 5400,
  [MotionStoryLength.ONE_HUNDRED_FIVE]: 6300,
  [MotionStoryLength.SHORT]: 75,
};
export const MOTION_DIRECTOR_PATTERNS = { WORDS: /\s+/, PUNCTUATION: /[,.;:!?…]/g, SENTENCES: /[^.!?…]+[.!?…]*["”»)]*/g, CLAUSES: /(?<=[,;:–—])\s+/, SENTENCE_END: /[,.;:!?…]$/, BITMAP: /[^01#.* ]/g } as const;
export interface MotionQualityPreset {
  id: MotionQuality;
  scale: number;
  fps: number;
  supersample: number;
  motionBlur: number;
  layerScale: number;
  bloom: boolean;
  grain: boolean;
  jpegQuality: number;
  crf: number;
  x264Preset: string;
  gpuCq: number;
  audioBitrate: string;
  maxBpp: number;
}
export const MOTION_QUALITY_PRESETS: Record<MotionQuality, MotionQualityPreset> = {
  [MotionQuality.DRAFT]: { id: MotionQuality.DRAFT, scale: 2 / 3, fps: 24, supersample: 1, motionBlur: 1, layerScale: 0.75, bloom: false, grain: true, jpegQuality: 0.85, crf: 24, x264Preset: "veryfast", gpuCq: 26, audioBitrate: "160k", maxBpp: 0.12 },
  [MotionQuality.STANDARD]: { id: MotionQuality.STANDARD, scale: 1, fps: 30, supersample: 1, motionBlur: 1, layerScale: 1, bloom: true, grain: true, jpegQuality: 0.9, crf: 19, x264Preset: "fast", gpuCq: 21, audioBitrate: "192k", maxBpp: 0.2 },
  [MotionQuality.HIGH]: { id: MotionQuality.HIGH, scale: 1, fps: 30, supersample: 1.5, motionBlur: 2, layerScale: 1.25, bloom: true, grain: true, jpegQuality: 0.94, crf: 17, x264Preset: "medium", gpuCq: 18, audioBitrate: "256k", maxBpp: 0.3 },
  [MotionQuality.ULTRA]: { id: MotionQuality.ULTRA, scale: 2, fps: 30, supersample: 1, motionBlur: 3, layerScale: 1.5, bloom: true, grain: true, jpegQuality: 0.95, crf: 16, x264Preset: "slow", gpuCq: 17, audioBitrate: "320k", maxBpp: 0.18 },
};
export const MOTION_ASPECT_BASE: Record<string, { w: number; h: number }> = { [MotionAspect.LANDSCAPE]: { w: 1920, h: 1080 }, [MotionAspect.PORTRAIT]: { w: 1080, h: 1920 }, [MotionAspect.SQUARE]: { w: 1080, h: 1080 }, [MotionAspect.FOUR_FIVE]: { w: 1080, h: 1350 } };
export const MOTION_VIDEO_CONSTANTS = {
  ENGINE_DIR: "motion-engine",
  TEMPLATE_2D: "gen2d",
  DRAWING_2D: "2d",
  FX_CUE_RE: /^(thunder|explosion)$/,
  ENGINE_FILES: ["texts.js", "core.js", "scenes.js", "geo-data.js", "history.js", "style-finish.js", "puppet2d.js"],
  CLIENT_ONLY_FILES: ["style-finish.js"],
  FONTS_DIR: "fonts",
  FONTS_MANIFEST: "fonts.json",
  DEMO_DIR: "demo",
  OUTPUT_FOLDER: "output",
  MOTION_FOLDER: "motion-video",
  WORK_FOLDER: "work",
  AUDIO_FOLDER: "audio",
  RESULTS_FILE: "motion-results.json",
  ASSETS_URL_PREFIX: "/assets/motion-video/",
  EXT_MP4: ".mp4",
  BATCH_FRAMES: 8,
  MAX_WORKERS: 4,
  MEMORY_PER_WORKER_MB: 700,
  MIN_FRAMES_PER_WORKER: 240,
  MAX_RESULTS: 60,
  MAX_LOG_LINES: 400,
  MAX_AUDIO_BYTES: 300 * 1024 * 1024,
  JOB_TTL_MS: 60 * 60 * 1000,
  SAVE_TOKEN_TTL_MS: 10 * 60 * 1000,
  BROWSER_CHANNELS: ["chrome", "msedge"],
  POLL_INTERVAL_MS: 1000,
  PREVIEW_WIDTH: 960,
} as const;
export const MOTION_GPU_ENCODERS = ["h264_nvenc", "h264_qsv", "h264_amf"] as const;
export const MOTION_RENDER_CACHE = {
  VERSION: 1,
  FOLDER: "render-cache",
  CHUNK_SECONDS: 60,
  MAX_AGE_MS: 3 * 24 * 3600 * 1000,
  HASH: "sha256",
  HEX: "hex" as const,
  CHUNK_FILE: (index: number): string => `chunk-${String(index).padStart(4, "0")}.mp4`,
  TEMP_SUFFIX: ".part.mp4",
  RESUMED: (done: number, total: number): string => `Tiếp tục render: dùng lại ${done}/${total} đoạn đã render trước đó`,
  REUSED: (n: number, total: number): string => `Dùng lại ${n}/${total} khung đứng yên (không mã hóa lại)`,
  CHUNKS: (total: number, workers: number): string => `Render theo ${total} đoạn (${workers} luồng) – nếu bị dừng giữa chừng, lần sau sẽ chạy tiếp từ đoạn dở`,
};
export const MOTION_STORY_CONFIG = {
  SOURCE_PARSE_DELAY_MS: 300,
  PROJECT_ID_PREFIX: "motion-story-",
  ARTIFACT_ANALYSIS: "motion-story-analysis",
  ARTIFACT_STYLE: "motion-style-kit",
  ARTIFACT_CHAPTER: "motion-story-chapter",
  CHAPTER_RETRY_NOTE: (problems: string, spoken: number, target: number): string =>
    `PREVIOUS ATTEMPT WAS REJECTED: ${problems} Your previous narration had ${spoken} units in total; the whole chapter must total about ${target} units (count every spoken syllable/word across all beats). ${spoken > target ? "Cut descriptive filler and merge beats; keep only the events that move the story." : "Add concrete events and sensory detail from the source."}`,
  VI_SYLLABLES_PER_SECOND: 3.4,
  EN_WORDS_PER_SECOND: 2.4,
  TARGET_BEAT_SECONDS: 7,
  LENGTH_SAFETY: 0.92,
  SPEECH_RATE_FILE: "speech-rate-v2.json",
  SPEECH_RATE_PROFILES_MAX: 64,
  SPEECH_RATE_WEIGHT: 0.6,
  SPEECH_RATE_MIN: 1.2,
  SPEECH_RATE_MAX: 6,
  SPEECH_RATE_MIN_SECONDS: 15,
  SPEECH_RATE_LOG: (rate: number, seconds: number): string => `Tốc độ đọc thực tế: ${rate.toFixed(2)} âm tiết (từ)/giây – kịch bản sau sẽ tính theo tốc độ này để khớp thời lượng ≈${seconds}s.`,
  SPEECH_RATE_MEASURED: (rate: number): string => `Đã đo tốc độ đọc: ${rate.toFixed(2)} âm tiết (từ)/giây, lưu lại để viết kịch bản lần sau đúng thời lượng.`,
  LEAD_SECONDS: 0.3,
  SPEECH_HOLD_SECONDS: 0.12,
  BEAT_GAP_SECONDS: 0.18,
  CHAPTER_GAP_SECONDS: 0.7,
  TAIL_SECONDS: 2.2,
  MIN_SHOT_SECONDS: 2.4,
  TTS_CONCURRENCY: 3,
  TTS_MAX_CHARS: 900,
  SUBTITLE_MAX_CHARS: 64,
  STORY_STORAGE_KEY: "motion_story_state_v1",
  STORY_STOP_STORAGE_KEY: "motion_story_stopped_v1",
  GRAPHIC_TRANSITION: "push",
  GRAPHIC_TRANSITION_SECONDS: 0.45,
  ROOM_TIMEOUT_MS: 6 * 60 * 1000,
  ROOM_LONG_TIMEOUT_MS: 12 * 60 * 1000,
  ROOM_SHORT_TIMEOUT_MS: 3 * 60 * 1000,
  ROOM_SHORT_ARTIFACTS: ["motion-puppet-lib-match", "motion-puppet-cast-match", PA.ARTIFACT, "motion-puppet-set-plan", "motion-audio-casting", "motion-puppet-set-check", "motion-puppet-character-check", "motion-story-seo"] as string[],
  ROOM_STUCK_BLOCK_MS: 5 * 60 * 1000,
  ROOM_CLOSED_RE: /Target page, context or browser has been closed|frame was detached|ERR_ABORTED/,
  ROOM_SKIP_LOG: (provider: string, minutes: number): string => `Phòng chat ${provider} đang lỗi – bỏ qua ${provider} trong ${minutes} phút cho các yêu cầu tiếp theo, chuyển ngay sang AI dự phòng.`,
  ROOM_SKIPPED_LOG: (provider: string): string => `Bỏ qua ${provider} (đang tạm khóa vì lỗi) – dùng AI dự phòng kế tiếp.`,
  CANNED_REFUSAL_RE: /(I can'?t help|I'?m (not able|unable) to help|I can'?t assist|I'?m (just )?a language model|tôi không được (?:thiết kế|lập trình) để|tôi không thể (giúp|hỗ trợ|thực hiện)|mình không thể (giúp|hỗ trợ)|tôi chỉ là một mô hình ngôn ngữ)/i,
  CANNED_REFUSAL_LOG: (provider: string, artifact: string, chars: number): string => `AI ${provider} trả lời từ chối mẫu cho bước ${artifact} (prompt ${chars} ký tự) – thường do prompt quá dài hoặc bị bộ lọc chặn.`,
  AI_PARALLEL: 3,
  WORKER_IDS: ["motion-primary", "motion-second", "motion-third"],
  SCENE_WORKER_IDS: ["motion-scene-first", "motion-scene-second", "motion-scene-third"],
  SCENE_ROOMS_PREPARING: "[Dựng cảnh] Đang mở 3 room AI dựng cảnh riêng.",
  SCENE_ROOMS_READY: (ready: number, total: number): string => `[Dựng cảnh] Đã sẵn sàng ${ready}/${total} room AI dựng cảnh.`,
  SCENE_ROOM_PENDING: (index: number): string => `[Dựng cảnh] Room ${index} chưa sẵn sàng; sẽ phục hồi khi gửi yêu cầu dựng cảnh.`,
  ROOM_UI_ERROR_RE: /locator\.(fill|click|press|type|focus)|Timeout \d+ms exceeded|chat_planning_composer_content_mismatch|chat_planning_send_button_not_ready|chat_planning_submission_not_confirmed/,
  SCENES_PREPARING: "Chuẩn bị dựng cảnh",
  SCENES_COMPLETED: "Đã dựng xong cảnh",
  ROOM_REFUSAL_LOG: (provider: string): string => `${provider} từ chối yêu cầu; phản hồi này không phải kết quả hợp lệ.`,
  STAGE_LABELS: {
    vi: { analyze: "Phân tích kịch bản", bible: "Thiết kế nhân vật", locations: "Thiết kế bối cảnh", staging: "Dàn dựng cảnh", review: "Kiểm tra dữ liệu cảnh và âm thanh", preview: "Dựng ảnh xem trước", done: "Hoàn tất" },
    en: { analyze: "Analyzing the script", bible: "Designing characters", locations: "Designing locations", staging: "Staging scenes", review: "Checking scene and audio data", preview: "Rendering previews", done: "Completed" },
  } as Record<string, Record<string, string>>,
  ROOM_BLOCKED_RE: /security_verification|cloudflare|chờ một chút|just a moment|not_ready_or_login|chưa hoàn tất đăng nhập|login_required|đăng nhập/i,
  ROOM_BLOCK_MS: 15 * 60 * 1000,
  ROOM_SWITCH: { "claude-chat": { provider: "chatgpt-ui", model: "chatgpt-auto" } } as Record<string, { provider: string; model: string }>,
  EDIT_KEEP_ROLES: ["dialogue", "offscreen"] as string[],
  EDIT_RATIO_MIN: 0.3,
  EDIT_RATIO_MAX: 1.5,
  LIMIT_SWITCH: { "gemini-chat": { provider: "chatgpt-ui", model: "chatgpt-auto" }, "chatgpt-ui": { provider: "gemini-chat", model: "gemini-flash" }, "deepseek-chat": { provider: "gemini-chat", model: "gemini-flash" }, "grok-chat": { provider: "gemini-chat", model: "gemini-flash" } } as Record<string, { provider: string; model: string }>,
  LOOSE_MATCH_MIN: 3,
  PROVIDER_PARALLEL: { "gemini-chat": 3, "chatgpt-ui": 3, "claude-chat": 1 } as Record<string, number>,
  ROOM_UNAVAILABLE_BLOCK_MS: 10 * 60 * 1000,
  ROOM_UNAVAILABLE_LOG: (from: string, to: string): string => `Phòng chat ${from} không hiện ô nhập (có thể bị chặn tạm, chưa đăng nhập hoặc hết lượt) – tạm chuyển sang ${to} trong 10 phút`,
  ROOM_LIMIT_PATTERN: /you(?:'|’)?ve (?:reached|hit).{0,40}limit|usage (?:limit|cap)|message limit|out of (?:free )?messages|too many (?:messages|requests)|rate limit|limit (?:resets|will reset)|đã (?:đạt|hết).{0,30}giới hạn|hết lượt/i,
  ROOM_SWITCH_LOG: (from: string, to: string): string => `Phòng chat ${from} lỗi – gửi lại yêu cầu này bằng ${to}…`,
  LOG_HISTORY_JOBS: 30,
  RENDER_LOG_KIND: "render",
  BUSY_ALLOW_ATTR: "data-busy-allow",
  BUSY_LOCK_CLASS: "motion-busy-lock",
  LOG_STEP_HEADER: (label: string): string => `── ${label} ──`,
  ROOM_LIMIT_BLOCK_MS: 5 * 60 * 60 * 1000,
  ROOM_LIMIT_LOG: (from: string, to: string): string => `${from} đã hết lượt – các yêu cầu còn lại trong phiên chuyển thẳng sang ${to}`,
  API_PROVIDER: "api",
  REQUEST_COUNT_LOG: (counts: Record<string, number>): string =>
    `Số request đã gửi: ${Object.entries(counts)
      .map(([provider, count]) => `${provider} ${count}`)
      .join(", ")}`,
  ROOM_FALLBACK_LOG: (provider: string): string => `Phòng chat ${provider} đang bị chặn (xác minh Cloudflare/đăng nhập) – chuyển sang Gemini để chạy tiếp…`,
} as const;
export const MOTION_PREVIEW_QUALITY = { supersample: 1, motionBlur: 1, bloom: false, grain: false, layerScale: 0.6 };
export const MOTION_PREVIEW_SIZES: Record<string, [number, number]> = { [MotionAspect.LANDSCAPE]: [960, 540], [MotionAspect.PORTRAIT]: [405, 720], [MotionAspect.SQUARE]: [600, 600], [MotionAspect.FOUR_FIVE]: [540, 675] };
export const MOTION_RASTER = {
  BG: "#ffffff",
  LABEL_TAG: "div",
  LABEL_STYLE: { position: "absolute", top: "6px", left: "6px", padding: "5px 9px", color: "#000000", background: "#ffffff", font: "bold 24px Arial", zIndex: "2147483647" },
  BG_HTML: (svg: string, w: number, h: number, bg: string): string => `<!doctype html><html><body style="margin:0;background:${bg}">${svg.replace("<svg", `<svg width="${w}" height="${h}" preserveAspectRatio="xMidYMid meet"`)}</body></html>`,
} as const;
