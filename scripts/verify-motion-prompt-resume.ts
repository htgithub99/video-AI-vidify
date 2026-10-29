import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { motionPromptEditorialContext, motionPromptGroups, motionPromptGroupsAsync } from "../src/lib/motionPrompt.js";
import { motionChapterParts } from "../src/lib/motionChapterParts.js";
import { motionChapterRepairPrompt, motionChapterPending, normalizeMotionDurationResponse } from "../src/lib/motionChapterRepair.js";
import { compactMotionSourceLedger } from "../src/lib/motionSourceLedger.js";
import { MOTION_PROMPT as PROMPT } from "../src/constants/motionPrompt.js";
import { MOTION_CHAPTER_REPAIR as CHAPTER_REPAIR } from "../src/constants/motionChapterRepair.js";
import { motionStoryDraft } from "../src/lib/motionStoryRepair.js";
import { ChatContextReceipts } from "../src/server/services/chatContextReceipt.js";
import { MOTION_VISUAL_CONTRACT as V } from "../src/constants/motionVisualContract.js";
import { MOTION_STORYBOARD as S } from "../src/constants/motionStoryboard.js";
import { PUPPET as P } from "../src/constants/motionPuppet.js";
import { VISUAL_QA as T, visualReadFixture } from "./motionVisualContractVerificationTexts.js";
import { STORY_CRAFT_QA } from "./motionStoryCraftVerificationTexts.js";
const root = fs.mkdtempSync(path.join(os.tmpdir(), "motion-prompt-resume-"));
delete process.env.APP_DATA_DIR;
process.env.VIDIFY_STORAGE_DIR = root;
process.env.MOTION_SFX_SOURCE = path.join(root, "empty-sfx-source");
const { readPuppetLines } = await import("../src/server/services/puppet/director.js");
const { writeChapterBeats, editScript, buildSourceLedger } = await import("../src/server/services/motionStoryService.js");
const { motionInputKey } = await import("../src/server/services/motionFileUtils.js");
const { planPuppetStoryboard } = await import("../src/server/services/puppet/storyboard.js");
const { puppetStoryboardCovers, puppetStoryboardInputKey } = await import("../src/lib/motionStoryboard.js");
const { directMotionVoice } = await import("../src/server/services/motionVoiceDirectionService.js");
const { directPuppetSound } = await import("../src/server/services/puppet/sound.js");
const atomic = "x".repeat(20000);
assert.equal(motionPromptEditorialContext("motion_remotion_composition", "unrelated source ledger"), "");
assert.ok(motionPromptEditorialContext("motion-dna-profile", "source ledger").includes("source ledger"));
const groups = motionPromptGroups(["one", "two", atomic, "last"], (rows) => JSON.stringify(rows), 3, 50);
assert.deepEqual(groups.flat(), ["one", "two", atomic, "last"]);
assert.ok(groups.some((group) => group.length === 1 && group[0] === atomic));
const asyncGroups = await motionPromptGroupsAsync(["a", "b", "c", atomic], async (rows) => "complete schema and catalogue: " + JSON.stringify(rows), 4, 40);
assert.deepEqual(
  asyncGroups.flatMap((group) => group.items),
  ["a", "b", "c", atomic],
);
assert.ok(asyncGroups.every((group) => group.items.length === 1 || group.prompt.length <= 40));
const receipts = new ChatContextReceipts();
receipts.select("request-a");
receipts.accept(1);
receipts.select("request-a");
assert.ok(receipts.has(1));
receipts.invalidate();
assert.equal(receipts.matches("request-a"), false);
receipts.select("request-a");
assert.equal(receipts.has(1), false);
receipts.accept(1);
receipts.select("request-b");
assert.equal(receipts.has(1), false);
const locked = { title: "Accepted story", storySpine: { steps: [{ event: "Locked cause" }], clues: [] }, cast: [{ key: "a" }] };
const merged = motionStoryDraft({ patch: { title: "Wrong", storySpine: { steps: [], clues: [{ detail: "Fixed clue" }] }, cast: [] } }, locked, [], ["storySpine.clues"]);
assert.equal(merged.title, locked.title);
assert.deepEqual(merged.cast, locked.cast);
assert.deepEqual(merged.storySpine.steps, locked.storySpine.steps);
assert.equal(merged.storySpine.clues.length, 1);
const lines: any[] = Array.from({ length: 3 }, (_, index) => ({ key: "read-" + index, beatId: "beat-" + index, chapterId: "chapter", text: T.PROP_TEXT, place: T.ROOM, cast: [T.A, T.B] }));
const analysis: any = { title: T.ROOM, logline: T.TEXT, cast: T.CAST, places: [], chapters: [] };
const places: any = { [T.ROOM]: { key: T.ROOM, name: T.ROOM, desc: T.ROOM, interior: true, time: P.NIGHT } };
const row = (i: number): any => ({ i, visual: visualReadFixture(T.SCENE, T.EVIDENCE), focus: T.A, who: [T.A, T.B], place: T.ROOM, states: [T.A, T.B].map((char) => ({ char, posture: P.POSE_DEFAULT, action: P.ACTION_DEFAULT })), object: null });
const drafts: Record<string, any> = {};
let readCalls = 0;
const result = await readPuppetLines(
  lines,
  lines,
  analysis,
  places,
  {},
  {
    exec: {},
    log() {},
    onReadDraft: (key, value) => {
      drafts[key] = structuredClone(value);
    },
    ai: async () => {
      readCalls++;
      assert.ok(readCalls < 8);
      return { lines: readCalls === 1 ? [row(0), { ...row(1), states: [] }] : [row(0), row(1), row(2)] };
    },
  },
);
assert.equal(Object.keys(result.reads).length, 3);
assert.ok(readCalls > 1);
let resumedReadCalls = 0;
await readPuppetLines(
  [lines[2]],
  lines,
  analysis,
  places,
  {},
  {
    exec: {},
    log() {},
    readDrafts: drafts,
    ai: async () => {
      resumedReadCalls++;
      throw new Error("accepted item was lost");
    },
  },
);
assert.equal(resumedReadCalls, 0);
const legacyKey = motionInputKey([lines, analysis.cast, analysis.places, analysis.stylePreset, {}, undefined, lines.map(() => undefined)]);
await assert.rejects(
  readPuppetLines(
    [lines[2]],
    lines,
    analysis,
    places,
    {},
    {
      exec: {},
      log() {},
      readDrafts: { [legacyKey]: { rows: [row(0)], state: { rejected: V.READ_ATTEMPTS, errors: ["missing legacy row"] } } },
      ai: async () => {
        throw new Error("legacy missing row reset its budget");
      },
    },
  ),
  /missing legacy row/,
);
const chapter: any = { id: "chapter", title: "Đêm trở về", summary: "Người cháu về nhà, thấy chiếc bát rồi tìm ra người gõ cửa.", targetSeconds: 240, keyPoints: ["Người cháu trở về nhà.", "Bà chỉ chiếc bát trên bàn.", "Có tiếng gõ ngoài cửa.", "Người cháu nhận ra người khách."] };
const story: any = { title: chapter.title, logline: chapter.summary, chapters: [chapter], cast: [], places: [{ key: "room", name: "Gian nhà", description: "Gian nhà trong làng" }], videoGenre: STORY_CRAFT_QA.GENRE };
const source: any = { title: chapter.title, kind: "brief", text: chapter.summary, segments: [{ t: 0, text: chapter.summary }], sourceSeconds: 240 };
const partition = motionChapterParts(chapter, story, source.text, true, 900);
assert.ok(partition.length > 1);
assert.deepEqual(
  partition.flatMap((part) => part.points),
  chapter.keyPoints,
);
assert.ok(Math.abs(partition.reduce((sum, part) => sum + part.seconds, 0) - 240) < 1e-9);
const factual = "Sự kiện thứ nhất có nguồn. Sự kiện thứ hai nối tiếp. Kết luận cuối giữ nguyên!";
const factualParts = motionChapterParts(chapter, story, factual, false, 900);
assert.equal(factualParts.map((part) => part.source).join(" "), factual);
assert.ok(factualParts.every((part) => /[.!?]$/.test(part.source)));
assert.deepEqual(motionChapterParts({ ...chapter, targetSeconds: 60 }, story, factual.repeat(300), false, 218), []);
let chapterDraft: any,
  chapterCalls = 0;
