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
import { generateMotionHtmlScene } from "./scenePipeline.js";
import type { MotionRemotionSpec, MotionRemotionTimedScene } from "../../../../../types/motionVisual.js";

export const refreshMotionHtmlArtifacts = (spec: MotionRemotionSpec): void => {
  const root = path.resolve(getMotionRootDirectory(), "html-scenes") + path.sep;
  for (const scene of spec.scenes) {
    const manifest = scene.html?.manifest;
    if (!manifest || !path.resolve(manifest).startsWith(root) || !fs.existsSync(manifest)) continue;
    const saved = JSON.parse(fs.readFileSync(manifest, "utf8")) as MotionRemotionTimedScene;
    if (saved.html && saved.html.seed === scene.html?.seed && saved.html.status === "ready" && saved.html.attempts >= scene.html.attempts) { scene.html = saved.html; scene.htmlRequest = saved.htmlRequest; }
  }
};
export interface HtmlRenderOptions {
  width: number; height: number; crf: number; signal: AbortSignal;
  onProgress: (frames: number, total: number) => void;
  onSegment?: (index: number) => Promise<void> | void;
  log?: (message: string) => void;
  recoverScene?: typeof generateMotionHtmlScene;
}
export const renderMotionHtmlSegments = async (spec: MotionRemotionSpec, segments: { start: number; end: number; output: string }[], opts: HtmlRenderOptions): Promise<void> => {
  let completed = 0;
  const total = segments.reduce((sum, item) => sum + item.end - item.start + 1, 0);
  for (const [index, segment] of segments.entries()) {
    let active: MotionRemotionTimedScene | undefined;
    for (;;) {
      opts.signal.throwIfAborted();
      let runtime: Awaited<ReturnType<typeof openMotionHtmlRuntime>> | undefined;
      let current = "";
      fs.mkdirSync(path.dirname(segment.output), { recursive: true });
      const ff = spawn(getFfmpegPath(), ["-hide_banner", "-loglevel", "error", "-y", "-f", "image2pipe", "-vcodec", "png", "-framerate", String(spec.fps), "-i", "pipe:0", "-an", "-c:v", "libx264", "-crf", String(opts.crf), "-pix_fmt", "yuv420p", "-threads", "2", "-f", "mp4", segment.output], { windowsHide: true, stdio: ["pipe", "ignore", "pipe"] });
      let stderr = "";
      ff.stderr.on("data", (chunk) => { stderr = (stderr + chunk).slice(-4000); });
      const exit = new Promise<void>((resolve, reject) => { ff.once("error", reject); ff.once("close", (code) => code === 0 ? resolve() : reject(new Error(`FFmpeg: ${stderr || code}`))); });
      void exit.catch(() => undefined);
      ff.stdin.on("error", () => undefined);
      const stop = () => { ff.kill(); void runtime?.close(); };
      opts.signal.addEventListener("abort", stop, { once: true });
      try {
        fs.mkdirSync(path.dirname(segment.output), { recursive: true });
        for (let frame = segment.start; frame <= segment.end; frame++) {
          opts.signal.throwIfAborted();
          active = spec.scenes.find((scene) => frame >= scene.startFrame && frame < scene.endFrame);
          if (!active?.html) throw new Error("Thiếu tài liệu HTML của cảnh cần xuất.");
          if (current !== active.html.hash) { await runtime?.close(); runtime = await openMotionHtmlRuntime(active.html.html, opts.signal); current = active.html.hash; }
          const subtitle = spec.subtitles.find((item) => frame / spec.fps >= item.start && frame / spec.fps < item.end);
          const image = await runtime!.render(motionHtmlFrame(spec, active, frame, opts.width, opts.height, "export"), subtitle?.text, spec.fontFamily);
          if (!ff.stdin.write(image)) await Promise.race([once(ff.stdin, "drain"), exit.then(() => { throw new Error("FFmpeg đóng input trước khi nhận đủ frame."); })]);
          opts.onProgress(completed + frame - segment.start + 1, total);
        }
        ff.stdin.end(); await exit;
        completed += segment.end - segment.start + 1;
        await opts.onSegment?.(index);
        break;
      } catch (error) {
        ff.kill(); await exit.catch(() => undefined);
        await runtime?.close(); runtime = undefined;
        opts.signal.throwIfAborted();
        if ((error as any).motionHtmlExecution && active?.html?.execution) {
          const artifact = active.html;
          active.html.status = "retry_wait";
          active.htmlRequest = { id: randomUUID(), attempt: artifact.attempts, status: "retry_wait", error: String((error as Error).message) };
          opts.log?.(`Cảnh ${active.id} lỗi khi xuất; tạo lại trọn cảnh từ prompt đã lưu.`);
          await (opts.recoverScene || generateMotionHtmlScene)(active, { width: spec.width, height: spec.height, seconds: artifact.duration, profile: spec.profileId, scope: artifact.scope, language: artifact.language }, { exec: artifact.execution, signal: opts.signal, log: opts.log || (() => undefined) });
        } else if (/Thiếu tài liệu HTML/.test(String((error as Error).message))) throw error;
        else { opts.log?.(`Xuất Canvas: chạy lại cùng HTML (${String((error as Error).message)}).`); await delay(2000, undefined, { signal: opts.signal }); }
      } finally { opts.signal.removeEventListener("abort", stop); await runtime?.close(); }
    }
  }
};

