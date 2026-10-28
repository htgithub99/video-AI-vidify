// Explicit opt-in: uploads ten existing cached MP3s to Gemini without sending a prompt.
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";
import { attachGeminiLocalFiles } from "../src/server/services/geminiFileAttachmentService.ts";
import { assertGeminiSessionAvailable, geminiUploadPolicy, observeGeminiUploads } from "../src/server/services/geminiUploadReadiness.ts";
import { getClaudeComposerScope, readClaudeUploadState, waitForClaudeUploads } from "../src/server/services/claudeUploadReadiness.ts";
import { musicUploadDetails } from "../src/server/services/musicDiagnosticService.ts";
if (!process.argv.includes("--live")) throw new Error("Pass --live to upload ten cached music files to Gemini.");
const root = path.resolve("storage/music-download-checkpoints");
const caches = await fs.readdir(root, { withFileTypes: true });
let paths: string[] = [];
for (const cache of caches.filter((item) => item.isDirectory())) {
  const folder = path.join(root, cache.name, "evaluation-audio");
  const entries = await fs.readdir(folder).catch(() => []);
  if (entries.filter((entry) => entry.endsWith(".mp3")).length >= 10) {
    paths = entries.filter((entry) => entry.endsWith(".mp3")).slice(0, 10).map((entry) => path.join(folder, entry));
    break;
  }
}
assert.equal(paths.length, 10, "Ten cached MP3s are required");
const files = paths.map((filePath) => ({ name: path.basename(filePath), path: filePath, mimeType: "audio/mpeg" }));
const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
const context = browser.contexts()[0];
const page = await context.newPage();
let observation: ReturnType<typeof observeGeminiUploads> | undefined;
const started = Date.now();
try {
  await page.goto("https://gemini.google.com/app", { waitUntil: "domcontentloaded", timeout: 60000 });
  assertGeminiSessionAvailable(page);
  const input = page.locator('rich-textarea [contenteditable="true"]:not(.ql-clipboard),div.ql-editor[contenteditable="true"]').filter({ visible: true }).first();
  await input.waitFor({ state: "visible", timeout: 45000 });
  const composer = await getClaudeComposerScope(input, geminiUploadPolicy);
  observation = observeGeminiUploads(page);
  const assignmentStarted = Date.now();
  const method = await attachGeminiLocalFiles(page, composer, files);
  console.log(JSON.stringify({ event: "assigned", method, files: files.length, elapsedMs: Date.now() - assignmentStarted }));
  const assignedState = await readClaudeUploadState(input, geminiUploadPolicy);
  console.log(JSON.stringify({ event: "attachment-state", ...assignedState }));
  console.log(JSON.stringify({ event: "expected-names", names: files.map((file) => file.name) }));
  try {
    await waitForClaudeUploads(input, files, 120000, undefined, observation, 1500, false, geminiUploadPolicy);
    console.log(JSON.stringify({ event: "ready", files: files.length, elapsedMs: Date.now() - started, ...musicUploadDetails(observation.state()) }));
  } catch (error) {
    const state = await readClaudeUploadState(input, geminiUploadPolicy);
    await fs.mkdir("scratch", { recursive: true });
    await page.screenshot({ path: "scratch/music-upload-live-check.png" });
    console.log(JSON.stringify({ event: "failed", elapsedMs: Date.now() - started, error: (error as Error).message, count: state.count, busy: state.busy, failed: state.failed, uploadMessage: state.errorMessage, ...musicUploadDetails(observation.state()) }));
    throw error;
  }
} finally {
  observation?.dispose();
  await page.close().catch(() => undefined);
  // Closing a browser connected over CDP disconnects this client, leaving Chrome running.
  await browser.close();
}
