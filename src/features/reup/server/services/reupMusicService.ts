import fs from "fs";
import path from "path";
import _ from "lodash";
import { getDataDirectory } from "../../../../server/utils/paths.js";
import { probeMediaDurationSeconds } from "../../../video-export/server/services/videoExportFfmpegService.js";
import { REUP_BUILD, REUP_MUSIC } from "../../constants/reupConfig.js";
import { REUP_PRESETS } from "../../constants/reupPresets.js";
import type { ReupPresetId, ReupTrack } from "../../types/reup.js";
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
export const reupMusicBed = async (track: ReupTrack, seconds: number, dir: string, signal?: AbortSignal): Promise<string> => {
  const M = REUP_MUSIC;
  const length = await probeMediaDurationSeconds(track.file);
  if (!(length > M.CROSSFADE * 2)) throw new Error(track.name);
  const copies = Math.max(1, Math.ceil((seconds - M.CROSSFADE) / (length - M.CROSSFADE)));
  const out = path.join(dir, "music.wav");
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
