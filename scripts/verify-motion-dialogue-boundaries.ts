import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { repairMotionSpeechAttribution } from "../src/lib/motionVoiceAttribution.js";
import { hasMisassignedMotionSpeech } from "../src/lib/motionSpeech.js";
import { motionVoiceSignature } from "../src/lib/motionVoice.js";
import { motionSpeechResponseIssues } from "../src/lib/motionSpeechResponse.js";
import { MOTION_SPEECH_ATTRIBUTION as A } from "../src/constants/motionSpeech.js";
import type { MotionBeat, MotionStoryAnalysis, MotionStoryScript, MotionUtterance } from "../src/types/motionVideo.js";
const root = fs.mkdtempSync(path.join(os.tmpdir(), "motion-dialogue-boundaries-"));
const previousStorage = process.env.VIDIFY_STORAGE_DIR;
const previousApp = process.env.APP_DATA_DIR;
process.env.VIDIFY_STORAGE_DIR = root;
delete process.env.APP_DATA_DIR;
const line = (id: string, speaker: string, text: string, role: MotionUtterance["role"] = speaker === "narrator" ? "narration" : "dialogue"): MotionUtterance => ({ id, speaker, text, role, emotion: "angry", intensity: 0.9, speed: 1, pauseBefore: 0.1, pauseAfter: 0.2, emphasis: [] });
const analysis = {
  title: "Lời Oán Dưới Dòng Nước",
  cast: [
    { key: "thay_hai", name: "Thầy Hai", gender: "male", age: "senior" },
    { key: "vong_nu", name: "Ma nữ", gender: "female", age: "adult" },
    { key: "john", name: "John", gender: "male", age: "adult" },
  ],
  chapters: [{ id: "c1", title: "Dòng nước" }],
  places: [],
} as unknown as MotionStoryAnalysis;
const speakers = ["narrator", ...analysis.cast.map((member) => member.key)];
const beat = (id: string, speaker: string, text: string): MotionBeat => ({ id, chapterId: "c1", narration: text, visual: "scene", utterances: [line(id + "-1", speaker, text)] });
try {
  const actual = [beat("thay", "thay_hai", 'Thầy Hai bảo: "Vong cậu thanh niên hợp vía nên theo con về tận ngõ."'), beat("ghost", "vong_nu", 'Ả rít lên: "Sao mày mang nó đi, mày để tao lại dưới sông một mình!"')];
  for (const original of actual) {
    const snapshot = structuredClone(original);
    const repaired = repairMotionSpeechAttribution(original.utterances!, original, analysis);
    assert.deepEqual(
      repaired.map((row) => row.speaker),
      ["narrator", original.utterances![0].speaker],
    );
    assert.ok(repaired[0].text.endsWith(":"));
    assert.equal(repaired[0].emotion, "neutral");
    assert.equal(repaired[1].id, original.utterances![0].id);
    assert.equal(repaired[1].emotion, original.utterances![0].emotion);
    assert.equal(repaired[1].pauseAfter, original.utterances![0].pauseAfter);
    assert.deepEqual(motionSpeechResponseIssues(repaired, speakers, original.narration), []);
    assert.equal(hasMisassignedMotionSpeech(repaired), false);
    assert.deepEqual(repairMotionSpeechAttribution(repaired, original, analysis), repaired);
    assert.deepEqual(original, snapshot);
  }
  for (const [open, close] of [
    ['"', '"'],
    ["“", "”"],
    ["«", "»"],
    ["‘", "’"],
    ["'", "'"],
    ['\\"', '\\"'],
  ]) {
    const original = beat("quotes", "thay_hai", `Thầy Hai bảo: ${open}Về đi.${close} Thầy quay lưng.`);
    const repaired = repairMotionSpeechAttribution(original.utterances!, original, analysis);
    assert.deepEqual(
      repaired.map((row) => row.speaker),
      ["narrator", "thay_hai", "narrator"],
    );
    assert.equal(repaired[1].text, `${open}Về đi.${close}`);
    assert.equal(repaired[2].text, "Thầy quay lưng.");
    assert.deepEqual(motionSpeechResponseIssues(repaired, speakers, original.narration), []);
  }
  for (const text of ['John said: "He said \\"go\\" yesterday." John left.', "John said: 'Don't go.' John left.", "John said: “He said “go” yesterday.” John left."]) {
    const original = beat("nested", "john", text);
    const repaired = repairMotionSpeechAttribution(original.utterances!, original, analysis);
    assert.deepEqual(
      repaired.map((row) => row.speaker),
      ["narrator", "john", "narrator"],
    );
    assert.equal(repaired[2].text, "John left.");
    assert.deepEqual(motionSpeechResponseIssues(repaired, speakers, text), []);
  }
  for (const text of ['"Thầy Hai bảo: đi về." Tôi không tin.', "Tôi nói: thầy đã về.", "I said: do not go.", "Về ngay đi."]) {
    const original = beat("keep", "thay_hai", text);
    assert.equal(hasMisassignedMotionSpeech(original.utterances!), false);
    assert.deepEqual(repairMotionSpeechAttribution(original.utterances!, original, analysis), original.utterances);
  }
  const thought = { ...actual[0], utterances: [{ ...actual[0].utterances![0], role: "thought" as const }] };
  assert.deepEqual(repairMotionSpeechAttribution(thought.utterances, thought, analysis), thought.utterances);
  const reported = { ...actual[0], narration: "Ma nữ kể: “Thầy Hai bảo: đi về.”", utterances: [line("report-lead", "narrator", "Ma nữ kể:"), line("report-quote", "vong_nu", "Thầy Hai bảo: đi về.")] };
  assert.equal(hasMisassignedMotionSpeech(reported.utterances, reported.narration), false);
  assert.deepEqual(repairMotionSpeechAttribution(reported.utterances, reported, analysis), reported.utterances);
  const unquoted = beat("unquoted", "thay_hai", "Thầy Hai bảo: Đi về ngay.");
  assert.deepEqual(
    repairMotionSpeechAttribution(unquoted.utterances!, unquoted, analysis).map((row) => row.speaker),
    ["narrator", "thay_hai"],
  );
  const offscreen = { ...actual[0], utterances: [{ ...actual[0].utterances![0], role: "offscreen" as const, voiceSpeaker: "vong_nu" }] };
  const offscreenLines = repairMotionSpeechAttribution(offscreen.utterances, offscreen, analysis);
  assert.equal(offscreenLines[0].voiceSpeaker, undefined);
  assert.equal(offscreenLines[1].voiceSpeaker, "vong_nu");
  assert.equal(offscreenLines[1].role, "offscreen");
  const lead = beat("lead", "thay_hai", "Thầy Hai bảo:");
  const collision = { ...lead, narration: lead.narration + " Về đi.", utterances: [...lead.utterances!, line(lead.utterances![0].id + "-lead", "thay_hai", "Về đi.")] };
  const collisionLines = repairMotionSpeechAttribution(collision.utterances, collision, analysis);
  assert.deepEqual(
    collisionLines.map((row) => row.speaker),
    ["narrator", "thay_hai"],
  );
  assert.equal(new Set(collisionLines.map((row) => row.id)).size, collisionLines.length);
  const ambiguous = beat("ambiguous", "thay_hai", "Thầy Hai bảo: Đi về ngay. Sau đó thầy quay lưng.");
  assert.deepEqual(repairMotionSpeechAttribution(ambiguous.utterances!, ambiguous, analysis), ambiguous.utterances);
  assert.equal(hasMisassignedMotionSpeech(ambiguous.utterances!), true);
  const mismatched = beat("wrong-speaker", "vong_nu", 'Thầy Hai bảo: "Về đi."');
  assert.deepEqual(repairMotionSpeechAttribution(mismatched.utterances!, mismatched, analysis), mismatched.utterances);
  const { directMotionVoice } = await import("../src/features/motion/server/services/motionVoiceDirectionService.js");
  const { buildMotionVoiceTrack, readMotionVoiceTrack, motionVoiceTrackFilesValid } = await import("../src/features/motion/server/services/motionAudioService.js");
  const { getMotionRootDirectory, getMotionAudioDirectory } = await import("../src/features/motion/server/services/motionLibraryService.js");
  const { motionWavHeader } = await import("../src/features/motion/server/services/motionSoundMixService.js");
  const voices = [
    { id: "reference", name: "Narrator", gender: "male", age: "adult" },
    { id: "elder", name: "Thầy Hai", gender: "male", age: "senior" },
    { id: "ghost", name: "Ma nữ", gender: "female", age: "adult" },
  ];
  const script = { title: analysis.title, language: "vi", beats: actual, gen: { voiceCast: { narrator: "reference", thay_hai: "elder", vong_nu: "ghost", john: "reference" } } } as unknown as MotionStoryScript;
  const signature = motionVoiceSignature(script, analysis);
  const legacy = JSON.parse(signature);
  assert.equal(legacy.pop(), A.REVISION);
  const options = {
    exec: {},
    ai: async () => {
      throw new Error("Clear boundaries must not call AI");
    },
  };
  const plan = await directMotionVoice(script, analysis, voices, options);
  assert.ok(plan.beats.every((row) => row.utterances.length === 2 && row.utterances[0].speaker === "narrator"));
  const cacheDir = path.join(getMotionRootDirectory(), "tts-cache");
  const cacheFile = path.join(cacheDir, fs.readdirSync(cacheDir).find((file) => file.endsWith(".plan.json"))!);
  fs.writeFileSync(cacheFile, JSON.stringify({ ...plan, beats: actual.map((row) => ({ id: row.id, utterances: row.utterances })) }));
  const restored = await directMotionVoice(script, analysis, voices, options);
  assert.deepEqual(restored.beats, plan.beats);
  const manual = { ...script, voiceSettings: { utterances: { [actual[0].id]: actual[0].utterances! } } };
  const manualPlan = await directMotionVoice(manual, analysis, voices, options);
  assert.equal(manualPlan.beats[0].utterances.length, 1);
  const single = { ...script, voiceSettings: { multiVoice: false } };
  const singlePlan = await directMotionVoice(single, analysis, voices, options);
  assert.ok(singlePlan.beats.every((row) => row.utterances.every((entry) => entry.speaker === "narrator")));
  assert.notEqual(JSON.parse(motionVoiceSignature(single, analysis)).at(-1), A.REVISION);
  const unaffected = { ...script, beats: [beat("pure", "thay_hai", "Về đi.")] };
  assert.notEqual(JSON.parse(motionVoiceSignature(unaffected, analysis)).at(-1), A.REVISION);
  const fixedScript = {
    ...script,
    beats: [
      { ...ambiguous, id: "ai-target" },
      { ...actual[0], id: "already-accepted" },
    ],
  };
  let aiCalls = 0;
  const targeted = await directMotionVoice(fixedScript, analysis, voices, {
    exec: {},
    scope: "ambiguous-only",
    ai: async (prompt) => {
      aiCalls++;
      assert.ok(prompt.includes('"id":"ai-target"'));
      assert.ok(!prompt.includes('"id":"already-accepted"'));
      return { beats: [{ id: "ai-target", utterances: [line("lead-ai", "narrator", "Thầy Hai bảo:"), line("spoken-ai", "thay_hai", "Đi về ngay."), line("tail-ai", "narrator", "Sau đó thầy quay lưng.")] }] };
    },
  });
  assert.equal(aiCalls, 1);
  assert.equal(targeted.beats[0].utterances[2].speaker, "narrator");
  const pcm = Buffer.alloc(48000 * 2);
  for (let i = 2400; i < 36000; i++) pcm.writeInt16LE(Math.round(3000 * Math.sin((2 * Math.PI * 220 * i) / 48000)), i * 2);
  const wav = Buffer.concat([motionWavHeader(pcm.length, 1), pcm]);
  const synthesized: { text: string; voice: string }[] = [];
  const deps = {
    voices: async () => voices,
    synthesize: async (text: string, voice: string, file: string) => {
      synthesized.push({ text, voice });
      fs.writeFileSync(file, wav);
      return { seconds: 1 };
    },
  } as any;
  const track = await buildMotionVoiceTrack(script, analysis, { ...options, asr: false }, deps);
  assert.ok(synthesized.some((row) => row.text.includes("Thầy Hai bảo") && row.voice === "reference"));
  assert.ok(synthesized.some((row) => row.text.includes("Ả rít lên") && row.voice === "reference"));
  assert.ok(!synthesized.some((row) => /Thầy Hai bảo|Ả rít lên/u.test(row.text) && row.voice !== "reference"));
  assert.ok(track.clips!.some((row) => row.voiceId === "elder") && track.clips!.some((row) => row.voiceId === "ghost"));
  assert.equal(motionVoiceTrackFilesValid(track, script), true);
  assert.equal(motionVoiceTrackFilesValid({ ...track, plan: { ...plan, beats: actual.map((row) => ({ id: row.id, utterances: row.utterances! })) } }, script), false);
  const trackFile = path.join(getMotionAudioDirectory(), track.audioId + ".json");
  fs.writeFileSync(trackFile, JSON.stringify({ ...track, signature: JSON.stringify(legacy) }));
  assert.equal(readMotionVoiceTrack(track.audioId, script, analysis), undefined);
  fs.writeFileSync(trackFile, JSON.stringify(track));
  assert.ok(readMotionVoiceTrack(track.audioId, script, analysis));
  const count = synthesized.length;
  assert.equal((await buildMotionVoiceTrack(script, analysis, { ...options, asr: false }, deps)).audioId, track.audioId);
  assert.equal(synthesized.length, count);
  process.stdout.write("Dialogue boundaries passed: actual two failures, quote styles/nesting, narrator tails, exact text, roles/voice sources, ambiguous AI repair, old caches, single voice, manual overrides and synthesized voice routing.\n");
} finally {
  if (previousStorage === undefined) delete process.env.VIDIFY_STORAGE_DIR;
  else process.env.VIDIFY_STORAGE_DIR = previousStorage;
  if (previousApp === undefined) delete process.env.APP_DATA_DIR;
  else process.env.APP_DATA_DIR = previousApp;
  assert.equal(path.dirname(root), path.resolve(os.tmpdir()));
  assert.ok(path.basename(root).startsWith("motion-dialogue-boundaries-"));
  fs.rmSync(root, { recursive: true, force: true });
}
