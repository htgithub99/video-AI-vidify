import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { motionHtmlPlanSource } from "../src/lib/motionHtmlScene.js";
import { motionVoiceSignature } from "../src/lib/motionVoice.js";
import { seoScriptKey } from "../src/features/motion/server/services/motionSeoService.js";
const root = path.resolve(`scratch/motion-scene-action-${process.pid}`);
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
try {
  const { createMotionProductionService } = await import("../src/features/motion/server/services/motionProductionService.js");
  const jobs = new Map<string, any>();
  const events: string[] = [];
  const sceneRequests: { scenes?: string[]; note?: string }[] = [];
  let id = 0;
  const start = (kind: string, result: any, ms = 0) => {
    const job: any = { id: `${kind}-${++id}`, kind, status: "rendering", progress: 0, log: [], startedAt: Date.now() };
    jobs.set(job.id, job);
    events.push(`${kind}:start`);
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
      scriptMotionStoryInput: () => start("script", script(2)),
      scenesMotionStoryInput: (body: any) => {
        sceneRequests.push({ scenes: body.scenes, note: body.note });
        // A scene run draws its scenes as a new attempt of each, as the real builder does.
        const drawn = ready(body.script);
        for (const scenes of Object.values(drawn.gen.remotion.scenes) as any[][])
          for (const scene of scenes) {
            const attempt = (Object.values(body.script.gen.remotion.scenes) as any[][]).flat().find((item) => item.id === scene.id)?.htmlRequest?.attempt || 1;
            scene.html.attempts = attempt;
            scene.htmlRequest = { id: `${scene.id}:${attempt}`, status: "received", attempt };
          }
        return start(body.scenes?.length ? "fix" : "scenes", drawn, 5);
      },
      // The voice runs long, so the scene actions arrive after the scene builder has finished.
      voiceMotionStoryInput: (body: any) => start(body.voiceWarmup ? "early-voice" : "voice", { audioId: "fixture.wav", durations: body.script.beats.map(() => 2), totalSeconds: body.script.beats.length * 2, signature: motionVoiceSignature(body.script, body.analysis) }, body.voiceWarmup ? 0 : 400),
      seoMotionStoryInput: (body: any) => start("seo", { options: [{ id: "one" }], chapters: [], scriptKey: seoScriptKey(body.script) }),
      getStoryJob: (jobId: string) => structuredClone(jobs.get(jobId)),
      cancelStoryJob: () => true,
      compileMotionStoryInput: async () => {
        events.push("compile");
        return { spec: { duration: 4, fps: 30 }, missing: [], voiceStale: false };
      },
    } as any,
    path.join(root, "productions"),
    2,
  );
  assert.deepEqual(service.actMotionProductionScenes("nothing-running", { kind: "redo", ids: ["b1:html:0"], reason: "x" }), { live: false }, "No running production: the page redraws the scene itself");
  service.startMotionProduction({ productionId: "scene-action", source: { title: analysis.title, text: "A messenger arrives and leaves.", segments: [{ t: 0, text: "A messenger arrives and leaves." }] }, analysis, script: script(2), visualSettings: settings, language: "en", multiVoice: false, sfx: false, asrCheck: false, autoExport: false });
  for (let poll = 0; poll < 2000 && !events.includes("scenes:end"); poll++) await delay(2);
  await delay(20);
  assert.ok(!events.includes("voice:end"), "The actions must arrive while the run is still going");
  const redo = service.actMotionProductionScenes("scene-action", { kind: "redo", ids: ["b1:html:0"], note: "warmer light", reason: "deleted" });
  const removal = service.actMotionProductionScenes("scene-action", { kind: "delete", ids: ["b2:html:0"], reason: "deleted" });
  assert.deepEqual([redo.live, redo.queued, removal.live, removal.queued], [true, false, true, false], "After the scene builder, an action starts its own scene run at once");
  let final: any;
  for (let poll = 0; poll < 3000; poll++) {
    final = service.getMotionProduction("scene-action");
    if (["completed", "error", "cancelled"].includes(final.status)) break;
    await delay(2);
  }
  assert.equal(final.status, "completed", final.error);
  const fixes = sceneRequests.filter((request) => request.scenes?.length);
  assert.deepEqual(fixes.map((request) => [request.scenes, request.note]), [[["b1:html:0"], "warmer light"], [["b2:html:0"], undefined]], "Each action draws its scene again, the redo with its note");
  assert.ok(events.indexOf("fix:start") < events.indexOf("voice:end"), "The redraw runs next to the voice, not after it: " + events.join(","));
  assert.ok(events.lastIndexOf("fix:end") < events.indexOf("compile"), "The video is put together only after the new scenes: " + events.join(","));
  const record = JSON.parse(await fs.readFile(path.join(root, "productions", "scene-action.json"), "utf8"));
  assert.ok(Object.values(record.result.script.gen.remotion.scenes).flat().every((scene: any) => scene.html?.status === "ready"), "The deleted scene is drawn again");
  assert.ok(!record.sceneActions?.length, "No action is left waiting");
  process.stdout.write("Production scene actions passed: idle runs answer not-live, actions after the scene builder start at once next to the voice, the deleted scene is drawn again, the video is compiled after them.\n");
} finally {
  if (previousStorage === undefined) delete process.env.VIDIFY_STORAGE_DIR;
  else process.env.VIDIFY_STORAGE_DIR = previousStorage;
  if (previousData === undefined) delete process.env.APP_DATA_DIR;
  else process.env.APP_DATA_DIR = previousData;
  await fs.rm(root, { recursive: true, force: true });
}
