import { RUNTIME_VERIFICATION_TEXTS as RT, RUNTIME_VERIFICATION_FORMATS as RF } from "./runtimeVerificationTexts.ts";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { build } from "esbuild";
import { chromium } from "playwright";
import { API_ROUTES } from "../src/constants/apiRoutes.ts";
import { CINEMATIC_SETUP_TEXTS } from "../src/constants/texts.ts";
import { MOTION_AI_SETTINGS_TEXT } from "../src/constants/motionSceneLibrary.ts";
import { MOTION_VIDEO_TEXTS } from "../src/constants/motionVideoTexts.js";
import { MOTION_VOICE_LIBRARY } from "../src/constants/motionVoice.ts";
import { encodeGeminiChatModel } from "../src/constants/geminiChatModels.ts";
import { AiPlanningChatModel, AiPlanningFallbackProvider, AiPlanningExecutionMode } from "../src/types.ts";
import { motionSceneAiExecution, motionMainAiExecution } from "../src/lib/motionSceneAi.ts";
const mainModel = encodeGeminiChatModel(AiPlanningChatModel.GeminiFlash, RT.LOW);
const selectedModel = encodeGeminiChatModel(AiPlanningChatModel.GeminiArgon, RT.HIGH);
const original = { aiProvider: AiPlanningFallbackProvider.GeminiChat, aiModel: mainModel, aiMode: AiPlanningExecutionMode.RoomOnly, aiHeadless: false };
assert.equal(motionSceneAiExecution(original).provider, AiPlanningFallbackProvider.ChatGptUi);
const choice = { ...original, sceneAiProvider: AiPlanningFallbackProvider.GeminiChat, sceneAiModel: selectedModel, sceneAiHeadless: true };
assert.equal(motionSceneAiExecution(choice).model, selectedModel);
assert.deepEqual(motionMainAiExecution(choice), motionMainAiExecution(original));
const script = { title: RT.SCENE_SETTINGS, language: RT.VI, beats: [{ id: RT.B1, visual: RT.SCENE, place: RT.YARD, narration: RT.TEST_SCENE }], gen: { cast: {}, locations: {}, staging: {}, previews: {}, failed: [] } };
const initial = { ...original, rawText: RT.TEST_STORY_SOURCE, autoExport: true, autoContinue: false, analysis: { title: script.title, logline: RT.TEST_2, cast: [], places: [], chapters: [], facts: [] }, script };
const bundle = await build({ stdin: { loader: RT.TSX, resolveDir: process.cwd(), contents: RF.SCENE_SETTINGS_ENTRY(JSON.stringify(initial)) }, bundle: true, platform: RT.BROWSER, format: RT.IIFE, write: false, define: { "import.meta": RT.EMPTY_2 } });
const cssName = fs.readdirSync(RT.DIST_ASSETS).find((name) => RT.PATTERN_INDEX_CSS.test(name));
const css = cssName ? fs.readFileSync(path.join(RT.DIST_ASSETS, cssName), RT.UTF8) : RT.EMPTY;
const browser = await chromium.launch({ channel: RT.CHROME, headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 660 } });
  const errors: string[] = [],
    unexpected: string[] = [],
    requests: any[] = [];
  page.on(RT.PAGEERROR, (error) => errors.push(error.message));
  const job = { id: RT.DRAWING_CONFIG_FIXTURE, kind: RT.SCENES, status: RT.COMPLETED, progress: 1, log: [], startedAt: Date.now(), result: script };
  await page.route(RT.HTTP_MOTION_SETTINGS_TEST, async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname === RT.EMPTY_3) return route.fulfill({ contentType: RT.TEXT_HTML, body: RF.SCENE_SETTINGS_DOCUMENT(css, bundle.outputFiles[0].text) });
    if (url.pathname === MOTION_VOICE_LIBRARY.CHANNELS_URL) return route.fulfill({ json: { channels: [] } });
    if (url.pathname === API_ROUTES.MOTION_VIDEO_RESULTS) return route.fulfill({ json: { items: [] } });
    if (url.pathname === API_ROUTES.MOTION_STORY_SCENES) {
      requests.push(route.request().postDataJSON());
      return route.fulfill({ json: { job } });
    }
    if (url.pathname === API_ROUTES.MOTION_STORY_STATUS + job.id) return route.fulfill({ json: { job } });
    if (url.pathname.startsWith(API_ROUTES.MOTION_STORY_STATUS)) return route.fulfill({ status: 404, json: { error: "Fixture has no previous production job" } });
    if (url.pathname.startsWith(API_ROUTES.MOTION_STORY_LOGS)) return route.fulfill({ json: { lines: [], next: 0, total: 0 } });
    unexpected.push(url.pathname);
    return route.fulfill({ status: 500, json: { error: RT.UNEXPECTED_REQUEST } });
  });
  await page.goto(RT.HTTP_MOTION_SETTINGS_TEST_2);
  await page.waitForFunction(({ RT }) => (window as any).sceneSettingsFixture?.state.rawText === RT.TEST_STORY_SOURCE, { RT: { TEST_STORY_SOURCE: RT.TEST_STORY_SOURCE } });
  const main = page.getByRole(RT.REGION, { name: MOTION_AI_SETTINGS_TEXT.vi.MAIN_TITLE, exact: true });
  const drawing = page.getByRole(RT.REGION, { name: MOTION_AI_SETTINGS_TEXT.vi.DRAW_TITLE, exact: true });
  const text = CINEMATIC_SETUP_TEXTS.vi;
  assert.equal(await main.getByRole(RT.COMBOBOX, { name: text.PLANNING_MODEL_LABEL, exact: true }).inputValue(), AiPlanningChatModel.GeminiFlash);
  assert.equal(await drawing.getByRole(RT.COMBOBOX, { name: text.PLANNING_AI_LABEL, exact: true }).inputValue(), AiPlanningFallbackProvider.ChatGptUi);
  assert.equal(await drawing.getByRole(RT.COMBOBOX, { name: text.PLANNING_CHROME_LABEL, exact: true }).inputValue(), RT.VISIBLE, RT.OLDER_DRAFTS_KEEP_THEIR_PREVIOUS_BROWSER_VISIBILITY_SETTING);
  assert.equal(await drawing.locator(RF.OPTION_SELECTOR(AiPlanningExecutionMode.ApiOnly)).count(), 0);
  await drawing.getByRole(RT.COMBOBOX, { name: text.PLANNING_AI_LABEL, exact: true }).selectOption(AiPlanningFallbackProvider.GeminiChat);
  await drawing.getByRole(RT.COMBOBOX, { name: text.PLANNING_MODEL_LABEL, exact: true }).selectOption(AiPlanningChatModel.GeminiArgon);
  await drawing.getByRole(RT.COMBOBOX, { name: text.GEMINI_THINKING_LEVEL_LABEL, exact: true }).selectOption(RT.HIGH);
  await drawing.getByRole(RT.COMBOBOX, { name: text.PLANNING_CHROME_LABEL, exact: true }).selectOption(RT.HIDDEN);
  await main.getByRole(RT.COMBOBOX, { name: text.GEMINI_THINKING_LEVEL_LABEL, exact: true }).selectOption(RT.MEDIUM);
  assert.equal(await drawing.getByRole(RT.COMBOBOX, { name: text.GEMINI_THINKING_LEVEL_LABEL, exact: true }).inputValue(), RT.HIGH, RT.CHANGING_CONTENT_AI_MUST_NOT_CHANGE_SCENE_AI);
  await main.getByRole(RT.COMBOBOX, { name: text.GEMINI_THINKING_LEVEL_LABEL, exact: true }).selectOption(RT.LOW);
  let saved: any;
  for (let attempt = 0; attempt < 60; attempt++) {
    saved = await page.evaluate(() => (window as any).sceneSettingsFixture.saved());
    if (saved.sceneAiModel === selectedModel && saved.sceneAiHeadless === true && saved.aiModel === mainModel) break;
    await page.waitForTimeout(100);
  }
  assert.equal(saved.sceneAiModel, selectedModel);
  assert.equal(saved.aiModel, mainModel);
  assert.equal(saved.aiHeadless, false);
  assert.equal(saved.sceneAiHeadless, true);
  await page.reload();
  await page.waitForFunction(({ RT }) => (window as any).sceneSettingsFixture?.state.sceneAiModel === RT.GEMINI_ARGON_HIGH, { RT: { GEMINI_ARGON_HIGH: RT.GEMINI_ARGON_HIGH } });
  assert.equal(await drawing.getByRole(RT.COMBOBOX, { name: text.GEMINI_THINKING_LEVEL_LABEL, exact: true }).inputValue(), RT.HIGH);
  assert.equal(await drawing.getByRole(RT.COMBOBOX, { name: text.PLANNING_CHROME_LABEL, exact: true }).inputValue(), RT.HIDDEN);
  const drawingResponse = page.waitForResponse((response) => response.url().includes(API_ROUTES.MOTION_STORY_STATUS));
  await page.getByRole(RT.BUTTON, { name: RT.TEST_DRAWING_REQUEST }).click();
  await drawingResponse;
  assert.equal(requests.length, 1);
  assert.deepEqual(requests[0].aiExecution, motionSceneAiExecution(choice));
  assert.deepEqual(requests[0].mainAiExecution, motionMainAiExecution(original));
  await page.getByRole(RT.BUTTON, { name: RT.TEST_DRAWING_REQUEST }).waitFor();
  fs.mkdirSync(path.resolve(RT.SCRATCH), { recursive: true });
  await page.getByTestId(RT.SETTINGS).screenshot({ path: path.resolve(RT.SCRATCH_MOTION_SCENE_AI_SETTINGS_PNG) });
  const review = page.getByRole("switch", { name: MOTION_VIDEO_TEXTS.vi.AI_REVIEW, exact: true });
  assert.equal(requests[0].review, true);
  await review.click();
  await page.waitForFunction(async ({ key }) => (await (window as any).sceneSettingsFixture.saved()).aiReview === false, { key: MOTION_VIDEO_TEXTS.vi.AI_REVIEW });
  await page.reload();
  await page.waitForFunction(() => (window as any).sceneSettingsFixture?.state.aiReview === false);
  const secondResponse = page.waitForResponse((response) => response.url().includes(API_ROUTES.MOTION_STORY_STATUS));
  await page.getByRole(RT.BUTTON, { name: RT.TEST_DRAWING_REQUEST }).click();
  await secondResponse;
  assert.equal(requests[1].review, false);
  await page.getByRole(RT.BUTTON, { name: RT.TEST_DRAWING_REQUEST }).waitFor();
  await review.click();
  await page.waitForFunction(() => (window as any).sceneSettingsFixture?.state.aiReview === true);
  assert.deepEqual(unexpected, []);
  assert.deepEqual(errors, []);
  process.stdout.write(RT.MOTION_SCENE_AI_SETTINGS_PASSED_SEPARATE_PROVIDER_MODEL_THINKING_BROWS + RT.NEWLINE);
} finally {
  await browser.close();
}
