import type { BornasLine } from "../../types/bornas.js";
// Years on screen must be said in the narration (as digits or as words), in that line or the two before it.
// A year from another moment (a tag "1864" on a line about 1880) is removed from the screen text: missing is better than wrong.
const VI = ["không", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín"];
const EN = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
const EN_TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
const viTwo = (n: number): string[] => {
  const t = Math.floor(n / 10), u = n % 10;
  if (n < 10) return [`lẻ ${VI[u]}`, `linh ${VI[u]}`, `không ${VI[u]}`];
  const unit = u === 0 ? [""] : u === 1 && t > 1 ? ["mốt", "một"] : u === 4 && t > 1 ? ["tư", "bốn"] : u === 5 ? ["lăm", "năm"] : [VI[u]];
  const tens = t === 1 ? ["mười"] : [`${VI[t]} mươi`, VI[t]];
  return tens.flatMap((a) => unit.map((b) => `${a} ${b}`.trim()));
};
const enTwo = (n: number): string[] => (n < 20 ? [EN[n], `oh ${EN[n]}`] : [`${EN_TENS[Math.floor(n / 10)]}${n % 10 ? `-${EN[n % 10]}` : ""}`, `${EN_TENS[Math.floor(n / 10)]}${n % 10 ? ` ${EN[n % 10]}` : ""}`]);
const said = (year: number, text: string): boolean => {
  const t = ` ${text.toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, " ").replace(/\s+/g, " ")} `;
  if (t.includes(` ${year} `) || t.includes(`'${year % 100}`)) return true;
  const two = year % 100;
  return [...viTwo(two), ...enTwo(two)].some((w) => w && t.includes(` ${w} `));
};
const YEAR = /\b(1[0-9]{3}|20[0-9]{2})\b/g;
export const checkScreenYears = (lines: BornasLine[]): { lines: BornasLine[]; removed: string[] } => {
  const removed: string[] = [];
  const out = lines.map((l, i) => {
    const near = lines.slice(Math.max(0, i - 2), i + 1).map((x) => x.text).join(" ");
    const strip = (s: string): string =>
      s.replace(YEAR, (y) => {
        if (said(Number(y), near)) return y;
        removed.push(`${i + 1}: ${y}`);
        return "";
      }).replace(/\s*[·•|,–-]\s*(?=$|[·•|,–-])/g, "").replace(/^\s*[·•|,–-]\s*|\s*[·•|,–-]\s*$/g, "").replace(/\s{2,}/g, " ").trim();
    const screen = strip(l.screen || ""), sub = strip(l.sub || "");
    const top = screen || sub, low = screen ? sub : "";
    return screen === (l.screen || "") && sub === (l.sub || "") ? l : { ...l, screen: top, sub: low, ...(top ? {} : { kind: "none" as BornasLine["kind"] }) };
  });
  return { lines: out, removed };
};
