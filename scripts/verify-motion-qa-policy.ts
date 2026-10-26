import assert from "node:assert/strict";
import { MOTION_QA as Q } from "../src/constants/motionQa.js";
import { MOTION_STORY_CONFIG as C } from "../src/constants/motionVideo.js";
import { MOTION_TEXT_VIETNAMESE_SYLLABLES_WORDS } from "../src/constants/motionRuntime.js";
import { motionDurationQa, motionVisualCheckBlocks } from "../src/lib/motionQa.js";
import { motionInputKey } from "../src/server/services/motionFileUtils.js";
import { writeChapterBeats } from "../src/server/services/motionStoryService.js";
import { assertMotionScriptComplete } from "../src/lib/motionProduction.js";
import { qaPuppet } from "../src/server/services/puppet/qa.js";
import FIXTURE from "./fixtures/motion-chapter-length-20261026.json";
import { QA_POLICY_TEST as T } from "./motionQaPolicyVerificationTexts.js";
const chapter: any = { id: T.CHAPTER, title: T.TITLE, summary: T.SUMMARY, targetSeconds: FIXTURE.seconds };
const analysis: any = { title: T.TITLE, logline: T.SUMMARY, cast: FIXTURE.cast, places: FIXTURE.places, chapters: [chapter], videoDna: { narrative: { voice: T.VOICE } } };
const source: any = { kind: "brief", title: T.TITLE, text: T.SUMMARY, segments: [{ t: 0, text: T.SUMMARY }], sourceSeconds: FIXTURE.seconds };
let draft: any,
  request = "",
  calls = 0;
const warnings: string[] = [];
const options = {
  language: T.LANGUAGE,
  exec: {},
  isFirst: true,
  isLast: true,
  log: (line: string) => warnings.push(line),
  onDraft: (value: any) => {
    draft = structuredClone(value);
  },
};
const beats = await writeChapterBeats(source, analysis, chapter, {
  ...options,
  ai: async (prompt) => {
    calls++;
    request = prompt;
    return { beats: FIXTURE.draft.rows };
  },
});
assert.equal(calls, 1);
assert.equal(
  FIXTURE.draft.rows.reduce((sum, row) => sum + row.narration.split(/\s+/u).filter(Boolean).length, 0),
  FIXTURE.units,
);
assert.deepEqual(draft.pending, []);
assert.ok(warnings.some((warning) => warning.includes(Q.CHAPTER_LENGTH_WARNING(T.CHAPTER, FIXTURE.units, FIXTURE.seconds * T.SPEECH_RATE))));
assert.ok(!request.includes("HARD LIMIT"));
assert.doesNotThrow(() => assertMotionScriptComplete({ title: T.TITLE, language: T.LANGUAGE, beats } as any, analysis));
const units = Math.round(FIXTURE.seconds * T.SPEECH_RATE * C.LENGTH_SAFETY);
const count = Math.max(2, Math.round(FIXTURE.seconds / C.TARGET_BEAT_SECONDS));
const perBeat = Math.max(8, Math.round(units / count));
const legacyRequest = request.replace(Q.CHAPTER_LENGTH_RULE(units, MOTION_TEXT_VIETNAMESE_SYLLABLES_WORDS, FIXTURE.seconds, count, perBeat), Q.LEGACY_CHAPTER_LENGTH_RULE(units, MOTION_TEXT_VIETNAMESE_SYLLABLES_WORDS, FIXTURE.seconds, count, perBeat));
assert.notEqual(legacyRequest, request);
const exhausted = { ...structuredClone(FIXTURE.draft), inputKey: motionInputKey([legacyRequest, FIXTURE.seconds * T.SPEECH_RATE]) };
let restoredCalls = 0;
const restored = await writeChapterBeats(source, analysis, chapter, {
  ...options,
  draft: exhausted as any,
  ai: async () => {
    restoredCalls++;
    throw new Error(T.SERVICE);
  },
});
assert.equal(restoredCalls, 0);
assert.deepEqual(restored, beats);
assert.deepEqual(draft.pending, []);
assert.equal(draft.repairState.rejected, exhausted.repairState.rejected);
for (const [actual, expected] of [
  [68, Q.LEVEL.OK],
  [60, Q.LEVEL.OK],
  [42, Q.LEVEL.WARNING],
  [30, Q.LEVEL.ERROR],
  [140, Q.LEVEL.ERROR],
  [0, Q.LEVEL.ERROR],
] as const)
  assert.equal(motionDurationQa(actual, 68), expected);
for (const category of Q.REVIEW_MINOR) assert.ok(!motionVisualCheckBlocks({ ok: false, category }));
for (const category of Q.REVIEW_CRITICAL) assert.ok(motionVisualCheckBlocks({ ok: false, category }));
assert.ok(motionVisualCheckBlocks({ ok: false }));
assert.ok(!motionVisualCheckBlocks({ ok: true, category: "spatial" }));
const sheet: any = [{ t: 0, text: T.TEXT, line: T.CHAPTER, lines: [T.CHAPTER], file: T.IMAGE, abs: T.IMAGE }];
const review = (reply: unknown) => qaPuppet(sheet, analysis, { exec: {}, log: (line) => warnings.push(line), ai: async () => reply as any });
assert.deepEqual(await review({ checks: [{ i: 0, ok: false, category: "incidental_pose", problem: T.OPTIONAL, replan: true }] }), {});
assert.ok((await review({ checks: [{ i: 0, ok: false, category: "identity", problem: T.WRONG }] }))[T.CHAPTER].includes(T.WRONG));
assert.deepEqual(await review({ checks: [] }), {});
assert.ok(warnings.some((warning) => warning === Q.REVIEW_UNCHECKED(0, 1)));
assert.deepEqual(
  await qaPuppet(sheet, analysis, {
    exec: {},
    log: (line) => warnings.push(line),
    ai: async () => {
      throw new Error(T.SERVICE);
    },
  }),
  {},
);
const controller = new AbortController();
controller.abort(new Error(T.CANCELLED));
await assert.rejects(qaPuppet(sheet, analysis, { exec: {}, signal: controller.signal, log() {}, ai: async () => ({}) }), { message: T.CANCELLED });
console.log(JSON.stringify(T.RESULT));
