export const MOTION_STORYTELLING_MODES = { PLAIN: "plain", LIVELY: "lively", GRIPPING: "gripping" } as const;
export type MotionStorytellingMode = (typeof MOTION_STORYTELLING_MODES)[keyof typeof MOTION_STORYTELLING_MODES];
export type MotionShortSourceMode = "strict" | "genre" | "fill";
export type MotionHooksLevel = "off" | "light" | "full";
export interface MotionStorytellingSilent {
  chapterCard: number;
  emphasis: number;
  chapterEnd: number;
  videoEnd: number;
}
export interface MotionStorytellingPreset {
  shortSource: MotionShortSourceMode;
  hooks: MotionHooksLevel;
  dramaticAudio: boolean;
  texture: number;
}
export const MOTION_STORYTELLING = {
  DEFAULT: MOTION_STORYTELLING_MODES.LIVELY as MotionStorytellingMode,
  CHOICES: [MOTION_STORYTELLING_MODES.PLAIN, MOTION_STORYTELLING_MODES.LIVELY] as MotionStorytellingMode[],
  ALIASES: { gripping: MOTION_STORYTELLING_MODES.LIVELY } as Record<string, MotionStorytellingMode>,
  SILENT_FIXED: { chapterCard: 2, emphasis: 1, chapterEnd: 1.5, videoEnd: 3 } as MotionStorytellingSilent,
  FIELD: "storytelling",
  PRESETS: { plain: { shortSource: "strict", hooks: "light", dramaticAudio: true, texture: 0 }, lively: { shortSource: "fill", hooks: "full", dramaticAudio: true, texture: 2 }, gripping: { shortSource: "fill", hooks: "full", dramaticAudio: true, texture: 2 } } as Record<MotionStorytellingMode, MotionStorytellingPreset>,
  EXPANSION: { genre: { pov: 2.5, witness: 2.5, chronicle: 1.2, verdict: 1.5 } as Record<string, number>, fill: { pov: 3, witness: 3, chronicle: 1.5, verdict: 2 } as Record<string, number> },
  EXPANSION_MAX_BEATS_PER_EVENT: 4,
  SOURCE_TIMESTAMP: /^\(\d+:\d{2}\)\s*/gm,
  THIN_TRIGGER: 1.3,
  FAITHFUL_FILL: 1.2,
  SILENT: { genre: { chapterCard: 2.5, emphasis: 1, chapterEnd: 1.5, videoEnd: 3 }, fill: { chapterCard: 4, emphasis: 1.5, chapterEnd: 2.5, videoEnd: 4 } } as Record<string, MotionStorytellingSilent>,
  LENGTH_FLOOR_RATIO: 0.9,
  BREAK_EVERY_BEATS: 12,
  VIEWER_QUESTIONS_PER_CHAPTER: 1,
  TEXT: {
    vi: {
      LABEL: "Cách kể",
      HINT: "Giọng kể luôn ở mức cuốn hút nhất theo thể loại. Lựa chọn này chỉ quyết định khi nguồn ngắn hơn thời lượng đã chọn: Giữ đúng nguồn thì video có thể ngắn hơn; Đủ thời lượng thì thêm nội dung mới đúng kiểu thể loại để đủ thời lượng, không kể chậm, không kéo lê. Không lựa chọn nào thêm sự kiện, con số hay lời và việc của người có thật ngoài nguồn.",
      OPTIONS: { plain: "Giữ đúng nguồn", lively: "Đủ thời lượng", gripping: "Đủ thời lượng" },
      CAPACITY: (sourceMinutes: number, chosenMinutes: number, factor: number, mode: string): string => (factor > 1.01 ? `Nguồn đủ cho ~${sourceMinutes} phút; đang chọn ${chosenMinutes} phút → giãn ×${factor.toFixed(1)} (${mode}).` : `Nguồn đủ cho ~${sourceMinutes} phút với ${chosenMinutes} phút đã chọn.`),
      ESTIMATE: (seconds: number, chosenSeconds: number): string => `Ước tính kịch bản ~${Math.floor(seconds / 60)} phút ${Math.round(seconds % 60)} giây theo tốc độ đọc đã đo (chọn ${Math.round(chosenSeconds / 60)} phút, đạt ${Math.round((seconds / Math.max(1, chosenSeconds)) * 100)}%).`,
      CHAPTER: (chapter: string, units: number, wanted: number): string => `Chương ${chapter}: ${units} âm tiết / yêu cầu ${wanted} (${Math.round((units / Math.max(1, wanted)) * 100)}%).`,
      EXPANDED: (chapter: string, beats: number, factor: number): string => `Chương ${chapter}: nguồn ngắn, cho phép ${beats} nhịp với hệ số giãn ×${factor.toFixed(1)} theo thể loại; kể chậm, không thêm sự kiện.`,
    },
    en: {
      LABEL: "Storytelling",
      HINT: "The telling is always as gripping as the genre allows. This choice only decides what happens when the source is shorter than the chosen length: Keep to the source may give a shorter video; Fill the length adds new genre-fitting content to reach the length, never slowing down or padding. Neither choice adds events, numbers, or words and acts of real people absent from the source.",
      OPTIONS: { plain: "Keep to the source", lively: "Fill the length", gripping: "Fill the length" },
      CAPACITY: (sourceMinutes: number, chosenMinutes: number, factor: number, mode: string): string => (factor > 1.01 ? `Source covers ~${sourceMinutes} min; ${chosenMinutes} min chosen → stretch ×${factor.toFixed(1)} (${mode}).` : `Source covers ~${sourceMinutes} min for the chosen ${chosenMinutes} min.`),
      ESTIMATE: (seconds: number, chosenSeconds: number): string => `Script estimate ~${Math.floor(seconds / 60)} min ${Math.round(seconds % 60)} s at the measured reading rate (${Math.round(chosenSeconds / 60)} min chosen, ${Math.round((seconds / Math.max(1, chosenSeconds)) * 100)}%).`,
      CHAPTER: (chapter: string, units: number, wanted: number): string => `Chapter ${chapter}: ${units} units / ${wanted} requested (${Math.round((units / Math.max(1, wanted)) * 100)}%).`,
      EXPANDED: (chapter: string, beats: number, factor: number): string => `Chapter ${chapter}: thin source, allowing ${beats} beats with genre stretch ×${factor.toFixed(1)}; tell slowly, add no events.`,
    },
  },
  HOOK: { OPEN: "open", CLOSE: "close" },
  ISSUE: {
    BREAK: "twelve or more beats in a row are plain scenes; turn this beat into an insert of an object, a place without people, or the genre's card/map/device picture, keeping its spoken words",
    QUESTIONS: "more than one question to the viewer in this chapter; keep one and turn the others into statements",
    LOOP_LOG: (chapter: string): string => `Chương ${chapter}: không có vòng mở/đóng (hook open/close); chỉ ghi nhận.`,
  },
  VIEWER_QUESTION: /[?？]\s*$/u,
  PROMPT: {
    FLOOR: (ratio: number): string => `LENGTH FLOOR: the source is rich enough for this chapter, so deliver at least ${Math.round(ratio * 100)}% of the requested units. If the first draft runs short, tell the same events more slowly in the genre's own way (senses, objects, reactions, comparisons, weighing); never add an event, number, quote or real person the source does not supply.`,
    FAITHFUL: (units: number): string => `SHORT SOURCE, KEEP TO THE SOURCE: this chapter's transcript only supports about ${units} spoken units, so write about ${units} units (the window below is already adjusted). Cover only what the source says, in its order and in this genre's voice; add no events, outside background, padding or second telling of any event. Being shorter than the originally requested length is expected in this mode.`,
    DEPTH: (needed: number, allowed: number): string => `SHORT SOURCE, DEPTH ×${needed.toFixed(1)}: this chapter's source is about ${needed.toFixed(1)} times shorter than its requested length${allowed > 1 ? `, beyond the ×${allowed.toFixed(1)} slow-telling stretch` : ""}. Fill the rest with depth, never with repetition or padding: explain how and why each source event worked (the mechanism, the constraint, the cost, what was at stake for each side), what it changed afterwards, and why it still matters, using only facts the source states or broadly established background about the same place, period and subject. Each added beat must teach the viewer something not yet said; never invent events, numbers, quotes, deaths or real people, never restate an earlier beat in new words, and keep every added beat in this genre's voice.`,
    EXPANSION: (factor: number, rule: string): string => `SHORT SOURCE, STRETCH ×${factor.toFixed(1)}: the transcript is thinner than the requested length. Reach the requested units by telling each source event across up to four beats in this genre's slow-telling manner: ${rule} Never invent events, numbers, quotes, deaths, ceremonies or real people; repeat nothing word for word.`,
    SILENT: "Pauses, chapter cards and held pictures add to the running time; do not pad speech to fill them.",
    TEXTURE: (perEvent: number, kinds: string): string =>
      `TEXTURE BEATS: to make the chapter vivid, after a source event you may add up to ${perEvent} short beat${perEvent > 1 ? "s" : ""} of lived texture drawn from: ${kinds}. A texture beat belongs to the moment it follows, stays in the genre's voice and moves the scene forward; it never adds an event, date, number, quote or action of a real person, and the invented people in it are only the protagonist, the narrator or the invented companions.`,
  },
} as const;
