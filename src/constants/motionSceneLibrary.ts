import { AiPlanningChatModel, AiPlanningFallbackProvider } from "../types.js";
export const MOTION_SCENE_AI = { MODEL: AiPlanningChatModel.ClaudeSonnet55, EFFORT: "medium" as const, PRIMARY_PROVIDER: AiPlanningFallbackProvider.ChatGptUi, PRIMARY_MODEL: AiPlanningChatModel.ChatGptAuto, PRIMARY_TURNS: 3, SECONDARY_PROVIDER: AiPlanningFallbackProvider.ClaudeChat, SECONDARY_TURNS: 3, RETRY_DELAY_MS: 4000, BLOCKED_WAIT_MS: 90 * 1000 } as const;
export const MOTION_AI_SETTINGS_TEXT = {
  vi: {
    MAIN_TITLE: "AI hỗ trợ nội dung",
    MAIN_NOTE: "Phân tích truyện, viết kịch bản, chia cảnh, chọn tài nguyên, duyệt ảnh khi bật, phân vai giọng, lập âm thanh và tạo SEO.",
    DRAW_TITLE: "AI dựng cảnh",
    DRAW_NOTE: "Dựng, sửa hình minh họa và tạo ảnh bìa. Gói cố định ghép tài nguyên có sẵn trong kho.",
    REMOTION_DRAW_NOTE: "Mỗi cảnh Remotion được AI đã chọn vẽ hình và chuyển động trong một phản hồi; không tự đổi nhà cung cấp để vẽ lại cảnh. Cấu hình ảnh bìa áp dụng theo bước tạo ảnh bìa.",
    FALLBACK_LABEL: "Tự chuyển AI dự phòng",
    FALLBACK_ON: "Tự chuyển AI dự phòng",
    FALLBACK_OFF: "Chỉ dùng AI đã chọn",
    MAIN_FALLBACK_HINT: "Bật: khi AI hỗ trợ nội dung gặp lỗi, thử AI dự phòng. Tắt: chỉ dùng đúng AI và model đã chọn; báo lỗi nếu không thể hoàn tất. Không thay đổi AI dựng cảnh.",
    FALLBACK_HINT: "Bật: khi AI dựng cảnh gặp lỗi, thử AI dự phòng. Tắt: giữ đúng AI và model đã chọn; cảnh lỗi có thể tạo lại riêng. Không thay đổi AI hỗ trợ nội dung.",
  },
  en: {
    MAIN_TITLE: "Content AI",
    MAIN_NOTE: "Analyze stories, write scripts, plan shots, select assets, review images when enabled, cast voices, plan sound and create SEO.",
    DRAW_TITLE: "Scene AI",
    DRAW_NOTE: "Compose and repair illustrations, and create thumbnails. Fixed packs assemble existing library assets.",
    REMOTION_DRAW_NOTE: "The selected AI draws each Remotion scene and its motion in one response; scenes are not redrawn through another provider. Thumbnail settings apply in the thumbnail step.",
    FALLBACK_LABEL: "Automatic AI fallback",
    FALLBACK_ON: "Automatic AI fallback",
    FALLBACK_OFF: "Use selected AI only",
    MAIN_FALLBACK_HINT: "On: try a fallback AI when content generation fails. Off: use only the selected AI and model; report an error if the request cannot finish. Scene AI is unchanged.",
    FALLBACK_HINT: "On: try a fallback AI when scene generation fails. Off: keep the selected AI and model; failed scenes can be regenerated separately. Content AI is unchanged.",
  },
} as const;
