import type { MotionLanguageProfile } from "./types.js";
export const EN_LANGUAGE: MotionLanguageProfile = {
  code: "en",
  label: { vi: "Tiếng Anh", en: "English" },
  promptName: "English",
  unit: { promptName: "words" },
  rate: { narration: 2.4, dialogue: 2.6 },
  numbers: "spoken",
  markers: { viewer: /\byou(r|rs|rself)?\b/i, perception: /\bI (?:saw|see|heard|hear|watched|witnessed|knew)\b/i, outfit: /\b(?:puts? on|put on|changes? into|changed into|now wears?|wearing (?:a )?new|takes? off|took off|dressed (?:in|as)|disguis\w*|strips? off)\b/i },
  styleGuide: ["ENGLISH NARRATION: write natural, idiomatic English. Keep the possessive 's after names and nouns (Caesar's army, the enemy's flank). When the transcript is a machine translation or garbled, write fluent English from its meaning, never word for word."],
  reviewGuide: "",
  subtitle: { maxChars: 64, fontFamily: "Arial, sans-serif" },
  genreMaxUnits: { witness: 16, pov: 24, chronicle: 26, verdict: 28 },
  asrCode: "en",
  partTitle: (title: string, index: number, count: number): string => `${title} (Part ${index}/${count})`,
  aliases: ["english", "tiếng anh", "en-us", "en-gb"],
};
