export const MOTION_GENRE_STAGE = {
  PLAN: (ids: string[], solo: string[]): string =>
    ` CHAPTER STAGES: every chapter also has a "stage" string naming the structure stage it covers, chosen from: ${ids.join(", ")}; a chapter that covers two consecutive stages names both separated by a comma. Stages follow this order and one stage may span several chapters.` +
    (solo.length ? ` These stages always get chapters of their own and never share a chapter with another stage: ${solo.join(", ")}.` : ""),
  SPLIT: /[,;|+/]/,
  RULE: (items: string[]): string => "STRUCTURE STAGE OF THIS CHAPTER (shape and pace the chapter this way; facts still come only from the transcript): " + items.join(" Then, "),
  ITEM: (id: string, rule: string): string => `${id} = ${rule}.`,
  MID_HOOK: (hook: string): string => `Second turn inside this chapter: ${hook}`,
  CHECK: {
    VI: /^vi/i,
    TIME_JUMP_GENRES: ["pov", "witness"] as readonly string[],
    TIME_JUMP_STAGE: "coda",
    TIME_JUMP: /(?:^|[^\p{L}])(?:nhiều|mấy chục|hàng chục|bao nhiêu)\s+(?:năm|thập kỷ)\s+sau(?:[^\p{L}]|$)|\b(?:many|several)\s+(?:years|decades)\s+later\b|\bdecades\s+later\b|^\s*["“]?years\s+later\b/iu,
    FUTURE: /(?:^|[^\p{L}])(?:sẽ|nhớ)(?:[^\p{L}]|$)|\b(?:will|remember(?:s|ed)?)\b|'ll\b/iu,
    SENTENCE: /[^.!?…]+[.!?…]*/gu,
    TIME_JUMP_ISSUE: "a closing time jump ('years later') belongs only to the final chapter; keep this line in the chapter's own time, or turn it into a short future-tense foreshadowing",
    STAMP_GENRES: ["chronicle", "verdict"] as readonly string[],
    STAMP_BEATS: 2,
    STAMP_SKIP_LAST: ["verdict"] as readonly string[],
    PLAN_STAMP: /\d{3,4}|thế kỷ|\bcentury\b/iu,
    POINT_PREFIX: /^\s*\((?:\d+:)?\d{1,2}:\d{2}\)\s*/,
    STAMP: /\d|nghìn|ngàn|trăm|thế kỷ|tháng|mùa (?:xuân|hạ|thu|đông)|\b(?:hundred|thousand|century|january|february|march|april|may|june|july|august|september|october|november|december|spring|summer|autumn|winter)\b/iu,
    STAMP_ISSUE: {
      chronicle: "open this chapter with its short spoken era title and the date-and-place stamp the transcript gives",
      verdict: "open this chapter with the date-and-place stamp of its moment as the transcript gives it",
    } as Record<string, string>,
    QUESTION_GENRES: ["verdict"] as readonly string[],
    QUESTION_STAGE: "candidate",
    QUESTION: /[?？]/u,
    QUESTION_ISSUE: "this candidate chapter never asks its question; end it by asking directly whether this was the answer, give a fair short answer with one reason, stamp the fixed verdict label and bridge to the next candidate",
  },
  FOCUS: (items: { id: string; issue: string }[]): string => "GENRE STRUCTURE FOCUS: these lines break the selected genre's chapter structure; fix each as described, keeping its facts, names and approximate length: " + items.map((item) => item.id + " (" + item.issue + ")").join("; ") + ".",
  LOG: (count: number): string => `Biên tập viên: ${count} câu chưa đúng khung chương của thể loại (nhảy thời gian sớm, thiếu mốc mở chương, thiếu câu hỏi ứng viên), sửa trong lượt biên tập sẵn có.`,
} as const;
