import { RUNTIME_TEXT as RT_SERVER } from "../../constants/runtime/server.js";
import { RUNTIME_TEXT as RT_SHARED } from "../../constants/runtime/shared.js";
import { stringifyJson, parseJson } from "../../lib/jsonStringify.js";
import { createHash, randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { getDataDirectory } from "../utils/paths.js";
import type { SunoCreationProgress } from "../../types/sunoCreationProgress.js";
type SongInput = { songId: string; title: string; lyrics: string };
export interface SunoCreationInput {
  songs: SongInput[];
  style: string;
  inspo: string;
  settings?: unknown;
  testOnly?: boolean;
  initialSongIds: string[];
}
export interface SunoCreationCheckpoint {
  version: 1;
  key: string;
  playlistName: string;
  input: SunoCreationInput;
  songs: { songIds: string[]; state: "pending" | "submitting" | "accepted" | "complete"; submittedAt?: string }[];
  initialSongIds: string[];
  playlistUrl?: string;
  updatedAt: string;
}
const directory = () => path.join(getDataDirectory(), RT_SERVER.MUSIC_CREATION_CHECKPOINTS);
const canonical = (value: any): any =>
  Array.isArray(value)
    ? value.map(canonical)
    : value && typeof value === "object"
      ? Object.fromEntries(
          Object.keys(value)
            .sort()
            .filter((key) => value[key] !== undefined)
            .map((key) => [key, canonical(value[key])]),
        )
      : value;
const normalizeTitle = (title: string) =>
  title
    .replace(/^\s*\d+[.)\-:]\s*/, "")
    .trim()
    .toLowerCase();
const comparableSongs = (songs: Pick<SongInput, "title" | "lyrics">[]) => songs.map((song) => ({ title: normalizeTitle(song.title), lyrics: song.lyrics.trim().replace(/\r\n/g, RT_SHARED.SYMBOL_01BA47) }));
export const sunoCreationKey = (input: SunoCreationInput): string =>
  createHash(RT_SERVER.SHA256)
    .update(stringifyJson(canonical({ ...input, songs: comparableSongs(input.songs), initialSongIds: [...new Set(input.initialSongIds)].sort(), testOnly: input.testOnly === true })))
    .digest(RT_SERVER.HEX);
