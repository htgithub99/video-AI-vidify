import _ from "lodash";
import { MOTION_VOICE_SPEED as V } from "../../constants/motionVoice.js";
import type { MotionVoiceSpeedSettings, MotionVoiceSpeedTarget } from "../../types/motionVideo.js";
import { writeMotionJsonAtomic } from "./motionFileUtils.js";
import { cleanVoiceSpeed, motionVoiceLibraryFile, readMotionVoiceLibraryJson, readVoiceLibrary } from "./motionVoiceLibraryService.js";
import { fetchLinkSource } from "./motionSourceFetchService.js";
import { speechUnits } from "./motionSpeechRateService.js";
import os from "os";
import path from "path";
import fs from "fs";
import { randomUUID } from "crypto";
import { measureVoicePaceFile } from "./motionVoicePaceService.js";
const round = (value: number, step = V.STEP): number => Math.round(value / step) * step;
export const readVoiceSpeedSettings = (): MotionVoiceSpeedSettings => {
  const data = readMotionVoiceLibraryJson<Partial<MotionVoiceSpeedSettings>>(V.FILE, {});
  return { ...(data.target ? { target: data.target } : {}), correction: _.clamp(Number(data.correction) || 1, V.CORRECTION_RANGE[0], V.CORRECTION_RANGE[1]), rates: data.rates && _.isObjectLike(data.rates) ? data.rates : {} };
};
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
  const target: MotionVoiceSpeedTarget = { rate: measured.rate, url, title: fetched.title, ...(measured.window ? { window: measured.window } : {}), ...(measured.pauses ? { pauses: measured.pauses } : {}), at: Date.now() };
  return writeVoiceSpeedSettings({ ...readVoiceSpeedSettings(), target, correction: 1 });
};
export const measureVoiceSpeedAudio = async (name: string, base64: string, signal?: AbortSignal): Promise<MotionVoiceSpeedSettings> => {
  const ext = _.toLower(path.extname(name));
  if (!_.includes(V.AUDIO.EXTS as readonly string[], ext)) throw new Error(V.ERRORS.AUDIO_FORMAT);
  const buf = Buffer.from(base64.replace(V.AUDIO.DATA_URL_RE, V.EMPTY), V.BASE64);
  if (buf.length < V.MIN_AUDIO_BYTES) throw new Error(V.ERRORS.AUDIO_EMPTY);
  const file = path.join(os.tmpdir(), V.AUDIO.TMP_PREFIX + randomUUID() + ext);
  try {
    await fs.promises.writeFile(file, buf);
    const r = await measureVoicePaceFile(file, signal);
    const target: MotionVoiceSpeedTarget = { rate: _.round(r.articulation / V.GAP_FACTOR, 3), url: V.EMPTY, title: path.basename(name), source: V.SOURCE_AUDIO, pauses: r.pauses, phrase: r.phrase, speechRatio: r.speechRatio, at: Date.now() };
    return writeVoiceSpeedSettings({ ...readVoiceSpeedSettings(), target, correction: 1 });
  } finally {
    await fs.promises.rm(file, { force: true }).catch(_.noop);
  }
};
export const clearVoiceSpeedReference = (): MotionVoiceSpeedSettings => writeVoiceSpeedSettings(_.omit({ ...readVoiceSpeedSettings(), correction: 1 }, V.TARGET_FIELD) as MotionVoiceSpeedSettings);
export const voiceSpeedKey = (voiceId: string): string => {
  const manual = cleanVoiceSpeed(readVoiceLibrary()[voiceId]?.speed);
  if (manual) return String(manual);
  const settings = readVoiceSpeedSettings();
  return settings.target ? [V.AUTO, settings.target.rate, settings.correction.toFixed(3)].join(V.KEY_SEPARATOR) : String(1);
};
export const knownVoiceTempoFactor = (voiceId: string): number | null => {
  const manual = cleanVoiceSpeed(readVoiceLibrary()[voiceId]?.speed);
  if (manual) return manual;
  const settings = readVoiceSpeedSettings();
  if (!settings.target) return 1;
  const natural = settings.rates[voiceId];
  return natural ? _.clamp(round((settings.target.rate * V.GAP_FACTOR * settings.correction) / natural), V.AUTO_MIN, V.AUTO_MAX) : null;
};
export const voiceTempoFactor = (voiceId: string, text: string, rawSeconds: number): number => {
  const manual = cleanVoiceSpeed(readVoiceLibrary()[voiceId]?.speed);
  if (manual) return manual;
  const settings = readVoiceSpeedSettings();
  if (!settings.target) return 1;
  const units = speechUnits(text);
  const measured = units >= V.MIN_UNITS && rawSeconds > 0 ? _.clamp(units / rawSeconds, V.RATE_RANGE[0], V.RATE_RANGE[1]) : undefined;
  const natural = settings.rates[voiceId] || measured;
  if (measured) {
    const previous = settings.rates[voiceId];
    writeVoiceSpeedSettings({ ...settings, rates: { ...settings.rates, [voiceId]: _.round(previous ? previous * (1 - V.RATE_WEIGHT) + measured * V.RATE_WEIGHT : measured, 3) } });
  }
  if (!natural) return 1;
  return _.clamp(round((settings.target.rate * V.GAP_FACTOR * settings.correction) / natural), V.AUTO_MIN, V.AUTO_MAX);
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
