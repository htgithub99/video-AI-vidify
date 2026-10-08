import { spawn } from "child_process";
import { createHash, randomUUID } from "crypto";
import fs from "fs";
import _ from "lodash";
import path from "path";
import { MOTION_SFX_MOODS, MOTION_SFX_SPARKLE_NOTES } from "../../constants/motionGenres.js";
import {
  MOTION_TEMPLATE_BEAT_LOI_GIONG_THU_LAI,
  MOTION_TEMPLATE_FFMPEG,
  MOTION_TEMPLATE_PCM,
  MOTION_TEMPLATE_SFX_WAV,
  MOTION_TEMPLATE_SYMBOL_12,
  MOTION_TEMPLATE_SYMBOL_14,
  MOTION_TEMPLATE_VOICE_WAV,
  MOTION_TEXT_1,
  MOTION_TEXT_ABORT,
  MOTION_TEXT_ABORTED,
  MOTION_TEXT_AC,
  MOTION_TEXT_AF,
  MOTION_TEXT_AR,
  MOTION_TEXT_CHAPTER,
  MOTION_TEXT_CHIME,
  MOTION_TEXT_CLOSE,
  MOTION_TEXT_DARK,
  MOTION_TEXT_DATA,
  MOTION_TEXT_ERROR,
  MOTION_TEXT_F,
  MOTION_TEXT_FMT,
  MOTION_TEXT_HEX,
  MOTION_TEXT_HIDE_BANNER,
  MOTION_TEXT_HIT,
  MOTION_TEXT_I,
  MOTION_TEXT_LOGLEVEL,
  MOTION_TEXT_MESSAGE,
  MOTION_TEXT_PIPE_0,
  MOTION_TEXT_PIPE_1,
  MOTION_TEXT_RIFF,
  MOTION_TEXT_S16LE,
  MOTION_TEXT_SHA1,
  MOTION_TEXT_SIGKILL,
  MOTION_TEXT_SILENCEREMOVE_START_PERIODS_1_START_THRESHOLD_48DB_START,
  MOTION_TEXT_SYMBOL_13,
  MOTION_TEXT_TTS_CACHE,
  MOTION_TEXT_W,
  MOTION_TEXT_WARM,
  MOTION_TEXT_WAVE,
} from "../../constants/motionRuntime.js";
import { MOTION_STORY_CONFIG } from "../../constants/motionVideo.js";
import type { MotionBeat, MotionVoiceTrack } from "../../types/motionVideo.js";
import { synthesizeAi33Speech } from "./ai33TtsService.js";
import { computeBeatTimeline } from "./motionDirectorService.js";
import { getMotionAudioDirectory, getMotionRootDirectory } from "./motionLibraryService.js";
import { getFfmpegPath } from "./shortsPreprocessService.js";
const SR = 44100;
const BYTES_PER_SAMPLE = 2;
const decodeToPcm = (input: string | Buffer, filter?: string, signal?: AbortSignal): Promise<Buffer> =>
  new Promise((resolve, reject) => {
    const args = [MOTION_TEXT_HIDE_BANNER, MOTION_TEXT_LOGLEVEL, MOTION_TEXT_ERROR, MOTION_TEXT_I, Buffer.isBuffer(input) ? MOTION_TEXT_PIPE_0 : input, ...(filter ? [MOTION_TEXT_AF, filter] : []), MOTION_TEXT_AC, MOTION_TEXT_1, MOTION_TEXT_AR, String(SR), MOTION_TEXT_F, MOTION_TEXT_S16LE, MOTION_TEXT_PIPE_1];
    const child = spawn(getFfmpegPath(), args, { windowsHide: true });
    const chunks: Buffer[] = [];
    let err = "";
    const onAbort = () => child.kill(MOTION_TEXT_SIGKILL);
    signal?.addEventListener(MOTION_TEXT_ABORT, onAbort, { once: true });
    child.stdout.on(MOTION_TEXT_DATA, (d: Buffer) => chunks.push(d));
    child.stderr.on(MOTION_TEXT_DATA, (d: Buffer) => (err = `${err}${d}`.slice(-2000)));
    child.on(MOTION_TEXT_ERROR, reject);
    child.on(MOTION_TEXT_CLOSE, (code) => {
      signal?.removeEventListener(MOTION_TEXT_ABORT, onAbort);
      if (signal?.aborted) return reject(new Error(MOTION_TEXT_ABORTED));
      if (code !== 0) return reject(new Error(_.trim(err) || MOTION_TEMPLATE_FFMPEG(`${code}`)));
      resolve(Buffer.concat(chunks));
    });
    child.stdin.on(MOTION_TEXT_ERROR, _.noop);
    if (Buffer.isBuffer(input)) child.stdin.end(input);
    else child.stdin.end();
  });
