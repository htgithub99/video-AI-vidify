import _ from "lodash";
import { MOTION_PARTS as P } from "../constants/motionParts.js";
import type { MotionChapter, MotionGenState, MotionSeriesPart, MotionSeriesState, MotionStoryAnalysis } from "../types/motionVideo.js";
const chapterSeconds = (chapter: MotionChapter): number => chapter.targetSeconds || P.DEFAULT_CHAPTER_SECONDS;
export const motionPartPlan = (chapters: MotionChapter[], wanted: number): MotionSeriesPart[] => {
  const count = _.clamp(Math.round(wanted) || 1, 1, Math.max(1, chapters.length));
  const total = _.sumBy(chapters, chapterSeconds);
  const parts: MotionSeriesPart[] = [];
  let current: MotionChapter[] = [],
    elapsed = 0;
  const appendPart = (): void => {
    parts.push({ index: parts.length, chapterIds: _.map(current, (c) => c.id), seconds: _.sumBy(current, chapterSeconds) });
  };
  chapters.forEach((chapter, index) => {
    const left = chapters.length - index,
      slots = count - parts.length;
    const goal = (total * (parts.length + 1)) / count,
      mid = elapsed + chapterSeconds(chapter) / 2;
    if (current.length && slots > 1 && (left < slots || mid > goal)) {
      appendPart();
      current = [];
    }
    current.push(chapter);
    elapsed += chapterSeconds(chapter);
  });
  if (current.length) appendPart();
  return parts;
};
export const motionPartAnalysis = (full: MotionStoryAnalysis, parts: MotionSeriesPart[], index: number, language: string): MotionStoryAnalysis => {
  const part = parts[index];
  if (!part || parts.length < 2) return full;
  const chapters = _.filter(full.chapters, (c) => _.includes(part.chapterIds, c.id));
  const before = _.filter(full.chapters, (c) => _.includes(parts[index - 1]?.chapterIds || [], c.id));
  const after = _.filter(full.chapters, (c) => _.includes(parts[index + 1]?.chapterIds || [], c.id));
  const lastBefore = _.last(before),
    firstAfter = _.first(after);
  const title = (language === P.EN ? P.TITLE.en : P.TITLE.vi)(full.title, index + 1, parts.length);
  return { ...full, title, chapters, series: _.omitBy({ index, count: parts.length, previous: lastBefore ? lastBefore.handoff || lastBefore.summary : undefined, next: firstAfter ? _.compact([firstAfter.title, firstAfter.hook || firstAfter.summary]).join(P.NEXT_JOIN) : undefined }, _.isUndefined) as MotionStoryAnalysis["series"] };
};
export const motionCarryGen = (gen?: MotionGenState): Partial<MotionGenState> | undefined => (gen ? ({ ..._.pick(gen, P.CARRY_KEYS), ...(gen.remotion ? { remotion: { ...gen.remotion, scenes: {}, inputKeys: {}, failures: {}, drafts: {}, notes: {} } } : {}) } as Partial<MotionGenState>) : undefined);
export const motionSeriesStart = (full: MotionStoryAnalysis, wanted: number, language: string): { analysis: MotionStoryAnalysis; series: MotionSeriesState | null } => {
  const parts = motionPartPlan(full.chapters, wanted);
  if (parts.length < 2) return { analysis: full, series: null };
  return { analysis: motionPartAnalysis(full, parts, 0, language), series: { analysis: full, parts, index: 0, done: [] } };
};
export const motionPartMinutes = (totalSeconds: number | undefined, count: number): number => Math.max(1, Math.round((totalSeconds || 0) / Math.max(1, count) / P.MINUTE_SECONDS));
