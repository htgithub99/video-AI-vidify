import * as RT_MAINTENANCE from "../constants/runtime/maintenance.js";
import { MOTION_CAST_IDENTITY as I } from "../constants/motionCastIdentity.js";
import type { MotionAnalysisGroup } from "../types/motionVideo.js";
export const motionCleanLook = (look?: string): string => I.TIDY.reduce((text, pattern, index) => text.replace(pattern, index === 2 ? RT_MAINTENANCE.SPACE : ""), (look || "").replace(I.CONSTRUCTION, "")).trim();
const field = (value: unknown, max: number): string | undefined => {
  const text = typeof value === "string" ? value.trim().slice(0, max) : "";
  return text || undefined;
};
export const motionCastMarks = (marks: unknown): string[] => {
  const listed = (Array.isArray(marks) ? marks : []).filter((item): item is string => typeof item === "string" && !!item.trim()).map((item) => item.trim().replace(I.MARK_TRIM, "").slice(0, I.MARK_CHARS));
  return listed.slice(0, I.MARKS_MAX);
};
export const motionCastSkin = (skin: unknown, look?: string): string | undefined => field(skin, I.FIELD_CHARS) || (look || "").match(I.SKIN_WORDS)?.[1]?.trim();
export const motionCastCarries = (carries: unknown): string[] =>
  (Array.isArray(carries) ? carries : [])
    .filter((item): item is string => typeof item === "string" && !!item.trim())
    .map((item) => item.trim().slice(0, I.MARK_CHARS))
    .slice(0, I.CARRIES_MAX);
export const motionSkinHex = (skin: string | undefined, fallback: string): string => {
  const text = (skin || "").trim();
  if (I.HEX.test(text)) return text.toLowerCase();
  return I.SKIN_TONES.find(([pattern]) => pattern.test(text))?.[1] || fallback;
};
export const motionAnalysisGroups = (raw: unknown): MotionAnalysisGroup[] | undefined => {
  if (!Array.isArray(raw)) return undefined;
  const used = new Set<string>();
  const groups = raw
    .filter((item) => item && typeof item === "object" && typeof item.name === "string" && typeof item.look === "string" && item.look.trim())
    .slice(0, I.GROUP_LIMIT)
    .map((item) => {
      const name = item.name.trim().slice(0, I.GROUP_TEXT.NAME);
      let key =
        String(item.key || name)
          .toLowerCase()
          .replace(I.GROUP_KEY.INVALID, I.GROUP_KEY.SEPARATOR)
          .replace(I.GROUP_KEY.TRIM, "") || I.GROUP_KEY.FALLBACK;
      while (used.has(key)) key += I.GROUP_KEY.SUFFIX;
      used.add(key);
      const extra = Object.fromEntries(I.GROUP_FIELDS.map((name) => [name, field(item[name], I.GROUP_TEXT.FIELD)]).filter(([, value]) => value));
      return { key, name, look: motionCleanLook(item.look).slice(0, I.GROUP_TEXT.LOOK), ...(extra.skin ? {} : motionCastSkin(undefined, item.look) ? { skin: motionCastSkin(undefined, item.look) } : {}), ...extra };
    });
  return groups.length ? groups : undefined;
};
export const motionCastIdentity = <T extends { key: string; look?: string }>(cast: T[]): T[] => cast.map((member) => ({ ...member, ...(member.look ? { look: motionCleanLook(member.look) } : {}) }));
