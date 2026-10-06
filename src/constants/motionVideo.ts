import { MotionAspect, MotionQuality } from "../types/motionVideo.js";
import { MOTION_TEXT_DAY, MOTION_TEXT_DUSK, MOTION_TEXT_NIGHT, MOTION_TEXT_POINT, MOTION_TEXT_RUN, MOTION_TEXT_SIT, MOTION_TEXT_STAND, MOTION_TEXT_TALK, MOTION_TEXT_TOON_WAVE, MOTION_TEXT_W_FULL_PX_3_PY_2_ROUNDED_XL_2, MOTION_TEXT_WALK } from "./motionRuntime.js";
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
export const MOTION_ASPECT_BASE: Record<string, { w: number; h: number }> = {
  [MotionAspect.LANDSCAPE]: { w: 1920, h: 1080 },
  [MotionAspect.PORTRAIT]: { w: 1080, h: 1920 },
  [MotionAspect.SQUARE]: { w: 1080, h: 1080 },
  [MotionAspect.FOUR_FIVE]: { w: 1080, h: 1350 },
};
export const MOTION_FPS_OPTIONS = [24, 25, 30, 60] as const;
export const MOTION_VIDEO_CONSTANTS = {
  ENGINE_DIR: "motion-engine",
  ENGINE_FILES: [
    "texts.js",
    "vendor/three.min.js",
    "core.js",
    "rig.js",
    "assets-vehicles.js",
    "assets-world.js",
    "assets-props.js",
    "environments.js",
    "library-extra.js",
    "library-more.js",
    "scenes.js",
    "toon.js",
    "toon-assets.js",
    "toon-envs.js",
    "tales-chars.js",
    "tales-props.js",
    "tales-structures.js",
    "tales-envs.js",
    "aviation.js",
    "aviation-world.js",
    "interactions.js",
    "designed.js",
    "illustration.js",
    "three-core.js",
    "three-models.js",
    "scenes3d.js",
    "three-more.js",
    "tales-3d.js",
    "aviation-3d.js",
    "real3d.js",
  ],
  FONTS_DIR: "fonts",
  FONTS_MANIFEST: "fonts.json",
  DEMO_DIR: "demo",
  OUTPUT_FOLDER: "output",
  MOTION_FOLDER: "motion-video",
  WORK_FOLDER: "work",
  AUDIO_FOLDER: "audio",
  LIBRARY_FILE: "motion-library.json",
  DESIGNS_FILE: "motion-designs.json",
  RESULTS_FILE: "motion-results.json",
  ASSETS_URL_PREFIX: "/assets/motion-video/",
  EXT_MP4: ".mp4",
  BATCH_FRAMES: 8,
  MAX_WORKERS: 4,
  MEMORY_PER_WORKER_MB: 700,
  MIN_FRAMES_PER_WORKER: 240,
  MAX_RESULTS: 60,
  MAX_LOG_LINES: 80,
  MAX_AUDIO_BYTES: 300 * 1024 * 1024,
  JOB_TTL_MS: 60 * 60 * 1000,
  SAVE_TOKEN_TTL_MS: 10 * 60 * 1000,
  BROWSER_CHANNELS: ["chrome", "msedge"],
  SETTINGS_STORAGE_KEY: "motion_video_settings_v1",
  SPEC_STORAGE_KEY: "motion_video_spec_v1",
  POLL_INTERVAL_MS: 1000,
  PREVIEW_WIDTH: 960,
} as const;
export const MOTION_GPU_ENCODERS = ["h264_nvenc", "h264_qsv", "h264_amf"] as const;
export const MOTION_STORY_CONFIG = {
  PROJECT_ID_PREFIX: "motion-story-",
  ARTIFACT_ANALYSIS: "motion-story-analysis",
  ARTIFACT_CHAPTER: "motion-story-chapter",
  VI_SYLLABLES_PER_SECOND: 4.3,
  EN_WORDS_PER_SECOND: 2.5,
  TARGET_BEAT_SECONDS: 7,
  LENGTH_SAFETY: 0.85,
  LEAD_SECONDS: 0.3,
  BEAT_GAP_SECONDS: 0.28,
  CHAPTER_GAP_SECONDS: 0.7,
  TAIL_SECONDS: 2.2,
  MIN_SHOT_SECONDS: 2.4,
  TTS_CONCURRENCY: 3,
  TTS_MAX_CHARS: 900,
  SUBTITLE_MAX_CHARS: 84,
  STORY_STORAGE_KEY: "motion_story_state_v1",
  ROOM_TIMEOUT_MS: 6 * 60 * 1000,
  AI_PARALLEL: 2,
  WORKER_IDS: ["motion-primary", "motion-second"],
  BROWSER_KEEP_ALIVE_MS: 3 * 60 * 1000,
  ROOM_PROVIDER_RETRIES: 2,
  ROOM_RETRY_LOG: "AI báo lỗi tạm thời – mở phòng chat mới và hỏi lại…",
} as const;
export const MOTION_FORM_CONTROL_CLASSNAME = MOTION_TEXT_W_FULL_PX_3_PY_2_ROUNDED_XL_2;
export const MOTION_TOON_OPTION_KEYS = {
  actions: [
    [MOTION_TEXT_STAND, "TOON_POSE_STAND"],
    [MOTION_TEXT_WALK, "TOON_POSE_WALK"],
    [MOTION_TEXT_TALK, "TOON_POSE_TALK"],
    [MOTION_TEXT_TOON_WAVE, "TOON_POSE_WAVE"],
    [MOTION_TEXT_POINT, "TOON_POSE_POINT"],
    [MOTION_TEXT_RUN, "TOON_POSE_RUN"],
    [MOTION_TEXT_SIT, "TOON_POSE_SIT"],
  ],
  times: [
    [MOTION_TEXT_DAY, "TOON_DAY"],
    [MOTION_TEXT_DUSK, "TOON_DUSK"],
    [MOTION_TEXT_NIGHT, "TOON_NIGHT"],
  ],
} as const;
export const MOTION_DESIGN = {
  MAX_ROUNDS: 3,
  PASS_SCORE: 8,
  KEEP_SCORE: 6,
  MAX_REQUESTS: 6,
  ARTIFACT: "motion_design",
  ARTIFACT_REVIEW: "motion_design_review",
  PREVIEW_FOLDER: "design-preview",
} as const;
export const MOTION_INTERACT = {
  CROWD_MAX: 10,
  HANG_DROP: 200,
} as const;
export const MOTION_CUES: Record<string, RegExp> = {
  gun: /(súng|bắn|nổ súng|đấu súng|xả đạn|làn đạn|tay súng|chĩa|khống chế|uy hiếp|\bguns?\b|shoot|gunfire|armed)/i,
  fire: /(bắn|nổ súng|đấu súng|xả đạn|làn đạn|giao tranh|đọ súng|shoot|gunfire|firefight|opened fire)/i,
  fear: /(con tin|khống chế|sợ hãi|hoảng|uy hiếp|kinh hoàng|run rẩy|hostage|terror|panic|afraid)/i,
  breach: /(phá cửa|mở cửa|đạp cửa|xông vào|lao vào|ập vào|đột nhập|tấn công vào|breach|storm|burst in)/i,
  climb: /(leo|trèo|lên máy bay|áp sát|xe thang|cầu thang|bậc thang|đột kích|tiếp cận|board|climb|stair)/i,
  window: /(cửa sổ|window)/i,
  evac: /(cầu trượt|sơ tán|thoát hiểm|evacuat|escape slide)/i,
  safe: /(két|tủ sắt|kho tiền|hầm tiền|\bsafes?\b|vault|strongbox)/i,
  sleep: /(ngủ|giường|nằm viện|bệnh nặng|ốm|hôn mê|hấp hối|sleep|in bed|sick|coma|dying)/i,
};
export const MOTION_STORY_CAST_HINTS =
  "CHARACTER HINTS: special forces / SWAT / GIGN / commandos = swat_officer, swat_officer_2, swat_commander; hijackers / terrorists / armed gunmen = hijacker, hijacker_rifle, hijacker_disguised (disguised as security staff); airline pilots = captain_pilot, copilot, pilot; cabin crew = flight_attendant; airline passengers / hostages = passenger_man, passenger_woman, passenger_elder. Never use thief_hooded or soldier for these roles.";
export const MOTION_STORY_SETPIECE_RULES = [
  "STAGING (the director places people and furniture automatically, so describe WHAT happens, not furniture positions):",
  "- Actions that need furniture get it automatically: sit / sit_afraid / sit_hands_up / sit_eat / type / fly sit on a real seat (rows of seats, desks, tables or the env's own chairs; a chair is added only if none exists); lie lies on a bed when the place has one; open_door / kick_door / knock get a door that swings open; take_cover crouches behind cover (crates, cars, sandbags, barrels); climb goes up a ladder or boarding stairs; slide rides an evacuation slide. Do not add chair, seat, desk, bed or door props just to support these actions.",
  "- Places with STAGING notes below already contain their furniture and background crowd; only list the story characters.",
  "- Weapons: armed people use action aim (pointing a gun, holding someone at gunpoint) or shoot (firing, gunfight). Never use point for a gun. Victims: hands_up, cower, surrender, sit_afraid. Captors: aim or restrain. throw = throwing an object, punch = fist fight.",
  "- Use time interior for lit interiors; prefer clear day, dusk or night lighting outdoors so faces and actions stay readable.",
].join("\n");
