import { RUNTIME_VERIFICATION_TEXTS as RT } from "./runtimeVerificationTexts.ts";
import assert from "node:assert/strict";
import fs from "node:fs";
import { MOTION_VISUAL as V } from "../src/constants/motionVisual.js";
import { MOTION_SCENE_COMPOSITION as SCENE } from "../src/constants/motionSceneComposition.js";
import { PRODUCTION_QA } from "./motionProductionVerificationTexts.js";
import { chromium } from "playwright";
import { CINEMATIC_CHAT_PLANNING_CONFIG } from "../src/constants/cinematicConstants.ts";
import { getChatResponseSnapshots, waitForStableResponse } from "../src/server/services/chatUiPlanningService.ts";
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage();
  const selector = CINEMATIC_CHAT_PLANNING_CONFIG.GEMINI_RESPONSE_SELECTOR;
  assert.deepEqual(await getChatResponseSnapshots(page, selector), []);
  await page.setContent(RT.CHATGPT_CURRENT_RESPONSE);
  const currentResponse = { artifactType: RT.MOTION_STORY_CHAPTER, requestId: RT.CURRENT, beats: [] };
  await page.locator(RT.CHATGPT_CONTENT).evaluate((element, text) => {
    element.textContent = text;
  }, JSON.stringify(currentResponse));
  const chatGptSnapshots = await getChatResponseSnapshots(page, CINEMATIC_CHAT_PLANNING_CONFIG.CHATGPT_RESPONSE_SELECTOR);
  assert.equal(chatGptSnapshots.length, 1);
  assert.equal(chatGptSnapshots[0].text, JSON.stringify(currentResponse));
  assert.equal(chatGptSnapshots[0].identity, RT.CHATGPT_MESSAGE_ID);
  await page.locator(RT.CHATGPT_CURRENT_BOUNDARY).evaluate(
    (element, data) => {
      element.setAttribute(data.attribute, data.value);
    },
    { attribute: RT.CHATGPT_VIRTUAL_KEY, value: RT.CHATGPT_VIRTUAL_KEY_NEXT },
  );
  assert.equal((await getChatResponseSnapshots(page, CINEMATIC_CHAT_PLANNING_CONFIG.CHATGPT_RESPONSE_SELECTOR))[0].identity, RT.CHATGPT_MESSAGE_ID);
  const response = { artifactType: RT.MUSIC_IMAGE_PROMPT, requestId: RT.MUSIC_IMAGE_PROMPT_TEST, imagePrompt: RT.A_FINISHED_16_9_PROFESSIONAL_MUSIC_PLAYLIST_COVER };
  const responseText = JSON.stringify(response);
  await page.setContent(RT.MODEL_RESPONSE_MESSAGE_CONTENT_DIV_CLASS_MARKDOWN_DIV_MESSAGE_CONTENT_);
  await page.locator(RT.MARKDOWN).evaluate((element, text) => {
    element.textContent = text;
  }, responseText);
  const snapshots = await getChatResponseSnapshots(page, selector);
  assert.equal(snapshots.length, 1, RT.READ_A_VISIBLE_GEMINI_RESPONSE_WITHOUT_MESSAGE_ATTRIBUTES);
  assert.equal(snapshots[0].text, responseText);
  assert.equal(snapshots[0].identity, RT.EMPTY);
  assert.deepEqual(JSON.parse(snapshots[0].text), response);
  await page.locator(RT.MODEL_RESPONSE).evaluate((element, { RT }) => element.setAttribute(RT.DATA_MESSAGE_ID, RT.GEMINI_RESPONSE_1), { RT: { DATA_MESSAGE_ID: RT.DATA_MESSAGE_ID, GEMINI_RESPONSE_1: RT.GEMINI_RESPONSE_1 } });
  assert.equal((await getChatResponseSnapshots(page, selector))[0].identity, RT.GEMINI_RESPONSE_1);
  await page.locator(RT.MODEL_RESPONSE).evaluate(
    (element, { RT }) => {
      element.removeAttribute(RT.DATA_MESSAGE_ID);
      element.setAttribute(RT.DATA_TESTID, RT.CONVERSATION_TURN_1);
    },
    { RT: { DATA_MESSAGE_ID: RT.DATA_MESSAGE_ID, DATA_TESTID: RT.DATA_TESTID, CONVERSATION_TURN_1: RT.CONVERSATION_TURN_1 } },
  );
  assert.equal((await getChatResponseSnapshots(page, selector))[0].identity, RT.CONVERSATION_TURN_1_0);
  await page.locator(RT.MODEL_RESPONSE).evaluate(
    (element, { RT }) => {
      element.removeAttribute(RT.DATA_TESTID);
    },
    { RT: { DATA_TESTID: RT.DATA_TESTID } },
  );
  await page.locator(RT.MARKDOWN).evaluate(
    (element, { RT }) => {
      element.id = RT.RESPONSE_ID;
    },
    { RT: { RESPONSE_ID: RT.RESPONSE_ID } },
  );
  assert.equal((await getChatResponseSnapshots(page, selector))[0].identity, RT.RESPONSE_ID);
  await page.locator(RT.MODEL_RESPONSE).evaluate(
    (element, { RT }) => {
      element.style.display = RT.NONE;
    },
    { RT: { NONE: RT.NONE } },
  );
  assert.deepEqual(await getChatResponseSnapshots(page, selector), []);
  const original = { ...CINEMATIC_CHAT_PLANNING_CONFIG };
  CINEMATIC_CHAT_PLANNING_CONFIG.UI_READ_TIMEOUT_MS = 20;
  await assert.rejects(getChatResponseSnapshots({ locator: () => ({ evaluateAll: () => new Promise(() => {}) }) } as any, selector), { message: CINEMATIC_CHAT_PLANNING_CONFIG.UI_READ_TIMEOUT_ERROR });
  CINEMATIC_CHAT_PLANNING_CONFIG.UI_READ_TIMEOUT_MS = original.UI_READ_TIMEOUT_MS;
  Object.assign(CINEMATIC_CHAT_PLANNING_CONFIG, { RESPONSE_POLL_MS: 5, RESPONSE_STABLE_POLLS: 2, INVALID_RESPONSE_STABLE_POLLS: 4 });
  const refusal = RT.TOI_CHI_LA_MOT_CONG_NGHE_TRI_TUE_NHAN_TAO_DUA_TREN_VAN_BAN_NEN_KHONG_T;
  const setResponse = async (text: string) => {
    await page.setContent(RT.MODEL_RESPONSE_MESSAGE_CONTENT_DIV_CLASS_MARKDOWN_DIV_MESSAGE_CONTENT_);
    await page.locator(RT.MARKDOWN).evaluate((element, value) => {
      element.textContent = value;
    }, text);
  };
  try {
    await page.setContent(RT.CHATGPT_USAGE_NOTICE);
    await assert.rejects(waitForStableResponse(page, CINEMATIC_CHAT_PLANNING_CONFIG.CHATGPT_RESPONSE_SELECTOR, CINEMATIC_CHAT_PLANNING_CONFIG.CHATGPT_BUSY_SELECTOR, 0, [], []), { message: CINEMATIC_CHAT_PLANNING_CONFIG.CHATGPT_RATE_LIMIT_ERROR });
    await page.setContent(RT.CHATGPT_USAGE_QUOTED);
    const quotedUsage = { artifactType: RT.MOTION_STORY_CHAPTER, requestId: RT.CURRENT, beats: [{ narration: RT.CHATGPT_USAGE_TEXT }] };
    await page.locator(RT.CHATGPT_CONTENT).evaluate((element, text) => {
      element.textContent = text;
    }, JSON.stringify(quotedUsage));
    assert.deepEqual(JSON.parse(await waitForStableResponse(page, CINEMATIC_CHAT_PLANNING_CONFIG.CHATGPT_RESPONSE_SELECTOR, CINEMATIC_CHAT_PLANNING_CONFIG.CHATGPT_BUSY_SELECTOR, 0, [], [], undefined, quotedUsage.artifactType, quotedUsage.requestId)), quotedUsage);
    await page.setContent("<div></div>");
    await page.locator("div").evaluate((element, text) => {
      element.textContent = text;
    }, PRODUCTION_QA.PROMPT_LIMIT);
    await assert.rejects(waitForStableResponse(page, selector, RT.BUSY, 0, [], []), { message: CINEMATIC_CHAT_PLANNING_CONFIG.PROMPT_LIMIT_RESPONSE_ERROR });
    const quotedLimit = { artifactType: RT.MOTION_STORY_CHAPTER, requestId: RT.CURRENT, beats: [{ narration: PRODUCTION_QA.PROMPT_LIMIT }] };
    await setResponse(JSON.stringify(quotedLimit));
    assert.deepEqual(JSON.parse(await waitForStableResponse(page, selector, RT.BUSY, 0, [], [], undefined, quotedLimit.artifactType, quotedLimit.requestId)), quotedLimit);
    for (const text of [refusal, RT.I_CAN_T_HELP_WITH_THAT_REQUEST, RT.GEMINI_PROGRAMMED_REFUSAL]) {
      await setResponse(text);
      await assert.rejects(waitForStableResponse(page, selector, RT.BUSY, 0, [], [], undefined, RT.MOTION_STORY_CHAPTER, RT.CURRENT), (error: any) => {
        assert.equal(error.message, CINEMATIC_CHAT_PLANNING_CONFIG.REFUSAL_RESPONSE_ERROR);
        assert.equal(error.diagnostics.lastCandidate, text);
        return true;
      });
    }
    const valid = { artifactType: RT.MOTION_STORY_CHAPTER, requestId: RT.CURRENT, beats: [{ narration: refusal }] };
    await setResponse(JSON.stringify(valid));
    assert.deepEqual(JSON.parse(await waitForStableResponse(page, selector, RT.BUSY, 0, [], [], undefined, valid.artifactType, valid.requestId)), valid, RT.QUOTED_DIALOGUE_IN_JSON_IS_NOT_A_REFUSAL);
    const receipt = { artifactType: CINEMATIC_CHAT_PLANNING_CONFIG.CONTEXT_ARTIFACT, requestId: "context-receipt", receivedPart: 3 };
    await setResponse('{"artifactType":"chat-planning-context","requestId":"context-receipt","received' + JSON.stringify(receipt));
    assert.deepEqual(JSON.parse(await waitForStableResponse(page, selector, RT.BUSY, 0, [], [], undefined, receipt.artifactType, receipt.requestId)), receipt);
    await assert.rejects(waitForStableResponse(page, selector, RT.BUSY, 0, [], [], undefined, receipt.artifactType, "different-context"), { message: CINEMATIC_CHAT_PLANNING_CONFIG.INVALID_RESPONSE_ERROR });
    await setResponse('{"artifactType":"motion-story-chapter","requestId":"current","beats' + JSON.stringify(valid));
    await assert.rejects(waitForStableResponse(page, selector, RT.BUSY, 0, [], [], undefined, valid.artifactType, valid.requestId), { message: CINEMATIC_CHAT_PLANNING_CONFIG.INVALID_JSON_RESPONSE_ERROR });
    const vectorReply = fs.readFileSync("scripts/fixtures/motion-remotion-svg-response-20261027.txt", "utf8");
    await setResponse(vectorReply);
    const recoveredVector = JSON.parse(await waitForStableResponse(page, selector, RT.BUSY, 0, [], [], undefined, V.ARTIFACT_ASSET, "motion_remotion_asset-e2cdee3a"));
    assert.ok(recoveredVector.svg.endsWith("</svg>"));
    assert.equal(recoveredVector.anchors.base.y, 0.98);
    await assert.rejects(waitForStableResponse(page, selector, RT.BUSY, 0, [], [], undefined, V.ARTIFACT_ASSET, "different-request"), { message: CINEMATIC_CHAT_PLANNING_CONFIG.INVALID_RESPONSE_ERROR });
    const protectedReply = { artifactType: V.ARTIFACT_ASSET, requestId: "escaped-svg", svg: '<svg viewBox="0 0 10 10"><g><rect width="10" height="10"/></g></svg>', anchors: {} };
    await setResponse(JSON.stringify(protectedReply).replaceAll("<", "\\u003c"));
    assert.deepEqual(JSON.parse(await waitForStableResponse(page, selector, RT.BUSY, 0, [], [], undefined, V.ARTIFACT_ASSET, protectedReply.requestId)), protectedReply);
    const currentScene = { artifactType: SCENE.ARTIFACT, requestId: "scene-current", svg: protectedReply.svg };
    const oldScene = { ...currentScene, requestId: "scene-old", notes: "old output ".repeat(1000) };
    await page.setContent('<model-response data-message-id="old"><div class="markdown"></div></model-response>');
    await page.locator(".markdown").evaluate((element, value) => {
      element.textContent = value;
    }, JSON.stringify(oldScene));
    const initial = await getChatResponseSnapshots(page, selector, SCENE.ARTIFACT);
    await page.locator(".markdown").evaluate((element, value) => {
      element.textContent = value + "\nHistorical DOM changed";
    }, JSON.stringify(oldScene));
    const currentMalformed = JSON.stringify(currentScene).replace(/"\}$/, "\n}");
    const delayedAppend = page.waitForTimeout(80).then(async () => {
      await page.locator("body").evaluate((element) => {
        element.insertAdjacentHTML("beforeend", '<model-response data-message-id="new"><div class="markdown"></div></model-response>');
      });
      await page
        .locator(".markdown")
        .last()
        .evaluate((element, value) => {
          element.textContent = value;
        }, currentMalformed);
    });
    assert.deepEqual(JSON.parse(await waitForStableResponse(page, selector, RT.BUSY, initial.length, [], initial, undefined, SCENE.ARTIFACT, currentScene.requestId)), currentScene);
    await delayedAppend;
    const incomplete = '{"artifactType":"motion_remotion_composition","requestId":"scene-current","svg":"<svg';
    await page
      .locator(".markdown")
      .last()
      .evaluate((element, value) => {
        element.textContent = value;
      }, incomplete);
    await assert.rejects(waitForStableResponse(page, selector, RT.BUSY, initial.length, [], initial, undefined, SCENE.ARTIFACT, currentScene.requestId), (error: any) => error.message === CINEMATIC_CHAT_PLANNING_CONFIG.INVALID_JSON_RESPONSE_ERROR && error.diagnostics.lastCandidate === incomplete);
    await page.setContent('<model-response><div class="markdown"><span>Code JSON:</span><pre><code></code></pre><button>Copy code</button></div></model-response>');
    await page.locator("code").evaluate((element, value) => {
      element.textContent = value;
    }, JSON.stringify(protectedReply));
    assert.equal((await getChatResponseSnapshots(page, selector, V.ARTIFACT_ASSET))[0].text, JSON.stringify(protectedReply));
    assert.deepEqual(JSON.parse(await waitForStableResponse(page, selector, RT.BUSY, 0, [], [], undefined, V.ARTIFACT_ASSET, protectedReply.requestId)), protectedReply);
    await setResponse(RT.A_MALFORMED_RESPONSE_WITH_NO_JSON_OBJECT);
    await assert.rejects(waitForStableResponse(page, selector, RT.BUSY, 0, [], []), { message: CINEMATIC_CHAT_PLANNING_CONFIG.INVALID_JSON_RESPONSE_ERROR });
    await setResponse(RT.SORRY_SOMETHING_WENT_WRONG_PLEASE_TRY_YOUR_REQUEST_AGAIN);
    await assert.rejects(waitForStableResponse(page, selector, RT.BUSY, 0, [], []), { message: CINEMATIC_CHAT_PLANNING_CONFIG.PROVIDER_ERROR_RESPONSE_ERROR });
    await setResponse(refusal);
    const previous = await getChatResponseSnapshots(page, selector);
    const abort = new AbortController();
    const ignored = waitForStableResponse(page, selector, RT.BUSY, previous.length, [], previous, undefined, undefined, undefined, abort.signal);
    setTimeout(() => abort.abort(), 100);
    await assert.rejects(ignored, RT.PATTERN_CANCELLED_I, RT.AN_OLD_REFUSAL_MUST_NOT_BE_ATTRIBUTED_TO_A_NEW_REQUEST);
    await setResponse(refusal);
    await page.locator(RT.BODY).evaluate(
      (element, { RT }) => {
        element.insertAdjacentHTML(RT.BEFOREEND, RT.BUTTON_CLASS_BUSY_STOP_BUTTON);
      },
      { RT: { BEFOREEND: RT.BEFOREEND, BUTTON_CLASS_BUSY_STOP_BUTTON: RT.BUTTON_CLASS_BUSY_STOP_BUTTON } },
    );
    const streamingAbort = new AbortController();
    const streaming = waitForStableResponse(page, selector, RT.BUSY, 0, [], [], undefined, undefined, undefined, streamingAbort.signal);
    setTimeout(() => streamingAbort.abort(), 100);
    await assert.rejects(streaming, RT.PATTERN_CANCELLED_I, RT.DO_NOT_CLASSIFY_TEXT_WHILE_THE_RESPONSE_IS_STILL_GENERATING);
  } finally {
    Object.assign(CINEMATIC_CHAT_PLANNING_CONFIG, original);
  }
  process.stdout.write(RT.BROWSER_RESPONSE_EXTRACTION_AND_MUSIC_IMAGE_JSON_PASSED);
} finally {
  await browser.close();
}
