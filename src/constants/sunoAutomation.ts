export const SUNO_AUTOMATION_CONFIG = {
  SUNO_BASE_URL: "https://suno.com",
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
  POLL_INTERVAL_MS: 1500,
  PLAYLIST_WAIT_MS: 1500,
  PLAYLIST_ADD_WAIT_MS: 500,
  MENU_OPEN_WAIT_MS: 500,
  SONG_PAGE_READY_TIMEOUT_MS: 30_000,
  PLAYLIST_OPTION_TIMEOUT_MS: 10_000,
  INSPO_SEARCH_WAIT_MS: 1000,
  INSPO_SELECT_WAIT_MS: 500,

  WEIRDNESS_GENTLE: 35,
  WEIRDNESS_DEFAULT: 50,
  STYLE_INFLUENCE_GENTLE: 80,
  STYLE_INFLUENCE_DEFAULT: 65,
  VARIETY_GENTLE: 25,
  VARIETY_DEFAULT: 45,

  DEFAULT_COLLECTION_TITLE: "Tuyển tập Bolero 15 bài",
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
} as const;

export const SUNO_AUTOMATION_SELECTORS = {
  BODY: "body",
  SONG_ANCHOR: 'a[href*="/song/"]',
  PLAYLIST_ANCHOR: 'a[href*="/playlist/"]',
  CHECKBOX_INPUT: 'input[type="checkbox"]',
  CHECKBOX_CONTAINER_XPATH: "xpath=ancestor::*[.//input[@type='checkbox']][1]",
  RANGE_INPUT: 'input[type="range"]',
  RANGE_CONTAINER_XPATH: "xpath=ancestor::*[.//input[@type='range']][1]",
  DIALOG_ROLE: '[role="dialog"]',

  ADD_TO_PLAYLIST: [
    'button:has-text("Add to Playlist")',
    '[role="menuitem"]:has-text("Add to Playlist")',
    'text="Add to Playlist"',
  ] as const,
  OVERFLOW_BUTTON: [
    'button[aria-label="More menu contents"]',
    'button[aria-label*="more" i]',
    'button[aria-label*="option" i]',
    'button:has-text("⋯")',
    'button:has-text("...")',
  ] as const,
  NEW_PLAYLIST: [
    'button:has-text("Create Playlist")',
    'text="Create Playlist"',
    'button:has-text("Create New Playlist")',
    'button:has-text("New Playlist")',
    'button:has-text("Create Playlist")',
    'button:has-text("Create new")',
  ] as const,
  PLAYLIST_NAME_INPUT: [
    'input[placeholder*="playlist" i]',
    'input[aria-label*="playlist" i]',
  ] as const,
  PLAYLIST_CONFIRM: [
    'button:has-text("Create")',
    'button:has-text("Save")',
    'button:has-text("Add")',
  ] as const,
  ADVANCED: [
    'button:has-text("Advanced")',
    '[role="tab"]:has-text("Advanced")',
  ] as const,
  STYLE_INPUT: [
    'textarea[placeholder*="style" i]',
    '[contenteditable="true"][aria-label*="style" i]',
    'textarea:below(:text("Styles"))',
  ] as const,
  EXCLUDE_STYLES_INPUT: ['input[placeholder*="Exclude styles" i]', 'textarea[placeholder*="Exclude styles" i]'] as const,
  OPTIONS_BUTTON: [
    'button:has-text("Options")',
    'button:has-text("More Options")',
    'button:has-text("Advanced Options")',
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
} as const;

export const SUNO_AUTOMATION_TEXTS = {
  CHROME_OPENED: "Chrome Suno đang mở.",
  CHROME_NOT_FOUND_ERR: "Không tìm thấy Chrome để mở profile Suno.",
  ADVANCED_MODE_NOT_FOUND_ERR: "Không tìm thấy chế độ Advanced của Suno.",
  STYLE_INPUT_NOT_FOUND_ERR: "Không tìm thấy ô Styles của Suno.",
  INSPO_BUTTON_NOT_FOUND_ERR: "Không tìm thấy nút Inspo của Suno.",
  INSPO_SEARCH_NOT_FOUND_ERR: "Không tìm thấy ô tìm kiếm playlist Inspo.",
  ADD_TO_PLAYLIST_NOT_FOUND_ERR: "Không tìm thấy thao tác Add to Playlist sau khi chọn các bài đã tạo.",
  PLAYLIST_URL_NOT_FOUND_ERR: "Đã tạo nhạc nhưng chưa lấy được URL playlist từ Suno.",
  PLAYLIST_CREATE_NOT_FOUND_ERR: "Không thể tạo hoặc chọn playlist mới trên Suno.",
  PLAYLIST_NAME_INPUT_NOT_FOUND_ERR: "Không tìm thấy ô nhập tên playlist mới trên Suno.",
  PLAYLIST_CREATE_BUTTON_NOT_FOUND_ERR: "Không tìm thấy nút tạo playlist mới trên Suno.",
  MISSING_SONGS_OR_STYLE_ERR: "Thiếu bài hát hoặc phong cách Suno.",
  CONNECT_CDP_ERR: "Không thể kết nối Chrome Suno riêng.",

  formatChromeLaunchedMsg: (email: string) =>
    `Đã mở Chrome Suno riêng cho ${email}. Hãy đăng nhập rồi đóng tab này khi xong.`,
  formatProfileNotSignedInErr: (email: string) =>
    `Profile Chrome của "${email}" chưa đăng nhập đúng workspace Suno đã cấu hình.`,
  formatInspoNotFoundErr: (targetName: string) =>
    `Không tìm thấy playlist Inspo khớp chính xác: "${targetName}".`,
  formatInputsNotFoundErr: (title: string) =>
    `Không tìm thấy ô Lyrics hoặc Song Title cho bài "${title}".`,
  formatCreateButtonNotReadyErr: (title: string) =>
    `Nút Create chưa sẵn sàng cho bài "${title}".`,
  formatSongIdTimeoutErr: (title: string) =>
    `Suno chưa trả ID cho bài "${title}".`,
} as const;
