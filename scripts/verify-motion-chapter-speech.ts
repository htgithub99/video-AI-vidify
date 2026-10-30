import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { repairMotionChapterSpeech } from "../src/lib/motionChapterSpeech.js";
import { motionChapterResponseIssues } from "../src/lib/motionChapterRepair.js";
import { motionSpeechResponseIssues } from "../src/lib/motionSpeechResponse.js";
import { withMotionVoiceMode, speechWords } from "../src/lib/motionVoice.js";
import { MOTION_CHAPTER_REPAIR as C } from "../src/constants/motionChapterRepair.js";
import { MOTION_PROMPT as P } from "../src/constants/motionPrompt.js";
import type { MotionChapterDraft } from "../src/types/motionVideo.js";
const directory = fs.mkdtempSync(path.join(os.tmpdir(), "motion-chapter-speech-"));
const previousStorage = process.env.VIDIFY_STORAGE_DIR;
const previousApp = process.env.APP_DATA_DIR;
process.env.VIDIFY_STORAGE_DIR = directory;
delete process.env.APP_DATA_DIR;
const line = (id: string, speaker: string, text: string): any => ({ id, speaker, role: speaker === "narrator" ? "narration" : "dialogue", text, emotion: "warm", intensity: 0.35, speed: 0.95 });
const narration = 'Marcus vỗ vai bạn. "Xong rồi." Bạn gật. Trong túi áo, mảnh dây da cũ vẫn còn. Bạn siết nó.';
const duplicate = { id: "b14", narration, visual: "scene", place: "room", cast: ["marcus"], utterances: [line("u15", "narrator", narration.replaceAll('"', "")), line("u16", "marcus", "Xong rồi.")] };
const snapshot = structuredClone(duplicate);
const repaired = repairMotionChapterSpeech(duplicate, ["marcus"]);
assert.notEqual(repaired, duplicate);
assert.deepEqual(duplicate, snapshot, "Local recovery never mutates a saved row");
assert.deepEqual(
  repaired.utterances.map((item: any) => item.speaker),
  ["narrator", "marcus", "narrator"],
);
assert.equal(repaired.utterances[1].id, "u16");
assert.equal(repaired.utterances[1].speed, 0.95);
assert.equal(repaired.narration, narration);
assert.equal(new Set(repaired.utterances.map((item: any) => item.id)).size, 3);
assert.deepEqual(motionSpeechResponseIssues(repaired.utterances, ["narrator", "marcus"], narration), []);
assert.equal(repairMotionChapterSpeech(repaired, ["marcus"]), repaired, "Already valid dialogue keeps its metadata and boundaries");
const ambiguousText = 'Marcus nói: "Chờ đã." Bạn đáp: "Chờ đã."';
const ambiguous = { ...duplicate, narration: ambiguousText, utterances: [line("a", "narrator", ambiguousText), line("b", "marcus", "Chờ đã.")] };
assert.equal(repairMotionChapterSpeech(ambiguous, ["marcus"]), ambiguous, "Repeated quotations must not be guessed");
for (const row of [
  { ...duplicate, narration: "Marcus vỗ vai bạn. Xong rồi. Bạn gật." },
  { ...duplicate, utterances: [line("a", "narrator", "Marcus vỗ vai bạn."), line("b", "marcus", "Xong rồi.")] },
  { ...duplicate, utterances: [line("a", "narrator", narration), line("b", "missing", "Xong rồi.")] },
  { ...duplicate, utterances: [line("a", "narrator", narration), line("b", "marcus", "Xong rồi. Bạn gật.")] },
  { ...duplicate, utterances: [line("a", "narrator", narration), line("b", "marcus", "Xong rồi."), line("c", "marcus", "Xong rồi.")] },
])
  assert.equal(repairMotionChapterSpeech(row, ["marcus"]), row, "Missing words, unquoted/partial lines and ambiguous or unknown speakers stay pending");
