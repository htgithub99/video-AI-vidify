export const READ_SCENE_QA = {
  CAST: [
    { key: "chi_hai", name: "Chị Hai" },
    { key: "toi", name: "Tôi" },
  ],
  NO_AI: "A planned scene ID must recover the saved draft without AI",
  DAY: "night",
  WRONG_EVIDENCE: "Một người đang ngồi ăn cơm trong bếp.",
  PASSED: "Read scene recovery passed: real saved failure, planned ID authority, legacy compatibility, targeted missing fields, evidence validation, locked scene during repair, checkpoint and exhausted-budget preservation. No external AI, TTS or video.\n",
} as const;
