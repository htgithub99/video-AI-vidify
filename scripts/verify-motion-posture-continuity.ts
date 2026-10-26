import { VERIFICATION_VALUES as VT } from "./motionVerificationValues.js";
import assert from "node:assert/strict";
import { POSTURE_QA as V } from "./motionPostureContinuityVerificationTexts.js";
import { normalizePuppetReadContinuity } from "../src/server/services/puppet/readContinuity.js";
import { fitPuppetRead } from "../src/server/services/puppet/director.js";
import { puppetStatePose, puppetSupportAssignments } from "../src/server/services/puppet/layout.js";
const reads = normalizePuppetReadContinuity(V.LINES, structuredClone(V.READS));
const stable = structuredClone(V.READS);
stable.rest.states = [{ char: "a", action: "stand", posture: "lie", support: "bed", transition: false }];
stable.speech.states = [{ char: "a", action: "stand", posture: "idle", support: "bed", transition: false }];
stable.rest.visual = { scene: "view_a", timeline: "present", evidence: ["rest"], fixtures: [] };
stable.speech.visual = { scene: "view_b", timeline: "present", evidence: ["speech"], fixtures: [] };
const retained = normalizePuppetReadContinuity(V.LINES, stable);
assert.equal(retained.rest.states![0].posture, "lie");
assert.equal(retained.speech.states![0].posture, "lie");
stable.speech.states[0].transition = true;
assert.equal(normalizePuppetReadContinuity(V.LINES, stable).speech.states![0].posture, "idle");
const K = V.KEYS;
assert.equal(puppetStatePose(reads[K.SPEECH].states![0]), K.LIE);
assert.equal(reads[K.SPEECH].states![0].support, K.BED);
assert.equal(puppetStatePose(reads[K.SPEECH].states![1]), K.SIT);
assert.equal(reads[K.SPEECH].states![1].support, K.CHAIR);
assert.equal(puppetStatePose(reads[K.STAND].states![0]), K.IDLE);
assert.equal(reads[K.STAND].states![0].support, undefined);
assert.equal(reads[K.YARD].states![0].posture, undefined);
assert.equal(reads[K.RETURN].states![0].posture, undefined);
assert.equal(reads[K.PRESENT].states![0].posture, undefined);
assert.deepEqual(normalizePuppetReadContinuity(V.LINES, reads), reads);
assert.equal(puppetStatePose({ char: K.A, action: VT.TALK, posture: K.IDLE, support: K.CHAIR }), K.SIT);
assert.equal(puppetStatePose({ char: K.A, action: K.STAND, posture: K.IDLE, support: K.CHAIR }), K.IDLE);
assert.equal(puppetStatePose({ char: K.A, action: VT.TALK, posture: K.LIE, support: K.BED }), K.LIE);
assert.equal(puppetSupportAssignments(reads[K.SPEECH].states!.slice(0, 1), [V.DAYBED_SPOT])?.get(K.A), K.BED_SPOT);
for (const action of [VT.WALK, VT.RUN]) assert.equal(puppetStatePose({ char: K.A, action, posture: K.IDLE }), action);
const visible = fitPuppetRead(
  {
    shot: VT.OTS,
    actors: [
      { char: K.A, pose: K.LIE, expr: VT.SAD, face: VT.RIGHT },
      { char: VT.B, pose: K.SIT, expr: VT.SAD, face: VT.BACK, depth: VT.FORE },
    ],
  },
  reads[K.SPEECH],
  [V.DAYBED_SPOT],
);
assert.equal(visible.shot, VT.PEOPLE);
assert.ok(visible.actors.every((actor) => actor.depth === VT.MID));
const underBed = V.UNDER_BED;
assert.equal(puppetSupportAssignments([underBed.STATE], [underBed.SPOT, underBed.TOP])?.get(K.A), underBed.SPOT.key);
assert.equal(puppetSupportAssignments([underBed.STATE], [underBed.ALIAS, underBed.TOP])?.get(K.A), underBed.ALIAS.key);
assert.equal(puppetSupportAssignments([underBed.STATE], [underBed.TOP]), null);
assert.equal(puppetSupportAssignments([underBed.STATE, underBed.OTHER], [underBed.SPOT, underBed.TOP]), null);
assert.equal(puppetSupportAssignments([{ ...underBed.STATE, support: underBed.TOP.key }], [underBed.SPOT]), null);
process.stdout.write(V.PASSED);
