import { MOTION_UTTERANCE_SCHEMA, MOTION_RESPONSE_TEXT as C } from "../constants/motionResponseContract.js";
import { motionResponseIssues, type MotionResponseIssue } from "./motionResponseContract.js";
import { speechWords } from "./motionVoice.js";
export const motionSpeechResponseIssues = (raw: unknown, speakers: string[], narration: string): MotionResponseIssue[] => {
  const issues = motionResponseIssues(raw, { type: "array", items: MOTION_UTTERANCE_SCHEMA, minItems: 1 }, "utterances");
  if (!Array.isArray(raw)) return issues;
  raw.forEach((line, index) => {
    if (!speakers.includes(line?.speaker) || (line?.role === "narration" && line?.speaker !== "narrator") || (line?.speaker === "narrator" && line?.role !== undefined && line.role !== "narration")) issues.push({ path: `utterances[${index}].speaker`, expected: C.DIALOGUE_SPEAKER, actual: String(line?.speaker), value: C.VALUE(line) });
  });
  if (raw.every((line) => typeof line?.text === "string") && speechWords(raw.map((line) => line.text).join(" ")) !== speechWords(narration)) issues.push({ path: "utterances", expected: C.DIALOGUE_MISMATCH, actual: "text mismatch", value: C.VALUE(raw.map((line) => line.text)) });
  return issues;
};
