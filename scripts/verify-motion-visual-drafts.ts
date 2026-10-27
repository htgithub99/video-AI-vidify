import assert from "node:assert/strict";
import fs from "node:fs";
import { createServer } from "node:http";
import { build } from "esbuild";
import { chromium } from "playwright";
import { MOTION_DRAFT_VERIFICATION as D } from "./motionDraftVerificationTexts.js";
import { MOTION_VISUAL_DRAFT_FIXTURE } from "./motionVisualDraftVerificationFixture.js";
import { forgetMotionVisualDraftResults, recoverMotionVisualDraft } from "../src/lib/motionVisualDraft.js";
const recordFile = "storage/output/motion-video/productions/53c01d81007bf76dbed7f4ad42f72999.json";
const saved = fs.existsSync(recordFile) && !process.argv.includes("--fixture") ? JSON.parse(fs.readFileSync(recordFile, "utf8")) : MOTION_VISUAL_DRAFT_FIXTURE;
const initial = { ...saved.input, analysis: saved.result.analysis, script: saved.result.script, voice: saved.result.voice, autoExport: true, autoRun: false, autoContinue: false, automationPaused: true, activeStoryJobId: "", activeRenderJobId: "", lastRenderJobId: saved.result.rendered.id, productionId: saved.job.id, editorialSessionId: saved.job.id };
const changedAudio = recoverMotionVisualDraft({ ...initial, visualSettings: saved.result.script.visualSettings, voice: { ...saved.result.voice, audioId: "changed-voice.wav" } } as any, saved.result);
assert.ok(changedAudio?.state.script.gen === saved.result.script.gen, "Voice changes must preserve artwork during recovery");
assert.equal(changedAudio?.compiled, null, "Voice changes must not recover an outdated audio preview");
const deleted = forgetMotionVisualDraftResults({ saved: { contextKey: "same-story", analysis: saved.result.analysis, gen: saved.result.script.gen, lastRenderJobId: saved.result.rendered.id, renderJob: { result: saved.result.rendered } as any } }, saved.result.rendered.id);
assert.equal(deleted.saved.renderJob, null);
assert.equal(deleted.saved.lastRenderJobId, null);
assert.equal(deleted.saved.gen, saved.result.script.gen);
const entry = `import React from "react";
import { createRoot } from "react-dom/client";
import { useMotionStudio } from "./src/hooks/useMotionStudio.ts";
import { MotionVisualModeField } from "./src/components/motion-video/MotionVisualModeField.tsx";
import { jsonUtils } from "./src/lib/json.ts";
import { MOTION_STORY_CONFIG } from "./src/constants/motionVideo.ts";
import { API_ROUTES } from "./src/constants/apiRoutes.ts";
import { MOTION_VOICE_LIBRARY } from "./src/constants/motionVoice.ts";
const initial = ${JSON.stringify(initial)};
const record = ${JSON.stringify(saved)};
if (!localStorage.getItem("seeded")) { await jsonUtils.setAsyncItem(MOTION_STORY_CONFIG.STORY_STORAGE_KEY, initial); localStorage.setItem("seeded", "1"); }
const lostDraft = localStorage.getItem("lostDraft");
if (lostDraft) { const broken = structuredClone(initial); delete broken.script.gen; broken.productionId = undefined; broken.lastRenderJobId = null; broken.visualDrafts = {}; if (lostDraft === "changed") broken.script.beats[0].narration += " Đã đổi truyện."; await jsonUtils.setAsyncItem(MOTION_STORY_CONFIG.STORY_STORAGE_KEY, broken); localStorage.removeItem("lostDraft"); }
const fixture = globalThis.motionDraftFixture = { requests: [], request: async (url, body) => {
  fixture.requests.push({url, body});
  if (url === MOTION_VOICE_LIBRARY.CHANNELS_URL) { const [id, updatedAt] = (record.result.script.voiceChannel || "").split("@"); return id ? {channels: [{id, updatedAt: Number(updatedAt)}], defaultId: id} : {channels: []}; }
  if (url === API_ROUTES.MOTION_VIDEO_RESULTS) return {items: []};
  if (url.startsWith(API_ROUTES.MOTION_STORY_STATUS)) return {job: {...record.job, result: record.result}};
  if (url === API_ROUTES.MOTION_STORY_COMPILE) return body.visualSettings.mode === "remotion" ? structuredClone(record.result.compiled) : {spec: {title: "Library preview", shots: [], duration: 2, fps: 30, aspect: "16:9"}, missing: [], sfxCues: []};
  throw new Error("Unexpected request " + url);
}, poll: async (_url, update) => { const job = {id: record.result.rendered.id, status: "completed", progress: 1, log: [], result: record.result.rendered}; update(job); return job; },
  seedLost: async (changed = false) => localStorage.setItem("lostDraft", changed ? "changed" : "same"),
  flush: () => window.dispatchEvent(new Event("pagehide"))
};
function Fixture() {
  const studio = useMotionStudio(); globalThis.motionDraftStudio = studio;
  return <main><MotionVisualModeField value={studio.state.visualSettings} packId={studio.state.stylePreset} profileId={studio.state.remotionProfile} language="vi" onChange={visualSettings => studio.patch({visualSettings})}/><p data-testid="preview">{studio.compiled?.spec.title || "Empty preview"}</p><p data-testid="scenes">{Object.values(studio.state.script?.gen?.remotion?.scenes || {}).flat().length}</p></main>;
}
createRoot(document.getElementById("root")).render(<Fixture/>);`;
const bundle = await build({
  stdin: { contents: entry, loader: "tsx", resolveDir: process.cwd() },
  bundle: true,
  platform: "browser",
  format: "esm",
  write: false,
  plugins: [
    {
      name: D.FIXTURE,
      setup(builder) {
        builder.onLoad({ filter: D.PATTERNS.API_MODULE }, () => ({ contents: D.API_STUB }));
        builder.onLoad({ filter: D.PATTERNS.ACTIVITY_MODULE }, () => ({ contents: D.ACTIVITY_STUB }));
        builder.onResolve({ filter: D.PATTERNS.TOAST_MODULE }, () => ({ path: D.TOAST_MODULE, namespace: D.FIXTURE }));
        builder.onLoad({ filter: D.PATTERNS.ANY, namespace: D.FIXTURE }, () => ({ contents: D.TOAST_STUB }));
      },
    },
  ],
});
const server = createServer((req, res) => {
  res.setHeader("Content-Type", req.url === "/fixture.js" ? "text/javascript; charset=utf-8" : "text/html; charset=utf-8");
  res.end(req.url === "/fixture.js" ? bundle.outputFiles[0].text : '<!doctype html><meta charset="utf-8"><div id="root"></div><script type="module" src="/fixture.js"></script>');
});
await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
const browser = await chromium.launch({ channel: "chrome", headless: true });
try {
  const page = await browser.newPage();
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${(server.address() as any).port}`);
  await page.waitForFunction(() => !!(window as any).motionDraftStudio?.state.script);
  await page.evaluate(() => (window as any).motionDraftStudio.compile());
  const original = await page.evaluate(() => ({ gen: (window as any).motionDraftStudio.state.script.gen, compiled: (window as any).motionDraftStudio.compiled }));
  const toggle = page.getByRole("switch", { name: "Cách dựng" });
  await toggle.click();
  await page.waitForFunction(() => (window as any).motionDraftStudio.state.visualSettings.mode === "library");
  assert.equal(await page.evaluate(() => (window as any).motionDraftStudio.state.script.gen), undefined);
  const pack = await page.evaluate(() => (window as any).motionDraftStudio.state.stylePreset);
  await page.evaluate(() => {
    const studio = (window as any).motionDraftStudio;
    studio.patch({ script: { ...studio.state.script, gen: { style: {}, cast: {}, locations: { library: { accepted: true } }, staging: {}, previews: {}, locationInfo: {}, failed: [] } } });
  });
  await page.evaluate(() => (window as any).motionDraftStudio.compile());
  for (let i = 0; i < 4; i++) {
    await toggle.click();
    await page.waitForFunction(() => (window as any).motionDraftStudio.state.visualSettings.mode === "remotion");
    assert.ok(JSON.stringify(await page.evaluate(() => (window as any).motionDraftStudio.state.script.gen)) === JSON.stringify(original.gen), "Mode switch must restore the saved scene data");
    assert.ok(JSON.stringify(await page.evaluate(() => (window as any).motionDraftStudio.compiled)) === JSON.stringify(original.compiled), "Mode switch must restore the compiled preview");
    assert.equal(await page.getByTestId("scenes").innerText(), "18");
    await toggle.click();
    await page.waitForFunction(() => (window as any).motionDraftStudio.state.visualSettings.mode === "library");
    assert.equal(await page.getByTestId("preview").innerText(), "Library preview");
    assert.equal(await page.evaluate(() => (window as any).motionDraftStudio.state.script.gen.locations.library.accepted), true);
  }
  await page.evaluate(() => (window as any).motionDraftFixture.flush());
  await page.reload();
  await page.waitForFunction(() => (window as any).motionDraftStudio?.compiled?.spec.title === "Library preview");
  await toggle.click();
  await page.waitForFunction(() => !!(window as any).motionDraftStudio.compiled);
  assert.ok(JSON.stringify(await page.evaluate(() => (window as any).motionDraftStudio.state.script.gen)) === JSON.stringify(original.gen), "Reload must preserve inactive scenes");
  await page.getByRole("combobox", { name: "Kiểu hình" }).selectOption("history");
  await page.waitForFunction(() => (window as any).motionDraftStudio.state.visualSettings.profileId === "history");
  assert.equal(await page.evaluate(() => (window as any).motionDraftStudio.state.script.gen), undefined);
  await page.getByRole("combobox", { name: "Kiểu hình" }).selectOption("horror");
  await page.waitForFunction(() => !!(window as any).motionDraftStudio.compiled);
  assert.ok(JSON.stringify(await page.evaluate(() => (window as any).motionDraftStudio.state.script.gen)) === JSON.stringify(original.gen), "Profile switch must restore the saved scenes");
  await toggle.click();
  await page.waitForFunction(() => (window as any).motionDraftStudio.state.visualSettings.mode === "library");
  await page.evaluate(() => (window as any).motionDraftStudio.patch({ stylePreset: "different-pack" }));
  await page.waitForFunction(() => (window as any).motionDraftStudio.state.visualSettings.packId === "different-pack");
  assert.equal(await page.evaluate(() => (window as any).motionDraftStudio.state.script.gen), undefined);
  await page.evaluate((stylePreset) => (window as any).motionDraftStudio.patch({ stylePreset }), pack);
  await page.waitForFunction((stylePreset) => (window as any).motionDraftStudio.state.visualSettings.packId === stylePreset, pack);
  assert.equal(await page.evaluate(() => (window as any).motionDraftStudio.state.script.gen.locations.library.accepted), true);
  await page.evaluate(() => (window as any).motionDraftFixture.seedLost());
  await page.reload();
  await page.waitForFunction(() => !!(window as any).motionDraftStudio?.state.script?.gen?.remotion);
  assert.ok(
    await page.evaluate(() => !!(window as any).motionDraftStudio.compiled),
    JSON.stringify(
      await page.evaluate(() => {
        const s = (window as any).motionDraftStudio;
        return { recovered: !!s.state.script?.gen, voice: s.state.voice?.audioId, uploadedAudio: s.state.uploadedAudio?.id, scriptChannel: s.state.script?.voiceChannel, settings: s.state.visualSettings, compileError: s.compileError };
      }),
    ),
  );
  assert.ok(JSON.stringify(await page.evaluate(() => (window as any).motionDraftStudio.state.script.gen)) === JSON.stringify(original.gen), "Recovery must preserve saved artwork");
  assert.ok(await page.evaluate(() => !!(window as any).motionDraftStudio.renderJob?.result.videoUrl));
  await page.evaluate(() => (window as any).motionDraftFixture.seedLost(true));
  await page.reload();
  await page.waitForFunction(() => (window as any).motionDraftFixture.requests.some((r) => r.url.includes("story/status")));
  assert.equal(await page.evaluate(() => (window as any).motionDraftStudio.state.script.gen), undefined);
  assert.deepEqual(errors, []);
  console.log("Visual drafts passed: real mode toggle, 18 saved scenes, isolated profiles/packs, cached previews, persisted reload, saved-production recovery, changed-story rejection. All APIs mocked; no AI/TTS/video created.");
} finally {
  await browser.close();
  await new Promise<void>((resolve) => server.close(() => resolve()));
}
