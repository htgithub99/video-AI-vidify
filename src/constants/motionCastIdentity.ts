export const MOTION_CAST_IDENTITY = {
  HAIR_PROFILES: ["history", "explainer"] as readonly string[],
  HAIR_WORDS: /\b(?:hair|haired|bald|braid(?:s|ed)?|bun|ponytail|curls?|curly|fringe|bangs|tonsure|shaved head|dreadlocks)\b|tóc|hói|búi|bím|đầu trọc/iu,
  FEMALE: /^f|nữ/iu,
  HAIR: {
    male: ["short", "close-cropped", "short and wavy", "short with a full beard", "medium-length and tied back", "short with a trimmed beard"],
    female: ["long and tied back", "long in a single braid", "shoulder-length", "long and pinned up", "long and loose"],
  } as Record<"male" | "female", readonly string[]>,
  ERA_FALLBACK: "the source era and region",
  LOOK: (look: string, hair: string, era: string) => `${look ? look.replace(/[.\s]+$/u, "") + "; " : ""}hair whenever headgear is off: ${hair}, in the hair colour and style usual for ${era}, identical in every scene; same face shape in every scene`,
  STAGING: (foreground: string[], secondary: string[], groups: string[]): string =>
    [foreground.length ? `Foreground, full size: ${foreground.join(", ")}.` : "", secondary.length ? `Mid-ground, clearly smaller than the foreground people: ${secondary.join(", ")}.` : "", groups.length ? `Unnamed groups and extras, smaller and behind the named people, never covering their faces or torsos: ${groups.join(", ")}.` : ""].filter(Boolean).join(" "),
  FOREGROUND_LIMIT: 4,
  CONSTRUCTION: /(?:,\s*|;\s*|\b)(?:solid\s+)?(?:black\s+)?mitten\s+hands?|(?:,\s*|;\s*|\b)(?:pure\s+)?white\s+round\s+head|(?:,\s*|;\s*|\b)big\s+round\s+(?:white\s+)?eyes(?:\s+with\s+(?:black\s+)?pupils)?|(?:,\s*|;\s*|\b)short\s+black\s+neck|(?:,\s*|;\s*|\b)(?:character\s+)?template\b/giu,
  TIDY: [/\s*,\s*(?=,|;|\.|$)/gu, /^\s*[,;]\s*/u, /\s{2,}/gu] as readonly RegExp[],
  GROUP_LIMIT: 12,
  GROUP_KEY: { INVALID: /[^a-z0-9]+/g, TRIM: /^_+|_+$/g, SEPARATOR: "_", FALLBACK: "group", SUFFIX: "_2" },
  GROUP_TEXT: { NAME: 60, LOOK: 220 },
} as const;
