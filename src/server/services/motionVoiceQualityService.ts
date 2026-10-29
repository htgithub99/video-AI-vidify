import { MOTION_VOICE as C, MOTION_VOICE_QUALITY as Q } from "../../constants/motionVoice.js";
import { motionWavData } from "./motionAudioUtils.js";
import { motionWavHeader } from "./motionSoundMixService.js";
export const compareMotionVoiceText = (expected: string, heard: string): { error: number; errorRun: number } => {
  const tokens = (text: string) => text.toLowerCase().normalize(C.ASR.NORMALIZE).split(C.ASR.TOKEN_RE).filter(Boolean);
  const a = tokens(expected),
    b = tokens(heard);
  const rows = Array.from({ length: a.length + 1 }, (_, i) => Array.from({ length: b.length + 1 }, (_, j) => (!i ? j : !j ? i : 0)));
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) rows[i][j] = Math.min(rows[i - 1][j] + 1, rows[i][j - 1] + 1, rows[i - 1][j - 1] + Number(a[i - 1] !== b[j - 1]));
  let i = a.length,
    j = b.length,
    run = 0,
    longest = 0;
  while (i || j) {
    if (i && j && a[i - 1] === b[j - 1] && rows[i][j] === rows[i - 1][j - 1]) {
      run = 0;
      i--;
      j--;
    } else {
      longest = Math.max(longest, ++run);
      if (i && j && rows[i][j] === rows[i - 1][j - 1] + 1) {
        i--;
        j--;
      } else if (i && rows[i][j] === rows[i - 1][j] + 1) i--;
      else j--;
    }
  }
  return { error: a.length ? rows[a.length][b.length] / a.length : 0, errorRun: longest };
};
export const motionVoiceSignal = (wav: Buffer) => {
  const { start, length, availableBytes, channels, sampleRate } = motionWavData(wav);
  if (!length || length > availableBytes || length % 2 || channels !== 1 || sampleRate !== C.SAMPLE_RATE) throw new Error(Q.INVALID);
  const count = length / 2;
  const step = Math.max(1, Math.round(C.SAMPLE_RATE * Q.FRAME_SECONDS));
  const floor = Math.pow(10, Q.EDGE_DB / 20);
  let first = count,
    last = 0,
    active = 0,
    peak = 0,
    clipped = 0;
  for (let from = 0; from < count; from += step) {
    const to = Math.min(count, from + step);
    let energy = 0;
    for (let i = from; i < to; i++) {
      const value = Math.abs(wav.readInt16LE(start + i * 2) / 32768);
      energy += value * value;
      peak = Math.max(peak, value);
      if (value >= Q.PEAK_LIMIT) clipped++;
    }
    if (Math.sqrt(energy / (to - from)) >= floor) {
      first = Math.min(first, from);
      last = to;
      active += to - from;
    }
  }
  if (active / C.SAMPLE_RATE < Q.MIN_ACTIVE_SECONDS) throw new Error(Q.INVALID);
  return { duration: count / C.SAMPLE_RATE, leading: first / C.SAMPLE_RATE, trailing: (count - last) / C.SAMPLE_RATE, active: active / C.SAMPLE_RATE, peak, clipped };
};
export const trimMotionVoiceEdges = (wav: Buffer): Buffer => {
  const signal = motionVoiceSignal(wav);
  const { start, length } = motionWavData(wav);
  const head = Math.max(0, Math.floor((signal.leading - Q.KEEP_HEAD) * C.SAMPLE_RATE));
  const tail = Math.max(0, Math.floor((signal.trailing - Q.KEEP_TAIL) * C.SAMPLE_RATE));
  const pcm = wav.subarray(start + head * 2, start + length - tail * 2);
  return Buffer.concat([motionWavHeader(pcm.length, 1), pcm]);
};
export const motionVoiceBoundaryPadding = (requested: number, previousTail = 0, nextHead = 0): number => Math.max(0, requested - previousTail - nextHead);

/** Exclude ASR words outside the clip or entirely over silence. */
export const motionSupportedTranscript = (wav: Buffer, transcript: { text: string; words: { w: string; s: number; e: number }[] }) => {
  const info = motionWavData(wav);
  if (!transcript.words.length) return transcript;
  const floor = Math.pow(10, Q.EDGE_DB / 20);
  const words = transcript.words.filter((word) => {
    if (!Number.isFinite(word.s) || !Number.isFinite(word.e) || word.e < word.s || word.s < 0 || word.s >= info.duration) return false;
    const from = Math.max(0, Math.floor((word.s - 0.02) * info.sampleRate));
    const to = Math.min(Math.floor(info.duration * info.sampleRate), Math.ceil(Math.max(word.e, word.s + 0.02) * info.sampleRate));
    let energy = 0;
    for (let i = from; i < to; i++) for (let ch = 0; ch < info.channels; ch++) energy += (wav.readInt16LE(info.start + (i * info.channels + ch) * 2) / 32768) ** 2;
    return to > from && Math.sqrt(energy / ((to - from) * info.channels)) >= floor;
  });
  return { text: words.length === transcript.words.length ? transcript.text : words.map((word) => word.w).join(" "), words };
};
