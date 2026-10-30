import assert from "node:assert/strict";
import fs from "node:fs";
import { SIMPLE_QA as Q } from "./motionSimpleIllustrationVerificationTexts.js";
import { simplePuppetStates } from "../src/lib/motionIllustrationPolicy.js";
import { motionIllustrationNeedsErrors } from "../src/lib/motionIllustrationNeeds.js";
import { repairMotionIllustrationNeeds } from "../src/server/services/motionIllustrationRepairService.js";
import { requestMotionAiContract, type MotionAiContractState, type MotionAiResponseContract } from "../src/server/services/motionAiContractService.js";
import { puppetIllustrationReadIssues } from "../src/server/services/puppet/illustrationFacts.js";
import { puppetPropAssignments, puppetPropAssignmentsValid } from "../src/server/services/puppet/propPlacement.js";
import { layoutPuppetFrame, puppetSpots } from "../src/server/services/puppet/layout.js";
import { MOTION_PRODUCTION as P } from "../src/constants/motionProduction.js";
import { PUPPET } from "../src/constants/motionPuppet.js";
import { CINEMATIC_CHAT_PLANNING_CONFIG as C } from "../src/constants/cinematicConstants.js";
import { MOTION_ILLUSTRATION_NEEDS as N } from "../src/constants/motionIllustrationNeeds.js";
const original: any[] = [
  { char: Q.ACTOR, posture: "sit", action: "sit", support: "chair", placement: { relation: "at", anchor: Q.DOOR, evidence: Q.SOURCE } },
  { char: "patient", posture: "lie", action: "lie", support: Q.BED },
  { char: "essential", posture: "sit", action: "sit", support: "chair", essential: true },
];
const simple = simplePuppetStates(original, Q.SOURCE);
assert.equal(simple[0].posture, "idle");
assert.equal(simple[0].support, undefined);
assert.deepEqual(simple[0].placement, original[0].placement);
assert.equal(simple[1].posture, "lie");
assert.equal(simple[2].posture, "sit");
assert.equal(original[0].posture, "sit");
const held = { key: "latch", word: Q.LATCH, mount: "held", owner: Q.ACTOR, ownershipEvidence: Q.OTHER_HOLDS };
assert.ok(puppetIllustrationReadIssues({ who: [Q.ACTOR], objects: [held] } as any, { text: Q.OTHER_HOLDS } as any, Q.CAST as any).some((issue) => issue.path.includes("ownershipEvidence")));
assert.ok(puppetIllustrationReadIssues({ who: [Q.ACTOR], objects: [held] } as any, { text: Q.HOLD_REQUEST } as any, Q.CAST as any).some((issue) => issue.path.includes("ownershipEvidence")));
assert.deepEqual(puppetIllustrationReadIssues({ who: [Q.ACTOR], objects: [held] } as any, { text: Q.SELF_HOLDS } as any, Q.CAST as any), []);
const real = JSON.parse(fs.readFileSync(Q.REAL_DRAFT, "utf8")).draft;
const draft = { ...real, illustrationNeeds: [real.illustrationNeeds[0]] };
assert.ok(motionIllustrationNeedsErrors(draft).some((error) => error.includes(".mount:")));
const states: Record<string, MotionAiContractState> = {};
let checkpoint: any;
let calls = 0;
await assert.rejects(
  repairMotionIllustrationNeeds(draft, states, {
    save: (value) => {
      checkpoint = structuredClone(value);
    },
    request: (prompt, contract) =>
      requestMotionAiContract(
        prompt,
        {},
        async () => {
          calls++;
          assert.ok(prompt.length < 16000);
          if (calls === 1) return { need: { objects: [{ mount: "table" }], place: "wrong_place" } };
          throw new Error(Q.NETWORK);
        },
        contract,
      ),
  }),
  new RegExp(Q.NETWORK),
);
assert.equal(checkpoint.illustrationNeeds[0].objects[0].mount, "table");
assert.equal(checkpoint.illustrationNeeds[0].place, draft.illustrationNeeds[0].place);
const fixed = await repairMotionIllustrationNeeds(checkpoint, states, {
  save: (value) => {
    checkpoint = structuredClone(value);
  },
  request: (prompt, contract) => requestMotionAiContract(prompt, {}, async () => ({ need: { objects: [{ mount: "held", word: "wrong" }, { mount: "table" }] } }), contract),
});
assert.deepEqual(motionIllustrationNeedsErrors(fixed), []);
assert.equal(fixed.illustrationNeeds[0].objects[0].mount, "table");
assert.equal(fixed.illustrationNeeds[0].objects[0].word, real.illustrationNeeds[0].objects[0].word);
assert.deepEqual(fixed.chapters, real.chapters);
await repairMotionIllustrationNeeds(fixed, states, {
  save() {},
  request: async () => {
    throw new Error(Q.FORBIDDEN);
  },
});
const routeState: MotionAiContractState = { rejected: 0, errors: [] };
const contract: MotionAiResponseContract = { attempts: 2, routeAttempts: 2, budget: 6, state: routeState, assess: (raw) => ({ value: raw, errors: raw?.ok ? [] : [Q.SOURCE] }), repair: () => Q.SOURCE, failure: (errors) => new Error(errors.join("\n")) };
const primary: any = { provider: "gemini-chat", model: "gemini-flash::low" };
await assert.rejects(
  requestMotionAiContract(
    Q.SOURCE,
    primary,
    async () => {
      throw new Error(C.INVALID_JSON_RESPONSE_ERROR);
    },
    contract,
  ),
  (error: any) => error[P.CONTRACT_ROUTE_EXHAUSTED] === true && !error[P.CONTRACT_EXHAUSTED],
);
assert.equal(routeState.rejected, 2);
await assert.rejects(
  requestMotionAiContract(
    Q.SOURCE,
    primary,
    async () => {
      throw new Error(Q.FORBIDDEN);
    },
    contract,
  ),
  (error: any) => error[P.CONTRACT_ROUTE_EXHAUSTED] === true,
);
assert.deepEqual(await requestMotionAiContract(Q.SOURCE, { provider: "deepseek-chat" } as any, async () => ({ ok: true }), contract), { ok: true });
assert.equal(routeState.rejected, 2);
const audited = JSON.parse(fs.readFileSync(Q.FRAME_AUDIT, "utf8"));
for (const [time, path] of [
  [42.372, "ownershipEvidence"],
  [59.883, "states."],
  [70.827, "objects."],
  [108.275, "objects."],
] as const) {
  const row = audited.find((row: any) => row.t === time);
  const event = JSON.parse(row.context).events[0];
  const read = { ...event, who: event.states.map((state: any) => state.char) };
  assert.ok(
    puppetIllustrationReadIssues(read, { text: row.text } as any, Q.CAST as any).some((issue) => issue.path.includes(path)),
    String(time),
  );
}
const spots = puppetSpots({
  floorY: 920,
  spots: [
    { key: Q.DOOR, kind: "door", x: 250, y: 780, groundY: 900, label: Q.DOOR },
    { key: Q.BED, kind: "lie", x: 1500, y: 780, groundY: 900, label: Q.BED },
    { key: "far_table", kind: "surface", x: 300, y: 760, fixture: "table", label: "table" },
    { key: "bedside_table", kind: "surface", x: 1400, y: 760, fixture: "table", label: "table" },
  ],
});
const plate: any = { key: "plate", mount: "table", support: "table", placement: { anchor: Q.BED, evidence: Q.SOURCE } };
const mud: any = { key: "mud", mount: "floor", support: "floor", placement: { anchor: Q.DOOR, evidence: Q.SOURCE } };
const layouts = puppetPropAssignments([plate, mud], spots);
assert.ok(layouts.length);
assert.ok(layouts.every((layout) => layout.get(plate.key) === "bedside_table"));
assert.ok(puppetPropAssignmentsValid({ objects: [plate, mud] } as any, { prop: plate.key, propAt: "bedside_table", items: [{ prop: mud.key, propAt: layouts[0].get(mud.key) }] } as any, spots));
assert.ok(!puppetPropAssignmentsValid({ objects: [plate] } as any, { prop: plate.key, propAt: "far_table" } as any, spots));
const placed = layoutPuppetFrame(
  { layoutLocked: true, shot: "wide", actors: [], prop: plate.key, propMount: plate.mount, propSupport: plate.support, propAt: layouts[0].get(plate.key), items: [{ prop: mud.key, propMount: mud.mount, propSupport: mud.support, propAt: layouts[0].get(mud.key) }] },
  { set: { spots, floorY: 920 }, body: { head: 1, headW: 1, bodyW: 1 }, heights: {}, prop: { size: 0.3, height: 0.3, mount: plate.mount }, props: { [mud.key]: { size: 0.3, height: 0.3, mount: mud.mount } } },
);
assert.ok(Math.abs(placed.propX! * PUPPET.SET_W - spots.find((spot) => spot.key === "bedside_table")!.x) < 1);
assert.ok(Math.abs(placed.items![0].propX! * PUPPET.SET_W - spots.find((spot) => spot.key === layouts[0].get(mud.key))!.x) < 1);
assert.ok(puppetPropAssignmentsValid({ objects: [plate, mud] } as any, placed as any, spots));
console.log(Q.OUTPUT);
