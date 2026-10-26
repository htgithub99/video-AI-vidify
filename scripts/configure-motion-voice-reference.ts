import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { MOTION_VOICE_REFERENCE_SETUP as S } from "./motionVoiceReferenceTexts.js";
import { MOTION_VOICE_LIBRARY as L, MOTION_VOICE_SPEED as V } from "../src/constants/motionVoice.js";
import { runMotionAudioProcess } from "../src/server/services/motionSoundMixService.js";
import { measureVoiceSpeedAudio } from "../src/server/services/motionVoiceSpeedService.js";
import { motionVoiceLibraryFile, readVoiceChannels, saveVoiceChannel, updateVoiceMeta } from "../src/server/services/motionVoiceLibraryService.js";
import { registerVieneuVoice, listVieneuVoices, closeVieneuWorker, vieneuRoot } from "../src/server/services/vieneuTtsService.js";
const flag = (name: string): string => process.argv.find((arg) => arg.startsWith(name + S.EQUAL))?.slice(name.length + 1) || S.EMPTY;
const source = path.resolve(flag(S.SOURCE));
const id = flag(S.ID);
const channelId = flag(S.CHANNEL);
const start = Number(flag(S.START));
const seconds = Number(flag(S.SECONDS));
const measureStart = Number(flag(S.MEASURE_START));
const measureSeconds = Number(flag(S.MEASURE_SECONDS));
if (!fs.existsSync(source) || !fs.statSync(source).isFile() || !S.ID_RE.test(id) || !channelId || !Number.isFinite(start) || start < 0 || !Number.isFinite(seconds) || seconds < 3 || seconds > 25 || !Number.isFinite(measureStart) || measureStart < 0 || !Number.isFinite(measureSeconds) || measureSeconds < 30 || measureSeconds > 300) throw new Error(S.INVALID);
const channel = readVoiceChannels().channels.find((item) => item.id === channelId);
if (!channel) throw new Error(L.CHANNEL_NOT_FOUND);
const name = flag(S.NAME) || path.basename(source);
const root = path.resolve(flag(S.ROOT) || S.DEFAULT_ROOT);
fs.mkdirSync(root, { recursive: true });
const previous = new Map<string, Buffer | undefined>();
for (const file of [L.CHANNELS_FILE, L.LIBRARY_FILE, V.FILE, S.VOICES]) {
  const original = motionVoiceLibraryFile(file);
  const backup = path.join(root, file);
  if (fs.existsSync(original) && !fs.existsSync(backup)) fs.copyFileSync(original, backup);
  previous.set(original, fs.existsSync(original) ? fs.readFileSync(original) : undefined);
}
const reference = path.join(vieneuRoot(), S.REFERENCES, id + S.WAV);
previous.set(reference, fs.existsSync(reference) ? fs.readFileSync(reference) : undefined);
const measurement = path.join(root, S.MEASUREMENT);
fs.mkdirSync(path.dirname(reference), { recursive: true });
try {
  for (const [file, from, duration] of [
    [reference, start, seconds],
    [measurement, measureStart, measureSeconds],
  ] as const)
    await runMotionAudioProcess([S.SEEK, String(from), S.INPUT, source, S.DURATION, String(duration), S.CHANNELS, S.ONE, S.RATE, S.RATE_VALUE, S.CODEC, S.PCM, file]);
  const measured = await measureVoiceSpeedAudio(path.basename(source), fs.readFileSync(measurement).toString(S.BASE64));
  await registerVieneuVoice(id, name, S.MALE, reference);
  updateVoiceMeta(id, { name, gender: S.MALE, age: S.ADULT, speed: V.AUTO }, true);
  const settings = saveVoiceChannel({ ...channel, narratorVoiceId: id }, await listVieneuVoices());
  const manifest = { source, sourceHash: createHash(S.SHA256).update(fs.readFileSync(source)).digest(S.HEX), id, name, channelId, reference, sample: { start, seconds }, measurement: { start: measureStart, seconds: measureSeconds }, target: measured.target, channel: settings.channels.find((item) => item.id === channelId) };
  fs.writeFileSync(path.join(root, S.MANIFEST), JSON.stringify(manifest, null, 2));
  process.stdout.write(JSON.stringify(manifest) + S.NEWLINE);
} catch (error) {
  for (const [file, data] of previous)
    if (data) fs.writeFileSync(file, data);
    else fs.rmSync(file, { force: true });
  throw error;
} finally {
  closeVieneuWorker();
}
