import fs from "fs";
import { createHash } from "crypto";
import path from "path";
import _ from "lodash";
import { inspectVideoFile } from "../../../../server/services/shortsPreprocessService.js";
import { probeMediaHasAudio } from "../../../video-export/server/services/videoExportFfmpegService.js";
import { transcribeVieneuAudio } from "../../../../server/services/vieneuTtsService.js";
import { REUP_DIR, REUP_FINGERPRINT_BYTES, REUP_FOLDER, REUP_OVERLAY, REUP_QUALITY, REUP_SHEET, REUP_WATERMARK } from "../../constants/reupConfig.js";
import { REUP_ERROR } from "../../constants/reupServerText.js";
import { reupBadRanges, reupDimRanges } from "../../lib/reupSceneMap.js";
import { reupItemAt, reupPhrases } from "../../lib/reupSpeech.js";
import { reupWatermarkCorner, reupWatermarkCrop } from "../../lib/reupWatermark.js";
import type { ReupBadRange, ReupCorner, ReupDimRange, ReupMediaItem, ReupSheet, ReupSource, ReupTranscript } from "../../types/reup.js";
import { reupFfmpeg, reupFilterValue, reupFont, reupHasFilter, reupProbe } from "./reupFfmpeg.js";
import { reupFileUrl, reupJobDir } from "./reupJobStore.js";
const natural = (a: string, b: string): number => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
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
export const reupMediaFile = (source: ReupSource): string => source.proxy || source.path;
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
export const transcribeReupSource = async (jobId: string, source: ReupSource, language: string, signal?: AbortSignal, log?: (line: string) => void): Promise<ReupTranscript> => {
  const wav = reupJobDir(jobId, "speech.wav");
  await reupFfmpeg(["-y", "-i", source.path, "-vn", "-ac", "1", "-ar", "16000", wav], { signal });
  const result = await transcribeVieneuAudio(wav, language, signal, log);
  const words = (result.words || []).filter((w) => w && w.w && Number.isFinite(w.s) && Number.isFinite(w.e) && w.e >= w.s);
  return { text: result.text || words.map((w) => w.w).join(" "), words, phrases: reupPhrases(words, REUP_OVERLAY.PHRASE_GAP, REUP_OVERLAY.PHRASE_MAX) };
};
export const reupSheetInterval = (duration: number, wanted: number): number => {
  const per = REUP_SHEET.COLS * REUP_SHEET.ROWS;
  if (duration >= REUP_SHEET.SHORT_SOURCE) return wanted;
  return _.clamp(Math.ceil(duration / per), REUP_SHEET.MIN_INTERVAL, wanted);
};
export const makeReupSheets = async (jobId: string, source: ReupSource, wanted: number, signal?: AbortSignal, onFontMissing?: () => void): Promise<{ sheets: ReupSheet[]; watermark?: ReupCorner }> => {
  const interval = reupSheetInterval(source.duration, wanted);
  const dir = reupJobDir(jobId, REUP_DIR.SHEETS);
  for (const old of fs.readdirSync(dir)) fs.rmSync(path.join(dir, old), { force: true });
  const font = reupFont();
  if (!font) onFontMissing?.();
  const stamp = font ? `,drawtext=fontfile='${reupFilterValue(font)}':text='%{pts\\:hms}':x=6:y=6:fontsize=20:fontcolor=white:box=1:boxcolor=black@0.65:boxborderw=4` : "";
  const keyOnly = source.duration >= REUP_SHEET.SHORT_SOURCE ? ["-skip_frame", "nokey"] : [];
  const per = REUP_SHEET.COLS * REUP_SHEET.ROWS;
  const raw = reupJobDir(jobId, REUP_DIR.FRAMES, "watermark.raw");
  const graph = `[0:v]fps=1/${interval}:start_time=0,split=2[a][b];[a]scale=${REUP_SHEET.TILE_WIDTH}:-2${stamp},tile=${REUP_SHEET.COLS}x${REUP_SHEET.ROWS}:padding=4:margin=4[s];[b]scale=${REUP_WATERMARK.WIDTH}:${REUP_WATERMARK.HEIGHT},format=gray[g]`;
  await reupFfmpeg(["-y", ...keyOnly, "-i", reupMediaFile(source), "-an", "-sn", "-filter_complex", graph, "-map", "[s]", "-q:v", String(REUP_SHEET.JPEG_Q), "-start_number", "0", path.join(dir, "sheet_%03d.jpg"), "-map", "[g]", "-f", "rawvideo", raw], { signal });
  const watermark = fs.existsSync(raw) ? reupWatermarkCorner(fs.readFileSync(raw)) : undefined;
  fs.rmSync(raw, { force: true });
  const tiles = Math.max(1, Math.ceil(source.duration / interval));
  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".jpg"))
    .sort();
  return { sheets: files.map((file, index) => ({ index, file: path.join(dir, file), url: reupFileUrl(path.join(dir, file)), start: index * per * interval, interval, count: Math.max(1, Math.min(per, tiles - index * per)), cols: REUP_SHEET.COLS, rows: REUP_SHEET.ROWS })), ...(watermark ? { watermark } : {}) };
};
export const cropReupSheet = async (jobId: string, sheet: ReupSheet, fromRow: number, rows: number, signal?: AbortSignal): Promise<ReupSheet | undefined> => {
  const count = Math.min(rows * sheet.cols, sheet.count - fromRow * sheet.cols);
  if (count <= 0) return undefined;
  const file = path.join(reupJobDir(jobId, REUP_DIR.SHEETS), `${path.basename(sheet.file, ".jpg")}_r${fromRow}-${fromRow + rows - 1}.jpg`);
  await reupFfmpeg(["-y", "-i", sheet.file, "-vf", `crop=iw:(ih-4)*${rows}/${sheet.rows}+4:0:(ih-4)*${fromRow}/${sheet.rows}`, "-q:v", String(REUP_SHEET.JPEG_Q), file], { signal });
  return { ...sheet, file, url: reupFileUrl(file), start: sheet.start + fromRow * sheet.cols * sheet.interval, count, rows };
};
export const measureReupQuality = async (source: ReupSource, darkLevel: number, blurLevel: number, signal?: AbortSignal): Promise<{ bad: ReupBadRange[]; dim: ReupDimRange[]; blurMeasured: boolean }> => {
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
  return { bad: reupBadRanges(samples, darkLevel, blur ? blurLevel : 0, REUP_QUALITY.MERGE_GAP, REUP_QUALITY.MIN_BAD), dim: reupDimRanges(samples, darkLevel, REUP_QUALITY.DIM, REUP_QUALITY.MERGE_GAP, REUP_QUALITY.DIM_MIN), blurMeasured: blur };
};
export const reupFrame = async (jobId: string, source: ReupSource, time: number, width = 640, signal?: AbortSignal, watermark?: ReupCorner): Promise<string> => {
  const file = reupJobDir(jobId, REUP_DIR.FRAMES, `${Math.round(time * 10)}_${width}${watermark ? `_${watermark}` : ""}.jpg`);
  if (fs.existsSync(file)) return file;
  const item = source.kind === "folder" ? reupItemAt(source.items || [], time) : undefined;
  const input = item ? item.path : source.path;
  const seek = item ? (item.type === "clip" ? time - item.start : 0) : time;
  await reupFfmpeg(["-y", ...(seek > 0 ? ["-ss", seek.toFixed(2)] : []), "-i", input, "-frames:v", "1", "-vf", `${reupWatermarkCrop(watermark)}scale=${width}:-2`, "-q:v", "3", file], { signal });
  return file;
};
export const reupFingerprint = async (source: ReupSource): Promise<string> => {
  const hash = createHash("sha1");
  if (source.kind === "folder") {
    for (const item of _.sortBy(source.items || [], "name")) hash.update(`${item.name}:${fs.existsSync(item.path) ? fs.statSync(item.path).size : 0}\n`);
    return hash.digest("hex").slice(0, 20);
  }
  const size = fs.statSync(source.path).size;
  const handle = await fs.promises.open(source.path, "r");
  try {
    const block = Math.min(REUP_FINGERPRINT_BYTES, size);
    for (const at of _.uniq([0, Math.max(0, size - block)])) {
      const buffer = Buffer.alloc(block);
      await handle.read(buffer, 0, block, at);
      hash.update(buffer);
    }
  } finally {
    await handle.close();
  }
  return hash.update(String(size)).digest("hex").slice(0, 20);
};
