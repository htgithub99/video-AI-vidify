import { MEDIA_MIX_CONFIG } from "./loading";
import { VideoGenre } from "./enums";

export const PipelineConstants = {
  DEFAULT_VOICE_CONFIG: {
    provider: "AI33Pro",
    audioType: "tts",
    gender: "male",
    age: "adult",
    emotion: "neutral",
    speed: 1.0,
    pitch: 1.0,
    volume: 1.0,
    voiceURI: "preset-vi-bac-female",
  },
  DEFAULT_PROJECT_INPUT: {
    type: "script",
    content: "",
  },
  DEFAULT_PROJECT_CONFIG: {
    genre: VideoGenre.PSYCHOLOGY,
    language: "vi",
    duration: "15",
    rewriteLevel: 50,
    similarityReduction: 5,
    creativityLevel: 6,
    factCheck: true,
    audience: "Đại chúng",
    writingStyle: "Tự nhiên",
    splitStrategy: "mixed_sentences",
  },
  DEFAULT_HOOK_CONFIG: {
    type: "Auto",
    duration: 10,
    count: 3,
    positions: "start",
    versions: [],
  },
  DEFAULT_VISUAL_CONFIG: {
    source: "imagen",
    style: "Cinematic",
    quality: "1080p",
    density: 5,
    characterConsistency: true,
    assetsMode: "mixed",
    imageGeneratorEngine: "veo3",
    generateType: "image",
    maxVideoScenes: MEDIA_MIX_CONFIG.DEFAULT_MAX_VIDEOS,
    aspectRatio: "16:9",
    promptInputMethod: "paste",
    generateCount: 1,
  },
  MESSAGES: {
    SAVE_STYLE_SUCCESS: "Lưu style thành công",
    UPDATE_STYLE_SUCCESS: "Cập nhật style thành công",
    APPLY_STYLE_SUCCESS: "Áp dụng style thành công",
    SAVE_VOICE_SUCCESS: "Lưu giọng đọc thành công",
    UPDATE_VOICE_SUCCESS: "Cập nhật giọng đọc thành công",
    GENERAL_ERROR: "Đã xảy ra lỗi",
  },
  STORAGE_KEYS: {
    API_SANDBOX_CONFIG: "pipeline_api_sandbox_config",
    FAVORITE_STYLES: "pipeline_favorite_styles",
    FAVORITE_VOICES: "pipeline_favorite_voices",
  },
  FLOW_STEPS: [0, 1, 2, 3, 4],
  UI_TEXTS: {
    STEP_PREFIX: "STEP",
    STEP_FALLBACK: "Bước",
  },
};

export enum PipelineEnum {
  STEP_0 = 0,
  STEP_1 = 1,
  STEP_2 = 2,
  STEP_3 = 3,
  STEP_4 = 4,
  STEP_5 = 5,
  STEP_6 = 6,
  STEP_7 = 7,
}
