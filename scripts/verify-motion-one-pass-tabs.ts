import assert from "node:assert/strict";
import { chromium } from "playwright";
import { findNativeChrome } from "../src/server/services/nativeProxyBrowser.ts";
import { sharedChromeFlowPage } from "../src/server/services/sharedChromePage.ts";
import { EXTERNAL_URLS } from "../src/constants/apiRoutes.ts";
import { waitForStableResponse } from "../src/server/services/chatUiPlanningService.ts";
import { CINEMATIC_CHAT_PLANNING_CONFIG as C } from "../src/constants/cinematicConstants.ts";
const browser = await chromium.launch({ executablePath: findNativeChrome(), headless: false });
try {
  const context = await browser.newContext();
  await context.route("**/*", (route) => route.fulfill({ contentType: "text/html", body: "<h1>Shared-tab isolation fixture</h1>" }));
  const chat = await context.newPage();
  await chat.goto(EXTERNAL_URLS.GEMINI_CHAT);
  const labs = await context.newPage();
  await labs.goto("https://labs.google/");
  const flow = await sharedChromeFlowPage(context);
  assert.notEqual(flow, chat);
  assert.notEqual(flow, labs);
  assert.equal(chat.url(), EXTERNAL_URLS.GEMINI_CHAT);
  assert.equal(labs.url(), "https://labs.google/");
  await flow.goto(EXTERNAL_URLS.GOOGLE_LABS_FLOW_HOME);
  assert.equal(await sharedChromeFlowPage(context), flow);
  const started = Date.now();
  await assert.rejects(waitForStableResponse(labs, C.GEMINI_RESPONSE_SELECTOR, C.GEMINI_BUSY_SELECTOR, 0, [], [], undefined, "motion_remotion_composition", "qa-shared-tab", AbortSignal.timeout(5000)), (e: any) => e.code === C.RESPONSE_TIMEOUT_CODE && e.diagnostics.unexpectedOrigin === "https://labs.google");
  assert.ok(Date.now() - started < 2000);
  console.log("PASS: visible installed Chrome — Flow cannot claim Gemini or unrelated Labs tabs; wrong-origin room fails promptly without another submission. Local UI fixture, no live AI.");
} finally {
  await browser.close();
}
