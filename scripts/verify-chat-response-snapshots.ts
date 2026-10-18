import { RUNTIME_VERIFICATION_TEXTS as RT } from "./runtimeVerificationTexts.ts";
import assert from "node:assert/strict";
import { chromium } from "playwright";
import { CINEMATIC_CHAT_PLANNING_CONFIG } from "../src/constants/cinematicConstants.ts";
import { getChatResponseSnapshots, waitForStableResponse } from "../src/server/services/chatUiPlanningService.ts";
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage();
  const selector = CINEMATIC_CHAT_PLANNING_CONFIG.GEMINI_RESPONSE_SELECTOR;
  assert.deepEqual(await getChatResponseSnapshots(page, selector), []);
  const response = {
    artifactType: RT.MUSIC_IMAGE_PROMPT,
    requestId: RT.MUSIC_IMAGE_PROMPT_TEST,
    imagePrompt: RT.A_FINISHED_16_9_PROFESSIONAL_MUSIC_PLAYLIST_COVER,
  };
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
  Object.assign(CINEMATIC_CHAT_PLANNING_CONFIG, { RESPONSE_POLL_MS: 5, RESPONSE_STABLE_POLLS: 2, INVALID_RESPONSE_STABLE_POLLS: 4 });
  const refusal = RT.TOI_CHI_LA_MOT_CONG_NGHE_TRI_TUE_NHAN_TAO_DUA_TREN_VAN_BAN_NEN_KHONG_T;
  const setResponse = async (text: string) => {
    await page.setContent(RT.MODEL_RESPONSE_MESSAGE_CONTENT_DIV_CLASS_MARKDOWN_DIV_MESSAGE_CONTENT_);
    await page.locator(RT.MARKDOWN).evaluate((element, value) => {
      element.textContent = value;
    }, text);
  };
  try {
    for (const text of [refusal, RT.I_CAN_T_HELP_WITH_THAT_REQUEST]) {
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
