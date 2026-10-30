import { MOTION_VERIFICATION_TEXTS as VT } from "./motionVerificationTexts.js";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { compileMotionStory, serveMotionSfx } from "../src/features/motion/server/controllers/motionVideoController.ts";
import { getMotionAudioDirectory, getMotionRootDirectory } from "../src/features/motion/server/services/motionLibraryService.ts";
import { runMotionAudioProcess } from "../src/features/motion/server/services/motionSoundMixService.ts";
import { startMotionRender, getMotionJob } from "../src/features/motion/server/services/motionRenderService.ts";
import { MotionAspect, MotionEncoderPreference, MotionQuality, MotionJobStatus } from "../src/types/motionVideo.ts";
const voiceId = VT.VERIFY_MOTION_SOUND_FLOW_VOICE_WAV,
  audioDirectory = getMotionAudioDirectory();
await runMotionAudioProcess([VT.F, VT.LAVFI, VT.I, VT.SINE_FREQUENCY_220_SAMPLE_RATE_48000_DURATION_6, VT.C_A, VT.PCM_S16LE, path.join(audioDirectory, voiceId)]);
const location = { name: VT.DINING_ROOM, time: VT.INTERIOR, interior: true, nodes: [{ shape: VT.BOX, name: VT.TABLE, size: [2, 0.15, 1], pos: [0, 0.7, 0], mat: { color: VT.VALUE_775544 } }], ground: { size: [8, 8], mat: { color: VT.VALUE_333344 } }, stage: { center: [0, 0], size: [6, 6] }, camera: { pos: [0, 2, 4], target: [0, 0.8, 0], fov: 40 } };
const script: any = {
  title: VT.SCENE_SOUND_INTEGRATION,
  language: VT.EN,
  beats: [
    { id: VT.BEFORE, chapterId: VT.C1, visual: VT.SCENE, place: VT.ROOM, narration: VT.THE_TABLE_IS_EMPTY },
    { id: VT.AFTER, chapterId: VT.C1, visual: VT.SCENE, place: VT.ROOM, narration: VT.A_PLATE_IS_PLACED_ON_THE_TABLE },
  ],
  gen: {
    drawingMode: VT.VALUE_2D,
    characterMotion: false,
    cast: {},
    style: {},
    locations: { room: location },
    staging: {
      before: { location: VT.ROOM, actors: [], props: [], cameras: [{ shot: VT.WIDE, move: VT.STATIC, pos: [0, 2, 4], target: [0, 0.8, 0] }] },
      after: {
        location: VT.ROOM,
        actors: [],
        props: [{ shape: VT.CYLINDER, name: VT.PLATE, radius: 0.25, height: 0.03, pos: [0, 0.8, 0], mat: { color: VT.EEEECC } }],
        soundEvents: [{ id: VT.PLATE, kind: VT.DISH, prop: VT.PLATE, anchor: VT.CUT, camera: 1, description: VT.DISH_PLACED_IN_A_WOOD_TABLE, duration: 1.4 }],
        cameras: [
          { shot: VT.WIDE, move: VT.STATIC, pos: [0, 2, 4], target: [0, 0.8, 0], at: 0 },
          { shot: VT.INSERT, move: VT.STATIC, focusProp: VT.PLATE, pos: [0, 1.4, 0.8], target: [0, 0.8, 0], at: 0.5 },
        ],
      },
    },
  },
};
let response: any;
await compileMotionStory(
  { body: { script, durations: [2, 2], aspect: VT.VALUE_16_9, audioId: voiceId, sfx: true, sfxVolume: 0.7 } } as any,
  {
    json: (value: any) => {
      response = value;
    },
    status: () => {
      throw new Error(VT.COMPILATION_REJECTED);
    },
  } as any,
);
assert.ok(response.success && response.audioPreviewId && response.sfxId);
assert.deepEqual(response.missing, []);
assert.equal(response.sfxCues.filter((cue: any) => cue.kind === VT.DISH).length, 1);
const selection = response.soundSelections.find((item: any) => item.cue.kind === VT.DISH);
assert.ok(selection.asset?.id);
let served = VT.EMPTY_2,
  status = 0;
