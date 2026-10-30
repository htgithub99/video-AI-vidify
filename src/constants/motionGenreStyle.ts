export const MOTION_GENRE_STYLE = {
  VI: /^vi/i,
  SENTENCE: /[^.!?…]+[.!?…]*/g,
  WORD: /\S+/g,
  QUOTE: /["“”][^"“”]*["“”]/g,
  RULES: {
    pov: { vi: /(^|[^\p{L}])bạn([^\p{L}]|$)/iu, en: /\byou(r|rs|rself)?\b/i, maxMissing: 0.15, issue: "anchor this line in what bạn (you) see, hear, do or are told; no detached third-person explanation" },
    witness: { vi: /(^|[^\p{L}])tôi([^\p{L}]|$)/iu, en: /\b(I|me|my|mine|myself)\b/, maxMissing: 0.3, maxUnits: 22, issue: "retell this line in the narrator's own spoken 'tôi' voice", longIssue: "split long sentences into short spoken sentences of 5 to 14 syllables" },
  } as Record<string, { vi: RegExp; en: RegExp; maxMissing: number; maxUnits?: number; issue: string; longIssue?: string }>,
  FOCUS: (items: { id: string; issue: string }[]): string => "GENRE STYLE FOCUS: these lines break the selected genre's writing style; rewrite each in that style while keeping its facts, names and length: " + items.map((item) => item.id + " (" + item.issue + ")").join("; ") + ".",
  LOG: (count: number): string => `Biên tập viên: ${count} câu chưa đúng giọng kể của thể loại, AI sẽ viết lại.`,
} as const;
