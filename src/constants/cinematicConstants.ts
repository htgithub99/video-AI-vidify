import { AiPlanningChatModel, AiPlanningFallbackProvider } from "../types";

export const CINEMATIC_POLICY_CONFIG = {
  CLIP_DURATION_SECONDS: 10,
  MIN_CLIP_DURATION_SECONDS: 3,
  MAX_CLIP_DURATION_SECONDS: 15,
  PLANNING_CHUNK_SIZE: Number.MAX_SAFE_INTEGER,
  PLANNING_WORKER_COUNT: 1,
  CLIENT_PLANNING_ATTEMPTS: 2,
  MIN_DIALOGUE_COVERAGE_SCORE: 70,
} as const;

export const CINEMATIC_VIDEO_PROMPT_PROFILE_VERSION = "cinematic-ai-directed-v3-compact";

export const CINEMATIC_ROOM_STAGE = {
  SCRIPT: "film-planning-room",
  PROMPT: "film-planning-room",
  THUMBNAIL: "film-planning-room",
  VIDEO: "video-room",
} as const;

export const CINEMATIC_ARTIFACT_TYPE = {
  FILM_PACKAGE: "film_package",
  VIDEO_PROMPTS: "video_prompts",
  THUMBNAILS: "thumbnails",
  SEO: "seo",
} as const;

export const CINEMATIC_ARTIFACT_ID_WHITESPACE_PATTERN = /\s+/g;

export const normalizeCinematicArtifactIdentity = (value: unknown): string =>
  String(value ?? "").replace(CINEMATIC_ARTIFACT_ID_WHITESPACE_PATTERN, "");

export const CINEMATIC_PROGRESS_STAGE = {
  SCRIPT: 1,
  PROMPT: 2,
  THUMBNAIL: 3,
  VIDEO: 4,
  TOTAL: 4,
} as const;

export const CINEMATIC_PROGRESS_MESSAGES = {
  vi: {
    SCRIPT_START: "Bước 1/4 · AI đang viết kịch bản phim.",
    SCRIPT_READY: "Bước 1/4 · Kịch bản đã hoàn tất.",
    PROMPT_START: "Bước 2/4 · AI đang viết prompt video cho từng cảnh.",
    PROMPT_PROGRESS: "Bước 2/4 · Đã hoàn thành prompt {0}/{1} cảnh.",
    PROMPT_READY: "Bước 2/4 · Prompt video đã hoàn tất.",
    THUMBNAIL_START: "Bước 3/4 · Đang chuẩn bị ảnh tham chiếu nhân vật và ảnh bìa.",
    THUMBNAIL_READY: "Bước 3/4 · Ảnh bìa đã hoàn tất.",
    VIDEO_START: "Bước 4/4 · Đang tạo video cho {0} cảnh.",
    VIDEO_PROGRESS: "Bước 4/4 · Đã tạo xong {0}/{1} cảnh.",
    VIDEO_READY: "Bước 4/4 · Video đã hoàn tất.",
    PLANNING_STOPPED: "Bước {0}/4 · Tạm dừng vì chưa nhận được kết quả hoàn chỉnh từ AI. Kết quả đã xong được giữ lại; hãy kiểm tra room rồi chọn Tiếp tục dự án.",
    PLANNING_FORMAT_STOPPED:
      "Bước 1/4 · AI đã trả lời nhưng định dạng dữ liệu chưa đọc được. Hệ thống đã giữ dữ liệu cũ; chọn Tiếp tục để nhận lại kịch bản.",
    PROMPT_STOPPED: "Bước 2/4 · Đã giữ {0}/{1} prompt; còn thiếu {2}. Hãy chọn Tiếp tục để hoàn thành riêng các cảnh này.",
    VIDEO_STOPPED: "Bước 4/4 · Tạm dừng vì khâu tạo hoặc ghép video chưa hoàn tất. Các cảnh đã xong được giữ lại; hãy chọn Tiếp tục dự án.",
    CANCELLED: "Đã dừng quy trình an toàn. Mọi kết quả đã hoàn thành đều được giữ lại.",
  },
  en: {
    SCRIPT_START: "Step 1/4 · AI is writing the screenplay.",
    SCRIPT_READY: "Step 1/4 · The screenplay is complete.",
    PROMPT_START: "Step 2/4 · AI is writing the video prompt for each scene.",
    PROMPT_PROGRESS: "Step 2/4 · Completed prompts for {0}/{1} scenes.",
    PROMPT_READY: "Step 2/4 · Video prompts are complete.",
    THUMBNAIL_START: "Step 3/4 · Preparing character references and the film cover.",
    THUMBNAIL_READY: "Step 3/4 · The thumbnail is complete.",
    VIDEO_START: "Step 4/4 · Creating video for {0} scenes.",
    VIDEO_PROGRESS: "Step 4/4 · Completed {0}/{1} scenes.",
    VIDEO_READY: "Step 4/4 · The video is complete.",
    PLANNING_STOPPED: "Step {0}/4 · Paused because a complete AI result was not received. Completed work is kept; check the room and continue the project.",
    PLANNING_FORMAT_STOPPED:
      "Step 1/4 · AI responded, but its data format could not be read. Existing data was kept; continue to request the screenplay again.",
    PROMPT_STOPPED: "Step 2/4 · Kept {0}/{1} prompts; still missing {2}. Continue to complete only these scenes.",
    VIDEO_STOPPED: "Step 4/4 · Paused because video creation or assembly did not finish. Completed scenes are kept; continue the project to resume.",
    CANCELLED: "Production stopped safely. Every completed result has been kept.",
  },
} as const;

