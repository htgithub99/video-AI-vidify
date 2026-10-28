import { MOTION_VERIFICATION_TEXTS as VT } from "./motionVerificationTexts.js";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { buildMotionVoiceTrack } from "../src/server/services/motionAudioService.ts";
import { compileMotionStory } from "../src/features/motion/server/controllers/motionVideoController.ts";
import { closeVieneuWorker } from "../src/server/services/vieneuTtsService.ts";
import { runMotionAudioProcess } from "../src/server/services/motionSoundMixService.ts";
import { getMotionAudioDirectory, getMotionRootDirectory } from "../src/server/services/motionLibraryService.ts";
import { startMotionRender, getMotionJob } from "../src/server/services/motionRenderService.ts";
import { MotionAspect, MotionQuality, MotionEncoderPreference, MotionJobStatus } from "../src/types/motionVideo.ts";
const directory = path.resolve(VT.SCRATCH_MOTION_VOICE_FLOW);
fs.mkdirSync(directory, { recursive: true });
const location = {
  name: VT.PHONG_AN_BUOI_TOI,
  interior: true,
  time: VT.NIGHT,
  ground: { size: [8, 8], mat: { color: VT.VALUE_302A29 } },
  nodes: [
    { shape: VT.BOX, name: VT.TABLE, size: [3, 0.12, 1.2], pos: [0, 0.52, 0], mat: { color: VT.VALUE_715539 } },
    { shape: VT.CYLINDER, name: VT.PLATE, radius: 0.18, height: 0.02, pos: [0, 0.6, 0], mat: { color: VT.DDDDBF } },
    { shape: VT.BOX, size: [8, 4, 0.1], pos: [0, 2, -2], mat: { color: VT.VALUE_202632 } },
  ],
  camera: { pos: [0, 1.5, 4.5], target: [0, 0.8, 0], fov: 42 },
  stage: { center: [0, 0], size: [6, 4] },
};
const character = (color: string) => ({
  parts: [
    {
      id: VT.DRAWING,
      pos: [0, 0, 0],
      nodes: [
        { shape: VT.SPHERE, radius: 0.38, scale: [0.8, 0.8, 0.12], pos: [0, 1, 0], mat: { color: VT.E5E2D1 } },
        { shape: VT.SPHERE, radius: 0.3, scale: [1.1, 1.1, 0.15], pos: [0, 0.5, 0], mat: { color } },
        { shape: VT.SPHERE, radius: 0.08, scale: [0.7, 1, 0.2], pos: [-0.1, 1.04, 0.065], mat: { color: VT.VALUE_090909 } },
        { shape: VT.SPHERE, radius: 0.08, scale: [0.7, 1, 0.2], pos: [0.1, 1.04, 0.065], mat: { color: VT.VALUE_090909 } },
        { shape: VT.SPHERE, radius: 0.06, scale: [0.7, 1, 0.2], pos: [0, 0.85, 0.065], mat: { color: VT.VALUE_090909 } },
      ],
    },
  ],
  poses: { sit: {} },
  motions: {},
});
const utterances = [
  { id: VT.INTRO, speaker: VT.NARRATOR, text: VT.TRONG_CAN_PHONG_NHO_MOI_NGUOI_DANG_CHO_BUA_TOI, role: VT.NARRATION, emotion: VT.NEUTRAL },
  { id: VT.QUESTION, speaker: VT.WOMAN, text: VT.ONG_OI_TIENG_DONG_NGOAI_CUA_LA_GI_VAY, role: VT.DIALOGUE, emotion: VT.TENSE },
  { id: VT.REPLY, speaker: VT.MAN, text: VT.DE_TOI_DAT_CHIEC_DIA_XUONG_ROI_RA_XEM, role: VT.DIALOGUE, emotion: VT.SERIOUS },
  { id: VT.COMFORT, speaker: VT.ELDER, text: VT.CAC_CHAU_CU_BINH_TINH_CHAC_CHI_LA_TIENG_GIO_THOI, role: VT.DIALOGUE, emotion: VT.WARM, emphasis: [VT.BINH_TINH] },
].map((line) => ({ ...line, speed: 1, pauseBefore: 0.1, pauseAfter: 0.35, emphasis: line.emphasis || [] }));
const script: any = {
  title: VT.VIENEU_TU_PHAN_VAI_VA_PHOI_SFX,
  language: VT.VI,
  beats: [{ id: VT.DINNER_2, chapterId: VT.C1, narration: utterances.map((line) => line.text).join(VT.EMPTY_8), visual: VT.SCENE, place: VT.ROOM, utterances }],
  gen: {
    drawingMode: VT.VALUE_2D,
    characterMotion: false,
    style: { outlineColor: VT.VALUE_101010, outlineWidth: 0.025 },
    cast: { woman: character(VT.VALUE_946464), man: character(VT.VALUE_54657D), elder: character(VT.VALUE_7C826B) },
    locations: { room: location },
    staging: {
      dinner: {
        location: VT.ROOM,
        actors: [
          { cast: VT.WOMAN, at: [-1.1, -0.15], action: VT.SIT },
          { cast: VT.MAN, at: [0, -0.15], action: VT.SIT },
          { cast: VT.ELDER, at: [1.1, -0.15], action: VT.SIT },
        ],
        cameras: [{ shot: VT.WIDE, move: VT.STATIC, pos: [0, 1.5, 4.5], target: [0, 0.8, 0] }],
        soundEvents: [{ id: VT.PLATE, kind: VT.DISH, prop: VT.PLATE, at: 0.55, duration: 1.4, description: VT.DISH_PLACED_IN_A_WOOD_TABLE, actor: VT.MAN }],
      },
    },
    previews: {},
    failed: [],
    locationInfo: {},
  },
};
const analysis: any = {
  title: script.title,
  cast: [
    { key: VT.WOMAN, name: VT.CO_LAN, gender: VT.FEMALE },
    { key: VT.MAN, name: VT.ANH_NAM, gender: VT.MALE },
    { key: VT.ELDER, name: VT.ONG_GIA, gender: VT.MALE },
  ],
  places: [{ key: VT.ROOM, name: VT.PHONG_AN, description: VT.PHONG_AN_BUOI_TOI, interior: true }],
  chapters: [{ id: VT.C1, title: VT.BUA_TOI }],
};
try {
  process.stdout.write(VT.GENERATING_FOUR_REAL_VIENEU_VOICES);
  const track = await buildMotionVoiceTrack(script, analysis, { exec: {} as any, aspect: VT.VALUE_16_9, ai: async () => ({ roles: [] }), log: (value) => process.stdout.write(value + VT.EMPTY) });
  assert.equal(new Set(track.clips!.map((clip) => clip.voiceId)).size, 4);
  assert.equal(track.clips!.length, 4);
  let response: any;
  await compileMotionStory(
    { body: { script, analysis, voiceTrack: track, aspect: VT.VALUE_16_9, sfx: true, sfxVolume: 0.5 } } as any,
    {
      json: (value: any) => {
        response = value;
      },
      status: () => {
        throw Error(VT.COMPILE_FAILED);
      },
    } as any,
  );
  assert.ok(response.audioPreviewId && response.sfxId);
  assert.equal(response.spec.duration, +track.totalSeconds.toFixed(3));
  assert.equal(response.spec.subtitles[0].start, +track.clips![0].start.toFixed(3));
  assert.equal(response.spec.subtitles.at(-1).end, +track.clips!.at(-1)!.end.toFixed(3));
  assert.ok(response.soundSelections.some((selection: any) => selection.cue.kind === VT.DISH && selection.asset));
  const job = startMotionRender(response.spec, { quality: MotionQuality.DRAFT, aspect: MotionAspect.LANDSCAPE, fps: 12, encoder: MotionEncoderPreference.CPU, mixedAudioId: response.audioPreviewId, title: VT.VIENEU_MULTI_VOICE_PREVIEW_VERIFICATION });
  let result: any;
  for (let attempt = 0; attempt < 180; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const state = getMotionJob(job.id)!;
    if (state.status === MotionJobStatus.COMPLETED) {
      result = state.result;
      break;
    }
    if (state.status === MotionJobStatus.ERROR || state.status === MotionJobStatus.CANCELLED) throw Error(state.error || state.status);
  }
  assert.ok(result?.fileName);
  await runMotionAudioProcess([VT.I, path.join(getMotionRootDirectory(), result.fileName), VT.MAP, VT.VALUE_0_A, VT.AR, VT.VALUE_48000, VT.AC, VT.VALUE_2, VT.F, VT.F32LE, path.join(directory, VT.EXPORT_PCM)]);
  await runMotionAudioProcess([VT.I, path.join(getMotionAudioDirectory(), response.audioPreviewId), VT.AR, VT.VALUE_48000, VT.AC, VT.VALUE_2, VT.F, VT.F32LE, path.join(directory, VT.PREVIEW_PCM)]);
  const actual = fs.readFileSync(path.join(directory, VT.EXPORT_PCM)),
    expected = fs.readFileSync(path.join(directory, VT.PREVIEW_PCM));
  let error = 0,
    energy = 0;
  for (let index = 0; index < Math.min(actual.length, expected.length) / 4; index++) {
    const value = expected.readFloatLE(index * 4);
    energy += value ** 2;
    error += (actual.readFloatLE(index * 4) - value) ** 2;
  }
  assert.ok(energy > 1 && Math.sqrt(error / energy) < 0.2, VT.VIDEO_USES_THE_PREVIEW_MASTER_WITH_ACTUAL_SPEECH_AND_SFX);
  fs.writeFileSync(path.join(directory, VT.RESULT_JSON), JSON.stringify({ result, script, analysis, track, compiled: response }, null, 2));
  process.stdout.write(VT.VIENEU_FLOW_PASSED_FOUR_ACTUAL_VOICES_REAL_TIMINGS_SCENE_SFX);
} finally {
  closeVieneuWorker();
}
