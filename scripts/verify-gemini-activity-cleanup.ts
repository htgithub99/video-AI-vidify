import assert from "node:assert/strict";
import { build } from "esbuild";
import { chromium } from "playwright";
import { mkdir, readFile, writeFile, rm } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { GEMINI_ACTIVITY_FIXTURE as F } from "./geminiActivityCleanupVerificationTexts.ts";
import { GEMINI_ACTIVITY_CLEANUP as C } from "../src/constants/geminiActivityCleanup.ts";
import { EXTERNAL_URLS } from "../src/constants/apiRoutes.ts";
const output = path.resolve(`node_modules/.cache/gemini-activity-cleanup-${process.pid}.mjs`);
const browser = await chromium.launch({ headless: true });
try {
  const built = await build({
    stdin: { contents: F.ENTRY, resolveDir: process.cwd(), loader: "ts" },
    bundle: true,
    platform: "node",
    format: "esm",
    packages: "external",
    write: false,
    plugins: [
      {
        name: "cleanup-fixture",
        setup(builder) {
          builder.onLoad({ filter: /constants[\\/]geminiActivityCleanup\.ts$/ }, async (args) => ({
            contents: (await readFile(args.path, "utf8")).replace("ACTION_TIMEOUT_MS: 8000", "ACTION_TIMEOUT_MS: 300").replace("RESULT_TIMEOUT_MS: 30000", "RESULT_TIMEOUT_MS: 1200").replace("TIMEOUT_MS: 60000", "TIMEOUT_MS: 2000").replace("POLL_MS: 200", "POLL_MS: 5").replace("RETRY_MS: 500", "RETRY_MS: 5"),
            loader: "ts",
          }));
          builder.onResolve({ filter: /musicDiagnosticService\.js$/ }, () => ({ path: "diagnostics", namespace: "fixture" }));
          builder.onLoad({ filter: /.*/, namespace: "fixture" }, () => ({ contents: "export const writeMusicDiagnostic=async()=>{};", loader: "js" }));
        },
      },
    ],
  });
  await mkdir(path.dirname(output), { recursive: true });
  await writeFile(output, built.outputFiles[0].text);
  const service = await import(pathToFileURL(output).href);
  const fixture = async (mode = F.MODE.CONFIRM, language = "vi") => {
    const context = await browser.newContext();
    const pages: import("playwright").Page[] = [];
    const events: string[][] = [];
    let visits = 0;
    await context.route(EXTERNAL_URLS.GEMINI_ACTIVITY, async (route) => {
      visits++;
      await route.fulfill({ contentType: "text/html", body: F.HTML(mode, language) });
    });
    context.on("page", (page) => {
      pages.push(page);
    });
    const newPage = context.newPage.bind(context);
    context.newPage = async () => {
      const page = await newPage();
      await page.exposeFunction("record", (values: string[]) => events.push(values));
      return page;
    };
    let closed = 0;
    const close = async () => {
      events.push(["close"]);
      closed++;
      return true;
    };
    return { context, close, pages, events, visits: () => visits, closed: () => closed };
  };
  for (const language of ["vi", "en"])
    for (const mode of [F.MODE.CONFIRM, F.MODE.DIRECT, F.MODE.EMPTY, F.MODE.EMPTY_ONLY, F.MODE.DELAYED, F.MODE.EXPANDED]) {
      const f = await fixture(mode, language);
      const logs: string[] = [];
      service.requestGeminiActivityCleanup(f.context, "video-test", undefined, (line: string) => logs.push(line));
      assert.equal(await service.closeAfterGeminiActivityCleanup(f.context, f.close), true);
      assert.equal(f.closed(), 1);
      assert.equal(service.hasPendingGeminiActivityCleanup(f.context), false);
      assert.ok(logs.includes(mode.startsWith("empty") ? C.NO_ACTIVITY : C.COMPLETE));
      assert.equal(f.visits(), 1);
      assert.deepEqual(f.events.flat(), mode.startsWith("empty") ? ["close"] : mode === F.MODE.DIRECT ? ["open", "day", "deleted", "close"] : ["open", "day", "confirm", "deleted", "close"]);
      service.requestGeminiActivityCleanup(f.context, "video-test");
      assert.equal(await service.closeAfterGeminiActivityCleanup(f.context, f.close), true);
      assert.equal(f.visits(), 1, "Repeated export without new Gemini work must not delete again");
      assert.ok(!f.events.flat().some((event) => ["all", "hour"].includes(event)));
      await f.context.close();
    }
  for (const mode of [F.MODE.WRONG, F.MODE.STUCK, F.MODE.UNCONFIRMED]) {
    const f = await fixture(mode);
    service.requestGeminiActivityCleanup(f.context, mode);
    assert.equal(await service.closeAfterGeminiActivityCleanup(f.context, f.close), false);
    assert.equal(f.closed(), 0);
    assert.equal(f.visits(), mode === F.MODE.WRONG ? 2 : 1);
    assert.equal(await service.closeAfterGeminiActivityCleanup(f.context, f.close), false);
    assert.equal(f.visits(), mode === F.MODE.WRONG ? 2 : 1, "An unconfirmed deletion must not be resubmitted by another close path");
    assert.equal(service.hasPendingGeminiActivityCleanup(f.context), true);
    await f.context.close();
  }
  const shared = await fixture();
  const release = await service.acquireGeminiActivityUse(shared.context);
  service.requestGeminiActivityCleanup(shared.context, "shared");
  assert.equal(await service.closeAfterGeminiActivityCleanup(shared.context, shared.close), false);
  assert.equal(shared.visits(), 0);
  release();
  await Promise.all([service.closeAfterGeminiActivityCleanup(shared.context, shared.close), service.closeAfterGeminiActivityCleanup(shared.context, shared.close)]);
  assert.equal(shared.visits(), 1);
  assert.equal(shared.closed(), 1);
  const newWork = await service.acquireGeminiActivityUse(shared.context);
  newWork();
  service.requestGeminiActivityCleanup(shared.context, "new-video");
  await service.closeAfterGeminiActivityCleanup(shared.context, shared.close);
  assert.equal(shared.visits(), 2, "New Gemini activity after cleanup must be cleaned again");
  await shared.context.close();
  const locked = await fixture(F.MODE.STUCK);
  const controller = new AbortController();
  service.requestGeminiActivityCleanup(locked.context, "cancelled", controller.signal);
  const deleting = service.closeAfterGeminiActivityCleanup(locked.context, locked.close);
  while (!locked.pages.length) await new Promise((resolve) => setTimeout(resolve, 5));
  await locked.pages[0].waitForFunction(() => (window as any).events?.includes("confirm"));
  let acquired = false;
  const next = service.acquireGeminiActivityUse(locked.context).then((unlock: () => void) => {
    acquired = true;
    unlock();
  });
  await new Promise((resolve) => setTimeout(resolve, 20));
  assert.equal(acquired, false);
  controller.abort();
  assert.equal(await deleting, false);
  await next;
  assert.equal(acquired, true);
  assert.equal(locked.closed(), 0);
  await locked.context.close();
  process.stdout.write(F.PASSED);
} finally {
  await browser.close();
  await rm(output, { force: true });
}
