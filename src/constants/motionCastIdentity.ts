export const MOTION_CAST_IDENTITY = {
  CONSTRUCTION: /(?:,\s*|;\s*|\b)(?:solid\s+)?(?:black\s+)?mitten\s+hands?|(?:,\s*|;\s*|\b)(?:pure\s+)?white\s+round\s+head|(?:,\s*|;\s*|\b)big\s+round\s+(?:white\s+)?eyes(?:\s+with\s+(?:black\s+)?pupils)?|(?:,\s*|;\s*|\b)short\s+black\s+neck|(?:,\s*|;\s*|\b)(?:character\s+)?template\b/giu,
  TIDY: [/\s*,\s*(?=,|;|\.|$)/gu, /^\s*[,;]\s*/u, /\s{2,}/gu] as readonly RegExp[],
  GROUP_LIMIT: 12,
  GROUP_KEY: { INVALID: /[^a-z0-9]+/g, TRIM: /^_+|_+$/g, SEPARATOR: "_", FALLBACK: "group", SUFFIX: "_2" },
  GROUP_TEXT: { NAME: 60, LOOK: 220 },
} as const;