const wavHeader = (dataBytes: number): Buffer => {
  const h = Buffer.alloc(44);
  h.write(MOTION_TEXT_RIFF, 0);
  h.writeUInt32LE(36 + dataBytes, 4);
  h.write(MOTION_TEXT_WAVE, 8);
  h.write(MOTION_TEXT_FMT, 12);
  h.writeUInt32LE(16, 16);
  h.writeUInt16LE(1, 20);
  h.writeUInt16LE(1, 22);
  h.writeUInt32LE(SR, 24);
  h.writeUInt32LE(SR * BYTES_PER_SAMPLE, 28);
  h.writeUInt16LE(BYTES_PER_SAMPLE, 32);
  h.writeUInt16LE(16, 34);
  h.write(MOTION_TEXT_DATA, 36);
  h.writeUInt32LE(dataBytes, 40);
  return h;
};
const TRIM_FILTER = MOTION_TEXT_SILENCEREMOVE_START_PERIODS_1_START_THRESHOLD_48DB_START;
const ttsCacheDir = (): string => {
  const dir = path.join(getMotionRootDirectory(), MOTION_TEXT_TTS_CACHE);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
};
const splitForTts = (text: string, max: number): string[] => {
  if (text.length <= max) return [text];
  const sentences = _.compact(_.map(text.match(/[^.!?…]+[.!?…]*/g) || [text], _.trim));
  const out: string[] = [];
  let cur = "";
  for (const s of sentences) {
    if ((cur + MOTION_TEXT_SYMBOL_13 + s).length > max && cur) {
      out.push(cur.trim());
      cur = s;
    } else cur = MOTION_TEMPLATE_SYMBOL_12(`${cur}`, `${s}`);
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
};
const beatPcm = async (beat: MotionBeat, voiceId: string, speed: number, signal?: AbortSignal): Promise<Buffer> => {
  const key = createHash(MOTION_TEXT_SHA1)
    .update(MOTION_TEMPLATE_SYMBOL_14(`${voiceId}`, `${speed}`, `${beat.narration}`))
    .digest(MOTION_TEXT_HEX)
    .slice(0, 20);
  const cached = path.join(ttsCacheDir(), MOTION_TEMPLATE_PCM(`${key}`));
  if (fs.existsSync(cached)) return fs.promises.readFile(cached);
  const parts = splitForTts(beat.narration, MOTION_STORY_CONFIG.TTS_MAX_CHARS);
  const pcms: Buffer[] = [];
  for (const part of parts) {
    const r = await synthesizeAi33Speech({ text: part, voiceId, speed, signal });
    pcms.push(await decodeToPcm(r.buffer, TRIM_FILTER, signal));
    if (parts.length > 1) pcms.push(Buffer.alloc(Math.round(SR * 0.25) * BYTES_PER_SAMPLE));
  }
  const pcm = Buffer.concat(pcms);
  await fs.promises.writeFile(cached, pcm);
  return pcm;
};
export const buildAi33VoiceTrack = async (beats: MotionBeat[], opts: { voiceId: string; speed?: number; signal?: AbortSignal; onProgress?: (done: number, total: number) => void; log?: (s: string) => void }): Promise<MotionVoiceTrack & { characters: number }> => {
  const speed = _.clamp(_.toNumber(opts.speed) || 1, 0.7, 1.3);
  const pcms: Buffer[] = new Array(beats.length);
  let done = 0;
  let next = 0;
  const worker = async () => {
    while (next < beats.length) {
      const i = next++;
      if (opts.signal?.aborted) throw new Error(MOTION_TEXT_ABORTED);
      let lastErr: unknown;
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          pcms[i] = await beatPcm(beats[i], opts.voiceId, speed, opts.signal);
          lastErr = null;
          break;
        } catch (e) {
          if (opts.signal?.aborted) throw e;
          lastErr = e;
          opts.log?.(MOTION_TEMPLATE_BEAT_LOI_GIONG_THU_LAI(`${i + 1}`, `${_.truncate(_.toString(_.get(e, MOTION_TEXT_MESSAGE, e)), { length: 90 })}`));
          await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)));
        }
      }
      if (lastErr) throw lastErr;
      done++;
      opts.onProgress?.(done, beats.length);
    }
  };
  await Promise.all(_.times(Math.min(MOTION_STORY_CONFIG.TTS_CONCURRENCY, beats.length), worker));
  const durations = _.map(pcms, (b) => b.length / BYTES_PER_SAMPLE / SR);
  const audioId = await writeVoiceTrack(beats, pcms, durations);
  const { total } = computeBeatTimeline(beats, durations);
  return { audioId, voiceId: opts.voiceId, durations, totalSeconds: total, characters: _.sumBy(beats, (b) => b.narration.length) };
};
const writeVoiceTrack = async (beats: MotionBeat[], pcms: Buffer[], durations: number[]): Promise<string> => {
  const { starts } = computeBeatTimeline(beats, durations);
  const id = MOTION_TEMPLATE_VOICE_WAV(`${randomUUID().slice(0, 8)}`);
  const file = path.join(getMotionAudioDirectory(), id);
  const totalSamples = Math.ceil(((_.last(starts) || 0) + (_.last(durations) || 0) + 0.5) * SR);
  const fd = await fs.promises.open(file, MOTION_TEXT_W);
  try {
    await fd.write(wavHeader(totalSamples * BYTES_PER_SAMPLE), 0, 44, 0);
    let written = 0;
    const silence = Buffer.alloc(SR * BYTES_PER_SAMPLE);
    const pad = async (samples: number) => {
      while (samples > 0) {
        const n = Math.min(samples, SR);
        await fd.write(silence, 0, n * BYTES_PER_SAMPLE, 44 + written * BYTES_PER_SAMPLE);
        written += n;
        samples -= n;
      }
    };
    for (let i = 0; i < pcms.length; i++) {
      const target = Math.round(starts[i] * SR);
      if (target > written) await pad(target - written);
      await fd.write(pcms[i], 0, pcms[i].length, 44 + written * BYTES_PER_SAMPLE);
      written += pcms[i].length / BYTES_PER_SAMPLE;
    }
    if (totalSamples > written) await pad(totalSamples - written);
  } finally {
    await fd.close();
  }
  return id;
};
export const fitUploadedVoice = (beats: MotionBeat[], estimates: number[], audioSeconds: number): number[] => {
  const { total } = computeBeatTimeline(beats, estimates);
  const speech = _.sum(estimates);
  const overhead = total - speech - MOTION_STORY_CONFIG.TAIL_SECONDS;
  const k = Math.max(0.3, (audioSeconds - overhead) / Math.max(1, speech));
  return _.map(estimates, (e) => e * k);
};
export const buildSfxTrack = async (durationSeconds: number, cues: { t: number; kind: string }[], mood: string = MOTION_TEXT_DARK): Promise<string> => {
  const n = Math.ceil(durationSeconds * SR);
  const out = new Float32Array(n);
  const M = MOTION_SFX_MOODS[mood] || MOTION_SFX_MOODS[mood === MOTION_TEXT_WARM ? MOTION_TEXT_WARM : MOTION_TEXT_DARK];
  const { root, chord } = M;
  let wind = 0;
  let seed = 12345;
  const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff) * 2 - 1;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const fade = Math.min(1, t / 4) * Math.min(1, (durationSeconds - t) / 4);
    const swell = 0.75 + 0.25 * Math.sin((2 * Math.PI * t) / M.swell);
    let v = 0.018 * Math.sin(2 * Math.PI * root * t);
    v += 0.008 * Math.sin(2 * Math.PI * root * 2 * chord[1] * t + Math.sin(t * 0.3));
    v += 0.006 * Math.sin(2 * Math.PI * root * 2 * chord[2] * t + 1.3);
    if (M.shimmer) v += M.shimmer * Math.sin(2 * Math.PI * root * 16 * chord[2] * t) * (0.5 + 0.5 * Math.sin(t * 0.41));
    if (M.noise) {
      wind += (rnd() - wind) * 0.02;
      v += M.noise * wind * 6 * (0.6 + 0.4 * Math.sin(t * 0.17 + 1));
    }
    if (M.pulse && M.pulseFreq) {
      const ph = (t * M.pulseFreq) % 1;
      v += M.pulse * Math.exp(-ph * 14) * Math.sin(2 * Math.PI * root * 0.9 * ph * 3);
    }
    out[i] = v * fade * swell * M.gain;
  }
  const addHit = (t0: number, f: number, len: number, gain: number) => {
    const i0 = Math.max(0, Math.round(t0 * SR));
    const m = Math.min(n - i0, Math.round(len * SR));
    for (let k = 0; k < m; k++) {
      const tt = k / SR;
      const env = Math.min(1, tt / 0.012) * Math.exp(-tt * 1.7);
      const pitch = f * (1 + 0.35 * Math.exp(-tt * 9));
      out[i0 + k] += gain * env * (Math.sin(2 * Math.PI * pitch * tt) + 0.3 * Math.sin(2 * Math.PI * pitch * 2.01 * tt) * Math.exp(-tt * 4));
    }
  };
  const addChime = (t0: number, f: number, gain: number) => {
    const i0 = Math.max(0, Math.round(t0 * SR));
    const m = Math.min(n - i0, Math.round(3 * SR));
    for (let k = 0; k < m; k++) {
      const tt = k / SR;
      const env = Math.min(1, tt / 0.005) * Math.exp(-tt * 1.4);
      out[i0 + k] += gain * env * (Math.sin(2 * Math.PI * f * tt) + 0.4 * Math.sin(2 * Math.PI * f * 2.76 * tt) * Math.exp(-tt * 3));
    }
  };
  for (const c of cues) {
    if (c.kind === MOTION_TEXT_CHAPTER) addHit(c.t, M.hitFreq, 2.6, 0.32);
    else if (c.kind === MOTION_TEXT_HIT) addHit(c.t - 0.05, M.hitFreq + 2, 2.2, 0.26);
    else if (c.kind === MOTION_TEXT_CHIME) addChime(c.t, 523.25, 0.06);
  }
  if (M.sparkle) for (let t = 6, k = 0; t < durationSeconds - 6; t += 7.5, k++) addChime(t, MOTION_SFX_SPARKLE_NOTES[(k * 3) % MOTION_SFX_SPARKLE_NOTES.length], M.sparkle);
  addChime(Math.max(0, durationSeconds - 3.2), M.endChime, 0.05);
  let peak = 0;
  for (let i = 0; i < n; i++) peak = Math.max(peak, Math.abs(out[i]));
  const norm = peak > 0 ? 0.45 / peak : 1;
  const pcm = Buffer.alloc(n * BYTES_PER_SAMPLE);
  for (let i = 0; i < n; i++) pcm.writeInt16LE(Math.max(-32767, Math.min(32767, Math.round(out[i] * norm * 32767))), i * BYTES_PER_SAMPLE);
  const id = MOTION_TEMPLATE_SFX_WAV(`${randomUUID().slice(0, 8)}`);
  await fs.promises.writeFile(path.join(getMotionAudioDirectory(), id), Buffer.concat([wavHeader(pcm.length), pcm]));
  return id;
};
