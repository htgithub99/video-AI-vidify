import fs from "fs";
import os from "os";
import path from "path";
import { createHash } from "crypto";
import { stringifyJson } from "../../lib/jsonStringify.js";

export interface MusicDownloadSelection {
  songId: string;
  title: string;
  qualityScore: number;
}

export interface MusicDownloadCheckpoint {
  version: 2;
  key: string;
  candidateIds: string[];
  selectedTracks: MusicDownloadSelection[];
  folderPath: string;
  format: string;
  downloadedPaths: Record<string, string>;
  sourceWavRequired: true;
  updatedAt: number;
}

const checkpointDirectory = path.join(process.env.LOCALAPPDATA || os.tmpdir(), "VideoAI-Vidify", "music-download-checkpoints");
const audioCacheDirectory = (key: string): string => path.join(checkpointDirectory, key, "evaluation-audio");
const audioCachePath = (key: string, songId: string): string =>
  path.join(audioCacheDirectory(key), `${createHash("sha256").update(songId).digest("hex")}.mp3`);
const wavCachePath = (key: string, songId: string): string =>
  path.join(audioCacheDirectory(key), `${createHash("sha256").update(songId).digest("hex")}.wav`);
const hasMp3Header = (audio: Buffer): boolean =>
  audio.toString("ascii", 0, 3) === "ID3" || (audio[0] === 0xff && (audio[1] & 0xe0) === 0xe0);

export const createMusicDownloadCheckpointKey = (playlistUrl: string, candidateIds: string[], style: string, model: string): string =>
  createHash("sha256").update(stringifyJson({ playlistUrl: playlistUrl.trim(), candidateIds, style: style.trim(), model })).digest("hex");

export const createMusicEvaluationAudioCacheKey = (playlistUrl: string, candidateIds: string[]): string =>
  createHash("sha256").update(stringifyJson({ playlistUrl: playlistUrl.trim(), candidateIds })).digest("hex");

const checkpointPath = (key: string): string => path.join(checkpointDirectory, `${key}.json`);

export const readMusicDownloadCheckpoint = async (key: string, candidateIds: string[]): Promise<MusicDownloadCheckpoint | null> => {
  try {
    const parsed = JSON.parse(await fs.promises.readFile(checkpointPath(key), "utf8")) as MusicDownloadCheckpoint;
    if (parsed.version !== 2 || parsed.key !== key || parsed.sourceWavRequired !== true || stringifyJson(parsed.candidateIds) !== stringifyJson(candidateIds)) return null;
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
  await fs.promises.writeFile(temporary, stringifyJson({ ...checkpoint, updatedAt: Date.now() }), "utf8");
  await fs.promises.rename(temporary, destination);
};

export const deleteMusicDownloadCheckpoint = async (key: string): Promise<void> => {
  await fs.promises.rm(checkpointPath(key), { force: true });
};

export const readMusicEvaluationAudio = async (key: string, songId: string): Promise<Buffer | null> => {
  try {
    const audio = await fs.promises.readFile(audioCachePath(key, songId));
    return audio.length >= 10_000 && hasMp3Header(audio) ? audio : null;
  } catch {
    return null;
  }
};

export const writeMusicEvaluationAudio = async (key: string, songId: string, audio: Buffer): Promise<void> => {
  if (audio.length < 10_000 || !hasMp3Header(audio)) throw new Error("evaluation_mp3_invalid");
  const destination = audioCachePath(key, songId);
  await fs.promises.mkdir(path.dirname(destination), { recursive: true });
  const temporary = `${destination}.${process.pid}.tmp`;
  await fs.promises.writeFile(temporary, audio);
  await fs.promises.rename(temporary, destination);
};

export const readMusicEvaluationWav = async (key: string, songId: string): Promise<string | null> => {
  const filePath = wavCachePath(key, songId);
  const stat = await fs.promises.stat(filePath).catch(() => null);
  if (!stat?.isFile() || stat.size < 10_000) return null;
  const handle = await fs.promises.open(filePath, "r");
  try {
    const header = Buffer.alloc(12);
    await handle.read(header, 0, header.length, 0);
    return header.toString("ascii", 0, 4) === "RIFF" && header.toString("ascii", 8, 12) === "WAVE" ? filePath : null;
  } finally {
    await handle.close();
  }
};

export const writeMusicEvaluationWav = async (key: string, songId: string, audio: Buffer): Promise<string> => {
  if (audio.length < 10_000 || audio.toString("ascii", 0, 4) !== "RIFF" || audio.toString("ascii", 8, 12) !== "WAVE") throw new Error("evaluation_wav_invalid");
  const destination = wavCachePath(key, songId);
  await fs.promises.mkdir(path.dirname(destination), { recursive: true });
  const temporary = `${destination}.${process.pid}.tmp`;
  await fs.promises.writeFile(temporary, audio);
  await fs.promises.rename(temporary, destination);
  return destination;
};

export const deleteMusicEvaluationAudio = async (key: string): Promise<void> => {
  await fs.promises.rm(path.join(checkpointDirectory, key), { recursive: true, force: true });
};
