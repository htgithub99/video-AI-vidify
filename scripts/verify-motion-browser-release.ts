import { STUDIO_VERIFICATION_TEXTS as AUT } from "./studioVerificationTexts.js";
import assert from "node:assert/strict";
import { build } from "esbuild";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:net";
import path from "node:path";
import { pathToFileURL } from "node:url";
import os from "node:os";
import { chromium } from "playwright";
import { isDisposableChatBrowserUrl, MOTION_BROWSER_FINISHED_LOG, MOTION_BROWSER_NOT_RELEASED_ERROR, MOTION_BROWSER_RELEASED_LOG } from "../src/constants/browserLifecycle.ts";
import { AiPlanningChatModel, AiPlanningExecutionMode, AiPlanningFallbackProvider } from "../src/types.ts";
import { MotionEncoderPreference, MotionJobStatus, MotionQuality } from "../src/types/motionVideo.ts";
for (const url of [AUT.ABOUT_BLANK, AUT.CHROME_NEWTAB, AUT.CHROME_NEW_TAB_PAGE, AUT.CHROME_SEARCH_LOCAL_NTP_LOCAL_NTP_HTML, AUT.HTTPS_CLAUDE_AI_CHAT_TEST, AUT.HTTPS_CHAT_DEEPSEEK_COM_A_CHAT_S_TEST, AUT.HTTPS_GEMINI_GOOGLE_COM_APP, AUT.HTTPS_CHATGPT_COM, AUT.HTTPS_GROK_COM, AUT.HTTPS_LABS_GOOGLE]) assert.ok(isDisposableChatBrowserUrl(url), url);
for (const url of [AUT.HTTPS_CLAUDE_AI_EXAMPLE_TEST_WORK, AUT.HTTPS_EXAMPLE_TEST_WORK, AUT.CHROME_SETTINGS, AUT.HTTPS_LABS_GOOGLE_FX_TOOLS_FLOW_PROJECT_ACTIVE]) assert.equal(isDisposableChatBrowserUrl(url), false, url);
const reserve = createServer();
await new Promise<void>((resolve) => reserve.listen(0, AUT.VALUE_127_0_0_1, resolve));
const port = (reserve.address() as import("node:net").AddressInfo).port;
await new Promise<void>((resolve, reject) => reserve.close((error) => (error ? reject(error) : resolve())));
const profile = path.join(os.tmpdir(), AUT.FORMAT_VIDIFY_BROWSER_RELEASE(process.pid));
const context = await chromium.launchPersistentContext(profile, { channel: AUT.CHROME, headless: true, args: [AUT.FORMAT_REMOTE_DEBUGGING_PORT(port)] });
const browser = context.browser()!;
const profiles = [profile];
const contexts = [context];
const launchExtra = async (label: string, html: string) => {
  const extraProfile = AUT.FORMAT_SYMBOL_2(profile, label);
  profiles.push(extraProfile);
  const extra = await chromium.launchPersistentContext(extraProfile, { channel: AUT.CHROME, headless: true, args: [AUT.FORMAT_REMOTE_DEBUGGING_PORT(port)] });
  contexts.push(extra);
  await extra.route(AUT.HTTPS, (route) => route.fulfill({ contentType: AUT.TEXT_HTML_CHARSET_UTF_8, body: html }));
  return extra;
};
await context.route(AUT.HTTPS, (route) => route.fulfill({ contentType: AUT.TEXT_HTML_CHARSET_UTF_8, body: AUT.TEXTAREA_PLACEHOLDER_MESSAGE_DEEPSEEK_TEXTAREA }));
for (const url of [AUT.HTTPS_CLAUDE_AI_CHAT_COMPLETED, AUT.HTTPS_CHAT_DEEPSEEK_COM_A_CHAT_S_COMPLETED, AUT.HTTPS_LABS_GOOGLE]) {
  const page = await context.newPage();
  await page.goto(url);
}
const output = path.resolve(AUT.FORMAT_NODE_MODULES_CACHE_VERIFY_MOTION_BROWSER_MJS(process.pid));
const previousStorage = process.env.VIDIFY_STORAGE_DIR;
const storage = path.resolve(AUT.FORMAT_SCRATCH_MOTION_BROWSER_RELEASE(process.pid));
process.env.VIDIFY_STORAGE_DIR = storage;
let service: any;
try {
  const bundled = await build({
    stdin: { contents: AUT.EXPORT_FROM_SRC_SERVER_SERVICES_MOTIONRENDERSERVICE_TS_EXPORT_FROM_SRC_SERVER_SERVIC, resolveDir: process.cwd(), loader: AUT.TS },
    bundle: true,
    platform: AUT.NODE,
    format: AUT.ESM,
    packages: AUT.EXTERNAL,
    write: false,
    keepNames: true,
    plugins: [
      {
        name: AUT.ISOLATED_BROWSER_PORTS,
        setup(builder) {
          builder.onLoad({ filter: /(?:apiRoutes|refactor)\.ts$/ }, async (args) => ({ contents: (await readFile(args.path, AUT.UTF8)).replaceAll(AUT.VALUE_127_0_0_1_9222, AUT.FORMAT_127_0_0_1(port)).replace(AUT.SHARED_CHROME_DEBUG_PORT_9222, AUT.FORMAT_SHARED_CHROME_DEBUG_PORT(port)).replace(AUT.HTTP_127_0_0_1_9333, AUT.HTTP_127_0_0_1_1), loader: AUT.TS, resolveDir: path.dirname(args.path) }));
          builder.onLoad({ filter: /motionRenderService\.ts$/ }, async (args) => ({ contents: (await readFile(args.path, AUT.UTF8)).replace(AUT.JOB_STATUS_MOTIONJOBSTATUS_ENCODING, AUT.AWAIT_GLOBALTHIS_MOTIONBROWSERLATEOPEN_JOB_STATUS_MOTIONJOBSTATUS_ENCODING), loader: AUT.TS, resolveDir: path.dirname(args.path) }));
        },
      },
    ],
  });
  await mkdir(path.dirname(output), { recursive: true });
  await writeFile(output, bundled.outputFiles[0].text);
  service = await import(pathToFileURL(output).href);
  const request = { provider: AiPlanningFallbackProvider.DeepSeekChat, model: AiPlanningChatModel.DeepSeekAuto, projectId: AUT.BROWSER_RELEASE_ACTIVE, prompt: AUT.EMPTY, chromeHeadless: false };
  await service.prepareChatPlanningRoom(request);
  assert.equal(await service.closeChatBrowserIfIdle(), false, AUT.ACTIVE_AI_ROOMS_MUST_PREVENT_BROWSER_SHUTDOWN_INCLUDING_THE_FALLBACK_PATH);
  assert.equal(browser.isConnected(), true);
  assert.equal(await service.runInMotionAiSession(AUT.ACTIVE_SESSION, () => service.closeMotionAiBrowserBeforeRender()), false);
  await service.closeChatPlanningRoom(request);
  const unrelated = await context.newPage();
  await unrelated.goto(AUT.HTTPS_EXAMPLE_TEST_WORK);
  assert.equal(await service.closeMotionAiBrowserBeforeRender(), false, AUT.UNRELATED_WORK_MUST_REMAIN_OPEN);
  assert.equal(browser.isConnected(), true);
  const spec = { title: AUT.BROWSER_RELEASE_REGRESSION, duration: 0.5, fps: 6, aspect: AUT.VALUE_16_9, shots: [{ id: AUT.OPENING, template: AUT.TITLE, start: 0, duration: 0.5, params: { title: AUT.VIDIFY, subtitle: AUT.BROWSER_RELEASED } }] };
  const blockedJob = service.startMotionRender(spec, { quality: MotionQuality.DRAFT, encoder: MotionEncoderPreference.CPU, fps: 6 });
  const blockDeadline = Date.now() + 15000;
  while (service.getMotionJob(blockedJob.id).status !== MotionJobStatus.ERROR && Date.now() < blockDeadline) await new Promise((resolve) => setTimeout(resolve, 100));
  assert.equal(service.getMotionJob(blockedJob.id).error, MOTION_BROWSER_NOT_RELEASED_ERROR);
  assert.equal(service.getMotionJob(blockedJob.id).framesDone, 0, AUT.RENDERING_MUST_NOT_START_WHEN_CHROME_CANNOT_BE_RELEASED);
  assert.equal(browser.isConnected(), true);
  await unrelated.close();
  let lateContext: import("playwright").BrowserContext | undefined;
  (globalThis as any).__motionBrowserLateOpen = async () => {
    lateContext = await launchExtra(AUT.LATE, AUT.P_COMPLETED_AI_TAB_REOPENED_WHILE_RENDERING_P);
    const page = await lateContext.newPage();
    await page.goto(AUT.HTTPS_CLAUDE_AI_CHAT_LATE_COMPLETED);
  };
  const job = service.startMotionRender(spec, { quality: MotionQuality.DRAFT, encoder: MotionEncoderPreference.CPU, fps: 6, title: spec.title });
  let final: any;
  const deadline = Date.now() + 120000;
  while (Date.now() < deadline) {
    const state = service.getMotionJob(job.id);
    if (state.log.some((line: string) => line.includes(MOTION_BROWSER_RELEASED_LOG))) assert.equal(browser.isConnected(), false, AUT.CHROME_MUST_EXIT_BEFORE_THE_RELEASE_LOG_AND_LOCAL_RENDER);
    if ([MotionJobStatus.COMPLETED, MotionJobStatus.ERROR, MotionJobStatus.CANCELLED].includes(state.status)) {
      final = state;
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  assert.equal(final?.status, MotionJobStatus.COMPLETED, final?.error || AUT.RENDER_DID_NOT_COMPLETE);
  const releaseIndex = final.log.findIndex((line: string) => line.includes(MOTION_BROWSER_RELEASED_LOG));
  const renderIndex = final.log.findIndex((line: string) => line.includes(AUT.RENDER_SONG_SONG));
  assert.ok(releaseIndex >= 0 && renderIndex > releaseIndex, JSON.stringify(final.log));
  assert.equal(browser.isConnected(), false);
  assert.ok(lateContext && !lateContext.browser()!.isConnected(), AUT.A_CHAT_CHROME_REOPENED_DURING_RENDER_MUST_BE_CLOSED_BEFORE_REPORTING_COMPLETION);
  assert.ok(final.log.some((line: string) => line.includes(MOTION_BROWSER_FINISHED_LOG)));
  assert.ok(final.result.sizeBytes > 1000);
  delete (globalThis as any).__motionBrowserLateOpen;
  const aiContext = await launchExtra(AUT.AI, AUT.RAW_BROWSER_FIXTURE);
  const response = await service.runInMotionAiSession(AUT.AI_FINISHED_NO_RENDER, () => service.runMotionAi(AUT.RETURN_READINESS_JSON, AUT.BROWSER_CLOSE_TEST, { provider: AiPlanningFallbackProvider.DeepSeekChat, model: AiPlanningChatModel.DeepSeekAuto, mode: AiPlanningExecutionMode.RoomOnly, chromeHeadless: false }));
  assert.equal(response.ready, true);
  assert.equal(aiContext.browser()!.isConnected(), false, AUT.AI_ONLY_COMPLETION_MUST_CLOSE_CHROME_IMMEDIATELY_WITHOUT_WAITING_FOR_VIDEO_EXPORT);
  await writeFile(path.join(storage, AUT.VERIFICATION_JSON), JSON.stringify({ status: AUT.PASSED, chromeClosedBeforeRender: true, reopenedChromeClosedAfterRender: true, aiOnlyCompletionClosesImmediately: true, final }, null, 2));
  process.stdout.write(AUT.FORMAT_MOTION_BROWSER_RELEASE_PASSED_CHROME_CLOSED_AFTER_AI_ONLY_COMPLETION_BEFORE_RENDERIN(storage));
} finally {
  delete (globalThis as any).__motionBrowserLateOpen;
  service?.cancelMotionJob();
  await Promise.allSettled(contexts.map((item) => item.close()));
  await rm(output, { force: true });
  for (const item of profiles) {
    assert.equal(path.dirname(path.resolve(item)), path.resolve(os.tmpdir()));
    assert.ok(path.basename(item).startsWith(AUT.FORMAT_VIDIFY_BROWSER_RELEASE(process.pid)));
    await rm(item, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
  }
  if (previousStorage === undefined) delete process.env.VIDIFY_STORAGE_DIR;
  else process.env.VIDIFY_STORAGE_DIR = previousStorage;
}
