import { stringifyJson } from "../lib/jsonStringify.js";
import type { MotionResponseSchema } from "./motionResponseContract.js";
export const MOTION_SCENE_DESIGN = {
  ARTIFACT: "motion_remotion_design",
  LOG: (index: number, total: number) => `Dựng cảnh Remotion ${index}/${total}: AI thiết kế phối cảnh, tỷ lệ và điểm tiếp xúc.`,
  INVALID: "Thiết kế cảnh cần đủ chủ thể, vùng hình hữu hạn và điểm tựa hợp lệ; giữ thiết kế đã đạt.",
  PATCH_INVALID: "Bản sửa SVG phải thay đúng nhóm có ID đã tồn tại, giữ nguyên ID và không thay nhóm cha cùng nhóm con trong một lượt.",
  PROMPT: (context: unknown) =>
    `Design the SPACE of ONE finished illustration before drawing SVG. Choose format=illustration|diagram|comparison|map|timeline|process|cutaway according to the actual passage and selected artDirection; use illustration for a narrative physical scene. Return compact JSON {format,camera:"short camera/perspective description",palette?:["#hex"],floor?:{horizon,outline:[{x,y}]},placements:[{id,box:{x,y,width,height},depth,supportId?,contact?:{x,y},construction:"short description"}],continuityNotes?:"short notes"}. camera MUST be a string, palette MUST be an array of color strings, NOT nested objects. All coordinates are fractions of the complete canvas, NOT local object coordinates. You decide the camera, shared perspective, architecture/floor plane, visible silhouettes and contact points TOGETHER. Larger depth means painted later/in front. Include every supplied visible non-label node exactly once by its exact id; add no unrelated story subjects. supportId references another placement id or floor/wall/ceiling/water; contact is the actual point on that support in full-canvas coordinates. The box encloses the drawn silhouette, not its interaction zone. Keep essential people and clues readable; a seated/lying body follows its support plane and is physically connected, never a standing head attached to a flattened torso. Preserve recognizable construction and function of requested objects. For a diagram, prioritize hierarchy, readable labels and causal direction; do not invent physical supports for abstract elements. Choose simple illustrative poses; do not expand incidental actions into animation sequences. Floor outline and vanishing/horizon height must agree with all furniture and mat footprints. Omit floor for diagrams with no ground. Reference artwork teaches drawing craft and composition; preserve the current story's subjects, relationships and count instead of importing reference furniture or identities. Reuse accepted room geometry and character appearance when supplied, adjusting only framing or changed story facts. Do not draw SVG or write code yet. Keep construction descriptions short and concrete; no decorative inventory. Context:\n${stringifyJson(context)}`,
} as const;
const text: MotionResponseSchema = { type: "string", minLength: 1 };
const number: MotionResponseSchema = { type: "number" };
const point: MotionResponseSchema = { type: "object", properties: { x: number, y: number }, required: ["x", "y"] };
export const MOTION_SCENE_DESIGN_SCHEMA: MotionResponseSchema = {
  type: "object",
  properties: {
    format: { type: "string", enum: ["illustration", "diagram", "comparison", "map", "timeline", "process", "cutaway"] },
    camera: text,
    palette: { type: "array", maxItems: 12, items: text },
    floor: { type: "object", properties: { horizon: number, outline: { type: "array", minItems: 3, maxItems: 8, items: point } }, required: ["horizon", "outline"] },
    placements: { type: "array", maxItems: 96, items: { type: "object", properties: { id: text, box: { type: "object", properties: { x: number, y: number, width: number, height: number }, required: ["x", "y", "width", "height"] }, depth: number, supportId: text, contact: point, construction: text }, required: ["id", "box", "depth", "construction"] } },
    continuityNotes: { type: "string", maxLength: 2400 },
  },
  required: ["camera", "placements"],
};
