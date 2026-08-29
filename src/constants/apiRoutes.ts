export const API_ROUTES = { BASE_API: "/api", PIPELINE: "/api/pipeline", VOICES: "/api/voices", PROJECTS: "/api/projects", PRESETS: "/api/presets", LICENSE: "/api/license", LICENSE_VALIDATE: "/api/license/validate", PIPELINE_ACCOUNTS: "/api/pipeline/accounts", PIPELINE_EXPORT_ZIP: "/api/pipeline/export-zip", PIPELINE_EXTRACT_STYLE: "/api/pipeline/extract-style", PIPELINE_REWRITE_PROMPTS: "/api/pipeline/rewrite-prompts", PIPELINE_ANALYZE_CHARACTER: "/api/pipeline/analyze-character", PIPELINE_EXTRACT_CHARACTER: "/api/pipeline/extract-character", PIPELINE_REWRITE_PROMPTS_CHARACTER: "/api/pipeline/rewrite-prompts-character", PIPELINE_OPTIMIZE_PROMPTS: "/api/pipeline/optimize-prompts", PIPELINE_REWRITE_THUMBNAILS: "/api/pipeline/rewrite-thumbnails", PIPELINE_REWRITE_THUMBNAILS_CHARACTER: "/api/pipeline/rewrite-thumbnails-character", PIPELINE_HOOKS: "/api/pipeline/hooks", PIPELINE_SCRIPT: "/api/pipeline/script", PIPELINE_STORYBOARD: "/api/pipeline/storyboard", PIPELINE_SEO: "/api/pipeline/seo", PIPELINE_THUMBNAILS: "/api/pipeline/thumbnails", PIPELINE_GENERATE_IMAGE: "/api/pipeline/generate-image", PIPELINE_SEARCH_ARCHIVAL_IMAGE: "/api/pipeline/search-archival-image", PIPELINE_GENERATE_BATCH_IMAGES: "/api/pipeline/generate-batch-images", PIPELINE_VALIDATE_SCENE_IMAGE: "/api/pipeline/validate-scene-image", PIPELINE_REPAIR_VIDEO_PROMPT: "/api/pipeline/repair-video-prompt", PIPELINE_SELECT_VIDEO_SCENES: "/api/pipeline/select-video-scenes", PIPELINE_CLEAN_BATCH_IMAGES: "/api/pipeline/clean-batch-images", PIPELINE_PROJECT_ASSETS: "/api/pipeline/project-assets", PIPELINE_REFERENCE_ASSETS: "/api/pipeline/reference-assets", PIPELINE_REFERENCE_AUDIO: "/api/pipeline/reference-audio", PIPELINE_DETAILED_PROMPT: "/api/pipeline/detailed-prompt", PIPELINE_VOICE: "/api/pipeline/voice", PIPELINE_ALIGN_VOICE: "/api/pipeline/align-voice", PIPELINE_MERGE_AUDIO: "/api/pipeline/merge-audio", PIPELINE_VALIDATE_AUDIO: "/api/pipeline/validate-audio", PIPELINE_VALIDATE_FINAL_VIDEO: "/api/pipeline/validate-final-video", PIPELINE_ANALYZE_CINEMATIC_CLIPS: "/api/pipeline/analyze-cinematic-clips", PIPELINE_EXTRACT_THUMBNAIL_FRAME: "/api/pipeline/extract-thumbnail-frame", PIPELINE_RUN_ULTRA: "/api/pipeline/run-ultra", PIPELINE_TEMPLATES: "/api/pipeline/templates", PIPELINE_SELECT_FILE: "/api/pipeline/select-file", PIPELINE_SELECT_FOLDER: "/api/pipeline/select-folder", PIPELINE_FFMPEG_RENDER: "/api/pipeline/ffmpeg-render", PIPELINE_FFMPEG_RENDER_STATUS: "/api/pipeline/ffmpeg-render/status/", PIPELINE_FFMPEG_RENDER_CANCEL: "/api/pipeline/ffmpeg-render/cancel/", PIPELINE_DELETE_ASSET_FILE: "/api/pipeline/delete-asset-file" } as const;

