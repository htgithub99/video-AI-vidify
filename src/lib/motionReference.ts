import * as MR from "../constants/motionRuntime.js";
import { MOTION_REFERENCE_CONFIG as C, MOTION_REFERENCE_TEXTS as T } from "../constants/motionReference.js";
import { normalizeMotionStyleMetrics } from "./motionStyleMetrics.js";
import type { MotionStyleReference, MotionReferenceStyle, MotionStyleKit, MotionReferenceImageInfo } from "../types/motionVideo.js";
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
const kitText = (value: unknown): string | undefined => (typeof value === "string" && value.trim() ? value.trim().slice(0, C.KIT_FIELD_MAX) : undefined);
const kitGroup = (value: unknown): Record<string, string> | undefined => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const entries = Object.entries(value as Record<string, unknown>)
    .slice(0, C.KIT_GROUP_MAX)
    .flatMap(([key, item]) => {
      const text = kitText(typeof item === "number" ? String(item) : item);
      return /^[a-zA-Z][\w]{0,40}$/.test(key) && text ? [[key, text]] : [];
    });
  return entries.length ? Object.fromEntries(entries) : undefined;
};
export const normalizeStyleKit = (value: any): MotionStyleKit | undefined => {
  if (!value || typeof value !== "object") return undefined;
  const kit: MotionStyleKit = { render: kitGroup(value.render), character: kitGroup(value.character), animals: kitText(value.animals), background: kitGroup(value.background), fx: kitText(value.fx), typography: kitText(value.typography), camera: kitText(value.camera) };
  const clean = Object.fromEntries(Object.entries(kit).filter(([, item]) => item !== undefined)) as MotionStyleKit;
  return Object.keys(clean).length ? clean : undefined;
};
export const normalizeReferenceImages = (value: any): MotionReferenceImageInfo[] | undefined => {
  if (!Array.isArray(value)) return undefined;
  const list = value.slice(0, C.MAX_IMAGES).flatMap((item: any) => {
    const name = kitText(item?.name)?.replace(/\.[a-z]+$/i, MR.MOTION_TEXT_EMPTY);
    if (!name || !name.startsWith(C.NAME_PREFIX)) return [];
    const role = (C.IMAGE_ROLES as readonly string[]).includes(item?.role) ? item.role : C.IMAGE_ROLES[4];
    const details = typeof item?.details === "string" && item.details.trim() ? item.details.trim().slice(0, C.IMAGE_DETAILS_MAX) : undefined;
    return [{ name, role, subjects: (Array.isArray(item?.subjects) ? item.subjects : []).map(kitText).filter(Boolean).slice(0, 8) as string[], ...(details ? { details } : {}) }];
  });
  return list.length ? list : undefined;
};
export const normalizeMotionReferenceStyle = (value: any): MotionReferenceStyle | undefined => {
  const kit = normalizeStyleKit(value?.kit);
  const description =
    typeof value?.description === "string" && value.description.trim()
      ? value.description.trim()
      : kit
        ? Object.values(kit.render || {})
            .concat(Object.values(kit.character || {}).slice(0, 4))
            .join(MR.MOTION_TEXT_SYMBOL_41)
        : MR.MOTION_TEXT_EMPTY;
  if (!description) return undefined;
  return {
    description: description.slice(0, C.PROFILE_MAX_CHARS),
    palette: Array.isArray(value.palette) ? value.palette.filter((color: unknown) => typeof color === "string" && C.HEX_COLOR.test(color)).slice(0, 12) : [],
    outlineColor: C.HEX_COLOR.test(value.outlineColor) ? value.outlineColor : undefined,
    outlineWidth: Number.isFinite(value.outlineWidth) ? Math.max(0, Math.min(C.OUTLINE_MAX, value.outlineWidth)) : 0,
    kit,
    images: normalizeReferenceImages(value.images),
    ...(normalizeMotionStyleMetrics(value.metrics ?? value.kit?.metrics) ? { metrics: normalizeMotionStyleMetrics(value.metrics ?? value.kit?.metrics) } : {}),
  };
};
