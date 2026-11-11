import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID, createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { chromium } from "playwright";
import express from "express";
import { findNativeChrome } from "../src/server/services/nativeProxyBrowser.ts";
import { MOTION_SCENE_COMPOSITION as C } from "../src/constants/motionSceneComposition.ts";
const resumeDir = process.env.QA_RESUME_DIR;
const out = path.resolve(resumeDir || `storage/output/motion-video/clip-demo/one-pass-production-20261106-${Date.now()}`);
await fs.mkdir(out, { recursive: true });
process.env.VIDIFY_STORAGE_DIR = path.join(out, "isolated-storage");
delete process.env.APP_DATA_DIR;
const { buildRemotionScenes } = await import("../src/features/motion/server/services/remotion/scenePipeline.ts");
const { runMotionAi, runInMotionAiSession } = await import("../src/features/motion/server/services/motionStoryService.ts");
const { renderRemotionVideo } = await import("../src/features/motion/server/services/motionRemotionRenderService.ts");
const { getChatPlanningRoom } = await import("../src/server/services/chatUiPlanningService.ts");
const file = path.resolve("storage/output/motion-video/productions/f82fe2c76c1ab22004a52e6147acdf2c.json"),
  bytes = await fs.readFile(file),
  hash = createHash("sha256").update(bytes).digest("hex"),
  production = JSON.parse(bytes.toString());
const original = production.result.compiled.spec,
  source = original.scenes[40],
  script = resumeDir ? JSON.parse(await fs.readFile(path.join(out, "partial.json"), "utf8")) : structuredClone(production.result.script);
script.voiceTrack = production.result.voice;
const signal = AbortSignal.timeout(12 * 60000),
  runId = process.env.QA_SCOPE || `one-pass-production-${randomUUID()}`,
  calls: any[] = resumeDir ? JSON.parse(await fs.readFile(path.join(out, "failure.json"), "utf8")).calls : [],
  logs: string[] = [],
  started = Date.now();
