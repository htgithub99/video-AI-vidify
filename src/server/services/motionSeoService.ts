import { MOTION_PATTERNS as MP } from "../../constants/motionPatterns.js";
import * as MR from "../../constants/motionRuntime.js";
import { normalizeMotionText } from "../../lib/motionUtils.js";
import _ from "lodash";
import { chapterStarts, SEO_CHAPTERS_TOKEN, SEO_OPTION_COUNT } from "../../lib/motionSeo.js";
import type { MotionAiExecution, MotionStoryAnalysis, MotionStoryScript, MotionSeoOption, MotionSeoPack } from "../../types/motionVideo.js";
import { runMotionAi } from "./motionStoryService.js";
import { motionVideoGenrePackaging } from "../../constants/motionGenre.js";
const ARTIFACT = MR.MOTION_TEXT_MOTION_STORY_SEO;
const text = (v: unknown, n: number) => normalizeMotionText(v, n, MR.MOTION_TEXT_EMPTY);
export const seoScriptKey = (script: MotionStoryScript): string =>
  MR.MOTION_TEMPLATE_SYMBOL_271(
    script.beats.length,
    _.sumBy(script.beats, (b) => b.narration.length),
  );
const optionsFrom = (raw: any): MotionSeoOption[] =>
  _.take(
    _.compact(
      _.map(_.castArray(raw?.seoOptions || []), (o: any) => {
        const title = text(o?.title, 100);
        const description = text(o?.description, 4500);
        if (!title || !description) return null;
        const hashtags = _.take(
          _.uniq(
            _.compact(
              _.map(_.castArray(o?.hashtags || []), (h) => {
                const t = text(h, 40).replace(MP.WHITESPACE_GLOBAL, MR.MOTION_TEXT_EMPTY);
                return t ? (t.startsWith(MR.MOTION_TEXT_SYMBOL_44) ? t : MR.MOTION_TEMPLATE_SYMBOL_272(t)) : MR.MOTION_TEXT_EMPTY;
              }),
            ),
          ),
          15,
        );
        const tags = _.take(_.uniq(_.compact(_.map(_.castArray(o?.tags || []), (t) => text(t, 60)))), 20);
        return { title, description, hashtags, tags, seoScore: _.clamp(Math.round(_.toNumber(o?.seoScore) || 0), 0, 100) };
      }),
    ),
    SEO_OPTION_COUNT,
  );
export const generateMotionSeo = async (analysis: MotionStoryAnalysis, script: MotionStoryScript, opts: { language: string; exec: MotionAiExecution; durations?: number[]; signal?: AbortSignal; log?: (s: string) => void; ai?: typeof runMotionAi }): Promise<MotionSeoPack> => {
  const vi = opts.language !== MR.MOTION_TEXT_EN;
  const starts = chapterStarts(script.beats, analysis.chapters, vi, opts.durations);
  const dna = analysis.videoDna;
  const total = _.max(Object.values(starts)) || 0;
  const brief = {
    title: analysis.title,
    logline: analysis.logline,
    language: vi ? MR.MOTION_TEXT_VIETNAMESE : MR.MOTION_TEXT_ENGLISH,
    audience: dna?.audienceProfile,
    format: dna?.format,
    narrativeVoice: dna?.narrativeDna?.narrativeVoice || dna?.narrative.voice,
    themes: dna?.narrativeDna?.themes,
    facts: _.map(analysis.facts, MR.MOTION_TEXT_CLAIM),
    chapters: _.map(analysis.chapters, (c) => ({ id: c.id, title: c.title, summary: c.summary, startSeconds: Math.round(starts[c.id] || 0) })),
    opening: _.map(_.take(script.beats, 3), MR.MOTION_TEXT_NARRATION),
    approxMinutes: Math.max(1, Math.round(total / 60)),
    genre: motionVideoGenrePackaging(analysis.videoGenre) || undefined,
  };
  const example = {
    seoOptions: _.times(SEO_OPTION_COUNT, (i) => ({ title: MR.MOTION_TEMPLATE_TITLE_OPTION(i + 1), description: MR.MOTION_TEMPLATE_HOOK_PARAGRAPH_CLOSING_LINE(SEO_CHAPTERS_TOKEN), hashtags: [MR.MOTION_TEXT_TAGONE, MR.MOTION_TEXT_TAGTWO], tags: [MR.MOTION_TEXT_TAG_ONE, MR.MOTION_TEXT_TAG_TWO], seoScore: 85 + i })),
    chapterTitles: [{ id: MR.MOTION_TEXT_C1, title: MR.MOTION_TEXT_SYMBOL }],
  };
  const prompt = MR.MOTION_TEMPLATE_ACT_AS_AN_EXCELLENT_YOUTUBE_SEO_COPYWRITER_AND_CHANNEL_EDITOR_FOR(SEO_OPTION_COUNT, JSON.stringify(brief), brief.language, SEO_CHAPTERS_TOKEN, brief.language, JSON.stringify(example));
  let options: MotionSeoOption[] = [];
  let chapterTitles: Record<string, string> = {};
  let note: string = MR.MOTION_TEXT_EMPTY;
  for (let attempt = 0; attempt < 2 && options.length < SEO_OPTION_COUNT; attempt++) {
    try {
      const raw = await (opts.ai || runMotionAi)(attempt ? MR.MOTION_TEMPLATE_YOUR_PREVIOUS_ANSWER_WAS_INCOMPLETE_RETURN_ALL_OPTIONS_AND_EVERY_(prompt, note, SEO_OPTION_COUNT) : prompt, ARTIFACT, opts.exec, opts.signal, opts.log);
      const got = optionsFrom(raw);
      if (got.length >= options.length) options = got;
      for (const c of _.castArray(raw?.chapterTitles || [])) if (c?.id && text(c?.title, 60)) chapterTitles[_.toString(c.id)] = text(c.title, 60);
      note = MR.MOTION_TEMPLATE_OPTIONS(options.length, SEO_OPTION_COUNT);
    } catch (error) {
      if (opts.signal?.aborted) throw error;
      note = _.truncate(_.toString((error as Error)?.message || error), { length: 120 });
      opts.log?.(MR.MOTION_TEMPLATE_SEO_LAN_LOI(attempt + 1, note));
    }
  }
  if (!options.length) throw new Error(MR.MOTION_TEMPLATE_CHUA_TAO_DUOC_SEO(note));
  options = _.orderBy(options, [MR.MOTION_TEXT_SEOSCORE], [MR.MOTION_TEXT_DESC]);
  const chapters = _.map(analysis.chapters, (c) => ({ id: c.id, t: Math.round(starts[c.id] || 0), title: chapterTitles[c.id] || c.title }));
  opts.log?.(MR.MOTION_TEMPLATE_SEO_PHUONG_AN_CHUONG_YOUTUBE(options.length, chapters.length));
  return { options, chapters, timingFrom: opts.durations?.length ? MR.MOTION_TEXT_VOICE : MR.MOTION_TEXT_ESTIMATE, scriptKey: seoScriptKey(script) };
};
