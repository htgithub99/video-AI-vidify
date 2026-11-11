import assert from "node:assert/strict";
import { chromium } from "playwright";
import { chromium as extra } from "playwright-extra";
import { initPlaywright, closePlaywright } from "../src/server/services/audioService.ts";
import { findNativeChrome } from "../src/server/services/nativeProxyBrowser.ts";
import { EXTERNAL_URLS } from "../src/constants/apiRoutes.ts";
const browser = await chromium.launch({ executablePath: findNativeChrome(), headless: false });
const original = extra.connectOverCDP;
try {
  const context = await browser.newContext();
  await context.route("**/*", (route) => route.fulfill({ contentType: "text/html", body: route.request().url() === EXTERNAL_URLS.GOOGLE_LABS ? `<html><body>Owned auth fixture<script>fetch('https://aisandbox-pa.googleapis.com/fixture',{headers:{Authorization:'Bearer local-fixture'}})</script></body></html>` : "<html><body>Existing conversation fixture</body></html>" }));
  const chat = await context.newPage(), flow = await context.newPage();
  await chat.goto("https://gemini.google.com/app/keep-this-conversation");
  await flow.goto(EXTERNAL_URLS.GOOGLE_LABS_FLOW_HOME);
  (extra as any).connectOverCDP = async () => ({ contexts: () => [context] });
  await initPlaywright();
  assert.equal(chat.url(), "https://gemini.google.com/app/keep-this-conversation", "Audio bootstrap must not navigate the first chat tab to Labs");
  assert.equal(flow.url(), EXTERNAL_URLS.GOOGLE_LABS_FLOW_HOME);
  assert.equal(context.pages().length, 3);
  await closePlaywright();
  assert.equal(chat.isClosed(), false);
  assert.equal(flow.isClosed(), false);
  assert.equal(context.pages().length, 2, "Cleanup closes only its owned auth tab");
  console.log("PASS: actual audio bootstrap on visible installed Chrome opens/closes its own Labs tab; existing Gemini conversation and Flow project survive. Local routes, no live token or network request.");
} finally {
  (extra as any).connectOverCDP = original;
  delete (globalThis as any).globalGoogleHeaders;
  await browser.close();
}
process.exit(0);