const filePath = (key: string) => {
  if (!/^[a-f0-9]{64}$/.test(key)) throw new Error(RT_SERVER.MA_TIEN_DO_SUNO_KHONG_HOP_LE);
  return path.join(directory(), `${key}${RT_SERVER.JSON}`);
};
const atomicWrite = async (destination: string, value: unknown) => {
  await fs.mkdir(path.dirname(destination), { recursive: true });
  const temporary = `${destination}${RT_SHARED.SYMBOL_CDB4EE}${randomUUID()}${RT_SERVER.TMP}`;
  await fs.writeFile(temporary, stringifyJson(value), RT_SERVER.UTF8);
  await fs.rename(temporary, destination);
};
export const saveSunoCreationCheckpoint = async (checkpoint: SunoCreationCheckpoint): Promise<void> => {
  checkpoint.updatedAt = new Date().toISOString();
  await atomicWrite(filePath(checkpoint.key), checkpoint);
};
export const creationSongIds = (checkpoint: SunoCreationCheckpoint): string[] => [...new Set([...checkpoint.initialSongIds, ...checkpoint.songs.flatMap((song) => song.songIds)])];
export const creationProgress = (checkpoint: SunoCreationCheckpoint, phase: SunoCreationProgress["phase"], songIndex?: number): SunoCreationProgress => ({
  phase,
  songIndex,
  songCount: checkpoint.songs.length,
  acceptedSongs: checkpoint.songs.filter((song) => song.songIds.length >= 2).length,
  completedSongs: checkpoint.songs.filter((song) => song.state === RT_SERVER.COMPLETE).length,
  createdSongIds: creationSongIds(checkpoint),
  playlistName: checkpoint.playlistName,
});
export const openSunoCreationCheckpoint = async (input: SunoCreationInput, playlistName: string): Promise<SunoCreationCheckpoint> => {
  const key = sunoCreationKey(input);
  try {
    const checkpoint = parseJson(await fs.readFile(filePath(key), RT_SERVER.UTF8)) as SunoCreationCheckpoint;
    if (
      checkpoint.version !== 1 ||
      checkpoint.key !== key ||
      sunoCreationKey(checkpoint.input) !== key ||
      checkpoint.songs.length !== input.songs.length ||
      checkpoint.songs.some((song) => !Array.isArray(song.songIds) || song.songIds.some((id) => typeof id !== "string") || !([RT_SERVER.PENDING, RT_SERVER.SUBMITTING, RT_SERVER.ACCEPTED, RT_SERVER.COMPLETE] as string[]).includes(song.state) || (([RT_SERVER.ACCEPTED, RT_SERVER.COMPLETE] as string[]).includes(song.state) && song.songIds.length < 2))
    )
      throw new Error(RT_SERVER.DU_LIEU_TIEN_DO_KHONG_HOP_LE);
    return checkpoint;
  } catch (error: any) {
    if (error?.code !== RT_SERVER.ENOENT) throw new Error(RT_SERVER.KHONG_DOC_DUOC_TIEN_DO_SUNO_DA_LUU_DA_DUNG, { cause: error });
  }
  const checkpoint: SunoCreationCheckpoint = { version: 1, key, playlistName, input, songs: input.songs.map(() => ({ songIds: [], state: RT_SERVER.PENDING })), initialSongIds: [...new Set(input.initialSongIds)], updatedAt: new Date().toISOString() };
  for (const name of await fs.readdir(directory()).catch((error: any) => {
    if (error.code === RT_SERVER.ENOENT) return [];
    throw error;
  })) {
    if (!/^recovered-suno-create-\d+\.json$/.test(name)) continue;
    const legacyPath = path.join(directory(), name);
    const legacy = parseJson(await fs.readFile(legacyPath, RT_SERVER.UTF8));
    if (input.testOnly || legacy.songCount !== input.songs.length || !Array.isArray(legacy.inputSongs) || (legacy.boundKey && legacy.boundKey !== key) || stringifyJson(comparableSongs(legacy.inputSongs)) !== stringifyJson(comparableSongs(input.songs))) continue;
    for (const row of legacy.songs) {
      const index = row.songIndex - 1;
      if (!checkpoint.songs[index] || normalizeTitle(row.title) !== normalizeTitle(input.songs[index].title)) throw new Error(RT_SERVER.DU_LIEU_PHUC_HOI_SUNO_KHONG_KHOP_TEN_BAI);
      checkpoint.songs[index].songIds = [...new Set([...checkpoint.songs[index].songIds, row.songId])];
      checkpoint.songs[index].state = RT_SERVER.ACCEPTED;
    }
    if (checkpoint.songs.some((song) => song.state === RT_SERVER.ACCEPTED && song.songIds.length < 2)) throw new Error(RT_SERVER.DU_LIEU_PHUC_HOI_SUNO_CHUA_DU_HAI_BAN_MOI);
    legacy.boundKey = key;
    await atomicWrite(legacyPath, legacy);
    break;
  }
  await saveSunoCreationCheckpoint(checkpoint);
  return checkpoint;
};
export interface SunoCreationAdapter {
  submit: (song: SongInput, index: number, persistIds: (ids: string[]) => Promise<void>, beginSubmission: () => Promise<void>) => Promise<string[]>;
  wait: (songIds: string[]) => Promise<void>;
  playlist: (songIds: string[], name: string) => Promise<string>;
  progress?: (progress: SunoCreationProgress) => void;
}
export const runSunoCreationCheckpoint = async (checkpoint: SunoCreationCheckpoint, adapter: SunoCreationAdapter): Promise<{ playlistUrl: string; createdSongIds: string[] }> => {
  const report = (phase: SunoCreationProgress["phase"], index?: number) => adapter.progress?.(creationProgress(checkpoint, phase, index));
  report(RT_SERVER.RECOVERED);
  if (checkpoint.playlistUrl) return { playlistUrl: checkpoint.playlistUrl, createdSongIds: creationSongIds(checkpoint) };
  for (const [index, song] of checkpoint.songs.entries()) {
    if (song.state === RT_SERVER.ACCEPTED || song.state === RT_SERVER.COMPLETE) continue;
    if (song.state === RT_SERVER.SUBMITTING || song.songIds.length) throw new Error(`${RT_SERVER.BAI}${index + 1}${RT_SERVER.CO_LAN_TAO_CHUA_XAC_DINH_KET_QUA_DA_GIU}`);
    report(RT_SERVER.SUBMITTING, index + 1);
    const beginSubmission = async () => {
      song.state = RT_SERVER.SUBMITTING;
      song.submittedAt = new Date().toISOString();
      await saveSunoCreationCheckpoint(checkpoint);
    };
    const persistIds = async (ids: string[]) => {
      const merged = [...new Set([...song.songIds, ...ids])];
      if (merged.length === song.songIds.length) return;
      song.songIds = merged;
      if (song.songIds.length >= 2) song.state = RT_SERVER.ACCEPTED;
      await saveSunoCreationCheckpoint(checkpoint);
      report(RT_SERVER.SAVED, index + 1);
    };
    await persistIds(await adapter.submit(checkpoint.input.songs[index], index, persistIds, beginSubmission));
    if (song.songIds.length < 2) throw new Error(`${RT_SERVER.BAI}${index + 1}${RT_SERVER.CHUA_NHAN_DU_HAI_ID_DA_LUU_CAC_ID_NHAN}`);
  }
  report(RT_SHARED.WAITING);
  await adapter.wait(creationSongIds(checkpoint));
  for (const song of checkpoint.songs) song.state = RT_SERVER.COMPLETE;
  await saveSunoCreationCheckpoint(checkpoint);
  report(RT_SERVER.PLAYLIST);
  checkpoint.playlistUrl = await adapter.playlist(creationSongIds(checkpoint), checkpoint.playlistName);
  await saveSunoCreationCheckpoint(checkpoint);
  report(RT_SHARED.COMPLETED);
  return { playlistUrl: checkpoint.playlistUrl, createdSongIds: creationSongIds(checkpoint) };
};
