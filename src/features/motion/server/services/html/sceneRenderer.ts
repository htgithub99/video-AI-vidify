import * as RT_MAINTENANCE from "../../../../../constants/runtime/maintenance.js";
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { once } from "node:events";
import { randomUUID } from "node:crypto";
import { setTimeout as delay } from "node:timers/promises";
import { getFfmpegPath } from "../../../../../server/services/shortsPreprocessService.js";
import { getMotionRootDirectory } from "../motionLibraryService.js";
import { motionHtmlFrame } from "../../../../../lib/motionHtmlScene.js";
import { openMotionHtmlRuntime } from "./sceneRuntime.js";
import { chromium, type Browser } from "playwright";
import { findNativeChrome } from "../../../../../server/services/nativeProxyBrowser.js";
import { generateMotionHtmlScene } from "./scenePipeline.js";
import type { MotionRemotionSpec, MotionRemotionTimedScene } from "../../../../../types/motionVisual.js";
export const refreshMotionHtmlArtifacts = (spec: MotionRemotionSpec): void => {
  const root = path.resolve(getMotionRootDirectory(), RT_MAINTENANCE.HTML_SCENES) + path.sep;
  for (const scene of spec.scenes) {
    const manifest = scene.html?.manifest;
    if (!manifest || !path.resolve(manifest).startsWith(root) || !fs.existsSync(manifest)) continue;
    const saved = JSON.parse(fs.readFileSync(manifest, RT_MAINTENANCE.UTF8)) as MotionRemotionTimedScene;
    if (saved.html && saved.html.seed === scene.html?.seed && saved.html.status === RT_MAINTENANCE.READY && saved.html.attempts >= scene.html.attempts) {
      scene.html = saved.html;
      scene.htmlRequest = saved.htmlRequest;
    }
  }
};
export interface HtmlRenderOptions {
  width: number;
  height: number;
  crf: number;
  signal: AbortSignal;
  onProgress: (frames: number, total: number) => void;
  onSegment?: (index: number) => Promise<void> | void;
  log?: (message: string) => void;
  recoverScene?: typeof generateMotionHtmlScene;
}
export const renderMotionHtmlSegments = async (spec: MotionRemotionSpec, segments: { start: number; end: number; output: string }[], opts: HtmlRenderOptions): Promise<void> => {
  let completed = 0;
  const total = segments.reduce((sum, item) => sum + item.end - item.start + 1, 0);
  let shared: Browser | undefined;
  const laneBrowser = async () => {
    if (!shared?.isConnected()) shared = await chromium.launch({ executablePath: findNativeChrome(), headless: true });
    return shared;
  };
  const closeShared = () => void shared?.close().catch(() => undefined);
  opts.signal.addEventListener(RT_MAINTENANCE.ABORT, closeShared, { once: true });
  try {
  for (const [index, segment] of segments.entries()) {
    let active: MotionRemotionTimedScene | undefined;
    for (;;) {
      opts.signal.throwIfAborted();
      let runtime: Awaited<ReturnType<typeof openMotionHtmlRuntime>> | undefined;
      let current = "";
      fs.mkdirSync(path.dirname(segment.output), { recursive: true });
      const ff = spawn(
        getFfmpegPath(),
        [
          RT_MAINTENANCE.HIDE_BANNER,
          RT_MAINTENANCE.LOGLEVEL,
          RT_MAINTENANCE.ERROR,
          RT_MAINTENANCE.Y_3,
          RT_MAINTENANCE.F,
          RT_MAINTENANCE.IMAGE2PIPE,
          RT_MAINTENANCE.VCODEC,
          RT_MAINTENANCE.PNG_2,
          RT_MAINTENANCE.FRAMERATE,
          String(spec.fps),
          RT_MAINTENANCE.I_2,
          RT_MAINTENANCE.PIPE_0,
          RT_MAINTENANCE.AN,
          RT_MAINTENANCE.C_V,
          RT_MAINTENANCE.LIBX264,
          RT_MAINTENANCE.PRESET,
          RT_MAINTENANCE.X264_EXPORT_PRESET,
          RT_MAINTENANCE.CRF,
          String(opts.crf),
          RT_MAINTENANCE.PIX_FMT,
          RT_MAINTENANCE.YUV420P,
          RT_MAINTENANCE.THREADS,
          RT_MAINTENANCE.VALUE_2_2,
          RT_MAINTENANCE.F,
          RT_MAINTENANCE.MP4,
          segment.output,
        ],
        { windowsHide: true, stdio: [RT_MAINTENANCE.STDIO_PIPE, RT_MAINTENANCE.IGNORE, RT_MAINTENANCE.STDIO_PIPE] },
      );
      let stderr = "";
      ff.stderr.on(RT_MAINTENANCE.DATA, (chunk) => {
        stderr = (stderr + chunk).slice(-4000);
      });
      const exit = new Promise<void>((resolve, reject) => {
        ff.once(RT_MAINTENANCE.ERROR, reject);
        ff.once(RT_MAINTENANCE.CLOSE, (code) => (code === 0 ? resolve() : reject(new Error(`${RT_MAINTENANCE.FFMPEG}${stderr || code}`))));
      });
      void exit.catch(() => undefined);
      ff.stdin.on(RT_MAINTENANCE.ERROR, () => undefined);
      const stop = () => {
        ff.kill();
        void runtime?.close();
      };
      opts.signal.addEventListener(RT_MAINTENANCE.ABORT, stop, { once: true });
      try {
        fs.mkdirSync(path.dirname(segment.output), { recursive: true });
        for (let frame = segment.start; frame <= segment.end; frame++) {
          opts.signal.throwIfAborted();
          active = spec.scenes.find((scene) => frame >= scene.startFrame && frame < scene.endFrame);
          if (!active?.html) throw new Error(RT_MAINTENANCE.THIEU_TAI_LIEU_HTML_CUA_CANH_CAN_XUAT);
          if (current !== active.html.hash) {
            await runtime?.close();
            runtime = await openMotionHtmlRuntime(active.html.html, opts.signal, true, await laneBrowser());
            current = active.html.hash;
          }
          const subtitle = spec.subtitles.find((item) => frame / spec.fps >= item.start && frame / spec.fps < item.end);
          const image = await runtime!.render(motionHtmlFrame(spec, active, frame, opts.width, opts.height, RT_MAINTENANCE.EXPORT), subtitle?.text, spec.fontFamily);
          if (!ff.stdin.write(image))
            await Promise.race([
              once(ff.stdin, RT_MAINTENANCE.DRAIN),
              exit.then(() => {
                throw new Error(RT_MAINTENANCE.FFMPEG_DONG_INPUT_TRUOC_KHI_NHAN_DU_FRAME);
              }),
            ]);
          opts.onProgress(completed + frame - segment.start + 1, total);
        }
        ff.stdin.end();
        await exit;
        completed += segment.end - segment.start + 1;
        await opts.onSegment?.(index);
        break;
      } catch (error) {
        ff.kill();
        await exit.catch(() => undefined);
        await runtime?.close();
        runtime = undefined;
        opts.signal.throwIfAborted();
        if ((error as any).motionHtmlExecution && active?.html?.execution) {
          const artifact = active.html;
          active.html.status = RT_MAINTENANCE.RETRY_WAIT;
          active.htmlRequest = { id: randomUUID(), attempt: artifact.attempts, status: RT_MAINTENANCE.RETRY_WAIT, error: String((error as Error).message) };
          opts.log?.(`${RT_MAINTENANCE.CANH_2}${active.id}${RT_MAINTENANCE.LOI_KHI_XUAT_TAO_LAI_TRON_CANH_TU_PROMPT_DA}`);
          await (opts.recoverScene || generateMotionHtmlScene)(active, { width: spec.width, height: spec.height, seconds: artifact.duration, profile: spec.profileId, scope: artifact.scope, language: artifact.language, figureKit: artifact.figureKit === true, cast: artifact.cast, continuity: artifact.continuity }, { exec: artifact.execution && { ...artifact.execution, renderRecovery: true }, signal: opts.signal, log: opts.log || (() => undefined) });
        } else if (/Thiếu tài liệu HTML/.test(String((error as Error).message))) throw error;
        else {
          opts.log?.(`${RT_MAINTENANCE.XUAT_CANVAS_CHAY_LAI_CUNG_HTML}${String((error as Error).message)}${RT_MAINTENANCE.SENTENCE_END}`);
          await delay(2000, undefined, { signal: opts.signal });
        }
      } finally {
        opts.signal.removeEventListener(RT_MAINTENANCE.ABORT, stop);
        await runtime?.close();
      }
    }
  }
  } finally {
    opts.signal.removeEventListener(RT_MAINTENANCE.ABORT, closeShared);
    closeShared();
  }
};
export const renderMotionMixedSegments = async (spec: MotionRemotionSpec, segments: { start: number; end: number; output: string }[], opts: HtmlRenderOptions, legacy: (spec: MotionRemotionSpec, segments: { start: number; end: number; output: string }[], opts: HtmlRenderOptions) => Promise<void>) => {
  let done = 0;
  const total = segments.reduce((sum, item) => sum + item.end - item.start + 1, 0);
  for (const [index, segment] of segments.entries()) {
    const pieces: string[] = [];
    const list = segment.output + RT_MAINTENANCE.CONCAT_TXT;
    try {
      for (const scene of spec.scenes.filter((item) => item.startFrame <= segment.end && item.endFrame > segment.start)) {
        const start = Math.max(segment.start, scene.startFrame),
          end = Math.min(segment.end, scene.endFrame - 1);
        const output = segment.output + `${RT_MAINTENANCE.PIECE}${pieces.length}${RT_MAINTENANCE.MP4_2}`;
        pieces.push(output);
        const options = { ...opts, onSegment: undefined, onProgress: (frames: number) => opts.onProgress(done + frames, total) };
        if (scene.html) await renderMotionHtmlSegments(spec, [{ start, end, output }], options);
        else {
          const length = scene.endFrame - scene.startFrame;
          const subtitles = spec.subtitles.filter((item) => item.end > scene.startFrame / spec.fps && item.start < scene.endFrame / spec.fps).map((item) => ({ ...item, start: item.start - scene.startFrame / spec.fps, end: item.end - scene.startFrame / spec.fps }));
          const local: MotionRemotionSpec = { ...spec, renderer: undefined, scenes: [{ ...scene, startFrame: 0, endFrame: length }], duration: length / spec.fps, subtitles };
          await legacy(local, [{ start: start - scene.startFrame, end: end - scene.startFrame, output }], options);
        }
        done += end - start + 1;
      }
      fs.writeFileSync(list, pieces.map((file) => `${RT_MAINTENANCE.FILE}${file.replace(/\\/g, RT_MAINTENANCE.SLASH).replace(/'/g, RT_MAINTENANCE.SHELL_SINGLE_QUOTE_ESCAPE)}${RT_MAINTENANCE.SINGLE_QUOTE}`).join(RT_MAINTENANCE.NEWLINE));
      await promisify(execFile)(getFfmpegPath(), [RT_MAINTENANCE.HIDE_BANNER, RT_MAINTENANCE.LOGLEVEL, RT_MAINTENANCE.ERROR, RT_MAINTENANCE.Y_3, RT_MAINTENANCE.F, RT_MAINTENANCE.CONCAT, RT_MAINTENANCE.SAFE, RT_MAINTENANCE.VALUE_0_2, RT_MAINTENANCE.I_2, list, RT_MAINTENANCE.C, RT_MAINTENANCE.COPY, RT_MAINTENANCE.F, RT_MAINTENANCE.MP4, segment.output], { windowsHide: true, signal: opts.signal });
      await opts.onSegment?.(index);
    } finally {
      for (const file of [...pieces, list]) {
        if (fs.existsSync(file)) fs.unlinkSync(file);
      }
    }
  }
};
