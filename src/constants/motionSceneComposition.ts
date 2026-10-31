import { parseJson, stringifyJson } from "../lib/jsonStringify.js";
import type { MotionResponseSchema } from "./motionResponseContract.js";
import { MOTION_SCENE_DESIGN_SCHEMA } from "./motionSceneDesign.js";
import { motionProfileScenePrompt } from "./motionProfiles/scenePrompts.js";
const placeholderText = "Cảnh chưa dựng được · Cần tạo lại";
const repairContext = (input: unknown): unknown => {
  try {
    const marker = "Context:\n";
    const context = typeof input === "string" ? parseJson(input.slice(input.lastIndexOf(marker) + marker.length).split("\n")[0]) : input;
    const { drawingReference, continuity, acceptedScene, ...needed } = context;
    return needed;
  } catch {
    return {};
  }
};
export const MOTION_SCENE_COMPOSITION = {
  REVISION: 4,
  SUPPORTED_REVISIONS: [1, 2, 3, 4],
  ARTIFACT: "motion_remotion_composition",
  LIMIT: 150000,
  LAYERS: 96,
  LAYER_DESCRIPTION_LIMIT: 240,
  ANIMATIONS: 96,
  KEYFRAMES: 20,
  MAX_SECONDS: 3600,
  SANITIZE: {
    TAG: /<!--[\s\S]*?-->|<(\/?)([\w:-]+)\b((?:[^>"']|"[^"]*"|'[^']*')*?)(\/?)>/g,
    USE: /<use\b((?:[^>"']|"[^"]*"|'[^']*')*?)(?:\/>|>\s*<\/use>)/i,
    HREF: /\b(?:xlink:)?href\s*=\s*["']#([\w.:-]+)["']/i,
    ATTR: (name: string) => new RegExp(`\\s${name}\\s*=\\s*(["'])([^"']*)\\1`, "i"),
    ID_OPEN: (id: string) => new RegExp(`<([\\w:-]+)\\b[^<>]*\\bid\\s*=\\s*(["'])${id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\2[^<>]*?(\\/?)>`),
    ID_ATTR: /\s\bid\s*=\s*(["'])[^"']*\1/,
    COPY_ATTRS: ["fill", "stroke", "stroke-width", "opacity", "fill-opacity", "class"] as readonly string[],
    SYMBOL: "symbol",
    SAME_TAG: (tag: string) => new RegExp(`<(\\/?)${tag}\\b(?:[^>"']|"[^"]*"|'[^']*')*?(\\/?)>`, "gi"),
    PASSES: 3,
    BAD_ATTRS: /\s(?:on[a-z]+|xmlns:[\w-]+|xlink:[\w-]+|href|src)\s*=\s*(?:"[^"]*"|'[^']*')/gi,
    BAD_URL_ATTR: /\s[\w:-]+\s*=\s*(["'])[^"']*url\(\s*(?!["']?#)[^"']*\1/gi,
    FILTER: /<filter\b((?:[^>"']|"[^"]*"|'[^']*')*?)(?:\/>|>([\s\S]*?)<\/filter\s*>)/gi,
    FILTER_PRIMITIVE: /<fe[\w-]+\b/i,
    FILTER_ATTRIBUTE: /\sfilter\s*=\s*(["'])(.*?)\1/gi,
    FILTER_REFERENCE: /^\s*url\(\s*["']?#([\w.:-]+)["']?\s*\)\s*$/i,
    LOG: (tags: string[]) => `Hình SVG: tự bỏ/thay thẻ không hỗ trợ (${tags.join(", ")}) thay vì đánh lỗi cảnh.`,
  },
  CONTRAST: {
    SPLIT: /[;,:]|\bbut\b|\band\b/iu,
    WORD: /[\p{L}\p{N}-]+/gu,
    SHARE: 0.35,
    PHRASE_SHARE: 0.6,
    KEY: /\b(?:no|without|only|single|unique|bare|crest(?:ed|less)?|beard(?:ed)?|moustache|scar|earring|scarf|bald|braid|freckles|hair|cloak|plume|sash|band|patch|tattoo)\b|không|râu|sẹo|khăn|tóc|chỏm|mào/iu,
    MAX_TRAITS: 5,
    SKIP: /whenever headgear|same face shape|^\s*fixed hair/iu,
    MIN_WORDS: 2,
  },
  CONTINUITY_TEXT_LIMIT: 2400,
  IDENTITY_MEMORY_LIMIT: 8000,
  IDENTITY_MEMORY: {
    SEPARATORS: /[;,\n]+|\.\s+/u,
    DYNAMIC:
      /\b(?:stand(?:ing|s)?(?![- ]collar)|sit(?:ting|s)?|seated|kneel(?:ing|s)?|lying|lies|reclin(?:ing|es)|sleep(?:ing|s)?|walk(?:ing|s)?|run(?:ning|s)?|lean(?:ing|s)?|bow(?:ing|s|ed)|hold(?:ing|s)?|rais(?:ing|es|ed)|point(?:ing|s)?|speak(?:ing|s)?|listen(?:ing|s)?|fac(?:ing|es)|look(?:ing|s)|arms? (?:down|up|at|by)|hands? (?:on|at|by)|(?:left|right|front|back) (?:of|side)|foreground|middleground|background)\b|(?:^|\s)(?:đứng|ngồi|quỳ|nằm|ngủ|đi bộ|chạy|cúi|nghiêng|cầm|giơ|chỉ tay|đang nói|lắng nghe|quay về|hướng về|bên trái|bên phải|tiền cảnh|trung cảnh|hậu cảnh)(?=\s|$)/iu,
  },
  DRAW_NODE_OMIT: ["slot", "x", "y", "width", "height", "depth", "layoutX", "layoutY", "layoutHeight", "layoutDepth", "layoutSocket", "groundTargets"] as readonly string[],
  JSON_KEY: { QUOTE: '"', ESCAPE: "\\", OPENER: /[{,]/, BARE: /^(\s*)([A-Za-z_$][\w$]*)(\s*:)/, LOOKAHEAD: 80 },
  GEOMETRY_REVISION: 1,
  GEOMETRY: { COVERAGE: 0.8, EXPECTED_COVERAGE: 0.4, OVERSIZE: 4, CENTER_DISTANCE: 0.5, OUTSIDE_SHARE: 0.9, MAX_MEASUREMENTS: 96 },
  POSTURE_CHECK: {
    LYING: /\b(?:lying|lies|lie|asleep|sleeping|laid|collapsed|prone|supine)\b|nằm|ngủ|gục/iu,
    LYING_MIN_RATIO: 0.9,
    WATER: "water",
    JOIN: " ",
    WATER_OK: /\b(?:swim\w*|wad\w*|drown\w*|float\w*|boat|raft|ship|canoe|deck|sea|river)\b|bơi|lội|đuối|thuyền|bè|tàu|ghe|sông|biển/iu,
    LYING_NOTE: (id: string) => `Người ${id} được lên cảnh là nằm nhưng hình vẽ đang thẳng đứng.`,
    WATER_NOTE: (id: string) => `Người ${id} được đặt trên mặt nước dù cảnh không nói họ bơi hay ở trên thuyền.`,
  },
  GEOMETRY_ERROR: (id: string) => `Lớp ${id} bị trống, ra ngoài khung hoặc lệch nghiêm trọng vùng thiết kế. Sửa riêng nhóm SVG này theo design; giữ các nhóm khác.`,
  GEOMETRY_UNAVAILABLE: "Chưa đo được vùng hình SVG; giữ dữ liệu cảnh để kiểm tra tiếp.",
  GUARD: {
    ATTEMPTS: 1,
    TRAVEL_MIN: 0.008,
    TRAVEL_MAX: 0.05,
    TRAVEL_SECONDS: 5,
    TRANSLATE: /^\s*translate\(\s*(-?[\d.]+(?:e-?\d+)?)(?:[\s,]+(-?[\d.]+(?:e-?\d+)?))?\s*\)\s*$/i,
    ESCAPED_TAG: /\\u003c/gi,
    SEPARATORS: /[\s,]+/g,
    IDENTITY: "translate(0 0)",
    CLOSE_MARK: "</",
    OPEN_TAG: /<([\w:-]+)\b([^<>]*)>/g,
    SELF_CLOSING: /\/\s*$/,
    CLOSE_TAG: (name: string) => `</${name}>`,
    TRANSLATE_START: /^translate\(/,
    SCALE: /scale\(\s*([-+.\deE]+)(?:[\s,]+([-+.\deE]+))?/,
    SHAPE: "#",
    TRANSLATE_VALUE: (x: number, y: number) => `translate(${x} ${y})`,
    LOG_MOTION: (id: string, count: number) => `Cảnh ${id}: thêm chuyển động nhẹ vào ${count} chi tiết ngực; giữ cố định người và điểm tựa.`,
    LOG_SUPPORT: (id: string, count: number) => `Cảnh ${id}: bỏ ${count} chuyển động toàn thân làm lệch điểm tựa; giữ hình và tiếp tục.`,
    LOG_EFFECTS: (id: string, count: number) => `Cảnh ${id}: thêm chuyển động nhẹ cho ${count} nhóm hiệu ứng đã có trong hình.`,
    LOG_ATTACHMENT: (id: string, count: number) => `Cảnh ${id}: giữ tĩnh ${count} chuyển động để đồ vật không rời tay; giữ hình và tiếp tục.`,
  },
  REVIEW_PASSES: 3,
  REVIEW_REQUESTS: 6,
  DRAW_ATTEMPTS: 2,
  INCOMPLETE: (ids: string[]) => `Chưa đủ hình để xuất video: còn ${ids.length} cảnh cần dựng lại (${ids.join(", ")}). Đã giữ kịch bản, giọng và các cảnh đạt; nhấn tiếp tục để thử lại các cảnh lỗi.`,
  PLACEHOLDER_RE: /\bid\s*=\s*["']pending_scene["']/,
  PATTERN_TAG: "pattern",
  REVIEW_LIMIT: "Cảnh đã dùng hết lượt duyệt và sửa; giữ hình hiện có và tiếp tục các cảnh khác. Có thể tạo lại riêng cảnh này.",
  MISSING_ADVISORY: (ids: string[]) => `Chưa xác nhận nhóm hình theo ID: ${ids.join(", ")}. Giữ SVG render được; không tự gửi thêm yêu cầu chỉ vì metadata.`,
  GEOMETRY_ADVISORY: (issues: string[]) => `Góp ý vùng hình: ${issues.join("; ")}. Giữ hình và để duyệt ảnh kiểm tra nội dung chính khi được bật.`,
  ID: /^[A-Za-z_][\w.-]*$/,
  NUMBER: /[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:[eE][-+]?\d+)?/g,
  FILTER_TAGS: ["filter", "fedropshadow", "fegaussianblur", "fecolormatrix", "femerge", "femergenode", "feoffset", "feflood", "fecomposite", "feblend", "fecomponenttransfer", "fefunca", "fefuncr", "fefuncg", "fefuncb", "text", "tspan"],
  CHANNELS: ["actor", "effect", "speech"],
  MARKUP_TAG: /<([\w:-]+)((?:\s+[\w:-]+\s*=\s*(?:"[^"<]*"|'[^'<]*'))+)(\s*\/?)>/g,
  MARKUP_ATTRIBUTE: /\s+([\w:-]+)\s*=\s*("[^"<]*"|'[^'<]*')/g,
  MARKUP_REPAIR_LIMIT: 32,
  MARKUP_TRAILING_GROUPS: /^(?:\s*<\/g>)*\s*<\/svg>\s*$/,
  ATTRIBUTES: ["transform", "d", "opacity"],
  KINDS: ["background", "character", "prop", "effect"],
  LOG: "Remotion: AI thiết kế trọn cảnh; giữ nguyên bố cục và các lớp hình AI đã dựng.",
  LOG_SINGLE: "Mỗi cảnh dùng một yêu cầu thiết kế và vẽ. Tự sửa lỗi định dạng nhẹ; cảnh hỏng được thử lại sau khi xong lượt đầu. Tắt duyệt ảnh không gọi sửa thẩm mỹ.",
  LOG_CONTINUE: (id: string, reason: string) => `Cảnh ${id} cần tạo lại: ${reason}. Tiếp tục các cảnh còn lại.`,
  PROGRESS_CONTINUE: (index: number, total: number) => `Cảnh ${index}/${total} gặp lỗi; đang tiếp tục các cảnh còn lại.`,
  LOG_RECOVERY: (count: number) => `Dựng cảnh: lượt đầu đã xong; bắt đầu phục hồi ${count} cảnh lỗi.`,
  LOG_LOCAL_REPAIR: (index: number, total: number) => `Cảnh ${index}/${total}: đã sửa cấu trúc SVG bằng code (thẻ đóng thiếu/thừa, thuộc tính trùng); không gọi thêm AI.`,
  LOG_RETRY: (index: number, total: number, scene: number, scenes: number) => `Phục hồi cảnh ${scene}/${scenes} · ${index}/${total} cảnh lỗi.`,
  LOG_SUMMARY: (ready: number, total: number) => `Dựng cảnh: ${ready}/${total} cảnh đạt${ready < total ? `, còn ${total - ready} cảnh lỗi; có thể tạo lại riêng từng cảnh.` : "."}`,
  PLACEHOLDER: placeholderText,
  PLACEHOLDER_SVG: (width: number, height: number) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}"><g id="pending_scene"><rect width="${width}" height="${height}" fill="#171b24"/><text x="${width / 2}" y="${height / 2}" text-anchor="middle" font-family="sans-serif" font-size="${Math.min(width, height) / 28}" fill="#cbd5e1">${placeholderText}</text></g></svg>`,
  PLAN_POLICY:
    "These plans guide one AI-authored complete illustration per shot. Use ASCII SVG IDs matching [A-Za-z_][A-Za-z0-9_.-]*. Identify visible people and key objects with stable IDs and essential relationships; no staging templates, anchor coordinates or separate object assets are needed. The AI illustrator will design perspective, scale, floor contact and lighting together. Keep people intact when present. Follow the selected profile for physical narrative scenes, diagrams, labels and maps. Incidental gestures may use a simple static pose; explicit identity, colors, counts, ownership and important clues must match the source. Never describe an inscription, sign or letter as readable or name its words unless the source quotes them. Vary shots: do not plan the same view of the same main subject as the previous scene unless the lines demand it.",
  PLAN_CONTINUITY:
    "Reuse stable IDs for recurring visible people and objects within this story, using the supplied cast and place keys. Do not invent asset catalog IDs, anchors or mount coordinates. Preserve object owner/state and the same place until the source changes them. A mere mention, comparison, negation or remembered object does not make it visible in the current scene. Mark essential=true only for subjects and clues needed to understand these lines; decorative details may be part of the complete SVG without separate nodes. Incidental gestures may use a simple standing pose. Time/weather follow the supplied beats.",
  LOG_DRAW: (index: number, total: number, name: string) => `Dựng cảnh Remotion ${index}/${total}: ${name}`,
  ERROR: (field: string, reason: string) => `Bố cục AI ${field}: ${reason}`,
  INVALID: "Dữ liệu thiếu hoặc không hợp lệ.",
  IDS: "ID phải duy nhất, có trong SVG và đúng chủ thể đã yêu cầu.",
  SVG_GROUP_MISSING: "SVG thiếu nhóm <g> mang đúng ID lớp hình này. Sửa phần SVG để vẽ đủ chủ thể; chỉ sửa danh sách layers không khắc phục được lỗi.",
  MISSING: (ids: string[]) => `Thiếu lớp hình cho: ${ids.join(", ")}. Giữ nguyên các lớp đã đạt.`,
  VIEWBOX: "viewBox phải đúng kích thước và tỷ lệ khung hình được yêu cầu.",
  MOTION: "Chuyển động phải có đích hợp lệ, keyframe tăng dần và cùng cấu trúc số; chỉ cho nhân vật có thoại cử động miệng.",
  REPAIR: (context: unknown, draft: unknown, errors: string[]) =>
    `Repair only rejected fields of ONE AI-authored illustration. Return one JSON object in a json code block. Keep accepted artwork, spatial design, support contacts, identities and story facts. Context:\n${stringifyJson(repairContext(context))}\nYou may return groupPatches:[{id,svg}] to replace existing named SVG groups, retaining the group's exact id and all unrelated artwork. Omit svg when using groupPatches or correcting only metadata. If a required group is missing from SVG, draw it in a complete corrected svg or patch an existing parent containing it; changing layers metadata alone cannot create artwork. Do not return an earlier shot in place of the requested scene. When correcting layers/animations, return the COMPLETE corrected list for that array. SVG must be self-contained, with requested viewBox, explicit attributes and local references only; no HTML, scripts, external images, CSS or SMIL. Use single-quoted SVG attributes and plain tag characters inside the JSON string. Animation channels are actor/effect/speech, attributes transform/d/opacity. Opacity values must be numbers in [0,1]. Times start at 0 and increase; path/transform values retain identical command structure; loops end at the exact starting value. Transform deltas use local joints/emitters for scale/rotation; do not move the support contact. Only direct dialogue may have speech motion. Draft: ${stringifyJson(draft)}\nErrors: ${stringifyJson(errors)}`,
  PROMPT: motionProfileScenePrompt,
} as const;
const text: MotionResponseSchema = { type: "string", minLength: 1 };
export const MOTION_COMPOSITION_SCHEMA: MotionResponseSchema = {
  type: "object",
  properties: {
    svg: text,
    design: MOTION_SCENE_DESIGN_SCHEMA,
    continuityNotes: { type: "string", maxLength: MOTION_SCENE_COMPOSITION.CONTINUITY_TEXT_LIMIT },
    layers: {
      type: "array",
      minItems: 1,
      maxItems: MOTION_SCENE_COMPOSITION.LAYERS,
      items: {
        type: "object",
        properties: { id: text, kind: { type: "string", enum: MOTION_SCENE_COMPOSITION.KINDS }, entityId: text, anonymous: { type: "boolean" }, description: text, appearance: { type: "string", maxLength: MOTION_SCENE_COMPOSITION.LAYER_DESCRIPTION_LIMIT }, effectKind: { type: "string", enum: ["rain", "smoke", "steam", "flame", "fog", "sway", "highlight"] }, sourceId: text },
        required: ["id", "kind"],
      },
    },
    animations: {
      type: "array",
      maxItems: MOTION_SCENE_COMPOSITION.ANIMATIONS,
      items: {
        type: "object",
        properties: {
          target: text,
          channel: { type: "string", enum: MOTION_SCENE_COMPOSITION.CHANNELS },
          attribute: { type: "string", enum: MOTION_SCENE_COMPOSITION.ATTRIBUTES },
          period: { type: "number", minimum: 0.2, maximum: MOTION_SCENE_COMPOSITION.MAX_SECONDS },
          keyframes: { type: "array", minItems: 2, maxItems: MOTION_SCENE_COMPOSITION.KEYFRAMES, items: { type: "object", properties: { at: { type: "number", minimum: 0, maximum: MOTION_SCENE_COMPOSITION.MAX_SECONDS }, value: { anyOf: [{ type: "string" }, { type: "number" }] } }, required: ["at", "value"] } },
        },
        required: ["target", "channel", "attribute", "keyframes"],
      },
    },
  },
  required: ["svg", "layers"],
};
