export const MOTION_SETTINGS_COMPATIBILITY = {
  vi: {
    labels: { videoGenre: "Thể loại", storytelling: "Cách kể", renameEntities: "Đổi tên", length: "Thời lượng" },
    reanalyze: (fields: string) => `${fields} đã đổi so với bản phân tích. Phân tích lại trước khi viết kịch bản.`,
    resume: "Lượt tạo này chạy tiếp với cấu hình đã lưu. Cấu hình mới áp dụng cho lượt mới hoặc khi dựng, xuất lại thủ công.",
    language: "Ngôn ngữ mới chỉ áp dụng khi viết lại kịch bản và tạo giọng.",
    parts: "Số phần mới chỉ áp dụng cho lượt tạo mới.",
    voiceCheck: "Giọng trả về chưa có kết quả kiểm tra theo cấu hình đã chọn. Hãy tạo giọng lại trước khi xuất.",
    voiceRecheck: "Giọng đã lưu chưa có kiểm tra ASR theo cấu hình của lượt tạo; kiểm tra/tạo lại giọng, giữ kịch bản và hình đã hoàn thành.",
  },
  en: {
    labels: { videoGenre: "Genre", storytelling: "Storytelling", renameEntities: "Renaming", length: "Duration" },
    reanalyze: (fields: string) => `${fields} changed since the analysis. Analyze again before writing the script.`,
    resume: "This run continues with its saved settings. New settings apply to a new run or a manual rebuild or export.",
    language: "The new language applies only when the script and voice are regenerated.",
    parts: "The new part count applies only to a new run.",
    voiceCheck: "The returned voice has no check result matching the selected settings. Generate the voice again before export.",
    voiceRecheck: "The saved voice has no ASR check matching this run; check/regenerate speech while keeping the completed script and artwork.",
  },
} as const;
