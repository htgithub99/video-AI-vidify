import { RUNTIME_VERIFICATION_TEXTS as RT, RUNTIME_VERIFICATION_FORMATS as RF } from "./runtimeVerificationTexts.ts";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { buildMotionVoiceTrack, readMotionVoiceTrack } from "../src/server/services/motionAudioService.ts";
import { motionWavHeader, runMotionAudioProcess } from "../src/server/services/motionSoundMixService.ts";
import { getMotionAudioDirectory } from "../src/server/services/motionLibraryService.ts";
import { motionWavData } from "../src/server/services/motionAudioUtils.ts";
import { motionLoudnormFilter } from "../src/constants/motionLoudness.ts";
delete process.env.APP_DATA_DIR;
const directory = path.resolve(RT.SCRATCH_MOTION_VOICE_CONTINUITY, randomUUID());
process.env.VIDIFY_STORAGE_DIR = directory;
const voice = { id: RT.CONTINUITY_VOICE, name: RT.HAI_DANG, gender: RT.MALE };
const line = (id: string, text: string, speed = 1) => ({ id, speaker: RT.NARRATOR, role: RT.NARRATION, text, emotion: RT.NEUTRAL, speed, pauseBefore: 0, pauseAfter: 0, emphasis: [] });
const lines = [line(RT.SHORT, RT.MOI_NGUOI_TRO_VE), line(RT.LONG, RT.LOI_KE_VAN_GIU_NHIP_DOC_TU_NHIEN_DU_CAU_NAY_CO_NHIEU_TU_HON_CAU_TRUOC), line(RT.FASTER, RT.TOC_DO_THEO_LUA_CHON, 1.05)];
const script: any = { title: RT.VOICE_CONTINUITY, language: RT.VI, beats: lines.map((utterance, index) => ({ id: RT.B + index, chapterId: RT.C1, visual: RT.SCENE, narration: utterance.text, utterances: [utterance] })) };
let syntheses = 0;
const deps: any = {
  voices: async () => [voice],
  synthesize: async (_text: string, _voice: string, file: string) => {
    syntheses++;
    const samples = Buffer.alloc(48000 * 2 * 2);
    for (let frame = 0; frame < 48000 * 2; frame++) samples.writeInt16LE(Math.round(7000 * Math.sin((2 * Math.PI * 330 * frame) / 48000)), frame * 2);
    fs.writeFileSync(file, Buffer.concat([motionWavHeader(samples.length, 1), samples]));
    return { seconds: 2 };
  },
};
const options: any = {
  exec: {},
  ai: async () => {
    throw new Error(RT.NO_AI_REQUIRED_FOR_EXISTING_NARRATION);
  },
};
try {
  const track = await buildMotionVoiceTrack(script, null, options, deps);
  assert.equal(syntheses, 3);
  assert.equal(track.clips?.length, 3);
  const lengths = track.clips!.map((clip) => clip.end - clip.start);
  assert.ok(Math.abs(lengths[0] - 2) < 0.03, RT.SHORT_SENTENCES_MUST_NOT_BE_FORCED_UP_TO_1_6X_SPEED);
  assert.ok(Math.abs(lengths[1] - 2) < 0.03, RT.WORD_COUNT_MUST_NOT_CHANGE_THE_ENGINE_S_RECORDED_PACE);
  assert.ok(Math.abs(lengths[2] - 2 / 1.05) < 0.04, RT.PRESERVE_EXPLICIT_DELIVERY_SPEED);
  const folder = getMotionAudioDirectory();
  const encoded = path.join(directory, RT.VOICE_EXPORT_M4A),
    decoded = path.join(directory, RT.VOICE_EXPORT_WAV);
  await runMotionAudioProcess([RT.I, path.join(folder, track.audioId), RT.AF, motionLoudnormFilter(), RT.C_A, RT.AAC, RT.B_A, RT.VALUE_192K, RT.AR, RT.VALUE_48000, encoded]);
  await runMotionAudioProcess([RT.I, encoded, RT.AC, RT.VALUE_1, RT.AR, RT.VALUE_48000, RT.C_A, RT.PCM_S16LE, decoded]);
  const wav = fs.readFileSync(decoded),
    { start, length } = motionWavData(wav);
  assert.ok(length / 2 / 48000 >= track.clips!.at(-1)!.end, RT.AAC_EXPORT_MUST_PRESERVE_THE_FINAL_SPOKEN_CLIP);
  for (const clip of track.clips!) {
    for (let t = clip.start + 0.05; t < clip.end - 0.05; t += 0.04) {
      let energy = 0;
      for (let sample = Math.round(t * 48000); sample < Math.round(t * 48000) + 480; sample++) energy += (wav.readInt16LE(start + sample * 2) / 32768) ** 2;
      assert.ok(Math.sqrt(energy / 480) > 0.01, RF.SPEECH_AUDIBLE_MESSAGE(t.toFixed(2)));
    }
  }
  await buildMotionVoiceTrack(script, null, options, deps);
  assert.equal(syntheses, 3, RT.A_VALID_NEW_TRACK_IS_CACHED);
  assert.equal(readMotionVoiceTrack(track.audioId, script)?.audioId, track.audioId);
  const metadata = path.join(folder, track.audioId + RT.JSON);
  const old = JSON.parse(fs.readFileSync(metadata, RT.UTF8));
  const signature = JSON.parse(old.signature);
  signature[0] = 3;
  fs.writeFileSync(metadata, JSON.stringify({ ...old, signature: JSON.stringify(signature) }));
  assert.equal(readMotionVoiceTrack(track.audioId, script), undefined, RT.TRACKS_CREATED_WITH_THE_OLD_FORCED_TEMPO_PIPELINE_MUST_NOT_BE_REUSED);
  process.stdout.write(RT.VOICE_CONTINUITY_PASSED_NATURAL_PACE_EXPLICIT_SPEED_AUDIBLE_SAMPLES_AF);
} finally {
  fs.rmSync(directory, { recursive: true, force: true });
}
