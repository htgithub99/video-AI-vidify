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
const sumOf = (values: number[]) => values.reduce((sum, value) => sum + value, 0);
interface ReferenceCadenceProfile {
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
  return { articulation: units / active, seconds: info.duration, pauses, nuclei: syllableNuclei(levels, threshold) };
};
const syllableNuclei = (levels: number[], threshold: number) => {
  const K = N.NUCLEUS,
    half = Math.floor(K.SMOOTH_FRAMES / 2);
  const smooth = levels.map((_, i) => {
    const part = levels.slice(Math.max(0, i - half), i + half + 1);
    return part.reduce((sum, value) => sum + value, 0) / part.length;
  });
  const range = (from: number, to: number) => smooth.slice(Math.max(0, from), Math.max(0, to));
  const nuclei: number[] = [];
  for (let i = 1; i < smooth.length - 1; i++) {
    const level = smooth[i];
    if (level <= threshold || level < Math.max(...range(i - K.PEAK_FRAMES, i + K.PEAK_FRAMES + 1))) continue;
    if (nuclei.length && (i * V.AUDIO.HOP_MS) / 1000 - nuclei.at(-1)! < (K.PEAK_FRAMES * V.AUDIO.HOP_MS) / 1000) continue;
    const valley = Math.min(Math.min(...range(i - K.VALLEY_FRAMES, i)), Math.min(...range(i + 1, i + K.VALLEY_FRAMES + 1)));
    if (level - valley > K.PROMINENCE_DB) nuclei.push((i * V.AUDIO.HOP_MS) / 1000);
  }
  return nuclei;
};
const spanPaces = (nuclei: number[], spans: { from: number; to: number }[]) =>
  spans.map(({ from, to }) => {
    const inside = nuclei.filter((at) => at >= from && at < to);
    return inside.length >= N.NUCLEUS.MIN_PER_SPAN && inside.at(-1)! > inside[0] ? { syllables: inside.length - 1, seconds: inside.at(-1)! - inside[0] } : undefined;
  });
