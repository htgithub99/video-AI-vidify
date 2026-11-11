import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { build } from "esbuild";
import { chromium } from "playwright";
import { API_ROUTES as A } from "../src/constants/apiRoutes.ts";
import { findNativeChrome } from "../src/server/services/nativeProxyBrowser.ts";
import { getMotionEngineClientScript } from "../src/features/motion/server/services/motionEngineService.ts";
import { MOTION_VOICE_LIBRARY, MOTION_VOICE } from "../src/constants/motionVoice.ts";
import { motionOutputSettings } from "../src/lib/motionOutputSettings.ts";
import { withMotionVoiceMode } from "../src/lib/motionVoice.ts";

// Production UI/hook/API/storage code; only backend responses and the QA hook accessor are substituted.
const out = path.resolve("scratch/motion-settings-fixes-20261106/chrome");
await fs.mkdir(out, { recursive: true });
const bundle = await build({
  stdin: { contents: 'import React from "react";import{createRoot}from"react-dom/client";import Creator from "./src/features/motion/components/MotionVideoCreator.tsx";import{useMotionStudio}from"./src/features/motion/hooks/useMotionStudio.ts";import{motionVoiceSignature}from"./src/lib/motionVoice.ts";import{motionCompileStateKey,motionRenderStateKey}from"./src/features/motion/lib/motionVisualDraft.ts";Object.assign(globalThis,{auditVoiceSignature:motionVoiceSignature,auditCompileKey:motionCompileStateKey,auditRenderKey:motionRenderStateKey});function HookOnly(){useMotionStudio();return null;}createRoot(document.getElementById("root")).render(location.search.includes("hook")?<HookOnly/>:<Creator currentLang="vi"/>);', loader: "tsx", resolveDir: process.cwd() },
  bundle: true, platform: "browser", format: "iife", jsx: "automatic", write: false, define: { "import.meta": "{}" },
  plugins: [{ name: "audit-accessor", setup(builder) {
    builder.onLoad({ filter: /useMotionStudio\.ts$/ }, async (args) => ({ loader: "ts", contents: (await fs.readFile(args.path, "utf8")).replace("export function useMotionStudio()", "function auditedStudio()").replace("\n    voiceValid,", "\n    voiceValid,\n    generateVoice,") + "\nexport function useMotionStudio(){const studio=auditedStudio();globalThis.auditStudio=studio;return studio;}" }));
  } }],
});
const assets = await fs.readdir("dist/assets");
const cssName = assets.find((name) => /^index-.*\.css$/.test(name));
const css = cssName ? await fs.readFile(path.join("dist/assets", cssName), "utf8") : "";
const requests: { url: string; body: any }[] = [];
const observations: Record<string, any> = {};
const jobs = new Map<string, any>();
const errors: string[] = [];
const settings = { version: 1, mode: "remotion", engine: "remotion", profileId: "history", componentRevision: 1, pacing: "medium" };
const realProject = JSON.parse(await fs.readFile("storage/output/motion-video/productions/f82fe2c76c1ab22004a52e6147acdf2c.json", "utf8"));
const realBeat = realProject.result.script.beats[0];
const source = { ...realProject.input.source, text: realBeat.narration, segments: [{ t: 0, text: realBeat.narration }] };
const analysis = { ...realProject.result.analysis, chapters: [{ ...realProject.result.analysis.chapters.find((c: any) => c.id === realBeat.chapterId), targetSeconds: 3 }], visualSettings: settings };
const script = { title: analysis.title, language: "en", beats: [realBeat], visualSettings: settings };
const inputs = new Map<string, any>();
const outputScript = (input: any) => withMotionVoiceMode({ ...script, voiceChannel: input.voiceChannel }, input.multiVoice !== false);
let productionResult: any = {};
let productionStatus = "error";
let holdProduction = false;
let lastProduction: any;
const browser = await chromium.launch({ executablePath: findNativeChrome(), headless: false });
let auditPage: any;
try {
  const page = await browser.newPage({ viewport: { width: 1500, height: 1050 } });
  auditPage = page;
  page.setDefaultTimeout(12000);
  page.on("pageerror", (e) => errors.push(e.message));
  await page.route("**/*", async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname === "/audit.js") return route.fulfill({ contentType: "text/javascript", body: bundle.outputFiles[0].text });
    if (url.pathname === "/audit.css") return route.fulfill({ contentType: "text/css", body: css });
    if (url.pathname === "/") return route.fulfill({ contentType: "text/html", body: '<html><head><link rel="stylesheet" href="/audit.css"></head><body style="background:#100f1b"><div id="root"></div><script src="/audit.js"></script></body></html>' });
    if (url.pathname === "/seed") return route.fulfill({ contentType: "text/html", body: "<html>Isolated audit</html>" });
    if (url.pathname === A.MOTION_VIDEO_ENGINE) return route.fulfill({ contentType: "application/javascript", body: getMotionEngineClientScript() });
    let body: any = {};
    try { body = route.request().postDataJSON() || {}; } catch {}
    if (route.request().method() !== "GET") requests.push({ url: url.pathname, body });
    let result: any = { success: true, items: [], channels: [], presets: [], projects: [], config: {} };
    if (url.pathname === MOTION_VOICE_LIBRARY.CHANNELS_URL) result = { channels: [{ id: "audit-history", name: "Lịch sử", updatedAt: 123, languages: {} }], defaultId: "audit-history" };
    if (url.pathname === A.MOTION_PRODUCTION || url.pathname === A.MOTION_PRODUCTION_RESUME) {
      if (url.pathname === A.MOTION_PRODUCTION) inputs.set(body.productionId, structuredClone(body));
      const input = inputs.get(body.productionId);
      const completedResult = structuredClone(productionResult);
      if (completedResult.script) completedResult.script = outputScript(input);
      lastProduction = { id: body.productionId, productionId: body.productionId, kind: "production", status: holdProduction ? "rendering" : productionStatus, progress: 1, startedAt: Date.now(), log: [], ...(productionStatus === "error" ? { error: "Isolated audit stop" } : {}), result: { ...completedResult, outputSettings: motionOutputSettings(input, completedResult) } };
      jobs.set(lastProduction.id, lastProduction);
      result = { success: true, job: lastProduction };
    } else if (url.pathname.startsWith(A.MOTION_STORY_STATUS)) result = { success: true, job: jobs.get(url.pathname.split("/").at(-1)!) };
    else if ([A.MOTION_STORY_SCRIPT, A.MOTION_STORY_SCENES, A.MOTION_STORY_VOICE].includes(url.pathname)) {
      const kind = url.pathname.split("/").at(-1)!;
      const value = kind === "voice" ? await page.evaluate(({ body, version }) => ({ asr: { version, checked: body.asrCheck === true }, provider: "vieneu", audioId: body.asrCheck ? "audit-checked.wav" : "audit.wav", durations: [3], totalSeconds: 3, signature: (window as any).auditVoiceSignature(body.script, body.analysis) }), { body, version: MOTION_VOICE.ASR.VERSION }) : body.script || script;
      const id = `audit-${kind}-${requests.length}`;
      const job = { id, kind, status: "completed", progress: 1, startedAt: Date.now(), log: [], result: value };
      jobs.set(id, job);
      result = { success: true, job };
    } else if (url.pathname === A.MOTION_STORY_COMPILE) result = { success: true, spec: { version: 1, engine: body.visualSettings?.mode === "remotion" ? "remotion" : "canvas", title: "Audit", duration: 3, fps: body.fps, aspect: body.aspect, scenes: [], subtitles: body.subtitles === false ? [] : [{ start: 0, end: 3, text: source.text }], renderBehavior: body.renderBehavior }, missing: [], voiceStale: false, sfxCues: [], audioPreviewId: "audit-mixed.wav" };
    else if (url.pathname === A.MOTION_VIDEO_RENDER) result = { success: true, job: { id: "audit-render", status: "completed", startedAt: Date.now(), log: [], progress: 1, result: { id: "audit-render", videoUrl: "/audit.mp4" } } };
    else if (url.pathname.includes("/status/") && url.pathname.includes("motion-video")) result = { success: true, job: { id: "audit-render", status: "completed", startedAt: Date.now(), log: [], progress: 1, result: { id: "audit-render", videoUrl: "/audit.mp4" } } };
    if (url.pathname.startsWith("/api/")) return route.fulfill({ contentType: "application/json", body: JSON.stringify(result) });
    return route.abort();
  });
  await page.goto("http://motion-settings-audit.test/seed");
  await page.evaluate(async ({ settings, source }) => {
    (window as any).__name = (v: any) => v;
    const db = await new Promise<IDBDatabase>((resolve, reject) => { const r = indexedDB.open("VidifyDB", 1); r.onupgradeneeded = () => r.result.createObjectStore("app_settings"); r.onsuccess = () => resolve(r.result); r.onerror = () => reject(r.error); });
    await new Promise<void>((resolve, reject) => { const t = db.transaction("app_settings", "readwrite"); t.objectStore("app_settings").put(JSON.stringify({ rawText: "settings-audit", source, visualSettings: settings, autoRun: false, autoExport: false, autoContinue: false }), "motion_story_state_v1"); t.oncomplete = () => resolve(); t.onerror = () => reject(t.error); });
    db.close();
  }, { settings, source });
  await page.addInitScript(() => { (window as any).__name = (v: any) => v; });
  await page.goto("http://motion-settings-audit.test/");
  await page.waitForFunction(() => (window as any).auditStudio?.state.rawText === "settings-audit");
  const patch = async (value: any) => { await page.evaluate((v) => (window as any).auditStudio.patch(v), value); await page.waitForFunction(() => !(window as any).auditStudio.busy); };
  const call = async (name: string, ...args: any[]) => { await page.evaluate(async ({ name, args }) => { await (window as any).auditStudio[name](...args); }, { name, args }); await page.waitForFunction(() => !(window as any).auditStudio.busy); };
  const last = (url: string) => requests.filter((r) => r.url === url).at(-1)!.body;
  const select = async (label: string, value: string) => { await page.getByRole("combobox", { name: label, exact: true }).selectOption(value); };
  const toggle = async (label: string, checked: boolean) => { const e = page.getByRole("switch", { name: label, exact: true }); if ((await e.getAttribute("aria-checked") === "true") !== checked) await e.click(); assert.equal(await e.getAttribute("aria-checked"), String(checked)); };
  await fs.writeFile(path.join(out, "controls.json"), JSON.stringify(await page.getByRole("combobox").evaluateAll((nodes) => nodes.map((n) => ({ label: n.getAttribute("aria-label"), options: [...(n as HTMLSelectElement).options].map((o) => ({ value: o.value, text: o.text })) }))), null, 2));
  // Every setting shown in the user's screenshot is changed through the actual rendered control.
  await select("Kiểu hình", "history"); await select("Thể loại", "verdict"); await select("Thời lượng", "12min"); await select("Số phần", "1"); await select("Ngôn ngữ đọc", "en");
  await toggle("Tự động viết truyện, dựng hình và tạo giọng sau phân tích", true); await select("Cách kể", "lively"); await toggle("Đổi tên tránh bản quyền", false);
  await select("Kênh giọng", "audit-history"); await toggle("Phân vai giọng", false); await toggle("Kiểm tra giọng", false); await select("Nhạc nền", "off"); await toggle("Âm thanh cảnh (SFX)", true);
  await select("Nhịp đổi hình", "medium"); await toggle("Chuyển động cảnh", true); await toggle("Phụ đề", true); await toggle("Xuất video", true); await toggle("Tự xóa chat Gemini", true);
  const expected = { language: "en", length: "12min", parts: 1, videoGenre: "verdict", storytelling: "lively", renameEntities: false, multiVoice: false, asrCheck: false, musicMood: "off", sfx: true, characterMotion: true, subtitles: true, autoExport: true, clearGeminiChatsBeforeExport: true };
  await call("analyze");
  for (const [key, value] of Object.entries(expected)) assert.deepEqual(last(A.MOTION_PRODUCTION)[key], value, `new production: ${key}`);
  assert.equal(last(A.MOTION_PRODUCTION).encoder, "cpu"); assert.equal(last(A.MOTION_PRODUCTION).analyzeOnly, false); assert.equal(last(A.MOTION_PRODUCTION).visualSettings.pacing, "medium"); assert.match(last(A.MOTION_PRODUCTION).voiceChannel, /audit-history/);
  observations.screenshotConfiguration = "all 19 controls route correctly on a new run";
  await toggle("Tự động viết truyện, dựng hình và tạo giọng sau phân tích", false); await toggle("Phân vai giọng", true); await toggle("Kiểm tra giọng", true); await toggle("Đổi tên tránh bản quyền", true); await toggle("Chuyển động cảnh", false); await toggle("Phụ đề", false); await toggle("Âm thanh cảnh (SFX)", false); await toggle("Xuất video", false); await toggle("Tự xóa chat Gemini", false);
  await select("Cách kể", "plain"); await select("Nhạc nền", "auto"); await select("Nhịp đổi hình", "many"); await select("Số phần", "2");
  await call("analyze");
  const inverted = { analyzeOnly: true, parts: 2, multiVoice: true, asrCheck: true, renameEntities: true, characterMotion: false, subtitles: false, sfx: false, autoExport: false, clearGeminiChatsBeforeExport: false, storytelling: "plain", musicMood: "auto" };
  for (const [key, value] of Object.entries(inverted)) assert.deepEqual(last(A.MOTION_PRODUCTION)[key], value, `inverted: ${key}`);
  assert.deepEqual(last(A.MOTION_PRODUCTION).renderBehavior, { version: 1, actors: "fixed", sceneEffects: "off", camera: "fixed" });
  // Actual IndexedDB persistence, pagehide flushing and reload (no storage stub).
  await page.evaluate(() => window.dispatchEvent(new Event("pagehide")));
  await page.waitForFunction(async () => { const db = await new Promise<IDBDatabase>((resolve) => { const r = indexedDB.open("VidifyDB", 1); r.onsuccess = () => resolve(r.result); }); const saved = await new Promise<any>((resolve) => { const r = db.transaction("app_settings").objectStore("app_settings").get("motion_story_state_v1"); r.onsuccess = () => resolve(JSON.parse(r.result)); }); db.close(); return saved.asrCheck === true && saved.parts === 2 && saved.visualSettings.pacing === "many"; });
  await page.reload(); await page.waitForFunction(() => (window as any).auditStudio?.state.parts === 2);
  const restored = await page.evaluate(() => (window as any).auditStudio.state);
  for (const [key, value] of Object.entries(inverted)) if (key !== "analyzeOnly") assert.deepEqual(restored[key], value, `reload: ${key}`);
  observations.persistence = "real IndexedDB, pagehide and reload preserve selected settings";
  await patch({ fps: 24, aspect: "9:16", quality: "draft", encoder: "gpu", sfxVolume: 0.27, musicVolume: 0.19, asrCheck: false, autoExport: false });
  await call("analyze"); assert.equal(last(A.MOTION_PRODUCTION).fps, 24); assert.equal(last(A.MOTION_PRODUCTION).aspect, "9:16"); assert.equal(last(A.MOTION_PRODUCTION).encoder, "cpu");
  await call("resumeProduction");
  assert.deepEqual(Object.keys(last(A.MOTION_PRODUCTION_RESUME)).sort(), ["clearGeminiChatsBeforeExport", "productionId"]);
  observations.resumePayload = last(A.MOTION_PRODUCTION_RESUME);
  await page.getByText("Cấu hình AI", { exact: true }).click();
  assert.equal(await page.locator('section[aria-label="AI dựng cảnh"]').getByRole("switch", { name: "Tự chuyển AI dự phòng", exact: true }).count(), 0);
  assert.equal(await page.locator('section[aria-label="AI hỗ trợ nội dung"]').getByRole("switch", { name: "Tự chuyển AI dự phòng", exact: true }).count(), 1);
  assert.ok((await page.locator("body").innerText()).includes("Tiếp tục dùng cấu hình đã lưu"));
  await page.getByRole("group", { name: "Cách dựng" }).getByRole("switch").click();
  assert.equal(await page.locator('section[aria-label="AI dựng cảnh"]').getByRole("switch", { name: "Tự chuyển AI dự phòng", exact: true }).count(), 1);
  await page.getByRole("group", { name: "Cách dựng" }).getByRole("switch").click();
  observations.fallbackUi = "Remotion hides scene-provider fallback; content AI and legacy library retain their controls";
  await patch({ analysis });
  assert.ok((await page.locator("body").innerText()).includes("Cách kể, Đổi tên đã khác bản phân tích"));
  await page.screenshot({ path: path.join(out, "settings-chrome.png"), fullPage: true });
  await page.evaluate(() => window.dispatchEvent(new Event("pagehide")));
  await page.goto("http://motion-settings-audit.test/?hook=1");
  await page.waitForFunction(() => (window as any).auditStudio?.state.rawText === "settings-audit");
  // Manual paths: consume current selections and keep the AI-authored action text.
  await patch({ analysis, script, productionId: undefined, asrCheck: false, autoExport: false, visualSettings: settings });
  const writesBefore = requests.filter((r) => r.url === A.MOTION_STORY_SCRIPT).length;
  await call("writeScript");
  assert.equal(requests.filter((r) => r.url === A.MOTION_STORY_SCRIPT).length, writesBefore, "Changed storytelling/renaming must be analyzed again before any script request");
  await patch({ storytelling: analysis.storytelling, renameEntities: analysis.renameEntities === true });
  await call("writeScript"); assert.equal(last(A.MOTION_STORY_SCRIPT).storytelling, analysis.storytelling); assert.equal(last(A.MOTION_STORY_SCRIPT).renameEntities, analysis.renameEntities === true);
  observations.storytellingGuard = "Changed analysis settings block writing; matching settings continue normally";
  await call("buildScenes"); assert.equal(last(A.MOTION_STORY_SCENES).script.beats[0].motionIntent, script.beats[0].motionIntent); assert.equal(last(A.MOTION_STORY_SCENES).autoVoice, false);
  await call("generateVoice"); assert.equal(last(A.MOTION_STORY_VOICE).asrCheck, false);
  assert.equal(await page.evaluate(() => (window as any).auditStudio.voiceValid), true);
  const voiceCalls = requests.filter((r) => r.url === A.MOTION_STORY_VOICE).length;
  await patch({ asrCheck: true });
  assert.equal(await page.evaluate(() => (window as any).auditStudio.voiceValid), false);
  await call("render", true);
  assert.equal(requests.filter((r) => r.url === A.MOTION_STORY_VOICE).length, voiceCalls + 1, "ASR-on export obtains a checked voice");
  assert.equal(last(A.MOTION_STORY_VOICE).asrCheck, true);
  assert.equal(last(A.MOTION_VIDEO_RENDER).options.audioId, "audit-checked.wav");
  assert.equal(last(A.MOTION_VIDEO_RENDER).options.encoder, "cpu"); assert.equal(last(A.MOTION_VIDEO_RENDER).options.music.volume, 0.19);
  await patch({ asrCheck: false });
  assert.equal(await page.evaluate(() => (window as any).auditStudio.voiceValid), true);
  await call("render", true);
  assert.equal(requests.filter((r) => r.url === A.MOTION_STORY_VOICE).length, voiceCalls + 1, "Disabling ASR reuses an already checked voice");
  observations.asrReuse = { enabledAfterVoice: true, uncheckedVoiceRejected: true, extraVoiceJobsOnExport: 1, checkedVoiceRetainedWhenOff: true };
  // Reproduce result acceptance while an editable option changes during a production.
  await patch({ script: null, analysis: null, autoContinue: true, subtitles: false, autoExport: true, encoder: "cpu" });
  productionStatus = "completed"; holdProduction = true; productionResult = {};
  const priorProductionId = lastProduction.id;
  const run = page.evaluate(() => (window as any).auditStudio.analyze());
  await page.waitForFunction(() => (window as any).auditStudio.busy);
  for (let i = 0; i < 100 && lastProduction.id === priorProductionId; i++) await new Promise((r) => setTimeout(r, 10));
  assert.notEqual(lastProduction.id, priorProductionId);
  await page.evaluate(() => (window as any).auditStudio.patch({ subtitles: true }));
  const savedSpec = { engine: "remotion", version: 1, title: "Old settings", duration: 3, fps: 24, aspect: "9:16", scenes: [], subtitles: [] };
  const oldInput = inputs.get(lastProduction.id);
  Object.assign(lastProduction, { status: "completed", result: { analysis, script: outputScript(oldInput), outputSettings: motionOutputSettings(oldInput), compiled: { spec: savedSpec, missing: [], sfxCues: [], voiceStale: false }, rendered: { id: "old-settings-output", videoUrl: "/old-settings.mp4" }, renderSettings: { quality: "draft", encoder: "cpu", musicMood: "auto", musicVolume: 0.19 } } });
  await run;
  const acceptance = await page.evaluate(() => { const s = (window as any).auditStudio; return { subtitlesSelected: s.state.subtitles, resultSubtitles: s.compiled?.spec.subtitles.length, markedCurrent: s.compiled?.compilationKey === (window as any).auditCompileKey(s.state), renderMarkedCurrent: s.state.renderSignature === (window as any).auditRenderKey(s.state) }; });
  assert.deepEqual(acceptance, { subtitlesSelected: true, resultSubtitles: 0, markedCurrent: false, renderMarkedCurrent: false });
  observations.resultAcceptanceMismatch = acceptance;
  // The usual raw AUTO preference is displayed/sent as CPU for Remotion, but result keys use the raw preference.
  await patch({ encoder: "auto" });
  holdProduction = false;
  productionResult = { analysis, script, compiled: { spec: { ...savedSpec, subtitles: [{ start: 0, end: 3, text: "Audit" }] }, missing: [], sfxCues: [], voiceStale: false }, rendered: { id: "cpu-output", videoUrl: "/cpu-output.mp4" }, renderSettings: { quality: "draft", encoder: "cpu", musicMood: "auto", musicVolume: 0.19 } };
  await call("analyze");
  assert.equal(last(A.MOTION_PRODUCTION).encoder, "cpu");
  const encoderMismatch = await page.evaluate(() => { const s = (window as any).auditStudio; return { savedPreference: s.state.encoder, resultMarkedStale: s.renderedVideoStale, renderMarkedCurrent: s.state.renderSignature === (window as any).auditRenderKey(s.state) }; });
  assert.deepEqual(encoderMismatch, { savedPreference: "auto", resultMarkedStale: false, renderMarkedCurrent: true });
  observations.effectiveEncoderMismatch = encoderMismatch;
  await patch({ fps: 30, sfxVolume: .31 });
  await call("resumeProduction");
  const resumed = await page.evaluate(() => { const s = (window as any).auditStudio; return { selectedFps: s.state.fps, outputFps: s.compiled.spec.fps, stale: s.renderedVideoStale, markedCurrent: s.compiled.compilationKey === (window as any).auditCompileKey(s.state) }; });
  assert.deepEqual(resumed, { selectedFps: 30, outputFps: 24, stale: true, markedCurrent: false });
  observations.resumeUsesSavedConfiguration = resumed;
  assert.deepEqual(errors, []);
  await fs.writeFile(path.join(out, "requests.json"), JSON.stringify(requests, null, 2));
  await fs.writeFile(path.join(out, "verification.json"), JSON.stringify({ at: new Date().toISOString(), installedChrome: findNativeChrome(), visible: true, scope: "Production Creator and hook bundled from source; real browser storage; API responses are isolated fixtures; no real AI/TTS/render/cleanup", observations, errors }, null, 2));
  await fs.rm(path.join(out, "failure.json"), { force: true });
  console.log(JSON.stringify({ passed: true, observations, errors }, null, 2));
} catch (error) {
  const runtime = await auditPage?.evaluate(() => { const s = (window as any).auditStudio; return { busy: s?.busy, storyBusy: s?.storyBusy, renderBusy: s?.renderBusy, storyJob: s?.storyJob, renderJob: s?.renderJob, activeStoryJobId: s?.state.activeStoryJobId, activeRenderJobId: s?.state.activeRenderJobId }; }).catch(() => null);
  await fs.writeFile(path.join(out, "failure.json"), JSON.stringify({ error: String(error), errors, observations, runtime, requests }, null, 2));
  throw error;
} finally { await browser.close(); }
