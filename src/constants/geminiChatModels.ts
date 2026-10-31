import { AiPlanningChatModel } from "../types.js";
export const GEMINI_MODEL_UI = {
  POLL_MS: 100,
  READY_POLLS: 3,
  COLLAPSED_COMPOSER_SELECTOR: "rich-textarea.simplified-input",
  PRIMARY_MODEL_SELECTOR: 'button[data-test-id="bard-mode-menu-button"], button[data-testid="bard-mode-menu-button"]',
  EDITABLE_INPUT_SELECTOR: "textarea, input, [contenteditable]:not(.ql-clipboard)",
  PRIMARY_INPUT_SELECTOR: "rich-textarea [contenteditable]:not(.ql-clipboard), rich-textarea textarea, rich-textarea input",
  FOCUS_ATTEMPTS: 3,
  FOCUS_RETRY_MS: 1000,
  FOCUS_TIMEOUT_MS: 1000,
  READINESS_KEYS: { inputVisible: "selectionInputVisible", inputEditable: "selectionInputEditable", modelVisible: "selectionModelVisible", modelEnabled: "selectionModelEnabled", modelLabel: "selectionModelLabel", stablePolls: "selectionStablePolls", focusAttempts: "selectionFocusAttempts", elapsedMs: "selectionElapsedMs", pageClosed: "selectionPageClosed" },
  SELECTION_ATTEMPTS: 2,
  PHASE: { READY: "page_ready", BASE: "base_model", BASE_VERIFY: "base_model_verify", LEVEL: "thinking_level", LEVEL_VERIFY: "thinking_level_verify" },
  ESCAPE: "Escape",
  MENU: "menu",
  HIDDEN: "hidden",
  MENU_ITEM_RADIO: "menuitemradio",
  MENU_ITEM: "menuitem",
  OPTION: "option",
  BUTTON: "button",
  ARIA_DISABLED: "aria-disabled",
  ARIA_CHECKED: "aria-checked",
  ARIA_SELECTED: "aria-selected",
  DATA_STATE: "data-state",
  TRUE: "true",
  CHECKED: "checked",
  CHECK_ICON_SELECTOR: 'input:checked, [data-mat-icon-name="check"], [fonticon="check"], mat-icon',
  CHECK_MARKER_SELECTOR: 'input:checked, [data-mat-icon-name="check"], [fonticon="check"]',
  CHECK_TEXT_PATTERN: /^(?:check|done)$/i,
  MODEL_BUTTON_SELECTOR: 'button:not([role="menuitem"]):not([role="menuitemradio"]):not([role="option"])',
} as const;
export const GEMINI_THINKING_LEVEL_OPTIONS = [
  { value: "low", label: "Thấp", labelEn: "Low", pattern: /^(?:(?:Đã chọn|Selected)\s+)?(?:Thấp|Low)(?:\s|$)/i },
  { value: "medium", label: "Trung bình", labelEn: "Medium", pattern: /^(?:(?:Đã chọn|Selected)\s+)?(?:Trung bình|Medium)(?:\s|$)/i },
  { value: "high", label: "Cao", labelEn: "High", pattern: /^(?:(?:Đã chọn|Selected)\s+)?(?:Cao|High)(?:\s|$)/i },
] as const;
export type GeminiThinkingLevel = (typeof GEMINI_THINKING_LEVEL_OPTIONS)[number]["value"];
export const GEMINI_MODEL_ENCODING = {
  SEPARATOR: "::",
  UNAVAILABLE_CODE: "gemini_thinking_unavailable",
  UNAVAILABLE: (model: string) => `gemini_thinking_unavailable: Không thể áp dụng mô hình và cấp độ tư duy Gemini đã chọn (${model}).`,
  UI_NOT_READY_CODE: "gemini_model_ui_not_ready",
  UI_NOT_READY: (phase: string) => `gemini_model_ui_not_ready: Giao diện Gemini chưa sẵn sàng hoặc chưa xác nhận được lựa chọn (${phase}).`,
  DIAGNOSTICS: "geminiSelection",
  DIAGNOSTIC_PHASE: "selectionPhase",
  READINESS: "readiness",
} as const;
export const GEMINI_CHAT_BASE_MODEL_OPTIONS = [
  { value: AiPlanningChatModel.GeminiFlashLite, label: "3.5 Flash-Lite" },
  { value: AiPlanningChatModel.GeminiFlash, label: "3.8 Flash" },
  { value: AiPlanningChatModel.GeminiPro, label: "3.1 Pro" },
  { value: AiPlanningChatModel.GeminiArgon, label: "4 Argon" },
  { value: AiPlanningChatModel.GeminiThinking, label: "Pro · Tư duy mở rộng" },
  { value: AiPlanningChatModel.GeminiDeepThink, label: "Pro · Deep Think" },
] as const;
export const parseGeminiChatModel = (value: unknown) => {
  if (typeof value !== "string") return undefined;
  const [id, level, ...extra] = value.split(GEMINI_MODEL_ENCODING.SEPARATOR);
  const spec = GEMINI_CHAT_BASE_MODEL_OPTIONS.find((option) => option.value === id);
  const legacy = id === AiPlanningChatModel.GeminiThinking || id === AiPlanningChatModel.GeminiDeepThink;
  if (!spec || extra.length || (level !== undefined && (legacy || !GEMINI_THINKING_LEVEL_OPTIONS.some((option) => option.value === level)))) return undefined;
  return { model: spec.value, level: level as GeminiThinkingLevel | undefined, legacy };
};
export const encodeGeminiChatModel = (model: AiPlanningChatModel, level?: GeminiThinkingLevel): AiPlanningChatModel => {
  const selection = parseGeminiChatModel(model);
  if (!selection) return model;
  return level && !selection.legacy && GEMINI_THINKING_LEVEL_OPTIONS.some((option) => option.value === level) ? (`${selection.model}${GEMINI_MODEL_ENCODING.SEPARATOR}${level}` as AiPlanningChatModel) : selection.model;
};
export const GEMINI_CHAT_MODEL_OPTIONS = GEMINI_CHAT_BASE_MODEL_OPTIONS.flatMap((option) => [option, ...([AiPlanningChatModel.GeminiThinking, AiPlanningChatModel.GeminiDeepThink].includes(option.value) ? [] : GEMINI_THINKING_LEVEL_OPTIONS.map((level) => ({ value: encodeGeminiChatModel(option.value, level.value), label: `${option.label} · ${level.label}` })))]);