/** Transitional projects can keep legacy scenes while new scenes use the Canvas renderer. */
export const renderMotionMixedSegments = async (spec: MotionRemotionSpec, segments: { start: number; end: number; output: string }[], opts: HtmlRenderOptions, legacy: (spec: MotionRemotionSpec, segments: { start: number; end: number; output: string }[], opts: HtmlRenderOptions) => Promise<void>) => {
  let done = 0;
  const total = segments.reduce((sum, item) => sum + item.end - item.start + 1, 0);
  for (const [index, segment] of segments.entries()) {
    const pieces: string[] = [];
    const list = segment.output + ".concat.txt";
    try {
      for (const scene of spec.scenes.filter((item) => item.startFrame <= segment.end && item.endFrame > segment.start)) {
        const start = Math.max(segment.start, scene.startFrame), end = Math.min(segment.end, scene.endFrame - 1);
        const output = segment.output + `.piece-${pieces.length}.mp4`;
        pieces.push(output);
        const options = { ...opts, onSegment: undefined, onProgress: (frames: number) => opts.onProgress(done + frames, total) };
        if (scene.html) await renderMotionHtmlSegments(spec, [{ start, end, output }], options);
        else {
          const length = scene.endFrame - scene.startFrame;
          const subtitles = spec.subtitles.filter((item) => item.end > scene.startFrame / spec.fps && item.start < scene.endFrame / spec.fps)
            .map((item) => ({ ...item, start: item.start - scene.startFrame / spec.fps, end: item.end - scene.startFrame / spec.fps }));
          const local: MotionRemotionSpec = { ...spec, renderer: undefined, scenes: [{ ...scene, startFrame: 0, endFrame: length }], duration: length / spec.fps, subtitles };
          await legacy(local, [{ start: start - scene.startFrame, end: end - scene.startFrame, output }], options);
        }
        done += end - start + 1;
      }
      fs.writeFileSync(list, pieces.map((file) => `file '${file.replace(/\\/g, "/").replace(/'/g, "'\\''")}'`).join("\n"));
      await promisify(execFile)(getFfmpegPath(), ["-hide_banner", "-loglevel", "error", "-y", "-f", "concat", "-safe", "0", "-i", list, "-c", "copy", "-f", "mp4", segment.output], { windowsHide: true, signal: opts.signal });
      await opts.onSegment?.(index);
    } finally { for (const file of [...pieces, list]) { if (fs.existsSync(file)) fs.unlinkSync(file); } }
  }
};
