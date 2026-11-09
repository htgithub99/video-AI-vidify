import * as RT_MAINTENANCE from "../../../constants/runtime/maintenance.js";
import { RUNTIME_VALUES } from "../../../constants/runtime/values.js";
import { RUNTIME_TEXT as RT_SHARED } from "../../../constants/runtime/shared.js";
import { RUNTIME_TEXT as RT_MOTION } from "../constants/runtimeText.js";
import { MOTION_LOG_SECTIONS as S } from "../constants/motionLogSections.js";
import { MOTION_PROGRESS as P } from "../../../constants/motionProgress.js";
import { motionHtmlPlanCurrent, usesMotionHtml } from "../../../lib/motionHtmlScene.js";
import { missingMotionChapters } from "../../../lib/motionProduction.js";
import { remotionStateMissingScenes } from "../../../lib/motionRemotion.js";
import { motionStepElapsedMs } from "../../../lib/motionStepTime.js";
import { motionUserLogMessage } from "../../../lib/motionLogText.js";
import { MOTION_LOG_TEXT } from "../../../constants/motionLogText.js";
import { motionFlowLogRows } from "./motionLogHistory.js";
import type { MotionLogEntry, MotionStoryJobState, MotionJobState, MotionProductionResult, MotionStepState } from "../../../types/motionVideo.js";
export interface MotionSectionRow {
  key: string;
  time: string;
  message: string;
  raw: string;
  technical: boolean;
  visible: boolean;
  repeat?: number;
}
export interface MotionLogSection {
  key: string;
  rows: MotionSectionRow[];
  state: string;
  summary: string;
  lastOrder: number;
  durationMs?: number;
}
export const motionDurationText = (ms: number, language: string = RT_SHARED.VI): string => {
  const total = Math.max(0, Math.round(ms / 1000));
  const [h, m, s] = [Math.floor(total / 3600), Math.floor((total % 3600) / 60), total % 60];
  const unit = language === RT_SHARED.EN ? { h: RT_MAINTENANCE.H_3, m: RT_MAINTENANCE.M_2, s: RT_MAINTENANCE.S_4 } : { h: RT_MAINTENANCE.GIO, m: RT_MAINTENANCE.PHUT, s: RT_MAINTENANCE.GIAY };
  const pad = (value: number) => String(value).padStart(2, RT_MAINTENANCE.VALUE_0_2);
  return h ? `${h}${unit.h}${RT_MAINTENANCE.SPACE}${pad(m)}${unit.m}` : m ? `${m}${unit.m}${RT_MAINTENANCE.SPACE}${pad(s)}${unit.s}` : `${s}${unit.s}`;
};
export const motionLogSectionKey = (text: string): string | undefined => S.MATCH.find(([, pattern]) => pattern.test(text))?.[0];
const motionLogStageKeys = (stage: string): string[] => S.MATCH.filter(([, pattern]) => pattern.test(stage)).map(([key]) => key);
export const motionLogSections = (entries: MotionLogEntry[], language: string = RT_SHARED.VI, job?: MotionStoryJobState | null, render?: MotionJobState | null): MotionLogSection[] => {
  const text = S.TEXT[language === RT_SHARED.EN ? RT_SHARED.EN : RT_SHARED.VI];
  const sections = new Map<string, MotionLogSection>(S.ORDER.map((key) => [key, { key, rows: [], state: RT_SHARED.WAITING, summary: "", lastOrder: -1 }]));
  const phase = new Map<string, string>();
  const scriptChaptersDone = new Set<string>();
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
    if (/^Viết (?:lời dẫn|phân cảnh chương)/iu.test(message)) scriptChaptersDone.delete(id);
    const declaredScopes = scopes.map(motionLogSectionKey).filter((item): item is string => Boolean(item));
    const innerDeclared = declaredScopes.at(-1);
    const kind = S.KINDS[row.kind];
    const artifact = motionLogSectionKey(row.event?.artifact || "");
    const messageKey = motionLogSectionKey(message);
    const inheritedScenePhase = scriptChaptersDone.has(id) && !messageKey && phase.get(id) === RT_SHARED.SCENES ? RT_SHARED.SCENES : undefined;
    const key = (declaredScopes.length > 1 ? innerDeclared : undefined) || artifact || (messageKey === RT_SHARED.SCENES ? messageKey : undefined) || inheritedScenePhase || innerDeclared || kind || messageKey || phase.get(id) || RT_MOTION.OTHER;
    if (/^Hoàn tất chia phân cảnh/iu.test(message)) scriptChaptersDone.add(id);
    phase.set(id, declaredScopes.length > 0 && !scriptChaptersDone.has(id) ? declaredScopes[0] : key);
    const group = sections.get(key) || sections.get(RT_MOTION.OTHER)!;
    if (sources.has(key) && sources.get(key) !== id) group.state = RT_MOTION.RECORDED;
    sources.set(key, id);
    const friendly = motionUserLogMessage(message);
    if (friendly !== undefined) message = friendly;
    const recovering = row.event?.severity !== S.SEVERITY.ERROR && !S.FAILURE.test(message) && (row.event?.severity === S.SEVERITY.WARNING || S.RECOVERY.test(message));
    const technical = friendly === undefined || (!recovering && S.TECHNICAL.test(message));
    const failure = row.event?.severity === S.SEVERITY.ERROR || (!recovering && S.FAILURE.test(message));
    const explanation = S.CAPTCHA.test(message) ? text.captcha : S.CONTEXT_ERROR.test(message) ? text.contextError : S.OBJECT_ERROR.test(message) ? text.objectError : S.REPAIR.test(message) ? (failure ? text.invalidData : text.repair) : undefined;
    const display = failure ? (explanation ? `${explanation}${RT_MAINTENANCE.SPACE}${message}` : message) : explanation || message;
    const substage = key === RT_SHARED.SCENES ? scopes.filter((scope) => Object.values(P.STAGE).includes(scope as typeof P.STAGE.PLAN)).at(-1) : undefined;
    const shown = substage ? `${substage}${RT_SHARED.SYMBOL_588DA4}${display}` : display;
    const visible = failure || !technical || display !== message;
    const previous = visible ? [...group.rows].reverse().find((item) => item.visible) : undefined;
    if (previous && previous.message.replace(MOTION_LOG_TEXT.REPEAT_TAIL, "") === shown) {
      previous.repeat = (previous.repeat || 1) + 1;
      previous.message = shown + MOTION_LOG_TEXT.REPEAT(previous.repeat);
      previous.time = time;
      group.rows.push({ key: row.key, time, message: shown, raw: row.line, technical: true, visible: false });
    } else group.rows.push({ key: row.key, time, message: shown, raw: row.line, technical, visible });
    group.lastOrder = order++;
    if (group.state === RT_SHARED.WAITING) group.state = RT_MOTION.RECORDED;
    if (failure) group.state = RT_SHARED.ERROR;
    else if (recovering) group.state = RT_MOTION.ACTIVE;
    if (S.COMPLETE.test(message)) group.state = RT_MOTION.DONE;
  }
  const completed = (key: string, yes: unknown) => {
    const source = sources.get(key);
    if (yes && (!source || source === job?.id || (starts.get(source) || 0) <= (job?.startedAt || 0) / 1000)) sections.get(key)!.state = RT_MOTION.DONE;
  };
  if (job?.kind === RT_MOTION.PRODUCTION) {
    const result = job.result as MotionProductionResult | undefined;
    completed(RT_MOTION.ANALYZE, result?.analysis);
    const scriptComplete =
      !!result?.script?.beats?.length &&
      (motionLogStageKeys(job.stage || "").some((key) => ([RT_SHARED.SCENES, RT_SHARED.VOICE, RT_MOTION.SEO, RT_MOTION.RENDER] as string[]).includes(key)) ||
        job.status === RT_SHARED.COMPLETED ||
        (!!result.analysis && !missingMotionChapters(result.script, result.analysis).length && !Object.keys(result.script.chapterDrafts || {}).length && (!usesMotionHtml(result.script) || motionHtmlPlanCurrent(result.script, result.analysis))));
    completed(RT_MOTION.SCRIPT, scriptComplete);
    completed(RT_MOTION.SEO, result?.seo?.options?.length);
    if (result?.seoJobId && !([RT_SHARED.ERROR, RT_MOTION.CANCELLED, RT_SHARED.COMPLETED] as string[]).includes(job.status)) sections.get(RT_MOTION.SEO)!.state = RT_MOTION.ACTIVE;
    completed(RT_SHARED.VOICE, result?.voice?.audioId);
    const scenesComplete =
      (result?.script?.gen?.puppet?.report && !result.script.gen.puppet.report.missing) || (result?.script?.gen?.remotion && Object.values(result.script.gen.remotion.scenes || {}).flat().length > 0 && remotionStateMissingScenes(result.script.gen.remotion).length === 0 && (!result.analysis || !usesMotionHtml(result.script) || motionHtmlPlanCurrent(result.script, result.analysis)));
    completed(RT_SHARED.SCENES, scenesComplete);
    completed(RT_MOTION.RENDER, result?.rendered);
  }
  const currents = [...entries.filter((entry) => entry.status), job, render];
  for (const current of currents) {
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
    const sceneGroup = sections.get(RT_SHARED.SCENES)!;
    if (sources.get(RT_SHARED.SCENES) === current.id && sceneGroup.rows.length > 0 && sceneGroup.state !== RT_MOTION.DONE && sceneGroup.state !== RT_SHARED.ERROR) {
      if (current.status === RT_MOTION.CANCELLED) sceneGroup.state = RT_MOTION.CANCELLED;
      else if (!([RT_SHARED.ERROR, RT_MOTION.CANCELLED, RT_SHARED.COMPLETED] as string[]).includes(current.status) && sceneGroup.state === RT_MOTION.RECORDED) sceneGroup.state = RT_MOTION.ACTIVE;
    }
  }
  const explicit = new Map<string, { state: MotionStepState; source: string; parentStatus: string }>();
  for (const current of currents) {
    if (!current) continue;
    const kind = RT_MOTION.KIND in current ? String(current.kind) : RT_MOTION.RENDER;
    const states: [string, MotionStepState][] = kind === RT_MOTION.PRODUCTION ? Object.entries(RUNTIME_VALUES.STEPSTATES_CBD0DF09 in current ? current.stepStates || {} : {}) : [[S.KINDS[kind] || RT_MOTION.RENDER, current as MotionStepState]];
    for (const [name, state] of states) {
      const keys = S.ORDER.includes(name as (typeof S.ORDER)[number]) ? [name] : motionLogStageKeys(name);
      for (const key of keys) {
        const previous = explicit.get(key);
        const start = state.startedAt || current.startedAt || 0;
        if (previous && (previous.state.startedAt || 0) > start) continue;
        if (previous && previous.state.id === state.id && (previous.state.updatedAt || 0) > (state.updatedAt || 0)) continue;
        const source = sources.get(key);
        if (source && source !== current.id && (starts.get(source) || 0) > start / 1000) continue;
        explicit.set(key, { state: { ...state, startedAt: start }, source: current.id, parentStatus: current.status || "" });
      }
    }
  }
  for (const [key, { state, source, parentStatus }] of explicit) {
    const group = sections.get(key)!;
    const ownerStatus = job?.id === source ? job.status : render?.id === source ? render.status : parentStatus;
    const stopped = ([RT_SHARED.ERROR, RT_MOTION.CANCELLED, RT_SHARED.COMPLETED] as string[]).includes(ownerStatus);
    group.state = state.status === RT_SHARED.COMPLETED || (group.state === RT_MOTION.DONE && state.status !== RT_SHARED.ERROR) ? RT_MOTION.DONE : state.status === RT_SHARED.ERROR ? RT_SHARED.ERROR : state.status === RT_MOTION.CANCELLED || stopped ? RT_MOTION.CANCELLED : RT_MOTION.ACTIVE;
    if (state.segmentAt || state.elapsedMs !== undefined) {
      const total = motionStepElapsedMs(state, group.state === RT_MOTION.ACTIVE ? Date.now() : undefined);
      if (total > 0) group.durationMs = total;
    } else if (state.startedAt) {
      const end = group.state === RT_MOTION.ACTIVE ? Date.now() : state.updatedAt || state.startedAt;
      if (end > state.startedAt) group.durationMs = end - state.startedAt;
    }
    sources.set(key, source);
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
