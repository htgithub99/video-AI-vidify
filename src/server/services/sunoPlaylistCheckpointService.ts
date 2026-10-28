import { createHash, randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { getDataDirectory } from "../utils/paths.js";

export type SunoPlaylistCheckpoint = { playlistName: string; songIds: string[]; playlistId?: string; creationStarted?: boolean };
const checkpointPath = (songIds: string[], name: string): string => path.join(getDataDirectory(), "music-playlist-checkpoints", `${createHash("sha256").update(JSON.stringify([name, [...new Set(songIds)].sort()])).digest("hex")}.json`);
export const readSunoPlaylistCheckpoint = async (songIds: string[], playlistName: string): Promise<SunoPlaylistCheckpoint | undefined> => {
  try {
    const saved = JSON.parse(await fs.readFile(checkpointPath(songIds, playlistName), "utf8")) as SunoPlaylistCheckpoint;
    if (saved.playlistName !== playlistName || JSON.stringify([...new Set(saved.songIds)].sort()) !== JSON.stringify([...new Set(songIds)].sort())) return;
    if (saved.playlistId && !/^[a-zA-Z0-9-]+$/.test(saved.playlistId)) return;
    return saved;
  } catch { return; }
};
export const writeSunoPlaylistCheckpoint = async (checkpoint: SunoPlaylistCheckpoint): Promise<void> => {
  const destination = checkpointPath(checkpoint.songIds, checkpoint.playlistName);
  await fs.mkdir(path.dirname(destination), { recursive: true });
  const temporary = `${destination}.${randomUUID()}.tmp`;
  await fs.writeFile(temporary, JSON.stringify(checkpoint), "utf8");
  await fs.rename(temporary, destination);
};
