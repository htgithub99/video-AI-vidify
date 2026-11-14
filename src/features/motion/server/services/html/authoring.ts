import * as RT_MAINTENANCE from "../../../../../constants/runtime/maintenance.js";
import { PROMPT_SOURCE_DATA } from "../../../../../constants/promptSourceData.js";
import { runMotionAi, normalizeBeats, sourceSlice, mapMotionAiPool } from "../motionStoryService.js";
import { normalizeMotionChapterMetadata } from "../../../../../lib/motionEditorialMetadata.js";
import { motionHtmlWritingDirection, motionHtmlChapterBudget } from "../../../../../lib/motionHtmlAuthoring.js";
import { motionHtmlWritingIdentities, motionHtmlWritingChapter } from "../../../../../lib/motionHtmlScene.js";
import { motionLanguageRate } from "../../../../../lib/motionLanguage.js";
import { speechUnits } from "../motionSpeechRateService.js";
import { motionInputKey } from "../motionFileUtils.js";
import { motionContentWorkerIds } from "../../../../../lib/motionAiExecution.js";
import { motionTaskCheckpoint } from "../motionTaskCheckpoint.js";
import type { MotionBeat, MotionChapter, MotionStoryAnalysis, MotionStorySource } from "../../../../../types/motionVideo.js";
import type { MotionChapterWriteOptions } from "../motionStoryService.js";
import { motionRenameAutofix } from "../../../../../lib/motionRename.js";
import { MOTION_RENAME } from "../../../../../constants/motionRename.js";
import { MOTION_STORYTELLING as STORYTELLING } from "../../../../../constants/motionStorytelling.js";
import { motionStorytellingExpansion } from "../../../../../lib/motionStorytelling.js";
import { motionGenreCraft } from "../../../../../lib/motionGenreCraft.js";
import { motionHtmlEditorialFindings } from "../../../../../lib/motionHtmlEditorialFindings.js";
import { MOTION_GENRE_CRAFT_TEXT as CRAFT } from "../../../../../constants/motionGenreCraft.js";
import { MOTION_HTML_WRITING as W } from "../../../../../constants/motionHtmlWriting.js";
const renamedBeats = (beats: MotionBeat[], analysis: MotionStoryAnalysis, log?: (line: string) => void): MotionBeat[] => {
  const fixed = motionRenameAutofix(beats, analysis);
  if (fixed.replaced) log?.(MOTION_RENAME.LOG.AUTOFIX(fixed.replaced));
  return fixed.beats;
};
const countChapterUnits = (rows: any[]): number => rows.reduce((sum, row) => sum + speechUnits(String(row?.narration || "")), 0);
const HTML_PART_ATOM_SPLIT = /(?<=[.!?。！？])\s+(?=[\p{L}\p{N}\p{P}])|\r?\n+/u;
const HTML_PART_CLAUSE_SPLIT = /(?<=[,;—–:])\s+(?=[\p{L}\p{N}\p{P}])/u;
const HTML_PART_STAMP = /\((?:(\d+):)?(\d{1,2}):(\d{2})\)|\[(?:(\d+):)?(\d{1,2}):(\d{2})\]/g;
const MAX_HTML_BEATS_PER_PART = 10;
const MAX_HTML_UNITS_PER_PART = 175;
const MAX_HTML_EDIT_BEATS_PER_BATCH = 10;
interface HtmlChapterPartSlice {
  points: string[];
  source: string;
  weight: number;
  seconds: number;
}
const parseStampSeconds = (match: RegExpMatchArray): number => {
  const hours = Number(match[1] ?? match[4] ?? 0);
  const minutes = Number(match[2] ?? match[5] ?? 0);
  const seconds = Number(match[3] ?? match[6] ?? 0);
  return hours * 3600 + minutes * 60 + seconds;
};
export const splitHtmlChapterParts = (chapter: MotionChapter, slice: string, totalSeconds: number, totalUnits: number, totalScenes: number): HtmlChapterPartSlice[] => {
  const rawDesiredParts = Math.max(Math.ceil(totalScenes / MAX_HTML_BEATS_PER_PART), Math.ceil(totalUnits / MAX_HTML_UNITS_PER_PART));
  if (rawDesiredParts <= 1) return [];
  let atoms = slice
    .split(HTML_PART_ATOM_SPLIT)
    .map((item) => item.trim())
    .filter(Boolean);
  if (atoms.length < rawDesiredParts) {
    atoms = atoms.flatMap((item) =>
      item
        .split(HTML_PART_CLAUSE_SPLIT)
        .map((sub) => sub.trim())
        .filter(Boolean),
    );
  }
  if (atoms.length < rawDesiredParts) {
    const words = slice.trim().split(/\s+/).filter(Boolean);
    if (words.length >= rawDesiredParts * 25) {
      const chunkSize = Math.max(25, Math.ceil(words.length / rawDesiredParts));
      atoms = [];
      for (let i = 0; i < words.length; i += chunkSize) {
        atoms.push(words.slice(i, i + chunkSize).join(RT_MAINTENANCE.SPACE));
      }
    }
  }
  const desiredParts = Math.min(atoms.length, rawDesiredParts);
  if (desiredParts <= 1 || atoms.length < 2) return [];
  const totalAtomChars = atoms.reduce((sum, atom) => sum + atom.length, 0) || 1;
  const groups: string[][] = [];
  let currentGroup: string[] = [];
  let accumulatedChars = 0;
  for (let i = 0; i < atoms.length; i++) {
    currentGroup.push(atoms[i]);
    accumulatedChars += atoms[i].length;
    const remainingAtoms = atoms.length - (i + 1);
    const remainingGroups = desiredParts - (groups.length + 1);
    const targetBoundary = ((groups.length + 1) * totalAtomChars) / desiredParts;
    if (remainingGroups > 0 && (remainingAtoms <= remainingGroups || accumulatedChars >= targetBoundary)) {
      groups.push(currentGroup);
      currentGroup = [];
    }
  }
  if (currentGroup.length) {
    if (groups.length < desiredParts) groups.push(currentGroup);
    else groups[groups.length - 1].push(...currentGroup);
  }
  if (groups.length <= 1) return [];
  const weights = groups.map((group) => Math.max(1, group.join(RT_MAINTENANCE.NEWLINE).length));
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0) || 1;
  let carriedStamp = -1;
  const groupStarts = groups.map((group) => {
    const marks = [...group.join(RT_MAINTENANCE.NEWLINE).matchAll(HTML_PART_STAMP)].map(parseStampSeconds);
    const start = marks.length ? Math.min(...marks) : carriedStamp;
    if (marks.length) carriedStamp = Math.max(...marks);
    return start;
  });
  const ownedPoints: string[][] = groups.map(() => []);
  const keyPoints = chapter.keyPoints?.filter((point) => point.trim()) || [];
  keyPoints.forEach((point, order) => {
    const match = [...point.matchAll(HTML_PART_STAMP)][0];
    const at = match ? parseStampSeconds(match) : undefined;
    const partIndex =
      at === undefined
        ? Math.min(groups.length - 1, Math.floor((order * groups.length) / Math.max(1, keyPoints.length)))
        : Math.max(
            0,
            groupStarts.reduce((best, start, index) => (start >= 0 && start <= at ? index : best), 0),
          );
    ownedPoints[partIndex].push(point);
  });
  return groups.map((group, index) => ({ points: ownedPoints[index], source: group.join(RT_MAINTENANCE.NEWLINE), weight: weights[index] / totalWeight, seconds: Number((totalSeconds * (weights[index] / totalWeight)).toFixed(1)) }));
};
const chapterLengthPlan = (analysis: MotionStoryAnalysis, chapter: MotionChapter, slice: string, seconds: number, units: number, log?: (line: string) => void): { seconds: number; units: number; directive: string | null } => {
  const sourceUnits = Math.max(1, speechUnits(slice.replace(STORYTELLING.SOURCE_TIMESTAMP, RT_MAINTENANCE.SPACE)));
  const needed = units / sourceUnits;
  if (needed < STORYTELLING.THIN_TRIGGER) return { seconds, units, directive: null };
  const allowed = motionStorytellingExpansion(analysis.storytelling, analysis.videoGenre);
  if (allowed <= 1) {
    const faithful = Math.min(units, Math.max(1, Math.round(sourceUnits * STORYTELLING.FAITHFUL_FILL)));
    log?.(RT_MAINTENANCE.THIN_SOURCE_FAITHFUL_LOG(String(chapter.id), sourceUnits, units, faithful));
    return { seconds: Math.max(1, (seconds * faithful) / units), units: faithful, directive: STORYTELLING.PROMPT.FAITHFUL(faithful) };
  }
  log?.(RT_MAINTENANCE.THIN_SOURCE_LOG(String(chapter.id), sourceUnits, units, needed, allowed));
  return { seconds, units, directive: CRAFT.FILL(needed, motionGenreCraft(analysis.videoGenre).fill) };
};
export const writeMotionHtmlChapter = async (source: MotionStorySource, analysis: MotionStoryAnalysis, chapter: MotionChapter, opts: MotionChapterWriteOptions): Promise<MotionBeat[]> => {
  const rate = opts.speechRate || motionLanguageRate(opts.language);
  const budget = motionHtmlChapterBudget(analysis, chapter, rate, opts.isFirst, opts.isLast);
  const slice = sourceSlice(source, chapter.from, chapter.to);
  const { seconds, units, directive: stretch } = chapterLengthPlan(analysis, chapter, slice, budget.seconds, budget.units, opts.log);
  const targetPictureSeconds = analysis.authoringSettings?.targetPictureSeconds || 14;
  const targetScenes = Math.max(1, Math.round(seconds / targetPictureSeconds));
  const minUnits = Math.max(1, Math.round(units * 0.9));
  const maxUnits = Math.max(minUnits, Math.round(units * 1.1));
  const unitsPerScene = Math.max(6, Math.round(units / targetScenes));
  const outline = analysis.chapters.length > 1 ? analysis.chapters.map(({ id, title, summary, from, to, targetSeconds }) => ({ id, title, summary, from, to, targetSeconds })) : undefined;
  const previousTail = opts.previous?.slice(-5).map((beat) => beat.narration) || opts.previousSummary;
  const exec = { ...opts.exec, responseSchema: RT_MAINTENANCE.MOTION_HTML_CHAPTER };
  const parts = splitHtmlChapterParts(chapter, slice, seconds, units, targetScenes);
  if (parts.length > 1) {
    const chapterInputKey = motionInputKey([RT_MAINTENANCE.HTML_MULTIPART_V1, chapter.id, analysis.title, analysis.authoringSettings, slice, opts.language, rate, opts.isFirst, opts.isLast, parts.length]);
    const drafts: Record<string, { inputKey: string; rows: any[]; pending: any[] }> = opts.draft?.inputKey === chapterInputKey && opts.draft?.parts ? structuredClone(opts.draft.parts) : {};
    const completed: any[] = [];
    const saveMultipartDraft = (currentRows: any[] = [], isFinal = false) => {
      opts.onDraft?.({ inputKey: chapterInputKey, rows: structuredClone(currentRows), pending: isFinal ? [] : parts.flatMap((_part, idx) => (drafts[String(idx)]?.rows?.length ? [] : [{ id: String(idx), fields: [RT_MAINTENANCE.NARRATION, RT_MAINTENANCE.SCENETEMPLATEDRAFT] as any }])), parts: structuredClone(drafts) });
    };
    saveMultipartDraft([], false);
    opts.log?.(`${RT_MAINTENANCE.CHUONG}${chapter.id}${RT_MAINTENANCE.CHIA_THANH}${parts.length}${RT_MAINTENANCE.PHAN_NHO}${MAX_HTML_BEATS_PER_PART}${RT_MAINTENANCE.PHAN_CANH_LUOT_DE_TOI_UU_TOC_DO_VA_TRANH}`);
    for (let index = 0; index < parts.length; index++) {
      opts.signal?.throwIfAborted();
      const part = parts[index];
      const usedUnits = countChapterUnits(completed);
      const usedScenes = completed.length;
      const remainingWeight = parts.slice(index).reduce((sum, item) => sum + item.weight, 0) || 1;
      const partShare = part.weight / remainingWeight;
      const remainingUnits = Math.max(12, units - usedUnits);
      const remainingScenes = Math.max(1, targetScenes - usedScenes);
      const fairUnits = Math.round(units * part.weight * CRAFT.PART_FLOOR);
      const partUnits = Math.max(fairUnits, index === parts.length - 1 ? remainingUnits : Math.max(12, Math.round(remainingUnits * partShare)));
      const partScenes = index === parts.length - 1 ? Math.max(1, Math.min(MAX_HTML_BEATS_PER_PART, remainingScenes)) : Math.max(1, Math.min(MAX_HTML_BEATS_PER_PART, Math.round(remainingScenes * partShare)));
      const partSeconds = Number((partUnits / Math.max(0.5, rate)).toFixed(1));
      const partMinUnits = Math.max(1, Math.round(partUnits * 0.9));
      const partMaxUnits = Math.max(partMinUnits, Math.round(partUnits * 1.1));
      const partUnitsPerScene = Math.max(6, Math.round(partUnits / partScenes));
      const alreadyWritten = completed.slice(-3).map((beat) => ({ id: beat.id, narration: beat.narration, visual: beat.visual, place: beat.place, cast: beat.cast }));
      const partSection = [
        opts.section,
        W.PART(index + 1, parts.length, chapter.id, chapter.title, partScenes, MAX_HTML_BEATS_PER_PART, `${chapter.id}${RT_MAINTENANCE.B}${completed.length + 1}`),
        index === 0 ? RT_MAINTENANCE.THIS_PART_OPENS_THE_CHAPTER_ESTABLISH_THE_CHAPTER_HOOK_IMMEDIATELY : RT_MAINTENANCE.CONTINUE_SEAMLESSLY_FROM_THE_LAST_BEAT_IN_ALREADYWRITTEN_WITHOUT_REPEATING,
        index < parts.length - 1 ? RT_MAINTENANCE.STOP_AT_THE_END_OF_THIS_PART_S_SOURCE_SLICE : RT_MAINTENANCE.THIS_IS_THE_FINAL_PART_OF_THE_CHAPTER_DELIVER_THE,
      ]
        .filter(Boolean)
        .join(RT_MAINTENANCE.SPACE);
      const partPrompt = [
        RT_MAINTENANCE.PARTPROMPT,
        motionHtmlWritingDirection(analysis, opts.language),
        ...(stretch ? [stretch] : []),
        W.BUDGET(partSeconds, rate, partUnits, partMinUnits, partMaxUnits, partScenes, partUnitsPerScene) + (stretch ? "" : RT_MAINTENANCE.SPACE + W.SUMMARIZE),
        opts.multiVoice === false ? RT_MAINTENANCE.ONE_NARRATOR_READS_EVERYTHING_EXACTLY_ONCE_UTTERANCES_CAN_BE_OMITTED : RT_MAINTENANCE.USE_NARRATOR_FOR_NARRATION_AND_THE_SUPPLIED_CAST_KEYS_FOR,
        RT_MAINTENANCE.PARTPROMPT_2,
        partSection,
        JSON.stringify({
          title: analysis.title,
          chapter: { ...motionHtmlWritingChapter(chapter), keyPoints: part.points.length ? part.points : chapter.keyPoints, targetSeconds: partSeconds },
          outline,
          ...motionHtmlWritingIdentities(analysis),
          previous: index === 0 ? previousTail : undefined,
          alreadyWritten: alreadyWritten.length ? alreadyWritten : undefined,
          first: opts.isFirst && index === 0,
          last: opts.isLast && index === parts.length - 1,
        }),
        PROMPT_SOURCE_DATA.WRAP(part.source),
      ].join(RT_MAINTENANCE.NEWLINE);
      const partKey = motionInputKey(partPrompt);
      const savedPart = drafts[String(index)];
      let partRows: any[];
      if (savedPart?.inputKey === partKey && Array.isArray(savedPart.rows) && savedPart.rows.length > 0) {
        partRows = savedPart.rows;
      } else {
        opts.log?.(`${RT_MAINTENANCE.VIET_PHAN_CANH_CHUONG}${chapter.id}${RT_MAINTENANCE.PHAN}${index + 1}${RT_MAINTENANCE.SLASH}${parts.length}${RT_MAINTENANCE.APPROXIMATE_PREFIX}${partScenes}${RT_MAINTENANCE.CANH}${partUnits}${RT_MAINTENANCE.AM_TIET}`);
        const rawPart = opts.ai ? await opts.ai(partPrompt, RT_MAINTENANCE.MOTION_STORY_CHAPTER, exec, opts.signal, opts.log) : await runMotionAi(partPrompt, RT_MAINTENANCE.MOTION_STORY_CHAPTER, exec, opts.signal, opts.log);
        if (!Array.isArray(rawPart?.beats) || !rawPart.beats.length) throw new Error(RT_MAINTENANCE.KHONG_DOC_DUOC_DANH_SACH_LOI_CUA_CHUONG_TU_PHAN);
        partRows = rawPart.beats.map((beat: any, beatIdx: number) => ({ ...beat, id: beat?.id || `${chapter.id}${RT_MAINTENANCE.B}${completed.length + beatIdx + 1}` }));
        drafts[String(index)] = { inputKey: partKey, rows: partRows, pending: [] };
      }
      completed.push(...partRows);
      saveMultipartDraft(completed, false);
    }
    saveMultipartDraft(completed, true);
    return renamedBeats(normalizeBeats(normalizeMotionChapterMetadata(completed), chapter.id, analysis), analysis, opts.log);
  }
  const prompt = [
    RT_MAINTENANCE.PROMPT,
    motionHtmlWritingDirection(analysis, opts.language),
    ...(stretch ? [stretch] : []),
    W.BUDGET(seconds, rate, units, minUnits, maxUnits, targetScenes, unitsPerScene) + (stretch ? "" : RT_MAINTENANCE.SPACE + W.SUMMARIZE),
    opts.multiVoice === false ? RT_MAINTENANCE.ONE_NARRATOR_READS_EVERYTHING_EXACTLY_ONCE_UTTERANCES_CAN_BE_OMITTED : RT_MAINTENANCE.USE_NARRATOR_FOR_NARRATION_AND_THE_SUPPLIED_CAST_KEYS_FOR,
    RT_MAINTENANCE.PARTPROMPT_2,
    JSON.stringify({ title: analysis.title, chapter: motionHtmlWritingChapter(chapter), outline, ...motionHtmlWritingIdentities(analysis), previous: previousTail, first: opts.isFirst, last: opts.isLast, section: opts.section }),
    PROMPT_SOURCE_DATA.WRAP(slice),
  ].join(RT_MAINTENANCE.NEWLINE);
  const key = motionInputKey(prompt);
  const raw = opts.draft?.inputKey === key && opts.draft.rows.length ? { beats: opts.draft.rows } : opts.ai ? await opts.ai(prompt, RT_MAINTENANCE.MOTION_STORY_CHAPTER, exec, opts.signal, opts.log) : await runMotionAi(prompt, RT_MAINTENANCE.MOTION_STORY_CHAPTER, exec, opts.signal, opts.log);
  const rows = raw.beats;
  if (!Array.isArray(rows)) throw new Error(RT_MAINTENANCE.KHONG_DOC_DUOC_DANH_SACH_LOI_CUA_CHUONG_TU_PHAN);
  opts.onDraft?.({ inputKey: key, rows, pending: [] });
  return renamedBeats(normalizeBeats(normalizeMotionChapterMetadata(rows), chapter.id, analysis), analysis, opts.log);
};
export const editMotionHtmlScript = async (source: MotionStorySource, analysis: MotionStoryAnalysis, beats: MotionBeat[], opts: { language: string; speechRate?: number; exec: Parameters<typeof runMotionAi>[2]; signal?: AbortSignal; log?: Parameters<typeof runMotionAi>[4]; ai?: typeof runMotionAi; scope?: string; focusIds?: string[] }) => {
  const focus = !!opts.focusIds;
  const targets = focus ? beats.filter((beat) => opts.focusIds!.includes(beat.id)) : beats;
  const rate = opts.speechRate || motionLanguageRate(opts.language);
  const slim = (items: MotionBeat[]) => items.map(({ id, chapterId, narration, utterances, place }) => ({ id, chapterId, narration, utterances, place }));
  const chapterInfo = (chapter: MotionChapter) => ({ id: chapter.id, title: chapter.title, summary: chapter.summary, from: chapter.from, to: chapter.to, targetSeconds: chapter.targetSeconds });
  const chapterBudgets = analysis.chapters.map((chapter, index) => {
    const base = motionHtmlChapterBudget(analysis, chapter, rate, index === 0, index === analysis.chapters.length - 1);
    const budget = chapterLengthPlan(analysis, chapter, sourceSlice(source, chapter.from, chapter.to), base.seconds, base.units);
    const chapterBeats = beats.filter((beat) => beat.chapterId === chapter.id);
    const currentUnits = countChapterUnits(chapterBeats);
    return { chapterId: chapter.id, targetSeconds: budget.seconds, targetUnits: budget.units, minUnits: Math.round(budget.units * 0.9), maxUnits: Math.round(budget.units * 1.1), currentUnits };
  });
  const exec = { ...opts.exec, responseSchema: RT_MAINTENANCE.MOTION_HTML_EDIT };
  const craft = motionGenreCraft(analysis.videoGenre);
  const targetIds = new Set(targets.map((beat) => beat.id));
  const fixes = motionHtmlEditorialFindings(beats, analysis, opts.language).filter((finding) => targetIds.has(finding.id));
  if (fixes.length) opts.log?.(CRAFT.LOG(fixes.length));
  const fixFor = (items: MotionBeat[]) => {
    const ids = new Set(items.map((beat) => beat.id));
    const list = fixes
      .filter((finding) => ids.has(finding.id))
      .map((finding) => {
        const beat = items.find((item) => item.id === finding.id);
        const budget = chapterBudgets.find((item) => item.chapterId === beat?.chapterId);
        const full = !!budget && budget.currentUnits >= budget.maxUnits;
        const words = String(beat?.narration || "").split(CRAFT.WORD_SPLIT).filter(Boolean).length;
        return { ...finding, maxWords: full ? words : Math.ceil(words * CRAFT.EDIT_GROWTH) + CRAFT.EDIT_SLACK };
      });
    return list.length ? { [CRAFT.NOTES_FIELD]: list } : {};
  };
  const contextFor = (chapterId?: string) => (opts.focusIds ? { [CRAFT.CONTEXT_FIELD]: beats.filter((beat) => !chapterId || beat.chapterId === chapterId).map((beat) => ({ id: beat.id, narration: beat.narration })) } : {});
  if (!opts.ai && targets.length > MAX_HTML_EDIT_BEATS_PER_BATCH) {
    const batches: { chapterId: string; items: MotionBeat[]; batchIndex: number; totalBatchesInChapter: number }[] = [];
    for (const chapter of analysis.chapters) {
      const chapterTargets = targets.filter((beat) => beat.chapterId === chapter.id);
      const totalBatchesInChapter = Math.max(1, Math.ceil(chapterTargets.length / MAX_HTML_EDIT_BEATS_PER_BATCH));
      for (let i = 0; i < chapterTargets.length; i += MAX_HTML_EDIT_BEATS_PER_BATCH) {
        batches.push({ chapterId: chapter.id, items: chapterTargets.slice(i, i + MAX_HTML_EDIT_BEATS_PER_BATCH), batchIndex: Math.floor(i / MAX_HTML_EDIT_BEATS_PER_BATCH), totalBatchesInChapter });
      }
    }
    const changes = new Map<string, any>();
    let requests = 0;
    await mapMotionAiPool(
      batches,
      async (batch, idx) => {
        opts.signal?.throwIfAborted();
        const chapter = analysis.chapters.find((item) => item.id === batch.chapterId) || analysis.chapters[0];
        const chapterBudget = chapterBudgets.find((item) => item.chapterId === batch.chapterId);
        const chapterSlice = chapter ? sourceSlice(source, chapter.from, chapter.to) : source.text;
        const sliceParts = batch.totalBatchesInChapter > 1 ? splitHtmlChapterParts(chapter, chapterSlice, chapter?.targetSeconds || 60, chapterBudget?.targetUnits || 200, batch.totalBatchesInChapter * MAX_HTML_EDIT_BEATS_PER_BATCH) : [];
        const batchSource = sliceParts[batch.batchIndex]?.source || chapterSlice;
        const batchPrompt = [
          focus ? W.FOCUS_EDIT : RT_MAINTENANCE.BATCHPROMPT,
          motionHtmlWritingDirection(analysis, opts.language),
          craft.edit,
          CRAFT.NOTES_RULE,
          JSON.stringify({
            ...fixFor(batch.items),
            ...contextFor(batch.chapterId),
            language: opts.language,
            batch: `${idx + 1}${RT_MAINTENANCE.SLASH}${batches.length}`,
            chapterBudget: focus ? undefined : chapterBudget,
            chapter: chapter ? chapterInfo(chapter) : undefined,
            beats: slim(batch.items),
            source: batchSource,
            renamed: analysis.renameEntities ? analysis.renameMap : undefined,
          }),
        ].join(RT_MAINTENANCE.NEWLINE);
        const checkpoint = motionTaskCheckpoint<any>(opts.scope, `${RT_MAINTENANCE.HTML_SCRIPT_EDIT_BATCH}${idx + 1}`, [batchPrompt]);
        let rawBatch = checkpoint.read();
        if (!rawBatch) {
          requests++;
          rawBatch = await runMotionAi(batchPrompt, RT_MAINTENANCE.MOTION_STORY_EDIT, exec, opts.signal, opts.log);
          checkpoint.save(rawBatch);
        }
        for (const edit of rawBatch?.edits || []) {
          if (edit?.id) changes.set(edit.id, edit);
        }
      },
      Math.max(1, motionContentWorkerIds(opts.exec).length),
    );
    const result = beats.map((beat) => {
      const edit = changes.get(beat.id);
      if (!edit) return beat;
      return { ...beat, narration: edit.narration ?? beat.narration, sceneTemplateDraft: edit.sceneTemplateDraft ?? (edit.narration && edit.narration !== beat.narration ? undefined : beat.sceneTemplateDraft), ...(edit.utterances ? { utterances: edit.utterances } : edit.narration && edit.narration !== beat.narration ? { utterances: undefined } : {}) };
    });
    return { beats: result, edit: { reviewed: targets.length, rewritten: changes.size, notes: [], requests, extraRequests: Math.max(0, requests - 1), dropped: 0 } };
  }
  const focusChapters = analysis.chapters.filter((chapter) => targets.some((beat) => beat.chapterId === chapter.id));
  const body = focus
    ? { ...fixFor(targets), ...contextFor(focusChapters.length === 1 ? focusChapters[0].id : undefined), language: opts.language, beats: slim(targets), source: focusChapters.map((chapter) => sourceSlice(source, chapter.from, chapter.to)).join(RT_MAINTENANCE.NEWLINE) || source.text }
    : { ...fixFor(targets), language: opts.language, chapterBudgets, chapters: analysis.chapters.map(chapterInfo), beats: slim(targets), source: source.text };
  const prompt = [focus ? W.FOCUS_EDIT : RT_MAINTENANCE.PROMPT_2, motionHtmlWritingDirection(analysis, opts.language), craft.edit, CRAFT.NOTES_RULE, JSON.stringify({ ...body, renamed: analysis.renameEntities ? analysis.renameMap : undefined })].join(RT_MAINTENANCE.NEWLINE);
  const checkpoint = motionTaskCheckpoint<any>(opts.scope, RT_MAINTENANCE.HTML_SCRIPT_EDIT, [prompt]);
  const raw = checkpoint.read() || (opts.ai ? await opts.ai(prompt, RT_MAINTENANCE.MOTION_STORY_EDIT, exec, opts.signal, opts.log) : await runMotionAi(prompt, RT_MAINTENANCE.MOTION_STORY_EDIT, exec, opts.signal, opts.log));
  checkpoint.save(raw);
  const changes = new Map<string, any>((raw.edits || []).map((edit: any) => [edit.id, edit]));
  const result = beats.map((beat) => {
    const edit = changes.get(beat.id);
    if (!edit) return beat;
    return { ...beat, narration: edit.narration ?? beat.narration, sceneTemplateDraft: edit.sceneTemplateDraft ?? (edit.narration && edit.narration !== beat.narration ? undefined : beat.sceneTemplateDraft), ...(edit.utterances ? { utterances: edit.utterances } : edit.narration && edit.narration !== beat.narration ? { utterances: undefined } : {}) };
  });
  return { beats: result, edit: { reviewed: targets.length, rewritten: changes.size, notes: [], requests: 1, extraRequests: 0, dropped: 0 } };
};
