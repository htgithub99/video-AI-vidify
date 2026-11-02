export const MOTION_GENRE_AUTOFIX = {
  DUPLICATE: { RATIO: 0.85, SHARED: 4 },
  CROWD: /\b(?:crowd|army|armies|troops|soldiers|legion|fleet|column|villagers|thousands|hundreds)\b|đám đông|quân|đoàn|dân làng|hàng trăm|hàng nghìn|cả làng/iu,
  EMOTION: /\b(?:tears?|cries|weeps|trembl|shak|fear|afraid|whisper|stares?|smiles?|frowns?|gasps?)\w*|khóc|run|rùng mình|sợ|thì thầm|nhìn trân|cười|lạnh toát|điếng người|nghẹn/iu,
  OBJECT_ONLY: /^(?:the|a|an|một|cái|chiếc|đôi|cây|con)\s/iu,
  LOG: (dropped: number, visuals: number, shots: number, speech: number): string => `Sửa bằng code: bỏ ${dropped} câu lặp liền kề, chỉnh ${visuals} kiểu hình, ${shots} cỡ cảnh theo thể loại, tách ${speech} câu thoại trực tiếp; không gọi AI.`,
  SPEECH: {
    PATTERN: /^(?<before>[\s\S]*?\S[^"“”]*?(?:said|says|asked|asks|replied|answered|shouted|whispered|told|warned|muttered|bảo|nói|hỏi|đáp|gắt|quát|thì thầm|dặn|khuyên|kêu lên|xua tay|van xin|cãi)[^:"“”]{0,24}:)\s*[“"](?<quote>[^”"]{3,240})[”"]\s*(?<after>[\s\S]*)$/iu,
    MIN_QUOTE_WORDS: 2,
    NARRATION: "narration",
    DIALOGUE: "dialogue",
    NARRATOR: "narrator",
    NEUTRAL: "neutral",
    SPEED: 1,
  },
  MIX_LOG: (genre: string, summary: string): string => `Cỡ cảnh ${genre}: ${summary} (chỉ ghi nhận).`,
  MIX_TOLERANCE: 20,
} as const;
