import { MOTION_WRITING as W } from "../constants/motionWriting.js";
import { MOTION_SPOKEN_NUMBERS as N } from "../constants/motionSpokenNumbers.js";
import { motionWritingQuantities } from "./motionWritingNumbers.js";
const distance = (a: string, b: string): number => {
  const row = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i++) {
    let previous = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const current = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, previous + (a[i - 1] === b[j - 1] ? 0 : 1));
      previous = current;
    }
  }
  return row[b.length];
};
const indexCache = new Map<string, Map<string, string[]>>();
const vocabulary = (known: string): Map<string, string[]> => {
  const cached = indexCache.get(known);
  if (cached) return cached;
  const index = new Map<string, string[]>();
  for (const word of new Set(known.toLowerCase().match(W.FIGURES.NAME_WORD) || [])) {
    const key = word.slice(0, W.FIGURES.NAME_PREFIX);
    index.set(key, [...(index.get(key) || []), word]);
  }
  if (indexCache.size > 8) indexCache.clear();
  indexCache.set(known, index);
  return index;
};
const knownWord = (word: string, index: Map<string, string[]>): boolean => {
  const lower = word.toLowerCase();
  const list = index.get(lower.slice(0, W.FIGURES.NAME_PREFIX)) || [];
  return list.some((other) => other === lower || (lower.length >= W.FIGURES.NAME_MIN && distance(other, lower) <= (lower.length >= W.FIGURES.NAME_LONG ? W.FIGURES.NAME_FUZZY : 1)));
};
export const motionUnsupportedNames = (text: string, known: string, language: string): string[] => {
  if (W.FIGURES.NAME_CASELESS.test(language)) return [];
  const index = vocabulary(known);
  return [
    ...new Set(
      [...text.matchAll(W.FIGURES.NAME)].flatMap((match) => {
        const missing = (match[0].match(W.FIGURES.NAME_WORD) || []).filter((word) => word.length >= W.FIGURES.NAME_MIN && !W.FIGURES.NAME_STOP.test(word) && !knownWord(word, index));
        return missing.length ? [missing.join(" ")] : [];
      }),
    ),
  ];
};
const numberWords = new Set<string>([...N.EN, ...N.TENS, N.HUNDRED.en, ...N.SCALES.en].filter(Boolean).map((word) => word.toLowerCase()));
export const motionGarbledNumbers = (text: string): string[] =>
  (text.match(W.FIGURES.TOKEN) || [])
    .map((token) => token.replace(W.FIGURES.EDGE, ""))
    .filter((token) => W.FIGURES.GARBLED.test(token) && token.split(W.FIGURES.HYPHEN).every((part) => numberWords.has(part.toLowerCase())) && !motionWritingQuantities(token).some((quantity) => quantity.raw === token));