export const CINEMATIC_CHECKPOINT_CONFIG = {
  MEDIA_PHASE_PATTERN: /media|render|completed/i,
  SCENE_COUNT_MISMATCH_TEMPLATE: "storyboard:scene_count_mismatch:{actual}/{expected}",
  ACTUAL_COUNT_TOKEN: "{actual}",
  EXPECTED_COUNT_TOKEN: "{expected}",
} as const;

export const CINEMATIC_CHAT_PLANNING_CONFIG = {
  ROOM_RESPONSE_ATTEMPTS: 1,
  RESPONSE_TIMEOUT_MS: 120000,
  RESPONSE_POLL_MS: 250,
  RESPONSE_STABLE_POLLS: 2,
  MIN_RESPONSE_CHARACTERS: 20,
  INVALID_JSON_RESPONSE_ERROR: "chat_planning_invalid_json_response",
  MAX_CORRECTION_ATTEMPTS: 1,
  CLOSED_ROOM_RECOVERY_ATTEMPTS: 1,
  CLOSED_ROOM_ERROR_PATTERN: /target page, context or browser has been closed|page has been closed|page closed|browser.*closed/i,
  CLOSED_ROOM_RECOVERY_LOG: "[AI Chat Planning] Tab {0} vừa bị đóng; mở lại đúng room và tiếp tục một lần.",
  API_MAX_SOUND_DESIGN_CUES: 3,
  ROOM_MAX_SOUND_DESIGN_CUES: 5,
  PAGE_READY_TIMEOUT_MS: 20000,
  MODEL_PICKER_TIMEOUT_MS: 2500,
  PROMPT_SUBMIT_SETTLE_MS: 150,
  ATTACHMENT_READY_TIMEOUT_MS: 120000,
  SUBMISSION_VERIFY_TIMEOUT_MS: 10000,
  SUBMISSION_POLL_MS: 250,
  COMPOSER_EMPTY_MAX_CHARACTERS: 0,
  ATTACHMENT_SUBMIT_BLOCKED_ERROR: "chat_planning_attachments_not_ready",
  SUBMISSION_NOT_CONFIRMED_ERROR: "chat_planning_submission_not_confirmed",
  SUBMISSION_CONFIRMED_LOG: "[AI Chat Planning] Room đã nhận yêu cầu ({0} ký tự).",
  NAVIGATION_TIMEOUT_MS: 60000,
  GEMINI_RESPONSE_SELECTOR:
    'model-response, [data-test-id="model-response"], [data-testid="model-response"], [data-message-author-role="assistant"], .model-response-text',
  GEMINI_INPUT_SELECTOR: 'div.ql-editor[contenteditable="true"], div[role="textbox"][contenteditable="true"]',
  GEMINI_SEND_SELECTOR: 'button[aria-label*="Gửi" i], button[aria-label*="Send" i], gem-icon-button.send-button button, div.send-button-container button',
  GEMINI_BUSY_SELECTOR: 'gem-icon-button.send-button.stop, .model-response-label-announcer[aria-busy="true"]',
  GROK_INPUT_SELECTOR: '[contenteditable="true"][role="textbox"], textarea, [contenteditable="true"]',
  GROK_RESPONSE_SELECTOR:
    '[data-testid="assistant-message"], [data-message-author-role="assistant"], [data-testid*="assistant" i][data-testid*="message" i], .response-content-markdown',
  GROK_SEND_SELECTOR: 'button[type="submit"], button[aria-label*="Send" i], button[aria-label*="Gửi" i]',
  GROK_BUSY_SELECTOR: 'button[aria-label*="Stop" i], button[aria-label*="Dừng" i]',
  GROK_CHALLENGE_FRAME_SELECTOR: 'iframe[src*="challenges.cloudflare.com"], iframe[src*="challenge"], iframe[title*="Cloudflare" i], input[name="cf-turnstile-response"]',
  GROK_CHALLENGE_WAIT_TIMEOUT_MS: 300000,
  GROK_CHALLENGE_POLL_MS: 1000,
  GROK_READY_STABLE_POLLS: 2,
  GROK_POST_CHALLENGE_READY_STABLE_POLLS: 5,
  GROK_CHALLENGE_TEXT_PATTERN: /performing security verification|verify you are human|verifying you are human|just a moment|xác minh bạn là người|đang thực hiện xác minh bảo mật/i,
  CHATGPT_INPUT_SELECTOR: '#prompt-textarea, textarea[data-id="root"], div[contenteditable="true"][data-virtualkeyboard]',
  CHATGPT_RESPONSE_SELECTOR:
    '[data-message-author-role="assistant"], article[data-testid^="conversation-turn-"]:has([data-message-author-role="assistant"])',
  CHATGPT_SEND_SELECTOR: 'button[data-testid="send-button"], button[aria-label*="Send" i], button[aria-label*="Gửi" i]',
  CHATGPT_BUSY_SELECTOR: 'button[data-testid="stop-button"], button[aria-label*="Stop" i], button[aria-label*="Dừng" i]',
  RESPONSE_IDENTITY_SELECTOR: "[data-message-id], [data-testid^='conversation-turn-'], [data-test-id]",
  RESPONSE_MESSAGE_ID_ATTRIBUTE: "data-message-id",
  RESPONSE_TEST_ID_ATTRIBUTE: "data-testid",
  RESPONSE_LEGACY_TEST_ID_ATTRIBUTE: "data-test-id",
  CHATGPT_LOGIN_SELECTOR: 'button:has-text("Log in"), a:has-text("Log in"), button:has-text("Đăng nhập"), a:has-text("Đăng nhập")',
  CHATGPT_GOOGLE_LOGIN_SELECTOR: 'button:has-text("Continue with Google"), button:has-text("Tiếp tục với Google"), a:has-text("Continue with Google")',
  CHATGPT_COOKIE_REJECT_SELECTOR: '[data-cookie-consent] button:has-text("Reject"), [data-cookie-consent] button:has-text("Từ chối")',
  CHATGPT_COOKIE_ACTION_SELECTOR: "[data-cookie-consent] button",
  GEMINI_MODEL_BUTTON_SELECTOR:
    'button[data-test-id="bard-mode-menu-button"], button[data-testid="bard-mode-menu-button"], button[aria-label*="mô hình" i], button[aria-label*="model" i], button[aria-label*="chế độ" i], button[aria-label*="mode" i], button:has-text("Flash-Lite"), button:has-text("Flash"), button:has-text("Pro")',
  GROK_MODEL_BUTTON_SELECTOR:
    'button[aria-label*="chọn mô hình" i], button[aria-label*="select model" i], button:has-text("Nhanh"), button:has-text("Fast"), button:has-text("Tự động"), button:has-text("Auto")',
  JSON_ONLY_DIRECTIVE:
    'Return only the complete raw JSON value required by the request, parseable directly with JSON.parse. Escape every double quote that occurs inside a JSON string value as \\". Do not use Markdown fences, commentary, summaries, ellipses, placeholders, or references to earlier answers.',
  WINDOWS_LINE_ENDING_PATTERN: /\r\n/g,
  EXCESS_BLANK_LINES_PATTERN: /\n[ \t]*\n(?:[ \t]*\n)+/g,
  CANCELLED_ERROR: "chat_planning_cancelled",
  CLOSE_ROOM_ON_COMPLETE: true,
  INVALID_RESPONSE_ERROR: "chat_planning_invalid_response",
  DEFAULT_PROJECT_SCOPE: "cinematic-planning",
  DEFAULT_WORKER_ID: CINEMATIC_ROOM_STAGE.SCRIPT,
  ROOM_KEY_SEPARATOR: "::",
  ROOM_DELETE_MAX_CONVERSATIONS: 500,
  ROOM_DELETE_ITEM_ATTEMPTS: 2,
  ROOM_DELETE_ACTION_TIMEOUT_MS: 8000,
  ROOM_DELETE_CONFIRM_TIMEOUT_MS: 5000,
  ROOM_DELETE_VERIFY_TIMEOUT_MS: 10000,
  ROOM_DELETE_VERIFY_POLL_MS: 250,
  ROOM_DELETE_SETTLE_MS: 1000,
  GEMINI_CONVERSATION_ITEM_SELECTOR: 'gem-nav-list-item[data-test-id="conversation"]',
  GEMINI_CONVERSATION_ACTION_SELECTOR: '[data-test-id="actions-menu-button"] button',
  GEMINI_SIDEBAR_OPEN_SELECTOR: 'button[aria-label*="Mở thanh bên" i], button[aria-label*="Open sidebar" i]',
  GEMINI_SIDEBAR_READY_SELECTOR: '[aria-label*="Điều hướng bên" i], [aria-label*="Side navigation" i], bard-sidenav, gem-sidenav, nav',
  GEMINI_ACTIVITY_DELETE_PATTERN: /^(?:Xóa|Xoá|Delete)$/i,
  GEMINI_ACTIVITY_ALL_TIME_PATTERN: /(?:Từ trước đến nay|All time)/i,
  GEMINI_ACTIVITY_CONFIRM_HEADING_PATTERN: /(?:Xác nhận bạn muốn xóa|Confirm.*delete)/i,
  GROK_CONVERSATION_ITEM_SELECTOR: 'a[href^="/c/"], a[href^="/chat/"]',
  GROK_CONVERSATION_ACTION_SELECTOR: 'button[aria-label*="option" i], button[aria-label*="more" i], button[data-testid*="menu"]',
  GROK_SIDEBAR_OPEN_SELECTOR: 'button[aria-label*="Open sidebar" i], button[aria-label*="Mở thanh bên" i], button[aria-label*="menu" i]',
  GROK_SIDEBAR_READY_SELECTOR: 'button:has-text("History"), button:has-text("Lịch sử"), a[href^="/c/"], a[href^="/chat/"]',
  CHATGPT_CONVERSATION_ITEM_SELECTOR: 'li:has(a[href^="/c/"]), [data-testid^="history-item-"]',
  CHATGPT_CONVERSATION_ACTION_SELECTOR: 'button[data-testid="conversation-options"], button[aria-label*="option" i], button[aria-label*="more" i]',
  CHATGPT_SIDEBAR_OPEN_SELECTOR: 'button[aria-label="Open sidebar"], button[aria-label="Mở thanh bên"]',
  CHATGPT_SIDEBAR_READY_SELECTOR: 'nav[aria-label="Chat history"], nav[aria-label="Lịch sử trò chuyện"]',
  CONVERSATION_DELETE_PATTERN: /^(?:Xóa|Xoá|Delete|Delete chat|Delete conversation)$/i,
  CONVERSATION_DELETE_FALLBACK_PATTERN: /(?:Xóa|Xoá|Delete)/i,
} as const;

