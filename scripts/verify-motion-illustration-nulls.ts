import assert from "node:assert/strict";
import fs from "node:fs";
import { ILLUSTRATION_NULL_QA as T } from "./motionIllustrationNullVerificationTexts.js";
import { MOTION_ILLUSTRATION_NEEDS as N } from "../src/constants/motionIllustrationNeeds.js";
import { MOTION_PRODUCTION as P } from "../src/constants/motionProduction.js";
import { MOTION_RESPONSE_SCHEMAS } from "../src/constants/motionResponseContract.js";
import { normalizeMotionResponseOptionals, motionResponseIssues } from "../src/lib/motionResponseContract.js";
import { motionIllustrationNeedsErrors, normalizeMotionIllustrationNeedOptionals, normalizeMotionIllustrationNeeds } from "../src/lib/motionIllustrationNeeds.js";
import { completeMotionIllustrationCoverage, repairMotionIllustrationNeeds } from "../src/server/services/motionIllustrationRepairService.js";
import { requestMotionAiContract, type MotionAiContractState } from "../src/server/services/motionAiContractService.js";
const { repairStates, ...fixture } = JSON.parse(fs.readFileSync(T.FIXTURE, "utf8"));
const original = JSON.stringify(fixture);
const canonical = normalizeMotionIllustrationNeedOptionals(fixture);
assert.deepEqual(motionIllustrationNeedsErrors(fixture), []);
assert.equal(JSON.stringify(fixture), original);
assert.deepEqual(normalizeMotionIllustrationNeedOptionals(canonical), canonical);
assert.equal(Object.hasOwn(canonical.illustrationNeeds[1].objects[0], "support"), false);
assert.equal(Object.hasOwn(canonical.illustrationNeeds[2].states[0], "support"), false);
assert.equal(Object.hasOwn(canonical.illustrationNeeds[2].objects[0], "owner"), false);
assert.equal(canonical.illustrationNeeds[0].objects[0].support, fixture.illustrationNeeds[0].objects[0].support);
const states = structuredClone(repairStates);
let saved: any;
const recovered = await repairMotionIllustrationNeeds(fixture, states, {
  save: (value) => {
    saved = structuredClone(value);
  },
  request: async () => {
    throw new Error(T.NO_AI);
  },
});
assert.deepEqual(recovered, canonical);
assert.deepEqual(saved, canonical);
assert.equal(states["1"].rejected, P.CONTRACT_TOTAL_ATTEMPTS);
for (const key of ["title", "chapters", "cast", "places"]) assert.deepEqual(recovered[key], fixture[key]);
for (const invalid of ["", 0, false, [], {}, T.SOURCE_KEY]) {
  const next = structuredClone(canonical);
  next.illustrationNeeds[1].objects[0].support = invalid;
  assert.ok(motionIllustrationNeedsErrors(next).some((error) => error.includes("objects[0].support")));
}
for (const key of ["key", "word", "mount"]) {
  const next = structuredClone(canonical);
  next.illustrationNeeds[1].objects[0][key] = null;
  const normalized = normalizeMotionIllustrationNeedOptionals(next);
  assert.equal(normalized.illustrationNeeds[1].objects[0][key], null);
  assert.ok(motionIllustrationNeedsErrors(normalized).some((error) => error.includes("objects[0]." + key)));
}
const nullableSchema: any = { type: "object", required: ["required"], properties: { required: { anyOf: [{ type: "string" }, { type: "null" }] }, optional: { anyOf: [{ type: "string" }, { type: "null" }] }, active: { type: "boolean" }, size: { type: "number" } } };
assert.deepEqual(normalizeMotionResponseOptionals({ required: null, optional: null, active: false, size: 0 }, nullableSchema), { required: null, active: false, size: 0 });
assert.deepEqual(motionResponseIssues(fixture.illustrationNeeds[1], MOTION_RESPONSE_SCHEMAS[N.ARTIFACT].properties!.need), []);
const coverageInput: any = { ...fixture, chapters: [fixture.chapters[0]], illustrationNeeds: [] };
const covered = await completeMotionIllustrationCoverage(
  coverageInput,
  {},
  {
    save: (value) => {
      saved = structuredClone(value);
    },
    inventory: () => "",
    request: (prompt, contract) => requestMotionAiContract(prompt, {}, async () => ({ chapterId: coverageInput.chapters[0].id, checked: true, reviewedNeedIds: [], reviewedClues: [], needs: [fixture.illustrationNeeds[1]] }), contract),
  },
);
assert.equal(Object.hasOwn(covered.illustrationNeeds![0].objects[0], "support"), false);
assert.deepEqual(motionIllustrationNeedsErrors(covered), []);
const broken = structuredClone(canonical);
broken.illustrationNeeds[1].objects[0].support = broken.illustrationNeeds[1].place;
const pendingState: Record<string, MotionAiContractState> = {};
let calls = 0;
await assert.rejects(
  repairMotionIllustrationNeeds(broken, pendingState, {
    save: (value) => {
      saved = structuredClone(value);
    },
    request: (prompt, contract) =>
      requestMotionAiContract(
        prompt,
        {},
        async () => {
          if (++calls === 1) return { need: { objects: [{}] } };
          throw new Error(T.INTERRUPTED);
        },
        contract,
      ),
  }),
  new RegExp(T.INTERRUPTED),
);
assert.equal(saved.illustrationNeeds[1].objects[0].support, broken.illustrationNeeds[1].place);
assert.equal(pendingState["1"].progress!.unchanged, 1);
const resumed = await repairMotionIllustrationNeeds(saved, pendingState, {
  save: (value) => {
    saved = structuredClone(value);
  },
  request: (prompt, contract) => requestMotionAiContract(prompt, {}, async () => ({ need: { objects: [{ support: null, owner: null, key: null }], states: [{ char: null }], evidence: null } }), contract),
});
assert.deepEqual(resumed, canonical);
assert.deepEqual(resumed.illustrationNeeds[0], canonical.illustrationNeeds[0]);
const patient = structuredClone(broken);
patient.chapters = [{ ...patient.chapters[0], summary: T.BED_EVIDENCE }];
patient.illustrationNeeds = [{ ...patient.illustrationNeeds[1], evidence: T.BED_EVIDENCE, states: [...patient.illustrationNeeds[1].states, { char: "toi", action: "lie", posture: "lie", support: "bed", essential: true }] }];
const patientResult = await repairMotionIllustrationNeeds(
  patient,
  {},
  {
    save() {},
    request: (prompt, contract) =>
      requestMotionAiContract(
        prompt,
        {},
        async () => ({
          need: {
            objects: [{ support: null }],
            states: [
              { char: null, posture: null, support: null },
              { support: null, posture: "idle", essential: false },
            ],
          },
        }),
        contract,
      ),
  },
);
assert.deepEqual(patientResult.illustrationNeeds[0].states, patient.illustrationNeeds[0].states);
assert.deepEqual(normalizeMotionIllustrationNeeds(patientResult).illustrationNeeds[0].states[1], patient.illustrationNeeds[0].states[1]);
assert.deepEqual(motionIllustrationNeedsErrors(patientResult), []);
const stalledState: Record<string, MotionAiContractState> = {};
let stalledCalls = 0;
const unchangedOptions = {
  save: (value: any) => {
    saved = structuredClone(value);
  },
  request: async (prompt: string, contract: any) => {
    for (const provider of ["gemini-chat", "deepseek-chat", "chatgpt-ui", "grok-chat", "claude-chat"]) {
      try {
        return await requestMotionAiContract(
          prompt,
          { provider } as any,
          async () => {
            stalledCalls++;
            return { need: { objects: [{}] } };
          },
          contract,
        );
      } catch (error: any) {
        if (error[P.CONTRACT_EXHAUSTED] || !error[P.CONTRACT_ROUTE_EXHAUSTED]) throw error;
      }
    }
  },
};
await assert.rejects(repairMotionIllustrationNeeds(broken, stalledState, unchangedOptions), (error: any) => error[P.CONTRACT_STALLED] === true && error[P.CONTRACT_EXHAUSTED] === true && error.message.includes(N.NO_PROGRESS));
assert.equal(stalledCalls, N.NO_PROGRESS_ATTEMPTS);
await assert.rejects(repairMotionIllustrationNeeds(saved, stalledState, unchangedOptions), (error: any) => error[P.CONTRACT_STALLED] === true);
assert.equal(stalledCalls, N.NO_PROGRESS_ATTEMPTS);
const progressed = structuredClone(broken);
progressed.illustrationNeeds[1].objects[0].support = "";
const progressState: Record<string, MotionAiContractState> = {};
let progressCalls = 0;
const progressResult = await repairMotionIllustrationNeeds(progressed, progressState, {
  save() {},
  request: async (prompt, contract) => {
    for (const provider of ["gemini-chat", "deepseek-chat"]) {
      try {
        return await requestMotionAiContract(prompt, { provider } as any, async () => ({ need: { objects: [{ support: ++progressCalls < 3 ? (progressCalls === 1 ? 0 : false) : null }] } }), contract);
      } catch (error: any) {
        if (error[P.CONTRACT_EXHAUSTED] || !error[P.CONTRACT_ROUTE_EXHAUSTED]) throw error;
      }
    }
  },
});
assert.deepEqual(progressResult, canonical);
assert.equal(progressCalls, 3);
process.stdout.write(T.PASSED);
