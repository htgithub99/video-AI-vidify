import * as RT_MAINTENANCE from "../constants/runtime/maintenance.js";
import { RUNTIME_TEXT as RT_CORE } from "../constants/runtime/core.js";
import { RUNTIME_TEXT as RT_SHARED } from "../constants/runtime/shared.js";
import { stringifyJson } from "./jsonStringify.js";
import { MOTION_RESPONSE_SCHEMAS, MOTION_RESPONSE_TEXT as C } from "../constants/motionResponseContract.js";
import { MotionRepairLedger, type MotionFieldIssue } from "./motionAiRepair.js";
import { motionResponseIssues } from "./motionResponseContract.js";
import { motionSpeechResponseIssues } from "./motionSpeechResponse.js";
import type { MotionBeat } from "../types/motionVideo.js";
export const motionEditorSpeechIssues = (original: MotionBeat, edit: { narration?: string; utterances?: MotionBeat["utterances"] }, speakers: string[], preserveSpeech = true): MotionFieldIssue[] => {
  const speech = edit.utterances;
  const kept = (original.utterances || []).filter((entry) => entry.role !== RT_SHARED.NARRATION);
  const edited = Array.isArray(speech) ? speech.filter((entry) => entry?.role !== RT_SHARED.NARRATION) : [];
  const changedRoles = preserveSpeech && kept.length && (!Array.isArray(speech) || kept.some((entry) => !edited.some((line) => line?.speaker === entry.speaker && line?.role === entry.role)));
  return changedRoles || (speech !== undefined && motionSpeechResponseIssues(speech, speakers, typeof edit.narration === "string" ? edit.narration : "").length) ? [{ path: RT_SHARED.UTTERANCES, reason: C.EDIT_SPEECH }] : [];
};
export const requestMotionEditorResponse = async (prompt: string, originals: MotionBeat[], speakers: string[], preserveSpeech: boolean, request: (question: string) => Promise<any>, signal?: AbortSignal, repairContext: string = "", attempts: number = C.REPAIR_ATTEMPTS, requiredVisualIds: string[] = []): Promise<any> => {
  const first = await request(prompt);
  if (!Array.isArray(first?.edits) || !first.edits.length) return first;
  const ids = [...new Set<string>(first.edits.flatMap((edit: any) => (originals.some((line) => line.id === edit?.id) ? [edit.id] : [])))];
  const schema = MOTION_RESPONSE_SCHEMAS[RT_CORE.MOTION_STORY_EDIT].properties!.edits.items!;
  const ledger = new MotionRepairLedger<Record<string, any>>(ids, (edit, id) => {
    const line = originals.find((line) => line.id === id)!;
    const issues = motionResponseIssues(edit, { ...schema, required: [RT_SHARED.ID, RT_SHARED.NARRATION] as string[] }).map((issue) => ({ path: issue.path.split(/[.\[]/)[0], reason: stringifyJson(issue) }));
    if (requiredVisualIds.includes(id) && edit.drop !== true) {
      if (line.action && (typeof edit.action !== "string" || !edit.action.trim())) issues.push({ path: RT_MAINTENANCE.ACTION, reason: C.EDIT_VISUAL });
      if (line.scenePlan && !edit.scenePlan) issues.push({ path: RT_MAINTENANCE.SCENEPLAN, reason: C.EDIT_VISUAL });
      if (line.motionIntent && (typeof edit.motionIntent !== "string" || !edit.motionIntent.trim())) issues.push({ path: RT_MAINTENANCE.MOTIONINTENT, reason: C.EDIT_VISUAL });
    }
    issues.push(...motionEditorSpeechIssues(line, edit, speakers, preserveSpeech));
    return issues;
  });
  ledger.submit(first.edits.map((edit: any) => ({ id: edit?.id, value: edit })));
  for (let attempt = 1; attempt < attempts && ledger.pending().length; attempt++) {
    signal?.throwIfAborted();
    const pending = ledger.pending();
    const raw = await request(
      repairContext +
        RT_SHARED.SYMBOL_01BA47 +
        C.EDIT_REPAIR +
        stringifyJson({ pending, originals: originals.filter((line) => pending.some((row) => row.id === line.id)).map(({ id, narration, utterances, action, scenePlan, motionIntent }) => ({ id, narration, utterances, motionIntent, ...(requiredVisualIds.includes(id) ? { action, scenePlan } : {}) })), acceptedIds: ledger.accepted().map((row) => row.id) }),
    );
    ledger.submit((Array.isArray(raw?.edits) ? raw.edits : []).map((edit: any) => ({ id: edit?.id, value: edit })));
  }
  return { edits: ledger.accepted().map((row) => row.value) };
};
