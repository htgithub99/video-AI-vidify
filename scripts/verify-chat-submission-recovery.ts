import { VERIFICATION_VALUES as VT } from "./motionVerificationValues.js";
import assert from "node:assert/strict";
import { build } from "esbuild";
import { readFile, mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright";
import { CHAT_SUBMISSION_VERIFICATION as V } from "./chatSubmissionVerificationTexts.ts";
import { MOTION_AI_RECOVERY as R } from "../src/constants/motionAiRecovery.ts";
import { AiPlanningFallbackProvider as P } from "../src/types.ts";
import type { ChatPlanningSubmission } from "../src/server/services/chatSubmissionRecovery.ts";
const output = path.resolve(V.BUNDLE(process.pid));
const previousStorage = process.env.VIDIFY_STORAGE_DIR;
process.env.VIDIFY_STORAGE_DIR = path.resolve(V.STORAGE(process.pid));
let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined;
try {
  const bundle = await build({
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
            assert.equal(source.split(V.CLICK).length, 2);
            return { loader: VT.TS, contents: source.replace(V.CLICK, V.INJECT) + V.ENTRY };
          });
        },
      },
    ],
  });
  await mkdir(path.dirname(output), { recursive: true });
  await writeFile(output, bundle.outputFiles[0].text);
  const service = await import(pathToFileURL(output).href);
  Object.assign(service.config, { UI_ACTION_MAX_MS: 1000, SEND_CLICK_WAIT_MS: 100, ROOM_IDLE_STABLE_POLLS: 1, RESPONSE_POLL_MS: 5, SUBMISSION_POLL_MS: 5, HUMAN_ACTION_SETTLE_MS: 0, PROMPT_INPUT_SETTLE_MS: 0, PROMPT_SUBMIT_SETTLE_MS: 0, RESPONSE_STABLE_POLLS_MATCHED: 2, SUBMISSION_VERIFY_TIMEOUT_MS: 20, INVALID_RESPONSE_STABLE_POLLS: 1000 });
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  await context.route(V.NETWORK, (route) => route.abort());
  const page = await context.newPage();
  const roomKey = [P.GeminiChat, V.ROOM, service.config.DEFAULT_WORKER_ID].join(service.config.ROOM_KEY_SEPARATOR);
  const response = { artifactType: V.ARTIFACT, requestId: V.REQUEST, ready: true };
  const setResponse = (value: unknown) =>
    page.locator(V.RESPONSE).evaluate((element, text) => {
      element.textContent = text;
    }, JSON.stringify(value));
  const submit = (submission: ChatPlanningSubmission, signal?: AbortSignal) => service.submitPrompt(page, roomKey, V.PROMPT, V.INPUT, V.SEND, V.RESPONSE, V.BUSY, [], [], undefined, V.ARTIFACT, V.REQUEST, signal, submission);
  const resume = (submission: ChatPlanningSubmission, signal?: AbortSignal) => service.resumeChatPlanningResponse({ provider: P.GeminiChat, projectId: V.ROOM, prompt: V.PROMPT, submission, signal });
  await page.setContent(V.DOCUMENT);
  await setResponse({ ...response, requestId: V.OLD });
  const uncertain: ChatPlanningSubmission = { attempted: false, completed: false };
  (globalThis as any).__chatSubmissionFail = true;
  await assert.rejects(submit(uncertain), { message: V.FAIL });
  assert.equal(uncertain.attempted, true);
  assert.equal(uncertain.completed, false);
  assert.equal(await page.evaluate(V.COUNTER), 1);
  assert.equal(uncertain.pending?.requestId, V.REQUEST);
  assert.equal(uncertain.pending?.initialResponseSnapshots.length, 1);
  await setResponse(response);
  assert.deepEqual(JSON.parse((await resume(uncertain)).text), response);
  assert.equal(uncertain.completed, true);
  assert.equal(await page.evaluate(V.COUNTER), 1);
  (globalThis as any).__chatSubmissionFail = false;
  await page.setContent(V.DOCUMENT);
  const delayed: ChatPlanningSubmission = { attempted: false, completed: false };
  const sending = submit(delayed);
  while (!delayed.attempted) await new Promise((resolve) => setTimeout(resolve, 5));
  await page.waitForTimeout(150);
  await setResponse(response);
  assert.deepEqual(JSON.parse(await sending), response);
  assert.equal(await page.evaluate(V.COUNTER), 1);
  assert.ok((await page.locator(V.INPUT).inputValue()).length);
  assert.equal(delayed.completed, true);
  delayed.completed = false;
  await setResponse({ ...response, requestId: V.OLD });
  const abort = new AbortController();
  const stale = resume(delayed, abort.signal);
  setTimeout(() => abort.abort(), 50);
  await assert.rejects(stale, V.CANCELLED);
  assert.equal(delayed.completed, false);
  assert.equal(await page.evaluate(V.COUNTER), 1);
  service.config.INVALID_RESPONSE_STABLE_POLLS = 2;
  await assert.rejects(resume(delayed), { message: service.config.INVALID_RESPONSE_ERROR });
  assert.equal(delayed.completed, false);
  await page.close();
  await assert.rejects(resume(delayed), (error: any) => error[R.UNCERTAIN_FLAG] === true);
  process.stdout.write(V.PASSED);
} finally {
  await browser?.close();
  await rm(output, { force: true });
  if (previousStorage === undefined) delete process.env.VIDIFY_STORAGE_DIR;
  else process.env.VIDIFY_STORAGE_DIR = previousStorage;
  delete (globalThis as any).__chatSubmissionFail;
}
