export interface MotionGenreReviewChecks {
  retell: boolean;
  crossChapter: boolean;
  digits: boolean;
  timeJump: boolean;
  hindsight: boolean;
  commentary: boolean;
  refrain: boolean;
  ordeal: boolean;
  experts: boolean;
  labels: boolean;
}
const NONE: MotionGenreReviewChecks = { retell: false, crossChapter: false, digits: true, timeJump: false, hindsight: false, commentary: false, refrain: false, ordeal: false, experts: false, labels: false };
export const MOTION_GENRE_REVIEW = {
  DEFAULT: NONE,
  VI: /^vi/i,
  WORD: /[\p{L}\p{N}']+/gu,
  STOP: /^(?:that|this|with|from|your|into|over|they|their|them|then|when|where|while|which|what|there|have|been|were|will|would|about|after|before|under|across|toward|towards|again|against|still|only|just|like|through|upon|onto|every|each|some|more|most|other|another|bạn|những|nhưng|trong|người|không|được|cũng|nhau|lại|rồi|đang|thấy)$/iu,
  MONTH: /\b(?:january|february|march|april|may|june|july|august|september|october|november|december)\b|(?:^|[^\p{L}])tháng\s+(?:\d+|một|hai|ba|tư|năm|sáu|bảy|tám|chín|mười|chạp|giêng)(?:[^\p{L}]|$)/iu,
  DIGIT: /\p{N}/u,
  QUOTE: /["“”][^"“”]*["“”]/gu,
  QUESTION: /[?？]/u,
  RETELL: { DISTANCE: 3, STEM: 4, MIN_LENGTH: { vi: 2, en: 4 } as Record<string, number>, SHARED: 3, RATIO: 0.6, DATED_SHARED: 2, DATED_RATIO: 0.65, CROSS_SHARED: 4, CROSS_RATIO: 0.6, HANDOFF_RATIO: 0.6 },
  TIME_JUMP: /\b(?:many|several)\s+(?:years|decades)\s+later\b|\b(?:years|decades)\s+later\b|(?:^|[^\p{L}])(?:nhiều|mấy chục|hàng chục|bao nhiêu)\s+(?:năm|thập kỷ)\s+sau(?:[^\p{L}]|$)/iu,
  HINDSIGHT: /\blater,?\s+word\s+(?:arrives|reaches)\b|\byou\s+will\s+(?:later\s+)?learn\b|\blater\s+you\s+(?:learn|hear)\b|(?:^|[^\p{L}])(?:sau này|về sau)\s+bạn\s+(?:mới\s+)?(?:biết|nghe)(?:[^\p{L}]|$)/iu,
  COMMENTARY: /\b(?:for|to come)\s+generations\b|\bgenerations\s+to\s+come\b|\bhistory\s+(?:will|would)\b|\bthe\s+course\s+of\s+history\b|(?:^|[^\p{L}])(?:nhiều thế hệ|lịch sử sẽ)(?:[^\p{L}]|$)/iu,
  EXPERTS: /\b(?:historians?|experts?|scholars?|researchers?|academics?|some\s+argue|others\s+argue|many\s+believe)\b|(?:^|[^\p{L}])(?:sử gia|nhà sử học|chuyên gia|học giả|giới nghiên cứu|nhiều người cho rằng)(?:[^\p{L}]|$)/iu,
  REFRAIN_WORDS: 5,
  ORDEAL_STAGE: "ordeal",
  CANDIDATE_STAGE: "candidate",
  COUNT: /\b(?:seconds?|minutes?|hours?|steps?|paces?|yards?|feet|heartbeats?|breaths?|count(?:s|ing)?)\b|(?:^|[^\p{L}])(?:giây|phút|bước|nhịp thở|đếm)(?:[^\p{L}]|$)/iu,
  ISSUE: {
    RETELL: (id: string, quote: string): string => `may retell the event in nearby line ${id} ("${quote}"); compare the meaning, retain every new decision, cause and consequence, and shorten only information already told; never remove a new event because battle vocabulary repeats`,
    CROSS: (id: string, quote: string): string => `may retell an event in the previous chapter (line ${id}: "${quote}"); keep each new cause or consequence, refer back in one short clause and move on`,
    HANDOFF: (id: string): string => `repeats the previous chapter's closing line ${id}; open with the moment right after it, or return "drop": true`,
    DIGITS: (vi: boolean): string => (vi ? "write every number, date and year in spoken Vietnamese words exactly as the narrator reads them" : "write every number, date and year in spoken words exactly as the narrator reads them (for example 'June the second', 'ten ninety-seven')"),
    TIME_JUMP: "only one closing time jump is allowed and it already happened; continue that same scene without a new 'years later', or return \"drop\": true if this line only repeats it",
    HINDSIGHT: "hindsight about a later outcome may appear only once in the video; keep this line in the present moment",
    COMMENTARY: "detached commentary on history's long-term meaning; replace it with what is seen, felt or done in this moment",
    EXPERTS: "the source names no historians, experts or scholars; state only what the source itself says, without attributing views to unnamed experts",
    REFRAIN: (refrain: string): string => `the full refrain "${refrain}" is spoken exactly only at its first and final use; here shorten it, break it off or let the moment change it, keeping its key words`,
    ORDEAL: "this ordeal chapter never runs in near real time; turn this line into a short countdown or count of your own minutes, steps or breaths in this moment (no new source numbers)",
    LABELS: (labels: string[]): string => `this weighing gives more than one verdict label (${labels.map((label) => `"${label}"`).join(", ")}); keep exactly one fixed label for this candidate and make the answer agree with it`,
    EXPECTED_LABEL: (label: string): string => `this candidate weighing must use only the approved label "${label}" once, consistent with the common criterion; remove conflicting labels without inventing evidence`,
  },
  FOCUS: (items: { id: string; issue: string }[]): string => 'GENRE REVIEW FOCUS: fix each line as described; a line marked droppable may return "drop": true together with its original narration: ' + items.map((item) => item.id + " (" + item.issue + ")").join("; ") + ".",
  REFRAIN_EXCEPTION: "Exception to the fixed motif words: a line listed under GENRE REVIEW FOCUS for the refrain keeps the token but may shorten or vary the refrain.",
  OUTLINE: {
    PREVIOUS_LAST: (line: string): string => `The last spoken line before this part was: ${line}. Never repeat or paraphrase it; open with the moment right after it.`,
    HOOK_USED: "already spoken as the previous chapter's last line; start right after it",
    PLANNED: "The planned hook and hand-over describe intent only: write them in your own words and never reuse a planned sentence verbatim.",
  },
  LOG: (count: number): string => `Biên tập viên: ${count} câu chưa đạt luật thể loại (kể lại sự kiện, lặp câu nối chương, số viết bằng chữ số, nhãn, nguồn chuyên gia…), sửa trong lượt biên tập sẵn có.`,
  DEFERRED_LOG: (count: number): string => `Biên tập viên: để lại ${count} câu chưa sửa để không thêm lượt AI ngoài lượt biên tập sẵn có.`,
  DROP_LOG: (count: number): string => `Biên tập viên: bỏ ${count} câu kể lại nội dung đã có.`,
} as const;
