import { translations } from "../lib/lang.js";
import { VideoGenre } from "./enums.js";

export const APP_TEXTS = {
  VN: {
    APP_TITLE: translations.vi.appTitle,
    SAVE: translations.vi.save,
    CANCEL: translations.vi.cancel,
    DELETE: translations.vi.delete,
    EDIT: translations.vi.editProject,
    CLOSE: translations.vi.Close,
    LOADING: translations.vi.Loading,
    SCENE_DETAIL: translations.vi.sceneEditor,
    CONFIRM_DELETE: translations.vi.confirmDelete,
    NEXT_PAGE: translations.vi.Next,
    PREV_PAGE: translations.vi.Previous,
    DRAW_IMAGE: translations.vi.generateImage,
    UPLOAD_IMAGE: translations.vi.uploadSceneAssets,
    NO_IMAGE: translations.vi.charNoImages,
    APPLY: translations.vi.charApplyBtn,
    ERROR_OCCURRED: "Đã có lỗi xảy ra",
    SUCCESS: translations.vi.Success,
    BATCH_DELAY: translations.vi.Batch_Delay,
    BATCH_DELAY_DEFAULT: translations.vi.Batch_Delay_Default,
    BATCH_DELAY_1S: translations.vi.Batch_Delay_1s,
    BATCH_DELAY_2S: translations.vi.Batch_Delay_2s,
    BATCH_DELAY_3S: translations.vi.Batch_Delay_3s,
    BATCH_DELAY_RANDOM_123: translations.vi.Batch_Delay_Random_123,
    WAITING_MSG: (secs: string) => `Đang chờ ${secs} giây trước khi vẽ phân cảnh tiếp theo...`,
    NO_SCENES_TO_OPTIMIZE: "Không tìm thấy phân cảnh nào để cải thiện.",
    OPTIMIZING_PROMPTS_FALLBACK: "Đang tối ưu...",
    OPTIMIZE_PROMPTS_SUCCESS_FALLBACK: "Cải thiện mô tả hình ảnh thành công!",
    OPTIMIZE_PROMPTS_FAILED_FALLBACK: "Gặp sự cố khi tối ưu mô tả ảnh: ",
    OPTIMIZATION_FAILED: "Không thể tối ưu hóa mô tả hình ảnh",
  },
  EN: {
    APP_TITLE: translations.en.appTitle,
    SAVE: translations.en.save,
    CANCEL: translations.en.cancel,
    DELETE: translations.en.delete,
    EDIT: translations.en.editProject,
    CLOSE: translations.en.Close,
    LOADING: translations.en.Loading,
    SCENE_DETAIL: translations.en.sceneEditor,
    CONFIRM_DELETE: translations.en.confirmDelete,
    NEXT_PAGE: translations.en.Next,
    PREV_PAGE: translations.en.Previous,
    DRAW_IMAGE: translations.en.generateImage,
    UPLOAD_IMAGE: translations.en.uploadSceneAssets,
    NO_IMAGE: translations.en.charNoImages,
    APPLY: translations.en.charApplyBtn,
    ERROR_OCCURRED: "An error occurred",
    SUCCESS: translations.en.Success,
    BATCH_DELAY: translations.en.Batch_Delay,
    BATCH_DELAY_DEFAULT: translations.en.Batch_Delay_Default,
    BATCH_DELAY_1S: translations.en.Batch_Delay_1s,
    BATCH_DELAY_2S: translations.en.Batch_Delay_2s,
    BATCH_DELAY_3S: translations.en.Batch_Delay_3s,
    BATCH_DELAY_RANDOM_123: translations.en.Batch_Delay_Random_123,
    WAITING_MSG: (secs: string) => `Waiting ${secs}s before next scene...`,
    NO_SCENES_TO_OPTIMIZE: "No scenes found to improve.",
    OPTIMIZING_PROMPTS_FALLBACK: "Optimizing...",
    OPTIMIZE_PROMPTS_SUCCESS_FALLBACK: "Successfully improved image descriptions!",
    OPTIMIZE_PROMPTS_FAILED_FALLBACK: "Error optimizing image descriptions: ",
    OPTIMIZATION_FAILED: "Could not optimize image descriptions",
  },
};

