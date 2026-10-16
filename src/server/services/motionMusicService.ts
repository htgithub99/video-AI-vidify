import * as MR from "../../constants/motionRuntime.js";
import fs from "fs";
import path from "path";
import _ from "lodash";
import { randomUUID } from "crypto";
import { MOTION_MUSIC as M, MOTION_MUSIC_AMBIENCE, MOTION_MUSIC_INSTRUMENTS, MOTION_MUSIC_LEAD_SECONDS, MOTION_MUSIC_MOODS, MOTION_MUSIC_PAD_SHAPES, MOTION_MUSIC_SCALES, MOTION_MUSIC_VOICES as MV, type MotionMusicInstrument, type MotionMusicMood } from "../../constants/motionMusic.js";
import type { MotionMusicSegment, MotionSpec, MotionStoryAnalysis } from "../../types/motionVideo.js";
import { getMotionAudioDirectory } from "./motionLibraryService.js";
import { runMotionAudioProcess, motionWavHeader } from "./motionSoundMixService.js";
import { motionAudioHash as hash } from "./motionAudioUtils.js";
import { motionMusicMoodKey } from "../../lib/motionMusic.js";
interface MotionStereoAudio { left: Float32Array; right: Float32Array; rate: number; }
export const motionMusicMood = (analysis: MotionStoryAnalysis | null | undefined, wanted?: string): string => {
  return motionMusicMoodKey(wanted) || motionMusicMoodKey(analysis?.musicMood) || M.GENRE_MOOD[_.toString(analysis?.videoGenre)] || M.SFX_MOOD[_.toString(analysis?.sfxMood)] || M.DEFAULT_MOOD;
};
export const motionMusicSegments = (analysis: MotionStoryAnalysis | null | undefined, beats: { chapterId: string }[], starts: number[]): MotionMusicSegment[] => {
  const base = motionMusicMood(analysis);
  const out: MotionMusicSegment[] = [{ start: 0, mood: base }];
  for (const chapter of analysis?.chapters || []) {
    const index = _.findIndex(beats, (beat) => beat.chapterId === chapter.id);
    if (index < 0) continue;
    const mood = motionMusicMoodKey(chapter.musicMood) || base;
    const at = index === 0 ? 0 : +starts[index].toFixed(2);
    if (at === 0) out[0].mood = mood;
    else if (_.last(out)!.mood !== mood) out.push({ start: at, mood });
  }
  return out;
};
export const motionMusicCues = (spec: MotionSpec): number[] =>
  _.uniq(
    _.map(
      _.filter(spec.shots, (shot) => _.includes(M.CUE_TEMPLATES as readonly string[], shot.template) && shot.start > 0),
      (shot) => +shot.start.toFixed(2),
    ),
  );
