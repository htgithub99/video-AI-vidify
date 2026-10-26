import SCHEMA from "./motionResourceSchema.json";
export const MOTION_RESOURCE_SEMANTICS = {
  MARKS: /[\u0300-\u036f]/g,
  D: /đ/g,
  SEPARATORS: /[^a-z0-9]+/g,
  SPACE: " ",
  EMPTY: "",
  GENERIC_HOUSE: new RegExp(SCHEMA.genericHousePattern),
  HOUSE: new RegExp(SCHEMA.housePattern),
  TEMPLE_VI: /(^|[^\p{L}])đền(?=$|[^\p{L}])/iu,
  FEMALE: /\b(female|woman|girl|mother|grandmother|wife|daughter|nu|phu nu|dan ba|ba cu|co gai|vo|me|con gai)\b/,
  MALE: /\b(male|man|boy|father|grandfather|husband|son|nam|dan ong|ong cu|chang trai|chong|cha|con trai)\b/,
  CHILD: /\b(child|baby|little boy|little girl|tre em|dua tre|be trai|be gai|cau be|co be|con nit)\b/,
  SENIOR: /\b(senior|elder|elderly|grandfather|grandmother|ong cu|ba cu|gia|cao tuoi|lao)\b/,
  ADULT: /\b(adult|young|middle aged|truong thanh|trung nien|thanh nien)\b/,
  ROLES: [
    { key: "monk", request: /\b(monk|buddhist|nha su|su cu|su thay|su gia|su ong|su tru tri|vi su)\b/, asset: /\b(monk|buddhist)\b/ },
    { key: "shaman", request: /\b(shaman|exorcist|thay cung|thay phap|phap su|dao si|thay tru ta)\b/, asset: /\b(shaman|exorcist|taoist)\b/ },
    { key: "medium", request: /\b(medium|ba dong|co dong|thanh dong)\b/, asset: /\bmedium\b/ },
    { key: "keeper", request: /\b(temple keeper|shrine keeper|thu tu|nguoi giu den)\b/, asset: /\b(temple keeper|shrine keeper)\b/ },
    { key: "chief", request: /\b(village chief|truong lang|ly truong|truong ban)\b/, asset: /\b(village chief|headman)\b/ },
    { key: "nurse", request: /\b(nurse|y ta)\b/, asset: /\bnurse\b/ },
    { key: "doctor", request: /\b(doctor|physician|bac si|thay lang)\b/, asset: /\b(doctor|physician|healer)\b/ },
    { key: "farmer", request: /\b(farmer|peasant|nong dan|nguoi lam ruong)\b/, asset: /\b(farmer|peasant|village|villager)\b/ },
    { key: "villager", request: /\b(villager|village|nguoi dan|dan lang|nguoi cha|nguoi me|nguoi vo|nguoi chong|dan ong|phu nu|thanh nien|ong lao|ba lao)\b/, asset: /\b(village|villager)\b/ },
  ],
  PLACES: Object.entries(SCHEMA.locationPatterns).map(([family, pattern]) => [new RegExp(pattern), family] as [RegExp, keyof typeof SCHEMA.locationPatterns]),
} as const;
export const MOTION_SEMANTIC_MIGRATION = { APPLY: "--apply", ROOT: "scratch/motion-semantic-migration-20261025", REPORT: "audit.json", BACKUP: "backup", HISTORY: "history", TYPES: ["character_kit", "set", "prop", "set_base", "set_piece"] as const, JSON: ".json", ENCODING: "utf8" as const } as const;
export const MOTION_RESOURCE_WRITE = { IDENTITY: "asset_identity", VERSION: "semantic_version", KIND: "piece_kind", LOCATION: "location_family", DISPLAY_FIELDS: ["name", "desc", "description", "uses", "updatedAt", "originalName", "originalDesc"] } as const;
