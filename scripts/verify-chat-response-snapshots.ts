import assert from "node:assert/strict";
import { chromium } from "playwright";
import { CINEMATIC_CHAT_PLANNING_CONFIG } from "../src/constants/cinematicConstants.ts";
import { getChatResponseSnapshots } from "../src/server/services/chatUiPlanningService.ts";

const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage();
  const selector = CINEMATIC_CHAT_PLANNING_CONFIG.GEMINI_RESPONSE_SELECTOR;
  assert.deepEqual(await getChatResponseSnapshots(page, selector), []);

  const response = {
    artifactType: "music_image_prompt",
    requestId: "music-image-prompt-test",
    imagePrompt: "A finished 16:9 professional music playlist cover.",
  };
  const responseText = JSON.stringify(response);
  await page.setContent(`<model-response><message-content><div class="markdown"></div></message-content></model-response>`);
  await page.locator(".markdown").evaluate((element, text) => { element.textContent = text; }, responseText);
  const snapshots = await getChatResponseSnapshots(page, selector);
  assert.equal(snapshots.length, 1, "Read a visible Gemini response without message attributes");
  assert.equal(snapshots[0].text, responseText);
  assert.equal(snapshots[0].identity, "");
  assert.deepEqual(JSON.parse(snapshots[0].text), response);

  await page.locator("model-response").evaluate((element) => element.setAttribute("data-message-id", "gemini-response-1"));
  assert.equal((await getChatResponseSnapshots(page, selector))[0].identity, "gemini-response-1");

  await page.locator("model-response").evaluate((element) => { element.removeAttribute("data-message-id"); element.setAttribute("data-testid", "conversation-turn-1"); });
  assert.equal((await getChatResponseSnapshots(page, selector))[0].identity, "conversation-turn-1:0");

  await page.locator("model-response").evaluate((element) => { element.removeAttribute("data-testid"); });
  await page.locator(".markdown").evaluate((element) => { element.id = "response-id"; });
  assert.equal((await getChatResponseSnapshots(page, selector))[0].identity, "response-id");

  await page.locator("model-response").evaluate((element) => { element.style.display = "none"; });
  assert.deepEqual(await getChatResponseSnapshots(page, selector), []);

  process.stdout.write("Browser response extraction and music image JSON passed.\n");
} finally {
  await browser.close();
}
