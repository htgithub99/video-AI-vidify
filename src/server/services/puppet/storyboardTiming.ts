import { MOTION_STORYBOARD as S } from "../../../constants/motionStoryboard.js";
import { puppetWords } from "../../../lib/motionStoryboard.js";
import type { PuppetLine } from "../../../lib/motionPuppet.js";
import type { MotionVoiceClip } from "../../../types/motionVideo.js";
export const puppetWordTimeline = (lines: PuppetLine[], clips: MotionVoiceClip[], start: number, end: number): Map<string, { at: number; timing: "words" | "estimated" }[]> => {
  const timed = clips
    .slice()
    .sort((a, b) => a.start - b.start)
    .flatMap((clip) => {
      const tokens = puppetWords(clip.text);
      const chunks = Array.from(clip.text.matchAll(S.CHUNK_RE), (match) => ({ start: match.index!, end: match.index! + match[0].length }));
      const valid = clip.words?.length && clip.words.every(([from, to], index, all) => Number.isFinite(from) && Number.isFinite(to) && from >= 0 && to > from && to <= clip.end - clip.start + S.TIME_EPSILON && (!index || from > all[index - 1][0]));
      return tokens.map((token, index) => {
        if (valid && clip.words?.length === tokens.length) return { key: token.key, at: clip.start + clip.words[index][0], timing: "words" as const };
        if (valid && clip.words?.length === chunks.length) {
          const chunk = chunks.findIndex((part) => token.start >= part.start && token.start < part.end);
          const siblings = tokens.filter((part) => part.start >= chunks[chunk].start && part.start < chunks[chunk].end);
          const position = siblings.indexOf(token);
          const [from, to] = clip.words[chunk];
          return { key: token.key, at: clip.start + from + ((to - from) * position) / siblings.length, timing: "words" as const };
        }
        return { key: token.key, at: clip.start + ((clip.end - clip.start) * index) / Math.max(1, tokens.length), timing: "estimated" as const };
      });
    });
  const total = lines.reduce((sum, line) => sum + puppetWords(line.text).length, 0);
  let cursor = 0;
  const aligned = lines.flatMap((line) => {
    const tokens = puppetWords(line.text);
    const match = timed.findIndex((_token, index) => index >= cursor && tokens.every((token, part) => token.key === timed[index + part]?.key));
    if (match >= 0) cursor = match + tokens.length;
    return tokens.map((_token, index) => ({ line: line.key, entry: match >= 0 ? timed[match + index] : undefined }));
  });
  let previous = start - S.TIME_EPSILON;
  let monotonic = true;
  for (const [index, { entry }] of aligned.entries())
    if (entry) {
      if (!Number.isFinite(entry.at) || entry.at < start || entry.at >= end || entry.at <= previous || (index > 0 && entry.at === start)) monotonic = false;
      previous = entry.at;
    }
  if (!monotonic) for (const item of aligned) item.entry = undefined;
  const result = new Map<string, { at: number; timing: "words" | "estimated" }[]>();
  let left = 0;
  let leftAt = start;
  for (let index = 0; index < aligned.length; index++) {
    const { line, entry } = aligned[index];
    let at: number;
    if (entry) {
      at = entry.at;
      left = index;
      leftAt = at;
    } else {
      const next = aligned.findIndex((item, part) => part > index && !!item.entry);
      const right = next < 0 ? total : next;
      const rightAt = next < 0 ? end : aligned[next].entry!.at;
      at = leftAt + ((rightAt - leftAt) * (index - left)) / Math.max(1, right - left);
    }
    const words = result.get(line) || [];
    words.push({ at, timing: entry?.timing || "estimated" });
    result.set(line, words);
  }
  return result;
};
