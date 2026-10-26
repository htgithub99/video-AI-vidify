import fs from "node:fs";
import { randomUUID } from "node:crypto";
import { MOTION_VOICE as C, MOTION_VOICE_LIBRARY as L } from "../../constants/motionVoice.js";
import * as MR from "../../constants/motionRuntime.js";
import { runMotionAudioProcess } from "./motionSoundMixService.js";
import { transcribeVieneuAudio } from "./vieneuTtsService.js";
import { probeMediaDuration } from "./motionRenderService.js";
import { motionVoiceSignal } from "./motionVoiceQualityService.js";
type ReferenceWord = { w: string; s: number; e: number };
export const motionVoiceReferenceWindow = (words: ReferenceWord[], duration: number): { start: number; seconds: number } => {
  const valid = words.filter((word) => Number.isFinite(word.s) && Number.isFinite(word.e) && word.e > word.s && word.s >= 0 && word.e <= duration).sort((a, b) => a.s - b.s);
  const max = Number(L.SAMPLE_SECONDS);
  let clause: { start: number; seconds: number } | undefined;
  let fallback: { start: number; seconds: number } | undefined;
  for (let from = 0; from < valid.length; from++) {
    if (from && !L.SAMPLE_END_RE.test(valid[from - 1].w)) continue;
    const start = Math.max(0, valid[from].s - L.SAMPLE_HEAD);
    let sentence: { start: number; seconds: number } | undefined;
    for (let to = from; to < valid.length; to++) {
      const end = Math.min(duration, valid[to].e + L.SAMPLE_TAIL);
      if (end - start > max) break;
      if (end - start < L.SAMPLE_MIN_SECONDS) continue;
      const candidate = { start, seconds: end - start };
      if (!fallback || fallback.start === start) fallback = candidate;
      if (L.SAMPLE_CLAUSE_RE.test(valid[to].w)) clause ||= candidate;
      if (L.SAMPLE_END_RE.test(valid[to].w)) sentence = candidate;
    }
    if (sentence) return sentence;
  }
  return clause || fallback || { start: 0, seconds: Math.min(duration, max) };
};
export const prepareMotionVoiceReference = async (source: string, file: string, signal?: AbortSignal): Promise<void> => {
  const scan = file + randomUUID() + MR.MOTION_TEXT_WAV;
  try {
    await runMotionAudioProcess([MR.MOTION_TEXT_I, source, MR.MOTION_TEXT_T, L.SAMPLE_SCAN_SECONDS, MR.MOTION_TEXT_AR, String(C.SAMPLE_RATE), MR.MOTION_TEXT_AC, MR.MOTION_TEXT_1, MR.MOTION_TEXT_C_A, MR.MOTION_TEXT_PCM_S16LE, scan], signal);
    const duration = await probeMediaDuration(scan);
    let words: ReferenceWord[] = [];
    try {
      words = (await transcribeVieneuAudio(scan, MR.MOTION_TEXT_EMPTY, signal)).words;
    } catch (error) {
      if (signal?.aborted) throw error;
    }
    const window = motionVoiceReferenceWindow(words, duration);
    await runMotionAudioProcess([L.SAMPLE_SEEK, String(window.start), MR.MOTION_TEXT_I, scan, MR.MOTION_TEXT_T, String(window.seconds), MR.MOTION_TEXT_AF, L.SAMPLE_FILTER, MR.MOTION_TEXT_AR, String(C.SAMPLE_RATE), MR.MOTION_TEXT_AC, MR.MOTION_TEXT_1, MR.MOTION_TEXT_C_A, MR.MOTION_TEXT_PCM_S16LE, file], signal);
    if ((await probeMediaDuration(file)) < L.SAMPLE_MIN_SECONDS) throw new Error(C.REFERENCE_INVALID);
    motionVoiceSignal(await fs.promises.readFile(file));
  } finally {
    await fs.promises.rm(scan, { force: true }).catch(() => {});
  }
};
