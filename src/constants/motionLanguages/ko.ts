import type { MotionLanguageProfile } from "./types.js";
export const KO_LANGUAGE: MotionLanguageProfile = {
  code: "ko",
  label: { vi: "Tiếng Hàn", en: "Korean" },
  promptName: "Korean",
  unit: { promptName: "Korean syllables (Hangul blocks)" },
  rate: { narration: 4.5, dialogue: 5 },
  numbers: "keep",
  markers: { viewer: /(?:당신|너|여러분|네가|당신은)/u, perception: /(?:나는|내가|저는|제가).{0,14}?(?:봤|보았|들었|알았|알고|알게)/u, outfit: /(?:갈아입|입었|벗었|변장|썼다|걸쳤)/u },
  styleGuide: [
    "KOREAN NARRATION: write natural spoken Korean for a narrator reading aloud. Choose one speech level (해요체 or 합쇼체 for documentary and verdict, the narrator's own 해체/해라체 for lived stories) and keep it for the whole video. Hangul only; no hanja, no romanization. Write numbers, dates and years with Arabic digits plus counters (1944년 6월 6일, 5000명); the speech engine reads them. Keep sentences short and spoken, one idea each, ending with a period; questions end with ?. Dialogue goes in quotation marks. Never mix in Vietnamese or English words except proper names in Hangul.",
  ],
  reviewGuide: "When editing Korean, a sentence longer than one breath, a shifting speech level, a literal translation of a Vietnamese idiom or a mixed-script word is also an error to fix.",
  subtitle: { maxChars: 36, fontFamily: "Noto Sans KR, Malgun Gothic, Apple SD Gothic Neo, sans-serif" },
  genreMaxUnits: { witness: 16, pov: 22, chronicle: 26, verdict: 28 },
  asrCode: "ko",
  partTitle: (title: string, index: number, count: number): string => `${title} (${index}부/${count}부)`,
  aliases: ["korean", "tiếng hàn", "한국어", "ko-kr"],
};
