import _ from "lodash";
import { REUP_MOMENT, REUP_UPLOAD } from "../constants/reupConfig.js";
import type { ReupBadRange, ReupMoment, ReupSceneMap, ReupSegment, ReupSheet } from "../types/reup.js";
import { mergeSpans, subtractSpans } from "./reupTimeline.js";
/** Images one request may carry for this AI route: the learned value wins when lower than the documented maximum. */
export const reupUploadLimit = (provider: string, mode: string, learned: Record<string, number> = {}): number => {
  if (mode === REUP_UPLOAD.API_MODE) return Number.MAX_SAFE_INTEGER;
  const documented = REUP_UPLOAD.MAX[provider] ?? 1;
  const known = learned[provider];
  return Math.max(1, known ? Math.min(known, documented) : documented);
};
/** Split sheets into requests: as many images per request as the route allows (count, or bytes for the API route). */
export const reupSheetBatches = <T extends Pick<ReupSheet, "index">>(sheets: T[], limit: number, sizes?: number[], byteLimit?: number): T[][] => {
  if (!byteLimit || !sizes) return _.chunk(sheets, Math.max(1, limit));
  const batches: T[][] = [];
  let current: T[] = [];
  let bytes = 0;
  sheets.forEach((sheet, i) => {
    const size = sizes[i] || 0;
    if (current.length && (bytes + size > byteLimit || current.length >= limit)) {
      batches.push(current);
      current = [];
      bytes = 0;
    }
    current.push(sheet);
    bytes += size;
  });
  if (current.length) batches.push(current);
  return batches;
};
/** Time covered by a sheet's tiles. */
export const reupSheetSpan = (sheet: Pick<ReupSheet, "start" | "interval" | "count">, duration: number): { start: number; end: number } => ({ start: sheet.start, end: Math.min(duration, sheet.start + sheet.interval * sheet.count) });
/** Turn per-second brightness/blur samples into merged bad ranges. */
export const reupBadRanges = (samples: { t: number; y: number; blur?: number }[], darkLevel: number, blurLevel: number, gap: number, minLength: number): ReupBadRange[] => {
  const pick = (reason: ReupBadRange["reason"], test: (s: { y: number; blur?: number }) => boolean) => {
    const sorted = _.sortBy(samples, "t");
    const spans = sorted.flatMap((s, i) => (test(s) ? [{ start: s.t, end: sorted[i + 1]?.t ?? s.t + 1 }] : []));
    return mergeSpans(spans, gap)
      .filter((s) => s.end - s.start >= minLength)
      .map((s) => ({ ...s, reason }));
  };
  const dark = darkLevel > 0 ? pick("dark", (s) => s.y < darkLevel) : [];
  const blur = blurLevel > 0 ? pick("blur", (s) => s.blur !== undefined && s.blur > blurLevel) : [];
  return _.sortBy([...dark, ...blur.flatMap((b) => subtractSpans([b], dark).map((s) => ({ ...s, reason: "blur" as const })))], "start");
};
const TAG_RE = /^[a-z][a-z-]{1,23}$/;
const time = (value: unknown): number => {
  if (typeof value === "number") return value;
  const text = String(value ?? "").trim();
  const parts = text.split(":").map(Number);
  if (parts.length > 1 && parts.every(Number.isFinite)) return parts.reduce((acc, n) => acc * 60 + n, 0);
  return Number(text);
};
export interface ReupScenePart {
  span: { start: number; end: number };
  segments: ReupSegment[];
  hook: string[];
  ending: string;
  thumbnails: number[];
  summary: string;
}
/**
 * A scene's moments from the AI: inside the scene (clear of its last half second), off dark or blurry footage, on a
 * contact-sheet tile's time (`interval`), at least MIN_GAP apart, at most MAX per scene. Ids are given after merging.
 */
const cleanMoments = (raw: unknown, start: number, end: number, bad: ReupBadRange[], interval: number, value: number): Omit<ReupMoment, "id">[] => {
  const out: Omit<ReupMoment, "id">[] = [];
  for (const item of _.sortBy(_.castArray(raw || []), (m: any) => time(m?.t))) {
    let t = time((item as any)?.t);
    if (!Number.isFinite(t)) continue;
    if (interval > 0) t = Math.round(t / interval) * interval;
    t = _.round(_.clamp(t, start, Math.max(start, end - REUP_MOMENT.END_GAP)), 2);
    if (bad.some((b) => t >= b.start && t < b.end)) continue;
    if (out.some((m) => Math.abs(m.t - t) < REUP_MOMENT.MIN_GAP)) continue;
    const what = _.truncate(String((item as any)?.what || "").trim(), { length: 140 });
    if (!what) continue;
    out.push({ t, what, pull: _.clamp(Math.round(Number((item as any)?.pull) || value), 1, 5) });
  }
  return out.slice(0, REUP_MOMENT.MAX);
};
/**
 * Moments of a scene: the map's own, or (maps from before moments) one every EVEN_STEP seconds with the scene's line.
 * Ids are the scene's id plus "m" and a number, so a script can only point at moments that exist.
 */
