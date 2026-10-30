import { RUNTIME_VERIFICATION_TEXTS as RT, RUNTIME_VERIFICATION_FORMATS as RF } from "./runtimeVerificationTexts.ts";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { build } from "esbuild";
import { chromium } from "playwright";
import { API_ROUTES } from "../src/constants/apiRoutes.ts";
import { MOTION_VOICE_LIBRARY } from "../src/constants/motionVoice.ts";
import { getMotionJob } from "../src/features/motion/server/services/motionRenderService.ts";
import { addMotionResult, deleteMotionResult, getMotionRootDirectory, listMotionResults } from "../src/features/motion/server/services/motionLibraryService.ts";
import { MotionJobStatus, type MotionResultItem } from "../src/types/motionVideo.ts";
fs.mkdirSync(path.resolve(RT.SCRATCH), { recursive: true });
const tempRoot = fs.mkdtempSync(path.resolve(RT.SCRATCH_PREVIEW_RECOVERY));
delete process.env.APP_DATA_DIR;
process.env.VIDIFY_STORAGE_DIR = tempRoot;
const result: MotionResultItem = { id: RT.FINISHED_RENDER, title: RT.CURRENT_STORY, fileName: RT.CURRENT_STORY_MP4, videoUrl: RT.ASSETS_MOTION_VIDEO_CURRENT_STORY_MP4, aspect: RT.VALUE_16_9, quality: RT.DRAFT, width: 1280, height: 720, fps: 30, durationSeconds: 6, sizeBytes: 1, renderSeconds: 10, encoder: RT.LIBX264, createdAt: RT.VALUE_2026_10_18T14_00_00_000Z };
const add = (item: MotionResultItem) => {
  fs.writeFileSync(path.join(getMotionRootDirectory(), item.fileName), RT.FIXTURE);
  addMotionResult(item);
};
add(result);
add({ ...result, id: RT.OTHER_PROJECT, fileName: RT.OTHER_PROJECT_MP4, videoUrl: RT.ASSETS_MOTION_VIDEO_OTHER_PROJECT_MP4 });
const recovered = getMotionJob(result.id)!;
assert.equal(recovered.status, MotionJobStatus.COMPLETED, RT.COMPLETED_OUTPUT_MUST_BE_RECOVERABLE_WITH_NO_IN_MEMORY_RENDER_WORKER);
assert.equal(recovered.result?.videoUrl, result.videoUrl);
assert.equal(recovered.progress, 1);
assert.equal(recovered.framesDone, 180);
assert.equal(getMotionJob(RT.UNKNOWN_RENDER), null);
const bundle = await build({ stdin: { loader: RT.TSX, resolveDir: process.cwd(), contents: RT.IMPORT_REACT_FROM_REACT_IMPORT_CREATEROOT_FROM_REACT_DOM_CLIENT_IMPORT }, bundle: true, platform: RT.BROWSER, format: RT.IIFE, write: false, define: { "import.meta": RT.EMPTY_2 } });
const browser = await chromium.launch({ channel: RT.CHROME, headless: true });
try {
  const page = await browser.newPage();
  const errors: string[] = [],
    unexpected: string[] = [],
    statusRequests: string[] = [];
  let delayedStatus: { started: () => void; wait: Promise<void> } | undefined;
  page.on(RT.PAGEERROR, (error) => errors.push(error.message));
  await page.route(RT.HTTP_MOTION_PREVIEW_TEST, async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname === RT.EMPTY_3) return route.fulfill({ contentType: RT.TEXT_HTML, body: RF.PREVIEW_DOCUMENT(bundle.outputFiles[0].text) });
    if (url.pathname === API_ROUTES.MOTION_VIDEO_RESULTS && route.request().method() === RT.GET) {
      await new Promise((resolve) => setTimeout(resolve, 40));
      return route.fulfill({ json: { items: listMotionResults() } });
    }
    if (url.pathname === MOTION_VOICE_LIBRARY.CHANNELS_URL) return route.fulfill({ json: { channels: [] } });
    if (url.pathname.startsWith(API_ROUTES.MOTION_VIDEO_STATUS)) {
      const id = decodeURIComponent(url.pathname.slice(API_ROUTES.MOTION_VIDEO_STATUS.length));
      statusRequests.push(id);
      if (delayedStatus) {
        delayedStatus.started();
        await delayedStatus.wait;
      }
      const job = getMotionJob(id);
      return route.fulfill({ status: job ? 200 : 404, json: job ? { job } : { error: RT.MISSING_RENDER } });
    }
    if (url.pathname === API_ROUTES.MOTION_VIDEO_RESULTS + RT.EMPTY_3 + result.id && route.request().method() === RT.DELETE) {
      return route.fulfill({ json: deleteMotionResult(result.id) });
    }
    if (url.pathname.startsWith(RT.ASSETS)) return route.fulfill({ contentType: RT.VIDEO_MP4, body: RT.EMPTY });
    unexpected.push(route.request().method() + RT.EMPTY_4 + url.pathname);
    return route.fulfill({ status: 500, json: { error: RT.UNEXPECTED_REQUEST } });
  });
  await page.goto(RT.HTTP_MOTION_PREVIEW_TEST_2);
  const seed = async (draft: object) => {
    await page.evaluate(async (value) => (window as any).previewFixture.seed(value), { autoExport: true, rawText: RT.ORIGINAL_SOURCE, ...draft });
    await page.reload();
  };
  const waitSavedId = async () => {
    await page.waitForFunction(async ({ RT }) => (await (window as any).previewFixture.saved()).lastRenderJobId === RT.FINISHED_RENDER, { RT: { FINISHED_RENDER: RT.FINISHED_RENDER } });
  };
  await seed({ activeRenderJobId: result.id });
  await page.getByTestId(RT.PREVIEW).waitFor();
  assert.equal(await page.getByTestId(RT.PREVIEW).getAttribute(RT.SRC), result.videoUrl);
  await waitSavedId();
  await page.reload();
  await page.getByTestId(RT.PREVIEW).waitFor();
  assert.equal(await page.getByTestId(RT.PREVIEW).getAttribute(RT.SRC), result.videoUrl, RT.REFRESH_MUST_RESTORE_THE_SAME_VIDEO_NOT_ANOTHER_PROJECT_S_NEWER_OUTPUT);
  await page.getByRole(RT.BUTTON, { name: RT.DELETE_OUTPUT }).click();
  await page.getByTestId(RT.PREVIEW).waitFor({ state: RT.DETACHED });
  await page.waitForFunction(async () => (await (window as any).previewFixture.saved()).lastRenderJobId === null);
  assert.equal(getMotionJob(result.id), null, RT.DELETING_THE_MP4_MUST_ALSO_REMOVE_ITS_RECOVERABLE_COMPLETED_JOB);
  await page.reload();
  await page.waitForTimeout(800);
  assert.equal(await page.getByTestId(RT.PREVIEW).count(), 0);
  add(result);
  await seed({ series: { index: 0, parts: [], done: [{ index: 0, fileName: result.fileName, videoUrl: result.videoUrl }] } });
  await page.getByTestId(RT.PREVIEW).waitFor();
  await waitSavedId();
  await page.getByRole(RT.BUTTON, { name: RT.CHANGE_SOURCE }).click();
  await page.getByTestId(RT.PREVIEW).waitFor({ state: RT.DETACHED });
  await page.waitForFunction(async () => (await (window as any).previewFixture.saved()).lastRenderJobId === null);
  await page.reload();
  await page.waitForTimeout(800);
  assert.equal(await page.getByTestId(RT.PREVIEW).count(), 0, RT.A_NEW_SOURCE_MUST_NOT_REVIVE_AN_OLDER_PART_S_VIDEO);
  let release!: () => void;
  const started = new Promise<void>((resolve) => {
    delayedStatus = {
      started: resolve,
      wait: new Promise<void>((done) => {
        release = done;
      }),
    };
  });
  await seed({ activeRenderJobId: result.id, lastRenderJobId: null });
  await started;
  await page.getByRole(RT.BUTTON, { name: RT.CHANGE_SOURCE }).click();
  const response = page.waitForResponse((response) => response.url().includes(API_ROUTES.MOTION_VIDEO_STATUS));
  release();
  await response;
  delayedStatus = undefined;
  await page.waitForTimeout(800);
  assert.equal(await page.getByTestId(RT.PREVIEW).count(), 0, RT.A_LATE_COMPLETION_MUST_NOT_ATTACH_AN_OLD_VIDEO_TO_A_NEWLY_EDITED_SOURC);
  assert.ok(statusRequests.length >= 3);
  assert.deepEqual(unexpected, [], RT.RECOVERY_MUST_NOT_START_RENDERING_AI_GENERATION_OR_COMPILATION);
  assert.deepEqual(errors, []);
  process.stdout.write(RT.MOTION_PREVIEW_RECOVERY_PASSED_REFRESH_PERSISTED_OUTPUT_ID_SERVER_REST + RT.NEWLINE);
} finally {
  await browser.close();
  assert.ok(tempRoot.startsWith(path.resolve(RT.SCRATCH) + path.sep));
  fs.rmSync(tempRoot, { recursive: true, force: true });
}
