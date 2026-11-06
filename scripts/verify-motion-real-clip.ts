import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import express from "express";
import { chromium } from "playwright";
import { findNativeChrome } from "../src/server/services/nativeProxyBrowser.ts";
const out = path.resolve("scratch/motion-real-recovery-20261105");
process.env.VIDIFY_STORAGE_DIR = path.join(out, "clip-storage");
delete process.env.APP_DATA_DIR;
const { renderRemotionVideo } = await import("../src/features/motion/server/services/motionRemotionRenderService.ts");
const { remotionSceneReadiness } = await import("../src/lib/motionRemotion.ts");
const replay = JSON.parse(await fs.readFile(path.join(out, "drawing-order-results.json"), "utf8"));
const state = replay.result.gen.remotion;
const scene: any = Object.values(state.scenes).flat().find((item: any) => item.id === replay.acceptedReplay.targetIds[0]);
const preview = remotionSceneReadiness(scene, state).preview;
assert.ok(preview);
const spec = { ...preview, duration: 3, scenes: preview.scenes.map((item: any) => ({ ...item, endFrame: 3 * preview.fps })) };
const file = path.join(out, "actual-scene-motion.mp4");
await renderRemotionVideo(spec, file, { width: preview.width, height: preview.height, crf: 18, concurrency: 1, signal: AbortSignal.timeout(180000), onProgress() {} });
const app = express();
app.use(express.static(out));
app.get("/", (_req, res) => res.send('<html><body style="margin:0;background:#111"><video src="/actual-scene-motion.mp4" autoplay muted loop controls style="width:100%;height:100vh"></video></body></html>'));
const server = app.listen(0, "127.0.0.1");
await new Promise<void>((resolve) => server.once("listening", resolve));
const browser = await chromium.launch({ executablePath: findNativeChrome(), headless: false });
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.goto(`http://127.0.0.1:${(server.address() as any).port}/`);
  await page.waitForFunction(() => { const video = document.querySelector("video")!; return video.readyState >= 2 && video.currentTime > 0.5; });
  const video = await page.locator("video").evaluate((element) => ({ width: element.videoWidth, height: element.videoHeight, duration: element.duration, currentTime: element.currentTime, error: element.error?.message }));
  assert.ok(video.currentTime > 0 && !video.error);
  assert.equal(video.width, preview.width);
  await page.screenshot({ path: path.join(out, "actual-clip-playing-chrome.png") });
  await fs.writeFile(path.join(out, "actual-clip-results.json"), JSON.stringify({ at: new Date().toISOString(), sourceScene: scene.id, nativeChrome: findNativeChrome(), chromeVersion: browser.version(), bytes: (await fs.stat(file)).size, video, scope: "3-second clip from one actual scene and its own actual motion response; not the complete 36-scene project" }, null, 2));
  process.stdout.write(String(JSON.stringify({ actualClipRenderedAndPlaying: true, sourceScene: scene.id, video })) + "\n");
} finally {
  await browser.close();
  await new Promise<void>((resolve) => server.close(() => resolve()));
}
