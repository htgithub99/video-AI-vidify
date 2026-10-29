import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { acceptMotionIllustrationAudit, motionIllustrationCoverageMissing, motionIllustrationNeedsErrors } from "../src/lib/motionIllustrationNeeds.js";
import { completeMotionIllustrationCoverage } from "../src/server/services/motionIllustrationRepairService.js";
import { requestMotionAiContract } from "../src/server/services/motionAiContractService.js";
import { motionVoiceSignature } from "../src/lib/motionVoice.js";
import { puppetHoldingEvidence, puppetParentEvidence } from "../src/server/services/puppet/illustrationFacts.js";
import { normalizePuppetVisualState } from "../src/server/services/puppet/visualContract.js";
import { MOTION_PACK as K } from "../src/constants/motionPack.js";
import { layoutPuppetFrame, puppetSetPlacementNeeds, puppetSetMissingRequirements } from "../src/server/services/puppet/layout.js";
import { puppetPropAssignments, puppetPropAssignmentsValid } from "../src/server/services/puppet/propPlacement.js";
import { puppetObjectParentEvidence } from "../src/lib/motionPropSupport.js";
const root = fs.mkdtempSync(path.join(os.tmpdir(), "motion-root-contracts-"));
delete process.env.APP_DATA_DIR;
process.env.VIDIFY_STORAGE_DIR = root;
const { normalizeBeats } = await import("../src/server/services/motionStoryService.js");
const { recoverMotionIllustrationPlan } = await import("../src/server/services/motionPlanRecoveryService.js");
const { MotionResourceError } = await import("../src/lib/motionResourceFailure.js");
const cast = [
  { key: "a", name: "Nam", gender: "male", age: "adult", role: "villager" },
  { key: "b", name: "Bà", gender: "female", age: "senior", role: "villager" },
];
const places: any = { room: { key: "room", name: "Phòng khách", desc: "Village living room", interior: true } };
const analysis: any = {
  title: "Chuyện mới",
  logline: "Nam trở về nhà.",
  stylePreset: "minimal_mask",
  cast,
  places: Object.values(places),
  chapters: [
    { id: "c1", summary: "Nam trở về nhà.", keyPoints: ["Nam gặp bà."] },
    { id: "c2", summary: "Bà kể chuyện.", keyPoints: ["Nam lắng nghe."] },
  ],
  illustrationNeeds: [],
};
let coverageCalls = 0;
const states: any = {};
const options = {
  inventory: () => "closed library",
  save() {},
  request: (prompt: string, contract: any) =>
    requestMotionAiContract(
      prompt,
      {},
      async () => {
        coverageCalls++;
        const chapterId = prompt.includes('"id":"c1"') ? "c1" : "c2";
        return { chapterId, checked: true, reviewedNeedIds: [], reviewedClues: [], needs: [] };
      },
      contract,
    ),
};
assert.deepEqual(motionIllustrationCoverageMissing(analysis), ["c1", "c2"]);
const covered = await completeMotionIllustrationCoverage(analysis, states, options);
assert.deepEqual(motionIllustrationCoverageMissing(covered), []);
await completeMotionIllustrationCoverage(covered, states, {
  ...options,
  request: async () => {
    throw new Error("accepted coverage called twice");
  },
});
assert.equal(coverageCalls, 2);
assert.deepEqual(motionIllustrationCoverageMissing({ ...covered, chapters: [...covered.chapters].reverse() }), []);
assert.deepEqual(motionIllustrationCoverageMissing({ ...covered, chapters: covered.chapters.map((chapter: any) => (chapter.id === "c2" ? { ...chapter, summary: "Bà tìm thấy chiếc khăn." } : chapter)) }), ["c2"]);
const audit = [
  { chapterId: "c1", checked: true, needIds: [], clueIndices: [] },
  { chapterId: "c2", checked: true, needIds: [], clueIndices: [] },
];
assert.deepEqual(motionIllustrationCoverageMissing(acceptMotionIllustrationAudit(analysis, audit)), []);
assert.deepEqual(motionIllustrationCoverageMissing(acceptMotionIllustrationAudit(acceptMotionIllustrationAudit(analysis, audit), audit)), []);
assert.deepEqual(motionIllustrationCoverageMissing(acceptMotionIllustrationAudit(analysis, [{ ...audit[0], checked: false }])), ["c1", "c2"]);
const withClue = { ...analysis, storySpine: { clues: [{ detail: "Chiếc khăn", setupChapterId: "c1", payoffChapterId: "c2", payoff: "Bà nhận ra nó." }] } };
assert.deepEqual(motionIllustrationCoverageMissing(acceptMotionIllustrationAudit(withClue, audit)), [], "Confirmed chapter review records clue coverage locally without echoed index lists");
const failedStates: any = {};
let rejected = 0;
await assert.rejects(
  completeMotionIllustrationCoverage(analysis, failedStates, {
    ...options,
    request: (prompt, contract) =>
      requestMotionAiContract(
        prompt,
        {},
        async () => {
          rejected++;
          return { checked: false };
        },
        contract,
      ),
  }),
);
assert.equal(rejected, 2);
await assert.rejects(
  completeMotionIllustrationCoverage(analysis, failedStates, {
    ...options,
    request: (prompt, contract) =>
      requestMotionAiContract(
        prompt,
        {},
        async () => {
          throw new Error("route budget reset");
        },
        contract,
      ),
  }),
);
assert.equal(rejected, 2);
const raw = [
  { narration: "Nam trở về nhà.", visual: "scene", place: "room", cast: ["a"] },
  { narration: "Bà kể chuyện.", visual: "scene", place: "room", cast: ["b"] },
];
const beats = normalizeBeats(raw, "c1", analysis);
const inserted = normalizeBeats([{ narration: "Một cơn gió lùa qua." }, ...raw], "c1", analysis);
assert.deepEqual(
  inserted.slice(1).map((beat) => beat.id),
  beats.map((beat) => beat.id),
);
assert.equal(normalizeBeats([{ ...raw[0], id: "legacy_c1_b1" }], "c1", analysis)[0].id, "legacy_c1_b1");
assert.equal(new Set(normalizeBeats([raw[0], raw[0]], "c1", analysis).map((beat) => beat.id)).size, 2);
const script: any = { language: "vi", beats, voiceSettings: {} };
const signature = motionVoiceSignature(script, analysis);
assert.equal(motionVoiceSignature({ ...script, title: "SEO khác", beats: beats.map((beat) => ({ ...beat, place: "river", visual: "bitmap", chapterId: "other" })) }, { ...analysis, title: "SEO khác", places: [{ key: "river" }], cast: cast.map((member) => ({ ...member, look: "Different clothes and background" })) }), signature);
assert.notEqual(motionVoiceSignature({ ...script, beats: beats.map((beat, i) => (i ? beat : { ...beat, narration: "Nam đứng trước sân." })) }, analysis), signature);
assert.notEqual(motionVoiceSignature(script, { ...analysis, cast: cast.map((member) => ({ ...member, age: "child" })) }), signature);
const object: any = { key: "lamp", identity: "lamp", catalogKey: "oil_lamp", word: "đèn dầu", type: "other", mount: "held", owner: "a" };
const line = (key: string, text: string, scene = "now"): any => ({ key, place: "room", chapterId: "c1", text, visualUnit: { scene } });
const holds = line("l1", "Nam cầm đèn dầu.");
const puts = line("l2", "Nam đặt đèn dầu xuống bàn.");
const takes = line("l3", "Bà cầm đèn dầu.");
assert.ok(puppetHoldingEvidence(object, holds, cast as any));
assert.equal(puppetHoldingEvidence(object, puts, cast as any, [holds]), undefined);
assert.equal(puppetHoldingEvidence(object, takes, cast as any, [holds, puts]), undefined);
assert.ok(puppetHoldingEvidence({ ...object, owner: "b" }, takes, cast as any, [holds, puts]));
assert.equal(puppetHoldingEvidence(object, line("l4", "Nam nhìn lên.", "now"), cast as any, [holds, line("flash", "Năm xưa bà còn trẻ.", "memory")]), undefined);
const read = (owner: string, objects: any[], timeline = "now"): any => ({ who: ["a", "b"], objects, object: null, place: "room", visual: { scene: timeline, timeline, evidence: ["Nam"], fixtures: [] }, focus: owner });
const normalized = normalizePuppetVisualState([holds, puts, takes], { l1: read("a", [object]), l2: read("a", []), l3: read("b", [{ ...object, owner: "b" }]) }, structuredClone(places), undefined, cast as any);
assert.equal(normalized.l2.objects.length, 0);
assert.equal(normalized.l3.objects[0].owner, "b");
const wrongNoun: any = { ...analysis, chapters: [{ id: "c1", summary: "Nam đặt mâm cúng." }], illustrationNeeds: [{ id: "n1", chapterId: "c1", place: "room", evidence: "Nam đặt mâm cúng.", states: [], objects: [{ key: "tray", catalogKey: "broom", word: "mâm cúng", type: "other", mount: "table" }] }] };
assert.ok(motionIllustrationNeedsErrors(wrongNoun).some((error) => error.includes("catalogKey")));
const repairState: any = { attempts: 0, errors: [] };
let repairCalls = 0,
  partialSaved = false;
