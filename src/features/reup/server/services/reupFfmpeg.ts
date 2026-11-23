import { spawn } from "child_process";
import fs from "fs";
import _ from "lodash";
import { getFfmpegPath } from "../../../../server/services/shortsPreprocessService.js";
import path from "path";
import { getStaticResourcePath } from "../../../../server/utils/paths.js";
import { REUP_FONTS, REUP_HIGHLIGHT, REUP_TYPE, reupFontScript, type ReupFontFace, type ReupFontWeight } from "../../constants/reupConfig.js";
import { REUP_ERROR } from "../../constants/reupServerText.js";
export const REUP_ABORTED = "REUP_ABORTED";
export const isReupAbort = (error: unknown): boolean => (error as Error)?.message === REUP_ABORTED;
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
export const reupFilterValue = (value: string): string => value.replace(/\\/g, "/").replace(/'/g, "'\\''").replace(/:/g, "\\:");
const bundled = (weight: ReupFontWeight): ReupFontFace | undefined => {
  const face = weight === "heavy" ? REUP_TYPE.HEAVY : undefined;
  const file = face && path.join(getStaticResourcePath(REUP_HIGHLIGHT.FONT_DIR), face.file);
  return file && fs.existsSync(file) ? { file, family: face.family } : undefined;
};
export const reupFontFor = (lang = "en", weight: ReupFontWeight = "bold"): ReupFontFace | undefined => (reupFontScript(lang) === "latin" ? bundled(weight) : undefined) || REUP_FONTS[reupFontScript(lang)][weight].find((f) => fs.existsSync(f.file)) || REUP_FONTS.latin[weight].find((f) => fs.existsSync(f.file));
export const reupFont = (lang?: string, weight: ReupFontWeight = "bold"): string | undefined => reupFontFor(lang, weight)?.file;
export const reupAssertVideo = (ok: boolean): void => {
  if (!ok) throw new Error(REUP_ERROR.NO_VIDEO);
};
