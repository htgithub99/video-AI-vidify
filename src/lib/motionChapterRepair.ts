import { MOTION_CHAPTER_REPAIR as C } from "../constants/motionChapterRepair.js";
import { mergeMotionRepair } from "./motionAiRepair.js";
import type { MotionChapterDraft } from "../types/motionVideo.js";
import { MOTION_PROMPT as P } from "../constants/motionPrompt.js";
import { MOTION_RESPONSE_SCHEMAS, MOTION_RESPONSE_TEXT as R } from "../constants/motionResponseContract.js";
import { motionResponseIssues, motionResponseShape, type MotionResponseIssue } from "./motionResponseContract.js";
import { motionSpeechResponseIssues } from "./motionSpeechResponse.js";
export const motionChapterResponseIssues = (rows: Record<string, any>[], cast: string[], places: string[], closed: boolean): { id: string; issues: MotionResponseIssue[] }[] => {
  const schema = MOTION_RESPONSE_SCHEMAS["motion-story-chapter"].properties!.beats.items!;
  return rows.flatMap((row) => {
    const issues = motionResponseIssues(row, { ...schema, properties: Object.fromEntries(Object.entries(schema.properties!).filter(([key]) => !["scenePlan", "utterances"].includes(key))) });
    if (Array.isArray(row.utterances) && row.utterances.length) issues.push(...motionSpeechResponseIssues(row.utterances, ["narrator", ...cast], typeof row.narration === "string" ? row.narration : ""));
    else if (row.utterances !== undefined && !Array.isArray(row.utterances)) issues.push({ path: "utterances", expected: "array of utterances", actual: typeof row.utterances, value: R.VALUE(row.utterances) });
    if (Array.isArray(row.cast) && row.cast.some((key) => !cast.includes(key))) issues.push({ path: "cast", expected: JSON.stringify(cast), actual: "unknown cast key", value: R.VALUE(row.cast) });
    if (typeof row.place === "string" && !places.includes(row.place)) issues.push({ path: "place", expected: JSON.stringify(places), actual: "unknown place key", value: R.VALUE(row.place) });
    if (closed && row.visual !== "scene") issues.push({ path: "visual", expected: "scene", actual: String(row.visual), value: R.VALUE(row.visual) });
    return issues.length ? [{ id: row.id, issues }] : [];
  });
};
export const motionChapterRepairPrompt = (rows: Record<string, any>[], pending: MotionChapterDraft["pending"], context: unknown): string => {
  const ids = new Set(pending.map((item) => item.id));
  const schema = MOTION_RESPONSE_SCHEMAS["motion-story-chapter"].properties!.beats.items!;
  const targets = pending.map((item) => {
    const draft = rows.find((row) => row.id === item.id);
    return { ...item, draft, errors: motionResponseIssues(draft, schema).filter((issue) => item.fields.includes(issue.path.split(/[.\[]/)[0])) };
  });
  const neighbours = rows.filter((row, index) => !ids.has(row.id) && rows.slice(Math.max(0, index - P.CONTEXT_NEIGHBOURS), index + P.CONTEXT_NEIGHBOURS + 1).some((item) => ids.has(item.id))).map((row) => ({ id: row.id, narration: row.narration, place: row.place, cast: row.cast, scenePlan: row.scenePlan }));
  const types = Object.fromEntries([...new Set(pending.flatMap((item) => item.fields))].flatMap((field) => (schema.properties?.[field] ? [[field, motionResponseShape(schema.properties[field])]] : [])));
  return R.DIAGNOSTICS + P.CHAPTER_REPAIR(targets, neighbours, { story: context, outputTypes: types });
};
const units = (value: unknown): number => (typeof value === "string" ? value.trim().split(C.SPACE).filter(Boolean).length : 0);
export const mergeMotionChapterDraft = (raw: any, chapter: string, before?: MotionChapterDraft): Record<string, any>[] => {
  const incoming = Array.isArray(raw?.beats) ? raw.beats.filter((row: unknown) => row && typeof row === "object" && !Array.isArray(row)) : [];
  if (!before?.rows.length) return incoming.map((row: any, index: number) => ({ ...row, id: C.ID(chapter, index) }));
  const counts = new Map<string, number>();
  for (const row of incoming) counts.set(row.id, (counts.get(row.id) || 0) + 1);
  return before.rows.map((row) => {
    const pending = before.pending.find((item) => item.id === row.id);
    const patch = incoming.find((item: any) => item.id === row.id);
    return pending && patch && counts.get(row.id) === 1 ? mergeMotionRepair(row, patch, pending.fields) : structuredClone(row);
  });
};
export const motionChapterPending = (rows: Record<string, any>[], expectedUnits?: number, tolerance?: number): MotionChapterDraft["pending"] => {
  const missing = rows.filter((row) => !units(row.narration)).map((row) => ({ id: row.id, fields: [...C.FIELDS] }));
  if (missing.length) return missing;
  const tokens = (text: string) => (text.toLowerCase().normalize("NFC").match(C.WORDS) || []).join(" ");
  const spoken = rows.filter((row) => Array.isArray(row.utterances) && row.utterances.length && tokens(row.utterances.map((line: any) => String(line?.text || "")).join(" ")) !== tokens(row.narration)).map((row) => ({ id: row.id, fields: ["utterances"] }));
  if (spoken.length) return spoken;
  if (!expectedUnits) return [];
  const total = rows.reduce((sum, row) => sum + units(row.narration), 0);
  if (total >= expectedUnits * (tolerance ? 1 - tolerance : C.MIN_RATIO) && total <= expectedUnits * (tolerance ? 1 + tolerance : C.MAX_RATIO)) return [];
  const short = total < expectedUnits;
  let remaining = Math.abs(expectedUnits - total);
  const average = Math.max(1, Math.round(expectedUnits / Math.max(1, rows.length)));
  const selected: MotionChapterDraft["pending"] = [];
  for (const row of [...rows].sort((a, b) => (short ? units(a.narration) - units(b.narration) : units(b.narration) - units(a.narration)))) {
    if (remaining <= 0) break;
    const count = units(row.narration);
    const change = short ? Math.min(remaining, Math.max(average, average * 2 - count)) : Math.min(remaining, Math.max(0, count - Math.max(12, Math.floor(average / 2))));
    if (!change) continue;
    remaining -= change;
    selected.push({ id: row.id, fields: ["narration", "utterances"], targetUnits: Math.round(count + (short ? change : -change)) });
  }
  return selected;
};
