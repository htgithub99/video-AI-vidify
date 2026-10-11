import { SOURCE_TEXT_NFC, SOURCE_TEXT_SYMBOL, SOURCE_TEMPLATE_SOURCE, SOURCE_TEXT_MUSIC_MIXER_INSUFFICIENT_UNIQUE_TRACKS } from "../constants/sourceText.js";
type MixerTrackIdentity = { sourcePath?: string; path: string; size?: number; file: { size: number; lastModified: number; }; };
const normalizePath = (value: string) => value.normalize(SOURCE_TEXT_NFC).replace(/\\/g, SOURCE_TEXT_SYMBOL).replace(/\/+$/, "").toLowerCase();
export const getMusicMixerTrackKey = (track: MixerTrackIdentity): string => (track.sourcePath ? SOURCE_TEMPLATE_SOURCE(`${normalizePath(track.sourcePath)}`) : JSON.stringify([normalizePath(track.path), track.size ?? track.file.size, track.file.lastModified]));
export const deduplicateMusicMixerTracks = <T extends MixerTrackIdentity>(tracks: readonly T[]): T[] => {
  const seen = new Set<string>();
  return tracks.filter((track) => {
    const key = getMusicMixerTrackKey(track);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};
export const distributeMusicMixerTracks = <T extends MixerTrackIdentity>(tracks: readonly T[], songsPerFolder: number, folderCount: number): T[][] => {
  const source = deduplicateMusicMixerTracks(tracks);
  if (!Number.isInteger(songsPerFolder) || !Number.isInteger(folderCount) || songsPerFolder < 1 || folderCount < 1 || songsPerFolder > source.length) {
    throw new Error(SOURCE_TEXT_MUSIC_MIXER_INSUFFICIENT_UNIQUE_TRACKS);
  }
  const folders: T[][] = Array.from({ length: folderCount }, () => []);
  const usedKeys = folders.map(() => new Set<string>());
  let cursor = 0;
  for (let row = 0; row < songsPerFolder; row++) {
    for (const [index, folder] of folders.entries()) {
      let candidate = source[cursor++ % source.length];
      while (usedKeys[index].has(getMusicMixerTrackKey(candidate))) candidate = source[cursor++ % source.length];
      usedKeys[index].add(getMusicMixerTrackKey(candidate));
      folder.push(candidate);
    }
  }
  return folders;
};
