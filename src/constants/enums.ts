
export enum LogEvent {
  FAILED_LOAD_VOICES = "FAILED_LOAD_VOICES",
  BATCH_SCENE_FAILED = "BATCH_SCENE_FAILED",
  VISUAL_QA_ERROR = "VISUAL_QA_ERROR",
  STYLE_EXTRACTION_ERROR = "STYLE_EXTRACTION_ERROR",
  BATCH_STYLE_REWRITE_FAILED_CHUNK = "BATCH_STYLE_REWRITE_FAILED_CHUNK",
  REWRITE_PROMPTS_ERROR = "REWRITE_PROMPTS_ERROR",
  OPTIMIZE_PROMPTS_ERROR = "OPTIMIZE_PROMPTS_ERROR",
  BATCH_STYLE_REWRITE_FAILED_THUMBNAILS = "BATCH_STYLE_REWRITE_FAILED_THUMBNAILS",
  REWRITE_THUMBNAILS_ERROR = "REWRITE_THUMBNAILS_ERROR",
  CHARACTER_ANALYSIS_ERROR = "CHARACTER_ANALYSIS_ERROR",
  CHARACTER_EXTRACTION_ERROR = "CHARACTER_EXTRACTION_ERROR",
  BATCH_CHARACTER_REWRITE_FAILED_CHUNK = "BATCH_CHARACTER_REWRITE_FAILED_CHUNK",
  REWRITE_PROMPTS_CHARACTER_ERROR = "REWRITE_PROMPTS_CHARACTER_ERROR",
  ERROR_GENERATING_HOOKS = "ERROR_GENERATING_HOOKS",
  ERROR_REWRITING_SCRIPT = "ERROR_REWRITING_SCRIPT",
  DETAILED_PROMPT_ERROR = "DETAILED_PROMPT_ERROR",
  ERROR_GENERATING_STORYBOARD_CHUNKING = "ERROR_GENERATING_STORYBOARD_CHUNKING",
  ERROR_GENERATING_STORYBOARD_GEMINI = "ERROR_GENERATING_STORYBOARD_GEMINI",
  ERROR_GENERATING_SEO = "ERROR_GENERATING_SEO",
  ERROR_GENERATING_THUMBNAILS_PROMPTS = "ERROR_GENERATING_THUMBNAILS_PROMPTS",
  VIDEO_SCENE_SELECTION_ERROR = "VIDEO_SCENE_SELECTION_ERROR",
  TTS_PIPELINE_ERROR = "TTS_PIPELINE_ERROR",
  GENERATE_IMAGE_ROUTE_ERROR = "GENERATE_IMAGE_ROUTE_ERROR",
  GENERATE_BATCH_IMAGES_ROUTE_ERROR = "GENERATE_BATCH_IMAGES_ROUTE_ERROR",
  CLEAN_BATCH_IMAGES_ROUTE_ERROR = "CLEAN_BATCH_IMAGES_ROUTE_ERROR",
  ERROR_READ_MERGED_AUDIO = "ERROR_READ_MERGED_AUDIO",
  ERROR_FFMPEG_MERGE = "ERROR_FFMPEG_MERGE",
  UNEXPECTED_ERROR_MERGE_AUDIO = "UNEXPECTED_ERROR_MERGE_AUDIO",
}
export enum ErrorMessage {
  PROJECT_LOAD_ERROR = "Lỗi tải chi tiết dự án",
  FAILED_TO_FETCH = "Failed to fetch",
  MISSING_SCENE_SCRIPT = "Missing scene script",
  NO_AUDIO_CHUNKS_PROVIDED = "No audio chunks provided",
  FAILED_TO_READ_MERGED_AUDIO_FILE = "Failed to read merged audio file",
  INTERNAL_SERVER_ERROR = "Internal server error: ",
}
export enum SplitStrategy {
  MIXED_SENTENCES = "mixed_sentences",
  ULTRADENSE = "ultradense",
  WORD = "word",
  HYPERDENSE = "hyperdense",
  SHORT_SENTENCE = "short_sentence",
  HIGHPACED = "highpaced",
  DRAMATIC = "dramatic",
  PARAGRAPH = "paragraph",
  EPIC = "epic",
  CINEMATIC = "cinematic",
  ARTISTIC = "artistic",
  SLOWPACED = "slowpaced",
  SUPER_SLOW = "super_slow",
  SENTENCE = "sentence",
  DOCUMENTARY = "documentary",
  LONG_SENTENCE = "long_sentence",
}
export enum VideoGenre {
  CINEMATIC_EPISODE = "Cinematic AI Episode",
  STORY_DRIVEN_VIDEO_ESSAY = "Story-driven Video Essay",
  NARRATIVE_EXPLAINER = "Narrative Explainer",
  CHARACTER_PSYCHOLOGY = "Character Psychology Analysis",
  LORE_WORLD_BUILDING = "Lore and World Breakdown",
  SATIRICAL_LIFE_AUTO = "Satirical Life Story Auto",
  TRANSFORMATION_TIMELINE = "Transformation Timeline",
  CAREER_SOCIAL_DARKSIDE = "Career and Social Darkside",
  DOWNFALL_CONSEQUENCE = "Downfall and Consequence",
  DARK_COMEDY_TRAGEDY = "Dark Comedy Tragedy",
  HISTORY = "History",
  TRUE_CRIME = "True Crime",
  SCIENCE = "Science",
  PSYCHOLOGY = "Psychology",
  PHILOSOPHY = "Philosophy",
  STORYTELLING = "Storytelling",
}
export enum MimeType {
  WAV = "audio/wav",
  MPEG = "audio/mpeg",
  JPEG = "image/jpeg",
  PNG = "image/png",
}
export enum UltraStreamLogType {
  LOG = "log",
  ERROR_LOG = "error_log",
}
export enum SceneDensity {
  THEO_TU = "THEO_TU",
  CAU_NGAN = "CAU_NGAN",
  CAU_KET_HOP = "CAU_KET_HOP",
  CAU_DAI = "CAU_DAI",
  THEO_DOAN = "THEO_DOAN",
}
export enum AppTheme {
  LIGHT = "light",
  DARK = "dark",
}
export enum AppLanguage {
  VI = "vi",
  EN = "en",
}
export enum FileEncoding {
  UTF8 = "utf-8",
}
export const FFMPEG_CONFIG = { OPTIONS_CONCAT: ["-f", "concat", "-safe", "0"], OPTIONS_OUTPUT_MP3: ["-c:a", "libmp3lame", "-b:a", "128k", "-y"] };
export enum SortOrder {
  DESC = "desc",
}
export enum VideoQuality {
  LOW = "low",
  HIGH = "high",
  HIGHEST = "highest",
  ULTRA_4K = "4k",
}
export enum AppTab {
  PROJECTS = "projects",
  AUTO_GENERATOR = "auto-generator",
  CINEMATIC_FILM = "cinematic-film",
  MUSIC_CREATOR = "music-creator",
  PROXY = "proxy",
  MUSIC_MIXER = "music-mixer",
  VIDEO_CREATOR = "video-creator",
  SHORTS_EXTRACTOR = "shorts-extractor",
  VIDEO_EXPORT = "video-export",
  MOTION_VIDEO = "motion-video",
  SETTINGS = "settings",
  DASHBOARD = "dashboard",
}
export enum PIPELINE_STEPS {
  STEP_1 = 1,
  STEP_2 = 2,
  STEP_3 = 3,
  STEP_4 = 4,
}
export enum VOICE_GENDER {
  MALE = "male",
}
export enum HttpStatus {
  OK = 200,
  CREATED = 201,
  BAD_REQUEST = 400,
  NOT_FOUND = 404,
  INTERNAL_SERVER_ERROR = 500,
}