const paceSpread = (paces: ReturnType<typeof spanPaces>) => {
  const measured = paces.filter((pace) => !!pace);
  if (measured.length < 2) return 0;
  const rate = sumOf(measured.map((pace) => pace.syllables)) / sumOf(measured.map((pace) => pace.seconds));
  return Math.max(...measured.map((pace) => Math.abs(pace.syllables / pace.seconds / rate - 1)));
};
const punctuationMarks = (text: string) => [...text.matchAll(/[,;:，；：]|\.{3}|[.!?…]+/gu)].filter((mark) => /^["”’')\]]*\s+\S/u.test(text.slice(mark.index! + mark[0].length))).map((mark) => ({ mark: mark[0], end: mark.index! + mark[0].length }));
const referencePausePlan = (text: string, pauses: { at: number; d: number; progress: number }[], profile: ReferenceCadenceProfile) => {
  const units = speechUnits(text);
  const marks = punctuationMarks(text);
  const boundaries = marks.map((mark) => ({ progress: speechUnits(text.slice(0, mark.end)) / units, target: /[,;:，；：]/u.test(mark.mark) ? profile.clause : /…|\.{3}/u.test(mark.mark) ? profile.suspense : profile.sentence }));
  const distance = (a: number, b: number) => Math.abs(a - b) * units;
  const chosen: { at: number; d: number; target: number; progress: number }[] = [];
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
    chosen.push({ at: best.pause.at, d: best.pause.d, target: boundary.target, progress: boundary.progress });
    last = best.index;
  }
  return { pauses: chosen, expected: boundaries.length };
};
export type VoiceWord = { w: string; s: number; e: number };
export type VoiceWordReader = (file: string) => Promise<VoiceWord[] | null>;
const usableWords = (words: VoiceWord[] | null | undefined, text: string) => {
  const list = (words || []).filter((word) => word.e > word.s && speechUnits(word.w) > 0);
  const heard = sumOf(list.map((word) => speechUnits(word.w)));
  return list.length >= 2 && Math.abs(heard / Math.max(1, speechUnits(text)) - 1) <= N.WORDS.COVERAGE ? list : undefined;
};
const phraseCuts = (text: string, words: VoiceWord[], pauses: { at: number; d: number }[]) => {
  const total = sumOf(words.map((word) => speechUnits(word.w)));
  const units = speechUnits(text);
  const reach: number[] = [];
  words.reduce((sum, word) => (reach.push((sum + speechUnits(word.w)) / total), sum + speechUnits(word.w)), 0);
  const cuts: { at: number; d: number; target: number }[] = [];
  for (const mark of punctuationMarks(text)) {
    const progress = speechUnits(text.slice(0, mark.end)) / units;
    let best = -1;
    for (let index = 0; index < words.length - 1; index++) if (best < 0 || Math.abs(reach[index] - progress) < Math.abs(reach[best] - progress)) best = index;
    if (best < 0 || Math.abs(reach[best] - progress) * units > N.WORDS.ALIGN_UNITS) continue;
    const at = (words[best].e + words[best + 1].s) / 2;
    if (pauses.some((pause) => at >= pause.at - N.WORDS.NEAR_PAUSE && at <= pause.at + pause.d + N.WORDS.NEAR_PAUSE) || cuts.some((cut) => Math.abs(cut.at - at) < N.WORDS.NEAR_PAUSE)) continue;
    cuts.push({ at, d: 0, target: 0 });
  }
  return cuts;
};
const wordPaces = (words: VoiceWord[], spans: { from: number; to: number }[]) =>
  spans.map(({ from, to }) => {
    const inside = words.filter((word) => (word.s + word.e) / 2 >= from && (word.s + word.e) / 2 < to);
    const seconds = inside.length ? inside.at(-1)!.e - inside[0].s : 0;
    const syllables = sumOf(inside.map((word) => speechUnits(word.w)));
    return syllables >= N.WORDS.MIN_SYLLABLES && seconds >= N.WORDS.MIN_SECONDS ? { syllables, seconds } : undefined;
  });
export const normalizeReferenceVoiceCadence = async (file: string, text: string, profile: ReferenceCadenceProfile, signal?: AbortSignal, transcribe?: VoiceWordReader): Promise<{ wav: Buffer; cadence: MotionVoiceCadence } | undefined> => {
  const source = trimMotionVoiceEdges(await fs.promises.readFile(file));
  const before = inspectVoiceCadence(source, text);
  if (!before || before.pauses.length > N.MAX_PAUSES) return;
  await fs.promises.writeFile(file, source);
  const words = transcribe ? usableWords(await transcribe(file).catch((error) => (signal?.aborted ? Promise.reject(error) : null)), text) : undefined;
  const output = file + randomUUID() + RUNTIME_VALUES.CADENCE_WAV_A51E3FA2;
  const planned = referencePausePlan(text, before.pauses, profile);
  const matched = new Set(planned.pauses.map((pause) => pause.at));
  const capped = before.pauses
    .filter((pause) => !matched.has(pause.at))
    .map((pause) => ({ at: pause.at, d: pause.d, target: pause.d >= profile.sentence * N.LONG_PAUSE_SHARE ? profile.sentence : profile.clause, progress: undefined as number | undefined }))
    .filter((pause) => pause.d > pause.target * N.CAP_MARGIN);
  const edited = new Map([...planned.pauses, ...capped].map((pause) => [pause.at, pause.target]));
  const pauses = [...before.pauses.map((pause) => ({ at: pause.at, d: pause.d, target: edited.get(pause.at) ?? pause.d })), ...(words ? phraseCuts(text, words, before.pauses) : [])].sort((x, y) => x.at - y.at);
  const clamp = (value: number) => Math.max(N.TEMPO_MIN, Math.min(N.TEMPO_MAX, value));
  const wanted = profile.articulation / before.articulation;
  const fits = wanted >= N.TEMPO_MIN / N.FIT_MARGIN && wanted <= N.TEMPO_MAX * N.FIT_MARGIN;
  let tempo = fits ? clamp(wanted) : 1;
  const spans = Array.from({ length: pauses.length + 1 }, (_, index) => ({ from: index ? pauses[index - 1].at + pauses[index - 1].d : 0, to: pauses[index] ? pauses[index].at : before.seconds }));
  const paces = words ? wordPaces(words, spans) : spanPaces(before.nuclei, spans);
  const measured = paces.filter((pace) => !!pace);
  const lineRate = measured.length > 1 ? sumOf(measured.map((pace) => pace.syllables)) / sumOf(measured.map((pace) => pace.seconds)) : 0;
  const stretch = words ? N.WORD_STRETCH : N.PHRASE_STRETCH;
  const shape = paces.map((pace) => {
    if (!pace || !lineRate) return 1;
    const trust = words ? 1 : Math.min(1, pace.syllables / N.PHRASE_FULL_SYLLABLES);
    return Math.max(1 - stretch, Math.min(1 + stretch, 1 + trust * (lineRate / (pace.syllables / pace.seconds) - 1)));
  });
  const phrases = lineRate ? measured.length : 0;
  const shaped = paces.map((pace, index) => pace && { syllables: pace.syllables * shape[index], seconds: pace.seconds });
  const afterSpans = (after: { seconds: number; pauses: { at: number; d: number }[] }) => Array.from({ length: after.pauses.length + 1 }, (_, index) => ({ from: index ? after.pauses[index - 1].at + after.pauses[index - 1].d : 0, to: after.pauses[index] ? after.pauses[index].at : after.seconds }));
  const render = async () => {
    const filters: string[] = [],
      labels: string[] = [];
    let from = 0;
    for (let i = 0; i <= pauses.length; i++) {
      const pause = pauses[i];
      const cut = !!pause && pause.d === 0;
      const end = pause ? pause.at + (cut ? 0 : N.PAUSE_GUARD) : before.seconds;
      filters.push(`${RUNTIME_VALUES.VALUE_DB0A8F0C}${from.toFixed(6)}${RUNTIME_VALUES.END_332E4C51}${end.toFixed(6)}${RUNTIME_VALUES.ASETPTS_PTS_STARTPTS_ATEMPO_36A3314D}${(tempo * shape[i]).toFixed(6)}${RUNTIME_VALUES.S_125A9899}${i}${COMMON_RUNTIME.SOURCE_TEXT_SYMBOL_45}`);
      labels.push(`${RUNTIME_VALUES.S_125A9899}${i}${COMMON_RUNTIME.SOURCE_TEXT_SYMBOL_45}`);
      if (cut) from = pause.at;
      else if (pause) {
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
    let wav = await render();
    let after = inspectVoiceCadence(wav, text);
    if (!after) return;
    if (fits && Math.abs(after.articulation / profile.articulation - 1) > N.TOLERANCE) {
      const corrected = clamp((tempo * profile.articulation) / after.articulation);
      if (Math.abs(corrected - tempo) > 0.001) {
        tempo = corrected;
        wav = await render();
        after = inspectVoiceCadence(wav, text);
        if (!after) return;
      }
    }
    return {
      wav,
      cadence: {
        before: before.articulation,
        after: after.articulation,
        target: profile.articulation,
        tempo,
        limited: Math.abs(after.articulation / profile.articulation - 1) > N.REVIEW_DELTA,
        pausesMatched: planned.pauses.length,
        pausesExpected: planned.expected,
        ...(fits ? {} : { unfit: true }),
        ...(phrases ? { phrases, phraseSpread: paceSpread(paces), phraseSpreadAfter: paceSpread(words ? shaped : spanPaces(after.nuclei, afterSpans(after))), ...(words ? { timing: "words" as const } : {}) } : {}),
      },
    };
  } finally {
    await fs.promises.rm(output, { force: true }).catch(() => {});
  }
};
