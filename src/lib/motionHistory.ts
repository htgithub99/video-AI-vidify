import _ from "lodash";
import { MOTION_HISTORY as C } from "../constants/motionHistory.js";
import type { MotionBeat, MotionHud, MotionHudSegment } from "../types/motionVideo.js";
const text = (v: unknown, max: number): string | undefined => {
  const s = _.trim(_.toString(v ?? C.EMPTY));
  if (!s) return undefined;
  if (s.length <= max) return s;
  const cut = s.slice(0, max),
    space = cut.lastIndexOf(C.SPACE);
  return _.trimEnd(space > max * C.WORD_CUT_MIN ? cut.slice(0, space) : cut, C.TRIM_TAIL);
};
const color = (v: unknown): string | undefined => (typeof v === "string" && C.COLOR_RE.test(v) ? v : undefined);
const num = (v: unknown, min: number, max: number, fallback: number): number => {
  const value = _.toNumber(v);
  return _.isFinite(value) ? _.clamp(value, min, max) : fallback;
};
const items = <T>(raw: unknown, max: number, normalize: (value: any) => T | null | undefined): T[] => _.compact(_.map(_.take(_.castArray(raw || []), max), normalize));
const lonLat = (v: unknown): [number, number] | string | undefined => {
  if (Array.isArray(v) && v.length >= 2 && _.isFinite(+v[0]) && _.isFinite(+v[1])) return [_.clamp(+v[0], -180, 360), _.clamp(+v[1], -85, 85)];
  if (_.isPlainObject(v) && _.isFinite(+(v as any).lon) && _.isFinite(+(v as any).lat)) return [+(v as any).lon, +(v as any).lat];
  return text(_.isPlainObject(v) ? (v as any).name : v, C.MAP_TEXT_MAX);
};
const line = (v: unknown): ([number, number] | string)[] => items(v, C.MAP_LINE_POINTS_MAX, lonLat);
export const normalizeMotionHud = (raw: unknown): MotionHud | undefined => {
  if (!_.isPlainObject(raw)) return undefined;
  const r = raw as Record<string, unknown>;
  if (r.clear === true) return { clear: true };
  const hud: MotionHud = {};
  const counter = text(r.counter, C.HUD_TEXT_MAX),
    date = text(r.date, C.HUD_TEXT_MAX),
    label = text(r.label, C.HUD_TEXT_MAX);
  if (counter) hud.counter = counter;
  if (date) hud.date = date;
  if (label) hud.label = label;
  const bars = items(r.bars, C.HUD_BARS_MAX, (b) => {
    if (!_.isPlainObject(b)) return null;
    const label = text(b.label, C.HUD_LABEL_MAX),
      barColor = color(b.color);
    return label ? { label, value: num(b.value, 0, 100, 0), ...(barColor ? { color: barColor } : {}) } : null;
  });
  if (bars.length) hud.bars = bars;
  return _.isEmpty(hud) ? undefined : hud;
};
const nextHudState = (state: MotionHud, hud?: MotionHud): MotionHud => (hud ? (hud.clear ? {} : { ...state, ..._.omit(hud, C.HUD_CLEAR) }) : state);
export const motionHudStates = (beats: MotionBeat[]): MotionHud[] => {
  let state: MotionHud = {};
  return _.map(beats, (beat) => {
    state = nextHudState(state, beat.hud);
    return state;
  });
};
export const buildMotionHudTrack = (beats: MotionBeat[], starts: number[], total: number): MotionHudSegment[] => {
  const out: MotionHudSegment[] = [];
  let state: Omit<MotionHudSegment, "start" | "end"> = {};
  beats.forEach((beat, i) => {
    if (!beat.hud) return;
    state = nextHudState(state, beat.hud);
    const last = out[out.length - 1];
    if (last) last.end = Math.min(last.end, +starts[i].toFixed(3));
    if (!_.isEmpty(state)) out.push({ ...state, start: +starts[i].toFixed(3), end: +total.toFixed(3) });
  });
  return _.filter(out, (s) => s.end - s.start > 0.05);
};
export const motionGeomapParams = (d: Record<string, any>): Record<string, unknown> => {
  const region = _.toString(d.region).toLowerCase();
  return {
    title: text(d.title, C.TITLE_MAX) || C.EMPTY,
    date: text(d.date, C.HUD_TEXT_MAX),
    region: _.includes(C.REGIONS as readonly string[], region) ? region : C.DEFAULT_REGION,
    bbox: Array.isArray(d.bbox) && d.bbox.length === 4 && _.every(d.bbox, (x) => _.isFinite(+x)) ? _.map(d.bbox, Number) : undefined,
    sides: items(d.sides, C.MAP_SIDES_MAX, (s) => ({ name: text(s?.name, C.MAP_TEXT_MAX), color: color(s?.color), countries: items(s?.countries, C.MAP_ITEMS_MAX * 2, (c) => text(c, C.MAP_TEXT_MAX)) })),
    highlight: items(d.highlight, C.MAP_ITEMS_MAX, (c) => text(c, C.MAP_TEXT_MAX)),
    cities: items(d.cities, C.MAP_ITEMS_MAX, (c) => {
      const where = lonLat(_.isPlainObject(c) && (c.lon != null || Array.isArray(c.at)) ? (Array.isArray(c.at) ? c.at : c) : _.isPlainObject(c) ? c.name : c);
      if (!where) return null;
      return { ...(Array.isArray(where) ? { lon: where[0], lat: where[1] } : { name: where }), label: text(_.isPlainObject(c) ? c.label || c.name : c, C.MAP_TEXT_MAX), capital: _.isPlainObject(c) && c.capital === true };
    }),
    fronts: items(d.fronts, C.MAP_FRONTS_MAX, (f) => {
      if (!_.isPlainObject(f)) return null;
      const from = line(f.line || f.from),
        to = line(f.to);
      return from.length >= 2 ? { line: from, to: to.length >= 2 ? to : undefined, color: color(f.color), flip: f.flip === true } : null;
    }),
    arrows: items(d.arrows, C.MAP_ARROWS_MAX, (a) => {
      if (!_.isPlainObject(a)) return null;
      const from = lonLat(a.from),
        to = lonLat(a.to);
      return from && to ? { from, to, label: text(a.label, C.MAP_TEXT_MAX), color: color(a.color) } : null;
    }),
    labels: items(d.labels, C.MAP_ITEMS_MAX, (l) => {
      if (!_.isPlainObject(l)) return null;
      const label = text(l.text, C.MAP_TEXT_MAX),
        at = lonLat(l.at ?? (l.lon != null ? [l.lon, l.lat] : undefined));
      return label && at ? { text: label, at, big: l.big === true, color: color(l.color) } : null;
    }),
    zoomTo: d.zoomTo != null ? lonLat(d.zoomTo) : undefined,
    zoom: num(d.zoom, C.MAP_ZOOM_MIN, C.MAP_ZOOM_MAX, 2.5),
  };
};
const tone = (v: unknown): string => {
  const value = _.toString(v);
  return _.includes(C.VERDICT_TONES as readonly string[], value) ? value : C.VERDICT_TONES[0];
};
export const motionVerdictParams = (d: Record<string, any>): Record<string, unknown> => ({
  label: text(d.label, C.HUD_TEXT_MAX),
  title: text(d.title, C.TITLE_MAX),
  question: text(d.question, C.VERDICT_LINE_MAX),
  verdict: text(d.verdict, C.VERDICT_TEXT_MAX) || C.EMPTY,
  tone: tone(d.tone),
  note: text(d.note, C.VERDICT_LINE_MAX),
  at: C.VERDICT_STAMP_AT,
});
export const motionScoreboardParams = (d: Record<string, any>): Record<string, unknown> => {
  const rows = items(d.rows, C.SCOREBOARD_ROWS_MAX, (r) => {
    if (!_.isPlainObject(r)) return null;
    const label = text(r.label, C.MAP_TEXT_MAX);
    return label ? { label, verdict: text(r.verdict, C.VERDICT_TEXT_MAX) || C.EMPTY, tone: tone(r.tone) } : null;
  });
  const highlight = _.toNumber(d.highlight);
  return { title: text(d.title, C.TITLE_MAX) || C.EMPTY, rows, highlight: _.isFinite(highlight) ? _.clamp(Math.round(highlight), 0, Math.max(0, rows.length - 1)) : undefined };
};
export const motionIconsParams = (d: Record<string, any>): Record<string, unknown> => {
  const raw = _.castArray(d.groups && _.castArray(d.groups).length ? d.groups : [d]);
  return {
    title: text(d.title, C.TITLE_MAX) || C.EMPTY,
    caption: text(d.caption, 120),
    groups: _.map(_.take(raw, C.ICON_GROUPS_MAX), (g: any) => {
      const count = Math.round(num(g?.count, 1, C.ICON_COUNT_MAX, 10));
      return { icon: _.includes(C.ICON_KINDS as readonly string[], _.toString(g?.icon)) ? _.toString(g.icon) : C.ICON_KINDS[0], count, highlight: g?.highlight == null ? undefined : Math.round(num(g.highlight, 0, count, count)), color: color(g?.color), label: text(g?.label, C.MAP_TEXT_MAX), note: text(g?.note, C.MAP_TEXT_MAX) };
    }),
  };
};
