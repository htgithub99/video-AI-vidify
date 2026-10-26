import { MOTION_LOG_SECTIONS as S } from "../constants/motionLogSections.js";
import { MOTION_PROGRESS as P } from "../constants/motionProgress.js";
import { motionFlowLogRows } from "./motionLogHistory.js";
import type { MotionLogEntry, MotionStoryJobState, MotionJobState, MotionProductionResult } from "../types/motionVideo.js";
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
export const motionLogSections = (entries: MotionLogEntry[], language = "vi", job?: MotionStoryJobState | null, render?: MotionJobState | null): MotionLogSection[] => {
  const text = S.TEXT[language === "en" ? "en" : "vi"];
  const sections = new Map<string, MotionLogSection>(S.ORDER.map((key) => [key, { key, rows: [], state: "waiting", summary: "", lastOrder: -1 }]));
  const phase = new Map<string, string>();
  let order = 0;
  for (const row of motionFlowLogRows(entries)) {
    const id = row.key.slice(0, row.key.lastIndexOf(":"));
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
    const key = declared || kind || inferred || phase.get(id) || "other";
    phase.set(id, key);
    const group = sections.get(key) || sections.get("other")!;
    const technical = S.TECHNICAL.test(message);
    const failure = S.FAILURE.test(message);
    const display = S.CAPTCHA.test(message) ? text.captcha : S.CONTEXT_ERROR.test(message) ? text.contextError : S.OBJECT_ERROR.test(message) ? text.objectError : S.REPAIR.test(message) ? (failure ? text.invalidData : text.repair) : technical && failure ? text.failed : message;
    const substage = key === "scenes" ? scopes.filter((scope) => Object.values(P.STAGE).includes(scope as typeof P.STAGE.PLAN)).at(-1) : undefined;
    group.rows.push({ key: row.key, time, message: substage ? `${substage} · ${display}` : display, raw: row.line, technical, visible: !technical || display !== message });
    group.lastOrder = order++;
    if (group.state === "waiting") group.state = "recorded";
    if (failure) group.state = "error";
    if (S.COMPLETE.test(message)) group.state = "done";
  }
  const completed = (key: string, yes: unknown) => {
    if (yes) sections.get(key)!.state = "done";
  };
  if (job?.kind === "production") {
    const result = job.result as MotionProductionResult | undefined;
    completed("analyze", result?.analysis);
    completed("script", result?.script?.beats?.length && motionLogStageKeys(job.stage || "").some((key) => ["scenes", "voice", "seo", "render"].includes(key)));
    completed("seo", result?.seo?.options?.length);
    completed("voice", result?.voice?.audioId);
    completed("scenes", result?.script?.gen?.puppet?.report && !result.script.gen.puppet.report.missing);
    completed("render", result?.rendered);
  }
  for (const current of [job, render]) {
    if (!current) continue;
    const kind = "kind" in current ? String(current.kind) : "render";
    const stages = kind === "production" ? motionLogStageKeys(current.stage || "") : [S.KINDS[kind] || "other"];
    const errorKey = current.status === "error" && kind === "production" ? motionLogSectionKey(current.error || "") : undefined;
    for (const key of errorKey ? [errorKey] : stages.length ? stages : ["other"]) {
      const group = sections.get(key)!;
      if (current.status === "error") group.state = "error";
      else if (current.status === "cancelled") {
        if (group.state !== "done") group.state = "cancelled";
      } else if (current.status === "completed") {
        if (kind !== "production") group.state = "done";
      } else if (group.state !== "done") group.state = "active";
    }
    for (const ai of Object.values("activeAi" in current ? current.activeAi || {} : {})) {
      if (["error", "cancelled", "completed"].includes(current.status)) continue;
      const active = motionLogSectionKey(ai.artifact);
      if (active && sections.get(active)!.state !== "done" && ai.phase !== "done") sections.get(active)!.state = "active";
    }
  }
  return S.ORDER.filter((key) => S.CORE.includes(key) || sections.get(key)!.state !== "waiting").map((key) => {
    const group = sections.get(key)!;
    const visible = group.rows.filter((row) => row.visible);
    const counters = visible.filter((row) => S.COUNTER.test(row.message));
    const last = visible.at(-1);
    const urgent = last && (S.CAPTCHA.test(last.raw) || S.FAILURE.test(last.message) || S.OBJECT_ERROR.test(last.raw));
    group.summary = (group.state === "active" && !urgent ? counters.at(-1) || last : last)?.message || (group.rows.length ? text.count(group.rows.length) : group.state === "error" ? text.failed : text.empty);
    return group;
  });
};
