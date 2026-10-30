import { parseJson } from "../../../../lib/jsonStringify.js";
import * as MR from "../../../../constants/motionRuntime.js";
import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { spawn } from "child_process";
import { MOTION_SOUND_CONFIG as C } from "../../../../constants/motionSound.js";
import { normalizeSoundCues } from "../../../../lib/motionSound.js";
import type { MotionSoundAsset, MotionSoundCue, MotionSoundOverride, MotionSoundSelection } from "../../../../types/motionVideo.js";
import { getFfmpegPath } from "../../../../server/services/shortsPreprocessService.js";
import { getMotionAudioDirectory } from "./motionLibraryService.js";
import { ensureMotionSfxLibrary, motionSfxRoot, resolveMotionSfxAsset, soundCandidates } from "./motionSfxLibraryService.js";
import { writeMotionJsonAtomic } from "./motionFileUtils.js";
import { motionAudioHash as hash, motionWavData } from "./motionAudioUtils.js";
const pending = new Map<string, Promise<string>>();
export const runMotionAudioProcess = (args: string[], signal?: AbortSignal): Promise<void> =>
  new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(new Error(C.FAILED));
    const child = spawn(getFfmpegPath(), [MR.MOTION_TEXT_Y, MR.MOTION_TEXT_HIDE_BANNER, MR.MOTION_TEXT_LOGLEVEL, MR.MOTION_TEXT_ERROR, ...args], { windowsHide: true });
    let errors: string = C.EMPTY;
    const stop = () => child.kill(MR.MOTION_TEXT_SIGKILL),
      timer = setTimeout(stop, C.PROCESS_TIMEOUT);
    signal?.addEventListener(MR.MOTION_TEXT_ABORT, stop, { once: true });
    child.stderr.on(MR.MOTION_TEXT_DATA, (chunk) => {
      errors = (errors + String(chunk)).slice(-C.MAX_BUFFER);
    });
    const clear = () => {
      clearTimeout(timer);
      signal?.removeEventListener(MR.MOTION_TEXT_ABORT, stop);
    };
    child.on(MR.MOTION_TEXT_ERROR, (error) => {
      clear();
      reject(error);
    });
    child.on(MR.MOTION_TEXT_CLOSE, (code) => {
      clear();
      code === 0 && !signal?.aborted ? resolve() : reject(new Error(errors || C.FAILED));
    });
  });