export const SCENE_SPLIT_PROMPTS = {
  VN: {
    DEFAULT_SCRIPT: (idx: number) => `Chi tiết cốt truyện hấp dẫn phần ${idx} tiếp nối mạch truyện đầy lôi cuốn.`,
    EFFECTS: (style: string) => `Phủ hiệu ứng ánh sáng dịu nhẹ phong cách ${style}`,
    PROMPT: (context: string, style: string, aspectRatio: string) => `Stunning high-quality design depicting: ${context}. Adhering to ${style} style, rich colors, custom cinematic camera composition, dramatic storytelling lighting, detailed award-winning masterpiece. --ar ${aspectRatio}`,
  },
  EN: {
    DEFAULT_SCRIPT: (idx: number) => `Interesting plot detail part ${idx} continuing the engaging narrative.`,
    EFFECTS: (style: string) => `Soft light leaks overlays adhering to ${style} feel`,
    PROMPT: (context: string, style: string, aspectRatio: string) => `Stunning high-quality design depicting: ${context}. Adhering to ${style} style, rich colors, custom cinematic camera composition, dramatic storytelling lighting, detailed award-winning masterpiece. --ar ${aspectRatio}`,
  },
};

export const HTTP_METHODS = {
  PUT: "PUT",
  POST: "POST",
  GET: "GET",
  DELETE: "DELETE",
};

export const CONTENT_TYPES = {
  JSON: "application/json",
};

export const AUDIO_MIME_TYPE = "audio/wav";
export const SIMULATED_SPEECH_VAL = "simulated_speech";
export const BLOB_PREFIX = "blob:";
export const RESTORE_SCENE_BLOB_ERR = "FAILED_RESTORE_SCENE_BLOB";
export const RESTORE_BLOB_ERR = "FAILED_RESTORE_BLOB";

export const CONTENT_TYPE_HEADER = "Content-Type";

export const THEME_VALUES = {
  DARK: "dark",
  LIGHT: "light",
} as const;

export const COMMON_STRINGS = {
  UNDEFINED: "undefined",
  NULL: "null",
  PROJECT_PREFIX: "proj_",
  SIMULATED: "simulated",
  EN: "en",
  VI: "vi",
  BASE64_IMAGE_PREFIX: "data:image/",
  PROJECT_DEFAULT_NAME: "PROJECT",
  JPEG_EXT: "jpeg",
  JPG_EXT: "jpg",
  UNIFIED_WAV: "unified.wav",
  SLASH_ASSETS_SLASH: "/assets/",
} as const;

export const ERROR_MESSAGES = {
  HTTP_ERROR_PREFIX: "HTTP Error ",
  AUTO_SAVE_ERR: "ERROR_AUTO_SAVING_PROJECT",
  PARSING_PROJECTS: "ERROR_PARSING_PROJECTS",
  FETCHING_PROJECTS: "ERROR_FETCHING_PROJECTS",
  CREATING_PROJECT: "ERROR_CREATING_PROJECT",
  DELETING_PROJECT: "ERROR_DELETING_PROJECT",
  UPDATING_PROJECT: "ERROR_UPDATING_PROJECT",
  FLUSH_SAVE_ON_UNMOUNT: "ERROR_FLUSH_SAVE_ON_UNMOUNT",
  PROJECT_READ_ERR: "PROJECT_READ_ERR",
  PROJECT_WRITE_ERR: "PROJECT_WRITE_ERR",
  PROJECT_NOT_FOUND: "PROJECT_NOT_FOUND",
  WRITE_SCENE_IMAGE_ERR: "Lỗi ghi file ảnh scene: ",
  WRITE_SCENE_AUDIO_ERR: "Lỗi ghi file âm thanh scene: ",
  WRITE_THUMB_IMAGE_ERR: "Lỗi ghi file ảnh thumbnail: ",
  WRITE_UNIFIED_AUDIO_ERR: "Lỗi ghi file âm thanh hợp nhất dự án ",
  RENAME_ASSETS_DIR_ERR: "Lỗi đổi tên folder assets",
  DELETE_SCENE_IMAGE_DISK_ERR: "Lỗi khi xóa file ảnh phân cảnh trên đĩa: ",
  READ_IMAGES_DIR_CLEAN_ERR: "Lỗi đọc thư mục ảnh để dọn dẹp: ",
  DELETE_PROJECT_ASSETS_ERR: "Lỗi xóa thư mục assets của dự án",
} as const;

export const LOG_MESSAGES = {
  DELETE_SCENE_IMAGE_DISK_SUCCESS: "Đã xóa file ảnh phân cảnh trên đĩa (dọn dẹp prefix): ",
} as const;

