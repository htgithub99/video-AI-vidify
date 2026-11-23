export const MOTION_DURATION_DRIFT = { SHARE: 0.1, LOG: (got: number, want: number): string => `Thời lượng video ${Math.round(got)} s lệch ${Math.round((Math.abs(got - want) / want) * 100)} % so với mục tiêu ${Math.round(want)} s` } as const;
export const MOTION_TIMELINE = {
  ORDER: ["dawn", "day", "dusk", "night"] as readonly string[],
  PASSING: { dawn: "day", dusk: "night" } as Record<string, string>,
  PASSING_BEATS: 6,
  CUES: {
    dawn: ["dawn", "daybreak", "sunrise", "first light", "break of day", "bình minh", "rạng sáng", "tảng sáng", "rạng đông", "hừng đông", "amanecer", "madrugada", "aube", "lever du jour", "morgengrauen", "sonnenaufgang", "alvorada"],
    day: ["midday", "noon", "afternoon", "broad daylight", "morning sun", "buổi trưa", "giữa trưa", "buổi chiều", "ban ngày", "mediodía", "tarde", "midi", "après-midi", "mittag", "nachmittag", "meio-dia"],
    dusk: ["dusk", "sunset", "twilight", "nightfall", "evening", "hoàng hôn", "chạng vạng", "chiều tối", "xế chiều", "atardecer", "anochecer", "crépuscule", "soir", "abenddämmerung", "abend", "entardecer"],
    night: ["after dark", "in the dark", "in darkness", "torchlit", "by torchlight", "under the stars", "midnight", "at night", "the night", "tonight", "moonlight", "starlight", "asleep", "you sleep", "nửa đêm", "ban đêm", "đêm khuya", "trong đêm", "đêm nay", "ánh trăng", "medianoche", "noche", "minuit", "la nuit", "mitternacht", "nachts", "meia-noite"],
  } as Record<string, string[]>,
  NEXT_DAY: ["next day", "next morning", "following day", "following morning", "days later", "the next", "hôm sau", "ngày hôm sau", "sáng hôm sau", "ngày sau", "al día siguiente", "le lendemain", "am nächsten", "no dia seguinte"],
} as const;
export const MOTION_CAST_MARKS = { LOCK: ["outfit", "head", "headColor", "armor", "cape", "top", "pants", "robe", "trim", "beard", "hairColor", "build", "emblem", "emblemColor", "shield", "shieldColor"], LOOK: "look:", HOME: "*", GENERIC: /^(you|crowd|soldiers?|riders?|men|people|army|archers?|knights?|levies|militia|refugees?|villagers?|guards?|enemy|enemies|troops|warriors?|horsemen|far_.*|.*_\d+)$/, CAPE: /\b(cloak|cape|mantle|mantel|capa|manteau|umhang)\b|áo choàng/i, FUR: /\b(fur|piel|pelz)\b|fourrure|lông thú|viền lông/i, FUR_TRIM: "#cbb089", CAPES: ["#8a1a2a", "#2a3a6a", "#2e5a3a", "#6a3a7a", "#8a5a1a", "#1e4a5a", "#7a2a1a", "#4a4a5a"] } as const;
