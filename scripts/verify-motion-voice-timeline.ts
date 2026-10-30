import { MOTION_VERIFICATION_TEXTS as VT, MOTION_VERIFICATION_FORMATS as VF } from "./motionVerificationTexts.js";
import assert from "node:assert/strict";
import fs from "node:fs";
import { compileStorySpec } from "../src/features/motion/server/services/motionDirectorService.ts";
import { prepareMotionGen, stageBeats } from "../src/server/services/motionGenService.ts";
import type { MotionVoiceTiming, MotionVoiceTrack } from "../src/types/motionVideo.ts";
const fixture = JSON.parse(fs.readFileSync(VT.MOTION_ENGINE_DEMO_EDITORIAL_QA_JSON, VT.UTF8));
const location = fixture.gen.locations.studio;
location.nodes = [{ shape: VT.BOX, name: VT.DESK, size: [1, 0.8, 0.6], pos: [0, 0.4, 0], mat: { color: VT.VALUE_886644 } }];
const analysis: any = { title: VT.TIMELINE, logline: VT.A_DESK, cast: [], places: [{ key: VT.STUDIO, name: VT.STUDIO_2 }] };
const beat: any = { id: VT.B1, chapterId: VT.C1, visual: VT.SCENE, place: VT.STUDIO, cast: [], narration: VT.FIRST_LINE_SECOND_LINE };
const gen = prepareMotionGen(undefined, analysis, VT.VALUE_2D);
gen.locations.studio = location;
const script: any = { title: VT.TIMELINE, language: VT.EN, beats: [beat], gen };
const timing: MotionVoiceTiming = {
  signature: VT.TEST_2,
  beats: {
    b1: {
      duration: 6,
      lines: [
        { id: VT.B1_1, speaker: VT.NARRATOR, text: VT.FIRST_LINE, from: 0, to: 2 },
        { id: VT.B1_2, speaker: VT.NARRATOR, text: VT.SECOND_LINE, from: 3, to: 5 },
      ],
    },
  },
};
let prompt = VT.EMPTY_2;
await stageBeats([beat], script, analysis, gen, {
  exec: {},
  log: () => {},
  voiceTiming: Promise.resolve(timing),
  ai: async (text) => {
    prompt = text;
    return {
      beats: [
        {
          id: VT.B1,
          location: VT.STUDIO,
          actors: [],
          props: [],
          cameras: [
            { shot: VT.WIDE, at: 0 },
            { shot: VT.INSERT, at: 0.2, focusProp: VT.DESK, utterance: VT.B1_2 },
          ],
          soundEvents: [{ id: VT.TAP, kind: VT.CLICK, layer: VT.ACTION, utterance: VT.B1_2, edge: VT.END, source: VT.OFFSCREEN }],
        },
      ],
    };
  },
} as any);
assert.match(prompt, VT.VOICE_TIMELINE_RE, VT.STAGING_IS_TOLD_THE_VOICE_IS_ALREADY_RECORDED);
assert.match(prompt, VT.MEASURED_LINE_WINDOW_RE, VT.STAGING_RECEIVES_THE_MEASURED_LINE_WINDOWS);
assert.match(prompt, VT.MEASURED_BEAT_DURATION_RE, VT.STAGING_USES_THE_RECORDED_BEAT_LENGTH_NOT_THE_ESTIMATE);
const staged: any = gen.staging.b1;
assert.ok(staged, VT.BEAT_IS_STAGED);
assert.equal(staged.cameras[1].utterance, VT.B1_2, VT.THE_ENGINE_KEEPS_THE_LINE_REFERENCE_ON_THE_CAMERA);
assert.equal(staged.cameras[1].at, 0.5, VT.THE_CUT_MOVES_TO_THE_START_OF_THE_REFERENCED_LINE_3_S_OF_6_S);
assert.ok(Math.abs(staged.soundEvents[0].at - 5 / 6) < 1e-6, VT.A_SOUND_TIED_TO_THE_END_OF_A_LINE_GETS_THAT_FRACTION_FOR_PREVIEWS);
const track = {
  clips: [
    { id: VT.B1_1, beatId: VT.B1, speaker: VT.NARRATOR, voiceId: VT.V, text: VT.FIRST_LINE, audioId: VT.A_2, start: 0, end: 2.5 },
    { id: VT.B1_2, beatId: VT.B1, speaker: VT.NARRATOR, voiceId: VT.V, text: VT.SECOND_LINE, audioId: VT.B, start: 4, end: 6.5 },
  ],
} as unknown as MotionVoiceTrack;
const compiled = compileStorySpec(script, analysis, { aspect: VT.VALUE_16_9, durations: [8], voiceTrack: track });
const cut = compiled.spec.shots.find((shot) => shot.id !== VT.B1);
assert.ok(cut && Math.abs(cut.start - 4) < 0.01, VF.CAMERA_LINE_START_MESSAGE(cut?.start));
const tap = compiled.sfxCues.find((cue) => cue.id.includes(VT.TAP));
assert.ok(tap && Math.abs(tap.t - 6.5) < 0.01, VF.SOUND_LINE_END_MESSAGE(tap?.t));
process.stdout.write(VT.VOICE_TIMELINE_PASSED_STAGING_GETS_MEASURED_DURATIONS_AND_LINE_WINDOWS_C + VT.EMPTY);
