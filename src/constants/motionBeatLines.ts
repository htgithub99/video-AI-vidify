export const MOTION_BEAT_LINES = {
  EMPTY: "",
  SPACE: " ",
  NFC: "NFC",
  NORM_STRIP_RE: /[^\p{L}\p{N}]+/gu,
  SENTENCE_RE: /[^.!?…。！？]+[.!?…。！？]+["”'』」]?|[^.!?…。！？]+$/g,
  DIALOGUE: "dialogue",
  TAGS_MAX: 8,
  KEY_SEPARATOR: "::",
} as const;
