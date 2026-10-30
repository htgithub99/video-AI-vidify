import assert from "node:assert/strict";
import { build } from "esbuild";
import { chromium } from "playwright";
import { API_ROUTES } from "../src/constants/apiRoutes.js";
import { MOTION_DRAFT_VERIFICATION as D } from "./motionDraftVerificationTexts.js";

const bundle = await build({
  stdin: { contents: 'import React from "react"; import { createRoot } from "react-dom/client"; import Creator from "./src/features/motion/components/MotionVideoCreator.tsx"; createRoot(document.getElementById("root")).render(<Creator currentLang="vi" />);', loader: "tsx", resolveDir: process.cwd() },
  bundle: true, platform: "browser", format: "iife", jsx: "automatic", write: false,
  define: { "import.meta": "{}" },
  plugins: [{
    name: "results-selection-fixture",
    setup(builder) {
      builder.onLoad({ filter: D.PATTERNS.API_MODULE }, () => ({ contents: D.API_STUB + 'export const formatMotionProgress = String; export const formatSeconds = String; export const formatBytes = String; export const readFileBase64 = async () => { throw new Error("Unexpected upload"); }; export const motionAudioUrl = () => undefined; export const genPreviewUrl = () => "";' }));
      builder.onLoad({ filter: D.PATTERNS.STORAGE_MODULE }, () => ({ contents: D.STORAGE_STUB }));
      builder.onLoad({ filter: D.PATTERNS.ACTIVITY_MODULE }, () => ({ contents: D.ACTIVITY_STUB }));
      builder.onResolve({ filter: D.PATTERNS.TOAST_MODULE }, () => ({ path: "sonner", namespace: "results-selection-fixture" }));
      builder.onLoad({ filter: /.*/, namespace: "results-selection-fixture" }, () => ({ contents: D.TOAST_STUB }));
    },
  }],
});
const browser = await chromium.launch({ channel: "chrome", headless: true });
try {
  const page = await browser.newPage();
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.addInitScript(({ api }) => {
    (window as any).__name = (value: unknown) => value;
    const fixture = (window as any).motionDraftFixture = {
      stopped: true, saved: { automationPaused: true }, deletes: [] as string[], failId: "",
      items: ["A", "B", "C"].map(id => ({ id, title: `Video ${id}`, fileName: `fake-${id}.mp4`, videoUrl: "", width: 1280, height: 720, fps: 30, quality: "draft", durationSeconds: 60, sizeBytes: 1024, renderSeconds: 10, encoder: "libx264" })),
      request: async (url: string, _body: unknown, method: string) => {
        if (url === api.MOTION_VIDEO_RESULTS && method !== "DELETE") return { items: structuredClone(fixture.items) };
        if (method === "DELETE" && url.startsWith(api.MOTION_VIDEO_RESULTS)) {
          const id = url === api.MOTION_VIDEO_RESULTS ? "all" : url.split("/").at(-1)!;
          fixture.deletes.push(id);
          if (id === fixture.failId) { fixture.failId = ""; throw new Error("Mock deletion failed"); }
          fixture.items = id === "all" ? [] : fixture.items.filter(item => item.id !== id);
          return { success: true, freedBytes: 1024 };
        }
        return { success: true, channels: [], items: [] };
      },
      poll: async () => { throw new Error("Unexpected job in results test"); },
    };
  }, { api: API_ROUTES });
  await page.route("**/*", route => {
    const url = route.request().url();
    if (url === "http://motion-results.test/fixture.js") return route.fulfill({ contentType: "text/javascript", body: bundle.outputFiles[0].text });
    if (url === "http://motion-results.test/") return route.fulfill({ contentType: "text/html", body: '<div id="root"></div><script src="/fixture.js"></script>' });
    return route.abort();
  });
  const openResults = async () => {
    await page.getByRole("button", { name: /^Kết quả/ }).click();
    await page.getByRole("checkbox", { name: "Chọn video: Video A", exact: true }).waitFor();
  };
  await page.goto("http://motion-results.test/");
  await openResults();
  const all = page.getByRole("checkbox", { name: "Chọn tất cả", exact: true });
  const selectedDelete = page.getByRole("button", { name: /^Xoá đã chọn/ });
  const confirm = page.getByRole("button", { name: "Xoá vĩnh viễn", exact: true });
  assert.equal(await selectedDelete.isDisabled(), true);
  await page.getByRole("checkbox", { name: "Chọn video: Video A", exact: true }).check();
  assert.equal(await all.evaluate((input: HTMLInputElement) => input.indeterminate), true);
  await page.getByRole("checkbox", { name: "Chọn video: Video B", exact: true }).check();
  assert.match(await selectedDelete.innerText(), /\(2\)/);
  await selectedDelete.click();
  await page.getByText("2 video đã chọn sẽ bị xoá vĩnh viễn khỏi thiết bị.", { exact: true }).waitFor();
  await page.getByRole("button", { name: "Đóng", exact: true }).click();
  assert.deepEqual(await page.evaluate(() => (window as any).motionDraftFixture.deletes), [], "Cancel must not send DELETE");
  await page.evaluate(() => { (window as any).motionDraftFixture.failId = "B"; });
  await selectedDelete.click();
  await confirm.click();
  await page.getByRole("alert").filter({ hasText: /Không xoá được 1 video/ }).waitFor();
  assert.deepEqual(await page.evaluate(() => (window as any).motionDraftFixture.deletes), ["A", "B"]);
  assert.equal(await page.getByRole("checkbox", { name: "Chọn video: Video A", exact: true }).count(), 0);
  assert.equal(await page.getByRole("checkbox", { name: "Chọn video: Video B", exact: true }).isChecked(), true);
  assert.equal(await page.getByRole("checkbox", { name: "Chọn video: Video C", exact: true }).isChecked(), false, "Unselected video must remain untouched");
  await confirm.click();
  await confirm.waitFor({ state: "hidden" });
  assert.deepEqual(await page.evaluate(() => (window as any).motionDraftFixture.deletes), ["A", "B", "B"], "Retry must include only failures");
  assert.equal(await selectedDelete.isDisabled(), true, "Deleted items must leave the selection");
  await all.check();
  assert.equal(await page.getByRole("checkbox", { name: "Chọn video: Video C", exact: true }).isChecked(), true);
  await all.uncheck();
  assert.equal(await selectedDelete.isDisabled(), true);
  await page.getByRole("button", { name: "Xoá: Video C", exact: true }).click();
  await confirm.click();
  await page.getByText("Chưa có video nào.", { exact: true }).waitFor();
  assert.deepEqual(await page.evaluate(() => (window as any).motionDraftFixture.deletes), ["A", "B", "B", "C"]);
  await page.reload();
  await openResults();
  await all.check();
  assert.equal(await page.getByRole("checkbox", { checked: true }).count(), 4);
  await all.uncheck();
  assert.equal(await page.getByRole("checkbox", { checked: true }).count(), 0);
  await page.getByRole("button", { name: "Xoá tất cả", exact: true }).click();
  await confirm.click();
  await page.getByText("Chưa có video nào.", { exact: true }).waitFor();
  assert.deepEqual(await page.evaluate(() => (window as any).motionDraftFixture.deletes), ["all"]);
  assert.deepEqual(errors, []);
  console.log("Results selection passed: select one/many/all, indeterminate state, confirmation/cancel, partial failure/retry, unselected preservation, single delete, delete all and empty state. All requests mocked; no real files deleted.");
} finally {
  await browser.close();
}
