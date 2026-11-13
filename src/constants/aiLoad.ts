export const AI_LOAD = {
  LOW_SPEC_SLOTS: 2,
  PRIORITY: { "motion-story-analysis": 0, "motion-story-chapter": 0, "motion-story-edit": 0, "motion-html-plan": 1, "motion-html-scene": 2 } as Record<string, number>,
  DEFAULT_PRIORITY: 1,
  THUMBNAIL_IDLE_MS: 5000,
  ABORTED: "ai_load_slot_aborted",
  ABORT_EVENT: "abort",
} as const;