export const DEFAULT_PROJECT_CONFIGS = {
  GENRE: "Storytelling",
  DURATION: "2m",
  AUDIENCE: "General Audience",
  WRITING_STYLE: "Professional",
  HOOK_TYPE: "Auto",
  VOICE_PROVIDER: "Gemini Speech",
  VOICE_EMOTION: "Normal",
  VOICE_URI: "preset-vi-bac",
  VISUAL_SOURCE: "AI Auto",
  VISUAL_STYLE: "Realistic",
  VISUAL_QUALITY: "Standard",
} as const;

export const EXPORT_LOADING_TEXTS = {
  vi: {
    VIDEO_TITLE: "Đang kết xuất Video...",
    VIDEO_DESC: "Vui lòng chờ trong giây lát, tiến trình này có thể mất chút thời gian...",
    CAPCUT_TITLE: "Đang xuất CapCut...",
    XML_TITLE: "Đang xuất cấu trúc XML...",
    ZIP_TITLE: "Đang đóng gói ZIP...",
    SRT_TITLE: "Đang xuất SRT...",
  },
  en: {
    VIDEO_TITLE: "Rendering Video...",
    VIDEO_DESC: "Please wait a moment, this process may take some time...",
    CAPCUT_TITLE: "Exporting CapCut...",
    XML_TITLE: "Exporting XML structure...",
    ZIP_TITLE: "Packaging ZIP...",
    SRT_TITLE: "Exporting SRT...",
  },
} as const;

export const EXPORT_URLS = {
  DEFAULT_S3_BUCKET: "https://s3.amazonaws.com/your-bucket",
} as const;

export const EXTERNAL_AUDIO_TEXTS = {
  LOG_ACTION: "handleProcessExternalAudio",
  LOG_ERROR_KEY: "EXTERNAL_AUDIO_ALIGN_FAILED",
  vi: {
    NO_SCENES: "Không có phân cảnh nào để đồng bộ.",
    ALIGNING: "Đang đồng bộ giọng nói bằng Whisper...",
    SCENE_NOT_FOUND: "Không tìm thấy thông tin đồng bộ cho phân cảnh {sceneId}.",
    ALIGN_SUCCESS: "Đồng bộ giọng nói thành công.",
    NO_VALID_RESULT: "Không có kết quả đồng bộ hợp lệ.",
    SYNC_COMPLETE: "Đồng bộ kịch bản và giọng nói hoàn tất (Tổng thời lượng: {totalDuration}s)\n",
    SYNC_ITEM: "👉 Phân cảnh #{index} [{startTime} -> {endTime}] ({duration}s): {script}...\n",
    ALIGN_ERROR: "Lỗi đồng bộ giọng nói: {error}",
  },
  en: {
    NO_SCENES: "No scenes to synchronize.",
    ALIGNING: "Synchronizing voice with Whisper AI...",
    SCENE_NOT_FOUND: "Sync info not found for scene {sceneId}.",
    ALIGN_SUCCESS: "Voice synchronization successful.",
    NO_VALID_RESULT: "No valid synchronization result.",
    SYNC_COMPLETE: "Storyboard and voice sync completed (Total duration: {totalDuration}s)\n",
    SYNC_ITEM: "👉 Scene #{index} [{startTime} -> {endTime}] ({duration}s): {script}...\n",
    ALIGN_ERROR: "Voice synchronization error: {error}",
  },
} as const;

