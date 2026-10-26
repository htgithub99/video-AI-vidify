import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { PLANNING_DNA as DNA, PLANNING_PROFILE as PROFILE } from "./motionPlanningVerificationFixtures.js";
import { compactMotionSourceLedger, parseMotionSourceLedgerPart } from "../src/lib/motionSourceLedger.js";
import { MOTION_PROMPT as P } from "../src/constants/motionPrompt.js";
import { videoDnaErrors, videoDnaProfileErrors } from "../src/lib/motionVideoDna.js";
import { MotionStoryLength } from "../src/types/motionVideo.js";
const folder = fs.mkdtempSync(path.join(os.tmpdir(), "motion-source-planning-"));
delete process.env.APP_DATA_DIR;
process.env.VIDIFY_STORAGE_DIR = folder;
const { analyzeStory, parseStorySource, buildSourceLedger } = await import("../src/server/services/motionStoryService.js");
const { motionInputKey } = await import("../src/server/services/motionFileUtils.js");
const source = parseStorySource("Bến sông. Nam tìm thấy bát cơm và trở về nhà.");
const raw = { title: "Bến sông", logline: "Nam tìm thấy bát cơm.", cast: [], places: [{ key: "river", name: "Bến sông", description: "River landing", interior: false }], chapters: [{ id: "c1", title: "Bến sông", summary: "Nam tìm thấy bát cơm và trở về nhà." }], videoDna: DNA };
assert.deepEqual(videoDnaErrors(DNA), []);
assert.deepEqual(videoDnaProfileErrors({ ...DNA, ...PROFILE }), []);
let coreCalls = 0, profileCalls = 0, draft: any;
const options = { language: "vi", length: MotionStoryLength.ONE, exec: {}, onDraft: (value: any) => { draft = value; } };
const result = await analyzeStory(source, { ...options, ai: async (prompt, artifact) => {
  if (artifact === P.DNA_PROFILE_ARTIFACT) {
    profileCalls++;
    assert.ok(!prompt.includes("SEGMENTS:"));
    return { title: "Wrong title", chapters: [], videoDna: { ...PROFILE, intent: "Wrong intent", environment: {} } };
  }
  coreCalls++;
  assert.ok(prompt.includes(P.DNA_CORE));
  return raw;
} });
assert.equal(coreCalls, 1);
assert.equal(profileCalls, 1);
assert.equal(result.title, raw.title);
assert.equal(result.videoDna?.intent, DNA.intent);
assert.equal(result.videoDna?.environment.propRules, DNA.environment.propRules);
assert.equal(result.videoDna?.audienceProfile?.country, "Vietnam");
await analyzeStory(source, { ...options, draft, ai: async () => { throw new Error("accepted DNA reran"); } });
let invalidProfiles = 0;
const pending = await analyzeStory(source, { ...options, ai: async (_prompt, artifact) => {
  if (artifact === P.DNA_PROFILE_ARTIFACT) { invalidProfiles++; return {}; }
  return raw;
} });
assert.equal(invalidProfiles, 2);
assert.equal(pending.videoDna?.intent, DNA.intent);
assert.equal(pending.videoDna?.audienceProfile, undefined);
const segments = [{ id: "s1", t: 0, text: "Nam nhận bát cơm. Nam đem nó ra bến sông." }, { id: "s2", t: 8, text: "Dấu tay trên bát là của bà. Nam trở về nhà." }];
const events = [{ id: "e1", sourceId: "s1", kind: "setup", point: "Nam nhận bát cơm.", quote: "Nam nhận bát cơm.", causes: [] }, { id: "e2", sourceId: "s2", kind: "payoff", point: "Dấu tay là của bà.", quote: "Dấu tay trên bát là của bà.", causes: ["e1"] }];
const node = parseMotionSourceLedgerPart({ reviewedSegments: ["s1", "s2"], events }, segments, "part1")!;
assert.ok(node);
assert.equal(node.facts![1].causes[0], "part1:e1");
assert.equal(parseMotionSourceLedgerPart({ reviewedSegments: ["s1"], events }, segments, "part1"), undefined);
assert.equal(parseMotionSourceLedgerPart({ reviewedSegments: ["s1", "s2"], events: [{ ...events[0], quote: "Invented clue" }] }, segments, "part1"), undefined);
assert.equal(parseMotionSourceLedgerPart({ reviewedSegments: ["s1", "s2"], events: [{ ...events[0], causes: ["future"] }] }, segments, "part1"), undefined);
const compact = await compactMotionSourceLedger([{ ...node, text: "Redundant explanation. ".repeat(800) }], { draft: {}, key: motionInputKey, checkpoint() {}, request: async () => ({ coveredParts: ["part1"], summary: "Short summary without the ending." }) });
assert.ok(compact.includes("Nam trở về nhà."));
assert.ok(compact.includes("Dấu tay trên bát là của bà."));
assert.ok(compact.includes("part1:e1"));
const longSource = { ...source, text: "Nam đứng bên bến sông. ".repeat(900) + "Cuối cùng Nam trở về nhà.", segments: [] };
let ledgerCalls = 0, ledgerDraft: any = { inputKey: "ledger", rejected: 0 };
const ledger = await buildSourceLedger(longSource, { exec: {}, draft: ledgerDraft, onDraft: (value) => { ledgerDraft = value; }, ai: async (prompt) => {
  ledgerCalls++;
  const chunks = JSON.parse(prompt.split("SEGMENTS: ")[1]);
  return { reviewedSegments: chunks.map((chunk: any) => chunk.id), events: chunks.map((chunk: any, index: number) => ({ id: "e" + index, sourceId: chunk.id, kind: "event", point: "Nam ở bến sông.", quote: chunk.text.slice(0, 20), causes: [] })) };
} });
assert.ok(ledger.includes("Cuối cùng Nam trở về nhà."));
assert.ok(ledgerCalls > 1);
await buildSourceLedger(longSource, { exec: {}, draft: ledgerDraft, ai: async () => { throw new Error("accepted source ledger reran"); } });
console.log(JSON.stringify({ passed: true, coreAndProfileSeparated: true, acceptedCoreLocked: true, optionalProfileBounded: true, sourceEvidenceAndCausalLinks: true, protectedFactsAndEnding: true, resume: true, videoCreated: false }));
