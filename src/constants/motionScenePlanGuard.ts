const B = "(?<![\\p{L}\\p{N}])";
const GARMENT = "uniforms?|tunics?|frock coats?|coats?|jackets?|shirts?|blouses?|robes?|dress(?:es)?|gowns?|cloaks?|capes?|trousers|pants|breeches|boots|helmets?|caps?|hats?|turbans?|hoods?|scarf|scarves|aprons?|armou?r|kilts?|sashes|sash|waistcoats?|vests?|overcoats?|mantles?";
export const MOTION_SCENE_PLAN_GUARD = {
  CLOTHING_PHRASE: new RegExp(`\\s*,?\\s*${B}(?:wearing|dressed in|clad in|in|with)\\s+(?:an?\\s+|the\\s+|his\\s+|her\\s+|their\\s+)?[^,;.]{0,60}?${B}(?:${GARMENT})(?![\\p{L}])(?:\\s+with\\s+[^,;.]{0,40})?`, "giu"),
  CLOTHING_CLAUSE: new RegExp(`(?:,|\\s+and)\\s*(?:[\\p{L}'-]+\\s+){0,4}(?:${GARMENT})(?![\\p{L}])(?:\\s+with\\s+[^,;.]{0,40})?(?=\\s*[,;.]|\\s*$)`, "giu"),
  CLOTHING_VI: /\s*,?\s*(?:mặc|khoác|đội|trong bộ)\s+[^,;.]{0,40}?(?:áo|quần|mũ|nón|khăn|giày|ủng|váy)[^,;.]{0,24}/giu,
  SPACES: /\s{2,}/g,
  PERSON: /\b(?:riders?|horsem[ae]n|m[ae]n|wom[ae]n|officers?|soldiers?|troopers?|couriers?|warriors?|envoys?|emissar(?:y|ies)|herdsm[ae]n|boys?|girls?|persons?|people|crews?|cavalrym[ae]n|drivers?|farmers?|hunters?|children|child)\b|người|anh |chị |ông |bà |lính|kỵ binh|cậu |cô /iu,
  HEAD_WORDS: 4,
  WORDS: /\S+/g,
  LEAD_COMMA: /^\s*,\s*/,
  CLOSE: "close",
  CLOSE_VIEWS: ["close", "medium_close"] as readonly string[],
  DETAIL: "detail",
  CHARACTER: "character",
  STANCE_CUT: /\s(?:behind|ahead of|in front of|beside|alongside|toward|towards|after|past|while|as|with|watching|facing|followed by|chased by|pursued by|sau lưng|phía trước|bên cạnh|trong khi|cùng)\s/iu,
  LOG: (stripped: number, details: number, animals: number): string => `Phân cảnh sửa bằng code: bỏ trang phục tự đặt của ${stripped} nhân vật có tên, ${details} cận không người → đặc tả, ${animals} con vật nhận khung dựng.`,
} as const;
