import * as MR from "../../constants/motionRuntime.js";
import fs from "fs";
import path from "path";
import _ from "lodash";
import { randomUUID } from "crypto";
import { MOTION_VOICE_LIBRARY as L } from "../../constants/motionVoice.js";
import type { MotionVoiceChannel, MotionVoiceChannels, MotionVoiceGroup, MotionVoicePreset } from "../../types/motionVideo.js";
import { writeMotionJsonAtomic } from "./motionFileUtils.js";
import { vieneuRoot } from "./vieneuTtsService.js";
interface VoiceMeta { name?: string; gender?: string; age?: string; hidden?: boolean; }
type VoiceLibrary = Record<string, VoiceMeta>;
const fileOf = (name: string): string => {
  const root = vieneuRoot();
  fs.mkdirSync(root, { recursive: true });
  return path.join(root, name);
};
const readJson = <T>(name: string, fallback: T): T => {
  try {
    return JSON.parse(fs.readFileSync(fileOf(name), MR.MOTION_TEXT_UTF8)) as T;
  } catch {
    return fallback;
  }
};
const cleanText = (value: unknown): string =>
  String(value ?? MR.MOTION_TEXT_EMPTY)
    .trim()
    .slice(0, L.NAME_MAX);
const cleanGender = (value: unknown): string => (([MR.MOTION_TEXT_MALE, MR.MOTION_TEXT_FEMALE] as readonly string[]).includes(String(value)) ? String(value) : MR.MOTION_TEXT_EMPTY);
const cleanAge = (value: unknown): string => ((L.AGES as readonly string[]).includes(String(value)) ? String(value) : MR.MOTION_TEXT_EMPTY);
export const readVoiceLibrary = (): VoiceLibrary => readJson<VoiceLibrary>(L.LIBRARY_FILE, {});
export const isCustomVoice = (id: string): boolean => id.startsWith(MR.MOTION_TEXT_CUSTOM);
export const applyVoiceLibrary = (voices: MotionVoicePreset[]): MotionVoicePreset[] => {
  const library = readVoiceLibrary();
  return voices
    .filter((voice) => !library[voice.id]?.hidden)
    .map((voice) => {
      const meta = library[voice.id] || {};
      return { ...voice, name: meta.name || voice.name, gender: meta.gender || voice.gender, ...(meta.age ? { age: meta.age } : {}), custom: isCustomVoice(voice.id) };
    });
};
export const updateVoiceMeta = (id: string, patch: { name?: unknown; gender?: unknown; age?: unknown }, restore = false): VoiceMeta => {
  const library = readVoiceLibrary(),
    current = library[id] || {};
  const next: VoiceMeta = { ...current };
  if (patch.name !== undefined && cleanText(patch.name)) next.name = cleanText(patch.name);
  if (patch.gender !== undefined) next.gender = cleanGender(patch.gender) || undefined;
  if (patch.age !== undefined) next.age = cleanAge(patch.age) || undefined;
  if (restore) delete next.hidden;
  library[id] = next;
  writeMotionJsonAtomic(fileOf(L.LIBRARY_FILE), library);
  return next;
};
export const readVoiceChannels = (): MotionVoiceChannels => {
  const data = readJson<MotionVoiceChannels>(L.CHANNELS_FILE, { channels: [] });
  return { channels: Array.isArray(data.channels) ? data.channels : [], ...(data.defaultId ? { defaultId: data.defaultId } : {}) };
};
const writeVoiceChannels = (data: MotionVoiceChannels): void => writeMotionJsonAtomic(fileOf(L.CHANNELS_FILE), data);
export const removeCustomVoice = (id: string): void => {
  if (!isCustomVoice(id)) throw new Error(L.VOICE_NOT_CUSTOM);
  const users = readVoiceChannels().channels.filter((channel) => channel.narratorVoiceId === id || Object.values(channel.roleVoices || {}).includes(id));
  if (users.length) throw new Error(L.VOICE_IN_USE + users.map((channel) => channel.name).join(MR.MOTION_TEXT_SYMBOL_41));
  const library = readVoiceLibrary();
  library[id] = { ...(library[id] || {}), hidden: true };
  writeMotionJsonAtomic(fileOf(L.LIBRARY_FILE), library);
};
export const saveVoiceChannel = (raw: any, voices: MotionVoicePreset[], makeDefault?: boolean): MotionVoiceChannels => {
  const known = (id: unknown): string | undefined => (typeof id === MR.MOTION_TEXT_STRING && voices.some((voice) => voice.id === id) ? (id as string) : undefined);
  const name = cleanText(raw?.name),
    narratorVoiceId = known(raw?.narratorVoiceId);
  if (!name || !narratorVoiceId) throw new Error(L.CHANNEL_INVALID);
  const roleVoices: Partial<Record<MotionVoiceGroup, string>> = {};
  for (const group of L.GROUPS) {
    const id = known(raw?.roleVoices?.[group]);
    if (id) roleVoices[group] = id;
  }
  const data = readVoiceChannels(),
    id = typeof raw?.id === MR.MOTION_TEXT_STRING && data.channels.some((channel) => channel.id === raw.id) ? (raw.id as string) : L.ID_PREFIX + randomUUID().slice(0, 8);
  const previous = data.channels.find((item) => item.id === id);
  const sameVoices = previous?.narratorVoiceId === narratorVoiceId && _.isEqual(previous?.roleVoices || {}, roleVoices);
  const channel: MotionVoiceChannel = { id, name, narratorVoiceId, roleVoices, updatedAt: sameVoices && previous ? previous.updatedAt : Date.now() };
  const channels = data.channels.some((item) => item.id === id) ? data.channels.map((item) => (item.id === id ? channel : item)) : [...data.channels, channel].slice(-L.CHANNELS_MAX);
  const next: MotionVoiceChannels = { channels, defaultId: makeDefault || !data.defaultId ? id : data.defaultId };
  writeVoiceChannels(next);
  return next;
};
export const deleteVoiceChannel = (id: string): MotionVoiceChannels => {
  const data = readVoiceChannels();
  if (!data.channels.some((channel) => channel.id === id)) throw new Error(L.CHANNEL_NOT_FOUND);
  const channels = data.channels.filter((channel) => channel.id !== id);
  const next: MotionVoiceChannels = { channels, ...(data.defaultId && data.defaultId !== id ? { defaultId: data.defaultId } : channels[0] ? { defaultId: channels[0].id } : {}) };
  writeVoiceChannels(next);
  return next;
};
export { voiceChannelRef } from "../../lib/motionVoice.js";
export const findVoiceChannel = (ref?: string): MotionVoiceChannel | null => {
  const id = String(ref || MR.MOTION_TEXT_EMPTY).split(L.REF_SEPARATOR)[0];
  return id ? readVoiceChannels().channels.find((channel) => channel.id === id) || null : null;
};
