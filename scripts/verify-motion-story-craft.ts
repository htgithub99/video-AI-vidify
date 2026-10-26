import { ids, raw, STORY_CRAFT_QA as V } from "./motionStoryCraftVerificationTexts.js";
import assert from "node:assert/strict";
import path from "node:path";
import { readdir, readFile } from "node:fs/promises";
import { motionStoryContract, motionStoryContractErrors } from "../src/lib/motionStoryCraft.js";
import { motionStoryDraft } from "../src/lib/motionStoryRepair.js";
import { MOTION_STORY_CRAFT as CRAFT, MOTION_CREATIVE_STORY_SCHEMA } from "../src/constants/motionStoryCraft.js";
import { exhaustedMotionRoom, uncertainChatSubmission } from "../src/server/services/chatSubmissionRecovery.js";
import { MOTION_STORY_LANGUAGE as L } from "../src/constants/motionStoryLanguage.js";
import { MOTION_STORY_DOCTOR as D } from "../src/constants/motionGenre.js";
const previousStorage = process.env.VIDIFY_STORAGE_DIR;
process.env.VIDIFY_STORAGE_DIR = path.resolve(V.STORAGE(process.pid));
try {
  const { developCreativeStory, editScript, writeChapterBeats } = await import("../src/server/services/motionStoryService.js");
  assert.deepEqual(motionStoryContractErrors(raw, ids), []);
  const compactCore = { ...raw, sourceCore: { ...raw.sourceCore, causalChain: [raw.sourceCore.causalChain.join(V.CAUSAL_ARROW)], reversal: [raw.sourceCore.reversal] } };
  assert.deepEqual(motionStoryContractErrors(compactCore, ids), []);
  assert.deepEqual(motionStoryContract(compactCore), motionStoryContract(raw));
  assert.ok(motionStoryContractErrors({ ...compactCore, sourceCore: { ...compactCore.sourceCore, causalChain: [raw.sourceCore.causalChain.slice(0, 2).join(V.CAUSAL_ARROW)] } }, ids).includes(CRAFT.ERR_CORE));
  assert.ok(motionStoryContractErrors({ ...raw, chapters: [raw.chapters[0]] }, ids).length);
  assert.ok(motionStoryContractErrors({ ...raw, chapters: [raw.chapters[0], raw.chapters[0]] }, ids).length);
  assert.ok(motionStoryContractErrors({ ...raw, storySpine: { ...raw.storySpine, steps: [raw.storySpine.steps[1], raw.storySpine.steps[0]] } }, ids).length);
  assert.ok(motionStoryContractErrors({ ...raw, storySpine: { ...raw.storySpine, clues: [{ ...raw.storySpine.clues[0], setupChapterId: "b", payoffChapterId: "a" }] } }, ids).length);
  assert.ok(motionStoryContractErrors({ ...raw, sourceCore: { ...raw.sourceCore, causalChain: [V.MOOD] } }, ids).length);
  const marker = V.MARKER;
  const source: any = { title: V.MODEL, text: V.TEXT.repeat(6200) + marker + V.TEXT.repeat(6200), segments: [], sourceSeconds: 700, kind: V.BRIEF };
  const analysis: any = { videoGenre: V.GENRE, title: V.OLD_TITLE, logline: V.OLD, chapters: ids.map((id) => ({ id, title: id, summary: V.OLD_CHAPTER, keyPoints: [V.OLD_EVENT], targetSeconds: 120 })), cast: [], places: [], facts: [] };
  const prompts: string[] = [];
  const out = await developCreativeStory(analysis, source, {
    language: V.LANGUAGE,
    exec: {} as any,
    ai: async (prompt: any) => {
      prompts.push(prompt);
      return prompts.length === 1 ? { ...raw, chapters: [raw.chapters[0]] } : raw;
    },
  });
  assert.equal(prompts.length, 2);
  assert.ok(prompts[0].includes(marker));
  assert.ok(prompts[1].includes(V.PREFIX));
  assert.deepEqual(out.sourceCore, raw.sourceCore);
  assert.deepEqual(out.storySpine, raw.storySpine);
  assert.ok(out.chapters.every((ch) => ch.summary !== V.OLD_CHAPTER));
  assert.equal(out.title, raw.title);
  assert.ok(prompts[0].includes(JSON.stringify(MOTION_CREATIVE_STORY_SCHEMA)));
  const incomplete = { ...raw, sourceCore: undefined, storySpine: undefined };
  const repairPrompts: string[] = [];
  const repaired = await developCreativeStory(analysis, source, {
    language: V.LANGUAGE,
    exec: {} as any,
    ai: async (prompt) => {
      repairPrompts.push(prompt);
      return repairPrompts.length === 1 ? incomplete : { patch: { sourceCore: raw.sourceCore, storySpine: raw.storySpine } };
    },
  });
  assert.equal(repairPrompts.length, 2);
  assert.ok(repairPrompts[1].includes(CRAFT.ERR_CORE));
  assert.ok(repairPrompts[1].includes(CRAFT.ERR_SPINE));
  assert.equal(repaired.title, raw.title);
  assert.deepEqual(repaired.sourceCore, raw.sourceCore);
  assert.deepEqual(repaired.storySpine, raw.storySpine);
  assert.deepEqual(
    repaired.chapters.map((chapter) => chapter.summary),
    raw.chapters.map((chapter: any) => chapter.summary),
  );
  const partialChapters = motionStoryDraft({ patch: { chapters: [raw.chapters[1]] } }, { ...raw, chapters: [raw.chapters[0]] }, ids);
  assert.deepEqual(partialChapters, raw);
  const partialCore = motionStoryDraft({ patch: { sourceCore: { reversal: raw.sourceCore.reversal } } }, { ...raw, sourceCore: { ...raw.sourceCore, reversal: undefined } }, ids);
  assert.deepEqual(partialCore, raw);
  assert.deepEqual(motionStoryDraft({ patch: {} }, incomplete, ids), incomplete);
  for (const chapters of [
    [raw.chapters[0], raw.chapters[0]],
    [raw.chapters[0], { ...raw.chapters[1], id: V.UNKNOWN_ID }],
  ]) {
    const draft = motionStoryDraft({ patch: { chapters } }, raw, ids);
    assert.ok(motionStoryContractErrors(draft, ids).includes(CRAFT.ERR_CHAPTERS));
  }
  const foreign = { ...raw, chapters: raw.chapters.map((chapter: any, index: number) => ({ ...chapter, id: V.FOREIGN_IDS[index] })), storySpine: { steps: raw.storySpine.steps.map((step: any, index: number) => ({ ...step, chapterId: V.FOREIGN_IDS[index] })), clues: [{ ...raw.storySpine.clues[0], setupChapterId: V.FOREIGN_IDS[0], payoffChapterId: V.FOREIGN_IDS[1] }] } };
  assert.deepEqual(motionStoryDraft(foreign, {}, ids), raw);
  const reordered = motionStoryDraft({ ...raw, chapters: [...raw.chapters].reverse() }, {}, ids);
  assert.equal(reordered.chapters[0].id, ids[1]);
  for (const invalid of [null, undefined, [], {}, { patch: null }]) assert.ok(motionStoryContractErrors(motionStoryDraft(invalid, {}, ids), ids).length);
  const longIds = Array.from({ length: 60 }, (_, index) => V.CHAPTER_ID(index));
  const longStory = { ...raw, chapters: longIds.map((id) => ({ ...raw.chapters[0], id })), storySpine: { steps: longIds.map((chapterId) => ({ ...raw.storySpine.steps[0], chapterId })), clues: [{ ...raw.storySpine.clues[0], setupChapterId: longIds[0], payoffChapterId: longIds.at(-1) }] } };
  assert.deepEqual(motionStoryContractErrors(longStory, longIds), []);
  const rejectionPrompts: string[] = [];
  await assert.rejects(
    developCreativeStory(analysis, source, {
      language: V.LANGUAGE,
      exec: {} as any,
      ai: async (prompt) => {
        rejectionPrompts.push(prompt);
        return incomplete;
      },
    }),
    (error: Error) => error.message === CRAFT.CONTRACT_FAILED([CRAFT.LABELS.sourceCore, CRAFT.LABELS.storySpine]),
  );
  assert.equal(rejectionPrompts.length, D.ATTEMPTS);
  const debugFolder = path.join(process.env.VIDIFY_STORAGE_DIR!, V.DIAGNOSTIC);
  const diagnostics = await Promise.all((await readdir(debugFolder)).map(async (file) => JSON.parse(await readFile(path.join(debugFolder, file), "utf8"))));
  assert.ok(diagnostics.some((record) => record.stage === CRAFT.CONTRACT_STAGE && record.response.title === raw.title && record.errors.includes(CRAFT.ERR_CORE) && record.draft.chapters.length === ids.length));
  const cancelled = new AbortController();
  let cancellationCalls = 0;
  const cancelError = new Error(V.CANCELLED);
  await assert.rejects(
    developCreativeStory(analysis, source, {
      language: V.LANGUAGE,
      exec: {} as any,
      signal: cancelled.signal,
      ai: async () => {
        cancellationCalls++;
        cancelled.abort(cancelError);
        return raw;
      },
    }),
    (error) => error === cancelError,
  );
  assert.equal(cancellationCalls, 1);
  for (const error of [uncertainChatSubmission(V.MODEL), exhaustedMotionRoom(V.MODEL)]) {
    let calls = 0;
    await assert.rejects(
      developCreativeStory(analysis, source, {
        language: V.LANGUAGE,
        exec: {} as any,
        ai: async () => {
          calls++;
          throw error;
        },
      }),
      (caught) => caught === error,
    );
    assert.equal(calls, 1);
  }
  assert.ok(
    prompts.every((prompt) => prompt.includes(L.RULES[0])),
    V.LANGUAGE_ERROR,
  );
  for (const { code, genre, guide } of V.LANGUAGE_CASES) {
    const plan = D.PROMPT({ directive: V.TEXT, language: code, story: V.TEXT, source: V.TEXT, seconds: 120, events: 3 });
    assert.equal(plan.includes(L.RULES[0]), guide, V.LANGUAGE_ERROR);
    const chapterAnalysis = { ...out, videoGenre: genre } as typeof out;
    const chapterPrompts: string[] = [];
    const beats = await writeChapterBeats(source, chapterAnalysis, out.chapters[0], {
      language: code,
      exec: {} as any,
      isFirst: true,
      isLast: false,
      ai: async (prompt: string) => {
        chapterPrompts.push(prompt);
        return {
          beats: [
            { narration: V.FORMAL, visual: V.VISUAL, place: V.PLACE, cast: [V.SPEAKER] },
            { narration: V.QUOTED(V.DIALOGUE), visual: V.VISUAL, place: V.PLACE, utterances: [{ speaker: V.SPEAKER, role: V.ROLE, emotion: V.EMOTION, text: V.DIALOGUE }] },
          ],
        };
      },
    });
    assert.equal(chapterPrompts.length, 1);
    assert.equal(chapterPrompts[0].includes(L.RULES[0]), guide, V.LANGUAGE_ERROR);
    const editPrompts: string[] = [];
    const edited = await editScript(source, chapterAnalysis, beats, {
      language: code,
      exec: {} as any,
      ai: async (prompt: string) => {
        editPrompts.push(prompt);
        return {
          edits: [
            { id: beats[0].id, narration: V.NATURAL, reason: V.REASON },
            { id: beats[1].id, narration: V.DIALOGUE_CHANGE, reason: V.REASON },
          ],
        };
      },
    });
    assert.ok(editPrompts.length >= 1 && editPrompts.length <= beats.length);
    assert.ok(
      editPrompts.every((prompt) => prompt.includes(L.REVIEW) === guide),
      V.LANGUAGE_ERROR,
    );
    for (const beat of beats) assert.ok(editPrompts.some((prompt) => prompt.includes(JSON.stringify(beat.narration))));
    assert.equal(edited.beats[0].narration, V.NATURAL);
    assert.equal(edited.beats[0].place, beats[0].place, V.PRESERVE_ERROR);
    assert.deepEqual(edited.beats[1], beats[1], V.PRESERVE_ERROR);
  }
  const longChapters = Array.from({ length: 8 }, (_, index) => ({ ...out.chapters[0], id: V.CHAPTER_ID(index), from: undefined, to: undefined }));
  const longSource = { ...source, text: longChapters.map((chapter) => (chapter.id + V.TEXT).repeat(600)).join(V.TEXT), segments: [] };
  const longEditPrompts: string[] = [];
  await editScript(longSource, { ...out, chapters: longChapters }, longChapters.map((chapter) => ({ id: chapter.id, chapterId: chapter.id, narration: V.NATURAL, visual: V.VISUAL })) as any, {
    language: V.LANGUAGE,
    exec: {} as any,
    ai: async (prompt: string) => {
      longEditPrompts.push(prompt);
      return { edits: [] };
    },
  });
  assert.equal(longEditPrompts.length, longChapters.length);
  assert.ok(longEditPrompts.every((prompt) => !prompt.includes(longSource.text) && prompt.length < longSource.text.length));
  for (const chapter of longChapters) assert.ok(longEditPrompts.some((prompt) => prompt.includes(JSON.stringify({ id: chapter.id, chapter: chapter.id, visual: V.VISUAL, narration: V.NATURAL }))));
  process.stdout.write(V.PASSED);
} finally {
  if (previousStorage === undefined) delete process.env.VIDIFY_STORAGE_DIR;
  else process.env.VIDIFY_STORAGE_DIR = previousStorage;
}
