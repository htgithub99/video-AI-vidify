import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { VOICE_QUALITY_QA as T } from "./motionVoiceQualityVerificationTexts.js";
import { MOTION_VOICE as C, MOTION_VOICE_QUALITY as Q } from "../src/constants/motionVoice.js";
import { motionWavHeader } from "../src/server/services/motionSoundMixService.js";
import { motionVoiceSignal, trimMotionVoiceEdges, motionVoiceBoundaryPadding, compareMotionVoiceText } from "../src/server/services/motionVoiceQualityService.js";
import { motionVoiceReferenceWindow } from "../src/server/services/motionVoiceReferenceService.js";
delete process.env.APP_DATA_DIR;
process.env.VIDIFY_STORAGE_DIR = path.resolve(T.ROOT + randomUUID());
const { buildMotionVoiceTrack, motionVoiceSemanticGap, motionVoicePacing } = await import("../src/server/services/motionAudioService.js");
const { readVoiceSpeedSettings, withMotionVoiceSpeedSnapshot, voiceTempoFactor, knownVoiceTempoFactor, voiceSpeedKey } = await import("../src/server/services/motionVoiceSpeedService.js");
const { motionVoiceLibraryFile } = await import("../src/server/services/motionVoiceLibraryService.js");
const { MOTION_VOICE_SPEED: SPEED } = await import("../src/constants/motionVoice.js");
const wave = (silence = false): Buffer => {
  const pcm = Buffer.alloc(C.SAMPLE_RATE * 2 * 2);
  if (!silence) for (let i = C.SAMPLE_RATE / 2; i < C.SAMPLE_RATE * 1.5; i++) pcm.writeInt16LE(Math.round((i < C.SAMPLE_RATE * 0.6 || i > C.SAMPLE_RATE * 1.4 ? 160 : 5000) * Math.sin((2 * Math.PI * 2500 * i) / C.SAMPLE_RATE)), i * 2);
  return Buffer.concat([motionWavHeader(pcm.length, 1), pcm]);
};
const source = wave();
const sampleWords = [
  { w: "Tôi", s: 2, e: 2.2 },
  { w: "về.", s: 2.3, e: 3 },
  { w: "Mẹ", s: 3.7, e: 4 },
  { w: "chờ.", s: 6.5, e: 7 },
  { w: "Tối", s: 7.8, e: 8.1 },
  { w: "ấy.", s: 11, e: 12 },
];
assert.deepEqual(motionVoiceReferenceWindow(sampleWords, 15), { start: 1.92, seconds: 7.16 - 1.92 });
assert.ok(
  motionVoiceReferenceWindow(
    [
      { w: "Tôi", s: 12, e: 13 },
      { w: "đến.", s: 15, e: 16 },
    ],
    20,
  ).start > 8,
);
assert.ok(
  motionVoiceReferenceWindow(
    sampleWords.map((word) => ({ ...word, w: word.w.replaceAll(".", "") })),
    15,
  ).seconds <= 8,
);
assert.equal(motionVoiceReferenceWindow([], 20).seconds, 8);
const trimmed = trimMotionVoiceEdges(source);
assert.ok(motionVoiceSignal(trimmed).duration < 2);
assert.ok(motionVoiceSignal(trimmed).active >= motionVoiceSignal(source).active - Q.FRAME_SECONDS);
assert.throws(() => motionVoiceSignal(wave(true)));
assert.ok(Math.abs(motionVoiceBoundaryPadding(0.56, 0.18, 0.12) - 0.26) < 1e-9);
assert.equal(motionVoiceBoundaryPadding(0.2, 0.18, 0.12), 0);
const longText = [T.TEXT, T.TEXT].join(" ");
const clippedWords = longText.split(" ").slice(2).join(" ");
assert.equal(compareMotionVoiceText(longText, clippedWords).errorRun, 2);
assert.ok(compareMotionVoiceText(longText, clippedWords).error <= C.ASR.MAX_ERROR);
const line: any = { id: T.VOICE, speaker: C.NARRATOR, role: T.ROLE, text: T.TEXT, emotion: "neutral", speed: 1, pauseBefore: 0, pauseAfter: 0, emphasis: [] };
const pacing = motionVoicePacing({ genre: "truyện ma" } as any)!;
assert.ok(motionVoiceSemanticGap({ ...line, text: "Bà khẽ bảo:" }, line, pacing) < motionVoiceSemanticGap(line, line, pacing));
assert.ok(motionVoiceSemanticGap({ ...line, text: "Ngoài cửa có ai…" }, line, pacing) > motionVoiceSemanticGap(line, line, pacing));
const script: any = { title: T.TITLE, language: T.LANG, gen: { voiceCast: { narrator: T.VOICE } }, beats: [{ id: T.VOICE, chapterId: T.VOICE, narration: line.text, utterances: [line], visual: "scene" }] };
const options: any = {
  exec: {},
  asr: true,
  ai: async () => {
    throw new Error(T.TITLE);
  },
};
let synthesized = 0,
  recognized = 0;