const narrative = "Người cháu đứng bên cửa, bà chậm rãi chỉ chiếc bát đặt trên bàn.";
await assert.rejects(
  writeChapterBeats(source, story, chapter, {
    language: "vi",
    exec: {},
    isFirst: true,
    isLast: true,
    onDraft: (value) => {
      chapterDraft = structuredClone(value);
    },
    ai: async () => {
      if (++chapterCalls === 2) throw new Error("interrupted section");
      return { beats: [{ narration: narrative, visual: "scene", place: "room" }] };
    },
  }),
  /interrupted section/,
);
assert.ok(chapterDraft.parts["0"].rows.length);
assert.equal(chapterDraft.parts["0"].pending.length, 0);
let restarts = 0;
const restored = await writeChapterBeats(source, story, chapter, {
  language: "vi",
  exec: {},
  isFirst: true,
  isLast: true,
  draft: chapterDraft,
  ai: async (prompt) => {
    restarts++;
    assert.ok(!prompt.includes("event section 1/"));
    return { beats: [{ narration: narrative, visual: "scene", place: "room" }] };
  },
});
assert.equal(restarts, partition.length - 1);
assert.equal(new Set(restored.map((beat) => beat.id)).size, restored.length);
const editBeats: any[] = Array.from({ length: 10 }, (_, index) => ({ id: "edit-" + index, chapterId: "chapter", narration: narrative, visual: "scene" }));
const editorPrompts: string[] = [];
await editScript(source, story, editBeats, {
  language: "vi",
  exec: {},
  scope: "editor-case",
  ai: async (prompt) => {
    editorPrompts.push(prompt);
    return { edits: [{ id: "edit-9", narration: narrative.replace("Người cháu", "Anh cháu"), reason: "foreign target" }] };
  },
});
assert.ok(editorPrompts.length >= 2);
const editAgain = await editScript(source, story, editBeats, {
  language: "vi",
  exec: {},
  scope: "editor-case",
  ai: async () => {
    throw new Error("editor reran accepted target");
  },
});
assert.equal(editAgain.beats[0].narration, narrative);
const boardLines = lines.map((line) => ({ ...line, action: "A calm conversation" }));
let savedBoard: any,
  boardCalls = 0;
