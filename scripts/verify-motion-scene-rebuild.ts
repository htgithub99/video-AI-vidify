import assert from "node:assert/strict";
import { build } from "esbuild";
import { chromium } from "playwright";
import { API_ROUTES as A } from "../src/constants/apiRoutes.js";
import { MOTION_VOICE_LIBRARY } from "../src/constants/motionVoice.js";
import { MOTION_DRAFT_VERIFICATION as D } from "./motionDraftVerificationTexts.js";
import { MOTION_VISUAL_DRAFT_FIXTURE as F } from "./motionVisualDraftVerificationFixture.js";
import { invalidateMotionVisualDraftOutput, captureMotionVisualDraft, motionVisualDraftKey } from "../src/features/motion/lib/motionVisualDraft.js";
import { normalizeMotionVisualSettings } from "../src/lib/motionVisual.js";
const entry = `import React from "react"; import { createRoot } from "react-dom/client"; import { useMotionStudio } from "./src/features/motion/hooks/useMotionStudio.ts"; function Fixture() { const studio = useMotionStudio(); globalThis.motionDraftStudio = studio; return <main><p data-testid="video">{studio.renderedVideoUrl || "none"}</p><p data-testid="preview">{studio.compiled?.spec.title || "none"}</p></main>; } createRoot(document.getElementById("root")).render(<Fixture />);`;
const bundle = await build({
  stdin: { contents: entry, loader: "tsx", resolveDir: process.cwd() },
  bundle: true,
  platform: "browser",
  format: "iife",
  write: false,
  plugins: [
    {
      name: D.FIXTURE,
      setup(builder) {
        builder.onLoad({ filter: D.PATTERNS.API_MODULE }, () => ({ contents: D.API_STUB }));
        builder.onLoad({ filter: D.PATTERNS.STORAGE_MODULE }, () => ({ contents: D.STORAGE_STUB }));
        builder.onLoad({ filter: D.PATTERNS.ACTIVITY_MODULE }, () => ({ contents: D.ACTIVITY_STUB }));
        builder.onResolve({ filter: D.PATTERNS.TOAST_MODULE }, () => ({ path: D.TOAST_MODULE, namespace: D.FIXTURE }));
        builder.onLoad({ filter: D.PATTERNS.ANY, namespace: D.FIXTURE }, () => ({ contents: D.TOAST_STUB }));
      },
    },
  ],
});
const alternate = normalizeMotionVisualSettings();
const draftState: any = { ...F.input, analysis: F.result.analysis, script: F.result.script, lastRenderJobId: "old", renderSignature: "old-key" };
const inactive = captureMotionVisualDraft(draftState);
draftState.visualDrafts = { [motionVisualDraftKey(alternate)]: inactive };
const invalidated = invalidateMotionVisualDraftOutput(draftState);
assert.equal(invalidated.visualDrafts[motionVisualDraftKey(alternate)], inactive);
assert.equal(invalidated.visualDrafts[motionVisualDraftKey(draftState.visualSettings)].gen, draftState.script.gen);
assert.equal(invalidated.visualDrafts[motionVisualDraftKey(draftState.visualSettings)].compiled, null);
assert.equal(invalidated.lastRenderJobId, null);
assert.equal(invalidated.renderSignature, undefined);
const browser = await chromium.launch({ channel: "chrome", headless: true });
const errors: string[] = [];
const mount = async (mode: string, autoExport: boolean, delayOldRender = false) => {
  const page = await browser.newPage();
  page.on("pageerror", (error) => errors.push(error.message));
  await page.setContent(D.HTML);
  await page.evaluate(
    ({ F, mode, autoExport, A, channels, alternate, delayOldRender }) => {
      const settings = mode === "remotion" ? F.input.visualSettings : alternate;
      const script: any = structuredClone({ ...F.result.script, visualSettings: settings });
      if (mode === "library") script.gen.puppet = { frames: {}, storyboard: {} };
      const fixture: any = {
        saved: { ...F.input, visualSettings: settings, script, analysis: { ...F.result.analysis, visualSettings: settings }, uploadedAudio: { id: "narration.wav", name: "narration", durationSeconds: 36 }, rawText: "Same story", autoExport, autoContinue: false, activeStoryJobId: "", lastRenderJobId: "old-output", editorialSessionId: "same-production" },
        requests: [],
        jobs: {},
        finishers: {},
        counter: 0,
        compileCounter: 0,
        delayedCompile: false,
        delayOldRender,
      };
      fixture.output = (id: string) => ({ ...F.result.rendered, id, videoUrl: "/" + id + ".mp4" });
      fixture.request = async (url: string, body: any) => {
        fixture.requests.push({ url, body });
        if (url === channels) return { channels: [] };
        if (url === A.MOTION_VIDEO_RESULTS) return { items: [fixture.output("old-output")] };
        if (url.startsWith(A.MOTION_STORY_LOGS)) return { lines: [], next: 0, total: 0 };
        if (url === A.MOTION_STORY_SCENES) {
          const job = { id: "scene-" + ++fixture.counter, kind: "scenes", status: "rendering", log: [] };
          fixture.jobs[job.id] = job;
          return { job };
        }
        if (url === A.MOTION_STORY_COMPILE) {
          fixture.compileCounter++;
          const value = { ...structuredClone(F.result.compiled), audioPreviewId: "mixed.wav", spec: { ...structuredClone(F.result.compiled.spec), title: body.script.gen.tag || "old-scenes", ...(mode === "library" ? { engine: undefined, shots: [] } : {}) } };
          if (fixture.delayedCompile) {
            fixture.delayedCompile = false;
            await new Promise<void>((resolve) => {
              fixture.releaseCompile = resolve;
            });
          }
          return value;
        }
        if (url === A.MOTION_VIDEO_RENDER) return { job: { id: "new-output", status: "rendering", log: [] } };
        if (url === A.MOTION_STORY_CANCEL) {
          fixture.finish("cancelled");
          return { success: true };
        }
        if (url === A.MOTION_VIDEO_CANCEL) return { success: true };
        throw new Error("Unexpected request " + url);
      };
      fixture.poll = async (url: string, update: any, done: any) => {
        if (url.startsWith(A.MOTION_VIDEO_STATUS)) {
          const id = url.slice(A.MOTION_VIDEO_STATUS.length);
          if (fixture.delayOldRender && id === "old-output")
            await new Promise<void>((resolve) => {
              fixture.releaseOldRender = resolve;
            });
          const job = { id, status: "completed", progress: 1, log: [], result: fixture.output(id) };
          update(job);
          return job;
        }
        const id = url.slice(A.MOTION_STORY_STATUS.length),
          job = fixture.jobs[id];
        update(job);
        if (done(job)) return job;
        return new Promise((resolve) => {
          fixture.finishers[id] = (next: any) => {
            update(next);
            resolve(next);
          };
        });
      };
      fixture.finish = (status = "completed", failed = false) => {
        const id = "scene-" + fixture.counter;
        const next = structuredClone(fixture.saved.script);
        next.gen.tag = "new-scenes";
        next.gen.failed = failed ? ["bad-scene"] : [];
        fixture.finishers[id]({ ...fixture.jobs[id], status, result: next, ...(status === "error" ? { error: "Scene service unavailable" } : {}) });
      };
      (window as any).motionDraftFixture = fixture;
    },
    { F, mode, autoExport, A, channels: MOTION_VOICE_LIBRARY.CHANNELS_URL, alternate, delayOldRender },
  );
  await page.addScriptTag({ content: bundle.outputFiles[0].text });
  if (delayOldRender) await page.waitForFunction(() => !!(window as any).motionDraftFixture.releaseOldRender);
  else await page.waitForFunction(() => !!(window as any).motionDraftStudio?.renderedVideoUrl);
  await page.evaluate(() => (window as any).motionDraftStudio.compile());
  return page;
};
const start = async (page: any, request: object = { restart: true }) => {
  await page.evaluate((request: object) => {
    (window as any).rebuildPromise = (window as any).motionDraftStudio.buildScenes(request);
  }, request);
  await page.waitForFunction(() => !!(window as any).motionDraftFixture.finishers["scene-1"]);
  assert.equal(await page.getByTestId("video").textContent(), "none");
  assert.equal(await page.getByTestId("preview").textContent(), "none");
  assert.equal(await page.evaluate(() => (window as any).motionDraftStudio.state.lastRenderJobId), null);
  assert.equal(await page.evaluate(() => (window as any).motionDraftStudio.results.length), 1);
  await page.evaluate(() => window.dispatchEvent(new Event("pagehide")));
  assert.equal(await page.evaluate(() => (window as any).motionDraftFixture.saved.lastRenderJobId), null, "Reload must not recover the invalidated output ID");
  assert.equal(await page.evaluate(() => Object.values((window as any).motionDraftFixture.saved.visualDrafts).some((draft: any) => draft.compiled || draft.renderJob)), false);
};
const finish = async (page: any, status = "completed", failed = false) => {
  await page.evaluate(({ status, failed }: any) => (window as any).motionDraftFixture.finish(status, failed), { status, failed });
  await page.evaluate(() => (window as any).rebuildPromise);
};
const count = (page: any, url: string) => page.evaluate((url: string) => (window as any).motionDraftFixture.requests.filter((request: any) => request.url === url).length, url);
try {
  for (const mode of ["remotion", "library"]) {
    const auto = await mount(mode, true);
    await start(auto);
    const body = await auto.evaluate((url: string) => (window as any).motionDraftFixture.requests.find((r: any) => r.url === url).body, A.MOTION_STORY_SCENES);
    assert.equal(body.restart, true);
    assert.equal(body.visualSettings.mode, mode);
    assert.equal(body.scenes, undefined);
    assert.equal(body.beats, undefined);
    assert.equal(body.locations, undefined);
    await auto.evaluate(() => (window as any).motionDraftStudio.buildScenes({ restart: true }));
    assert.equal(await count(auto, A.MOTION_STORY_SCENES), 1, "Duplicate clicks must not dispatch a second scene job");
    await finish(auto);
    await auto.waitForFunction(() => (window as any).motionDraftStudio.renderedVideoUrl === "/new-output.mp4");
    assert.equal(await count(auto, A.MOTION_STORY_SCENES), 1, "Auto export must not request scene generation again");
    assert.equal(await count(auto, A.MOTION_VIDEO_RENDER), 1);
    assert.equal(await auto.evaluate((url: string) => (window as any).motionDraftFixture.requests.find((r: any) => r.url === url).body.spec.title, A.MOTION_VIDEO_RENDER), "new-scenes");
    await auto.evaluate(() => (window as any).motionDraftStudio.patch({ quality: "draft" }));
    await auto.waitForFunction(() => (window as any).motionDraftStudio.renderedVideoStale);
    assert.equal(await auto.getByTestId("video").textContent(), "/new-output.mp4", "Settings edits retain the exported MP4 with a stale notice");
    await auto.close();
    const manual = await mount(mode, false);
    await start(manual, { scenes: ["selected-scene"] });
    await finish(manual);
    await manual.waitForFunction(() => (window as any).motionDraftStudio.compiled?.spec.title === "new-scenes");
    assert.equal(await count(manual, A.MOTION_VIDEO_RENDER), 0);
    assert.equal(await manual.getByTestId("video").textContent(), "none");
    const before = await manual.evaluate(() => (window as any).motionDraftFixture.compileCounter);
    await manual.evaluate(() => {
      (window as any).rebuildPromise = (window as any).motionDraftStudio.buildScenes({ restart: true });
    });
    await manual.waitForFunction(() => !!(window as any).motionDraftFixture.finishers["scene-2"]);
    await manual.evaluate(() => (window as any).motionDraftFixture.finish());
    await manual.waitForFunction((before: number) => (window as any).motionDraftFixture.compileCounter > before && !!(window as any).motionDraftStudio.compiled, before);
    assert.equal(await manual.getByTestId("video").textContent(), "none", "Unchanged scene data must not revive the old MP4");
    await manual.close();
    for (const outcome of ["failed-scenes", "error", "cancelled"]) {
      const page = await mount(mode, true);
      await start(page);
      if (outcome === "cancelled") await page.evaluate(() => (window as any).motionDraftStudio.cancelStory());
      else await finish(page, outcome === "error" ? "error" : "completed", outcome === "failed-scenes");
      await page.waitForFunction(() => !(window as any).motionDraftStudio.busy);
      assert.equal(await count(page, A.MOTION_VIDEO_RENDER), 0, outcome + " must not auto export");
      assert.equal(await page.getByTestId("video").textContent(), "none");
      await page.close();
    }
  }
  const late = await mount("remotion", true);
  await late.evaluate(() => {
    (window as any).motionDraftFixture.delayedCompile = true;
    (window as any).lateCompile = (window as any).motionDraftStudio.compile();
  });
  await late.waitForFunction(() => !!(window as any).motionDraftFixture.releaseCompile);
  await start(late);
  await late.evaluate(() => (window as any).motionDraftFixture.releaseCompile());
  assert.equal(await late.evaluate(() => (window as any).lateCompile), null, "Late compilation must not restore the previous preview");
  assert.equal(await late.getByTestId("preview").textContent(), "none");
  await finish(late);
  await late.close();
  const lateRender = await mount("remotion", true, true);
  await start(lateRender);
  await lateRender.evaluate(() => (window as any).motionDraftFixture.releaseOldRender());
  await lateRender.waitForTimeout(100);
  assert.equal(await lateRender.getByTestId("video").textContent(), "none", "Late completed rendering must not restore the old MP4");
  await finish(lateRender);
  await lateRender.close();
  const rendering = await mount("remotion", true);
  await rendering.evaluate(async () => {
    const studio = (window as any).motionDraftStudio;
    studio.patch({ activeRenderJobId: "running-export" });
    await studio.buildScenes({ restart: true });
  });
  assert.equal(await count(rendering, A.MOTION_STORY_SCENES), 0, "A running export must not be detached by scene regeneration");
  await rendering.close();
  assert.deepEqual(errors, []);
  console.log("Scene rebuild passed: both modes, full/selected requests, stale preview and MP4 invalidation, unchanged result recompilation, isolated drafts, one auto export without recursive scene requests, failures/cancellation, and late compile rejection. No live AI, TTS, or video generation.");
} finally {
  await browser.close();
}
