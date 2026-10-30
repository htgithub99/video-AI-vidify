import { MOTION_VERIFICATION_TEXTS as VT } from "./motionVerificationTexts.js";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
process.env.VIDIFY_STORAGE_DIR = fs.mkdtempSync(path.join(os.tmpdir(), VT.MOTION_VOICE_CAST));
const { selectMotionVoiceRoles, motionVoiceCast } = await import("../src/lib/motionVoice.ts");
const { directMotionVoice } = await import("../src/features/motion/server/services/motionVoiceDirectionService.ts");
const { prepareMotionGen } = await import("../src/server/services/motionGenService.ts");
const { motionCarryGen } = await import("../src/lib/motionParts.ts");
const { MOTION_VOICE } = await import("../src/constants/motionVoice.ts");
const voices: any[] = [
  { id: VT.HAI_DANG, name: VT.HAI_DANG, gender: VT.MALE },
  { id: VT.THIEN_MINH, name: VT.THIEN_MINH, gender: VT.MALE },
  { id: VT.QUANG_SON, name: VT.QUANG_SON, gender: VT.MALE },
  { id: VT.MAI_ANH, name: VT.MAI_ANH, gender: VT.FEMALE },
];
const channel: any = { id: VT.CH, name: VT.KENH, narratorVoiceId: VT.MAI_ANH, roleVoices: { male_adult: VT.HAI_DANG }, updatedAt: 1 };
const nam = { key: VT.NAM, name: VT.ANH_NAM, gender: VT.MALE };
const binh = { key: VT.BINH, name: VT.ANH_BINH, gender: VT.MALE };
const voiceOf = (roles: any[], speaker: string) => roles.find((role) => role.speaker === speaker)?.voiceId;
const part1 = selectMotionVoiceRoles({ cast: [nam, binh] } as any, voices, {}, undefined, {}, channel);
assert.equal(voiceOf(part1, VT.NAM), VT.HAI_DANG);
assert.notEqual(voiceOf(part1, VT.BINH), voiceOf(part1, VT.NAM), VT.EACH_ROLE_GETS_ITS_OWN_VOICE);
assert.equal(new Set(part1.map((role) => role.voiceId)).size, part1.length, VT.NO_TWO_SPEAKERS_SHARE_A_VOICE);
const cast = motionVoiceCast(undefined, part1);
const tuan = { key: VT.TUAN, name: VT.ANH_TUAN, gender: VT.MALE };
const part2 = selectMotionVoiceRoles({ cast: [binh, tuan, nam] } as any, voices, { binh: VT.HAI_DANG, tuan: voiceOf(part1, VT.BINH) }, undefined, {}, channel, cast);
assert.equal(voiceOf(part2, VT.NAM), voiceOf(part1, VT.NAM), VT.SAME_VOICE_FOR_NAM_ACROSS_THE_STORY);
assert.equal(voiceOf(part2, VT.BINH), voiceOf(part1, VT.BINH), VT.SAME_VOICE_FOR_BINH_ACROSS_THE_STORY_EVEN_WHEN_LISTED_FIRST);
assert.ok(![voiceOf(part1, VT.NAM), voiceOf(part1, VT.BINH), VT.MAI_ANH].includes(voiceOf(part2, VT.TUAN)), VT.A_NEW_ROLE_NEVER_TAKES_A_VOICE_ALREADY_OWNED_IN_THE_STORY);
assert.equal(voiceOf(part2, VT.NARRATOR), VT.MAI_ANH);
const analysis: any = { title: VT.T_3, logline: VT.EMPTY_2, cast: [nam], places: [] };
const redesigned = prepareMotionGen({ voiceCast: cast } as any, { ...analysis, look: VT.CHANGED });
assert.deepEqual(redesigned.voiceCast, cast, VT.REDRAWING_THE_STORY_KEEPS_EVERY_ROLE_S_VOICE);
assert.deepEqual(motionCarryGen(redesigned)?.voiceCast, cast, VT.THE_NEXT_PART_OF_A_SERIES_RECEIVES_THE_VOICE_MAP);
const beat = (id: string): any => ({ id, chapterId: VT.C, visual: VT.TITLE, narration: VT.MOT_HAI_BA, utterances: [{ id: id + VT.VALUE_1, speaker: VT.NARRATOR, role: VT.NARRATION, text: VT.MOT_HAI_BA, emotion: VT.NEUTRAL, speed: 1, pauseBefore: 0, pauseAfter: 0.2, emphasis: [] }] });
let casting = 0;
const logs: string[] = [];
const opts: any = { exec: {}, log: (line: string) => logs.push(line), ai: async (_p: string, artifact: string) => (artifact === VT.MOTION_AUDIO_CASTING ? (casting++, { roles: [{ speaker: VT.NAM, voiceId: VT.QUANG_SON }] }) : {}) };
const plan = await directMotionVoice({ title: VT.P2, language: VT.VI, beats: [beat(VT.B1)], gen: { voiceCast: cast } } as any, { title: VT.P2, cast: [binh, nam] } as any, voices, opts);
assert.equal(casting, 0, VT.KNOWN_VOICES_FOR_EVERY_SPEAKER_SKIP_THE_CASTING_REQUEST);
assert.equal(voiceOf(plan.roles, VT.NAM), cast.nam);
assert.equal(voiceOf(plan.roles, VT.BINH), cast.binh);
const crowd = [nam, binh, tuan, { key: VT.SON, name: VT.ANH_SON, gender: VT.MALE }];
await directMotionVoice({ title: VT.CROWD, language: VT.VI, beats: [beat(VT.B2)] } as any, { title: VT.CROWD, cast: crowd } as any, voices, opts);
assert.ok(
  logs.some((line) => line.startsWith(MOTION_VOICE.SHARED_VOICE(VT.EMPTY_2).slice(0, 30))),
  VT.SHARED_VOICES_ARE_LOGGED_WITH_THE_ROLES_INVOLVED,
);
fs.rmSync(process.env.VIDIFY_STORAGE_DIR!, { recursive: true, force: true });
process.stdout.write(VT.VOICE_CAST_PASSED_ONE_DISTINCT_VOICE_PER_ROLE_KEPT_ACROSS_PARTS_REDESIGN + VT.EMPTY);
