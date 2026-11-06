import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import express from "express";
import { chromium } from "playwright";
import { openBrowser, selectComposition, renderMedia, makeCancelSignal } from "@remotion/renderer";
import { motionRemotionBundle } from "../src/features/motion/server/services/motionRemotionRenderService.ts";
import { findNativeChrome } from "../src/server/services/nativeProxyBrowser.ts";
const dir = path.resolve("storage/output/motion-video/clip-demo/detailed-actions-structured-20261106");
const specFile = path.join(dir, "candidate-spec.json"), bytes = await fs.readFile(specFile), hash = createHash("sha256").update(bytes).digest("hex"), spec = JSON.parse(bytes.toString());
const outputDir = path.resolve("storage/output/motion-video/clip-demo/settings-fixes-20261106"); await fs.mkdir(outputDir, { recursive: true });
const output = path.join(outputDir, "scene-reexport.mp4"), silent = path.join(outputDir, "scene-reexport-silent.mp4");
const production = JSON.parse(await fs.readFile("storage/output/motion-video/productions/f82fe2c76c1ab22004a52e6147acdf2c.json", "utf8")), source = production.result.compiled.spec.scenes[40];
const raw = JSON.parse(await fs.readFile(path.join(dir, "response-3.json"), "utf8"));
assert.deepEqual(spec.scenes[0].composition.animations, raw.animations);
const executable = findNativeChrome(), serveUrl = await motionRemotionBundle(), inputProps = { document: spec };
const browser = await openBrowser("chrome", { browserExecutable: executable, chromiumOptions: { headless: false, gl: "angle" }, logLevel: "error" });
const { cancel, cancelSignal } = makeCancelSignal(), deadline = setTimeout(cancel, 15 * 60000), started = Date.now();
let lastFrame = -1;
const heartbeat = setInterval(() => console.log(JSON.stringify({ stage: "render", frame: lastFrame, total: Math.ceil(spec.duration * spec.fps), seconds: (Date.now() - started) / 1000 })), 30000);
try {
  const selected = await selectComposition({ serveUrl, id: "MotionStory", inputProps, puppeteerInstance: browser, timeoutInMilliseconds: 120000, logLevel: "error" });
  await renderMedia({ serveUrl, composition: { ...selected, width: 1920, height: 1080 }, inputProps, outputLocation: silent, codec: "h264", muted: true, crf: 23, pixelFormat: "yuv420p", concurrency: 1, puppeteerInstance: browser, cancelSignal, timeoutInMilliseconds: 120000, logLevel: "error", onProgress: ({ renderedFrames }) => { if (renderedFrames >= lastFrame + 30) console.log(JSON.stringify({ stage: "frames", renderedFrames })); lastFrame = renderedFrames; } });
} finally { clearTimeout(deadline); clearInterval(heartbeat); await browser.close({ silent: true }); }
const ffmpeg = (args: string[]) => { const r = spawnSync("ffmpeg", ["-y", "-loglevel", "error", ...args], { encoding: "utf8" }); assert.equal(r.status, 0, r.stderr); };
// Use only the original scene's audio; pad the saved one-beat spec's remaining hold with silence.
ffmpeg(["-i", silent, "-ss", String(source.startFrame / 30), "-t", String((source.endFrame - source.startFrame) / 30), "-i", path.resolve("storage/output/motion-video", production.result.rendered.fileName), "-map", "0:v:0", "-map", "1:a:0", "-af", "apad", "-t", String(spec.duration), "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-movflags", "+faststart", output]);
const probe = spawnSync("ffprobe", ["-v", "error", "-show_streams", "-of", "json", output], { encoding: "utf8" }); assert.equal(probe.status, 0, probe.stderr);
const streams = JSON.parse(probe.stdout).streams, video = streams.find((s: any) => s.codec_type === "video");
assert.equal(video.width, 1920); assert.equal(video.height, 1080); assert.equal(video.r_frame_rate, "30/1"); assert.equal(Number(video.nb_frames), Math.ceil(spec.duration * spec.fps)); assert.ok(streams.some((s: any) => s.codec_type === "audio"));
ffmpeg(["-i", output, "-vf", "fps=1,scale=640:360,tile=3x3", "-frames:v", "1", path.join(outputDir, "reexport-contact-sheet.png")]);
const app = express(); app.use(express.static(outputDir)); app.get("/", (_req, res) => res.send('<html><body style="margin:0;background:#111"><video src="/scene-reexport.mp4" autoplay muted loop controls style="width:100%;height:100vh"></video></body></html>'));
const server = app.listen(0, "127.0.0.1"); await new Promise<void>((resolve) => server.once("listening", resolve));
const playback = await chromium.launch({ executablePath: executable, headless: false });
try { const page = await playback.newPage({ viewport: { width: 1280, height: 720 } }); await page.goto(`http://127.0.0.1:${(server.address() as any).port}/`); await page.waitForFunction(() => { const v = document.querySelector("video")!; return v.readyState >= 2 && v.currentTime > 0.5; }); await page.screenshot({ path: path.join(outputDir, "reexport-playing-chrome.png") }); }
finally { await playback.close(); await new Promise<void>((resolve) => server.close(() => resolve())); }
assert.equal(createHash("sha256").update(await fs.readFile(specFile)).digest("hex"), hash);
await fs.writeFile(path.join(outputDir, "reexport-verification.json"), JSON.stringify({ at: new Date().toISOString(), output, width: video.width, height: video.height, fps: video.r_frame_rate, frames: video.nb_frames, seconds: spec.duration, aiCalls: 0, specUnchanged: true, animationsUnchanged: true, crf: 23, visibleInstalledChrome: true, frameWaitTimeoutMs: 120000, renderAndVerifySeconds: (Date.now() - started) / 1000 }, null, 2));
console.log(JSON.stringify({ stage: "complete", output }));
process.exit(0);
