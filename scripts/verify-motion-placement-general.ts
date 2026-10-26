import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { COMFORT_QA as V } from "./motionComfortVerificationTexts.js";
import { puppetSpotGeometryValid, puppetSupportCompatible } from "../src/lib/motionPlacement.js";
import { layoutPuppetFrame, puppetSupportAssignments } from "../src/server/services/puppet/layout.js";
import { normalizePuppetFrameContinuity } from "../src/server/services/puppet/frameContinuity.js";
import { normalizePuppetSceneConditions } from "../src/server/services/puppet/sceneCondition.js";
import { PUPPET as P } from "../src/constants/motionPuppet.js";
import { puppetBeatFrames, puppetLayoutFrames } from "../src/server/services/puppet/compilePuppet.js";
import { puppetSentenceKey } from "../src/lib/motionPuppet.js";
import { compileStorySpec } from "../src/server/services/motionDirectorService.js";
import type { PuppetSet, PuppetStylePack } from "../src/types/motionPuppet.js";
const manifest = JSON.parse(fs.readFileSync(path.join(V.ROOT, V.MANIFEST), V.UTF8));
const sourceStyle: PuppetStylePack = JSON.parse(fs.readFileSync(path.join(V.LIBRARY, V.STYLE, V.STYLES[0] + V.JSON), V.UTF8));
for (const [a, b] of V.VALID_SUPPORTS) assert.equal(puppetSupportCompatible(a, b), true);
for (const [a, b] of V.INVALID_SUPPORTS) assert.equal(puppetSupportCompatible(a, b), false);
assert.equal(puppetSpotGeometryValid({ ...V.CHAIRS[0], bounds: [0, 0, 30, 30] }), false);
assert.equal(puppetSpotGeometryValid({ ...V.CHAIRS[0], seatY: 980 }), false);
const states = structuredClone(V.STATES) as any;
const lines = V.KEYS.map((key, i) => ({ key, text: key, beatId: key, chapterId: i === 5 ? V.CHAPTER2 : V.CHAPTER, place: V.SCENE, cast: [V.A, V.B] })) as any;
const frame = (reverse = false): any => ({ shot: P.SHOT_DEFAULT, set: V.SCENE, actors: [...states].reverse().map((state, i) => ({ char: state.char, pose: P.SPOT_SIT, support: state.support, spot: V.CHAIRS[reverse ? 1 - i : i].key, face: P.FACE_DEFAULT, expr: P.EXPR_DEFAULT })) });
const reads: any = Object.fromEntries(lines.map((line: any) => [line.key, { ...V.READ, states: [...states].reverse() }]));
const frames = normalizePuppetFrameContinuity(lines.slice(0, 2), { rest: frame(), speech: frame(true) }, reads, () => V.CHAIRS as any);
for (const actor of frames.rest.actors) assert.equal(frames.speech.actors.find((a) => a.char === actor.char)?.spot, actor.spot);
const conditions: any = { ...reads, ruined: { ...reads.ruined, sceneCondition: V.RUINED }, restored: { ...reads.restored, sceneCondition: V.INTACT } };
const places: any = { [V.SCENE]: V.PLACE };
const changed = normalizePuppetSceneConditions(lines, conditions, places);
assert.equal(changed.ruined.place, V.RUIN_PLACE);
assert.equal(changed.continue.place, V.RUIN_PLACE);
assert.equal(changed.restored.place, V.SCENE);
assert.equal(changed.chapter.place, V.SCENE);
assert.deepEqual(normalizePuppetSceneConditions(lines, changed, places), changed);
for (const row of manifest.records) {
  const set: PuppetSet = JSON.parse(fs.readFileSync(row.path, V.UTF8));
  const style: PuppetStylePack = JSON.parse(fs.readFileSync(path.join(V.LIBRARY, V.STYLE, set.styleId + V.JSON), V.UTF8));
  assert.ok(set.spots!.every(puppetSpotGeometryValid));
  if (row.key !== V.ROOM) continue;
  for (const pose of [P.SPOT_LIE, V.CROUCH]) {
    const actors = [
      { char: V.A, action: pose, support: V.ROOM === row.key ? V.VALID_SUPPORTS[1][0] : P.EMPTY },
      { char: V.B, action: P.SPOT_SIT, support: V.STATES[0].support },
    ];
    assert.ok(puppetSupportAssignments(actors, set.spots!));
    const layout = layoutPuppetFrame({ shot: P.SHOT_DEFAULT, actors: actors.map((state) => ({ char: state.char, pose: state.action, support: state.support, spot: V.CHAIRS[0].key, expr: P.EXPR_DEFAULT, face: P.FACE_DEFAULT })) }, { set, body: style.body, heights: {} });
    assert.ok(layout.actors[0].spot!.includes(P.FEATURE_UNDER_RELATIONS[0]));
    assert.equal(layout.actors[0].y, 1000);
  }
}
const legacyBeat: any = { id: V.SCENE, chapterId: V.CHAPTER, visual: V.VISUAL, narration: V.LEGACY_TEXT, place: V.SCENE, utterances: V.LEGACY_LINES.map((text, i) => ({ id: String(i), text, role: i ? P.DIALOGUE : "narration", speaker: i ? V.A : "narrator" })) };
const legacyGen: any = { styleId: V.STYLES[0], characters: {}, props: {}, sets: { [V.SCENE]: manifest.records[0].id }, frames: { [puppetSentenceKey(V.LEGACY_TEXT)]: { shot: P.SHOT_DEFAULT, set: V.SCENE, actors: [] } } };
const legacyFrames = puppetBeatFrames(legacyBeat, legacyGen, 0, 12, []);
assert.equal(legacyFrames.length, 2);
assert.equal(legacyFrames[0].speaker, undefined);
assert.equal(legacyFrames[1].speaker, V.A);
const legacyScript: any = { title: V.LEGACY_TEXT, language: "vi", gen: { puppet: legacyGen }, beats: [{ ...legacyBeat, visual: "scene", utterances: undefined }] };
const compiled = compileStorySpec(legacyScript, null, { aspect: "16:9", durations: [12], voiceTrack: { continuous: true, clips: [], plan: { beats: [{ id: V.SCENE, utterances: legacyBeat.utterances }] } } as any });
assert.deepEqual(compiled.missing, []);
assert.equal(compiled.spec.shots[0].template, P.TEMPLATE);
assert.equal((compiled.spec.shots[0].params as any).frames[1].speaker, V.A);
const storage = process.env.VIDIFY_STORAGE_DIR,
  app = process.env.APP_DATA_DIR;
