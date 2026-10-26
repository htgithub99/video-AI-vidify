export const MOTION_PROGRESS = {
  STAGE: { PLAN: "Phân cảnh", READ: "Đọc cảnh", ASSEMBLE: "Ghép tài nguyên", BUILD: "Dựng cảnh", REVIEW: "Duyệt ảnh" },
  STATUS: { START: "Đang xử lý", DONE: "Đã xong", REUSE: "Dùng phần đã đạt" },
  TEXT_LIMIT: 100,
  TIME: /^(\d{1,2}):(\d{2}):(\d{2})\s*·\s*/u,
  SECTION: /^\[([^\]]+)\]\s*/u,
  DAY_SECONDS: 86400,
  SEO_SECTION: "[Tạo SEO]",
  STAMP: (line: string): string => `${new Date().toLocaleTimeString("vi-VN")} · ${line}`,
  SCOPE: (stage: string, line: string): string => {
    const stamp = line.match(/^(\d{1,2}:\d{2}:\d{2}\s*·\s*)(.*)$/su);
    return stamp ? `${stamp[1]}[${stage}] ${stamp[2]}` : `[${stage}] ${line}`;
  },
  SCENE: (stage: string, status: string, index: number, total: number, place: string, text: string): string => `[${stage}] ${status} cảnh ${index}/${total}${place ? ` · ${place}` : ""} · ${text}`,
  GROUP: (status: string, index: number, total: number, from: number, to: number, sources: number, scenes: number): string => `[Phân cảnh] ${status} nhóm ${index}/${total} · nội dung ${from}–${to}/${sources} · đã chốt ${scenes} cảnh.`,
  SUMMARY: (stage: string, done: number, total: number): string => `[${stage}] Đã xong ${done}/${total} cảnh.`,
} as const;
