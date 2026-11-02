export const MOTION_GENRE_GRAMMAR_REVIEW = {
  DEVICE_ISSUE: (device: string): string => `this candidate chapter never shows the comparison device; turn this beat into visual "verdict" whose subject is ${device ? `"${device}"` : "the recurring device"} beside the candidate, keeping the spoken words`,
  SCOREBOARD_ISSUE: 'the final chapter has no scoreboard picture; make this beat visual "scoreboard" with subject listing every candidate and its label',
  ERA_ISSUE: 'this era opens without a year card; make this first beat visual "chapter" or "timeline" with subject naming the year and the era title',
  SUBJECT_ISSUE: "this beat names nothing the viewer can see; add subject with one concrete person doing one thing, one object or one place, and keep narration",
  PREACH: /\b(?:the lesson|moral of|teaches us|remember that)\b|bài học|ngẫm ra|hiểu rằng|nhắc mình|sống tích cực|răn dạy/iu,
  PREACH_ISSUE: 'the closing of a witness tale keeps one small lingering detail instead of a lesson; replace this moral with a concrete thing the narrator still sees or touches, or return "drop": true',
  OBJECT_MIN_PER_CHAPTER: 2,
  OBJECT_ISSUE: "this chapter has no insert picture of a household or taboo object; make this beat shot \"insert\" with subject naming the object the narrator mentions",
  SUBJECT_MIN_CHARS: 3,
  OPENING_LOG: (genre: string, beats: number, max: number): string => `Mở đầu ${genre}: ${beats} nhịp trước sự kiện đầu tiên (gợi ý tối đa ${max}); chỉ ghi nhận.`,
} as const;
