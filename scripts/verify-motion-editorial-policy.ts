import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { MOTION_EDITORIAL_POLICY as E } from "../src/constants/motionEditorialPolicy.js";
import { MOTION_LOG_SECTIONS as LOG } from "../src/features/motion/constants/motionLogSections.js";
import { MOTION_PRODUCTION as P } from "../src/constants/motionProduction.js";
import { MOTION_RESPONSE_SCHEMAS } from "../src/constants/motionResponseContract.js";
import { normalizeVideoDna, videoDnaErrors } from "../src/lib/motionVideoDna.js";
import { normalizeMotionChapterMetadata } from "../src/lib/motionEditorialMetadata.js";
import { motionChapterResponseIssues } from "../src/lib/motionChapterRepair.js";
import { motionChapterParts } from "../src/lib/motionChapterParts.js";
import { motionLogSections } from "../src/features/motion/lib/motionLogSections.js";
import { mergeMotionLogHistory } from "../src/features/motion/lib/motionLogHistory.js";
import { MotionStoryLength, MotionJobStatus as S, MotionStoryJobKind as K } from "../src/types/motionVideo.js";
const directory = fs.mkdtempSync(path.join(os.tmpdir(), "motion-editorial-policy-"));
const previousStorage = process.env.VIDIFY_STORAGE_DIR;
process.env.VIDIFY_STORAGE_DIR = directory;
try {
  const { analyzeStory, parseStorySource, writeChapterBeats } = await import("../src/server/services/motionStoryService.js");
  const dna: any = {
    intent: "Explain the event",
    audience: "Vietnamese adults",
    narrative: { voice: "Natural spoken Vietnamese", structure: "Cause and consequence", pacing: "Measured" },
    visualDna: { style: "Flat illustration", composition: "Clear foreground and background", camera: "Static", lighting: "Readable", palette: "Muted", materials: "Matte", subjectHierarchy: "People and essential clues" },
    creativeProfile: { role: "Narrator", writingPrinciples: ["Use familiar words"], productionPrinciples: ["Keep essential evidence readable"] },
    mustPreserve: ["Original source event"],
    mustVary: ["New identities"],
    mustNotCopy: ["Distinctive source phrases"],
    uncertainties: [],
    evidence: [{ claim: "Event", sourceClue: "Source passage", confidence: 90 }],
    characters: { design: "Consistent outlines", proportions: "Adult proportions", poseLanguage: "Simple poses", continuity: ["Stable clothing"] },
    environment: { space: "Source village", scale: "Human scale", propRules: "Stable object identities", continuity: ["Keep source location"] },
    editDna: { narratorVoice: "Accepted narrator", pace: 123 },
    narrativeDna: { vocabulary: "Accepted vocabulary", themes: ["Old theme"], callbacks: ["Old character"] },
  };
  const snapshot = JSON.stringify(dna);
  assert.deepEqual(videoDnaErrors(dna), []);
  assert.ok(videoDnaErrors({ ...dna, evidence: [] }).length);
  assert.ok(videoDnaErrors({ ...dna, narrative: {} }).length);
  assert.ok(videoDnaErrors({ ...dna, evidence: [{ claim: "Claim", sourceClue: "Text", confidence: 101 }] }).length);
  const source = parseStorySource("Một người đứng cạnh cửa và kể lại sự việc trong làng.");
  for (const mode of ["library", "remotion"] as const) {
    let analysisCalls = 0;
    const analysis = await analyzeStory(source, {
      language: "vi",
      length: MotionStoryLength.TWO,
      exec: {},
      visualSettings: { mode, profileId: "horror" } as any,
      ai: async () => {
        analysisCalls++;
        return {
          title: "Sự việc trong làng",
          logline: "Một người kể lại sự việc",
          cast: [{ key: "actor", name: "Người kể", role: "witness", look: "Áo nâu" }],
          places: [{ key: "room", name: "Gian nhà", description: "Một gian nhà", interior: true, time: "night" }],
          chapters: [{ id: "chapter", title: "Sự việc", summary: "Một người kể lại sự việc", keyPoints: ["Đến nhà", "Kể chuyện", "Nhận ra dấu vết", "Kết thúc"] }],
          videoDna: dna,
        };
      },
    });
    assert.equal(analysisCalls, 1, mode + ": optional profile must not add AI requests");
    assert.equal(analysis.videoDna!.editDna!.narratorVoice, "Accepted narrator");
    assert.equal(analysis.videoDna!.narrativeDna!.vocabulary, "Accepted vocabulary");
    assert.equal(analysis.videoDna!.editDna!.pace, dna.narrative.pacing);
    const narration = "Người kể đứng cạnh cửa và nhìn ra sân. ".repeat(12).trim();
    const raw = { id: "beat", narration, visual: "scene", place: analysis.places[0].key, cast: [analysis.cast[0].key], shot: "straight-on", utterances: [{ speaker: "narrator", text: narration, speed: 1.25, pauseAfter: 0.9, emotion: "unsupported" }] };
    let chapterCalls = 0;
    const beats = await writeChapterBeats(source, analysis, analysis.chapters[0], {
      language: "vi",
      exec: {},
      isFirst: true,
      isLast: true,
      ai: async () => {
        chapterCalls++;
        return { beats: [raw] };
      },
    });
    assert.equal(chapterCalls, 1, mode + ": optional metadata must not trigger repair");
    assert.equal(beats[0].utterances![0].speed, 1.15);
    assert.equal(beats[0].utterances![0].pauseAfter, 0.6);
    assert.deepEqual(motionChapterResponseIssues([raw], [analysis.cast[0].key], [analysis.places[0].key], mode === "library"), []);
    for (const invalid of [
      { ...raw, place: "unknown" },
      { ...raw, place: null },
      { ...raw, cast: ["unknown"] },
      { ...raw, cast: [null] },
      { ...raw, utterances: [{ speaker: "unknown", text: narration }] },
      { ...raw, utterances: [{ speaker: "narrator", text: "Missing speech" }] },
    ])
      assert.ok(motionChapterResponseIssues([invalid], [analysis.cast[0].key], [analysis.places[0].key], mode === "library").length);
    const chapter = { ...analysis.chapters[0], targetSeconds: 120 };
    assert.equal(motionChapterParts(chapter, analysis, "Short source", 410).length, 0);
    assert.ok(motionChapterParts({ ...chapter, targetSeconds: 600 }, analysis, "Short source. Second source line. Third source line.", 2000).length > 1);
  }
  assert.equal(JSON.stringify(dna), snapshot);
  assert.deepEqual(Object.keys(MOTION_RESPONSE_SCHEMAS["motion-story-new-dna"].properties!.videoDna.properties!), E.RETUNE_FIELDS);
  const voiceOnly = normalizeMotionChapterMetadata([{ narration: "Lời kể", visual: "scene", utterances: [{ speaker: "narrator", text: "Lời kể", speed: "1.2", pauseAfter: "0.9" }] }]);
  assert.equal(voiceOnly[0].utterances[0].speed, 1.15);
  const startedAt = new Date("2026-10-29T13:00:00").getTime();
  const latest: any = { id: "history", kind: "production", lines: [], stepStates: { [P.STAGES.SEO]: { id: "child", status: S.COMPLETED, startedAt, updatedAt: startedAt + 2000 } } };
  const merged = mergeMotionLogHistory([latest], latest.id, latest.kind, [], startedAt, { stepStates: { [P.STAGES.SEO]: { ...latest.stepStates[P.STAGES.SEO], status: S.RENDERING, updatedAt: startedAt + 1000 } } });
  assert.equal(merged[0].stepStates![P.STAGES.SEO].status, S.COMPLETED, "Delayed poll must not overwrite newer SEO state");
  const stages = [P.STAGES.ANALYZE, P.STAGES.SCRIPT, P.STAGES.SEO, P.STAGES.SCENES, P.STAGES.VOICE, P.STAGES.RENDER];
  for (const [index, key] of LOG.CORE.entries()) {
    const step = { id: key + "-child", status: S.RENDERING, startedAt: startedAt + 1000, updatedAt: startedAt + 3000 };
    const job: any = { id: "run", kind: K.PRODUCTION, status: S.RENDERING, startedAt, stage: "Other background task", log: [], result: {}, stepStates: { [stages[index]]: step } };
    const entry: any = { ...job, lines: [`13:00:01 · [${stages[index]}] Hoàn tất`, `13:00:02 · [${stages[index]}] Đang phục hồi phòng chat`] };
    const state = (current = job, history = [entry]) => motionLogSections(history, "vi", current).find((section) => section.key === key)!.state;
    assert.equal(state(), "active", key + ": explicit running state overrides old completion text");
    const restored = JSON.parse(JSON.stringify({ job, entry }));
    assert.equal(state(restored.job, [restored.entry]), "active", key + ": reload retains live state");
    for (const [status, expected] of [
      [S.COMPLETED, "done"],
      [S.ERROR, "error"],
      [S.CANCELLED, "cancelled"],
      [S.PREPARING, "active"],
    ])
      assert.equal(state({ ...job, stepStates: { [stages[index]]: { ...step, status } } }), expected, key + ": " + status);
    assert.equal(state({ ...job, status: S.CANCELLED }), "cancelled");
    assert.equal(state({ ...job, status: S.CANCELLED }, [{ ...entry, stepStates: { [stages[index]]: { ...step, updatedAt: startedAt + 9000 } } }]), "cancelled", key + ": a late child poll cannot reactivate a stopped parent");
    const manual: any = { id: key + "-manual", kind: key, status: S.RENDERING, startedAt: startedAt + 60000, log: [] };
    assert.equal(state(manual, [...[entry], { ...manual, lines: [`13:01:00 · Đang phục hồi phòng chat`] }]), "active", key + ": new standalone run must supersede old logs");
  }
  console.log("Editorial policy passed: both modes use one analysis and one compact chapter request; soft metadata normalizes locally, source/style locks survive retuning, essential QA remains, and all six log sections retain accurate live/retry/terminal states after reload.");
} finally {
  if (previousStorage === undefined) delete process.env.VIDIFY_STORAGE_DIR;
  else process.env.VIDIFY_STORAGE_DIR = previousStorage;
  fs.rmSync(directory, { recursive: true, force: true });
}
