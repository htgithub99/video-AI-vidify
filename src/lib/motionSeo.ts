import * as MR from "../constants/motionRuntime.js";
import type { MotionSeoTexts } from "../constants/motionVideoTexts.js";
import type { MotionBeat, MotionChapter, MotionSeoOption, MotionSeoPack } from "../types/motionVideo.js";
export const SEO_CHAPTERS_TOKEN = MR.MOTION_TEXT_CHAPTERS_2;
export const SEO_OPTION_COUNT = 5;
const estimateBeatSeconds = (beat: MotionBeat, vi: boolean): number => { const units = beat.narration.split(/\s+/).filter(Boolean).length; return units / (vi ? 4.3 : 2.6) + 0.35; };
export const chapterStarts = (beats: MotionBeat[], chapters: Pick<MotionChapter, "id">[], vi: boolean, durations?: number[]): Record<string, number> => {
  const starts: Record<string, number> = {};
  let t = 0;
  beats.forEach((beat, i) => {
    if (starts[beat.chapterId] === undefined) starts[beat.chapterId] = t;
    t += durations && Number.isFinite(durations[i]) ? durations[i] : estimateBeatSeconds(beat, vi);
  });
  for (const c of chapters) if (starts[c.id] === undefined) starts[c.id] = t;
  return starts;
};
export const formatChapterTime = (seconds: number): string => { const s = Math.max(0, Math.round(seconds)); const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), r = s % 60; const pad = (n: number) => String(n).padStart(2, MR.MOTION_TEXT_0); return h ? MR.MOTION_TEMPLATE_SYMBOL_74(h, pad(m), pad(r)) : MR.MOTION_TEMPLATE_SYMBOL_75(pad(m), pad(r)); };
export const chapterLines = (pack: Pick<MotionSeoPack, "chapters">): string => { const list = [...pack.chapters].sort((a, b) => a.t - b.t).filter((c, i, all) => i === 0 || c.t - all[i - 1].t >= 10); if (list.length < 3) return ""; return list.map((c, i) => MR.MOTION_TEMPLATE_SYMBOL_44(formatChapterTime(i === 0 ? 0 : c.t), c.title)).join("\n"); };
export const renderSeoDescription = (option: MotionSeoOption, pack: Pick<MotionSeoPack, "chapters">): string => {
  const lines = chapterLines(pack);
  if (option.description.includes(SEO_CHAPTERS_TOKEN)) return option.description .replace(SEO_CHAPTERS_TOKEN, lines) .replace(/\n{3,}/g, "\n\n") .trim();
  return lines ? MR.MOTION_TEMPLATE_SYMBOL_77(option.description.trim(), lines) : option.description.trim();
};
export const renderSeoOptionText = (option: MotionSeoOption, pack: Pick<MotionSeoPack, "chapters">, index: number, text: MotionSeoTexts): string => MR.MOTION_TEMPLATE_SYMBOL_43(text.option, index + 1, text.score, option.seoScore, text.titleL, option.title, text.descL, renderSeoDescription(option, pack), text.hashL, option.hashtags.join(" "), text.tagL, option.tags.join(MR.MOTION_TEXT_SYMBOL_14));
export const retimeSeoPack = (pack: MotionSeoPack, beats: MotionBeat[], chapters: Pick<MotionChapter, "id">[], vi: boolean, durations?: number[]): MotionSeoPack => {
  const starts = chapterStarts(beats, chapters, vi, durations);
  return { ...pack, timingFrom: durations?.length ? MR.MOTION_TEXT_VOICE : MR.MOTION_TEXT_ESTIMATE, chapters: pack.chapters.map((c) => ({ ...c, t: starts[c.id] ?? c.t })) };
};
