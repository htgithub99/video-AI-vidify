import { MOTION_RESPONSE_SCHEMAS, type MotionResponseSchema } from "../constants/motionResponseContract.js";
import { motionResponseIssues } from "./motionResponseContract.js";
export const normalizeMotionEditorialMetadata = (value: any, schema: MotionResponseSchema): any => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return value;
  return Object.fromEntries(
    Object.entries(value).flatMap(([key, raw]) => {
      const field = schema.properties?.[key];
      if (!field || schema.required?.includes(key)) return [[key, raw]];
      let item = raw;
      if (field.type === "number" || field.type === "integer") {
        const number = typeof raw === "number" ? raw : typeof raw === "string" && raw.trim() ? Number(raw) : NaN;
        item = Number.isFinite(number) ? Math.min(field.maximum ?? Infinity, Math.max(field.minimum ?? -Infinity, field.type === "integer" ? Math.round(number) : number)) : undefined;
      }
      if (field.type === "array" && Array.isArray(item)) item = item.filter((entry) => !motionResponseIssues(entry, field.items || {}).length);
      return motionResponseIssues(item, field).length ? [] : [[key, item]];
    }),
  );
};
export const normalizeMotionChapterMetadata = (rows: Record<string, any>[]): Record<string, any>[] =>
  rows.map((row) => {
    const schema = MOTION_RESPONSE_SCHEMAS["motion-story-chapter"].properties!.beats.items!;
    const normalized = normalizeMotionEditorialMetadata(row, schema);
    if (normalized && row.cast !== undefined) normalized.cast = row.cast;
    if (normalized && row.place !== undefined) normalized.place = row.place;
    return normalized && Array.isArray(row.utterances) ? { ...normalized, utterances: row.utterances.map((line: any) => normalizeMotionEditorialMetadata(line, schema.properties!.utterances.items!)) } : normalized;
  });