const recovered = await recoverMotionIllustrationPlan(
  {
    ...analysis,
    cast: [
      { key: "a", name: "Nam", look: "adult male villager", gender: "female" },
      { key: "b", name: "Bà", look: "elderly female villager", gender: "male" },
    ],
  },
  {
    exec: {},
    state: repairState,
    log() {},
    check: async () => undefined,
    save: (value) => {
      if (value.cast[0].gender === "male" && value.cast[1].gender === "male") partialSaved = true;
    },
    ai: async (prompt) => {
      repairCalls++;
      if (repairCalls === 2) assert.equal(prompt.includes('"key":"a"'), false);
      return {
        cast:
          repairCalls === 1
            ? [
                { key: "a", gender: "male" },
                { key: "b", gender: "male" },
              ]
            : [{ key: "b", gender: "female" }],
      };
    },
  },
);
assert.equal(repairCalls, 2);
assert.equal(partialSaved, true);
assert.deepEqual(
  recovered.analysis.cast.map((member) => member.gender),
  ["male", "female"],
);
const scopedNeeds = [
  { id: "rest", chapterId: "c1", place: "room", evidence: "Bà nằm trên giường.", states: [{ char: "b", action: "lie", posture: "lie", support: "bed" }], objects: [] },
  { id: "same", chapterId: "c1", place: "room", evidence: "Bà đáp lời.", states: [{ char: "b", action: "talk", posture: "idle" }], objects: [] },
  { id: "outside", chapterId: "c1", place: "yard", evidence: "Nam ở sân.", states: [{ char: "a", action: "stand", posture: "idle" }], objects: [] },
  { id: "return", chapterId: "c1", place: "room", evidence: "Bà đợi Nam.", states: [{ char: "b", action: "stand", posture: "idle" }], objects: [] },
];
const scoped = await recoverMotionIllustrationPlan({ ...analysis, illustrationNeeds: scopedNeeds } as any, {
  exec: {},
  state: { attempts: 0, errors: [] },
  log() {},
  save() {},
  check: async () => undefined,
  ai: async () => {
    throw new Error("valid scoped state must not ask AI");
  },
});
assert.equal(scoped.analysis.illustrationNeeds![1].states[0].posture, "lie");
assert.equal(scoped.analysis.illustrationNeeds![3].states[0].posture, "idle");
let noProgressCalls = 0;
const unavailable = () => new MotionResourceError({ kind: K.SET, reason: "search_limit", name: "living", details: [] });
await assert.rejects(
  recoverMotionIllustrationPlan(
    { ...analysis, places: [{ key: "room", name: "Living room", description: "living room", interior: true }] },
    {
      exec: {},
      state: { attempts: 0, errors: [] },
      log() {},
      save() {},
      check: async (value: any) => {
        if (value.places[0]?.name === "living") return { places: { room: "set" }, pack: { assets: { set: { locationFamily: "living" } } } } as any;
        throw unavailable();
      },
      ai: async () => {
        assert.ok(++noProgressCalls <= 2);
        return { places: [{ key: "room", optionId: "living_0", name: "Living room", description: "living room" }] };
      },
    },
  ),
);
assert.equal(noProgressCalls, 1);
const tray: any = { key: "tray", catalogKey: "wooden_tray", word: "khay gỗ", type: "other", mount: "table", support: "table", size: 0.4 };
const bowl: any = { key: "bowl", catalogKey: "plain_rice_bowl", word: "bát cơm", type: "other", mount: "table", support: "tray", size: 0.15 };
assert.ok(puppetObjectParentEvidence(bowl, tray, "Nam đặt bát cơm lên khay gỗ."));
assert.ok(puppetObjectParentEvidence(bowl, tray, "Khay gỗ đựng bát cơm."));
assert.equal(puppetObjectParentEvidence(bowl, tray, "Bát cơm ở trên bàn, khay gỗ dưới đất."), false);
assert.equal(puppetObjectParentEvidence(bowl, tray, "Nam muốn đặt bát cơm lên khay gỗ."), false);
const parentLine = (text: string, place = "room") => ({ text, place }) as any;
const parentHistory = [parentLine("Nam đặt bát cơm lên khay gỗ.")];
assert.ok(puppetParentEvidence(bowl, tray, parentLine("Nam nhìn bà."), parentHistory));
assert.equal(puppetParentEvidence(bowl, tray, parentLine("Nam nhấc bát cơm ra khỏi khay gỗ."), parentHistory), false);
assert.equal(puppetParentEvidence(bowl, tray, parentLine("Nam nhìn bà."), [...parentHistory, parentLine("Nam bước ra sân.", "yard")]), false);
assert.ok(puppetParentEvidence(bowl, tray, parentLine("Nam đặt bát cơm lên khay gỗ."), [...parentHistory, parentLine("Nam nhấc bát cơm ra khỏi khay gỗ.")]));
const nestedRead: any = { who: [], states: [], objects: [tray, bowl], object: bowl };
const set: any = { name: "Room", desc: "room", tags: [], svg: "<svg></svg>", floorY: 950, horizonY: 700, spots: [{ key: "table_top", fixture: "table", kind: "surface", x: 800, y: 800, label: "table" }] };
assert.deepEqual(puppetSetPlacementNeeds([nestedRead]), [{ support: "table", kind: "surface", count: 1 }]);
assert.deepEqual(puppetSetMissingRequirements(set, [nestedRead]), []);
assert.equal(puppetPropAssignments([tray, bowl], set.spots).length, 1);
const assets: any = { tray: { key: "wooden_tray", size: 0.4, height: 0.4, mount: "table", base: [256, 480] }, bowl: { key: "plain_rice_bowl", size: 0.15, height: 0.15, mount: "table", base: [256, 480] } };
const frame: any = { shot: "people", actors: [], prop: "bowl", propMount: "table", propSupport: "tray", items: [{ prop: "tray", propMount: "table", propSupport: "table", propAt: "table_top" }] };
const ctx = { set, body: { head: 0.2, headW: 1, bodyW: 1 }, heights: {}, props: assets, prop: assets.bowl };
const nested = layoutPuppetFrame(frame, ctx);
assert.equal(nested.propParent, "tray");
assert.equal(nested.items[0].propAt, "table_top");
const rootPrimary = layoutPuppetFrame({ ...frame, prop: "tray", propSupport: "table", items: [{ prop: "bowl", propSupport: "tray", propMount: "table" }] }, { ...ctx, prop: assets.tray });
assert.equal(rootPrimary.propAt, "table_top");
assert.ok(nested.propY < nested.items[0].propY);
assert.ok(nested.propDepthY > nested.items[0].propY);
assert.equal(puppetPropAssignmentsValid(nestedRead, nested, set.spots), true);
assert.throws(() => layoutPuppetFrame(frame, { ...ctx, props: { ...assets, bowl: { ...assets.bowl, size: 2 } } }));
assert.deepEqual(puppetPropAssignments([{ ...tray, support: "bowl" }, bowl], set.spots), []);
console.log(JSON.stringify({ passed: true, coverage: true, stableIds: true, voiceDependencies: true, releasesAndTransfers: true, partialRepair: true, boundedNoProgress: true, nounMismatch: true, videoCreated: false }));
