import _ from "lodash";
import type { ReupJob, ReupReport, ReupReportLevel } from "../types/reup.js";
/** Thresholds of the upload check (shares are of the video's length). */
export const REUP_CHECK = { NARRATED_RISK: 0.35, NARRATED_REVIEW: 0.5, SILENT_REVIEW: 12, PADDING_REVIEW: 0.45, SIMILAR_REVIEW: 0.2, SIMILAR_RISK: 0.4, NGRAM: 3 } as const;
const RANK: Record<ReupReportLevel, number> = { ok: 0, review: 1, risk: 2 };
const grams = (text: string): Set<string> => {
  const words = text.toLowerCase().normalize("NFC").replace(/[^\p{L}\p{N}\s]+/gu, " ").split(/\s+/).filter(Boolean);
  // Scripts without spaces (Japanese) compare by characters.
  const units = words.length * 4 < text.length ? [...text.replace(/\s+/g, "")] : words;
  return new Set(_.range(Math.max(0, units.length - REUP_CHECK.NGRAM + 1)).map((i) => units.slice(i, i + REUP_CHECK.NGRAM).join(" ")));
};
/** How much two scripts share (Jaccard over word 3-grams), 0 … 1. */
export const reupTextSimilarity = (a: string, b: string): number => {
  const x = grams(a);
  const y = grams(b);
  if (!x.size || !y.size) return 0;
  let both = 0;
  x.forEach((g) => y.has(g) && both++);
  return both / (x.size + y.size - both);
};
const scriptText = (job: Pick<ReupJob, "script">): string => (job.script?.outputs || []).flatMap((o) => o.sections.map((s) => s.text)).join(" ");
const titles = (job: Pick<ReupJob, "package">): string[] => (job.package?.options || []).map((o) => o.title.trim().toLowerCase()).filter(Boolean);
/**
 * Upload check against YouTube's reused and inauthentic (mass-produced) content rules, from the edited videos and this
 * channel's earlier runs: how much carries our own words, silent filler, repeated footage, reused sources, scripts or
 * titles that echo earlier videos, and the notes the footage rights or video type call for.
 */
export const reupReport = (job: ReupJob, past: ReupJob[]): ReupReport => {
  const notes: ReupReport["notes"] = [];
  const add = (code: ReupReport["notes"][number]["code"], level: ReupReportLevel, value?: string | number) => notes.push({ code, level, ...(value !== undefined ? { value: String(value) } : {}) });
  const total = _.sumBy(job.outputs, "duration");
  const narrated = total ? _.round(_.sumBy(job.outputs, (o) => o.narrated ?? o.duration) / total, 2) : 0;
  const silentMax = _.max(job.outputs.map((o) => o.silentMax || 0)) || 0;
  const padding = total ? _.sumBy(job.outputs, (o) => o.padding || 0) / total : 0;
  const speech = job.script?.outputs.some((o) => o.speech);
  add("narration", narrated < REUP_CHECK.NARRATED_RISK ? "risk" : narrated < REUP_CHECK.NARRATED_REVIEW ? "review" : "ok", Math.round(narrated * 100));
  if (silentMax > REUP_CHECK.SILENT_REVIEW) add("silence", "review", Math.round(silentMax));
  if (padding > REUP_CHECK.PADDING_REVIEW) add("padding", "review", Math.round(padding * 100));
  if (job.outputs.some((o) => o.repeated)) add("repeated", "review");
  // Narrated footage with its own sound turned off: the quiet parts have only music; the sound makes them feel real.
  if (!speech && job.settings.natural === "off" && job.source?.hasAudio && job.source.kind === "video") add("naturalOff", "ok");
  const others = past.filter((p) => p.id !== job.id);
  const sameSource = others.filter((p) => job.fingerprint && p.fingerprint === job.fingerprint);
  if (sameSource.length) add("sourceReused", job.rights === "own" ? "review" : "risk", sameSource.length);
  const text = scriptText(job);
  if (text && !speech) {
    const best = _.max(others.map((p) => reupTextSimilarity(text, scriptText(p)))) || 0;
    if (best >= REUP_CHECK.SIMILAR_REVIEW) add("similar", best >= REUP_CHECK.SIMILAR_RISK ? "risk" : "review", Math.round(best * 100));
  }
  const used = new Set(others.flatMap(titles));
  const echoed = titles(job).filter((t) => used.has(t));
  if (echoed.length) add("titleReused", "review", echoed.length);
  if (!speech && !job.settings.angle.trim()) add("noAngle", "review");
  if (job.rights === "licensed") add("licensed", "ok");
  if (job.rights === "licensed" && job.script?.outputs.some((o) => o.kind === "short" && !o.speech)) add("shortsLicensed", "review");
  if (job.outputs.length > 1 && new Set(job.script?.outputs.map((o) => o.lang)).size > 1) add("bilingual", "review");
  return { level: _.maxBy(notes, (n) => RANK[n.level])?.level || "ok", narrated, silentMax: _.round(silentMax, 1), notes };
};
