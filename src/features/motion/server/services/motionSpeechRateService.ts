import { parseJson, stringifyJson } from "../../../../lib/jsonStringify.js";
import * as SRT from "../../../../constants/sourceText.js";
import fs from "fs";
import _ from "lodash";
import path from "path";
import { createHash } from "crypto";
import * as MR from "../../../../constants/motionRuntime.js";
import { MOTION_STORY_CONFIG as C } from "../../../../constants/motionVideo.js";
import { MOTION_VOICE_LIBRARY, MOTION_VOICE_SPEED as V, MOTION_VOICE, MOTION_VOICE_PACING } from "../../../../constants/motionVoice.js";
import type { MotionStoryScript, MotionVoiceSpeedSettings } from "../../../../types/motionVideo.js";
import { findVoiceChannel, readVoiceLibrary, readMotionVoiceLibraryJson } from "./motionVoiceLibraryService.js";
import { writeMotionJsonAtomic } from "./motionFileUtils.js";
import { getMotionRootDirectory } from "./motionLibraryService.js";
interface SpeechRateStore {
  global: Record<string, number>;
  channels: Record<string, Record<string, number>>;
  profiles: Record<string, Record<string, number>>;
}
const GLOBAL_KEY = SRT.SOURCE_BROWSER_TEXT_SYMBOL;
const rateFile = (): string => path.join(getMotionRootDirectory(), C.SPEECH_RATE_FILE);
const readStore = (): SpeechRateStore => {
  try {
    const data = parseJson(fs.readFileSync(rateFile(), MR.MOTION_TEXT_UTF8));
    return { global: data?.global || {}, channels: data?.channels || {}, profiles: data?.profiles || {} };
  } catch {
    return { global: {}, channels: {}, profiles: {} };
  }
};
const languageOf = (value: unknown): string => (value === MR.MOTION_TEXT_EN ? MR.MOTION_TEXT_EN : MR.MOTION_TEXT_VI);
const channelOf = (ref: unknown): string => _.toString(ref).split(MOTION_VOICE_LIBRARY.REF_SEPARATOR)[0] || GLOBAL_KEY;
export const speechUnits = (text: unknown): number =>
  _.toString(text)
    .split(/\s+/)
    .filter((word) => /[\p{L}\p{N}]/u.test(word)).length;
export const defaultSpeechRate = (language: unknown): number => (languageOf(language) === MR.MOTION_TEXT_EN ? C.EN_WORDS_PER_SECOND : C.VI_SYLLABLES_PER_SECOND);
const speechProfile = (channelRef: unknown) => {
  const channel = findVoiceChannel(_.toString(channelRef));
  const settings = readMotionVoiceLibraryJson<Partial<MotionVoiceSpeedSettings>>(V.FILE, {});
  const library = readVoiceLibrary();
  const voices = _.compact([channel?.narratorVoiceId, ...Object.values(channel?.roleVoices || {})]).sort();
  const target = settings.target;
  const correction = _.clamp(settings.correction || 1, V.CORRECTION_RANGE[0], V.CORRECTION_RANGE[1]);
  const key = createHash(MR.MOTION_TEXT_SHA256)
    .update(
      stringifyJson([
        channelOf(channelRef),
        channel?.narratorVoiceId,
        Object.entries(channel?.roleVoices || {}).sort(([a], [b]) => a.localeCompare(b)),
        voices.map((id) => [id, library[id]?.speed || null]),
        target ? [target.fingerprint || target.url || target.title, target.rate, target.rateBasis || target.source, target.pauses, correction] : null,
        MOTION_VOICE.TRACK_VERSION,
        MOTION_VOICE_PACING.VERSION,
      ]),
    )
    .digest(MR.MOTION_TEXT_HEX);
  const referenceRate = target?.rateBasis === V.BASIS.TEXT && Number.isFinite(target.rate) && target.rate > 0 && !library[channel?.narratorVoiceId || MR.MOTION_TEXT_EMPTY]?.speed ? _.clamp(target.rate * correction, C.SPEECH_RATE_MIN, C.SPEECH_RATE_MAX) : undefined;
  return { key, referenceRate, legacy: !channel && !target };
};
export const motionSpeechRateProfile = (channelRef: unknown): string => speechProfile(channelRef).key;
export const motionSpeechRate = (channelRef: unknown, language: unknown): number => {
  const store = readStore();
  const lang = languageOf(language);
  const profile = speechProfile(channelRef);
  return store.profiles[profile.key]?.[lang] || profile.referenceRate || (profile.legacy ? store.channels[channelOf(channelRef)]?.[lang] || store.global[lang] : undefined) || defaultSpeechRate(lang);
};
export const recordSpeechRate = (script: MotionStoryScript, totalSeconds: number, expectedProfile?: string): number | null => {
  const profile = speechProfile(script.voiceChannel);
  if (expectedProfile && profile.key !== expectedProfile) return null;
  const units = _.sumBy(script.beats, (beat) => speechUnits(beat.narration));
  if (!units || !(totalSeconds >= C.SPEECH_RATE_MIN_SECONDS)) return null;
  const measured = _.clamp(units / totalSeconds, C.SPEECH_RATE_MIN, C.SPEECH_RATE_MAX);
  const lang = languageOf(script.language);
  const channel = channelOf(script.voiceChannel);
  const store = readStore();
  const blend = (previous?: number) => _.round(previous ? previous * (1 - C.SPEECH_RATE_WEIGHT) + measured * C.SPEECH_RATE_WEIGHT : measured, 3);
  store.channels[channel] = { ...(store.channels[channel] || {}), [lang]: blend(store.channels[channel]?.[lang]) };
  store.global[lang] = blend(store.global[lang]);
  const previous = store.profiles[profile.key];
  delete store.profiles[profile.key];
  store.profiles[profile.key] = { ...previous, [lang]: blend(previous?.[lang]) };
  store.profiles = Object.fromEntries(Object.entries(store.profiles).slice(-C.SPEECH_RATE_PROFILES_MAX));
  writeMotionJsonAtomic(rateFile(), store);
  return measured;
};
