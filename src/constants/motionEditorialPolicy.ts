export const MOTION_EDITORIAL_POLICY = {
  REPAIR_ATTEMPTS: 4,
  UNSPECIFIED: "unspecified",
  COMPACT: "Keep descriptive DNA/style fields to one short sentence and lists to essential items. Preserve all causal events, identities, clues, source coverage and the requested chapter count. Do not repeat the transcript or restate instructions in the response.",
  RETUNE: 'Update only intent, mustPreserve, mustVary, mustNotCopy, uncertainties, evidence, characters, environment and opening for the NEW story. The existing audience, narration, pacing, visual grammar and editorial profile are locked and inherited locally. Return JSON {"videoDna":{...only these updated groups...}}. Evidence must cite the new story; never copy old identities or events.',
  RETUNE_FIELDS: ["intent", "mustPreserve", "mustVary", "mustNotCopy", "uncertainties", "evidence", "characters", "environment", "opening"] as const,
  PROFILE_LOG: "Hồ sơ phong cách: dùng các trường đã đạt và bổ sung từ DNA hiện có, không gửi thêm lượt AI.",
} as const;
