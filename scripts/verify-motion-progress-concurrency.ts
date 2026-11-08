import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { build } from "esbuild";
import { chromium } from "playwright";
import { mergeMotionScriptProgress } from "../src/lib/motionProduction.js";
import { motionHtmlPlanSource } from "../src/lib/motionHtmlScene.js";
import { motionVoiceSignature } from "../src/lib/motionVoice.js";
import { remotionSceneProgress } from "../src/features/motion/lib/motionRemotionProgress.js";
import { seoScriptKey } from "../src/features/motion/server/services/motionSeoService.js";
const root = path.resolve(`scratch/motion-parallel-progress-${process.pid}`);
const previousStorage = process.env.VIDIFY_STORAGE_DIR;
const previousData = process.env.APP_DATA_DIR;
process.env.VIDIFY_STORAGE_DIR = root;
delete process.env.APP_DATA_DIR;
await fs.mkdir(root, { recursive: true });
const settings: any = { version: 1, mode: "remotion", engine: "remotion", profileId: "history", componentRevision: 1, pacing: "few" };
const analysis: any = {
  title: "Letters",
  visualSettings: settings,
  cast: [],
  places: [],
  chapters: [
    { id: "c1", title: "Arrival", targetSeconds: 2 },
    { id: "c2", title: "Departure", targetSeconds: 2 },
  ],
};
const beats = [
  { id: "b1", chapterId: "c1", narration: "A messenger arrives with a letter.", visual: "scene", sceneTemplateDraft: "The messenger arrives." },
  { id: "b2", chapterId: "c2", narration: "The messenger leaves the courtyard.", visual: "scene", sceneTemplateDraft: "The messenger leaves." },
];
const thumbnail = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aJC0AAAAASUVORK5CYII=";
const script = (count: number, planned = count): any => ({
  title: analysis.title,
  language: "en",
  visualSettings: settings,
  voiceSettings: { multiVoice: false },
  readyChapterIds: beats.slice(0, count).map((beat) => beat.chapterId),
  beats: structuredClone(beats.slice(0, count)),
  gen: {
    remotion: {
      version: 1,
      renderer: "html-canvas",
      settings,
      groupingRevision: 1001,
      pacingRevision: 1,
      updatedAt: 1,
      assets: {},
      failures: {},
      inputKeys: Object.fromEntries(beats.slice(0, planned).map((beat) => [beat.id, beat.id])),
      htmlSfx: false,
      htmlPlanSources: Object.fromEntries(beats.slice(0, planned).map((beat) => [beat.id, motionHtmlPlanSource([beat] as any, analysis, settings, undefined, false)])),
      scenes: Object.fromEntries(beats.slice(0, planned).map((beat) => [beat.id, [{ id: beat.id + ":html:0", beatId: beat.id, sourceBeatIds: [beat.id], renderer: "html-canvas", purpose: beat.narration, text: beat.narration, sceneTemplate: beat.sceneTemplateDraft, nodes: [] }]])),
    },
  },
});
const ready = (value: any) => {
  const result = structuredClone(value);
  result.gen.remotion.updatedAt = 2;
  for (const scenes of Object.values(result.gen.remotion.scenes) as any[][])
    for (const scene of scenes) {
      scene.html = { version: 1, html: "<html></html>", hash: scene.id, seed: scene.id, status: "ready", thumbnail, attempts: 1, duration: 2 };
      scene.htmlRequest = { id: scene.id, status: "received", attempt: 1 };
    }
  return result;
};
const pending = script(2);
let merged = ready(script(1));
for (let index = 0; index < 20; index++) {
  merged = mergeMotionScriptProgress(merged, structuredClone(pending));
  assert.equal(remotionSceneProgress(merged).ready, 1, "A stale writing snapshot must keep completed scene previews");
  assert.equal(merged.beats.length, 2);
}
for (const kind of ["plan", "rebuild", "attempt"]) {
  const next = script(2);
  const scene = next.gen.remotion.scenes.b1[0];
  if (kind === "plan") next.gen.remotion.inputKeys.b1 = "changed-plan";
  if (kind === "rebuild") scene.htmlRebuildKey = "explicit-redo";
  if (kind === "attempt") scene.htmlRequest = { id: "retry", attempt: 2, status: "running" };
  assert.equal(mergeMotionScriptProgress(merged, next).gen.remotion.scenes.b1[0].html, undefined, "Intentional invalidation must not resurrect an old image");
}
try {
  const { createMotionProductionService } = await import("../src/features/motion/server/services/motionProductionService.js");
  const jobs = new Map<string, any>();
  const events: string[] = [];
  let id = 0,
    writerPolls = 0;
  const start = (kind: string, result: any, ms = 0) => {
    const job: any = { id: `${kind}-${++id}`, kind, status: "rendering", progress: 0, log: [], startedAt: Date.now(), result: kind === "script" ? script(1) : undefined };
    jobs.set(job.id, job);
    events.push(`${kind}:start`);
    if (kind !== "script")
      setTimeout(() => {
        if (job.status === "cancelled") return;
        Object.assign(job, { result, status: "completed", progress: 1 });
        events.push(`${kind}:end`);
      }, ms);
    return { success: true, job: structuredClone(job) };
  };
  const service = createMotionProductionService(
    {
      checkMotionMediaTools: async () => {},
      checkMotionProductionVoice: async () => {},
      checkRemotionRuntime: async () => {},
      scriptMotionStoryInput: () => start("script", undefined),
      scenesMotionStoryInput: (body: any) => start(body.script.beats.length === 1 ? "early-scenes" : "scenes", ready(body.script), body.script.beats.length === 1 ? 0 : 40),
      voiceMotionStoryInput: (body: any) => start(body.voiceWarmup ? "early-voice" : "voice", { audioId: "fixture.wav", durations: body.script.beats.map(() => 2), totalSeconds: body.script.beats.length * 2, signature: motionVoiceSignature(body.script, body.analysis) }, body.voiceWarmup ? 0 : 30),
      seoMotionStoryInput: (body: any) => start("seo", { options: [{ id: "one" }], chapters: [], scriptKey: seoScriptKey(body.script) }),
      getStoryJob: (jobId: string) => {
        const job = jobs.get(jobId);
        if (job?.kind === "script" && job.status !== "completed") {
          writerPolls++;
          job.result = writerPolls < 7 ? script(1) : writerPolls < 15 ? script(2, 1) : script(2);
          if (writerPolls >= 15) {
            job.status = "completed";
            job.progress = 1;
            events.push("script:end");
          }
        }
        return job && structuredClone(job);
      },
      cancelStoryJob: (jobId: string) => {
        const job = jobs.get(jobId);
        if (job && job.status !== "completed") job.status = "cancelled";
        return true;
      },
      compileMotionStoryInput: async () => ({ spec: { duration: 4, fps: 30 }, missing: [], voiceStale: false }),
    } as any,
    path.join(root, "productions"),
    2,
  );
  service.startMotionProduction({ productionId: "parallel-progress", source: { title: analysis.title, text: "A messenger arrives and leaves.", segments: [{ t: 0, text: "A messenger arrives and leaves." }] }, analysis, visualSettings: settings, language: "en", multiVoice: false, sfx: false, asrCheck: false, autoExport: false });
  let final: any,
    priorReady = 0;
  for (let poll = 0; poll < 2000; poll++) {
    final = service.getMotionProduction("parallel-progress");
    const count = final.result?.script ? remotionSceneProgress(final.result.script).ready : 0;
    assert.ok(count >= priorReady, `Completed scenes regressed ${priorReady} -> ${count}`);
    priorReady = count;
    if (["completed", "error", "cancelled"].includes(final.status)) break;
    await delay(2);
  }
  assert.equal(final.status, "completed", final.error);
  assert.equal(priorReady, 2);
  assert.ok(events.indexOf("early-scenes:start") < events.indexOf("script:end"));
  assert.ok(events.indexOf("early-voice:start") < events.indexOf("script:end"));
  assert.ok(events.indexOf("seo:start") < events.indexOf("script:end"), "SEO must overlap final scene planning");
  assert.ok(events.indexOf("voice:start") < events.indexOf("scenes:end"));
  assert.ok(events.indexOf("scenes:start") < events.indexOf("voice:end"));
  assert.equal(events.filter((event) => event === "seo:start").length, 1);
  const record = JSON.parse(await fs.readFile(path.join(root, "productions", "parallel-progress.json"), "utf8"));
  assert.equal(record.job.result, undefined, "Progress snapshots must not duplicate the full HTML payload");
  assert.equal(record.result.script.beats.length, 2);
  await fs.writeFile(path.join(root, "events.json"), JSON.stringify(events, null, 2));
  const bundle = await build({
    stdin: {
      contents: `import React,{useState} from 'react';import{createRoot}from'react-dom/client';import{MotionRemotionScenes}from'./src/features/motion/components/MotionRemotionScenes.tsx';import{mergeMotionScriptProgress}from'./src/lib/motionProduction.ts';function App(){const[s,set]=useState(${JSON.stringify(pending)});window.updateProgress=v=>set(old=>mergeMotionScriptProgress(old,v));return <MotionRemotionScenes script={s} language="en" busy/>}createRoot(document.getElementById('root')).render(<App/>);`,
      resolveDir: process.cwd(),
      loader: "tsx",
    },
    bundle: true,
    platform: "browser",
    format: "iife",
    write: false,
    define: { "process.env.NODE_ENV": '"production"' },
  });
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.setContent('<div id="root"></div>');
    await page.addScriptTag({ content: bundle.outputFiles[0].text });
    await page.waitForFunction(() => typeof (window as any).updateProgress === "function");
    await page.evaluate((value) => (window as any).updateProgress(value), merged);
    await page.locator("img").waitFor();
    await page.evaluate(() => ((window as any).originalPreview = document.querySelector("img")));
    for (let index = 0; index < 12; index++) {
      await page.evaluate((value) => (window as any).updateProgress(value), pending);
      assert.equal(await page.locator("img").count(), 1);
      assert.equal(await page.evaluate(() => (window as any).originalPreview === document.querySelector("img")), true);
    }
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
  }
  process.stdout.write("Parallel progress passed: stable preview DOM, monotonic completed scenes, intentional invalidation, early scene/voice jobs, SEO during planning, concurrent final media and compact checkpoints.\n");
} finally {
  if (previousStorage === undefined) delete process.env.VIDIFY_STORAGE_DIR;
  else process.env.VIDIFY_STORAGE_DIR = previousStorage;
  if (previousData === undefined) delete process.env.APP_DATA_DIR;
  else process.env.APP_DATA_DIR = previousData;
}
