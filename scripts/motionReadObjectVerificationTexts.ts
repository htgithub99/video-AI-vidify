export const READ_OBJECT_QA = {
  TITLE: "Kiểm phục hồi đồ vật minh họa",
  CAST: [
    { key: "chi_hai", name: "Chị Hai" },
    { key: "toi", name: "Tôi" },
  ],
  PLACE: "san_truoc",
  DAY: "day",
  REPAIR_CATALOG: "Offline catalog: offering_tray; rice_bowl; oil_lamp.",
  WRONG: "offering_plate",
  RIGHT: "offering_tray",
  NO_AI: "Saved valid object correction must not request AI again",
  NO_REWRITE: "Accepted scene must not be rewritten",
  SIBLING: "neighbor",
  MENTIONED: { key: "offscreen", word: "mâm cúng", type: "other", mount: "floor", presence: "mentioned" },
  BOWL: { key: "rice_bowl", catalogKey: "rice_bowl", word: "bát", type: "small", mount: "table", category: "prop", essential: true },
  PASS: "Read object repair passed: saved real mismatch recovered without AI, canonical primary/list agreement, exact source indices after filtering and deduplication, nested/legacy patches, separate instances, accepted-scene preservation and retry-budget preservation. No AI, TTS or video.\n",
} as const;
