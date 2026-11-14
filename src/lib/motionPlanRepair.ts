import { MOTION_HTML_WRITING as W } from "../constants/motionHtmlWriting.js";
export interface MotionPlanRow {
  fromLineId?: unknown;
  toLineId?: unknown;
  sceneTemplate?: unknown;
}
const templateText = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map((item) => String(item ?? "").trim()).filter(Boolean).join(W.TEMPLATE_JOIN);
  if (value && typeof value === "object")
    return Object.entries(value as Record<string, unknown>)
      .map(([key, item]) => (W.TEMPLATE_KEY.test(key) && !W.TEMPLATE_NUMBERED.test(String(item ?? "")) ? W.TEMPLATE_SECTION(key, String(item ?? "").trim()) : String(item ?? "").trim()))
      .filter(Boolean)
      .join(W.TEMPLATE_JOIN);
  return value;
};
export const motionRepairPlanRows = <T extends MotionPlanRow>(rows: T[], keys: string[]): { rows: T[]; repaired: number } => {
  const indexed = rows
    .map((row) => (row && typeof row.sceneTemplate === "object" && row.sceneTemplate ? { ...row, sceneTemplate: templateText(row.sceneTemplate) } : row))
    .map((row) => ({ row, start: keys.indexOf(String(row.fromLineId)), end: keys.indexOf(String(row.toLineId)) }))
    .filter((item) => item.start >= 0 && item.end >= 0 && typeof item.row.sceneTemplate === "string" && item.row.sceneTemplate.trim())
    .map((item) => (item.end < item.start ? { ...item, start: item.end, end: item.start } : item))
    .sort((a, b) => a.start - b.start || a.end - b.end);
  let repaired = rows.length - indexed.length;
  let cursor = 0;
  const out: T[] = [];
  for (const item of indexed) {
    if (item.end < cursor) {
      repaired++;
      continue;
    }
    if (item.start !== cursor) repaired++;
    out.push({ ...item.row, fromLineId: keys[cursor], toLineId: keys[item.end] });
    cursor = item.end + 1;
  }
  if (out.length && cursor < keys.length) {
    repaired++;
    out[out.length - 1] = { ...out[out.length - 1], toLineId: keys[keys.length - 1] };
  }
  return { rows: out, repaired };
};
