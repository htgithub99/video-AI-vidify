import _ from "lodash";
import { REUP_HOLD, REUP_LANG_UNIT, REUP_NARRATION, REUP_REVIEW } from "../constants/reupConfig.js";
import { REUP_CHECK, reupTextGrams, reupTextSimilarity } from "./reupCompliance.js";
import { reupPacing } from "./reupTimeline.js";
import type { ReupJobSettings, ReupLanguage, ReupOutputScript, ReupScript } from "../types/reup.js";
type Pace = Pick<ReupJobSettings, "targetSeconds" | "wordsPerSecond" | "natural" | "narratedMin">;
export interface ReupWordBudget {
  min: number;
  max: number;
  aim: number;
  rate: number;
  unit: string;
}
export interface ReupPastText {
  openings: string[];
  closings: string[];
  phrases: string[];
}
export interface ReupScriptIssues {
  short: { output: string; have: number; need: number; aim: number; unit: string; sections: number[] }[];
  repeats: { output: string; sentences: string[]; other?: string }[];
  bare: { output: string; sections: number[] }[];
  long: { output: string; sections: { n: number; have: number; cap: number }[] }[];
  similar: number;
}
export const reupHoldWords = (seconds: number, rate: number): number => Math.max(3, Math.round(seconds * REUP_HOLD.FOLDER_FACTOR * rate));
const CJK = /[぀-ヿ㐀-鿿가-힯]/;
export const reupUnits = (text: string, lang: ReupLanguage): number => (lang === "ja" ? text.replace(/[\s\p{P}\p{S}]+/gu, "").length : text.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length);
export const reupSentences = (text: string): string[] =>
  text
    .split(/(?<=[.!?…。！？])\s*|\n+/)
    .map((x) => x.trim())
    .filter(Boolean);
