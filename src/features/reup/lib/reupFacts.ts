import _ from "lodash";
import type { ReupSceneMap } from "../types/reup.js";
const NUMBER_WORDS = ["two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "twenty", "thirty", "hundred", "thousand", "million", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín", "mười", "trăm", "nghìn", "ngàn", "triệu"];
const UNIT = "(?:days?|weeks?|months?|years?|hours?|nights?|kg|kilos?|pounds?|lbs?|meters?|metres?|feet|foot|km|miles?|ngày|tuần|tháng|năm|giờ|đêm|cân|mét|cây số|con)";
const DIGIT_CLAIM = new RegExp(`\\b\\d+(?:[.,]\\d+)?\\s*${UNIT}?`, "giu");
const WORD_CLAIM = new RegExp(`(?<![\\p{L}])(${NUMBER_WORDS.join("|")})\\s+${UNIT}(?![\\p{L}])`, "giu");
const norm = (text: string): string => text.toLowerCase().normalize("NFC").replace(/\s+/g, " ");
export const reupUnbackedClaims = (text: string, map: Pick<ReupSceneMap, "summary" | "segments">, note = ""): string[] => {
  const allowed = norm([map.summary, note, ...map.segments.map((s) => s.what)].join(" "));
  const claims = [...(text.match(DIGIT_CLAIM) || []), ...(text.match(WORD_CLAIM) || [])].map((c) => norm(c).trim()).filter((c) => /\p{L}/u.test(c) || /\d{2,}/.test(c));
  return _.uniq(claims.filter((claim) => !allowed.includes(claim) && !allowed.includes(claim.replace(/\s*\p{L}+.*$/u, "").trim() + " ")));
};
