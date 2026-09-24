import fs from "fs";
import os from "os";
import path from "path";
import { createHash } from "crypto";

export interface MusicDownloadSelection {
  songId: string;
  title: string;
  qualityScore: number;
}

export interface MusicDownloadCheckpoint {
  version: 1;
  key: string;
  candidateIds: string[];
  selectedTracks: MusicDownloadSelection[];
  folderPath: string;
  format: string;
  downloadedPaths: Record<string, string>;
  updatedAt: number;
}

const checkpointDirectory = path.join(process.env.LOCALAPPDATA || os.tmpdir(), "VideoAI-Vidify", "music-download-checkpoints");
const audioCacheDirectory = (key: string): string => path.join(checkpointDirectory, key, "evaluation-audio");
const audioCachePath = (key: string, songId: string): string =>
  path.join(audioCacheDirectory(key), `${createHash("sha256").update(songId).digest("hex")}.mp3`);

export const createMusicDownloadCheckpointKey = (playlistUrl: string, candidateIds: string[], style: string, model: string): string =>
  createHash("sha256").update(JSON.stringify({ playlistUrl: playlistUrl.trim(), candidateIds, style: style.trim(), model })).digest("hex");

const checkpointPath = (key: string): string => path.join(checkpointDirectory, `${key}.json`);

export const readMusicDownloadCheckpoint = async (key: string, candidateIds: string[]): Promise<MusicDownloadCheckpoint | null> => {
  try {
    const parsed = JSON.parse(await fs.promises.readFile(checkpointPath(key), "utf8")) as MusicDownloadCheckpoint;
    if (parsed.version !== 1 || parsed.key !== key || JSON.stringify(parsed.candidateIds) !== JSON.stringify(candidateIds)) return null;
    if (!Array.isArray(parsed.selectedTracks) || parsed.selectedTracks.length !== candidateIds.length / 2) return null;
    const pairs = Array.from({ length: candidateIds.length / 2 }, (_, index) => candidateIds.slice(index * 2, index * 2 + 2));
    if (pairs.some((pair) => pair.length !== 2 || !parsed.selectedTracks.some((track) => pair.includes(track.songId)))) return null;
    if (new Set(parsed.selectedTracks.map((track) => track.songId)).size !== parsed.selectedTracks.length) return null;
    return { ...parsed, downloadedPaths: parsed.downloadedPaths || {} };
  } catch {
    return null;
  }
};

export const writeMusicDownloadCheckpoint = async (checkpoint: MusicDownloadCheckpoint): Promise<void> => {
  await fs.promises.mkdir(checkpointDirectory, { recursive: true });
  const destination = checkpointPath(checkpoint.key);
  const temporary = `${destination}.${process.pid}.tmp`;
  await fs.promises.writeFile(temporary, JSON.stringify({ ...checkpoint, updatedAt: Date.now() }), "utf8");
  await fs.promises.rename(temporary, destination);
};

export const deleteMusicDownloadCheckpoint = async (key: string): Promise<void> => {
  await fs.promises.rm(checkpointPath(key), { force: true });
};

export const readMusicEvaluationAudio = async (key: string, songId: string): Promise<Buffer | null> => {
  try {
    const audio = await fs.promises.readFile(audioCachePath(key, songId));
    return audio.length >= 10_000 ? audio : null;
  } catch {
    return null;
  }
};

export const writeMusicEvaluationAudio = async (key: string, songId: string, audio: Buffer): Promise<void> => {
  if (audio.length < 10_000) throw new Error("evaluation_audio_too_small");
  const destination = audioCachePath(key, songId);
  await fs.promises.mkdir(path.dirname(destination), { recursive: true });
  const temporary = `${destination}.${process.pid}.tmp`;
  await fs.promises.writeFile(temporary, audio);
  await fs.promises.rename(temporary, destination);
};

export const deleteMusicEvaluationAudio = async (key: string): Promise<void> => {
  await fs.promises.rm(path.join(checkpointDirectory, key), { recursive: true, force: true });
};
