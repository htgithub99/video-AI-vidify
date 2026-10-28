import { RUNTIME_TEXT as RT_SHARED } from "../constants/runtime/shared.js";
import type { MotionStorySource } from "../types/motionVideo.js";
import { MOTION_PRODUCTION as P } from "../constants/motionProduction.js";
import { MOTION_PROMPT as Q } from "../constants/motionPrompt.js";
export const motionSourceChunks = (source: MotionStorySource, limit = P.LEDGER_CHUNK_CHARS): { t: number; text: string }[][] => {
  const chunks: { t: number; text: string }[][] = [];
  let current: { t: number; text: string }[] = [],
    size = 0;
  for (const segment of source.segments?.length ? source.segments : [{ t: 0, text: source.text }]) {
    let remaining = segment.text;
    while (remaining.length) {
      const room = limit - size;
      let end = Math.min(remaining.length, room);
      if (end < remaining.length) {
        const boundaries = [...remaining.slice(0, end).matchAll(new RegExp(Q.CHAPTER_SENTENCES.source, RT_SHARED.GU))];
        const sentence = boundaries.at(-1);
        const boundary = sentence && sentence.index > room / 2 ? sentence.index + sentence[0].length - 1 : remaining.slice(0, end).search(P.LAST_WHITESPACE);
        if (boundary > 0) end = boundary + 1;
      }
      current.push({ t: segment.t, text: remaining.slice(0, end) });
      size += end;
      remaining = remaining.slice(end);
      if (remaining.length || size >= limit) {
        chunks.push(current);
        current = [];
        size = 0;
      }
    }
  }
  if (current.length) chunks.push(current);
  return chunks;
};
