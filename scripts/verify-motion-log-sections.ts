import assert from "node:assert/strict";
import { createServer } from "node:http";
import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { build } from "esbuild";
import { compile } from "@tailwindcss/node";
import { chromium } from "playwright";
import { MOTION_PROGRESS as P } from "../src/constants/motionProgress.js";
import { MOTION_ILLUSTRATION as I } from "../src/constants/motionIllustration.js";
import { motionLogSections } from "../src/features/motion/lib/motionLogSections.js";
import { MOTION_LOG_SECTIONS as S } from "../src/features/motion/constants/motionLogSections.js";
import { MOTION_LOG_SECTION_TEST as T } from "./motionLogSectionsVerificationTexts.js";
import { MotionJobStatus, MotionStoryJobKind } from "../src/types/motionVideo.js";
import type { MotionLogEntry, MotionStoryJobState } from "../src/types/motionVideo.js";
const entries = T.ENTRIES as unknown as MotionLogEntry[];
const job: MotionStoryJobState = {
  id: "run",
  kind: MotionStoryJobKind.PRODUCTION,
  status: MotionJobStatus.RENDERING,
  stage: "Ghép hình từ kho",
  progress: 0.5,
  startedAt: Date.now(),
  log: [],
  result: { analysis: {}, script: { beats: [{}] }, seo: { options: [{}] }, voice: { audioId: "accepted" } },
  activeAi: { read: { workerId: "read", provider: "gemini-chat", model: "flash", artifact: "motion-puppet-read", phase: "primary" }, seo: { workerId: "seo", provider: "gemini-chat", model: "flash", artifact: "motion-story-seo", phase: "primary" } },
};
const sections = motionLogSections(entries, "vi", job);
assert.deepEqual(
  sections.map((section) => section.key),
  S.CORE,
);
for (const key of ["analyze", "script", "seo", "voice"]) assert.equal(sections.find((section) => section.key === key)?.state, "done", key);
assert.equal(sections.find((section) => section.key === "scenes")?.state, "active");
assert.equal(sections.find((section) => section.key === "render")?.state, "waiting");
assert.ok(sections.find((section) => section.key === "scenes")?.summary.includes("cảnh 2/31"));
assert.equal(sections.find((section) => section.key === "scenes")?.rows.at(-1)?.visible, false);
const legacy = motionLogSections([{ id: "old", kind: "production", lines: ["09:00:00 · Prompt motion-story-analysis: 10000 ký tự.", "09:01:00 · Hoàn tất", "09:02:00 · Viết lời dẫn chương 1/2", "09:03:00 · Hoàn tất", "09:04:00 · Lấy nhân vật dựng sẵn trong kho cho: Tôi", "09:05:00 · Prompt motion-puppet-read: 8000 ký tự.", "09:06:00 · Lỗi: catalogKey must depict this exact noun phrase"] }]);
assert.equal(legacy.find((section) => section.key === "analyze")?.state, "done");
assert.equal(legacy.find((section) => section.key === "script")?.state, "done");
assert.equal(legacy.find((section) => section.key === "scenes")?.rows.length, 3);
assert.equal(legacy.find((section) => section.key === "scenes")?.rows.at(-1)?.message, S.TEXT.vi.objectError);
assert.equal(legacy.find((section) => section.key === "scenes")?.state, "error");
const invalid = motionLogSections([{ id: "schema", kind: "script", lines: ["09:00:00 · Lỗi: expected string, received null"] }]);
assert.equal(invalid.find((section) => section.key === "script")?.summary, S.TEXT.vi.invalidData);
assert.equal(invalid.find((section) => section.key === "script")?.state, "error");
const contextFailure = motionLogSections([{ id: "context", kind: "scenes", lines: ["18:02:53 · Lỗi: chat_planning_context_not_confirmed"] }]);
assert.equal(contextFailure.find((section) => section.key === "scenes")?.summary, S.TEXT.vi.contextError);
assert.equal(contextFailure.find((section) => section.key === "scenes")?.rows.at(-1)?.raw, "18:02:53 · Lỗi: chat_planning_context_not_confirmed");
const stopped = motionLogSections(entries, "vi", { ...job, status: MotionJobStatus.CANCELLED });
assert.equal(stopped.find((section) => section.key === "scenes")?.state, "cancelled");
assert.ok(!stopped.some((section) => section.state === "active"));
const parallel = motionLogSections([], "vi", { ...job, stage: "Ghép hình từ kho, Tạo giọng", result: {}, activeAi: {} });
assert.equal(parallel.find((section) => section.key === "scenes")?.state, "active");
assert.equal(parallel.find((section) => section.key === "voice")?.state, "active");
const staleStage = motionLogSections(entries, "vi", { ...job, stage: "Tạo SEO, Ghép hình từ kho, Tạo giọng" });
assert.equal(staleStage.find((section) => section.key === "seo")?.state, "done");
assert.equal(staleStage.find((section) => section.key === "voice")?.state, "done");
assert.equal(staleStage.find((section) => section.key === "scenes")?.state, "active");
const assembly = motionLogSections([{ id: "assembly", kind: "production", lines: [P.SCOPE(P.STAGE.ASSEMBLE, I.ASSEMBLY_START)] }], "vi", { ...job, id: "assembly", stage: P.STAGE.ASSEMBLE });
assert.equal(assembly.find((section) => section.key === "scenes")?.state, "active");
assert.ok(assembly.find((section) => section.key === "scenes")?.summary.includes(P.STAGE.ASSEMBLE));
const bundle = await build({ stdin: { contents: `const DATA=${JSON.stringify({ entries, job, longError: T.LONG_ERROR })};` + T.ENTRY, loader: "tsx", resolveDir: process.cwd() }, bundle: true, platform: "browser", format: "esm", write: false });
const compiler = await compile(await readFile("src/index.css", "utf8"), { base: path.resolve("src"), onDependency: () => {} });
const css = compiler.build(Object.values(S.UI).flatMap((value) => (typeof value === "string" ? [value] : Object.values(value)).flatMap((classes) => classes.split(/\s+/u))));
const server = createServer((req, res) => {
  res.setHeader("Content-Type", req.url === "/fixture.js" ? "text/javascript; charset=utf-8" : req.url === "/fixture.css" ? "text/css; charset=utf-8" : "text/html; charset=utf-8");
  res.end(req.url === "/fixture.js" ? bundle.outputFiles[0].text : req.url === "/fixture.css" ? css : T.HTML);
});
await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
const browser = await chromium.launch({ channel: "chrome", headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 900, height: 1150 } });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${(server.address() as any).port}`);
  const scene = page.locator('[data-motion-log-section="scenes"]');
  const rows = scene.locator("[data-motion-log-rows]");
  assert.equal(await page.locator("[data-motion-log-section]").count(), 6);
  assert.equal(await scene.locator("button").getAttribute("aria-expanded"), "true");
  assert.equal(await page.locator('[data-motion-log-section="seo"]').getAttribute("data-state"), "done");
  assert.ok(!(await rows.innerText()).includes("Prompt"));
  assert.ok(!(await page.locator("main").innerText()).includes("Prompt motion-puppet-read"));
  assert.ok(await rows.evaluate((box) => box.scrollHeight > box.clientHeight));
  assert.ok(await rows.evaluate((box) => box.scrollHeight - box.scrollTop - box.clientHeight < 2));
  await rows.evaluate((box) => {
    box.scrollTop = 0;
    box.dispatchEvent(new Event("scroll"));
  });
  await page.evaluate(() => (globalThis as any).appendLog());
  await page.waitForFunction(() => document.querySelector('[data-motion-log-section="scenes"] [data-motion-log-summary]')!.textContent!.includes("3/31"));
  assert.equal(await rows.evaluate((box) => box.scrollTop), 0);
  await rows.evaluate((box) => {
    box.scrollTop = box.scrollHeight;
    box.dispatchEvent(new Event("scroll"));
  });
  await page.evaluate(() => (globalThis as any).appendLog());
  await page.waitForFunction(() => document.querySelector('[data-motion-log-section="scenes"] [data-motion-log-rows]')!.textContent!.split("Đã xong cảnh 3/31").length === 3);
  assert.ok(await rows.evaluate((box) => box.scrollHeight - box.scrollTop - box.clientHeight < 2));
  await page.locator('[data-motion-log-section="seo"] button').click();
  assert.equal(await scene.locator("button").getAttribute("aria-expanded"), "true");
  await page.reload();
  await page.waitForFunction(() => document.querySelector('[data-motion-log-section="scenes"] [data-motion-log-summary]')!.textContent!.includes("3/31"));
  await page.evaluate(() => (globalThis as any).failLog());
  await page.waitForFunction(() => document.querySelector('[data-motion-log-section="scenes"]')!.getAttribute("data-state") === "error");
  assert.ok((await scene.locator("[data-motion-log-summary]").innerText()).includes("đồ vật"));
  assert.ok(!(await page.locator("main").innerText()).includes("catalogKey"));
  await scene.locator("summary").click();
  assert.ok((await scene.innerText()).includes("catalogKey must depict"));
  await scene.locator("summary").click();
  await page.evaluate(() => (globalThis as any).failLayout());
  await page.waitForFunction(() => !!document.querySelector("[data-sonner-toast] [data-title]"));
  const assertTwoLines = async () => {
    for (const element of [scene.locator("[data-motion-log-summary] span"), scene.locator("[data-motion-log-rows] span").last(), page.locator("[data-sonner-toast] [data-title]")]) {
      const size = await element.evaluate((node) => ({ height: node.clientHeight, scrollHeight: node.scrollHeight, lineHeight: parseFloat(getComputedStyle(node).lineHeight), clamp: getComputedStyle(node).webkitLineClamp }));
      assert.equal(size.clamp, "2");
      assert.ok(size.height <= size.lineHeight * 2 + 1, JSON.stringify(size));
      assert.ok(size.scrollHeight > size.height);
    }
  };
  await assertTwoLines();
  assert.equal(await page.locator("[data-sonner-toast] [data-title]").textContent(), T.LONG_ERROR);
  await scene.locator("summary").click();
  assert.ok((await scene.innerText()).includes(T.LONG_ERROR));
  await scene.locator("summary").click();
  await mkdir("scratch", { recursive: true });
  await page.screenshot({ path: T.SCREENSHOT, fullPage: true });
  await page.setViewportSize({ width: 360, height: 900 });
  await assertTwoLines();
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  assert.deepEqual(errors, []);
  process.stdout.write(T.PASSED);
} finally {
  await browser.close();
  await new Promise<void>((resolve) => server.close(() => resolve()));
}
