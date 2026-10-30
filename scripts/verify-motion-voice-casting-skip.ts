import { MOTION_VERIFICATION_TEXTS as VT } from "./motionVerificationTexts.js";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
process.env.VIDIFY_STORAGE_DIR = fs.mkdtempSync(path.join(os.tmpdir(), VT.MOTION_VOICE_CASTING));
const { saveVoiceChannel, voiceChannelRef } = await import("../src/features/motion/server/services/motionVoiceLibraryService.ts");
const { directMotionVoice } = await import("../src/features/motion/server/services/motionVoiceDirectionService.ts");
const { MOTION_VOICE } = await import("../src/constants/motionVoice.ts");
const voices: any[] = [
  { id: VT.HAI_DANG, name: VT.HAI_DANG, gender: VT.MALE },
  { id: VT.MAI_ANH, name: VT.MAI_ANH, gender: VT.FEMALE },
  { id: VT.XUAN_VINH, name: VT.XUAN_VINH, gender: VT.MALE },
];
const channels = saveVoiceChannel({ name: VT.KENH, narratorVoiceId: VT.HAI_DANG, roleVoices: { female_adult: VT.MAI_ANH, senior_male: VT.XUAN_VINH } }, voices, true);
const channel = voiceChannelRef(channels.channels[0]);
const beat = (id: string, narration: string): any => ({ id, chapterId: VT.C1, visual: VT.TITLE, narration, utterances: [{ id: id + VT.VALUE_1, speaker: VT.NARRATOR, role: VT.NARRATION, text: narration, emotion: VT.NEUTRAL, speed: 1, pauseBefore: 0, pauseAfter: 0.2, emphasis: [] }] });
const run = async (cast: any[], title: string) => {
  let casting = 0;
  const logs: string[] = [];
  const plan = await directMotionVoice({ title, language: VT.VI, voiceChannel: channel, beats: [beat(VT.B1, VT.CAU_CHUYEN_BAT_DAU + title)] } as any, { title, cast } as any, voices, {
    exec: {},
    log: (line: string) => logs.push(line),
    ai: async (_prompt: string, artifact: string) => {
      if (artifact === VT.MOTION_AUDIO_CASTING) casting++;
      return {};
    },
  });
  return { casting, logs, plan };
};
const settled = await run(
  [
    { key: VT.LAN, name: VT.CO_LAN, gender: VT.FEMALE, type: VT.YOUNG_WOMAN },
    { key: VT.ONG, name: VT.ONG_BA, gender: VT.MALE, type: VT.OLD_MAN },
  ],
  VT.A_2,
);
assert.equal(settled.casting, 0, VT.ALL_VOICES_LOCKED_AND_TRAITS_KNOWN_NO_CASTING_REQUEST);
assert.ok(settled.logs.includes(MOTION_VOICE.CASTING_SKIPPED));
assert.equal(settled.plan.roles.find((role) => role.speaker === VT.ONG)?.voiceId, VT.XUAN_VINH, VT.LIBRARY_TYPE_OLD_MAN_SELECTS_THE_LOCKED_SENIOR_VOICE);
assert.ok(settled.plan.roles.every((role) => role.locked));
const unknownAge = await run([{ key: VT.LAN, name: VT.CO_LAN, gender: VT.FEMALE }], VT.B);
assert.equal(unknownAge.casting, 1, VT.UNKNOWN_AGE_STILL_ASKS_THE_AI);
const unlockedGroup = await run([{ key: VT.BE, name: VT.BE_TI, gender: VT.MALE, type: VT.BOY }], VT.C);
assert.equal(unlockedGroup.casting, 1, VT.A_ROLE_WITHOUT_A_LOCKED_GROUP_VOICE_STILL_ASKS_THE_AI);
fs.rmSync(process.env.VIDIFY_STORAGE_DIR!, { recursive: true, force: true });
process.stdout.write(VT.CASTING_SKIP_PASSED_NO_CASTING_REQUEST_WHEN_THE_CHANNEL_LOCKS_EVERY_VOIC + VT.EMPTY);
