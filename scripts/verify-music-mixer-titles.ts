// "Trộn nhạc": a mix never plays one song twice. Two files of one song (one title exported to two folders, a copy "(1)",
// a numbered or "v2" take) count as one song: they never share a mix, and mixes share no song while there are enough.
import assert from "node:assert/strict";
import { countMusicMixerSongs, distributeMusicMixerTracks, getMusicMixerTitleKey } from "../src/features/music-mixer/services/musicMixerTracks.ts";
const track = (sourcePath: string) => ({ sourcePath, path: sourcePath.split("\\").slice(-2).join("/"), file: { size: 0, lastModified: 1, name: sourcePath.split("\\").pop() } });
const key = (p: string) => getMusicMixerTitleKey(track(p));
assert.equal(key("D:\\HAZE\\11\\Phantom Pulse.mp3"), key("D:\\HAZE\\5\\Phantom Pulse.mp3"), "one title in two folders is one song");
assert.equal(key("D:\\A\\Phantom Pulse.mp3"), key("D:\\A\\03 - Phantom Pulse (1).mp3"), "a track number and a copy mark do not make another song");
assert.equal(key("D:\\A\\Velvet Smoke.mp3"), key("D:\\B\\velvet  smoke v2.wav"), "case, spacing, a take mark and the format do not either");
assert.notEqual(key("D:\\A\\Velvet Smoke.mp3"), key("D:\\A\\Velvet Eclipse.mp3"), "different titles are different songs");
// 40 songs, each in two folders (80 files): five mixes of 8 share no song and none repeats one.
const files = Array.from({ length: 40 }, (_, i) => [track(`D:\\A\\${i}\\Song ${i}.mp3`), track(`D:\\B\\${i}\\Song ${i}.mp3`)]).flat();
assert.equal(countMusicMixerSongs(files), 40);
const mixes = distributeMusicMixerTracks(files, 8, 5);
for (const mix of mixes) assert.equal(new Set(mix.map(getMusicMixerTitleKey)).size, 8, "no song twice in a mix");
assert.equal(new Set(mixes.flat().map(getMusicMixerTitleKey)).size, 40, "no song in two mixes while there are enough songs");
// More mixes than the songs cover: songs come back across mixes, still never twice in one.
for (const mix of distributeMusicMixerTracks(files, 30, 5)) assert.equal(new Set(mix.map(getMusicMixerTitleKey)).size, 30);
assert.throws(() => distributeMusicMixerTracks(files, 41, 1), /insufficient_unique_tracks/, "a mix cannot hold more songs than there are");
console.log("Music mixer: one song per mix, copies of a song count once, mixes share no song while there are enough.");
