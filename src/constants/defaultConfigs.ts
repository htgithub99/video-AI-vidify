import { VoicePresetId } from "./enums";

export const SCENE_DENSITY_MAP = {
  THEO_TU: { maxChars: 65, label: "Word-based (Ultra-dense)" },
  CAU_NGAN: { maxChars: 90, label: "Short sentence (Hyper-dense)" },
  DA_PHAN_CANH: { maxChars: 120, label: "Multi-scene (Clause-based)" },
  CAU_DAI: { maxChars: 180, label: "Long sentence (Standard)" },
  THEO_DOAN: { maxChars: 350, label: "Paragraph-based (Slow-paced)" },
} as const;

export const boundaries = [".", "!", "?", "\n"];

export const pauseChars = [" ", ",", "."];
export const closedKeywords = ["closed", "close", "context"];

export const FALLBACK_VOICES = [
  {
    id: "elevenlabs-cloud-vi",
    name: "AI Cao Cấp",
    voiceId: "cgSgspJ2msm6clMCkdW9",
    provider: "elevenlabs",
    gender: "female",
    previewUrl: "https://elevenlabs.io/api/v1/projects",
    language: "vi",
  },
  { id: VoicePresetId.PRESET_VI_BAC_FEMALE, name: "Hoài My (Nữ Bắc)", provider: "ttsfree", gender: "female", voiceId: "vi-VN-Standard-A", language: "vi" },
  { id: VoicePresetId.PRESET_VI_BAC_MALE, name: "Nam Minh (Nam Bắc)", provider: "ttsfree", gender: "male", voiceId: "vi-VN-Standard-B", language: "vi" },
  { id: VoicePresetId.PRESET_VI_TRUNG_FEMALE, name: "Thùy Vy (Nữ Trung)", provider: "ttsfree", gender: "female", voiceId: "vi-VN-Standard-C", language: "vi" },
  { id: VoicePresetId.PRESET_VI_TRUNG_MALE, name: "Gia Bảo (Nam Trung)", provider: "ttsfree", gender: "male", voiceId: "vi-VN-Standard-D", language: "vi" },
  { id: VoicePresetId.PRESET_VI_NAM_FEMALE, name: "Lan Trinh (Nữ Nam)", provider: "ttsfree", gender: "female", voiceId: "vi-VN-Standard-E", language: "vi" },
  { id: VoicePresetId.PRESET_VI_NAM_MALE, name: "Minh Quang (Nam Nam)", provider: "ttsfree", gender: "male", voiceId: "vi-VN-Standard-F", language: "vi" },
];

export const supportedTypes = ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm", "video/mp4"];

export const SYSTEM_STATUS = {
  READY: "ready",
  PROCESSING: "processing",
  COMPLETED: "completed",
  ERROR: "error",
};

export const defaultVoiceConfig = {
  voiceURI: VoicePresetId.PRESET_VI_BAC_FEMALE,
  speed: 1.0,
  pitch: 1.0,
  emotion: "neutral",
  volume: 1.0,
};

export const defaultProjectInput = {
  topic: "",
  genre: "Storytelling",
  duration: 60,
  writingStyle: "Documentary",
};

export const defaultProjectConfig = {
  aspectRatio: "16:9",
  visualStyle: "Photorealistic",
  complexity: "medium",
  fps: 30,
};

export const defaultHookConfig = {
  type: "Auto",
  duration: 10,
  positions: "start",
};

export const defaultVisualConfig = {
  referenceImages: [],
  globalStyleReference: null,
  colorPalette: "",
};

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
