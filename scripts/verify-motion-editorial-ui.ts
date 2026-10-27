import assert from "node:assert/strict";
import { createServer } from "node:http";
import { mkdir } from "node:fs/promises";
import { build } from "esbuild";
import { chromium } from "playwright";
import { MOTION_EDITORIAL_VERIFICATION as V } from "./motionEditorialVerificationTexts.ts";
import { MOTION_DRAFT_VERIFICATION as D } from "./motionDraftVerificationTexts.ts";
import { MOTION_EDITORIAL } from "../src/constants/motionEditorial.ts";
import { mergeMotionLogHistory } from "../src/lib/motionLogHistory.ts";
const bundle = await build({
  stdin: { contents: V.ENTRY, loader: D.TSX, resolveDir: process.cwd() },
  bundle: true,
  platform: D.BROWSER,
  format: "esm",
  write: false,
  plugins: [
    {
      name: D.FIXTURE,
      setup(builder) {
        builder.onLoad({ filter: D.PATTERNS.API_MODULE }, () => ({ contents: D.API_STUB + "export const formatMotionProgress = String; export const formatSeconds = String;" }));
        builder.onLoad({ filter: D.PATTERNS.ACTIVITY_MODULE }, () => ({ contents: D.ACTIVITY_STUB }));
        builder.onResolve({ filter: D.PATTERNS.TOAST_MODULE }, () => ({ path: D.TOAST_MODULE, namespace: D.FIXTURE }));
        builder.onLoad({ filter: D.PATTERNS.ANY, namespace: D.FIXTURE }, () => ({ contents: D.TOAST_STUB }));
      },
    },
  ],
});
const server = createServer((req, res) => {
  res.setHeader("Content-Type", req.url === "/fixture.js" ? "text/javascript; charset=utf-8" : "text/html; charset=utf-8");
  res.end(req.url === "/fixture.js" ? bundle.outputFiles[0].text : V.HTML);
});
await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
const browser = await chromium.launch({ channel: D.CHROME, headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 760, height: 650 } });
  const errors: string[] = [];
  page.on(D.PAGE_ERROR, (error) => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${(server.address() as any).port}`);
  await page.waitForFunction(() => (window as any).motionDraftStudio?.logHistory.length === 36 && !(window as any).motionDraftStudio.state.activeStoryJobId);
  const logs = await page.evaluate(() => (window as any).motionDraftStudio.logHistory);
  assert.equal(logs.at(-1).lines[0], V.LIVE_LINE);
  const journal = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), MOTION_EDITORIAL.LOG_STORAGE_KEY);
  assert.deepEqual(journal, JSON.parse(JSON.stringify(logs)));
  await page.reload();
  await page.waitForFunction(() => (window as any).motionDraftStudio?.logHistory.length === 36);
  assert.deepEqual(await page.evaluate(() => (window as any).motionDraftStudio.logHistory), JSON.parse(JSON.stringify(logs)));
  const status = page.locator("p[title]");
  assert.equal(await status.innerText(), V.LABEL);
  assert.equal((await status.getAttribute("title"))!.split("\n").length, 3);
  assert.equal(await status.evaluate((element) => element.getBoundingClientRect().height), 20);
  await page.setViewportSize({ width: 360, height: 650 });
  assert.equal(await status.evaluate((element) => element.getBoundingClientRect().height), 20);
  await page.setViewportSize({ width: 760, height: 650 });
  await mkdir("scratch", { recursive: true });
  await page.screenshot({ path: V.SCREENSHOT });
  await page.getByRole("button", { name: V.NEW_BUTTON }).click();
  await page.waitForFunction(() => (window as any).motionDraftStudio.logHistory.length === 1 && (window as any).motionDraftStudio.logHistory[0].id === (window as any).motionDraftStudio.state.productionId);
  const newId = await page.evaluate(() => (window as any).motionDraftStudio.state.productionId);
  await page.reload();
  await page.waitForFunction((id) => (window as any).motionDraftStudio?.logHistory[0]?.id === id, newId);
  assert.equal(await page.evaluate(() => (window as any).motionDraftStudio.logHistory.length), 1);
  const original = [{ id: D.JOB_ID, kind: "scenes", lines: ["a", "b", "c"] }];
  assert.deepEqual(mergeMotionLogHistory(original, D.JOB_ID, "scenes", ["b", "c", "d"])[0].lines, ["a", "b", "c", "d"]);
  assert.equal(mergeMotionLogHistory(original, D.JOB_ID, "scenes", ["a", "b"]), original);
  assert.deepEqual(errors, []);
  process.stdout.write(V.PASSED);
} finally {
  await browser.close();
  await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
}
