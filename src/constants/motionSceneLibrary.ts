import { AiPlanningChatModel, AiPlanningFallbackProvider } from "../types.js";
export const MOTION_SCENE_AI = { MODEL: AiPlanningChatModel.ClaudeSonnet55, EFFORT: "medium" as const, PRIMARY_PROVIDER: AiPlanningFallbackProvider.ChatGptUi, PRIMARY_MODEL: AiPlanningChatModel.ChatGptAuto, PRIMARY_TURNS: 3, SECONDARY_PROVIDER: AiPlanningFallbackProvider.ClaudeChat, SECONDARY_TURNS: 3, RETRY_DELAY_MS: 4000, BLOCKED_WAIT_MS: 90 * 1000 } as const;
export const MOTION_AI_SETTINGS_TEXT = {
  vi: { MAIN_TITLE: "AI hỗ trợ nội dung", MAIN_NOTE: "Phân tích truyện, viết kịch bản và tạo nội dung SEO.", DRAW_TITLE: "AI dựng video minh họa", DRAW_NOTE: "Chọn và ghép tài nguyên, bố trí hình minh họa 2D, duyệt ảnh khi bật, phân vai giọng và âm thanh. Hai gói cố định chỉ dùng kho có sẵn. Tự chuyển AI dự phòng khi gặp lỗi." },
  en: { MAIN_TITLE: "Content AI", MAIN_NOTE: "Analyze stories, write scripts and create SEO content.", DRAW_TITLE: "Illustrated video AI", DRAW_NOTE: "Select and assemble assets, arrange 2D illustrations, review images when enabled, cast voices and plan sound. Fixed packs use existing library assets only. Automatically switches to a fallback AI on failure." },
} as const;
