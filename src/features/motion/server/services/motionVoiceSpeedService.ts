import _ from "lodash";
import { MOTION_VOICE_SPEED as V } from "../../../../constants/motionVoice.js";
import type { MotionVoiceSpeedSettings, MotionVoiceSpeedTarget } from "../../../../types/motionVideo.js";
import { writeMotionJsonAtomic } from "./motionFileUtils.js";
import { cleanVoiceSpeed, motionVoiceLibraryFile, readMotionVoiceLibraryJson, readVoiceLibrary } from "./motionVoiceLibraryService.js";
import { fetchLinkSource } from "./motionSourceFetchService.js";
import { speechUnits } from "./motionSpeechRateService.js";
import os from "os";
import path from "path";
import fs from "fs";
import { createHash, randomUUID } from "crypto";
import { measureVoicePaceFile } from "./motionVoicePaceService.js";
import { AsyncLocalStorage } from "node:async_hooks";
import * as MR from "../../../../constants/motionRuntime.js";
import { transcribeVieneuAudio } from "../../../../server/services/vieneuTtsService.js";
import { runMotionAudioProcess } from "./motionSoundMixService.js";
const voiceSpeedScope = new AsyncLocalStorage<{ settings: MotionVoiceSpeedSettings; manual: ReturnType<typeof readVoiceLibrary> }>();
const round = (value: number, step = V.STEP): number => Math.round(value / step) * step;
const storedVoiceSpeedSettings = (): MotionVoiceSpeedSettings => {
  const data = readMotionVoiceLibraryJson<Partial<MotionVoiceSpeedSettings>>(V.FILE, {});
  return { ...(data.target ? { target: data.target } : {}), correction: _.clamp(Number(data.correction) || 1, V.CORRECTION_RANGE[0], V.CORRECTION_RANGE[1]), rates: data.rates && _.isObjectLike(data.rates) ? data.rates : {}, acousticRates: data.acousticRates && _.isObjectLike(data.acousticRates) ? data.acousticRates : {} };
};
export const readVoiceSpeedSettings = (): MotionVoiceSpeedSettings => voiceSpeedScope.getStore()?.settings || storedVoiceSpeedSettings();
export const withMotionVoiceSpeedSnapshot = <T>(run: () => T): T => (voiceSpeedScope.getStore() ? run() : voiceSpeedScope.run({ settings: structuredClone(storedVoiceSpeedSettings()), manual: structuredClone(readVoiceLibrary()) }, run));
const manualVoiceSpeed = (voiceId: string): number | undefined => cleanVoiceSpeed((voiceSpeedScope.getStore()?.manual || readVoiceLibrary())[voiceId]?.speed);
export const voiceUsesReferenceSpeed = (voiceId: string): boolean => !manualVoiceSpeed(voiceId) && !!readVoiceSpeedSettings().target;
const writeVoiceSpeedSettings = (settings: MotionVoiceSpeedSettings): MotionVoiceSpeedSettings => {
  writeMotionJsonAtomic(motionVoiceLibraryFile(V.FILE), settings);
  return settings;
};
export const measureTranscriptRate = (raw: string, focus?: number): { rate: number; window?: number; pauses?: MotionVoiceSpeedTarget["pauses"] } => {
  const segments = _.compact(
    raw.split(/\r?\n/).map((line) => {
      const m = V.STAMP_RE.exec(line.trim());
      return m ? { t: (Number(m[1]) || 0) * 3600 + Number(m[2]) * 60 + Number(m[3]), units: speechUnits(m[4]) } : null;
    }),
  );
  if (segments.length < 3) throw new Error(V.ERRORS.NO_TRANSCRIPT);
  const span = (list: typeof segments) => {
    if (list.length < 2) return undefined;
    const seconds = list[list.length - 1].t - list[0].t;
    return seconds >= V.MIN_SPAN_SECONDS ? _.sumBy(_.initial(list), (s) => s.units) / seconds : undefined;
  };
  const rate = span(segments);
  if (!rate) throw new Error(V.ERRORS.TOO_SHORT);
  const near = focus == null ? [] : _.filter(segments, (s) => Math.abs(s.t - focus) <= V.WINDOW_SECONDS);
  const window = span(near);
  const pauses = measurePauses(segments);
  return { rate: _.round(rate, 3), ...(window ? { window: _.round(window, 3) } : {}), ...(pauses ? { pauses } : {}) };
};
const quantile = (list: number[], q: number): number => {
  const sorted = _.sortBy(list);
  return sorted[Math.min(sorted.length - 1, Math.max(0, Math.round(q * (sorted.length - 1))))];
};
const measurePauses = (segments: { t: number; units: number }[]): MotionVoiceSpeedTarget["pauses"] | undefined => {
  const steps = _.compact(
    _.map(_.initial(segments), (s, i) => {
      const dt = segments[i + 1].t - s.t;
      return dt > 0 && dt <= V.PAUSE_MAX_STEP && s.units >= V.MIN_UNITS ? { dt, units: s.units } : null;
    }),
  );
  if (steps.length < V.PAUSE_MIN_STEPS) return undefined;
  const articulation = quantile(
    _.map(steps, (x) => x.units / x.dt),
    V.PAUSE_ARTICULATION_Q,
  );
  const gaps = _.filter(
    _.map(steps, (x) => x.dt - x.units / articulation),
    (g) => g >= V.PAUSE_MIN,
  );
  if (gaps.length < V.PAUSE_MIN_STEPS / 2) return undefined;
  const at = (q: number) => _.round(_.clamp(quantile(gaps, q), V.PAUSE_RANGE[0], V.PAUSE_RANGE[1]), 2);
  return { sentence: at(V.PAUSE_Q[0]), suspense: at(V.PAUSE_Q[1]), beat: at(V.PAUSE_Q[2]), articulation: _.round(articulation, 2) };
};
export const measureVoiceSpeedReference = async (url: string, signal?: AbortSignal): Promise<MotionVoiceSpeedSettings> => {
  const fetched = await fetchLinkSource(url, signal);
  if (!fetched.ok) throw new Error(fetched.note || V.ERRORS.NO_TRANSCRIPT);
  const focus = Number(V.TIME_PARAM_RE.exec(url)?.[1]);
  const measured = measureTranscriptRate(fetched.raw, Number.isFinite(focus) ? focus : undefined);
  const target: MotionVoiceSpeedTarget = { rateBasis: V.BASIS.TEXT, rate: measured.rate, url, title: fetched.title, ...(measured.window ? { window: measured.window } : {}), ...(measured.pauses ? { pauses: measured.pauses } : {}), at: Date.now() };
  return writeVoiceSpeedSettings({ ...readVoiceSpeedSettings(), target, correction: 1, rates: {}, acousticRates: {} });
};
export const measureVoiceSpeedAudio = async (name: string, base64: string, signal?: AbortSignal): Promise<MotionVoiceSpeedSettings> => {
  const ext = _.toLower(path.extname(name));
  if (!_.includes(V.AUDIO.EXTS as readonly string[], ext)) throw new Error(V.ERRORS.AUDIO_FORMAT);
  const buf = Buffer.from(base64.replace(V.AUDIO.DATA_URL_RE, V.EMPTY), V.BASE64);
  if (buf.length < V.MIN_AUDIO_BYTES) throw new Error(V.ERRORS.AUDIO_EMPTY);
  const file = path.join(os.tmpdir(), V.AUDIO.TMP_PREFIX + randomUUID() + ext);
  const transcriptFile = file + MR.MOTION_TEXT_WAV;
  try {
    await fs.promises.writeFile(file, buf);
    const r = await measureVoicePaceFile(file, signal);
    let units = 0;
    try {
      await runMotionAudioProcess([MR.MOTION_TEXT_I, file, MR.MOTION_TEXT_AC, MR.MOTION_TEXT_1, MR.MOTION_TEXT_AR, String(V.AUDIO.SAMPLE_RATE), MR.MOTION_TEXT_C_A, MR.MOTION_TEXT_PCM_S16LE, transcriptFile], signal);
      const transcript = await transcribeVieneuAudio(transcriptFile, MR.MOTION_TEXT_EMPTY, signal);
      const count = speechUnits(transcript.text);
      if (count / r.seconds >= V.RATE_RANGE[0] && count / r.seconds <= V.RATE_RANGE[1]) units = count;
    } catch (error) {
      if (signal?.aborted) throw error;
    }
    const rate = units >= V.MIN_UNITS ? units / r.seconds : r.rate;
    const target: MotionVoiceSpeedTarget = {
      rateBasis: units >= V.MIN_UNITS ? V.BASIS.TEXT : V.BASIS.ACOUSTIC,
      rate: _.round(rate, 3),
      url: V.EMPTY,
      title: path.basename(name),
      fingerprint: createHash(MR.MOTION_TEXT_SHA256).update(buf).digest(MR.MOTION_TEXT_HEX),
      source: V.SOURCE_AUDIO,
      pauses: { ...r.pauses, articulation: _.round(rate / r.speechRatio, 2) },
      phrase: r.phrase,
      speechRatio: r.speechRatio,
      at: Date.now(),
    };
    return writeVoiceSpeedSettings({ ...readVoiceSpeedSettings(), target, correction: 1, rates: {}, acousticRates: {} });
  } finally {
    await fs.promises.rm(file, { force: true }).catch(_.noop);
    await fs.promises.rm(transcriptFile, { force: true }).catch(_.noop);
  }
};
export const clearVoiceSpeedReference = (): MotionVoiceSpeedSettings => writeVoiceSpeedSettings(_.omit({ ...readVoiceSpeedSettings(), correction: 1 }, V.TARGET_FIELD) as MotionVoiceSpeedSettings);
export const voiceSpeedKey = (voiceId: string): string => {
  const manual = manualVoiceSpeed(voiceId);
  if (manual) return String(manual);
  const settings = readVoiceSpeedSettings();
  return settings.target ? [V.AUTO, settings.target.fingerprint || settings.target.title, settings.target.rate, settings.target.rateBasis || settings.target.source, settings.correction.toFixed(3)].join(V.KEY_SEPARATOR) : String(1);
};
export const voiceSpeedUsesAcoustics = (target = readVoiceSpeedSettings().target): boolean => target?.rateBasis === V.BASIS.ACOUSTIC || (!target?.rateBasis && target?.source === V.SOURCE_AUDIO);
const tempoFromRate = (settings: MotionVoiceSpeedSettings, natural: number): number => _.clamp(round((settings.target!.rate * settings.correction) / natural), V.AUTO_MIN, V.AUTO_MAX);
export const knownVoiceTempoFactor = (voiceId: string): number | null => {
  const manual = manualVoiceSpeed(voiceId);
  if (manual) return manual;
  const settings = readVoiceSpeedSettings();
  if (!settings.target) return 1;
  const natural = (voiceSpeedUsesAcoustics(settings.target) ? settings.acousticRates : settings.rates)?.[voiceId];
  return natural ? tempoFromRate(settings, natural) : null;
};
export const voiceTempoFactor = (voiceId: string, text: string, rawSeconds: number, acousticRate?: number): number => {
  const manual = manualVoiceSpeed(voiceId);
  if (manual) return manual;
  const settings = readVoiceSpeedSettings();
  if (!settings.target) return 1;
  const units = speechUnits(text);
  const acoustic = voiceSpeedUsesAcoustics(settings.target);
  const rates = acoustic ? (settings.acousticRates ||= {}) : settings.rates;
  const candidate = acoustic ? acousticRate : units / rawSeconds;
  const measured = units >= V.MIN_UNITS && rawSeconds > 0 && candidate && Number.isFinite(candidate) ? _.clamp(candidate, V.RATE_RANGE[0], V.RATE_RANGE[1]) : undefined;
  const natural = rates[voiceId] || measured;
  if (measured) {
    const previous = rates[voiceId];
    const rate = _.round(previous ? previous * (1 - V.RATE_WEIGHT) + measured * V.RATE_WEIGHT : measured, 3);
    rates[voiceId] = rate;
    const latest = storedVoiceSpeedSettings();
    writeVoiceSpeedSettings(acoustic ? { ...latest, acousticRates: { ...latest.acousticRates, [voiceId]: rate } } : { ...latest, rates: { ...latest.rates, [voiceId]: rate } });
  }
  if (!natural) return 1;
  return tempoFromRate(settings, natural);
};
export const recordVoiceSpeedFeedback = (units: number, totalSeconds: number, usedAuto: boolean): string | undefined => {
  const settings = readVoiceSpeedSettings();
  if (!settings.target || !usedAuto || !(units > 0) || !(totalSeconds > V.MIN_SPAN_SECONDS / 2)) return undefined;
  const actual = units / totalSeconds;
  return V.LOG.FEEDBACK(settings.target.rate, actual, settings.correction);
};
export const voicesUseAutoSpeed = (voiceIds: string[]): boolean => {
  const library = readVoiceLibrary();
  return !!readVoiceSpeedSettings().target && _.some(voiceIds, (id) => !cleanVoiceSpeed(library[id]?.speed));
};
