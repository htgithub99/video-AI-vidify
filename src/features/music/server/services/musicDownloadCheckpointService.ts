import { parseJson } from "../../../../lib/jsonStringify.js";
import _ from "lodash";
import {
  SOURCE_TEMPLATE_JSON,
  SOURCE_TEMPLATE_MP3,
  SOURCE_TEMPLATE_TMP,
  SOURCE_TEMPLATE_WAV,
  SOURCE_TEXT_ASCII,
  SOURCE_TEXT_EVALUATION_AUDIO,
  SOURCE_TEXT_EVALUATION_MP3_INVALID,
  SOURCE_TEXT_EVALUATION_WAV_INVALID,
  SOURCE_TEXT_HEX,
  SOURCE_TEXT_ID3,
  SOURCE_TEXT_MUSIC_DOWNLOAD_CHECKPOINTS,
  SOURCE_TEXT_R,
  SOURCE_TEXT_RIFF,
  SOURCE_TEXT_SHA256,
  SOURCE_TEXT_UTF8,
  SOURCE_TEXT_WAVE,
} from "../../../../constants/sourceText";
import fs from "fs";
import path from "path";
import { getDataDirectory } from "../../../../server/utils/paths.js";
import { createHash } from "crypto";
import { stringifyJson } from "../../../../lib/jsonStringify.js";
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
const checkpointDirectory = path.join(getDataDirectory(), SOURCE_TEXT_MUSIC_DOWNLOAD_CHECKPOINTS);
const audioCacheDirectory = (key: string): string => path.join(checkpointDirectory, key, SOURCE_TEXT_EVALUATION_AUDIO);
const audioCachePath = (key: string, songId: string): string => path.join(audioCacheDirectory(key), SOURCE_TEMPLATE_MP3(`${createHash(SOURCE_TEXT_SHA256).update(songId).digest(SOURCE_TEXT_HEX)}`));
const wavCachePath = (key: string, songId: string): string => path.join(audioCacheDirectory(key), SOURCE_TEMPLATE_WAV(`${createHash(SOURCE_TEXT_SHA256).update(songId).digest(SOURCE_TEXT_HEX)}`));
const hasMp3Header = (audio: Buffer): boolean => audio.toString(SOURCE_TEXT_ASCII, 0, 3) === SOURCE_TEXT_ID3 || (audio[0] === 0xff && (audio[1] & 0xe0) === 0xe0);
export const createMusicDownloadCheckpointKey = (playlistUrl: string, candidateIds: string[], style: string, model: string): string =>
  createHash(SOURCE_TEXT_SHA256)
    .update(stringifyJson({ playlistUrl: playlistUrl.trim(), candidateIds, style: style.trim(), model }))
    .digest(SOURCE_TEXT_HEX);
export const createMusicEvaluationAudioCacheKey = (playlistUrl: string, candidateIds: string[]): string =>
  createHash(SOURCE_TEXT_SHA256)
    .update(stringifyJson({ playlistUrl: playlistUrl.trim(), candidateIds }))
    .digest(SOURCE_TEXT_HEX);
const checkpointPath = (key: string): string => path.join(checkpointDirectory, SOURCE_TEMPLATE_JSON(`${key}`));
export const readMusicDownloadCheckpoint = async (key: string, candidateIds: string[]): Promise<MusicDownloadCheckpoint | null> => {
  try {
    const parsed = parseJson(await fs.promises.readFile(checkpointPath(key), SOURCE_TEXT_UTF8)) as MusicDownloadCheckpoint;
    if (parsed.version !== 2 || parsed.key !== key || parsed.sourceWavRequired !== true || stringifyJson(parsed.candidateIds) !== stringifyJson(candidateIds)) return null;
    if (!Array.isArray(parsed.selectedTracks) || parsed.selectedTracks.length !== candidateIds.length / 2) return null;
    const pairs = _.chunk(candidateIds, 2);
    if (_.some(pairs, (pair) => pair.length !== 2 || !_.some(parsed.selectedTracks, (track) => _.includes(pair, track.songId)))) return null;
    if (new Set(_.map(parsed.selectedTracks, (track) => track.songId)).size !== parsed.selectedTracks.length) return null;
    return { ...parsed, downloadedPaths: parsed.downloadedPaths || {} };
  } catch {
    return null;
  }
};
export const writeMusicDownloadCheckpoint = async (checkpoint: MusicDownloadCheckpoint): Promise<void> => {
  await fs.promises.mkdir(checkpointDirectory, { recursive: true });
  const destination = checkpointPath(checkpoint.key);
  const temporary = SOURCE_TEMPLATE_TMP(`${destination}`, `${process.pid}`);
  await fs.promises.writeFile(temporary, stringifyJson({ ...checkpoint, updatedAt: Date.now() }), SOURCE_TEXT_UTF8);
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
  if (audio.length < 10_000 || !hasMp3Header(audio)) throw new Error(SOURCE_TEXT_EVALUATION_MP3_INVALID);
  const destination = audioCachePath(key, songId);
  await fs.promises.mkdir(path.dirname(destination), { recursive: true });
  const temporary = SOURCE_TEMPLATE_TMP(`${destination}`, `${process.pid}`);
  await fs.promises.writeFile(temporary, audio);
  await fs.promises.rename(temporary, destination);
};
export const readMusicEvaluationWav = async (key: string, songId: string): Promise<string | null> => {
  const filePath = wavCachePath(key, songId);
  const stat = await fs.promises.stat(filePath).catch(() => null);
  if (!stat?.isFile() || stat.size < 10_000) return null;
  const handle = await fs.promises.open(filePath, SOURCE_TEXT_R);
  try {
    const header = Buffer.alloc(12);
    await handle.read(header, 0, header.length, 0);
    return header.toString(SOURCE_TEXT_ASCII, 0, 4) === SOURCE_TEXT_RIFF && header.toString(SOURCE_TEXT_ASCII, 8, 12) === SOURCE_TEXT_WAVE ? filePath : null;
  } finally {
    await handle.close();
  }
};
export const writeMusicEvaluationWav = async (key: string, songId: string, audio: Buffer): Promise<string> => {
  if (audio.length < 10_000 || audio.toString(SOURCE_TEXT_ASCII, 0, 4) !== SOURCE_TEXT_RIFF || audio.toString(SOURCE_TEXT_ASCII, 8, 12) !== SOURCE_TEXT_WAVE) throw new Error(SOURCE_TEXT_EVALUATION_WAV_INVALID);
  const destination = wavCachePath(key, songId);
  await fs.promises.mkdir(path.dirname(destination), { recursive: true });
  const temporary = SOURCE_TEMPLATE_TMP(`${destination}`, `${process.pid}`);
  await fs.promises.writeFile(temporary, audio);
  await fs.promises.rename(temporary, destination);
  return destination;
};
export const deleteMusicEvaluationAudio = async (key: string): Promise<void> => {
  await fs.promises.rm(path.join(checkpointDirectory, key), { recursive: true, force: true });
};
