import _ from "lodash";

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

  MUSIC_STYLE_LIBRARY_KEY: "music_creator_style_library",
  MUSIC_INSPO_LIBRARY_KEY: "music_creator_inspo_library",
  MUSIC_CREATOR_STATE_KEY: "music_creator_workspace_state_v1",
  MUSIC_SEO_SCHEMA_VERSION: 3,
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

  buildTrackBatchEvaluationPrompt: (style: string, groups: Array<{ title: string; candidates: string[] }>, schemaString: string) =>
    `Listen to every attached audio file before answering. Act as a professional Vietnamese-market singer, songwriter, producer and music editor. Evaluate each pair for vocal quality, diction, emotion, composition, arrangement, mix, defects, genre authenticity, replay value and market fit. Select exactly one winner per song; never select a losing take. Then assign each selected winner a strict integer quality score from 0 to 100 so winners can be ranked across the complete playlist. Attachment filenames contain the corresponding track IDs. Do not explain your scores.\n\nStyle: ${style}\nPairs:\n${groups.map((group, index) => `${index + 1}. ${group.title}: ${group.candidates[0]} OR ${group.candidates[1]}`).join("\n")}\n\nReturn raw JSON only. selectedTrackIds and qualityScores must preserve pair order:\n${schemaString}`,
  buildTrackBatchEvaluationRetryPrompt: (groups: Array<{ title: string; candidates: string[] }>, schemaString: string) =>
    `Previous JSON was invalid. Using the attached audio, return selectedTrackIds and integer qualityScores with exactly ${groups.length} entries each in pair order. Each ID must belong to its corresponding pair and every score must be from 0 to 100. Return raw JSON only:\n${schemaString}`,

  buildMusicSourcePrompt: (chunk: string, chunkIndex: number, chunkCount: number, requestId: string): string =>
    `REFERENCE SOURCE PART ${chunkIndex + 1}/${chunkCount}. Store this source as context for the music project. Do not create songs yet. Treat all parts as one continuous source. Analyze only high-level genre, mood, themes, storytelling approach, structure, vocal character and instrumentation. Never copy lyrics, melody, hook, distinctive phrases, titles or artist identity. Reply raw JSON only: {"artifactType":"${SUNO_AUTOMATION_CONFIG.ARTIFACT_TYPE_SOURCE}","requestId":"${requestId}","receivedPart":${chunkIndex + 1},"totalParts":${chunkCount}}\n\nSOURCE PART:\n${chunk}`,

  buildMusicPlanPrompt: (batchCount: number, startIndex: number, totalCount: number, style: string, requestId: string, artifactType: string): string => {
    const endIndex = startIndex + batchCount - 1;
    return `Return raw JSON only. Using all reference-source parts already stored in this room, create songs ${startIndex}-${endIndex} of the ${totalCount}-song project: exactly ${batchCount} original songs for Suno. Global style (must apply to every song): ${style}\nSong IDs must be song_${String(startIndex).padStart(3, "0")} through song_${String(endIndex).padStart(3, "0")}. Keep every song meaningful, coherent, legally distinct, and different from every song previously created in this room. Each song must include songId, title, complete lyrics with Suno section labels, genre, mood, tempoBpm, structure and originalityNotes. Do not create per-song style prompts or per-song SEO because the user applies the one global style above to the complete list. Required JSON shape: {"artifactType":"${artifactType}","requestId":"${requestId}","songs":[{"songId":"song_001","title":"","lyrics":"","genre":"","mood":"","tempoBpm":0,"structure":[],"originalityNotes":[]}]}`;
  },

  buildMusicPlanCorrectionPrompt: (batchCount: number, startIndex: number, artifactType: string, batchRequestId: string): string =>
    `CORRECTION: The previous batch JSON was incomplete or violated the contract. Retry now in this same room. Return raw JSON only with artifactType "${artifactType}", requestId "${batchRequestId}", and the complete songs ${startIndex}-${startIndex + batchCount - 1}. Do not add markdown fences, commentary, truncation, omissions, or per-song SEO. The songs array must contain exactly ${batchCount} complete songs.`,

  buildMusicRankingPrompt: (songCount: number, requestId: string): string =>
    `Return raw JSON only. Review the complete lyrics and metadata of all ${songCount} songs created earlier in this same room. Rank them from strongest/most attractive to weakest, using professional music-editor judgment rather than creation order.

Evaluate every song comparatively on: emotional impact, memorable title and hook potential, meaningful and coherent lyrics, natural Vietnamese wording, singability and phrasing, imagery, narrative development, originality, fit with the global music style, and likely listener retention. Put the best overall song first and decrease gradually through the list. Do not rewrite, add, remove or rename any song.

  Return every existing songId exactly once. Required JSON shape: {"artifactType":"${SUNO_AUTOMATION_CONFIG.ARTIFACT_TYPE_RANKING}","requestId":"${requestId}","orderedSongIds":["song_001"]}`,

  buildMusicRankingCorrectionPrompt: (requestedSongCount: number, rankingRequestId: string): string =>
    `CORRECTION: The previous ranking JSON violated the contract. Re-evaluate all ${requestedSongCount} complete songs in this same room and rank them from strongest to weakest. Return raw JSON only with artifactType "${SUNO_AUTOMATION_CONFIG.ARTIFACT_TYPE_RANKING}", requestId "${rankingRequestId}", and orderedSongIds containing every existing songId exactly once. Do not use creation order, rewrite songs, add commentary or omit IDs.`,

  buildSunoSettingsPrompt: (style: string, songCount: number, requestId: string): string =>
    `Return raw JSON only. Act as a professional Suno production engineer. Analyze the global style and all ${songCount} songs already created in this room, then choose ONE Advanced/More Options configuration that will be applied unchanged to the entire creation run. Optimize genre fidelity, vocal suitability, musical coherence, hook quality and listenability; do not use generic defaults without musical reasoning. Global style: ${style}
Required JSON: {"artifactType":"${SUNO_AUTOMATION_CONFIG.ARTIFACT_TYPE_SETTINGS}","requestId":"${requestId}","settings":{"excludeStyles":"comma-separated unwanted styles","vocalGender":"male|female|auto","duration":"auto","maxMode":false,"weirdness":0,"styleInfluence":0,"variety":0,"personalize":false}}. weirdness, styleInfluence and variety must be integers 0-100. Use personalize=false unless a known Suno taste profile is explicitly part of the project.`,

  buildSunoSettingsCorrectionPrompt: (sunoSettingsRequestId: string): string =>
    `CORRECTION: Return complete raw JSON only for artifactType "${SUNO_AUTOMATION_CONFIG.ARTIFACT_TYPE_SETTINGS}", requestId "${sunoSettingsRequestId}". Include settings with excludeStyles, vocalGender male|female|auto, duration auto, boolean maxMode, integer weirdness/styleInfluence/variety 0-100, and boolean personalize. This single configuration must suit the complete song list.`,

  buildMusicPlaylistSeoPrompt: (songCount: number, requestId: string, requiredCount: number): string =>
    `Return raw JSON only. Act as a Vietnamese YouTube music SEO editor. Using the complete ${songCount}-song list created earlier in this same room, create exactly ${requiredCount} distinct metadata options for publishing the WHOLE LIST as one Vietnamese-market album/collection video. Never optimize an individual song.

Vietnam SEO requirements for every option:
- Write natural, correctly accented Vietnamese. Never use translation-shaped prose, keyword stuffing, clickbait, unsupported "hay nhất/top 1/mới nhất", artist names, or fake year/trend claims. Every claim must be supported by the actual songs already present in the room.
- Title: 55-85 characters, always within YouTube's 100-character limit. Use natural Vietnamese sentence case: capitalize only the first word and genuine proper names; never ALL CAPS, Title Case Every Word, decorative capitalization, repeated punctuation or emoji stuffing.
- Put the primary searchable genre/collection phrase within the first 45 characters. Include the exact ${songCount}-song count once, then add one concrete emotional hook or listening benefit genuinely supported by the tracklist. Make the title compelling through specificity and curiosity, not exaggeration.
- Read every existing title, lyric, mood and genre before writing. The title and first two description lines must summarize the dominant genre, emotional arc and strongest listener use case of this exact list—not a reusable generic Bolero template.
- Description: 1,000-3,000 Vietnamese characters with real line breaks and exactly this readable structure:
  1) Two opening lines containing the primary search phrase naturally and a concrete listening promise.
  2) One editorial paragraph describing genre, vocal/instrumental character, emotional arc and intended audience.
  3) Heading "DANH SÁCH CA KHÚC:" followed by a numbered list of all ${songCount} exact existing song titles in their current order, one per line. Never invent timestamps because durations are unknown.
  4) Heading "PHÙ HỢP KHI:" followed by 3 concise bullet lines describing genuine listening occasions.
  5) One natural CTA inviting comments and subscription without unverifiable promises.
  Never put tags or a hashtag dump inside the description.
- Hashtags: exactly 8-12 unique and relevant hashtags. Each starts with # and contains no spaces. Cover genre, mood, collection format and listening occasion without unrelated trends or near-duplicates.
- Tags: 20-30 unique, comma-safe search phrases covering accented queries, useful unaccented/misspelling variants, genre/subgenre, mood, occasion, instrumentation/vocal character and album/playlist/long-play intent. Avoid trivial word-order duplicates. Tags are metadata only.
- Make the 5 options target genuinely different Vietnamese search intents and opening constructions: (1) genre + compilation, (2) dominant emotional journey, (3) listening occasion, (4) audience/story theme, (5) discovery/long-play collection. Do not repeat the same first four meaningful words across options.
- seoScore must be conservative and evidence-based: title clarity/search fit 25, opening and description usefulness 25, exact full tracklist/structure 20, audience fit and honest click appeal 15, hashtag/tag diversity and hygiene 15. Deduct repetition and generic wording; never give 90+ unless every requirement is exceptional. This is an editorial estimate, not a measured ranking.

Each option must include title, description, hashtags, tags and seoScore. Required JSON shape: {"artifactType":"${SUNO_AUTOMATION_CONFIG.ARTIFACT_TYPE_SEO}","requestId":"${requestId}","seoOptions":[{"title":"","description":"","hashtags":[],"tags":[],"seoScore":0}]}`,

  buildMusicPlaylistSeoCorrectionPrompt: (requestedSongCount: number, requiredCount: number, seoRequestId: string): string =>
    `CORRECTION: The previous Vietnamese playlist SEO JSON violated the contract. Re-read the complete song list and retry raw JSON only. Return exactly ${requiredCount} distinct seoOptions for the WHOLE ${requestedSongCount}-song list. Every option requires: a natural sentence-case title of 55-85 characters with the primary genre/collection phrase in the first 45 characters, the exact song count once, a list-specific honest emotional hook, no ALL CAPS/clickbait/repeated punctuation; structured description 1,000-3,000 characters containing headings "DANH SÁCH CA KHÚC:" and "PHÙ HỢP KHI:" plus every exact song title; 8-12 unique hashtags; 20-30 unique tags; conservative integer seoScore 0-100. The five titles must use different search intents and must not repeat the same first four meaningful words. Preserve artifactType "${SUNO_AUTOMATION_CONFIG.ARTIFACT_TYPE_SEO}" and requestId "${seoRequestId}".`,

  buildMusicThumbnailPrompt: (songs: any[], style: string, seoOptions: any[], description: string, hasReference: boolean): string => {
    const songTitles = _.map(songs, (song, index) => `${index + 1}. ${_.toString(song?.title)}`).join("\n");
    const primarySeoTitle = _.toString(seoOptions?.[0]?.title);
    const userChangeNote = description || "Only adapt the cover so it accurately represents this complete music collection.";
    const referenceDirective = hasReference
      ? `EDIT THE ATTACHED IMAGE; do not create an unrelated replacement. The attachment is the authoritative visual source.
- First, internally extract every requested change from USER CHANGE NOTE as a mandatory checklist. A requested change always overrides reference fidelity. If the note asks for a different person, pose, clothing, scenery, text or any other element, replace that element clearly and completely; do not preserve or merely tweak it.
- Preserve only elements that USER CHANGE NOTE does not ask to change, especially the reference's overall thumbnail layout, visual hierarchy, framing logic, text zones, contrast and rendering language.
- Do not turn the image into an unrelated generic music poster.
- The result must remain immediately recognizable as an edit of the attachment when viewed side by side. Similar subject matter alone is not sufficient.`
      : "There is no attached reference image. Create an original visual direction from the collection context.";
    return `Create one finished professional 16:9 YouTube music collection cover for Vietnamese viewers.

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
Primary collection SEO direction: ${primarySeoTitle}

The song titles and SEO direction above are semantic context only. Do not print the numbered song list, individual song titles, SEO title, year/date, artist name or extra slogans on the image unless USER CHANGE NOTE explicitly requests them. Keep a clear focal point, clean hierarchy, strong mobile contrast, safe margins and correctly spelled Vietnamese display text. Do not add logos or watermarks that are not requested. Before producing the final image, internally compare it with the attachment and verify the mandatory checklist item by item; correct every mismatch before responding. Output only the finished cover image.`;
  },
} as const;
