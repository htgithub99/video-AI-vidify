import type { MotionLogEntry } from "../types/motionVideo.js";
import { MOTION_PROGRESS as P } from "../constants/motionProgress.js";
export const motionRestoredStoryJobId = (activeId: string | undefined, history: MotionLogEntry[], productionId?: string): string | undefined => activeId || history.filter((entry) => entry.kind !== "render").at(-1)?.id || productionId;
export const motionFlowLogRows = (history: MotionLogEntry[]): { key: string; kind: string; section?: string; line: string; time: number }[] => {
  const rows = history.flatMap((entry, group) => {
    let time = 0;
    let day = entry.startedAt ? new Date(entry.startedAt).setHours(0, 0, 0, 0) / 1000 : 0;
    return entry.lines.map((line, index) => {
      const stamp = line.match(P.TIME);
      if (stamp) {
        const next = Number(stamp[1]) * 3600 + Number(stamp[2]) * 60 + Number(stamp[3]);
        if (next < time - P.DAY_SECONDS / 2) day += P.DAY_SECONDS;
        time = next;
      }
      let content = line.replace(P.TIME, "");
      let section: string | undefined;
      for (let match = content.match(P.SECTION); match; match = content.match(P.SECTION)) {
        section = match[1];
        content = content.slice(match[0].length);
      }
      return { key: entry.id + ":" + index, kind: entry.kind, section, line, time: day + time, absolute: !!entry.startedAt, group, index };
    });
  });
  const dated = rows.find((row) => row.absolute);
  if (dated) {
    const base = new Date(dated.time * 1000).setHours(0, 0, 0, 0) / 1000;
    for (const row of rows) if (!row.absolute) row.time += base;
  }
  return rows.sort((a, b) => a.time - b.time || a.group - b.group || a.index - b.index);
};
export const mergeMotionLogHistory = (history: MotionLogEntry[], id: string, kind: string, lines: string[] = [], startedAt?: number, state?: Pick<MotionLogEntry, "status" | "stage" | "error">): MotionLogEntry[] => {
  const index = history.findIndex((entry) => entry.id === id);
  if (index < 0) return [...history, { id, kind, lines, ...(startedAt ? { startedAt } : {}), ...state }];
  const previous = history[index].lines;
  if (!lines.length || (lines.length <= previous.length && previous.some((_, start) => lines.every((line, offset) => previous[start + offset] === line)))) {
    if ((!startedAt || startedAt === history[index].startedAt) && (!state || Object.entries(state).every(([key, value]) => history[index][key as keyof MotionLogEntry] === value))) return history;
    return history.map((entry, i) => (i === index ? { ...entry, ...(startedAt ? { startedAt } : {}), ...state } : entry));
  }
  let overlap = Math.min(previous.length, lines.length);
  while (overlap && !lines.slice(0, overlap).every((line, offset) => previous[previous.length - overlap + offset] === line)) overlap--;
  const next = history.slice();
  next[index] = { ...history[index], id, kind, lines: [...previous, ...lines.slice(overlap)], ...(startedAt ? { startedAt } : {}), ...state };
  return next;
};
