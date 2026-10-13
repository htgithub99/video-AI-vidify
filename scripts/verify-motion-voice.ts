import { MOTION_VERIFICATION_TEXTS as VT } from "./motionVerificationTexts.js";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { motionVoiceSignature, normalizeMotionUtterances, speechWords, directedSpeechText, selectMotionVoiceRoles } from "../src/lib/motionVoice.ts";
import { directMotionVoice } from "../src/server/services/motionVoiceDirectionService.ts";
import { buildMotionVoiceTrack, readMotionVoiceTrack } from "../src/server/services/motionAudioService.ts";
import { motionWavHeader } from "../src/server/services/motionSoundMixService.ts";
import { getMotionAudioDirectory } from "../src/server/services/motionLibraryService.ts";
import { normalizeBeats } from "../src/server/services/motionStoryService.ts";
import { motionAudioDirection } from "../src/lib/motionAudioDirection.ts";
import { soundCandidates } from "../src/server/services/motionSfxLibraryService.ts";
const directory = path.resolve(VT.SCRATCH_MOTION_VOICE_UNIT, randomUUID());
process.env.VIDIFY_STORAGE_DIR = directory;
const voices = [
  { id: VT.HAI_DANG, name: VT.HAI_DANG, gender: VT.MALE },
  { id: VT.MAI_ANH, name: VT.MAI_ANH, gender: VT.FEMALE },
  { id: VT.THIEN_MINH, name: VT.THIEN_MINH, gender: VT.MALE },
  { id: VT.THIEN_TAM_DUC, name: VT.THIEN_TAM_DUC, gender: VT.MALE },
];
const analysis: any = {
  cast: [
    { key: VT.WOMAN, name: VT.CO_LAN, gender: VT.FEMALE },
    { key: VT.MAN, name: VT.ANH_NAM, gender: VT.MALE },
    { key: VT.ELDER, name: VT.ONG_GIA, gender: VT.MALE },
  ],
};
const roles = selectMotionVoiceRoles(analysis, voices);
assert.equal(new Set(roles.map((role) => role.voiceId)).size, 4);
assert.equal(roles.find((role) => role.speaker === VT.WOMAN)?.gender, VT.FEMALE);
assert.equal(roles.find((role) => role.speaker === VT.ELDER)?.age, VT.SENIOR);
assert.equal(selectMotionVoiceRoles(analysis, voices, { woman: VT.MAI_ANH }).find((role) => role.speaker === VT.WOMAN)?.voiceId, VT.MAI_ANH);
assert.equal(selectMotionVoiceRoles(analysis, voices, { woman: VT.HAI_DANG, man: VT.MAI_ANH }).find((role) => role.speaker === VT.WOMAN)?.gender, VT.FEMALE, VT.INCOMPATIBLE_AUTOMATIC_VOICE_SUGGESTIONS_ARE_REJECTED);
assert.notEqual(selectMotionVoiceRoles(analysis, voices, { woman: VT.HAI_DANG }).find((role) => role.speaker === VT.WOMAN)?.voiceId, VT.HAI_DANG);
assert.throws(
  () =>
    selectMotionVoiceRoles(
      analysis,
      voices.filter((voice) => voice.gender !== VT.FEMALE),
    ),
  /giới tính/,
);
assert.equal(motionAudioDirection(null, { ...analysis, videoDna: { format: { primary: VT.PHIM_NGAN, factual: false } } }).mode, VT.FILM);
assert.equal(motionAudioDirection(null, { ...analysis, genre: VT.KE_CHUYEN }).mode, VT.STORYTELLING);
assert.equal(motionAudioDirection(null, { ...analysis, factual: true }, { mode: VT.FILM }).mode, VT.DOCUMENTARY);
assert.equal(motionAudioDirection(null, { ...analysis, genre: VT.EDUCATIONAL_EXPLAINER }).mode, VT.EXPLAINER);
const laughs: any = [
  { id: VT.A_2, name: VT.FEMALE_LAUGH, kinds: [VT.LAUGH], tags: [VT.FEMALE, VT.LAUGH], duration: 1 },
  { id: VT.B, name: VT.MALE_LAUGH, kinds: [VT.LAUGH], tags: [VT.MALE, VT.LAUGH], duration: 1 },
];
assert.deepEqual(
  soundCandidates({ kind: VT.LAUGH, layer: VT.CHARACTER, description: VT.LAUGH, speakerGender: VT.MALE }, laughs).map((asset) => asset.id),
  [VT.B],
  VT.CHARACTER_VOCAL_SFX_REJECT_KNOWN_INCOMPATIBLE_GENDER,
);
const source = VT.CO_LAN_HOI_ONG_CO_NGHE_TIENG_DONG_KHONG_ONG_DAP_CO_CHAU_CU_B;
const split = [
  { id: VT.INTRO, speaker: VT.NARRATOR, text: VT.CO_LAN_HOI },
  { id: VT.QUESTION, speaker: VT.WOMAN, text: VT.ONG_CO_NGHE_TIENG_DONG_KHONG, emotion: VT.TENSE, pauseAfter: 0.4 },
  { id: VT.ATTRIBUTION, speaker: VT.NARRATOR, text: VT.ONG_DAP },
  { id: VT.ANSWER, speaker: VT.ELDER, text: VT.CO_CHAU_CU_BINH_TINH, emotion: VT.WARM, emphasis: [VT.BINH_TINH] },
];
const script: any = { title: VT.VOICE_TEST, language: VT.VI, beats: [{ id: VT.A_2, chapterId: VT.C, narration: source, visual: VT.QUOTE }] };
assert.notEqual(motionVoiceSignature(script, analysis), motionVoiceSignature(script, { ...analysis, genre: VT.DOCUMENTARY }), VT.CHANGING_FORMAT_INVALIDATES_VOICE_DIRECTION);
assert.notEqual(motionVoiceSignature(script, analysis), motionVoiceSignature(script, { ...analysis, cast: analysis.cast.map((member: any) => ({ ...member, gender: VT.MALE })) }), VT.CHANGING_CAST_INVALIDATES_VOICE_IDENTITY);
const authored = normalizeBeats([{ narration: source, visual: VT.QUOTE, utterances: split }], VT.C, { ...analysis, places: [] });
assert.equal(authored[0].utterances?.[1].speaker, VT.WOMAN, VT.STORY_GENERATION_PRESERVES_ATTRIBUTED_DIALOGUE_FOR_AUTOMATIC);
assert.equal(normalizeBeats([{ narration: source, visual: VT.QUOTE, utterances: [{ speaker: VT.WOMAN, text: VT.INVENTED_LINE }] }], VT.C, { ...analysis, places: [] })[0].utterances, undefined);
let plans = 0;
const opts: any = {
  exec: {},
  ai: async () => {
    plans++;
    return { beats: [{ id: VT.A_2, utterances: split }] };
  },
};
const plan = await directMotionVoice(script, analysis, voices, opts);
assert.equal(plan.beats[0].utterances[1].speaker, VT.WOMAN);
assert.equal(speechWords(plan.beats[0].utterances.map((line) => line.text).join(VT.EMPTY_8)), speechWords(source));
assert.ok(directedSpeechText(plan.beats[0].utterances[3]).includes(VT.BINH_TINH_2));
assert.deepEqual(normalizeMotionUtterances([{ text: VT.NOI_DUNG_BIA_DAT }], VT.A_2, [VT.NARRATOR], source), []);
assert.equal(normalizeMotionUtterances([{ id: VT.Q, speaker: VT.UNKNOWN, text: VT.CHAO }], VT.A_2, [VT.NARRATOR])[0].speaker, VT.NARRATOR);
await directMotionVoice(script, analysis, voices, opts);
assert.equal(plans, 2, VT.SOUND_DIRECTION_IS_CACHED_WITHOUT_REPEATED_AI_QA);
let generated = 0;
const deps: any = {
  voices: async () => voices,
  synthesize: async (_text: string, _voice: string, file: string, signal?: AbortSignal) => {
    if (signal?.aborted) throw Error(VT.CANCELLED);
    generated++;
    const samples = Buffer.alloc(48000);
    for (let frame = 0; frame < samples.length / 2; frame++) samples.writeInt16LE(Math.round(Math.sin(frame * 0.03) * 5000), frame * 2);
    fs.writeFileSync(file, Buffer.concat([motionWavHeader(samples.length, 1), samples]));
    return { seconds: 0.5, sampleRate: 48000, backend: VT.TEST_2 };
  },
};
const track = await buildMotionVoiceTrack(script, analysis, opts, deps);
assert.equal(track.provider, VT.VIENEU);
assert.equal(track.clips?.length, 4);
assert.equal(generated, 4);
assert.equal(track.clips![0].speaker, VT.NARRATOR);
for (let index = 1; index < track.clips!.length; index++) assert.ok(track.clips![index].start >= track.clips![index - 1].end);
assert.ok(track.clips![1].end + 0.39 < track.clips![2].start);
const wav = fs.readFileSync(path.join(getMotionAudioDirectory(), track.audioId));
assert.equal(wav.readUInt16LE(22), 2);
assert.ok(Math.abs((wav.length - 44) / 4 / 48000 - track.totalSeconds) < 1 / 48000);
assert.equal(readMotionVoiceTrack(track.audioId, script, analysis)?.audioId, track.audioId);
assert.equal(readMotionVoiceTrack(VT.BAD_WAV, script), undefined);
await buildMotionVoiceTrack(script, analysis, opts, deps);
assert.equal(generated, 4);
const modified = structuredClone(script);
modified.voiceSettings = { utterances: { a: structuredClone(plan.beats[0].utterances) } };
modified.voiceSettings.utterances.a[1].speed = 1.1;
assert.notEqual(motionVoiceSignature(script), motionVoiceSignature(modified));
await buildMotionVoiceTrack(modified, analysis, opts, deps);
assert.equal(generated, 5, VT.CHANGING_ONE_DELIVERY_ONLY_REGENERATES_ONE_CLIP);
assert.equal(readMotionVoiceTrack(track.audioId, modified, analysis), undefined);
const fallback = await directMotionVoice({ ...script, title: VT.FALLBACK, beats: [{ ...script.beats[0], id: VT.FALLBACK_2 }] }, analysis, voices, {
  ...opts,
  ai: async () => {
    throw Error(VT.AI_UNAVAILABLE);
  },
});
assert.equal(fallback.beats[0].utterances[0].text, source);
assert.equal(fallback.beats[0].utterances[0].speaker, VT.NARRATOR);
const cancelled = new AbortController();
cancelled.abort();
await assert.rejects(buildMotionVoiceTrack({ ...script, beats: [{ ...script.beats[0], id: VT.CANCEL }] }, analysis, { ...opts, signal: cancelled.signal }, deps));
process.stdout.write(VT.MOTION_VOICE_PASSED_STABLE_CASTING_SOURCE_PRESERVATION_MEASU);
