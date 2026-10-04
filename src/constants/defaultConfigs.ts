import { VoicePresetId } from "./enums";
export const boundaries = [".", "!", "?", "…", "\n"];
export const AUTO_VIDEO_DEFAULTS = { CONFIG_VERSION: 3, CHROME_HEADLESS: true, RESUME_MODE: true } as const;
export const VOICE_MODIFIERS: Record<string, { speed: number; pitch: number }> = {
  [VoicePresetId.PRESET_VI_BAC_FEMALE]: { speed: 1.0, pitch: 1.04 },
  [VoicePresetId.PRESET_VI_BAC_MALE]: { speed: 0.95, pitch: 0.9 },
  [VoicePresetId.PRESET_VI_TRUNG_FEMALE]: { speed: 1.02, pitch: 1.05 },
  [VoicePresetId.PRESET_VI_TRUNG_MALE]: { speed: 0.95, pitch: 0.92 },
  [VoicePresetId.PRESET_VI_NAM_FEMALE]: { speed: 1.05, pitch: 1.05 },
  [VoicePresetId.PRESET_VI_NAM_MALE]: { speed: 0.98, pitch: 0.95 },
  [VoicePresetId.PRESET_VI_KID]: { speed: 1.05, pitch: 1.22 },
  [VoicePresetId.ELEVENLABS_CLOUD_VI]: { speed: 0.95, pitch: 0.98 },
  [VoicePresetId.AZURE_CLOUD_VI_HOAIMY]: { speed: 1.05, pitch: 1.1 },
  [VoicePresetId.AZURE_CLOUD_VI_NAMMINH]: { speed: 0.98, pitch: 0.9 },
  [VoicePresetId.GOOGLE_CLOUD_VI_A]: { speed: 1.0, pitch: 1.03 },
  [VoicePresetId.GOOGLE_CLOUD_VI_B]: { speed: 1.02, pitch: 0.95 },
  [VoicePresetId.OPENAI_TTS_ALLOY]: { speed: 1.0, pitch: 1.0 },
  [VoicePresetId.OPENAI_TTS_NOVA]: { speed: 1.05, pitch: 1.15 },
};
export const DEFAULT_SCENE_CAMERA_MOTION = "Zoom In";
export const DEFAULT_SCENE_EFFECTS = "Soft natural lighting";
export const DEFAULT_SCENE_LIGHTING_EFFECT = "natural_light";
export const DEFAULT_SCENE_TRANSITION = "None";
export const TEXT_PROCESSOR_CONFIGS = {
  MAX_CHUNK_SIZE: 2500,
  MIN_CHUNK_SIZE: 2000,
  DEFAULT_MAX_WORDS_SAFE: 12,
  SENTENCE_SPLIT_MIN_RATIO: 0.3,
  SENTENCE_SPLIT_MAX_RATIO: 0.7,
  MAX_SCENES_LIMIT: 250,
  DEFAULT_FALLBACK_SCENES_COUNT: 8,
  DEFAULT_SCENE_DURATION: 5,
  MIN_SCENE_DURATION: 5,
  MAX_SCENE_DURATION: 20,
  MIN_LAST_SCENE_DURATION: 3,
  WORDS_PER_SECOND_RATIO: 2.2,
  MIN_PARAGRAPH_LENGTH: 10,
} as const;
export const NEWLINE_CHAR = "\n";
export const SPACE_CHAR = " ";
export const SINGLE_WHITESPACE_REGEX = /\s/;
