import * as COMMON_RUNTIME from "../../../../constants/sourceText.js";
import { RUNTIME_VALUES } from "../../../../constants/runtime/values.js";
import fs from "node:fs";
import { randomUUID } from "node:crypto";
import { MOTION_VOICE as C, MOTION_VOICE_PACING as P, MOTION_VOICE_SPEED as V } from "../../../../constants/motionVoice.js";
import type { MotionVoiceCadence, MotionVoiceSpeedTarget } from "../../../../types/motionVideo.js";
import { analyzeVoicePace, voicePauses } from "./motionVoicePaceService.js";
import { motionWavData } from "./motionAudioUtils.js";
import { trimMotionVoiceEdges } from "./motionVoiceQualityService.js";
import { runMotionAudioProcess } from "./motionSoundMixService.js";
import { speechUnits } from "./motionSpeechRateService.js";
const N = P.NARRATOR_CADENCE;
export interface ReferenceCadenceProfile {
  articulation: number;
  clause: number;
  sentence: number;
  suspense: number;
  beat: number;
}
export const referenceCadenceProfile = (target: MotionVoiceSpeedTarget | undefined, correction = 1): ReferenceCadenceProfile | undefined => {
  if (target?.rateBasis !== V.BASIS.TEXT) return;
  const articulation = target.pauses?.articulation || (target.speechRatio ? target.rate / target.speechRatio : 0);
  if (!Number.isFinite(articulation) || articulation < V.RATE_RANGE[0] || articulation > V.RATE_RANGE[1] || !target.pauses) return;
  const { clause, sentence, suspense, beat } = target.pauses;
  if (![clause ?? sentence, sentence, suspense, beat].every((value) => Number.isFinite(value) && value! >= V.PAUSE_RANGE[0] && value! <= V.PAUSE_RANGE[1])) return;
  return { articulation: articulation * correction, clause: clause ?? sentence, sentence, suspense, beat };
};
export const inspectVoiceCadence = (wav: Buffer, text: string) => {
  const info = motionWavData(wav);
  if (info.sampleRate !== C.SAMPLE_RATE || info.channels !== 1) return;
  const pcm = new Int16Array(Math.floor(info.duration * V.AUDIO.SAMPLE_RATE));
  const stride = C.SAMPLE_RATE / V.AUDIO.SAMPLE_RATE;
  for (let i = 0; i < pcm.length; i++) pcm[i] = wav.readInt16LE(info.start + Math.floor(i * stride) * 2);
  const units = speechUnits(text);
  if (units < N.MIN_UNITS || info.duration < V.AUDIO.MIN_CLIP_SECONDS) return;
  const report = analyzeVoicePace(pcm, true);
  const active = info.duration * report.speechRatio;
  if (active < N.MIN_ACTIVE_SECONDS || report.speechRatio < N.MIN_RATIO || report.speechRatio > N.MAX_RATIO) return;
  const hop = Math.round((V.AUDIO.SAMPLE_RATE * V.AUDIO.HOP_MS) / 1000);
  const levels: number[] = [];
  for (let from = 0; from + hop <= pcm.length; from += hop) {
    let energy = 0;
    for (let i = from; i < from + hop; i++) energy += (pcm[i] / 32768) ** 2;
    levels.push(10 * Math.log10(energy / hop + 1e-12));
  }
  const sorted = [...levels].sort((a, b) => a - b);
  const threshold = sorted[Math.round((sorted.length - 1) * V.AUDIO.LOUD_Q)] - V.AUDIO.SILENCE_DB;
  const cumulative = [0];
  for (const level of levels) cumulative.push(cumulative.at(-1)! + Number(level > threshold));
  const voiced = cumulative.at(-1)!;
  const pauses = voicePauses(pcm, N.PAUSE_MIN)
    .pauses.filter((pause) => pause.at > 0 && pause.at + pause.d < info.duration - 0.01)
    .map((pause) => ({ ...pause, progress: cumulative[Math.min(levels.length, Math.round((pause.at * 1000) / V.AUDIO.HOP_MS))] / voiced }));
  return { articulation: units / active, seconds: info.duration, pauses };
};
export const referencePausePlan = (text: string, pauses: { at: number; d: number; progress: number }[], profile: ReferenceCadenceProfile) => {
  const units = speechUnits(text);
  const marks = [...text.matchAll(/[,;:，；：]|\.{3}|[.!?…]+/gu)].filter((mark) => /^["”’')\]]*\s+\S/u.test(text.slice(mark.index! + mark[0].length)));
  const boundaries = marks.map((mark) => ({ progress: speechUnits(text.slice(0, mark.index! + mark[0].length)) / units, target: /[,;:，；：]/u.test(mark[0]) ? profile.clause : /…|\.{3}/u.test(mark[0]) ? profile.suspense : profile.sentence }));
  const distance = (a: number, b: number) => Math.abs(a - b) * units;
  const chosen: { at: number; d: number; target: number }[] = [];
  let last = -1;
  for (const boundary of boundaries) {
    const candidates = pauses
      .map((pause, index) => ({ pause, index, error: distance(pause.progress, boundary.progress) }))
      .filter((item) => item.index > last)
      .sort((a, b) => a.error - b.error);
    const best = candidates[0];
    if (!best || best.error > N.ALIGN_MAX_UNITS || (candidates[1] && candidates[1].error - best.error < N.ALIGN_MARGIN_UNITS)) continue;
    const neighbours = boundaries.map((item) => ({ item, error: distance(item.progress, best.pause.progress) })).sort((a, b) => a.error - b.error);
    if (neighbours[0].item !== boundary || (neighbours[1] && neighbours[1].error - neighbours[0].error < N.ALIGN_MARGIN_UNITS)) continue;
    chosen.push({ at: best.pause.at, d: best.pause.d, target: boundary.target });
    last = best.index;
  }
  return { pauses: chosen, expected: boundaries.length };
};
export const normalizeReferenceVoiceCadence = async (file: string, text: string, profile: ReferenceCadenceProfile, signal?: AbortSignal): Promise<{ wav: Buffer; cadence: MotionVoiceCadence } | undefined> => {
  const source = trimMotionVoiceEdges(await fs.promises.readFile(file));
  const before = inspectVoiceCadence(source, text);
  if (!before || before.pauses.length > N.MAX_PAUSES) return;
  const output = file + randomUUID() + RUNTIME_VALUES.CADENCE_WAV_A51E3FA2;
  const planned = referencePausePlan(text, before.pauses, profile);
  const pauses = planned.pauses;
  const clamp = (value: number) => Math.max(N.TEMPO_MIN, Math.min(N.TEMPO_MAX, value));
  let tempo = clamp(profile.articulation / before.articulation);
  const render = async () => {
    const filters: string[] = [],
      labels: string[] = [];
    let from = 0;
    for (let i = 0; i <= pauses.length; i++) {
      const pause = pauses[i];
      const end = pause ? pause.at + N.PAUSE_GUARD : before.seconds;
      filters.push(`${RUNTIME_VALUES.VALUE_DB0A8F0C}${from.toFixed(6)}${RUNTIME_VALUES.END_332E4C51}${end.toFixed(6)}${RUNTIME_VALUES.ASETPTS_PTS_STARTPTS_ATEMPO_36A3314D}${tempo.toFixed(6)}${RUNTIME_VALUES.S_125A9899}${i}${COMMON_RUNTIME.SOURCE_TEXT_SYMBOL_45}`);
      labels.push(`${RUNTIME_VALUES.S_125A9899}${i}${COMMON_RUNTIME.SOURCE_TEXT_SYMBOL_45}`);
      if (pause) {
        const quiet = Math.max(0.01, pause.target - (2 * N.PAUSE_GUARD) / tempo);
        filters.push(`${RUNTIME_VALUES.ANULLSRC_R_4E43C490}${C.SAMPLE_RATE}${RUNTIME_VALUES.CL_MONO_ATRIM_DURATION_614DBCB1}${quiet.toFixed(6)}${RUNTIME_VALUES.ASETPTS_PTS_STARTPTS_P_0E54884D}${i}${COMMON_RUNTIME.SOURCE_TEXT_SYMBOL_45}`);
        labels.push(`${RUNTIME_VALUES.P_588FC6C9}${i}${COMMON_RUNTIME.SOURCE_TEXT_SYMBOL_45}`);
        from = pause.at + pause.d - N.PAUSE_GUARD;
      }
    }
    filters.push(`${labels.join("")}${RUNTIME_VALUES.CONCAT_N_A621799D}${labels.length}${RUNTIME_VALUES.V_0_A_1_OUT_FD222ECE}`);
    await runMotionAudioProcess(
      [COMMON_RUNTIME.SOURCE_TEXT_I, file, COMMON_RUNTIME.SOURCE_TEXT_FILTER_COMPLEX, filters.join(COMMON_RUNTIME.SOURCE_TEXT_SYMBOL_32), RUNTIME_VALUES.MAP_34A68E36, RUNTIME_VALUES.OUT_A45A792B, COMMON_RUNTIME.SOURCE_TEXT_AR, String(C.SAMPLE_RATE), COMMON_RUNTIME.SOURCE_TEXT_AC, COMMON_RUNTIME.SOURCE_TEXT_1, COMMON_RUNTIME.SOURCE_TEXT_C_A, RUNTIME_VALUES.PCM_S16LE_C6C39C20, output],
      signal,
    );
    return trimMotionVoiceEdges(await fs.promises.readFile(output));
  };
  try {
    await fs.promises.writeFile(file, source);
    let wav = await render();
    let after = inspectVoiceCadence(wav, text);
    if (!after) return;
    if (Math.abs(after.articulation / profile.articulation - 1) > N.TOLERANCE) {
      const corrected = clamp((tempo * profile.articulation) / after.articulation);
      if (Math.abs(corrected - tempo) > 0.001) {
        tempo = corrected;
        wav = await render();
        after = inspectVoiceCadence(wav, text);
        if (!after) return;
      }
    }
    return { wav, cadence: { before: before.articulation, after: after.articulation, target: profile.articulation, tempo, limited: Math.abs(after.articulation / profile.articulation - 1) > N.REVIEW_DELTA, pausesMatched: pauses.length, pausesExpected: planned.expected } };
  } finally {
    await fs.promises.rm(output, { force: true }).catch(() => {});
  }
};
