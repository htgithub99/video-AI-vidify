export const MOTION_SETTINGS_COMPATIBILITY = {
  vi: {
    labels: { videoGenre: "Thể loại", storytelling: "Cách kể", renameEntities: "Đổi tên", length: "Thời lượng" },
    reanalyze: (fields: string) => `${fields} đã khác bản phân tích. Hãy phân tích lại trước khi viết kịch bản để đồng bộ nội dung.`,
    resume: "Tiếp tục dùng cấu hình đã lưu của lượt tạo, kể cả xuất tự động. Chỉ tùy chọn xóa chat Gemini lấy giá trị hiện tại. Để áp dụng cấu hình mới, hãy tạo lượt mới hoặc dựng/xuất thủ công ở bước phù hợp.",
    language: "Ngôn ngữ mới áp dụng khi viết lại kịch bản và tạo giọng. Kịch bản, giọng và video đã có vẫn giữ ngôn ngữ cũ.",
    parts: "Số phần mới áp dụng khi tạo lượt mới; không chia lại kịch bản hoặc các phần đã hoàn thành.",
    voiceCheck: "Giọng trả về chưa có kết quả kiểm tra theo cấu hình đã chọn. Hãy tạo giọng lại trước khi xuất.",
    voiceRecheck: "Giọng đã lưu chưa có kiểm tra ASR theo cấu hình của lượt tạo; kiểm tra/tạo lại giọng, giữ kịch bản và hình đã hoàn thành.",
  },
  en: {
    labels: { videoGenre: "Genre", storytelling: "Storytelling", renameEntities: "Renaming", length: "Duration" },
    reanalyze: (fields: string) => `${fields} differs from the analysis. Analyze again before writing the script to keep the content consistent.`,
    resume: "Resume uses the saved run settings, including automatic export. Only Gemini chat cleanup uses the current selection. Apply new settings in a new run or in the appropriate manual build/export step.",
    language: "The new language applies when rewriting the script and generating speech. Existing script, audio and video keep their original language.",
    parts: "The new part count applies to a new run; it does not divide the existing script or completed parts again.",
    voiceCheck: "The returned voice has no check result matching the selected settings. Generate the voice again before export.",
    voiceRecheck: "The saved voice has no ASR check matching this run; check/regenerate speech while keeping the completed script and artwork.",
  },
} as const;
