import { MOTION_VERIFICATION_TEXTS as VT } from "./motionVerificationTexts.js";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { MOTION_SOUND_CONFIG as C } from "../src/constants/motionSound.ts";
import { normalizeSoundCues } from "../src/lib/motionSound.ts";
import { compileMotionSoundPlan } from "../src/lib/motionSoundPlan.ts";
import { ensureMotionSfxLibrary, resolveMotionSfxAsset, soundCandidates } from "../src/features/motion/server/services/motionSfxLibraryService.ts";
import { buildMotionSoundTrack, mixMotionSoundAudio, motionSoundAudition, runMotionAudioProcess } from "../src/features/motion/server/services/motionSoundMixService.ts";
import { getMotionAudioDirectory } from "../src/features/motion/server/services/motionLibraryService.ts";
import { STORAGE_CONFIG } from "../src/constants/storage.ts";
import { directExistingMotionSound } from "../src/server/services/motionGenService.ts";
const assets = await ensureMotionSfxLibrary();
assert.ok(assets.length > 700);
assert.ok(assets.reduce((sum, asset) => sum + asset.sources.length, 0) > assets.length);
const glass = assets.find((asset) => /Car window breaking/i.test(asset.name));
assert.ok(glass && glass.kinds.includes(VT.GLASS_BREAK) && !glass.kinds.includes(VT.BREATH));
assert.equal(await resolveMotionSfxAsset(VT.DANH_MUC_JSON), undefined);
assert.ok(soundCandidates({ kind: VT.FOOTSTEP, layer: VT.ACTION, description: VT.WOODEN_FLOOR }, assets).every((asset) => !/forest|woods|gravel|leaves/i.test(asset.name)));
assert.ok(soundCandidates({ kind: VT.FOOTSTEP, layer: VT.ACTION, description: VT.WOOD }, assets).every((asset) => !/forest|woods|gravel|leaves/i.test(asset.name)));
const location = { interior: false, time: VT.NIGHT, nodes: [{ shape: VT.BOX, name: VT.DOOR }], ground: { mat: { pattern: VT.WOOD } } };
const staging = { soundBeatId: VT.B1, location: VT.ROOM, beatDur: 4, tOffset: 0, actors: [{ cast: VT.HERO, action: VT.WALK, at: [0, 0], moveTo: [2, 0], moveStart: 0, moveEnd: 1 }], soundEvents: [{ id: VT.OPEN, kind: VT.DOOR, prop: VT.DOOR, at: 0.1, anchor: VT.CUT, camera: 2 }], cameras: [{ pos: [0, 1, 5], target: [0, 1, 0] }] };
const spec: any = {
  duration: 8,
  gen: {
    characterMotion: true,
    locations: { room: location },
    cast: {
      hero: {
        parts: [{ id: VT.TOE, nodes: [] }],
        motions: {
          walk: {
            duration: 2,
            loop: true,
            events: [
              { id: VT.LEFT, kind: VT.FOOTSTEP, t: 0.2, part: VT.TOE },
              { id: VT.RIGHT, kind: VT.FOOTSTEP, t: 1.2, part: VT.TOE },
            ],
            tracks: [],
          },
        },
      },
    },
  },
  shots: [
    { id: VT.B1, template: VT.GEN3D, start: 0, end: 2, params: staging },
    { id: VT.B1_C2, template: VT.GEN3D, start: 2, end: 4, params: { ...staging, tOffset: 2 } },
    { id: VT.B2, template: VT.GEN3D, start: 4, end: 8, params: { ...staging, soundBeatId: VT.B2, actors: [], soundEvents: [] } },
  ],
};
const plan = compileMotionSoundPlan(spec);
assert.deepEqual(
  plan.filter((cue) => cue.kind === VT.FOOTSTEP).map((cue) => cue.t),
  [0.2, 1.2, 2.2, 3.2],
);
assert.equal(plan.filter((cue) => cue.kind === VT.DOOR).length, 1);
assert.equal(plan.find((cue) => cue.kind === VT.DOOR)?.t, 2);
assert.equal(plan.filter((cue) => cue.layer === VT.AMBIENCE).length, 1);
assert.equal(plan.find((cue) => cue.layer === VT.AMBIENCE)?.duration, 8);
const explicitBeds = JSON.parse(JSON.stringify(spec));
explicitBeds.shots.forEach((shot: any) => {
  shot.params.soundEvents = [{ id: VT.NIGHT, kind: VT.NIGHT, layer: VT.AMBIENCE, description: VT.NIGHT_INSECTS, at: 0, duration: 4 }];
  shot.params.actors = [];
});
assert.equal(compileMotionSoundPlan(explicitBeds).filter((cue) => cue.layer === VT.AMBIENCE).length, 1);
assert.equal(compileMotionSoundPlan(explicitBeds)[0].duration, 8);
const silent = JSON.parse(JSON.stringify(spec));
silent.shots.forEach((shot: any) => {
  shot.params.soundSilence = true;
});
assert.deepEqual(compileMotionSoundPlan(silent), []);
const cachedGen: any = { ...spec.gen, staging: { b1: JSON.parse(JSON.stringify(staging)) }, previews: {}, style: {} },
  cachedScript: any = {
    beats: [
      { id: VT.B1, visual: VT.SCENE, place: VT.ROOM },
      { id: VT.TITLE, visual: VT.TITLE, data: { title: VT.REVEAL } },
    ],
  };