export const createCinematicArtifactRequestId = (runId: unknown, artifactType: string): string =>
  `${String(runId ?? "").trim() || CINEMATIC_CHAT_PLANNING_CONFIG.DEFAULT_PROJECT_SCOPE}:${artifactType}`;

export const CINEMATIC_AI_CREATIVE_REQUIRED_FIELDS = [
  "id",
  "generationPrompt",
] as const;

export const CINEMATIC_PRODUCTION_BLOCKER_PATTERNS = [
  /:result:missing_scene$/,
  /:id:(?:duplicate|unexpected)$/,
  /:generationPrompt:missing$/,
] as const;

export const CINEMATIC_CHAT_MODEL_OPTIONS: Record<AiPlanningFallbackProvider, ReadonlyArray<{ value: AiPlanningChatModel; label: string }>> = {
  [AiPlanningFallbackProvider.GeminiChat]: [
    { value: AiPlanningChatModel.GeminiFlashLite, label: "Flash-Lite" },
    { value: AiPlanningChatModel.GeminiFlash, label: "Flash" },
    { value: AiPlanningChatModel.GeminiPro, label: "Pro" },
    { value: AiPlanningChatModel.GeminiThinking, label: "Pro · Tư duy mở rộng" },
    { value: AiPlanningChatModel.GeminiDeepThink, label: "Pro · Deep Think" },
  ],
  [AiPlanningFallbackProvider.GrokChat]: [
    { value: AiPlanningChatModel.GrokFast, label: "Nhanh" },
    { value: AiPlanningChatModel.GrokBuild, label: "Build" },
    { value: AiPlanningChatModel.GrokAuto, label: "Tự động" },
    { value: AiPlanningChatModel.GrokExpert, label: "Chuyên gia" },
    { value: AiPlanningChatModel.GrokHeavy, label: "Nặng" },
  ],
  [AiPlanningFallbackProvider.ChatGptUi]: [{ value: AiPlanningChatModel.ChatGptAuto, label: "Mặc định" }],
  [AiPlanningFallbackProvider.Disabled]: [],
};

