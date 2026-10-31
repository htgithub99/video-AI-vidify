export const MOTION_PLACEMENT = {
  KEY_JOIN: "_",
  SUPPORT_PHRASE_ALIASES: [
    { pattern: /\b(?:altar|offering)[ _-]+table\b/g, value: "ritual_table" },
    { pattern: /\b(?:door[ _-]+step|doorstep|doorway|threshold)\b/g, value: "door" },
  ],
  NIGHT_LIGHT_RE: /night|lamp/,
  CAMERA_PROMPT:
    "Scene motion includes camera. When enabled, set camera:{move:'follow|push|pull|none',subject:'main actor cast key'} from the main visible action: follow travel, push toward a key gesture/expression, pull for a reveal, none for quiet shots or no clear subject. Keep movement very slow, protect all essential people and retain composition depth. When scene motion is disabled use none. Never alternate zoom directions for variety or add a second shot just to animate a sentence.",
  RELATIONS: { under: ["under", "beneath", "below"], behind: ["behind", "back"], before: ["before", "front"], beside: ["beside", "side"], inside: ["inside", "in"], outside: ["outside"], on: ["on", "top"] } as Record<string, string[]>,
  SIDES: ["left", "right", "head", "foot"] as string[],
  MATERIALS: ["wooden", "wood", "bamboo", "stone", "metal", "iron"] as string[],
  MODIFIERS: ["old", "new", "large", "small", "low", "high", "long", "short", "double", "single", "antique", "traditional", "sit", "lie", "stand", "crouch", "seated", "surface"] as string[],
  NUMBER: /^\d+$/,
  CONDITIONS: ["intact", "ruined", "burned", "flooded"],
  CONDITION_PATTERNS: [/\b(ruined|collapsed|broken roof|sap|do nat|hoang phe)\b/, /\b(burned|burnt|chay rui|chay den)\b/, /\b(flooded|submerged|ngap nuoc|ngap lut)\b/],
  BUILDING_CONTEXTS: [
    { asset: /\b(shophouse|shop house|storefront)\b/, request: /\b(shop|store|shophouse|market|cua hang|quan hang|tiem|cho)\b/ },
    { asset: /\b(temple|pagoda|shrine)\b/, request: /\b(temple|pagoda|shrine|chua|dinh|mieu|den tho)\b/ },
  ],
  INTACT: "intact",
  CONDITION_NAME: (name: string, condition: string): string => `${name} - ${condition}`,
  CONDITION_DESC: (desc: string, condition: string): string => `${desc}. Visible scene condition: ${condition}; preserve this state in the illustration.`,
  CONDITION_PROMPT:
    'Return sceneCondition: "intact|ruined|burned|flooded" only when the narration establishes a physical change to this place. A collapsed house is ruined, never intact. Within the same timeline, preserve that condition across lighting changes, chapters and visits until explicit restoration. A separate memory has its own physical state. Do not invent damage because the mood is scary.',
  CONTACT_PROMPT:
    "Each spot may include fixture (English furniture key), relation (on|under|beside|behind|before|inside|outside), and bounds [left,top,width,height] of its visible contact region. Keep spot coordinates inside these bounds. Under-bed floor contact regions must be below the bed top with visible clearance. Sit spots require seatY above groundY; bounds describe the seat contact. Move, scale and mirror these with the furniture. Delete obsolete spots when removing or replacing furniture.",
  INVALID_CONTACT: (key: string): string => `Invalid furniture contact geometry: ${key}`,
  QA_PARTIAL: (checked: number, total: number): string => `Kiểm ảnh: AI mới trả kết quả cho ${checked}/${total} khung; chưa xác nhận phần còn lại.`,
} as const;
