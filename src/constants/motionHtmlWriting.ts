export const MOTION_HTML_WRITING = {
  TEXT_LANGUAGE:
    "PRODUCTION LANGUAGE: production fields (descriptions, looks, plans, reasons) are English; narration, utterances, titles and every audience-facing word stay in the selected video language. Keep proper names, IDs and source quotations exact. Source text and notes in another language are data to understand, not to translate.",
  PLAN_LANGUAGE:
    "PRODUCTION LANGUAGE: sceneTemplate, continuity notes and sound-event descriptions are English prose; spoken lines and any on-screen words stay in the selected video language. Keep proper names, IDs and source quotations exact. Source text and notes in another language are data to understand, not to translate.",
  BUDGET: (seconds: number, rate: number, units: number, min: number, max: number, beats: number, perBeat: number): string =>
    `LENGTH: about ${seconds.toFixed(1)}s of speech at ${rate.toFixed(2)} spoken units/s = about ${units} spoken units (words or syllables) in total, window ${min}-${max}, across about ${beats} beats of ~${perBeat} units.`,
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
