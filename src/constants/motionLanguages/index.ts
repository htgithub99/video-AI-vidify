import { VI_LANGUAGE } from "./vi.js";
import { EN_LANGUAGE } from "./en.js";
import { JA_LANGUAGE } from "./ja.js";
import { KO_LANGUAGE } from "./ko.js";
import type { MotionLanguageProfile } from "./types.js";
export const MOTION_LANGUAGES = { vi: VI_LANGUAGE, en: EN_LANGUAGE, ja: JA_LANGUAGE, ko: KO_LANGUAGE } as const satisfies Record<string, MotionLanguageProfile>;
export type MotionLanguageCode = keyof typeof MOTION_LANGUAGES;
export const MOTION_LANGUAGE_CODES = Object.keys(MOTION_LANGUAGES) as MotionLanguageCode[];
export const MOTION_LANGUAGE_DEFAULT: MotionLanguageCode = "vi";
export const MOTION_LANGUAGE_UNITS = {
  CJK: /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/gu,
  TOKEN: /[\p{L}\p{N}]/u,
  SENTENCE: /[^.!?…。！？]+[.!?…。！？]*["”』」']?/g,
  SENTENCE_TAIL: /[^.!?…。！？]+$/,
  CLAUSE: /[,;:，、；：]/,
  QUESTION: /[?？]\s*$/u,
} as const;
