import { createHash, randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { getDataDirectory } from '../utils/paths.js';
import type { SunoCreationProgress } from '../../types/sunoCreationProgress.js';

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
  songs: { songIds: string[]; state: 'pending' | 'submitting' | 'accepted' | 'complete'; submittedAt?: string }[];
  initialSongIds: string[];
  playlistUrl?: string;
  updatedAt: string;
}
const directory = () => path.join(getDataDirectory(), 'music-creation-checkpoints');
const canonical = (value: any): any => Array.isArray(value) ? value.map(canonical) : value && typeof value === 'object'
  ? Object.fromEntries(Object.keys(value).sort().filter(key => value[key] !== undefined).map(key => [key, canonical(value[key])])) : value;
const normalizeTitle = (title: string) => title.replace(/^\s*\d+[.)\-:]\s*/, '').trim().toLowerCase();
const comparableSongs = (songs: Pick<SongInput, 'title' | 'lyrics'>[]) => songs.map(song => ({ title: normalizeTitle(song.title), lyrics: song.lyrics.trim().replace(/\r\n/g, '\n') }));
export const sunoCreationKey = (input: SunoCreationInput): string => createHash('sha256').update(JSON.stringify(canonical({
  ...input, songs: comparableSongs(input.songs), initialSongIds: [...new Set(input.initialSongIds)].sort(), testOnly: input.testOnly === true,
}))).digest('hex');
const filePath = (key: string) => {
  if (!/^[a-f0-9]{64}$/.test(key)) throw new Error('Mã tiến độ Suno không hợp lệ.');
  return path.join(directory(), `${key}.json`);
};
const atomicWrite = async (destination: string, value: unknown) => {
  await fs.mkdir(path.dirname(destination), { recursive: true });
  const temporary = `${destination}.${randomUUID()}.tmp`;
  await fs.writeFile(temporary, JSON.stringify(value), 'utf8');
  await fs.rename(temporary, destination);
};
export const saveSunoCreationCheckpoint = async (checkpoint: SunoCreationCheckpoint): Promise<void> => {
  checkpoint.updatedAt = new Date().toISOString();
  await atomicWrite(filePath(checkpoint.key), checkpoint);
};
export const creationSongIds = (checkpoint: SunoCreationCheckpoint): string[] => [...new Set([...checkpoint.initialSongIds, ...checkpoint.songs.flatMap(song => song.songIds)])];
export const creationProgress = (checkpoint: SunoCreationCheckpoint, phase: SunoCreationProgress['phase'], songIndex?: number): SunoCreationProgress => ({
  phase, songIndex, songCount: checkpoint.songs.length,
  acceptedSongs: checkpoint.songs.filter(song => song.songIds.length >= 2).length,
  completedSongs: checkpoint.songs.filter(song => song.state === 'complete').length,
  createdSongIds: creationSongIds(checkpoint), playlistName: checkpoint.playlistName,
});
export const openSunoCreationCheckpoint = async (input: SunoCreationInput, playlistName: string): Promise<SunoCreationCheckpoint> => {
  const key = sunoCreationKey(input);
  try {
    const checkpoint = JSON.parse(await fs.readFile(filePath(key), 'utf8')) as SunoCreationCheckpoint;
    if (checkpoint.version !== 1 || checkpoint.key !== key || sunoCreationKey(checkpoint.input) !== key || checkpoint.songs.length !== input.songs.length
      || checkpoint.songs.some(song => !Array.isArray(song.songIds) || song.songIds.some(id => typeof id !== 'string') || !['pending', 'submitting', 'accepted', 'complete'].includes(song.state)
        || (['accepted', 'complete'].includes(song.state) && song.songIds.length < 2))) throw new Error('Dữ liệu tiến độ không hợp lệ.');
    return checkpoint;
  } catch (error: any) {
    if (error?.code !== 'ENOENT') throw new Error('Không đọc được tiến độ Suno đã lưu. Đã dừng để tránh tạo trùng bài.', { cause: error });
  }
  const checkpoint: SunoCreationCheckpoint = { version: 1, key, playlistName, input, songs: input.songs.map(() => ({ songIds: [], state: 'pending' })), initialSongIds: [...new Set(input.initialSongIds)], updatedAt: new Date().toISOString() };
  // Import only a manually verified legacy run whose entire lyric plan still matches.
  for (const name of await fs.readdir(directory()).catch((error: any) => { if (error.code === 'ENOENT') return []; throw error; })) {
    if (!/^recovered-suno-create-\d+\.json$/.test(name)) continue;
    const legacyPath = path.join(directory(), name);
    const legacy = JSON.parse(await fs.readFile(legacyPath, 'utf8'));
    if (input.testOnly || legacy.songCount !== input.songs.length || !Array.isArray(legacy.inputSongs) || (legacy.boundKey && legacy.boundKey !== key)
      || JSON.stringify(comparableSongs(legacy.inputSongs)) !== JSON.stringify(comparableSongs(input.songs))) continue;
    for (const row of legacy.songs) {
      const index = row.songIndex - 1;
      if (!checkpoint.songs[index] || normalizeTitle(row.title) !== normalizeTitle(input.songs[index].title)) throw new Error('Dữ liệu phục hồi Suno không khớp tên bài.');
      checkpoint.songs[index].songIds = [...new Set([...checkpoint.songs[index].songIds, row.songId])];
      checkpoint.songs[index].state = 'accepted';
    }
    if (checkpoint.songs.some(song => song.state === 'accepted' && song.songIds.length < 2)) throw new Error('Dữ liệu phục hồi Suno chưa đủ hai bản mỗi bài.');
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
  const report = (phase: SunoCreationProgress['phase'], index?: number) => adapter.progress?.(creationProgress(checkpoint, phase, index));
  report('recovered');
  if (checkpoint.playlistUrl) return { playlistUrl: checkpoint.playlistUrl, createdSongIds: creationSongIds(checkpoint) };
  for (const [index, song] of checkpoint.songs.entries()) {
    if (song.state === 'accepted' || song.state === 'complete') continue;
    if (song.state === 'submitting' || song.songIds.length) throw new Error(`Bài ${index + 1} có lần tạo chưa xác định kết quả. Đã giữ tiến độ; cần đối chiếu trên Suno trước khi tạo tiếp để tránh trùng bài.`);
    report('submitting', index + 1);
    const beginSubmission = async () => {
      song.state = 'submitting';
      song.submittedAt = new Date().toISOString();
      await saveSunoCreationCheckpoint(checkpoint);
    };
    const persistIds = async (ids: string[]) => {
      const merged = [...new Set([...song.songIds, ...ids])];
      if (merged.length === song.songIds.length) return;
      song.songIds = merged;
      if (song.songIds.length >= 2) song.state = 'accepted';
      await saveSunoCreationCheckpoint(checkpoint);
      report('saved', index + 1);
    };
    await persistIds(await adapter.submit(checkpoint.input.songs[index], index, persistIds, beginSubmission));
    if (song.songIds.length < 2) throw new Error(`Bài ${index + 1} chưa nhận đủ hai ID; đã lưu các ID nhận được và dừng để tránh tạo trùng.`);
  }
  report('waiting');
  await adapter.wait(creationSongIds(checkpoint));
  for (const song of checkpoint.songs) song.state = 'complete';
  await saveSunoCreationCheckpoint(checkpoint);
  report('playlist');
  checkpoint.playlistUrl = await adapter.playlist(creationSongIds(checkpoint), checkpoint.playlistName);
  await saveSunoCreationCheckpoint(checkpoint);
  report('completed');
  return { playlistUrl: checkpoint.playlistUrl, createdSongIds: creationSongIds(checkpoint) };
};