export const motionWavHeader = (bytes: number, channels: number = C.CHANNELS, sampleRate: number = C.SAMPLE_RATE): Buffer => {
  const header = Buffer.alloc(44);
  header.write(MR.MOTION_TEXT_RIFF);
  header.writeUInt32LE(bytes + 36, 4);
  header.write(MR.MOTION_TEXT_WAVE, 8);
  header.write(MR.MOTION_TEXT_FMT, 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * channels * 2, 28);
  header.writeUInt16LE(channels * 2, 32);
  header.writeUInt16LE(16, 34);
  header.write(MR.MOTION_TEXT_DATA, 36);
  header.writeUInt32LE(bytes, 40);
  return header;
};
interface DecodedSound {
  seconds: number;
  onset: number;
  transients: number[];
  gain: number;
}
const decodeSound = async (asset: MotionSoundAsset, signal?: AbortSignal): Promise<DecodedSound> => {
  const folder = path.join(motionSfxRoot(), C.DECODED),
    file = path.join(folder, asset.id + C.PCM),
    metadata = file + C.JSON;
  fs.mkdirSync(folder, { recursive: true });
  if (!fs.existsSync(file) || !fs.existsSync(metadata)) {
    const source = await resolveMotionSfxAsset(asset.id);
    if (!source) throw new Error(C.FAILED);
    const temporary = file + randomUUID();
    try {
      await runMotionAudioProcess([MR.MOTION_TEXT_I, source, MR.MOTION_TEXT_T, String(C.MAX_DECODE_SECONDS), MR.MOTION_TEXT_VN, MR.MOTION_TEXT_AR, String(C.SAMPLE_RATE), MR.MOTION_TEXT_AC, String(C.CHANNELS), MR.MOTION_TEXT_F, MR.MOTION_TEXT_F32LE, temporary], signal);
      const buffer = await fs.promises.readFile(temporary),
        samples = new Float32Array(buffer.buffer, buffer.byteOffset, Math.floor(buffer.length / 4));
      let peak = 0,
        energy = 0;
      const envelope: number[] = [],
        window = 480;
      for (let frame = 0; frame < samples.length / C.CHANNELS; frame += window) {
        let sum = 0,
          count = 0;
        for (let index = frame * C.CHANNELS; index < Math.min(samples.length, (frame + window) * C.CHANNELS); index++) {
          const sample = Number.isFinite(samples[index]) ? samples[index] : 0;
          peak = Math.max(peak, Math.abs(sample));
          sum += sample * sample;
          energy += sample * sample;
          count++;
        }
        envelope.push(Math.sqrt(sum / Math.max(1, count)));
      }
      if (!samples.length || peak < 0.0001) throw new Error(C.FAILED);
      const threshold = Math.max(0.001, peak * 0.025),
        first = envelope.findIndex((value) => value > threshold),
        onset = Math.max(0, first * 0.01 - 0.02),
        transients: number[] = [];
      for (let index = 1; index < envelope.length; index++) if (envelope[index] > threshold * 2 && envelope[index] > envelope[index - 1] * 1.8 && index * 0.01 - (transients[transients.length - 1] ?? -1) > 0.18) transients.push(Math.max(0, index * 0.01 - 0.015));
      const rms = Math.sqrt(energy / samples.length),
        gain = Math.min(4, 0.72 / peak, 0.16 / Math.max(0.001, rms));
      fs.renameSync(temporary, file);
      writeMotionJsonAtomic(metadata, { seconds: samples.length / C.CHANNELS / C.SAMPLE_RATE, onset, transients: transients.slice(0, 300), gain });
    } finally {
      await fs.promises.rm(temporary, { force: true }).catch(() => {});
    }
  }
  return parseJson(await fs.promises.readFile(metadata, C.UTF8));
};
const cachedAudio = async (id: string, task: (temporary: string) => Promise<void>): Promise<string> => {
  const output = path.join(getMotionAudioDirectory(), id);
  if (fs.existsSync(output) && fs.statSync(output).size > 44) return id;
  const running = pending.get(output);
  if (running) return running;
  const promise = (async () => {
    const temporary = output + randomUUID() + C.WAV;
    try {
      await task(temporary);
      fs.renameSync(temporary, output);
      return id;
    } finally {
      await fs.promises.rm(temporary, { force: true }).catch(() => {});
    }
  })();
  pending.set(output, promise);
  try {
    return await promise;
  } finally {
    pending.delete(output);
  }
};
export const buildMotionSoundTrack = async (duration: number, rawCues: unknown, overrides: Record<string, MotionSoundOverride> = {}, signal?: AbortSignal): Promise<{ sfxId?: string; selections: MotionSoundSelection[] }> => {
  const cues = normalizeSoundCues(rawCues, duration),
    assets = await ensureMotionSfxLibrary().catch(() => []),
    selections: MotionSoundSelection[] = [];
  const prepared: { cue: MotionSoundCue; asset: MotionSoundAsset; decoded: DecodedSound; offset: number; duration: number }[] = [],
    decoded = new Map<string, DecodedSound>();
  for (const original of cues) {
    if (signal?.aborted) throw new Error(C.FAILED);
    const override = overrides[original.id] || {},
      cue = { ...original, assetId: override.assetId || original.assetId, gainDb: Number.isFinite(override.gainDb) ? Math.max(-40, Math.min(0, override.gainDb!)) : original.gainDb };
    const candidates = soundCandidates(cue, assets, 6),
      alternatives = candidates.slice(0, 4).map(({ id, name, duration: seconds }) => ({ id, name, duration: seconds }));
    const variant = parseInt(hash(cue.id).slice(0, 8), 16),
      preferred = 0,
      ranked = candidates.length ? [candidates[preferred], ...candidates.filter((_, index) => index !== preferred)] : [];
    if (override.muted) {
      const asset = ranked[0];
      selections.push({ cue, alternatives, asset: asset ? { id: asset.id, name: asset.name, duration: asset.duration } : undefined, skipped: !asset });
      continue;
    }
    let chosen: MotionSoundAsset | undefined;
    for (const candidate of ranked) {
      try {
        let sound = decoded.get(candidate.id);
        if (!sound) {
          sound = await decodeSound(candidate, signal);
          decoded.set(candidate.id, sound);
        }
        const offset = cue.kind === MR.MOTION_TEXT_FOOTSTEP && sound.transients.length ? sound.transients[variant % sound.transients.length] : sound.onset;
        const length = cue.loop ? cue.duration : Math.min(cue.duration, Math.max(0, sound.seconds - offset));
        if (length < 0.02) continue;
        prepared.push({ cue, asset: candidate, decoded: sound, offset, duration: length });
        chosen = candidate;
        break;
      } catch {
        if (signal?.aborted) throw new Error(C.FAILED);
      }
    }
    selections.push({
      cue,
      alternatives: chosen ? [{ id: chosen.id, name: chosen.name, duration: chosen.duration }, ...alternatives.filter((item) => item.id !== chosen!.id)].slice(0, 4) : alternatives,
      asset: chosen ? { id: chosen.id, name: chosen.name, duration: chosen.duration } : undefined,
      previewStart: chosen ? prepared[prepared.length - 1].offset : undefined,
      previewDuration: chosen ? prepared[prepared.length - 1].duration : undefined,
      skipped: !chosen,
    });
  }
  if (!prepared.length) return { selections };
  const id = C.STEM_PREFIX + hash({ version: C.VERSION, duration, sounds: prepared.map((item) => ({ cue: item.cue, asset: item.asset.id, offset: item.offset })) }) + C.WAV;
  const sfxId = await cachedAudio(id, async (file) => {
    const frames = Math.ceil(duration * C.SAMPLE_RATE),
      handle = await fs.promises.open(file, MR.MOTION_TEXT_W),
      sampleCache = new Map<string, Float32Array>();
    try {
      await handle.write(motionWavHeader(frames * C.CHANNELS * 2));
      for (let frame = 0; frame < frames; frame += C.SAMPLE_RATE * C.CHUNK_SECONDS) {
        if (signal?.aborted) throw new Error(C.FAILED);
        const length = Math.min(frames - frame, C.SAMPLE_RATE * C.CHUNK_SECONDS),
          samples = new Float32Array(length * C.CHANNELS),
          first = frame / C.SAMPLE_RATE,
          last = (frame + length) / C.SAMPLE_RATE;
        for (const item of prepared.filter((sound) => sound.cue.t < last && sound.cue.t + sound.duration > first)) {
          let audioSamples = sampleCache.get(item.asset.id);
          if (!audioSamples) {
            const buffer = await fs.promises.readFile(path.join(motionSfxRoot(), C.DECODED, item.asset.id + C.PCM));
            audioSamples = new Float32Array(buffer.buffer, buffer.byteOffset, Math.floor(buffer.length / 4));
            sampleCache.set(item.asset.id, audioSamples);
            if (sampleCache.size > 6) sampleCache.delete(sampleCache.keys().next().value!);
          }
          const { cue, decoded: sound } = item,
            begin = Math.max(frame, Math.round(cue.t * C.SAMPLE_RATE)),
            end = Math.min(frame + length, Math.round((cue.t + item.duration) * C.SAMPLE_RATE)),
            pan = Math.max(-1, Math.min(1, cue.pan || 0));
          const gain = sound.gain * Math.pow(10, (cue.gainDb ?? C.BASE_GAIN[cue.layer]) / 20),
            left = Math.sqrt((1 - pan) / 2) * gain,
            right = Math.sqrt((1 + pan) / 2) * gain;
          const available = Math.max(1, Math.floor((sound.seconds - item.offset) * C.SAMPLE_RATE)),
            cross = cue.loop ? Math.min(2400, Math.floor(available / 8)) : 0,
            period = Math.max(1, available - cross);
          for (let index = begin; index < end; index++) {
            const local = index - Math.round(cue.t * C.SAMPLE_RATE),
              elapsed = local / C.SAMPLE_RATE,
              fade = Math.min(1, elapsed / (cue.loop ? 0.5 : 0.005), (item.duration - elapsed) / (cue.loop ? 0.6 : 0.02));
            const sourceFrame = (cue.loop ? local % period : local) + Math.round(item.offset * C.SAMPLE_RATE),
              destination = (index - frame) * C.CHANNELS;
            for (let channel = 0; channel < C.CHANNELS; channel++) {
              let value = audioSamples[sourceFrame * C.CHANNELS + channel] || 0;
              if (cross && local >= period && local % period < cross) {
                const position = local % period,
                  mix = position / cross;
                value = value * mix + (audioSamples[(Math.round(item.offset * C.SAMPLE_RATE) + period + position) * C.CHANNELS + channel] || 0) * (1 - mix);
              }
              samples[destination + channel] += value * (channel ? right : left) * Math.max(0, fade);
            }
          }
        }
        const buffer = Buffer.alloc(samples.length * 2);
        for (let index = 0; index < samples.length; index++) buffer.writeInt16LE(Math.round(Math.max(-0.95, Math.min(0.95, samples[index])) * 32767), index * 2);
        await handle.write(buffer);
      }
    } finally {
      await handle.close();
    }
  });
  return { sfxId, selections };
};
export const motionAudioMixGraph = (hasVoice: boolean, hasSfx: boolean, duration: number, voiceVolume = 1, sfxVolume = 0.5): string => {
  const tail = MR.MOTION_TEMPLATE_APAD_ATRIM_DURATION_AFADE_T_OUT_ST_D_0_6_ALIMITER_LIMIT_0_89(duration.toFixed(3), Math.max(0, duration - 0.6).toFixed(3));
  if (hasVoice && hasSfx) return MR.MOTION_TEMPLATE_0_A_ARESAMPLE_48000_AFORMAT_CHANNEL_LAYOUTS_STEREO_VOLUME_AP(voiceVolume, sfxVolume, tail);
  return MR.MOTION_TEMPLATE_0_A_ARESAMPLE_48000_AFORMAT_CHANNEL_LAYOUTS_STEREO_VOLUME_MI(hasVoice ? voiceVolume : sfxVolume, tail);
};
const sfxMakeupGain = async (file: string): Promise<number> => {
  const wav = await fs.promises.readFile(file),
    { start } = motionWavData(wav),
    window = Math.max(1, Math.round(C.SFX_WINDOW_SECONDS * C.SAMPLE_RATE)) * C.CHANNELS,
    floor = Math.pow(10, C.SFX_ACTIVE_FLOOR_DB / 10);
  let energy = 0,
    windows = 0;
  for (let index = start; index + window * 2 <= wav.length; index += window * 2) {
    let sum = 0;
    for (let sample = 0; sample < window; sample++) {
      const value = wav.readInt16LE(index + sample * 2) / 32768;
      sum += value * value;
    }
    const mean = sum / window;
    if (mean > floor) {
      energy += mean;
      windows++;
    }
  }
  if (!windows) return 1;
  const level = 10 * Math.log10(energy / windows);
  return Math.pow(10, Math.max(0, Math.min(C.SFX_MAKEUP_MAX_DB, C.SFX_TARGET_DB - level)) / 20);
};
export const mixMotionSoundAudio = async (duration: number, voiceId?: string, sfxId?: string, sfxVolume = 0.5, voiceVolume = 1, signal?: AbortSignal): Promise<string | undefined> => {
  const folder = getMotionAudioDirectory(),
    voice = voiceId ? path.join(folder, path.basename(voiceId)) : C.EMPTY,
    sfx = sfxId ? path.join(folder, path.basename(sfxId)) : C.EMPTY;
  const hasVoice = !!voice && fs.existsSync(voice),
    hasSfx = !!sfx && fs.existsSync(sfx);
  if (!hasVoice && !hasSfx) return undefined;
  const volume = Math.max(0, Math.min(1.5, Number(sfxVolume) || 0)) * C.SFX_MIX_GAIN * (hasSfx ? await sfxMakeupGain(sfx) : 1),
    voiceGain = Math.max(0, Math.min(2, Number(voiceVolume) || 0));
  const signature = (file: string) => {
    const stat = fs.statSync(file);
    return [path.basename(file), stat.size, stat.mtimeMs];
  };
  const id = C.MIX_PREFIX + hash({ version: C.VERSION, mix: C.MIX_VERSION, duration, voice: hasVoice ? signature(voice) : undefined, sfx: hasSfx ? signature(sfx) : undefined, volume, voiceGain }) + C.WAV;
  return cachedAudio(id, async (file) => {
    await runMotionAudioProcess(
      [
        ...(hasVoice ? [MR.MOTION_TEXT_I, voice] : []),
        ...(hasSfx ? [MR.MOTION_TEXT_I, sfx] : []),
        MR.MOTION_TEXT_FILTER_COMPLEX,
        motionAudioMixGraph(hasVoice, hasSfx, duration, voiceGain, volume),
        MR.MOTION_TEXT_MAP_2,
        MR.MOTION_TEXT_MIXED_2,
        MR.MOTION_TEXT_AR,
        String(C.SAMPLE_RATE),
        MR.MOTION_TEXT_AC,
        String(C.CHANNELS),
        MR.MOTION_TEXT_C_A,
        MR.MOTION_TEXT_PCM_S16LE,
        MR.MOTION_TEXT_T,
        duration.toFixed(3),
        file,
      ],
      signal,
    );
  });
};
export const motionSoundAudition = async (assetId: string, start: number, duration: number): Promise<string | undefined> => {
  const asset = (await ensureMotionSfxLibrary()).find((item) => item.id === assetId);
  if (!asset) return undefined;
  const sound = await decodeSound(asset),
    offset = Math.max(0, Math.min(sound.seconds - 0.02, Number.isFinite(start) ? start : sound.onset)),
    seconds = Math.max(0.02, Math.min(8, sound.seconds - offset, Number.isFinite(duration) ? duration : 3));
  const id = C.AUDITION_PREFIX + hash({ version: C.VERSION, assetId, offset, seconds }) + C.WAV;
  return cachedAudio(id, async (file) => {
    const handle = await fs.promises.open(path.join(motionSfxRoot(), C.DECODED, asset.id + C.PCM), MR.MOTION_TEXT_R_2),
      samples = Buffer.alloc(Math.ceil(seconds * C.SAMPLE_RATE) * C.CHANNELS * 4);
    try {
      const read = await handle.read(samples, 0, samples.length, Math.round(offset * C.SAMPLE_RATE) * C.CHANNELS * 4),
        wave = Buffer.alloc(read.bytesRead / 2);
      for (let index = 0; index < read.bytesRead / 4; index++) wave.writeInt16LE(Math.round(Math.max(-0.95, Math.min(0.95, samples.readFloatLE(index * 4) * sound.gain)) * 32767), index * 2);
      await fs.promises.writeFile(file, Buffer.concat([motionWavHeader(wave.length), wave]));
    } finally {
      await handle.close();
    }
  });
};
