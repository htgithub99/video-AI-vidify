import type { MotionStoryAnalysis } from "../types/motionVideo.js";
// The year a story takes place, read from the analysis's story period ("Hungary, April 1241", "thế kỷ 13", "5th century
// BC", "modern Saigon"), so the figure kit builds things as they were then. undefined when the period names no time.
const ROMAN: Record<string, number> = { I: 1, V: 5, X: 10, L: 50, C: 100 };
const roman = (text: string): number => [...text.toUpperCase()].reduce((sum, ch, i, all) => sum + ((ROMAN[all[i + 1]] || 0) > ROMAN[ch] ? -ROMAN[ch] : ROMAN[ch]), 0);
// Whole words in any script (\b only knows ASCII letters, so "trung cổ" would never end a word).
const word = (body: string): RegExp => new RegExp(`(?<![\\p{L}\\d])(?:${body})(?![\\p{L}\\d])`, "iu");
const BEFORE_YEAR = word("(\\d{1,4})\\s*(?:b\\.?\\s?c\\.?e?\\.?|tcn|trước công nguyên)");
const BEFORE = word("b\\.?\\s?c\\.?e?\\.?|tcn|trước công nguyên");
const CENTURY = word("(\\d{1,2})(?:st|nd|rd|th)?\\s*century|thế kỷ\\s*(\\d{1,2}|[ivxlc]+)");
const YEAR = word("(\\d{3,4})s?");
const WORDS: [RegExp, number][] = [
  [word("modern|contemporary|present[- ]day|today|hiện đại|đương đại|ngày nay"), 2000],
  [word("world war ii|ww2|wwii|thế chiến (?:thứ )?(?:hai|2|ii)"), 1942],
  [word("world war i|ww1|wwi|thế chiến (?:thứ )?(?:nhất|1|i)"), 1916],
  [word("medieval|middle ages|trung cổ|trung đại"), 1200],
  [word("ancient|antiquity|cổ đại"), -300],
  [word("stone age|prehistoric|tiền sử|đồ đá"), -5000],
];
export const motionEraYear = (period?: string): number | undefined => {
  const text = typeof period === "string" ? period : "";
  if (!text.trim()) return undefined;
  const before = BEFORE_YEAR.exec(text);
  if (before) return -Number(before[1]);
  const sign = BEFORE.test(text) ? -1 : 1;
  const year = YEAR.exec(text);
  if (year) return sign * Number(year[1]);
  const century = CENTURY.exec(text);
  if (century) {
    const n = century[1] ? Number(century[1]) : /^\d+$/.test(century[2]) ? Number(century[2]) : roman(century[2]);
    if (n > 0 && n <= 21) return sign * (n * 100 - 50);
  }
  return WORDS.find(([words]) => words.test(text))?.[1];
};
export const motionAnalysisEraYear = (analysis?: Pick<MotionStoryAnalysis, "era" | "videoDna"> | null): number | undefined => motionEraYear(analysis?.era) ?? motionEraYear(analysis?.videoDna?.era?.storyPeriod);
