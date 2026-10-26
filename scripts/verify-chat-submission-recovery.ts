import { VERIFICATION_VALUES as VT } from "./motionVerificationValues.js";
import assert from "node:assert/strict";
import { build } from "esbuild";
import { readFile, mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright";
import { createServer } from "node:http";
import { CHAT_SUBMISSION_VERIFICATION as V } from "./chatSubmissionVerificationTexts.ts";
import { MOTION_AI_RECOVERY as R } from "../src/constants/motionAiRecovery.ts";
import { AiPlanningFallbackProvider as P } from "../src/types.ts";
import type { ChatPlanningSubmission } from "../src/server/services/chatSubmissionRecovery.ts";
import { geminiGenerationRejection } from "../src/server/services/geminiGenerationObserver.ts";
import { observeChatContextReceipts } from "../src/server/services/chatContextReceipt.ts";
assert.deepEqual(geminiGenerationRejection(V.STREAM_ERROR), [8, 1095]);
assert.equal(geminiGenerationRejection(V.STREAM_SUCCESS), null);
assert.equal(geminiGenerationRejection(V.STREAM_INCOMPLETE), null);
assert.equal(geminiGenerationRejection(V.STREAM_ERROR + V.STREAM_SUCCESS), null);
const output = path.resolve(V.BUNDLE(process.pid));
const previousStorage = process.env.VIDIFY_STORAGE_DIR;
process.env.VIDIFY_STORAGE_DIR = path.resolve(V.STORAGE(process.pid));
let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined;
let reloadResponse: unknown;
let roomVisits = 0;
const server = createServer((_request, response) => {
  roomVisits++;
  response.setHeader(V.CONTENT_TYPE, V.HTML_TYPE);
  response.end(reloadResponse ? V.RELOADED_DOCUMENT(reloadResponse) : V.DOCUMENT);
});
try {
  await new Promise<void>((resolve) => server.listen(0, V.HOST, resolve));
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
  await context.route(V.NETWORK, (route) => (new URL(route.request().url()).hostname === V.HOST ? route.continue() : route.abort()));
  const rejectedPage = await context.newPage();
  await rejectedPage.goto(V.LOCAL_ROOM((server.address() as { port: number }).port));
  await rejectedPage.route(V.NETWORK, (route) => (new URL(route.request().url()).pathname === V.STREAM_PATH ? route.fulfill({ status: 200, body: V.STREAM_ERROR }) : route.continue()));
  await rejectedPage.setContent(V.STREAM_DOCUMENT);
  const rejectedSubmission: ChatPlanningSubmission = { attempted: false, completed: false };
  await assert.rejects(service.submitPrompt(rejectedPage, V.ROOM, V.PROMPT, service.config.GEMINI_INPUT_SELECTOR, service.config.GEMINI_SEND_SELECTOR, V.RESPONSE, V.BUSY, [], [], undefined, V.ARTIFACT, V.REQUEST, undefined, rejectedSubmission), { message: service.config.PROVIDER_ERROR_RESPONSE_ERROR, name: V.STREAM_ERROR_NAME });
  assert.equal(rejectedSubmission.attempted, true);
  assert.equal(rejectedSubmission.completed, true);
  assert.equal(await rejectedPage.evaluate(V.COUNTER), 1);
  await rejectedPage.close();
  const coveredPage = await context.newPage();
  await coveredPage.setContent(V.OVERLAY_DOCUMENT);
  await service.clickSendButton(coveredPage, coveredPage.locator(V.OVERLAY_SEND));
  assert.equal(await coveredPage.evaluate(V.COUNTER), 1);
  await coveredPage.close();
  const page = await context.newPage();
  const roomKey = [P.GeminiChat, V.ROOM, service.config.DEFAULT_WORKER_ID].join(service.config.ROOM_KEY_SEPARATOR);
  const response = { artifactType: V.ARTIFACT, requestId: V.REQUEST, ready: true };
  const contextPage = await context.newPage();
  await contextPage.goto(V.LOCAL_ROOM((server.address() as { port: number }).port));
  await contextPage.evaluate((url) => history.replaceState({}, "", url), V.CONTEXT_PATH);
  await contextPage.setContent(V.CONTEXT_DOCUMENT);
  await contextPage.evaluate((value) => {
    (window as any).fixtureResponse = JSON.stringify(value);
  }, response);
  const longPrompt = V.PROMPT + V.CONTEXT_TEXT.repeat(900);
  const longSubmission: ChatPlanningSubmission = { attempted: false, completed: false };
  const longResult = await service.submitPrompt(contextPage, roomKey, longPrompt, V.INPUT, V.SEND, V.RESPONSE, V.BUSY, [], [], undefined, V.ARTIFACT, V.REQUEST, undefined, longSubmission);
  assert.deepEqual(JSON.parse(longResult), response);
  const received = await contextPage.evaluate(() => ({ parts: (window as any).parts, messages: (window as any).messages }));
  assert.equal(received.parts.join(""), longPrompt);
  assert.ok(received.messages.every((message: string) => message.length < service.config.PROMPT_MESSAGE_LIMIT));
  assert.equal(received.messages.length, received.parts.length + 1);
  assert.equal(longSubmission.completed, true);
  const receipts = observeChatContextReceipts(contextPage);
  receipts.select(V.REQUEST);
  receipts.accept(1);
  await contextPage.evaluate(() => history.replaceState({}, "", location.pathname + "?rid=updated#latest"));
  assert.equal(receipts.matches(V.REQUEST), true);
  assert.equal(receipts.has(1), true);
  await contextPage.evaluate(() => history.pushState({}, "", "/c/another-offline-room"));
  assert.equal(receipts.matches(V.REQUEST), false);
  receipts.select(V.REQUEST);
  receipts.accept(1);
  await contextPage.reload();
  assert.equal(receipts.matches(V.REQUEST), false);
  receipts.select(V.REQUEST);
  await contextPage.close();
  assert.equal(receipts.matches(V.REQUEST), false);
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
  const timeoutPage = await context.newPage();
  await timeoutPage.goto(V.LOCAL_ROOM((server.address() as { port: number }).port));
  const pending: ChatPlanningSubmission = { attempted: false, completed: false };
  const limit = service.recoveryConfig.UNCONFIRMED_RESPONSE_MS;
  service.recoveryConfig.UNCONFIRMED_RESPONSE_MS = 60;
  try {
    await assert.rejects(service.submitPrompt(timeoutPage, roomKey, V.PROMPT, V.INPUT, V.SEND, V.RESPONSE, V.BUSY, [], [], undefined, V.ARTIFACT, V.REQUEST, undefined, pending), V.CANCELLED);
  } finally {
    service.recoveryConfig.UNCONFIRMED_RESPONSE_MS = limit;
  }
  assert.equal(pending.attempted, true);
  assert.equal(pending.completed, false);
  assert.equal(await timeoutPage.evaluate(V.COUNTER), 1);
  reloadResponse = response;
  const visitsBeforeResume = roomVisits;
  const recovered = await service.resumeChatPlanningResponse({ provider: P.GeminiChat, projectId: V.ROOM, prompt: V.PROMPT, submission: pending, reloadPendingResponse: true });
  assert.deepEqual(JSON.parse(recovered.text), response);
  assert.equal(pending.completed, true);
  assert.equal(roomVisits, visitsBeforeResume + 1);
  assert.equal(await timeoutPage.locator(V.INPUT).inputValue(), V.EMPTY);
  const geminiPage = await context.newPage();
  const geminiSubmit = (submission: ChatPlanningSubmission) =>
    service.submitPrompt(geminiPage, roomKey, V.PROMPT, service.config.GEMINI_INPUT_SELECTOR, service.config.GEMINI_SEND_SELECTOR, V.RESPONSE, V.BUSY, [], [{ name: V.GEMINI_REFERENCE_NAME, mimeType: V.GEMINI_REFERENCE_MIME, buffer: Buffer.from(V.GEMINI_REFERENCE_BASE64, "base64") }], undefined, V.ARTIFACT, V.REQUEST, undefined, submission);
  service.config.CLAUDE_UPLOAD_STABLE_MS = 0;
  await geminiPage.setContent(V.GEMINI_DOCUMENT);
  const uploadFailed: ChatPlanningSubmission = { attempted: false, completed: false };
  await assert.rejects(geminiSubmit(uploadFailed), { message: service.config.GEMINI_UPLOAD_FAILED_ERROR });
  assert.equal(uploadFailed.attempted, false);
  assert.equal(await geminiPage.evaluate(V.COUNTER), 0);
  assert.equal(await geminiPage.locator(service.config.GEMINI_ATTACHMENT_SELECTOR).count(), 1);
  assert.equal(await geminiPage.locator(V.UNRELATED_FILES).evaluate((node) => (node as HTMLInputElement).files?.length), 0);
  await geminiPage.setContent(V.GEMINI_DOCUMENT);
  await geminiPage.evaluate((value) => {
    (window as any).uploadFails = false;
    (window as any).fixtureResponse = JSON.stringify(value);
  }, response);
  const uploadReady: ChatPlanningSubmission = { attempted: false, completed: false };
  assert.deepEqual(JSON.parse(await geminiSubmit(uploadReady)), response);
  assert.equal(uploadReady.completed, true);
  assert.ok((await geminiPage.locator(V.GEMINI_EDITOR).innerText()).includes(V.REQUEST));
  assert.equal(await geminiPage.locator(V.GEMINI_CLIPBOARD).textContent(), V.EMPTY);
  assert.equal(await geminiPage.evaluate(V.COUNTER), 1);
  assert.equal(await geminiPage.locator(V.GEMINI_FILES).evaluate((node) => (node as HTMLInputElement).files?.[0].name), V.GEMINI_REFERENCE_NAME);
  assert.equal(await geminiPage.locator(V.UNRELATED_FILES).evaluate((node) => (node as HTMLInputElement).files?.length), 0);
  const secondResponse = { ...response, requestId: V.OLD };
  await geminiPage.locator(V.GEMINI_EDITOR).evaluate(
    (editor, config) => {
      Object.defineProperty(editor, config.property, {
        get() {
          throw new Error(config.failure);
        },
      });
    },
    { property: V.LAYOUT_PROPERTY, failure: V.LAYOUT_READ_ERROR },
  );
  const retainedEditor = await service.getLastVisibleLocator(geminiPage, service.config.GEMINI_INPUT_SELECTOR);
  await geminiPage.locator(V.GEMINI_EDITOR).evaluate(
    (editor, config) => {
      Object.defineProperty(editor, config.property, {
        configurable: true,
        value() {
          throw new Error(config.failure);
        },
      });
    },
    { property: V.RECTS_PROPERTY, failure: V.LAYOUT_READ_ERROR },
  );
  const readings = await service.getComposerReadings(retainedEditor);
  assert.ok(readings.some((text: string) => text.includes(V.REQUEST)));
  await geminiPage.locator(V.GEMINI_EDITOR).evaluate((editor, property) => {
    delete (editor as any)[property];
  }, V.RECTS_PROPERTY);
  await geminiPage.evaluate((value) => {
    (window as any).fixtureResponse = JSON.stringify(value);
  }, secondResponse);
  const secondSubmission: ChatPlanningSubmission = { attempted: false, completed: false };
  const secondResult = await service.submitPrompt(geminiPage, roomKey, V.PROMPT.replaceAll(V.REQUEST, V.OLD), service.config.GEMINI_INPUT_SELECTOR, service.config.GEMINI_SEND_SELECTOR, V.RESPONSE, V.BUSY, [], [], undefined, V.ARTIFACT, V.OLD, undefined, secondSubmission);
  assert.deepEqual(JSON.parse(secondResult), secondResponse);
  assert.equal(secondSubmission.completed, true);
  assert.ok((await geminiPage.locator(V.GEMINI_EDITOR).textContent())?.includes(V.OLD));
  assert.equal(await geminiPage.locator(V.GEMINI_CLIPBOARD).textContent(), V.EMPTY);
  assert.equal(await geminiPage.evaluate(V.COUNTER), 2);
  process.stdout.write(V.PASSED);
} finally {
  await browser?.close();
  await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  await rm(output, { force: true });
  if (previousStorage === undefined) delete process.env.VIDIFY_STORAGE_DIR;
  else process.env.VIDIFY_STORAGE_DIR = previousStorage;
  delete (globalThis as any).__chatSubmissionFail;
}