export const CINEMATIC_CHAT_MODEL_LABELS: Record<AiPlanningChatModel, RegExp> = {
  [AiPlanningChatModel.GeminiFlashLite]: /(?:Gemini\s*)?(?:\d+(?:\.\d+)?\s*)?Flash[-\s]?Lite/i,
  [AiPlanningChatModel.GeminiFlash]: /(?:Gemini\s*)?(?:\d+(?:\.\d+)?\s*)?Flash(?![-\s]?Lite)/i,
  [AiPlanningChatModel.GeminiPro]: /(?:Gemini\s*)?(?:\d+(?:\.\d+)?\s*)?Pro/i,
  [AiPlanningChatModel.GeminiThinking]: /Tư duy mở rộng|Extended thinking|Extended/i,
  [AiPlanningChatModel.GeminiDeepThink]: /Deep Think/i,
  [AiPlanningChatModel.GrokFast]: /Nhanh|Fast/i,
  [AiPlanningChatModel.GrokBuild]: /Build/i,
  [AiPlanningChatModel.GrokAuto]: /Tự động|Auto/i,
  [AiPlanningChatModel.GrokExpert]: /Chuyên gia|Expert/i,
  [AiPlanningChatModel.GrokHeavy]: /Nặng|Heavy/i,
  [AiPlanningChatModel.ChatGptAuto]: /Auto|Mặc định|Default/i,
};