export const reupNarrationShare = (s: Pick<ReupJobSettings, "natural" | "narratedMin">, hasAudio = true, talk = 0): [number, number] => {
  const base = reupPacing(s.natural, hasAudio).share;
  const lo = Math.max(base[0], (s.narratedMin || 0) - talk);
  return [lo, _.clamp(Math.max(base[1], lo + REUP_NARRATION.HEADROOM), lo, Math.max(lo, REUP_NARRATION.SHARE_MAX))];
};
export const reupWordBudget = (s: Pace, lang: ReupLanguage, opts: { folder?: boolean; hasAudio?: boolean; talk?: number } = {}): ReupWordBudget => {
  const { factor, unit } = REUP_LANG_UNIT[lang];
  const mean = _.mean(s.wordsPerSecond);
  const [lo, hi] = opts.folder ? [1, 1] : reupNarrationShare(s, opts.hasAudio, opts.talk);
  const min = Math.round(s.targetSeconds * lo * (opts.folder ? s.wordsPerSecond[0] : mean) * factor);
  const max = Math.max(min, Math.round(s.targetSeconds * hi * s.wordsPerSecond[1] * factor));
  return { min, max, aim: Math.round((min + max) / 2), rate: mean * factor * hi, unit };
};
const outputText = (o: ReupOutputScript): string => o.sections.map((x) => x.text).join(" ");
export const reupPastText = (scripts: ReupScript[], lang: ReupLanguage): ReupPastText => {
  const outs = scripts.map((sc) => sc.outputs.filter((o) => !o.speech && o.lang === lang)).filter((o) => o.length);
  const first = (o?: ReupOutputScript) => reupSentences(o?.sections[0]?.text || "")[0];
  const last = (o?: ReupOutputScript) => _.last(reupSentences(_.last(o?.sections)?.text || ""));
  const openings = _.uniq(_.compact(outs.map((o) => first(o[0])))).slice(0, REUP_REVIEW.PAST_RUNS);
  const closings = _.uniq(_.compact(outs.map((o) => last(_.last(o))))).slice(0, REUP_REVIEW.PAST_RUNS);
  const counts = new Map<string, number>();
  for (const run of outs) {
    const text = run.map(outputText).join(" ");
    if (CJK.test(text)) continue;
    const words = text
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]+/gu, " ")
      .split(/\s+/)
      .filter(Boolean);
    const seen = new Set<string>();
    for (const n of REUP_REVIEW.GRAMS) for (let i = 0; i + n <= words.length; i++) seen.add(words.slice(i, i + n).join(" "));
    seen.forEach((g) => counts.set(g, (counts.get(g) || 0) + 1));
  }
  const ranked = _.orderBy(
    [...counts].filter(([g, n]) => n >= REUP_REVIEW.PHRASE_RUNS && g.replace(/\s/g, "").length >= REUP_REVIEW.PHRASE_LETTERS),
    [([, n]) => n, ([g]) => g.split(" ").length],
    ["desc", "desc"],
  );
  const phrases: string[] = [];
  for (const [g] of ranked) if (phrases.length < REUP_REVIEW.PHRASES && !phrases.some((p) => p.includes(g) || g.includes(p))) phrases.push(g);
  return { openings, closings, phrases };
};
const overlap = (sentence: string, pool: Set<string>): number => {
  const g = reupTextGrams(sentence);
  if (!g.size) return 0;
  let hit = 0;
  g.forEach((x) => pool.has(x) && hit++);
  return hit / g.size;
};
const echoes = (o: ReupOutputScript, pool: Set<string>): string[] => (pool.size ? _.flatMap(o.sections, (x) => reupSentences(x.text)).filter((t) => reupUnits(t, o.lang || "en") >= REUP_REVIEW.SENTENCE_UNITS && overlap(t, pool) >= REUP_REVIEW.SENTENCE_OVERLAP) : []);
const VALUE_ROLES = new Set(["body"]);
export const reupScriptReview = (script: ReupScript, input: { settings: Pace & Pick<ReupJobSettings, "language">; folder?: boolean; hasAudio?: boolean; talk?: number; scenes?: Record<string, number>; past: string[] }): ReupScriptIssues => {
  const issues: ReupScriptIssues = { short: [], repeats: [], bare: [], long: [], similar: 0 };
  const written = script.outputs.filter((o) => !o.speech);
  const main = input.settings.language;
  const pastPool = new Set(input.past.flatMap((t) => [...reupTextGrams(t)]));
  let quotes = 0;
  written.forEach((o, i) => {
    const lang = o.lang || main;
    const budget = reupWordBudget(input.settings, lang, input);
    const have = reupUnits(outputText(o), lang);
    const scenes = input.folder ? input.scenes : undefined;
    const cap = (seconds: number) => reupHoldWords(seconds, budget.rate);
    const need = scenes ? Math.min(budget.min, _.sum(Object.values(scenes).map(cap))) : budget.min;
    if (scenes) {
      const over = o.sections.flatMap((x, k) => {
        const room = _.sumBy(x.cues || [], (c) => cap(scenes[c.segment] || 0));
        const n = reupUnits(x.text, lang);
        return room && n > room * REUP_HOLD.OVER ? [{ n: k + 1, have: n, cap: room }] : [];
      });
      if (over.length) issues.long.push({ output: o.id, sections: over });
    }
    if (have < need * REUP_NARRATION.SHORT_OK) {
      const open = o.sections.map((x, k) => ({ k: k + 1, role: x.role, n: reupUnits(x.text, lang) })).filter((x) => x.role === "body" || x.role === "ending");
      issues.short.push({ output: o.id, have, need, aim: need < budget.min ? need : budget.aim, unit: budget.unit, sections: _.sortBy(_.sortBy(open, "n").slice(0, REUP_REVIEW.EXTEND_SECTIONS), "k").map((x) => x.k) });
    }
    const left = REUP_REVIEW.QUOTES - quotes;
    const past = left > 0 ? echoes(o, pastPool).slice(0, left) : [];
    if (past.length) issues.repeats.push({ output: o.id, sentences: past });
    quotes += past.length;
    for (const prev of written.slice(0, i).filter((p) => (p.lang || main) === lang && o.kind === "short")) {
      const room = REUP_REVIEW.QUOTES - quotes;
      const twin = room > 0 ? echoes(o, reupTextGrams(outputText(prev))).slice(0, room) : [];
      if (twin.length) issues.repeats.push({ output: o.id, sentences: twin, other: prev.id });
      quotes += twin.length;
    }
    if (lang !== main) return;
    issues.similar = Math.max(issues.similar, _.max(input.past.map((t) => reupTextSimilarity(outputText(o), t))) || 0);
    const valued = (k: number) => o.sections[k].cues?.some((c) => c.value);
    if (o.kind === "short") {
      if (o.sections.some((x) => x.cues?.length) && !o.sections.some((_x, k) => valued(k))) issues.bare.push({ output: o.id, sections: [1] });
      return;
    }
    const bare = o.sections.flatMap((x, k) => (VALUE_ROLES.has(x.role) && x.cues?.length && !valued(k) ? [k + 1] : []));
    if (bare.length) issues.bare.push({ output: o.id, sections: bare });
  });
  return issues;
};
export const reupIssueScore = (issues: ReupScriptIssues): number => _.sumBy(issues.short, (x) => ((x.need - x.have) / Math.max(1, x.need)) * REUP_REVIEW.SHORT_WEIGHT) + _.sumBy(issues.repeats, (x) => x.sentences.length) + _.sumBy(issues.bare, (x) => x.sections.length) + _.sumBy(issues.long, (x) => x.sections.length) + issues.similar * REUP_REVIEW.SHORT_WEIGHT;
export const reupNeedsRevision = (issues: ReupScriptIssues): boolean => issues.short.length > 0 || issues.long.length > 0 || issues.similar >= REUP_CHECK.SIMILAR_REVIEW || issues.repeats.some((x) => x.other) || _.sumBy(issues.repeats, (x) => x.sentences.length) >= REUP_REVIEW.REWRITE_MIN;
