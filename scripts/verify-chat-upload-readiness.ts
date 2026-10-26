import assert from "node:assert/strict";
import { chromium } from "playwright";
import { UPLOAD_QA as V } from "./chatUploadReadinessVerificationTexts.js";
import { assertChatGptUploadsAvailable, chatGptUploadPolicy as policy } from "../src/server/services/chatGptUploadReadiness.js";
import { CINEMATIC_CHAT_PLANNING_CONFIG as C } from "../src/constants/cinematicConstants.js";
import { getClaudeComposerScope, readClaudeUploadState, waitForClaudeUploads } from "../src/server/services/claudeUploadReadiness.js";
import { geminiUploadPolicy as gemini, observeGeminiUploads } from "../src/server/services/geminiUploadReadiness.js";
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage();
  await page.setContent(V.HTML);
  const input = page.locator(V.INPUT);
  await page.locator(V.REMOVE).waitFor();
  const state = await readClaudeUploadState(input, policy);
  assert.equal(state.count, 1);
  assert.equal(state.busy, false);
  assert.equal(state.sendReady, true);
  await waitForClaudeUploads(input, [{ name: V.NAME, mimeType: V.MIME }], 1000, undefined, undefined, 0, true, policy);
  await assert.rejects(waitForClaudeUploads(input, [{ name: V.NAME, mimeType: V.MIME }], 30, undefined, { state: () => ({ pending: 1, failed: false }) }, 0, true, policy), { message: policy.notReadyError });
  await assert.rejects(waitForClaudeUploads(input, [{ name: V.NAME, mimeType: V.MIME }], 1000, undefined, { state: () => ({ pending: 0, failed: true }) }, 0, true, policy), { message: policy.failedError });
  await page.locator(policy.send).evaluate((node) => node.setAttribute("disabled", ""));
  assert.equal((await readClaudeUploadState(input, policy)).sendReady, false);
  const scope = await getClaudeComposerScope(input, policy);
  await scope.locator(policy.remove).evaluate((node) => node.parentElement?.remove());
  assert.equal((await readClaudeUploadState(input, policy)).count, 0);
  await scope.evaluate((node, html) => node.insertAdjacentHTML("beforeend", html), V.LOCKED);
  await assert.rejects(assertChatGptUploadsAvailable(input), { message: C.CHATGPT_UPLOAD_UNAVAILABLE_ERROR });
  await scope.evaluate((node, html) => node.insertAdjacentHTML("beforeend", html), V.AVAILABLE);
  await assertChatGptUploadsAvailable(input);
  process.stdout.write(V.PASSED);
  await page.setContent(V.GEMINI_HTML);
  const geminiInput = page.locator(V.GEMINI_INPUT);
  const references = V.GEMINI_NAMES.map((name) => ({ name, mimeType: V.GEMINI_MIME }));
  const waitGemini = (items = references, timeout = 1000, observation?: any) => waitForClaudeUploads(geminiInput, items, timeout, undefined, observation, 0, true, gemini);
  await waitGemini();
  await assert.rejects(waitGemini([references[0], references[0]], 30), { message: gemini.notReadyError });
  await assert.rejects(waitGemini([{ ...references[0], name: V.GEMINI_WRONG_NAME }, references[1]], 30), { message: gemini.notReadyError });
  await assert.rejects(waitGemini([references[0]], 30), { message: gemini.notReadyError });
  await assert.rejects(waitGemini(references, 30, { state: () => ({ pending: 1, failed: false }) }), { message: gemini.notReadyError });
  const chip = page.locator(gemini.attachment).first();
  await chip.evaluate((node, css) => node.classList.add(css), V.GEMINI_ERROR_CLASS);
  await assert.rejects(waitGemini(), { message: gemini.failedError });
  await chip.evaluate((node, css) => node.classList.remove(css), V.GEMINI_ERROR_CLASS);
  await page.locator(gemini.send).evaluate((node) => node.setAttribute("disabled", ""));
  await assert.rejects(waitGemini(references, 30), { message: gemini.notReadyError });
  await page.locator(gemini.send).evaluate((node) => node.removeAttribute("disabled"));
  const geminiScope = await getClaudeComposerScope(geminiInput, gemini);
  assert.equal(await geminiScope.evaluate((node) => node.tagName.toLowerCase()), "input-area-v2");
  await page.route(V.GEMINI_NETWORK, (route) => route.fulfill({ status: 503, headers: { "Access-Control-Allow-Origin": "*" }, body: "Unavailable" }));
  const observation = observeGeminiUploads(page);
  try {
    await page.route(V.GEMINI_NETWORK_RESUMABLE, (route) => route.fulfill({ status: 308, headers: { "Access-Control-Allow-Origin": "*" }, body: "Resume Incomplete" }));
    await page.evaluate(async (url) => {
      await fetch(url, { method: "POST" }).catch(() => undefined);
    }, V.GEMINI_NETWORK_RESUMABLE);
    assert.equal(observation.state().failed, false);
    await waitGemini(references, 1000, observation);
    await page.evaluate(async (url) => {
      await fetch(url, { method: "POST" }).catch(() => undefined);
    }, V.GEMINI_NETWORK);
    await assert.rejects(waitGemini(references, 1000, observation), { message: gemini.failedError });
    assert.deepEqual(observation.state().lastFailure, { url: V.GEMINI_NETWORK_SAFE, status: 503 });
  } finally {
    observation.dispose();
  }
  await geminiScope.locator(gemini.remove).evaluateAll((nodes) => nodes.forEach((node) => (node as HTMLElement).click()));
  assert.equal((await readClaudeUploadState(geminiInput, gemini)).count, 0);
  process.stdout.write(V.GEMINI_PASSED);
} finally {
  await browser.close();
}
