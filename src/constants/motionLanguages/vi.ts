import type { MotionLanguageProfile } from "./types.js";
export const VI_LANGUAGE: MotionLanguageProfile = {
  code: "vi",
  label: { vi: "Tiếng Việt", en: "Vietnamese" },
  promptName: "Vietnamese",
  unit: { promptName: "Vietnamese syllables (words)" },
  rate: { narration: 3.4, dialogue: 3.8 },
  numbers: "spoken",
  markers: { viewer: /(^|[^\p{L}])bạn([^\p{L}]|$)/iu, perception: /(^|[^\p{L}])tôi (?:thấy|nghe|nhìn thấy|trông thấy|chứng kiến|biết)(?=[^\p{L}]|$)/iu },
  styleGuide: [],
  reviewGuide: "",
  subtitle: { maxChars: 64, fontFamily: "Arial, sans-serif" },
  genreMaxUnits: { witness: 16, pov: 22, chronicle: 24, verdict: 24 },
  asrCode: "vi",
  partTitle: (title: string, index: number, count: number): string => `${title} (Phần ${index}/${count})`,
  aliases: ["vietnamese", "tiếng việt", "vi-vn"],
};
