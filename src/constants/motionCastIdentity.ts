export const MOTION_CAST_IDENTITY = {
  CONSTRUCTION: /(?:,\s*|;\s*|\b)(?:solid\s+)?(?:black\s+)?mitten\s+hands?|(?:,\s*|;\s*|\b)(?:pure\s+)?white\s+round\s+head|(?:,\s*|;\s*|\b)big\s+round\s+(?:white\s+)?eyes(?:\s+with\s+(?:black\s+)?pupils)?|(?:,\s*|;\s*|\b)short\s+black\s+neck|(?:,\s*|;\s*|\b)(?:character\s+)?template\b/giu,
  TIDY: [/\s*,\s*(?=,|;|\.|$)/gu, /^\s*[,;]\s*/u, /\s{2,}/gu] as readonly RegExp[],
  GROUP_LIMIT: 12,
  GROUP_KEY: { INVALID: /[^a-z0-9]+/g, TRIM: /^_+|_+$/g, SEPARATOR: "_", FALLBACK: "group", SUFFIX: "_2" },
  GROUP_TEXT: { NAME: 60, LOOK: 220, FIELD: 80 },
  GROUP_FIELDS: ["origin", "skin", "outfit", "gear", "faction"] as readonly string[],
  MARKS_MAX: 3,
  CARRIES_MAX: 3,
  SKIN_DEFAULT: { history: "#e3b78f", explainer: "#e3b78f", horror: "#ffffff" } as Record<string, string>,
  HEX: /^#[0-9a-f]{6}$/i,
  SKIN_TONES: [
    [/\b(?:ebony|very dark|deep brown|dark brown|black)\b/i, "#6b4630"],
    [/\b(?:brown|dark|bronze|tanned|tan|copper)\b/i, "#a8754d"],
    [/\b(?:olive|golden|medium|ruddy|sun-?(?:browned|burnt))\b/i, "#c99a6e"],
    [/\b(?:light|fair|pale|white|rosy)\b/i, "#f0cfae"],
  ] as readonly (readonly [RegExp, string])[],
  MARK_CHARS: 48,
  FIELD_CHARS: 60,
  MARK_TRIM: /[.;,\s]+$/u,
  SKIN_WORDS: /\b((?:very\s+|deep\s+|light\s+|pale\s+|dark\s+|medium\s+)?(?:brown|black|dark|pale|fair|light|olive|tan|tanned|bronze|ebony|golden|ruddy|sallow|white)\s+skin(?:ned)?|skin\s+(?:tone\s+)?(?:is\s+)?(?:very\s+|deep\s+|light\s+|pale\s+)?(?:brown|black|dark|pale|fair|light|olive|tan|bronze))\b/iu,

} as const;
