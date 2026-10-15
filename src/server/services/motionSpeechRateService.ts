import * as SRT from "../../constants/sourceText.js";
import fs from "fs";
import _ from "lodash";
import path from "path";
import * as MR from "../../constants/motionRuntime.js";
import { MOTION_STORY_CONFIG as C } from "../../constants/motionVideo.js";
import { MOTION_VOICE_LIBRARY } from "../../constants/motionVoice.js";
import type { MotionStoryScript } from "../../types/motionVideo.js";
import { writeMotionJsonAtomic } from "./motionFileUtils.js";
import { getMotionRootDirectory } from "./motionLibraryService.js";
interface SpeechRateStore { global: Record<string, number>; channels: Record<string, Record<string, number>>; }
const GLOBAL_KEY = SRT.SOURCE_BROWSER_TEXT_SYMBOL;
const rateFile = (): string => path.join(getMotionRootDirectory(), C.SPEECH_RATE_FILE);
const readStore = (): SpeechRateStore => {
  try {
    const data = JSON.parse(fs.readFileSync(rateFile(), MR.MOTION_TEXT_UTF8));
    return { global: data?.global || {}, channels: data?.channels || {} };
  } catch {
    return { global: {}, channels: {} };
  }
};
const languageOf = (value: unknown): string => (value === MR.MOTION_TEXT_EN ? MR.MOTION_TEXT_EN : MR.MOTION_TEXT_VI);
const channelOf = (ref: unknown): string => _.toString(ref).split(MOTION_VOICE_LIBRARY.REF_SEPARATOR)[0] || GLOBAL_KEY;
export const speechUnits = (text: unknown): number =>
  _.toString(text)
    .split(/\s+/)
    .filter((word) => /[\p{L}\p{N}]/u.test(word)).length;
export const defaultSpeechRate = (language: unknown): number => (languageOf(language) === MR.MOTION_TEXT_EN ? C.EN_WORDS_PER_SECOND : C.VI_SYLLABLES_PER_SECOND);
export const motionSpeechRate = (channelRef: unknown, language: unknown): number => {
  const store = readStore();
  const lang = languageOf(language);
  return store.channels[channelOf(channelRef)]?.[lang] || store.global[lang] || defaultSpeechRate(lang);
};
export const recordSpeechRate = (script: MotionStoryScript, totalSeconds: number): number | null => {
  const units = _.sumBy(script.beats, (beat) => speechUnits(beat.narration));
  if (!units || !(totalSeconds >= C.SPEECH_RATE_MIN_SECONDS)) return null;
  const measured = _.clamp(units / totalSeconds, C.SPEECH_RATE_MIN, C.SPEECH_RATE_MAX);
  const lang = languageOf(script.language);
  const channel = channelOf(script.voiceChannel);
  const store = readStore();
  const blend = (previous?: number) => _.round(previous ? previous * (1 - C.SPEECH_RATE_WEIGHT) + measured * C.SPEECH_RATE_WEIGHT : measured, 3);
  store.channels[channel] = { ...(store.channels[channel] || {}), [lang]: blend(store.channels[channel]?.[lang]) };
  store.global[lang] = blend(store.global[lang]);
  writeMotionJsonAtomic(rateFile(), store);
  return measured;
};
