import _ from "lodash";
import { MOTION_HISTORY as C } from "../constants/motionHistory.js";
import type { MotionHud } from "../types/motionVideo.js";
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