const originalGeometry = JSON.stringify([cachedGen.locations, cachedGen.cast]),
  originalCameras = JSON.stringify(cachedGen.staging.b1.cameras);
let directionCalls = 0;
await directExistingMotionSound(cachedScript, cachedGen, {
  exec: {},
  log: () => {},
  ai: async () => {
    directionCalls++;
    return {
      beats: [
        { id: VT.B1, soundEvents: [{ id: VT.DOOR, kind: VT.DOOR, at: 0.5 }] },
        { id: VT.TITLE, soundEvents: [{ id: VT.REVEAL_2, kind: VT.WHOOSH, at: 0.1 }] },
      ],
    };
  },
});
assert.equal(directionCalls, 1);
assert.equal(JSON.stringify([cachedGen.locations, cachedGen.cast]), originalGeometry);
assert.equal(JSON.stringify(cachedGen.staging.b1.cameras), originalCameras);
assert.equal(cachedScript.beats[1].data.soundEvents[0].kind, VT.WHOOSH);
await directExistingMotionSound(cachedScript, cachedGen, {
  exec: {},
  log: () => {},
  ai: async () => {
    throw new Error(VT.MUST_NOT_REPLAN_CACHED_CUES);
  },
});
assert.equal(cachedGen.soundPlanVersion, C.VERSION);
const failedGen: any = { ...cachedGen, staging: { b1: { location: VT.ROOM } } };
await directExistingMotionSound({ beats: [{ id: VT.B1, visual: VT.SCENE }] } as any, failedGen, {
  exec: {},
  log: () => {},
  ai: async () => {
    throw new Error(VT.OPTIONAL_PLANNING_UNAVAILABLE);
  },
});
assert.equal(failedGen.staging.b1.soundDirected, true);
spec.gen.characterMotion = false;
assert.equal(compileMotionSoundPlan(spec).filter((cue) => cue.kind === VT.FOOTSTEP).length, 0);
assert.equal(compileMotionSoundPlan(spec).filter((cue) => cue.kind === VT.DOOR).length, 1);
const dish = assets.find((asset) => /Dish placed in a wood table/i.test(asset.name));
assert.ok(dish);
const cues = normalizeSoundCues([{ id: VT.DISH, kind: VT.DISH, layer: VT.ACTION, t: 0.8, duration: 1.4, description: VT.DISH_PLACED_IN_A_WOOD_TABLE, assetId: dish.id, pan: -0.8 }], 4);
const sound = await buildMotionSoundTrack(4, cues);
assert.ok(sound.sfxId);
assert.equal(sound.selections[0].asset?.id, dish.id);
const audioFolder = getMotionAudioDirectory(),
  wave = fs.readFileSync(path.join(audioFolder, sound.sfxId!));
assert.equal(wave.readUInt16LE(22), 2);
assert.equal(wave.readUInt32LE(24), 48000);
assert.ok(Math.abs((wave.length - 44) / 192000 - 4) < 0.002);
let before = 0,
  left = 0,
  right = 0;
