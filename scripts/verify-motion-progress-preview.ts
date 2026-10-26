import assert from "node:assert/strict";
import { createServer } from "node:http";
import { build } from "esbuild";
import { chromium } from "playwright";
import { motionFlowLogRows } from "../src/lib/motionLogHistory.js";
import { checkPuppetPlanReadiness } from "../src/server/services/puppet/planReadiness.js";
import { puppetKitThumb } from "../src/server/services/puppet/kitAdmin.js";
import { PROGRESS_PREVIEW_TEST as T } from "./motionProgressPreviewVerificationTexts.js";
import FIXTURE from "./fixtures/motion-house-altar-20261026.json";
const rows = motionFlowLogRows([
  { id: "main", kind: "production", lines: ["16:37:45 · Đang dựng", "16:39:49 · [Ghép hình][Đọc cảnh] Cảnh 2/31"] },
  { id: "seo", kind: "seo", lines: ["16:12:15 · SEO xong"] },
]);
assert.equal(rows[0].kind, "seo");
assert.equal(rows.at(-1)!.section, "Đọc cảnh");
const midnight = motionFlowLogRows([
  { id: "main", kind: "production", lines: ["23:59:58 · old", "00:00:02 · new"] },
  { id: "seo", kind: "seo", lines: ["23:59:59 · seo"] },
]);
assert.equal(midnight.at(-1)!.line, "00:00:02 · new");
const ready = (await checkPuppetPlanReadiness(FIXTURE as any))!;
const ids = ["nha_toi", "san_truoc"];
for (const key of ids) {
  const id = ready.places[key];
  assert.ok(id);
  assert.equal(puppetKitThumb("set", id), null);
  assert.ok(puppetKitThumb("set", id, ready.pack)?.svg?.includes("<svg"));
}
assert.equal(puppetKitThumb("set", "set-missing", ready.pack), null);
assert.throws(() => puppetKitThumb("set", ready.places.nha_toi, { ...ready.pack!, fingerprint: "invalid" }));
const gen = { version: 1, styleId: ready.pack!.styleId, pack: ready.pack, sets: ready.places, characters: ready.characters, props: ready.props, frames: {}, places: Object.fromEntries(FIXTURE.places.map((place) => [place.key, { ...place, desc: place.description }])) };
const data = { analysis: FIXTURE, script: { beats: [], gen: { puppet: gen } } };
const bundle = await build({ stdin: { contents: `const DATA=${JSON.stringify(data)};` + T.ENTRY, loader: "tsx", resolveDir: process.cwd() }, bundle: true, platform: "browser", format: "esm", write: false });
const server = createServer((req, res) => {
  if (req.url === "/fixture.js") {
    res.setHeader("Content-Type", "text/javascript; charset=utf-8");
    res.end(bundle.outputFiles[0].text);
    return;
  }
  const match = req.url?.match(/^\/api\/motion-video\/kit\/thumb\/([^/]+)\/([^/?]+)/u);
  if (match) {
    const thumb = puppetKitThumb(match[1], match[2], ready.pack);
    res.writeHead(thumb?.svg ? 200 : 404, { "Content-Type": "image/svg+xml" });
    res.end(thumb?.svg || "");
    return;
  }
  if (req.url === "/missing-image") {
    res.writeHead(404);
    res.end();
    return;
  }
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.end(T.HTML);
});
await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
const browser = await chromium.launch({ channel: "chrome", headless: true });
try {
  const page = await browser.newPage();
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${(server.address() as any).port}`);
  await page.waitForFunction(() => [...document.querySelectorAll('img[alt="Nhà tôi"],img[alt="Sân trước"]')].length === 2 && [...document.querySelectorAll<HTMLImageElement>('img[alt="Nhà tôi"],img[alt="Sân trước"]')].every((img) => img.src.startsWith("blob:") && img.naturalWidth > 0));
  await page.locator('div[title="Nhà tôi"]').click();
  await page.waitForFunction(() => (globalThis as any).preview?.type === "location");
  assert.equal(await page.evaluate(() => (globalThis as any).preview.id), "nha_toi");
  await page.waitForFunction(() => document.querySelector<HTMLImageElement>("#preview img")!.naturalWidth > 0);
  await page.evaluate(() => (globalThis as any).appendScene());
  await page.waitForFunction(() => document.querySelector('[data-motion-log-section="scenes"] [data-motion-log-summary]')!.textContent!.includes("Đã xong cảnh 1/31"));
  assert.equal(await page.locator('[data-motion-log-section="scenes"] [data-motion-log-rows]').evaluate((box) => box.scrollHeight - box.scrollTop - box.clientHeight), 0);
  assert.ok((await page.locator('[role="status"]').allTextContents()).some((line) => line.includes("Không tải được ảnh")));
  assert.deepEqual(errors, []);
  console.log(T.PASSED);
} finally {
  await browser.close();
  await new Promise<void>((resolve) => server.close(() => resolve()));
}
