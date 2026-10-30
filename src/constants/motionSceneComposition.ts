import { parseJson, stringifyJson } from "../lib/jsonStringify.js";
import type { MotionResponseSchema } from "./motionResponseContract.js";
import { MOTION_SCENE_DESIGN_SCHEMA } from "./motionSceneDesign.js";
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
  ANIMATIONS: 96,
  KEYFRAMES: 20,
  MAX_SECONDS: 3600,
  CONTINUITY_SVG_LIMIT: 24000,
  CONTINUITY_TEXT_LIMIT: 2400,
  GEOMETRY_REVISION: 1,
  GEOMETRY: { COVERAGE: 0.8, EXPECTED_COVERAGE: 0.4, OVERSIZE: 4, CENTER_DISTANCE: 0.5, OUTSIDE_SHARE: 0.9, MAX_MEASUREMENTS: 96 },
  GEOMETRY_ERROR: (id: string) => `Lớp ${id} bị trống, ra ngoài khung hoặc lệch nghiêm trọng vùng thiết kế. Sửa riêng nhóm SVG này theo design; giữ các nhóm khác.`,
  GEOMETRY_UNAVAILABLE: "Chưa đo được vùng hình SVG; giữ dữ liệu cảnh để kiểm tra tiếp.",
  GUARD: {
    ATTEMPTS: 1,
    BOB: 0.005,
    BOB_SECONDS: 3.4,
    BOB_STEP: 0.35,
    BOB_VALUE: (y: number) => `translate(0 ${y})`,
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
    LOG_MOTION: (id: string, count: number) => `Cảnh ${id}: thêm chuyển động thở nhẹ cho ${count} nhân vật chưa có chuyển động.`,
    LOG_ATTACHMENT: (id: string, count: number) => `Cảnh ${id}: giữ tĩnh ${count} chuyển động để đồ vật không rời tay; giữ hình và tiếp tục.`,
  },
  REVIEW_PASSES: 3,
  REVIEW_REQUESTS: 6,
  REVIEW_LIMIT: "Cảnh đã dùng hết lượt duyệt và sửa; giữ hình hiện có và tiếp tục các cảnh khác. Có thể tạo lại riêng cảnh này.",
  MISSING_ADVISORY: (ids: string[]) => `Chưa xác nhận nhóm hình theo ID: ${ids.join(", ")}. Giữ SVG render được; không tự gửi thêm yêu cầu chỉ vì metadata.`,
  GEOMETRY_ADVISORY: (issues: string[]) => `Góp ý vùng hình: ${issues.join("; ")}. Giữ hình và để duyệt ảnh kiểm tra nội dung chính khi được bật.`,
  ID: /^[A-Za-z_][\w.-]*$/,
  NUMBER: /[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:[eE][-+]?\d+)?/g,
  FILTER_TAGS: ["filter", "fegaussianblur", "fecolormatrix", "femerge", "femergenode", "feoffset", "feflood", "fecomposite", "feblend", "fecomponenttransfer", "fefunca", "fefuncr", "fefuncg", "fefuncb", "text", "tspan"],
  CHANNELS: ["actor", "effect", "speech"],
  ATTRIBUTES: ["transform", "d", "opacity"],
  KINDS: ["background", "character", "prop", "effect"],
  LOG: "Remotion: AI thiết kế trọn cảnh; giữ nguyên bố cục và các lớp hình AI đã dựng.",
  LOG_SINGLE: "Mỗi cảnh dùng một yêu cầu thiết kế và vẽ; tắt duyệt ảnh sẽ không tự yêu cầu sửa.",
  LOG_CONTINUE: (id: string, reason: string) => `Cảnh ${id} cần tạo lại: ${reason}. Tiếp tục các cảnh còn lại.`,
  PLACEHOLDER: placeholderText,
  PLACEHOLDER_SVG: (width: number, height: number) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}"><g id="pending_scene"><rect width="${width}" height="${height}" fill="#171b24"/><text x="${width / 2}" y="${height / 2}" text-anchor="middle" font-family="sans-serif" font-size="${Math.min(width, height) / 28}" fill="#cbd5e1">${placeholderText}</text></g></svg>`,
  PLAN_POLICY:
    "These plans guide one AI-authored complete illustration per shot. Use ASCII SVG IDs matching [A-Za-z_][A-Za-z0-9_.-]*. Identify visible people and key objects with stable IDs and essential relationships; no staging templates, anchor coordinates or separate object assets are needed. The AI illustrator will design perspective, scale, floor contact and lighting together. Keep people intact when present. Follow the selected profile for physical narrative scenes, diagrams, labels and maps. Incidental gestures may use a simple static pose; explicit identity, colors, counts, ownership and important clues must match the source.",
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
  PROMPT: (
    context: unknown,
  ) => `CODING TASK, TEXT ANSWER ONLY: reply with one JSON object inside ONE \`\`\`json fenced code block; its "svg" field is hand-written SVG vector markup. Never call an image-generation, canvas or artifact tool and never return a picture. Inside the svg string write every SVG attribute with single quotes (x='0') so the JSON needs no escaped double quotes, write the tag characters < > / as plain characters (never \\u003c, \\u003e or &lt; escapes), close every opened element with its own closing tag such as </g>, and give every element id a unique value. Write the SVG source code of ONE complete finished 2D scene, like an authored animation scene. You are the art director: decide perspective, composition, anatomy, scale, depth, floor contacts, architecture, furniture, people and object details TOGETHER in one shared coordinate system. The renderer preserves your design exactly; there is no later automatic placement or separate drawing of each object. Follow the selected artDirection for finished illustration or a clear explanatory diagram. Use recognizable connected anatomy where people appear; abstract symbols and simple geometry are valid for diagrams. Avoid accidental crude dolls and unreadable clutter. Keep the scene sparse and readable. Simple static illustrative poses are enough; incidental walking, opening doors or gestures can be shown standing beside the relevant place. Preserve essential stated identity, count, color, object construction and spatial relationships. Story facts override reference artwork: learn its drawing quality without importing unrelated objects. Preserve the recognizable construction and function of each requested object. Physical subjects follow their actual support plane; abstract diagrams need no floor, furniture or compulsory people.
Return ONE JSON object containing design, svg, layers, animations and continuityNotes, with no commentary. Design and draw together in this response; do not ask for another planning or drawing turn. design is compact {format:illustration|diagram|comparison|map|timeline|process|cutaway,camera:string,palette?:string[],floor?:{horizon,outline:[{x,y}]},placements:[{id,box:{x,y,width,height},depth,supportId?,contact?:{x,y},construction:string}]}. Use normalized full-canvas coordinates and every supplied non-label node ID once. Larger depth paints later. supportId references another placement or floor/wall/ceiling/water. Keep descriptions short. svg is ONE complete self-contained SVG with xmlns and the EXACT requested viewBox, including the selected profile's backdrop and all requested people/props/diagram elements. Draw everything directly, no JavaScript, HTML, URLs, images, foreignObject, CSS classes/style elements or SVG/SMIL animations. Use explicit fill/stroke attributes, groups, paths, local gradients and modest local filters. No UI, LIVE badges, timestamps, logos, subtitles or narration overlays. Requested diagram labels may be drawn as SVG text. Every <g>, defs, gradient and svg must close. Local url(#id) references only.
layers lists named SVG groups: {id,kind:background|character|prop|effect,entityId?,description?}. Use each supplied visible node id as its main group id, with its exact entityId for people; include every required node once. Detailed props can nest in their supporting furniture group; keep the proper named groups. Draw whole coherent bodies, with head/hair/neck/torso connected. Retain each subject's requested identity, clothing color and expression. Draw source-supported labels/arrows only when appropriate to this profile; do not invent names, dates or causal claims. No character should have an open mouth at rest unless artDirection defines a fixed mask mouth. When artDirection defines a stylized puppet construction, follow it over the generic anatomy wording here. Preserve continuity references: recurring faces, clothes, architecture, furniture positions and perspective; crop/framing changes must preserve that world. Reference SVG is a continuity source, not a request to copy its shot when the narration changes.
Your design describes the actual SVG you draw in this same response. If repairing an accepted scene, preserve its supplied design except the rejected fields. For a diagram, use its hierarchy/relative positions and omit physical ground constraints when not relevant. Convert its normalized coordinates to SVG canvas units and follow its camera, floor, silhouette boxes, paint depths and support/contact points. For physical scenes draw support surfaces at the actual contact and keep reclining bodies in that support perspective. Where people appear, connect head/neck/shoulders and hands/sleeves. Do not turn this layout into a collection of boxes: build recognizable curved silhouettes and objects with visible top/front/side construction. The static frame must work before animation. For any scale or rotation, use a local joint/emitter group so the animation cannot move the whole subject away from its support. In repairOnly mode preserve accepted groups; return groupPatches:[{id,svg}] for only the groups that must change, with complete layers/animations arrays only if those arrays change. The code merges the patches into the accepted SVG and never repositions subjects itself.
Include simple actor and effect animations in this same response for the enabled renderBehavior channels when suitable; never defer them to a later request. The renderer applies the playback toggles independently: actors=fixed means no actor or speech tracks; sceneEffects=off means no effect tracks. Never enable movement from the style alone or bake camera movement into the SVG; code handles camera according to renderBehavior.camera. animations may be [] for scenes with no suitable motion. For ambient motion add subtle smoke/flame/rain/fog at the actual source. Each entry is {target:SVG id,channel:actor|effect|speech,attribute:transform|d|opacity,period?:seconds,keyframes:[{at:seconds,value:string|number}]}. target is a named SVG element inside the matching layer. Frames start at 0, times increase, values use identical path/transform command structure. Opacity keyframe values must be numbers from 0 to 1 inclusive. Use explicit translate/rotate/scale transform values as DELTAS appended to the target's original transform, starting at identity. Translate distances use SVG viewBox units; scale values are unitless ratios near 1, never pixel values; rotation uses degrees around the local joint. A looping animation must end with the EXACT same value as its first frame, with last at <= period. Keep actor motion minimal; fixed feet/floor contacts. Add speech ONLY on a mouth path element inside a visible speaking character, first frame closed, with subtle open/closed path keyframes and period about 0.45 seconds; the renderer gates it to real dialogue timing. Never animate a narrator's mouth. Animations should be original to the scene and physically plausible; omit complex gestures if they cannot be drawn cleanly. All subjects must remain inside the requested safe frame. Include continuityNotes (max 2400 characters): succinct recurring face/clothing palette, room geometry and furniture positions in your drawing. Keep SVG under 150000 characters; sufficient deliberate paths for readable faces, hands, clothing and object construction where present; clear hierarchy and legible labels for diagrams. Context:\n${stringifyJson(context)}\nFINAL REMINDER: this is a text coding task. Answer only with the \`\`\`json code block containing the SVG markup as text. Do not create, generate or attach an image.`,
} as const;
const text: MotionResponseSchema = { type: "string", minLength: 1 };
export const MOTION_COMPOSITION_SCHEMA: MotionResponseSchema = {
  type: "object",
  properties: {
    svg: text,
    design: MOTION_SCENE_DESIGN_SCHEMA,
    continuityNotes: { type: "string", maxLength: MOTION_SCENE_COMPOSITION.CONTINUITY_TEXT_LIMIT },
    layers: { type: "array", minItems: 1, maxItems: MOTION_SCENE_COMPOSITION.LAYERS, items: { type: "object", properties: { id: text, kind: { type: "string", enum: MOTION_SCENE_COMPOSITION.KINDS }, entityId: text, description: text }, required: ["id", "kind"] } },
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
