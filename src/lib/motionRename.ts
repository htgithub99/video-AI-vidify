import { MOTION_RENAME as N, type MotionRenameKind } from "../constants/motionRename.js";
import type { MotionBeat, MotionStoryAnalysis, MotionRenameEntry } from "../types/motionVideo.js";
export const motionRenameNormalize = (value: string): string =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(N.DIACRITICS, "")
    .replace(N.D_BAR, N.D_PLAIN)
    .replace(N.SPACES, N.SPACE)
    .trim();
const escape = (value: string) => value.replace(N.ESCAPE_RE, N.ESCAPE_TO);
export const normalizeMotionRenameMap = (raw: unknown): MotionRenameEntry[] => {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const entries: MotionRenameEntry[] = [];
  for (const item of raw) {
    const source = typeof item?.source === "string" ? item.source.trim() : "";
    const renamed = typeof item?.renamed === "string" ? item.renamed.trim() : "";
    const kind = (N.KINDS as readonly string[]).includes(item?.kind) ? (item.kind as MotionRenameKind) : N.KINDS[0];
    const key = motionRenameNormalize(source);
    if (!source || !renamed || key.length < N.MIN_CHARS || seen.has(key) || motionRenameNormalize(renamed) === key) continue;
    seen.add(key);
    entries.push({ source, renamed, kind });
  }
  return entries;
};
const matchable = (entry: MotionRenameEntry): boolean => entry.source.split(N.SPACES).length >= N.MIN_SOURCE_WORDS || N.UPPER.test(entry.source);
const pattern = (source: string): RegExp => new RegExp(`${N.BOUND_HEAD}${escape(motionRenameNormalize(source)).replace(N.SPACES, N.SPACE)}${N.BOUND_TAIL}`, N.FLAGS);
export const motionRenameLeaks = (text: string | undefined, map: MotionRenameEntry[]): string[] => {
  if (!text) return [];
  const normalized = motionRenameNormalize(text);
  return map.filter((entry) => matchable(entry) && pattern(entry.source).test(normalized)).map((entry) => entry.source);
};
export const motionRenameMapActive = (analysis: Pick<MotionStoryAnalysis, "renameEntities" | "renameMap">): MotionRenameEntry[] => (analysis.renameEntities ? analysis.renameMap || [] : []);
export const motionRenamePairs = (map: MotionRenameEntry[]): string => map.map((entry) => `${entry.source} → ${entry.renamed}`).join("; ");
export interface MotionRenameIssue {
  path: string;
  expected: string;
  actual: string;
  value: string;
}
export const motionRenameAnalysisIssues = (draft: any): MotionRenameIssue[] => {
  const map = normalizeMotionRenameMap(draft?.renameMap);
  if (!map.length) return [{ path: N.MAP_FIELD, expected: N.ISSUE.MAP_MISSING, actual: String(Array.isArray(draft?.renameMap) ? draft.renameMap.length : typeof draft?.renameMap), value: "" }];
  const issues: MotionRenameIssue[] = [];
  const check = (path: string, text: unknown) => {
    if (typeof text !== "string") return;
    const leaks = motionRenameLeaks(text, map);
    if (leaks.length) issues.push({ path, expected: N.ISSUE.EXPECTED(leaks[0]), actual: N.ISSUE.LEAK(leaks), value: text.slice(0, 120) });
  };
  check("title", draft?.title);
  check("logline", draft?.logline);
  (Array.isArray(draft?.cast) ? draft.cast : []).forEach((row: any, index: number) => check(`cast[${index}].name`, row?.name));
  (Array.isArray(draft?.places) ? draft.places : []).forEach((row: any, index: number) => check(`places[${index}].name`, row?.name));
  (Array.isArray(draft?.chapters) ? draft.chapters : []).forEach((row: any, index: number) => {
    check(`chapters[${index}].title`, row?.title);
    check(`chapters[${index}].summary`, row?.summary);
    check(`chapters[${index}].hook`, row?.hook);
    (Array.isArray(row?.keyPoints) ? row.keyPoints : []).forEach((point: unknown, j: number) => check(`chapters[${index}].keyPoints[${j}]`, point));
  });
  return issues;
};
const replaceAll = (text: string, map: MotionRenameEntry[]): string => {
  let next = text;
  for (const entry of map) {
    if (!matchable(entry)) continue;
    next = next.replace(new RegExp(`${N.BOUND_HEAD}${escape(entry.source)}${N.BOUND_TAIL}`, N.FLAGS), entry.renamed);
  }
  return next;
};
export const motionRenameAutofix = (beats: MotionBeat[], analysis: Pick<MotionStoryAnalysis, "renameEntities" | "renameMap">): { beats: MotionBeat[]; replaced: number } => {
  const map = motionRenameMapActive(analysis);
  if (!map.length) return { beats, replaced: 0 };
  let replaced = 0;
  const fix = (text: string): string => {
    const next = replaceAll(text, map);
    if (next !== text) replaced++;
    return next;
  };
  const next = beats.map((beat) => {
    const narration = fix(beat.narration || "");
    const utterances = beat.utterances?.map((line) => {
      const text = fix(line.text);
      return text === line.text ? line : { ...line, text };
    });
    const changed = narration !== (beat.narration || "") || (utterances && utterances.some((line, index) => line !== beat.utterances![index]));
    return changed ? { ...beat, narration, ...(utterances ? { utterances } : {}) } : beat;
  });
  return { beats: next, replaced };
};
export interface MotionRenameFinding {
  id: string;
  issue: string;
}
export const motionRenameLeakFindings = (beats: MotionBeat[], analysis: Pick<MotionStoryAnalysis, "renameEntities" | "renameMap">): MotionRenameFinding[] => {
  const map = motionRenameMapActive(analysis);
  if (!map.length) return [];
  return beats.flatMap((beat) => {
    const leaks = [...new Set([...motionRenameLeaks(beat.narration, map), ...(beat.utterances || []).flatMap((line) => motionRenameLeaks(line.text, map))])];
    return leaks.length ? [{ id: beat.id, issue: N.ISSUE.LEAK(leaks) }] : [];
  });
};
const compact = (value: string): string => motionRenameNormalize(value).replace(N.NON_WORD, "");
export const motionRenameFilterTerms = (terms: string[], map: MotionRenameEntry[]): { kept: string[]; removed: number } => {
  const sources = map.filter(matchable).map((entry) => compact(entry.source));
  const kept = terms.filter((term) => {
    const flat = compact(term);
    return !motionRenameLeaks(term, map).length && !sources.some((source) => source && flat.includes(source));
  });
  return { kept, removed: terms.length - kept.length };
};
