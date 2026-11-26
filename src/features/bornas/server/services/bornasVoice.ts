import fs from "fs";
import path from "path";
import _ from "lodash";
import { synthesizeMotionSpeech } from "../../../motion/server/services/motionVoiceSourceService.js";
import { findVoiceChannel } from "../../../motion/server/services/motionVoiceLibraryService.js";
import { transcribeVieneuAudio, vieneuRoot } from "../../../../server/services/vieneuTtsService.js";
import { reupFfmpeg } from "../../../reup/server/services/reupFfmpeg.js";
import { probeMediaDurationSeconds } from "../../../video-export/server/services/videoExportFfmpegService.js";
import { BORNAS_DIR, BORNAS_LIMITS, bornasTokens } from "../../constants/bornasConfig.js";
import { BORNAS_ERROR, BORNAS_LOG } from "../../constants/bornasServerText.js";
import type { BornasJob, BornasScript, BornasVideo } from "../../types/bornas.js";
import { bornasDir } from "./bornasStore.js";
type Log = (text: string, level?: "info" | "warn" | "error") => void;
export const bornasVideoDir = (job: BornasJob, video: BornasVideo, ...parts: string[]): string => bornasDir(job.id, BORNAS_DIR.VIDEO, String(video.index + 1).padStart(2, "0"), ...parts);
const mapWords = (tokens: number, heard: { s: number; e: number }[], length: number): [number, number][] => {
  if (!heard.length) return Array.from({ length: tokens }, (_x, k) => [(length * k) / tokens, (length * (k + 1)) / tokens]);
  return Array.from({ length: tokens }, (_x, k) => {
    const h = heard[Math.min(heard.length - 1, Math.floor((k * heard.length) / tokens))];
    return [_.round(h.s, 3), _.round(h.e, 3)];
  });
};
export const voiceBornasVideo = async (job: BornasJob, video: BornasVideo, script: BornasScript, log: Log, signal?: AbortSignal): Promise<void> => {
  const voice = findVoiceChannel(job.channel.voiceChannel)?.narratorVoiceId;
  if (!voice) throw new Error(BORNAS_ERROR.NO_VOICE);
  const dir = bornasVideoDir(job, video, BORNAS_DIR.VOICE);
  const files: string[] = [];
  const seconds: number[] = [];
  for (const [i, line] of script.lines.entries()) {
    const file = path.join(dir, `l${String(i).padStart(3, "0")}.wav`);
    if (!fs.existsSync(file)) {
      log(BORNAS_LOG.VOICE_LINE(i + 1, script.lines.length));
      const work = path.join(vieneuRoot(), BORNAS_DIR.ROOT, job.id);
      fs.mkdirSync(work, { recursive: true });
      const tmp = path.join(work, path.basename(file));
      await synthesizeMotionSpeech(line.text, voice, tmp, signal, (text) => text && log(text));
      fs.copyFileSync(tmp, file);
      fs.rmSync(tmp, { force: true });
    }
    seconds.push(await probeMediaDurationSeconds(file));
    files.push(file);
  }
  const gaps = script.lines.map((l, i) => (i + 1 === script.lines.length ? 0 : l.pause ? BORNAS_LIMITS.BREAK_PAUSE : BORNAS_LIMITS.PAUSE));
  const starts: number[] = [];
  let at = 0;
  for (const [i, s] of seconds.entries()) {
    starts.push(_.round(at, 3));
    at += s + gaps[i];
  }
  const out = bornasVideoDir(job, video, "voice.wav");
  const graph = files.map((_f, i) => `[${i}:a]aresample=48000,aformat=channel_layouts=mono${gaps[i] ? `,apad=pad_dur=${gaps[i].toFixed(3)}` : ""}[c${i}]`).join(";") + `;${files.map((_f, i) => `[c${i}]`).join("")}concat=n=${files.length}:v=0:a=1,loudnorm=I=${BORNAS_LIMITS.LUFS}:TP=-1.5:LRA=11[out]`;
  await reupFfmpeg(["-y", ...files.flatMap((f) => ["-i", f]), "-filter_complex", graph, "-map", "[out]", "-ar", "48000", "-c:a", "pcm_s16le", out], { signal });
  log(BORNAS_LOG.WORDS);
  const tmp = path.join(dir, "asr.wav");
  await reupFfmpeg(["-y", "-i", out, "-ac", "1", "-ar", "16000", tmp], { signal });
  const heard = await transcribeVieneuAudio(tmp, job.channel.language, signal).catch(() => ({ words: [] as { s: number; e: number }[] }));
  fs.rmSync(tmp, { force: true });
  const words = script.lines.map((line, i) => {
    const from = starts[i] - 0.1,
      to = starts[i] + seconds[i] + gaps[i] / 2;
    const mine = heard.words.filter((w) => w.s >= from && w.s < to).map((w) => ({ s: Math.max(0, w.s - starts[i]), e: Math.max(0, w.e - starts[i]) }));
    const tokens = bornasTokens(line.text).length;
    return mapWords(tokens, mine, seconds[i]).map(([s, e]) => [_.round(starts[i] + s, 3), _.round(starts[i] + e, 3)] as [number, number]);
  });
  video.seconds = _.round(at, 2);
  video.lineStarts = starts;
  video.words = words;
  log(BORNAS_LOG.VOICE_DONE(video.seconds));
};
