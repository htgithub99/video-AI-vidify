import _ from "lodash";
import { jsonUtils } from "../lib/json.js";

export const SUNO_AUTOMATION_CONFIG = {
  SUNO_BASE_URL: "https://suno.com",
  SUNO_STUDIO_API_URL: "https://studio-api-prod.suno.com",
  SUNO_DOWNLOAD_ORIGIN: "https://download.sunoupload.site",
  SUNO_CREATE_URL: "https://suno.com/create",
  EXPECTED_ACCOUNT_EMAIL: "toanleoht@gmail.com",
  SUNO_CDP_PORT: 9444,
  SUNO_CDP_HOST: "127.0.0.1",
  SUNO_PROFILE_DIR_NAME: "suno_chrome_profile",
  CHROME_DEFAULT_PROFILE: "Default",
  CHROME_ARG_REMOTE_ORIGINS: "--remote-allow-origins=*",
  CHROME_ARG_NO_FIRST_RUN: "--no-first-run",
  CHROME_ARG_NO_DEFAULT_CHECK: "--no-default-browser-check",

  GOTO_PAGE_TIMEOUT_MS: 60_000,
  VERIFY_ACCOUNT_WAIT_MS: 2000,
  CREATE_FORM_TIMEOUT_MS: 30_000,
  CREATE_SONG_DEADLINE_MS: 120_000,
  GENERATE_RESPONSE_TIMEOUT_MS: 30_000,
  CREATE_ATTEMPTS_PER_PROMPT: 2,
  MIN_TRACKS_PER_PROMPT: 2,
  BETWEEN_SONG_PROMPTS_DELAY_MS: 3000,
  RETRY_PROMPT_DELAY_MS: 3000,
  MAX_CONCURRENT_PROMPTS: 10,
  GENERATION_SLOT_POLL_MS: 2000,
  POLL_INTERVAL_MS: 1500,
  PLAYLIST_WAIT_MS: 1500,
  SONG_PAGE_READY_TIMEOUT_MS: 30_000,
  PLAYLIST_OPTION_TIMEOUT_MS: 10_000,
  PLAYLIST_VERIFY_WAIT_MS: 4000,
  INSPO_SEARCH_WAIT_MS: 1000,
  INSPO_SELECT_WAIT_MS: 500,

  WEIRDNESS_GENTLE: 35,
  WEIRDNESS_DEFAULT: 50,
  STYLE_INFLUENCE_GENTLE: 80,
  STYLE_INFLUENCE_DEFAULT: 65,
  VARIETY_GENTLE: 25,
  VARIETY_DEFAULT: 45,

  APP_SUBDIR: "VideoAI-Vidify",
  STATUS_PENDING: "pending",
  STATUS_COMPLETE: "complete",
  STATUS_TERMINAL_FAILURES: ["error", "failed", "blocked", "cancelled"] as const,
  OPTION_AUTO: "Auto",
  OPTION_ON: "On",
  OPTION_OFF: "Off",

  DEFAULT_COLLECTION_TITLE: "Tuyển tập nhạc",
  DEFAULT_REFERENCE_THUMBNAIL_NAME: "thumbnail-reference.png",
  REFERENCE_SOURCE_CHUNK_DIVIDER: "\n\n--- REFERENCE SOURCE ---\n\n",
  SECTION_DIVIDER: "\n\n----------------------------------------\n\n",
  TEXT_SEPARATOR_LINE: "----------------------------------------",
  ARTIFACT_TYPE_SOURCE: "music_reference_source",
  ARTIFACT_TYPE_STYLE_ANALYSIS: "music_style_analysis",
  ARTIFACT_TYPE_RANKING: "music_song_ranking",
  ARTIFACT_TYPE_SETTINGS: "music_suno_settings",
  ARTIFACT_TYPE_SEO: "music_playlist_seo",
  MUSIC_PLAN_WORKER_TYPE: "music-creator",
  TRACK_EVALUATION_WORKER_ID: "music-track-evaluation-room",
  ARTIFACT_TYPE_MUSIC_EVALUATION: "music-track-evaluation",
  AUDIO_DOWNLOAD_TIMEOUT_MS: 120_000,
  AUDIO_DOWNLOAD_WAV_TIMEOUT_MS: 180_000,
  MAX_EVALUATION_ATTEMPTS: 3,
  EVALUATION_SONGS_PER_CHUNK: 5,
  EVALUATION_AUDIO_DOWNLOAD_CONCURRENCY: 2,
  EVALUATION_AUDIO_DOWNLOAD_ATTEMPTS: 3,
  EVALUATION_AUDIO_RETRY_DELAY_MS: 1500,
  EVALUATION_RUN_ID_PREFIX: "music-track-evaluation-",
  RUN_ID_PREFIX: "music_",
  THUMBNAIL_EXPORT_FILENAME: "COVER",
  TEMP_ATTACHMENT_DIR_PREFIX: "vidify-suno-evaluation-",

  VOCAL_GENDER_MALE: "male",
  VOCAL_GENDER_FEMALE: "female",
  VOCAL_GENDER_AUTO: "auto",
  DURATION_AUTO: "auto",
  FORMAT_MP3: "mp3",
  FORMAT_WAV: "wav",
  MIME_MP3: "audio/mpeg",
  MIME_WAV: "audio/wav",
  MIME_IMAGE_JPEG: "image/jpeg",
  MIME_IMAGE_PNG: "image/png",
  MIME_IMAGE_PREFIX: "image/",
  JPEG_HEADER_SIGNATURE: "/9j/",
  JPEG_DATA_PREFIX: "data:image/jpeg",
  ENCODING_UTF8: "utf8",
  LOG_SUBDIR: "logs",
  LOG_FILENAME_CURATED: "suno-curated-download.jsonl",

  EVENT_REQUEST_STARTED: "request_started",
  EVENT_CHUNK_EVAL_RETRY: "chunk_evaluation_retry",
  EVENT_TRACKS_READY: "tracks_ready",
  EVENT_CHUNK_EVAL_STARTED: "chunk_evaluation_started",
  EVENT_CHUNK_EVAL_COMPLETED: "chunk_evaluation_completed",
  EVENT_ALL_EVALS_COMPLETED: "all_evaluations_completed",
  EVENT_DOWNLOAD_STARTED: "download_started",
  EVENT_REQUEST_COMPLETED: "request_completed",
  EVENT_REQUEST_FAILED: "request_failed",
  EVENT_ABORTED: "aborted",
  SUNO_CDP_URL: "http://127.0.0.1:9444",
  HEADER_BROWSER_TOKEN: "browser-token",
  HEADER_DEVICE_ID: "device-id",
  HEADER_CONTENT_TYPE: "content-type",
  MIME_APPLICATION_JSON: "application/json",
  HTTP_METHOD_POST: "POST",
  HTTP_METHOD_PATCH: "PATCH",
  XPATH_CURSOR_POINTER_DIV: "xpath=ancestor::div[contains(@class, 'cursor-pointer')][1]",
  HASH_PREFIX: "#",
  formatAudioDownloadUrl: (origin: string, songId: string, format: string): string =>
    `${_.trim(origin).replace(/\/$/, "")}/api/file/${encodeURIComponent(songId)}/${format}`,
  formatTempAttachmentFileName: (index: number, songId: string, format: string = "mp3"): string =>
    `${index + 1}-${songId}.${format}`,
  formatChunkEvaluationRequestId: (projectId: string, title: string, attempt: number): string =>
    `${projectId}-chunk-${_.kebabCase(title)}-${attempt}`,

  MUSIC_STYLE_LIBRARY_KEY: "music_creator_style_library",
  MUSIC_INSPO_LIBRARY_KEY: "music_creator_inspo_library",
  MUSIC_CREATOR_STATE_KEY: "music_creator_workspace_state_v1",
  MUSIC_SEO_SCHEMA_VERSION: 6,
  MUSIC_MEDIA_DB_NAME: "music_creator_media",
  MUSIC_MEDIA_STORE_NAME: "assets",
  MEDIA_KEY_REFERENCE: "reference",
  MEDIA_KEY_GENERATED: "generated",
  SEO_EXPORT_FILENAME: "SEO",
  TEXT_PLAIN_UTF8: "text/plain;charset=utf-8",
  OCTET_STREAM: "application/octet-stream",
  TXT_EXTENSION: ".txt",
  JPG_EXTENSION: "jpg",
  PNG_EXTENSION: "png",
  ABORT_ERROR_NAME: "AbortError",
  VIEW_MODE_LYRICS: "lyrics",
  VIEW_MODE_SEO: "seo",
  VIEW_MODE_SPLIT: "split",
  TARGET_BLANK: "_blank",
  OPENER_POLICY: "noopener,noreferrer",
  LOCALE_VI: "vi-VN",
  DEFAULT_SAVE_FILE_NAME: "export.txt",
  SAVE_FILE_TEMP_PREFIX: "vidify-save-file-",
  SAVE_FILE_PAYLOAD_NAME: "payload",
  CAPCUT_ULTRA_TOOL_SCRIPT: "python_scripts/capcut_ultra_tool.py",
  CMD_SAVE_FILE: "save-file",
  ENCODING_BASE64: "base64",
  SEO_HEADING_TRACKLIST: "DANH SÁCH CA KHÚC:",
  SEO_HEADING_OCCASIONS: "PHÙ HỢP KHI:",
  STAGE_INITIALIZE: "initialize",
  STAGE_SOURCE_ANALYSIS: "source-analysis",
  STAGE_STYLE_ANALYSIS: "style-analysis",
  STAGE_SONG_COMPOSITION: "song-composition",
  STAGE_SONG_RANKING: "song-ranking",
  STAGE_SUNO_SETTINGS: "suno-settings",
  STAGE_SEO_AND_THUMBNAIL: "seo-and-thumbnail",
  DEFAULT_FALLBACK_STYLE: "Original music",
  DEFAULT_TRACK_LABEL: "Track",
} as const;

