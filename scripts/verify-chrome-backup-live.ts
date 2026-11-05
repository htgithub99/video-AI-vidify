import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { prepareBackupChrome, checkBackupChrome, getOrLaunchGlobalBrowser, closeAppBrowserAfterTask } from "../src/server/services/imageGeneratorService.ts";
import { readChromeBackupSettings, saveChromeBackupSettings, withChromeBackupRecovery, saveChatResponse } from "../src/server/services/chromeBackupService.ts";
import { prepareChatPlanningRoom, getChatPlanningRoom, closeChatPlanningRoomsForProject, generatePlanningWithChatUi } from "../src/server/services/chatUiPlanningService.ts";
import { selectGeminiThinkingModel } from "../src/server/services/geminiModelService.ts";
import { CHROME_BACKUP as C } from "../src/constants/chromeBackup.ts";
import { AiPlanningFallbackProvider as P, AiPlanningChatModel as M } from "../src/types.ts";
import { sharedChromeTasks } from "../src/server/services/chromeTaskCoordinator.ts";
const before = readChromeBackupSettings();
const projectId = `chrome-backup-live-${Date.now()}`;
const request = { provider: P.GeminiChat, model: "gemini-flash::medium" as M, projectId, prompt: "", chromeHeadless: false, closeRoomOnComplete: false };
const events: string[] = [];
const failures: string[] = [];
const record = (line: string) => {
  events.push(line);
  console.log(line);
};
let initial: Awaited<ReturnType<typeof getOrLaunchGlobalBrowser>> | undefined;
try {
  await prepareBackupChrome();
  await new Promise((resolve) => setTimeout(resolve, 3000));
  assert.equal((await checkBackupChrome()).ready, true, C.NOT_READY);
  saveChromeBackupSettings({ enabled: true, ready: true });
  initial = await getOrLaunchGlobalBrowser(false, true);
  const workers = Array.from({ length: 5 }, (_, i) => `live-scene-${i}`);
  const warmup = await Promise.allSettled(workers.map((workerId) => prepareChatPlanningRoom({ ...request, workerId })));
  for (const [index, result] of warmup.entries())
    if (result.status === "rejected") {
      const page = getChatPlanningRoom({ ...request, workerId: workers[index] });
      await fs.mkdir("scratch/chrome-live", { recursive: true });
      await page?.screenshot({ path: `scratch/chrome-live/warmup-${index}.png` });
      throw result.reason;
    }
  for (const workerId of workers) assert.ok(getChatPlanningRoom({ ...request, workerId }));
  await selectGeminiThinkingModel(getChatPlanningRoom({ ...request, workerId: workers[0] })!, request.model);
  record("Five actual Chrome rooms ready; Flash/medium verified");
  record("Primary live request previously failed with provider_error_response; continuing lifecycle verification without repeating it");
  const saved = new Promise<void>((resolve) =>
    setTimeout(() => {
      saveChatResponse({ projectId, requestId: projectId + "-drain" }, JSON.stringify({ test: "synthetic concurrent save at real handoff boundary" }));
      record("Concurrent result saved");
      resolve();
    }, 1500),
  );
  const inFlight = sharedChromeTasks.run(() => saved);
  let attempts = 0;
  await withChromeBackupRecovery(
    async () => {
      if (attempts++ === 0) throw new Error(C.QUOTA);
      assert.ok(
        initial!.context.pages().every((page) => page.isClosed()),
        "Old Chrome must be closed before backup work",
      );
      assert.ok(events.includes("Concurrent result saved"));
      await prepareChatPlanningRoom({ ...request, workerId: "live-backup" });
      const page = getChatPlanningRoom({ ...request, workerId: "live-backup" })!;
      await selectGeminiThinkingModel(page, request.model);
      record("Actual backup Chrome opened; Flash/medium verified");
    },
    undefined,
    record,
  );
  await inFlight;
  assert.equal(attempts, 2);
  assert.equal(readChromeBackupSettings().active, true);
  try {
    const backupResult = await generatePlanningWithChatUi({ ...request, workerId: "live-backup", requestId: projectId + "-backup", artifactType: "chrome-backup-live", signal: AbortSignal.timeout(120000), prompt: `Return exactly this JSON, without explanation: {"artifactType":"chrome-backup-live","requestId":"${projectId}-backup","ok":true}` });
    assert.match(backupResult.text, /"ok"\s*:\s*true/);
    record("Real Flash request completed in backup Chrome");
  } catch (error) {
    failures.push(String(error));
    record("Backup live request failed: " + String(error));
  }
  await fs.mkdir("docs/qa", { recursive: true });
  await fs.writeFile(path.join("docs/qa", "chrome-backup-live-2026-11-05.json"), JSON.stringify({ at: new Date().toISOString(), visibleChrome: true, quotaSignal: "injected only at handoff boundary; live accounts currently have quota", concurrentSave: "synthetic saved payload; real coordinator and browser lifecycle", events, failures }, null, 2));
  if (failures.length) process.exitCode = 1;
  console.log(JSON.stringify(events, null, 2));
} finally {
  saveChromeBackupSettings({ enabled: before.enabled });
  await closeChatPlanningRoomsForProject(request, false);
  await closeAppBrowserAfterTask(true);
}
