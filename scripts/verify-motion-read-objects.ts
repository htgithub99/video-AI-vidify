import assert from "node:assert/strict";
import FIXTURE from "./fixtures/motion-read-object-duplicate-20261026.json";
import { READ_OBJECT_QA as Q } from "./motionReadObjectVerificationTexts.js";
import { canonicalPuppetReadObjects, mergePuppetReadRepair } from "../src/lib/motionReadObjects.js";
import { puppetObjectNounFits } from "../src/lib/motionPuppetAssets.js";
import { puppetReadObjects, readPuppetLines } from "../src/server/services/puppet/director.js";
import { normalizePuppetVisualState } from "../src/server/services/puppet/visualContract.js";
import { normalizePuppetReadContinuity } from "../src/server/services/puppet/readContinuity.js";
import { puppetSetPlacementNeeds } from "../src/server/services/puppet/layout.js";
import { MOTION_PACK as PACK } from "../src/constants/motionPack.js";
import { MOTION_VISUAL_CONTRACT as V } from "../src/constants/motionVisualContract.js";
import type { PuppetReadDraft, PuppetRead } from "../src/types/motionPuppet.js";
const original = structuredClone(FIXTURE.draft);
const normalized = canonicalPuppetReadObjects(original);
assert.equal(normalized.object, normalized.objects[0]);
assert.equal(normalized.object.catalogKey, Q.RIGHT);
assert.equal(puppetReadObjects(FIXTURE.draft as any)[0].catalogKey, Q.RIGHT);
assert.ok(puppetObjectNounFits(puppetReadObjects(FIXTURE.draft as any)[0]));
assert.deepEqual(original, FIXTURE.draft);
assert.deepEqual(canonicalPuppetReadObjects(normalized), normalized);
const bad = { ...original, objects: [{ ...original.objects[0], catalogKey: Q.WRONG }] };
const correction = mergePuppetReadRepair(bad, { objects: [{ catalogKey: Q.RIGHT, word: Q.NO_REWRITE }] }, ["objects.0.catalogKey"]);
assert.equal(correction.object.catalogKey, Q.RIGHT);
assert.equal(correction.objects[0].word, original.objects[0].word);
assert.equal(correction.object, correction.objects[0]);
assert.deepEqual(correction.states, original.states);
const legacy = mergePuppetReadRepair(bad, { object: { catalogKey: Q.RIGHT } }, ["objects.0.catalogKey"]);
assert.equal(legacy.object.catalogKey, Q.RIGHT);
const bowls = [
  { ...Q.BOWL, identity: "bowl_a" },
  { ...Q.BOWL, identity: "bowl_b" },
];
const separate = canonicalPuppetReadObjects({ object: bowls[1], objects: bowls });
assert.equal(separate.objects.length, 2);
assert.equal(separate.object, separate.objects[1]);
assert.equal(puppetReadObjects(separate as any).length, 2);
const targeted = mergePuppetReadRepair(separate, { object: { mount: "floor" } }, ["objects.1.mount"]);
assert.equal(targeted.object.mount, "floor");
assert.equal(targeted.objects[0].mount, "table");
const removed = mergePuppetReadRepair(separate, { object: null }, ["object", "objects"]);
assert.equal(removed.object, null);
assert.deepEqual(removed.objects, [bowls[0]]);
const replaced = mergePuppetReadRepair(separate, { objects: [bowls[0]] }, ["objects"]);
assert.equal(replaced.object, null);
assert.equal(replaced.objects.length, 1);
const legacyOnly = canonicalPuppetReadObjects({ object: bowls[1] });
assert.equal(legacyOnly.objects.length, 1);
assert.equal(legacyOnly.object, legacyOnly.objects[0]);
const analysis: any = { title: Q.TITLE, logline: FIXTURE.requested.text, stylePreset: Object.keys(PACK.PRESETS)[0], cast: Q.CAST, places: [{ key: Q.PLACE, name: Q.PLACE }] };
const places: any = { [Q.PLACE]: { key: Q.PLACE, name: Q.PLACE, desc: Q.PLACE, interior: false, time: Q.DAY } };
const makeLine = (key: string, read: any = undefined): any => ({ key, text: FIXTURE.requested.text, place: Q.PLACE, cast: Q.CAST.map((member) => member.key), visualUnit: { scene: original.visual.scene, read } });
const savedDrafts: Record<string, PuppetReadDraft> = {};
const recoveredLine = makeLine(FIXTURE.requested.key, original);
const recovered = await readPuppetLines(
  [recoveredLine],
  [recoveredLine],
  analysis,
  places,
  {},
  {
    exec: {},
    log() {},
    onReadDraft: (key, draft) => {
      savedDrafts[key] = structuredClone(draft);
    },
    ai: async () => {
      throw new Error(Q.NO_AI);
    },
  },
);
assert.equal(recovered.reads[recoveredLine.key].object?.catalogKey, Q.RIGHT);
const state = normalizePuppetVisualState([recoveredLine], { [recoveredLine.key]: original as any }, structuredClone(places));
assert.ok(puppetReadObjects(state[recoveredLine.key]).every(puppetObjectNounFits));
const continuity = normalizePuppetReadContinuity([recoveredLine], { [recoveredLine.key]: original as any });
assert.equal(continuity[recoveredLine.key].object?.catalogKey, Q.RIGHT);
assert.deepEqual(puppetSetPlacementNeeds([{ ...original, object: { ...original.object, mount: "table", support: "altar_table" } } as any]), [{ support: "table", kind: "open", count: 1 }]);
const savedKey = Object.keys(savedDrafts)[0];
assert.ok(savedKey);
const readDrafts = { [savedKey]: { rows: [{ ...original, i: 0 }], state: { rejected: 6, errors: [Q.WRONG], routes: { accepted_route: 2 } } } };
let savedState: any;
const resumed = await readPuppetLines(
  [recoveredLine],
  [recoveredLine],
  analysis,
  places,
  {},
  {
    exec: {},
    log() {},
    readDrafts,
    onReadDraft: (_key, draft) => {
      savedState = draft.state;
    },
    ai: async () => {
      throw new Error(Q.NO_AI);
    },
  },
);
assert.equal(resumed.reads[recoveredLine.key].object?.catalogKey, Q.RIGHT);
assert.equal(savedState.rejected, 6);
assert.deepEqual(savedState.routes, { accepted_route: 2 });
let renewed: any;
let renewedKey = "";
let recoveryCalls = 0;
const oldLine = makeLine(FIXTURE.requested.key, bad);
const recoverPending = (ai: any, readDrafts: any) =>
  readPuppetLines(
    [oldLine],
    [oldLine],
    analysis,
    places,
    {},
    {
      exec: {},
      log() {},
      readDrafts,
      onReadDraft: (key, draft) => {
        renewedKey = key;
        renewed = structuredClone(draft);
      },
      ai,
    },
  );
