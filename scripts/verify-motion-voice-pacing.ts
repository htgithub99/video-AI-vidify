import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { VP } from "./motionVoicePacingVerificationTexts.ts";
import { stringifyJson } from "../src/lib/jsonStringify.ts";
delete process.env.APP_DATA_DIR;
const directory = path.resolve(VP.ROOT + randomUUID());
process.env.VIDIFY_STORAGE_DIR = directory;
const { buildMotionVoiceTrack, readMotionVoiceTrack } = await import("../src/server/services/motionAudioService.ts");
const { compileStorySpec } = await import("../src/server/services/motionDirectorService.ts");
const { motionWavHeader } = await import("../src/server/services/motionSoundMixService.ts");
const { motionVoiceLibraryFile, updateVoiceMeta } = await import("../src/server/services/motionVoiceLibraryService.ts");
const { readVoiceSpeedSettings, recordVoiceSpeedFeedback } = await import("../src/server/services/motionVoiceSpeedService.ts");
const { MOTION_VOICE_PACING: P, MOTION_VOICE_SPEED: V, MOTION_VOICE: C } = await import("../src/constants/motionVoice.ts");
const { directedSpeechText } = await import("../src/lib/motionVoice.ts");
const voice = { id: VP.VOICE, name: VP.NAME, gender: VP.MALE };
const analysis: any = { genre: VP.GENRE, cast: [{ key: VP.MAN, name: VP.MAN, gender: VP.MALE, age: VP.ADULT }] };
const utterances = VP.TEXT.map((text, i) => ({ id: String(i), speaker: i === 4 ? VP.MAN : VP.NARRATOR, role: i === 4 ? VP.DIALOGUE : VP.NARRATION, text, emotion: i % 2 ? VP.SAD : VP.EXCITED, intensity: 1, speed: i % 2 ? 0.85 : 1.15, pauseBefore: 0, pauseAfter: 0, emphasis: [] }));
const script: any = { title: VP.TITLE, language: VP.LANG, gen: { voiceCast: { narrator: VP.VOICE, man: VP.VOICE } }, beats: utterances.map((line, i) => ({ id: String(i), chapterId: i === 5 ? VP.CHAPTER2 : VP.CHAPTER, visual: VP.SCENE, narration: line.text, utterances: [line], sceneMood: { mood: line.emotion, intensity: 1 } })) };
const calls: { text: string; delivery: any }[] = [];
const deps: any = {
  voices: async () => [voice],
  synthesize: async (text: string, _voice: string, file: string, _signal: unknown, _log: unknown, delivery: unknown) => {
    calls.push({ text, delivery });
    const samples = Buffer.alloc(48000 * 2 * 2);
    for (let frame = 0; frame < 48000 * 2; frame++) samples.writeInt16LE(Math.round(7000 * Math.sin((2 * Math.PI * 330 * frame) / 48000)), frame * 2);
    fs.writeFileSync(file, Buffer.concat([motionWavHeader(samples.length, 1), samples]));
    return { seconds: 2 };
  },
};
const opts: any = {
  exec: {},
  aspect: VP.ASPECT,
  ai: async () => {
    throw new Error(VP.AI_ERROR);
  },
};
try {
  const track = await buildMotionVoiceTrack(script, analysis, opts, deps);
  const narrationScale = C.TEMPO.NARRATION_SCALE;
  try {
    (C.TEMPO as { NARRATION_SCALE: number }).NARRATION_SCALE = 1;
    assert.equal(readMotionVoiceTrack(track.audioId, script, analysis), undefined, VP.SETTINGS_CACHE);
  } finally {
    (C.TEMPO as { NARRATION_SCALE: number }).NARRATION_SCALE = narrationScale;
  }
  assert.ok(readMotionVoiceTrack(track.audioId, script, analysis), VP.SETTINGS_CACHE);
  assert.equal(track.continuous, true);
  assert.deepEqual(calls.map((call) => call.text).sort(), utterances.map(directedSpeechText).sort(), VP.CONTINUOUS);
  const clips = track.clips!;
  const narrators = clips.filter((clip) => clip.speaker === VP.NARRATOR);
  const narrationIncrease = P.HORROR.narrationTempo / VP.PREVIOUS_NARRATION_TEMPO;
  assert.ok(narrationIncrease >= VP.NARRATION_INCREASE[0] && narrationIncrease <= VP.NARRATION_INCREASE[1], VP.NARRATION_CLEARER);
  assert.equal(P.HORROR.dialogueTempo, VP.PREVIOUS_NARRATION_TEMPO, VP.NARRATION_CLEARER);
  for (const clip of narrators) {
    assert.equal(clip.delivery?.tempo, P.HORROR.narrationTempo * C.TEMPO.NARRATION_SCALE, VP.STABLE);
    assert.equal(clip.delivery?.temperature, P.NARRATION_TEMPERATURE, VP.STABLE);
    assert.equal(clip.delivery?.gain, 1, VP.STABLE);
    assert.ok(Math.abs(clip.end - clip.start - 2 / (P.HORROR.narrationTempo * C.TEMPO.NARRATION_SCALE)) < 0.04, VP.STABLE);
  }
  const gaps = clips.slice(1).map((clip, i) => clip.start - clips[i].end);
  for (const [i, expected] of [P.HORROR.sentenceGap, P.HORROR.sentenceGap, P.HORROR.clauseGap, P.HORROR.suspenseGap, P.CHAPTER_PAUSE].entries()) assert.ok(Math.abs(gaps[i] - expected) < 0.002, VP.ONCE);
  const compiled = compileStorySpec(script, analysis, { aspect: VP.ASPECT, durations: track.durations, voiceTrack: track });
  assert.ok(Math.abs(compiled.spec.duration! - track.totalSeconds) < 0.002, VP.SYNC);
  for (const clip of clips) {
    const shot = compiled.spec.shots.find((shot) => shot.id === clip.beatId)!;
    assert.ok(clip.start >= shot.start - 0.002 && clip.end <= shot.end + 0.002, VP.SYNC);
    const subtitles = compiled.spec.subtitles!.filter((sub) => sub.start >= clip.start - 0.002 && sub.end <= clip.end + 0.002);
    assert.ok(subtitles.length, VP.SYNC);
  }
  await buildMotionVoiceTrack(script, analysis, opts, deps);
  assert.equal(calls.length, 6);
  updateVoiceMeta(VP.VOICE, { speed: 0.9 });
  assert.equal(readMotionVoiceTrack(track.audioId, script, analysis), undefined, VP.CACHE);
  const { compileMotionStory } = await import("../src/features/motion/server/controllers/motionVideoController.ts");
  let response: any;
  const res: any = {
    json: (value: any) => {
      response = value;
    },
    status: () => res,
  };
  await compileMotionStory({ body: { script, analysis, aspect: VP.ASPECT, audioId: track.audioId, voiceTrack: track, durations: track.durations } } as any, res);
  assert.equal(response.success, true);
  assert.equal(response.voiceStale, true, VP.COMPILE_CACHE);
  assert.equal(response.audioPreviewId, undefined, VP.COMPILE_CACHE);
  const { getMotionAudioDirectory } = await import("../src/server/services/motionLibraryService.ts");
  fs.copyFileSync(path.join(getMotionAudioDirectory(), clips[0].audioId), path.join(getMotionAudioDirectory(), VP.UPLOADED));
  await compileMotionStory({ body: { script: { ...script, voiceTrack: track }, analysis, aspect: VP.ASPECT, audioId: VP.UPLOADED, uploadedAudioSeconds: 30 } } as any, res);
  assert.equal(response.success, true);
  assert.equal(response.voiceStale, false, VP.UPLOAD);
  assert.ok(response.audioPreviewId, VP.UPLOAD);
  const slower = await buildMotionVoiceTrack(script, analysis, opts, deps);
  assert.notEqual(slower.audioId, track.audioId, VP.CACHE);
  assert.ok(slower.clips![0].end - slower.clips![0].start > clips[0].end - clips[0].start, VP.CACHE);
  assert.equal(calls.length, 6);
  updateVoiceMeta(VP.VOICE, { speed: V.AUTO });
  const settingsFile = motionVoiceLibraryFile(V.FILE);
  fs.writeFileSync(settingsFile, stringifyJson({ target: { rate: 3.5 }, correction: 1, rates: {} }));
  const calibrated = await buildMotionVoiceTrack(script, analysis, opts, deps);
  const saved = fs.readFileSync(settingsFile, VP.UTF8);
  const factor = readVoiceSpeedSettings().rates[VP.VOICE];
  assert.ok(factor > 0, VP.FREEZE);
  const lengths = calibrated.clips!.filter((clip) => clip.speaker === VP.NARRATOR).map((clip) => clip.end - clip.start);
  assert.ok(Math.max(...lengths) - Math.min(...lengths) < 0.002, VP.FREEZE);
  await buildMotionVoiceTrack(script, analysis, opts, deps);
  recordVoiceSpeedFeedback(100, 100, true);
  recordVoiceSpeedFeedback(100, 100, true);
  assert.equal(fs.readFileSync(settingsFile, VP.UTF8), saved, VP.FEEDBACK);
  fs.writeFileSync(settingsFile, stringifyJson({ target: { rate: 3.1 }, correction: 1, rates: { [VP.VOICE]: factor } }));
  assert.equal(readMotionVoiceTrack(calibrated.audioId, script, analysis), undefined, VP.CACHE);
  fs.writeFileSync(settingsFile, stringifyJson({ target: { rate: 3.5 }, correction: 1, rates: {} }));
  await buildMotionVoiceTrack(script, analysis, opts, deps);
  assert.ok(readVoiceSpeedSettings().rates[VP.VOICE] > 0, VP.FREEZE);
  fs.writeFileSync(settingsFile, stringifyJson({ target: { rate: 3.5 }, correction: 1, rates: {} }));
  const shortScript = { ...script, beats: [{ ...script.beats[0], narration: VP.SHORT, utterances: [{ ...utterances[0], text: VP.SHORT }] }] };
  await buildMotionVoiceTrack(shortScript, analysis, opts, deps);
  assert.deepEqual(readVoiceSpeedSettings().rates, {}, VP.FREEZE);
  fs.writeFileSync(settingsFile, stringifyJson({ target: { rate: 3.5, pauses: VP.MEASURED_PAUSES }, correction: 1, rates: { [VP.VOICE]: factor } }));
  const measured = await buildMotionVoiceTrack(script, analysis, opts, deps);
  for (const clip of measured.clips!.filter((clip) => clip.speaker === VP.NARRATOR)) assert.equal(clip.delivery?.tempo, 1, VP.MEASURED_PACE);
  const measuredSettings = fs.readFileSync(settingsFile, VP.UTF8);
  fs.writeFileSync(settingsFile, stringifyJson({ target: { rate: 3.5, pauses: { ...VP.MEASURED_PAUSES, sentence: 0.6 } }, correction: 1, rates: { [VP.VOICE]: factor } }));
  assert.equal(readMotionVoiceTrack(measured.audioId, script, analysis), undefined, VP.SETTINGS_CACHE);
  fs.writeFileSync(settingsFile, measuredSettings);
  const fastScript = { ...script, beats: [{ ...script.beats[4], narration: VP.FAST, utterances: [{ ...utterances[4], text: VP.FAST, emotion: VP.EXCITED, speed: 1.15 }] }] };
  const fast = await buildMotionVoiceTrack(fastScript, analysis, opts, deps);
  const fastClip = fast.clips![0];
  assert.equal(fastClip.delivery?.tempo, 1, VP.DIALOGUE_STABLE);
  assert.ok(VP.FAST.split(P.WORD_RE).length / (fastClip.end - fastClip.start) <= P.DIALOGUE_RATE.vi, VP.DIALOGUE_LIMIT);
  const slowScript = { ...fastScript, beats: [{ ...fastScript.beats[0], utterances: [{ ...fastScript.beats[0].utterances[0], emotion: VP.SAD, speed: 0.85 }] }] };
  const calm = await buildMotionVoiceTrack(slowScript, analysis, opts, deps);
  assert.equal(calm.clips![0].delivery?.tempo, fastClip.delivery?.tempo, VP.DIALOGUE_STABLE);
  fs.writeFileSync(settingsFile, stringifyJson({ target: { rate: 3.5, rateBasis: V.BASIS.TEXT, pauses: VP.MEASURED_PAUSES }, correction: 1, rates: { [VP.VOICE]: factor } }));
  for (const role of [VP.NARRATION, VP.DIALOGUE]) {
    const limited = await buildMotionVoiceTrack({ ...fastScript, beats: [{ ...fastScript.beats[0], utterances: [{ ...fastScript.beats[0].utterances[0], role }] }] }, analysis, opts, deps);
    const clip = limited.clips![0];
    assert.ok(VP.FAST.split(P.WORD_RE).length / (clip.end - clip.start) <= 3.5 * P.REFERENCE_RATE_MARGIN, VP.DIALOGUE_LIMIT);
  }
  process.stdout.write(VP.PASSED);
} finally {
  fs.rmSync(directory, { recursive: true, force: true });
}
