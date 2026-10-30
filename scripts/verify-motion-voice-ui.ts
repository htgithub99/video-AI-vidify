import { MOTION_VERIFICATION_TEXTS as VT } from "./motionVerificationTexts.js";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { build } from "esbuild";
import { chromium } from "playwright";
import { API_ROUTES } from "../src/constants/apiRoutes.ts";
import { MOTION_VOICE } from "../src/constants/motionVoice.ts";
import { MOTION_SOUND_CONFIG } from "../src/constants/motionSound.ts";
import { getMotionEngineClientScript } from "../src/features/motion/server/services/motionEngineService.ts";
import { getMotionAudioDirectory, getMotionRootDirectory } from "../src/features/motion/server/services/motionLibraryService.ts";
import { motionVoiceSignature } from "../src/lib/motionVoice.ts";
import { PUPPET } from "../src/constants/motionPuppet.ts";
import { MOTION_CANCELLATION_VERIFICATION as C } from "./motionCancellationVerificationTexts.ts";
import { MotionStoryJobKind } from "../src/types/motionVideo.ts";
const creator = fs.readFileSync(VT.SRC_COMPONENTS_MOTIONVIDEOCREATOR_TSX, VT.UTF8);
assert.ok(!/MotionVoiceControls|MotionSoundControls|studio\.generateVoice|patch\(\{ sfx:/.test(creator), VT.PRODUCTION_UI_CONTAINS_NO_MANUAL_VOICE_SFX_CONTROLS);
const fixture = JSON.parse(fs.readFileSync(VT.SCRATCH_MOTION_VOICE_FLOW_RESULT_JSON, VT.UTF8));
fixture.script.gen.soundPlanVersion = MOTION_SOUND_CONFIG.VERSION;
fixture.script.gen.puppet = { version: PUPPET.VERSION };
const bundle = await build({
  stdin: { contents: VT.IMPORT_REACT_FROM_REACT_IMPORT_CREATEROOT_FROM_REACT_DOM_CLI, loader: VT.TSX, resolveDir: process.cwd() },
  bundle: true,
  platform: VT.BROWSER,
  format: VT.IIFE,
  write: false,
  define: { "import.meta": VT.EMPTY_9 },
  plugins: [
    {
      name: VT.FIXTURE_STORAGE,
      setup(builder) {
        builder.onLoad({ filter: /[\\/]lib[\\/]json\.ts$/ }, () => ({ contents: VT.EXPORT_CONST_JSONUTILS_GETASYNCITEM_ASYNC_KEY_FALLBACK_KEY_M, loader: VT.TS }));
      },
    },
  ],
});
const browser = await chromium.launch({ channel: VT.CHROME, headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1100, height: 850 } });
  let voiceRequests = 0,
    currentTrack = fixture.track;
  await page.route(VT.HTTP_MOTION_TEST, async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname === VT.EMPTY_7) return route.fulfill({ contentType: VT.TEXT_HTML, body: VT.HTML_CLASS_DARK_BODY_STYLE_PADDING_20PX_DIV_ID_ROOT_DIV_BODY });
    if (url.pathname === API_ROUTES.MOTION_VIDEO_ENGINE) return route.fulfill({ contentType: VT.TEXT_JAVASCRIPT, body: getMotionEngineClientScript() });
    if (url.pathname.startsWith(VT.ASSETS_MOTION_VIDEO_AUDIO)) {
      const file = path.join(getMotionAudioDirectory(), path.basename(url.pathname));
      const bytes = fs.readFileSync(file),
        range = route
          .request()
          .headers()
          .range?.match(/^bytes=(\d+)-(\d*)$/);
      if (range) {
        const start = Number(range[1]),
          end = Math.min(Number(range[2] || bytes.length - 1), bytes.length - 1);
        return route.fulfill({ status: 206, contentType: VT.AUDIO_WAV, headers: { "accept-ranges": VT.BYTES, "content-range": `${VT.BYTES_2}${start}${VT.EMPTY_10}${end}${VT.EMPTY_7}${bytes.length}` }, body: bytes.subarray(start, end + 1) });
      }
      return route.fulfill({ contentType: VT.AUDIO_WAV, headers: { "accept-ranges": VT.BYTES }, body: bytes });
    }
    if (url.pathname === fixture.result.videoUrl) {
      const bytes = fs.readFileSync(path.join(getMotionRootDirectory(), fixture.result.fileName)),
        range = route
          .request()
          .headers()
          .range?.match(/^bytes=(\d+)-(\d*)$/);
      const start = range ? Number(range[1]) : 0,
        end = range ? Math.min(Number(range[2] || bytes.length - 1), bytes.length - 1) : bytes.length - 1;
      return route.fulfill({ status: range ? 206 : 200, contentType: VT.VIDEO_MP4, headers: { "accept-ranges": VT.BYTES, ...(range ? { "content-range": `${VT.BYTES_2}${start}${VT.EMPTY_10}${end}${VT.EMPTY_7}${bytes.length}` } : {}) }, body: bytes.subarray(start, end + 1) });
    }
    if (url.pathname === API_ROUTES.MOTION_VIDEO_RENDER) {
      assert.equal(route.request().postDataJSON().options.mixedAudioId, fixture.compiled.audioPreviewId, VT.EXPORT_SUBMITS_THE_COMPLETE_PREVIEW_MASTER);
      return route.fulfill({ json: { job: { id: VT.EXPORT, status: VT.RENDERING, log: [], progress: 0 } } });
    }
    if (url.pathname.startsWith(API_ROUTES.MOTION_VIDEO_STATUS)) return route.fulfill({ json: { job: { id: VT.EXPORT, status: VT.COMPLETED, result: fixture.result, log: [], progress: 1 } } });
    if (url.pathname === API_ROUTES.MOTION_STORY_VOICE) {
      voiceRequests++;
      currentTrack = { ...fixture.track, signature: motionVoiceSignature(route.request().postDataJSON().script, route.request().postDataJSON().analysis) };
      return route.fulfill({ json: { job: { id: VT.AUTOMATIC_VOICE, kind: VT.VOICE, status: VT.RENDERING, log: [], progress: 0 } } });
    }
    if (url.pathname === API_ROUTES.MOTION_STORY_SCENES) return route.fulfill({ json: { job: { id: C.SCENE_ID, kind: MotionStoryJobKind.SCENES, status: VT.RENDERING, log: [], progress: 0 } } });
    if (url.pathname === API_ROUTES.MOTION_STORY_STATUS + C.SCENE_ID) return route.fulfill({ json: { job: { id: C.SCENE_ID, kind: MotionStoryJobKind.SCENES, status: VT.COMPLETED, result: fixture.script, log: [], progress: 1 } } });
    if (url.pathname.startsWith(API_ROUTES.MOTION_STORY_STATUS)) return route.fulfill({ json: { job: { id: VT.AUTOMATIC_VOICE, kind: VT.VOICE, status: VT.COMPLETED, result: currentTrack, log: [], progress: 1 } } });
    if (url.pathname === API_ROUTES.MOTION_STORY_COMPILE) {
      const input = route.request().postDataJSON();
      return route.fulfill({ json: { ...fixture.compiled, audioPreviewId: input.voiceTrack ? fixture.compiled.audioPreviewId : undefined } });
    }
    if (url.pathname === MOTION_VOICE.VOICES_URL) return route.fulfill({ json: { voices: fixture.track.plan.roles.map((role: any) => ({ id: role.voiceId, name: role.voiceId })) } });
    if (url.pathname === API_ROUTES.MOTION_VIDEO_RESULTS) return route.fulfill({ json: { items: [] } });
    return route.fulfill({ status: 404, body: VT.EMPTY_2 });
  });
  await page.goto(VT.HTTP_MOTION_TEST_2);
  await page.evaluate(
    ({ payload: fixture, texts: VT }) => {
      (window as any).motionVoiceSaved = { script: fixture.script, analysis: fixture.analysis, sfx: false, soundOverrides: { stale: { muted: true } }, uploadedAudio: { id: VT.OLD_WAV, durationSeconds: 100 }, autoContinue: false, drawingMode: VT.VALUE_2D, characterMotion: false };
    },
    { payload: fixture, texts: VT },
  );
  const css = fs.readdirSync(VT.DIST_ASSETS).find((file) => /^index-.*\.css$/.test(file));
  if (css) await page.addStyleTag({ content: fs.readFileSync(`${VT.DIST_ASSETS_2}${css}`, VT.UTF8) });
  await page.addScriptTag({ content: bundle.outputFiles[0].text });
  await page.waitForFunction(() => !!(window as any).motionStudioFixture?.state.script);
  await page.waitForTimeout(C.GUARD_DELAY);
  assert.equal(voiceRequests, 0, C.LEGACY_RELOAD);
  await page.evaluate(() => (window as any).motionStudioFixture.buildScenes());
  await page.waitForFunction(() => (window as any).motionStudioFixture?.voiceValid && !!(window as any).motionStudioFixture?.previewAudioId, undefined, { timeout: 20000 });
  assert.equal(voiceRequests, 1, VT.VOICE_MUST_BE_GENERATED_AUTOMATICALLY_WITHOUT_CHOOSING_A_VOI);
  const playback = page.getByRole(VT.BUTTON).nth(1);
  await page.waitForFunction(({ texts: VT }) => !document.querySelectorAll(VT.BUTTON)[1]?.disabled, { payload: undefined, texts: VT });
  await playback.click();
  await page.waitForFunction(
    ({ texts: VT }) => {
      const audio = document.querySelector(VT.AUDIO)!;
      return !audio.paused && audio.currentTime > 0.3;
    },
    { payload: undefined, texts: VT },
  );
  await page.evaluate(() => (window as any).motionStudioFixture.patch({ fps: 24 }));
  await page.waitForFunction(({ texts: VT }) => document.querySelector(VT.AUDIO)!.paused, { payload: undefined, texts: VT });
  await page.waitForFunction(({ texts: VT }) => !(window as any).motionStudioFixture.audioPreparing && !document.querySelectorAll(VT.BUTTON)[1]?.disabled, { payload: undefined, texts: VT });
  await playback.click();
  await page.waitForFunction(({ texts: VT }) => !document.querySelector(VT.AUDIO)!.paused, { payload: undefined, texts: VT });
  await playback.click();
  assert.equal(
    await page
      .locator(VT.AUDIO)
      .first()
      .evaluate((audio: HTMLAudioElement) => audio.paused),
    true,
  );
  const slider = page.getByRole(VT.SLIDER);
  await slider.fill(VT.VALUE_4);
  await page.waitForFunction(({ texts: VT }) => Math.abs(document.querySelector(VT.AUDIO)!.currentTime - 4) < 0.05, { payload: undefined, texts: VT });
  assert.ok(
    Math.abs(
      (await page
        .locator(VT.AUDIO)
        .first()
        .evaluate((audio: HTMLAudioElement) => audio.currentTime)) - 4,
    ) < 0.05,
  );
  const canvasPixels = await page.locator(VT.CANVAS).evaluate(
    (canvas: HTMLCanvasElement, { texts: VT }) => {
      const bytes = canvas.getContext(VT.VALUE_2D)!.getImageData(0, 0, canvas.width, canvas.height).data;
      let count = 0;
      for (let index = 0; index < bytes.length; index += 4) if (bytes[index] + bytes[index + 1] + bytes[index + 2] > 30) count++;
      return count;
    },
    { payload: undefined, texts: VT },
  );
  assert.ok(canvasPixels > 1000, VT.PREVIEW_INCLUDES_RENDERED_VIDEO_PIXELS_NOT_AN_EMPTY_BLACK_CA);
  assert.equal(await page.getByRole(VT.COMBOBOX).count(), 0);
  assert.equal(await page.evaluate(() => (window as any).motionStudioFixture.state.sfx), true);
  assert.deepEqual(await page.evaluate(() => (window as any).motionStudioFixture.state.soundOverrides), {});
  assert.equal(await page.evaluate(() => (window as any).motionStudioFixture.state.uploadedAudio), null);
  await page.screenshot({ path: VT.SCRATCH_MOTION_VOICE_PREVIEW_PNG, fullPage: true });
  await page.waitForFunction(() => (window as any).motionStudioFixture?.voiceValid && !(window as any).motionStudioFixture?.audioPreparing);
  await page.evaluate(() => (window as any).motionStudioFixture.render());
  await page.waitForFunction(() => !!(window as any).motionStudioFixture.previewVideoUrl);
  await page.locator(VT.VIDEO_3).evaluate((video: HTMLVideoElement) => video.play());
  await page.waitForFunction(({ texts: VT }) => document.querySelector(VT.VIDEO_3)!.currentTime > 0.3 && !document.querySelector(VT.VIDEO_3)!.paused, { payload: undefined, texts: VT });
  process.stdout.write(VT.VOICE_UI_PASSED_AUTOMATIC_GENERATION_ACTUAL_VIDEO_AUDIO_PLAY);
} finally {
  await browser.close();
}
