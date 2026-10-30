import { RUNTIME_VALUES } from "../constants/runtime/values.js";
import { RUNTIME_TEXT as RT_CORE } from "../constants/runtime/core.js";
import { RUNTIME_TEXT as RT_SHARED } from "../constants/runtime/shared.js";
import { MOTION_UTTERANCE_SCHEMA, MOTION_RESPONSE_TEXT as C } from "../constants/motionResponseContract.js";
import { motionResponseIssues, type MotionResponseIssue } from "./motionResponseContract.js";
import { speechWords } from "./motionVoice.js";
export const motionSpeechResponseIssues = (raw: unknown, speakers: string[], narration: string): MotionResponseIssue[] => {
  const issues = motionResponseIssues(raw, { type: RT_CORE.ARRAY, items: MOTION_UTTERANCE_SCHEMA, minItems: 1 }, RT_SHARED.UTTERANCES);
  if (!Array.isArray(raw)) return issues;
  raw.forEach((line, index) => {
    if (line?.voiceSpeaker != null && (!speakers.includes(line.voiceSpeaker) || line.voiceSpeaker === RT_CORE.NARRATOR || line.speaker === RT_CORE.NARRATOR))
      issues.push({ path: `${RUNTIME_VALUES.UTTERANCES_44A92FAC}${index}${RUNTIME_VALUES.VOICESPEAKER_877BAA87}`, expected: RUNTIME_VALUES.EXACT_NON_NARRATOR_CAST_KEY_FOR_AN_EXPLICITLY_ATTRIBUTED_VOICE_S_77FBE499, actual: String(line.voiceSpeaker), value: C.VALUE(line) });
    if (!speakers.includes(line?.speaker) || (line?.role === RT_SHARED.NARRATION && line?.speaker !== RT_CORE.NARRATOR) || (line?.speaker === RT_CORE.NARRATOR && line?.role !== undefined && line.role !== RT_SHARED.NARRATION)) issues.push({ path: `${RT_CORE.UTTERANCES}${index}${RT_CORE.SPEAKER}`, expected: C.DIALOGUE_SPEAKER, actual: String(line?.speaker), value: C.VALUE(line) });
  });
  if (raw.every((line) => typeof line?.text === "string") && speechWords(raw.map((line) => line.text).join(RT_SHARED.SYMBOL_36A9E7)) !== speechWords(narration)) issues.push({ path: RT_SHARED.UTTERANCES, expected: C.DIALOGUE_MISMATCH, actual: RT_CORE.TEXT_MISMATCH, value: C.VALUE(raw.map((line) => line.text)) });
  return issues;
};