export const GEMINI_CHAT_BASE_MODEL_LABELS: Partial<Record<AiPlanningChatModel, RegExp>> = {
  [AiPlanningChatModel.GeminiFlashLite]: CINEMATIC_CHAT_MODEL_LABELS[AiPlanningChatModel.GeminiFlashLite],
  [AiPlanningChatModel.GeminiFlash]: CINEMATIC_CHAT_MODEL_LABELS[AiPlanningChatModel.GeminiFlash],
  [AiPlanningChatModel.GeminiPro]: CINEMATIC_CHAT_MODEL_LABELS[AiPlanningChatModel.GeminiPro],
  [AiPlanningChatModel.GeminiThinking]: CINEMATIC_CHAT_MODEL_LABELS[AiPlanningChatModel.GeminiPro],
  [AiPlanningChatModel.GeminiDeepThink]: CINEMATIC_CHAT_MODEL_LABELS[AiPlanningChatModel.GeminiPro],
};

export const GEMINI_CHAT_THINKING_LEVEL_LABELS: Partial<Record<AiPlanningChatModel, RegExp>> = {
  [AiPlanningChatModel.GeminiThinking]: CINEMATIC_CHAT_MODEL_LABELS[AiPlanningChatModel.GeminiThinking],
  [AiPlanningChatModel.GeminiDeepThink]: CINEMATIC_CHAT_MODEL_LABELS[AiPlanningChatModel.GeminiDeepThink],
};

