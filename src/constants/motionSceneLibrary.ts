import { AiPlanningChatModel, AiPlanningFallbackProvider } from "../types.js";
export const MOTION_SCENE_AI = {
  MODEL: AiPlanningChatModel.ClaudeSonnet55,
  EFFORT: "medium" as const,
  PRIMARY_PROVIDER: AiPlanningFallbackProvider.ChatGptUi,
  PRIMARY_MODEL: AiPlanningChatModel.ChatGptAuto,
  PRIMARY_TURNS: 3,
  SECONDARY_PROVIDER: AiPlanningFallbackProvider.ClaudeChat,
  SECONDARY_TURNS: 3,
  RETRY_DELAY_MS: 4000,
  BLOCKED_WAIT_MS: 90 * 1000,
} as const;
export const MOTION_AI_SETTINGS_TEXT = {
  vi: { MAIN_TITLE: "AI hỗ trợ nội dung", MAIN_NOTE: "Phân tích nội dung, viết kịch bản và dàn dựng phân cảnh.", DRAW_TITLE: "AI vẽ cảnh chính", DRAW_NOTE: "Chọn AI vẽ nhân vật và bối cảnh. Khi AI chính lỗi đủ lượt sẽ lần lượt chuyển sang Gemini, ChatGPT, DeepSeek, Grok." },
  en: { MAIN_TITLE: "Content AI", MAIN_NOTE: "Analyze content, write scripts and stage scenes.", DRAW_TITLE: "Primary scene drawing AI", DRAW_NOTE: "Choose the AI that draws characters and locations. When the primary exhausts its attempts it falls back to Gemini, ChatGPT, DeepSeek, then Grok in order." },
} as const;
