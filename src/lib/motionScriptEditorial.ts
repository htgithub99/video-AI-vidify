import { MOTION_WRITING as W } from "../constants/motionWriting.js";
import { motionScriptFindings } from "./motionScriptFindings.js";
import { normalizeMotionSpokenBeat } from "./motionSpokenNumbers.js";
import type { MotionBeat, MotionStoryAnalysis, MotionStoryScript } from "../types/motionVideo.js";
export type MotionEditorialResult = { beats: MotionBeat[]; edit: NonNullable<MotionStoryScript["edit"]> };
export const motionEditorialTargets = (beats: MotionBeat[], analysis: MotionStoryAnalysis, language: string, sourceText: string) => {
  const findings = motionScriptFindings(beats, analysis, language, sourceText);
  const all = [...findings.review, ...findings.overlap, ...findings.stage, ...findings.style, ...findings.echo, ...findings.repeat];
  const sorted = all.map((item, index) => ({ ...item, priority: W.PRIORITY[("kind" in item && typeof item.kind === "string" ? item.kind : "") || "style"] ?? 5, index })).sort((a, b) => a.priority - b.priority || a.index - b.index);
  const unique = sorted.filter((item, index) => sorted.findIndex((other) => other.id === item.id) === index);
  return { findings, ids: unique.map((item) => item.id), remaining: unique.map(({ id, issue }) => ({ id, issue })), concrete: [...new Set([...findings.overlap.map((item) => item.id), ...findings.review.filter((item) => ["source", "label", "handoff"].includes(item.kind || "")).map((item) => item.id)])] };
};
export const runMotionScriptEditorial = async (beats: MotionBeat[], analysis: MotionStoryAnalysis, language: string, sourceText: string, edit: (beats: MotionBeat[], ids: string[], supplemental: boolean) => Promise<MotionEditorialResult>, log?: (line: string) => void): Promise<MotionEditorialResult> => {
  const names = analysis.cast.map((member) => member.name);
  let current = beats.map((beat) => normalizeMotionSpokenBeat(beat, language, names));
  const speechChanged = current.filter((beat, index) => beat !== beats[index]).length;
  if (speechChanged) log?.(W.SPEECH_LOG(speechChanged));
  let report: NonNullable<MotionStoryScript["edit"]> = { reviewed: 0, rewritten: 0, notes: [], requests: 0, extraRequests: 0, dropped: 0 };
  for (let pass = 0; pass < 2; pass++) {
    const targets = motionEditorialTargets(current, analysis, language, sourceText);
    const ids = pass ? targets.concrete : targets.ids;
    if (!ids.length) break;
    log?.(pass ? W.RETRY_LOG(ids.length) : W.REVIEW_LOG(ids.length));
    const result = await edit(current, ids, pass === 1);
    current = result.beats.map((beat) => normalizeMotionSpokenBeat(beat, language, names));
    report = { reviewed: report.reviewed + result.edit.reviewed, rewritten: report.rewritten + result.edit.rewritten, notes: [...report.notes, ...result.edit.notes], requests: (report.requests || 0) + (result.edit.requests || 0), extraRequests: (report.extraRequests || 0) + (pass ? result.edit.requests || 0 : 0), dropped: (report.dropped || 0) + (result.edit.dropped || 0) };
  }
  report.remaining = motionEditorialTargets(current, analysis, language, sourceText).remaining;
  log?.(report.remaining.length ? W.REMAINING_LOG(report.remaining.length) : W.PASS_LOG);
  return { beats: current, edit: report };
};
