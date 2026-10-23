import { STUDIO_VERIFICATION_TEXTS as AUT } from "./studioVerificationTexts.js";
import { MOTION_BROWSER_VERIFICATION as V } from "./motionBrowserVerificationTexts.js";
import assert from "node:assert/strict";
import { build } from "esbuild";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:net";
import path from "node:path";
import { pathToFileURL } from "node:url";
import os from "node:os";
import { chromium, type BrowserContext } from "playwright";
import { MotionBrowserLifecycle } from "../src/lib/motionBrowserLifecycle.ts";
import { isDisposableChatBrowserUrl, MOTION_BROWSER_HANDOFF, MOTION_BROWSER_NOT_RELEASED_ERROR, MOTION_BROWSER_RELEASED_LOG } from "../src/constants/browserLifecycle.ts";
import { AiPlanningChatModel, AiPlanningExecutionMode, AiPlanningFallbackProvider } from "../src/types.ts";
import { MotionEncoderPreference, MotionJobStatus, MotionQuality } from "../src/types/motionVideo.ts";
const deferred = () => {
  let finish!: () => void;
  const done = new Promise<void>((resolve) => (finish = resolve));
  return { done, finish };
};
const tick = () => new Promise<void>((resolve) => setImmediate(resolve));
const lifecycle = new MotionBrowserLifecycle();
const endSession = await lifecycle.acquireSession();
let waiting = 0;
let rendering = false;
let entered = false;
const boundary = lifecycle
  .acquireRender(undefined, (count) => (waiting = count))
  .then((release) => {
    rendering = true;
    return release;
  });
