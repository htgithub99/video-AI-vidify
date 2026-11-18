import fs from "fs";
import path from "path";
import _ from "lodash";
import { inspectVideoFile } from "../../../../server/services/shortsPreprocessService.js";
import { probeMediaHasAudio } from "../../../video-export/server/services/videoExportFfmpegService.js";
import { transcribeVieneuAudio } from "../../../../server/services/vieneuTtsService.js";
import { REUP_DIR, REUP_FOLDER, REUP_OVERLAY, REUP_QUALITY, REUP_SHEET } from "../../constants/reupConfig.js";
import { REUP_ERROR } from "../../constants/reupServerText.js";
import { reupBadRanges } from "../../lib/reupSceneMap.js";
import { reupItemAt, reupPhrases } from "../../lib/reupSpeech.js";
import type { ReupBadRange, ReupMediaItem, ReupSheet, ReupSource, ReupTranscript } from "../../types/reup.js";
import { reupFfmpeg, reupFilterValue, reupFont, reupHasFilter, reupProbe } from "./reupFfmpeg.js";
import { reupFileUrl, reupJobDir } from "./reupJobStore.js";
const natural = (a: string, b: string): number => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
/** A folder of photos and short clips, in name order, laid end to end (photos PHOTO_SECONDS each). */
const inspectReupFolder = async (folder: string): Promise<ReupSource> => {
  const files: string[] = [];
  const walk = (dir: string, depth: number) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => natural(a.name, b.name))) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory() && depth < 2) walk(full, depth + 1);
      else if (entry.isFile() && (REUP_FOLDER.IMAGE_EXT.test(entry.name) || REUP_FOLDER.VIDEO_EXT.test(entry.name))) files.push(full);
    }
  };
  walk(folder, 0);
  const items: ReupMediaItem[] = [];
  let at = 0;
  for (const batch of _.chunk(files.slice(0, REUP_FOLDER.MAX_ITEMS), 4)) {
    const probes = await Promise.all(batch.map((file) => reupProbe(file)));
    batch.forEach((file, i) => {
      const probe = probes[i];
      const photo = REUP_FOLDER.IMAGE_EXT.test(file);
      const length = photo ? REUP_FOLDER.PHOTO_SECONDS : probe.duration;
      if (!probe.width || !probe.height || !(length > 0.5)) return;
      items.push({ id: `m${items.length + 1}`, path: file, name: path.basename(file), type: photo ? "photo" : "clip", start: _.round(at, 3), end: _.round(at + length, 3), width: probe.width, height: probe.height, hasAudio: !photo && probe.hasAudio });
      at += length;
    });
  }
  if (!items.length) throw new Error(REUP_ERROR.NO_MEDIA);
  const size = _.maxBy(items, (it) => it.width * it.height)!;
  return { path: folder, kind: "folder", items, name: path.basename(folder), duration: _.round(at, 3), width: size.width, height: size.height, fps: 30, hasAudio: items.some((it) => it.hasAudio), sizeBytes: _.sumBy(items, (it) => fs.statSync(it.path).size) };
};
export const inspectReupSource = async (file: string): Promise<ReupSource> => {
  if (!file || !fs.existsSync(file)) throw new Error(REUP_ERROR.NO_SOURCE);
  if (fs.statSync(file).isDirectory()) return inspectReupFolder(file);
  const [meta, hasAudio] = await Promise.all([inspectVideoFile(file), probeMediaHasAudio(file)]);
  if (!meta.width || !meta.height || !meta.duration) throw new Error(REUP_ERROR.NO_VIDEO);
  return { path: file, kind: "video", name: path.basename(file), duration: meta.duration, width: meta.width, height: meta.height, fps: meta.fps || 30, hasAudio, sizeBytes: meta.fileSizeBytes || fs.statSync(file).size };
};
/** The file sheets, quality and review frames read: the source video, or a folder's proxy. */
export const reupMediaFile = (source: ReupSource): string => source.proxy || source.path;
/** Low-resolution video of a folder's timeline (photos held, clips as they are), so a folder reads like one video. */
export const makeReupProxy = async (jobId: string, source: ReupSource, signal?: AbortSignal): Promise<string> => {
  const dir = reupJobDir(jobId, "proxy");
  const h = REUP_FOLDER.PROXY_HEIGHT;
  const w = Math.round((h * 16) / 9 / 2) * 2;
  const fit = `scale=${w}:${h}:force_original_aspect_ratio=decrease,pad=${w}:${h}:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=${REUP_FOLDER.PROXY_FPS},format=yuv420p`;
  const parts: string[] = [];
  for (const item of source.items || []) {
    const part = path.join(dir, `${item.id}.mp4`);
    const len = (item.end - item.start).toFixed(3);
    if (!fs.existsSync(part)) await reupFfmpeg(["-y", ...(item.type === "photo" ? ["-loop", "1", "-t", len] : ["-t", len]), "-i", item.path, "-an", "-vf", fit, "-c:v", "libx264", "-preset", "ultrafast", "-g", String(REUP_FOLDER.PROXY_FPS), "-t", len, part], { signal });
    parts.push(part);
  }
  const list = path.join(dir, "list.txt");
  fs.writeFileSync(list, parts.map((f) => `file '${f.replace(/\\/g, "/").replace(/'/g, "'\\''")}'`).join("\n"), "utf8");
  const proxy = path.join(dir, "proxy.mp4");
  await reupFfmpeg(["-y", "-f", "concat", "-safe", "0", "-i", list, "-c", "copy", proxy], { signal });
  return proxy;
};
/** The source's own speech as words with times (local recogniser), grouped into phrases a script can pick. */
export const transcribeReupSource = async (jobId: string, source: ReupSource, language: string, signal?: AbortSignal, log?: (line: string) => void): Promise<ReupTranscript> => {
  const wav = reupJobDir(jobId, "speech.wav");
  await reupFfmpeg(["-y", "-i", source.path, "-vn", "-ac", "1", "-ar", "16000", wav], { signal });
  const result = await transcribeVieneuAudio(wav, language, signal, log);
  const words = (result.words || []).filter((w) => w && w.w && Number.isFinite(w.s) && Number.isFinite(w.e) && w.e >= w.s);
  return { text: result.text || words.map((w) => w.w).join(" "), words, phrases: reupPhrases(words, REUP_OVERLAY.PHRASE_GAP, REUP_OVERLAY.PHRASE_MAX) };
};
/** Seconds between sheet frames: the chosen interval, tightened for short sources so one sheet still covers them well. */
export const reupSheetInterval = (duration: number, wanted: number): number => {
  const per = REUP_SHEET.COLS * REUP_SHEET.ROWS;
  if (duration >= REUP_SHEET.SHORT_SOURCE) return wanted;
  return _.clamp(Math.ceil(duration / per), REUP_SHEET.MIN_INTERVAL, wanted);
};
/**
 * Contact sheets: one keyframe every `interval` seconds, 6×5 tiles per image with the time printed on each
 * tile. Only keyframes are decoded, so a 45-minute source takes about a minute.
 */
