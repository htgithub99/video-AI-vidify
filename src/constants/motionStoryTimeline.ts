export const MOTION_STORY_TIMELINE = {
  RANGE: { STAMP: /\((?:(\d+):)?(\d{1,2}):(\d{2})\)/, TOLERANCE: 2, MIN_SPAN: 10, LOG: (count: number) => `Chia chương: sửa mốc thời gian của ${count} chương cho khớp nguồn và các mốc chính, không gọi thêm AI.` },
  OVERLAP: {
    SENTENCE: /[^.!?…]+[.!?…]*/gu,
    NARRATOR_NAME: /^(?:bạn|tôi|you|i|me)$/iu,
    SPACE: /\s+/u,
    NAME_TOKEN: /^(?!(?:[IVXLC]+)$)\p{Lu}[\p{L}'’-]{3,}$/u,
    BOUNDARY: (name: string) => new RegExp(`(^|[^\\p{L}])${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}($|[^\\p{L}])`, "iu"),
    EVENTS: {
      death: /chết|tử trận|tử nạn|qua đời|bị giết|thiệt mạng|hy sinh|\b(?:die[sd]?|killed|drown(?:ed|s)?|slain)\b/iu,
      flee: /bỏ chạy|bỏ trốn|tháo chạy|chạy trốn|rút chạy|\b(?:fle[de]|flees|escaped)\b/iu,
      crown: /lên ngôi|đăng quang|xưng vương|xưng đế|\b(?:crowned|throne|enthroned)\b/iu,
      capture: /bị bắt|đầu hàng|bị bắt sống|\b(?:captured|surrender(?:ed|s)?)\b/iu,
      victory: /chiến thắng|thắng trận|đại thắng|\b(?:victor(?:y|ious)|won the battle)\b/iu,
      marriage: /cưới|kết hôn|thành hôn|\b(?:married|wedding)\b/iu,
      birth: /ra đời|chào đời|được sinh ra|\b(?:was born)\b/iu,
    } as Record<string, RegExp>,
    EXEMPT_FINAL: { verdict: true } as Record<string, boolean>,
    ISSUE: {
      pov: (chapter: string, quote: string) => `this event was already lived in chapter ${chapter} ("${quote}"); do not narrate it again: replace it with what happens next to bạn, or keep at most one short clause of hindsight`,
      witness: (chapter: string, quote: string) => `chapter ${chapter} already told this event ("${quote}"); if that earlier line was only a one-sentence foreshadowing keep this telling, otherwise replace it with the narrator's next memory`,
      chronicle: (chapter: string, quote: string) => `chapter ${chapter} already recorded this event ("${quote}"); a chronicle tells each event once: move on to the next dated event of this period`,
      verdict: (chapter: string, quote: string) => `chapter ${chapter} already presented this event ("${quote}"); refer back in one short clause and add new evidence or reasoning instead of retelling it`,
    } as Record<string, (chapter: string, quote: string) => string>,
    QUOTE_LIMIT: 90,
    FOCUS: (items: { id: string; issue: string }[]): string => "CROSS-CHAPTER REPETITION FOCUS: these lines retell an event an earlier chapter already narrated; fix each as described, keep this chapter's own events, names and approximate length: " + items.map((item) => item.id + " (" + item.issue + ")").join("; ") + ".",
    LOG: (count: number): string => `Biên tập viên: ${count} câu kể lại sự kiện chương trước, AI sẽ sửa trong lượt biên tập sẵn có.`,
  },
} as const;
