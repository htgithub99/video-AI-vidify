import { MOTION_RESPONSE_SCHEMAS, MOTION_RESPONSE_TEXT as C } from "../constants/motionResponseContract.js";
import { MotionRepairLedger } from "./motionAiRepair.js";
import { motionResponseIssues } from "./motionResponseContract.js";
import { motionSpeechResponseIssues } from "./motionSpeechResponse.js";
import type { MotionBeat } from "../types/motionVideo.js";
export const requestMotionEditorResponse = async (prompt: string, originals: MotionBeat[], speakers: string[], preserveSpeech: boolean, request: (question: string) => Promise<any>, signal?: AbortSignal, repairContext = ""): Promise<any> => {
  const first = await request(prompt);
  if (!Array.isArray(first?.edits) || !first.edits.length) return first;
  const ids = [...new Set<string>(first.edits.flatMap((edit: any) => (originals.some((line) => line.id === edit?.id) ? [edit.id] : [])))];
  const schema = MOTION_RESPONSE_SCHEMAS["motion-story-edit"].properties!.edits.items!;
  const ledger = new MotionRepairLedger<Record<string, any>>(ids, (edit, id) => {
    const line = originals.find((line) => line.id === id)!;
    const issues = motionResponseIssues(edit, { ...schema, required: ["id", "narration"] }).map((issue) => ({ path: issue.path.split(/[.\[]/)[0], reason: JSON.stringify(issue) }));
    if (preserveSpeech && line.utterances?.length) {
      const speech = edit.utterances;
      if (!Array.isArray(speech) || speech.length !== line.utterances.length || speech.some((entry, index) => entry?.speaker !== line.utterances![index]?.speaker || entry?.role !== line.utterances![index]?.role) || motionSpeechResponseIssues(speech, speakers, typeof edit.narration === "string" ? edit.narration : "").length) issues.push({ path: "utterances", reason: C.EDIT_SPEECH });
    }
    return issues;
  });
  ledger.submit(first.edits.map((edit: any) => ({ id: edit?.id, value: edit })));
  for (let attempt = 1; attempt < C.REPAIR_ATTEMPTS && ledger.pending().length; attempt++) {
    signal?.throwIfAborted();
    const pending = ledger.pending();
    const raw = await request(repairContext + "\n" + C.EDIT_REPAIR + JSON.stringify({ pending, originals: originals.filter((line) => pending.some((row) => row.id === line.id)).map(({ id, narration, utterances }) => ({ id, narration, utterances })), acceptedIds: ledger.accepted().map((row) => row.id) }));
    ledger.submit((Array.isArray(raw?.edits) ? raw.edits : []).map((edit: any) => ({ id: edit?.id, value: edit })));
  }
  return { edits: ledger.accepted().map((row) => row.value) };
};