export const SUNO_AUTOMATION_PATTERNS = {
  EXPECTED_SUNO_PROFILE: /musicaivietnam|Toàn\s+Leo/i,
  SONG_URL: /\/song\/([a-z0-9-]{20,})/i,
  GENERATE_API: /\/api\/generate\//i,
  BODY_CREATE: /Create/i,
  BODY_LIBRARY_STUDIO: /Library|Studio/i,
  GENTLE_GENRE: /(bolero|ballad|trữ tình|acoustic|folk|nhạc vàng)/i,
  FEMALE_VOICE: /(female|nữ|woman|giọng nữ)/i,
  MALE_VOICE: /(male|nam|man|giọng nam)/i,
  WEIRDNESS_LABEL: /Weirdness/i,
  STYLE_INFLUENCE_LABEL: /Style Influence/i,
  VARIETY_LABEL: /Variety/i,
  PLAYLIST_API: /studio-api-prod\.suno\.com\/api\/playlist\//i,
  SECTION_DURATION: /Duration/i,
  SECTION_MAX_MODE: /Max Mode/i,
  SECTION_PERSONALIZE: /Personalize/i,
  INVALID_FILE_CHARS: /[<>:"/\\|?*]/g,
  WHITESPACES: /\s+/g,
  TRAILING_DOTS_SPACES: /[. ]+$/g,
  TRAILING_SLASH: /\/$/,
  STYLE_HEADING: /^Styles?$/i,
  PRIVACY_CENTER: /Privacy Preference Center/i,
  LEADING_INDEX: /^\d+[.)]\s*/,
  ADVANCED_TEXT: /Advanced/i,
  CREATION_FORM_KEYWORDS: /(Lyrics|Styles|Inspo)/i,
  PLAYLIST_ID_IN_HREF: /\/playlist\/([^/?]+)/i,
  VALID_PLAYLIST_URL: /^https:\/\/(?:www\.)?suno\.com\/playlist\//i,
  HASHTAG_VALIDATION: /^#[\p{L}\p{N}_]+$/u,
  ASCII_HASHTAG_VALIDATION: /^#[A-Za-z0-9_]+$/,
  STYLE_SPLIT_SEPARATORS: /[,.;\n]/,
  TRACK_VARIANT_SUFFIX: /\s+-\s+[12]$/,
  SEO_TITLE_LOUD_PUNCTUATION: /!{2,}|\?{2,}/,
  SEO_TITLE_MISLEADING_CLAIMS: /\b(hay nhất|top\s*1|số\s*1|triệu view|viral|gây sốc|không thể bỏ qua|mới nhất)\b/i,
  LETTER_ONLY: /[^\p{L}]+/gu,
  UNICODE_LETTER: /\p{L}/u,
  UNICODE_UPPERCASE_LETTER: /^\p{Lu}/u,
  SEO_SEARCHABLE_OPENING: /nhạc|bolero|ballad|trữ tình|tuyển tập|playlist|album/i,
  DATA_URL_BASE64: /^data:([^;,]+)(?:;charset=[^;,]+)?;base64,([a-z0-9+\/=\r\n]+)$/i,
  buildSongCountMatchRegex: (songsLength: number) => new RegExp(`\\b${songsLength}\\s*(?:ca khúc|bài hát|bài)\\b`, "gi"),
} as const;

