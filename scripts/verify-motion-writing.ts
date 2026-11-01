import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { normalizeMotionSpokenText, normalizeMotionSpokenBeat } from "../src/lib/motionSpokenNumbers.js";
import { motionWritingProtectedMotifs, motionWritingChapterPrompt, motionWritingChapterCount } from "../src/lib/motionWriting.js";
import { motionEditorialTargets, runMotionScriptEditorial } from "../src/lib/motionScriptEditorial.js";
import { motionScriptFindings } from "../src/lib/motionScriptFindings.js";
import { motionGenreReviewFindings } from "../src/lib/motionGenreReview.js";
import { parseMotionChapterReply } from "../src/lib/motionChapterJson.js";
import { motionGenreStyleFindings } from "../src/lib/motionGenreStyle.js";
import { motionChapterOverlapFindings } from "../src/lib/motionStoryTimeline.js";
import { motionUnsupportedFigures } from "../src/lib/motionWritingNumbers.js";
import { motionSpeechResponseIssues } from "../src/lib/motionSpeechResponse.js";
import { requestMotionEditorResponse } from "../src/lib/motionEditorResponse.js";
import type { MotionBeat, MotionStoryAnalysis } from "../src/types/motionVideo.js";
assert.equal(normalizeMotionSpokenText("October 20, 1097. June 7. 3,000 soldiers.", "en"), "October the twentieth one thousand ninety seven. June the seventh. three thousand soldiers.");
assert.equal(normalizeMotionSpokenText("June 7th, 1097.", "en"), "June the seventh one thousand ninety seven.");
assert.equal(normalizeMotionSpokenText("Ngày 20 tháng 10 năm 1097.", "vi"), "Ngày hai mươi tháng mười năm một nghìn không trăm chín mươi bảy.");
assert.equal(normalizeMotionSpokenText("06/07 3.14 01:29 https://example.org/123 A1097", "en"), "06/07 3.14 01:29 https://example.org/123 A1097");
assert.equal(normalizeMotionSpokenText("Ptolemy XIII and Cleopatra VII, model XIII.", "en", ["Ptolemy XIII", "Cleopatra VII"]), "Ptolemy the thirteenth and Cleopatra the seventh, model XIII.");
assert.equal(normalizeMotionSpokenText("Ptolemy XIV lên ngôi.", "vi", ["Ptolemy XIV"]), "Ptolemy thứ mười bốn lên ngôi.");
assert.equal(normalizeMotionSpokenText("Ptolemy XII waits.", "en", ["Ptolemy XIII"]), "Ptolemy XII waits.");
const factualSource = "47 tháng 2. Caesar có ba nghìn người. Ptolemy có 5000 người. Quân chia thành hai lực lượng.";
assert.deepEqual(motionUnsupportedFigures("Caesar has three thousand soldiers. Ptolemy has five thousand men.", factualSource), []);
assert.deepEqual(motionUnsupportedFigures("Four thousand enemy dead cover the ridge. We buried eleven comrades. Within three days the army arrives.", factualSource), ["Four thousand", "eleven", "three"]);
assert.deepEqual(motionUnsupportedFigures("You are twenty-eight years old and count twenty paces.", factualSource), []);
assert.deepEqual(motionUnsupportedFigures("Four thousand soldiers were killed.", "Bốn nghìn binh sĩ tử trận."), []);
assert.deepEqual(motionUnsupportedFigures("Bốn nghìn lính chết.", factualSource), ["Bốn nghìn"]);
assert.deepEqual(motionUnsupportedFigures("Caesar signals three cavalry squadrons.", factualSource), ["three"]);
assert.deepEqual(motionUnsupportedFigures("Fewer than one thousand mounted cavalrymen charge.", factualSource), ["one thousand"]);
const malformed = '{"artifactType":"motion-story-chapter","requestId":"test","beats":[{"id":"b1","narration":"Do not alter this sentence.","scenePlan":{"acceptance":["Keep this picture."],"utterances":[{"speaker":"narrator","text":"Do not alter this sentence."}]},{"id":"b2","narration":"Continue."}]}';
const repaired: any = parseMotionChapterReply(malformed);
assert.equal(repaired.beats.length, 2);
assert.equal(repaired.beats[0].narration, "Do not alter this sentence.");
assert.equal(repaired.beats[0].utterances[0].text, repaired.beats[0].narration);
assert.equal(repaired.beats[0].scenePlan.utterances, undefined);
assert.equal(parseMotionChapterReply(malformed.replace('"scenePlan"', '"unknown"')), undefined);
assert.equal(parseMotionChapterReply(malformed.replace('"Continue."', '"Unterminated.')), undefined);
const spoken: any = { narration: "June 7.", utterances: [{ speaker: "narrator", role: "narration", text: "June 7." }] };
const normalized = normalizeMotionSpokenBeat(spoken, "en");
assert.deepEqual(motionSpeechResponseIssues(normalized.utterances, ["narrator"], normalized.narration), []);
assert.equal(normalizeMotionSpokenBeat(normalized, "en"), normalized);
const visualOriginal = { id: "visual", chapterId: "c1", visual: "scene", narration: "The army advances.", action: "An unsupported funeral.", scenePlan: { purpose: "Funeral", subject: "Mourners", before: "A burial", after: "Mourners leave", composition: "Wide", spatialRelations: [], requiredProps: [], continuity: [], acceptance: ["Funeral"] } } as MotionBeat;
const visualPlan = { ...visualOriginal.scenePlan!, purpose: "Advance", subject: "Army", before: "The line forms", after: "The line advances", acceptance: ["The army advances"] };
let visualRequests = 0;
const repairedVisual = await requestMotionEditorResponse("Repair source", [visualOriginal], [], false, async (prompt) => {
  visualRequests++;
  if (visualRequests === 1) return { edits: [{ id: "visual", narration: "The army advances." }] };
  assert.ok(prompt.includes("unsupported funeral"));
  return { edits: [{ id: "visual", action: "The line advances.", scenePlan: visualPlan }] };
});
assert.equal(visualRequests, 1);
assert.equal(repairedVisual.edits.length, 1);
visualRequests = 0;
const syncedVisual = await requestMotionEditorResponse(
  "Repair source",
  [visualOriginal],
  [],
  false,
  async (prompt) => {
    visualRequests++;
    if (visualRequests === 1) return { edits: [{ id: "visual", narration: "The army advances." }] };
    assert.ok(prompt.includes("unsupported funeral"));
    return { edits: [{ id: "visual", action: "The line advances.", scenePlan: visualPlan }] };
  },
  undefined,
  "",
  2,
  ["visual"],
);
assert.equal(visualRequests, 2);
assert.equal(syncedVisual.edits[0].action, "The line advances.");
assert.equal(syncedVisual.edits[0].scenePlan.subject, "Army");
const rejectedVisual = await requestMotionEditorResponse("Repair source", [visualOriginal], [], false, async () => ({ edits: [{ id: "visual", narration: "The army advances." }] }), undefined, "", 1, ["visual"]);
assert.deepEqual(rejectedVisual.edits, []);
const analysis = {
  title: "Evidence",
  logline: "Evidence",
  videoGenre: "verdict",
  cast: [],
  places: [],
  facts: [],
  look: "",
  motifs: ["scale", "not yet", "close", "this is it"],
  writingPlan: { question: "When?", criterion: "A lasting change", device: "scale", labels: ["not yet", "close", "this is it"] },
  chapters: [
    { id: "c1", title: "Candidate", summary: "", stages: ["candidate"], writing: { purpose: "Assess", startState: "Intact", endState: "Changed", events: [{ id: "event-a", point: "The army advances" }], candidate: "Advance", verdictLabel: "close", evidence: "Advance", limitation: "Still intact" } },
    { id: "c2", title: "Verdict", summary: "", stages: ["verdict"] },
  ],
} as MotionStoryAnalysis;
assert.deepEqual(motionWritingProtectedMotifs(analysis), []);
assert.deepEqual(motionWritingProtectedMotifs({ ...analysis, videoGenre: "witness" }), analysis.motifs);
assert.ok(motionWritingChapterPrompt(analysis, analysis.chapters[0]).includes("A lasting change"));
const beat = (id: string, chapterId: string, narration: string): MotionBeat => ({ id, chapterId, narration, visual: "scene" });
assert.deepEqual(motionGenreStyleFindings([beat("we", "c1", "We hold our shields in line."), beat("us", "c1", "The horn calls us forward."), beat("i", "c1", "I feel the mud beneath my sandals.")], "en", "witness"), []);
assert.equal(motionGenreStyleFindings([beat("lecture", "c1", "The army moves across the continent.")], "en", "witness").length, 1);
assert.equal(motionWritingChapterCount(300, "pov"), 2);
assert.equal(motionWritingChapterCount(300, "verdict"), 4);
assert.equal(motionWritingChapterCount(60, "chronicle"), 1);
assert.equal(motionWritingChapterCount(100000, "verdict"), 24);
const datedPlan = {
  ...analysis,
  videoGenre: "chronicle",
  motifs: [],
  cast: [{ key: "ptolemy", name: "Ptolemy XIII" }],
  places: [{ key: "nile", name: "Nile River" }],
  chapters: [
    { id: "c1", title: "Era", summary: "" },
    { id: "c2", title: "Battle", summary: "" },
  ],
} as MotionStoryAnalysis;
const datedLines = [
  beat("date1", "c1", "February forty-seven BC, the Nile River. War cries carry across the muddy delta."),
  beat("date2", "c1", "The Disputed Crown. February forty-seven BC, the fertile banks of the Nile River."),
  beat("name1", "c1", "King Ptolemy the Thirteenth positions his archers atop the ridge."),
  beat("name2", "c1", "King Ptolemy the Thirteenth orders his cavalry to wheel around the army."),
  beat("date3", "c2", "February forty-seven BC, the Nile River. The mounted column begins its assault."),
];
const anchorFindings = motionScriptFindings(datedLines, datedPlan, "en");
assert.deepEqual(anchorFindings.echo, []);
assert.deepEqual(anchorFindings.repeat, []);
const geographicAnchors = motionScriptFindings(
  [beat("geo1", "c1", "In February forty-seven BC, on the banks of the Nile, the army waits in silence."), beat("geo2", "c1", "February forty-seven BC, on the banks of the Nile, rival claimants confront one another."), beat("king1", "c2", "The cavalry surrounds Ptolemy the thirteenth's army."), beat("king2", "c2", "The rear assault shatters Ptolemy the thirteenth's army.")],
  datedPlan,
  "en",
);
assert.deepEqual(geographicAnchors.repeat, []);
const monarchPlan = {
  ...datedPlan,
  cast: [
    { key: "caesar", name: "Julius Caesar" },
    { key: "cleopatra", name: "Cleopatra VII" },
    { key: "oldKing", name: "Ptolemy XIII" },
    { key: "newKing", name: "Ptolemy XIV" },
  ],
} as MotionStoryAnalysis;
const royalDecisions = motionGenreReviewFindings([beat("backing", "c1", "Julius Caesar formally backs Cleopatra the seventh against her younger brother Ptolemy the thirteenth."), beat("coruler", "c2", "Alongside Cleopatra the seventh, Julius Caesar installs her younger brother Ptolemy the fourteenth as co-ruler.")], monarchPlan, "en");
assert.ok(!royalDecisions.findings.some((item) => item.id === "coruler"));
const realEcho = motionScriptFindings([beat("gate1", "c1", "The silver armor cracks against the heavy iron gate."), beat("gate2", "c1", "The silver armor cracks against the heavy iron gate.")], datedPlan, "en");
assert.ok(realEcho.echo.some((item) => item.id === "gate2"));
assert.ok(realEcho.repeat.some((item) => item.id === "gate2"));
const bookendPlan = {
  ...analysis,
  videoGenre: "chronicle",
  motifs: [],
  cast: [{ key: "ptolemy", name: "Ptolemy", role: "King", look: "Purple cloak" }],
  chapters: [
    { id: "c1", title: "Opening", summary: "", stages: ["opening"] },
    { id: "c2", title: "Battle", summary: "", stages: ["era"] },
    { id: "c3", title: "Aftermath", summary: "", stages: ["era"] },
  ],
} as MotionStoryAnalysis;
const bookendLines = [beat("tease", "c1", "Ptolemy flees from the ridge toward the royal river boats."), beat("episode", "c2", "Ptolemy flees from the ridge toward the royal river boats."), beat("duplicate", "c3", "Ptolemy flees from the ridge toward the royal river boats.")];
assert.ok(!motionChapterOverlapFindings(bookendLines, bookendPlan).some((finding) => finding.id === "episode"));
assert.ok(motionChapterOverlapFindings(bookendLines, bookendPlan).some((finding) => finding.id === "duplicate"));
assert.ok(!motionGenreReviewFindings(bookendLines.slice(0, 2), bookendPlan, "en").findings.some((finding) => finding.id === "episode"));
const bad = [beat("a", "c1", "Did this decide it?"), beat("b", "c1", "Not yet. The balance comes close."), beat("c", "c2", "Some historians argue the army vanished.")];
assert.ok(motionScriptFindings(bad, analysis, "en", "The army advances.").review.some((item) => item.kind === "label"));
assert.ok(motionScriptFindings(bad, analysis, "en", "The army advances.").review.some((item) => item.kind === "source"));
assert.ok(motionGenreReviewFindings([beat("one", "c1", "Did it decide the battle? The balance comes close, not yet.")], analysis, "en").findings.some((item) => item.kind === "label"));
const center = [beat("clash", "c1", "Bronze pike heads screech against your shield leather as the massive Egyptian phalanx crashes headlong into the advancing Roman frontline."), beat("commit", "c1", "Through a narrow slit between shields, you see the Egyptian army massing almost all their strength against our center ranks.")];
assert.deepEqual(motionGenreReviewFindings(center, { ...analysis, videoGenre: "pov", motifs: [] }, "en").findings, []);
const duplicated = [beat("before", "c1", "While Ptolemy pikemen braced for impact, pounding hooves behind them delivered the fatal blow."), beat("after", "c2", "While Ptolemy pikemen braced for impact, pounding hooves behind them delivered the fatal blow.")];
assert.ok(motionGenreReviewFindings(duplicated, analysis, "en").dropIds.has("after"));
const multiIssue = motionGenreReviewFindings([beat("earlier", "c1", "Some historians argue the army vanished at the river bridge."), beat("later", "c2", "Some historians argue the army vanished at the river bridge.")], analysis, "en", "The army advances.");
assert.equal(multiIssue.findings.find((item) => item.id === "later")?.kind, "source");
for (const mode of ["library", "remotion"] as const) {
  const scoped = { ...analysis, visualSettings: { mode } } as MotionStoryAnalysis;
  let calls = 0;
  const result = await runMotionScriptEditorial(bad, scoped, "en", "The army advances.", async (beats, ids, supplemental) => {
    calls++;
    assert.ok(ids.includes("b") && ids.includes("c"));
    assert.equal(supplemental, calls === 2);
    return { beats: calls === 1 ? beats : [beat("a", "c1", "Did this decide it?"), beat("b", "c1", "The balance comes close."), beat("c", "c2", "The scale settles: close.")], edit: { reviewed: ids.length, rewritten: calls === 2 ? 2 : 0, notes: [], requests: 1 } };
  });
  assert.equal(calls, 2);
  assert.equal(result.edit.extraRequests, 1);
  assert.ok(!result.edit.remaining?.some((item) => /historians|more than one verdict/.test(item.issue)));
}
const many = Array.from({ length: 17 }, (_, index) => beat("expert" + index, "c2", "Some historians argue a different theory " + index + "."));
assert.equal(motionEditorialTargets(many, analysis, "en", "The army advances.").ids.length, 17);
let cleanCalls = 0;
await runMotionScriptEditorial([beat("clean", "c1", "June 7. The army waits.")], { ...analysis, videoGenre: "chronicle", motifs: [], chapters: [{ id: "c1", title: "Day", summary: "" }] }, "en", "The army waits.", async () => {
  cleanCalls++;
  throw new Error("No AI expected");
});
assert.equal(cleanCalls, 0);
const previousStorage = process.env.VIDIFY_STORAGE_DIR;
process.env.VIDIFY_STORAGE_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "motion-writing-"));
try {
  const { editScript } = await import("../src/features/motion/server/services/motionStoryService.js");
  const original = { ...bad[1], utterances: [{ id: "n", speaker: "narrator", role: "narration" as const, text: bad[1].narration }] };
  const edited = await editScript({ title: "Evidence", text: "The army advances.", kind: "text", sourceSeconds: 30, segments: [{ t: 0, text: "The army advances." }] } as any, analysis, [bad[0], original], {
    language: "en",
    exec: {},
    scope: "writing-regression",
    focusIds: ["b"],
    ai: async () => ({ edits: [{ id: "b", narration: "The advance creates an opportunity. The balance comes close.", reason: "One verdict", utterances: [{ speaker: "narrator", role: "narration", text: "The advance creates an opportunity. The balance comes close." }], action: "The line holds position." }] }),
  });
  assert.ok(!edited.beats[1].narration.includes("Not yet"));
  assert.equal(edited.beats[1].action, "The line holds position.");
  assert.deepEqual(motionSpeechResponseIssues(edited.beats[1].utterances, ["narrator"], edited.beats[1].narration), []);
  assert.equal(edited.edit.requests, 1);
  const manualLines = [beat("m1", "c1", "The first line contains an unsupported claim."), beat("m2", "c1", "The second line contains an unsupported claim."), beat("m3", "c1", "The third line contains an unsupported claim.")];
  const manual = await editScript({ title: "Source", text: "The army advances.", kind: "text", sourceSeconds: 30, segments: [] } as any, { ...analysis, videoGenre: "chronicle", motifs: [] }, manualLines, {
    language: "en",
    exec: {},
    scope: "manual-writing-regression",
    focusIds: manualLines.map((line) => line.id),
    supplemental: true,
    reviewFindings: manualLines.map((line, index) => ({ id: line.id, issue: "Remove unsupported source claim " + index, kind: "source" })),
    ai: async (prompt) => {
      for (let index = 0; index < 3; index++) assert.ok(prompt.includes("Remove unsupported source claim " + index));
      return { edits: manualLines.map((line) => ({ id: line.id, narration: "The documented army continues its advance across the field.", reason: "Source correction" })) };
    },
  });
  assert.equal(manual.edit.rewritten, 3);
  assert.ok(manual.beats.every((line) => !line.narration.includes("unsupported")));
  let visualOnlyCalls = 0;
  const visualOnlyOptions = {
    language: "en",
    exec: {},
    scope: "visual-only-checkpoint",
    focusIds: [visualOriginal.id],
    reviewFindings: [{ id: visualOriginal.id, issue: "Remove unsupported funeral from scene fields", kind: "source" as const }],
    ai: async () => {
      visualOnlyCalls++;
      return { edits: [{ id: visualOriginal.id, narration: visualOriginal.narration, action: "The line advances.", scenePlan: visualPlan }] };
    },
  };
  const visualOnlySource = { title: "Source", text: "The army advances.", kind: "text", sourceSeconds: 30, segments: [] } as any;
  const visualOnlyAnalysis = { ...analysis, videoGenre: "chronicle" as const, motifs: [] };
  const visualOnly = await editScript(visualOnlySource, visualOnlyAnalysis, [visualOriginal], visualOnlyOptions);
  assert.equal(visualOnly.beats[0].narration, visualOriginal.narration);
  assert.equal(visualOnly.beats[0].action, "The line advances.");
  const restoredVisual = await editScript(visualOnlySource, visualOnlyAnalysis, [visualOriginal], visualOnlyOptions);
  assert.equal(visualOnlyCalls, 1);
  assert.equal(restoredVisual.beats[0].scenePlan?.subject, "Army");
} finally {
  if (previousStorage === undefined) delete process.env.VIDIFY_STORAGE_DIR;
  else process.env.VIDIFY_STORAGE_DIR = previousStorage;
}
process.stdout.write("Motion writing: spoken dates, synchronized speech and source visuals, complete QA selection, label correction, bounded repair and both drawing modes passed.\n");
