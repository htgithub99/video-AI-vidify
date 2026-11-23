import _ from "lodash";
import { REUP_NARRATION, REUP_SPANS } from "../constants/reupConfig.js";
import { mergeSpans, spanLength, subtractSpans } from "./reupTimeline.js";
import { reupSameSource } from "./reupAdvice.js";
import type { ReupOutputResult, ReupJob, ReupReport, ReupReportLevel, ReupScoreGap } from "../types/reup.js";
export const REUP_CHECK = { NARRATED_RISK: 0.35, NARRATED_REVIEW: 0.5, SILENT_REVIEW: 12, SILENT_OK: 8, PADDING_REVIEW: 0.45, SIMILAR_REVIEW: 0.2, SIMILAR_RISK: 0.4, NGRAM: 3, VALUE_MIN: 0.6 } as const;
export const REUP_SCORE: Record<ReupScoreGap, number> = { coverage: 25, value: 20, highlights: 10, silence: 5, shot: 5, source: 10, similar: 15, angle: 10 };
export const REUP_SCORE_LIMIT = { SHOT_OK: 12, SHOT_SPAN: 18, SHARE_HIGH: 0.85, SHARE_FACTOR: 0.6 } as const;
const RANK: Record<ReupReportLevel, number> = { ok: 0, review: 1, risk: 2 };
const NO_SPACES = /[\u3040-\u30ff\u3400-\u9fff]/;
export const reupTextGrams = (text: string): Set<string> => {
  const words = text
    .toLowerCase()
    .normalize("NFC")
    .replace(/[^\p{L}\p{N}\s]+/gu, " ")
    .split(/\s+/)
    .filter(Boolean);
  const units = NO_SPACES.test(text) ? [...text.replace(/[\s\p{P}\p{S}]+/gu, "")] : words;
  return new Set(_.range(Math.max(0, units.length - REUP_CHECK.NGRAM + 1)).map((i) => units.slice(i, i + REUP_CHECK.NGRAM).join(" ")));
};
const spansOf = (outputs: ReupOutputResult[]) => mergeSpans(outputs.flatMap((o) => (o.spans || []).map(([start, end]) => ({ start, end }))));
export const reupSpanOverlap = (mine: ReupOutputResult[], past: ReupOutputResult[]): number => {
  const own = spansOf(mine);
  const length = spanLength(own);
  return length ? _.round(1 - spanLength(subtractSpans(own, spansOf(past))) / length, 2) : 0;
};
export const reupTextSimilarity = (a: string, b: string): number => {
  const x = reupTextGrams(a);
  const y = reupTextGrams(b);
  if (!x.size || !y.size) return 0;
  let both = 0;
  x.forEach((g) => y.has(g) && both++);
  return both / (x.size + y.size - both);
};
const scriptText = (job: Pick<ReupJob, "script">): string => (job.script?.outputs || []).flatMap((o) => o.sections.map((s) => s.text)).join(" ");
const titles = (job: Pick<ReupJob, "package">): string[] => (job.package?.options || []).map((o) => o.title.trim().toLowerCase()).filter(Boolean);
export const reupReport = (job: ReupJob, past: ReupJob[]): ReupReport => {
  const notes: ReupReport["notes"] = [];
  const add = (code: ReupReport["notes"][number]["code"], level: ReupReportLevel, value?: string | number) => notes.push({ code, level, ...(value !== undefined ? { value: String(value) } : {}) });
  const total = _.sumBy(job.outputs, "duration");
  const narrated = total ? _.round(_.sumBy(job.outputs, (o) => o.narrated ?? o.duration) / total, 2) : 0;
  const silentMax = _.max(job.outputs.map((o) => o.silentMax || 0)) || 0;
  const padding = total ? _.sumBy(job.outputs, (o) => o.padding || 0) / total : 0;
  add("narration", narrated < REUP_CHECK.NARRATED_RISK ? "risk" : narrated < REUP_CHECK.NARRATED_REVIEW ? "review" : "ok", Math.round(narrated * 100));
  if (silentMax > REUP_CHECK.SILENT_REVIEW) add("silence", "review", Math.round(silentMax));
  if (padding > REUP_CHECK.PADDING_REVIEW) add("padding", "review", Math.round(padding * 100));
  if (job.outputs.some((o) => o.repeated)) add("repeated", "review");
  if (job.settings.natural === "off" && job.source?.hasAudio && job.source.kind === "video") add("naturalOff", "ok");
  const others = past.filter((p) => p.id !== job.id);
  const sameSource = others.filter((p) => p.outputs.length > 0 && reupSameSource(job, p));
  if (sameSource.length) add("sourceReused", job.rights === "own" ? "review" : "risk", sameSource.length);
  const overlap = reupSpanOverlap(
    job.outputs,
    sameSource.flatMap((p) => p.outputs),
  );
  if (overlap >= REUP_SPANS.OVERLAP_REVIEW) add("overlap", "review", Math.round(overlap * 100));
  const voiced = total ? _.sumBy(job.outputs, (o) => (o.voiced ?? o.narrated ?? o.duration) + (o.talk || 0)) / total : 0;
  const coverage = !job.settings.narratedMin ? 1 : Math.min(1, voiced / Math.max(0.01, job.settings.narratedMin - REUP_NARRATION.COVER_SLACK));
  if (coverage < 1) add("coverage", "review", `${Math.round(voiced * 100)}|${Math.round(job.settings.narratedMin * 100)}`);
  const written = (job.script?.outputs || []).filter((o) => o.lang === job.script?.outputs[0].lang);
  const cued = written.flatMap((o) => o.sections.flatMap((s, i) => (s.role === "body" && s.cues?.length ? [{ cues: s.cues, n: String(i + 1) }] : [])));
  const bare = cued.flatMap(({ cues, n }) => (cues.some((c) => c.value) ? [] : [n]));
  const value = !cued.length ? 1 : 1 - bare.length / cued.length;
  if (bare.length && value < 1) add("describes", value < REUP_CHECK.VALUE_MIN ? "review" : "ok", bare.join(", "));
  const text = scriptText(job);
  const best = text ? _.max(others.map((p) => reupTextSimilarity(text, scriptText(p)))) || 0 : 0;
  if (best >= REUP_CHECK.SIMILAR_REVIEW) add("similar", best >= REUP_CHECK.SIMILAR_RISK ? "risk" : "review", Math.round(best * 100));
  const used = new Set(others.flatMap(titles));
  const echoed = titles(job).filter((t) => used.has(t));
  if (echoed.length) add("titleReused", "review", echoed.length);
  if (!job.settings.angle.trim()) add("noAngle", "review");
  const revision = job.script?.revision;
  if (revision?.words) add("extended", "ok", revision.words.join("|"));
  if (revision?.rewritten) add("rewritten", "ok", revision.rewritten);
  if (job.rights === "licensed") add("licensed", "ok");
  if (job.outputs.length > 1 && new Set(job.script?.outputs.map((o) => o.lang)).size > 1) add("bilingual", "review");
  const marks = _.sumBy(job.outputs, (o) => o.highlights || 0);
  const parts: Record<ReupScoreGap, number> = {
    coverage,
    value,
    highlights: marks ? 1 : 0,
    silence: _.clamp(1 - (silentMax - REUP_CHECK.SILENT_OK) / REUP_CHECK.SILENT_REVIEW, 0, 1),
    shot: _.clamp(1 - ((_.max(job.outputs.map((o) => o.longestShot || 0)) || 0) - REUP_SCORE_LIMIT.SHOT_OK) / REUP_SCORE_LIMIT.SHOT_SPAN, 0, 1),
    source: (sameSource.length ? (job.rights === "own" ? 0.5 : 0) : 1) * ((_.max(job.outputs.map((o) => o.sourceShare || 0)) || 0) > REUP_SCORE_LIMIT.SHARE_HIGH ? REUP_SCORE_LIMIT.SHARE_FACTOR : 1),
    similar: _.clamp(1 - best / REUP_CHECK.SIMILAR_RISK, 0, 1),
    angle: job.settings.angle.trim() ? 1 : 0,
  };
  const score = Math.round(_.sum(_.map(parts, (v, k) => v * REUP_SCORE[k as ReupScoreGap])));
  const gaps = _.sortBy(
    (Object.keys(parts) as ReupScoreGap[]).filter((k) => parts[k] < 0.95),
    (k) => -(1 - parts[k]) * REUP_SCORE[k],
  );
  return { level: _.maxBy(notes, (n) => RANK[n.level])?.level || "ok", narrated, silentMax: _.round(silentMax, 1), score, gaps, notes };
};
