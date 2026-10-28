import { RUNTIME_TEXT as RT_SERVER } from "../../constants/runtime/server.js";
import { RUNTIME_TEXT as RT_SHARED } from "../../constants/runtime/shared.js";
import { stringifyJson, parseJson } from "../../lib/jsonStringify.js";
import { createHash, randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { getDataDirectory } from "../utils/paths.js";
export type SunoPlaylistCheckpoint = { playlistName: string; songIds: string[]; playlistId?: string; creationStarted?: boolean };
const checkpointPath = (songIds: string[], name: string): string =>
  path.join(
    getDataDirectory(),
    RT_SERVER.MUSIC_PLAYLIST_CHECKPOINTS,
    `${createHash(RT_SERVER.SHA256)
      .update(stringifyJson([name, [...new Set(songIds)].sort()]))
      .digest(RT_SERVER.HEX)}${RT_SERVER.JSON}`,
  );
export const readSunoPlaylistCheckpoint = async (songIds: string[], playlistName: string): Promise<SunoPlaylistCheckpoint | undefined> => {
  try {
    const saved = parseJson(await fs.readFile(checkpointPath(songIds, playlistName), RT_SERVER.UTF8)) as SunoPlaylistCheckpoint;
    if (saved.playlistName !== playlistName || stringifyJson([...new Set(saved.songIds)].sort()) !== stringifyJson([...new Set(songIds)].sort())) return;
    if (saved.playlistId && !/^[a-zA-Z0-9-]+$/.test(saved.playlistId)) return;
    return saved;
  } catch {
    return;
  }
};
export const writeSunoPlaylistCheckpoint = async (checkpoint: SunoPlaylistCheckpoint): Promise<void> => {
  const destination = checkpointPath(checkpoint.songIds, checkpoint.playlistName);
  await fs.mkdir(path.dirname(destination), { recursive: true });
  const temporary = `${destination}${RT_SHARED.SYMBOL_CDB4EE}${randomUUID()}${RT_SERVER.TMP}`;
  await fs.writeFile(temporary, stringifyJson(checkpoint), RT_SERVER.UTF8);
  await fs.rename(temporary, destination);
};