export const makeReupSheets = async (jobId: string, source: ReupSource, wanted: number, signal?: AbortSignal, onFontMissing?: () => void): Promise<ReupSheet[]> => {
  const interval = reupSheetInterval(source.duration, wanted);
  const dir = reupJobDir(jobId, REUP_DIR.SHEETS);
  for (const old of fs.readdirSync(dir)) fs.rmSync(path.join(dir, old), { force: true });
  const font = reupFont();
  if (!font) onFontMissing?.();
  const stamp = font ? `,drawtext=fontfile='${reupFilterValue(font)}':text='%{pts\\:hms}':x=6:y=6:fontsize=20:fontcolor=white:box=1:boxcolor=black@0.65:boxborderw=4` : "";
  const keyOnly = source.duration >= REUP_SHEET.SHORT_SOURCE ? ["-skip_frame", "nokey"] : [];
  const per = REUP_SHEET.COLS * REUP_SHEET.ROWS;
  await reupFfmpeg(["-y", ...keyOnly, "-i", reupMediaFile(source), "-an", "-sn", "-vf", `fps=1/${interval}:start_time=0,scale=${REUP_SHEET.TILE_WIDTH}:-2${stamp},tile=${REUP_SHEET.COLS}x${REUP_SHEET.ROWS}:padding=4:margin=4`, "-q:v", String(REUP_SHEET.JPEG_Q), "-start_number", "0", path.join(dir, "sheet_%03d.jpg")], { signal });
  const tiles = Math.max(1, Math.ceil(source.duration / interval));
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".jpg")).sort();
  return files.map((file, index) => ({ index, file: path.join(dir, file), url: reupFileUrl(path.join(dir, file)), start: index * per * interval, interval, count: Math.max(1, Math.min(per, tiles - index * per)), cols: REUP_SHEET.COLS, rows: REUP_SHEET.ROWS }));
};
/** Brightness (and blur when the ffmpeg build can measure it) of every keyframe → ranges to keep off screen. */
export const measureReupQuality = async (source: ReupSource, darkLevel: number, blurLevel: number, signal?: AbortSignal): Promise<{ bad: ReupBadRange[]; blurMeasured: boolean }> => {
  const blur = blurLevel > 0 && (await reupHasFilter("blurdetect"));
  const keyOnly = source.duration >= REUP_SHEET.SHORT_SOURCE ? ["-skip_frame", "nokey"] : [];
  const log = await reupFfmpeg(["-y", ...keyOnly, "-i", reupMediaFile(source), "-an", "-sn", "-vf", `scale=${REUP_QUALITY.SCALE}:-2,signalstats${blur ? ",blurdetect" : ""},metadata=mode=print`, "-f", "null", "-"], { signal, keepLog: true });
  const samples: { t: number; y: number; blur?: number }[] = [];
  let current: { t: number; y: number; blur?: number } | undefined;
  for (const line of log.split(/\r?\n/)) {
    const time = line.match(/pts_time:(-?[\d.]+)/);
    if (time) {
      current = { t: Number(time[1]), y: 255 };
      samples.push(current);
      continue;
    }
    const y = line.match(/lavfi\.signalstats\.YAVG=([\d.]+)/);
    if (y && current) current.y = Number(y[1]);
    const b = line.match(/lavfi\.blur=([\d.]+)/);
    if (b && current) current.blur = Number(b[1]);
  }
  return { bad: reupBadRanges(samples, darkLevel, blur ? blurLevel : 0, REUP_QUALITY.MERGE_GAP, REUP_QUALITY.MIN_BAD), blurMeasured: blur };
};
/** One frame as JPEG (cached per tenth of a second); for a folder, the original photo or clip at that moment. */
export const reupFrame = async (jobId: string, source: ReupSource, time: number, width = 640, signal?: AbortSignal): Promise<string> => {
  const file = reupJobDir(jobId, REUP_DIR.FRAMES, `${Math.round(time * 10)}_${width}.jpg`);
  if (fs.existsSync(file)) return file;
  const item = source.kind === "folder" ? reupItemAt(source.items || [], time) : undefined;
  const input = item ? item.path : source.path;
  const seek = item ? (item.type === "clip" ? time - item.start : 0) : time;
  await reupFfmpeg(["-y", ...(seek > 0 ? ["-ss", seek.toFixed(2)] : []), "-i", input, "-frames:v", "1", "-vf", `scale=${width}:-2`, "-q:v", "3", file], { signal });
  return file;
};