export const SUNO_AUTOMATION_SELECTORS = {
  BODY: "body",
  SONG_ANCHOR: 'a[href*="/song/"]',
  RANGE_INPUT: 'input[type="range"]',
  RANGE_CONTAINER_XPATH: "xpath=ancestor::*[.//input[@type='range']][1]",
  RANGE_PARENT_XPATH: "xpath=ancestor::*[.//button][1]",
  STYLE_INPUT_CONTAINER_XPATH: 'xpath=ancestor::div[.//textarea or .//*[@contenteditable="true"]][1]',
  STYLE_TEXTAREA_FILTER: 'textarea:not([placeholder*="exclude" i]), [contenteditable="true"]:not([aria-label*="exclude" i])',
  DIALOG_ROLE: '[role="dialog"]',
  COOKIE_CONSENT_BUTTON: [
    'button:has-text("Reject All")',
    'button:has-text("Allow All")',
    'button:has-text("Confirm My Choices")',
  ] as const,

  ADVANCED: [
    'button:has-text("Advanced")',
    '[role="tab"]:has-text("Advanced")',
  ] as const,
  STYLE_INPUT: [
    'textarea[placeholder*="catchy riffs" i]',
    'textarea[placeholder*="rap old school" i]',
    'textarea[placeholder*="style" i]:not([placeholder*="exclude" i])',
    '[contenteditable="true"][aria-label*="style" i]:not([aria-label*="exclude" i])',
    'textarea[aria-label*="style" i]:not([aria-label*="exclude" i])',
  ] as const,
  EXCLUDE_STYLES_INPUT: ['input[placeholder*="Exclude styles" i]', 'textarea[placeholder*="Exclude styles" i]'] as const,
  OPTIONS_BUTTON: [
    '[role="button"]:has-text("More Options")',
    'button:has-text("More Options")',
    'button:has-text("Advanced Options")',
    'button:has-text("Options")',
  ] as const,
  FEMALE_BUTTON: [
    'button:has-text("Female")',
    '[role="radio"]:has-text("Female")',
  ] as const,
  MALE_BUTTON: [
    'button:has-text("Male")',
    '[role="radio"]:has-text("Male")',
  ] as const,
  INSPO_BUTTON: [
    'button:has-text("Inspo")',
    '[role="button"]:has-text("Inspo")',
  ] as const,
  INSPO_SEARCH_INPUT: [
    '[role="dialog"] input[placeholder*="Search" i]',
    '[role="dialog"] input[type="search"]',
    'input[placeholder*="Search" i]',
  ] as const,
  LYRICS_INPUT: [
    'textarea[placeholder*="lyrics" i]',
    '[contenteditable="true"][aria-label*="lyrics" i]',
    '[contenteditable="true"]:below(:text("Lyrics"))',
  ] as const,
  TITLE_INPUT: [
    'input[placeholder*="Song Title" i]',
    'input[aria-label*="Song Title" i]',
  ] as const,
  CREATE_BUTTON: [
    'button:has-text("Create")',
  ] as const,

  MORE_MENU_NAME: "More menu contents",
  ADD_TO_PLAYLIST_TEXT: "Add to Playlist",
  PLAYLIST_NAME_PLACEHOLDER: "Playlist Name",
  CREATE_PLAYLIST_NAME: "Create Playlist",
  BROWSER_CLOSE_CMD: "Browser.close",
  BROWSER_GET_WINDOW_CMD: "Browser.getWindowForTarget",
  BROWSER_SET_BOUNDS_CMD: "Browser.setWindowBounds",
  WINDOW_STATE_NORMAL: "normal",
  CONTROL_A: "Control+A",
  EVENT_INPUT: "input",
  EVENT_CHANGE: "change",
  ARIA_EXPANDED: "aria-expanded",
  VAL_TRUE: "true",
  UPDATE_TYPE_ADD: "add",
  WAIT_DOM_LOADED: "domcontentloaded" as const,
  WAIT_COMMIT: "commit" as const,
  STATE_HIDDEN: "hidden" as const,
  STATE_VISIBLE: "visible" as const,
} as const;

