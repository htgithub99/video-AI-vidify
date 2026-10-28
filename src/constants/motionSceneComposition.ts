import { parseJson, stringifyJson } from "../lib/jsonStringify.js";
import type { MotionResponseSchema } from "./motionResponseContract.js";
const repairContext = (base: string): unknown => {
  try {
    const context = parseJson(base.slice(base.lastIndexOf("Context:\n") + "Context:\n".length));
    const { drawingReference, continuity, acceptedScene, ...needed } = context;
    return needed;
  } catch {
    return base;
  }
};
export const MOTION_SCENE_COMPOSITION = {
  REVISION: 3,
  SUPPORTED_REVISIONS: [1, 2, 3],
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
  LOG_MOTION_PATCH: (id: string) => `Bổ sung chuyển động nhẹ cho cảnh ${id}; giữ nguyên hình đã dựng.`,
  MOTION_REQUIRED: (channels: string[]) => `Chỉ bổ sung animations cho các kênh đã bật: ${channels.join(", ")}. Giữ nguyên svg, layers, design và các animation đã đạt. Không thêm chủ thể hoặc vẽ lại cảnh.`,
  MOTION_PENDING: (id: string, channels: string[]) => `Cảnh ${id} chưa có chuyển động đã bật: ${channels.join(", ")}. Đã giữ nguyên hình để tiếp tục bổ sung.`,
  ID: /^[A-Za-z_][\w.-]*$/,
  NUMBER: /[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:[eE][-+]?\d+)?/g,
  FILTER_TAGS: ["filter", "fegaussianblur", "fecolormatrix", "femerge", "femergenode", "feoffset", "feflood", "fecomposite", "feblend", "fecomponenttransfer", "fefunca", "fefuncr", "fefuncg", "fefuncb", "text", "tspan"],
  CHANNELS: ["actor", "effect", "speech"],
  ATTRIBUTES: ["transform", "d", "opacity"],
  KINDS: ["background", "character", "prop", "effect"],
  LOG: "Remotion: AI thiết kế trọn cảnh; giữ nguyên bố cục và các lớp hình AI đã dựng.",
  PLAN_POLICY:
    "These plans guide one AI-authored complete illustration per shot. Use ASCII SVG IDs matching [A-Za-z_][A-Za-z0-9_.-]*. Identify visible people and key objects with stable IDs and essential relationships; no staging templates, anchor coordinates or separate object assets are needed. The AI illustrator will design perspective, scale, floor contact and lighting together. Keep people intact when present. Follow the selected profile for physical narrative scenes, diagrams, labels and maps. Incidental gestures may use a simple static pose; explicit identity, colors, counts, ownership and important clues must match the source.",
  LOG_DRAW: (index: number, total: number, name: string) => `Dựng cảnh Remotion ${index}/${total}: ${name}`,
  ERROR: (field: string, reason: string) => `Bố cục AI ${field}: ${reason}`,
  INVALID: "Dữ liệu thiếu hoặc không hợp lệ.",
  IDS: "ID phải duy nhất, có trong SVG và đúng chủ thể đã yêu cầu.",
  SVG_GROUP_MISSING: "SVG thiếu nhóm <g> mang đúng ID lớp hình này. Sửa phần SVG để vẽ đủ chủ thể; chỉ sửa danh sách layers không khắc phục được lỗi.",
  MISSING: (ids: string[]) => `Thiếu lớp hình cho: ${ids.join(", ")}. Giữ nguyên các lớp đã đạt.`,
  VIEWBOX: "viewBox phải đúng kích thước và tỷ lệ khung hình được yêu cầu.",
  MOTION: "Chuyển động phải có đích hợp lệ, keyframe tăng dần và cùng cấu trúc số; chỉ cho nhân vật có thoại cử động miệng.",
  REPAIR: (base: string, draft: unknown, errors: string[]) =>
    `Repair only rejected fields of ONE AI-authored illustration. Return compact JSON. Keep accepted artwork, spatial design, support contacts, identities and story facts. Context: ${stringifyJson(repairContext(base))}\nYou may return groupPatches:[{id,svg}] to replace existing named SVG groups, retaining the group's exact id and all unrelated artwork. Omit svg when using groupPatches or correcting only metadata. If a required group is missing from SVG, draw it in a complete corrected svg or patch an existing parent containing it; changing layers metadata alone cannot create artwork. Do not return an earlier shot in place of the requested scene. When correcting layers/animations, return the COMPLETE corrected list for that array. SVG must be self-contained, with requested viewBox, explicit attributes and local references only; no HTML, scripts, external images, CSS or SMIL. Escape '<' in JSON SVG as \\u003c. Animation channels are actor/effect/speech, attributes transform/d/opacity. Opacity values must be numbers in [0,1]. Times start at 0 and increase; path/transform values retain identical command structure; loops end at the exact starting value. Transform deltas use local joints/emitters for scale/rotation; do not move the support contact. Only direct dialogue may have speech motion. Draft: ${stringifyJson(draft)}\nErrors: ${stringifyJson(errors)}`,
  PROMPT: (
    context: unknown,
  ) => `Design and draw ONE complete finished 2D illustration scene as coherent SVG source code, like an authored animation scene. You are the art director: decide perspective, composition, anatomy, scale, depth, floor contacts, architecture, furniture, people and object details TOGETHER in one shared coordinate system. The renderer preserves your design exactly; there is no later automatic placement or separate drawing of each object. Follow the selected artDirection for finished illustration or a clear explanatory diagram. Use recognizable connected anatomy where people appear; abstract symbols and simple geometry are valid for diagrams. Avoid accidental crude dolls and unreadable clutter. Keep the scene sparse and readable. Simple static illustrative poses are enough; incidental walking, opening doors or gestures can be shown standing beside the relevant place. Preserve essential stated identity, count, color, object construction and spatial relationships. Story facts override reference artwork: learn its drawing quality without importing unrelated objects. Preserve the recognizable construction and function of each requested object. Physical subjects follow their actual support plane; abstract diagrams need no floor, furniture or compulsory people.
Return a fenced JSON object with svg, layers and animations. svg is ONE complete self-contained SVG with xmlns and the EXACT requested viewBox, including the selected profile's backdrop and all requested people/props/diagram elements. Draw everything directly, no JavaScript, HTML, URLs, images, foreignObject, CSS classes/style elements or SVG/SMIL animations. Use explicit fill/stroke attributes, groups, paths, local gradients and modest local filters. No UI, LIVE badges, timestamps, logos, subtitles or narration overlays. Requested diagram labels may be drawn as SVG text. Every <g>, defs, gradient and svg must close. Encode EVERY '<' in JSON svg as the literal JSON escape \\u003c, including closing tags. Local url(#id) references only.
layers lists named SVG groups: {id,kind:background|character|prop|effect,entityId?,description?}. Use each supplied visible node id as its main group id, with its exact entityId for people; include every required node once. Detailed props can nest in their supporting furniture group; keep the proper named groups. Draw whole coherent bodies, with head/hair/neck/torso connected. Retain each subject's requested identity, clothing color and expression. Draw source-supported labels/arrows only when appropriate to this profile; do not invent names, dates or causal claims. No character should have an open mouth at rest. Preserve continuity references: recurring faces, clothes, architecture, furniture positions and perspective; crop/framing changes must preserve that world. Reference SVG is a continuity source, not a request to copy its shot when the narration changes.
The supplied design is your accepted spatial layout. For a diagram, use its hierarchy/relative positions and omit physical ground constraints when not relevant. Convert its normalized coordinates to SVG canvas units and follow its camera, floor, silhouette boxes, paint depths and support/contact points. For physical scenes draw support surfaces at the actual contact and keep reclining bodies in that support perspective. Where people appear, connect head/neck/shoulders and hands/sleeves. Do not turn this layout into a collection of boxes: build recognizable curved silhouettes and objects with visible top/front/side construction. The static frame must work before animation. For any scale or rotation, use a local joint/emitter group so the animation cannot move the whole subject away from its support. In repairOnly mode preserve accepted groups; return groupPatches:[{id,svg}] for only the groups that must change, with complete layers/animations arrays only if those arrays change. The code merges the patches into the accepted SVG and never repositions subjects itself.
Author optional actor and ambient animations independently of playback toggles: the renderer enables/disables them without redrawing. animations may be [] for scenes with no suitable motion. For ambient motion add subtle smoke/flame/rain/fog at the actual source. Each entry is {target:SVG id,channel:actor|effect|speech,attribute:transform|d|opacity,period?:seconds,keyframes:[{at:seconds,value:string|number}]}. target is a named SVG element inside the matching layer. Frames start at 0, times increase, values use identical path/transform command structure. Opacity keyframe values must be numbers from 0 to 1 inclusive. Use explicit translate/rotate/scale transform values as DELTAS appended to the target's original transform, starting at identity. A looping animation must end with the EXACT same value as its first frame, with last at <= period. Keep actor motion minimal; fixed feet/floor contacts. Add speech ONLY on a mouth path element inside a visible speaking character, first frame closed, with subtle open/closed path keyframes and period about 0.45 seconds; the renderer gates it to real dialogue timing. Never animate a narrator's mouth. Animations should be original to the scene and physically plausible; omit complex gestures if they cannot be drawn cleanly. All subjects must remain inside the requested safe frame. Include continuityNotes (max 2400 characters): succinct recurring face/clothing palette, room geometry and furniture positions in your drawing. Keep SVG under 150000 characters; sufficient deliberate paths for readable faces, hands, clothing and object construction where present; clear hierarchy and legible labels for diagrams. Context:\n${stringifyJson(context)}`,
} as const;
const text: MotionResponseSchema = { type: "string", minLength: 1 };
export const MOTION_COMPOSITION_SCHEMA: MotionResponseSchema = {
  type: "object",
  properties: {
    svg: text,
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
