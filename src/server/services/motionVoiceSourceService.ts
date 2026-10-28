import * as MR from "../../constants/motionRuntime.js";
import fs from "fs";
import path from "path";
import _ from "lodash";
import { randomUUID } from "crypto";
import { MOTION_VOICE as V, MOTION_VOICE_LIBRARY as L } from "../../constants/motionVoice.js";
import type { MotionVoicePreset } from "../../types/motionVideo.js";
import { writeMotionJsonAtomic } from "./motionFileUtils.js";
import { listVieneuVoices, synthesizeVieneuSpeech, type VieneuDelivery } from "./vieneuTtsService.js";
import { listTrainedVoices, trainedVoice, trainedVoiceTarget } from "./motionVoiceTrainService.js";
import { MOTION_VOICE_TRAIN } from "../../constants/motionVoiceTrain.js";
import { getAi33ApiKey, synthesizeAi33Speech } from "./ai33TtsService.js";
import { API_QUERY_PARAMS, EXTERNAL_URLS, HTTP_HEADERS } from "../../constants";
import { runMotionAudioProcess } from "./motionSoundMixService.js";
import { motionVoiceLibraryFile, readMotionVoiceLibraryJson, updateVoiceMeta } from "./motionVoiceLibraryService.js";
import { isAi33Voice } from "../../lib/motionVoice.js";
export { isAi33Voice } from "../../lib/motionVoice.js";
interface Ai33Voice {
  voiceId: string;
  provider?: string;
  name: string;
  gender?: string;
  age?: string;
  language?: string;
  description?: string;
  previewUrl?: string;
}
const ai33File = (): string => motionVoiceLibraryFile(L.AI33_FILE);
const readAi33 = (): Record<string, Ai33Voice> => readMotionVoiceLibraryJson(L.AI33_FILE, {});
const text = (value: unknown, max: number): string => _.trim(_.toString(value ?? MR.MOTION_TEXT_EMPTY)).slice(0, max);
const genderOf = (value: unknown): string | undefined => {
  const g = _.toLower(_.toString(value));
  return g === MR.MOTION_TEXT_MALE || g === MR.MOTION_TEXT_FEMALE ? g : undefined;
};
const presetOf = (id: string, v: Ai33Voice): MotionVoicePreset => ({ id, name: v.name, gender: v.gender, age: v.age, description: v.description, language: v.language, source: L.AI33_SOURCE });
export const listAi33Voices = (): MotionVoicePreset[] => _.map(_.toPairs(readAi33()), ([id, v]) => presetOf(id, v));
export const addAi33Voice = (raw: any): MotionVoicePreset => {
  const voiceId = text(raw?.voice_id ?? raw?.voiceId, L.AI33_ID_MAX),
    provider = text(raw?.provider, L.AI33_ID_MAX) || undefined,
    name = text(raw?.name, L.NAME_MAX);
  if (!voiceId || !name) throw new Error(L.AI33_INVALID);
  const id = (L.AI33_PREFIX + _.compact([provider, voiceId]).join(L.AI33_JOIN).replace(L.AI33_ID_RE, MR.MOTION_TEXT_EMPTY)).slice(0, L.AI33_ID_MAX);
  const age = L.AI33_AGE_MAP[_.toLower(_.toString(raw?.age))] || V.ADULT;
  const description = text(_.compact([raw?.description, raw?.accent, raw?.language || raw?.locale]).join(MR.MOTION_TEXT_SYMBOL_41), L.AI33_DESCRIPTION_MAX) || undefined;
  const previewUrl = L.AI33_PREVIEW_RE.test(_.toString(raw?.preview_url ?? raw?.previewUrl)) ? _.toString(raw?.preview_url ?? raw?.previewUrl) : undefined;
  const voice: Ai33Voice = { voiceId, provider, name, gender: genderOf(raw?.gender), age, language: text(raw?.language || raw?.locale, L.NAME_MAX) || undefined, description, previewUrl };
  writeMotionJsonAtomic(ai33File(), { ...readAi33(), [id]: voice });
  updateVoiceMeta(id, {}, true);
  return presetOf(id, voice);
};
export const removeAi33Voice = (id: string): void => {
  const all = readAi33();
  if (!all[id]) return;
  writeMotionJsonAtomic(ai33File(), _.omit(all, id));
};
export const listMotionVoices = async (signal?: AbortSignal, log?: (value: string) => void): Promise<MotionVoicePreset[]> => {
  const extra = [...listAi33Voices(), ..._.map(listTrainedVoices(), (v) => ({ id: v.id, name: v.name, gender: v.gender, description: v.description + MOTION_VOICE_TRAIN.LORA_TAG }) as MotionVoicePreset)];
  try {
    return [...(await listVieneuVoices(signal, log)), ...extra];
  } catch (error) {
    if (signal?.aborted || !extra.length) throw error;
    log?.(_.toString((error as Error)?.message || error));
    return extra;
  }
};
const toWav = async (buffer: Buffer, file: string, signal?: AbortSignal): Promise<void> => {
  const source = file + randomUUID() + L.AI33_DECODE_EXT;
  fs.mkdirSync(path.dirname(file), { recursive: true });
  try {
    await fs.promises.writeFile(source, buffer);
    await runMotionAudioProcess([MR.MOTION_TEXT_I, source, MR.MOTION_TEXT_AR, String(V.SAMPLE_RATE), MR.MOTION_TEXT_AC, MR.MOTION_TEXT_1, file], signal);
  } finally {
    await fs.promises.rm(source, { force: true }).catch(() => {});
  }
};
const findAi33Preview = async (voice: Ai33Voice, signal?: AbortSignal): Promise<string | undefined> => {
  const params = new URLSearchParams({ [API_QUERY_PARAMS.SEARCH]: voice.name, [API_QUERY_PARAMS.PAGE]: String(1), [API_QUERY_PARAMS.PAGE_SIZE]: String(L.AI33_LOOKUP_SIZE), ...(voice.provider ? { [API_QUERY_PARAMS.PROVIDER]: voice.provider } : {}) });
  const response = await fetch(EXTERNAL_URLS.AI33_VOICES + L.AI33_QUERY_MARK + params.toString(), { headers: { [HTTP_HEADERS.XI_API_KEY]: await getAi33ApiKey() }, signal });
  if (!response.ok) return undefined;
  const data: any = await response.json();
  const match = _.find(_.castArray(data?.data || []), (item: any) => item?.voice_id === voice.voiceId);
  const url = _.toString(match?.preview_url);
  return L.AI33_PREVIEW_RE.test(url) ? url : undefined;
};
export const ai33VoiceSample = async (id: string, file: string, signal?: AbortSignal): Promise<boolean> => {
  const all = readAi33(),
    voice = all[id];
  if (!voice) return false;
  let url = voice.previewUrl;
  if (!url) {
    url = await findAi33Preview(voice, signal).catch(() => undefined);
    if (!url) return false;
    writeMotionJsonAtomic(ai33File(), { ...readAi33(), [id]: { ...voice, previewUrl: url } });
  }
  const response = await fetch(url, { signal });
  if (!response.ok) return false;
  await toWav(Buffer.from(await response.arrayBuffer()), file, signal);
  return true;
};
let ai33Queue: Promise<unknown> = Promise.resolve();
const ai33Serial = <T>(work: () => Promise<T>): Promise<T> => {
  const job = ai33Queue.then(work, work);
  ai33Queue = job.catch(() => {});
  return job;
};
export const synthesizeMotionSpeech = async (speech: string, voiceId: string, file: string, signal?: AbortSignal, log?: (value: string) => void, delivery?: VieneuDelivery): Promise<{ seconds: number }> => {
  if (_.startsWith(voiceId, MOTION_VOICE_TRAIN.ID_PREFIX)) {
    const trained = trainedVoice(voiceId);
    if (!trained) throw new Error(L.VOICE_NOT_FOUND);
    return synthesizeVieneuSpeech(speech, trained.name, file, signal, log, delivery, trainedVoiceTarget(trained));
  }
  if (!isAi33Voice(voiceId)) return synthesizeVieneuSpeech(speech, voiceId, file, signal, log, delivery);
  const voice = readAi33()[voiceId];
  if (!voice) throw new Error(L.VOICE_NOT_FOUND);
  const prefix = voice.provider ? voice.provider + L.AI33_PROVIDER_SEP : MR.MOTION_TEXT_EMPTY;
  const result = await ai33Serial(() => synthesizeAi33Speech({ text: speech, voiceId: prefix && !_.startsWith(voice.voiceId, prefix) ? prefix + voice.voiceId : voice.voiceId, provider: voice.provider, signal }));
  await toWav(result.buffer, file, signal);
  const bytes = Math.max(0, fs.statSync(file).size - 44);
  return { seconds: bytes / 2 / V.SAMPLE_RATE };
};
