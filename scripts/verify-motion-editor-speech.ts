import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { assertMotionScriptComplete } from "../src/lib/motionProduction.js";
import { motionEditorSpeechIssues, requestMotionEditorResponse } from "../src/lib/motionEditorResponse.js";
import { motionSpeechResponseIssues } from "../src/lib/motionSpeechResponse.js";
import { MOTION_PRODUCTION as P } from "../src/constants/motionProduction.js";
import type { MotionBeat, MotionStoryAnalysis, MotionStoryScript } from "../src/types/motionVideo.js";
const root = fs.mkdtempSync(path.join(os.tmpdir(), "motion-editor-speech-"));
const previousStorage = process.env.VIDIFY_STORAGE_DIR;
const previousApp = process.env.APP_DATA_DIR;
delete process.env.APP_DATA_DIR;
process.env.VIDIFY_STORAGE_DIR = root;
try {
  const narration = "Corporal William Vance drops a cold brass cartridge casing into your palm. You say, stand shoulder to shoulder.";
  const partial = [{ speaker: "protagonist", role: "dialogue" as const, text: "Stand shoulder to shoulder." }];
  const complete = [{ speaker: "narrator", role: "narration" as const, text: "Corporal William Vance drops a cold brass cartridge casing into your palm. You say," }, ...partial];
  const speakers = ["narrator", "protagonist"];
  const original: MotionBeat = { id: "c1_event", chapterId: "c1", visual: "scene", narration };
  const analysis = { title: "Ulundi", videoGenre: "pov", cast: [{ key: "protagonist", name: "William" }], places: [], facts: [], chapters: [{ id: "c1", title: "The square", summary: "The line holds." }] } as unknown as MotionStoryAnalysis;
  const script: MotionStoryScript = { title: analysis.title, language: "en", voiceSettings: { multiVoice: false }, beats: [{ ...original, utterances: partial }] };
  const before = JSON.stringify(script);
  assert.doesNotThrow(() => assertMotionScriptComplete(script, analysis));
  assert.equal(JSON.stringify(script), before);
  for (const voiceSettings of [undefined, { multiVoice: true }]) assert.throws(() => assertMotionScriptComplete({ ...script, voiceSettings }, analysis));
  assert.doesNotThrow(() => assertMotionScriptComplete({ ...script, voiceSettings: { multiVoice: true }, beats: [{ ...original, utterances: complete }] }, analysis));
  for (const invalid of [
    { ...original, narration: "" },
    { ...original, chapterId: "unknown" },
    { ...original, utterances: [{ ...partial[0], speaker: "unknown" }] },
  ])
    assert.throws(() => assertMotionScriptComplete({ ...script, beats: [invalid] }, analysis));
  assert.throws(() => assertMotionScriptComplete({ ...script, beats: [original, original] }, analysis));
  assert.throws(() => assertMotionScriptComplete({ ...script, chapterDrafts: { c1: { rows: [], pending: [{ id: original.id, fields: ["narration"] }] } } } as any, analysis));
  assert.equal(motionEditorSpeechIssues(original, { narration, utterances: partial }, speakers).length, 1);
  assert.deepEqual(motionEditorSpeechIssues(original, { narration }, speakers), []);
  assert.deepEqual(motionEditorSpeechIssues(original, { narration, utterances: complete }, speakers), []);
  assert.equal(motionEditorSpeechIssues({ ...original, utterances: complete }, { narration }, speakers).length, 1);
  assert.equal(motionEditorSpeechIssues({ ...original, utterances: complete }, { narration, utterances: complete.map((line) => ({ ...line, speaker: "narrator", role: "narration" })) }, speakers).length, 1);
  let calls = 0;
  const second = { ...original, id: "accepted" };
  const edited = await requestMotionEditorResponse(
    "Review",
    [original, second],
    speakers,
    true,
    async (prompt) => {
      calls++;
      if (calls === 1)
        return {
          edits: [
            { id: original.id, narration, utterances: partial },
            { id: second.id, narration },
          ],
        };
      const repair = JSON.parse(prompt.slice(prompt.indexOf('{"pending"')));
      assert.deepEqual(
        repair.pending.map((row: any) => row.id),
        [original.id],
      );
      assert.deepEqual(repair.acceptedIds, [second.id]);
      return { edits: [{ id: original.id, utterances: complete }] };
    },
    undefined,
    "",
    2,
  );
  assert.equal(calls, 2);
  assert.equal(edited.edits.length, 2);
  assert.deepEqual(motionSpeechResponseIssues(edited.edits[0].utterances, speakers, edited.edits[0].narration), []);
  const rejected = await requestMotionEditorResponse("Review", [original], speakers, true, async () => ({ edits: [{ id: original.id, narration, utterances: partial }] }), undefined, "", 2);
  assert.deepEqual(rejected.edits, []);
  const { editScript } = await import("../src/features/motion/server/services/motionStoryService.js");
  const { directMotionVoice } = await import("../src/features/motion/server/services/motionVoiceDirectionService.js");
  const { getMotionRootDirectory } = await import("../src/features/motion/server/services/motionLibraryService.js");
  const plan = await directMotionVoice(script, analysis, [{ id: "test-narrator", name: "Narrator", gender: "male", age: "adult" }] as any, {
    exec: {},
    ai: async () => {
      throw new Error("Single voice must not request AI");
    },
  });
  assert.equal(plan.beats[0].utterances.map((line) => line.text).join(" "), narration);
  assert.ok(plan.beats[0].utterances.every((line) => line.speaker === "narrator"));
  const source = { title: "Ulundi", kind: "text", text: narration, segments: [] } as any;
  const revised = narration.replace("drops", "places");
  let resumeCalls = 0;
  const options = {
    language: "en",
    exec: {},
    scope: "speech-cache",
    focusIds: [original.id],
    ai: async () => {
      resumeCalls++;
      return { edits: [{ id: original.id, narration: revised, reason: "Clearer action", utterances: complete.map((line) => ({ ...line, text: line.text.replace("drops", "places") })) }] };
    },
  };
  const result = await editScript(source, analysis, [original], options);
  assert.equal(result.beats[0].narration, revised);
  assert.equal(resumeCalls, 1);
  const directory = path.join(getMotionRootDirectory(), P.TASK_FOLDER);
  const files = fs.readdirSync(directory).filter((file) => file.endsWith(P.EXT));
  assert.equal(files.length, 1);
  const file = path.join(directory, files[0]);
  const cached = JSON.parse(fs.readFileSync(file, "utf8"));
  cached.draft[original.id].utterances = partial;
  fs.writeFileSync(file, JSON.stringify(cached));
  const resumed = await editScript(source, analysis, [original], options);
  assert.equal(resumeCalls, 2);
  assert.deepEqual(motionSpeechResponseIssues(resumed.beats[0].utterances, speakers, revised), []);
  const restored = await editScript(source, analysis, [original], options);
  assert.equal(resumeCalls, 2);
  assert.deepEqual(restored.beats, resumed.beats);
  process.stdout.write("Motion editor speech: single/multi voice gates, complete narrator text, targeted repair, preserved roles and cached edit recovery passed.\n");
} finally {
  if (previousStorage === undefined) delete process.env.VIDIFY_STORAGE_DIR;
  else process.env.VIDIFY_STORAGE_DIR = previousStorage;
  if (previousApp === undefined) delete process.env.APP_DATA_DIR;
  else process.env.APP_DATA_DIR = previousApp;
  assert.equal(path.dirname(root), path.resolve(os.tmpdir()));
  assert.ok(path.basename(root).startsWith("motion-editor-speech-"));
  fs.rmSync(root, { recursive: true, force: true });
}
