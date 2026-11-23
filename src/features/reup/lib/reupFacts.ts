import _ from "lodash";
import type { ReupSceneMap } from "../types/reup.js";
const NUMBER_WORDS = ["two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "twenty", "thirty", "hundred", "thousand", "million", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín", "mười", "trăm", "nghìn", "ngàn", "triệu"];
const UNIT = "(?:days?|weeks?|months?|years?|hours?|nights?|kg|kilos?|pounds?|lbs?|meters?|metres?|feet|foot|km|miles?|ngày|tuần|tháng|năm|giờ|đêm|cân|mét|cây số|con)";
const DIGIT_CLAIM = new RegExp(`\\b\\d+(?:[.,]\\d+)?\\s*${UNIT}?`, "giu");
const WORD_CLAIM = new RegExp(`(?<![\\p{L}])(${NUMBER_WORDS.join("|")})\\s+${UNIT}(?![\\p{L}])`, "giu");
const OVERNIGHT = /(?<![\p{L}])(overnight|one night|qua đêm|một đêm|1 đêm|1 night)(?![\p{L}])/iu;
const ONE_NIGHT = "1 đêm 1 night một đêm one night";
const norm = (text: string): string => text.toLowerCase().normalize("NFC").replace(/\s+/g, " ");
export const reupUnbackedClaims = (text: string, map: Pick<ReupSceneMap, "summary" | "segments">, note = ""): string[] => {
  const base = norm([map.summary, note, ...map.segments.map((s) => s.what)].join(" "));
  const allowed = OVERNIGHT.test(base) ? `${base} ${ONE_NIGHT} ` : base;
  const claims = [...(text.match(DIGIT_CLAIM) || []), ...(text.match(WORD_CLAIM) || [])].map((c) => norm(c).trim()).filter((c) => /\p{L}/u.test(c) || /\d{2,}/.test(c));
  return _.uniq(claims.filter((claim) => !allowed.includes(claim) && !allowed.includes(claim.replace(/\s*\p{L}+.*$/u, "").trim() + " ")));
};
const SNOW = ["snow", "snowy", "snowfall", "blizzard", "winter", "tuyết", "mùa đông"];
export const REUP_CLAIM_GROUPS: readonly { say: readonly string[]; seen?: readonly string[] }[] = [
  { say: SNOW },
  { say: ["freezing", "frozen", "frost", "icy", "ice", "cold", "chill", "lạnh", "băng giá", "giá rét", "rét"], seen: SNOW },
  { say: ["storm", "thunder", "thunderstorm", "lightning", "bão", "sấm", "sét", "giông"] },
  { say: ["rain", "rainy", "downpour", "mưa"], seen: ["storm", "thunderstorm"] },
  { say: ["bear", "wolf", "wolves", "gấu", "sói"] },
  { say: ["flood", "lũ"] },
];
const has = (text: string, word: string): boolean => new RegExp(`(?<![\\p{L}])${word}(?![\\p{L}])`, "iu").test(text);
export const reupUsedEvidence = (map: Pick<ReupSceneMap, "segments">, cues: { segment: string; moment?: string }[]): string => {
  const byId = new Map(map.segments.map((g) => [g.id, g]));
  return norm(
    _.uniq(
      cues.flatMap((c) => {
        const g = byId.get(c.segment);
        if (!g) return [];
        const m = (g.moments || []).find((x) => x.id === c.moment);
        return [g.what, g.tags.join(" "), m?.what || ""];
      }),
    ).join(" "),
  );
};
export const reupStrayWords = (text: string, evidence: string): string[] =>
  _.uniq(
    REUP_CLAIM_GROUPS.flatMap((group) => {
      if ([...group.say, ...(group.seen || [])].some((w) => has(evidence, w))) return [];
      return group.say.filter((w) => has(norm(text), w));
    }),
  );
