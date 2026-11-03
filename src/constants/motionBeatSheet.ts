export const MOTION_BEAT_SHEET = {
  KINDS: ["event", "texture", "device", "bookend"] as const,
  EVENT: "event",
  TEXTURE: "texture",
  MAX_EVENT_BEATS: 2,
  TIMESTAMP: /^\s*\(\d{1,2}:\d{2}(?::\d{2})?\)\s*/u,
  ID: (chapterId: string, index: number): string => `${chapterId}.e${index + 1}`,
  PROMPT: (events: { id: string; point: string }[], texture: number, devices: string, minimum: number, speakers: string[], minLines: number): string =>
    `BEAT SHEET (ordered source events of this chapter):\n${events.map((event) => `${event.id}: ${event.point}`).join("\n")}\nTell these events in this order, each in one or two beats with kind "event" and its eventId, never retelling an event already told (in this chapter or an earlier one) and never telling an event of another chapter. ${texture ? `After an event you may add up to ${texture} beat${texture > 1 ? "s" : ""} with kind "texture" (eventId = the event it follows) from the genre's texture list. ` : ""}${devices ? `Genre devices of the contract (${devices}) go in beats with kind "device". ` : ""}The opening and closing beats of the video use kind "bookend". Every beat carries kind and eventId (the event it tells or follows). MINIMUM: this chapter needs at least ${minimum} beats (one per event plus its texture and device beats); fewer means the chapter is incomplete and too short.${minLines && speakers.length ? ` DIALOGUE: at least ${minLines} beat${minLines > 1 ? "s" : ""} of this chapter carries a short quoted line spoken by one of: ${speakers.join(", ")}.` : ""}`,
  ISSUE: {
    RETELL: (eventId: string): string => `this beat tells event ${eventId} a third time; keep only new information of this moment or return "drop": true`,
    ORDER: (eventId: string, later: string): string => `this beat tells event ${eventId} after the later event ${later} was already told; move its content into the earlier telling or return "drop": true`,
    MISSING: (eventId: string, point: string): string => `event ${eventId} of this chapter ("${point}") is not told anywhere; fold it into this beat or the beat right after it, in order, without dropping what is already here`,
    FOREIGN: (eventId: string): string => `this beat tells event ${eventId}, which belongs to another chapter of the outline; replace it with this chapter's moment or return "drop": true`,
  },
  QUALITY_LOG: (chapter: string, units: number, viewer: number | undefined, covered: number, events: number, texture: number, stage = ""): string =>
    `Điểm kịch bản ${chapter}${stage}: độ dài ${units}%${viewer === undefined ? "" : `, câu đúng ngôi ${viewer}%`}, sự kiện ${covered}/${events}, tình tiết ${texture} (chỉ ghi nhận).`,
  AFTER_EDIT: " sau biên tập",
  MIN_DEVICE_BEATS: 1,
  PROTAGONIST: "protagonist",
} as const;