await serveMotionSfx(
  { params: { assetId: selection.asset.id } } as any,
  {
    setHeader: () => {},
    sendFile: (file: string) => {
      served = file;
    },
    status: (code: number) => {
      status = code;
      return { end: () => {} };
    },
  } as any,
);
assert.ok(served && fs.existsSync(served));
await serveMotionSfx(
  { params: { assetId: VT.INVALID_2 } } as any,
  {
    status: (code: number) => {
      status = code;
      return { end: () => {} };
    },
  } as any,
);
assert.equal(status, 404);
await serveMotionSfx(
  { params: { assetId: selection.asset.id }, query: { start: String(selection.previewStart), duration: VT.VALUE_0_5 } } as any,
  {
    setHeader: () => {},
    sendFile: (file: string) => {
      served = file;
    },
    status: (code: number) => {
      status = code;
      return { end: () => {} };
    },
  } as any,
);
assert.ok(served.endsWith(VT.WAV));
assert.ok(Math.abs((fs.statSync(served).size - 44) / 192000 - 0.5) < 0.002);
const masterId = response.audioPreviewId;
let off: any;
await compileMotionStory(
  { body: { script, durations: [2, 2], audioId: voiceId, sfx: false } } as any,
  {
    json: (value: any) => {
      off = value;
    },
    status: () => {
      throw new Error(VT.MUTED_COMPILATION_REJECTED);
    },
  } as any,
);
assert.ok(off.audioPreviewId && !off.sfxId);
assert.notEqual(off.audioPreviewId, masterId);
const motionScript = JSON.parse(JSON.stringify(script));
motionScript.gen.characterMotion = true;
motionScript.gen.cast.hero = { parts: [{ id: VT.BODY, nodes: [{ shape: VT.SPHERE, radius: 0.3 }] }], motions: {} };
motionScript.gen.staging.before.actors = [{ cast: VT.HERO, action: VT.WALK, at: [0, 0], moveTo: [1, 0] }];
let staticPreview: any;
await compileMotionStory(
  { body: { script: motionScript, durations: [2, 2], characterMotion: false } } as any,
  {
    json: (value: any) => {
      staticPreview = value;
    },
    status: () => {
      throw new Error(VT.STATIC_PREVIEW_REJECTED);
    },
  } as any,
);
assert.equal(staticPreview.spec.gen.characterMotion, false);
assert.equal(staticPreview.sfxCues.filter((cue: any) => cue.kind === VT.FOOTSTEP).length, 0, VT.PREVIEW_MUST_HONOR_THE_CURRENT_MOTION_TOGGLE_EVEN_BEFORE_SCE);
const job = startMotionRender(response.spec, { quality: MotionQuality.DRAFT, aspect: MotionAspect.LANDSCAPE, fps: 12, encoder: MotionEncoderPreference.CPU, audioId: voiceId, mixedAudioId: masterId, sfxId: response.sfxId, title: VT.MOTION_SCENE_SFX_VERIFICATION });
let stage = VT.EMPTY_2,
  final: any;
for (let index = 0; index < 120; index++) {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  const state = getMotionJob(job.id)!;
  if (state.stage !== stage) {
    stage = state.stage || VT.EMPTY_2;
    process.stdout.write(stage + VT.EMPTY);
  }
  if (state.status === MotionJobStatus.COMPLETED) {
    final = state;
    break;
  }
  if ([MotionJobStatus.ERROR, MotionJobStatus.CANCELLED].includes(state.status)) throw new Error(state.error || state.status);
}
assert.ok(final?.result);
const directory = path.resolve(VT.SCRATCH_MOTION_SOUND_FLOW);
fs.mkdirSync(directory, { recursive: true });
const videoPcm = path.join(directory, VT.EXPORT_PCM),
  previewPcm = path.join(directory, VT.PREVIEW_PCM);
await runMotionAudioProcess([VT.I, path.join(getMotionRootDirectory(), final.result.fileName), VT.MAP, VT.VALUE_0_A, VT.AR, VT.VALUE_48000, VT.AC, VT.VALUE_2, VT.F, VT.F32LE, videoPcm]);
await runMotionAudioProcess([VT.I, path.join(audioDirectory, masterId), VT.AR, VT.VALUE_48000, VT.AC, VT.VALUE_2, VT.F, VT.F32LE, previewPcm]);
const a = fs.readFileSync(videoPcm),
  b = fs.readFileSync(previewPcm),
  count = Math.min(a.length, b.length) / 4;
let error = 0,
  energy = 0;
for (let index = 0; index < count; index++) {
  const value = a.readFloatLE(index * 4),
    expected = b.readFloatLE(index * 4);
  error += (value - expected) ** 2;
  energy += expected ** 2;
}
assert.ok(Math.sqrt(error / Math.max(1e-9, energy)) < 0.2, VT.EXPORT_MUST_USE_THE_SAME_STEREO_MASTER_AS_PREVIEW_ALLOWING_A);
fs.writeFileSync(path.join(directory, VT.RESULT_JSON), JSON.stringify({ ...final.result, masterId, sfxId: response.sfxId, soundSelections: response.soundSelections }, null, 2));
process.stdout.write(VT.MOTION_SOUND_FLOW_PASSED_REAL_COMPILE_API_SOURCE_PREVIEW_ROU);
