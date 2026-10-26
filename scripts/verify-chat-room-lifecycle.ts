import assert from "node:assert/strict";
import { build } from "esbuild";
import { readFile, mkdir, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright";
import { CHAT_ROOM_LIFECYCLE_VERIFICATION as V } from "./chatRoomLifecycleVerificationTexts.ts";
import { VERIFICATION_VALUES as VT } from "./motionVerificationValues.ts";
import { AiPlanningFallbackProvider as P } from "../src/types.ts";
const deferred = () => {
  let finish!: () => void;
  const done = new Promise<void>((resolve) => (finish = resolve));
  return { done, finish };
};
const within = async <T>(work: Promise<T>): Promise<T> => {
  let timer: ReturnType<typeof setTimeout>;
  try {
    return await Promise.race([
      work,
      new Promise<never>((_resolve, reject) => {
        timer = setTimeout(() => reject(new Error(V.DEADLOCK)), V.WAIT_MS);
      }),
    ]);
  } finally {
    clearTimeout(timer!);
  }
};
const visits: string[] = [];
const server = createServer((request, response) => {
  visits.push(request.url!);
  response.setHeader(V.CONTENT_TYPE, V.HTML_TYPE);
  response.end(V.DOCUMENT);
});
const output = path.resolve(V.BUNDLE(process.pid));
const previousStorage = process.env.VIDIFY_STORAGE_DIR;
process.env.VIDIFY_STORAGE_DIR = path.resolve(V.STORAGE(process.pid));
let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined;
try {
  await new Promise<void>((resolve) => server.listen(0, V.HOST, resolve));
  const port = (server.address() as { port: number }).port;
  const bundled = await build({
    entryPoints: [V.SOURCE],
    bundle: true,
    platform: VT.NODE,
    format: VT.ESM,
    packages: VT.EXTERNAL,
    write: false,
    plugins: [
      {
        name: V.PLUGIN,
        setup(builder) {
          builder.onLoad({ filter: V.SOURCE_PATTERN }, async (args) => {
            const source = await readFile(args.path, VT.UTF8);
            assert.equal(source.split(V.HOOK).length, 2);
            return { loader: VT.TS, contents: source.replace(V.HOOK, V.INJECT) + V.ENTRY + V.SET_GENERATOR + V.GENERATOR + V.GENERATOR_END };
          });
        },
      },
    ],
  });
  await mkdir(path.dirname(output), { recursive: true });
  await writeFile(output, bundled.outputFiles[0].text);
  const service = await import(pathToFileURL(output).href);
  Object.assign(service.config, { UI_ACTION_BASE_MS: 5000, UI_ACTION_MAX_MS: 5000, SEND_CLICK_WAIT_MS: 100, ROOM_IDLE_STABLE_POLLS: 1, RESPONSE_POLL_MS: 5, SUBMISSION_POLL_MS: 5, HUMAN_ACTION_SETTLE_MS: 0, PROMPT_INPUT_SETTLE_MS: 0, PROMPT_SUBMIT_SETTLE_MS: 0, ROOM_REQUEST_COOLDOWN_MS: 0, RESPONSE_STABLE_POLLS_MATCHED: 2, SUBMISSION_VERIFY_TIMEOUT_MS: 50 });
  const originalIdleWait = service.config.ROOM_IDLE_WAIT_TIMEOUT_MS;
  service.config.ROOM_IDLE_WAIT_TIMEOUT_MS = V.IDLE_WAIT_MS;
  service.config.ROOM_IDLE_STABLE_POLLS = V.IDLE_POLLS;
  let busyRoom = false;
  let idleReads = 0;
  const slowPage = {
    locator: () => ({
      filter: () => ({
        count: async () => {
          idleReads++;
          await new Promise((resolve) => setTimeout(resolve, V.SLOW_READ_MS));
          return busyRoom ? 1 : 0;
        },
      }),
      evaluateAll: async () => [],
    }),
  };
  await within(service.waitForRoomIdle(slowPage, V.BUSY_SELECTOR, V.ANSWER_SELECTOR));
  assert.ok(idleReads < V.IDLE_POLLS);
  busyRoom = true;
  await assert.rejects(service.waitForRoomIdle(slowPage, V.BUSY_SELECTOR, V.ANSWER_SELECTOR));
  service.config.ROOM_IDLE_WAIT_TIMEOUT_MS = originalIdleWait;
  service.config.ROOM_IDLE_STABLE_POLLS = 1;
  browser = await chromium.launch({ channel: V.CHROME, headless: true });
  const context = await browser.newContext();
  await context.route(V.NETWORK, (route) => (new URL(route.request().url()).hostname === V.HOST ? route.continue() : route.abort()));
  const held = deferred(),
    entered = deferred();
  const fixture = {
    context,
    url: (worker: string) => V.URL(port, worker),
    hold: async (roomKey: string) => {
      if (roomKey.endsWith(V.WORKERS[0])) {
        entered.finish();
        await held.done;
      }
    },
  };
  (globalThis as any).__chatRoomLifecycle = fixture;
  service.installFixtureGenerator();
  const request = (workerId: string, index: number) => ({ provider: P.GeminiChat, projectId: V.PROJECT, workerId, artifactType: V.ARTIFACT, requestId: V.REQUEST(workerId, index), prompt: V.PROMPT(V.REQUEST(workerId, index)), closeRoomOnComplete: false, submission: { attempted: false, completed: false } });
  const firstRequest = request(V.WORKERS[0], 1);
  const first = service.generatePlanningWithChatUi(firstRequest);
  try {
    await within(entered.done);
    const rest = await within(Promise.all(V.WORKERS.slice(1).map((worker) => service.generatePlanningWithChatUi(request(worker, 1)))));
    assert.equal(rest.length, 2);
    assert.equal(firstRequest.submission.attempted, false);
  } finally {
    held.finish();
    await first;
  }
  fixture.hold = async () => undefined;
  for (const worker of V.WORKERS) {
    const next = request(worker, 2);
    const result = await service.generatePlanningWithChatUi(next);
    assert.equal(JSON.parse(result.text).requestId, next.requestId);
    const page = service.geminiRooms.get(service.getPlanningRoomKey(next));
    assert.equal(page.url(), V.URL(port, worker));
    assert.equal(await page.evaluate(() => (window as any).sendCount), 2);
    assert.equal(visits.filter((url) => url === new URL(V.URL(port, worker)).pathname).length, 1);
  }
  const current = request(V.WORKERS[0], 3);
  for (let reload = 1; reload <= 2; reload++) {
    await service.reloadChatPlanningRoom(current);
    const page = service.geminiRooms.get(service.getPlanningRoomKey(current));
    assert.equal(page.url(), V.URL(port, V.WORKERS[0]));
    assert.equal(visits.filter((url) => url === new URL(page.url()).pathname).length, reload + 1);
  }
  const transportRequest = () => ({ ...request(V.WORKERS[0], 4), prompt: V.PROMPT(V.REQUEST(V.WORKERS[0], 4)).padEnd(service.config.PROMPT_MESSAGE_LIMIT - 1, "x") });
  const page = service.geminiRooms.get(service.getPlanningRoomKey(current));
  await service.generatePlanningWithChatUi(transportRequest());
  assert.equal(await page.evaluate(() => (window as any).sendCount), 3);
  const prompts = await page.evaluate(() => (window as any).fixturePrompts as string[]);
  assert.ok(prompts[0].includes(service.config.CONTEXT_PART_ID(V.REQUEST(V.WORKERS[0], 4), 1)));
  assert.ok(prompts[1].includes(service.config.CONTEXT_PART_ID(V.REQUEST(V.WORKERS[0], 4), 2)));
  await service.generatePlanningWithChatUi(transportRequest());
  assert.equal(await page.evaluate(() => (window as any).sendCount), 4);
  await service.reloadChatPlanningRoom(current);
  await service.generatePlanningWithChatUi(transportRequest());
  assert.equal(await page.evaluate(() => (window as any).sendCount), 3);
  process.stdout.write(V.PASSED);
} catch (error) {
  throw new Error(error instanceof Error ? error.stack : String(error));
} finally {
  await browser?.close();
  await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  await rm(output, { force: true });
  delete (globalThis as any).__chatRoomLifecycle;
  if (previousStorage === undefined) delete process.env.VIDIFY_STORAGE_DIR;
  else process.env.VIDIFY_STORAGE_DIR = previousStorage;
}
