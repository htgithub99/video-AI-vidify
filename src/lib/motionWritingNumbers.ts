import * as RT_MAINTENANCE from "../constants/runtime/maintenance.js";
import { MOTION_SPOKEN_NUMBERS as N } from "../constants/motionSpokenNumbers.js";
import { MOTION_WRITING as W } from "../constants/motionWriting.js";
import { motionSpokenInteger } from "./motionSpokenNumbers.js";
const small = new Map<string, number>([...N.EN.map((word, value) => [word, value] as [string, number]), ...N.TENS.flatMap((word, value) => (word ? [[word, value * 10] as [string, number]] : [])), ...N.VI.map((word, value) => [word, value] as [string, number]), [N.ONE_VI, 1], [N.FIVE_VI, 5], [N.TEN, 10]]);
const scales = new Map<string, number>([...N.SCALES.en.map((word, index) => [word, 1000 ** index] as [string, number]), ...N.SCALES.vi.map((word, index) => [word, 1000 ** index] as [string, number]), [RT_MAINTENANCE.NGAN, 1000]]);
const normalize = (text: string): string =>
  text
    .toLowerCase()
    .replace(/\b(?:a|an)(?=\s+(?:hundred|thousand|million|billion)\b)/gu, N.EN[1])
    .replace(/\band\b/gu, RT_MAINTENANCE.SPACE)
    .replace(/ngàn/gu, RT_MAINTENANCE.NGHIN)
    .replace(/linh/gu, N.ZERO_VI)
    .replace(/[-\s]+/gu, RT_MAINTENANCE.SPACE)
    .trim();
const words = [...new Set<string>([...small.keys(), ...scales.keys(), N.HUNDRED.en, N.HUNDRED.vi, N.TENS_VI, N.ZERO_VI, RT_MAINTENANCE.LINH, RT_MAINTENANCE.AND])].filter(Boolean).sort((a, b) => b.length - a.length);
const atom = RT_MAINTENANCE.D_D + words.join(RT_MAINTENANCE.PIPE_SEPARATOR) + RT_MAINTENANCE.CLOSE_PAREN;
const pattern = new RegExp(RT_MAINTENANCE.P_L_P_N_A_AN_HUNDRED_B_THOUSAND_B + atom + RT_MAINTENANCE.NAME_HONORIFIC_PREFIX + atom + RT_MAINTENANCE.P_L_P_N_4, RT_MAINTENANCE.GIU);
type Quantity = { value: number; raw: string; start: number; end: number };
export const motionWritingQuantities = (text: string): Quantity[] =>
  [...text.matchAll(pattern)].flatMap((match) => {
    const lead = match[0].match(N.LEAD_AND)?.[0].length || 0;
    const raw = match[0].slice(lead),
      start = match.index! + lead,
      end = start + raw.length;
    if (!raw) return [];
    if (/^\d/u.test(raw) && !raw.includes(RT_MAINTENANCE.SPACE)) {
      if (!/^\d+$|^\d{1,3}(?:[,.]\d{3})+$/u.test(raw)) return [];
      const value = Number(raw.replace(/[,.]/gu, ""));
      return Number.isSafeInteger(value) ? [{ value, raw, start, end }] : [];
    }
    let total = 0,
      group = 0;
    for (const word of normalize(raw).split(RT_MAINTENANCE.SPACE)) {
      if (small.has(word)) group += small.get(word)!;
      else if (word === N.HUNDRED.en || word === N.HUNDRED.vi) group *= 100;
      else if (word === N.TENS_VI) group = Math.floor(group / 100) * 100 + (group % 100) * 10;
      else if ((scales.get(word) || 0) >= 1000) {
        total += group * scales.get(word)!;
        group = 0;
      } else if (word !== N.ZERO_VI) return [];
    }
    const value = total + group;
    return Number.isSafeInteger(value) && [RT_MAINTENANCE.EN, RT_MAINTENANCE.VI].some((language) => normalize(motionSpokenInteger(String(value), language)) === normalize(raw)) ? [{ value, raw, start, end }] : [];
  });
const casualty = (text: string, quantity: Quantity): boolean => W.FIGURES.CASUALTY.test(text.slice(Math.max(0, quantity.start - 22), quantity.end + 55));
export const motionUnsupportedFigures = (text: string, source: string): string[] => {
  const sourceQuantities = motionWritingQuantities(source);
  const supports = (quantity: Quantity): boolean => sourceQuantities.some((other) => other.value === quantity.value);
  return motionWritingQuantities(text)
    .filter((quantity) => !W.FIGURES.AGE.test(text.slice(quantity.end)) && W.FIGURES.UNIT.test(text.slice(quantity.end)) && (!supports(quantity) || (casualty(text, quantity) && !sourceQuantities.some((other) => other.value === quantity.value && casualty(source, other)))))
    .map((quantity) => quantity.raw);
};
