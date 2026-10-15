import { STUDIO_VERIFICATION_TEXTS as AUT } from "./studioVerificationTexts.js";
import assert from "node:assert/strict";
import { build } from "esbuild";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright";
import { DEEPSEEK_CHAT_MODES } from "../src/constants/deepseekChat.ts";
import { AiPlanningChatModel, AiPlanningExecutionMode, AiPlanningFallbackProvider } from "../src/types.ts";
import { resolvePipelineAiExecution } from "../src/services/pipelineAiExecutionService.ts";
import { resolveFlowVideoPlanningModel } from "../src/services/flowVideoPlanningModel.ts";
const provider = AiPlanningFallbackProvider.DeepSeekChat;
for (const mode of DEEPSEEK_CHAT_MODES) {
  const saved = JSON.parse(JSON.stringify({ config: { planningFallbackProvider: provider, planningChatModel: mode.value } }));
  assert.equal(resolvePipelineAiExecution({}, saved, true).model, mode.value);
  assert.equal(resolveFlowVideoPlanningModel(provider, mode.value), mode.value);
}
assert.equal(resolvePipelineAiExecution({ planningFallbackProvider: provider, planningChatModel: AiPlanningChatModel.ClaudeSonnet55 }, null, true).model, AiPlanningChatModel.DeepSeekAuto);
assert.equal(resolveFlowVideoPlanningModel(provider, AiPlanningChatModel.GeminiFlash), AiPlanningChatModel.DeepSeekAuto);
type FixtureMode = "ready" | "login" | "limited" | "pending" | "upload-failed" | "missing-preview" | "wrong-filename" | "invalid" | "stuck-mode" | "retry" | "retry-always";
let mode: FixtureMode = AUT.READY;
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext();
const pages: import("playwright").Page[] = [];
const uploads: { body: Buffer; finished: boolean }[] = [];
const fixture = (current: FixtureMode) => AUT.CHAT_BROWSER_FIXTURE(current === AUT.LIMITED ? AUT.DIV_ROLE_ALERT_SERVER_BUSY_PLEASE_TRY_AGAIN_LATER_DIV : AUT.EMPTY, current === AUT.LOGIN ? AUT.DIV_LOG_IN_TO_DEEPSEEK_DIV : AUT.DIV_ID_COMPOSER_DIV_ID_CHIPS_DIV_DIV_ID_CONTROLS_TEXTAREA_PLACEHOLDER_MESSAGE_DEEPSE, JSON.stringify(current));
await context.route(AUT.HTTPS_CHAT_DEEPSEEK_COM, async (route) => {
  if (route.request().url().includes(AUT.FILE)) {
    const upload = { body: route.request().postDataBuffer() || Buffer.alloc(0), finished: false };
    uploads.push(upload);
    await new Promise((resolve) => setTimeout(resolve, 150));
    upload.finished = true;
    await route.fulfill({ status: mode === AUT.UPLOAD_FAILED ? 500 : 200, contentType: AUT.APPLICATION_JSON, body: AUT.SYMBOL });
  } else await route.fulfill({ contentType: AUT.TEXT_HTML, body: fixture(mode) });
});
const newPage = context.newPage.bind(context);
context.newPage = async () => {
  const page = await newPage();
  pages.push(page);
  return page;
};
(globalThis as any).__deepseekFixture = { context, account: { email: AUT.FIXTURE_EXAMPLE_TEST } };
const output = path.resolve(AUT.FORMAT_NODE_MODULES_CACHE_VERIFY_DEEPSEEK_MJS(process.pid));
try {
  const bundle = await build({
    stdin: { contents: AUT.EXPORT_FROM_SRC_SERVER_SERVICES_CHATUIPLANNINGSERVICE_TS_EXPORT_FROM_SRC_SERVER_SERV, resolveDir: process.cwd(), loader: AUT.TS },
    bundle: true,
    write: false,
    platform: AUT.NODE,
    format: AUT.ESM,
    packages: AUT.EXTERNAL,
    keepNames: true,
    plugins: [
      {
        name: AUT.ISOLATED_DEEPSEEK,
        setup(builder) {
          builder.onResolve({ filter: /imageGeneratorService\.js$/ }, () => ({ path: AUT.BROWSER, namespace: AUT.FIXTURE }));
          builder.onLoad({ filter: /.*/, namespace: AUT.FIXTURE }, () => ({ contents: AUT.EXPORT_CONST_GETORLAUNCHGLOBALBROWSER_ASYNC_GLOBALTHIS_DEEPSEEKFIXTURE_EXPORT_CONST, loader: AUT.JS }));
          builder.onResolve({ filter: /musicDiagnosticService\.js$/ }, () => ({ path: AUT.DIAGNOSTICS, namespace: AUT.DIAGNOSTICS }));
          builder.onLoad({ filter: /.*/, namespace: AUT.DIAGNOSTICS }, () => ({ contents: AUT.EXPORT_CONST_WRITEMUSICDIAGNOSTIC_ASYNC_EXPORT_CONST_MUSICERRORDETAILS, loader: AUT.JS }));
          builder.onLoad({ filter: /(?:cinematicConstants|deepseekChat)\.ts$/ }, async (args) => {
            let contents = await readFile(args.path, AUT.UTF8);
            const timing = {
              PAGE_READY_TIMEOUT_MS: 300,
              LOGIN_TIMEOUT_MS: 500,
              MODEL_PICKER_TIMEOUT_MS: 250,
              RESPONSE_TIMEOUT_MS: 700,
              RESPONSE_MAX_TIMEOUT_MS: 1500,
              RESPONSE_ACTIVITY_GRACE_MS: 700,
              RESPONSE_POLL_MS: 10,
              RESPONSE_STABLE_POLLS: 2,
              INVALID_RESPONSE_STABLE_POLLS: 3,
              ROOM_IDLE_STABLE_POLLS: 1,
              ROOM_REQUEST_COOLDOWN_MS: 0,
              PROMPT_INPUT_SETTLE_MS: 0,
              PROMPT_SUBMIT_SETTLE_MS: 0,
              HUMAN_ACTION_SETTLE_MS: 0,
              SUBMISSION_POLL_MS: 10,
              UPLOAD_STABLE_MS: 20,
              ATTACHMENT_READY_TIMEOUT_MS: 700,
              RETRY_DELAY_MS: 15,
              RETRY_MAX_DELAY_MS: 25,
            };
            for (const [key, value] of Object.entries(timing)) contents = contents.replace(new RegExp(AUT.FORMAT_B_D(key)), AUT.FORMAT_SYMBOL(key, value));
            return { contents, loader: AUT.TS, resolveDir: path.dirname(args.path) };
          });
        },
      },
    ],
  });
  await mkdir(path.dirname(output), { recursive: true });
  await writeFile(output, bundle.outputFiles[0].text);
  const service = await import(pathToFileURL(output).href);
  const request = (projectId: string, requestId = projectId) => ({ provider, model: AiPlanningChatModel.DeepSeekStandard, projectId, requestId, artifactType: AUT.DEEPSEEK_TEST, expectedSceneIds: [AUT.SCENE_1], chromeHeadless: true, prompt: JSON.stringify({ requestId, artifactType: AUT.DEEPSEEK_TEST }) });
  await service.prepareChatPlanningRoom(request(AUT.ONE));
  const page = pages[0];
  assert.equal(page.url(), AUT.HTTPS_CHAT_DEEPSEEK_COM_2);
  for (const selection of DEEPSEEK_CHAT_MODES) {
    const previous = await page.locator(AUT.ARIA_PRESSED_2).evaluateAll(
      (es, browserData) => {
        const { AUT } = browserData.studioTexts;
        return es.map((e) => e.getAttribute(AUT.ARIA_PRESSED));
      },
      { studioTexts: { AUT: { ARIA_PRESSED: AUT.ARIA_PRESSED } } },
    );
    await service.selectDeepSeekChatModel(page, selection.value);
    const states = await page.locator(AUT.ARIA_PRESSED_2).evaluateAll(
      (es, browserData) => {
        const { AUT } = browserData.studioTexts;
        return es.map((e) => e.getAttribute(AUT.ARIA_PRESSED));
      },
      { studioTexts: { AUT: { ARIA_PRESSED: AUT.ARIA_PRESSED } } },
    );
    assert.deepEqual(states, selection.think === undefined ? previous : [String(selection.think), String(selection.search)]);
  }
  assert.equal(JSON.parse((await service.generatePlanningWithChatUi(request(AUT.ONE, AUT.FIRST))).text).requestId, AUT.FIRST);
  assert.equal(JSON.parse((await service.generatePlanningWithChatUi(request(AUT.ONE, AUT.NEXT))).text).requestId, AUT.NEXT);
  assert.equal(pages.length, 1);
  await service.generatePlanningWithChatUi(request(AUT.TWO));
  assert.equal(pages.length, 2);
  await service.closeChatPlanningRoom({ provider, projectId: AUT.ONE });
  assert.ok(page.isClosed());
  assert.equal(pages[1].isClosed(), false);
  assert.equal(await service.closeChatBrowserIfIdle(), false);
  const attachments = [
    { name: AUT.ANH_PNG, mimeType: AUT.IMAGE_PNG, buffer: Buffer.from(AUT.FIXTURE_IMAGE_BYTES) },
    { name: AUT.TAI_LIEU_TXT, mimeType: AUT.TEXT_PLAIN, buffer: Buffer.from(AUT.RIVER_3048) },
  ];
  await service.generatePlanningWithChatUi({ ...request(AUT.UPLOAD), attachments });
  assert.equal(uploads.length, 2);
  assert.ok(uploads.every((upload) => upload.finished));
  assert.equal(uploads[1].body.toString(), AUT.RIVER_3048);
  const uploadPage = pages.at(-1)!;
  const submission = await uploadPage.evaluate(() => (window as any).submissions[0]);
  assert.equal(submission.attachments, 2);
  await uploadPage.locator(AUT.INPUT_TYPE_FILE).setInputFiles({ name: AUT.STALE_TXT, mimeType: AUT.TEXT_PLAIN, buffer: Buffer.from(AUT.STALE) });
  await uploadPage.waitForTimeout(200);
  await service.generatePlanningWithChatUi(request(AUT.UPLOAD, AUT.TEXT_ONLY));
  assert.equal(await uploadPage.evaluate(() => (window as any).submissions.at(-1).attachments), 0);
  mode = AUT.RETRY;
  const retryResult = await service.generatePlanningWithChatUi({ ...request(AUT.RETRY), attachments });
  const retryPage = pages.at(-1)!;
  assert.equal(JSON.parse(retryResult.text).requestId, AUT.RETRY);
  assert.equal(await retryPage.evaluate(() => (window as any).sent), 1, AUT.RETRY_MUST_NOT_SUBMIT_A_DUPLICATE_USER_MESSAGE);
  assert.equal(await retryPage.evaluate(() => (window as any).retryClicks), 1);
  assert.equal(await retryPage.evaluate(() => (window as any).submissions[0].attachments), 2);
  const staleRecovery = service.createDeepSeekRetryRecovery(retryPage, AUT.SOME_OTHER_PROMPT);
  assert.equal(await staleRecovery(), false);
  mode = AUT.RETRY_ALWAYS;
  await assert.rejects(service.generatePlanningWithChatUi(request(AUT.RETRY_LIMIT)), /deepseek_retry_exhausted/);
  const limitPage = pages.at(-1)!;
  assert.equal(await limitPage.evaluate(() => (window as any).retryClicks), 5);
  assert.equal(await service.createDeepSeekRetryRecovery(limitPage, AUT.SOME_OTHER_PROMPT)(), false, AUT.NEVER_RETRY_A_DIFFERENT_REQUEST_S_FAILED_MESSAGE);
  await pages[1].locator(AUT.DS_BUTTON_PRIMARY).evaluate(
    (element, browserData) => {
      const { AUT } = browserData.studioTexts;
      const loading = document.createElement(AUT.DIV);
      loading.className = AUT.DS_LOADING;
      element.append(loading);
    },
    { studioTexts: { AUT: { DIV: AUT.DIV, DS_LOADING: AUT.DS_LOADING } } },
  );
  const retryCancelCreated = context.waitForEvent(AUT.PAGE);
  const retryAbort = new AbortController();
  const waitingRetry = assert.rejects(service.generatePlanningWithChatUi({ ...request(AUT.RETRY_CANCEL), signal: retryAbort.signal }), /chat_planning_cancelled/);
  const retryCancelPage = await retryCancelCreated;
  await retryCancelPage.locator(AUT.DS_BUTTON_WARNING).waitFor();
  await retryCancelPage.waitForTimeout(75);
  assert.equal(await retryCancelPage.evaluate(() => (window as any).retryClicks), 0, AUT.WAIT_WHILE_ANOTHER_ROOM_ON_THE_ACCOUNT_IS_GENERATING);
  retryAbort.abort();
  await waitingRetry;
  assert.equal(pages[1].isClosed(), false, AUT.CANCELLING_A_RETRY_MUST_PRESERVE_OTHER_PROJECT_ROOMS);
  await pages[1].locator(AUT.DS_LOADING_2).evaluate((element) => element.remove());
  mode = AUT.RETRY;
  const multiRequests = [AUT.RETRY_ROOM_A, AUT.RETRY_ROOM_B, AUT.RETRY_ROOM_C];
  const multiResults = await Promise.all(multiRequests.map((projectId) => service.generatePlanningWithChatUi(request(projectId))));
  assert.deepEqual(
    multiResults.map((result) => JSON.parse(result.text).requestId),
    multiRequests,
  );
  for (const page of pages.slice(-3)) {
    assert.equal(await page.evaluate(() => (window as any).sent), 1);
    assert.equal(await page.evaluate(() => (window as any).retryClicks), 1);
  }
  mode = AUT.READY;
  for (const current of [AUT.LOGIN, AUT.LIMITED, AUT.STUCK_MODE, AUT.UPLOAD_FAILED, AUT.MISSING_PREVIEW, AUT.WRONG_FILENAME, AUT.INVALID] as const) {
    mode = current;
    const expected = current === AUT.LOGIN ? /deepseek_login_required/ : current === AUT.LIMITED ? /deepseek_rate_limited/ : current === AUT.STUCK_MODE ? /deepseek_model_unavailable/ : current === AUT.UPLOAD_FAILED ? /deepseek_attachment_upload_failed/ : current === AUT.INVALID ? /chat_planning_invalid_json_response/ : /deepseek_attachments_not_ready/;
    await assert.rejects(service.generatePlanningWithChatUi({ ...request(current), ...(current.includes(AUT.PREVIEW) || current.includes(AUT.FILENAME) || current === AUT.UPLOAD_FAILED ? { attachments } : {}) }), expected, current);
    if (current !== AUT.LOGIN && current !== AUT.INVALID) assert.equal(await pages.at(-1)!.evaluate(() => (window as any).sent), 0, current);
    await service.closeChatPlanningRoom({ provider, projectId: current });
  }
  mode = AUT.PENDING;
  const abort = new AbortController();
  const cancelPageCreated = context.waitForEvent(AUT.PAGE);
  const cancelled = assert.rejects(service.generatePlanningWithChatUi({ ...request(AUT.CANCEL), signal: abort.signal }), /chat_planning_cancelled/);
  const cancelPage = await cancelPageCreated;
  await cancelPage.waitForFunction(() => (window as any).sent === 1);
  abort.abort();
  await cancelled;
  assert.ok(cancelPage.isClosed());
  assert.equal(pages[1].isClosed(), false);
  process.stdout.write(AUT.DEEPSEEK_MODES_SEPARATE_ROOMS_FRESH_JSON_UPLOADS_CONCURRENT_ROOM_RETRY_RETRY_LIMIT_R);
} finally {
  await rm(output, { force: true });
  delete (globalThis as any).__deepseekFixture;
  await browser.close();
}