for (let frame = 0; frame < (wave.length - 44) / 4; frame++) {
  const l = wave.readInt16LE(44 + frame * 4),
    r = wave.readInt16LE(46 + frame * 4);
  if (frame < 0.79 * 48000) before += Math.abs(l) + Math.abs(r);
  else {
    left += l * l;
    right += r * r;
  }
}
assert.equal(before, 0);
assert.ok(left > right * 2 && left > 0, VT.SFX_MUST_START_AT_ITS_CUE_AND_PRESERVE_STEREO_DIRECTION);
const cached = await buildMotionSoundTrack(4, cues);
assert.equal(cached.sfxId, sound.sfxId);
const audition = await motionSoundAudition(dish.id, sound.selections[0].previewStart!, 0.5);
assert.ok(audition);
assert.ok(Math.abs((fs.statSync(path.join(audioFolder, audition!)).size - 44) / 192000 - 0.5) < 0.002);
assert.equal((await buildMotionSoundTrack(4, cues, { dish: { muted: true } })).sfxId, undefined);
assert.equal((await buildMotionSoundTrack(4, [{ t: 1, kind: VT.NO_SUCH_SOUND }])).sfxId, undefined);
const voiceId = VT.VERIFY_MOTION_SOUND_VOICE_WAV;
await runMotionAudioProcess([VT.F, VT.LAVFI, VT.I, VT.SINE_FREQUENCY_220_SAMPLE_RATE_48000_DURATION_4, VT.C_A, VT.PCM_S16LE, path.join(audioFolder, voiceId)]);
const master = await mixMotionSoundAudio(4, voiceId, sound.sfxId, 0.7);
assert.ok(master);
assert.equal(await mixMotionSoundAudio(4, voiceId, sound.sfxId, 0.7), master);
assert.notEqual(await mixMotionSoundAudio(4, voiceId, sound.sfxId, 0), master);
assert.equal(fs.readFileSync(path.join(audioFolder, master!)).readUInt16LE(22), 2);
const originalStorage = process.env[STORAGE_CONFIG.ENV_DIR],
  originalSource = process.env[C.SOURCE_ENV],
  originalAppData = process.env.APP_DATA_DIR;
const fixture = path.resolve(VT.SCRATCH_MOTION_SOUND_FAULT_FIXTURE),
  source = path.join(fixture, VT.SOURCE);
fs.mkdirSync(source, { recursive: true });
const goodFile = await resolveMotionSfxAsset(dish.id);
assert.ok(goodFile);
fs.copyFileSync(goodFile!, path.join(source, VT.DISH_PLACED_GOOD_MP3));
fs.writeFileSync(path.join(source, VT.DISH_PLACED_BAD_MP3), VT.INVALID_AUDIO_FIXTURE);
fs.writeFileSync(
  path.join(source, C.MANIFEST),
  JSON.stringify([
    { file: VT.DISH_PLACED_GOOD_MP3, giay: 1.54 },
    { file: VT.DISH_PLACED_BAD_MP3, giay: 1.54 },
  ]),
);
try {
  delete process.env.APP_DATA_DIR;
  process.env[STORAGE_CONFIG.ENV_DIR] = path.join(fixture, VT.DATA);
  process.env[C.SOURCE_ENV] = source;
  const faultAssets = await ensureMotionSfxLibrary(),
    bad = faultAssets.find((asset) => asset.name.includes(VT.BAD));
  assert.ok(bad);
  const recovered = await buildMotionSoundTrack(2, [{ t: 0.2, kind: VT.DISH, assetId: bad!.id }]);
  assert.ok(recovered.sfxId);
  assert.equal(recovered.selections[0].asset?.id, dish.id, VT.A_CORRUPT_FIRST_CANDIDATE_MUST_FALL_BACK_TO_A_VALID_SOUND);
  const abort = new AbortController();
  abort.abort();
  await assert.rejects(buildMotionSoundTrack(2, [{ t: 0, kind: VT.DISH }], {}, abort.signal));
} finally {
  for (const [key, value] of [
    [STORAGE_CONFIG.ENV_DIR, originalStorage],
    [C.SOURCE_ENV, originalSource],
    [VT.APP_DATA_DIR, originalAppData],
  ])
    if (value == null) delete process.env[key!];
    else process.env[key!] = value;
}
process.stdout.write(VT.MOTION_SOUND_PASSED_DEDUPLICATED_REAL_LIBRARY_SEMANTIC_CLASS);
