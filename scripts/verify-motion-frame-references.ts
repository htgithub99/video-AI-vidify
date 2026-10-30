import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import _ from "lodash";
import { FRAME_REFERENCES_QA as T } from "./motionFrameReferencesVerificationTexts.js";
import { PUPPET as P, PUPPET_TYPES } from "../src/constants/motionPuppet.js";
import { MOTION_VISUAL_CONTRACT as V } from "../src/constants/motionVisualContract.js";
import { puppetKeyOf } from "../src/lib/motionPuppetValues.js";
import { normalizePuppetFrame, fitPuppetRead, composePuppetLines } from "../src/features/motion/server/services/puppet/director.js";
import { normalizePuppetVisualState } from "../src/features/motion/server/services/puppet/visualContract.js";
import { normalizePuppetFrameContinuity } from "../src/features/motion/server/services/puppet/frameContinuity.js";
import { repairPuppetFrameReferences } from "../src/features/motion/server/services/puppet/frameReferences.js";
import { layoutPuppetFrame } from "../src/features/motion/server/services/puppet/layout.js";
import { puppetLayoutFrames } from "../src/features/motion/server/services/puppet/compilePuppet.js";
import { readPuppet, writePuppet } from "../src/features/motion/server/services/puppet/kitLibrary.js";
import type { PuppetLine } from "../src/lib/motionPuppet.js";
import type { PuppetFrame, PuppetGen, PuppetPlace, PuppetRead, PuppetSet, PuppetStylePack } from "../src/types/motionPuppet.js";
for (const key of [...T.KEYS, ...T.HASHES.map((hash) => T.BASE + V.VARIANT_SEPARATOR + hash), T.LONG_BASE + V.VARIANT_SEPARATOR + T.HASHES[0]]) {
  assert.equal(puppetKeyOf(key), key);
  assert.equal(puppetKeyOf(puppetKeyOf(key)), key);
}
assert.equal(_.snakeCase(T.VARIANT), T.BROKEN_VARIANT);
assert.equal(puppetKeyOf(T.LABEL), T.LABEL_KEY);
const line: PuppetLine = { key: T.UNIT, text: T.TEXT, beatId: T.UNIT, chapterId: T.BASE, place: T.BASE, cast: [T.HOST, T.GUEST] };
const read: PuppetRead = {
  visual: { scene: T.BASE, timeline: V.PRESENT, evidence: [T.TEXT], fixtures: [{ key: T.DOOR, state: T.OPEN }] },
  focus: T.HOST,
  who: [T.HOST, T.GUEST],
  place: T.VARIANT,
  action: P.POSE_TALK,
  light: P.NIGHT,
  emotion: P.EXPR_DEFAULT,
  overlays: [],
  blocking: { kind: T.KIND, roles: { host: T.HOST, guest: T.GUEST } },
  states: [
    { char: T.HOST, action: P.POSE_TALK, posture: P.SPOT_SIT, support: T.BED },
    { char: T.GUEST, action: P.POSE_DEFAULT, posture: P.POSE_DEFAULT },
  ],
};
const frame: PuppetFrame = {
  shot: P.SHOT_DUO,
  set: T.BASE,
  actors: [
    { char: T.HOST, pose: P.SPOT_SIT, support: T.BED, expr: P.EXPR_DEFAULT, face: P.FACE_RIGHT },
    { char: T.GUEST, pose: P.POSE_DEFAULT, expr: P.EXPR_DEFAULT, face: P.FACE_LEFT },
  ],
  blocking: read.blocking,
};
const gen = { sets: { [T.BASE]: T.ROOT_ID, [T.VARIANT]: T.SET_ID }, props: {}, reads: { [T.UNIT]: read }, frames: { [T.UNIT]: frame } } as unknown as PuppetGen;
const before = structuredClone(gen);
const repaired = repairPuppetFrameReferences({ ...frame, shot2: structuredClone(frame) }, gen, T.UNIT, T.BASE);
assert.equal(repaired.set, T.VARIANT);
assert.equal(repaired.shot2?.set, T.VARIANT);
assert.equal(repairPuppetFrameReferences({ ...frame, set: T.BROKEN_VARIANT }, gen, T.UNIT).set, T.VARIANT);
assert.deepEqual(gen, before);
assert.equal(repairPuppetFrameReferences(frame, gen).set, T.BASE);
assert.throws(() => repairPuppetFrameReferences({ ...frame, set: T.MISSING }, gen, undefined, T.BASE), { message: V.FRAME_SET_MISSING(P.EMPTY, T.MISSING) });
assert.throws(() => repairPuppetFrameReferences(frame, { ...gen, sets: { [T.BASE]: T.ROOT_ID } }, T.UNIT), { message: V.FRAME_SET_MISSING(T.UNIT, T.VARIANT) });
const normalized = normalizePuppetFrame({ place: T.VARIANT, actors: frame.actors, shot: frame.shot }, line, line.cast);
assert.equal(normalized.set, T.VARIANT);
const spots = [
  { key: T.BED, kind: P.SPOT_SIT, fixture: T.BED, x: 650, y: 850, label: T.BED },
  { key: T.BEDSIDE, kind: P.SPOT_STAND, fixture: T.BED, x: 1100, y: 950, label: T.BEDSIDE },
];
assert.equal(fitPuppetRead(frame, read, spots).set, T.VARIANT);
const stable = normalizePuppetFrameContinuity([line], { [T.UNIT]: frame }, gen.reads!, (place) => {
  assert.equal(place, T.VARIANT);
  return spots;
});
assert.equal(stable[T.UNIT].set, T.VARIANT);
const composed = await composePuppetLines(
  [line],
  [line],
  { cast: line.cast.map((key) => ({ key, name: key })) } as any,
  gen.reads!,
  {},
  {
    spots: (place) => {
      assert.equal(place, T.VARIANT);
      return spots;
    },
    spotsText: () => P.EMPTY,
    framing: P.EMPTY,
  },
  { exec: {}, log() {}, ai: async () => ({ frames: [{ ...frame, i: 0, place: T.BASE }] }) },
);
assert.equal(composed[T.UNIT].set, T.VARIANT);
const set = { floorY: 1000, horizonY: 300, spots, compositions: [{ key: T.COMPOSITION, kind: read.blocking!.kind, roles: { host: T.BED, guest: T.BEDSIDE } }] } as PuppetSet;
const placed = layoutPuppetFrame(composed[T.UNIT], { set, props: {}, prop: null, heights: { [T.HOST]: 1, [T.GUEST]: 1 }, body: { head: 0.3, headW: 1, bodyW: 1 } as any });
assert.equal(placed.actors.find((actor) => actor.char === T.HOST)?.spot, T.BED);
assert.equal(placed.actors.find((actor) => actor.char === T.GUEST)?.spot, T.BEDSIDE);
assert.equal(placed.actors.find((actor) => actor.char === T.HOST)?.pose, P.SPOT_SIT);
const styles = T.STYLE_IDS.map((id) => {
  const style = readPuppet<PuppetStylePack>(PUPPET_TYPES.STYLE, id);
  assert.ok(style);
  return style;
});
const storageDirectory = process.env.VIDIFY_STORAGE_DIR;
const appDirectory = process.env.APP_DATA_DIR;
const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), T.TEMP_PREFIX));
process.env.VIDIFY_STORAGE_DIR = temporaryDirectory;
delete process.env.APP_DATA_DIR;
try {
  for (const style of styles) {
    writePuppet(style);
    writePuppet({ ...set, id: T.SET_ID, type: PUPPET_TYPES.SET, styleId: style.id });
    const compiledGen = { ...gen, styleId: style.id, characters: {} };
    const [compiled] = puppetLayoutFrames([{ ...frame, set: T.BROKEN_VARIANT, visualId: T.UNIT, line: T.BASE, start: 0, end: 1 }], compiledGen);
    assert.equal(compiled.set, T.VARIANT);
    assert.equal(compiled.actors.find((actor) => actor.char === T.HOST)?.spot, T.BED);
    assert.equal(compiled.actors.find((actor) => actor.char === T.GUEST)?.spot, T.BEDSIDE);
    const [legacy] = puppetLayoutFrames([{ ...frame, line: T.UNIT, start: 0, end: 1 }], compiledGen);
    assert.equal(legacy.set, T.VARIANT);
    assert.throws(() => puppetLayoutFrames([{ ...frame, line: T.UNIT, start: 0, end: 1 }], { ...compiledGen, sets: {} }), { message: V.FRAME_SET_MISSING(T.UNIT, T.VARIANT) });
    assert.deepEqual(gen, before);
  }
} finally {
  if (storageDirectory === undefined) delete process.env.VIDIFY_STORAGE_DIR;
  else process.env.VIDIFY_STORAGE_DIR = storageDirectory;
  if (appDirectory === undefined) delete process.env.APP_DATA_DIR;
  else process.env.APP_DATA_DIR = appDirectory;
  fs.rmSync(temporaryDirectory, { recursive: true, force: true });
}
const places: Record<string, PuppetPlace> = { [T.BASE]: { key: T.BASE, name: T.BASE, desc: T.BASE, interior: true, time: P.NIGHT } };
const visual = normalizePuppetVisualState([line], { [T.UNIT]: { ...read, place: T.BASE } }, places)[T.UNIT];
assert.equal(puppetKeyOf(visual.place), visual.place);
assert.equal(normalizePuppetFrame({ place: visual.place }, line, line.cast).set, visual.place);
process.stdout.write(T.PASSED);
