export const MOTION_HTML_WRITING = {
  TEXT_LANGUAGE:
    "PRODUCTION LANGUAGE: production fields (descriptions, looks, plans, reasons) are English; narration, utterances, titles and every audience-facing word stay in the selected video language. Keep proper names, IDs and source quotations exact. Source text and notes in another language are data to understand, not to translate.",
  PLAN_LANGUAGE:
    "PRODUCTION LANGUAGE: sceneTemplate, continuity notes and sound-event descriptions are English prose; spoken lines and any on-screen words stay in the selected video language. Keep proper names, IDs and source quotations exact. Source text and notes in another language are data to understand, not to translate.",
  BUDGET: (seconds: number, rate: number, units: number, min: number, max: number, beats: number, perBeat: number): string =>
    `LENGTH: about ${seconds.toFixed(1)}s of speech at ${rate.toFixed(2)} spoken units/s = about ${units} spoken units (words or syllables) in total, window ${min}-${max}, across about ${beats} beats of ~${perBeat} units.`,
  OVER: {
    TOLERANCE: 1.08,
    MAX_DROPS: 8,
    SENTENCE: /(?<=[.!?\u2026]["'\u201d\u2019)]*)\s+/u,
    ANCHOR: /\p{Lu}[\p{L}\p{M}]+|\d+/gu,
    TRIM_LOG: (chapter: string, dropped: number, from: number, to: number, max: number): string => `Chương ${chapter}: lời kể vẫn dài hơn mức tối đa sau khi viết lại (${from}/${max} âm tiết) – code bỏ ${dropped} câu phụ ít thông tin nhất, còn ${to} âm tiết.`,
    RULE: (written: number, target: number, max: number, beats: number): string =>
      `LENGTH CORRECTION: your previous answer for this part had ${written} spoken units; the part must have about ${target} and never more than ${max}. Write the same ${beats} beats again, same events in the same order, at most ${Math.max(8, Math.floor(max / Math.max(1, beats)))} spoken units per beat: keep the strongest image and action of each beat, drop secondary clauses, lists and repeated detail. Count the words of every narration before answering.`,
    LOG: (chapter: string, part: number, written: number, max: number): string => `Chương ${chapter} phần ${part}: AI viết ${written} âm tiết, vượt mức tối đa ${max} – yêu cầu viết lại ngắn hơn đúng số lượng.`,
  },
  ACTIONS: (pictureSeconds: number): string =>
    `PICTURE RHYTHM: one picture stays on screen for about ${pictureSeconds} seconds of narration and can show at most ${pictureSeconds >= 12 ? 3 : 2} physical actions in turn. Within any ${pictureSeconds} seconds of narration tell no more than that many new physical actions; give the rest of the words to what stays in view (the place, the faces, the stakes, the consequence), so the picture always shows what is being said.`,
  OPENING_GATE: {
    MAX_UNITS: 26,
    GENERIC: /^(?:in the year|throughout history|since the dawn|have you ever|imagine (?:a|if)|it was a (?:dark|cold)|once upon|today we|in this video|welcome)/i,
    LOG_LONG: (units: number, max: number): string => `Câu mở đầu dài ${units} âm tiết (nên dưới ${max}) – 5 giây đầu có thể chậm vào chuyện.`,
    LOG_GENERIC: (text: string): string => `Câu mở đầu dùng lối mở chung chung ("${text}") – nên vào thẳng hình ảnh hoặc hành động.`,
  },
  OPENINGS: {
    FILE: "opening-history.json",
    SHOWN: 6,
    KEPT: 80,
    MAX_CHARS: 180,
    FIRST_SENTENCE: /^[\s\S]*?[.!?…](?=\s|$)/u,
    RULE: (openings: string[]): string =>
      `FRESH OPENING: recent videos of this genre opened with the lines below. Open this one differently: another kind of first image or action, another sentence shape and rhythm, never the same object, gesture or sentence pattern. Recent openings: ${openings.map((line) => JSON.stringify(line)).join(" | ")}`,
  },
  SUMMARIZE: "Tell the source's causal arc inside this length; do not narrate every source sentence.",
  PART: (index: number, total: number, chapterId: string, title: string, beats: number, max: number, firstId: string): string =>
    `CHAPTER PART ${index}/${total} of ${chapterId} (${title}): return about ${beats} beats (at most ${max}), IDs starting at ${firstId}, covering only this part's SOURCE slice.`,
  FOCUS_EDIT:
    "Rewrite only the beats listed in 'fix' so each one keeps its facts and place but follows the genre voice. Return JSON {edits:[{id,narration,utterances?,reason}]} with one edit per listed beat. Leave every other beat, the chapter length and the beat order unchanged.",
  LINE_ID: (index: number): string => `L${index + 1}`,
  LINE_ID_PATTERN: /^L(\d+)$/,
  PLAN_LINES: "Line IDs are the short ids L1, L2… given in lines; use them for fromLineId and toLineId.",
  MAP_KIND: "map",
  TEMPLATE_KEY: /^\d+$/,
  TEMPLATE_NUMBERED: /^\s*\d+\./,
  TEMPLATE_JOIN: "\n",
  TEMPLATE_SECTION: (key: string, text: string): string => `${key}. ${text}`,
} as const;
