export const MOTION_CAST_IDENTITY = {
  CONSTRUCTION: /(?:,\s*|;\s*|\b)(?:solid\s+)?(?:black\s+)?mitten\s+hands?|(?:,\s*|;\s*|\b)(?:pure\s+)?white\s+round\s+head|(?:,\s*|;\s*|\b)big\s+round\s+(?:white\s+)?eyes(?:\s+with\s+(?:black\s+)?pupils)?|(?:,\s*|;\s*|\b)short\s+black\s+neck|(?:,\s*|;\s*|\b)(?:character\s+)?template\b/giu,
  TIDY: [/\s*,\s*(?=,|;|\.|$)/gu, /^\s*[,;]\s*/u, /\s{2,}/gu] as readonly RegExp[],
  GROUP_LIMIT: 12,
  GROUP_KEY: { INVALID: /[^a-z0-9]+/g, TRIM: /^_+|_+$/g, SEPARATOR: "_", FALLBACK: "group", SUFFIX: "_2" },
  GROUP_TEXT: { NAME: 60, LOOK: 220, FIELD: 80 },
  GROUP_FIELDS: ["origin", "skin", "outfit", "gear", "faction"] as readonly string[],
  MARKS_MAX: 5,
  MARK_CHARS: 48,
  FIELD_CHARS: 60,
  MARK_SPLIT: /[;,]\s*|\s+(?:and|với|và)\s+/iu,
  MARK_WORDS: /\b(?:scar|scarred|beard|bearded|moustache|mustache|sideburns?|eyebrows?|brows?|eyes?|eyepatch|glasses|spectacles|monocle|hair|haired|bald|balding|braids|braided|ponytail|topknot|freckles?|freckled|wrinkles?|wrinkled|jaw|chin|nose|cheeks?|tattoo|birthmark|sẹo|râu|ria|lông mày|mắt|kính|tóc|hói|tàn nhang|nốt ruồi|nếp nhăn)\b/iu,
  MARK_TRIM: /[.;,\s]+$/u,
  MARK_SKIP: /\b(?:coat|tunic|braid on|gold braid|silver braid|uniform|helmet|boots?|mounted|carrying|holding)\b/iu,
  SKIN_WORDS: /\b((?:very\s+|deep\s+|light\s+|pale\s+|dark\s+|medium\s+)?(?:brown|black|dark|pale|fair|light|olive|tan|tanned|bronze|ebony|golden|ruddy|sallow|white)\s+skin(?:ned)?|skin\s+(?:tone\s+)?(?:is\s+)?(?:very\s+|deep\s+|light\s+|pale\s+)?(?:brown|black|dark|pale|fair|light|olive|tan|bronze))\b/iu,

} as const;
