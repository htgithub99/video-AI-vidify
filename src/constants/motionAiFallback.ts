import { AiPlanningChatModel, AiPlanningFallbackProvider } from "../types.js";
import { encodeGeminiChatModel } from "./geminiChatModels.js";
import { encodeClaudeChatModel } from "./claudeChatModels.js";
import { MOTION_SCENE_AI } from "./motionSceneLibrary.js";

export interface MotionAiRoute { provider: string; model: string; }

export const MOTION_AI_ROLE = { MAIN: "main", DRAW: "draw" } as const;

const GEMINI: MotionAiRoute = { provider: AiPlanningFallbackProvider.GeminiChat, model: encodeGeminiChatModel(AiPlanningChatModel.GeminiFlash, "medium") };
const CHATGPT: MotionAiRoute = { provider: AiPlanningFallbackProvider.ChatGptUi, model: AiPlanningChatModel.ChatGptAuto };
const DEEPSEEK: MotionAiRoute = { provider: AiPlanningFallbackProvider.DeepSeekChat, model: AiPlanningChatModel.DeepSeekStandard };
const GROK: MotionAiRoute = { provider: AiPlanningFallbackProvider.GrokChat, model: AiPlanningChatModel.GrokAuto };
const CLAUDE: MotionAiRoute = { provider: AiPlanningFallbackProvider.ClaudeChat, model: encodeClaudeChatModel(MOTION_SCENE_AI.MODEL, MOTION_SCENE_AI.EFFORT) };

export const MOTION_AI_FALLBACK = {
  MAIN: [GEMINI, CHATGPT, DEEPSEEK, GROK],
  DRAW: [GEMINI, CHATGPT, DEEPSEEK, CLAUDE],
  FALLBACK_TURNS: 2,
  LOG_SWITCH: (from: string, to: string, reason: string): string => `AI ${from} lỗi (${reason}) – chuyển sang ${to}.`,
  LOG_SKIP_BLOCKED: (provider: string): string => `Bỏ qua ${provider} (đang tạm ngưng).`,
  LOG_ALL_FAILED: (list: string): string => `Đã thử hết các AI (${list}) đều lỗi.`,
  LIST_SEP: " → ",
  REASON_MAX: 120,
} as const;