let latest: any;
await fs.writeFile(path.join(out, "run.json"), JSON.stringify({ runId, resume: !!resumeDir, at: new Date().toISOString() }, null, 2));
const heartbeat = setInterval(async () => {
  try {
    const page = getChatPlanningRoom({ provider: "gemini-chat", projectId: `motion-story-${runId}`, workerId: "motion-scene-first" } as any);
    if (page && !page.isClosed()) {
      await page.screenshot({ path: path.join(out, "live-room.png"), timeout: 10000 }).catch(() => {});
      console.log(JSON.stringify({ stage: "provider", url: page.url(), responses: await page.locator("model-response").count() }));
    }
  } catch {}
}, 45000);
try {
  const result = await runInMotionAiSession(
    runId,
    () =>
      buildRemotionScenes(script, production.result.analysis, {
        scope: runId,
        exec: { ...production.input.sceneAiExecution, chromeHeadless: false },
        mainExec: production.input.aiExecution,
        onlyScenes: resumeDir ? undefined : [source.id],
        onlyBeats: resumeDir ? [source.beatId] : undefined,
        review: true,
        sfx: false,
        renderBehavior: original.renderBehavior,
        signal,
        log: (line) => {
          if (line) {
            logs.push(line);
            console.log(line);
          }
        },
        partial: (value) => (latest = value),
        geometry: {
          check: async () => {
            throw new Error("Unexpected QA call");
          },
          measure: async () => {
            throw new Error("Unexpected rig measurement");
          },
        },
        still: async () => {
          throw new Error("Unexpected review screenshot");
        },
        ai: async (prompt, artifact, exec, requestSignal, log, images) => {
          assert.equal(artifact, C.ARTIFACT, "This real case must reuse its actual source plan; no motion, review or repair task");
          assert.equal(calls.length, 0, "Exactly one content-generation call for this scene");
          calls.push({ artifact, provider: exec.provider, model: exec.model, singleResponse: exec.singleResponse, strictProvider: exec.strictProvider });
          await fs.writeFile(path.join(out, "prompt.txt"), prompt);
          const raw = await runMotionAi(prompt, artifact, exec, requestSignal, log, images);
          await fs.writeFile(path.join(out, "raw-response.json"), JSON.stringify(raw, null, 2));
          return raw;
        },
      }),
    undefined,
    true,
    signal,
  );
  const aiSeconds = (Date.now() - started) / 1000;
  await fs.writeFile(path.join(out, "result.json"), JSON.stringify(result));
  const scene: any = Object.values(result.gen!.remotion!.scenes)
    .flat()
    .find((s: any) => s.id === source.id);
  assert.ok(scene?.composition);
  assert.equal(scene.composition.animationSource, "ai-complete");
  assert.equal(scene.composition.motion, undefined);
  assert.equal(scene.build.review, false);
  assert.equal(scene.generation.status, "accepted");
  assert.equal(calls.length, 1);
  const raw = JSON.parse(await fs.readFile(path.join(out, "raw-response.json"), "utf8"));
  assert.deepEqual(scene.composition.animations, raw.animations, "No AI track is discarded, added or rewritten");
  const state = result.gen!.remotion!,
    asset = state.assets[scene.composition.assetKey],
    offset = source.startFrame / original.fps,
    frames = source.endFrame - source.startFrame,
    duration = frames / original.fps;
  const spec = { ...original, duration, assets: { [asset.key]: asset }, scenes: [{ ...source, composition: scene.composition, startFrame: 0, endFrame: frames }], subtitles: original.subtitles.filter((s: any) => s.end > offset && s.start < offset + duration).map((s: any) => ({ ...s, start: Math.max(0, s.start - offset), end: Math.min(duration, s.end - offset) })) };
  await fs.writeFile(path.join(out, "candidate-spec.json"), JSON.stringify(spec));
  const silent = path.join(out, "silent.mp4"),
    output = path.join(out, "one-pass-scene-41.mp4"),
    renderStarted = Date.now();
  await renderRemotionVideo(spec, silent, {
    width: original.width,
    height: original.height,
    crf: 23,
    concurrency: 1,
    headless: false,
    signal,
    onProgress(frame, total) {
      if (frame % 30 === 0) console.log(JSON.stringify({ stage: "render", frame, total }));
    },
  });
  const ffmpeg = (args: string[]) => {
    const r = spawnSync("ffmpeg", ["-y", "-loglevel", "error", ...args], { encoding: "utf8" });
    assert.equal(r.status, 0, r.stderr);
  };
  ffmpeg(["-i", silent, "-ss", String(offset), "-i", path.resolve("storage/output/motion-video/battle-of-the-granicus-334-bc-the-deciding-momen-16x9-standard-1793914478395.mp4"), "-map", "0:v:0", "-map", "1:a:0", "-t", String(duration), "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-movflags", "+faststart", output]);
  ffmpeg(["-i", output, "-vf", "fps=1,scale=640:360,tile=3x2", "-frames:v", "1", path.join(out, "contact-sheet.png")]);
  const probe = spawnSync("ffprobe", ["-v", "error", "-show_streams", "-of", "json", output], { encoding: "utf8" });
  assert.equal(probe.status, 0, probe.stderr);
  const streams = JSON.parse(probe.stdout).streams,
    video = streams.find((s: any) => s.codec_type === "video");
  assert.equal(Number(video.nb_frames), frames);
  assert.equal(video.width, 1920);
  assert.equal(video.height, 1080);
  assert.equal(video.r_frame_rate, "30/1");
  assert.ok(streams.some((s: any) => s.codec_type === "audio"));
  const app = express();
  app.use(express.static(out));
  app.get("/", (_req, res) => res.send('<html><body style="margin:0;background:#111"><video src="/one-pass-scene-41.mp4" autoplay muted loop controls style="width:100%;height:100vh"></video></body></html>'));
  const server = app.listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => server.once("listening", resolve));
  const browser = await chromium.launch({ executablePath: findNativeChrome(), headless: false });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    await page.goto(`http://127.0.0.1:${(server.address() as any).port}/`);
    await page.waitForFunction(() => {
      const v = document.querySelector("video")!;
      return v.readyState >= 2 && v.currentTime > 0.5;
    });
    await page.screenshot({ path: path.join(out, "playing-chrome.png") });
  } finally {
    await browser.close();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
  assert.equal(
    createHash("sha256")
      .update(await fs.readFile(file))
      .digest("hex"),
    hash,
  );
  await fs.writeFile(
    path.join(out, "verification.json"),
    JSON.stringify(
      {
        at: new Date().toISOString(),
        calls,
        aiSeconds,
        recoveredOriginalResponse: !!resumeDir,
        renderSeconds: (Date.now() - renderStarted) / 1000,
        frames,
        tracks: raw.animations.length,
        visibleInstalledChrome: true,
        qaCalls: 0,
        repairCalls: 0,
        sourceProductionUnchanged: true,
        output,
        scope: "Actual production scene 41 through the new buildRemotionScenes path. One generation; no aesthetic or anatomical quality verdict.",
      },
      null,
      2,
    ),
  );
  console.log(JSON.stringify({ stage: "complete", out, output, tracks: raw.animations.length, aiSeconds }));
} catch (error) {
  await fs.writeFile(path.join(out, "failure.json"), JSON.stringify({ at: new Date().toISOString(), error: String(error), calls, logs }, null, 2));
  if (latest) await fs.writeFile(path.join(out, "partial.json"), JSON.stringify(latest));
  throw error;
} finally {
  clearInterval(heartbeat);
}
process.exit(0);
