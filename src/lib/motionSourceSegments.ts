import { MOTION_SOURCE_SEGMENTS as S } from "../constants/motionSourceSegments.js";
export interface MotionTimedSegment {
  t: number;
  text: string;
}
const wordsOf = (text: string): number => text.split(S.WHITESPACE).filter(Boolean).length;
export const motionSplitUntimed = (text: string, offset = 0): MotionTimedSegment[] => {
  const segments: MotionTimedSegment[] = [];
  let buffer: string[] = [];
  let bufferWords = 0;
  let spoken = 0;
  const flush = () => {
    if (!buffer.length) return;
    segments.push({ t: offset + Math.round(spoken / S.RATE), text: buffer.join(S.SPACE) });
    spoken += bufferWords;
    buffer = [];
    bufferWords = 0;
  };
  for (const sentence of text.split(S.SENTENCE).map((line) => line.trim()).filter(Boolean)) {
    buffer.push(sentence);
    bufferWords += wordsOf(sentence);
    if (bufferWords >= S.CHUNK_WORDS) flush();
  }
  flush();
  return segments;
};
export const motionSourceSegments = (source: { segments?: MotionTimedSegment[] }): MotionTimedSegment[] => {
  const segments = source.segments || [];
  if (segments.length !== 1 || wordsOf(segments[0].text) < S.CHUNK_WORDS * 2) return segments;
  return motionSplitUntimed(segments[0].text, segments[0].t);
};
