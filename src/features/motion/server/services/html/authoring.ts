import { runMotionAi, normalizeBeats, sourceSlice } from "../motionStoryService.js";
import { motionHtmlWritingDirection, motionHtmlChapterBudget } from "../../../../../lib/motionHtmlAuthoring.js";
import { motionHtmlIdentities } from "../../../../../lib/motionHtmlScene.js";
import { motionLanguageRate } from "../../../../../lib/motionLanguage.js";
import { speechUnits } from "../motionSpeechRateService.js";
import { motionInputKey } from "../motionFileUtils.js";
import { motionTaskCheckpoint } from "../motionTaskCheckpoint.js";
import type { MotionBeat, MotionChapter, MotionStoryAnalysis, MotionStorySource } from "../../../../../types/motionVideo.js";
import type { MotionChapterWriteOptions } from "../motionStoryService.js";

const countChapterUnits = (rows: any[]): number => rows.reduce((sum, row) => sum + speechUnits(String(row?.narration || "")), 0);

const HTML_PART_ATOM_SPLIT = /(?<=[.!?。！？])\s+(?=[\p{L}\p{N}\p{P}])|\r?\n+/u;
const HTML_PART_CLAUSE_SPLIT = /(?<=[,;—–:])\s+(?=[\p{L}\p{N}\p{P}])/u;
const HTML_PART_STAMP = /\((?:(\d+):)?(\d{1,2}):(\d{2})\)|\[(?:(\d+):)?(\d{1,2}):(\d{2})\]/g;
const MAX_HTML_BEATS_PER_PART = 2;
const MAX_HTML_UNITS_PER_PART = 75;
const MAX_HTML_EDIT_BEATS_PER_BATCH = 2;

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
    if (words.length >= rawDesiredParts * 4) {
      const chunkSize = Math.max(4, Math.ceil(words.length / rawDesiredParts));
      atoms = [];
      for (let i = 0; i < words.length; i += chunkSize) {
        atoms.push(words.slice(i, i + chunkSize).join(" "));
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
  const weights = groups.map((group) => Math.max(1, group.join("\n").length));
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0) || 1;
  let carriedStamp = -1;
  const groupStarts = groups.map((group) => {
    const marks = [...group.join("\n").matchAll(HTML_PART_STAMP)].map(parseStampSeconds);
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
  return groups.map((group, index) => ({
    points: ownedPoints[index],
    source: group.join("\n"),
    weight: weights[index] / totalWeight,
    seconds: Number((totalSeconds * (weights[index] / totalWeight)).toFixed(1)),
  }));
};

export const writeMotionHtmlChapter = async (source: MotionStorySource, analysis: MotionStoryAnalysis, chapter: MotionChapter, opts: MotionChapterWriteOptions): Promise<MotionBeat[]> => {
  const rate = opts.speechRate || motionLanguageRate(opts.language);
  const total = analysis.chapters.reduce((sum, item) => sum + (item.targetSeconds || 0), 0);
  const { pause, seconds, units } = motionHtmlChapterBudget(analysis, chapter, rate, opts.isFirst, opts.isLast);
  const targetPictureSeconds = analysis.authoringSettings?.targetPictureSeconds || 14;
  const targetScenes = Math.max(1, Math.round(seconds / targetPictureSeconds));
  const minUnits = Math.max(1, Math.round(units * 0.9));
  const maxUnits = Math.max(minUnits, Math.round(units * 1.1));
  const unitsPerScene = Math.max(6, Math.round(units / targetScenes));
  const slice = sourceSlice(source, chapter.from, chapter.to);
  const compactOutline = analysis.chapters.map(({ id, title, summary, from, to, targetSeconds }) => ({ id, title, summary, from, to, targetSeconds }));
  const previousTail = opts.previous?.slice(-5).map((beat) => beat.narration) || opts.previousSummary;
  const exec = { ...opts.exec, responseSchema: "motion-html-chapter" as const };
  const parts = splitHtmlChapterParts(chapter, slice, seconds, units, targetScenes);

  if (parts.length > 1) {
    const chapterInputKey = motionInputKey(["html-multipart-v1", chapter.id, analysis.title, analysis.authoringSettings, slice, opts.language, rate, opts.isFirst, opts.isLast, parts.length]);
    const drafts: Record<string, { inputKey: string; rows: any[]; pending: any[] }> = opts.draft?.inputKey === chapterInputKey && opts.draft?.parts ? structuredClone(opts.draft.parts) : {};
    const completed: any[] = [];
    const saveMultipartDraft = (finalRows: any[] = []) => {
      opts.onDraft?.({
        inputKey: chapterInputKey,
        rows: finalRows,
        pending: finalRows.length ? [] : parts.flatMap((_part, idx) => (drafts[String(idx)]?.rows?.length ? [] : [{ id: String(idx), fields: ["narration", "sceneTemplateDraft"] as any }])),
        parts: structuredClone(drafts),
      });
    };
    saveMultipartDraft();
    opts.log?.(`Chương ${chapter.id}: chia thành ${parts.length} phần nhỏ (~1–2 phân cảnh/lượt) để tránh quá tải token phản hồi trên video dài.`);

    for (let index = 0; index < parts.length; index++) {
      opts.signal?.throwIfAborted();
      const part = parts[index];
      const usedUnits = countChapterUnits(completed);
      const usedScenes = completed.length;
      const remainingWeight = parts.slice(index).reduce((sum, item) => sum + item.weight, 0) || 1;
      const partShare = part.weight / remainingWeight;
      const remainingUnits = Math.max(12, units - usedUnits);
      const remainingScenes = Math.max(1, targetScenes - usedScenes);
      const partUnits = index === parts.length - 1 ? remainingUnits : Math.max(12, Math.round(remainingUnits * partShare));
      const partScenes = index === parts.length - 1 ? Math.max(1, Math.min(MAX_HTML_BEATS_PER_PART, remainingScenes)) : Math.max(1, Math.min(MAX_HTML_BEATS_PER_PART, Math.round(remainingScenes * partShare)));
      const partSeconds = Number((partUnits / Math.max(0.5, rate)).toFixed(1));
      const partMinUnits = Math.max(1, Math.round(partUnits * 0.9));
      const partMaxUnits = Math.max(partMinUnits, Math.round(partUnits * 1.1));
      const partUnitsPerScene = Math.max(6, Math.round(partUnits / partScenes));
      const alreadyWritten = completed.slice(-3).map((beat) => ({
        id: beat.id,
        narration: beat.narration,
        visual: beat.visual,
        place: beat.place,
        cast: beat.cast,
      }));
      const partSection = [
        opts.section,
        `CHAPTER PART ${index + 1}/${parts.length}: Write ONLY consecutive part ${index + 1} of ${parts.length} for chapter ${chapter.id} (${chapter.title}). Return ONLY ${partScenes} beats (AT MOST ${MAX_HTML_BEATS_PER_PART} beats, starting with beat ID ${chapter.id}_b${completed.length + 1}) covering this part's SOURCE slice.`,
        index === 0
          ? "This part opens the chapter: establish the chapter hook immediately and cover only this part's source slice."
          : "Continue seamlessly from the last beat in alreadyWritten without repeating earlier hooks, facts, or scenes.",
        index < parts.length - 1
          ? "Stop at the end of this part's source slice; reserve the chapter's closing payoff/handoff for the final part."
          : "This is the final part of the chapter: deliver the chapter's closing payoff or handoff cleanly.",
      ]
        .filter(Boolean)
        .join(" ");

      const partPrompt = [
        "Write the requested chapter part in the selected spoken language. Return JSON {chapterId,beats:[{id,narration,visual,place?,cast?,sceneTemplateDraft,utterances?}]}. Stable IDs identify source events. visual is scene/map/diagram/process/timeline/comparison/card as appropriate. Do not turn a sentence into a separate picture by default.",
        motionHtmlWritingDirection(analysis, opts.language),
        `Language=${opts.language}. THIS CHAPTER PART (${index + 1}/${parts.length}) has approximately ${partSeconds.toFixed(1)} seconds of speech at ${rate.toFixed(2)} spoken units/second: approximately ${partUnits} units TOTAL across all its beats (target window ${partMinUnits}–${partMaxUnits} spoken words/syllables across ${partScenes} beats of ~${partUnitsPerScene} units each, holding ~${targetPictureSeconds}s per scene). Full chapter budget is ${seconds.toFixed(1)}s (${units} units across ~${targetScenes} scenes); full video part has ${total}s with ${pause}s reserved for pauses. Summarize this part's causal arc within ${partMinUnits}–${partMaxUnits} spoken units; do not narrate every source sentence.`,
        opts.multiVoice === false ? "One narrator reads everything exactly once. utterances can be omitted. Do not invent dialogue." : "Use narrator for narration and the supplied cast keys for source-supported dialogue. Joined utterance text matches narration exactly; no duplicate spoken words.",
        "Source supplies facts and uncertainty; real people's actions/quotes must be supported. Describe the mechanics of approved actions without inventing another event. Keep production prose separate from speech. Preserve the full sceneTemplateDraft through the response.",
        JSON.stringify({
          title: analysis.title,
          chapter: { ...chapter, keyPoints: part.points.length ? part.points : chapter.keyPoints, targetSeconds: partSeconds },
          partIndex: index + 1,
          totalParts: parts.length,
          outline: compactOutline,
          ...motionHtmlIdentities(analysis),
          previous: index === 0 ? previousTail : undefined,
          alreadyWritten: alreadyWritten.length ? alreadyWritten : undefined,
          first: opts.isFirst && index === 0,
          last: opts.isLast && index === parts.length - 1,
          section: partSection,
        }),
        "SOURCE:\n" + part.source,
      ].join("\n");

      const partKey = motionInputKey(partPrompt);
      const savedPart = drafts[String(index)];
      let partRows: any[];
      if (savedPart?.inputKey === partKey && Array.isArray(savedPart.rows) && savedPart.rows.length > 0) {
        partRows = savedPart.rows;
      } else {
        opts.log?.(`Viết phân cảnh chương ${chapter.id} — phần ${index + 1}/${parts.length} (~${partScenes} cảnh, ~${partUnits} âm tiết)…`);
        const rawPart = opts.ai ? await opts.ai(partPrompt, "motion-story-chapter", exec, opts.signal, opts.log) : await runMotionAi(partPrompt, "motion-story-chapter", exec, opts.signal, opts.log);
        if (!Array.isArray(rawPart?.beats) || !rawPart.beats.length) throw new Error("Không đọc được danh sách lời của chương từ phản hồi AI.");
        partRows = rawPart.beats.map((beat: any, beatIdx: number) => ({
          ...beat,
          id: beat?.id || `${chapter.id}_b${completed.length + beatIdx + 1}`,
        }));
        drafts[String(index)] = { inputKey: partKey, rows: partRows, pending: [] };
        saveMultipartDraft();
      }
      completed.push(...partRows);
    }

    saveMultipartDraft(completed);
    return normalizeBeats(completed, chapter.id, analysis);
  }

  const prompt = [
    "Write the requested chapter in the selected spoken language. Return JSON {chapterId,beats:[{id,narration,visual,place?,cast?,sceneTemplateDraft,utterances?}]}. Stable IDs identify source events. visual is scene/map/diagram/process/timeline/comparison/card as appropriate. Do not turn a sentence into a separate picture by default.",
    motionHtmlWritingDirection(analysis, opts.language),
    `Language=${opts.language}. THIS CHAPTER has approximately ${seconds.toFixed(1)} seconds of speech at ${rate.toFixed(2)} spoken units/second: approximately ${units} units TOTAL across all its beats (target window ${minUnits}–${maxUnits} spoken words/syllables across roughly ${targetScenes} beats of ~${unitsPerScene} units each, holding ~${targetPictureSeconds}s per scene). This is not per beat. The full part has ${total}s. Reserve ${pause}s for pauses here. Summarize the source's causal arc within this budget; do not narrate every source sentence. More dramatic delivery must use the same budget.`,
    opts.multiVoice === false ? "One narrator reads everything exactly once. utterances can be omitted. Do not invent dialogue." : "Use narrator for narration and the supplied cast keys for source-supported dialogue. Joined utterance text matches narration exactly; no duplicate spoken words.",
    "Source supplies facts and uncertainty; real people's actions/quotes must be supported. Describe the mechanics of approved actions without inventing another event. Keep production prose separate from speech. Preserve the full sceneTemplateDraft through the response.",
    JSON.stringify({ title: analysis.title, chapter, outline: compactOutline, ...motionHtmlIdentities(analysis), previous: previousTail, first: opts.isFirst, last: opts.isLast, section: opts.section }),
    "SOURCE:\n" + slice,
  ].join("\n");
  const key = motionInputKey(prompt);
  const raw = opts.draft?.inputKey === key && opts.draft.rows.length ? { beats: opts.draft.rows } : opts.ai ? await opts.ai(prompt, "motion-story-chapter", exec, opts.signal, opts.log) : await runMotionAi(prompt, "motion-story-chapter", exec, opts.signal, opts.log);
  const rows = raw.beats;
  if (!Array.isArray(rows)) throw new Error("Không đọc được danh sách lời của chương từ phản hồi AI.");
  opts.onDraft?.({ inputKey: key, rows, pending: [] });
  return normalizeBeats(rows, chapter.id, analysis);
};

export const editMotionHtmlScript = async (source: MotionStorySource, analysis: MotionStoryAnalysis, beats: MotionBeat[], opts: { language: string; exec: Parameters<typeof runMotionAi>[2]; signal?: AbortSignal; log?: Parameters<typeof runMotionAi>[4]; ai?: typeof runMotionAi; scope?: string; focusIds?: string[] }) => {
  const targets = opts.focusIds ? beats.filter((beat) => opts.focusIds!.includes(beat.id)) : beats;
  const rate = motionLanguageRate(opts.language);
  const chapterBudgets = analysis.chapters.map((chapter, index) => {
    const budget = motionHtmlChapterBudget(analysis, chapter, rate, index === 0, index === analysis.chapters.length - 1);
    const chapterBeats = targets.filter((beat) => beat.chapterId === chapter.id);
    const currentUnits = countChapterUnits(chapterBeats);
    return { chapterId: chapter.id, targetSeconds: budget.seconds, targetUnits: budget.units, minUnits: Math.round(budget.units * 0.9), maxUnits: Math.round(budget.units * 1.1), currentUnits };
  });
  const exec = { ...opts.exec, responseSchema: "motion-html-edit" as const };

  if (!opts.ai && targets.length > MAX_HTML_EDIT_BEATS_PER_BATCH) {
    const batches: { chapterId: string; items: MotionBeat[]; batchIndex: number; totalBatchesInChapter: number }[] = [];
    for (const chapter of analysis.chapters) {
      const chapterTargets = targets.filter((beat) => beat.chapterId === chapter.id);
      const totalBatchesInChapter = Math.max(1, Math.ceil(chapterTargets.length / MAX_HTML_EDIT_BEATS_PER_BATCH));
      for (let i = 0; i < chapterTargets.length; i += MAX_HTML_EDIT_BEATS_PER_BATCH) {
        batches.push({
          chapterId: chapter.id,
          items: chapterTargets.slice(i, i + MAX_HTML_EDIT_BEATS_PER_BATCH),
          batchIndex: Math.floor(i / MAX_HTML_EDIT_BEATS_PER_BATCH),
          totalBatchesInChapter,
        });
      }
    }
    const changes = new Map<string, any>();
    let requests = 0;
    for (let idx = 0; idx < batches.length; idx++) {
      opts.signal?.throwIfAborted();
      const batch = batches[idx];
      const chapter = analysis.chapters.find((item) => item.id === batch.chapterId) || analysis.chapters[0];
      const chapterBudget = chapterBudgets.find((item) => item.chapterId === batch.chapterId);
      const chapterSlice = chapter ? sourceSlice(source, chapter.from, chapter.to) : source.text;
      const sliceParts = batch.totalBatchesInChapter > 1 ? splitHtmlChapterParts(chapter, chapterSlice, chapter?.targetSeconds || 60, chapterBudget?.targetUnits || 200, batch.totalBatchesInChapter * MAX_HTML_EDIT_BEATS_PER_BATCH) : [];
      const batchSource = sliceParts[batch.batchIndex]?.source || chapterSlice;
      const batchPrompt = [
        "Edit the supplied spoken script batch once for source fidelity, strong genre voice, engaging storytelling cadence, and exact duration budget alignment. Return JSON {edits:[{id,narration,sceneTemplateDraft,utterances?,reason}]}; omit unchanged beats. If narration/action changes return its complete updated template sections 0–4 as well. Preserve chapters that are already within their minUnits–maxUnits window; if a chapter is below minUnits or above maxUnits, adjust its beats using only source-supported details so total spoken units match the chapter budget. Do not add prescribed stages or unsupported facts. Do not return scores or request redraws.",
        motionHtmlWritingDirection(analysis, opts.language),
        JSON.stringify({
          language: opts.language,
          batch: `${idx + 1}/${batches.length}`,
          chapterBudget,
          chapter: chapter ? { id: chapter.id, title: chapter.title, summary: chapter.summary, from: chapter.from, to: chapter.to, targetSeconds: chapter.targetSeconds } : undefined,
          beats: batch.items,
          source: batchSource,
          renamed: analysis.renameEntities ? analysis.renameMap : undefined,
        }),
      ].join("\n");
      const checkpoint = motionTaskCheckpoint<any>(opts.scope, `html-script-edit-batch-${idx + 1}`, [batchPrompt]);
      let rawBatch = checkpoint.read();
      if (!rawBatch) {
        requests++;
        rawBatch = await runMotionAi(batchPrompt, "motion-story-edit", exec, opts.signal, opts.log);
        checkpoint.save(rawBatch);
      }
      for (const edit of rawBatch?.edits || []) {
        if (edit?.id) changes.set(edit.id, edit);
      }
    }
    const result = beats.map((beat) => {
      const edit = changes.get(beat.id);
      if (!edit) return beat;
      return {
        ...beat,
        narration: edit.narration ?? beat.narration,
        sceneTemplateDraft: edit.sceneTemplateDraft ?? (edit.narration && edit.narration !== beat.narration ? undefined : beat.sceneTemplateDraft),
        ...(edit.utterances ? { utterances: edit.utterances } : edit.narration && edit.narration !== beat.narration ? { utterances: undefined } : {}),
      };
    });
    return { beats: result, edit: { reviewed: targets.length, rewritten: changes.size, notes: [], requests, extraRequests: Math.max(0, requests - 1), dropped: 0 } };
  }

  const prompt = [
    "Edit the supplied spoken script once for source fidelity, strong genre voice, engaging storytelling cadence, and exact duration budget alignment. Return JSON {edits:[{id,narration,sceneTemplateDraft,utterances?,reason}]}; omit unchanged beats. If narration/action changes return its complete updated template sections 0–4 as well. Preserve chapters that are already within their minUnits–maxUnits window; if a chapter is below minUnits or above maxUnits, adjust its beats using only source-supported details so total spoken units match the chapter budget. Do not add prescribed stages or unsupported facts. Do not return scores or request redraws.",
    motionHtmlWritingDirection(analysis, opts.language),
    JSON.stringify({ language: opts.language, chapterBudgets, chapters: analysis.chapters, beats: targets, source: source.text, renamed: analysis.renameEntities ? analysis.renameMap : undefined }),
  ].join("\n");
  const checkpoint = motionTaskCheckpoint<any>(opts.scope, "html-script-edit", [prompt]);
  const raw = checkpoint.read() || (opts.ai ? await opts.ai(prompt, "motion-story-edit", exec, opts.signal, opts.log) : await runMotionAi(prompt, "motion-story-edit", exec, opts.signal, opts.log));
  checkpoint.save(raw);
  const changes = new Map<string, any>((raw.edits || []).map((edit: any) => [edit.id, edit]));
  const result = beats.map((beat) => {
    const edit = changes.get(beat.id);
    if (!edit) return beat;
    return { ...beat, narration: edit.narration ?? beat.narration, sceneTemplateDraft: edit.sceneTemplateDraft ?? (edit.narration && edit.narration !== beat.narration ? undefined : beat.sceneTemplateDraft), ...(edit.utterances ? { utterances: edit.utterances } : edit.narration && edit.narration !== beat.narration ? { utterances: undefined } : {}) };
  });
  return { beats: result, edit: { reviewed: targets.length, rewritten: changes.size, notes: [], requests: 1, extraRequests: 0, dropped: 0 } };
};
