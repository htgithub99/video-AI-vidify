import * as MR from "../constants/motionRuntime.js";
import { MOTION_REFERENCE_CONFIG as C, MOTION_REFERENCE_TEXTS as T, MOTION_QA_MESSAGES } from "../constants/motionReference.js";
import type { MotionStyleReference, MotionReferenceStyle } from "../types/motionVideo.js";
export const normalizeMotionReferences = (value: unknown): MotionStyleReference[] => {
  if (value == null) return [];
  if (!Array.isArray(value) || value.length > C.MAX_IMAGES) throw new Error(T.vi.limit);
  return value.map((image, index) => {
    const dataUrl = typeof image?.dataUrl === "string" ? image.dataUrl : MR.MOTION_TEXT_EMPTY;
    if (dataUrl.length > Math.ceil(C.MAX_BYTES / 3) * 4 + 64) throw new Error(T.vi.size);
    const match = C.DATA_URL.exec(dataUrl);
    if (!match || match[2].length % 4 !== 0) throw new Error(T.vi.invalid);
    return { name: `${C.NAME_PREFIX}${index + 1}`, dataUrl };
  });
};
export const normalizeMotionReferenceStyle = (value: any): MotionReferenceStyle | undefined => {
  if (typeof value?.description !== "string" || !value.description.trim()) return undefined;
  return {
    description: value.description.trim().slice(0, C.PROFILE_MAX_CHARS),
    palette: Array.isArray(value.palette) ? value.palette.filter((color: unknown) => typeof color === "string" && C.HEX_COLOR.test(color)).slice(0, 12) : [],
    outlineColor: C.HEX_COLOR.test(value.outlineColor) ? value.outlineColor : undefined,
    outlineWidth: Number.isFinite(value.outlineWidth) ? Math.max(0, Math.min(C.OUTLINE_MAX, value.outlineWidth)) : 0,
  };
};
export const hasMotionRenderFailure = (issues?: string[]): boolean => !!issues?.some((issue) => MOTION_QA_MESSAGES.RENDER_FAILURE.test(issue));
