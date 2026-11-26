import fs from "fs";
import path from "path";
import { createHash } from "crypto";
import _ from "lodash";
import { reupFfmpeg, reupProbe } from "../../../reup/server/services/reupFfmpeg.js";
import { transcribeVieneuAudio } from "../../../../server/services/vieneuTtsService.js";
import { runMotionAi } from "../../../motion/server/services/motionStoryService.js";
import { reupExec } from "../../../reup/server/services/reupAiService.js";
import { BORNAS_DIR, BORNAS_LIMITS } from "../../constants/bornasConfig.js";
import { BORNAS_ARTIFACT, BORNAS_PROMPT } from "../../constants/bornasPrompts.js";
import { BORNAS_ERROR, BORNAS_LOG } from "../../constants/bornasServerText.js";
import type { BornasAnalysis, BornasJob, BornasSample } from "../../types/bornas.js";
import { bornasDir } from "./bornasStore.js";
import { readJson, writeJson } from "./bornasTools.js";
type Log = (text: string, level?: "info" | "warn" | "error") => void;
export const inspectBornasSample = async (file: string): Promise<BornasSample> => {
  if (!file || !fs.existsSync(file) || fs.statSync(file).isDirectory()) throw new Error(BORNAS_ERROR.NO_SOURCE);
  const stat = fs.statSync(file);
  const meta = await reupProbe(file);
  if (!meta.duration) throw new Error(BORNAS_ERROR.NO_SOURCE);
  const key = createHash("sha1")
    .update(`${path.resolve(file)}|${stat.size}|${stat.mtimeMs}`)
    .digest("hex")
    .slice(0, 16);
  return { path: file, name: path.basename(file), duration: meta.duration, width: meta.width, height: meta.height, key };
};
const sampleFile = (key: string): string => path.join(bornasDir(BORNAS_DIR.SAMPLES), `${key}.json`);
export const dropBornasAnalysis = (key: string): void => fs.rmSync(sampleFile(key), { force: true });
export const cachedBornasAnalysis = (key: string): BornasAnalysis | undefined => readJson<BornasAnalysis | undefined>(sampleFile(key), undefined);
const cuts = async (file: string, signal?: AbortSignal): Promise<number[]> => {
  const log = await reupFfmpeg(["-i", file, "-an", "-vf", `scale=320:-2,select='gt(scene,${BORNAS_LIMITS.SCENE_CUT})',showinfo`, "-f", "null", "-"], { signal, keepLog: true });
  return [...log.matchAll(/pts_time:([\d.]+)/g)].map((m) => Number(m[1]));
};
const sheets = async (job: BornasJob, signal?: AbortSignal): Promise<string[]> => {
  const dir = bornasDir(job.id, BORNAS_DIR.SHEETS);
  for (const old of fs.readdirSync(dir)) fs.rmSync(path.join(dir, old), { force: true });
  const tiles = BORNAS_LIMITS.SHEET_COLS * BORNAS_LIMITS.SHEET_ROWS * BORNAS_LIMITS.SHEETS;
  const rate = (tiles / Math.max(1, job.sample.duration)).toFixed(5);
  await reupFfmpeg(["-y", "-i", job.sample.path, "-an", "-vf", `fps=${rate},scale=${BORNAS_LIMITS.SHEET_TILE}:-2,tile=${BORNAS_LIMITS.SHEET_COLS}x${BORNAS_LIMITS.SHEET_ROWS}`, "-q:v", "4", path.join(dir, "sheet_%02d.jpg")], { signal });
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".jpg"))
    .sort()
    .slice(0, BORNAS_LIMITS.SHEETS)
    .map((f) => path.join(dir, f));
};
const median = (values: number[]): number => {
  if (!values.length) return 0;
  const s = [...values].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
};
export const analyzeBornasSample = async (job: BornasJob, log: Log, signal?: AbortSignal): Promise<BornasAnalysis> => {
  const cached = cachedBornasAnalysis(job.sample.key);
  if (cached) {
    log(BORNAS_LOG.SAMPLE_CACHED);
    return cached;
  }
  log(BORNAS_LOG.TRANSCRIBE);
  const wav = bornasDir(job.id, "sample.wav");
  await reupFfmpeg(["-y", "-i", job.sample.path, "-vn", "-ac", "1", "-ar", "16000", wav], { signal });
  const asr = await transcribeVieneuAudio(wav, job.channel.language, signal, (line) => line && log(line));
  fs.rmSync(wav, { force: true });
  const spoken = asr.words.length ? Math.max(1, _.last(asr.words)!.e - asr.words[0].s) : job.sample.duration;
  const wpm = (asr.words.length / spoken) * 60;
  log(BORNAS_LOG.TRANSCRIBED(asr.words.length, wpm));
  const gaps = asr.words.slice(1).map((w, i) => w.s - asr.words[i].e);
  const breaks = asr.words.filter((_w, i) => i + 1 < asr.words.length && gaps[i] > 0.35).map((w) => w.e);
  const sentence = median(breaks.slice(1).map((t, i) => t - breaks[i]));
  const times = await cuts(job.sample.path, signal);
  const lengths = [...times, job.sample.duration].map((t, i, all) => t - (i ? all[i - 1] : 0)).filter((d) => d > 0.05);
  const shotMedian = median(lengths);
  log(BORNAS_LOG.CUTS(lengths.length, shotMedian));
  const files = await sheets(job, signal);
  log(BORNAS_LOG.SHEETS(files.length));
  log(BORNAS_LOG.ANALYZE);
  const raw = await runMotionAi(
    BORNAS_PROMPT.ANALYZE({ name: job.sample.name, duration: job.sample.duration, transcript: asr.text, wpm, shotMedian, shotCount: lengths.length, sheets: files.length }),
    BORNAS_ARTIFACT.ANALYZE,
    reupExec(job.ai.visionAi),
    signal,
    (line) => line && log(line),
    files.map((file, i) => ({ name: `sheet_${i + 1}.jpg`, mimeType: "image/jpeg", path: file })),
  );
  const text = (v: unknown): string => (typeof v === "string" ? v.trim() : v ? JSON.stringify(v) : "");
  const analysis: BornasAnalysis = { key: job.sample.key, transcript: asr.text, wordsPerMinute: wpm, shotMedian, shotCount: lengths.length, sentenceSeconds: sentence, formula: text(raw?.formula), narration: text(raw?.narration), shots: text(raw?.shots), texts: text(raw?.texts), art: text(raw?.art) };
  writeJson(sampleFile(job.sample.key), analysis);
  log(BORNAS_LOG.ANALYZED);
  return analysis;
};
