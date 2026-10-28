import { ImageGeneratorEngine } from "../../../types";
import { REFACTOR_CONSTANTS } from "../../../constants/refactor";
import { GEMINI_CHAT_VIDEO_INPUT_CONFIG } from "../../../constants/config";
export const FLOW_VIDEO_MODEL_OPTIONS = [
  { value: ImageGeneratorEngine.Veo3, label: REFACTOR_CONSTANTS.ENGINE_OMNI_FLASH },
  { value: ImageGeneratorEngine.Veo3Lite, label: REFACTOR_CONSTANTS.ENGINE_VEO3_LITE },
  { value: ImageGeneratorEngine.Veo3Fast, label: REFACTOR_CONSTANTS.ENGINE_VEO3_FAST },
  { value: ImageGeneratorEngine.Veo3Quality, label: REFACTOR_CONSTANTS.ENGINE_VEO3_QUALITY },
] as const;
export const FLOW_VIDEO_CHARACTER_REFERENCE_CONFIG = { STORAGE_KEY: (projectId: string) => `flow-video-character-references:${projectId}`, MAX_IMAGES: GEMINI_CHAT_VIDEO_INPUT_CONFIG.MAX_REFERENCE_IMAGES, MAX_FILE_BYTES: 10 * 1024 * 1024, ACCEPTED_TYPES: ["image/jpeg", "image/png", "image/webp"], ACCEPT_ATTRIBUTE: "image/jpeg,image/png,image/webp" } as const;
