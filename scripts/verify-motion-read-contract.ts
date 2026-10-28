import assert from "node:assert/strict";
import { MOTION_VISUAL_CONTRACT as V } from "../src/constants/motionVisualContract.js";
import { CINEMATIC_CHAT_PLANNING_CONFIG as C } from "../src/constants/cinematicConstants.js";
import { PUPPET as P } from "../src/constants/motionPuppet.js";
import { MOTION_PACK as PACK } from "../src/constants/motionPack.js";
import { VISUAL_QA as T, visualReadFixture } from "./motionVisualContractVerificationTexts.js";
import { readPuppetLines, composePuppetLines, fitPuppetRead } from "../src/server/services/puppet/director.js";
import { normalizePuppetReadContinuity } from "../src/server/services/puppet/readContinuity.js";
import { motionDisplayedJob } from "../src/features/motion/lib/motionDisplayedJob.js";
import { MotionJobStatus as Status, MotionStoryJobKind } from "../src/types/motionVideo.js";
const lines: any[] = T.BEATS.map((key) => ({ key, text: T.PROP_TEXT, place: T.ROOM, cast: [T.A, T.B] }));
const analysis: any = { title: T.ROOM, logline: T.TEXT, cast: T.CAST };
const places: any = { [T.ROOM]: { key: T.ROOM, name: T.ROOM, desc: T.ROOM, interior: true, time: P.NIGHT } };
const measuredPrompts: string[] = [];
for (const all of [lines, [...lines, ...Array.from({ length: 200 }, (_, index) => ({ ...lines[0], key: T.ROOM + index, beatId: T.ROOM + index, action: T.EVIDENCE }))]]) {
  const controller = new AbortController();
  await assert.rejects(
    readPuppetLines(
      lines,
      all,
      analysis,
      places,
      {},
      {
        exec: {},
        signal: controller.signal,
        log() {},
        ai: async (prompt) => {
          measuredPrompts.push(prompt);
          controller.abort();
          throw new Error(C.CANCELLED_ERROR);
        },
      },
    ),
  );
}
assert.equal(measuredPrompts.length, 2);
assert.equal(measuredPrompts[0], measuredPrompts[1]);
const row = (i: number): any => ({ i, visual: visualReadFixture(T.SCENE, T.EVIDENCE), focus: T.A, who: [T.A, T.B], place: T.ROOM, states: [T.A, T.B].map((char) => ({ char, posture: P.POSE_DEFAULT, action: P.ACTION_DEFAULT })), object: null });
const run = (ai: any, accepted?: any, signal?: AbortSignal) => readPuppetLines(lines, lines, analysis, places, {}, { exec: {}, log() {}, ai, signal }, accepted);
const eyeLine: any = { ...lines[0], text: T.EYES_TEXT };
const eyeResult = await readPuppetLines(
  [eyeLine],
  [eyeLine],
  analysis,
  places,
  {},
  {
    exec: {},
    log() {},
    ai: async () => ({
      lines: [
        {
          ...row(0),
          states: [
            { char: T.A, action: P.ACTION_DEFAULT, posture: P.POSE_DEFAULT, eyes: { state: T.CLOSED, evidence: T.EYES_TEXT } },
            { char: T.B, action: P.ACTION_DEFAULT, posture: P.POSE_DEFAULT, eyes: { state: T.OPEN, evidence: T.ERROR } },
          ],
        },
      ],
    }),
  },
);
const eyeRead = eyeResult.reads[eyeLine.key];
assert.equal(eyeRead.states?.[0].eyes?.state, T.CLOSED);
assert.equal(eyeRead.states?.[1].eyes, undefined);
const eyeFrame: any = { shot: P.SHOT_DEFAULT, actors: [T.A, T.B].map((char) => ({ char, pose: P.POSE_DEFAULT, expr: P.EXPR_DEFAULT, face: P.FACE_DEFAULT })) };
const closedFrame = fitPuppetRead(eyeFrame, eyeRead);
assert.equal(closedFrame.actors[0].expr, P.EXPR_SLEEP);
assert.equal(closedFrame.actors[1].expr, P.EXPR_DEFAULT);
const later = { ...eyeRead, states: eyeRead.states!.map((state) => ({ ...state, eyes: undefined, transition: false })) };
const continued = normalizePuppetReadContinuity(lines, { [lines[0].key]: eyeRead, [lines[1].key]: later });
assert.equal(continued[lines[1].key].states?.[0].eyes?.state, T.CLOSED);
const reopened = { ...continued[lines[1].key], states: continued[lines[1].key].states!.map((state) => ({ ...state, ...(state.char === T.A ? { eyes: { state: T.OPEN as "open", evidence: T.EYES_TEXT } } : {}) })) };
assert.equal(fitPuppetRead(closedFrame, reopened).actors[0].expr, P.EXPR_DEFAULT);
let calls = 0;
let initialReadPrompt = P.EMPTY;
const checkpoints: any[] = [];
const repaired = await run(
  async (prompt: string) => {
    if (++calls === 1) {
      initialReadPrompt = prompt;
      return { lines: [row(0), { ...row(1), states: row(1).states.slice(0, 1) }] };
    }
    assert.ok(prompt.length < initialReadPrompt.length);
    assert.ok(prompt.includes(V.READ_PATCH_SCHEMA));
    assert.ok(!prompt.includes(PACK.READ_CATALOG_SCHEMA));
    assert.ok(prompt.includes(V.READ_PENDING));
    assert.ok(prompt.includes(V.READ_POSTURE_INVALID(T.B)));
    assert.ok(prompt.includes(V.READ_ACCEPTED));
    return {
      lines: [
        { ...row(0), visual: null },
        { i: 1, states: row(1).states.slice(1) },
      ],
    };
  },
  (value: any) => checkpoints.push(structuredClone(value)),
);
assert.equal(calls, 2);
const readDrafts: Record<string, import("../src/types/motionPuppet.js").PuppetReadDraft> = {};
const interrupted = new AbortController();
await assert.rejects(
  readPuppetLines(
    lines,
    lines,
    analysis,
    places,
    {},
    {
      exec: {},
      log() {},
      signal: interrupted.signal,
      ai: async () => ({ lines: [row(0), { ...row(1), states: row(1).states.slice(0, 1) }] }),
      onReadDraft: (key, draft) => {
        readDrafts[key] = draft;
        interrupted.abort();
      },
    },
  ),
);
assert.equal(Object.values(readDrafts)[0].state.rejected, 1);
const continuedReads = await readPuppetLines(
  [lines[1]],
  lines,
  analysis,
  places,
  {},
  {
    exec: {},
    log() {},
    readDrafts,
    ai: async (prompt) => {
      assert.ok(prompt.includes(V.READ_POSTURE_INVALID(T.B)));
      return { lines: [{ i: 1, states: row(1).states.slice(1) }] };
    },
  },
);
assert.equal(continuedReads.reads[lines[1].key].states?.length, 2);
calls = 0;
const repairedSpatial = await run(async () => {
  calls++;
  const rows = [row(0), row(1)];
  if (calls === 1) rows[0].states[0].placement = { relation: "between", targets: [T.B], evidence: T.TEXT };
  else rows[0].states[0].placement = null;
  return { lines: rows };
});
assert.equal(calls, 2);
assert.equal(repairedSpatial.reads[lines[0].key].states?.[0].placement, undefined);
assert.equal(Object.keys(checkpoints[0].reads).length, 1);
assert.equal(Object.keys(repaired.reads).length, 2);
assert.deepEqual(repaired.reads[lines[0].key], checkpoints[0].reads[lines[0].key]);
calls = 0;
await run(async () =>
  ++calls === 1
    ? {
        lines: [
          { ...row(0), i: null },
          { ...row(1), i: "1" },
        ],
      }
    : { lines: [row(0), row(1)] },
);
assert.equal(calls, 2);
calls = 0;
await run(async (prompt: string) => {
  if (++calls === 1) return { lines: [row(0), row(0), row(1)] };
  assert.ok(prompt.includes(V.READ_DUPLICATE));
  return { lines: [row(0)] };
});
assert.equal(calls, 2);
calls = 0;
let checkpoint: any;
await assert.rejects(
  run(
    async () => {
      calls++;
      return { lines: [row(0), { ...row(1), states: [] }] };
    },
    (value: any) => {
      checkpoint = structuredClone(value);
    },
  ),
  (error: any) => error.message.includes(V.READ_POSTURE_INVALID(T.B)) && error.message.includes(lines[1].key),
);
assert.equal(calls, V.READ_ATTEMPTS);
assert.deepEqual(Object.keys(checkpoint.reads), [lines[0].key]);
calls = 0;
await run(async (prompt: string) => {
  if (++calls === 1) return { lines: [row(0), { ...row(1), visual: { scene: T.SCENE } }] };
  assert.ok(prompt.includes(V.READ_VISUAL_TIMELINE_INVALID));
  assert.ok(prompt.includes(V.READ_VISUAL_EVIDENCE_INVALID));
  assert.ok(!prompt.includes(V.READ_VISUAL_SCENE_INVALID));
  return { lines: [{ i: 1, visual: { timeline: V.PRESENT, evidence: [T.EVIDENCE] } }] };
});
assert.equal(calls, 2);
calls = 0;
await run(async (prompt: string) => {
  const object = { key: T.PROP, word: calls ? T.PROP_WORD : T.ERROR, type: P.OBJECT_TYPE_TOOL, mount: P.MOUNT_HELD_KEY, presence: "visible" };
  if (calls++) assert.ok(prompt.includes(V.READ_OBJECT_INVALID));
  return { lines: [row(0), { ...row(1), object }] };
});
assert.equal(calls, 2);
calls = 0;
const newPlace = await run(async (prompt: string) => {
  if (calls++) assert.ok(prompt.includes(V.READ_PLACE_INVALID));
  return { lines: [row(0), { ...row(1), place: T.YARD, ...(calls > 1 ? { placeDesc: T.YARD } : {}) }] };
});
assert.equal(calls, 2);
assert.ok(newPlace.newPlaces[T.YARD]);
const abort = new AbortController();
calls = 0;
await assert.rejects(
  run(
    async () => {
      if (++calls === 1) return { lines: [row(0)] };
      abort.abort();
      return { lines: [row(1)] };
    },
    undefined,
    abort.signal,
  ),
);
assert.equal(calls, 2);
const unit = { ...lines[0], speaker: T.B, visualUnit: { scene: T.SCENE } };
const offscreen = { ...row(0), who: [T.A], states: row(0).states.slice(0, 1) };
const read = await readPuppetLines([unit], [unit], analysis, places, {}, { exec: {}, log() {}, ai: async () => ({ lines: [offscreen] }) });
assert.deepEqual(read.reads[unit.key].who, [T.A]);
const frame = await composePuppetLines([unit], [unit], analysis, read.reads, {}, { spots: () => [], spotsText: () => P.EMPTY, framing: P.EMPTY }, { exec: {}, log() {}, ai: async () => ({ frames: [{ i: 0, shot: P.SHOT_DEFAULT, actors: [{ char: T.A }, { char: T.B }] }] }) });
assert.deepEqual(
  frame[unit.key].actors.map((actor) => actor.char),
  [T.A],
);
for (const stylePreset of Object.keys(PACK.PRESETS)) {
  let quoteCalls = 0;
  const quoted = await readPuppetLines([lines[0]], lines, { ...analysis, stylePreset }, places, {}, { exec: {}, log() {}, ai: async () => ({ lines: [{ ...row(0), visual: { ...row(0).visual, evidence: [++quoteCalls === 1 ? T.EVIDENCE : T.PROP_TEXT.toLowerCase()] } }] }) });
  assert.equal(quoteCalls, 2);
  assert.deepEqual(quoted.reads[lines[0].key].visual!.evidence, [T.PROP_TEXT]);
}
const story: any = { id: T.A, kind: MotionStoryJobKind.SCENES, status: Status.ERROR, progress: 0.08, startedAt: 20 };
const render: any = { id: T.B, status: Status.COMPLETED, progress: 1, startedAt: 10 };
assert.equal(motionDisplayedJob(story, render), story);
assert.equal(motionDisplayedJob(story, { ...render, startedAt: 30 })?.id, render.id);
assert.equal(motionDisplayedJob({ ...story, status: Status.RENDERING, startedAt: 5 }, render)?.id, story.id);
assert.equal(motionDisplayedJob(story, { ...render, status: Status.RENDERING })?.id, render.id);
assert.equal(motionDisplayedJob(null, render), render);
assert.equal(motionDisplayedJob(null, null), undefined);
assert.equal(motionDisplayedJob(null, render, story.id), undefined);
assert.equal(motionDisplayedJob(story, render, story.id), story);
assert.equal(motionDisplayedJob(story, render, render.id), story);
assert.equal(motionDisplayedJob(story, { ...render, status: Status.RENDERING }, story.id)?.id, render.id);
process.stdout.write(V.PASSED);
