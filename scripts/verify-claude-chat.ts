import { RUNTIME_VERIFICATION_TEXTS as RT } from "./runtimeVerificationTexts.ts";
import { CLAUDE_VERIFICATION_TEXTS as CT } from "./claudeVerificationTexts.js";
import assert from "node:assert/strict";
import { build } from "esbuild";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright";
import { AiPlanningChatModel, AiPlanningExecutionMode, AiPlanningFallbackProvider } from "../src/types.ts";
import { resolvePipelineAiExecution } from "../src/services/pipelineAiExecutionService.ts";
import { resolveFlowVideoPlanningModel } from "../src/services/flowVideoPlanningModel.ts";
const provider = AiPlanningFallbackProvider.ClaudeChat;
assert.equal(resolveFlowVideoPlanningModel(provider, AiPlanningChatModel.GeminiFlash), AiPlanningChatModel.ClaudeAuto);
const execution = resolvePipelineAiExecution({ planningFallbackProvider: provider, planningChatModel: AiPlanningChatModel.GrokExpert, planningExecutionMode: AiPlanningExecutionMode.RoomOnly }, null, true);
assert.equal(execution.provider, provider);
assert.equal(execution.model, AiPlanningChatModel.ClaudeAuto);
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext();
const pages: import("playwright").Page[] = [];
const navigations: string[] = [];
let mode: "ready" | "login" | "visible-login" | "limited" | "pending" | "upload-failed" | "missing-preview" | "wrong-filename" | "stale-upload" | "menu-upload" | "invalid-json" | "code-array" = CT.READY;
const uploadRequests: { body: Buffer; finishedAt: number }[] = [];
const png = Buffer.from(CT.PNG_BASE64, CT.BASE64);
const editor = CT.CHAT_EDITOR_HTML;
const fixture = (fixtureMode: typeof mode) =>
  CT.CHAT_FIXTURE({
    composer: fixtureMode === CT.LOGIN || fixtureMode === CT.VISIBLE_LOGIN ? CT.LOGIN_HTML : fixtureMode === CT.MENU_UPLOAD ? editor.replace(CT.INPUT_TYPE_FILE_MULTIPLE_HIDDEN, CT.ATTACH_BUTTON_HTML) : editor,
    notice: fixtureMode === CT.LIMITED ? CT.RATE_LIMIT_HTML : CT.EMPTY,
    uploadMenu: fixtureMode === CT.MENU_UPLOAD ? CT.UPLOAD_MENU_SCRIPT : CT.EMPTY,
    filename: fixtureMode === CT.WRONG_FILENAME ? CT.OTHER_FILE_TXT : CT.FILE_NAME,
    removePreview: fixtureMode === CT.MISSING_PREVIEW ? CT.CHIP_REMOVE : CT.EMPTY,
    staleAttachment: fixtureMode === CT.STALE_UPLOAD ? CT.STALE_ATTACHMENT_SCRIPT : CT.EMPTY,
    delayedEditor: fixtureMode === CT.VISIBLE_LOGIN ? CT.DELAYED_EDITOR_SCRIPT(JSON.stringify(editor)) : CT.EMPTY,
    response: fixtureMode === CT.PENDING ? CT.EMPTY : CT.STREAMED_RESPONSE_SCRIPT(fixtureMode === CT.INVALID_JSON ? CT.INVALID_RESPONSE_SCRIPT : CT.EMPTY, fixtureMode === CT.CODE_ARRAY ? CT.ARRAY_RESPONSE_SCRIPT : CT.EMPTY),
  });