const rng = (seed: number) => () => {
  seed = (seed * 16807) % 2147483647;
  return seed / 2147483647;
};
const midiHz = (note: number): number => 440 * Math.pow(2, (note - 69) / 12);
const tables: Record<string, Float32Array> = {};
const tableOf = (shape: string): Float32Array => {
  if (tables[shape]) return tables[shape];
  const partials = MOTION_MUSIC_PAD_SHAPES[shape] || M.PAD_PARTIALS;
  const out = new Float32Array(M.TABLE_SIZE);
  const norm = _.sum(partials);
  for (let i = 0; i < M.TABLE_SIZE; i++) out[i] = partials.reduce((sum, amp, k) => sum + amp * Math.sin((2 * Math.PI * (k + 1) * i) / M.TABLE_SIZE), 0) / norm;
  tables[shape] = out;
  return out;
};
const withInstrument = (mood: MotionMusicMood, inst: MotionMusicInstrument): MotionMusicMood => ({
  ...mood,
  scale: inst.pentatonic ? (_.includes(mood.scale, MOTION_MUSIC_SCALES.MINOR_THIRD) ? MOTION_MUSIC_SCALES.MINOR_PENTATONIC : MOTION_MUSIC_SCALES.MAJOR_PENTATONIC) : mood.scale,
  bpm: mood.bpm * inst.bpmScale,
  brightness: mood.brightness * inst.brightness,
  pad: mood.pad * inst.padGain,
  bass: mood.bass * inst.bass,
  arp: Math.max(mood.arp, inst.minArp),
  arpStep: inst.arpStep ?? mood.arpStep,
});
const leadSample = (kind: string, f: number, t: number, hold: number): number => {
  if (kind === MV.CHIP) return (Math.sin(2 * Math.PI * f * t) >= 0 ? 1 : -1) * 0.35 * Math.min(1, t / 0.004) * Math.exp(-t / 0.22);
  if (kind === MV.BELL) return (Math.sin(2 * Math.PI * f * t) + 0.4 * Math.sin(2 * Math.PI * f * 2.76 * t) * Math.exp(-t * 3)) * Math.exp(-t / 0.9) * 0.6;
  if (kind === MV.PIANO) {
    let v = 0;
    for (let k = 1; k <= 4; k++) v += (Math.sin(2 * Math.PI * k * f * t) / Math.pow(k, 1.5)) * Math.exp(-t * (1 + k * 0.7));
    return v * Math.min(1, t / 0.005) * 0.7;
  }
  return Math.sin(2 * Math.PI * f * t + 0.6 * Math.sin(2 * Math.PI * 5 * t) * Math.min(1, t / 0.3)) * Math.min(1, t / 0.08) * Math.min(1, Math.max(0, (hold - t) / 0.25)) * 0.5;
};
const ambienceBed = (left: Float32Array, right: Float32Array, rate: number, name: string, seed: number): void => {
  const level = MOTION_MUSIC_AMBIENCE[name]?.gain;
  if (!level) return;
  const random = rng(seed + 7919),
    frames = left.length,
    gain = level * M.PEAK;
  const add = (i: number, l: number, r = l) => {
    if (i >= 0 && i < frames) {
      left[i] += l * gain;
      right[i] += r * gain;
    }
  };
  let lp = 0,
    lp2 = 0;
  if (name === MV.PROJECTOR) {
    const step = Math.round(rate / 24);
    for (let i = 0; i < frames; i++) {
      lp = lp * 0.9 + (random() * 2 - 1) * 0.1;
      const click = i % step < rate * 0.003 ? (random() * 2 - 1) * Math.exp(-(i % step) / (rate * 0.001)) : 0;
      add(i, click * 0.5 + lp * 0.25 + Math.sin((2 * Math.PI * 50 * i) / rate) * 0.04);
    }
  } else if (name === MV.VINYL) {
    for (let i = 0; i < frames; i++) {
      lp = lp * 0.6 + (random() * 2 - 1) * 0.4;
      add(i, lp * 0.08 + (random() < 3 / rate ? (random() * 2 - 1) * 0.9 : 0));
    }
  } else if (name === MV.NIGHT) {
    for (let i = 0; i < frames; i++) {
      lp = lp * 0.995 + (random() * 2 - 1) * 0.005;
      const t = i / rate;
      add(i, lp * 0.8 * (0.6 + 0.4 * Math.sin(t * 0.21)), lp * 0.8 * (0.6 + 0.4 * Math.cos(t * 0.17)));
    }
    for (let t = random(); t < frames / rate; t += 0.6 + random() * 1.2)
      for (let p = 0; p < 3; p++) {
        const start = Math.floor((t + p * 0.035) * rate),
          pan = random();
        for (let j = 0; j < rate * 0.02; j++) {
          const v = Math.sin((2 * Math.PI * 4400 * j) / rate) * Math.sin((Math.PI * j) / (rate * 0.02)) * 0.12;
          add(start + j, v * (1 - pan), v * pan);
        }
      }
  } else {
    const chalk = name === MV.CHALK;
    for (let t = 1 + random() * 3; t < frames / rate; t += (chalk ? 3 : 4) + random() * 5) {
      const start = Math.floor(t * rate),
        length = Math.floor((chalk ? 0.2 + random() * 0.3 : 0.4 + random() * 0.4) * rate),
        pan = random();
      for (let j = 0; j < length; j++) {
        const n = random() * 2 - 1;
        lp = lp * 0.7 + n * 0.3;
        lp2 = lp2 * 0.97 + n * 0.03;
        const band = chalk ? (n - lp) * (0.6 + 0.4 * Math.sin((2 * Math.PI * 30 * j) / rate)) : lp - lp2;
        const v = band * Math.sin((Math.PI * j) / length) * 0.5;
        add(start + j, v * (1 - pan), v * pan);
      }
    }
  }
};
const chordNotes = (mood: MotionMusicMood, degree: number): number[] => {
  const scale = mood.scale,
    at = (step: number) => mood.root + scale[(degree + step) % scale.length] + 12 * Math.floor((degree + step) / scale.length);
  return [at(0), at(2), at(4), at(0) + 12];
};
const reverb = (left: Float32Array, right: Float32Array, rate: number): void => {
  const R = M.REVERB,
    scale = rate / 44100;
  const channel = (input: Float32Array, spread: number): Float32Array => {
    const out = new Float32Array(input.length);
    for (const size of R.COMBS) {
      const length = Math.max(1, Math.round((size + spread) * scale)),
        buffer = new Float32Array(length);
      let index = 0,
        store = 0;
      for (let i = 0; i < input.length; i++) {
        const value = buffer[index];
        store = value * (1 - R.DAMP) + store * R.DAMP;
        buffer[index] = input[i] + store * R.FEEDBACK;
        out[i] += value;
        index = (index + 1) % length;
      }
    }
    for (const size of R.ALLPASS) {
      const length = Math.max(1, Math.round((size + spread) * scale)),
        buffer = new Float32Array(length);
      let index = 0;
      for (let i = 0; i < out.length; i++) {
        const delayed = buffer[index],
          value = out[i];
        buffer[index] = value + delayed * R.ALLPASS_GAIN;
        out[i] = delayed - value;
        index = (index + 1) % length;
      }
    }
    return out;
  };
  const wetL = channel(left, 0),
    wetR = channel(right, R.SPREAD),
    gain = R.WET / R.COMBS.length;
  for (let i = 0; i < left.length; i++) {
    left[i] = left[i] * (1 - R.WET) + wetL[i] * gain;
    right[i] = right[i] * (1 - R.WET) + wetR[i] * gain;
  }
};
export const synthesizeMotionMusic = (duration: number, moodName: string, cues: number[], seed: number, instrumentName?: string): MotionStereoAudio => {
  const inst = MOTION_MUSIC_INSTRUMENTS[_.toString(instrumentName)] || MOTION_MUSIC_INSTRUMENTS.default,
    mood = withInstrument(MOTION_MUSIC_MOODS[moodName] || MOTION_MUSIC_MOODS[M.DEFAULT_MOOD], inst),
    table = tableOf(inst.pad),
    rate = M.SAMPLE_RATE,
    frames = Math.ceil(duration * rate),
    left = new Float32Array(frames),
    right = new Float32Array(frames),
    random = rng(seed || 1),
    beat = 60 / mood.bpm,
    chordSeconds = beat * M.BEATS_PER_CHORD,
    chords = Math.ceil(duration / chordSeconds) + 1,
    lowpass = Math.exp((-2 * Math.PI * mood.brightness) / rate),
    detune = Math.pow(2, (inst.detuneCents ?? M.DETUNE_CENTS) / 1200);
  let padL = 0,
    padR = 0;
  const phases = new Float64Array(16);
  for (let c = 0; c < chords; c++) {
    const notes = chordNotes(mood, mood.progression[c % mood.progression.length]),
      from = Math.floor(c * chordSeconds * rate),
      to = Math.min(frames, Math.floor((c + 1) * chordSeconds * rate) + Math.floor(rate * 0.5));
    for (let i = from; i < to; i++) {
      const t = (i - from) / rate,
        env = Math.min(1, t / 0.6) * Math.min(1, Math.max(0, (to - i) / rate / 0.5));
      let l = 0,
        r = 0;
      notes.forEach((note, n) => {
        const f = midiHz(note);
        for (const [k, ratio] of [
          [0, 1 / detune],
          [1, detune],
        ] as const) {
          const slot = n * 2 + k;
          phases[slot] = (phases[slot] + (f * ratio * M.TABLE_SIZE) / rate) % M.TABLE_SIZE;
          const value = table[phases[slot] | 0];
          if (k === 0) l += value;
          else r += value;
        }
      });
      padL = padL * lowpass + (l / notes.length) * (1 - lowpass);
      padR = padR * lowpass + (r / notes.length) * (1 - lowpass);
      if (i < frames && inst.pad !== MV.NONE) {
        left[i] += padL * mood.pad * env;
        right[i] += padR * mood.pad * env;
      }
    }
    const root = midiHz(notes[0] - 12);
    if (mood.bass > 0)
      for (let b = 0; b < M.BEATS_PER_CHORD; b += 2) {
        const start = Math.floor((c * chordSeconds + b * beat) * rate),
          length = Math.floor(beat * 2 * rate);
        for (let j = 0; j < length && start + j < frames; j++) {
          const t = j / rate,
            env = Math.min(1, t / 0.02) * Math.exp(-t * 1.6),
            value = (Math.sin(2 * Math.PI * root * t) + 0.3 * Math.sin(4 * Math.PI * root * t) + 0.15 * Math.sin(6 * Math.PI * root * t)) * env * mood.bass * 0.6;
          left[start + j] += value;
          right[start + j] += value;
        }
      }
    if (mood.arp > 0) {
      const steps = Math.round(M.BEATS_PER_CHORD / mood.arpStep);
      for (let s = 0; s < steps; s++) {
        const note = notes[(s * 3 + c) % notes.length] + inst.leadOctave,
          f = midiHz(note),
          start = Math.floor((c * chordSeconds + (s + (s % 2 ? inst.swing : 0)) * mood.arpStep * beat) * rate),
          period = Math.max(2, Math.round(rate / f)),
          line = new Float32Array(period).map(() => random() * 2 - 1),
          length = Math.floor(Math.min(1.2, beat * 2) * rate),
          pan = 0.5 + (random() - 0.5) * 0.6;
        if (inst.lead !== MV.PLUCK) {
          const hold = Math.min(MOTION_MUSIC_LEAD_SECONDS[inst.lead], mood.arpStep * beat * 1.5),
            span = Math.floor(Math.max(hold, MOTION_MUSIC_LEAD_SECONDS[inst.lead]) * rate);
          for (let j = 0; j < span && start + j < frames; j++) {
            const out = leadSample(inst.lead, f, j / rate, hold) * mood.arp * 0.5;
            left[start + j] += out * (1 - pan);
            right[start + j] += out * pan;
          }
          continue;
        }
        let index = 0;
        for (let j = 0; j < length && start + j < frames; j++) {
          const next = (index + 1) % period,
            value = line[index];
          line[index] = 0.5 * (value + line[next]) * 0.996;
          index = next;
          const out = value * mood.arp * 0.5 * Math.exp(-j / rate / 0.9);
          left[start + j] += out * (1 - pan);
          right[start + j] += out * pan;
        }
      }
    }
    if (mood.pulse > 0)
      for (let b = 0; b < M.BEATS_PER_CHORD; b += mood.pulseEvery) {
        const start = Math.floor((c * chordSeconds + b * beat) * rate),
          length = Math.floor(0.4 * rate);
        let phase = 0;
        for (let j = 0; j < length && start + j < frames; j++) {
          const t = j / rate,
            f = 45 + 75 * Math.exp(-t * 30);
          phase += (2 * Math.PI * f) / rate;
          const value = Math.sin(phase) * Math.exp(-t * 9) * mood.pulse;
          left[start + j] += value;
          right[start + j] += value;
        }
      }
  }
  if (mood.drone > 0) {
    const base = midiHz(mood.root - 12);
    for (let i = 0; i < frames; i++) {
      const t = i / rate,
        wobble = 1 + 0.003 * Math.sin(2 * Math.PI * 0.07 * t),
        value = (Math.sin(2 * Math.PI * base * wobble * t) + 0.5 * Math.sin(2 * Math.PI * base * 1.5 * t + Math.sin(t * 0.3)) + 0.25 * Math.sin(2 * Math.PI * base * 2.02 * t)) * mood.drone * 0.4 * (0.7 + 0.3 * Math.sin(2 * Math.PI * 0.05 * t));
      left[i] += value;
      right[i] += value * 0.95;
    }
  }
  if (mood.pings > 0)
    for (let t = 2 + random() * 4; t < duration - 2; t += 3 + random() * 6) {
      const f = midiHz(mood.root + 24 + mood.scale[Math.floor(random() * mood.scale.length)]),
        start = Math.floor(t * rate),
        pan = random();
      for (let j = 0; j < rate * 3 && start + j < frames; j++) {
        const value = Math.sin((2 * Math.PI * f * j) / rate) * Math.exp(-j / rate / 1.2) * mood.pings;
        left[start + j] += value * (1 - pan);
        right[start + j] += value * pan;
      }
    }
  for (const cue of cues) {
    const at = Math.floor(cue * rate),
      swell = Math.floor(M.CUE.SWELL * rate),
      boom = Math.floor(M.CUE.BOOM * rate);
    let noise = 0;
    for (let j = 0; j < swell; j++) {
      const i = at - swell + j;
      if (i < 0 || i >= frames) continue;
      noise = noise * 0.97 + (random() * 2 - 1) * 0.03;
      const value = noise * Math.pow(j / swell, 2) * M.CUE.GAIN * 4;
      left[i] += value;
      right[i] += value;
    }
    for (let j = 0; j < boom && at + j < frames; j++) {
      const t = j / rate,
        value = Math.sin(2 * Math.PI * (40 + 30 * Math.exp(-t * 8)) * t) * Math.exp(-t * 2.2) * M.CUE.GAIN;
      left[at + j] += value;
      right[at + j] += value;
    }
  }
  reverb(left, right, rate);
  let peak = 0;
  for (let i = 0; i < frames; i++) peak = Math.max(peak, Math.abs(left[i]), Math.abs(right[i]));
  const gain = peak > 0 ? M.PEAK / peak : 1;
  for (let i = 0; i < frames; i++) {
    const t = i / rate,
      fade = Math.min(1, t / M.FADE_IN, (duration - t) / M.FADE_OUT);
    left[i] *= gain * Math.max(0, fade);
    right[i] *= gain * Math.max(0, fade);
  }
  return { left, right, rate };
};
const writeWav = async (file: string, left: Float32Array, right: Float32Array, rate: number): Promise<void> => {
  const data = Buffer.alloc(left.length * 4);
  for (let i = 0; i < left.length; i++) {
    data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, left[i])) * 32767), i * 4);
    data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, right[i])) * 32767), i * 4 + 2);
  }
  await fs.promises.writeFile(file, Buffer.concat([motionWavHeader(data.length, M.CHANNELS, rate), data]));
};
const synthesizeSegments = (duration: number, segments: MotionMusicSegment[], cues: number[], seed: number, instrument?: string): MotionStereoAudio => {
  if (segments.length < 2) return synthesizeMotionMusic(duration, segments[0]?.mood || M.DEFAULT_MOOD, cues, seed, instrument);
  const rate = M.SAMPLE_RATE,
    frames = Math.ceil(duration * rate),
    left = new Float32Array(frames),
    right = new Float32Array(frames),
    overlap = M.CROSSFADE;
  segments.forEach((segment, index) => {
    const from = Math.max(0, segment.start - (index ? overlap : 0)),
      to = Math.min(duration, (segments[index + 1]?.start ?? duration) + (index + 1 < segments.length ? overlap : 0)),
      part = synthesizeMotionMusic(
        to - from,
        segment.mood,
        _.map(
          _.filter(cues, (cue) => cue >= from && cue < to),
          (cue) => cue - from,
        ),
        seed + index,
        instrument,
      ),
      offset = Math.floor(from * rate),
      fadeIn = index ? overlap * rate : 0,
      fadeOut = index + 1 < segments.length ? overlap * rate : 0;
    for (let i = 0; i < part.left.length && offset + i < frames; i++) {
      const gain = Math.min(1, fadeIn ? i / fadeIn : 1, fadeOut ? (part.left.length - i) / fadeOut : 1);
      left[offset + i] += part.left[i] * gain;
      right[offset + i] += part.right[i] * gain;
    }
  });
  return { left, right, rate };
};
export const buildMotionMusic = async (duration: number, segments: MotionMusicSegment[], cues: number[], seed: number, instrument?: string, ambience?: string): Promise<string> => {
  const id = M.PREFIX + hash([M.VERSION, duration.toFixed(2), segments, cues, seed, instrument || MR.MOTION_TEXT_EMPTY, ambience || MR.MOTION_TEXT_EMPTY]) + M.WAV,
    file = path.join(getMotionAudioDirectory(), id);
  if (!fs.existsSync(file)) {
    const temp = file + randomUUID() + M.WAV;
    const { left, right, rate } = synthesizeSegments(duration, segments, cues, seed, instrument);
    if (ambience) ambienceBed(left, right, rate, ambience, seed);
    await writeWav(temp, left, right, rate);
    fs.renameSync(temp, file);
  }
  return file;
};
export const mixMotionMusic = async (base: string, music: string, volume: number, duration: number, signal?: AbortSignal): Promise<string> => {
  const stat = fs.statSync(base),
    id = M.MIX_PREFIX + hash([M.VERSION, path.basename(base), stat.size, stat.mtimeMs, path.basename(music), volume.toFixed(3)]) + M.WAV,
    file = path.join(getMotionAudioDirectory(), id);
  if (fs.existsSync(file)) return file;
  const temp = file + randomUUID() + M.WAV;
  await runMotionAudioProcess([MR.MOTION_TEXT_I, base, MR.MOTION_TEXT_I, music, MR.MOTION_TEXT_FILTER_COMPLEX, M.MIX_GRAPH(volume), MR.MOTION_TEXT_MAP_2, M.MIX_OUT, MR.MOTION_TEXT_C_A, MR.MOTION_TEXT_PCM_S16LE, MR.MOTION_TEXT_T, duration.toFixed(3), temp], signal);
  fs.renameSync(temp, file);
  return file;
};
