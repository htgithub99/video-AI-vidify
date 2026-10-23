import { AiPlanningChatModel, AiPlanningFallbackProvider } from "../types.js";
export const MOTION_SCENE_AI = { MODEL: AiPlanningChatModel.ClaudeSonnet55, EFFORT: "medium" as const, PRIMARY_PROVIDER: AiPlanningFallbackProvider.ChatGptUi, PRIMARY_MODEL: AiPlanningChatModel.ChatGptAuto, PRIMARY_TURNS: 3, SECONDARY_PROVIDER: AiPlanningFallbackProvider.ClaudeChat, SECONDARY_TURNS: 3, RETRY_DELAY_MS: 4000, BLOCKED_WAIT_MS: 90 * 1000 } as const;
export const MOTION_AI_SETTINGS_TEXT = {
  vi: { MAIN_TITLE: "AI hỗ trợ nội dung", MAIN_NOTE: "Phân tích truyện, viết kịch bản và tạo nội dung SEO.", DRAW_TITLE: "AI dựng video 2D/3D", DRAW_NOTE: "Từ bước Dựng cảnh 2D/3D: chuẩn hóa và chọn/vẽ tài nguyên, bố trí cảnh, kiểm tra hình, phân vai giọng và âm thanh. Tự chuyển AI dự phòng khi gặp lỗi." },
  en: { MAIN_TITLE: "Content AI", MAIN_NOTE: "Analyze stories, write scripts and create SEO content.", DRAW_TITLE: "2D/3D video production AI", DRAW_NOTE: "From the 2D/3D scene stage: asset profiles, asset selection and drawing, staging, visual checks, voice casting and sound planning. Automatically switches to a fallback AI on failure." },
} as const;
