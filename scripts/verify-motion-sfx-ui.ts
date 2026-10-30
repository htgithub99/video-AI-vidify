import assert from "node:assert/strict";
import fs from "node:fs";
import { build } from "esbuild";
import { chromium } from "playwright";
import { API_ROUTES } from "../src/constants/apiRoutes.js";
import { MOTION_DRAFT_VERIFICATION as D } from "./motionDraftVerificationTexts.js";
const bundle = await build({
  stdin: { contents: 'import React from "react"; import { createRoot } from "react-dom/client"; import Creator from "./src/features/motion/components/MotionVideoCreator.tsx"; createRoot(document.getElementById("root")).render(<Creator currentLang="vi" />);', loader: "tsx", resolveDir: process.cwd() },
  bundle: true,
  platform: "browser",
  format: "iife",
  jsx: "automatic",
  write: false,
  plugins: [
    {
      name: "motion-sfx-ui-fixture",
      setup(builder) {
        builder.onLoad({ filter: /useMotionStudio\.ts$/ }, (args) => ({
          loader: "ts",
          contents: fs.readFileSync(args.path, "utf8").replace("export function useMotionStudio()", "function createStudioFixture()") + "\nexport function useMotionStudio() { const studio = createStudioFixture(); globalThis.motionSfxStudio = studio; return { ...studio, compiled: globalThis.motionDraftFixture.preview || studio.compiled }; }",
        }));
        builder.onLoad({ filter: D.PATTERNS.API_MODULE }, () => ({ contents: D.API_STUB + 'export const formatMotionProgress = String; export const formatSeconds = String; export const formatBytes = String; export const readFileBase64 = async () => { throw new Error("Unexpected upload"); }; export const motionAudioUrl = () => undefined; export const genPreviewUrl = () => "";' }));
        builder.onLoad({ filter: D.PATTERNS.STORAGE_MODULE }, () => ({ contents: D.STORAGE_STUB }));
        builder.onLoad({ filter: D.PATTERNS.ACTIVITY_MODULE }, () => ({ contents: D.ACTIVITY_STUB }));
        builder.onResolve({ filter: D.PATTERNS.TOAST_MODULE }, () => ({ path: "sonner", namespace: "motion-sfx-ui-fixture" }));
        builder.onLoad({ filter: /.*/, namespace: "motion-sfx-ui-fixture" }, () => ({ contents: D.TOAST_STUB }));
      },
    },
  ],
});
const browser = await chromium.launch({ channel: "chrome", headless: true });
try {
  for (const mode of ["library", "remotion"]) {
    const page = await browser.newPage();
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.addInitScript(
      ({ api, mode }) => {
        (window as any).__name = (value: unknown) => value;
        const jobs: Record<string, any> = {};
        const saved = JSON.parse(localStorage.getItem("motion-sfx-saved") || "null") || {
          rawText: "motion-sfx-fixture",
          automationPaused: true,
          source: { kind: "brief", title: "SFX fixture", text: "A fictional test brief.", segments: [] },
          visualSettings: mode === "library" ? { version: 1, mode, engine: "canvas", packId: "minimal_mask" } : { version: 1, mode, engine: "remotion", profileId: "horror", componentRevision: 1 },
        };
        (window as any).motionDraftFixture = {
          stopped: true,
          saved,
          requests: [],
          request: async (url: string, body: any) => {
            if (url === api.MOTION_PRODUCTION) {
              const fixture = (window as any).motionDraftFixture;
              fixture.requests.push(body);
              jobs[body.productionId] = { id: body.productionId, productionId: body.productionId, kind: "production", status: "completed", progress: 1, startedAt: Date.now(), log: [], result: {} };
              return { job: jobs[body.productionId] };
            }
            return { success: true, channels: [], items: [] };
          },
          poll: async (url: string) => jobs[url.split("/").at(-1)!],
        };
      },
      { api: API_ROUTES, mode },
    );
    await page.route("**/*", (route) => {
      const url = route.request().url();
      if (url === "http://motion-sfx.test/fixture.js") return route.fulfill({ contentType: "text/javascript", body: bundle.outputFiles[0].text });
      if (url === "http://motion-sfx.test/") return route.fulfill({ contentType: "text/html", body: '<div id="root"></div><script src="/fixture.js"></script>' });
      return route.abort();
    });
    await page.goto("http://motion-sfx.test/");
    await page.waitForFunction(() => (window as any).motionSfxStudio?.state.rawText === "motion-sfx-fixture");
    const toggle = page.getByRole("switch", { name: "Âm thanh cảnh (SFX)", exact: true });
    assert.equal(await toggle.getAttribute("aria-checked"), "true", "Existing projects retain SFX enabled");
    const musicBefore = await page.evaluate(() => (window as any).motionSfxStudio.state.musicMood);
    await toggle.click();
    assert.equal(await toggle.getAttribute("aria-checked"), "false");
    await page.waitForFunction(() => (window as any).motionDraftFixture.saved.sfx === false);
    await page.evaluate(() => localStorage.setItem("motion-sfx-saved", JSON.stringify((window as any).motionDraftFixture.saved)));
    await page.reload();
    await page.waitForFunction(() => (window as any).motionSfxStudio?.state.sfx === false);
    assert.equal(await toggle.getAttribute("aria-checked"), "false", "Reload preserves SFX off");
    await page.evaluate(() => (window as any).motionSfxStudio.analyze());
    const request = await page.evaluate(() => (window as any).motionDraftFixture.requests.at(-1));
    assert.equal(request.sfx, false, "Production receives SFX off");
    assert.equal(request.visualSettings.mode, mode);
    await toggle.click();
    await page.evaluate(() => (window as any).motionSfxStudio.analyze());
    assert.equal(await page.evaluate(() => (window as any).motionDraftFixture.requests.at(-1).sfx), true, "Production receives SFX on");
    assert.equal(await page.evaluate(() => (window as any).motionSfxStudio.state.musicMood), musicBefore, "SFX leaves background music unchanged");
    await page.evaluate(() => {
      (window as any).motionDraftFixture.preview = { spec: { duration: 1 }, sfxCues: [] };
      (window as any).motionSfxStudio.patch({ look: "force preview refresh" });
    });
    await page.waitForFunction(() => document.querySelector('[aria-label="Âm thanh cảnh (SFX)"]')?.textContent?.includes("chưa có tiếng động"));
    await toggle.click();
    assert.doesNotMatch(await toggle.innerText(), /chưa có tiếng động/, "SFX off must not show an enabled-empty status");
    const config = {
      language: "en",
      length: "2min",
      parts: 1,
      videoGenre: "ghost_tale",
      characterMotion: false,
      renderBehavior: { version: 1, actors: "fixed", sceneEffects: "gentle", camera: "fixed" },
      multiVoice: false,
      aiReview: false,
      asrCheck: false,
      sfx: true,
      sfxVolume: 0.27,
      musicMood: "off",
      musicVolume: 0.19,
      subtitles: false,
      fps: 24,
      aspect: "9:16",
      quality: "high",
      encoder: "auto",
      autoExport: false,
    };
    await page.evaluate((config) => {
      const studio = (window as any).motionSfxStudio;
      studio.patch({ ...config, visualSettings: { ...studio.state.visualSettings, pacing: "few" } });
    }, config);
    await page.waitForFunction(() => (window as any).motionSfxStudio.state.fps === 24);
    await page.evaluate(() => (window as any).motionSfxStudio.analyze());
    const configured = await page.evaluate(() => (window as any).motionDraftFixture.requests.at(-1));
    for (const [key, value] of Object.entries(config)) {
      if (key === "encoder" && mode === "remotion") assert.equal(configured.encoder, "cpu", "Remotion uses its supported CPU renderer");
      else assert.deepEqual(configured[key], value, `${mode}: production receives ${key}`);
    }
    assert.equal(configured.visualSettings.pacing, "few");
    assert.equal(configured.visualSettings.mode, mode);
    assert.deepEqual(errors, []);
    await page.close();
  }
  console.log("SFX UI passed: Library and Remotion, legacy default, reload, production on/off, independent music and enabled-empty status. All APIs mocked; no AI/TTS/render.");
} finally {
  await browser.close();
}