const twoQuotes = { ...duplicate, narration: "Marcus nói: “Xong rồi.” Bạn đáp: “Về thôi.”", utterances: [line("n", "narrator", "Marcus nói: “Xong rồi.” Bạn đáp: “Về thôi.”"), line("d", "marcus", "Xong rồi."), line("e", "self", "Về thôi.")] };
const twoFixed = repairMotionChapterSpeech(twoQuotes, ["marcus", "self"]);
assert.deepEqual(motionSpeechResponseIssues(twoFixed.utterances, ["narrator", "marcus", "self"], twoFixed.narration), []);
assert.deepEqual(
  twoFixed.utterances.filter((item: any) => item.speaker !== "narrator").map((item: any) => item.id),
  ["d", "e"],
);
try {
  const { writeChapterBeats } = await import("../src/features/motion/server/services/motionStoryService.js");
  const { directMotionVoice } = await import("../src/features/motion/server/services/motionVoiceDirectionService.js");
  const chapter: any = { id: "c1", title: "Trở về", summary: "Marcus cùng bạn trở về sau trận chiến.", targetSeconds: 60 };
  const source: any = { kind: "brief", title: chapter.title, text: chapter.summary, segments: [{ t: 0, text: chapter.summary }], sourceSeconds: 60 };
  const options = { language: "vi", exec: {}, isFirst: true, isLast: true };
  for (const mode of ["library", "remotion"]) {
    const analysis: any = { title: chapter.title, logline: chapter.summary, chapters: [chapter], cast: [{ key: "marcus", name: "Marcus", gender: "male", age: "adult" }], places: [{ key: "room", name: "Căn phòng", description: "Căn phòng cũ" }], visualSettings: { mode } };
    let calls = 0;
    const beats = await writeChapterBeats(source, analysis, chapter, {
      ...options,
      multiVoice: true,
      ai: async () => {
        calls++;
        return { beats: [duplicate] };
      },
    });
    assert.equal(calls, 1, `${mode}: duplicated full narration repairs without another AI request`);
    assert.equal(beats[0].utterances![1].speaker, "marcus");
    assert.equal(beats[0].narration, narration);
    const single = withMotionVoiceMode({ title: chapter.title, language: "vi", beats }, false);
    assert.equal(single.beats, beats);
    const plan = await directMotionVoice(single, analysis, [{ id: "test-voice", name: "Người kể", gender: "male" }] as any, {
      exec: {},
      ai: async () => {
        throw new Error("Single narrator must not ask AI to cast");
      },
    });
    assert.equal(plan.roles.length, 1);
    assert.equal(plan.beats[0].utterances.map((item) => item.text).join(" "), narration);
    assert.equal(withMotionVoiceMode(single, true).beats[0].utterances![1].speaker, "marcus", "Toggling back retains authored dialogue");
    let draft: MotionChapterDraft | undefined;
    let rejectedCalls = 0;
    await assert.rejects(
      writeChapterBeats(source, analysis, chapter, {
        ...options,
        onDraft: (value) => {
          draft = value;
        },
        ai: async () => {
          rejectedCalls++;
          return { beats: [repaired, ambiguous, repaired] };
        },
      }),
    );
    assert.equal(rejectedCalls, C.ATTEMPTS);
    assert.equal(draft!.pending.length, 1);
    assert.deepEqual(draft!.pending[0].fields, ["utterances"]);
    const exhausted = structuredClone(draft!);
    const preserved = JSON.stringify(exhausted);
    const resumed = await writeChapterBeats(source, analysis, chapter, {
      ...options,
      multiVoice: false,
      draft: exhausted,
      ai: async () => {
        throw new Error("Single narrator should recover valid narration locally");
      },
    });
    assert.equal(resumed.length, 3);
    assert.equal(JSON.stringify(exhausted), preserved);
    assert.equal(resumed[0].utterances![1].speaker, "marcus", "Valid cast data survives single-voice acceptance");
    assert.equal(resumed[1].utterances, undefined, "Invalid optional speech cannot reach spoken output");
    const singlePlan = await directMotionVoice(withMotionVoiceMode({ title: chapter.title, language: "vi", beats: resumed }, false), analysis, [{ id: "test-voice", name: "Người kể", gender: "male" }] as any, {
      exec: {},
      ai: async () => {
        throw new Error("No AI casting");
      },
    });
    assert.equal(speechWords(singlePlan.beats[1].utterances.map((item) => item.text).join(" ")), speechWords(ambiguousText));
    let attempts = 0;
    let failedDraft: MotionChapterDraft | undefined;
    const failOptions = {
      ...options,
      draft: exhausted,
      onDraft: (value: MotionChapterDraft) => {
        failedDraft = value;
      },
      ai: async (prompt: string) => {
        attempts++;
        const target = exhausted.pending[0].id;
        assert.ok(prompt.includes(target));
        assert.ok(prompt.includes('"fields":["utterances"]'), "Only the pending speech field may be repaired; neighbours remain read-only context");
        return { beats: [{ ...ambiguous, id: target }] };
      },
    };
    await assert.rejects(writeChapterBeats(source, analysis, chapter, failOptions));
    assert.equal(attempts, C.ATTEMPTS);
    assert.equal(failedDraft!.repairState!.recovery!.revision, C.SPEECH_REVISION);
    assert.equal(failedDraft!.repairState!.recovery!.previous[0].rejected, C.ATTEMPTS);
    await assert.rejects(writeChapterBeats(source, analysis, chapter, { ...failOptions, draft: failedDraft }));
    assert.equal(attempts, C.ATTEMPTS, "Resume cannot replenish the same revision forever");
    assert.deepEqual(failedDraft!.rows[0], exhausted.rows[0]);
    assert.deepEqual(failedDraft!.rows[2], exhausted.rows[2]);
    let fixedCalls = 0;
    const fixed = await writeChapterBeats(source, analysis, chapter, {
      ...options,
      draft: exhausted,
      ai: async () => {
        fixedCalls++;
        return { beats: [{ id: exhausted.pending[0].id, utterances: [line("n1", "narrator", "Marcus nói:"), line("d1", "marcus", '"Chờ đã."'), line("n2", "narrator", 'Bạn đáp: "Chờ đã."')] }] };
      },
    });
    assert.equal(fixedCalls, 1);
    assert.equal(fixed[1].narration, ambiguousText);
    assert.deepEqual(fixed[0], resumed[0]);
    assert.deepEqual(fixed[2], resumed[2]);
    let singlePrompt = "";
    let singleDraft: MotionChapterDraft | undefined;
    await writeChapterBeats(source, analysis, chapter, {
      ...options,
      multiVoice: false,
      onDraft: (value) => {
        singleDraft = value;
      },
      ai: async (prompt) => {
        singlePrompt = prompt;
        return { beats: [repaired] };
      },
    });
    assert.ok(singlePrompt.includes(P.CHAPTER_SINGLE_VOICE) && !singlePrompt.includes(P.CHAPTER_VOICE));
    const toggled = await writeChapterBeats(source, analysis, chapter, {
      ...options,
      multiVoice: true,
      draft: singleDraft,
      ai: async () => {
        throw new Error("Changing voice mode must retain compatible chapter drafts");
      },
    });
    assert.equal(toggled[0].utterances![1].speaker, "marcus");
    assert.ok(motionChapterResponseIssues([{ ...duplicate, narration: "" }], ["marcus"], ["room"], false, false).length, "Single voice still validates mandatory narration");
    assert.ok(motionChapterResponseIssues([{ ...duplicate, place: "unknown" }], ["marcus"], ["room"], false, false).length, "Single voice still validates place identity");
    const longChapter = { ...chapter, targetSeconds: 480 };
    const longSource = { ...source, text: "Marcus nhìn về phía căn nhà. Bạn cùng Marcus trở về. Cả hai ngồi xuống. Đêm dần khuya.", sourceSeconds: 480 };
    longSource.segments = [{ t: 0, text: longSource.text }];
    const longAnalysis = { ...analysis, chapters: [longChapter] };
    let partitionDraft: MotionChapterDraft | undefined;
    let sectionRequests = 0;
    const sectionOptions = {
      ...options,
      multiVoice: false,
      onDraft: (value: MotionChapterDraft) => {
        partitionDraft = value;
      },
      ai: async (prompt: string) => {
        assert.ok(prompt.includes(P.CHAPTER_SINGLE_VOICE));
        if (++sectionRequests === 2) throw new Error("Section interrupted");
        return { beats: [ambiguous] };
      },
    };
    await assert.rejects(writeChapterBeats(longSource, longAnalysis, longChapter, sectionOptions), /Section interrupted/);
    assert.ok(partitionDraft!.parts && partitionDraft!.parts["0"].rows.length);
    const firstSection = structuredClone(partitionDraft!.parts!["0"].rows);
    const partitionBeats = await writeChapterBeats(longSource, longAnalysis, longChapter, {
      ...sectionOptions,
      draft: partitionDraft,
      ai: async (prompt) => {
        assert.ok(prompt.includes(P.CHAPTER_SINGLE_VOICE));
        assert.ok(!prompt.includes("event section 1/"), "Accepted section must not be requested again");
        return { beats: [ambiguous] };
      },
    });
    assert.ok(partitionBeats.length > 1);
    assert.deepEqual(partitionDraft!.parts!["0"].rows, firstSection, "Partitioned resume preserves the completed section");
    let badPlaceDraft: MotionChapterDraft | undefined;
    await assert.rejects(
      writeChapterBeats(source, analysis, chapter, {
        ...options,
        multiVoice: false,
        onDraft: (value) => {
          badPlaceDraft = value;
        },
        ai: async () => ({ beats: [{ ...repaired, place: "unknown" }] }),
      }),
    );
    await assert.rejects(
      writeChapterBeats(source, analysis, chapter, {
        ...options,
        multiVoice: false,
        draft: badPlaceDraft,
        ai: async () => {
          throw new Error("A speech migration must never replenish unrelated failures");
        },
      }),
      /unknown place key/,
    );
  }
  process.stdout.write("Chapter speech: local repair, both modes, voice toggle, targeted finite recovery passed (offline).\n");
} finally {
  if (previousStorage === undefined) delete process.env.VIDIFY_STORAGE_DIR;
  else process.env.VIDIFY_STORAGE_DIR = previousStorage;
  if (previousApp === undefined) delete process.env.APP_DATA_DIR;
  else process.env.APP_DATA_DIR = previousApp;
  fs.rmSync(directory, { recursive: true, force: true });
}