const deps: any = {
  voices: async () => [{ id: T.VOICE, name: T.VOICE, gender: "male" }],
  synthesize: async (_text: string, _id: string, file: string) => {
    synthesized++;
    fs.writeFileSync(file, source);
    return { seconds: 2 };
  },
  transcribe: async () => {
    recognized++;
    return { text: recognized === 1 ? line.text.split(" ").slice(0, 4).join(" ") : T.BAD, words: [{ w: T.BAD, s: 0, e: 1 }] };
  },
};
try {
  const track = await buildMotionVoiceTrack(script, null, options, deps);
  assert.equal(synthesized, C.ASR.RETRIES + 1);
  assert.equal(track.clips![0].quality?.status, Q.STATUS.REVIEW);
  assert.equal(track.clips![0].quality?.heard, line.text.split(" ").slice(0, 4).join(" "));
  assert.equal(track.clips![0].words, undefined);
  await buildMotionVoiceTrack(script, null, options, deps);
  assert.equal(recognized, C.ASR.RETRIES + 1);
  let attempts = 0;
  const recovered = await buildMotionVoiceTrack(
    { ...script, gen: { voiceCast: { narrator: T.EMPTY } } },
    null,
    { ...options, asr: false },
    {
      ...deps,
      voices: async () => [{ id: T.EMPTY, name: T.EMPTY }],
      synthesize: async (_text: string, _id: string, file: string) => {
        fs.writeFileSync(file, wave(++attempts === 1));
        return { seconds: 2 };
      },
    },
  );
  assert.equal(attempts, 2);
  assert.ok(recovered.totalSeconds > 0);
  const settingsFile = motionVoiceLibraryFile(SPEED.FILE);
  fs.writeFileSync(settingsFile, JSON.stringify({ target: { rate: 3.7 }, correction: 1, rates: {} }));
  await withMotionVoiceSpeedSnapshot(async () => {
    fs.writeFileSync(settingsFile, JSON.stringify({ target: { rate: 2.8 }, correction: 1, rates: {} }));
    await Promise.resolve();
    assert.equal(readVoiceSpeedSettings().target?.rate, 3.7);
    voiceTempoFactor(T.VOICE, T.TEXT, 3);
    assert.equal(readVoiceSpeedSettings().target?.rate, 3.7);
    assert.equal(JSON.parse(fs.readFileSync(settingsFile, "utf8")).target.rate, 2.8);
  });
  assert.equal(readVoiceSpeedSettings().target?.rate, 2.8);
  fs.writeFileSync(settingsFile, JSON.stringify({ target: { rate: 3, rateBasis: SPEED.BASIS.TEXT }, correction: 1, rates: { [T.VOICE]: 3 } }));
  assert.equal(knownVoiceTempoFactor(T.VOICE), 1);
  const textKey = voiceSpeedKey(T.VOICE);
  fs.writeFileSync(settingsFile, JSON.stringify({ target: { rate: 3, source: SPEED.SOURCE_AUDIO }, correction: 1, rates: { [T.VOICE]: 3 } }));
  assert.notEqual(voiceSpeedKey(T.VOICE), textKey);
  assert.equal(knownVoiceTempoFactor(T.VOICE), null);
  assert.equal(voiceTempoFactor(T.VOICE, T.TEXT, 4), 1);
  assert.equal(readVoiceSpeedSettings().acousticRates?.[T.VOICE], undefined);
  assert.equal(voiceTempoFactor(T.VOICE, T.TEXT, 4, 3), 1);
  assert.equal(readVoiceSpeedSettings().acousticRates?.[T.VOICE], 3);
  assert.equal(readVoiceSpeedSettings().rates[T.VOICE], 3);
  process.stdout.write(T.PASSED);
} finally {
  const root = path.resolve(process.env.VIDIFY_STORAGE_DIR);
  assert.ok(root.startsWith(path.resolve(T.ROOT)));
  fs.rmSync(root, { recursive: true, force: true });
}
