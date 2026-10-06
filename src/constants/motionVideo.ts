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
    "illustration.js",
    "three-core.js",
    "three-models.js",
    "scenes3d.js",
    "three-more.js",
    "tales-3d.js",
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
