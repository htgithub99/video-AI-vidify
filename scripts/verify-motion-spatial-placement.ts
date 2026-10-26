import assert from "node:assert/strict";
import { cleanPuppetSpatialPlacement, puppetSpatialAssignmentsValid, puppetActorAssignments } from "../src/server/services/puppet/spatialPlacement.js";
import { scorePuppetSceneChoice } from "../src/server/services/puppet/packSceneChoices.js";
import { SPATIAL_QA as T } from "./motionSpatialVerificationTexts.js";
import { puppetSourceQuote } from "../src/lib/motionPuppetValues.js";
assert.equal(puppetSourceQuote(T.PUNCTUATED, T.UNPUNCTUATED), T.PUNCTUATED.slice(0, -1));
assert.equal(puppetSourceQuote(T.PUNCTUATED, T.WRONG), undefined);
const read: any = { states: [{ char: T.PATIENT, placement: { relation: "between", targets: [T.A, T.B] } }] };
const assignments = new Map([
  [T.PATIENT, T.CENTER],
  [T.A, T.LEFT],
  [T.B, T.RIGHT],
]);
assert.ok(puppetSpatialAssignmentsValid(read, assignments, T.SPOTS));
assert.ok(
  !puppetSpatialAssignmentsValid(
    read,
    new Map([
      [T.PATIENT, T.LEFT],
      [T.A, T.CENTER],
      [T.B, T.RIGHT],
    ]),
    T.SPOTS,
  ),
);
read.states = [{ char: T.A, placement: { relation: "at", anchor: T.DOOR } }];
assert.ok(!puppetSpatialAssignmentsValid(read, assignments, T.SPOTS));
assert.ok(puppetSpatialAssignmentsValid(read, new Map([[T.A, T.DOOR]]), T.SPOTS));
read.states = [{ char: T.A, placement: { relation: "beside", targets: [T.B] } }];
assert.ok(!puppetSpatialAssignmentsValid(read, assignments, T.SPOTS));
assert.ok(
  puppetSpatialAssignmentsValid(
    read,
    new Map([
      [T.A, T.CENTER],
      [T.B, T.RIGHT],
    ]),
    T.SPOTS,
  ),
);
assert.ok(cleanPuppetSpatialPlacement({ relation: "at", anchor: T.DOOR, evidence: T.TEXT }, { text: T.TEXT } as any, [T.A], T.A));
assert.equal(cleanPuppetSpatialPlacement({ relation: "at", anchor: T.DOOR, evidence: T.WRONG }, { text: T.TEXT } as any, [T.A], T.A), undefined);
assert.equal(cleanPuppetSpatialPlacement({ relation: "beside", targets: [T.A], evidence: T.TEXT }, { text: T.TEXT } as any, [T.A], T.A), undefined);
read.states = [
  { char: T.A, placement: { relation: "at", anchor: T.DOOR } },
  { char: T.B, placement: { relation: "behind", targets: [T.A] } },
];
assert.ok(
  !puppetSpatialAssignmentsValid(
    read,
    new Map([
      [T.A, T.FORWARD],
      [T.B, T.DOOR],
    ]),
    T.SPOTS,
  ),
);
assert.ok(
  puppetSpatialAssignmentsValid(
    read,
    new Map([
      [T.A, T.DOOR],
      [T.B, T.RIGHT],
    ]),
    T.SPOTS,
  ),
);
read.states = [{ char: T.A, placement: { relation: "at", anchor: T.BED } }];
assert.ok(puppetSpatialAssignmentsValid(read, new Map([[T.A, T.BEDSIDE]]), T.SPOTS));
read.states = [{ char: T.A, placement: { relation: "beside", anchor: T.BED } }];
assert.ok(puppetSpatialAssignmentsValid(read, new Map([[T.A, T.BEDSIDE]]), T.SPOTS));
read.states = [{ char: T.A, placement: { relation: "beside", targets: [] } }];
assert.equal(puppetSpatialAssignmentsValid(read, assignments, T.SPOTS), false);
read.states = [{ char: T.A, placement: { relation: "between", targets: [T.B] } }];
assert.equal(puppetSpatialAssignmentsValid(read, assignments, T.SPOTS), false);
assert.ok(cleanPuppetSpatialPlacement({ relation: "beside", anchor: T.DOOR, evidence: T.TEXT }, { text: T.TEXT } as any, [T.A], T.A));
read.states = [T.A, T.B].map((char) => ({ char, action: "stand", posture: "idle", placement: { relation: "at", anchor: T.DOOR } }));
const shared = puppetActorAssignments(read, T.SPOTS);
assert.ok(shared);
assert.equal(new Set(shared.values()).size, 2);
const atDoor: any = {
  shot: "group",
  actors: [
    { char: T.A, spot: T.DOOR, x: 1650 / 1920 },
    { char: T.B, spot: T.CENTER, x: 850 / 1920 },
  ],
};
const closerTogether: any = { ...atDoor, actors: [{ char: T.A, spot: T.FORWARD, x: 1500 / 1920 }, atDoor.actors[1]] };
read.states = [{ char: T.A, placement: { relation: "at", anchor: T.DOOR } }];
assert.ok(scorePuppetSceneChoice(atDoor, read, closerTogether, new Map(), T.SPOTS) > scorePuppetSceneChoice(closerTogether, read, closerTogether, new Map(), T.SPOTS));
process.stdout.write(T.PASSED);
