import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { MOTION_VOICE_CLARITY_VERIFICATION as V } from "./motionVoiceClarityVerificationTexts.ts";
import { MOTION_VOICE as C, MOTION_VOICE_FX as FX } from "../src/constants/motionVoice.ts";
import { motionVoiceFilter, motionVoiceSignature } from "../src/lib/motionVoice.ts";
import { motionWavHeader, runMotionAudioProcess } from "../src/server/services/motionSoundMixService.ts";
import { motionWavData } from "../src/server/services/motionAudioUtils.ts";
const directory = fs.mkdtempSync(path.join(os.tmpdir(), V.PREFIX));
const rate = C.SAMPLE_RATE;
const line = { id: V.SPEECH, role: V.ROLE, emotion: V.MOOD, speaker: C.NARRATOR, text: V.SPEECH, intensity: 0, speed: 1, pauseBefore: 0, pauseAfter: 0, emphasis: [] };
const filter = motionVoiceFilter(line, { mood: V.MOOD, strength: 0 }, 1);
const pcm = Buffer.alloc(rate * V.SECONDS * 2);
for (let i = 0; i < pcm.length / 2; i++) {
  const t = i / rate,
    phase = t % 1;
  const vowel = phase >= 0.15 && phase < 0.6;
  const consonant = phase >= 0.64 && phase < 0.9;
  const envelope = Math.min(1, Math.max(0, (phase - (vowel ? 0.15 : 0.64)) / 0.015));
  const frequencies = vowel ? V.VOWEL : consonant ? V.CONSONANTS : [];
  const sample = frequencies.reduce((sum, frequency) => sum + Math.sin(2 * Math.PI * frequency * t), 0) * (vowel ? 3500 : 300) * envelope;
  pcm.writeInt16LE(Math.round(sample), i * 2);
}
const spectralPower = (samples: number[], frequency: number): number => {
  let real = 0,
    imaginary = 0;
  for (let i = 0; i < samples.length; i++) {
    const angle = (2 * Math.PI * frequency * i) / rate;
    real += samples[i] * Math.cos(angle);
    imaginary += samples[i] * Math.sin(angle);
  }
  return (real * real + imaginary * imaginary) / (samples.length * samples.length);
};
try {
  const source = path.join(directory, V.SOURCE);
  fs.writeFileSync(source, Buffer.concat([motionWavHeader(pcm.length, 1), pcm]));
  const ratios: number[] = [];
  for (const [name, processing] of [
    [V.LEGACY, filter.replace(FX.CLEAN.FILTER, V.LEGACY_FILTER)],
    [V.RECENT, filter.replace(FX.CLEAN.FILTER, V.RECENT_FILTER)],
    [V.CURRENT, filter],
  ]) {
    const destination = path.join(directory, name);
    await runMotionAudioProcess([V.ARGS.INPUT, source, V.ARGS.FILTER, processing, V.ARGS.RATE, String(rate), V.ARGS.CHANNELS, V.ARGS.ONE, destination]);
    const wav = fs.readFileSync(destination),
      { start, length } = motionWavData(wav);
    const samples = Array.from({ length: length / 2 }, (_, i) => wav.readInt16LE(start + i * 2) / 32768);
    assert.ok(
      samples.every((value) => Number.isFinite(value) && Math.abs(value) <= V.PEAK_LIMIT),
      V.PEAK,
    );
    ratios.push(V.CONSONANTS.reduce((sum, frequency) => sum + spectralPower(samples, frequency), 0) / V.VOWEL.reduce((sum, frequency) => sum + spectralPower(samples, frequency), 0));
  }
  const gain = 10 * Math.log10(ratios[2] / ratios[0]);
  assert.ok(ratios[2] >= ratios[1], V.CLARITY);
  assert.ok(gain >= V.MIN_GAIN_DB, V.CLARITY);
  const signature = motionVoiceSignature(null);
  const version = C.TRACK_VERSION;
  try {
    (C as { TRACK_VERSION: number }).TRACK_VERSION++;
    assert.notEqual(motionVoiceSignature(null), signature, V.CACHE);
  } finally {
    (C as { TRACK_VERSION: number }).TRACK_VERSION = version;
  }
  process.stdout.write(V.PASSED(gain));
} finally {
  fs.rmSync(directory, { recursive: true, force: true });
}
