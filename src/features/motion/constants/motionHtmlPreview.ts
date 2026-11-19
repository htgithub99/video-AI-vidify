export const MOTION_HTML_PREVIEW_TEXT = { SCENE: (n: number): string => `Cảnh ${n}`, JOIN: " · " } as const;
export const MOTION_HTML_PREVIEW = {
  AHEAD_SECONDS: 1.5,
  START_FRAMES: 8,
  MAX_DPR: 1.5,
  MAX_STEP: 3,
  STALL_WINDOW_MS: 3000,
  STALL_SHARE: 0.2,
  SPINNER_DELAY_MS: 250,
  HOST_QUEUE: "motion-host-queue",
  HOST_SHOW: "motion-host-show",
  HOST_RESET: "motion-host-reset",
  HOST_BUFFERED: "motion-host-buffered",
  HOST_CLEARED: "motion-host-cleared",
  HOST_SNAP: "motion-host-snap",
  CHAPTER_TITLE: (index: number, text?: string) =>
    [
      MOTION_HTML_PREVIEW_TEXT.SCENE(index + 1),
      String(text || "")
        .replace(/\s+/g, " ")
        .trim(),
    ]
      .filter(Boolean)
      .join(MOTION_HTML_PREVIEW_TEXT.JOIN),
  THUMB_WIDTH: 400,
} as const;