await assert.rejects(recoverPending(async () => ({ lines: [{ i: 0, objects: [{ catalogKey: Q.WRONG }] }] }), {}));
const exhaustedDrafts = { [renewedKey]: { rows: [{ ...bad, i: 0 }], state: { rejected: 6, errors: [Q.WRONG], routes: { accepted_route: 2 } } } };
const repairedOld = await recoverPending(async () => {
  recoveryCalls++;
  return { lines: [{ i: 0, objects: [{ catalogKey: Q.RIGHT }] }] };
}, exhaustedDrafts);
assert.equal(recoveryCalls, 1);
assert.equal(repairedOld.reads[oldLine.key].object?.catalogKey, Q.RIGHT);
assert.equal(renewed.state.recovery.revision, V.READ_REPAIR_REVISION);
assert.equal(renewed.state.recovery.previous[0].rejected, 6);
assert.deepEqual(renewed.state.recovery.previous[0].routes, { accepted_route: 2 });
assert.equal(exhaustedDrafts[renewedKey].state.rejected, 6);
await assert.rejects(recoverPending(async () => ({ lines: [{ i: 0, objects: [{ catalogKey: Q.WRONG }] }] }), exhaustedDrafts));
const stillExhausted = structuredClone(renewed);
let duplicateRecovery = 0;
await assert.rejects(
  recoverPending(
    async () => {
      duplicateRecovery++;
      return {};
    },
    { [renewedKey]: stillExhausted },
  ),
);
assert.equal(duplicateRecovery, 0);
assert.deepEqual(renewed.state, stillExhausted.state);
const neighbor = makeLine(Q.SIBLING, { ...original, object: null, objects: [] });
const broken = makeLine(FIXTURE.requested.key, bad);
let calls = 0;
let firstAccepted: PuppetRead | undefined;
const repaired = await readPuppetLines(
  [neighbor, broken],
  [neighbor, broken],
  analysis,
  places,
  {},
  {
    exec: {},
    readCatalog: Q.REPAIR_CATALOG,
    log() {},
    ai: async (prompt) => {
      calls++;
      assert.ok(prompt.includes('"objects.0.catalogKey"'));
      return {
        lines: [
          { i: 0, who: [], object: null },
          { i: 1, objects: [{ catalogKey: Q.RIGHT, mount: "held", owner: "wrong" }] },
        ],
      };
    },
  },
  (value) => {
    firstAccepted ||= structuredClone(value.reads[Q.SIBLING]);
  },
);
assert.equal(calls, 1);
assert.deepEqual(repaired.reads[Q.SIBLING], firstAccepted);
assert.equal(repaired.reads[broken.key].object?.catalogKey, Q.RIGHT);
assert.equal(repaired.reads[broken.key].object?.mount, original.object.mount);
assert.equal(repaired.reads[broken.key].object?.owner, undefined);
const other = { ...original.objects[0], key: "other_tray", identity: "other_tray", catalogKey: Q.RIGHT };
for (const leading of [[Q.MENTIONED], [other, structuredClone(other)]]) {
  const target = makeLine(FIXTURE.requested.key, { ...bad, object: null, objects: [...leading, ...bad.objects] });
  let indexedCalls = 0;
  const indexed = await readPuppetLines(
    [target],
    [target],
    analysis,
    places,
    {},
    {
      exec: {},
      readCatalog: Q.REPAIR_CATALOG,
      log() {},
      ai: async (prompt) => {
        indexedCalls++;
        assert.ok(prompt.includes('"objects.' + leading.length + '.catalogKey"'));
        return { lines: [{ i: 0, objects: [...leading.map(() => null), { catalogKey: Q.RIGHT }] }] };
      },
    },
  );
  assert.equal(indexedCalls, 1);
  assert.ok(puppetReadObjects(indexed.reads[target.key]).every(puppetObjectNounFits));
}
let legacyCalls = 0;
const single = makeLine(FIXTURE.requested.key, { ...original, objects: undefined, object: { ...original.object, catalogKey: Q.WRONG } });
const singleResult = await readPuppetLines(
  [single],
  [single],
  analysis,
  places,
  {},
  {
    exec: {},
    readCatalog: Q.REPAIR_CATALOG,
    log() {},
    ai: async () => {
      legacyCalls++;
      return { lines: [{ i: 0, object: { catalogKey: Q.RIGHT } }] };
    },
  },
);
assert.equal(legacyCalls, 1);
assert.equal(singleResult.reads[single.key].object?.catalogKey, Q.RIGHT);
assert.ok(V.READ_PATCH_SCHEMA.includes("original objects array indices"));
process.stdout.write(Q.PASS);