const queued = lifecycle.acquireSession().then((release) => {
  entered = true;
  return release;
});
await tick();
assert.equal(waiting, 1);
assert.equal(rendering, false, V.WAIT_TASK);
assert.equal(entered, false, V.WAIT_RENDER);
endSession();
const endRender = await boundary;
assert.equal(entered, false, V.WAIT_RENDER);
endRender();
(await queued)();
const hold = await lifecycle.acquireSession();
const cancelledRender = new AbortController();
const cancelledBoundary = lifecycle.acquireRender(cancelledRender.signal);
const rejectedBoundary = assert.rejects(cancelledBoundary, { message: V.CANCEL });
cancelledRender.abort(new Error(V.CANCEL));
await rejectedBoundary;
(await lifecycle.acquireSession())();
hold();
const holdRender = await lifecycle.acquireRender();
const cancelledSession = new AbortController();
const rejectedSession = assert.rejects(lifecycle.acquireSession(cancelledSession.signal), { message: V.CANCEL });
cancelledSession.abort(new Error(V.CANCEL));
await rejectedSession;
holdRender();
(await lifecycle.acquireSession())();
for (const url of [AUT.ABOUT_BLANK, AUT.CHROME_NEWTAB, AUT.CHROME_NEW_TAB_PAGE, AUT.CHROME_SEARCH_LOCAL_NTP_LOCAL_NTP_HTML, AUT.HTTPS_CLAUDE_AI_CHAT_TEST, AUT.HTTPS_CHAT_DEEPSEEK_COM_A_CHAT_S_TEST, AUT.HTTPS_GEMINI_GOOGLE_COM_APP, AUT.HTTPS_CHATGPT_COM, AUT.HTTPS_GROK_COM, AUT.HTTPS_LABS_GOOGLE]) assert.ok(isDisposableChatBrowserUrl(url), url);
for (const url of [AUT.HTTPS_CLAUDE_AI_EXAMPLE_TEST_WORK, AUT.HTTPS_EXAMPLE_TEST_WORK, AUT.CHROME_SETTINGS, AUT.HTTPS_LABS_GOOGLE_FX_TOOLS_FLOW_PROJECT_ACTIVE]) assert.equal(isDisposableChatBrowserUrl(url), false, url);
const reserve = createServer();
await new Promise<void>((resolve) => reserve.listen(0, AUT.VALUE_127_0_0_1, resolve));
const port = (reserve.address() as import("node:net").AddressInfo).port;
await new Promise<void>((resolve, reject) => reserve.close((error) => (error ? reject(error) : resolve())));
const profile = path.join(os.tmpdir(), AUT.FORMAT_VIDIFY_BROWSER_RELEASE(process.pid));
const output = path.resolve(AUT.FORMAT_NODE_MODULES_CACHE_VERIFY_MOTION_BROWSER_MJS(process.pid));
const previousStorage = process.env.VIDIFY_STORAGE_DIR;
const storage = path.resolve(AUT.FORMAT_SCRATCH_MOTION_BROWSER_RELEASE(process.pid));
process.env.VIDIFY_STORAGE_DIR = storage;
const contexts: BrowserContext[] = [];
const launch = async () => {
  const context = await chromium.launchPersistentContext(profile, { channel: AUT.CHROME, headless: true, args: [AUT.FORMAT_REMOTE_DEBUGGING_PORT(port)] });
  contexts.push(context);
  await context.route(AUT.HTTPS, (route) => route.fulfill({ contentType: AUT.TEXT_HTML_CHARSET_UTF_8, body: AUT.RAW_BROWSER_FIXTURE }));
  return context;
};
let service: any;
const finishTask = deferred();
let releaseBoundary: (() => void) | undefined;
try {
  const bundled = await build({
    stdin: { contents: V.ENTRY, resolveDir: process.cwd(), loader: AUT.TS },
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
          builder.onLoad({ filter: V.PORT_FILES }, async (args) => ({ contents: (await readFile(args.path, AUT.UTF8)).replaceAll(AUT.VALUE_127_0_0_1_9222, AUT.FORMAT_127_0_0_1(port)).replace(AUT.SHARED_CHROME_DEBUG_PORT_9222, AUT.FORMAT_SHARED_CHROME_DEBUG_PORT(port)).replace(AUT.HTTP_127_0_0_1_9333, AUT.HTTP_127_0_0_1_1), loader: AUT.TS, resolveDir: path.dirname(args.path) }));
          builder.onLoad({ filter: V.RENDER_FILE }, async (args) => {
            const source = await readFile(args.path, AUT.UTF8);
            assert.ok(source.includes(V.RENDER_ANCHOR));
            return { contents: source.replace(V.RENDER_ANCHOR, V.RENDER_STOP), loader: AUT.TS, resolveDir: path.dirname(args.path) };
          });
          builder.onLoad({ filter: V.STORY_FILE }, async (args) => {
            const source = await readFile(args.path, AUT.UTF8);
            const at = source.indexOf(V.TASK_ANCHOR);
            assert.ok(at >= 0);
            return { contents: source.slice(0, at) + source.slice(at).replace(V.TASK_BODY, V.TASK_HOOK), loader: AUT.TS, resolveDir: path.dirname(args.path) };
          });
        },
      },
    ],
  });
  await mkdir(path.dirname(output), { recursive: true });
  await writeFile(output, bundled.outputFiles[0].text);
  service = await import(pathToFileURL(output).href);
  const context = await launch();
  const browser = context.browser()!;
  const response = await service.runInMotionAiSession(V.RUN, () => service.runMotionAi(AUT.RETURN_READINESS_JSON, AUT.BROWSER_CLOSE_TEST, { provider: AiPlanningFallbackProvider.DeepSeekChat, model: AiPlanningChatModel.DeepSeekAuto, mode: AiPlanningExecutionMode.RoomOnly, strictProvider: true, chromeHeadless: false }));
  assert.equal(response.ready, true);
  assert.equal(browser.isConnected(), true, V.RETAIN);
  assert.equal(await service.closeAppBrowserAfterTask(true), false, V.RETAIN);
  assert.equal(browser.isConnected(), true, V.RETAIN);
  const roomReady = deferred();
  (globalThis as any).__motionBrowserPending = () => finishTask.done.then(() => ({ ready: true }));
  const finalTask = service.runInMotionAiSession(V.RUN, async () => {
    try {
      await service.prepareChatPlanningRoom({ provider: AiPlanningFallbackProvider.DeepSeekChat, model: AiPlanningChatModel.DeepSeekAuto, projectId: V.PROJECT, workerId: V.WORKER, prompt: AUT.EMPTY, chromeHeadless: false });
      void service.runMotionAi(AUT.RETURN_READINESS_JSON, AUT.BROWSER_CLOSE_TEST, {}).catch(() => undefined);
      roomReady.finish();
    } catch (error) {
      roomReady.finish();
      throw error;
    }
  });
  finalTask.catch(() => undefined);
  await roomReady.done;
  const room = context.pages().at(-1)!;
  const logs: string[] = [];
  let closed = false;
  const closing = service
    .acquireMotionRenderBrowser(undefined, (line: string) => logs.push(line))
    .then((release: () => void) => {
      closed = true;
      releaseBoundary = release;
    });
  let nextStarted = false;
  const next = service.runInMotionAiSession(V.NEXT, async () => {
    nextStarted = true;
  });
  await tick();
  assert.equal(closed, false, V.WAIT_TASK);
  assert.equal(browser.isConnected(), true, V.WAIT_TASK);
  assert.equal(nextStarted, false, V.WAIT_RENDER);
  assert.ok(logs.includes(MOTION_BROWSER_HANDOFF.WAITING(1)));
  finishTask.finish();
  await finalTask;
  delete (globalThis as any).__motionBrowserPending;
  assert.equal(room.isClosed(), true, V.CLEANUP);
  await closing;
  assert.equal(browser.isConnected(), false);
  assert.equal(nextStarted, false, V.WAIT_RENDER);
  releaseBoundary!();
  releaseBoundary = undefined;
  await next;
  const second = await launch();
  const unrelated = await second.newPage();
  await unrelated.goto(AUT.HTTPS_EXAMPLE_TEST_WORK);
  await assert.rejects(service.acquireMotionRenderBrowser(), { message: MOTION_BROWSER_NOT_RELEASED_ERROR });
  assert.equal(second.browser()!.isConnected(), true, AUT.UNRELATED_WORK_MUST_REMAIN_OPEN);
  let afterFailure = false;
  await service.runInMotionAiSession(V.NEXT, async () => {
    afterFailure = true;
  });
  assert.equal(afterFailure, true, V.FAILED_RELEASE);
  await unrelated.close();
  const spec = { title: AUT.BROWSER_RELEASE_REGRESSION, duration: 0.5, fps: 6, aspect: AUT.VALUE_16_9, shots: [{ id: AUT.OPENING, template: AUT.TITLE, start: 0, duration: 0.5, params: { title: AUT.VIDIFY } }] };
  const job = service.startMotionRender(spec, { quality: MotionQuality.DRAFT, encoder: MotionEncoderPreference.CPU, fps: 6 });
  const deadline = Date.now() + V.DEADLINE_MS;
  while (service.getMotionJob(job.id).status !== MotionJobStatus.ERROR && Date.now() < deadline) await new Promise((resolve) => setTimeout(resolve, V.POLL_MS));
  const final = service.getMotionJob(job.id);
  assert.equal(final.error, V.STOP);
  assert.equal(final.framesDone, 0);
  assert.ok(final.log.some((line: string) => line.includes(MOTION_BROWSER_RELEASED_LOG)));
  assert.equal(second.browser()!.isConnected(), false);
  await service.runInMotionAiSession(V.NEXT, async () => undefined);
} finally {
  delete (globalThis as any).__motionBrowserPending;
  finishTask.finish();
  releaseBoundary?.();
  service?.cancelMotionJob();
  await Promise.allSettled(contexts.filter((item) => item.browser()?.isConnected()).map((item) => item.close()));
  await rm(output, { force: true });
  assert.equal(path.dirname(path.resolve(profile)), path.resolve(os.tmpdir()));
  assert.ok(path.basename(profile).startsWith(AUT.FORMAT_VIDIFY_BROWSER_RELEASE(process.pid)));
  await rm(profile, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
  if (previousStorage === undefined) delete process.env.VIDIFY_STORAGE_DIR;
  else process.env.VIDIFY_STORAGE_DIR = previousStorage;
}
process.stdout.write(V.PASSED);
