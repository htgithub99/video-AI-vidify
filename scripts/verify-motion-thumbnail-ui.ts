import assert from "node:assert/strict";
import { build } from "esbuild";
import { chromium } from "playwright";
import { MOTION_DRAFT_VERIFICATION as D } from "./motionDraftVerificationTexts.js";
import { API_ROUTES } from "../src/constants/apiRoutes.js";
const bundle = await build({
  stdin: { contents: D.ENTRY, loader: "tsx", resolveDir: process.cwd() },
  bundle: true,
  platform: "browser",
  format: "iife",
  write: false,
  plugins: [
    {
      name: "thumbnail-ui",
      setup(builder) {
        builder.onLoad({ filter: D.PATTERNS.API_MODULE }, () => ({ contents: D.API_STUB + "export const formatMotionProgress = String; export const formatSeconds = String;" }));
        builder.onLoad({ filter: D.PATTERNS.STORAGE_MODULE }, () => ({ contents: D.STORAGE_STUB }));
        builder.onLoad({ filter: D.PATTERNS.ACTIVITY_MODULE }, () => ({ contents: D.ACTIVITY_STUB }));
        builder.onResolve({ filter: D.PATTERNS.TOAST_MODULE }, () => ({ path: "sonner", namespace: "thumbnail-ui" }));
        builder.onLoad({ filter: /.*/, namespace: "thumbnail-ui" }, () => ({ contents: D.TOAST_STUB }));
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
        const settings = mode === "library" ? { version: 1, mode, engine: "canvas", packId: "minimal_mask" } : { version: 1, mode, engine: "remotion", profileId: "horror", componentRevision: 1 };
        const jobs: any = {};
        (window as any).motionDraftFixture = {
          stopped: true,
          requests: [],
          saved: { rawText: "thumbnail-ui", visualSettings: settings, autoExport: true, automationPaused: true, language: "vi", source: { text: "thumbnail-ui", segments: [], kind: "brief" } },
          request: async (url: string, body: any) => {
            if (url === api.MOTION_STORY_THUMBNAIL) {
              (window as any).motionDraftFixture.requests.push(body);
              const id = "thumbnail-" + (window as any).motionDraftFixture.requests.length;
              jobs[id] = { id, kind: "thumbnail", status: "completed", progress: 1, log: [], startedAt: Date.now(), result: { thumbnail: id, prompt: "new art" } };
              return { job: jobs[id] };
            }
            if (url === api.MOTION_VIDEO_RESULTS) return { items: [] };
            return { channels: [], success: true };
          },
          poll: async (url: string) => jobs[url.split("/").at(-1)!],
        };
      },
      { api: API_ROUTES, mode },
    );
    await page.route("http://motion-thumbnail.test/**", (route) => (route.request().url().endsWith("/fixture.js") ? route.fulfill({ contentType: "text/javascript", body: bundle.outputFiles[0].text }) : route.fulfill({ contentType: "text/html", body: '<div id="root"></div><script src="/fixture.js"></script>' })));
    await page.goto("http://motion-thumbnail.test/");
    await page
      .waitForFunction(() => (window as any).motionDraftStudio?.state.rawText === "thumbnail-ui", undefined, { timeout: 10000 })
      .catch((error) => {
        throw new Error(JSON.stringify({ errors }) + String(error));
      });
    await page.evaluate(() => {
      const studio = (window as any).motionDraftStudio;
      (window as any).previousThumbnailAction = studio.generateThumbnail;
      studio.patch({
        analysis: { title: "Latest story", logline: "Latest event", cast: [], places: [], chapters: [] },
        script: { title: "Newly built scenes", language: "vi", beats: [{ id: "new-scene", narration: "Latest words", visual: "scene" }], gen: { previews: { "new-scene": { file: "latest.jpg" } } } },
        seo: { options: [{ title: "First option" }, { title: "Second option" }] },
        thumbnails: { 0: { image: "keep-first", prompt: "old" } },
      });
    });
    await page.waitForFunction(() => (window as any).motionDraftStudio.state.script?.title === "Newly built scenes");
    await page.evaluate(async () => (window as any).previousThumbnailAction(1));
    const result = await page.evaluate(() => ({ requests: (window as any).motionDraftFixture.requests, thumbnails: (window as any).motionDraftStudio.state.thumbnails }));
    assert.equal(result.requests.length, 1);
    assert.equal(result.requests[0].script.gen.previews["new-scene"].file, "latest.jpg", "Even a previously bound click handler must read the latest built scenes");
    assert.equal(result.requests[0].visualSettings.mode, mode);
    assert.equal(result.requests[0].seo.title, "Second option");
    assert.equal(result.thumbnails[0].image, "keep-first");
    assert.equal(result.thumbnails[1].image, "thumbnail-1");
    assert.deepEqual(errors, []);
    await page.close();
  }
  console.log("Thumbnail UI passed: both drawing modes send the latest built scenes and selected SEO option, preserving other thumbnails. All browser requests mocked.");
} finally {
  await browser.close();
}
