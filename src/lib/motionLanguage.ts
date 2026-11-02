import { MOTION_LANGUAGES, MOTION_LANGUAGE_DEFAULT, MOTION_LANGUAGE_UNITS as U, type MotionLanguageCode } from "../constants/motionLanguages/index.js";
import type { MotionLanguageProfile } from "../constants/motionLanguages/types.js";
export const motionLanguageCode = (value: unknown): MotionLanguageCode => {
  const raw = String(value ?? "")
    .trim()
    .toLowerCase();
  if (!raw) return MOTION_LANGUAGE_DEFAULT;
  if (Object.hasOwn(MOTION_LANGUAGES, raw)) return raw as MotionLanguageCode;
  const short = raw.split(/[-_]/)[0];
  if (Object.hasOwn(MOTION_LANGUAGES, short)) return short as MotionLanguageCode;
  const alias = (Object.keys(MOTION_LANGUAGES) as MotionLanguageCode[]).find((code) => MOTION_LANGUAGES[code].aliases.includes(raw));
  return alias || MOTION_LANGUAGE_DEFAULT;
};
export const motionLanguage = (value: unknown): MotionLanguageProfile => MOTION_LANGUAGES[motionLanguageCode(value)];
export const motionLanguageIs = (value: unknown, code: MotionLanguageCode): boolean => motionLanguageCode(value) === code;
export const motionSpeechUnits = (text: unknown): number => {
  const raw = String(text ?? "");
  const cjk = (raw.match(U.CJK) || []).length;
  const words = raw
    .replace(U.CJK, " ")
    .split(/\s+/)
    .filter((word) => U.TOKEN.test(word)).length;
  return cjk + words;
};
export const motionSplitSentences = (text: unknown): string[] => (String(text ?? "").match(U.SENTENCE) || []).map((part) => part.trim()).filter(Boolean);
export const motionLanguageRate = (value: unknown, dialogue = false): number => {
  const profile = motionLanguage(value);
  return dialogue ? profile.rate.dialogue : profile.rate.narration;
};
export const motionLanguageMaxUnits = (value: unknown, genre: string, fallback: number): number => motionLanguage(value).genreMaxUnits[genre] ?? fallback;
