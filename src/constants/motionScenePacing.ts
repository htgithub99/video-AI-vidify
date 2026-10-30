export const MOTION_SCENE_PACING = {
  REVISION: 1,
  DEFAULT: "few",
  GROUP_SECONDS: 45,
  GROUP_LINES: 32,
  GROUP_BEATS: 8,
  SHORT_SECONDS: 3,
  SECONDS: { few: 14, medium: 9, many: 6 },
  GROUPING: 2,
  FIELD: "pacing",
  LEVELS: {
    few: { groupSeconds: 60, groupBeats: 10, groupLines: 40, placeHold: 14 },
    medium: { groupSeconds: 45, groupBeats: 8, groupLines: 32, placeHold: 0 },
    many: { groupSeconds: 30, groupBeats: 6, groupLines: 24, placeHold: 0 },
  },
  OVER_RATIO: 1.5,
  TEXT: {
    vi: {
      label: "Nhịp đổi hình",
      hint: "Bao lâu thì đổi sang một hình minh họa mới. Thưa: một hình giữ qua nhiều câu kể, cảnh chuyển thoáng qua được gộp vào hình đang có. Dày: đổi hình theo từng ý. Mọi mức vẫn đổi hình khi sang chương, đổi giờ trong ngày hoặc có manh mối quan trọng.",
      few: "Thưa – giữ hình lâu (~14 giây/hình)",
      medium: "Vừa (~9 giây/hình)",
      many: "Dày – đổi hình nhanh (~6 giây/hình)",
    },
    en: {
      label: "Picture pacing",
      hint: "How long each illustration stays on screen. Sparse holds one picture across several narration beats and folds brief cutaways into it. Dense changes the picture with each idea. Every level still cuts for a new chapter, a time-of-day change or an essential clue.",
      few: "Sparse – long holds (~14 s per picture)",
      medium: "Balanced (~9 s per picture)",
      many: "Dense – quick cuts (~6 s per picture)",
    },
  },
  RULE: (seconds: number, count: number) =>
    `Visual pacing: prefer a representative illustration held for roughly ${seconds} seconds; about ${count} pictures for this request is SOFT guidance, never a quota or acceptance gate. One picture may span consecutive narration beats, sentences and speakers. Cut only for a meaningful new visual task, actual place/time change, essential clue/reveal or contradictory physical state. Incidental looking, speaking, walking or opening a door can stay in the same illustration. Do not automatically add a detail shot, cut at every beat, repeat near-identical pictures, or hold a picture through an essential contradiction. Preserve every supplied speech line once in order.`,
  BRIEF_PLACES: (seconds: number) =>
    ` These beats may move between places (see each beat's place and context.places). A brief switch to another place inside the same continuous action can stay in the current picture or in one wider view that shows both; give a different place its own picture only when it lasts roughly ${seconds} seconds or more, or when the source clearly moves the scene there.`,
  OVER_LOG: (group: number, scenes: number, suggested: number, label: string) => `Nhịp đổi hình ${label}: nhóm ${group} lập ${scenes} hình (gợi ý khoảng ${suggested}); chỉ ghi nhận, không gọi lại AI.`,
  LOG: (count: number, beats: number, label: string) => `Nhịp hình ${label}: lập phân cảnh theo ${count} nhóm cho ${beats} nhịp kể; một hình có thể phủ nhiều nhịp.`,
  SHORT_LOG: (count: number) => `Có ${count} cảnh dưới 3 giây theo giọng thực. Giữ mốc lời kể và manh mối; không dừng video vì cảnh ngắn.`,
  MOTION_LOG: (name: string, channels: string[]) => `Cảnh ${name}: đã bật ${channels.join(", ")} nhưng AI chưa tạo chuyển động tương ứng; giữ hình minh họa tĩnh.`,
  CHANNELS: { actor: "chuyển động nhân vật", effect: "hiệu ứng cảnh" },
  RESUME_LOG: "Tiếp tục với cấu hình đã lưu của lượt tạo; thay đổi trên UI áp dụng khi tạo lượt mới hoặc dựng/xuất thủ công.",
} as const;
