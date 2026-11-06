import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { chromium } from "playwright";
import { ChromeTaskCoordinator, sharedChromeTasks } from "../src/server/services/chromeTaskCoordinator.ts";
import { withChromeBackupRecovery, registerChromeBackupSwitch, saveChromeBackupSettings, readChromeBackupSettings, saveChatResponse } from "../src/server/services/chromeBackupService.ts";
import { CHROME_BACKUP as C } from "../src/constants/chromeBackup.ts";
import { assertGeminiFlashQuota, selectGeminiThinkingModel } from "../src/server/services/geminiModelService.ts";
import { AiPlanningChatModel as M } from "../src/types.ts";
import { encodeGeminiChatModel } from "../src/constants/geminiChatModels.ts";
import { clickCurrentChatRetry } from "../src/server/services/chatRoomRecovery.ts";
const tick = () => new Promise<void>((resolve) => setImmediate(resolve));
const deferred = () => {
  let resolve!: () => void;
  const promise = new Promise<void>((done) => {
    resolve = done;
  });
  return { promise, resolve };
};
const root = await fs.mkdtemp(path.join(os.tmpdir(), "chrome-backup-"));
const previousStorage = process.env.VIDIFY_STORAGE_DIR;
const previousData = process.env.APP_DATA_DIR;
process.env.VIDIFY_STORAGE_DIR = root;
delete process.env.APP_DATA_DIR;
let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined;
try {
  const coordinator = new ChromeTaskCoordinator();
  const save = deferred();
  const order: string[] = [];
  const active = coordinator.run(async () => {
    order.push("received");
    await save.promise;
    order.push("saved");
  });
  let switches = 0;
  const first = coordinator.switch(0, async () => {
    switches++;
    order.push("closed");
  });
  const second = coordinator.switch(0, async () => {
    switches++;
  });
  const queued = coordinator.run(async () => {
    order.push("new");
  });
  await tick();
  assert.deepEqual(order, ["received"]);
  save.resolve();
  await Promise.all([active, first, second, queued]);
  assert.deepEqual(order, ["received", "saved", "closed", "new"]);
  assert.equal(switches, 1);
  await coordinator.switch(0, async () => {
    switches++;
  });
  assert.equal(switches, 1, "A late quota report from the old generation must not switch again");
  const cancelled = new AbortController();
  const hold = deferred();
  const switching = coordinator.switch(1, () => hold.promise);
  const abortWait = assert.rejects(
    coordinator.run(async () => assert.fail("Cancelled task ran"), cancelled.signal),
    /cancelled/,
  );
  cancelled.abort(new Error("cancelled"));
  await abortWait;
  hold.resolve();
  await switching;
  const failed = new ChromeTaskCoordinator();
  await assert.rejects(
    failed.switch(0, async () => {
      throw new Error("close rejected");
    }),
    /close rejected/,
  );
  assert.equal(await failed.run(async () => "still running"), "still running", "A failed handoff must not block other Chrome menus");
  assert.match(failed.failureMessage || "", /close rejected/);
  await assert.rejects(
    failed.switch(0, async () => assert.fail("Retried the handoff during the cooldown")),
    /close rejected/,
  );
  failed.resetFailure();
  assert.equal(failed.failureMessage, undefined);
  await failed.switch(0, async () => undefined);
  assert.equal(failed.generation, 1, "Toggling the setting allows an immediate handoff retry");
  const idle = new ChromeTaskCoordinator();
  assert.equal(idle.fail(new Error("disk full")), false, "A save error outside a handoff is not retained");
  assert.equal(await idle.run(async () => "ok"), "ok");
  assert.equal(idle.failureMessage, undefined);
  const saveFailed = new ChromeTaskCoordinator();
  const saving = deferred();
  const savingTask = saveFailed.run(async () => {
    await saving.promise;
    saveFailed.fail(new Error("disk full"));
  });
  const handoffFailed = assert.rejects(
    saveFailed.switch(0, async () => assert.fail("Closed before successful save")),
    /disk full/,
  );
  saving.resolve();
  await Promise.all([savingTask, handoffFailed]);
  const unknown = new ChromeTaskCoordinator();
  unknown.trackResponse("uncertain-room", true);
  await unknown.run(async () => undefined);
  await assert.rejects(
    unknown.switch(0, async () => assert.fail("Closed Chrome with an unconfirmed response")),
    /Chưa nhận và lưu xong/u,
  );
  unknown.trackResponse("uncertain-room", false);
  unknown.resetFailure();
  await unknown.switch(0, async () => undefined);
  assert.equal(unknown.generation, 1);
  assert.equal(readChromeBackupSettings().enabled, false);
  assert.equal(saveChatResponse({ projectId: "disabled" }, "kept in memory"), false, "Toggle off never journals chat responses");
  await assert.rejects(fs.readdir(path.join(root, C.RESULTS)), /ENOENT/);
  await assert.rejects(
    withChromeBackupRecovery(async () => {
      throw new Error(C.QUOTA);
    }),
    /gemini_flash_quota_exhausted/,
  );
  saveChromeBackupSettings({ enabled: true });
  await assert.rejects(
    withChromeBackupRecovery(async () => {
      throw new Error(C.QUOTA);
    }),
    (error: any) => error[C.ERROR_FLAG] && error.message === C.NOT_READY,
  );
  saveChromeBackupSettings({ ready: true });
  const otherSave = deferred();
  const other = withChromeBackupRecovery(async () => {
    await otherSave.promise;
    saveChatResponse({ projectId: "other", requestId: "received" }, "saved result");
  });
  let changes = 0;
  registerChromeBackupSwitch(async () => {
    changes++;
    assert.equal((await fs.readdir(path.join(root, C.RESULTS))).length, 1);
  });
  let calls = 0;
  const exhausted = () =>
    withChromeBackupRecovery(async () => {
      calls++;
      if (sharedChromeTasks.generation === 0) throw new Error(C.QUOTA);
      return "backup result";
    });
  const a = exhausted(),
    b = exhausted();
  await tick();
  assert.equal(changes, 0);
  otherSave.resolve();
  assert.deepEqual(await Promise.all([a, b]), ["backup result", "backup result"]);
  await other;
  assert.equal(changes, 1);
  assert.equal(calls, 4);
  assert.equal(readChromeBackupSettings().active, true);
  await assert.rejects(
    withChromeBackupRecovery(async () => {
      throw new Error(C.QUOTA);
    }),
    (error: any) => error[C.ERROR_FLAG] && error.message === C.EXHAUSTED,
  );
  browser = await chromium.launch({ channel: "chrome", headless: process.env.VIDIFY_VERIFY_CHROME_VISIBLE !== "1" });
  const page = await browser.newPage();
  const picker = (flash: string, pro: string, disabled = false) =>
    `<button data-test-id="bard-mode-menu-button" onclick="document.querySelector('[role=menu]').hidden=false">Flash-Lite</button><rich-textarea><textarea></textarea></rich-textarea><div role="menu" hidden><button role="menuitemradio">3.5 Flash-Lite</button><button role="menuitemradio" ${disabled ? 'aria-disabled="true"' : ""}>3.8 Flash ${flash}</button><button role="menuitemradio">3.1 Pro ${pro}</button></div><script>document.addEventListener('keydown',e=>{if(e.key==='Escape')document.querySelector('[role=menu]').hidden=true})</script>`;
  for (const disabled of [false, true]) {
    await page.setContent(picker("Hạn mức sẽ được đặt lại vào18:03…", "", disabled));
    await assert.rejects(selectGeminiThinkingModel(page, encodeGeminiChatModel(M.GeminiFlash, "medium")), /gemini_flash_quota_exhausted/);
    assert.equal(await page.getByRole("menu").count(), 0);
  }
  await page.setContent(picker("", "Hạn mức sẽ được đặt lại vào18:03…"));
  await page.locator("button").first().click();
  await assertGeminiFlashQuota(page, M.GeminiFlash);
  await page.setContent(picker("", "", true));
  await page.locator("button").first().click();
  await assertGeminiFlashQuota(page, M.GeminiFlash);
  await page.setContent('<model-response><button onclick="window.old=1">Thử lại</button></model-response><model-response><button onclick="window.current=1">Thử lại</button></model-response>');
  assert.equal(await clickCurrentChatRetry(page), true);
  assert.equal(await page.evaluate(() => (window as any).current), 1);
  assert.equal(await page.evaluate(() => (window as any).old), undefined);
  await page.setContent("<model-response><button disabled>Thử lại</button></model-response>");
  assert.equal(await clickCurrentChatRetry(page), false);
  await page.setContent('<model-response><button onclick="window.stale=1">Thử lại</button></model-response><user-query>New request still waiting</user-query>');
  assert.equal(await clickCurrentChatRetry(page), false, "Never retry the previous response after a newer user message");
  await page.setContent("<model-response><button>Thử lại</button></model-response><model-response>Latest response has no retry</model-response>");
  assert.equal(await clickCurrentChatRetry(page), false, "Never fall back to a retry button belonging to another turn");
  await page.setContent('<article data-testid="conversation-turn-1"><div data-message-author-role="assistant">Failed</div><button onclick="window.sibling=1">Retry</button></article>');
  assert.equal(await clickCurrentChatRetry(page), true, "ChatGPT actions can be siblings of assistant text");
  assert.equal(await page.evaluate(() => (window as any).sibling), 1);
  console.log("PASS: Flash quota menu including Flash-Lite, exact model scope, retry button scope, concurrent handoff, durable save before close, cancellation, disabled setting, missing backup and exhausted backup. No live AI.");
} finally {
  await browser?.close();
  if (previousStorage === undefined) delete process.env.VIDIFY_STORAGE_DIR;
  else process.env.VIDIFY_STORAGE_DIR = previousStorage;
  if (previousData === undefined) delete process.env.APP_DATA_DIR;
  else process.env.APP_DATA_DIR = previousData;
  await fs.rm(root, { recursive: true, force: true });
}
