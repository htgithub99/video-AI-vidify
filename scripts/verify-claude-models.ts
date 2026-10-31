import { RUNTIME_VERIFICATION_TEXTS as RT } from "./runtimeVerificationTexts.ts";
import { CLAUDE_VERIFICATION_TEXTS as CT } from "./claudeVerificationTexts.js";
import assert from "node:assert/strict";
import { chromium } from "playwright";
import { CLAUDE_CHAT_MODELS, CLAUDE_CHAT_MODEL_OPTIONS, encodeClaudeChatModel, parseClaudeChatModel } from "../src/constants/claudeChatModels.ts";
import { CINEMATIC_CHAT_PLANNING_CONFIG as CONFIG } from "../src/constants/cinematicConstants.ts";
import { AiPlanningChatModel, AiPlanningExecutionMode, AiPlanningFallbackProvider } from "../src/types.ts";
import { resolvePipelineAiExecution } from "../src/services/pipelineAiExecutionService.ts";
import { resolveFlowVideoPlanningModel } from "../src/services/flowVideoPlanningModel.ts";
import { selectClaudeChatModel } from "../src/server/services/claudeModelService.ts";
import { CHAT_PLANNING_RUNTIME as C } from "../src/constants/chatPlanningRuntime.ts";
assert.equal(CLAUDE_CHAT_MODELS.length, 13);
for (const { value } of CLAUDE_CHAT_MODEL_OPTIONS) {
  assert.ok(parseClaudeChatModel(value));
  assert.equal(resolveFlowVideoPlanningModel(AiPlanningFallbackProvider.ClaudeChat, value), value);
  assert.equal(resolvePipelineAiExecution({ planningFallbackProvider: AiPlanningFallbackProvider.ClaudeChat, planningChatModel: value, planningExecutionMode: AiPlanningExecutionMode.RoomOnly }, null, true).model, value);
  const saved = JSON.parse(JSON.stringify({ config: { planningFallbackProvider: AiPlanningFallbackProvider.ClaudeChat, planningChatModel: value } }));
  assert.equal(resolvePipelineAiExecution({}, saved, true).model, value, CT.PRESERVE_THE_MODEL_AND_EFFORT_WHEN_RELOADING_A_PROJECT);
}
for (const invalid of [CT.INVALID_AUTO_EFFORT, CT.CLAUDE_UNKNOWN, CT.CLAUDE_SONNET_5_5_UNKNOWN, CT.CLAUDE_SONNET_5_5_LOW_MAX, CT.CLAUDE_SONNET_4_6_XHIGH]) assert.equal(parseClaudeChatModel(invalid), undefined);
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const timing = CONFIG as unknown as { MODEL_PICKER_TIMEOUT_MS: number };
const originalTimeout = timing.MODEL_PICKER_TIMEOUT_MS;
timing.MODEL_PICKER_TIMEOUT_MS = 300;
const reset = async (mode: string = CT.READY, effortMenu?: string, effortIds = true) => {
  await page.setContent(CT.MODEL_MENU_FIXTURE(JSON.stringify(CLAUDE_CHAT_MODELS), JSON.stringify(mode), effortMenu, effortIds));
};
try {
  await reset();
  await selectClaudeChatModel(page, encodeClaudeChatModel(AiPlanningChatModel.ClaudeSonnet55, CT.HIGH));
  await page.evaluate(
    ({ CT, RT }) => {
      (window as any).pickerOpens = 0;
      document.querySelector(CT.BUTTON)!.addEventListener(RT.CLICK, () => (window as any).pickerOpens++, true);
    },
    { CT: { BUTTON: CT.BUTTON }, RT: { CLICK: RT.CLICK } },
  );
  await selectClaudeChatModel(page, encodeClaudeChatModel(AiPlanningChatModel.ClaudeSonnet55, CT.HIGH));
  assert.equal(await page.evaluate(() => (window as any).pickerOpens), 1, RT.AN_ALREADY_SELECTED_EFFORT_MUST_NOT_REOPEN_ITS_MENU_FOR_VERIFICATION);
  assert.equal(await page.getByRole(CT.MENU).count(), 0);
  for (const model of CLAUDE_CHAT_MODELS) {
    await selectClaudeChatModel(page, model.value);
    assert.equal(await page.evaluate(() => (window as any).current), model.value);
    for (const effort of model.efforts) {
      await selectClaudeChatModel(page, encodeClaudeChatModel(model.value, effort));
      assert.equal(await page.evaluate(() => (window as any).effort), effort);
    }
  }
  const previous = await page.locator(CT.BUTTON).innerText();
  await selectClaudeChatModel(page, AiPlanningChatModel.ClaudeAuto);
  assert.equal(await page.locator(CT.BUTTON).innerText(), previous);
  for (const mode of [CT.LOCKED, CT.DISABLED, CT.MISSING, CT.IGNORE_MODEL, CT.IGNORE_EFFORT] as const) {
    await reset(mode);
    const model = mode === CT.LOCKED ? AiPlanningChatModel.ClaudeOpus55 : mode === CT.MISSING ? AiPlanningChatModel.ClaudeSonnet5 : mode === CT.IGNORE_EFFORT ? encodeClaudeChatModel(AiPlanningChatModel.ClaudeSonnet55, CT.HIGH) : AiPlanningChatModel.ClaudeHaiku55;
    await assert.rejects(selectClaudeChatModel(page, model), mode === CT.IGNORE_EFFORT ? { code: C.CLAUDE_EFFORT_UNAVAILABLE_CODE } : RT.PATTERN_CLAUDE_MODEL_UNAVAILABLE, mode);
    assert.equal(await page.locator(CT.ROLE_MENU).count(), 0, CT.ALWAYS_DISMISS_MODEL_MENUS_ON_FAILURE);
    assert.equal(await page.evaluate(() => (window as any).upgradeClicks), 0, CT.NEVER_CLICK_UPGRADE_INSTEAD_OF_SELECTING_A_MODEL);
  }
  for (const effortMenu of CT.EFFORT_MENU_LABELS) {
    for (const effortIds of [true, false]) {
      await reset(CT.READY, effortMenu, effortIds);
      for (const effort of CLAUDE_CHAT_MODELS.find((entry) => entry.value === AiPlanningChatModel.ClaudeSonnet55)!.efforts) {
        await selectClaudeChatModel(page, encodeClaudeChatModel(AiPlanningChatModel.ClaudeSonnet55, effort));
        assert.equal(await page.evaluate(() => (window as any).effort), effort);
      }
    }
  }
  for (const mode of [CT.MISSING_EFFORT_MENU, CT.MISSING_EFFORT, CT.DISABLED_EFFORT, CT.ARIA_DISABLED_EFFORT]) {
    await reset(mode);
    await assert.rejects(selectClaudeChatModel(page, encodeClaudeChatModel(AiPlanningChatModel.ClaudeSonnet55, "low")), { code: C.CLAUDE_EFFORT_UNAVAILABLE_CODE, diagnostics: { phase: C.EFFORT_PHASE } });
    assert.equal(await page.evaluate(() => (window as any).effort), "medium");
    assert.equal(await page.getByRole(CT.MENU).count(), 0);
  }
  const abort = new AbortController();
  abort.abort();
  await assert.rejects(selectClaudeChatModel(page, AiPlanningChatModel.ClaudeSonnet55, abort.signal), RT.PATTERN_CHAT_PLANNING_CANCELLED);
  process.stdout.write(CT.CLAUDE_MODELS_ALL_13_MODEL_SELECTIONS_SUPPORTED_EFFORT_LEVELS_EXACT_VERSION);
} finally {
  timing.MODEL_PICKER_TIMEOUT_MS = originalTimeout;
  await browser.close();
}
