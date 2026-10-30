export enum VideoExportOptionTone {
  PURPLE = "purple",
  INDIGO = "indigo",
  AMBER = "amber",
}
export enum VideoExportQuality {
  FINAL = "final",
  PREVIEW = "preview",
}
export enum GeminiErrorCategory {
  UnsupportedModel = "unsupported_model",
  ZeroQuota = "zero_quota",
  DailyQuota = "daily_quota",
  RateLimit = "rate_limit",
  Transient = "transient",
  Fatal = "fatal",
}
export enum JobStatus {
  PENDING = "pending",
  PROCESSING = "processing",
  COMPLETED = "completed",
  FAILED = "failed",
  CANCELLED = "cancelled",
}
export enum ResponseContractName {
  Hook = "hook",
  ScriptPlan = "script_plan",
  Chapter = "chapter",
}
export enum AiTaskCapability {
  TextPlanning = "text_planning",
  ScriptWriting = "script_writing",
  FactualReview = "factual_review",
  VisualPlanning = "visual_planning",
  StyleExtraction = "style_extraction",
  VisualQa = "visual_qa",
  AudioQa = "audio_qa",
  Thumbnail = "thumbnail",
}
export enum ConfigIssueSeverity {
  Warning = "warning",
  Blocking = "blocking",
}
export enum ConfigIssueCode {
  CharacterConsistencyDisabled = "character_consistency_disabled",
  ImageModeVideoSettingsRemoved = "image_mode_video_settings_removed",
  ImageModeVideoEngineReplaced = "image_mode_video_engine_replaced",
  NoTextConstraintApplied = "no_text_constraint_applied",
  VideoModeImageEngineUnsupported = "video_mode_image_engine_unsupported",
  VideoModeRoutedThroughGemini = "video_mode_routed_through_gemini",
}
export enum ChapterLanguageIssue {
  MissingVietnameseDiacritics = "missing_vietnamese_diacritics",
  JoinedPunctuation = "joined_punctuation",
  JoinedWords = "joined_words",
}