const temp = path.resolve(V.ROOT, randomUUID());
process.env.VIDIFY_STORAGE_DIR = temp;
delete process.env.APP_DATA_DIR;
try {
  const { writePuppet, currentPuppetSet, puppetSetForLight } = await import("../src/server/services/puppet/kitLibrary.js");
  const { matchLibrarySets } = await import("../src/server/services/puppet/kitDraw.js");
  const set: PuppetSet = JSON.parse(fs.readFileSync(manifest.records[0].path, V.UTF8));
  const old = writePuppet({ ...set, id: V.OLD, group: V.GROUP, spots: [] });
  const fixed = writePuppet({ ...set, id: V.FIXED, group: V.GROUP, placementVersion: 2, replaces: [old.id] });
  assert.equal(currentPuppetSet(old.id)?.id, fixed.id);
  const picked = await matchLibrarySets(
    { id: set.styleId } as any,
    [{ ...V.PLACE, key: V.MATCH, interior: set.interior }],
    {
      exec: {} as any,
      log: () => {},
      ai: async () => {
        throw new Error(V.WRONG_AI);
      },
    },
    V.MATCH,
    (_key, candidate) => candidate.spots!.length > 0,
  );
  assert.equal(picked[V.MATCH].id, fixed.id);
  writePuppet(sourceStyle);
  const night = writePuppet({ ...set, id: V.NIGHT_FIXED, time: P.NIGHT, spots: [structuredClone(V.CHAIRS[1])] } as PuppetSet);
  const day = writePuppet({ ...fixed, time: P.DAY, spots: [structuredClone(V.CHAIRS[0])], variants: { [P.NIGHT]: night.id } } as PuppetSet);
  assert.equal(puppetSetForLight(day, P.NIGHT).id, night.id);
  assert.equal(puppetSetForLight(day, P.DAY).id, day.id);
  const nightFrames = puppetLayoutFrames([{ ...frame(), light: P.NIGHT, start: 0, end: 12, actors: [frame().actors[0]] }], { ...legacyGen, sets: { [V.SCENE]: day.id } });
  assert.equal(nightFrames[0].actors[0].spot, V.CHAIRS[1].key);
  assert.ok(Math.abs(nightFrames[0].actors[0].x! - V.CHAIRS[1].x / P.SET_W) < 0.00005);
} finally {
  if (storage === undefined) delete process.env.VIDIFY_STORAGE_DIR;
  else process.env.VIDIFY_STORAGE_DIR = storage;
  if (app === undefined) delete process.env.APP_DATA_DIR;
  else process.env.APP_DATA_DIR = app;
  fs.rmSync(temp, { recursive: true, force: true });
}
process.stdout.write(V.PASSED);
