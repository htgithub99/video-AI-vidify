import { MOTION_SPOKEN_NUMBERS as N } from "../constants/motionSpokenNumbers.js";
import type { MotionBeat } from "../types/motionVideo.js";
import { motionLanguage } from "./motionLanguage.js";
const groupEn = (n: number): string => (n < 20 ? N.EN[n] : n < 100 ? [N.TENS[Math.floor(n / 10)], n % 10 ? N.EN[n % 10] : ""].filter(Boolean).join(" ") : [N.EN[Math.floor(n / 100)], N.HUNDRED.en, n % 100 ? groupEn(n % 100) : ""].filter(Boolean).join(" "));
const groupVi = (n: number, padded = false): string => {
  const h = Math.floor(n / 100),
    t = Math.floor((n % 100) / 10),
    u = n % 10;
  return [h || padded ? N.VI[h] + " " + N.HUNDRED.vi : "", t > 1 ? N.VI[t] + " " + N.TENS_VI : t === 1 ? N.TEN : u && (h || padded) ? N.ZERO_VI : "", u ? (t > 1 && u === 1 ? N.ONE_VI : t && u === 5 ? N.FIVE_VI : N.VI[u]) : ""].filter(Boolean).join(" ");
};
export const motionSpokenInteger = (value: string, language: string): string => {
  const vi = /^vi/i.test(language),
    number = Number(value);
  if (!Number.isSafeInteger(number) || number < 0 || value.length > 15 || (value.length > 1 && value[0] === "0")) return value;
  if (!number) return vi ? N.VI[0] : N.EN[0];
  let remaining = number,
    scale = 0;
  const parts: string[] = [];
  while (remaining) {
    const group = remaining % 1000;
    if (group) parts.unshift([vi ? groupVi(group, remaining >= 1000 && group < 100) : groupEn(group), N.SCALES[vi ? "vi" : "en"][scale]].filter(Boolean).join(" "));
    remaining = Math.floor(remaining / 1000);
    scale++;
  }
  return parts.join(" ");
};
export const normalizeMotionSpokenText = (value: string, language: string, knownNames: string[] = []): string => {
  if (motionLanguage(language).numbers !== N.SPOKEN) return value;
  const protectedValues: string[] = [];
  let result = /^vi/i.test(language) ? value : value.replace(/\b\d{1,3}(?:,\d{3})+\b/g, (match) => motionSpokenInteger(match.replaceAll(",", ""), language));
  if (!/^vi/i.test(language))
    result = result.replace(N.MONTH_DAY, (match, month: string, day: string, year?: string) => {
      if (Number(day) < 1 || Number(day) > 31) return match;
      return [N.MONTHS.find((item) => item.toLowerCase() === month.toLowerCase()), N.THE, N.ORDINAL[Number(day)], year ? motionSpokenInteger(year, language) : ""].filter(Boolean).join(" ");
    });
  result = result.replace(N.PROTECTED, (match) => {
    protectedValues.push(match);
    return "\uE000" + String.fromCharCode(0xe100 + protectedValues.length - 1) + "\uE001";
  });
  result = result.replace(N.INTEGER, (number) => motionSpokenInteger(number, language));
  for (const name of new Set(knownNames)) {
    const regnal = name.trim().match(N.REGNAL_NAME);
    const number = regnal ? N.ROMAN.findIndex((roman) => roman === regnal[2]) : -1;
    if (number < 1) continue;
    const pattern = new RegExp("(?<![\\p{L}\\p{N}_])" + name.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "(?![\\p{L}\\p{N}_])", "giu");
    result = result.replace(pattern, (match) => match.slice(0, -regnal![2].length).trimEnd() + " " + (/^vi/i.test(language) ? N.THU + " " + motionSpokenInteger(String(number), language) : N.THE + " " + N.ORDINAL[number]));
  }
  return result.replace(/\uE000([\uE100-\uF8FF])\uE001/g, (_match, key: string) => protectedValues[key.charCodeAt(0) - 0xe100]);
};
export const normalizeMotionSpokenBeat = <T extends Pick<MotionBeat, "narration" | "utterances">>(beat: T, language: string, knownNames: string[] = []): T => {
  const narration = normalizeMotionSpokenText(beat.narration, language, knownNames);
  const utterances = Array.isArray(beat.utterances) ? beat.utterances.map((line) => ({ ...line, text: typeof line?.text === "string" ? normalizeMotionSpokenText(line.text, language, knownNames) : line?.text })) : undefined;
  return narration === beat.narration && utterances?.every((line, index) => line.text === beat.utterances![index].text) !== false ? beat : { ...beat, narration, ...(utterances ? { utterances } : {}) };
};