const boardAi = async (prompt: string) => {
  boardCalls++;
  const requested = JSON.parse(prompt.split(S.REQUESTED)[1].split(P.NL)[0]);
  return { units: [{ from: { line: requested[0].line }, scene: T.SCENE, purpose: "establish", show: "Two villagers at the door" }] };
};
const planned = await planPuppetStoryboard(boardLines, boardLines.map((line) => ({ id: line.beatId })) as any, analysis, { exec: {}, log() {}, ai: boardAi }, undefined, {}, (value) => {
  savedBoard = structuredClone(value);
});
assert.ok(planned.groups?.length);
assert.ok(puppetStoryboardCovers(planned, boardLines));
const beforeCalls = boardCalls;
await planPuppetStoryboard(boardLines, boardLines.map((line) => ({ id: line.beatId })) as any, analysis, { exec: {}, log() {}, ai: boardAi }, savedBoard);
assert.equal(boardCalls, beforeCalls);
const changedAnalysis = { ...analysis, cast: [...analysis.cast, { key: "new", name: "New person" }] };
await planPuppetStoryboard(boardLines, boardLines.map((line) => ({ id: line.beatId })) as any, changedAnalysis, { exec: {}, log() {}, ai: boardAi }, savedBoard);
assert.ok(boardCalls > beforeCalls);
boardCalls = beforeCalls;
const exhausted = { version: S.VERSION, inputKey: puppetStoryboardInputKey(boardLines, analysis), units: [], drafts: { "0": [{ id: S.ITEM_ID(0, 0), value: { from: { line: 999 }, scene: T.SCENE, purpose: "establish", show: "locked picture" } }] }, repairStates: { "0": { rejected: S.ATTEMPTS, errors: ["legacy boundary"] } } };
await assert.rejects(planPuppetStoryboard(boardLines, boardLines.map((line) => ({ id: line.beatId })) as any, analysis, { exec: {}, log() {}, ai: boardAi }, exhausted), /legacy boundary/);
assert.equal(boardCalls, beforeCalls);
const voiceAnalysis: any = { title: "Dialogue checkpoint", cast: [{ key: "hero", name: "Nam", gender: "male", age: "adult" }], places: [], chapters: [] };
const voiceScript: any = {
  title: voiceAnalysis.title,
  language: "vi",
  gen: { voiceCast: { narrator: "fixture-narrator", hero: "fixture-character" } },
  beats: [
    { id: "voice-a", narration: 'Nam bảo: "Tôi về đây."', chapterId: "one", visual: "scene" },
    { id: "voice-b", narration: 'Nam hỏi: "Bà còn thức sao?"', chapterId: "one", visual: "scene" },
  ],
};
const voices = [
  { id: "fixture-narrator", name: "Narrator", gender: "male", language: "vi" },
  { id: "fixture-character", name: "Character", gender: "male", language: "vi" },
];
const utterance = (beat: any) => ({ id: beat.id, utterances: [{ speaker: "hero", role: "dialogue", text: beat.narration, emotion: "neutral" }] });
let voiceCalls = 0;
await assert.rejects(
  directMotionVoice(voiceScript, voiceAnalysis, voices, {
    exec: {},
    scope: "voice-resume",
    ai: async () => {
      if (++voiceCalls === 2) throw new Error("service disconnected");
      return { beats: [utterance(voiceScript.beats[0])] };
    },
  }),
  /service disconnected/,
);
let voiceResumeCalls = 0;
const voicePlan = await directMotionVoice(voiceScript, voiceAnalysis, voices, {
  exec: {},
  scope: "voice-resume",
  ai: async (prompt) => {
    voiceResumeCalls++;
    assert.ok(!prompt.includes('"id":"voice-a"'));
    return { beats: [utterance(voiceScript.beats[1])] };
  },
});
assert.equal(voiceResumeCalls, 1);
assert.equal(voicePlan.beats.length, 2);
await directMotionVoice(voiceScript, voiceAnalysis, voices, {
  exec: {},
  scope: "voice-resume",
  ai: async () => {
    throw new Error("accepted voice plan reran");
  },
});
const castingVoices = Array.from({ length: 80 }, (_, index) => ({ id: "cast-voice-" + index, name: "Giọng nam trưởng thành " + index, gender: "male", age: "adult", language: "vi", description: "Giọng kể rõ ràng, bình tĩnh." }));
const castingScript: any = { title: "Bounded casting", language: "vi", gen: {}, beats: Array.from({ length: 30 }, (_, index) => ({ id: "casting-" + index, narration: "Anh trở về căn nhà cũ. ".repeat(80) })) };
let castingCalls = 0;
await directMotionVoice(castingScript, { title: castingScript.title, cast: [{ key: "anh", name: "Anh", gender: "male", age: "adult" }], places: [], chapters: [] } as any, castingVoices, {
  exec: {},
  scope: "bounded-casting",
  ai: async (prompt) => {
    castingCalls++;
    const data = JSON.parse(prompt.slice(prompt.lastIndexOf("\n") + 1));
    assert.ok(data.voices.length < castingVoices.length);
    assert.ok(data.voices.every((voice: any) => castingVoices.some((candidate) => candidate.id === voice.id)));
    assert.ok(data.scriptExcerpts.length <= PROMPT.CAST_EXCERPTS);
    assert.ok(data.scriptExcerpts.every((beat: any) => beat.narration.length <= PROMPT.CAST_EXCERPT_CHARS));
    assert.equal(data.scriptExcerpts.at(-1).id, "casting-29");
    return { roles: [] };
  },
});
assert.equal(castingCalls, 1);
const soundScript: any = { title: "Sound resume", beats: ["sound-a", "sound-b"].map((id) => ({ id, chapterId: "sound", narration: "Không gian yên tĩnh.", visual: "scene", place: "room" })) };
const soundGen: any = { frames: {}, storyboard: { version: S.VERSION, units: [] } };
const soundAnalysis: any = { title: soundScript.title, cast: [], places: [], chapters: [] };
let soundCalls = 0;
await directPuppetSound(soundScript, soundAnalysis, soundGen, {
  exec: {},
  log() {},
  ai: async () => {
    soundCalls++;
    return { beats: [{ id: "sound-a", soundEvents: [], soundSilence: true }] };
  },
});
assert.equal(soundCalls, 1);
assert.equal(soundScript.beats[0].data[P.SOUND_FLAG], P.SOUND_VERSION);
assert.equal(soundScript.beats[1].data[P.SOUND_FLAG], undefined);
await directPuppetSound(soundScript, soundAnalysis, soundGen, {
  exec: {},
  log() {},
  ai: async (prompt) => {
    soundCalls++;
    assert.ok(!prompt.includes('"id":"sound-a"'));
    return { beats: [{ id: "sound-b", soundEvents: [], soundSilence: true }] };
  },
});
assert.equal(soundCalls, 2);
await directPuppetSound(soundScript, soundAnalysis, soundGen, {
  exec: {},
  log() {},
  ai: async () => {
    throw new Error("accepted sound plan reran");
  },
});
assert.equal(soundScript.beats[1].data[P.SOUND_FLAG], P.SOUND_VERSION);
soundScript.beats[1].narration = "Bên ngoài có tiếng gõ cửa.";
await directPuppetSound(soundScript, soundAnalysis, soundGen, {
  exec: {},
  log() {},
  ai: async (prompt) => {
    soundCalls++;
    assert.ok(!prompt.includes('"id":"sound-a"'));
    return { beats: [{ id: "sound-b", soundEvents: [], soundSilence: true }] };
  },
});
assert.equal(soundCalls, 3);
const ledgerParts = Array.from({ length: 18 }, (_, index) => `event-${index + 1}: ` + "original causal events ".repeat(120));
const ledgerDraft: any = {};
let ledgerCalls = 0;
const compressLedger = async (prompt: string) => {
  ledgerCalls++;
  const input = JSON.parse(prompt.split("SOURCE PARTS: ")[1]);
  return { coveredParts: input.flatMap((part: any) => part.ids), summary: input.map((part: any) => "events of " + part.ids.join(",")).join("; ") };
};
const reduced = await compactMotionSourceLedger(ledgerParts, { draft: ledgerDraft, request: compressLedger, key: motionInputKey, checkpoint() {} });
assert.ok(reduced.length <= PROMPT.LEDGER_TOTAL_CHARS);
assert.ok(reduced.includes("18"));
const beforeResume = ledgerCalls;
assert.equal(await compactMotionSourceLedger(ledgerParts, { draft: ledgerDraft, request: compressLedger, key: motionInputKey, checkpoint() {} }), reduced);
assert.equal(ledgerCalls, beforeResume);
const invalidLedger: any = {};
let invalidCalls = 0;
const invalidOptions = {
  draft: invalidLedger,
  request: async () => {
    invalidCalls++;
    return { coveredParts: ["1"], summary: "Lost the ending" };
  },
  key: motionInputKey,
  checkpoint() {},
};
const fallbackLedger = await compactMotionSourceLedger(ledgerParts, invalidOptions);
assert.ok(fallbackLedger.includes("event-18:"));
assert.equal(invalidCalls, PROMPT.LEDGER_REPAIRS);
await compactMotionSourceLedger(ledgerParts, invalidOptions);
assert.equal(invalidCalls, PROMPT.LEDGER_REPAIRS);
let durationDraft: any;
let durationCalls = 0;
const compactDurationPrompt = motionChapterRepairPrompt(
  [
    { id: "keep", narration: "one two three four five" },
    { id: "shorten", narration: "one two three four five six seven eight nine ten" },
  ],
  [{ id: "shorten", fields: ["narration", "utterances"], targetUnits: 4 }],
  {},
);
assert.ok(compactDurationPrompt.startsWith("SHORTEN the existing narration from 15 to about 9 speech units TOTAL"));
assert.ok(compactDurationPrompt.includes('"currentUnits":10'));
assert.ok(compactDurationPrompt.includes('"speakers":["narrator"]'));
assert.ok(!compactDurationPrompt.includes("READ-ONLY STORY AND CHAPTER CONTRACT"));
assert.equal(normalizeMotionDurationResponse({ beats: [{ id: "counted", utterances: [{ speaker: "narrator", words: ["Người", "dân", "sợ", "hãi."] }] }] }).beats[0].narration, "Người dân sợ hãi.");
const invalidCountedSpeech = { beats: [{ id: "counted", utterances: [{ speaker: "narrator", words: ["Người dân", "sợ hãi."] }] }] };
assert.deepEqual(normalizeMotionDurationResponse(invalidCountedSpeech), invalidCountedSpeech);
const proportionalRows = Array.from({ length: 9 }, (_, index) => ({ id: `duration-${index}`, narration: "từ ".repeat(30).trim() }));
const proportionalPending = motionChapterPending(proportionalRows, 189, 0.15, true);
assert.equal(proportionalPending.length, 9);
assert.equal(
  proportionalPending.reduce((sum, item) => sum + item.targetUnits!, 0),
  189,
);
assert.ok(proportionalPending.every((item) => item.targetUnits === 21));
const unevenPending = motionChapterPending(
  [
    { id: "long", narration: "từ ".repeat(100).trim() },
    { id: "one", narration: "một" },
    { id: "two", narration: "hai" },
  ],
  3,
  0.15,
  true,
);
assert.deepEqual(
  unevenPending.map((item) => item.targetUnits),
  [1],
);
const durationOptions: any = {
  language: "vi",
  exec: {},
  isFirst: true,
  isLast: true,
  durationRepair: true,
  existing: [{ id: "old", chapterId: chapter.id, narration: "Một câu chuyện còn quá ngắn.", visual: "scene" }],
  repairState: { rejected: CHAPTER_REPAIR.ATTEMPTS - 1, errors: ["previous duration repair"], recovery: { revision: CHAPTER_REPAIR.DURATION_REVISION, previous: [] } },
  onDraft: (draft: any) => {
    durationDraft = draft;
  },
  ai: async () => {
    durationCalls++;
    return { beats: [{ id: "old", narration: "" }] };
  },
};
await assert.rejects(writeChapterBeats(source, { ...analysis, chapters: [chapter] }, chapter, durationOptions));
assert.equal(durationCalls, 1);
assert.equal(durationDraft.repairState.rejected, CHAPTER_REPAIR.ATTEMPTS);
assert.equal(durationDraft.rows[0].id, "old");
await assert.rejects(writeChapterBeats(source, { ...analysis, chapters: [chapter] }, chapter, { ...durationOptions, speechRate: 2.1, repairState: durationDraft.repairState, draft: durationDraft }));
assert.equal(durationCalls, 1);
await assert.rejects(writeChapterBeats(source, { ...analysis, chapters: [chapter] }, chapter, { ...durationOptions, durationRepairScope: "next-measured-audio-round", repairState: durationDraft.repairState }));
assert.equal(durationCalls, 1 + CHAPTER_REPAIR.ATTEMPTS);
await assert.rejects(writeChapterBeats(source, { ...analysis, chapters: [chapter] }, chapter, { ...durationOptions, durationRepairScope: "next-measured-audio-round", repairState: durationDraft.repairState, draft: durationDraft }));
assert.equal(durationCalls, 1 + CHAPTER_REPAIR.ATTEMPTS);
await assert.rejects(
  buildSourceLedger(
    { ...source, kind: "transcript", text: "Nguồn đầy đủ. ".repeat(2000), segments: [] },
    {
      exec: {},
      draft: { inputKey: "ledger-persistence", rejected: 0 },
      ai: async () => ({ events: [{ t: 0, point: "Sự kiện được giữ." }] }),
      onDraft: () => {
        throw new Error("ledger checkpoint EIO");
      },
    },
  ),
  /ledger checkpoint EIO/,
);
console.log("Prompt resume passed: atomic source intact, receipts isolated, field locks, mixed READ, legacy missing-row budget, creative/factual chapter sections, editor/voice checkpoints and storyboard dependency/migration.");
