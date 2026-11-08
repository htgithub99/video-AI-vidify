import * as RT_MAINTENANCE from "../constants/runtime/maintenance.js";
import { MOTION_SPEECH as C, MOTION_SPEECH_ATTRIBUTION as A } from "../constants/motionSpeech.js";
import { soundText } from "./motionSound.js";
import { RUNTIME_VALUES } from "../constants/runtime/values.js";
import type { MotionUtterance } from "../types/motionVideo.js";
export const motionCharacterAttribution = (line: Pick<MotionUtterance, "speaker" | "role" | "text">, narration?: string): RegExpExecArray | null => {
  if (line?.speaker === RUNTIME_VALUES.NARRATOR_663EE49C || (line?.role !== RUNTIME_VALUES.DIALOGUE_ABE0BA24 && line?.role !== RUNTIME_VALUES.OFFSCREEN_44B609C2) || typeof line?.text !== "string") return null;
  const match = A.LEAD.exec(line.text);
  if (match && narration) {
    const at = narration.indexOf(line.text.trim());
    if (at >= 0 && narration.indexOf(line.text.trim(), at + 1) < 0) {
      for (let index = 0; index < at; index++) {
        if (narration[index] === RT_MAINTENANCE.SINGLE_QUOTE && A.LETTER.test(narration[index - 1] || "") && A.LETTER.test(narration[index + 1] || "")) continue;
        const end = motionSpeechQuoteEnd(narration.slice(index));
        if (end === undefined) continue;
        if (index + end > at) return null;
        index += end - 1;
      }
    }
  }
  return match && !A.SELF.test(soundText(match[1]).trim()) ? match : null;
};
export const hasMisassignedMotionSpeech = (lines: MotionUtterance[], narration?: string): boolean => lines.some((line) => !!motionCharacterAttribution(line, narration));
export const motionSpeechQuoteEnd = (text: string): number | undefined => {
  const opening = A.OPEN_QUOTE.exec(text);
  if (!opening) return;
  const quote = opening[0].at(-1)!;
  const closing = A.QUOTES[quote];
  const encoded = opening[0].length > 1;
  let depth = 1;
  for (let index = opening[0].length; index < text.length; index++) {
    let slashes = 0;
    for (let at = index - 1; at >= 0 && text[at] === RT_MAINTENANCE.BACKSLASH; at--) slashes++;
    if (quote === RT_MAINTENANCE.SINGLE_QUOTE && A.LETTER.test(text[index - 1] || "") && A.LETTER.test(text[index + 1] || "")) continue;
    if (quote !== closing && text[index] === quote && slashes % 2 === 0) depth++;
    if (text[index] === closing && (encoded ? slashes % 2 === 1 : slashes % 2 === 0) && --depth === 0) return index + 1;
  }
};
export const motionQuotedSpeech = (narration: string, text: string): boolean => {
  const source = narration.replace(C.WHITESPACE, C.SPACE);
  const head = text.replace(C.QUOTE_EDGES, C.EMPTY).replace(C.WHITESPACE, C.SPACE).trim().slice(0, C.QUOTE_HEAD);
  if (!head) return false;
  let at = source.indexOf(head);
  while (at >= 0) {
    if (C.QUOTE_BEFORE.test(source.slice(Math.max(0, at - C.QUOTE_LOOKBACK), at))) return true;
    at = source.indexOf(head, at + 1);
  }
  return false;
};
