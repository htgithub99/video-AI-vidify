import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { chromium } from "playwright";
import { attachGeminiLocalFiles, reconcileGeminiQueuedFiles } from "../src/server/services/geminiFileAttachmentService.js";
import { geminiUploadPolicy, verifyGeminiSubmittedFiles } from "../src/server/services/geminiUploadReadiness.js";
import { readClaudeUploadState, waitForClaudeUploads } from "../src/server/services/claudeUploadReadiness.js";
import { ChatUploadError } from "../src/server/services/chatUploadRecovery.js";
import { AsyncTaskLimiter } from "../src/lib/asyncTaskLimiter.js";
import { SUNO_AUTOMATION_CONFIG } from "../src/constants/sunoAutomation.js";
const dir = await fs.mkdtemp(path.join(os.tmpdir(), "vidify-gemini-progress-"));
const files = await Promise.all(
  Array.from({ length: 10 }, async (_, i) => {
    const name = `${String(i + 1).padStart(2, "0")}-Nhạc-${"abcdef".repeat(8)}.mp3`;
    const filePath = path.join(dir, name);
    await fs.writeFile(filePath, "fixture");
    return { name, path: filePath, mimeType: "audio/mpeg" };
  }),
);
const browser = await chromium.launch({ headless: true });
try {
  const context = await browser.newContext();
  assert.equal(SUNO_AUTOMATION_CONFIG.EVALUATION_ROOM_CONCURRENCY, 5);
  const pages = await Promise.all(Array.from({ length: 5 }, () => context.newPage()));
  const fixture = `<style>input-area-v2,uploader-file-preview{display:block}.close{display:none}</style>
    <input-area-v2><button aria-label="Nội dung tải lên và công cụ" onclick="setTimeout(()=>document.querySelector('#menu').hidden=false,250)">+</button>
    <div id="menu" role="menu" hidden><div role="menuitem" aria-label="Tải tệp lên. Tài liệu, dữ liệu, tệp mã nguồn" onclick="document.querySelector('#menu').hidden=true;const input=document.createElement('input');input.type='file';input.multiple=true;input.accept='audio/*';input.onchange=e=>{window.selectedAt=Date.now();for(const f of e.target.files){const node=document.createElement('uploader-file-preview');const id='tip-'+f.name;node.innerHTML='<div aria-describedby=&quot;'+id+'&quot;><span>'+f.name.slice(0,8)+'...'+f.name.slice(-10)+'</span><button class=close aria-label=&quot;close '+f.name.slice(0,8)+'...&quot;>x</button><div role=progressbar></div></div>';document.querySelector('input-area-v2').prepend(node);const tip=document.createElement('div');tip.id=id;tip.hidden=true;tip.textContent=f.name;document.body.append(tip);}setTimeout(()=>{document.querySelectorAll('[role=progressbar]').forEach(n=>{n.outerHTML='<span class=gem-attachment-content>MP3</span>'});window.readyAt=Date.now()},1800)};input.click()">Tải tệp lên</div></div>
    <div id="input" contenteditable="true">Evaluate</div><button aria-label="Send message">Send</button></input-area-v2>`;
  await Promise.all(pages.map((page) => page.setContent(fixture)));
  const states: Array<{ phase: string; at: number; room: number }> = [];
  await Promise.all(
    pages.map(async (page, room) => {
      await attachGeminiLocalFiles(page, page.locator("input-area-v2"), files);
      assert.equal(await page.locator("#menu").isVisible(), false);
      const state = await readClaudeUploadState(page.locator("#input"), geminiUploadPolicy);
      assert.equal(state.count, 10);
      assert.equal(state.labels.length, 10, "Hidden close buttons must not hide file identities");
      assert.equal(state.readyCount, 0, "Selected chips with a spinner are not uploaded");
      states.push({ phase: "selected", at: Date.now(), room });
      await waitForClaudeUploads(page.locator("#input"), files, 5000, undefined, undefined, 100, true, geminiUploadPolicy);
      states.push({ phase: "ready", at: Date.now(), room });
    }),
  );
  assert.ok(Math.max(...states.filter((s) => s.phase === "selected").map((s) => s.at)) < Math.min(...states.filter((s) => s.phase === "ready").map((s) => s.at)), "All five tabs must select files while the other tabs still upload");
  const page = pages[0];
  const input = page.locator("#input");
  assert.equal((await reconcileGeminiQueuedFiles(page, input, page.locator("input-area-v2"), files)).length, 0, "A complete queued batch must not be uploaded again");
  await page
    .locator(".gem-attachment-content")
    .first()
    .evaluate((node) => (node.className = "unknown-file-state"));
  await assert.rejects(waitForClaudeUploads(input, files, 40, undefined, undefined, 0, true, geminiUploadPolicy), "No network activity plus ten names is insufficient without ready components");
  await page.locator(".unknown-file-state").evaluate((node) => (node.className = "gem-attachment-content"));
  await page
    .locator("uploader-file-preview")
    .first()
    .evaluate((node) => node.querySelector("[aria-describedby]")!.setAttribute("aria-describedby", "missing-tooltip"));
  await assert.rejects(waitForClaudeUploads(input, files, 40, undefined, undefined, 0, true, geminiUploadPolicy));
  await page
    .locator("uploader-file-preview")
    .first()
    .evaluate((node, name) => node.querySelector("[aria-describedby]")!.setAttribute("aria-describedby", "tip-" + name), files[9].name);
  await page
    .locator("uploader-file-preview")
    .first()
    .evaluate((node) => node.classList.add("gem-attachment-loading-error"));
  await assert.rejects(waitForClaudeUploads(input, files, 100, undefined, undefined, 0, true, geminiUploadPolicy), (error: unknown) => error instanceof ChatUploadError);
  await page.addStyleTag({ content: ".close { position:absolute } uploader-file-preview:hover .close { display:block }" });
  await page.locator(".close").evaluateAll((nodes) => nodes.forEach((node) => node.setAttribute("onclick", "this.closest('uploader-file-preview').remove()")));
  const retryFiles = await reconcileGeminiQueuedFiles(page, input, page.locator("input-area-v2"), files);
  assert.deepEqual(
    retryFiles.map((file) => file.name),
    [files[9].name],
  );
  assert.equal((await readClaudeUploadState(input, geminiUploadPolicy)).count, 9, "Keep the nine healthy files when one upload failed");
  await attachGeminiLocalFiles(page, page.locator("input-area-v2"), retryFiles);
  await waitForClaudeUploads(input, files, 5000, undefined, undefined, 0, true, geminiUploadPolicy);
  const prompt = "Upload verification request-123";
  await page.setContent(`<user-query>${prompt}${files.map((f) => `<user-query-file-preview><button aria-label="${f.name}">${f.name}</button></user-query-file-preview>`).join("")}</user-query>`);
  await verifyGeminiSubmittedFiles(page, files, 0, prompt, undefined, 500);
  await assert.rejects(verifyGeminiSubmittedFiles(page, files, 1, prompt, undefined, 30), (error: unknown) => error instanceof ChatUploadError && !error.retryable, "Do not mistake an old message for this submission");
  await page
    .locator("user-query-file-preview")
    .last()
    .evaluate((node) => node.remove());
  await assert.rejects(verifyGeminiSubmittedFiles(page, files, 0, prompt, undefined, 30));
  const missing = pages[1];
  await missing.setContent('<div id="composer"><button aria-label="Attach files">+</button></div>');
  await assert.rejects(attachGeminiLocalFiles(missing, missing.locator("#composer"), files), (error: unknown) => error instanceof ChatUploadError && !error.retryable);
  assert.equal(missing.listenerCount("filechooser"), 0);
  await missing.setContent('<div id="composer"><input type="file" accept="audio/*" multiple hidden></div><div role="menu"><div role="menuitem" aria-label="Tải tệp lên">Tải tệp lên</div></div><script>document.addEventListener("keydown",event=>{if(event.key==="Escape")document.querySelector("[role=menu]").hidden=true})</script>');
  assert.equal(await attachGeminiLocalFiles(missing, missing.locator("#composer"), files), "cdp");
  assert.equal(await missing.getByRole("menu").isVisible(), false, "Direct file input assignment must also close an already open upload dropdown");
  const slots = new AsyncTaskLimiter(SUNO_AUTOMATION_CONFIG.EVALUATION_ROOM_CONCURRENCY);
  let active = 0,
    peak = 0;
  await Promise.all(
    [0, 1, 2, 3, 4, 5, 6].map(() =>
      slots.run(async () => {
        active++;
        peak = Math.max(peak, active);
        await new Promise((resolve) => setTimeout(resolve, 30));
        active--;
      }),
    ),
  );
  assert.equal(peak, 5);
  console.log("PASS: delayed Gemini menu, ten full tooltip names with hidden close buttons, positive ready state, five overlapping uploads, missing/error files, exact submitted message, terminal UI failure and chooser cleanup.");
} finally {
  await browser.close();
  assert.ok(path.resolve(dir).startsWith(path.resolve(os.tmpdir()) + path.sep) && path.basename(dir).startsWith("vidify-gemini-progress-"));
  await fs.rm(dir, { recursive: true, force: true });
}
