import assert from "node:assert/strict";
import { build } from "esbuild";
import { chromium, type Page } from "playwright";
import { MOTION_CANCELLATION_VERIFICATION as C } from "./motionCancellationVerificationTexts.ts";
import { API_ROUTES } from "../src/constants/apiRoutes.ts";
import { MOTION_VOICE_LIBRARY } from "../src/constants/motionVoice.ts";
import { MotionJobStatus, MotionStoryJobKind } from "../src/types/motionVideo.ts";
import { motionVoiceSignature } from "../src/lib/motionVoice.ts";
import { PRODUCTION_QA } from "./motionProductionVerificationTexts.js";
const bundle = await build({
  stdin: { contents: C.ENTRY, loader: C.TSX, resolveDir: process.cwd() },
  bundle: true,
  platform: C.BROWSER,
  format: C.IIFE,
  write: false,
  plugins: [
    {
      name: C.FIXTURE,
      setup(builder) {
        builder.onLoad({ filter: C.PATTERNS.API_MODULE }, () => ({ contents: C.API_STUB }));
        builder.onLoad({ filter: C.PATTERNS.STORAGE_MODULE }, () => ({ contents: C.STORAGE_STUB }));
        builder.onLoad({ filter: C.PATTERNS.ACTIVITY_MODULE }, () => ({ contents: C.ACTIVITY_STUB }));
        builder.onResolve({ filter: C.PATTERNS.TOAST_MODULE }, () => ({ path: C.TOAST_MODULE, namespace: C.FIXTURE }));
        builder.onLoad({ filter: C.PATTERNS.ANY, namespace: C.FIXTURE }, () => ({ contents: C.TOAST_STUB }));
      },
    },
  ],
});
const browser = await chromium.launch({ channel: C.CHROME, headless: true });
const pageErrors: string[] = [];
const mount = async (overrides: Record<string, unknown> = {}, pendingStart = false, restore: { stopped?: boolean; status?: MotionJobStatus; pollError?: boolean; kind?: MotionStoryJobKind; journal?: string[]; delayedLogs?: boolean } = {}): Promise<Page> => {
  const page = await browser.newPage();
  page.on(C.PAGE_ERROR, (error) => pageErrors.push(error.message));
  await page.setContent(C.HTML);
  await page.evaluate(
    ({ overrides, pendingStart, restore, routes, channels, statuses, kinds, texts: C }) => {
      const fixture: any = { saved: { rawText: C.SOURCE.text, source: C.SOURCE, analysis: C.ANALYSIS, script: C.SCRIPT, autoContinue: false, autoExport: true, ...overrides }, requests: [], errors: [], jobs: {}, finishers: {}, pendingStart, releaseStart: null, cancelFails: false, cancelCompletes: false, stopped: restore.stopped };
      fixture.partial = { ...C.SCRIPT, gen: { ...C.SCRIPT.gen, puppet: C.PUPPET } };
      fixture.finish = (id: string, status: string) => {
        const job = { ...fixture.jobs[id], status, ...(id === C.SCENE_ID ? { result: fixture.partial } : {}) };
        fixture.jobs[id] = job;
        fixture.finishers[id]?.(job);
        delete fixture.finishers[id];
      };
      fixture.request = async (url: string, body: any) => {
        fixture.requests.push({ url, body });
        if (url.startsWith(routes.MOTION_STORY_LOGS) && restore.journal) {
          const after = Number(new URL(url, "http://fixture").searchParams.get("after")) || 0;
          const lines = restore.journal.slice(after, after + 400);
          const page = { lines, next: after + lines.length, total: restore.journal.length };
          if (restore.delayedLogs) {
            restore.delayedLogs = false;
            await new Promise((resolve) => {
              fixture.releaseLogs = resolve;
            });
          }
          return page;
        }
        fixture.addJournal = (line: string) => restore.journal?.push(line);
        if (url === channels) return { channels: [] };
        if (url === routes.MOTION_VIDEO_RESULTS) return { items: [] };
        if (url === routes.MOTION_STORY_COMPILE) return { spec: { shots: [], duration: 5 }, missing: [], sfxCues: [] };
        if (url === routes.MOTION_STORY_CANCEL || url === routes.MOTION_VIDEO_CANCEL) {
          if (fixture.cancelFails) throw new Error(C.CANCEL_ERROR);
          if (fixture.jobs[body.jobId]) fixture.finish(body.jobId, fixture.cancelCompletes ? statuses.COMPLETED : statuses.CANCELLED);
          return { success: true, cancelled: !!fixture.jobs[body.jobId] };
        }
        if (url === routes.MOTION_STORY_SCRIPT) {
          const job = { id: C.SCENE_ID, kind: kinds.SCRIPT, status: statuses.COMPLETED, log: [C.LOG_LINE], result: fixture.partial };
          fixture.jobs[job.id] = job;
          return { job };
        }
        if (url === routes.MOTION_STORY_SCENES || url === routes.MOTION_STORY_VOICE) {
          if (fixture.pendingStart)
            await new Promise((resolve) => {
              fixture.releaseStart = resolve;
            });
          const isScene = url === routes.MOTION_STORY_SCENES;
          const job = { id: isScene ? C.SCENE_ID : C.VOICE_ID, kind: isScene ? kinds.SCENES : kinds.VOICE, status: statuses.RENDERING, log: [C.LOG_LINE], ...(isScene ? { result: fixture.partial } : {}) };
          fixture.jobs[job.id] = job;
          return { job };
        }
        throw new Error(url);
      };
      fixture.poll = (url: string, update: (job: unknown) => void, done: (job: any) => boolean) => {
        if (restore.pollError) return Promise.reject(new Error(C.POLL_ERROR));
        const id = url.slice((url.startsWith(routes.MOTION_STORY_STATUS) ? routes.MOTION_STORY_STATUS : routes.MOTION_VIDEO_STATUS).length);
        const job = fixture.jobs[id] || { id, kind: restore.kind || kinds.SCENES, status: restore.status || statuses.RENDERING, log: [id === C.RENDER_ID ? C.LOG_RENDER : C.LOG_LINE], result: fixture.partial };
        fixture.jobs[id] = job;
        update(job);
        if (fixture.jobs[id] !== job) {
          update(fixture.jobs[id]);
          return Promise.resolve(fixture.jobs[id]);
        }
        if (done(job)) return Promise.resolve(job);
        return new Promise((resolve) => {
          fixture.finishers[id] = (next: unknown) => {
            update(next);
            resolve(next);
          };
        });
      };
      (window as any).motionDraftFixture = fixture;
    },
    { overrides, pendingStart, restore, routes: API_ROUTES, channels: MOTION_VOICE_LIBRARY.CHANNELS_URL, statuses: MotionJobStatus, kinds: MotionStoryJobKind, texts: C },
  );
  await page.addScriptTag({ content: bundle.outputFiles[0].text });
  await page.waitForFunction(() => !!(window as any).motionDraftStudio?.state.script);
  return page;
};
const start = async (page: Page) => {
  await page.evaluate(() => {
    void (window as any).motionDraftStudio.buildScenes();
  });
  await page.waitForFunction(() => !!(window as any).motionDraftFixture.finishers[(window as any).motionDraftStudio.storyJob?.id]);
};
const stop = async (page: Page) => {
  await page.evaluate(() => (window as any).motionDraftStudio.cancelStory());
  await page.waitForFunction(() => !(window as any).motionDraftStudio.busy && (window as any).motionDraftStudio.state.automationPaused);
};
const saved = async (page: Page) => {
  await page.evaluate((event) => window.dispatchEvent(new Event(event)), C.PAGE_HIDE);
  return page.evaluate(() => (window as any).motionDraftFixture.saved);
};
const noRestart = async (page: Page, delay: number = C.GUARD_DELAY) => {
  const workCount = () => page.evaluate((compile) => (window as any).motionDraftFixture.requests.filter((r: any) => r.url !== compile).length, API_ROUTES.MOTION_STORY_COMPILE);
  const before = await workCount();
  await page.waitForTimeout(delay);
  assert.equal(await workCount(), before, C.NO_RESTART);
  assert.equal(await page.evaluate(() => (window as any).motionDraftStudio.busy), false);
};
try {
  const journal = Array.from({ length: 400 }, (_, index) => "journal-" + index);
  const logPage = await mount({ activeStoryJobId: C.SCENE_ID }, false, { journal, delayedLogs: true });
  await logPage.waitForFunction(() => !!(window as any).motionDraftFixture.releaseLogs);
  await logPage.evaluate(
    ({ id, status }) => {
      const fixture = (window as any).motionDraftFixture;
      fixture.addJournal("journal-final");
      fixture.finish(id, status);
      fixture.releaseLogs();
    },
    { id: C.SCENE_ID, status: MotionJobStatus.COMPLETED },
  );
  await logPage.waitForFunction(() => (window as any).motionDraftStudio.logHistory.find((entry: any) => entry.id === "scene-cancellation-job")?.lines.length === 401);
  const logEntry = await logPage.evaluate(() => (window as any).motionDraftStudio.logHistory.find((entry: any) => entry.id === "scene-cancellation-job"));
  assert.deepEqual(logEntry.lines, [...journal, "journal-final"]);
  await logPage.close();
  const legacyLines = Array.from({ length: 1000 }, (_, index) => "legacy-" + index);
  const legacyLog = await mount({ activeStoryJobId: C.SCENE_ID, logHistory: [{ id: C.SCENE_ID, kind: MotionStoryJobKind.SCENES, lines: legacyLines }] }, false, { journal: legacyLines.slice(0, 400), status: MotionJobStatus.COMPLETED });
  await legacyLog.waitForFunction(() => !(window as any).motionDraftStudio.state.activeStoryJobId);
  assert.equal(await legacyLog.evaluate(() => (window as any).motionDraftStudio.logHistory[0].lines.length), legacyLines.length + 1);
  await legacyLog.close();
  const incompleteAnalysis = { ...C.ANALYSIS, chapters: [...C.ANALYSIS.chapters, PRODUCTION_QA.CHAPTERS[1]] };
  for (const restored of [false, true]) {
    const incomplete = await mount({ analysis: incompleteAnalysis, autoContinue: true, ...(restored ? { activeStoryJobId: C.SCENE_ID, activeStoryRunId: C.SCENE_ID, automationPaused: false } : {}) }, false, { status: MotionJobStatus.COMPLETED, kind: MotionStoryJobKind.SCRIPT });
    if (!restored) await incomplete.evaluate(() => (window as any).motionDraftStudio.writeScript());
    await incomplete.waitForFunction(() => (window as any).motionDraftStudio.state.automationPaused && !(window as any).motionDraftStudio.busy);
    assert.equal(await incomplete.evaluate((routes) => (window as any).motionDraftFixture.requests.some((request: any) => [routes.MOTION_STORY_SEO, routes.MOTION_STORY_SCENES, routes.MOTION_STORY_VOICE, routes.MOTION_VIDEO_RENDER].includes(request.url)), API_ROUTES), false);
    await noRestart(incomplete);
    await incomplete.close();
  }
  const oldLogs = [{ id: C.JOB_ID, kind: MotionStoryJobKind.ANALYZE, lines: [C.LOG_OLDER] }];
  const page = await mount({ logHistory: oldLogs });
  await start(page);
  const partial = await page.evaluate(() => (window as any).motionDraftStudio.state.script);
  await stop(page);
  assert.deepEqual(await page.evaluate(() => (window as any).motionDraftStudio.state.script), partial, C.RETAIN_DRAFT);
  await noRestart(page, C.RETRY_GUARD_DELAY);
  assert.equal(await page.evaluate(() => (window as any).motionDraftFixture.stopped), true, C.STOP_MARKER);
  const persisted = await saved(page);
  assert.deepEqual(persisted.logHistory, [...oldLogs, { id: C.SCENE_ID, kind: MotionStoryJobKind.SCENES, lines: [C.LOG_LINE] }], C.LOG_RELOAD);
  assert.equal(persisted.automationPaused, true, C.RELOAD_PAUSED);
  const restored = await mount(persisted);
  assert.deepEqual(await restored.evaluate(() => (window as any).motionDraftStudio.logHistory), persisted.logHistory, C.LOG_RELOAD);
  await noRestart(restored);
  await restored.close();
  await start(page);
  assert.equal(await page.evaluate(() => (window as any).motionDraftStudio.state.automationPaused), false, C.RESUME_EXPLICITLY);
  await page.evaluate(({ id, status }) => (window as any).motionDraftFixture.finish(id, status), { id: C.SCENE_ID, status: MotionJobStatus.COMPLETED });
  await page.waitForFunction((id) => !!(window as any).motionDraftFixture.finishers[id], C.VOICE_ID);
  await stop(page);
  await noRestart(page, C.RETRY_GUARD_DELAY);
  await page.close();
  const resumed = await mount({ activeStoryJobId: C.SCENE_ID });
  await resumed.waitForFunction((id) => !!(window as any).motionDraftFixture.finishers[id], C.SCENE_ID);
  await resumed.evaluate(({ id, status }) => (window as any).motionDraftFixture.finish(id, status), { id: C.SCENE_ID, status: MotionJobStatus.CANCELLED });
  await resumed.waitForFunction(() => !(window as any).motionDraftStudio.busy && (window as any).motionDraftStudio.state.automationPaused);
  await noRestart(resumed);
  await resumed.close();
  const late = await mount({}, true);
  await late.evaluate(() => {
    void (window as any).motionDraftStudio.buildScenes();
  });
  await late.waitForFunction(() => !!(window as any).motionDraftFixture.releaseStart);
  await late.evaluate(() => (window as any).motionDraftStudio.cancelStory());
  await late.evaluate(() => (window as any).motionDraftFixture.releaseStart());
  await late.waitForFunction(() => !(window as any).motionDraftStudio.busy && (window as any).motionDraftStudio.state.automationPaused);
  assert.ok(await late.evaluate(({ route, id }) => (window as any).motionDraftFixture.requests.some((r: any) => r.url === route && r.body?.jobId === id), { route: API_ROUTES.MOTION_STORY_CANCEL, id: C.SCENE_ID }), C.CANCEL_LATE_JOB);
  await noRestart(late);
  await late.close();
  const timer = await mount({ script: partial });
  await stop(timer);
  await noRestart(timer);
  await timer.close();
  const race = await mount();
  await start(race);
  await race.evaluate(() => {
    (window as any).motionDraftFixture.cancelCompletes = true;
  });
  await stop(race);
  assert.equal(await race.evaluate(() => (window as any).motionDraftStudio.state.automationPaused), true, C.NO_CHAIN_AFTER_STOP);
  await noRestart(race);
  await race.close();
  const failed = await mount();
  await start(failed);
  await failed.evaluate(() => {
    (window as any).motionDraftFixture.cancelFails = true;
  });
  await failed.evaluate(() => (window as any).motionDraftStudio.cancelStory());
  assert.equal(await failed.evaluate(() => (window as any).motionDraftStudio.busy), true, C.CANCEL_ERROR_VISIBLE);
  assert.ok((await failed.evaluate(() => (window as any).motionDraftFixture.errors)).includes(C.CANCEL_ERROR), C.CANCEL_ERROR_VISIBLE);
  await failed.evaluate(() => {
    (window as any).motionDraftFixture.cancelFails = false;
  });
  await stop(failed);
  await noRestart(failed);
  await failed.close();
  for (const legacy of [{}, { autoRun: true, autoExport: true }, { automationPaused: false, autoRun: true }, { voice: { ...C.VOICE, signature: C.EMPTY } }, { voice: { ...C.VOICE, signature: motionVoiceSignature(partial, C.ANALYSIS as any) } }]) {
    const idle = await mount({ script: partial, ...legacy });
    await noRestart(idle, C.RETRY_GUARD_DELAY);
    assert.equal(await idle.evaluate(() => (window as any).motionDraftStudio.state.autoRun), false, C.LEGACY_RELOAD);
    assert.equal(await idle.evaluate(() => (window as any).motionDraftStudio.audioPreparing), false, C.LEGACY_RELOAD);
    await idle.close();
  }
  for (const status of [MotionJobStatus.COMPLETED, MotionJobStatus.CANCELLED, MotionJobStatus.ERROR]) {
    const terminal = await mount({ activeStoryJobId: C.SCENE_ID, autoRun: true, autoContinue: true }, false, { status });
    await terminal.waitForFunction(() => !(window as any).motionDraftStudio.state.activeStoryJobId);
    await noRestart(terminal);
    assert.equal(await terminal.evaluate(() => (window as any).motionDraftStudio.state.autoRun), false, C.TERMINAL_RELOAD);
    await terminal.close();
  }
  const missing = await mount({ activeStoryJobId: C.SCENE_ID, autoRun: true }, false, { pollError: true });
  await missing.waitForFunction(() => !(window as any).motionDraftStudio.state.activeStoryJobId);
  await noRestart(missing);
  await missing.close();
  const marked = await mount({ activeStoryJobId: C.SCENE_ID, autoRun: true, automationPaused: false }, false, { stopped: true });
  await marked.waitForFunction(() => !(window as any).motionDraftStudio.state.activeStoryJobId);
  await noRestart(marked);
  assert.ok(await marked.evaluate((route) => (window as any).motionDraftFixture.requests.some((r: any) => r.url === route), API_ROUTES.MOTION_STORY_CANCEL), C.STOP_MARKER);
  await marked.close();
  const live = await mount({ activeStoryJobId: C.SCENE_ID, autoContinue: false, autoExport: false });
  await live.waitForFunction((id) => !!(window as any).motionDraftFixture.finishers[id], C.SCENE_ID);
  assert.equal(await live.evaluate(() => (window as any).motionDraftStudio.busy), true, C.LIVE_REATTACH);
  await live.evaluate(({ id, status }) => (window as any).motionDraftFixture.finish(id, status), { id: C.SCENE_ID, status: MotionJobStatus.COMPLETED });
  await live.waitForFunction(() => !(window as any).motionDraftStudio.state.activeStoryJobId);
  assert.equal(await live.evaluate((routes) => (window as any).motionDraftFixture.requests.some((request: any) => [routes.MOTION_STORY_VOICE, routes.MOTION_VIDEO_RENDER].includes(request.url)), API_ROUTES), false);
  await noRestart(live);
  await live.close();
  const completedDuringReload = await mount({ activeStoryJobId: C.SCENE_ID, activeStoryRunId: C.SCENE_ID, autoContinue: false, autoExport: false }, false, { status: MotionJobStatus.COMPLETED });
  await completedDuringReload.waitForFunction(() => !(window as any).motionDraftStudio.state.activeStoryJobId);
  assert.equal(await completedDuringReload.evaluate(() => (window as any).motionDraftStudio.state.automationPaused), true, C.NO_CHAIN_AFTER_STOP);
  assert.equal(await completedDuringReload.evaluate((routes) => (window as any).motionDraftFixture.requests.some((request: any) => [routes.MOTION_STORY_VOICE, routes.MOTION_VIDEO_RENDER].includes(request.url)), API_ROUTES), false);
  await noRestart(completedDuringReload);
  await completedDuringReload.close();
  for (const stopped of [false, true]) {
    const rendering = await mount({ activeRenderJobId: C.RENDER_ID }, false, { stopped });
    if (!stopped) {
      await rendering.waitForFunction(() => (window as any).motionDraftStudio.renderBusy);
      assert.equal(await rendering.evaluate((route) => (window as any).motionDraftFixture.requests.filter((r: any) => r.url === route).length, API_ROUTES.MOTION_VIDEO_CANCEL), 0, C.RENDER_STOP_MARKER);
      await rendering.evaluate(() => (window as any).motionDraftStudio.cancelRender());
    }
    await rendering.waitForFunction(() => !(window as any).motionDraftStudio.renderBusy && !(window as any).motionDraftStudio.state.activeRenderJobId);
    const renderSaved = await saved(rendering);
    assert.ok(
      renderSaved.logHistory.some((entry: any) => entry.id === C.RENDER_ID && entry.lines.includes(C.LOG_RENDER)),
      C.LOG_RELOAD,
    );
    const renderRestored = await mount(renderSaved);
    assert.deepEqual(await renderRestored.evaluate(() => (window as any).motionDraftStudio.logHistory), renderSaved.logHistory, C.LOG_RELOAD);
    await renderRestored.close();
    assert.ok(await rendering.evaluate((route) => (window as any).motionDraftFixture.requests.some((r: any) => r.url === route), API_ROUTES.MOTION_VIDEO_CANCEL), C.RENDER_STOP_MARKER);
    await noRestart(rendering);
    await rendering.close();
  }
  assert.deepEqual(pageErrors, []);
  process.stdout.write(C.PASSED);
} finally {
  await browser.close();
}
