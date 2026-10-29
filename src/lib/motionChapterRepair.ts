import { RUNTIME_TEXT as RT_CORE } from "../constants/runtime/core.js";
import { RUNTIME_TEXT as RT_SHARED } from "../constants/runtime/shared.js";
import { stringifyJson } from "./jsonStringify.js";
import { MOTION_CHAPTER_REPAIR as C } from "../constants/motionChapterRepair.js";
import { mergeMotionRepair } from "./motionAiRepair.js";
import type { MotionChapterDraft } from "../types/motionVideo.js";
import { MOTION_PROMPT as P } from "../constants/motionPrompt.js";
import { MOTION_RESPONSE_SCHEMAS, MOTION_RESPONSE_TEXT as R } from "../constants/motionResponseContract.js";
import { motionResponseIssues, motionResponseShape, type MotionResponseIssue } from "./motionResponseContract.js";
import { motionSpeechResponseIssues } from "./motionSpeechResponse.js";
import { MOTION_VOICE } from "../constants/motionVoice.js";
import { normalizeMotionChapterMetadata } from "./motionEditorialMetadata.js";
export const motionChapterResponseIssues = (rows: Record<string, any>[], cast: string[], places: string[], closed: boolean): { id: string; issues: MotionResponseIssue[] }[] => {
  const schema = MOTION_RESPONSE_SCHEMAS[RT_CORE.MOTION_STORY_CHAPTER].properties!.beats.items!;
  return normalizeMotionChapterMetadata(rows).flatMap((row) => {
    const issues = motionResponseIssues(row, { ...schema, properties: Object.fromEntries(Object.entries(schema.properties!).filter(([key]) => !([RT_CORE.SCENEPLAN, RT_SHARED.UTTERANCES] as string[]).includes(key))) });
    if (Array.isArray(row.utterances) && row.utterances.length) issues.push(...motionSpeechResponseIssues(row.utterances, [RT_CORE.NARRATOR, ...cast] as string[], typeof row.narration === "string" ? row.narration : ""));
    else if (row.utterances !== undefined && !Array.isArray(row.utterances)) issues.push({ path: RT_SHARED.UTTERANCES, expected: RT_CORE.ARRAY_OF_UTTERANCES, actual: typeof row.utterances, value: R.VALUE(row.utterances) });
    if (Array.isArray(row.cast) && row.cast.some((key) => !cast.includes(key))) issues.push({ path: RT_CORE.CAST, expected: stringifyJson(cast), actual: RT_CORE.UNKNOWN_CAST_KEY, value: R.VALUE(row.cast) });
    if (typeof row.place === "string" && !places.includes(row.place)) issues.push({ path: RT_SHARED.PLACE, expected: stringifyJson(places), actual: RT_CORE.UNKNOWN_PLACE_KEY, value: R.VALUE(row.place) });
    if (closed && row.visual !== RT_SHARED.SCENE) issues.push({ path: RT_CORE.VISUAL, expected: RT_SHARED.SCENE, actual: String(row.visual), value: R.VALUE(row.visual) });
    return issues.length ? [{ id: row.id, issues }] : [];
  });
};
export const motionChapterRepairPrompt = (rows: Record<string, any>[], pending: MotionChapterDraft["pending"], context: unknown): string => {
  const ids = new Set(pending.map((item) => item.id));
  const schema = MOTION_RESPONSE_SCHEMAS[RT_CORE.MOTION_STORY_CHAPTER].properties!.beats.items!;
  const targets = pending.map((item) => {
    const draft = rows.find((row) => row.id === item.id);
    const fields = new Set(item.fields);
    return {
      ...item,
      ...(item.targetUnits !== undefined ? { currentUnits: units(draft?.narration) } : {}),
      draft: draft && Object.fromEntries(Object.entries(draft).filter(([key]) => fields.has(key))),
      readOnly: draft && Object.fromEntries(([RT_SHARED.NARRATION, RT_CORE.CAST, RT_SHARED.PLACE, RT_CORE.ACTION] as string[]).filter((key) => !fields.has(key) && draft[key] !== undefined).map((key) => [key, draft[key]])),
      errors: motionResponseIssues(draft, schema).filter((issue) => fields.has(issue.path.split(/[.\[]/)[0])),
    };
  });
  const neighbours = rows.filter((row, index) => !ids.has(row.id) && rows.slice(Math.max(0, index - P.CONTEXT_NEIGHBOURS), index + P.CONTEXT_NEIGHBOURS + 1).some((item) => ids.has(item.id))).map((row) => ({ id: row.id, narration: row.narration, place: row.place, cast: row.cast }));
  const types = Object.fromEntries([...new Set(pending.flatMap((item) => item.fields))].flatMap((field) => (schema.properties?.[field] ? [[field, motionResponseShape(schema.properties[field])]] : [])));
  const duration = pending.some((item) => item.targetUnits !== undefined)
    ? C.DURATION_RULE(
        rows.reduce((sum, row) => sum + units(row.narration), 0),
        rows.reduce((sum, row) => sum + (pending.find((item) => item.id === row.id)?.targetUnits ?? units(row.narration)), 0),
      ) + P.SEPARATOR
    : "";
  if (duration && pending.every((item) => item.targetUnits !== undefined && item.fields.every((field) => field === RT_SHARED.NARRATION || field === RT_SHARED.UTTERANCES))) {
    const story = context as Record<string, any>;
    return (
      duration +
      R.DIAGNOSTICS +
      C.DURATION_REQUEST(
        targets.map((item) => ({ id: item.id, currentUnits: item.currentUnits, targetUnits: item.targetUnits, narration: item.draft?.narration, speakers: item.draft?.utterances?.length ? [...new Set(item.draft.utterances.map((line: any) => line.speaker))] : [MOTION_VOICE.NARRATOR] })),
        { language: story?.language, title: story?.title, neighbours, ...(story?.writingProfile ? { writingProfile: story.writingProfile } : {}), ...(story?.originality ? { originality: story.originality } : {}) },
      )
    );
  }
  return duration + R.DIAGNOSTICS + P.CHAPTER_REPAIR(targets, neighbours, { story: context, outputTypes: types });
};
const units = (value: unknown): number => (typeof value === "string" ? value.trim().split(C.SPACE).filter(Boolean).length : 0);
export const normalizeMotionDurationResponse = (raw: any): any => {
  if (!Array.isArray(raw?.beats)) return raw;
  return {
    ...raw,
    beats: raw.beats.map((beat: any) => {
      if (!Array.isArray(beat?.utterances) || !beat.utterances.length || !beat.utterances.every((line: any) => Array.isArray(line?.words) && line.words.length && line.words.every((word: unknown) => typeof word === "string" && word.trim() === word && units(word) === 1))) return beat;
      const utterances = beat.utterances.map(({ words, ...line }: any) => ({ ...line, text: words.join(RT_SHARED.SYMBOL_36A9E7) }));
      return { ...beat, narration: utterances.map((line: any) => line.text).join(RT_SHARED.SYMBOL_36A9E7), utterances };
    }),
  };
};
export const mergeMotionChapterDraft = (raw: any, chapter: string, before?: MotionChapterDraft): Record<string, any>[] => {
  const incoming = Array.isArray(raw?.beats) ? normalizeMotionChapterMetadata(raw.beats.filter((row: unknown) => row && typeof row === "object" && !Array.isArray(row))) : [];
  if (!before?.rows.length) return incoming.map((row: any, index: number) => ({ ...row, id: C.ID(chapter, index) }));
  const counts = new Map<string, number>();
  for (const row of incoming) counts.set(row.id, (counts.get(row.id) || 0) + 1);
  return before.rows.map((row) => {
    const pending = before.pending.find((item) => item.id === row.id);
    const patch = incoming.find((item: any) => item.id === row.id);
    return pending && patch && counts.get(row.id) === 1 ? mergeMotionRepair(row, patch, pending.fields) : structuredClone(row);
  });
};
export const motionChapterPending = (rows: Record<string, any>[], expectedUnits?: number, tolerance?: number, spreadExpansion = false): MotionChapterDraft["pending"] => {
  const missing = rows.filter((row) => !units(row.narration)).map((row) => ({ id: row.id, fields: [...C.FIELDS] }));
  if (missing.length) return missing;
  const tokens = (text: string) => (text.toLowerCase().normalize(RT_SHARED.NFC).match(C.WORDS) || []).join(RT_SHARED.SYMBOL_36A9E7);
  const spoken = rows.filter((row) => Array.isArray(row.utterances) && row.utterances.length && tokens(row.utterances.map((line: any) => String(line?.text || "")).join(RT_SHARED.SYMBOL_36A9E7)) !== tokens(row.narration)).map((row) => ({ id: row.id, fields: [RT_SHARED.UTTERANCES] as string[] }));
  if (spoken.length) return spoken;
  if (!expectedUnits) return [];
  const total = rows.reduce((sum, row) => sum + units(row.narration), 0);
  if (total >= expectedUnits * (tolerance ? 1 - tolerance : C.MIN_RATIO) && total <= expectedUnits * (tolerance ? 1 + tolerance : C.MAX_RATIO)) return [];
  const short = total < expectedUnits;
  if (spreadExpansion && !short) {
    const target = Math.max(rows.length, Math.round(expectedUnits));
    const allocations = rows.map((row) => {
      const share = 1 + ((target - rows.length) * (units(row.narration) - 1)) / Math.max(1, total - rows.length);
      return { row, targetUnits: Math.floor(share), fraction: share - Math.floor(share) };
    });
    let remainder = target - allocations.reduce((sum, item) => sum + item.targetUnits, 0);
    for (const item of [...allocations].sort((a, b) => b.fraction - a.fraction)) {
      if (remainder <= 0) break;
      item.targetUnits++;
      remainder--;
    }
    return allocations.filter((item) => item.targetUnits < units(item.row.narration)).map((item) => ({ id: item.row.id, fields: [RT_SHARED.NARRATION, RT_SHARED.UTTERANCES] as string[], targetUnits: item.targetUnits }));
  }
  let remaining = Math.abs(expectedUnits - total);
  const average = Math.max(1, Math.round(expectedUnits / Math.max(1, rows.length)));
  const selected: MotionChapterDraft["pending"] = [];
  for (const row of [...rows].sort((a, b) => (short ? units(a.narration) - units(b.narration) : units(b.narration) - units(a.narration)))) {
    if (remaining <= 0) break;
    const count = units(row.narration);
    const expansion = spreadExpansion ? Math.max(1, Math.ceil(((expectedUnits - total) * count) / Math.max(1, total))) : Math.max(average, average * 2 - count);
    const change = short ? Math.min(remaining, expansion) : Math.min(remaining, Math.max(0, count - Math.max(12, Math.floor(average / 2))));
    if (!change) continue;
    remaining -= change;
    selected.push({ id: row.id, fields: [RT_SHARED.NARRATION, RT_SHARED.UTTERANCES] as string[], targetUnits: Math.round(count + (short ? change : -change)) });
  }
  return selected;
};
