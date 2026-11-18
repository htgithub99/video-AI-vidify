import { spawn } from "child_process";
import fs from "fs";
import _ from "lodash";
import { getFfmpegPath } from "../../../../server/services/shortsPreprocessService.js";
import { REUP_FONTS, reupFontScript, type ReupFontFace, type ReupFontWeight } from "../../constants/reupConfig.js";
import { REUP_ERROR } from "../../constants/reupServerText.js";
export const REUP_ABORTED = "REUP_ABORTED";
export const isReupAbort = (error: unknown): boolean => (error as Error)?.message === REUP_ABORTED;
/** Run ffmpeg; keeps the whole stderr when `keepLog` (metadata printing), otherwise only the tail for errors. */
export const reupFfmpeg = (args: string[], opts: { signal?: AbortSignal; keepLog?: boolean; cwd?: string; onSeconds?: (s: number) => void } = {}): Promise<string> =>
  new Promise((resolve, reject) => {
    if (opts.signal?.aborted) return reject(new Error(REUP_ABORTED));
    const child = spawn(getFfmpegPath(), ["-hide_banner", "-nostats", ...(opts.onSeconds ? ["-progress", "pipe:1"] : []), ...args], { windowsHide: true, cwd: opts.cwd });
    let log = "";
    const abort = () => {
      try {
        child.kill("SIGKILL");
      } catch {}
    };
    opts.signal?.addEventListener("abort", abort, { once: true });
    child.stdout.on("data", (chunk: Buffer) => {
      const match = _.last([...chunk.toString().matchAll(/out_time_us=(\d+)/g)]);
      if (match) opts.onSeconds?.(Number(match[1]) / 1e6);
    });
    child.stderr.on("data", (chunk: Buffer) => {
      log = opts.keepLog ? log + chunk.toString() : (log + chunk.toString()).slice(-6000);
    });
    child.on("error", (error) => {
      opts.signal?.removeEventListener("abort", abort);
      reject(error);
    });
    child.on("close", (code) => {
      opts.signal?.removeEventListener("abort", abort);
      if (opts.signal?.aborted) return reject(new Error(REUP_ABORTED));
      if (code === 0) resolve(log);
      else reject(new Error(_.trim(_.last(_.compact(log.split(/\r?\n/)))) || `ffmpeg ${code}`));
    });
  });
let filterList: Promise<string> | undefined;
/** Whether this ffmpeg build has a filter (blurdetect needs ffmpeg 5.1+). */
export const reupHasFilter = async (name: string): Promise<boolean> => {
  filterList ||= new Promise((resolve) => {
    const child = spawn(getFfmpegPath(), ["-hide_banner", "-filters"], { windowsHide: true });
    let out = "";
    child.stdout.on("data", (c: Buffer) => (out += c.toString()));
    child.on("error", () => resolve(""));
    child.on("close", () => resolve(out));
  });
  return new RegExp(`\\s${name}\\s`).test(await filterList);
};
/** Duration, picture size and audio of any media file (photo or video), from ffmpeg's own report. */
export const reupProbe = (file: string): Promise<{ duration: number; width: number; height: number; hasAudio: boolean }> =>
  new Promise((resolve) => {
    const child = spawn(getFfmpegPath(), ["-hide_banner", "-i", file], { windowsHide: true });
    let log = "";
    child.stderr.on("data", (c: Buffer) => (log += c.toString()));
    const done = () => {
      const d = /Duration:\s*(\d+):(\d+):([\d.]+)/.exec(log);
      const v = /Video:.*?(\d{2,5})x(\d{2,5})/.exec(log);
      resolve({ duration: d ? Number(d[1]) * 3600 + Number(d[2]) * 60 + Number(d[3]) : 0, width: v ? Number(v[1]) : 0, height: v ? Number(v[2]) : 0, hasAudio: /Stream #.*Audio:/.test(log) });
    };
    child.on("error", done);
    child.on("close", done);
  });
/** Escape a value for use inside a single-quoted filter option. */
export const reupFilterValue = (value: string): string => value.replace(/\\/g, "/").replace(/'/g, "'\\''").replace(/:/g, "\\:");
/** Font for on-screen text in this language (CJK scripts need their own): heavy for titles, bold for running text. */
export const reupFontFor = (lang = "en", weight: ReupFontWeight = "bold"): ReupFontFace | undefined => REUP_FONTS[reupFontScript(lang)][weight].find((f) => fs.existsSync(f.file)) || REUP_FONTS.latin[weight].find((f) => fs.existsSync(f.file));
export const reupFont = (lang?: string, weight: ReupFontWeight = "bold"): string | undefined => reupFontFor(lang, weight)?.file;
export const reupAssertVideo = (ok: boolean): void => {
  if (!ok) throw new Error(REUP_ERROR.NO_VIDEO);
};
