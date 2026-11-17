import { stringifyJson } from "../../../lib/jsonStringify.js";
import { SOURCE_TEXT_NFC, SOURCE_TEXT_SYMBOL, SOURCE_TEMPLATE_SOURCE, SOURCE_TEXT_MUSIC_MIXER_INSUFFICIENT_UNIQUE_TRACKS } from "../../../constants/sourceText.js";
type MixerTrackIdentity = { sourcePath?: string; path: string; name?: string; size?: number; file: { size: number; lastModified: number; name?: string } };
const normalizePath = (value: string) => value.normalize(SOURCE_TEXT_NFC).replace(/\\/g, SOURCE_TEXT_SYMBOL).replace(/\/+$/, "").toLowerCase();
export const getMusicMixerTrackKey = (track: MixerTrackIdentity): string => (track.sourcePath ? SOURCE_TEMPLATE_SOURCE(`${normalizePath(track.sourcePath)}`) : stringifyJson([normalizePath(track.path), track.size ?? track.file.size, track.file.lastModified]));
export const deduplicateMusicMixerTracks = <T extends MixerTrackIdentity>(tracks: readonly T[]): T[] => {
  const seen = new Set<string>();
  return tracks.filter((track) => {
    const key = getMusicMixerTrackKey(track);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};
// The song a file holds, by its title: the file name without folder, extension, a leading track number or a trailing copy
// mark ("(1)", "copy", "v2"), case, accents' composition and punctuation. Two files of one song (the same title exported to two
// folders, two takes of one generation) share it, so a mix never plays the same song twice.
const COPY_MARK = /(\s*[([]\s*\d+\s*[)\]]|\s*[-_ ]\s*(copy|bản sao|v\d+|take\s*\d+))+$/i;
export const getMusicMixerTitleKey = (track: MixerTrackIdentity): string => {
  const base = track.file.name || track.name || String(track.sourcePath || track.path || "").split(/[\\/]/).filter(Boolean).pop() || "";
  const stem = base.normalize(SOURCE_TEXT_NFC).replace(/\.[^.]+$/, "").replace(/^\d+[\s._-]*/, "").replace(COPY_MARK, "");
  const key = stem.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
  return key || getMusicMixerTrackKey(track);
};
// How many different songs the tracks hold (the most a mix can have).
export const countMusicMixerSongs = (tracks: readonly MixerTrackIdentity[]): number => new Set(deduplicateMusicMixerTracks(tracks).map(getMusicMixerTitleKey)).size;
export const distributeMusicMixerTracks = <T extends MixerTrackIdentity>(tracks: readonly T[], songsPerFolder: number, folderCount: number): T[][] => {
  const files = deduplicateMusicMixerTracks(tracks);
  // One file of every song first (in the order given: shuffled, by name or ranked), then the other files of songs already
  // listed: mixes share no song while there are enough different songs, and a mix never holds one song twice.
  const firstOfSong = new Set<string>(), first: T[] = [], others: T[] = [];
  files.forEach((track) => {
    const title = getMusicMixerTitleKey(track);
    if (firstOfSong.has(title)) others.push(track);
    else {
      firstOfSong.add(title);
      first.push(track);
    }
  });
  const source = [...first, ...others];
  if (!Number.isInteger(songsPerFolder) || !Number.isInteger(folderCount) || songsPerFolder < 1 || folderCount < 1 || songsPerFolder > first.length) {
    throw new Error(SOURCE_TEXT_MUSIC_MIXER_INSUFFICIENT_UNIQUE_TRACKS);
  }
  const folders: T[][] = Array.from({ length: folderCount }, () => []);
  const usedTitles = folders.map(() => new Set<string>());
  let cursor = 0;
  for (let row = 0; row < songsPerFolder; row++) {
    for (const [index, folder] of folders.entries()) {
      let candidate = source[cursor++ % source.length];
      while (usedTitles[index].has(getMusicMixerTitleKey(candidate))) candidate = source[cursor++ % source.length];
      usedTitles[index].add(getMusicMixerTitleKey(candidate));
      folder.push(candidate);
    }
  }
  return folders;
};
