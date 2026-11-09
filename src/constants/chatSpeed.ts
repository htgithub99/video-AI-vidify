export const CHAT_SPEED = {
  CHROME_ARGS: ["--disable-background-timer-throttling", "--disable-renderer-backgrounding", "--disable-backgrounding-occluded-windows"],
  FOCUS_EMULATION: "Emulation.setFocusEmulationEnabled",
  LIFECYCLE: "Page.setWebLifecycleState",
  ACTIVE: "active",
  BUSY_POLL_MS: 750,
  MODEL_REUSE_MS: 600_000,
  TIMING_FILE: "gemini-timing.jsonl",
  NEWLINE: "\n",
  PASTE_TYPE: "text/plain",
  PASTE_EVENT: "paste",
  MARK: { WRITTEN: "written", SENT: "sent", FIRST_TEXT: "firstText" },
} as const;
