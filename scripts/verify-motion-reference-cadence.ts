import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
delete process.env.APP_DATA_DIR;
const directory = path.resolve("scratch/reference-cadence-check-" + randomUUID());
process.env.VIDIFY_STORAGE_DIR = directory;
const { buildMotionVoiceTrack, readMotionVoiceTrack } = await import("../src/features/motion/server/services/motionAudioService.ts");
const { motionWavHeader } = await import("../src/features/motion/server/services/motionSoundMixService.ts");
const { motionVoiceLibraryFile, updateVoiceMeta } = await import("../src/features/motion/server/services/motionVoiceLibraryService.ts");
const { inspectVoiceCadence, referenceCadenceProfile } = await import("../src/features/motion/server/services/motionVoiceCadenceService.ts");
const { getMotionAudioDirectory } = await import("../src/features/motion/server/services/motionLibraryService.ts");
const { voicePauses } = await import("../src/features/motion/server/services/motionVoicePaceService.ts");
const voiceId = "reference-cadence-test";
const target = { rate: 3.633, rateBasis: "text", pauses: { clause: 0.46, sentence: 0.58, suspense: 0.67, beat: 0.77, articulation: 5.18 }, speechRatio: 0.702 };
const texts = ["Tôi đi qua sân, thấy anh vẫn đứng ở đó, rồi quay vào trong nhà.", "Tôi nhìn quanh sân. Tôi nghe tiếng chân ngoài cửa, rồi vội trở vào nhà.", "Tôi đứng ngoài sân chờ anh trở về nhà giữa một đêm mưa lạnh.", "Đêm xuống."];
function speech(text: string, rate: number) {
  const words = text.split(/\s+/);
  const samples: number[] = [];
  const quiet = (seconds: number) => {
    for (let i = 0; i < Math.round(48000 * seconds); i++) samples.push(0);
  };
  quiet(0.6);
  for (const word of words) {
    const duration = 1 / rate;
    for (let i = 0; i < Math.round(48000 * duration); i++) {
      const envelope = Math.sin((Math.PI * i) / (48000 * duration));
      samples.push(Math.round(envelope * (6000 * Math.sin((2 * Math.PI * 220 * i) / 48000) + 2300 * Math.sin((2 * Math.PI * 870 * i) / 48000))));
    }
    quiet(word.endsWith(",") ? 0.18 : word.endsWith(".") ? 0.22 : word === "nghe" ? 0.18 : 0.025);
  }
  quiet(0.8);
  const pcm = Buffer.alloc(samples.length * 2);
  samples.forEach((value, i) => pcm.writeInt16LE(value, i * 2));
  return Buffer.concat([motionWavHeader(pcm.length, 1), pcm]);
}
let calls = 0;
const rates = [4.8, 6.2, 5.3, 5];
const raw = texts.map((text, i) => speech(text, rates[i]));
const script: any = { title: "Nhịp người kể", language: "vi", beats: texts.map((text, i) => ({ id: "b" + i, chapterId: "c1", visual: "scene", narration: text, utterances: [{ id: "u" + i, speaker: "narrator", role: "narration", text, emotion: "neutral", speed: i % 2 ? 0.85 : 1.15, pauseBefore: 0, pauseAfter: 0 }] })) };
const options: any = {
  exec: {},
  asr: false,
  ai: async () => {
    throw new Error("Không gọi AI để cân nhịp");
  },
};
const deps: any = {
  voices: async () => [{ id: voiceId, name: "Giọng thử", gender: "male" }],
  synthesize: async (text: string, _id: string, file: string) => {
    calls++;
    fs.writeFileSync(file, raw[texts.indexOf(text)]);
  },
};
try {
  const settingsFile = motionVoiceLibraryFile("voice-speed.json");
  fs.mkdirSync(path.dirname(settingsFile), { recursive: true });
  fs.writeFileSync(settingsFile, JSON.stringify({ target, correction: 1, rates: { [voiceId]: 3.3 } }));
  assert.equal(referenceCadenceProfile({ ...target, rateBasis: "acoustic" } as any), undefined, "Không trộn đơn vị acoustic và văn bản");
  const settingsBefore = fs.readFileSync(settingsFile, "utf8");
  const track = await buildMotionVoiceTrack(script, { genre: "truyện ma", cast: [] } as any, options, deps);
  assert.equal(calls, texts.length, "Một lượt TTS cho mỗi câu; không gọi lại để cân nhịp");
  assert.equal(fs.readFileSync(settingsFile, "utf8"), settingsBefore, "Không học lại chuẩn từ đoạn đọc hoặc khoảng lặng");
  const measured = track.clips!.slice(0, 3);
  assert.ok(
    measured.every((clip) => clip.cadence && !clip.cadence.limited),
    JSON.stringify(measured.map((clip) => clip.cadence)),
  );
  for (const clip of measured) {
    const wav = fs.readFileSync(path.join(getMotionAudioDirectory(), clip.audioId));
    const measured = inspectVoiceCadence(wav, clip.text)!;
    assert.ok(Math.abs(measured.articulation / target.pauses.articulation - 1) < 0.025, "Đo lại sau cắt/ghép phải gần chuẩn");
    assert.ok(clip.end > clip.start && clip.end <= track.totalSeconds);
    assert.ok(track.subtitles!.some((sub) => sub.start === clip.start && sub.end === clip.end));
  }
  assert.ok(measured[0].cadence!.tempo > 1 && measured[1].cadence!.tempo < 1, "Phải điều chỉnh cả đoạn chậm lẫn đoạn nhanh");
  assert.equal(track.clips![3].cadence, undefined, "Câu quá ngắn dùng tốc độ dự phòng");
  const { decodeVoicePcm } = await import("../src/features/motion/server/services/motionVoicePaceService.ts");
  const decoded = await decodeVoicePcm(path.join(getMotionAudioDirectory(), measured[0].audioId));
  const pauses = voicePauses(decoded, 0.3).pauses.filter((p) => p.at > 0 && p.at + p.d < decoded.length / 16000 - 0.01);
  assert.equal(pauses.length, 2);
  assert.ok(
    pauses.every((p) => Math.abs(p.d - target.pauses.clause) < 0.06),
    "Đổi tốc độ phát âm không làm ngắn dấu phẩy",
  );
  const mixed = await decodeVoicePcm(path.join(getMotionAudioDirectory(), measured[1].audioId));
  const mixedPauses = voicePauses(mixed, 0.12).pauses.filter((p) => p.at > 0 && p.at + p.d < mixed.length / 16000 - 0.01);
  assert.ok(
    mixedPauses.some((p) => Math.abs(p.d - target.pauses.sentence) < 0.06),
    "Short sentence pause must be restored to the sentence target",
  );
  assert.ok(
    mixedPauses.some((p) => Math.abs(p.d - target.pauses.clause) < 0.06),
    "Comma has its own shorter target",
  );
  assert.ok(
    mixedPauses.some((p) => p.d < 0.3),
    "Unmarked breaths remain natural, not converted into punctuation",
  );
  assert.equal(measured[1].cadence!.pausesMatched, 2);
  await buildMotionVoiceTrack(script, { genre: "truyện ma", cast: [] } as any, options, deps);
  assert.equal(calls, texts.length, "Dùng lại audio đã đạt");
  fs.writeFileSync(settingsFile, JSON.stringify({ target: { ...target, pauses: { ...target.pauses, articulation: 5.5 } }, correction: 1, rates: { [voiceId]: 3.3 } }));
  assert.equal(readMotionVoiceTrack(track.audioId, script, { genre: "truyện ma", cast: [] } as any), undefined, "Đổi nhịp mẫu phải bỏ cache xử lý cũ");
  updateVoiceMeta(voiceId, { speed: 0.9 });
  const manual = await buildMotionVoiceTrack(script, { genre: "truyện ma", cast: [] } as any, options, deps);
  assert.ok(
    manual.clips!.every((clip) => !clip.cadence),
    "Giữ lựa chọn tốc độ thủ công",
  );
  assert.equal(calls, texts.length, "Đổi cách xử lý vẫn dùng TTS gốc");
  console.log("Reference cadence passed: varying TTS speeds, speech/pause separation, short-line fallback, subtitles, cache and manual speed.");
} finally {
  const resolved = path.resolve(directory);
  assert.ok(resolved.startsWith(path.resolve("scratch") + path.sep));
  fs.rmSync(resolved, { recursive: true, force: true });
}
