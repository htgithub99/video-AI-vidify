export const MOTION_SCENE_PACING = {
  REVISION: 1,
  DEFAULT: "few",
  GROUP_SECONDS: 45,
  GROUP_LINES: 32,
  GROUP_BEATS: 8,
  SHORT_SECONDS: 3,
  SECONDS: { few: 14, medium: 9, many: 6 },
  TEXT: {
    vi: { label: "Nhịp hình", hint: "Ít hình giữ một minh họa qua nhiều câu kể; vẫn đổi hình khi bối cảnh hoặc manh mối quan trọng thay đổi.", few: "Ít · chậm", medium: "Vừa", many: "Nhiều" },
    en: { label: "Scene pacing", hint: "Fewer pictures can span several narration beats; essential location and clue changes still get a new picture.", few: "Few · slow", medium: "Medium", many: "Many" },
  },
  RULE: (seconds: number, count: number) =>
    `Visual pacing: prefer a representative illustration held for roughly ${seconds} seconds; about ${count} pictures for this request is SOFT guidance, never a quota or acceptance gate. One picture may span consecutive narration beats, sentences and speakers. Cut only for a meaningful new visual task, actual place/time change, essential clue/reveal or contradictory physical state. Incidental looking, speaking, walking or opening a door can stay in the same illustration. Do not automatically add a detail shot, cut at every beat, repeat near-identical pictures, or hold a picture through an essential contradiction. Preserve every supplied speech line once in order.`,
  LOG: (count: number, beats: number, label: string) => `Nhịp hình ${label}: lập phân cảnh theo ${count} nhóm cho ${beats} nhịp kể; một hình có thể phủ nhiều nhịp.`,
  SHORT_LOG: (count: number) => `Có ${count} cảnh dưới 3 giây theo giọng thực. Giữ mốc lời kể và manh mối; không dừng video vì cảnh ngắn.`,
  MOTION_LOG: (name: string, channels: string[]) => `Cảnh ${name}: đã bật ${channels.join(", ")} nhưng AI chưa tạo chuyển động tương ứng; giữ hình minh họa tĩnh.`,
  CHANNELS: { actor: "chuyển động nhân vật", effect: "hiệu ứng cảnh" },
  RESUME_LOG: "Tiếp tục với cấu hình đã lưu của lượt tạo; thay đổi trên UI áp dụng khi tạo lượt mới hoặc dựng/xuất thủ công.",
} as const;
