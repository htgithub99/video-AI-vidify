export const MOTION_GENRE_VOICE = {
  SENTENCE: /[^.!?…。！？]+[.!?…。！？]*/g,
  WORD: /\S+/g,
  QUOTE: /["“”][^"“”]*["“”]/g,
  HINDSIGHT_PER_CHAPTER: 1,
  DETACHED_PER_CHAPTER: 6,
  NARRATION: "narration",
  FOCUS: (items: { id: string; issue: string }[]): string => "GENRE VOICE FOCUS: these lines break the selected genre's spoken voice; rewrite each as described while keeping its facts, names and length: " + items.map((item) => item.id + " (" + item.issue + ")").join("; ") + ".",
  LOG: (count: number): string => `Biên tập viên: ${count} câu chưa đúng giọng kể của thể loại, gộp sửa theo chương.`,
} as const;
