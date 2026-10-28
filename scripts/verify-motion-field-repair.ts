import assert from "node:assert/strict";
import { MotionRepairLedger, mergeMotionRepair } from "../src/lib/motionAiRepair.js";
import { mergeMotionChapterDraft, motionChapterPending } from "../src/lib/motionChapterRepair.js";
import { motionLocationFamily, motionCharacterTraits } from "../src/lib/motionResourceSemantics.js";
import { puppetPackSetLocationFits } from "../src/server/services/puppet/packLocation.js";
import { readPuppetLines } from "../src/server/services/puppet/director.js";
import { writeChapterBeats } from "../src/server/services/motionStoryService.js";
import { requestMotionAiContract, type MotionAiResponseContract, type MotionAiContractState } from "../src/server/services/motionAiContractService.js";
import { MOTION_PRODUCTION as PRODUCTION } from "../src/constants/motionProduction.js";
const before = { actor: { owner: "a", posture: "lie" }, states: [{ posture: "lie", support: "bed" }], locked: true };
assert.deepEqual(mergeMotionRepair(before, { actor: { owner: "b", posture: "stand" }, locked: false }, ["actor.owner"]), { ...before, actor: { owner: "b", posture: "lie" } });
assert.deepEqual(mergeMotionRepair(before, { actor: {} }, ["actor.owner"]), before);
assert.equal(mergeMotionRepair(before, { actor: { owner: null } }, ["actor.owner"]).actor.owner, null);
assert.equal(mergeMotionRepair(before, { states: [{ posture: "sit", support: "chair" }] }, ["states.0.posture"]).states[0].support, "bed");
assert.deepEqual(mergeMotionRepair(before, JSON.parse('{"__proto__":{"polluted":true}}'), ["__proto__.polluted"]), before);
assert.equal(({} as any).polluted, undefined);
const ledger = new MotionRepairLedger<any>(["one", "two"], (row) => (row.owner ? [] : [{ path: "owner", reason: "required" }]));
ledger.submit([
  { id: "one", value: { owner: "a", posture: "lie" } },
  { id: "two", value: { posture: "sit" } },
]);
ledger.submit([
  { id: "one", value: { owner: "wrong" } },
  { id: "two", value: { owner: "b", posture: "stand" } },
  { id: "unknown", value: { owner: "x" } },
]);
assert.deepEqual(ledger.accepted(), [
  { id: "one", value: { owner: "a", posture: "lie" } },
  { id: "two", value: { owner: "b", posture: "sit" } },
]);
const duplicates = new MotionRepairLedger<any>(["one"], () => []);
duplicates.submit([
  { id: "one", value: { a: 1 } },
  { id: "one", value: { a: 2 } },
]);
assert.equal(duplicates.accepted().length, 0);
const rows = mergeMotionChapterDraft(
  {
    beats: [
      { narration: "word ".repeat(12), visual: "scene", place: "bedroom" },
      { narration: "word ".repeat(35), visual: "scene", place: "bedroom" },
    ],
  },
  "chapter",
);
const pending = motionChapterPending(rows, 100);
assert.ok(pending.length && pending.length < rows.length);
const patch = mergeMotionChapterDraft(
  {
    beats: [
      { id: pending[0].id, narration: "word ".repeat(pending[0].targetUnits!), place: "wrong" },
      { id: "unknown", narration: "wrong" },
    ],
  },
  "chapter",
  { inputKey: "key", rows, pending },
);
assert.equal(patch[0].place, "bedroom");
assert.deepEqual(patch[1], rows[1]);
assert.deepEqual(motionChapterPending(patch, 100), []);
const shortExpansion = motionChapterPending(rows, 100, 0.15, true);
assert.equal(shortExpansion.length, 2);
assert.ok(shortExpansion.every((item) => item.targetUnits! < 100));
assert.ok(Math.abs(shortExpansion.reduce((sum, item) => sum + item.targetUnits!, 0) - 100) <= 1);
assert.deepEqual(motionChapterPending([{ id: "speech", narration: "Bà mở cửa.", utterances: [{ text: "Bà đóng cửa." }] }]), [{ id: "speech", fields: ["utterances"] }]);
assert.equal(motionLocationFamily("Phòng ngủ"), "bedroom");
assert.equal(motionLocationFamily("Phòng ăn"), "dining");
assert.equal(motionLocationFamily("Mở cửa đỏ"), undefined);
assert.equal(motionLocationFamily("Chiếc áo"), undefined);
assert.equal(motionLocationFamily("Chiếc áo đen"), undefined);
assert.equal(motionLocationFamily("Bóng đèn"), undefined);
assert.equal(motionLocationFamily("Ngôi đền"), "temple");
assert.equal(motionLocationFamily("Village Classroom"), "school");
assert.equal(motionLocationFamily("Vigil Room"), "funeral");
assert.equal(motionLocationFamily("Carpenter Workshop"), "workshop");
assert.equal(motionLocationFamily("Mái ngói nhà cổ"), "roof");
assert.equal(motionCharacterTraits({ name: "Lan", role: "cô gái trưởng thành" }).age, "adult");
const place: any = { key: "bedroom", name: "Phòng ngủ", desc: "Phòng có giường", interior: true };
assert.equal(puppetPackSetLocationFits(place, { name: "Village Bedroom", group: "bedroom", desc: "Bedroom beside kitchen", tags: [], spots: [{ key: "kitchen_door" }] } as any), true);
assert.equal(puppetPackSetLocationFits(place, { name: "Village Kitchen", group: "kitchen", desc: "Kitchen near a bedroom", tags: [], spots: [] } as any), false);
const text = "Nam đứng cạnh giường của bà.";
const unit: any = {
  scene: "bedroom",
  purpose: "establish",
  show: "Standing grandson beside lying grandmother",
  read: {
    focus: "nam",
    who: ["nam", "grandma"],
    place: "bedroom",
    action: "talk",
    emotion: "neutral",
    overlays: [],
    states: [
      { char: "nam", posture: "idle", action: "stand" },
      { char: "grandma", posture: "lie", action: "lie", support: "bed" },
    ],
    visual: { scene: "bedroom", timeline: "present", evidence: [text], fixtures: [] },
  },
};
const line: any = { key: "one", text, beatId: "beat", chapterId: "chapter", cast: ["nam", "grandma"], place: "bedroom", visualUnit: unit };
let calls = 0;
const result = await readPuppetLines(
  [line],
  [line],
  { title: "Test", logline: "Test", cast: [{ key: "nam" }, { key: "grandma" }], places: [], chapters: [] } as any,
  { bedroom: place },
  {},
  {
    exec: {},
    log() {},
    ai: async () => {
      calls++;
      throw new Error("A complete combined plan must not request another read");
    },
  },
);
assert.equal(calls, 0);
assert.equal(result.reads.one.states!.find((state) => state.char === "grandma")!.posture, "lie");
const longNarration = "Bà đặt chiếc bát xuống bàn rồi nhìn ra cửa. ".repeat(22).trim();
const chapter: any = { id: "chapter", title: "Chương", summary: "Bà chờ người cháu trở về.", targetSeconds: 120 };
const chapterAnalysis: any = { title: "Truyện thử", logline: chapter.summary, cast: [], places: [{ key: "room", name: "Gian nhà", description: "Gian nhà trong làng" }], chapters: [chapter] };
const source: any = { kind: "brief", title: chapterAnalysis.title, text: chapter.summary, segments: [{ t: 0, text: chapter.summary }], sourceSeconds: 120 };
let savedDraft: any;
let chapterCalls = 0;
await assert.rejects(
  writeChapterBeats(source, chapterAnalysis, chapter, {
    language: "vi",
    exec: {},
    isFirst: true,
    isLast: true,
    onDraft: (draft) => {
      savedDraft = draft;
    },
    ai: async () => {
      chapterCalls++;
      if (chapterCalls > 1) throw new Error("interrupted repair");
      return {
        beats: [
          { narration: longNarration, visual: "scene", place: "room" },
          { narration: "", visual: "scene", place: "room" },
        ],
      };
    },
  }),
  /interrupted repair/,
);
assert.equal(savedDraft.rows[0].narration, longNarration);
assert.equal(savedDraft.pending.length, 1);
assert.equal(savedDraft.repairState.rejected, 1);
let resumedCalls = 0;
const recoveredChapter = await writeChapterBeats(source, chapterAnalysis, chapter, {
  language: "vi",
  exec: {},
  isFirst: true,
  isLast: true,
  draft: savedDraft,
  ai: async (prompt) => {
    resumedCalls++;
    assert.ok(prompt.includes(savedDraft.pending[0].id));
    return {
      beats: [
        { id: savedDraft.rows[0].id, narration: "Sai lời đã khóa", place: "wrong" },
        { id: savedDraft.pending[0].id, narration: "Người cháu bước vào nhà.", visual: "scene", place: "room" },
      ],
    };
  },
});
assert.equal(resumedCalls, 1);
assert.equal(recoveredChapter[0].narration, longNarration);
assert.ok(recoveredChapter[0].narration.length > 600);
assert.equal(recoveredChapter[0].place, "room");
assert.equal(recoveredChapter[1].narration, "Người cháu bước vào nhà.");
let savedRepair: MotionAiContractState | undefined;
let budgetCalls = 0;
const budgetContract = (state?: MotionAiContractState): MotionAiResponseContract => ({
  attempts: 2,
  state,
  checkpoint: (value) => {
    savedRepair = structuredClone(value);
  },
  assess: (raw) => ({ value: raw, errors: raw.ok ? [] : ["owner missing"] }),
  repair: () => "repair owner",
  failure: (errors) => new Error(errors.join(",")),
});
await assert.rejects(
  requestMotionAiContract(
    "initial",
    {},
    async () => {
      if (++budgetCalls === 2) throw new Error("service unavailable");
      return {};
    },
    budgetContract(),
  ),
  /service unavailable/,
);
assert.equal(savedRepair!.rejected, 1);
await assert.rejects(
  requestMotionAiContract(
    "initial",
    {},
    async () => {
      budgetCalls++;
      return {};
    },
    budgetContract(savedRepair),
  ),
  (error: any) => error[PRODUCTION.CONTRACT_EXHAUSTED] === true,
);
assert.equal(savedRepair!.rejected, 2);
const exhaustedCalls = budgetCalls;
await assert.rejects(
  requestMotionAiContract(
    "initial",
    {},
    async () => {
      budgetCalls++;
      return { ok: true };
    },
    budgetContract(savedRepair),
  ),
);
assert.equal(budgetCalls, exhaustedCalls);
console.log("Field repair: locked fields, explicit clearing, IDs, duplicates, targeted chapter duration, semantic places and zero extra AI for complete illustration plans passed.");
