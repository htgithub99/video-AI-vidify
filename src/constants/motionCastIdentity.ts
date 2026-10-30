export const MOTION_CAST_IDENTITY = {
  HAIR_PROFILES: ["history", "explainer"] as readonly string[],
  HAIR_WORDS: /\b(?:hair|haired|bald|braid(?:s|ed)?|bun|ponytail|curls?|curly|fringe|bangs|tonsure|shaved head|dreadlocks)\b|tóc|hói|búi|bím|đầu trọc/iu,
  FEMALE: /^f|nữ/iu,
  HAIR: {
    male: ["short black hair with a side part", "short dark-brown curly hair", "cropped sandy-blond hair", "short auburn hair with a cowlick", "short wavy brown hair and a thin moustache", "close-cropped grey hair", "short black hair swept back and a short beard", "short chestnut hair with a straight fringe"],
    female: ["long black hair in a low bun", "a long dark-brown braid over one shoulder", "shoulder-length auburn hair", "long wavy chestnut hair tied back", "short black bob", "long sandy-blond hair in two braids"],
  } as Record<"male" | "female", readonly string[]>,
  LOOK: (look: string, hair: string) => `${look ? look.replace(/[.\s]+$/u, "") + "; " : ""}fixed hair whenever headgear is off: ${hair}; same face shape in every scene`,
  STAGING: (foreground: string[], secondary: string[], groups: string[]): string =>
    [foreground.length ? `Foreground, full size: ${foreground.join(", ")}.` : "", secondary.length ? `Mid-ground, clearly smaller than the foreground people: ${secondary.join(", ")}.` : "", groups.length ? `Unnamed groups and extras, smaller and behind the named people, never covering their faces or torsos: ${groups.join(", ")}.` : ""].filter(Boolean).join(" "),
  FOREGROUND_LIMIT: 4,
} as const;
