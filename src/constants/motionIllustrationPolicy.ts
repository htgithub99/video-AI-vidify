import { MOTION_STAGE_CONSTRAINTS as C } from "./motionStageConstraints.js";
export const MOTION_ILLUSTRATION_POLICY = {
  VERSION: 1,
  PROMPT:
    "SIMPLE STATIC ILLUSTRATIONS: preserve visible identities, actual location, essential spatial relations and story clues. Incidental sitting, kneeling, walking, reaching and opening gestures may use an idle standing illustration in the same place. Set states[].essential=true only when the physical posture is necessary to understand the event (for example a bedridden patient). Never require hand animation or cut for an incidental posture change. A request, quotation, warning, memory or imagined action is not an action performed in the present scene. A person may stand beside a door without holding its latch. Objects[].essential=false marks dispensable decoration only; essential clues cannot be removed or substituted. Every explicit important spatial fact must be structured: actors use states[].placement; objects use placement:{anchor:canonical fixture noun,evidence:exact source quote}. Do not leave bedside/threshold positions only in descriptions or use a generic floor/table anchor for them. For held/shoulder objects provide ownershipEvidence quoting the actual carrying/holding/transfer action in this speech, or omit the incidental held object. Preserve essential physical states using state and requirements; an alias is not proof of visible capability. " +
    "A cloth covering a person uses mount=body and that visible person's owner key; use the library's unfolded body cover, never a folded cloth placed on an arbitrary table. " +
    C.PROMPT,
  READ_SCHEMA:
    'states:[{char,action:"stand|talk|sit|lie|kneel",posture:"idle|sit|lie|kneel",essential:boolean,support?,placement?:{relation:"at|beside|behind|between",anchor?,targets:[],evidence:"exact source quote"}}]; objects:[{key,catalogKey,identity,word,description,category:"prop|scenery",type:"small|large|other",size:0.3,mount,owner?,ownershipEvidence?,support?,essential:boolean,placement?:{anchor:"door|bed|other fixture noun",evidence:"exact source quote"},state?,requirements:[]}]. objects is authoritative; object only identifies a primary entry by the same identity/key and must agree with it. Copy exact supplied cast/place/catalog keys. English descriptions, original-language noun phrases and evidence. No coordinates or new assets.',
  OBJECT_FIELDS: ["catalogKey", "support", "attachment", "transition", "baseOwner", "baseMount", "physicalState", "baseDescription", "baseRequirements", "identity", "state", "word", "key", "size", "mount", "rotation", "type", "note", "owner", "category", "description", "requirements", "essential", "placement", "ownershipEvidence", "presence"],
  OPTIONAL_POSTURES: ["sit", "kneel", "crouch"],
  PROP_ANCHOR_OFFSETS: [-160, 0, 160],
  PROP_ANCHOR_DISTANCE: 360,
  FLOOR_SUPPORT: /^(?:floor|ground|earth|dirt_floor)$/,
  INCIDENTAL_SUPPORT: /^(?:wooden_)?(?:chair|bench|stool|seat)$/,
  HOLD_ACTION: /\b(?:cam|bung|om|xach|mang|giu|trao|dua|hold|holds|holding|held|carry|carries|carrying|carried|handed|gave|received)\b/,
  RELEASE_ACTION: /\b(?:dat|de|bo|buong|tha|ha|put|puts|placed|places|released|dropped|sets? down)\b/,
  TRANSFER_ACTION: /\b(?:trao|dua|giao|chuyen|handed|gave|gives?|passed)\b/,
  NON_ACTUAL: /\b(?:hay|dung|cho|xin|neu|se|dinh|muon|nho|bao|dan|noi|mo|uoc|please|would|should|could|will|asks?|tells?|said|says|imagine|dream)\b/,
  CLAUSE: /[.!?;\n]/u,
  FIRST_PERSON: /\b(?:toi|minh|i)\b/,
  ANCHORS: [
    { key: "door", pattern: /\b(?:(?:ben|canh|sat|truoc|ngoai|trong|phia|bac|bau|nguong)\s+(?:(?:canh|khung|thềm|them)\s+)?cua|(?:beside|near|at|toward|towards|outside|inside)\s+(?:the\s+)?(?:closed\s+|wooden\s+)?door|(?:door\s*)?threshold)\b/g },
    { key: "bed", pattern: /\b(?:(?:ben|canh|sat|dau|mep|goc|chan)\s+(?:chiec\s+|cai\s+)?giuong|bedside|(?:beside|near|at)\s+(?:the\s+)?(?:head\s+of\s+the\s+)?bed)\b/g },
    { key: "window", pattern: /\b(?:(?:ben|canh|sat|truoc|ngoai)\s+(?:khung\s+)?cua so|(?:beside|near|at|outside)\s+(?:the\s+)?window)\b/g },
    { key: "table", pattern: /\b(?:(?:ben|canh|sat|truoc|quanh)\s+(?:chiec\s+|cai\s+)?ban(?! tho)|(?:beside|near|at|around)\s+(?:the\s+)?table)\b/g },
    { key: "well", pattern: /\b(?:(?:ben|canh|sat|mieng)\s+(?:cai\s+)?gieng|(?:beside|near|at)\s+(?:the\s+)?well)\b/g },
    { key: "gate", pattern: /\b(?:(?:ben|canh|sat|truoc|ngoai|trong)\s+(?:cai\s+)?cong|(?:beside|near|at|outside|inside)\s+(?:the\s+)?gate)\b/g },
    { key: "altar", pattern: /\b(?:(?:ben|canh|sat|truoc)\s+ban tho|(?:beside|near|at|before)\s+(?:the\s+)?altar)\b/g },
  ],
  MISSING_ANCHOR: (anchor: string): string => `Spatial fact requires an explicit placement at ${anchor}; retain the source position instead of an arbitrary floor/table spot.`,
  INVALID_HOLD: "A held object requires exact evidence of an actual holding/carrying/transfer action; a request or mention is insufficient. Omit only an incidental handheld detail.",
  INVALID_PLACEMENT: "Object placement requires an existing fixture anchor and an exact source quote.",
  PROP_ON_PARENT: /\b(?:tren|len|vao|on|onto|inside|into)\s+(?:(?:cai|chiec|mot|the|a)\s+)?$/,
  PROP_CONTAINS_CHILD: /\b(?:dung|chua|co|containing|contains|holds?|with)\s+(?:(?:cai|chiec|mot|the|a)\s+)?$/,
  PROP_RELOCATION_ACTION: /\b(?:nhac|lay|cam|bung|xach|mang|dat|de|bo|buong|tha|ha|trao|dua|removed?|lifted?|takes?|took|holds?|holding|held|carries|carried|puts?|placed|dropped|handed|gave)\b/,
  RELATION_NEGATED: /\b(?:khong|not|never)\b|\bchua\s+(?:duoc|dat|de|nam|o)\b/,
  INVALID_PARENT: "Placing an object on another object requires source evidence of that relationship; separate mentions do not establish a shared container.",
  FALLBACK_LOG: "Đã dùng hình đứng đơn giản cho tư thế phụ; giữ nguyên người, địa điểm và vị trí thiết yếu.",
} as const;
