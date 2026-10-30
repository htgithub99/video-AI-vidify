import * as COMMON_RUNTIME from "../constants/sourceText.js";
import { MOTION_STORY_TIMELINE as T } from "../constants/motionStoryTimeline.js";
import { motionVideoGenre } from "../constants/motionGenre.js";
import { motionNarratorCastKey } from "./motionVoice.js";
import type { MotionBeat, MotionChapter, MotionStoryAnalysis } from "../types/motionVideo.js";
export interface MotionStoryTimelineFinding {
  id: string;
  issue: string;
}
const stamps = (chapter: MotionChapter): number[] =>
  (chapter.keyPoints || []).flatMap((point) => {
    const match = point.match(T.RANGE.STAMP);
    return match ? [Number(match[1] || 0) * 3600 + Number(match[2]) * 60 + Number(match[3])] : [];
  });
export const motionChapterRangesValid = (chapters: MotionChapter[], sourceSeconds?: number): boolean => {
  if (!sourceSeconds || !chapters.length) return true;
  const slack = T.RANGE.TOLERANCE;
  return chapters.every((chapter, index) => {
    const { from, to } = chapter;
    if (from === undefined || to === undefined || from >= to || from >= sourceSeconds || to > sourceSeconds + slack) return false;
    if (index && from < (chapters[index - 1].to ?? 0) - slack) return false;
    return stamps(chapter).every((stamp) => stamp >= from - slack && stamp < to + slack);
  });
};
export const motionChapterRanges = (chapters: MotionChapter[], sourceSeconds?: number): MotionChapter[] => {
  if (!sourceSeconds || !chapters.length || motionChapterRangesValid(chapters, sourceSeconds)) return chapters;
  const end = sourceSeconds;
  const count = chapters.length;
  const span = Math.min(T.RANGE.MIN_SPAN, end / (count * 2));
  const starts: number[] = [];
  chapters.forEach((chapter, index) => {
    const marks = stamps(chapter).filter((stamp) => stamp >= 0 && stamp < end);
    const planned = marks.length ? Math.min(...marks) : chapter.from !== undefined && chapter.from >= 0 && chapter.from < end ? chapter.from : (end * index) / count;
    const floor = index ? starts[index - 1] + span : 0;
    const ceil = Math.max(floor, end - span * (count - index));
    starts.push(index ? Math.min(Math.max(planned, floor), ceil) : 0);
  });
  return chapters.map((chapter, index) => ({ ...chapter, from: Math.round(starts[index]), to: index < count - 1 ? Math.round(starts[index + 1]) : end }));
};
export const motionChapterOverlapFindings = (beats: MotionBeat[], analysis: MotionStoryAnalysis): MotionStoryTimelineFinding[] => {
  const genre = motionVideoGenre(analysis.videoGenre);
  const narrator = motionNarratorCastKey(analysis);
  const members = analysis.cast.filter((member) => member.key !== narrator && !T.OVERLAP.NARRATOR_NAME.test(member.name.trim()));
  const tokens = (name: string) => name.split(T.OVERLAP.SPACE).filter((word) => T.OVERLAP.NAME_TOKEN.test(word));
  const shared = new Set(members.flatMap((member) => [...new Set(tokens(member.name))]).filter((word, index, all) => all.indexOf(word) !== index));
  const people = members.map((member) => ({ key: member.key, patterns: [...new Set([member.name, member.alias, ...tokens(member.name).filter((word) => !shared.has(word))].filter((name): name is string => !!name?.trim()).map((name) => name.trim()))].map(T.OVERLAP.BOUNDARY) }));
  const events = (text: string): string[] =>
    (text.match(T.OVERLAP.SENTENCE) || []).flatMap((sentence) => {
      const who = people.filter((person) => person.patterns.some((pattern) => pattern.test(sentence))).map((person) => person.key);
      const what = Object.entries(T.OVERLAP.EVENTS)
        .filter(([, pattern]) => pattern.test(sentence))
        .map(([name]) => name);
      return who.flatMap((person) => what.map((event) => person + COMMON_RUNTIME.SOURCE_TEXT_SYMBOL_16 + event));
    });
  const told = new Map<string, { chapter: string; quote: string }>();
  const findings: MotionStoryTimelineFinding[] = [];
  const spoken = beats.filter((beat) => beat.narration?.trim());
  const last = spoken.at(-1);
  for (const beat of spoken) {
    const keys = events(beat.narration);
    const repeated = keys.map((key) => told.get(key)).find((entry) => entry && entry.chapter !== beat.chapterId);
    const exempt = T.OVERLAP.EXEMPT_FINAL[genre] && beat === last;
    if (repeated && !exempt) findings.push({ id: beat.id, issue: T.OVERLAP.ISSUE[genre](repeated.chapter, repeated.quote) });
    for (const key of keys) if (!told.has(key)) told.set(key, { chapter: beat.chapterId, quote: beat.narration.trim().slice(0, T.OVERLAP.QUOTE_LIMIT) });
  }
  return findings;
};