export const EXTERNAL_URLS = { FFMPEG_URL: "https://www.gyan.dev/ffmpeg/builds/ffmpeg-git-full.7z", PLAYWRIGHT_CDP: "http://127.0.0.1:9222", GOOGLE_LABS: "https://labs.google/", GOOGLE_LABS_FLOW_HOME: "https://labs.google/fx/vi/tools/flow", GOOGLE_LABS_FLOW: "https://labs.google/fx/vi/tools/flow/project", GOOGLE_ACCOUNTS: "https://accounts.google.com", GOOGLE_SIGN_IN: "https://accounts.google.com/ServiceLogin?hl=en", GOOGLE_LOGOUT: "https://accounts.google.com/Logout", GOOGLE_MY_ACCOUNT: "https://myaccount.google.com/?hl=vi", GOOGLE_ACCOUNT_ABOUT: "https://www.google.com/account/about", GEMINI_CHAT: "https://gemini.google.com/app", GEMINI_CHAT_BASE: "https://gemini.google.com", AI33_VOICES: "https://api.ai33.pro/v3/voices", AI33_TTS: "https://api.ai33.pro/v3/text-to-speech", AI33_TASK: "https://api.ai33.pro/v1/task", ELEVENLABS_PROJECTS: "https://elevenlabs.io/api/v1/projects" } as const;

export const ALIGN_CONFIG = {
  TEMP_DIR: "temp_align",
  SCRIPT_FILE: "python_scripts/voice_aligner.py",
  CHECK_FASTER_WHISPER_CMD: '"{0}" -c "import faster_whisper"',
  INSTALL_FASTER_WHISPER_CMD: '"{0}" -m pip install faster-whisper',
  VOICES_DIR: "voices",
  AUDIO_PREFIX: "audio_",
  SCENES_PREFIX: "scenes_",
  OUTPUT_PREFIX: "output_",
  SEGMENT_PREFIX: "segment_",
  LEGACY_SEGMENT_PREFIX: "scene_",
  WAV_EXT: ".wav",
  JSON_EXT: ".json",
  LEGACY_SEGMENT_FILE_REGEX: /^scene_sc_.+\.wav$/,
};

export const EXPORT_ZIP_CONFIG = { ERR_MISSING_PROJECT: "Missing projectId", ERR_PROJECT_NOT_FOUND: "Project not found", ERR_SCENE_ASSETS_REQUIRED: "Chưa đủ ảnh phân cảnh để xuất dự án. Hãy hoàn tất và duyệt toàn bộ ảnh rồi thử lại.", ERR_VOICE_REQUIRED: "Chưa có giọng đọc hợp lệ để xuất dự án. Hãy tạo lại giọng đọc rồi thử lại.", ERR_COVER_REQUIRED: "Chưa có ảnh bìa hợp lệ để xuất dự án. Hãy hoàn tất ảnh bìa rồi thử lại.", ERR_AUDIO_SPLIT_FAILED: "Chưa thể chuẩn bị giọng đọc theo phân cảnh. Hãy tạo lại giọng đọc rồi thử xuất lại.", ERR_EXPORT_FAILED: "Chưa thể xuất dự án lúc này. Hãy kiểm tra tài nguyên rồi thử lại.", LOG_EXPORT_FAILED: "CapCut project export failed", VOICES_DIR: "voices", SCENE_PREFIX: "scene_", WAV_EXT: ".wav", EXPORT_FILE: "export.zip" };

export const ENCODING_UTF8 = "utf-8";
export const PROJECTS_FILE_NAME = "projects.json";
export const SQLITE_DB_NAME = "database.db";
export const PROJECTS_BACKUP_DIR_NAME = "projects_backup_json";
export const PROJECTS_DIR_NAME = "projects";
export const ASSETS_DIR_NAME = "assets";
export const IMAGES_DIR_NAME = "images";
export const VOICES_DIR_NAME = "voices";
export const THUMBNAILS_DIR_NAME = "thumbnails";
export const VIDEOS_DIR_NAME = "videos";
export const UNSPLASH_IMAGE_REGEX = /https:\/\/images\.unsplash\.com\/featured\/800x450\/\?([a-zA-Z0-9%_,\-\+]+)/g;

export const API_HEADERS = { AI33_API_KEY: "x-ai33-api-key", GEMINI_API_KEY: "x-gemini-api-key", CEREBRAS_API_KEY: "x-cerebras-api-key", GROQ_API_KEY: "x-groq-api-key", LICENSE_KEY: "x-license-key" } as const;

export const API_QUERY_PARAMS = { PROVIDER: "provider", PAGE: "page", PAGE_SIZE: "page_size", LANGUAGE: "language", GENDER: "gender", AGE: "age", SEARCH: "search" } as const;
