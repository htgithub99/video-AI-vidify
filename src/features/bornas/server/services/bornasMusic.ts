import fs from "fs";
import path from "path";
import { createHash } from "crypto";
import { getDataDirectory } from "../../../../server/utils/paths.js";
import { reupFfmpeg } from "../../../reup/server/services/reupFfmpeg.js";
import { reupMusicBed } from "../../../reup/server/services/reupMusicService.js";
import { probeMediaDurationSeconds } from "../../../video-export/server/services/videoExportFfmpegService.js";
import { REUP_MUSIC } from "../../../reup/constants/reupConfig.js";
import { BORNAS_MUSIC } from "../../constants/bornasConfig.js";
import { BORNAS_LOG } from "../../constants/bornasServerText.js";
import type { BornasJob, BornasTopic, BornasVideo } from "../../types/bornas.js";
type Log = (text: string, level?: "info" | "warn" | "error") => void;
export const bornasMusicDir = (topic?: BornasTopic): string => {
  const dir = path.join(getDataDirectory(), BORNAS_MUSIC.DIR, topic || "");
  fs.mkdirSync(dir, { recursive: true });
  return dir;
};
const listTracks = (dir: string): string[] =>
  fs
    .readdirSync(dir, { recursive: true, encoding: "utf8" })
    .filter((f) => REUP_MUSIC.EXT.test(f))
    .sort()
    .map((f) => path.join(dir, f));
export const bornasTracks = (topic: BornasTopic): string[] => {
  const own = listTracks(bornasMusicDir(topic));
  return own.length ? own : listTracks(bornasMusicDir(BORNAS_MUSIC.FALLBACK_TOPIC));
};
const pickTrack = (tracks: string[], seed: string): string => tracks[parseInt(createHash("sha1").update(seed).digest("hex").slice(0, 8), 16) % tracks.length];
export const mixBornasVoice = async (job: BornasJob, video: BornasVideo, voice: string, out: string, log: Log, signal?: AbortSignal): Promise<void> => {
  const tracks = job.channel.music === "library" ? bornasTracks(job.channel.topic) : [];
  if (!tracks.length) {
    if (job.channel.music === "library") log(BORNAS_LOG.MUSIC_NONE(bornasMusicDir(job.channel.topic)), "warn");
    fs.copyFileSync(voice, out);
    return;
  }
  const file = pickTrack(tracks, `${job.id}|${video.index}`);
  const seconds = await probeMediaDurationSeconds(voice);
  const bed = await reupMusicBed({ name: path.basename(file), file, preset: "A" }, seconds, path.dirname(out), signal, BORNAS_MUSIC.BED_FILE);
  const graph = `[0:a]asplit[v1][v2];[1:a]volume=${BORNAS_MUSIC.MUSIC_DB}dB[m];[m][v1]sidechaincompress=${BORNAS_MUSIC.DUCK}[duck];[v2][duck]amix=inputs=2:normalize=0,${BORNAS_MUSIC.LOUDNORM}[a]`;
  await reupFfmpeg(["-y", "-i", voice, "-i", bed, "-filter_complex", graph, "-map", "[a]", "-ar", String(BORNAS_MUSIC.RATE), "-c:a", "pcm_s16le", out], { signal });
  fs.rmSync(bed, { force: true });
  log(BORNAS_LOG.MUSIC_MIXED(path.basename(file)));
};
