import { RUNTIME_VERIFICATION_TEXTS as RT } from "./runtimeVerificationTexts.ts";
import { GEMINI_VERIFICATION_TEXTS as T, GEMINI_VERIFICATION_FORMATS as F } from "./geminiVerificationTexts.ts";
import assert from "node:assert/strict";
import { build } from "esbuild";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright";
import { GEMINI_CHAT_BASE_MODEL_OPTIONS, GEMINI_CHAT_MODEL_OPTIONS, GEMINI_THINKING_LEVEL_OPTIONS, encodeGeminiChatModel, parseGeminiChatModel } from "../src/constants/geminiChatModels.ts";
import { CINEMATIC_CHAT_PLANNING_CONFIG as CONFIG } from "../src/constants/cinematicConstants.ts";
import { AiPlanningChatModel, AiPlanningExecutionMode, AiPlanningFallbackProvider } from "../src/types.ts";
import { isPlanningChatModel } from "../src/lib/chatPlanningUtils.ts";
import { resolvePipelineAiExecution } from "../src/services/pipelineAiExecutionService.ts";
import { resolveFlowVideoPlanningModel } from "../src/services/flowVideoPlanningModel.ts";
import { selectGeminiThinkingModel } from "../src/server/services/geminiModelService.ts";
const provider = AiPlanningFallbackProvider.GeminiChat;
for (const { value } of GEMINI_CHAT_MODEL_OPTIONS) {
  assert.ok(parseGeminiChatModel(value));
  assert.equal(isPlanningChatModel(value), true);
  assert.equal(resolveFlowVideoPlanningModel(provider, value), value);
  assert.equal(resolvePipelineAiExecution({ planningFallbackProvider: provider, planningChatModel: value, planningExecutionMode: AiPlanningExecutionMode.RoomOnly }, null, true).model, value);
  const saved = JSON.parse(JSON.stringify({ config: { planningFallbackProvider: provider, planningChatModel: value } }));
  assert.equal(resolvePipelineAiExecution({}, saved, true).model, value, T.RELOAD_PRESERVES_GEMINI_MODEL_AND_THINKING_LEVEL);
}
for (const invalid of [T.GEMINI_ARGON_MAX, T.GEMINI_UNKNOWN_LOW, T.GEMINI_ARGON_HIGH_LOW, T.GEMINI_ARGON, T.GEMINI_DEEP_THINK_HIGH, T.CLAUDE_AUTO_LOW]) {
  assert.equal(parseGeminiChatModel(invalid), undefined);
}
const browser = await chromium.launch({ channel: T.CHROME, headless: true });
const page = await browser.newPage();
const waitForOutput = (value: string) => page.waitForFunction(({ selector, value }) => document.querySelector(selector)?.textContent === value, { selector: T.OUTPUT, value });
const originalTimeout = CONFIG.MODEL_PICKER_TIMEOUT_MS;
const originalReadyTimeout = CONFIG.PAGE_READY_TIMEOUT_MS;
(CONFIG as unknown as { MODEL_PICKER_TIMEOUT_MS: number }).MODEL_PICKER_TIMEOUT_MS = 350;
(CONFIG as unknown as { PAGE_READY_TIMEOUT_MS: number }).PAGE_READY_TIMEOUT_MS = 1500;
const resetPicker = async (mode: string = T.READY, english = false, materialMenu = false) => {
  await page.setContent(F.PICKER_HTML(JSON.stringify(mode), JSON.stringify(GEMINI_CHAT_BASE_MODEL_OPTIONS.slice(0, 4)), JSON.stringify(GEMINI_THINKING_LEVEL_OPTIONS.map((option) => ({ ...option, label: english ? option.labelEn : option.label }))), JSON.stringify(materialMenu), english ? T.THINKING_LEVEL : T.THINKING_LABEL, english ? T.SELECTED : T.DA_CHON));
};
try {
  await resetPicker(T.COLLAPSED_PAGE);
  await page.locator("textarea").evaluate((element, value) => {
    (element as HTMLTextAreaElement).value = value;
  }, T.GEMINI_ARGON_HIGH);
  await selectGeminiThinkingModel(page, encodeGeminiChatModel(AiPlanningChatModel.GeminiArgon, T.HIGH));
  assert.equal(await page.locator("textarea").inputValue(), T.GEMINI_ARGON_HIGH);
  assert.equal(await page.evaluate(() => (window as any).level), T.HIGH);
  const rooms = await Promise.all(Array.from({ length: 3 }, () => browser.newPage()));
  try {
    await Promise.all(
      rooms.map(async (room) => {
        await room.setContent(F.PICKER_HTML(JSON.stringify(T.READY), JSON.stringify(GEMINI_CHAT_BASE_MODEL_OPTIONS.slice(0, 4)), JSON.stringify(GEMINI_THINKING_LEVEL_OPTIONS), JSON.stringify(false), T.THINKING_LABEL, T.DA_CHON));
        await selectGeminiThinkingModel(room, encodeGeminiChatModel(AiPlanningChatModel.GeminiArgon, T.HIGH));
        assert.equal(await room.evaluate(() => (window as any).level), T.HIGH);
      }),
    );
  } finally {
    await Promise.all(rooms.map((room) => room.close()));
  }
  await resetPicker(T.READY, false, true);
  await selectGeminiThinkingModel(page, encodeGeminiChatModel(AiPlanningChatModel.GeminiArgon, T.LOW));
  assert.equal(await page.evaluate(() => (window as any).level), T.LOW, T.RECOGNIZE_THE_ALREADY_SELECTED_DA_CHON_THAP_MENU_ITEM);
  await page.evaluate(
    ({ RT }) => {
      (window as any).pickerOpens = 0;
      document.querySelector(RT.BUTTON_DATA_TEST_ID_BARD_MODE_MENU_BUTTON)!.addEventListener(RT.CLICK, () => (window as any).pickerOpens++, true);
    },
    { RT: { BUTTON_DATA_TEST_ID_BARD_MODE_MENU_BUTTON: RT.BUTTON_DATA_TEST_ID_BARD_MODE_MENU_BUTTON, CLICK: RT.CLICK } },
  );
  await selectGeminiThinkingModel(page, encodeGeminiChatModel(AiPlanningChatModel.GeminiArgon, T.LOW));
  assert.equal(await page.evaluate(() => (window as any).pickerOpens), 1, RT.AN_ALREADY_SELECTED_THINKING_LEVEL_MUST_NOT_REOPEN_ITS_MENU_FOR_VERIFI);
  assert.equal(await page.getByRole(T.MENU).count(), 0);
  for (const level of [T.HIGH, T.MEDIUM, T.LOW] as const) {
    await selectGeminiThinkingModel(page, encodeGeminiChatModel(AiPlanningChatModel.GeminiArgon, level));
    assert.equal(await page.evaluate(() => (window as any).level), level, T.VERIFY_A_SELECTION_AFTER_GEMINI_ADDS_ITS_SELECTED_ICON_ACCESSIBLE_LABEL);
  }
  await resetPicker(T.READY, true, true);
  await selectGeminiThinkingModel(page, encodeGeminiChatModel(AiPlanningChatModel.GeminiArgon, T.LOW));
  await resetPicker();
  for (const model of GEMINI_CHAT_BASE_MODEL_OPTIONS.slice(0, 4)) {
    for (const level of GEMINI_THINKING_LEVEL_OPTIONS) {
      await selectGeminiThinkingModel(page, encodeGeminiChatModel(model.value, level.value));
      assert.deepEqual(await page.evaluate(() => ({ model: (window as any).current, level: (window as any).level })), { model: model.value, level: level.value });
      assert.equal(await page.getByRole(T.MENU).count(), 0, T.CLOSE_THE_PICKER_AFTER_VERIFICATION);
    }
  }
  await resetPicker(T.READY, true);
  await selectGeminiThinkingModel(page, encodeGeminiChatModel(AiPlanningChatModel.GeminiArgon, T.HIGH));
  assert.equal(await page.evaluate(() => (window as any).level), T.HIGH);
  for (const mode of [T.MISSING, T.DISABLED, T.IGNORE_LEVEL, T.IGNORE_MODEL]) {
    await resetPicker(mode);
    const base = mode === T.IGNORE_MODEL ? AiPlanningChatModel.GeminiPro : AiPlanningChatModel.GeminiArgon;
    await assert.rejects(selectGeminiThinkingModel(page, encodeGeminiChatModel(base, T.HIGH)), mode === T.DISABLED ? T.PATTERN_GEMINI_THINKING_UNAVAILABLE : T.PATTERN_GEMINI_UI_NOT_READY, mode);
    assert.equal(await page.getByRole(T.MENU).count(), 0, T.CLOSE_THE_PICKER_AFTER_FAILURE);
  }
  for (const mode of [T.DELAYED_PAGE, T.LATE_PAGE, T.DELAYED_LEVEL, T.TRANSIENT_MENU]) {
    await resetPicker(mode);
    await selectGeminiThinkingModel(page, encodeGeminiChatModel(AiPlanningChatModel.GeminiFlash, T.HIGH));
    assert.deepEqual(await page.evaluate(() => ({ model: (window as any).current, level: (window as any).level, premature: (window as any).prematureOpens })), { model: AiPlanningChatModel.GeminiFlash, level: T.HIGH, premature: 0 });
    assert.equal(await page.getByRole(T.MENU).count(), 0);
  }
  await resetPicker(T.NOT_READY);
  await assert.rejects(selectGeminiThinkingModel(page, encodeGeminiChatModel(AiPlanningChatModel.GeminiFlash, T.HIGH)), T.PATTERN_GEMINI_UI_NOT_READY);
  assert.equal(await page.evaluate(() => (window as any).menuAttempts), 0);
  const abort = new AbortController();
  abort.abort();
  await assert.rejects(selectGeminiThinkingModel(page, encodeGeminiChatModel(AiPlanningChatModel.GeminiArgon, T.HIGH), abort.signal), T.PATTERN_CHAT_PLANNING_CANCELLED);
  const ui = await build({ stdin: { contents: T.UI_ENTRY, loader: T.TSX, resolveDir: process.cwd() }, bundle: true, write: false, platform: T.BROWSER, format: T.IIFE, jsx: T.AUTOMATIC, define: { "import.meta": T.EMPTY } });
  await page.route(T.SETTINGS_ROUTE, (route) => route.fulfill({ contentType: T.TEXT_HTML, body: T.ROOT_HTML }));
  const mount = async () => {
    await page.goto(T.SETTINGS_URL);
    await page.addScriptTag({ content: ui.outputFiles[0].text });
    await page.getByRole(T.COMBOBOX, { name: T.THINKING_LABEL, exact: true }).waitFor();
  };
  await mount();
  const modelControl = page.getByRole(T.COMBOBOX, { name: T.MODEL_LABEL, exact: true });
  const levelControl = page.getByRole(T.COMBOBOX, { name: T.THINKING_LABEL, exact: true });
  assert.equal(await modelControl.inputValue(), AiPlanningChatModel.GeminiArgon);
  assert.deepEqual(await levelControl.locator(T.OPTION).allTextContents(), [T.THEO_GEMINI, T.THAP, T.TRUNG_BINH, T.CAO]);
  await levelControl.selectOption(T.HIGH);
  await waitForOutput(T.GEMINI_ARGON_HIGH);
  await modelControl.selectOption(AiPlanningChatModel.GeminiPro);
  assert.equal(await levelControl.inputValue(), T.HIGH, T.KEEP_THE_LEVEL_WHEN_CHANGING_THE_BASE_MODEL);
  await waitForOutput(T.GEMINI_PRO_HIGH);
  await mount();
  assert.equal(await modelControl.inputValue(), AiPlanningChatModel.GeminiPro);
  assert.equal(await levelControl.inputValue(), T.HIGH, T.RELOAD_RESTORES_THE_LEVEL_WITHOUT_RESETTING_THE_MODEL);
  await levelControl.selectOption(T.EMPTY_2);
  await waitForOutput(T.GEMINI_PRO);
  await modelControl.selectOption(AiPlanningChatModel.GeminiDeepThink);
  assert.equal(await levelControl.count(), 0, T.PRESERVE_LEGACY_DEEP_THINK_WITHOUT_CONFLICTING_NUMERIC_LEVELS);
  await modelControl.selectOption(AiPlanningChatModel.GeminiArgon);
  await page.locator(T.SELECT).first().selectOption(AiPlanningExecutionMode.ApiOnly);
  assert.equal(await levelControl.isDisabled(), true);
  await page.locator(T.SELECT).first().selectOption(AiPlanningFallbackProvider.GrokChat);
  assert.equal(await levelControl.count(), 0, T.OTHER_PROVIDERS_DO_NOT_SHOW_GEMINI_THINKING_CONTROLS);
  const motionBundle = await build({
    entryPoints: [T.SRC_SERVER_SERVICES_MOTIONSTORYSERVICE_TS],
    bundle: true,
    write: false,
    platform: T.NODE,
    format: T.ESM,
    packages: T.EXTERNAL,
    plugins: [
      {
        name: T.ISOLATED_GEMINI_ROOM,
        setup(builder) {
          builder.onResolve({ filter: T.PATTERN_CHATUIPLANNINGSERVICE_JS }, () => ({ path: T.ROOM, namespace: T.GEMINI_TEST }));
          builder.onResolve({ filter: T.API_IMPORT }, () => ({ path: T.API_FILE, namespace: T.GEMINI_TEST }));
          builder.onLoad({ filter: T.PATTERN_EMPTY, namespace: T.GEMINI_TEST }, (args) => ({ loader: T.JS, contents: args.path === T.API_FILE ? T.API_STUB : T.ROOM_STUB }));
        },
      },
    ],
  });
  fs.mkdirSync(T.SCRATCH, { recursive: true });
  const bundlePath = path.resolve(F.MOTION_BUNDLE_PATH(process.pid));
  const room = { calls: [] as { stage: string; model: string }[], fail: false, apiCalls: 0 };
  (globalThis as any).__geminiRoomTest = room;
  const previousStorage = process.env.VIDIFY_STORAGE_DIR;
  process.env.VIDIFY_STORAGE_DIR = path.resolve(T.STORAGE(process.pid));
  try {
    fs.writeFileSync(bundlePath, motionBundle.outputFiles[0].text);
    const motion = await import(pathToFileURL(bundlePath).href);
    const model = encodeGeminiChatModel(AiPlanningChatModel.GeminiArgon, T.MEDIUM);
    const execution = { provider, model, mode: AiPlanningExecutionMode.RoomOnly };
    assert.deepEqual(await motion.runInMotionAiSession(T.GEMINI_THINKING_TEST, () => motion.runMotionAi(T.TEST, T.TEST, execution)), { ok: true });
    assert.deepEqual(
      room.calls,
      [
        { stage: T.PREPARE, model },
        { stage: T.SEND, model },
      ],
      T.MOTION_PRESERVES_THE_SELECTED_LEVEL_THROUGH_PREPARE_AND_SEND,
    );
    room.fail = true;
    room.calls = [];
    await assert.rejects(motion.runMotionAi(T.TEST, T.TEST, { ...execution, strictProvider: true, mode: AiPlanningExecutionMode.Hybrid }), T.PATTERN_GEMINI_THINKING_UNAVAILABLE);
    assert.equal(room.calls.length, 2, T.AN_UNAVAILABLE_EXPLICIT_LEVEL_MUST_NOT_FALL_BACK_TO_ANOTHER_MODEL_OR_API);
    assert.ok(room.calls.every((call) => call.model === model));
    assert.equal(room.apiCalls, 0);
  } finally {
    if (previousStorage === undefined) delete process.env.VIDIFY_STORAGE_DIR;
    else process.env.VIDIFY_STORAGE_DIR = previousStorage;
    delete (globalThis as any).__geminiRoomTest;
    fs.rmSync(bundlePath, { force: true });
  }
  process.stdout.write(T.PASSED);
} finally {
  (CONFIG as unknown as { MODEL_PICKER_TIMEOUT_MS: number }).MODEL_PICKER_TIMEOUT_MS = originalTimeout;
  (CONFIG as unknown as { PAGE_READY_TIMEOUT_MS: number }).PAGE_READY_TIMEOUT_MS = originalReadyTimeout;
  await browser.close();
}
