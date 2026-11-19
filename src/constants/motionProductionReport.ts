export const MOTION_PRODUCTION_REPORT = {
  FOLDER: "reports",
  EXT: ".md",
  CONFIG_KEYS: ["videoGenre", "storytelling", "length", "language", "aspect", "fps", "pacing", "aiReview", "asrCheck", "subtitles", "sfx", "musicMood", "multiVoice", "autoExport"] as readonly string[],
  TITLE: (id: string) => `# Báo cáo video ${id}`,
  CONFIG: "## Cấu hình",
  STEPS: "## Thời gian từng bước",
  SCENES: "## Cảnh",
  SCENE_HEAD: "| Cảnh | Lượt AI | Kết quả | Cảnh báo |\n|---|---|---|---|",
  SCENE_ROW: (id: string, attempts: number, state: string, warnings: string) => `| ${id} | ${attempts} | ${state} | ${warnings || "-"} |`,
  STEP_ROW: (name: string, seconds: number, retries: number) => `- ${name}: ${seconds >= 60 ? `${Math.floor(seconds / 60)} phút ${Math.round(seconds % 60)} giây` : `${Math.round(seconds)} giây`}${retries ? ` (thử lại ${retries} lần)` : ""}`,
  CONFIG_ROW: (key: string, value: string) => `- ${key}: ${value}`,
  REVISED: (notes: [string, string][], labels: Record<string, string>): string =>
    `sửa khi dựng: ${Object.entries(notes.reduce((n, [k]) => ({ ...n, [k]: (n[k] || 0) + 1 }), {} as Record<string, number>))
      .map(([k, n]) => `${labels[k] || k} ${n}`)
      .join(", ")}`,
  REVISED_TOTAL: (notes: [string, string][], labels: Record<string, string>): string =>
    notes.length
      ? `Sửa khi dựng (không gọi AI): ${Object.entries(notes.reduce((n, [k]) => ({ ...n, [k]: (n[k] || 0) + 1 }), {} as Record<string, number>))
          .map(([k, n]) => `${labels[k] || k} ${n}`)
          .join(" · ")}`
      : "",
  STATE: { FIRST: "đạt ngay", WARNED: "có cảnh báo", REDRAWN: "vẽ lại", FALLBACK: "cảnh dự phòng do code dựng" },
  TOTAL: (total: number, first: number, warned: number, redrawn: number, fallback: number, turns: number) => `Tổng: ${total} cảnh · đạt ngay ${first} · có cảnh báo ${warned} · vẽ lại ${redrawn} · dự phòng ${fallback} · ${turns} lượt AI vẽ cảnh (${total ? (turns / total).toFixed(2) : "0"} lượt mỗi cảnh).`,
  LOG: (file: string, summary: string) => `Báo cáo video đã lưu tại ${file}. ${summary}`,
} as const;
