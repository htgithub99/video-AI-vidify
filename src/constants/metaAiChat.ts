import { AiPlanningChatModel } from "../types";

export const META_AI_CHAT_MODES = {
  AUTO: AiPlanningChatModel.MetaAiAuto,
  INSTANT: AiPlanningChatModel.MetaAiInstant,
  THINKING: AiPlanningChatModel.MetaAiThinking,
} as const;

export const META_AI_CHAT_CONFIG = {
  NAME: "Meta AI",
  INPUT:
    '[data-testid="composer-input"][contenteditable="true"], div[role="textbox"][contenteditable="true"][data-testid="composer-input"]',
  SEND: 'button[data-testid="composer-send-button"]:not([disabled]):not([aria-disabled="true"])',
  RESPONSE: '[data-testid="assistant-message"]',
  BUSY: 'button[data-testid="composer-stop-button"], [data-testid="assistant-message"][data-streaming-complete="false"], [data-testid="assistant-message"][data-streaming-state="INIT"], [data-testid="assistant-message"][data-streaming-state="STREAMING"]',
  CODE: "pre code, pre.ur-sm-code",
  REMOVE:
    '.inline-image-node button[aria-label*="Remove" i], .inline-image-node button[aria-label*="Xóa" i], .inline-image-node button[aria-label*="Xoá" i], .inline-image-node button[aria-label*="Gỡ" i]',
  INLINE_IMAGE_NODE: ".inline-image-node",
  JSON_RAW_BUTTON: ".ur-json-tree-toolbar__button:not(.ur-json-tree-toolbar__button--active)",
  LOGIN_BUTTON: '[data-testid="login-button"]',
  LOGIN_WAIT_LOG:
    "[Meta AI] Đang chờ bạn hoàn tất đăng nhập Meta AI trên trình duyệt Chrome chính...",
  LOGIN_ERROR:
    "Meta AI chưa hoàn tất đăng nhập trên trình duyệt. Vui lòng chọn Hiện trình duyệt và đăng nhập https://www.meta.ai/.",
  RATE_LIMIT_ERROR: "META_AI_RATE_LIMITED",
  RATE_LIMIT_PATTERN:
    /you(?:'|’)?ve reached.{0,40}limit|too many (?:messages|requests)|rate limit|đã đạt giới hạn|quá nhiều yêu cầu/i,
  MODE_DROPDOWN_BUTTON: '[data-testid="composer-mode-dropdown-button"]',
  OPTION_INSTANT:
    '[data-testid="composer-mode-option-think_fast"], [role="menuitemradio"][data-testid="composer-mode-option-think_fast"], [role="menuitem"][data-testid="composer-mode-option-think_fast"]',
  OPTION_THINKING:
    '[data-testid="composer-mode-option-think_hard"], [role="menuitemradio"][data-testid="composer-mode-option-think_hard"], [role="menuitem"][data-testid="composer-mode-option-think_hard"]',
  INSTANT_PATTERNS: [/^tức thì$/i, /^instant$/i, /^fast$/i, /tức thì|think_fast|instant/i],
  THINKING_PATTERNS: [/^suy nghĩ$/i, /^thinking$/i, /^think$/i, /suy nghĩ|think_hard|thinking/i],
  SELECTED_VALUES: new Set(["true", "checked", "selected", "active", "on"]),
  MENU_WAIT_MS: 350,
  SETTLE_WAIT_MS: 250,
  SELECT_TIMEOUT_MS: 2500,
} as const;
