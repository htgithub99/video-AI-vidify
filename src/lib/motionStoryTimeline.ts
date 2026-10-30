import * as COMMON_RUNTIME from "../constants/sourceText.js";
import { MOTION_STORY_TIMELINE as T } from "../constants/motionStoryTimeline.js";
import { motionVideoGenre, motionVideoGenreMerges, motionVideoGenreStages } from "../constants/motionGenre.js";
import { MOTION_GENRE_STAGE as STAGE } from "../constants/motionGenreStage.js";
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
const pointStamp = (point: string): number | undefined => {
  const match = point.match(T.RANGE.STAMP);
  return match ? Number(match[1] || 0) * 3600 + Number(match[2]) * 60 + Number(match[3]) : undefined;
};
const pointWords = (point: string): Set<string> => new Set((point.replace(T.KEYPOINT.PREFIX, "").toLowerCase().match(T.KEYPOINT.WORD) || []).filter((word) => word.length > 2));
const similar = (a: Set<string>, b: Set<string>): boolean => {
  if (a.size < T.KEYPOINT.MIN_WORDS || b.size < T.KEYPOINT.MIN_WORDS) return false;
  const shared = [...a].filter((word) => b.has(word)).length;
  return shared / Math.min(a.size, b.size) >= T.KEYPOINT.SIMILAR;
};
export const motionChapterKeyPoints = (chapters: MotionChapter[], sourceSeconds?: number): { chapters: MotionChapter[]; moved: number; invented: number } => {
  let moved = 0,
    invented = 0;
  const owner = (stamp: number) => chapters.findIndex((chapter) => chapter.from !== undefined && chapter.to !== undefined && stamp >= chapter.from && stamp < chapter.to);
  const kept: { index: number; words: Set<string>; stamp?: number }[] = [];
  const next = chapters.map((chapter, index) => {
    if (!chapter.keyPoints?.length) return chapter;
    const points = chapter.keyPoints.flatMap((point) => {
      let text = point;
      let stamp = pointStamp(point);
      if (stamp !== undefined && sourceSeconds && stamp > sourceSeconds + T.RANGE.TOLERANCE) {
        text = point.replace(T.KEYPOINT.PREFIX, "");
        stamp = undefined;
        invented++;
      }
      if (stamp !== undefined) {
        const home = owner(stamp);
        if (home >= 0 && home !== index && chapters[home].keyPoints?.some((other) => pointStamp(other) === stamp)) {
          moved++;
          return [];
        }
      }
      const words = pointWords(text);
      if (kept.some((entry) => entry.index !== index && similar(entry.words, words))) {
        moved++;
        return [];
      }
      kept.push({ index, words, stamp });
      return [text];
    });
    return points.length === chapter.keyPoints.length && points.every((point, at) => point === chapter.keyPoints![at]) ? chapter : { ...chapter, keyPoints: points };
  });
  return { chapters: moved || invented ? next : chapters, moved, invented };
};
export const motionChapterContentBeats = (sourceText: string, keyPoints: number, wanted: number): number => {
  const words = (sourceText.replace(T.CONTENT.STAMP, " ").match(T.CONTENT.WORD) || []).length;
  if (!words) return wanted;
  const content = Math.max(T.CONTENT.MIN_BEATS, Math.ceil(words / T.CONTENT.SOURCE_WORDS_PER_BEAT), keyPoints * T.CONTENT.POINT_BEATS);
  return Math.min(wanted, content);
};
export const motionRepetitionFindings = (beats: MotionBeat[], language: string): MotionStoryTimelineFinding[] => {
  const size = T.REPEAT.SIZE[T.REPEAT.VI.test(language.trim()) ? "vi" : "en"];
  const seen = new Map<string, { index: number; chapter: string }[]>();
  const findings: MotionStoryTimelineFinding[] = [];
  beats.forEach((beat, index) => {
    const words = (beat.narration?.toLowerCase().match(T.REPEAT.WORD) || []) as string[];
    const grams = new Set<string>();
    for (let at = 0; at + size <= words.length; at++) {
      const gram = words.slice(at, at + size);
      if (gram.filter((word) => !T.REPEAT.STOP.test(word)).length >= T.REPEAT.CONTENT_WORDS) grams.add(gram.join(" "));
    }
    let flagged = false;
    for (const gram of grams) {
      const earlier = seen.get(gram) || [];
      const near = earlier.some((entry) => entry.chapter === beat.chapterId && index - entry.index <= T.REPEAT.NEAR);
      if (!flagged && (earlier.length >= 2 || near) && findings.length < T.REPEAT.MAX) {
        findings.push({ id: beat.id, issue: T.REPEAT.ISSUE(gram) });
        flagged = true;
      }
      seen.set(gram, [...earlier, { index, chapter: beat.chapterId }]);
    }
  });
  return findings;
};
export const motionMergeShortChapters = (chapters: MotionChapter[], genre?: unknown): MotionChapter[] => {
  if (chapters.length < 2 || !motionVideoGenreMerges(genre)) return chapters;
  const known = motionVideoGenreStages(genre);
  const solo = (chapter: MotionChapter): boolean => (chapter.stages || []).some((id) => known[id]?.SOLO);
  const out: MotionChapter[] = [];
  const join = (a: MotionChapter, b: MotionChapter): MotionChapter => {
    const stages = [...new Set([...(a.stages || []), ...(b.stages || [])])];
    const midHook = a.hook && b.hook && b.hook !== a.hook ? STAGE.MID_HOOK(b.hook) : "";
    return {
      ...a,
      from: Math.min(a.from ?? b.from ?? 0, b.from ?? a.from ?? 0),
      to: Math.max(a.to ?? b.to ?? 0, b.to ?? a.to ?? 0),
      summary: [a.summary, midHook, b.summary].filter(Boolean).join(T.MERGE.SUMMARY_JOIN),
      keyPoints: [...(a.keyPoints || []), ...(b.keyPoints || [])],
      handoff: b.handoff || a.handoff,
      hook: a.hook || b.hook,
      targetSeconds: (a.targetSeconds || 0) + (b.targetSeconds || 0),
      ...(stages.length ? { stages } : {}),
      ...(a.mustKeep || b.mustKeep ? { mustKeep: true } : {}),
      ...(a.weight || b.weight ? { weight: Math.max(a.weight || 0, b.weight || 0) } : {}),
    };
  };
  for (const chapter of chapters) {
    const previous = out.at(-1);
    const short = !!previous && ((chapter.targetSeconds || 0) < T.MERGE.MIN_SECONDS || (previous.targetSeconds || 0) < T.MERGE.MIN_SECONDS);
    const fits = !!previous && (previous.keyPoints?.length || 0) + (chapter.keyPoints?.length || 0) <= T.MERGE.MAX_POINTS;
    if (previous && short && fits && !solo(previous) && !solo(chapter)) out[out.length - 1] = join(previous, chapter);
    else out.push({ ...chapter });
  }
  return out.length === chapters.length ? chapters : out.map((chapter, index) => ({ ...chapter, id: T.MERGE.ID(index) }));
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