await context.route(CT.HTTPS_CLAUDE_AI, async (route) => {
  if (new URL(route.request().url()).pathname === CT.API_UPLOAD_FILE) {
    const upload = { body: route.request().postDataBuffer() || Buffer.alloc(0), finishedAt: 0 };
    uploadRequests.push(upload);
    await new Promise((resolve) => setTimeout(resolve, 200));
    upload.finishedAt = Date.now();
    await route.fulfill({ status: mode === CT.UPLOAD_FAILED ? 500 : 200, contentType: CT.APPLICATION_JSON, body: CT.SYMBOL });
    return;
  }
  navigations.push(route.request().url());
  await route.fulfill({ contentType: CT.TEXT_HTML, body: fixture(mode) });
});
const originalNewPage = context.newPage.bind(context);
context.newPage = async () => {
  const page = await originalNewPage();
  pages.push(page);
  return page;
};
(globalThis as any).__claudeFixture = { context, account: { email: CT.FIXTURE_EXAMPLE_TEST } };
const modelSelections: (AiPlanningChatModel | undefined)[] = [];
(globalThis as any).__claudeModelSelections = modelSelections;
try {
  const bundle = await build({
    entryPoints: [CT.SRC_SERVER_SERVICES_CHATUIPLANNINGSERVICE_TS],
    write: false,
    bundle: true,
    platform: CT.NODE,
    format: CT.ESM,
    packages: CT.EXTERNAL,
    keepNames: true,
    plugins: [
      {
        name: CT.ISOLATED_CLAUDE_BROWSER,
        setup(builder) {
          builder.onLoad({ filter: RT.PATTERN_CLAUDEMODELSERVICE_TS }, async (args) => ({ contents: (await readFile(args.path, CT.UTF8)).replace(RT.EXPORT_CONST_SELECTCLAUDECHATMODEL, RT.CONST_APPLYCLAUDECHATMODEL) + RT.EXPORT_CONST_SELECTCLAUDECHATMODEL_ASYNC_ARGS_PARAMETERS_TYPEOF_APPLYC, loader: CT.TS, resolveDir: path.dirname(args.path) }));
          builder.onResolve({ filter: RT.PATTERN_IMAGEGENERATORSERVICE_JS }, () => ({ path: CT.FIXTURE_BROWSER, namespace: CT.FIXTURE }));
          builder.onLoad({ filter: RT.PATTERN_EMPTY, namespace: CT.FIXTURE }, () => ({ contents: CT.BROWSER_SERVICE_FIXTURE, loader: CT.JS }));
          builder.onLoad({ filter: RT.PATTERN_CINEMATICCONSTANTS_TS }, async (args) => {
            let contents = await readFile(args.path, CT.UTF8);
            const timing = {
              PAGE_READY_TIMEOUT_MS: 500,
              CLAUDE_LOGIN_TIMEOUT_MS: 1000,
              RESPONSE_TIMEOUT_MS: 1500,
              RESPONSE_MAX_TIMEOUT_MS: 2500,
              RESPONSE_ACTIVITY_GRACE_MS: 1500,
              RESPONSE_POLL_MS: 10,
              RESPONSE_STABLE_POLLS: 2,
              INVALID_RESPONSE_STABLE_POLLS: 3,
              ROOM_IDLE_STABLE_POLLS: 1,
              ROOM_REQUEST_COOLDOWN_MS: 0,
              PROMPT_INPUT_SETTLE_MS: 0,
              PROMPT_SUBMIT_SETTLE_MS: 0,
              HUMAN_ACTION_SETTLE_MS: 0,
              SUBMISSION_POLL_MS: 10,
              CLAUDE_UPLOAD_STABLE_MS: 20,
              ATTACHMENT_READY_TIMEOUT_MS: 2000,
              ROOM_DELETE_ACTION_TIMEOUT_MS: 150,
            };
            for (const [key, value] of Object.entries(timing)) {
              contents = contents.replace(new RegExp(CT.CONFIG_NUMBER_PATTERN(key)), CT.CONFIG_NUMBER_OVERRIDE(key, value));
            }
            return { contents, loader: CT.TS, resolveDir: path.dirname(args.path) };
          });
          builder.onResolve({ filter: RT.PATTERN_MUSICDIAGNOSTICSERVICE_JS }, () => ({ path: CT.FIXTURE_DIAGNOSTICS, namespace: CT.DIAGNOSTICS }));
          builder.onLoad({ filter: RT.PATTERN_EMPTY, namespace: CT.DIAGNOSTICS }, () => ({ contents: CT.DIAGNOSTICS_SERVICE_FIXTURE, loader: CT.JS }));
        },
      },
    ],
  });
  const workspaceBundle = path.resolve(CT.SERVICE_BUNDLE_PATH(process.pid));
  await mkdir(path.dirname(workspaceBundle), { recursive: true });
  await writeFile(workspaceBundle, bundle.outputFiles[0].text);
  try {
    const service = await import(pathToFileURL(workspaceBundle).href + CT.FORMAT_RUN(Date.now()));
    const request = (projectId: string, requestId: string, chromeHeadless = true) => ({ provider, model: AiPlanningChatModel.ClaudeAuto, projectId, chromeHeadless, requestId, artifactType: CT.CLAUDE_TEST, expectedSceneIds: [CT.SCENE_1], prompt: CT.FORMAT_WRITE_THE_SCENE_REQUEST_ID(requestId) });
    await service.prepareChatPlanningRoom(request(CT.PROJECT_A, CT.FIRST));
    assert.equal(modelSelections.length, 0, RT.WARMING_A_ROOM_MUST_NOT_SELECT_A_MODEL_BEFORE_GENERATION_SELECTS_IT);
    assert.equal(pages.length, 1);
    assert.equal(navigations[0], CT.HTTPS_CLAUDE_AI_NEW);
    const first = await service.generatePlanningWithChatUi(request(CT.PROJECT_A, CT.FIRST));
    assert.deepEqual(modelSelections, [AiPlanningChatModel.ClaudeAuto], RT.PREPARE_THEN_SEND_MUST_SELECT_THE_REQUESTED_MODEL_ONLY_ONCE);
    assert.equal(JSON.parse(first.text).requestId, CT.FIRST);
    assert.equal(first.provider, provider);
    const second = await service.generatePlanningWithChatUi(request(CT.PROJECT_A, CT.SECOND));
    assert.equal(modelSelections.length, 2, RT.EACH_NEW_PROMPT_MUST_STILL_CHECK_THE_REQUESTED_MODEL);
    assert.equal(JSON.parse(second.text).requestId, CT.SECOND, CT.DO_NOT_REUSE_AN_OLD_RESPONSE);
    assert.equal(pages.length, 1, CT.REUSE_THE_CURRENT_PROJECT_ROOM);
    const third = await service.generatePlanningWithChatUi(request(CT.PROJECT_B, CT.THIRD));
    assert.equal(modelSelections.length, 3, RT.A_NEW_ROOM_MUST_ALSO_SELECT_THE_REQUESTED_MODEL_ONCE);
    assert.equal(JSON.parse(third.text).requestId, CT.THIRD);
    assert.equal(pages.length, 2, CT.PROJECTS_MUST_GET_DISTINCT_ROOMS);
    await service.closeChatPlanningRoomsForProject({ provider, projectId: CT.PROJECT_A });
    assert.equal(pages[0].isClosed(), true);
    assert.equal(pages[1].isClosed(), false);
    assert.equal(await service.closeChatBrowserIfIdle(), false, CT.A_CLAUDE_ROOM_KEEPS_THE_BROWSER_ACTIVE);
    await service.closeChatPlanningRoomsForProject({ provider, projectId: CT.PROJECT_B });
    assert.equal(await service.closeChatBrowserIfIdle(), true);
    mode = CT.LOGIN;
    await assert.rejects(service.prepareChatPlanningRoom(request(CT.LOGIN, CT.LOGIN)), RT.PATTERN_CLAUDE_LOGIN_REQUIRED);
    await service.closeChatPlanningRoomsForProject({ provider, projectId: CT.LOGIN });
    mode = CT.VISIBLE_LOGIN;
    await service.prepareChatPlanningRoom(request(CT.VISIBLE, CT.VISIBLE, false));
    await service.closeChatPlanningRoomsForProject({ provider, projectId: CT.VISIBLE });
    mode = CT.LIMITED;
    await assert.rejects(service.generatePlanningWithChatUi(request(CT.LIMITED, CT.LIMITED)), RT.PATTERN_CLAUDE_DA_HET_LUOT);
    assert.equal(await pages.at(-1)!.evaluate(() => (window as any).sent), 0);
    await service.closeChatPlanningRoomsForProject({ provider, projectId: CT.LIMITED });
    mode = CT.INVALID_JSON;
    await assert.rejects(service.generatePlanningWithChatUi({ ...request(CT.INVALID_JSON, CT.INVALID_JSON), artifactType: undefined, requestId: undefined, expectedSceneIds: [] }), RT.PATTERN_CHAT_PLANNING_INVALID_JSON_RESPONSE);
    await service.closeChatPlanningRoomsForProject({ provider, projectId: CT.INVALID_JSON });
    mode = CT.CODE_ARRAY;
    const array = await service.generatePlanningWithChatUi({ ...request(CT.CODE_ARRAY, CT.CODE_ARRAY), artifactType: undefined, requestId: undefined, expectedSceneIds: [] });
    assert.deepEqual(JSON.parse(array.text), [{ id: CT.ONE }, { id: CT.TWO }], CT.READ_EXACT_JSON_FROM_CLAUDE_S_CODE_BLOCK_INCLUDING_TOP_LEVEL_ARRAYS);
    await service.closeChatPlanningRoomsForProject({ provider, projectId: CT.CODE_ARRAY });
    mode = CT.READY;
    const imageRequest = request(CT.IMAGE, CT.IMAGE);
    const uploadStart = uploadRequests.length;
    const imageResult = await service.generatePlanningWithChatUi({ ...imageRequest, attachments: [{ name: CT.SAMPLE_PNG, mimeType: CT.IMAGE_PNG, buffer: png }] });
    assert.equal(JSON.parse(imageResult.text).requestId, CT.IMAGE);
    assert.equal(uploadRequests.length, uploadStart + 1);
    assert.ok(uploadRequests.at(-1)!.body.includes(png), CT.UPLOAD_THE_EXACT_IMAGE_BYTES);
    const imagePage = pages.at(-1)!;
    assert.equal(await imagePage.evaluate(() => (window as any).sent), 1);
    assert.ok((await imagePage.evaluate(() => (window as any).sentAt)) >= uploadRequests.at(-1)!.finishedAt, CT.NEVER_SUBMIT_WHILE_UPLOAD_IS_PENDING);
    await service.closeChatPlanningRoomsForProject({ provider, projectId: CT.IMAGE });
    const localImage = path.resolve(CT.IMAGE_FIXTURE_PATH(process.pid));
    await writeFile(localImage, png);
    try {
      const local = await service.generatePlanningWithChatUi({ ...request(CT.LOCAL, CT.LOCAL), attachments: [{ name: CT.LOCAL_PNG, mimeType: CT.IMAGE_PNG, path: localImage }] });
      assert.equal(JSON.parse(local.text).requestId, CT.LOCAL);
      await service.closeChatPlanningRoomsForProject({ provider, projectId: CT.LOCAL });
      mode = CT.STALE_UPLOAD;
      const multiStart = uploadRequests.length;
      const multi = await service.generatePlanningWithChatUi({
        ...request(CT.MULTI, CT.MULTI),
        attachments: [
          { name: CT.LOCAL_PNG, mimeType: CT.IMAGE_PNG, path: localImage },
          { name: CT.ANH_MAU_PNG, mimeType: CT.IMAGE_PNG, buffer: png },
        ],
      });
      assert.equal(JSON.parse(multi.text).requestId, CT.MULTI);
      assert.equal(uploadRequests.length, multiStart + 2, CT.SEND_ALL_LOCAL_PATH_AND_BUFFERED_ATTACHMENTS);
      assert.equal(await pages.at(-1)!.evaluate(() => (window as any).sent), 1);
      await service.closeChatPlanningRoomsForProject({ provider, projectId: CT.MULTI });
      const staleTextOnly = await service.generatePlanningWithChatUi(request(CT.STALE_TEXT_ONLY, CT.STALE_TEXT_ONLY));
      assert.equal(JSON.parse(staleTextOnly.text).requestId, CT.STALE_TEXT_ONLY);
      assert.equal(await pages.at(-1)!.evaluate(() => (window as any).sentAttachmentCount), 0, CT.CLEAR_AN_INHERITED_DRAFT_ATTACHMENT_EVEN_FOR_TEXT_ONLY_REQUESTS);
      await service.closeChatPlanningRoomsForProject({ provider, projectId: CT.STALE_TEXT_ONLY });
    } finally {
      await rm(localImage, { force: true });
    }
    mode = CT.MENU_UPLOAD;
    const menu = await service.generatePlanningWithChatUi({ ...request(CT.MENU, CT.MENU), attachments: [{ name: CT.SAMPLE_PNG, mimeType: CT.IMAGE_PNG, buffer: png }] });
    assert.equal(JSON.parse(menu.text).requestId, CT.MENU, CT.OPEN_THE_ATTACHMENT_MENU_AND_USE_THE_NATIVE_FILE_CHOOSER);
    await service.closeChatPlanningRoomsForProject({ provider, projectId: CT.MENU });
    mode = CT.READY;
    const documentResult = await service.generatePlanningWithChatUi({ ...request(CT.DOCUMENT, CT.DOCUMENT), attachments: [{ name: CT.NOTES_TXT, mimeType: CT.TEXT_PLAIN, buffer: Buffer.from(CT.CLAUDE_UPLOAD_TEST_DOCUMENT) }] });
    assert.equal(JSON.parse(documentResult.text).requestId, CT.DOCUMENT);
    assert.ok(uploadRequests.at(-1)!.body.includes(Buffer.from(CT.CLAUDE_UPLOAD_TEST_DOCUMENT)));
    await service.closeChatPlanningRoomsForProject({ provider, projectId: CT.DOCUMENT });
    for (const failureMode of [CT.UPLOAD_FAILED, CT.MISSING_PREVIEW, CT.WRONG_FILENAME] as const) {
      mode = failureMode;
      await assert.rejects(service.generatePlanningWithChatUi({ ...request(failureMode, failureMode), attachments: [{ name: CT.NOTES_TXT, mimeType: CT.TEXT_PLAIN, buffer: Buffer.from(CT.UPLOAD_FAILURE_TEST) }] }), RT.PATTERN_CLAUDE_ATTACHMENT_S_NOT_READY_UPLOAD_FAILED);
      assert.equal(await pages.at(-1)!.evaluate(() => (window as any).sent), 0, CT.FORMAT_MUST_BLOCK_SENDING(failureMode));
      await service.closeChatPlanningRoomsForProject({ provider, projectId: failureMode });
    }
    mode = CT.READY;
    const uploadAbort = new AbortController();
    await service.prepareChatPlanningRoom(request(CT.UPLOAD_CANCEL, CT.UPLOAD_CANCEL));
    const uploadPage = pages.at(-1)!;
    const uploading = service.generatePlanningWithChatUi({ ...request(CT.UPLOAD_CANCEL, CT.UPLOAD_CANCEL), attachments: [{ name: CT.SAMPLE_PNG, mimeType: CT.IMAGE_PNG, buffer: png }], signal: uploadAbort.signal });
    const uploadRejected = assert.rejects(uploading, RT.PATTERN_CHAT_PLANNING_CANCELLED);
    await uploadPage.locator(CT.ROLE_PROGRESSBAR).waitFor({ state: CT.VISIBLE });
    const uploadClosed = uploadPage.waitForEvent(CT.CLOSE);
    uploadAbort.abort();
    await uploadRejected;
    assert.equal(uploadPage.isClosed(), true, CT.CANCEL_AN_UPLOAD_WITHOUT_SUBMITTING);
    await uploadClosed;
    mode = CT.PENDING;
    const abort = new AbortController();
    await service.prepareChatPlanningRoom(request(CT.CANCEL, CT.CANCEL));
    const cancelPage = pages.at(-1)!;
    const pending = service.generatePlanningWithChatUi({ ...request(CT.CANCEL, CT.CANCEL), signal: abort.signal });
    const rejected = assert.rejects(pending, RT.PATTERN_CHAT_PLANNING_CANCELLED);
    await cancelPage.waitForFunction(() => (window as any).sent === 1);
    const cancelClosed = cancelPage.waitForEvent(CT.CLOSE);
    abort.abort();
    await rejected;
    assert.equal(cancelPage.isClosed(), true, CT.CANCELLATION_CLOSES_ONLY_THE_TASK_ROOM);
    await cancelClosed;
    const ui = await build({ stdin: { contents: CT.SETTINGS_UI_FIXTURE, loader: CT.TSX, resolveDir: process.cwd() }, write: false, bundle: true, platform: CT.BROWSER, format: CT.IIFE, jsx: CT.AUTOMATIC });
    const uiPage = await originalNewPage();
    await uiPage.setContent(CT.DIV_ID_ROOT_DIV);
    await uiPage.addScriptTag({ content: ui.outputFiles[0].text });
    await uiPage.locator(CT.SELECT).first().selectOption(provider);
    await uiPage.waitForFunction(
      (sharedBrowserPayload) => {
        const { CT } = sharedBrowserPayload.sharedTexts;
        return document.querySelector(CT.OUTPUT)?.textContent === CT.CLAUDE_CHAT_CLAUDE_AUTO_ROOM_ONLY;
      },
      { sharedTexts: { CT: { OUTPUT: CT.OUTPUT, CLAUDE_CHAT_CLAUDE_AUTO_ROOM_ONLY: CT.CLAUDE_CHAT_CLAUDE_AUTO_ROOM_ONLY } } },
    );
    assert.equal(await uiPage.locator(CT.SELECT).nth(1).inputValue(), AiPlanningChatModel.ClaudeAuto);
    assert.ok((await uiPage.locator(CT.BODY).innerText()).includes(CT.CLAUDE_HIEN_TRINH_DUYET));
    assert.ok((await uiPage.locator(CT.BODY).innerText()).includes(CT.MOI_DU_AN_DUNG_PHONG_RIENG));
    assert.equal(await uiPage.locator(CT.SELECT).nth(1).locator(CT.OPTION).count(), 14, CT.INCLUDE_ALL_13_DISCOVERED_MODELS_AND_THE_CURRENT_MODEL_DEFAULT);
    await uiPage.locator(CT.SELECT).nth(1).selectOption(AiPlanningChatModel.ClaudeHaiku55);
    const effort = uiPage.getByRole(CT.COMBOBOX, { name: CT.MUC_DO_NO_LUC, exact: true });
    await effort.selectOption(CT.HIGH);
    await uiPage.waitForFunction(
      (sharedBrowserPayload) => {
        const { CT } = sharedBrowserPayload.sharedTexts;
        return document.querySelector(CT.OUTPUT)?.textContent === CT.CLAUDE_CHAT_CLAUDE_HAIKU_5_5_HIGH_ROOM_ONLY;
      },
      { sharedTexts: { CT: { OUTPUT: CT.OUTPUT, CLAUDE_CHAT_CLAUDE_HAIKU_5_5_HIGH_ROOM_ONLY: CT.CLAUDE_CHAT_CLAUDE_HAIKU_5_5_HIGH_ROOM_ONLY } } },
    );
    await uiPage.locator(CT.SELECT).nth(1).selectOption(AiPlanningChatModel.ClaudeSonnet46);
    assert.equal(await effort.inputValue(), CT.HIGH, CT.CARRY_A_SUPPORTED_EFFORT_TO_A_DIFFERENT_CLAUDE_MODEL);
    assert.equal(await effort.locator(CT.OPTION_VALUE_XHIGH).count(), 0, CT.DO_NOT_OFFER_UNSUPPORTED_LEGACY_EFFORT_LEVELS);
    await uiPage.locator(CT.SELECT).nth(1).selectOption(AiPlanningChatModel.ClaudeHaiku45);
    await uiPage.waitForFunction(
      (sharedBrowserPayload) => {
        const { CT } = sharedBrowserPayload.sharedTexts;
        return document.querySelector(CT.OUTPUT)?.textContent === CT.CLAUDE_CHAT_CLAUDE_HAIKU_4_5_20251001_ROOM_ONLY;
      },
      { sharedTexts: { CT: { OUTPUT: CT.OUTPUT, CLAUDE_CHAT_CLAUDE_HAIKU_4_5_20251001_ROOM_ONLY: CT.CLAUDE_CHAT_CLAUDE_HAIKU_4_5_20251001_ROOM_ONLY } } },
    );
    assert.equal(await effort.count(), 0, CT.HIDE_EFFORT_WHEN_THE_MODEL_HAS_NO_NUMERIC_EFFORT_MENU);
    await uiPage.locator(CT.SELECT).first().selectOption(AiPlanningFallbackProvider.GeminiChat);
    await uiPage.waitForFunction(
      (sharedBrowserPayload) => {
        const { CT } = sharedBrowserPayload.sharedTexts;
        return document.querySelector(CT.OUTPUT)?.textContent === CT.GEMINI_CHAT_GEMINI_FLASH_LITE_ROOM_ONLY;
      },
      { sharedTexts: { CT: { OUTPUT: CT.OUTPUT, GEMINI_CHAT_GEMINI_FLASH_LITE_ROOM_ONLY: CT.GEMINI_CHAT_GEMINI_FLASH_LITE_ROOM_ONLY } } },
    );
    await uiPage.locator(CT.SELECT).first().selectOption(provider);
    await uiPage.waitForFunction(
      (sharedBrowserPayload) => {
        const { CT } = sharedBrowserPayload.sharedTexts;
        return document.querySelector(CT.OUTPUT)?.textContent === CT.CLAUDE_CHAT_CLAUDE_AUTO_ROOM_ONLY;
      },
      { sharedTexts: { CT: { OUTPUT: CT.OUTPUT, CLAUDE_CHAT_CLAUDE_AUTO_ROOM_ONLY: CT.CLAUDE_CHAT_CLAUDE_AUTO_ROOM_ONLY } } },
    );
    await uiPage.locator(CT.SELECT).first().selectOption(AiPlanningExecutionMode.ApiOnly);
    assert.equal(await uiPage.locator(CT.SELECT).nth(1).isDisabled(), true);
    await uiPage.close();
    process.stdout.write(CT.CLAUDE_CHAT_ROUTING_NEW_ROOMS_REUSE_FRESH_STREAMED_JSON_LOGIN_LIMITS_AND_CAN);
    process.stdout.write(CT.AI_SETTINGS_CLAUDE_SELECTION_MODEL_RESET_BADGE_LOGIN_GUIDANCE_AND_API_MODE_P);
    process.stdout.write(CT.CLAUDE_ATTACHMENTS_PNG_BYTES_LOCAL_FILES_MULTIPLE_IMAGES_UPLOAD_MENU_FILE_CH);
  } finally {
    await rm(workspaceBundle, { force: true });
  }
} finally {
  delete (globalThis as any).__claudeFixture;
  delete (globalThis as any).__claudeModelSelections;
  await browser.close();
}
