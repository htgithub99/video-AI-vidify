import _ from "lodash";
import { MOTION_VOICE_SPEED as V } from "../../constants/motionVoice.js";
import type { MotionVoiceSpeedSettings, MotionVoiceSpeedTarget } from "../../types/motionVideo.js";
import { writeMotionJsonAtomic } from "./motionFileUtils.js";
import { cleanVoiceSpeed, motionVoiceLibraryFile, readMotionVoiceLibraryJson, readVoiceLibrary } from "./motionVoiceLibraryService.js";
import { fetchLinkSource } from "./motionSourceFetchService.js";
import { speechUnits } from "./motionSpeechRateService.js";
const round = (value: number, step = V.STEP): number => Math.round(value / step) * step;
export const readVoiceSpeedSettings = (): MotionVoiceSpeedSettings => {
  const data = readMotionVoiceLibraryJson<Partial<MotionVoiceSpeedSettings>>(V.FILE, {});
  return { ...(data.target ? { target: data.target } : {}), correction: _.clamp(Number(data.correction) || 1, V.CORRECTION_RANGE[0], V.CORRECTION_RANGE[1]), rates: data.rates && typeof data.rates === "object" ? data.rates : {} };
};
const writeVoiceSpeedSettings = (settings: MotionVoiceSpeedSettings): MotionVoiceSpeedSettings => {
  writeMotionJsonAtomic(motionVoiceLibraryFile(V.FILE), settings);
  return settings;
};
export const measureTranscriptRate = (raw: string, focus?: number): { rate: number; window?: number } => {
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
  return { rate: _.round(rate, 3), ...(window ? { window: _.round(window, 3) } : {}) };
};
export const measureVoiceSpeedReference = async (url: string, signal?: AbortSignal): Promise<MotionVoiceSpeedSettings> => {
  const fetched = await fetchLinkSource(url, signal);
  if (!fetched.ok) throw new Error(fetched.note || V.ERRORS.NO_TRANSCRIPT);
  const focus = Number(V.TIME_PARAM_RE.exec(url)?.[1]);
  const measured = measureTranscriptRate(fetched.raw, Number.isFinite(focus) ? focus : undefined);
  const target: MotionVoiceSpeedTarget = { rate: measured.rate, url, title: fetched.title, ...(measured.window ? { window: measured.window } : {}), at: Date.now() };
  return writeVoiceSpeedSettings({ ...readVoiceSpeedSettings(), target, correction: 1 });
};
export const clearVoiceSpeedReference = (): MotionVoiceSpeedSettings => writeVoiceSpeedSettings(_.omit({ ...readVoiceSpeedSettings(), correction: 1 }, "target") as MotionVoiceSpeedSettings);
export const voiceSpeedKey = (voiceId: string): string => {
  const manual = cleanVoiceSpeed(readVoiceLibrary()[voiceId]?.speed);
  if (manual) return String(manual);
  const settings = readVoiceSpeedSettings();
  return settings.target ? [V.AUTO, settings.target.rate, settings.correction.toFixed(3)].join("|") : String(1);
};
export const voiceTempoFactor = (voiceId: string, text: string, rawSeconds: number): number => {
  const manual = cleanVoiceSpeed(readVoiceLibrary()[voiceId]?.speed);
  if (manual) return manual;
  const settings = readVoiceSpeedSettings();
  if (!settings.target) return 1;
  const units = speechUnits(text);
  const measured = units >= V.MIN_UNITS && rawSeconds > 0 ? _.clamp(units / rawSeconds, V.RATE_RANGE[0], V.RATE_RANGE[1]) : undefined;
  const natural = measured || settings.rates[voiceId];
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
  const step = _.clamp(settings.target.rate / actual, V.CORRECTION_STEP[0], V.CORRECTION_STEP[1]);
  const correction = _.clamp(_.round(settings.correction * (1 + (step - 1) * V.CORRECTION_WEIGHT), 3), V.CORRECTION_RANGE[0], V.CORRECTION_RANGE[1]);
  writeVoiceSpeedSettings({ ...settings, correction });
  return V.LOG.FEEDBACK(settings.target.rate, actual, correction);
};
export const voicesUseAutoSpeed = (voiceIds: string[]): boolean => {
  const library = readVoiceLibrary();
  return !!readVoiceSpeedSettings().target && _.some(voiceIds, (id) => !cleanVoiceSpeed(library[id]?.speed));
};
