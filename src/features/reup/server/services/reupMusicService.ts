import fs from "fs";
import path from "path";
import _ from "lodash";
import { getDataDirectory } from "../../../../server/utils/paths.js";
import { probeMediaDurationSeconds } from "../../../video-export/server/services/videoExportFfmpegService.js";
import { createHash } from "crypto";
import { REUP_BUILD, REUP_MUSIC, REUP_MUSIC_ZONE as Z } from "../../constants/reupConfig.js";
import type { ReupMusicZone } from "../../lib/reupMusicZones.js";
import { REUP_PRESETS } from "../../constants/reupPresets.js";
import type { ReupPresetId, ReupTrack } from "../../types/reup.js";
import { parseJson, stringifyJson } from "../../../../lib/jsonStringify.js";
import { reupFfmpeg } from "./reupFfmpeg.js";
const PRESET_IDS = new Set<string>(REUP_PRESETS.map((p) => p.id));
export const reupMusicDir = (): string => {
  const dir = path.join(getDataDirectory(), REUP_MUSIC.DIR);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
};
export const reupTrackPreset = (relative: string): ReupPresetId | undefined => {
  const [folder] = relative.split(/[\\/]/);
  if (relative.includes(path.sep) || relative.includes("/")) {
    const id = folder.toUpperCase();
    if (PRESET_IDS.has(id)) return id as ReupPresetId;
  }
  const id = REUP_MUSIC.NAME.exec(path.basename(relative))?.[1]?.toUpperCase();
  return id && PRESET_IDS.has(id) ? (id as ReupPresetId) : undefined;
};
export const reupTracks = (preset?: ReupPresetId): ReupTrack[] => {
  const dir = reupMusicDir();
  const files = fs.readdirSync(dir, { recursive: true, encoding: "utf8" }).filter((f) => REUP_MUSIC.EXT.test(f));
  return _.sortBy(
    files.flatMap((relative) => {
      const type = reupTrackPreset(relative);
      return type && (!preset || type === preset) ? [{ name: relative.split(path.sep).join("/"), file: path.join(dir, relative), preset: type }] : [];
    }),
    "name",
  );
};
export const reupMusicBed = async (track: ReupTrack, seconds: number, dir: string, signal?: AbortSignal, name = "music.wav"): Promise<string> => {
  const M = REUP_MUSIC;
  const length = await probeMediaDurationSeconds(track.file);
  if (!(length > M.CROSSFADE * 2)) throw new Error(track.name);
  const copies = Math.max(1, Math.ceil((seconds - M.CROSSFADE) / (length - M.CROSSFADE)));
  const out = path.join(dir, name);
  const norm = (i: number) => `[${i}:a]aresample=${REUP_BUILD.AUDIO_RATE},aformat=channel_layouts=stereo[t${i}]`;
  const graph = _.range(copies).map(norm);
  let last = "[t0]";
  for (let i = 1; i < copies; i++) {
    graph.push(`${last}[t${i}]acrossfade=d=${M.CROSSFADE}:c1=tri:c2=tri[x${i}]`);
    last = `[x${i}]`;
  }
  const fadeOut = Math.max(0, seconds - M.FADE_OUT);
  graph.push(`${last}atrim=duration=${seconds.toFixed(3)},afade=t=in:d=${M.FADE_IN},afade=t=out:st=${fadeOut.toFixed(3)}:d=${M.FADE_OUT}[bed]`);
  await reupFfmpeg(["-y", ..._.range(copies).flatMap(() => ["-i", track.file]), "-filter_complex", graph.join(";"), "-map", "[bed]", "-c:a", "pcm_s16le", out], { signal });
  return out;
};
export interface ReupTrackAnalysis {
  duration: number;
  lufs: number;
  energy: number[];
  cuts: number[];
}
const RMS_LINE = /RMS_level=(-?[\d.]+|-inf)/g;
export const reupAnalyzeTrack = async (track: ReupTrack, signal?: AbortSignal): Promise<ReupTrackAnalysis> => {
  const stat = fs.statSync(track.file);
  const dir = path.join(reupMusicDir(), Z.ANALYSIS_DIR);
  const cache = path.join(dir, `${createHash("sha1").update(`${track.name}|${stat.size}|${stat.mtimeMs}`).digest("hex")}.json`);
  const cached = fs.existsSync(cache) ? (parseJson(fs.readFileSync(cache, "utf8")) as ReupTrackAnalysis) : undefined;
  if (cached?.energy?.length && Number.isFinite(cached.lufs)) return cached;
  const rate = Z.ANALYSIS_RATE;
  const log = await reupFfmpeg(["-i", track.file, "-filter_complex", `[0:a]asplit=2[a][b];[a]aresample=${rate},asetnsamples=n=${rate},astats=metadata=1:reset=1,ametadata=print:key=lavfi.astats.Overall.RMS_level,anullsink;[b]ebur128=peak=none[out]`, "-map", "[out]", "-f", "null", "-"], { signal, keepLog: true });
  const lufs = Number(/I:\s+(-?[\d.]+) LUFS/.exec(log.slice(log.lastIndexOf("Summary")))?.[1] ?? Z.LUFS);
  const energy = [...log.matchAll(RMS_LINE)].map((m) => (m[1] === "-inf" ? -90 : Math.max(-90, Number(m[1]))));
  const median = _.sortBy(energy)[Math.floor(energy.length / 2)] ?? -30;
  const cuts = [0, ..._.range(1, energy.length - 1).filter((i) => energy[i] <= energy[i - 1] && energy[i] <= energy[i + 1] && energy[i] < median - Z.QUIET_DB)];
  const analysis = { duration: await probeMediaDurationSeconds(track.file), lufs, energy, cuts };
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(cache, stringifyJson(analysis), "utf8");
  return analysis;
};
const windowEnergy = (a: ReupTrackAnalysis, start: number, length: number): number => _.mean(a.energy.slice(Math.floor(start), Math.max(Math.floor(start) + 1, Math.floor(start + length)))) || -90;
export const reupPickTrackParts = (a: ReupTrackAnalysis, zones: ReupMusicZone[]): number[] => {
  const median = _.sortBy(a.energy)[Math.floor(a.energy.length / 2)] ?? -30;
  const used: [number, number][] = [];
  return zones.map((zone) => {
    const length = zone.end - zone.start;
    if (length >= a.duration - 1) return 0;
    if (zone.kind === "ending") return Math.max(0, a.duration - length);
    const starts = a.cuts.filter((t) => t + length <= a.duration);
    const best = _.minBy(starts.length ? starts : [0], (t) => {
      const e = windowEnergy(a, t, length);
      const rise = windowEnergy(a, t + length / 2, length / 2) - windowEnergy(a, t, length / 2);
      const fit = zone.kind === "sting" ? -e : zone.kind === "hook" ? -e - rise : Math.abs(e - (median + Z.CALM_TARGET));
      const reuse = used.some(([u0, u1]) => t < u1 && t + length > u0) ? Z.REUSE_PENALTY : 0;
      return fit + reuse;
    })!;
    used.push([best, best + length]);
    return best;
  });
};
export const reupZonedMusicBed = async (track: ReupTrack, zones: ReupMusicZone[], total: number, dir: string, signal?: AbortSignal): Promise<string | undefined> => {
  if (!zones.length) return undefined;
  const analysis = await reupAnalyzeTrack(track, signal);
  const starts = reupPickTrackParts(analysis, zones);
  const out = path.join(dir, "music.wav");
  const inputs: string[] = [];
  for (const [i, zone] of zones.entries()) inputs.push(...(zone.end - zone.start >= analysis.duration - 1 ? ["-i", await reupMusicBed(track, zone.end - zone.start, dir, signal, `music_loop_${i}.wav`)] : ["-ss", starts[i].toFixed(3), "-i", track.file]));
  const graph = zones.map((zone, i) => {
    const length = zone.end - zone.start;
    const fadeIn = Math.min(Z.FADE_IN, length / 3);
    const fadeOut = Math.min(Z.FADE_OUT, length / 3);
    const gain = Z.LUFS - analysis.lufs + (Z.GAIN[zone.kind] || 0);
    return `[${i}:a]atrim=duration=${length.toFixed(3)},asetpts=PTS-STARTPTS,aresample=${REUP_BUILD.AUDIO_RATE},aformat=channel_layouts=stereo,volume=${gain.toFixed(2)}dB,afade=t=in:d=${fadeIn.toFixed(2)},afade=t=out:st=${(length - fadeOut).toFixed(3)}:d=${fadeOut.toFixed(2)},adelay=${Math.round(zone.start * 1000)}:all=1[z${i}]`;
  });
  graph.push(`${zones.map((_z, i) => `[z${i}]`).join("")}amix=inputs=${zones.length}:duration=longest:normalize=0,apad=whole_dur=${total.toFixed(3)},atrim=duration=${total.toFixed(3)}[bed]`);
  await reupFfmpeg(["-y", ...inputs, "-filter_complex", graph.join(";"), "-map", "[bed]", "-c:a", "pcm_s16le", out], { signal });
  return out;
};
