import { MOTION_VERIFICATION_TEXTS as VT } from "./motionVerificationTexts.js";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { build } from "esbuild";
import { chromium } from "playwright";
const bundle = await build({
  stdin: {
    contents: VT.IMPORT_REACT_USESTATE_FROM_REACT_IMPORT_CREATEROOT_FROM_REACT_DO,
    loader: VT.TSX,
    resolveDir: process.cwd(),
  },
  bundle: true,
  define: { "import.meta": VT.EMPTY_9 },
  platform: VT.BROWSER,
  format: VT.IIFE,
  write: false,
});
const browser = await chromium.launch({ channel: VT.CHROME, headless: true });
try {
  const page = await browser.newPage();
  const errors: string[] = [];
  page.on(VT.PAGEERROR, (error) => errors.push(error.message));
  await page.addInitScript(VT.WINDOW_NAME_VALUE_VALUE);
  await page.route(VT.HTTP_PREVIEW_TEST, (route) => route.fulfill({ contentType: VT.TEXT_HTML, body: VT.DIV_ID_ROOT_DIV }));
  await page.goto(VT.HTTP_PREVIEW_TEST);
  await page.addScriptTag({ content: bundle.outputFiles[0].text });
  const busy = page.locator(VT.ARIA_BUSY);
  const assertBusy = async () => {
    assert.equal(await busy.getAttribute(VT.ARIA_BUSY_2), VT.TRUE);
    assert.equal(await page.getByRole(VT.STATUS).count(), 1);
    assert.equal(await page.locator(VT.CANVAS).evaluate((canvas) => getComputedStyle(canvas).visibility), VT.HIDDEN);
    for (const control of await page.locator(VT.BUTTON_INPUT).all()) assert.equal(await control.isDisabled(), true);
  };
  const ready = async () => {
    await page.waitForFunction(({ texts: VT }) => document.querySelector(VT.ARIA_BUSY)?.getAttribute(VT.ARIA_BUSY_2) === VT.FALSE, { payload: undefined, texts: { ARIA_BUSY: VT.ARIA_BUSY, ARIA_BUSY_2: VT.ARIA_BUSY_2, FALSE: VT.FALSE } }, { polling: 25 });
  };
  const finishFrames = async () => {
    await page.evaluate(() => (window as any).fixture.frame());
    await page.evaluate(() => (window as any).fixture.frame());
  };
  await assertBusy();
  await page.waitForFunction(() => (window as any).fixture.preparations.length === 1, undefined, { polling: 25 });
  await page.evaluate(() => (window as any).fixture.preparations[0].resolve());
  await page.waitForFunction(() => (window as any).fixture.draws.length === 1, undefined, { polling: 25 });
  await assertBusy();
  await page.evaluate(() => (window as any).fixture.frame());
  await assertBusy();
  await page.evaluate(() => (window as any).fixture.frame());
  await ready();
  assert.equal(await page.locator(VT.BUTTON).nth(1).isDisabled(), false);
  await page.evaluate(
    ({ texts: VT }) => {
      const f = (window as any).fixture;
      f.update({ spec: f.spec(VT.OLD) });
    },
    { payload: undefined, texts: { OLD: VT.OLD } },
  );
  await assertBusy();
  await page.waitForFunction(() => (window as any).fixture.preparations.length === 2, undefined, { polling: 25 });
  await page.evaluate(
    ({ texts: VT }) => {
      const f = (window as any).fixture;
      f.update({ spec: f.spec(VT.NEW) });
    },
    { payload: undefined, texts: { NEW: VT.NEW } },
  );
  await page.waitForFunction(() => (window as any).fixture.preparations.length === 3, undefined, { polling: 25 });
  await page.evaluate(() => (window as any).fixture.preparations[1].resolve());
  await finishFrames();
  await assertBusy();
  assert.deepEqual(await page.evaluate(() => (window as any).fixture.renderers), [VT.INITIAL]);
  await page.evaluate(() => (window as any).fixture.preparations[2].resolve());
  await finishFrames();
  await ready();
  await page.evaluate(
    ({ texts: VT }) => {
      const f = (window as any).fixture;
      f.update({ pending: true, spec: f.spec(VT.PARTIAL) });
    },
    { payload: undefined, texts: { PARTIAL: VT.PARTIAL } },
  );
  await assertBusy();
  await page.evaluate(
    ({ texts: VT }) => {
      const f = (window as any).fixture;
      f.update({ spec: f.spec(VT.COMPLETE), pending: false });
    },
    { payload: undefined, texts: { COMPLETE: VT.COMPLETE } },
  );
  await page.waitForFunction(() => (window as any).fixture.preparations.length === 4, undefined, { polling: 25 });
  assert.deepEqual(await page.evaluate(() => (window as any).fixture.preparations.map((p) => p.spec.id)), [VT.INITIAL, VT.OLD, VT.NEW, VT.COMPLETE]);
  await page.evaluate(() => (window as any).fixture.preparations[3].resolve());
  await finishFrames();
  await ready();
  for (const failure of [VT.PREPARE, VT.RENDERER, VT.DRAW]) {
    const count = await page.evaluate(() => (window as any).fixture.preparations.length);
    await page.evaluate(
      ({ payload: failure, texts: VT }) => {
        const f = (window as any).fixture;
        f.update({ spec: { ...f.spec(failure), failRenderer: failure === VT.RENDERER, failDraw: failure === VT.DRAW } });
      },
      { payload: failure, texts: { RENDERER: VT.RENDERER, DRAW: VT.DRAW } },
    );
    await page.waitForFunction((count) => (window as any).fixture.preparations.length > count, count, { polling: 25 });
    await page.evaluate(
      ({ payload: { count, failure }, texts: VT }) => {
        const p = (window as any).fixture.preparations[count];
        failure === VT.PREPARE ? p.reject(new Error(VT.ASSET_FAILED)) : p.resolve();
      },
      { payload: { count, failure }, texts: { PREPARE: VT.PREPARE, ASSET_FAILED: VT.ASSET_FAILED } },
    );
    await ready();
    assert.equal(await page.getByRole(VT.ALERT).count(), 1);
    assert.equal(await page.locator(VT.BUTTON).nth(1).isDisabled(), true);
  }
  await page.evaluate(
    ({ texts: VT }) => {
      const f = (window as any).fixture;
      f.update({ ME: { createRenderer: () => ({ duration: 88, drawFrame() {} }) }, spec: f.spec(VT.WITHOUT_ASSETS) });
    },
    { payload: undefined, texts: { WITHOUT_ASSETS: VT.WITHOUT_ASSETS } },
  );
  await page.waitForFunction(() => (window as any).fixture.frames.size > 1, undefined, { polling: 25 });
  await finishFrames();
  await ready();
  let releaseAudio: () => void;
  const audioGate = new Promise<void>((resolve) => {
    releaseAudio = resolve;
  });
  const wav = Buffer.alloc(204);
  wav.write(VT.RIFF);
  wav.writeUInt32LE(196, 4);
  wav.write(VT.WAVEFMT, 8);
  wav.writeUInt32LE(16, 16);
  wav.writeUInt16LE(1, 20);
  wav.writeUInt16LE(1, 22);
  wav.writeUInt32LE(8000, 24);
  wav.writeUInt32LE(16000, 28);
  wav.writeUInt16LE(2, 32);
  wav.writeUInt16LE(16, 34);
  wav.write(VT.DATA, 36);
  wav.writeUInt32LE(160, 40);
  await page.route(VT.AUDIO_WAV_2, async (route) => {
    await audioGate;
    await route.fulfill({ contentType: VT.AUDIO_WAV, body: wav });
  });
  await page.evaluate(({ texts: VT }) => (window as any).fixture.update({ audioUrl: VT.HTTP_PREVIEW_TEST_AUDIO_WAV }), { payload: undefined, texts: { HTTP_PREVIEW_TEST_AUDIO_WAV: VT.HTTP_PREVIEW_TEST_AUDIO_WAV } });
  await assertBusy();
  releaseAudio!();
  await ready();
  const video = execFileSync(process.platform === VT.WIN32 ? path.resolve(VT.FFMPEG_EXE) : VT.FFMPEG, [VT.LOGLEVEL, VT.ERROR, VT.F, VT.LAVFI, VT.I, VT.COLOR_C_BLACK_S_32X32_R_10, VT.T, VT.VALUE_0_3, VT.C_V, VT.LIBVPX, VT.F, VT.WEBM, VT.PIPE_1]);
  let releaseVideo: () => void;
  const videoGate = new Promise<void>((resolve) => {
    releaseVideo = resolve;
  });
  await page.route(VT.VIDEO_WEBM, async (route) => {
    await videoGate;
    await route.fulfill({ contentType: VT.VIDEO_WEBM_2, body: video });
  });
  await page.evaluate(({ texts: VT }) => (window as any).fixture.update({ videoUrl: VT.HTTP_PREVIEW_TEST_VIDEO_WEBM }), { payload: undefined, texts: { HTTP_PREVIEW_TEST_VIDEO_WEBM: VT.HTTP_PREVIEW_TEST_VIDEO_WEBM } });
  assert.equal(await busy.getAttribute(VT.ARIA_BUSY_2), VT.TRUE);
  assert.equal(await page.getByRole(VT.STATUS).count(), 1);
  assert.equal(await page.locator(VT.VIDEO_3).evaluate((video) => getComputedStyle(video).visibility), VT.HIDDEN);
  releaseVideo!();
  await ready();
  assert.deepEqual(await page.locator(VT.VIDEO_3).evaluate((video) => ({ ready: (video as HTMLVideoElement).readyState >= 2, controls: (video as HTMLVideoElement).controls, error: (video as HTMLVideoElement).error?.message })), { ready: true, controls: true, error: undefined });
  await page.evaluate(() => (window as any).fixture.update({ spec: null, audioUrl: undefined, videoUrl: undefined }));
  await ready();
  assert.equal(await page.getByRole(VT.STATUS).count(), 0);
  assert.deepEqual(errors, []);
  process.stdout.write(VT.MOTION_PREVIEW_LOADING_PASSED_FIRST_FRAME_STALE_REQUESTS_PENDING);
} finally {
  await browser.close();
}