export const CINEMATIC_PLANNING_MESSAGES = {
  VI_SCENE_RETRY: "Nội dung phân cảnh chưa đạt độ chi tiết cần thiết. AI đang soạn thảo lại các cảnh còn thiếu...",
  EN_SCENE_RETRY: "Scene details are incomplete. AI is rewriting the missing scenes...",
  VI_BATCH_LOCKED: "Đã hoàn thành mô tả cho {0} phân cảnh (đạt tiến độ {1}/{2} cảnh toàn phim).",
  EN_BATCH_LOCKED: "Completed prompt descriptions for {0} scenes ({1}/{2} total scenes).",
  VI_BATCH_ATTEMPT: "Đang xây dựng câu lệnh và mô tả chi tiết cho {1} (lượt {2}/{3}).",
  EN_BATCH_ATTEMPT: "Generating prompt and visual details for {1} (attempt {2}/{3}).",
  VI_BATCH_RETRY: "Đang bổ sung thêm chi tiết hình ảnh và chuyển động cho {1}...",
  EN_BATCH_RETRY: "Refining visual and motion details for {1}...",
  VI_SCENE_RECOVERY_FAILED: "AI chưa trả prompt cho {0}. Đã giữ các cảnh hoàn thành và tạm dừng tại những cảnh còn thiếu.",
  EN_SCENE_RECOVERY_FAILED: "AI did not return prompts for {0}. Completed scenes were kept and production paused at the missing scenes.",
  VI_REQUIRED: "AI chưa trả đủ prompt video. Các cảnh đã hoàn thành được giữ lại để tiếp tục ở lần sau.",
  EN_REQUIRED: "AI did not return every video prompt. Completed scenes were kept so the next run can continue from the missing ones.",
  VI_REQUIRED_DETAIL: "Chi tiết chưa đạt: {0}.",
  EN_REQUIRED_DETAIL: "Incomplete details: {0}.",
  ISSUE_DISPLAY_LIMIT: 8,
  INCOMPLETE_AFTER_RETRIES_ISSUE: "incomplete_after_retries",
  ROOM_RESPONSE_ISSUE: "room_response",
  VI_ADVISORY: "Toàn bộ các phân cảnh đã đủ dữ liệu và sẵn sàng chuyển sang bước tạo video.",
  EN_ADVISORY: "All scenes have complete data and are ready for video generation.",
  VI_START_NEW: "Bắt đầu sản xuất phim mới",
  EN_START_NEW: "Starting new film production",
  VI_CONTINUE: "Tiếp tục sản xuất phim",
  EN_CONTINUE: "Continuing film production",
  VI_PREFLIGHT_START: "Đang kiểm tra kỹ thuật để chắc chắn mỗi cảnh có prompt trước khi tạo video...",
  EN_PREFLIGHT_START: "Checking that every scene has a prompt before video generation...",
  VI_PREFLIGHT_PASSED: "Mọi cảnh đều có prompt và sẵn sàng tạo video.",
  EN_PREFLIGHT_PASSED: "Every scene has a prompt and is ready for video generation.",
  VI_PREFLIGHT_FAILED: "Một số cảnh chưa có prompt nên chưa thể tạo video.",
  EN_PREFLIGHT_FAILED: "Some scenes have no prompt, so video generation cannot start.",
  VI_PREFLIGHT_FAILED_SCENES: "Cần hoàn thiện lại: {0}.",
  EN_PREFLIGHT_FAILED_SCENES: "Scenes needing adjustment: {0}.",
  PREFLIGHT_LOG_PREFIX: "[Cinematic preflight]",
  PROJECT_SAFETY_APPROVED_RATIONALE: "project_content_safety_approved",
  VI_CHARACTER_PACK_START: "Bước 3/4 · Đang tạo ảnh tham chiếu cho từng nhân vật.",
  EN_CHARACTER_PACK_START: "Step 3/4 · Creating a reference image for each character.",
  VI_CHARACTER_PACK_READY: "Bước 3/4 · Ảnh tham chiếu nhân vật đã được tạo và lưu.",
  EN_CHARACTER_PACK_READY: "Step 3/4 · Character reference images have been created and saved.",
  VI_CHARACTER_PACK_PARTIAL: "Bước 3/4 · Một số ảnh tham chiếu nhân vật chưa tạo được; hệ thống giữ hồ sơ nhận diện do AI viết để tiếp tục.",
  EN_CHARACTER_PACK_PARTIAL: "Step 3/4 · Some character reference images were unavailable; production will continue with the AI-authored identity profiles.",
  VI_CHARACTER_PACK_FAILED: "Không thể hoàn thành ảnh nhận diện nhân vật. Đã dừng trước khi tạo clip để tránh video sai nhân vật.",
  EN_CHARACTER_PACK_FAILED: "The character identity pack could not be completed. Production stopped before clip generation to avoid inconsistent characters.",
} as const;

export const CINEMATIC_CHARACTER_PACK_CONFIG = { REFERENCE_COUNT_PER_CHARACTER: 1, MAX_CHARACTERS: 3 } as const;

export const resolveCinematicClipDuration = (value?: string | number): number => {
  const parsed = typeof value === "number" ? value : Number.parseFloat(String(value || ""));
  if (!Number.isFinite(parsed)) return CINEMATIC_POLICY_CONFIG.CLIP_DURATION_SECONDS;
  return Math.min(CINEMATIC_POLICY_CONFIG.MAX_CLIP_DURATION_SECONDS, Math.max(CINEMATIC_POLICY_CONFIG.MIN_CLIP_DURATION_SECONDS, parsed));
};

export const CINEMATIC_POLICY_REQUIRED_FIELDS = ["generationPrompt"] as const;
