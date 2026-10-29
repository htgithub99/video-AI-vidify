import assert from "node:assert/strict";
import fs from "node:fs";
import { build } from "esbuild";
import { chromium } from "playwright";
import { API_ROUTES } from "../src/constants/apiRoutes.js";
import { MOTION_DRAFT_VERIFICATION as D } from "./motionDraftVerificationTexts.js";

const bundle = await build({
  stdin: { contents: 'import React from "react"; import { createRoot } from "react-dom/client"; import Creator from "./src/features/motion/components/MotionVideoCreator.tsx"; createRoot(document.getElementById("root")).render(<Creator currentLang="vi" />);', loader: "tsx", resolveDir: process.cwd() },
  bundle: true, platform: "browser", format: "iife", jsx: "automatic", write: false,
  plugins: [{
    name: "voice-mode-fixture",
    setup(builder) {
      builder.onLoad({ filter: /useMotionStudio\.ts$/ }, (args) => ({ loader: "ts", contents: fs.readFileSync(args.path, "utf8").replace("export function useMotionStudio()", "function createStudioFixture()") + '\nexport function useMotionStudio() { const studio = createStudioFixture(); globalThis.motionDraftStudio = studio; return studio; }' }));
      builder.onLoad({ filter: D.PATTERNS.API_MODULE }, () => ({ contents: D.API_STUB + 'export const formatMotionProgress = String; export const formatSeconds = String; export const formatBytes = String; export const readFileBase64 = async () => { throw new Error("Unexpected upload"); }; export const motionAudioUrl = () => undefined; export const genPreviewUrl = () => "";' }));
      builder.onLoad({ filter: D.PATTERNS.STORAGE_MODULE }, () => ({ contents: D.STORAGE_STUB }));
      builder.onLoad({ filter: D.PATTERNS.ACTIVITY_MODULE }, () => ({ contents: D.ACTIVITY_STUB }));
      builder.onResolve({ filter: D.PATTERNS.TOAST_MODULE }, () => ({ path: "sonner", namespace: "voice-mode-fixture" }));
      builder.onLoad({ filter: /.*/, namespace: "voice-mode-fixture" }, () => ({ contents: D.TOAST_STUB }));
    },
  }],
});
const browser = await chromium.launch({ channel: "chrome", headless: true });
try {
  for (const mode of ["library", "remotion"]) {
    const page = await browser.newPage();
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.addInitScript(({ api, mode }) => {
      (window as any).__name = (value: unknown) => value;
      const jobs: Record<string, any> = {};
      const saved = JSON.parse(localStorage.getItem("voice-mode-saved") || "null") || {
        rawText: "voice-mode-fixture", automationPaused: true,
        source: { kind: "brief", title: "Voice mode", text: "A fictional test brief.", segments: [] },
        visualSettings: mode === "library" ? { version: 1, mode, engine: "canvas", packId: "minimal_mask" } : { version: 1, mode, engine: "remotion", profileId: "horror", componentRevision: 1 },
      };
      (window as any).motionDraftFixture = {
        stopped: true, saved, requests: [],
        request: async (url: string, body: any) => {
          if (url === api.MOTION_PRODUCTION) {
            const fixture = (window as any).motionDraftFixture;
            fixture.requests.push(body);
            const id = body.productionId;
            jobs[id] = { id, productionId: id, kind: "production", status: "completed", progress: 1, startedAt: Date.now(), log: [], result: {} };
            return { job: jobs[id] };
          }
          if (url === api.MOTION_VIDEO_RESULTS) return { items: [] };
          return { success: true, channels: [], items: [] };
        },
        poll: async (url: string) => jobs[url.split("/").at(-1)!],
      };
    }, { api: API_ROUTES, mode });
    await page.route("**/*", route => {
      const url = route.request().url();
      if (url === "http://motion-voice-mode.test/fixture.js") return route.fulfill({ contentType: "text/javascript", body: bundle.outputFiles[0].text });
      if (url === "http://motion-voice-mode.test/") return route.fulfill({ contentType: "text/html", body: '<div id="root"></div><script src="/fixture.js"></script>' });
      return route.abort();
    });
    await page.goto("http://motion-voice-mode.test/");
    await page.waitForFunction(() => (window as any).motionDraftStudio?.state.rawText === "voice-mode-fixture", undefined, { timeout: 10000 }).catch(error => { throw new Error(JSON.stringify(errors) + String(error)); });
    const toggle = page.getByRole("switch", { name: "Phân vai giọng", exact: true });
    assert.equal(await toggle.getAttribute("aria-checked"), "true", "Existing projects default to multiple voices");
    assert.match(await toggle.innerText(), /Nhiều giọng/);
    await toggle.click();
    assert.equal(await toggle.getAttribute("aria-checked"), "false");
    assert.match(await toggle.innerText(), /Một giọng/);
    await page.waitForFunction(() => (window as any).motionDraftFixture.saved.multiVoice === false);
    await page.evaluate(() => localStorage.setItem("voice-mode-saved", JSON.stringify((window as any).motionDraftFixture.saved)));
    await page.reload();
    await page.waitForFunction(() => (window as any).motionDraftStudio?.state.multiVoice === false);
    assert.equal(await toggle.getAttribute("aria-checked"), "false", "Reload preserves narrator-only mode");
    await page.evaluate(() => (window as any).motionDraftStudio.analyze());
    const singleRequest = await page.evaluate(() => (window as any).motionDraftFixture.requests.at(-1));
    assert.equal(singleRequest.multiVoice, false, "The production request includes the selected mode");
    assert.equal(singleRequest.visualSettings.mode, mode);
    await toggle.click();
    assert.equal(await toggle.getAttribute("aria-checked"), "true");
    await page.evaluate(() => (window as any).motionDraftStudio.analyze());
    assert.equal(await page.evaluate(() => (window as any).motionDraftFixture.requests.at(-1).multiVoice), true);
    assert.deepEqual(errors, []);
    await page.close();
  }
  console.log("Voice mode UI passed: real toggle in Library and Remotion, legacy default, reload persistence and production request routing. All APIs mocked; no AI/TTS/video.");
} finally {
  await browser.close();
}
