import fs from "fs";
import os from "os";
import path from "path";
import _ from "lodash";
import { randomUUID } from "crypto";
import { MOTION_VOICE_SPEED as V } from "../../constants/motionVoice.js";
import type { MotionVoiceSpeedTarget } from "../../types/motionVideo.js";
import { runMotionAudioProcess } from "./motionSoundMixService.js";
const A = V.AUDIO;
const quantile = (list: number[], q: number): number => {
  const sorted = _.sortBy(list);
  return sorted.length ? sorted[Math.min(sorted.length - 1, Math.max(0, Math.round(q * (sorted.length - 1))))] : 0;
};
export const decodeVoicePcm = async (file: string, signal?: AbortSignal): Promise<Int16Array> => {
  const raw = path.join(os.tmpdir(), A.TMP_PREFIX + randomUUID() + A.RAW_EXT);
  try {
    await runMotionAudioProcess([A.ARG_INPUT, file, A.ARG_CHANNELS, A.CHANNELS, A.ARG_RATE, String(A.SAMPLE_RATE), A.ARG_FORMAT, A.FORMAT, raw], signal);
    const buf = await fs.promises.readFile(raw);
    return new Int16Array(buf.buffer, buf.byteOffset, Math.floor(buf.length / 2));
  } finally {
    await fs.promises.rm(raw, { force: true }).catch(_.noop);
  }
};
export interface MotionVoicePaceReport {
  rate: number;
  articulation: number;
  speechRatio: number;
  phrase: number;
  pausesPerMinute: number;
  seconds: number;
  pauses: NonNullable<MotionVoiceSpeedTarget["pauses"]>;
}
export const analyzeVoicePace = (pcm: Int16Array, shortClip = false): MotionVoicePaceReport => {
  const hop = Math.round((A.SAMPLE_RATE * A.HOP_MS) / 1000);
  const frames = Math.floor(pcm.length / hop);
  if (frames * A.HOP_MS < (shortClip ? A.MIN_CLIP_SECONDS : A.MIN_SECONDS) * 1000) throw new Error(V.ERRORS.AUDIO_SHORT);
  const db = new Float32Array(frames);
  const hi = new Float32Array(frames);
  let prev = 0;
  for (let f = 0; f < frames; f++) {
    let e = 0,
      h = 0;
    for (let i = f * hop; i < (f + 1) * hop; i++) {
      const x = pcm[i] / 32768;
      const d = x - A.PREEMPHASIS * prev;
      prev = x;
      e += x * x;
      h += d * d;
    }
    db[f] = 10 * Math.log10(e / hop + 1e-12);
    hi[f] = 10 * Math.log10(h / hop + 1e-12);
  }
  const all = Array.from(db);
  const thr = quantile(all, A.LOUD_Q) - A.SILENCE_DB;
  const voiced = all.map((v) => v > thr);
  const seconds = (frames * A.HOP_MS) / 1000;
  const minRun = Math.round(A.MIN_PAUSE_MS / A.HOP_MS);
  const pauses: { at: number; d: number }[] = [];
  for (let i = 0; i < frames; ) {
    if (voiced[i]) {
      i++;
      continue;
    }
    let j = i;
    while (j < frames && !voiced[j]) j++;
    if (j - i >= minRun && i > 0 && j < frames) pauses.push({ at: (i * A.HOP_MS) / 1000, d: ((j - i) * A.HOP_MS) / 1000 });
    i = j;
  }
  const speech = (_.sumBy(voiced, (v) => (v ? 1 : 0)) * A.HOP_MS) / 1000;
  const k = A.SMOOTH_FRAMES;
  const sm = Array.from(hi, (_v, i) => _.mean(Array.from(hi.slice(Math.max(0, i - k), Math.min(frames, i + k + 1)))));
  const floor = quantile(sm, A.PEAK_FLOOR_Q);
  const gap = Math.round(A.SYLLABLE_GAP_MS / A.HOP_MS);
  let syllables = 0,
    last = -gap,
    valley = Infinity;
  for (let i = 1; i < frames - 1; i++) {
    valley = Math.min(valley, sm[i]);
    if (sm[i] >= sm[i - 1] && sm[i] > sm[i + 1] && voiced[i] && sm[i] > floor && sm[i] - valley >= A.PEAK_PROMINENCE_DB && i - last >= gap) {
      syllables++;
      last = i;
      valley = sm[i];
    }
  }
  const d = _.map(pauses, (B) => B.d);
  if (!syllables || (!shortClip && d.length < A.MIN_PAUSES)) throw new Error(V.ERRORS.AUDIO_SHORT);
  const cuts = [
    0,
    ..._.map(
      _.filter(pauses, (p) => p.d >= A.PHRASE_PAUSE),
      (p) => p.at,
    ),
    seconds,
  ];
  const phrases = _.filter(
    _.map(_.tail(cuts), (c, i) => c - cuts[i]),
    (x) => x > 0,
  );
  const at = (q: number) => _.round(_.clamp(quantile(d, q), V.PAUSE_RANGE[0], V.PAUSE_RANGE[1]), 2);
  return {
    rate: _.round(syllables / seconds, 3),
    articulation: _.round(syllables / Math.max(1, speech), 2),
    speechRatio: _.round(speech / seconds, 3),
    phrase: _.round(quantile(phrases, 0.5), 2),
    pausesPerMinute: _.round(d.length / (seconds / 60), 1),
    seconds: _.round(seconds, 1),
    pauses: { clause: at(A.Q.CLAUSE), sentence: at(A.Q.SENTENCE), suspense: at(A.Q.SUSPENSE), beat: at(A.Q.BEAT), articulation: _.round(syllables / Math.max(1, speech), 2) },
  };
};
export const measureVoicePaceFile = async (file: string, signal?: AbortSignal): Promise<MotionVoicePaceReport> => analyzeVoicePace(await decodeVoicePcm(file, signal));
export const measureVoiceCadenceFile = async (file: string, signal?: AbortSignal): Promise<MotionVoicePaceReport> => analyzeVoicePace(await decodeVoicePcm(file, signal), true);
export const voicePauses = (pcm: Int16Array, minPause: number): { seconds: number; pauses: { at: number; d: number }[] } => {
  const hop = Math.round((A.SAMPLE_RATE * A.HOP_MS) / 1000);
  const frames = Math.floor(pcm.length / hop);
  const db: number[] = [];
  for (let f = 0; f < frames; f++) {
    let e = 0;
    for (let i = f * hop; i < (f + 1) * hop; i++) e += (pcm[i] / 32768) ** 2;
    db.push(10 * Math.log10(e / hop + 1e-12));
  }
  const thr = quantile(db, A.LOUD_Q) - A.SILENCE_DB;
  const minRun = Math.round((minPause * 1000) / A.HOP_MS);
  const pauses: { at: number; d: number }[] = [];
  for (let i = 0; i < frames; ) {
    if (db[i] > thr) {
      i++;
      continue;
    }
    let j = i;
    while (j < frames && db[j] <= thr) j++;
    if (j - i >= minRun || i === 0 || j === frames) pauses.push({ at: (i * A.HOP_MS) / 1000, d: ((j - i) * A.HOP_MS) / 1000 });
    i = j;
  }
  return { seconds: (frames * A.HOP_MS) / 1000, pauses };
};
