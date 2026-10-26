import { MotionRepairLedger } from "../../lib/motionAiRepair.js";
import { motionInputKey } from "./motionFileUtils.js";
import { isTerminalMotionAiError } from "./chatSubmissionRecovery.js";
import { MOTION_PATTERNS as MP } from "../../constants/motionPatterns.js";
import * as MR from "../../constants/motionRuntime.js";
import { MOTION_SEO } from "../../constants/motionSeo.js";
import { MOTION_PRODUCTION as P } from "../../constants/motionProduction.js";
import { normalizeMotionText } from "../../lib/motionUtils.js";
import _ from "lodash";
import { chapterStarts, motionSeoSourceTitle, SEO_CHAPTERS_TOKEN, SEO_OPTION_COUNT } from "../../lib/motionSeo.js";
import type { MotionAiExecution, MotionStoryAnalysis, MotionStoryScript, MotionSeoOption, MotionSeoPack, MotionStorySource } from "../../types/motionVideo.js";
import { runMotionAi } from "./motionStoryService.js";
import { motionVideoGenrePackaging } from "../../constants/motionGenre.js";
import { MOTION_SEO_OPTION_SCHEMA } from "../../constants/motionResponseContract.js";
import { motionResponseIssues, motionResponsePrompt } from "../../lib/motionResponseContract.js";
const ARTIFACT = MR.MOTION_TEXT_MOTION_STORY_SEO;
export interface MotionSeoDraft {
  inputKey: string;
  rejected: number;
  rows: { id: string; value: Record<string, any> }[];
  chapterTitles: Record<string, string>;
  note: string;
}
const text = (v: unknown, n: number) => normalizeMotionText(v, n, MR.MOTION_TEXT_EMPTY);
export const seoScriptKey = (script: MotionStoryScript): string => motionInputKey({ title: script.title, language: script.language, beats: script.beats.map(({ id, chapterId, narration, utterances }) => ({ id, chapterId, narration, utterances })) });
export const retimeMotionSeo = (seo: MotionSeoPack, script: MotionStoryScript, analysis: MotionStoryAnalysis, durations: number[]): MotionSeoPack => {
  const starts = chapterStarts(script.beats, analysis.chapters, script.language !== MR.MOTION_TEXT_EN, durations);
  return { ...seo, timingFrom: MR.MOTION_TEXT_VOICE, chapters: seo.chapters.map((chapter) => ({ ...chapter, t: Math.round(starts[chapter.id] || 0) })) };
};
const optionsFrom = (raw: any): MotionSeoOption[] =>
  _.take(
    _.compact(
      _.map(_.castArray(raw?.seoOptions || []), (o: any) => {
        const title = text(o?.title, MOTION_SEO.TITLE_MAX_CHARACTERS);
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
export const generateMotionSeo = async (analysis: MotionStoryAnalysis, script: MotionStoryScript, opts: { language: string; exec: MotionAiExecution; source?: Pick<MotionStorySource, "title"> | null; durations?: number[]; signal?: AbortSignal; log?: (s: string) => void; ai?: typeof runMotionAi; draft?: MotionSeoDraft; onDraft?: (draft: MotionSeoDraft) => void }): Promise<MotionSeoPack> => {
  const vi = opts.language !== MR.MOTION_TEXT_EN;
  const sourceTitle = motionSeoSourceTitle(opts.source);
  const starts = chapterStarts(script.beats, analysis.chapters, vi, opts.durations);
  const dna = analysis.videoDna;
  const total = analysis.chapters.reduce((sum, chapter) => sum + (chapter.targetSeconds || 0), 0);
  const brief = {
    title: script.title || analysis.title,
    sourceTitle: sourceTitle || undefined,
    logline: analysis.logline,
    language: vi ? MR.MOTION_TEXT_VIETNAMESE : MR.MOTION_TEXT_ENGLISH,
    audience: dna?.audienceProfile,
    format: dna?.format,
    narrativeVoice: dna?.narrativeDna?.narrativeVoice || dna?.narrative.voice,
    themes: dna?.narrativeDna?.themes,
    facts: _.map(analysis.facts, MR.MOTION_TEXT_CLAIM),
    chapters: _.map(analysis.chapters, (c) => ({ id: c.id, title: c.title, summary: c.summary })),
    opening: _.map(_.take(script.beats, 3), MR.MOTION_TEXT_NARRATION),
    approxMinutes: Math.max(1, Math.round(total / 60)),
    genre: motionVideoGenrePackaging(analysis.videoGenre) || undefined,
  };
  const example = {
    seoOptions: _.times(SEO_OPTION_COUNT, (i) => ({ title: i === 0 && sourceTitle ? sourceTitle : MR.MOTION_TEMPLATE_TITLE_OPTION(i + 1), description: MR.MOTION_TEMPLATE_HOOK_PARAGRAPH_CLOSING_LINE(SEO_CHAPTERS_TOKEN), hashtags: [MR.MOTION_TEXT_TAGONE, MR.MOTION_TEXT_TAGTWO], tags: [MR.MOTION_TEXT_TAG_ONE, MR.MOTION_TEXT_TAG_TWO], seoScore: 85 + i })),
    chapterTitles: [{ id: MR.MOTION_TEXT_C1, title: MR.MOTION_TEXT_SYMBOL }],
  };
  const prompt = [MR.MOTION_TEMPLATE_ACT_AS_AN_EXCELLENT_YOUTUBE_SEO_COPYWRITER_AND_CHANNEL_EDITOR_FOR(SEO_OPTION_COUNT, JSON.stringify(brief), brief.language, SEO_CHAPTERS_TOKEN, brief.language, JSON.stringify(example)), motionResponsePrompt(ARTIFACT), ...(sourceTitle ? [MOTION_SEO.SOURCE_TITLE_RULE] : [])].join(MR.MOTION_TEXT_SYMBOL_27);
  const ledger = new MotionRepairLedger<Record<string, any>>(
    Array.from({ length: SEO_OPTION_COUNT }, (_, index) => MOTION_SEO.OPTION_ID(index)),
    (value) => motionResponseIssues(value, { ...MOTION_SEO_OPTION_SCHEMA, properties: _.pick(MOTION_SEO_OPTION_SCHEMA.properties, ["title", "description", "hashtags", "tags"]) }).map((issue) => ({ path: issue.path.split(/[.\[]/)[0], reason: JSON.stringify(issue) })),
  );
  const inputKey = motionInputKey([brief, opts.exec, seoScriptKey(script)]);
  const draft: MotionSeoDraft = opts.draft?.inputKey === inputKey ? structuredClone(opts.draft) : { inputKey, rejected: 0, rows: [], chapterTitles: {}, note: MR.MOTION_TEXT_EMPTY };
  ledger.submit(draft.rows);
  let options = optionsFrom({ seoOptions: ledger.accepted().map((row) => row.value) });
  const chapterTitles = draft.chapterTitles;
  let note = draft.note;
  const checkpoint = () => {
    Object.assign(draft, { rows: ledger.snapshot(), chapterTitles, note });
    opts.signal?.throwIfAborted();
    opts.onDraft?.(structuredClone(draft));
  };
  for (let attempt = 0; attempt < MOTION_SEO.ATTEMPTS && draft.rejected < MOTION_SEO.ATTEMPTS && options.length < SEO_OPTION_COUNT; attempt++) {
    opts.signal?.throwIfAborted();
    try {
      const repairing = draft.rejected > 0 || draft.rows.length > 0;
      const raw = await (opts.ai || runMotionAi)(repairing ? MOTION_SEO.REPAIR({ pending: ledger.pending(), story: brief, feedback: note }) : prompt, ARTIFACT, opts.exec, opts.signal, opts.log);
      opts.signal?.throwIfAborted();
      ledger.submit(
        (Array.isArray(raw?.seoOptions) ? raw.seoOptions : []).flatMap((value: any, index: number) => {
          const id = repairing ? value?.id : MOTION_SEO.OPTION_ID(index);
          return typeof id === "string" && value && typeof value === "object" ? [{ id, value }] : [];
        }),
      );
      options = optionsFrom({ seoOptions: ledger.accepted().map((row) => row.value) });
      for (const c of _.castArray(raw?.chapterTitles || [])) if (c?.id && analysis.chapters.some((chapter) => chapter.id === c.id) && !chapterTitles[_.toString(c.id)] && text(c?.title, 60)) chapterTitles[_.toString(c.id)] = text(c.title, 60);
      note = MR.MOTION_TEMPLATE_OPTIONS(options.length, SEO_OPTION_COUNT);
      if (options.length < SEO_OPTION_COUNT) draft.rejected++;
      checkpoint();
      opts.signal?.throwIfAborted();
    } catch (error) {
      if (isTerminalMotionAiError(error, opts.signal) || P.SERVICE_ERROR_RE.test(String((error as Error)?.message))) throw error;
      note = _.truncate(_.toString((error as Error)?.message || error), { length: 120 });
      opts.log?.(MR.MOTION_TEMPLATE_SEO_LAN_LOI(attempt + 1, note));
    }
  }
  if (!options.length) throw new Error(MR.MOTION_TEMPLATE_CHUA_TAO_DUOC_SEO(note));
  if (sourceTitle) {
    const index = Math.max(
      0,
      options.findIndex((option) => option.title === sourceTitle),
    );
    const sourceOption: MotionSeoOption = { ...options[index], title: sourceTitle, sourceTitleBased: true };
    options = [
      sourceOption,
      ..._.orderBy(
        options.filter((_option, i) => i !== index),
        [MR.MOTION_TEXT_SEOSCORE],
        [MR.MOTION_TEXT_DESC],
      ),
    ];
  } else options = _.orderBy(options, [MR.MOTION_TEXT_SEOSCORE], [MR.MOTION_TEXT_DESC]);
  const chapters = _.map(analysis.chapters, (c) => ({ id: c.id, t: Math.round(starts[c.id] || 0), title: chapterTitles[c.id] || c.title }));
  opts.log?.(MR.MOTION_TEMPLATE_SEO_PHUONG_AN_CHUONG_YOUTUBE(options.length, chapters.length));
  return { options, chapters, timingFrom: opts.durations?.length ? MR.MOTION_TEXT_VOICE : MR.MOTION_TEXT_ESTIMATE, scriptKey: seoScriptKey(script) };
};
