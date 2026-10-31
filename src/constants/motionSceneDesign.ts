import type { MotionResponseSchema } from "./motionResponseContract.js";
export const MOTION_SCENE_DESIGN = { PIXEL_LIMIT: 2, INVALID: "Thiết kế cảnh cần đủ chủ thể, vùng hình hữu hạn và điểm tựa hợp lệ; giữ thiết kế đã đạt.", PATCH_INVALID: "Bản sửa SVG phải thay đúng nhóm có ID đã tồn tại, giữ nguyên ID và không thay nhóm cha cùng nhóm con trong một lượt." } as const;
const text: MotionResponseSchema = { type: "string", minLength: 1 };
const number: MotionResponseSchema = { type: "number" };
const point: MotionResponseSchema = { type: "object", properties: { x: number, y: number }, required: ["x", "y"] };
export const MOTION_SCENE_PLACEMENT_SCHEMA: MotionResponseSchema = { type: "object", properties: { id: text, box: { type: "object", properties: { x: number, y: number, width: number, height: number }, required: ["x", "y", "width", "height"] } }, required: ["id", "box"] };
export const MOTION_SCENE_DESIGN_SCHEMA: MotionResponseSchema = {
  type: "object",
  properties: {
    format: { type: "string", enum: ["illustration", "diagram", "comparison", "map", "timeline", "process", "cutaway"] },
    camera: text,
    cameraMotion: { type: "object", properties: { mode: { type: "string", enum: ["follow", "push", "pull", "hold"] }, subjectId: text, focus: point }, required: ["mode"] },
    palette: { type: "array", maxItems: 12, items: text },
    floor: { type: "object", properties: { horizon: number, outline: { type: "array", minItems: 3, maxItems: 8, items: point } }, required: ["horizon", "outline"] },
    placements: { type: "array", maxItems: 96, items: { type: "object", properties: { id: text, box: { type: "object", properties: { x: number, y: number, width: number, height: number }, required: ["x", "y", "width", "height"] }, depth: number, supportId: text, contact: point, construction: text }, required: ["id", "box"] } },
    continuityNotes: { type: "string", maxLength: 2400 },
  },
  required: ["camera"],
};
