import assert from "node:assert/strict";
import { MOTION_VISUAL_CONTRACT as V } from "../src/constants/motionVisualContract.js";
import { PUPPET as P } from "../src/constants/motionPuppet.js";
import { VISUAL_QA as T, visualReadFixture } from "./motionVisualContractVerificationTexts.js";
import { collectPuppetLines, puppetBeatLines, puppetVisualInputKey } from "../src/lib/motionPuppet.js";
import { puppetObjectCatalogKey } from "../src/lib/motionPuppetAssets.js";
import { normalizePuppetVisualState } from "../src/server/services/puppet/visualContract.js";
import { normalizePuppetReadContinuity } from "../src/server/services/puppet/readContinuity.js";
import { normalizePuppetSceneConditions } from "../src/server/services/puppet/sceneCondition.js";
import { puppetBeatFrames } from "../src/server/services/puppet/compilePuppet.js";
import { readPuppetLines, composePuppetLines, fitPuppetRead } from "../src/server/services/puppet/director.js";
import { qaPuppet, type PuppetSheetItem } from "../src/server/services/puppet/qa.js";
import type { PuppetGen, PuppetPlace, PuppetRead } from "../src/types/motionPuppet.js";
import type { MotionBeat, MotionStoryScript } from "../src/types/motionVideo.js";
const beats: MotionBeat[] = T.BEATS.map((id) => ({ id, chapterId: T.CHAPTER, visual: T.SCENE, narration: T.TEXT, place: T.ROOM, cast: [T.A, T.B], scenePlan: structuredClone(T.PLAN) as any }));
const script = { beats } as MotionStoryScript;
const lines = collectPuppetLines(script, T.SCENE);
assert.equal(lines.length, 4);
assert.equal(new Set(lines.map((line) => line.key)).size, 4);
assert.deepEqual(lines, collectPuppetLines(script, T.SCENE));
assert.notEqual(puppetVisualInputKey(lines), puppetVisualInputKey(lines.map((line) => ({ ...line, scenePlan: { ...line.scenePlan!, after: T.OPEN } }))));
const frame = (char: string): any => ({ shot: P.SHOT_DEFAULT, set: T.ROOM, actors: [{ char, pose: P.POSE_DEFAULT, expr: P.EXPR_DEFAULT, face: P.FACE_DEFAULT }] });
const gen = { frames: Object.fromEntries(lines.map((line, index) => [line.key, frame(index < 2 ? T.A : T.B)])) } as PuppetGen;
for (const [index, beat] of beats.entries()) {
  const compiled = puppetBeatFrames(beat, gen, 0, 20, [{ text: T.TEXT, start: 0, end: 20 } as any]);
  assert.equal(compiled.length, 2);
  assert.ok(compiled.every((item) => item.actors[0].char === (index ? T.B : T.A)));
  assert.ok(compiled[1].start > 0 && compiled[1].start < 20);
}
const shortDifferent = { frames: { [lines[0].key]: frame(T.A), [lines[1].key]: frame(T.B) } } as PuppetGen;
assert.equal(puppetBeatFrames(beats[0], shortDifferent, 0, P.MIN_FRAME, []).length, 2);
const shortSecond = { frames: { [lines[0].key]: frame(T.A), [lines[1].key]: { ...frame(T.A), shot2: frame(T.B) } } } as PuppetGen;
assert.equal(puppetBeatFrames(beats[0], shortSecond, 0, P.MIN_FRAME, []).length, 2);
const shortSame = puppetBeatFrames(beats[0], gen, 0, P.MIN_FRAME, []);
assert.equal(shortSame.length, 1);
assert.deepEqual(
  shortSame[0].lines,
  lines.slice(0, 2).map((line) => line.key),
);
const analysis: any = { title: T.ROOM, logline: T.TEXT, cast: T.CAST };
const baseRead: PuppetRead = {
  visual: visualReadFixture(T.SCENE, T.EVIDENCE),
  focus: T.A,
  who: [T.A, T.B],
  states: [
    { char: T.A, action: P.ACTION_DEFAULT, posture: P.POSE_DEFAULT },
    { char: T.B, action: P.SPOT_LIE, posture: P.SPOT_LIE, support: T.BED, transition: true },
  ],
  action: P.ACTION_DEFAULT,
  place: T.ROOM,
  light: P.NIGHT,
  emotion: P.EXPR_DEFAULT,
  overlays: [],
};
const places: Record<string, PuppetPlace> = { [T.ROOM]: { key: T.ROOM, name: T.ROOM, desc: T.ROOM, interior: true, time: P.NIGHT }, [T.YARD]: { key: T.YARD, name: T.YARD, desc: T.YARD, interior: false, time: P.NIGHT } };
const raw = { i: 0, ...baseRead };
let readCalls = 0;
const options: any = {
  exec: {},
  log() {},
  ai: async (prompt: string) => {
    readCalls++;
    assert.ok(prompt.includes(T.PLAN.acceptance[0]));
    assert.ok(prompt.includes(T.BEATS[1]));
    return readCalls === 1 ? { lines: [] } : { lines: [raw] };
  },
};
await readPuppetLines([lines[0]], lines, analysis, places, {}, options);
assert.equal(readCalls, 2);
await assert.rejects(readPuppetLines([lines[0]], lines, analysis, places, {}, { ...options, ai: async () => ({ lines: [] }) }));
const reads = { [lines[0].key]: baseRead };
let composed = false;
await composePuppetLines(
  [lines[0]],
  lines,
  analysis,
  reads,
  {},
  { spots: () => [], spotsText: () => P.EMPTY, framing: P.EMPTY },
  {
    ...options,
    ai: async (prompt) => {
      composed = true;
      assert.ok(prompt.includes(T.PLAN.spatialRelations[0]));
      assert.ok(prompt.includes(T.EVIDENCE));
      return { frames: [{ i: 0, shot: P.SHOT_ESTABLISHING, actors: [] }] };
    },
  },
);
assert.ok(composed);
const repaired = fitPuppetRead({ shot: P.SHOT_ESTABLISHING, actors: [] }, baseRead);
assert.equal(repaired.actors.length, 2);
assert.equal(repaired.actors.find((actor) => actor.char === T.B)?.pose, P.SPOT_LIE);
const stateLines = T.FIXTURE_READS.map((key, index) => ({ ...lines[0], key, chapterId: index === 3 ? T.BEATS[1] : T.CHAPTER }));
const object: any = { key: T.PROP, word: T.PROP_WORD, description: T.PROP, type: P.OBJECT_TYPE_TOOL, size: 0.5, mount: P.MOUNT_HELD_KEY, owner: T.A };
const instance = { ...object, key: T.PROP + "_instance", catalogKey: T.PROP, identity: T.PROP + "_instance" };
const instanceLine = { ...lines[0], text: lines[0].text + " " + T.PROP_WORD };
const parsedInstance = await readPuppetLines([instanceLine], [instanceLine], analysis, places, {}, { ...options, ai: async () => ({ lines: [{ ...raw, object: instance, objects: [instance] }] }) });
assert.equal(parsedInstance.reads[lines[0].key].object?.catalogKey, T.PROP);
const normalizedInstance = normalizePuppetVisualState([lines[0]], parsedInstance.reads, places);
assert.equal(puppetObjectCatalogKey(normalizedInstance[lines[0].key].object!), T.PROP);
assert.deepEqual(normalizePuppetVisualState([lines[0]], normalizedInstance, places), normalizedInstance);
const stateReads: Record<string, PuppetRead> = Object.fromEntries(stateLines.map((line) => [line.key, structuredClone({ ...baseRead, object, objects: [object] })]));
stateReads.change.visual!.fixtures = [
  { key: T.DOOR, state: T.OPEN },
  { key: T.LAMP, state: T.OFF },
];
stateReads.change.object!.state = T.BROKEN;
stateReads.change.objects![0].state = T.BROKEN;
stateReads.outside.place = T.YARD;
stateReads.outside.visual!.scene = T.YARD;
stateReads.memory.visual!.timeline = T.MEMORY;
stateReads.memory.visual!.fixtures = [{ key: T.DOOR, state: T.CLOSED }];
stateReads.memory.object!.state = T.INTACT;
stateReads.memory.objects![0].state = T.INTACT;
stateReads.restored.visual!.fixtures = [{ key: T.DOOR, state: T.CLOSED }];
const normalized = normalizePuppetVisualState(stateLines, stateReads, places);
assert.equal(normalized.change.place, normalized.reaction.place);
assert.equal(normalized.change.place, normalized.return.place);
assert.equal(normalized.change.place, normalized.present.place);
assert.notEqual(normalized.memory.place, normalized.change.place);
assert.equal(normalized.reaction.object?.key, T.PROP + V.STATE_SEPARATOR + T.BROKEN);
assert.equal(normalized.present.object?.key, normalized.change.object?.key);
assert.equal(normalized.memory.object?.key, T.PROP + V.STATE_SEPARATOR + T.INTACT);
assert.equal(normalized.restored.fixtureStates?.[T.LAMP], T.OFF);
assert.equal(normalized.restored.fixtureStates?.[T.DOOR], T.CLOSED);
assert.deepEqual(normalizePuppetVisualState(stateLines, normalized, places), normalized);
const reinterpreted = structuredClone(normalized);
reinterpreted.change.object!.state = T.INTACT;
reinterpreted.change.objects![0].state = T.INTACT;
const updated = normalizePuppetVisualState(stateLines, reinterpreted, places);
assert.equal(updated.reaction.object?.key, T.PROP + V.STATE_SEPARATOR + T.INTACT);
assert.ok(!updated.reaction.object?.requirements?.includes(T.BROKEN));
const transfers = structuredClone(stateReads);
transfers.reaction.object!.owner = T.B;
transfers.reaction.objects![0].owner = T.B;
transfers.return.object!.owner = T.B;
transfers.return.object!.transition = true;
transfers.return.objects![0].owner = T.B;
transfers.return.objects![0].transition = true;
const bound = normalizePuppetVisualState(stateLines, transfers, places);
assert.equal(bound.reaction.object?.owner, T.A);
assert.equal(bound.return.object?.owner, T.B);
assert.equal(bound.present.object?.owner, T.B);
assert.equal(bound.memory.object?.owner, T.A);
assert.deepEqual(normalizePuppetVisualState(stateLines, bound, places), bound);
const unmentioned = structuredClone(stateReads);
unmentioned.reaction.object = null;
unmentioned.reaction.objects = [];
unmentioned.return.object!.mount = P.MOUNT_TABLE;
unmentioned.return.object!.transition = true;
unmentioned.return.objects![0].mount = P.MOUNT_TABLE;
unmentioned.return.objects![0].transition = true;
unmentioned.present.object = null;
unmentioned.present.objects = [];
const held = normalizePuppetVisualState(stateLines, unmentioned, places);
assert.ok(held.reaction.objects?.some((item) => item.owner === T.A && item.mount === P.MOUNT_HELD_KEY));
assert.ok(!held.present.objects?.some((item) => item.owner === T.A && item.mount === P.MOUNT_HELD_KEY));
assert.deepEqual(normalizePuppetVisualState(stateLines, held, places), held);
const stationary = structuredClone(stateReads);
stationary.change.object = { ...object, owner: undefined, mount: P.MOUNT_TABLE };
stationary.change.objects = [stationary.change.object];
for (const key of T.FIXTURE_READS.slice(1)) {
  stationary[key].object = null;
  stationary[key].objects = [];
}
const roomProps = normalizePuppetVisualState(stateLines, stationary, places);
assert.equal(roomProps.reaction.objects?.[0].identity || roomProps.reaction.objects?.[0].key, T.PROP);
assert.equal(roomProps.outside.objects?.length, 0);
assert.equal(roomProps.memory.objects?.length, 0);
assert.equal(roomProps.return.objects?.length, 1);
assert.equal(roomProps.present.objects?.length, 1);
assert.deepEqual(normalizePuppetVisualState(stateLines, roomProps, places), roomProps);
const renamed = structuredClone(stationary);
renamed.change.object = { ...object, identity: T.A, owner: undefined, mount: P.MOUNT_TABLE };
renamed.change.objects = [renamed.change.object, { ...renamed.change.object, identity: T.B }];
renamed.return.object = { ...renamed.change.object, identity: T.A + T.ROOM };
renamed.return.objects = [renamed.return.object, { ...renamed.return.object, identity: T.B + T.ROOM }];
const stableIdentities = normalizePuppetVisualState(stateLines, renamed, places);
assert.equal(stableIdentities.return.objects?.length, 2);
assert.deepEqual(
  stableIdentities.return.objects?.map((item) => item.identity),
  [T.A, T.B],
);
assert.deepEqual(normalizePuppetVisualState(stateLines, stableIdentities, places), stableIdentities);
stationary.return.object = { ...object, owner: undefined, mount: P.MOUNT_TABLE, state: V.REMOVED_STATES[0] };
stationary.return.objects = [stationary.return.object];
const removed = normalizePuppetVisualState(stateLines, stationary, places);
assert.equal(removed.return.objects?.length, 0);
assert.equal(removed.present.objects?.length, 0);
const damaged = structuredClone(stateReads);
damaged.change.sceneCondition = T.RUINED;
damaged.restored.sceneCondition = T.INTACT;
const conditions = normalizePuppetSceneConditions(stateLines, damaged, places);
assert.equal(conditions.change.place, conditions.return.place);
assert.equal(conditions.change.place, conditions.present.place);
assert.equal(conditions.memory.place, T.ROOM);
assert.equal(conditions.restored.place, T.ROOM);
assert.deepEqual(normalizePuppetSceneConditions(stateLines, conditions, places), conditions);
conditions.change.sceneConditionDeclared = T.INTACT;
const restoredEarlier = normalizePuppetSceneConditions(stateLines, conditions, places);
assert.equal(restoredEarlier.reaction.place, T.ROOM);
const crossChapter = normalizePuppetReadContinuity(
  stateLines.slice(0, 4).filter((line) => line.key !== T.FIXTURE_READS[2]),
  { change: baseRead, reaction: { ...baseRead, light: P.DAY, states: [{ char: T.B, action: P.POSE_TALK, posture: P.POSE_DEFAULT, transition: false }] }, return: { ...baseRead, states: [{ char: T.B, action: P.POSE_TALK, posture: P.POSE_DEFAULT, transition: false }] } },
);
assert.equal(crossChapter.return.states?.find((state) => state.char === T.B)?.posture, P.SPOT_LIE);
const sheet: PuppetSheetItem[] = [0, 1].map((index) => ({ t: index, text: T.TEXT, line: lines[0].key, lines: [lines[0].key], file: T.IMAGE, abs: T.IMAGE, context: T.EVIDENCE }));
let qaCalls = 0;
const bad = await qaPuppet(sheet, analysis, {
  ...options,
  ai: async () => {
    qaCalls++;
    return qaCalls === 1 ? { checks: [{ i: 0, ok: true }] } : { checks: [{ i: 1, ok: false, problem: T.ERROR, fix: T.FIX }] };
  },
});
assert.equal(qaCalls, 2);
assert.ok(bad[lines[0].key].includes(T.ERROR));
const unchecked = await qaPuppet(sheet, analysis, { ...options, ai: async () => ({ checks: [] }) });
assert.deepEqual(unchecked, {});
const again = await qaPuppet(sheet, analysis, {
  ...options,
  ai: async () => ({
    checks: [
      { i: 0, ok: true },
      { i: 1, ok: true },
    ],
  }),
});
assert.deepEqual(again, {});
assert.equal(puppetBeatLines(beats[0]).length, 2);
process.stdout.write(V.PASSED);
