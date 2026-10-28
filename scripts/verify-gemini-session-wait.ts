import assert from "node:assert/strict";
import { setTimeout as pause } from "node:timers/promises";
import { chromium } from "playwright";
import { waitForGeminiSession, withGeminiSession } from "../src/server/services/geminiSessionService.js";
import { verifyGeminiSubmittedFiles } from "../src/server/services/geminiUploadReadiness.js";
import { ChatUploadError } from "../src/server/services/chatUploadRecovery.js";
import type { MusicUploadProgress } from "../src/types/musicDownloadProgress.js";
const browser = await chromium.launch({ headless: true });
try {
  const context = await browser.newContext();
  let navigations = 0;
  await context.route("https://**/*", (route) => {
    navigations++;
    return route.fulfill({ contentType: "text/html", body: '<div id="input" contenteditable="false">Waiting for user</div>' });
  });
  const page = await context.newPage();
  const progress: MusicUploadProgress[] = [];
  let retainers = 0,
    releases = 0,
    work = 0;
  const options = {
    expected: 10,
    pollMs: 10,
    onProgress: (event: MusicUploadProgress) => progress.push(event),
    retainBrowser: () => {
      retainers++;
      return () => {
        retainers--;
        releases++;
      };
    },
  };
  await page.goto("https://www.google.com/sorry/index");
  const pending = withGeminiSession(page, async () => ++work, options);
  await pause(120);
  assert.equal(work, 0, "Do not run any task operation while Google waits for verification");
  assert.equal(retainers, 1, "Retain Chrome while the user verifies");
  assert.equal(page.isClosed(), false);
  assert.match(page.url(), /google\.com\/sorry/);
  assert.equal(navigations, 1, "No automatic reload, redirect or challenge interaction");
  assert.equal(progress[0].phase, "verification-waiting");
  await page.goto("https://gemini.google.com/app");
  await pause(60);
  assert.equal(work, 0, "Leaving the challenge URL alone does not mean Gemini is ready");
  await page.locator("#input").evaluate((node) => {
    node.setAttribute("role", "textbox");
    node.setAttribute("aria-label", "Enter a prompt here");
    node.setAttribute("contenteditable", "true");
  });
  assert.equal(await pending, 1);
  assert.equal(retainers, 0);
  assert.equal(releases, 1);
  assert.equal(progress.at(-1)?.phase, "verification-resumed");
  assert.ok(progress.at(-1)!.elapsedMs! >= 120);
  let calls = 0;
  const interrupted = withGeminiSession(
    page,
    async () => {
      calls++;
      if (calls === 1) {
        await page.goto("https://www.google.com/sorry/index");
        throw new Error("UI interrupted by navigation");
      }
      return "resumed";
    },
    options,
  );
  while (retainers === 0) await pause(10);
  assert.equal(page.isClosed(), false);
  await page.goto("https://gemini.google.com/app");
  await page.setContent('<div contenteditable="true" role="textbox" aria-label="Enter a prompt here"></div>');
  assert.equal(await interrupted, "resumed");
  assert.equal(calls, 2);
  await page.goto("https://accounts.google.com/ServiceLogin");
  const file = { name: "track.mp3", mimeType: "audio/mpeg" };
  const submitted = verifyGeminiSubmittedFiles(page, [file], 0, "request-123", undefined, 50, () => waitForGeminiSession(page, options));
  await pause(150);
  assert.equal(page.isClosed(), false);
  await page.goto("https://gemini.google.com/app");
  await page.setContent('<div contenteditable="true" role="textbox" aria-label="Enter a prompt here"></div><user-query>request-123<user-query-file-preview><button aria-label="track.mp3">track.mp3</button></user-query-file-preview></user-query>');
  await submitted;
  await page.goto("https://www.google.com/sorry/index");
  const cancel = new AbortController();
  const cancelled = waitForGeminiSession(page, { ...options, signal: cancel.signal });
  const rejected = assert.rejects(cancelled, /chat_planning_cancelled/);
  await pause(30);
  cancel.abort();
  await rejected;
  assert.equal(retainers, 0, "Cancellation releases the browser retention");
  assert.equal(page.isClosed(), false, "Only the task owner performs cancellation cleanup");
  const closed = waitForGeminiSession(page, options);
  const closedRejected = assert.rejects(closed, (error: unknown) => error instanceof ChatUploadError && !error.retryable);
  await pause(30);
  await page.close();
  await closedRejected;
  assert.equal(retainers, 0);
  console.log("PASS: verification/login keep the same tab and retain Chrome, block automation until Gemini is editable, resume UI reads, exclude manual wait from submission timeout, cancel promptly, and stop if the user closes the tab. Local browser fixtures only.");
} finally {
  await browser.close();
}