export const SUNO_AUTOMATION_TEXTS = {
  CHROME_OPENED: "Chrome Suno đang mở.",
  CHROME_NOT_FOUND_ERR: "Không tìm thấy Chrome để mở profile Suno.",
  ADVANCED_MODE_NOT_FOUND_ERR: "Không tìm thấy chế độ Advanced của Suno.",
  STYLE_INPUT_NOT_FOUND_ERR: "Không tìm thấy ô Styles của Suno.",
  STYLE_INPUT_NOT_APPLIED_ERR: "Suno chưa nhận phong cách đã chọn.",
  MORE_OPTIONS_NOT_FOUND_ERR: "Không tìm thấy mục More Options của Suno.",
  INSPO_BUTTON_NOT_FOUND_ERR: "Không tìm thấy nút Inspo của Suno.",
  INSPO_SEARCH_NOT_FOUND_ERR: "Không tìm thấy ô tìm kiếm playlist Inspo.",
  PLAYLIST_URL_NOT_FOUND_ERR: "Đã tạo nhạc nhưng chưa lấy được URL playlist từ Suno.",
  PLAYLIST_BATCH_ADD_FAILED_ERR: "Suno không chấp nhận thêm toàn bộ bài hát vào playlist mới.",
  MISSING_SONGS_OR_STYLE_ERR: "Thiếu bài hát hoặc phong cách Suno.",
  CONNECT_CDP_ERR: "Không thể kết nối Chrome Suno riêng.",
  CANCELLED_ERR: "Đã hủy tạo nhạc Suno.",
  ALREADY_RUNNING_ERR: "Một tác vụ tạo nhạc Suno khác đang chạy.",
  GENERATION_FAILED_ERR: "Suno không thể hoàn tất một bài hát trong hàng đợi.",
  GENERATION_QUEUE_TIMEOUT_ERR: "Suno xử lý hàng đợi quá lâu. Vui lòng tiếp tục lại sau.",
  DOWNLOAD_FOLDER_INVALID_ERR: "Thư mục lưu nhạc không hợp lệ.",
  DOWNLOAD_TRACKS_REQUIRED_ERR: "Không có bài hát Suno để tải xuống.",
  DOWNLOAD_TRACK_FAILED_ERR: "Không thể tải bài hát Suno.",
  CURATED_DOWNLOAD_COUNT_MISMATCH_ERR: "Số bài Tuyển chọn tải về không khớp số bài đầu vào.",
  CURATED_EVALUATION_COUNT_MISMATCH_ERR: "Số bài được chọn thẩm âm không khớp với số bài yêu cầu.",
  DEFAULT_TRACK_PREFIX: "Suno track",
  EMPTY_DIAGNOSTIC: "trang trống",

  VALIDATION_PLAYLIST_INPUT_ERR: "Danh sách bài hát hoặc phong cách Suno chưa đầy đủ.",
  FAILED_COMPLETE_SUNO_ERR: "Không thể hoàn tất tạo nhạc trên Suno.",
  CHROME_LOGIN_FAILED_ERR: "Không thể mở Chrome Suno.",
  LOG_SUNO_AUTOMATION_FAILED: "Suno automation failed.",
  LOG_CURATED_DOWNLOAD_FAILED: "Suno curated download failed.",
  LOG_MUSIC_COVER_FAILED: "Could not generate music cover with Gemini.",
  INVALID_FILE_DATA_ERR: "Dữ liệu tệp không hợp lệ.",
  SAVE_FILE_DIALOG_FAILED_LOG: "Save file dialog failed",
  SAVE_FILE_DIALOG_FAILED_ERR: "Không thể mở hộp thoại hoặc lưu tệp.",
  SAVE_FILE_FAILED_ERR: "save_file_failed",

  formatChromeLaunchedMsg: (email: string) =>
    `Đã mở Chrome Suno riêng cho ${email}. Hãy đăng nhập rồi đóng tab này khi xong.`,
  formatProfileNotSignedInErr: (email: string) =>
    `Profile Chrome của "${email}" chưa đăng nhập đúng workspace Suno đã cấu hình.`,
  formatDiagnosticDisplay: (diagnostic: string) =>
    `Suno hiện hiển thị: ${diagnostic}`,
  formatInspoNotFoundErr: (targetName: string) =>
    `Không tìm thấy playlist Inspo khớp chính xác: "${targetName}".`,
  formatInputsNotFoundErr: (title: string) =>
    `Không tìm thấy ô Lyrics hoặc Song Title cho bài "${title}".`,
  formatCreateButtonNotReadyErr: (title: string) =>
    `Nút Create chưa sẵn sàng cho bài "${title}".`,
  formatSongIdTimeoutErr: (title: string) =>
    `Suno chưa trả ID cho bài "${title}".`,
  formatNotEnoughTracksErr: (title: string, actual: number, expected: number) =>
    `Suno chỉ trả ${actual}/${expected} track cho prompt "${title}"; đã dừng để không tạo playlist thiếu bài.`,
  formatPlaylistMissingTracksErr: (missing: number, expected: number) =>
    `Playlist Suno vẫn thiếu ${missing}/${expected} track sau khi hệ thống đã tự thêm lại.`,
  formatPlaylistTitle: (firstSongTitle: string, songCount: number) =>
    `TUYỂN TẬP ${songCount} CA KHÚC - ${firstSongTitle.toLocaleUpperCase("vi-VN")}`,
  TRACK_EVALUATION_ROOM_REQUIRED_ERR: "Thẩm âm bài hát bằng AI yêu cầu cấu hình phòng Gemini.",
  INVALID_TRACK_SELECTION_ARTIFACT: "invalid_suno_track_selection",
  INVALID_SELECTED_TRACK_ID_ERR: "invalid_suno_selected_track_id",
  formatDownloadHttpError: (status: number) => `suno_download_http_${status}`,
  formatDownloadTrackFailedErr: (title: string) => `${SUNO_AUTOMATION_TEXTS.DOWNLOAD_TRACK_FAILED_ERR} ${title}`,
  formatDownloadTrackWithCauseErr: (title: string, cause?: unknown) =>
    `${SUNO_AUTOMATION_TEXTS.DOWNLOAD_TRACK_FAILED_ERR} ${title} ${_.toString(_.get(cause, "message", ""))}`.trim(),
  formatSongVariantTitle: (songNumber: number, title: string, variantNumber: number) =>
    `${songNumber}. ${title} - ${variantNumber}`,
  formatDataUrl: (mimeType: string, base64: string) =>
    `data:${mimeType};base64,${base64}`,
  formatAudioHeaderAccept: (format: string) =>
    format === "wav" ? "audio/wav,*/*" : "audio/mpeg,*/*",

  CONTRACT_INVALID_JSON_ISSUE: "response is not parseable JSON",
  CONTRACT_ARTIFACT_TYPE_ISSUE: "artifactType is incorrect",
  CONTRACT_REQUEST_ID_ISSUE: "requestId is incorrect",
  CONTRACT_STYLE_ANALYSIS_ISSUE: "one or more required Music DNA fields or arrays are empty/invalid",
  CONTRACT_SEO_CHECKS_FAILED_ISSUE: "one or more title-case, uniqueness, ASCII, length, or clickbait checks failed",
  formatSongCountIssue: (expected: number) => `songs must contain exactly ${expected} items`,
  formatSongNoIdIssue: (label: string) => `${label} has no songId`,
  formatSongNoTitleIssue: (label: string) => `${label} has no title`,
  formatSongLyricsLengthIssue: (label: string, actual: number) => `${label} lyrics have ${actual}/300 characters`,
  formatSongNoSectionLabelIssue: (label: string) => `${label} lyrics have no Suno section label`,
  formatSongGenreMoodEmptyIssue: (label: string) => `${label} genre or mood is empty`,
  formatSongTempoOutOfRangeIssue: (label: string) => `${label} tempoBpm is outside 40-240`,
  formatSongStructureIssue: (label: string) => `${label} needs at least 3 structure entries`,
  formatSongOriginalityNotesIssue: (label: string) => `${label} needs originalityNotes`,
  formatSeoOptionsCountIssue: (expected: number) => `seoOptions must contain exactly ${expected} items`,
  formatTitleLengthIssue: (label: string) => `${label} title length must be 15-99`,
  formatTitleDiacriticsIssue: (label: string) => `${label} title must use Vietnamese diacritics`,
  formatDescriptionDiacriticsIssue: (label: string) => `${label} description must use Vietnamese diacritics`,
  formatDescriptionEmojiIssue: (label: string) => `${label} description must begin with exactly one emoji and a space`,
  formatHashtagsCountIssue: (label: string) => `${label} must contain exactly 10 hashtags`,
  formatTagsCountIssue: (label: string) => `${label} must contain exactly 12 tags`,
  formatSeoScoreIntegerIssue: (label: string) => `${label} seoScore must be an integer`,

  buildTrackBatchEvaluationPrompt: (style: string, groups: Array<{ title: string; candidates: string[] }>, schemaString: string) =>
    `Listen to every attached audio file before answering. Act as a professional Vietnamese-market singer, songwriter, producer and music editor. Evaluate each pair for vocal quality, diction, emotion, composition, arrangement, mix, defects, genre authenticity, replay value and market fit. Select exactly one winner per song; never select a losing take. Then assign each selected winner a strict integer quality score from 0 to 100 so winners can be ranked across the complete playlist. Attachment filenames contain the corresponding track IDs. Do not explain your scores.\n\nStyle: ${style}\nPairs:\n${groups.map((group, index) => `${index + 1}. ${group.title}: ${group.candidates[0]} OR ${group.candidates[1]}`).join("\n")}\n\nReturn raw JSON only. selectedTrackIds and qualityScores must preserve pair order:\n${schemaString}`,
  buildTrackBatchEvaluationRetryPrompt: (groups: Array<{ title: string; candidates: string[] }>, schemaString: string) =>
    `Previous response was invalid. Listen to the attached audio and evaluate these exact pairs again:\n${groups.map((group, index) => `${index + 1}. ${group.title}: choose exactly one of [${group.candidates.join(" OR ")}]`).join("\n")}\nReturn selectedTrackIds and integer qualityScores with exactly ${groups.length} entries each in the same pair order. Never return an ID outside its listed pair. Every score must be from 0 to 100. Return raw JSON only:\n${schemaString}`,

  buildMusicSourcePrompt: (chunk: string, chunkIndex: number, chunkCount: number, requestId: string): string =>
    `REFERENCE SOURCE PART ${chunkIndex + 1}/${chunkCount}. Store this source as authoritative creative context for the music project; do not create songs yet. Treat all parts as one continuous source.

Analyze internally as a complete professional music team:
- Songwriter/composer: infer melodic language, phrasing cadence, harmonic movement, hook placement and song-form conventions.
- Lyricist: infer source language, regional audience, natural vocabulary/register, rhyme behavior, imagery, themes, narrative voice and singable syllable flow.
- Music producer: infer genre/subgenre, tempo range, groove, instrumentation, vocal character, arrangement density, emotional dynamics and listener context.

Build one source-derived creative blueprint and retain it for every later song batch. Distinguish non-negotiable style DNA from details that should vary between songs. The output must feel native and culturally credible to listeners in the source's region—not translated or generically Vietnamese by default. Use only high-level traits: never copy lyrics, melody, chord sequence, hook, distinctive phrases, titles, recording identity or artist identity. Reply raw JSON only: {"artifactType":"${SUNO_AUTOMATION_CONFIG.ARTIFACT_TYPE_SOURCE}","requestId":"${requestId}","receivedPart":${chunkIndex + 1},"totalParts":${chunkCount}}\n\nSOURCE PART:\n${chunk}`,

  buildMusicStyleAnalysisPrompt: (style: string, hasReferenceSource: boolean, requestId: string): string =>
    `Return raw JSON only. Before composing any song, act as a musicologist, cultural researcher, songwriter, lyricist, producer and A&R editor. ${hasReferenceSource ? "Analyze every reference-source part stored earlier in this room." : "No reference source was supplied, so analyze only the user's global guidance and clearly mark uncertain conclusions."}

USER GLOBAL GUIDANCE:
${style}

Create one evidence-aware Music DNA and a SYNTHETIC SONGWRITER PROFILE for this project. Determine, when supportable: country and musical culture, region or diaspora context, language, dialect and register, intended listener age, lyrical-character age, content suitability, songwriting era, production era, primary genre and subgenres, rhythmic feel, tempo range, harmony, melodic phrasing, hook placement, song forms, instrumentation, vocal character, themes, imagery, rhyme behavior and listening context.

Identify relevant singers, songwriters, composers, scenes or traditions only as historical influences. Never impersonate a real artist and never instruct later writing to copy a living artist's signature style. Convert all named influences into high-level, non-exclusive craft traits inside creativeProfile. Separate mustPreserve, mustVary and mustNotCopy. Put every weak inference in uncertainties. Evidence must cite a short source clue or "user guidance" and must not invent facts the input cannot support.

Required JSON shape: {"artifactType":"${SUNO_AUTOMATION_CONFIG.ARTIFACT_TYPE_STYLE_ANALYSIS}","requestId":"${requestId}","market":{"country":"","region":"","language":"","dialect":"","audienceAge":"","lyricalCharacterAge":"","contentSuitability":"","confidence":0},"era":{"songwritingEra":"","productionEra":""},"genre":{"primary":"","secondary":[],"influences":[]},"musicalDna":{"tempoRange":"","rhythm":"","harmony":"","melodicLanguage":"","hookPlacement":"","songForms":[],"instrumentation":[],"vocalCharacter":"","listeningContext":""},"lyricalDna":{"themes":[],"narrativeVoice":"","vocabulary":"","imagery":[],"rhymeBehavior":""},"historicalInfluences":[{"name":"","role":"","relevance":""}],"creativeProfile":{"role":"","strengths":[],"writingPrinciples":[],"productionPrinciples":[]},"mustPreserve":[],"mustVary":[],"mustNotCopy":[],"uncertainties":[],"evidence":[{"claim":"","sourceClue":"","confidence":0}]}. All confidence values are integers 0-100.`,

  buildMusicStyleAnalysisCorrectionPrompt: (style: string, hasReferenceSource: boolean, requestId: string, issues: string[] = []): string =>
    `CORRECTION: The previous JSON failed these exact checks: ${issues.join("; ") || "incomplete contract"}. Return complete raw JSON only for artifactType "${SUNO_AUTOMATION_CONFIG.ARTIFACT_TYPE_STYLE_ANALYSIS}" and requestId "${requestId}". Re-analyze ${hasReferenceSource ? "all stored reference parts plus" : "only"} the user guidance "${style}". Include complete market, era, genre, musicalDna, lyricalDna, historicalInfluences, creativeProfile, mustPreserve, mustVary, mustNotCopy, uncertainties and evidence fields. Every text field must contain a useful value; songForms, instrumentation, themes, imagery, strengths, writingPrinciples, productionPrinciples, mustPreserve, mustVary, mustNotCopy and evidence must each contain at least one item. Only secondary, influences, historicalInfluences and uncertainties may be empty. Use integer confidence 0-100, mark unsupported conclusions as uncertain, and convert artist references into high-level craft traits rather than imitation instructions.`,

  buildMusicPlanPrompt: (batchCount: number, startIndex: number, totalCount: number, style: string, styleAnalysis: unknown, requestId: string, artifactType: string): string => {
    const endIndex = startIndex + batchCount - 1;
    return `Return raw JSON only. Work simultaneously as: (1) songwriter/composer responsible for memorable melodic contour, harmony, hooks and complete song form; (2) lyricist responsible for meaningful, natural, singable lyrics; and (3) music producer responsible for genre authenticity, arrangement, vocal direction, pacing and audience fit.

Create songs ${startIndex}-${endIndex} of the ${totalCount}-song project: exactly ${batchCount} original songs for Suno. Adopt the synthetic songwriter role and craft principles from the approved Music DNA below. Do not impersonate or copy any named real artist; historical influences are context only. Treat mustPreserve, mustVary, mustNotCopy and uncertainties as binding constraints.

APPROVED MUSIC DNA:
${jsonUtils.safeStringify(styleAnalysis)}

Global guidance: ${style}

Before writing each song, internally decide its distinct central idea, emotional arc, memorable hook concept, verse-to-chorus development, rhyme/phonetic plan and arrangement arc. Lyrics must sound originally written by a native songwriter for the inferred target region, remain easy to sing at the chosen tempo, avoid translation-shaped wording, filler lines, forced rhymes, mixed dialects and generic repeated imagery. The chorus must deliver the song's emotional promise; verses must progress rather than paraphrase each other; bridge/outro must have a musical purpose.

Song IDs must be song_${String(startIndex).padStart(3, "0")} through song_${String(endIndex).padStart(3, "0")}. Keep every song meaningful, coherent, legally distinct, and different from every song previously created in this room while preserving the shared source/style identity. Each song must include songId, a compelling native-language title, complete performance-ready lyrics of at least 300 characters with Suno section labels, specific genre, mood, integer tempoBpm from 40 through 240, structure with at least 3 non-empty sections, and originalityNotes with at least one concrete note explaining how it remains original while fitting the source-derived blueprint. Never copy lyrics, melodies, hooks, titles, signature phrases or artist identity from the reference. Do not create per-song style prompts or per-song SEO because the user applies the one global style above to the complete list. Required JSON shape: {"artifactType":"${artifactType}","requestId":"${requestId}","songs":[{"songId":"song_001","title":"","lyrics":"","genre":"","mood":"","tempoBpm":0,"structure":[],"originalityNotes":[]}]}`;
  },

  buildMusicPlanCorrectionPrompt: (batchCount: number, startIndex: number, artifactType: string, batchRequestId: string, issues: string[] = []): string =>
    `CORRECTION: The previous batch failed these exact checks: ${issues.join("; ") || "incomplete contract"}. Retry now in this same room as songwriter/composer, lyricist and music producer. Preserve the stored source-derived language, regional audience, genre grammar, phrasing, instrumentation and production identity while keeping every song original. Return raw JSON only with artifactType "${artifactType}", requestId "${batchRequestId}", and the complete performance-ready songs ${startIndex}-${startIndex + batchCount - 1}. Every song needs a native-language title, at least 300 characters of complete singable lyrics with Suno section labels, specific genre, mood, integer tempoBpm 40-240, at least 3 non-empty structure entries, and at least 1 concrete originality note. Do not add markdown fences, commentary, truncation, omissions, or per-song SEO. The songs array must contain exactly ${batchCount} complete songs.`,

  buildMusicRankingPrompt: (songCount: number, requestId: string): string =>
    `Return raw JSON only. Review the complete lyrics and metadata of all ${songCount} songs created earlier in this same room. Rank them from strongest/most attractive to weakest, using professional music-editor judgment rather than creation order.

Evaluate every song comparatively on: emotional impact, memorable title and hook potential, meaningful and coherent lyrics, native wording for the source-inferred language and region, singability and phrasing, imagery, narrative development, originality, fit with the source-derived music identity and global style, production potential, and likely listener retention. Put the best overall song first and decrease gradually through the list. Do not rewrite, add, remove or rename any song.

  Return every existing songId exactly once. Required JSON shape: {"artifactType":"${SUNO_AUTOMATION_CONFIG.ARTIFACT_TYPE_RANKING}","requestId":"${requestId}","orderedSongIds":["song_001"]}`,

  buildMusicRankingCorrectionPrompt: (requestedSongCount: number, rankingRequestId: string): string =>
    `CORRECTION: The previous ranking JSON violated the contract. Re-evaluate all ${requestedSongCount} complete songs in this same room and rank them from strongest to weakest. Return raw JSON only with artifactType "${SUNO_AUTOMATION_CONFIG.ARTIFACT_TYPE_RANKING}", requestId "${rankingRequestId}", and orderedSongIds containing every existing songId exactly once. Do not use creation order, rewrite songs, add commentary or omit IDs.`,

  buildSunoSettingsPrompt: (style: string, songCount: number, requestId: string): string =>
    `Return raw JSON only. Act as a professional Suno production engineer. Analyze the global style and all ${songCount} songs already created in this room, then choose ONE Advanced/More Options configuration that will be applied unchanged to the entire creation run. Optimize genre fidelity, vocal suitability, musical coherence, hook quality and listenability; do not use generic defaults without musical reasoning. Global style: ${style}
Required JSON: {"artifactType":"${SUNO_AUTOMATION_CONFIG.ARTIFACT_TYPE_SETTINGS}","requestId":"${requestId}","settings":{"excludeStyles":"comma-separated unwanted styles","vocalGender":"male|female|auto","duration":"auto","maxMode":false,"weirdness":0,"styleInfluence":0,"variety":0,"personalize":false}}. weirdness, styleInfluence and variety must be integers 0-100. Use personalize=false unless a known Suno taste profile is explicitly part of the project.`,

  buildSunoSettingsCorrectionPrompt: (sunoSettingsRequestId: string): string =>
    `CORRECTION: Return complete raw JSON only for artifactType "${SUNO_AUTOMATION_CONFIG.ARTIFACT_TYPE_SETTINGS}", requestId "${sunoSettingsRequestId}". Include settings with excludeStyles, vocalGender male|female|auto, duration auto, boolean maxMode, integer weirdness/styleInfluence/variety 0-100, and boolean personalize. This single configuration must suit the complete song list.`,

  buildMusicPlaylistSeoPrompt: (songCount: number, style: string, requestId: string, requiredCount: number): string =>
    `Return raw JSON only. Act as an excellent Vietnamese music curator and creative YouTube SEO copywriter. Study the complete ${songCount}-song list already in this room and the selected style below, then freely create exactly ${requiredCount} genuinely different, content-faithful ways to present the WHOLE playlist. Apply current YouTube SEO best practices with natural language; do not follow a rigid title formula.

SELECTED MUSIC STYLE:
${style}

Creative goal:
- Make a real music listener feel the atmosphere immediately and want to press play. Use concrete emotions, memories, scenes, listening moments or musical character found in these songs—not empty phrases such as "tuyển chọn đặc sắc".
- Stay completely honest to the actual song titles, lyrics, genre, mood, instrumentation, vocal character and selected style. Never invent an artist, year, trend, achievement or promise unsupported by the list.
- Give every option its own personality and search intent. Titles must be compelling and create a content-appropriate surprise, curiosity or mild shock without misleading clickbait. Do not reuse one sentence pattern.

Keep only these practical SEO basics:
- title: write natural Vietnamese WITH full Unicode diacritics (for example "Nhạc Trữ Tình Đêm Mưa", never "Nhac Tru Tinh Dem Mua"). Capitalize the first letter of every word. Keep it attractive and under 100 characters. No ALL CAPS, keyword stuffing, fake hype or repeated punctuation.
- description: the very first character must be exactly one suitable emoji, followed by one space, then a concise 1-3 sentence Vietnamese description WITH full diacritics (for example "🌧️ Tiếng đàn..."). Do not put any second emoji at the middle or end. Do not append a forced track list or invent timestamps.
- hashtags: exactly 10 unique values and ONLY this field is unaccented ASCII Vietnamese. Each value starts with # and may use only A-Z, a-z, 0-9 and underscores.
- tags: exactly 12 unique values and ONLY this field is unaccented ASCII Vietnamese. Tags must not contain #, commas inside an item, or Vietnamese diacritics.
- Never apply the ASCII/no-diacritics rule for hashtags and tags to title or description.
- Give an honest integer seoScore from 0 to 100 based on clarity, search relevance, playlist fidelity and click appeal.

Before returning JSON, silently verify every title and description still contains Vietnamese diacritics, every description begins with its only emoji, and only hashtags/tags are ASCII. Each option must include title, description, hashtags, tags and seoScore. Required JSON shape: {"artifactType":"${SUNO_AUTOMATION_CONFIG.ARTIFACT_TYPE_SEO}","requestId":"${requestId}","seoOptions":[{"title":"Nhạc Trữ Tình Đêm Mưa","description":"🌧️ Tiếng đàn ngân lên giữa một đêm nhiều kỷ niệm.","hashtags":["#nhactrutinh"],"tags":["nhac tru tinh"],"seoScore":90}]}`,

  buildMusicPlaylistSeoCorrectionPrompt: (requestedSongCount: number, style: string, requiredCount: number, seoRequestId: string, issues: string[] = []): string =>
    `CORRECTION: The previous SEO JSON failed these exact checks: ${issues.join("; ") || "incomplete contract"}. Return raw JSON only. Re-read the complete ${requestedSongCount}-song list and selected style "${style}". Create exactly ${requiredCount} fresh, freely written SEO options for the whole playlist. FIELD RULES MUST NOT BE MIXED: (1) title uses Vietnamese WITH full Unicode diacritics, Title Case, under 100 characters; (2) description starts with exactly one emoji plus one space, followed by concise Vietnamese WITH full diacritics and has no other emoji; (3) ONLY hashtags are unaccented ASCII, exactly 10 unique values; (4) ONLY tags are unaccented ASCII, exactly 12 unique values. Never strip accents from title or description because hashtags/tags are ASCII. Keep claims grounded, but make titles intriguing with suitable surprise, curiosity or mild shock. Avoid rigid formulas, keyword stuffing and fake hype. Include integer seoScore 0-100. Preserve artifactType "${SUNO_AUTOMATION_CONFIG.ARTIFACT_TYPE_SEO}" and requestId "${seoRequestId}".`,

  buildMusicPlaylistSeoRegenerationPrompt: (songs: any[], style: string, requestId: string, requiredCount: number): string => {
    const compactSongs = _.map(songs, (song) => ({
      title: _.toString(song?.title),
      lyrics: _.toString(song?.lyrics),
      genre: _.toString(song?.genre),
      mood: _.toString(song?.mood),
      tempoBpm: _.toNumber(song?.tempoBpm),
    }));
    return `${SUNO_AUTOMATION_TEXTS.buildMusicPlaylistSeoPrompt(songs.length, style, requestId, requiredCount)}\n\nThis is a fresh SEO regeneration. Ignore earlier SEO wording and build five new alternatives from this authoritative current song data:\n${jsonUtils.safeStringify(compactSongs)}`;
  },

  buildMusicThumbnailPrompt: (songs: any[], style: string, description: string, hasReference: boolean, sourceContext: string = ""): string => {
    const songTitles = _.map(songs, (song, index) => `${index + 1}. ${_.toString(song?.title)}`).join("\n");
    const userChangeNote = description || "Only adapt the cover so it accurately represents this complete music collection.";
    const referenceDirective = hasReference
      ? `EDIT THE ATTACHED IMAGE; do not create an unrelated replacement. The attachment is the authoritative visual source.
- First, internally extract every requested change from USER CHANGE NOTE as a mandatory checklist. A requested change always overrides reference fidelity. If the note asks for a different person, pose, clothing, scenery, text or any other element, replace that element clearly and completely; do not preserve or merely tweak it.
- Preserve only elements that USER CHANGE NOTE does not ask to change, especially the reference's overall thumbnail layout, visual hierarchy, framing logic, text zones, contrast and rendering language.
- Do not turn the image into an unrelated generic music poster.
- The result must remain immediately recognizable as an edit of the attachment when viewed side by side. Similar subject matter alone is not sufficient.`
      : "There is no attached reference image. Create an original visual direction from the collection context.";
    return `Create one finished professional 16:9 YouTube music collection cover for Vietnamese viewers. Source context when the song list is not ready yet: ${sourceContext || "No additional source context; follow the user note and selected style."}

PRIORITY 1 — REFERENCE FIDELITY:
${referenceDirective}

PRIORITY 2 — USER CHANGE NOTE (follow literally; do not omit, soften, or reinterpret any concrete detail):
<user_change_note>
${userChangeNote}
</user_change_note>

USER-NOTE COMPLIANCE RULES:
- Complete every requested change in the note, including all requested subject, identity, pose, clothing, scenery and typography changes. Do not leave any requested item unchanged.
- When replacing quoted/source wording, the old wording must not remain anywhere in the result.
- If the note specifies an exact word count, invent one meaningful Vietnamese replacement that fits the whole collection, count words by space-separated lexical words, and render exactly that count. Do not use code, abbreviations, dates or punctuation as extra words.
- Render the replacement phrase once, prominently and with correct Vietnamese spelling. Do not add alternative versions of it.

PRIORITY 3 — COLLECTION ACCURACY:
The cover represents the complete ${songs.length}-song list, not one individual song.
Global music style: ${style}
Complete song list:
${songTitles}

The song titles and global style above are semantic context only. Do not print the numbered song list, individual song titles, year/date, artist name or extra slogans on the image unless USER CHANGE NOTE explicitly requests them. Keep a clear focal point, clean hierarchy, strong mobile contrast, safe margins and correctly spelled Vietnamese display text. Do not add logos or watermarks that are not requested. Before producing the final image, internally compare it with the attachment and verify the mandatory checklist item by item; correct every mismatch before responding. Output only the finished cover image.`;
  },
} as const;
