import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { repairMotionSpeechAttribution, resolveMotionVoiceSources } from "../src/lib/motionVoiceAttribution.ts";
import { selectMotionVoiceRoles, normalizeMotionUtterances, motionVoiceSignature, withMotionVoiceMode } from "../src/lib/motionVoice.ts";
import { motionAudioDirection } from "../src/lib/motionAudioDirection.ts";
import { motionSupportedTranscript } from "../src/server/services/motionVoiceQualityService.ts";
import { motionWavHeader } from "../src/server/services/motionSoundMixService.ts";
import type { MotionUtterance } from "../src/types/motionVideo.ts";

delete process.env.APP_DATA_DIR;
const root = path.resolve("scratch/voice-attribution-" + randomUUID());
process.env.VIDIFY_STORAGE_DIR = root;
const { directMotionVoice } = await import("../src/server/services/motionVoiceDirectionService.ts");
const { saveVoiceChannel, voiceChannelRef } = await import("../src/server/services/motionVoiceLibraryService.ts");
const { buildMotionVoiceTrack, readMotionVoiceTrack } = await import("../src/server/services/motionAudioService.ts");
const line = (speaker: string, text: string, id = speaker): MotionUtterance => ({ id, speaker, role: speaker === "narrator" ? "narration" : "dialogue", text, emotion: "neutral", speed: 1, pauseBefore: 0, pauseAfter: 0, emphasis: [] });
const voices: any[] = [
  { id: "reference", name: "Người kể đã khóa", gender: "male", age: "adult" },
  { id: "female", name: "Giọng nữ", gender: "female", age: "adult" },
  { id: "girl", name: "Trẻ em", gender: "female", age: "child" },
  { id: "spirit", name: "Giọng vong", gender: "female", age: "adult" },
];
const analysis: any = { title: "Kiểm tra phân vai", cast: [
  { key: "toi", name: "Tôi", gender: "male", age: "adult", narrator: true },
  { key: "em", name: "Em gái", gender: "female", age: "child", description: "Bị vong mượn giọng" },
  { key: "vong", name: "Vong nữ", gender: "female", age: "adult" },
], videoDna: { audioText: { narration: "Người kể Quỳnh Lập, lời thoại của người vợ và đứa con; kể chậm và ấm." }, editDna: { narratorVoice: "Người kể Quỳnh Lập, lời thoại của người vợ và đứa con; kể chậm và ấm." } } };
try {
  const channel = saveVoiceChannel({ name: "Kênh thử", narratorVoiceId: "reference", roleVoices: { child: "girl", female_adult: "spirit" } }, voices).channels[0];
  const direction = motionAudioDirection(null, analysis);
  assert.ok(!/Quỳnh|người vợ|đứa con/.test(direction.narrationStyle));
  assert.equal(direction.narrationStyle.match(/Unhurried/g)?.length, 1);
  const roles = selectMotionVoiceRoles(analysis, voices, { narrator: "female" }, { ...direction, narrationStyle: "Người vợ kể chuyện" }, { narrator: { gender: "female" } }, channel, { narrator: "female" });
  assert.equal(roles[0].voiceId, "reference", "AI/style and stale automatic bindings cannot replace channel narrator");
  assert.equal(roles.find(r => r.speaker === "toi")!.voiceId, "reference");
  const femaleNarrator = selectMotionVoiceRoles({ cast: [{ key: "host", name: "Host", narrator: true, gender: "female" }] } as any, voices, {}, direction, {}, channel);
  assert.equal(femaleNarrator[0].voiceId, "reference", "An intentional channel choice wins over character gender");
  assert.equal(femaleNarrator[0].gender, "male", "Plan metadata describes the actual voice");
  assert.equal(femaleNarrator.find(r => r.speaker === "host")!.gender, "male", "The shared self-role describes the actual voice too");
  assert.equal(selectMotionVoiceRoles(analysis, voices, {}, direction, {}, channel, { toi: "reference" })[0].voiceId, "reference", "A remembered self-role cannot reserve the narrator's channel voice away from the narrator");
  assert.equal(selectMotionVoiceRoles(analysis, voices, {}, direction, {}, channel, {}, { narrator: "female" })[0].voiceId, "female", "Explicit manual override wins");
  const original = [line("narrator", "Em gái nhìn tôi, giọng không phải của nó. Nó nói: Đừng đi ra ngoài. Hãy chờ ở đây.", "lead"), line("em", "Có người đang đợi.", "speech"), line("narrator", "Nói xong, nó nằm xuống.", "tail")];
  const beat: any = { id: "b1", chapterId: "c1", narration: original.map(l => l.text).join(" "), visual: "scene", utterances: original };
  const fixed = repairMotionSpeechAttribution(original, beat, analysis);
  assert.equal(fixed[0].text, "Em gái nhìn tôi, giọng không phải của nó. Nó nói:");
  assert.equal(fixed[1].speaker, "em");
  assert.equal(fixed[1].text, "Đừng đi ra ngoài. Hãy chờ ở đây.");
  assert.equal(fixed.map(l => l.text).join(" "), beat.narration, "Preserve all words and punctuation");
  assert.equal(fixed.at(-1)!.speaker, "narrator");
  const ambiguous = [line("narrator", "Nó nói: Đừng đi.")];
  assert.deepEqual(repairMotionSpeechAttribution(ambiguous, { ...beat, narration: ambiguous[0].text }, analysis), ambiguous, "Unknown speaker must not be guessed");
  const quoted = [line("narrator", "Em gái nói: “Chờ em.” Nói xong, nó quay đi.")];
  const q = repairMotionSpeechAttribution(quoted, { ...beat, narration: quoted[0].text }, analysis);
  assert.equal(q[1].speaker, "em");
  assert.equal(q[2].speaker, "narrator");
  const script: any = { title: analysis.title, language: "vi", voiceChannel: voiceChannelRef(channel), beats: [beat] };
  const mapped = resolveMotionVoiceSources([{ id: beat.id, utterances: fixed }], script, analysis);
  assert.equal(mapped[0].utterances.find(l => l.speaker === "em")!.voiceSpeaker, "vong");
  const ordinary = { ...analysis, cast: analysis.cast.map((m: any) => ({ ...m, description: "" })) };
  const normalBeat = { ...beat, narration: "Em gái nói: Có người đang đợi." };
  assert.equal(resolveMotionVoiceSources([{ id: beat.id, utterances: [line("em", "Có người đang đợi.")] }], { ...script, beats: [normalBeat] }, ordinary)[0].utterances[0].voiceSpeaker, undefined);
  assert.equal(resolveMotionVoiceSources([{ id: beat.id, utterances: [line("em", "Có người đang đợi.")] }], { ...script, beats: [normalBeat] }, analysis)[0].utterances[0].voiceSpeaker, undefined, "A future possession in character description cannot change earlier normal dialogue");
  assert.equal(resolveMotionVoiceSources([{ id: beat.id, utterances: fixed }], script, { ...analysis, factual: true })[0].utterances[1].voiceSpeaker, undefined);
  assert.equal(resolveMotionVoiceSources([{ id: beat.id, utterances: fixed }], { ...script, voiceSettings: { voices: { em: "girl" } } }, analysis)[0].utterances[1].voiceSpeaker, undefined);
  const restoredBeat = { ...beat, narration: "Giọng em gái trở lại bình thường. Em nói: Chờ em." };
  assert.equal(resolveMotionVoiceSources([{ id: beat.id, utterances: [line("em", "Chờ em.")] }], { ...script, beats: [restoredBeat] }, analysis)[0].utterances[0].voiceSpeaker, undefined);
  assert.equal(normalizeMotionUtterances([line("em", "Xin chào.")].map(l => ({ ...l, voiceSpeaker: "missing" })), "b", ["narrator", "em", "vong"])[0].voiceSpeaker, undefined);
  let requests = 0;
  const options: any = { exec: {}, ai: async () => { requests++; return {}; } };
  const plan = await directMotionVoice(script, analysis, voices, options);
  assert.equal(requests, 0, "Repair known dialogue and locked cast locally without extra AI requests");
  assert.equal(plan.roles[0].voiceId, "reference");
  assert.equal(plan.beats[0].utterances[1].voiceSpeaker, "vong");
  assert.deepEqual((await directMotionVoice(script, analysis, voices, options)).beats, plan.beats, "Cached plan preserves attribution");
  const pcm = Buffer.alloc(48000 * 2);
  for (let i = 2400; i < 36000; i++) pcm.writeInt16LE(Math.round(3000 * Math.sin(2 * Math.PI * 220 * i / 48000)), i * 2);
  const wav = Buffer.concat([motionWavHeader(pcm.length, 1), pcm]);
  const heard = motionSupportedTranscript(wav, { text: "Chờ em. Subscribe now", words: [{ w: "Chờ", s: .1, e: .3 }, { w: "em.", s: .4, e: .6 }, { w: "Subscribe", s: .85, e: .9 }, { w: "now", s: .95, e: .95 }] });
  assert.equal(heard.text, "Chờ em.", "Silence hallucinations never trigger a pronunciation retry");
  const spoken: string[] = [];
  const track = await buildMotionVoiceTrack(script, analysis, { ...options, asr: false }, { voices: async () => voices, synthesize: async (_text: string, voiceId: string, file: string) => { spoken.push(voiceId); fs.writeFileSync(file, wav); return { seconds: 1 }; } } as any);
  assert.ok(track.clips!.some(c => c.speaker === "em" && c.voiceSpeaker === "vong" && c.voiceId === "spirit"), "Rendering uses the source voice while keeping actor/speaker identity");
  assert.ok(spoken.includes("reference") && spoken.includes("spirit"));
  const single = withMotionVoiceMode({ ...script, voiceTrack: track }, false);
  assert.equal(single.voiceTrack, undefined, "Switching voice mode invalidates the attached track");
  assert.equal(script.voiceSettings, undefined, "Switching never mutates the original script or dialogue");
  assert.equal(single.beats, script.beats);
  const singlePlan = await directMotionVoice(single, analysis, voices, options);
  assert.equal(requests, 0, "Narrator-only planning never asks AI to cast or split dialogue");
  assert.equal(singlePlan.roles.length, 1);
  assert.equal(singlePlan.roles[0].voiceId, "reference");
  assert.equal(singlePlan.beats[0].utterances.map(l => l.text).join(" "), beat.narration);
  assert.ok(singlePlan.beats.flatMap(b => b.utterances).every(l => l.speaker === "narrator" && l.role === "narration" && !l.voiceSpeaker));
  const onlyNarrator = await directMotionVoice(single, analysis, voices.slice(0, 1), options);
  assert.equal(onlyNarrator.roles[0].voiceId, "reference", "Missing female/child voices cannot block narrator-only mode");
  const manualSingle = await directMotionVoice({ ...single, voiceSettings: { multiVoice: false, voices: { narrator: "female", em: "girl" }, utterances: { b1: fixed } } }, analysis, voices, options);
  assert.equal(manualSingle.roles[0].voiceId, "female", "Manual narrator choice wins; character overrides remain dormant");
  assert.ok(manualSingle.beats[0].utterances.every(l => l.speaker === "narrator"));
  const defaultSingle = await directMotionVoice({ ...single, voiceChannel: undefined }, analysis, voices, options);
  assert.equal(defaultSingle.roles.length, 1, "A channel is optional in narrator-only mode");
  const singleSpoken: string[] = [];
  const singleDeps: any = { voices: async () => voices, synthesize: async (_text: string, voiceId: string, file: string) => { singleSpoken.push(voiceId); fs.writeFileSync(file, wav); return { seconds: 1 }; } };
  const singleTrack = await buildMotionVoiceTrack(single, analysis, options, singleDeps);
  assert.ok(singleTrack.clips!.every(c => c.speaker === "narrator" && c.voiceId === "reference" && !c.voiceSpeaker));
  assert.ok(singleSpoken.length > 0 && singleSpoken.every(id => id === "reference"));
  assert.notEqual(singleTrack.audioId, track.audioId, "One-voice and multi-voice tracks have isolated cache keys");
  assert.equal(readMotionVoiceTrack(track.audioId, single, analysis), undefined, "Old multi-voice audio is rejected in narrator-only mode");
  const count = singleSpoken.length;
  assert.equal((await buildMotionVoiceTrack(single, analysis, options, singleDeps)).audioId, singleTrack.audioId);
  assert.equal(singleSpoken.length, count, "Repeating a single-voice request reuses its own valid audio cache");
  const restoredMulti = withMotionVoiceMode(single, true);
  assert.equal(motionVoiceSignature(restoredMulti, analysis), motionVoiceSignature(script, analysis), "Returning to default mode can reuse the original multi-voice cache");
  assert.deepEqual((await directMotionVoice(restoredMulti, analysis, voices, options)).beats, plan.beats);
  const customSettings = { voices: { em: "girl" }, utterances: { b1: fixed } };
  assert.deepEqual(withMotionVoiceMode(withMotionVoiceMode({ ...script, voiceSettings: customSettings }, false), true).voiceSettings, customSettings, "Character assignments and manual utterances survive toggling both ways");
  assert.equal(withMotionVoiceMode(script, true), script, "Existing projects keep their default mode and audio signature");
  const cancelled = new AbortController();
  cancelled.abort();
  await assert.rejects(() => directMotionVoice(single, analysis, voices, { ...options, signal: cancelled.signal }), { name: "AbortError" });
  console.log("Voice attribution passed: channel locks, manual overrides, exact dialogue repair, explicit voice source, factual safety, silence ASR, narrator-only mode, cache isolation, mode switching and audio routing.");
} finally {
  assert.ok(root.startsWith(path.resolve("scratch") + path.sep));
  fs.rmSync(root, { recursive: true, force: true });
}
