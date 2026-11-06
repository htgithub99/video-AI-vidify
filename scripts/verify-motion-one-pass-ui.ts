import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";
import { findNativeChrome } from "../src/server/services/nativeProxyBrowser.ts";
import { MOTION_VISUAL as V } from "../src/constants/motionVisual.ts";
import { MOTION_VIDEO_TEXTS as T } from "../src/constants/motionVideoTexts.ts";
import { getMotionEngineClientScript } from "../src/features/motion/server/services/motionEngineService.ts";
const out = path.resolve("scratch/motion-one-pass-20261106/ui");
const baseUrl = process.env.QA_MOTION_BASE_URL || "http://127.0.0.1:5207";
await fs.mkdir(out, { recursive: true });
const browser = await chromium.launch({ executablePath: findNativeChrome(), headless: false });
const errors: string[] = [];
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1050 } });
  page.on("pageerror", (error) => errors.push(error.message));
  await page.route("**/api/**", (route) => (new URL(route.request().url()).pathname === "/api/motion-video/engine" ? route.fulfill({ contentType: "application/javascript", body: getMotionEngineClientScript() }) : route.fulfill({ contentType: "application/json", body: JSON.stringify({ success: true, items: [], projects: [], channels: [], presets: [], config: {} }) })));
  await page.route("**/qa-seed", (route) => route.fulfill({ contentType: "text/html", body: "<html><body>Isolated QA browser state</body></html>" }));
  await page.goto(`${baseUrl}/qa-seed`);
  await page.evaluate(async () => {
    localStorage.setItem("active_tab", "motion-video");
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open("VidifyDB", 1);
      request.onupgradeneeded = () => request.result.createObjectStore("app_settings");
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction("app_settings", "readwrite");
      transaction.objectStore("app_settings").put(JSON.stringify({ visualSettings: { version: 1, mode: "remotion", engine: "remotion", profileId: "history", componentRevision: 1 }, aiReview: true, autoRun: false, autoExport: false, autoContinue: false }), "motion_story_state_v1");
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
    db.close();
  });
  await page.goto(`${baseUrl}/`);
  const mode = page.getByRole("group", { name: V.TEXT.vi.title });
  await mode.waitFor({ timeout: 60000 });
  await page.getByRole("combobox", { name: V.TEXT.vi.profile }).waitFor();
  for (const profile of ["history", "horror", "explainer"]) {
    await page.getByRole("combobox", { name: V.TEXT.vi.profile }).selectOption(profile);
    assert.equal(await page.getByRole("switch", { name: T.vi.AI_REVIEW, exact: true }).count(), 0);
  }
  await page.screenshot({ path: path.join(out, "remotion.png"), fullPage: true });
  const before = await mode.getByRole("switch").allTextContents();
  await mode.getByRole("switch").click();
  await page.getByRole("combobox", { name: V.TEXT.vi.profile }).waitFor({ state: "hidden" });
  const text = await page.locator("body").innerText();
  await fs.writeFile(path.join(out, "library-text.txt"), text);
  assert.equal(await page.getByRole("switch", { name: T.vi.AI_REVIEW, exact: true }).count(), 1, "Legacy library retains its review control");
  await page.screenshot({ path: path.join(out, "library.png"), fullPage: true });
  assert.deepEqual(errors, []);
  await fs.writeFile(path.join(out, "verification.json"), JSON.stringify({ at: new Date().toISOString(), visibleInstalledChrome: true, profiles: 3, remotionReviewHidden: true, libraryReviewPreserved: true, pageErrors: errors, modeButton: before, scope: "Actual Vite frontend; isolated browser storage and read-only API fixtures; no user project modified" }, null, 2));
  console.log("PASS: actual frontend on visible installed Chrome — review hidden across three Remotion profiles, legacy library control retained, no page errors.");
} catch (error) {
  await fs.writeFile(path.join(out, "failure.json"), JSON.stringify({ error: String(error), errors }, null, 2));
  throw error;
} finally {
  await browser.close();
}