export const reupMoments = (segment: ReupSegment): ReupMoment[] => {
  if (segment.moments?.length) return segment.moments;
  const n = Math.max(1, Math.floor((segment.end - segment.start) / REUP_MOMENT.EVEN_STEP));
  return _.range(n).map((k) => ({ id: `${segment.id}m${k + 1}`, t: _.round(segment.start + k * REUP_MOMENT.EVEN_STEP, 2), what: segment.what, pull: segment.value }));
};
/** Validate one AI answer: times must sit inside the batch, segments may not be mostly bad footage, unknown ids are dropped. */
export const cleanScenePart = (raw: any, span: { start: number; end: number }, bad: ReupBadRange[], prefix: string, interval = 0): ReupScenePart => {
  const segments: ReupSegment[] = [];
  const ids = new Map<string, string>();
  for (const item of _.castArray(raw?.segments || [])) {
    const start = _.clamp(time(item?.start), span.start, span.end);
    const end = _.clamp(time(item?.end), span.start, span.end);
    if (!Number.isFinite(start) || !Number.isFinite(end) || end - start < 1) continue;
    const good = subtractSpans([{ start, end }], bad);
    if (_.sumBy(good, (g) => g.end - g.start) < (end - start) * 0.4) continue;
    const what = _.truncate(String(item?.what || "").trim(), { length: 220 });
    if (!what) continue;
    const id = `${prefix}${segments.length + 1}`;
    ids.set(String(item?.id ?? ""), id);
    const focusX = Number(item?.focusX);
    const caption = _.truncate(String(item?.caption || "").trim(), { length: 60 });
    const value = _.clamp(Math.round(Number(item?.value) || 1), 1, 5);
    const moments = cleanMoments(item?.moments, start, end, bad, interval, value).map((m, k) => ({ ...m, id: `${id}m${k + 1}` }));
    segments.push({ id, start: _.round(start, 2), end: _.round(end, 2), what, ...(moments.length ? { moments } : {}), tags: _.uniq(_.castArray(item?.tags || []).map((t: unknown) => String(t).toLowerCase().trim()).filter((t: string) => TAG_RE.test(t))).slice(0, 6), value, ...(Number.isFinite(focusX) ? { focusX: _.clamp(focusX, 0, 1) } : {}), ...(caption ? { caption } : {}) });
  }
  const mapId = (value: unknown): string | undefined => ids.get(String(value ?? ""));
  return {
    span,
    segments,
    hook: _.compact(_.castArray(raw?.hook || []).map(mapId)),
    ending: mapId(raw?.ending) || "",
    thumbnails: _.castArray(raw?.thumbnails || [])
      .map(time)
      .filter((t: number) => Number.isFinite(t) && t >= span.start && t <= span.end && !bad.some((b) => t >= b.start && t <= b.end)),
    summary: _.truncate(String(raw?.summary || "").trim(), { length: 600 }),
  };
};
/** Join batch answers in time order; overlapping segments at batch borders are trimmed, ids renumbered s1..sN. */
export const mergeSceneParts = (parts: ReupScenePart[]): ReupSceneMap => {
  const ordered = _.sortBy(parts, (p) => p.span.start);
  const rename = new Map<string, string>();
  const segments: ReupSegment[] = [];
  for (const segment of _.sortBy(ordered.flatMap((p) => p.segments), "start")) {
    const last = _.last(segments);
    const start = last && segment.start < last.end ? last.end : segment.start;
    if (segment.end - start < 1) {
      if (last) rename.set(segment.id, last.id);
      continue;
    }
    const id = `s${segments.length + 1}`;
    rename.set(segment.id, id);
    // A segment trimmed at a batch border loses the moments before its new start; moment ids follow the new scene id.
    const moments = (segment.moments || []).filter((m) => m.t >= start).map((m, k) => ({ ...m, id: `${id}m${k + 1}` }));
    segments.push({ ..._.omit(segment, "moments"), id, start, ...(moments.length ? { moments } : {}) });
  }
  const hook = _.uniq(_.compact(ordered.flatMap((p) => p.hook).map((id) => rename.get(id))));
  const endings = _.compact(ordered.map((p) => rename.get(p.ending)));
  const best = _.orderBy(segments, ["value", "start"], ["desc", "desc"]);
  return {
    summary: ordered.map((p) => p.summary).filter(Boolean).join(" "),
    segments,
    hook: hook.length ? hook : best.slice(0, 4).map((s) => s.id),
    ending: _.last(endings) || _.last(segments)?.id || "",
    thumbnails: _.uniq(ordered.flatMap((p) => p.thumbnails).map((t) => _.round(t, 1))).slice(0, 12),
  };
};
