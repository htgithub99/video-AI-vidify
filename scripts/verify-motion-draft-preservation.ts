import assert from "node:assert/strict";
import { build } from "esbuild";
import { chromium, type Page } from "playwright";
import { MOTION_DRAFT_VERIFICATION as C } from "./motionDraftVerificationTexts.ts";
import { API_ROUTES } from "../src/constants/apiRoutes.ts";
import { MOTION_VOICE_LIBRARY } from "../src/constants/motionVoice.ts";
import { motionVoiceSignature } from "../src/lib/motionVoice.ts";
import { MotionJobStatus, MotionStoryJobKind } from "../src/types/motionVideo.ts";
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
const mount = async (resume = false): Promise<Page> => {
  const page = await browser.newPage();
  page.on(C.PAGE_ERROR, (error) => pageErrors.push(error.message));
  const saved = {
    rawText: C.SOURCE.text,
    source: C.SOURCE,
    analysis: C.ANALYSIS,
    script: C.SCRIPT,
    voice: { ...C.VOICE, signature: motionVoiceSignature(C.SCRIPT as any, C.ANALYSIS as any) },
    language: C.ANALYSIS.videoDna.settings.language,
    length: C.ANALYSIS.videoDna.settings.length,
    seo: C.SEO,
    thumbnail: C.THUMBNAIL,
    thumbnails: { 0: C.THUMBNAIL },
    autoContinue: false,
    activeStoryJobId: resume ? C.JOB_ID : undefined,
  };
  await page.setContent(C.HTML);
  await page.evaluate(
    ({ saved, routes, channels, statuses, kind, texts: C }) => {
      const fixture: any = { saved, requestError: false, finish: null, body: null };
      fixture.request = async (url: string, body: any) => {
        if (url === channels) return { channels: [] };
        if (url === routes.MOTION_VIDEO_RESULTS) return { items: [] };
        if (url === routes.MOTION_STORY_PARSE) return { source: { ...C.SOURCE, text: body.text } };
        if (url === routes.MOTION_STORY_COMPILE) return { spec: { shots: [], duration: 5 }, missing: [], sfxCues: [], audioPreviewId: C.VOICE.audioId };
        if (url === routes.MOTION_STORY_ANALYZE) {
          fixture.body = body;
          if (fixture.requestError) throw new Error(C.ERROR);
          return { job: { id: C.JOB_ID, kind, status: statuses.QUEUED, log: [] } };
        }
        throw new Error(url);
      };
      fixture.poll = (_url: string, update: (job: any) => void) =>
        new Promise((resolve) => {
          fixture.finish = (status: string) => {
            fixture.finish = null;
            const job = { id: C.JOB_ID, kind, status, result: status === statuses.COMPLETED ? C.NEW_ANALYSIS : undefined, error: C.ERROR, log: [] };
            update(job);
            resolve(job);
          };
        });
      (window as any).motionDraftFixture = fixture;
    },
    { saved, routes: API_ROUTES, channels: MOTION_VOICE_LIBRARY.CHANNELS_URL, statuses: MotionJobStatus, kind: MotionStoryJobKind.ANALYZE, texts: C },
  );
  await page.addScriptTag({ content: bundle.outputFiles[0].text });
  await page.waitForFunction(() => !!(window as any).motionDraftStudio?.state.script);
  if (!resume) await page.waitForFunction(() => !!(window as any).motionDraftStudio.compiled);
  return page;
};
const generated = (page: Page) => page.evaluate((keys) => Object.fromEntries(keys.map((key) => [key, (window as any).motionDraftStudio.state[key]])), C.GENERATED_KEYS);
const flush = async (page: Page) => {
  await page.evaluate((event) => window.dispatchEvent(new Event(event)), C.PAGE_HIDE);
  return page.evaluate((keys) => Object.fromEntries(keys.map((key) => [key, (window as any).motionDraftFixture.saved[key]])), C.GENERATED_KEYS);
};
const finish = async (page: Page, status: MotionJobStatus) => {
  await page.waitForFunction(() => !!(window as any).motionDraftFixture.finish);
  await page.evaluate((value) => (window as any).motionDraftFixture.finish(value), status);
  await page.waitForFunction(() => !(window as any).motionDraftStudio.busy && !(window as any).motionDraftStudio.state.activeStoryJobId);
};
const assertReplaced = async (page: Page) => {
  const state = await generated(page);
  assert.deepEqual(state.analysis, C.NEW_ANALYSIS);
  for (const key of C.RESET_KEYS) assert.equal(state[key], null);
  assert.deepEqual(state.thumbnails, {});
  assert.deepEqual(state.soundOverrides, {});
  assert.deepEqual(await flush(page), state);
};
try {
  const page = await mount();
  await page.evaluate(({ overrides, upload }) => (window as any).motionDraftStudio.patch({ soundOverrides: overrides, uploadedAudio: upload }), { overrides: C.OVERRIDES, upload: C.UPLOAD });
  await page.waitForFunction(() => !!(window as any).motionDraftStudio.state.uploadedAudio);
  const before = await generated(page);
  for (const patch of C.PATCHES) {
    await page.evaluate((value) => (window as any).motionDraftStudio.patch(value), patch);
    await page.waitForFunction((value) => Object.entries(value).every(([key, expected]) => JSON.stringify((window as any).motionDraftStudio.state[key]) === JSON.stringify(expected)), patch);
    assert.deepEqual(await generated(page), before);
  }
  await page.evaluate(() => (window as any).motionDraftStudio.parseSource(String()));
  assert.equal(await page.evaluate(() => (window as any).motionDraftStudio.state.source), null);
  assert.deepEqual(await generated(page), before);
  await page.evaluate((text) => (window as any).motionDraftStudio.parseSource(text), C.NEW_INPUT);
  assert.deepEqual(await generated(page), before);
  assert.deepEqual(await flush(page), before);
  await page.evaluate(async () => {
    (window as any).motionDraftFixture.requestError = true;
    await (window as any).motionDraftStudio.analyze();
    (window as any).motionDraftFixture.requestError = false;
  });
  assert.deepEqual(await generated(page), before);
  for (const status of [MotionJobStatus.ERROR, MotionJobStatus.CANCELLED, MotionJobStatus.COMPLETED]) {
    await page.evaluate(() => {
      void (window as any).motionDraftStudio.analyze();
    });
    await page.waitForFunction(() => !!(window as any).motionDraftFixture.finish);
    assert.deepEqual(await generated(page), before);
    await finish(page, status);
    if (status === MotionJobStatus.COMPLETED) await assertReplaced(page);
    else {
      assert.deepEqual(await generated(page), before);
      assert.deepEqual(await flush(page), before);
    }
  }
  const body = await page.evaluate(() => (window as any).motionDraftFixture.body);
  assert.equal(body.length, C.PATCHES[0].length);
  assert.equal(body.language, C.PATCHES[1].language);
  assert.equal(body.source.text, C.NEW_INPUT);
  await page.close();
  for (const status of [MotionJobStatus.ERROR, MotionJobStatus.CANCELLED, MotionJobStatus.COMPLETED]) {
    const resumed = await mount(true);
    const beforeResume = await generated(resumed);
    await finish(resumed, status);
    if (status === MotionJobStatus.COMPLETED) await assertReplaced(resumed);
    else assert.deepEqual(await generated(resumed), beforeResume);
    await resumed.close();
  }
  assert.deepEqual(pageErrors, []);
  process.stdout.write(C.PASSED);
} finally {
  await browser.close();
}
