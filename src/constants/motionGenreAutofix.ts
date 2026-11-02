export const MOTION_GENRE_AUTOFIX = {
  DUPLICATE: { RATIO: 0.85, SHARED: 4 },
  CROWD: /\b(?:crowd|army|armies|troops|soldiers|legion|fleet|column|villagers|thousands|hundreds)\b|đám đông|quân|đoàn|dân làng|hàng trăm|hàng nghìn|cả làng/iu,
  EMOTION: /\b(?:tears?|cries|weeps|trembl|shak|fear|afraid|whisper|stares?|smiles?|frowns?|gasps?)\w*|khóc|run|rùng mình|sợ|thì thầm|nhìn trân|cười|lạnh toát|điếng người|nghẹn/iu,
  OBJECT_ONLY: /^(?:the|a|an|một|cái|chiếc|đôi|cây|con)\s/iu,
  LOG: (dropped: number, visuals: number, shots: number): string => `Sửa bằng code: bỏ ${dropped} câu lặp liền kề, chỉnh ${visuals} kiểu hình và ${shots} cỡ cảnh theo thể loại; không gọi AI.`,
  MIX_LOG: (genre: string, summary: string): string => `Cỡ cảnh ${genre}: ${summary} (chỉ ghi nhận).`,
  MIX_TOLERANCE: 20,
} as const;
