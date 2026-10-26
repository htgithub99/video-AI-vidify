import assert from "node:assert/strict";
import FIXTURE from "./fixtures/motion-read-scene-20261026.json";
import { READ_SCENE_QA as Q } from "./motionReadSceneVerificationTexts.js";
import { assessPuppetVisualContract, cleanPuppetVisualContract } from "../src/server/services/puppet/visualContract.js";
import { readPuppetLines } from "../src/server/services/puppet/director.js";
import { MOTION_VISUAL_CONTRACT as V } from "../src/constants/motionVisualContract.js";
import { MOTION_PACK as PACK } from "../src/constants/motionPack.js";
import { MOTION_PACK_SELECTION as S } from "../src/constants/motionPackSelection.js";
import type { PuppetReadDraft } from "../src/types/motionPuppet.js";
const raw = structuredClone(FIXTURE.draft);
const scene = FIXTURE.unit.scene;
assert.equal(cleanPuppetVisualContract(raw.visual), undefined);
assert.equal(cleanPuppetVisualContract(raw.visual, scene)?.scene, scene);
assert.equal(cleanPuppetVisualContract({ ...raw.visual, scene: null }, scene)?.scene, scene);
assert.equal(cleanPuppetVisualContract({ ...raw.visual, scene: "other_scene" }, scene)?.scene, scene);
assert.equal(cleanPuppetVisualContract({ ...raw.visual, scene: "legacy_scene" })?.scene, "legacy_scene");
assert.deepEqual(raw, FIXTURE.draft);
assert.deepEqual(
  assessPuppetVisualContract(undefined, scene).issues.map((issue) => issue.path),
  ["visual.timeline", "visual.evidence"],
);
assert.deepEqual(assessPuppetVisualContract({ ...raw.visual, timeline: null }, scene).issues, [{ path: "visual.timeline", reason: V.READ_VISUAL_TIMELINE_INVALID }]);
assert.deepEqual(assessPuppetVisualContract({ ...raw.visual, timeline: { key: V.PRESENT } }, scene).issues, [{ path: "visual.timeline", reason: V.READ_VISUAL_TIMELINE_INVALID }]);
assert.deepEqual(assessPuppetVisualContract({ ...raw.visual, evidence: ["", null] }, scene).issues, [{ path: "visual.evidence", reason: V.READ_VISUAL_EVIDENCE_INVALID }]);
assert.deepEqual(assessPuppetVisualContract(raw.visual).issues, [{ path: "visual.scene", reason: V.READ_VISUAL_SCENE_INVALID }]);
const line: any = { key: FIXTURE.requested.key, text: FIXTURE.requested.text, cast: Q.CAST.map((member) => member.key), place: raw.place, visualUnit: { ...FIXTURE.unit, read: raw } };
const analysis: any = { title: FIXTURE.unit.show, logline: line.text, stylePreset: Object.keys(PACK.PRESETS)[0], cast: Q.CAST, places: [{ key: raw.place, name: raw.place }] };
const places: any = { [raw.place]: { key: raw.place, name: raw.place, desc: raw.place, time: Q.DAY, interior: false } };
const drafts: Record<string, PuppetReadDraft> = {};
const run = (target: any, ai: any, readDrafts?: Record<string, PuppetReadDraft>) =>
  readPuppetLines(
    [target],
    [target],
    analysis,
    places,
    {},
    {
      exec: {},
      log() {},
      ai,
      readDrafts,
      onReadDraft: (key, value) => {
        drafts[key] = structuredClone(value);
      },
    },
  );
const noAi = async () => {
  throw new Error(Q.NO_AI);
};
const recovered = await run(line, noAi);
assert.equal(recovered.reads[line.key].visual?.scene, scene);
assert.equal(recovered.reads[line.key].visual?.timeline, raw.visual.timeline);
assert.deepEqual(recovered.reads[line.key].visual?.evidence, raw.visual.evidence);
assert.deepEqual(recovered.reads[line.key].who, raw.who);
assert.deepEqual(
  recovered.reads[line.key].states.map((state) => state.placement),
  raw.states.map((state) => state.placement),
);
const savedKey = Object.keys(drafts)[0];
assert.equal(drafts[savedKey].rows[0].visual.scene, scene);
const saved = { [savedKey]: { rows: [{ ...raw, i: 0 }], state: structuredClone(FIXTURE.state) } };
const resumed = await run(line, noAi, saved);
assert.equal(resumed.reads[line.key].visual?.scene, scene);
assert.deepEqual(drafts[savedKey].state, FIXTURE.state);
assert.equal(saved[savedKey].rows[0].visual.scene, raw.visual.scene);
for (const [field, missing, issue] of [
  ["timeline", null, V.READ_VISUAL_TIMELINE_INVALID],
  ["evidence", [], V.READ_VISUAL_EVIDENCE_INVALID],
] as const) {
  const pending = { ...line, visualUnit: { ...line.visualUnit, read: { ...raw, visual: { ...raw.visual, [field]: missing } } } };
  let calls = 0;
  const fixed = await run(pending, async (prompt: string) => {
    calls++;
    assert.ok(prompt.includes(issue));
    assert.ok(!prompt.includes(V.READ_VISUAL_SCENE_INVALID));
    assert.ok(prompt.includes(JSON.stringify(["visual." + field])));
    return { lines: [{ i: 0, visual: { ...raw.visual, scene: "wrong_scene", [field]: raw.visual[field] } }] };
  });
  assert.equal(calls, 1);
  assert.equal(fixed.reads[line.key].visual?.scene, scene);
  assert.equal(fixed.reads[line.key].visual?.timeline, raw.visual.timeline);
  assert.deepEqual(fixed.reads[line.key].visual?.evidence, raw.visual.evidence);
}
let evidenceRepairs = 0;
const wrongEvidence = { ...line, visualUnit: { ...line.visualUnit, read: { ...raw, visual: { ...raw.visual, evidence: [Q.WRONG_EVIDENCE] } } } };
await run(wrongEvidence, async (prompt: string) => {
  evidenceRepairs++;
  assert.ok(prompt.includes(S.READ_EVIDENCE_INVALID));
  return { lines: [{ i: 0, visual: { evidence: raw.visual.evidence } }] };
});
assert.equal(evidenceRepairs, 1);
process.stdout.write(Q.PASSED);
