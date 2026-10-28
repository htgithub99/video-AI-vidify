import assert from "node:assert/strict";
import { sunoBulkPlaylistFixture } from "./sunoBulkPlaylistFixtures.js";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { createServer } from "node:http";
import { chromium } from "playwright";
import { AsyncTaskLimiter } from "../src/lib/asyncTaskLimiter.ts";
import { attachGeminiLocalFiles } from "../src/server/services/geminiFileAttachmentService.ts";
import { ChatUploadError, canRetryMusicEvaluation, uploadFailure, waitForMusicEvaluationRetry } from "../src/server/services/chatUploadRecovery.ts";
import { getClaudeComposerScope, waitForClaudeUploads } from "../src/server/services/claudeUploadReadiness.ts";
import { assertGeminiSessionAvailable, geminiUploadPolicy } from "../src/server/services/geminiUploadReadiness.ts";
const scratch = await fs.mkdtemp(path.join(os.tmpdir(), "vidify-playlist-upload-"));
process.env.VIDIFY_STORAGE_DIR = scratch;
const { addSongsToPlaylist, ensureSunoPlaylistMembers, openSunoPlaylistDialog, playlistClipIds } = await import("../src/server/services/sunoAutomationService.ts");
const { readSunoPlaylistCheckpoint } = await import("../src/server/services/sunoPlaylistCheckpointService.ts");
const { musicUploadDetails, writeMusicDiagnostic } = await import("../src/server/services/musicDiagnosticService.ts");
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext();
const playlistId = randomUUID();
const songIds = Array.from({ length: 50 }, () => randomUUID());
const members = new Set<string>();
let creates = 0;
let additions: string[][] = [];
let rejectAdd = false;
let rejectStatus = 403;
let rejectUiAdd = false;
const uiGroups: string[][] = [];
const server = createServer(async (req, res) => {
  const buffers: Buffer[] = [];
  for await (const chunk of req) buffers.push(chunk);
  res.setHeader("content-type", "application/json");
  if (req.url?.includes("update_clips")) {
    const ids = JSON.parse(Buffer.concat(buffers).toString()).metadata.clip_ids;
    additions.push(ids);
    if (rejectAdd) {
      res.statusCode = rejectStatus;
      res.end('{"error":"Denied"}');
      return;
    }
    ids.forEach((id: string) => members.add(id));
    res.end("{}");
  } else res.end(JSON.stringify({ playlist_clips: [...members].map((id) => ({ clip: { id } })) }));
});
await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
const origin = `http://127.0.0.1:${(server.address() as any).port}`;
try {
  assert.deepEqual(playlistClipIds({ playlist_clips: [{ id: "membership-row", clip: { id: "actual-song" } }] }), ["actual-song"]);
  assert.deepEqual(playlistClipIds({ playlist: { clips: [{ id: "membership-row", clip: { clip_id: "actual-song" } }] } }), ["actual-song"]);
  const page = await context.newPage();
  const name = `OFFLINE-${randomUUID()}`;
  await page.route("https://studio-api-prod.suno.com/**", async (route) => {
    const headers = { "access-control-allow-origin": "https://suno.com", "access-control-allow-headers": "content-type", "access-control-allow-methods": "POST,GET,OPTIONS" };
    if (route.request().method() === "OPTIONS") {
      await route.fulfill({ status: 204, headers });
      return;
    }
    const ids = route.request().postDataJSON()?.ids || [];
    if (route.request().url().includes("/create/")) {
      creates++;
      ids.forEach((id: string) => members.add(id));
      await route.fulfill({ json: { id: playlistId }, headers });
    } else if (rejectUiAdd) {
      await route.fulfill({ status: 500, json: { error: "Fixture add failed" }, headers });
    } else {
      uiGroups.push(ids);
      ids.forEach((id: string) => members.add(id));
      await route.fulfill({ json: {}, headers });
    }
  });
  await page.route("https://suno.com/**", (route) => route.fulfill({ contentType: "text/html", body: sunoBulkPlaylistFixture(songIds, name) }));
  const proxy = new Proxy(page, {
    get(target, key) {
      if (key === "request") return { get: (url: string, options: any) => context.request.get(origin + new URL(url).pathname + new URL(url).search, options), post: (url: string, options: any) => context.request.post(origin + new URL(url).pathname, options) };
      const value = Reflect.get(target, key);
      return typeof value === "function" ? value.bind(target) : value;
    },
  });
  rejectUiAdd = true;
  await assert.rejects(addSongsToPlaylist(proxy, songIds, name, "offline-playlist"));
  assert.equal(creates, 1);
  assert.equal(members.size, 39);
  assert.equal((await readSunoPlaylistCheckpoint(songIds, name))?.playlistId, playlistId);
  rejectUiAdd = false;
  const url = await addSongsToPlaylist(proxy, songIds, name, "offline-playlist-resume");
  assert.ok(url.endsWith(playlistId));
  assert.equal(creates, 1, "Resume must not create a second playlist");
  assert.equal(members.size, 50);
  assert.equal(uiGroups.length, 1, "All eleven remaining clips added in one action");
  assert.equal(uiGroups[0].length, 11);
  assert.ok(!members.has("unrelated-id"));
  assert.equal(additions.length, 0, "The signed-in bulk UI is the default; no rejected API mutation");
  await ensureSunoPlaylistMembers(proxy, {}, playlistId, songIds);
  assert.equal(additions.length, 0, "Verified members must not be added twice");
  for (const id of songIds.slice(5, 15)) members.delete(id);
  await addSongsToPlaylist(proxy, songIds, name, "offline-bulk-missing");
  assert.equal(uiGroups.at(-1)?.length, 10, "Only missing IDs are selected as one group");
  assert.equal(members.size, 50);
  assert.equal(creates, 1);
  const files = await Promise.all(
    Array.from({ length: 10 }, async (_, index) => {
      const filePath = path.join(scratch, `${index + 1}-Nhạc-${randomUUID()}.mp3`);
      await fs.writeFile(filePath, Buffer.concat([Buffer.from("ID3"), Buffer.alloc(12000)]));
      return { path: filePath, name: path.basename(filePath), mimeType: "audio/mpeg" };
    }),
  );
  const uploadPage = await context.newPage();
  await uploadPage.setContent(`<style>input-area-v2,uploader-file-preview{display:block}</style>
    <input type="file" multiple accept=".pdf" id="wrong"><input-area-v2><div contenteditable="true" id="prompt"></div>
    <input type="file" multiple accept=".mp3,audio/*" id="audio" hidden><div id="chips"></div><button aria-label="Send message">Send</button></input-area-v2>
    <script>window.assignments=0; document.querySelector('#audio').onchange=e=>{window.assignments++;document.querySelector('#chips').replaceChildren(...Array.from(e.target.files).map(f=>{const n=document.createElement('uploader-file-preview');const content=document.createElement('span');content.className='gem-attachment-content';content.textContent=f.name;n.append(content);return n}))}</script>`);
  const input = uploadPage.locator("#prompt");
  const composer = await getClaudeComposerScope(input, geminiUploadPolicy);
  const started = Date.now();
  assert.equal(await attachGeminiLocalFiles(uploadPage, composer, files), "cdp");
  await waitForClaudeUploads(input, files, 1000, undefined, undefined, 0, true, geminiUploadPolicy);
  assert.equal(await uploadPage.locator("#wrong").evaluate((node) => (node as HTMLInputElement).files?.length), 0);
  assert.equal(await uploadPage.locator("#audio").evaluate((node) => (node as HTMLInputElement).files?.length), 10);
  await attachGeminiLocalFiles(uploadPage, composer, files);
  assert.equal(await uploadPage.evaluate(() => (window as any).assignments), 1, "Retry must reconcile assigned files");
  await uploadPage.locator("uploader-file-preview").evaluateAll((nodes) =>
    nodes.forEach((node) => {
      const text = document.createElement("span");
      text.className = "gem-attachment-content";
      text.textContent = "MP3 " + node.textContent?.replace(/\.mp3$/i, "");
      node.replaceChildren(text);
    }),
  );
  await waitForClaudeUploads(input, files, 1000, undefined, undefined, 0, true, geminiUploadPolicy);
  await assert.rejects(waitForClaudeUploads(input, [{ ...files[0], name: "missing.mp3", path: path.join(scratch, "missing.mp3") }, ...files.slice(1)], 30, undefined, undefined, 0, true, geminiUploadPolicy));
  await assert.rejects(waitForClaudeUploads(input, [files[0], files[0], ...files.slice(2)], 30, undefined, undefined, 0, true, geminiUploadPolicy));
  const menuPage = await context.newPage();
  await menuPage.setContent(`<div id="composer"><button aria-label="Attach files" onclick="const input=document.createElement('input');input.type='file';input.multiple=true;input.accept='audio/*';this.parentElement.append(input)">Attach</button></div>`);
  assert.equal(await attachGeminiLocalFiles(menuPage, menuPage.locator("#composer"), files), "menu-cdp");
  assert.equal(menuPage.listenerCount("filechooser"), 0, "Successful fallback must release its file chooser listener");
  await menuPage.setContent(`<div id="composer"><button aria-label="Attach files" onclick="const input=document.createElement('input');input.type='file';input.multiple=true;input.onchange=e=>window.detachedFiles=Array.from(e.target.files).map(f=>f.name);input.click()">Attach</button></div>`);
  assert.equal(await attachGeminiLocalFiles(menuPage, menuPage.locator("#composer"), files), "chooser-cdp");
  assert.deepEqual(
    await menuPage.evaluate(() => (window as any).detachedFiles),
    files.map((file) => path.basename(file.path)),
  );
  assert.equal(menuPage.listenerCount("filechooser"), 0);
  await uploadPage
    .locator("uploader-file-preview")
    .first()
    .evaluate((node) => {
      node.className = "gem-attachment-loading-error";
      node.textContent = "Unsupported file";
    });
  await assert.rejects(waitForClaudeUploads(input, files, 1000, undefined, undefined, 0, true, geminiUploadPolicy), (error: any) => error instanceof ChatUploadError && !error.retryable);
  assert.equal(canRetryMusicEvaluation(uploadFailure("Upload failed", { lastFailure: { status: 429 } })), false);
  assert.equal(canRetryMusicEvaluation(uploadFailure("Upload failed", { lastFailure: { status: 503 } })), true);
  const abort = new AbortController();
  const retry = waitForMusicEvaluationRetry(0, abort.signal);
  abort.abort();
  await assert.rejects(retry);
  assert.equal(canRetryMusicEvaluation(new Error("chat_planning_cancelled")), false);
  assert.throws(
    () => assertGeminiSessionAvailable({ url: () => "https://www.google.com/sorry/index" }),
    (error: any) => error instanceof ChatUploadError && !canRetryMusicEvaluation(error),
  );
  assert.throws(
    () => assertGeminiSessionAvailable({ url: () => "https://accounts.google.com/ServiceLogin" }),
    (error: any) => error instanceof ChatUploadError && !canRetryMusicEvaluation(error),
  );
  assertGeminiSessionAvailable({ url: () => "https://gemini.google.com/app" });
  const pool = new AsyncTaskLimiter(1);
  const release = await pool.acquire();
  const queued = pool.acquire(abort.signal);
  await assert.rejects(queued);
  release();
  await pool.run(async () => {});
  await writeMusicDiagnostic("upload-fixture", musicUploadDetails({ pending: 0, failed: true, lastFailure: { status: 403, url: "https://content-push.googleapis.com/upload/file?token=secret", errorText: "Denied" } }));
  const diagnostic = (await fs.readFile(path.join(scratch, "logs", "music-workflow.jsonl"), "utf8"))
    .trim()
    .split("\n")
    .map((line) => JSON.parse(line))
    .at(-1);
  assert.equal(diagnostic.uploadStatus, 403);
  assert.equal(diagnostic.uploadHost, "content-push.googleapis.com");
  assert.ok(!JSON.stringify(diagnostic).includes("secret"));
  console.log(
    `PASS: bulk selection through virtualized paginated rows, 50 verified members, persistent resume after failed add, no unrelated selections or duplicate playlist/member; scoped CDP attaches exactly ten Unicode MP3 paths (${Date.now() - started} ms including checks), no duplicate assignment, failed tile, terminal/transient retry, cancellation and sanitized HTTP diagnostics. No live AI/Suno calls.`,
  );
} finally {
  await browser.close();
  await new Promise<void>((resolve) => server.close(() => resolve()));
  assert.ok(path.resolve(scratch).startsWith(path.resolve(os.tmpdir()) + path.sep) && path.basename(scratch).startsWith("vidify-playlist-upload-"));
  await fs.rm(scratch, { recursive: true, force: true });
}
