import { RUNTIME_TEXT as RT_SHARED } from "../../../constants/runtime/shared.js";
import { RUNTIME_TEXT as RT_MOTION } from "../constants/runtimeText.js";
import { MOTION_LOG_SECTIONS as S } from "../constants/motionLogSections.js";
import { MOTION_PROGRESS as P } from "../../../constants/motionProgress.js";
import { motionFlowLogRows } from "./motionLogHistory.js";
import type { MotionLogEntry, MotionStoryJobState, MotionJobState, MotionProductionResult } from "../../../types/motionVideo.js";
export interface MotionSectionRow {
  key: string;
  time: string;
  message: string;
  raw: string;
  technical: boolean;
  visible: boolean;
}
export interface MotionLogSection {
  key: string;
  rows: MotionSectionRow[];
  state: string;
  summary: string;
  lastOrder: number;
}
export const motionLogSectionKey = (text: string): string | undefined => S.MATCH.find(([, pattern]) => pattern.test(text))?.[0];
const motionLogStageKeys = (stage: string): string[] => S.MATCH.filter(([, pattern]) => pattern.test(stage)).map(([key]) => key);
export const motionLogSections = (entries: MotionLogEntry[], language: string = RT_SHARED.VI, job?: MotionStoryJobState | null, render?: MotionJobState | null): MotionLogSection[] => {
  const text = S.TEXT[language === RT_SHARED.EN ? RT_SHARED.EN : RT_SHARED.VI];
  const sections = new Map<string, MotionLogSection>(S.ORDER.map((key) => [key, { key, rows: [], state: RT_SHARED.WAITING, summary: "", lastOrder: -1 }]));
  const phase = new Map<string, string>();
  const sources = new Map<string, string>();
  const starts = new Map<string, number>();
  const ends = new Map<string, number>();
  let order = 0;
  for (const row of motionFlowLogRows(entries)) {
    const id = row.key.slice(0, row.key.lastIndexOf(RT_SHARED.SYMBOL_E7AC07));
    if (!starts.has(id)) starts.set(id, row.time);
    ends.set(id, row.time);
    const time = row.line.match(P.TIME)?.[0].replace(/\s*·\s*$/u, "") || "";
    let message = row.line.replace(P.TIME, "");
    const scopes: string[] = [];
    for (let match = message.match(P.SECTION); match; match = message.match(P.SECTION)) {
      scopes.push(match[1]);
      message = message.slice(match[0].length);
    }
    const declared = scopes.map(motionLogSectionKey).find(Boolean);
    const kind = S.KINDS[row.kind];
    const inferred = motionLogSectionKey(message);
    const key = declared || kind || inferred || phase.get(id) || RT_MOTION.OTHER;
    phase.set(id, key);
    const group = sections.get(key) || sections.get(RT_MOTION.OTHER)!;
    if (sources.has(key) && sources.get(key) !== id) group.state = RT_MOTION.RECORDED;
    sources.set(key, id);
    const technical = S.TECHNICAL.test(message);
    const failure = S.FAILURE.test(message);
    const display = S.CAPTCHA.test(message) ? text.captcha : S.CONTEXT_ERROR.test(message) ? text.contextError : S.OBJECT_ERROR.test(message) ? text.objectError : S.REPAIR.test(message) ? (failure ? text.invalidData : text.repair) : technical && failure ? text.failed : message;
    const substage = key === RT_SHARED.SCENES ? scopes.filter((scope) => Object.values(P.STAGE).includes(scope as typeof P.STAGE.PLAN)).at(-1) : undefined;
    group.rows.push({ key: row.key, time, message: substage ? `${substage}${RT_SHARED.SYMBOL_588DA4}${display}` : display, raw: row.line, technical, visible: !technical || display !== message });
    group.lastOrder = order++;
    if (group.state === RT_SHARED.WAITING) group.state = RT_MOTION.RECORDED;
    if (failure) group.state = RT_SHARED.ERROR;
    if (S.COMPLETE.test(message)) group.state = RT_MOTION.DONE;
  }
  const completed = (key: string, yes: unknown) => {
    const source = sources.get(key);
    if (yes && (!source || source === job?.id || (starts.get(source) || 0) <= (job?.startedAt || 0) / 1000)) sections.get(key)!.state = RT_MOTION.DONE;
  };
  if (job?.kind === RT_MOTION.PRODUCTION) {
    const result = job.result as MotionProductionResult | undefined;
    completed(RT_MOTION.ANALYZE, result?.analysis);
    completed(RT_MOTION.SCRIPT, result?.script?.beats?.length && motionLogStageKeys(job.stage || "").some((key) => ([RT_SHARED.SCENES, RT_SHARED.VOICE, RT_MOTION.SEO, RT_MOTION.RENDER] as string[]).includes(key)));
    completed(RT_MOTION.SEO, result?.seo?.options?.length);
    completed(RT_SHARED.VOICE, result?.voice?.audioId);
    completed(RT_SHARED.SCENES, result?.script?.gen?.puppet?.report && !result.script.gen.puppet.report.missing);
    completed(RT_MOTION.RENDER, result?.rendered);
  }
  for (const current of [...entries.filter((entry) => entry.status), job, render]) {
    if (!current) continue;
    const kind = RT_MOTION.KIND in current ? String(current.kind) : RT_MOTION.RENDER;
    const stages = kind === RT_MOTION.PRODUCTION ? motionLogStageKeys(current.stage || "") : ([S.KINDS[kind] || RT_MOTION.OTHER] as string[]);
    const errorKey = current.status === RT_SHARED.ERROR && kind === RT_MOTION.PRODUCTION ? motionLogSectionKey(current.error || "") : undefined;
    for (const key of errorKey ? [errorKey] : stages.length ? stages : ([RT_MOTION.OTHER] as string[])) {
      const group = sections.get(key)!;
      const source = sources.get(key);
      const started = starts.get(current.id) ?? (current.startedAt || 0) / 1000;
      if (source && source !== current.id && started < (starts.get(source) || 0)) continue;
      if (source && source !== current.id) group.state = RT_MOTION.RECORDED;
      sources.set(key, current.id);
      if (!starts.has(current.id)) starts.set(current.id, started);
      if (current.status === RT_SHARED.ERROR) group.state = RT_SHARED.ERROR;
      else if (current.status === RT_MOTION.CANCELLED) {
        if (group.state !== RT_MOTION.DONE) group.state = RT_MOTION.CANCELLED;
      } else if (current.status === RT_SHARED.COMPLETED) {
        if (kind !== RT_MOTION.PRODUCTION) group.state = RT_MOTION.DONE;
      } else if (group.state !== RT_MOTION.DONE) group.state = RT_MOTION.ACTIVE;
    }
    for (const ai of Object.values(RT_MOTION.ACTIVEAI in current ? current.activeAi || {} : {})) {
      if (([RT_SHARED.ERROR, RT_MOTION.CANCELLED, RT_SHARED.COMPLETED] as string[]).includes(current.status)) continue;
      const active = motionLogSectionKey(ai.artifact);
      if (active && (!sources.has(active) || sources.get(active) === current.id) && sections.get(active)!.state !== RT_MOTION.DONE && ai.phase !== RT_MOTION.DONE) sections.get(active)!.state = RT_MOTION.ACTIVE;
    }
  }
  for (const [key, source] of sources) {
    const group = sections.get(key)!;
    if (group.state === RT_SHARED.ERROR && [...starts].some(([id, started]) => id !== source && started > (ends.get(source) ?? starts.get(source) ?? Infinity))) group.state = RT_MOTION.PREVIOUS_ERROR;
  }
  return S.ORDER.filter((key) => S.CORE.includes(key) || sections.get(key)!.state !== RT_SHARED.WAITING).map((key) => {
    const group = sections.get(key)!;
    const source = sources.get(key);
    const visible = group.rows.filter((row) => row.visible && (!source || row.key.startsWith(source + RT_SHARED.SYMBOL_E7AC07)));
    const counters = visible.filter((row) => S.COUNTER.test(row.message));
    const last = visible.at(-1);
    const urgent = last && (S.CAPTCHA.test(last.raw) || S.FAILURE.test(last.message) || S.OBJECT_ERROR.test(last.raw));
    group.summary = group.state === RT_MOTION.PREVIOUS_ERROR ? text.previousError : (group.state === RT_MOTION.ACTIVE && !urgent ? counters.at(-1) || last : last)?.message || (group.state === RT_MOTION.ACTIVE ? text.active : group.state === RT_MOTION.DONE ? text.done : group.state === RT_SHARED.ERROR ? text.failed : group.rows.length ? text.count(group.rows.length) : text.empty);
    return group;
  });
};