export const GENRE_VISUAL_GUIDELINES: Record<string, string> = {
  [VideoGenre.HISTORY]: `CRITICAL VISUAL DIRECTIVE - HISTORY GENRE:
- Strict Historical Accuracy: Image prompts must precisely reflect the historical period mentioned in the scene text. Describe historically accurate clothing (e.g., armor, robes, wool tunics), architecture (e.g., wooden huts, stone castles, roman pillars), and technology of the era.
- Historical Context Enrichment: For every scene under a historical theme, the prompt must explicitly specify the historical context, such as the name of the battle or war, the specific era or year (if available), the country, the participating factions/sides, the military units/armies, and the types of soldiers or historical figures involved. This ensures the AI accurately generates period-specific clothing, weapons, flags/banners, insignia, vehicles, and distinct characteristics of the era, preventing confusion between different wars or military forces.
- Character Pinning/Consistency: If specific historical figures, rulers, or classes of people (e.g., Roman legionaries, Victorian ladies, ancient farmers) are mentioned, describe their iconic features and clothing consistently across scenes.
- Settings: Ensure settings match the historical timeline. No modern objects, modern light sources, or modern tools should appear.`,
  [VideoGenre.TRUE_CRIME]: `CRITICAL VISUAL DIRECTIVE - TRUE CRIME GENRE:
- Suspenseful & Moody Atmosphere: Use dark, cinematic, high-contrast chiaroscuro lighting. Focus on shadows, dim streetlights, rainy nights, foggy alleys, and mysterious figures.
- Forensic & Crime Elements: Depict details like police tape, old case files on a wooden desk, flickering projector lights, micro-lens shots of clues, or dramatic silhouettes. Do not include gore, but focus on the atmospheric tension.`,
  [VideoGenre.SCIENCE]: `CRITICAL VISUAL DIRECTIVE - SCIENCE GENRE:
- Clean, Accurate & Futuristic: Depict accurate molecular structures, space visuals, clean futuristic laboratories, holographic interfaces, and detailed scientific diagrams.
- Use vibrant lighting like neon glowing accents, blue laser grids, or high-tech clean white backgrounds.`,
  [VideoGenre.PSYCHOLOGY]: `CRITICAL VISUAL DIRECTIVE - PSYCHOLOGY/PHILOSOPHY GENRE:
- Symbolic & Conceptual Visuals: Use surreal or highly symbolic visual representations to depict thoughts, mental states, dualities of mind, or philosophical concepts (e.g., a person looking into a mirror reflecting a maze, or contrasting dark and light halves of a face).
- Keep a clean, artistic, thought-provoking focus.`,
  [VideoGenre.PHILOSOPHY]: `CRITICAL VISUAL DIRECTIVE - PSYCHOLOGY/PHILOSOPHY GENRE:
- Symbolic & Conceptual Visuals: Use surreal or highly symbolic visual representations to depict thoughts, mental states, dualities of mind, or philosophical concepts (e.g., a person looking into a mirror reflecting a maze, or contrasting dark and light halves of a face).
- Keep a clean, artistic, thought-provoking focus.`,
};

export const VOICE_OPTIMIZATION_TEXTS = {
  vi: {
    LAZY_ALIGN_START: "[Lazy Alignment] Đã đồng bộ ước lượng theo từ khóa (Thời lượng: {totalDuration}s)\n",
    LAZY_ALIGN_ITEM: "- Cảnh {index}: [{startTime} -> {endTime}] ({duration}s) | {script}...\n",
    BG_PROCESS_START: "[Background Voice Process] Bắt đầu đồng bộ Whisper và cắt phân đoạn ngầm...",
    BG_PROCESS_ALIGN_SUCCESS: "[Background Voice Process] Whisper Alignment thành công! Bắt đầu trích xuất âm thanh...",
    BG_PROCESS_COMPLETE: "[Background Voice Process] Hoàn thành đồng bộ và cắt voice ngầm thành công!",
    BG_PROCESS_ERROR: "[Background Voice Process] Lỗi chạy ngầm: {error}",
    BG_PROCESS_RESUME: "[Background Voice Process] Phát hiện dự án chưa được cắt phân đoạn voice. Khôi phục chạy ngầm tự động...",
    EXPORT_ZIP_PRE_SEGMENTED: "[Export ZIP] Sử dụng các phân đoạn voice đã cắt sẵn...",
    EXPORT_ZIP_FALLBACK: "[Export ZIP] Chưa có sẵn voice cắt ngầm. Chạy đồng bộ và cắt tại chỗ...",
    ALIGN_ERROR: "Lỗi lấy dữ liệu align từ Whisper",
  },
  en: {
    LAZY_ALIGN_START: "[Lazy Alignment] Synchronized estimated word-proportion duration (Duration: {totalDuration}s)\n",
    LAZY_ALIGN_ITEM: "- Scene {index}: [{startTime} -> {endTime}] ({duration}s) | {script}...\n",
    BG_PROCESS_START: "[Background Voice Process] Starting background Whisper sync and segmentation...",
    BG_PROCESS_ALIGN_SUCCESS: "[Background Voice Process] Whisper Alignment successful! Starting audio extraction...",
    BG_PROCESS_COMPLETE: "[Background Voice Process] Background sync and segmentation completed successfully!",
    BG_PROCESS_ERROR: "[Background Voice Process] Background process error: {error}",
    BG_PROCESS_RESUME: "[Background Voice Process] Project segments not found. Resuming background process automatically...",
    EXPORT_ZIP_PRE_SEGMENTED: "[Export ZIP] Using pre-segmented voice clips...",
    EXPORT_ZIP_FALLBACK: "[Export ZIP] Pre-segmented voices not found. Syncing and segmenting on the fly...",
    ALIGN_ERROR: "Failed to retrieve alignment data from Whisper",
  },
} as const;
