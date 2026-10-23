import { MOTION_SPEECH as C } from "../constants/motionSpeech.js";
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
