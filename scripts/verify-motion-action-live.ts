import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { createHash, randomUUID } from "node:crypto";
import { spawnSync } from "node:child_process";
import express from "express";
import { chromium } from "playwright";
import { findNativeChrome } from "../src/server/services/nativeProxyBrowser.ts";
const root = path.resolve("scratch/motion-all-styles-20261106"), out = path.resolve(process.env.QA_ACTION_OUT || "storage/output/motion-video/clip-demo/all-styles-actions-20261106");
await fs.mkdir(out, { recursive: true });
process.env.VIDIFY_STORAGE_DIR = path.join(out, "isolated-storage");
delete process.env.APP_DATA_DIR;
const { buildRemotionScenes } = await import("../src/features/motion/server/services/remotion/scenePipeline.ts");
const { runMotionAi, runInMotionAiSession } = await import("../src/features/motion/server/services/motionStoryService.ts");
const { renderRemotionVideo } = await import("../src/features/motion/server/services/motionRemotionRenderService.ts");
const { remotionPlanGroups, remotionGroupKey, remotionBeatKey, remotionGroupPlanCurrent } = await import("../src/features/motion/server/services/remotion/sceneKeys.ts");
const { MOTION_VISUAL: V } = await import("../src/constants/motionVisual.ts");
const { MOTION_SCENE_COMPOSITION: C } = await import("../src/constants/motionSceneComposition.ts");
const { MOTION_OBJECT_SHEET: SHEET } = await import("../src/constants/motionObjectSheet.ts");
const { MOTION_SCENE_ACTION_REVISION } = await import("../src/constants/motionSceneAction.ts");
const { getChatPlanningRoom } = await import("../src/server/services/chatUiPlanningService.ts");
const manifest = JSON.parse(await fs.readFile(path.join(root, "source-manifest.json"), "utf8"));
const eligible = manifest.cases.filter((c: any) => c.hasTimedSpec && c.planSourceCompatible);
const pick = (f: (c: any) => boolean) => { const c = eligible.find(f); assert.ok(c, "No matching real source case; do not fabricate source events"); return c; };
const scene41 = pick((c: any) => c.productionId === "f82fe2c76c1ab22004a52e6147acdf2c" && c.sceneId === "c3_event_c4d4dc0def8a:6");
const witness = pick((c: any) => c.profile === "horror" && c.genre === "witness" && c.sceneId.endsWith(":1"));
const historyPerson = pick((c: any) => c.profile === "history" && c.genre === "pov" && c.format === "illustration" && c.units.length === 0);
const device = (format: string) => pick((c: any) => c.format === format && c.profile === "history" && c.genre === "verdict");
const sources: Record<string, any> = {
  "history-verdict": scene41, "history-pov": historyPerson, "history-witness": witness, "history-chronicle": device("map"),
  "horror-verdict": device("comparison"), "horror-pov": historyPerson, "horror-witness": witness, "horror-chronicle": device("card"),
  "explainer-verdict": device("comparison"), "explainer-pov": device("diagram"), "explainer-witness": witness, "explainer-chronicle": device("map"),
};
const selected = process.env.QA_ACTION_CASES?.split(",") || Object.keys(sources);
const replay = process.env.QA_ACTION_REPLAY === "1";
const reportFile = path.join(out, "verification.json");
let reports: any[] = [];
try { reports = JSON.parse(await fs.readFile(reportFile, "utf8")).cases; } catch {}
const ffmpeg = (args: string[]) => { const r = spawnSync("ffmpeg", ["-y", "-loglevel", "error", ...args], { encoding: "utf8" }); assert.equal(r.status, 0, r.stderr); };
for (const id of selected) {
  if (!replay && reports.some((r) => r.id === id)) { console.log(`SKIP recorded first response: ${id}`); continue; }
  const source = sources[id]; assert.ok(source, `Unknown case ${id}`);
  const [profile, genre] = id.split("-"), dir = path.join(out, id);
  await fs.mkdir(dir, { recursive: true });
  const priorRaw = await fs.readFile(path.join(dir, "raw-response.json"), "utf8").catch(() => undefined);
  assert.ok(replay || !priorRaw, "A retained first response exists: use QA_ACTION_REPLAY=1 instead of another provider call");
  if (replay) assert.ok(priorRaw, "Replay requires the original provider response");
  const bytes = await fs.readFile(source.file), sourceHash = createHash("sha256").update(bytes).digest("hex"), production = JSON.parse(bytes.toString());
  const script = structuredClone(production.result.script), analysis = structuredClone(production.result.analysis), original = production.result.compiled.spec;
  if (process.env.QA_WRITTEN_INTENT_FILE) {
    const authored = JSON.parse(await fs.readFile(path.resolve(process.env.QA_WRITTEN_INTENT_FILE), "utf8"));
    const sourceBeat = script.beats.find((b: any) => b.id === authored.beatId);
    assert.ok(sourceBeat && sourceBeat.narration === authored.narration, "Script author's existing beat/narration must match; do not correct it by code");
    assert.equal(typeof authored.motionIntent, "string");
    sourceBeat.motionIntent = authored.motionIntent;
  }
  const timed = original.scenes.find((s: any) => s.id === source.sceneId); assert.ok(timed);
  const state = script.gen.remotion, settings = { ...state.settings, profileId: profile };
  script.voiceTrack = production.result.voice;
  script.visualSettings = settings; analysis.visualSettings = settings; analysis.videoGenre = genre;
  state.settings = settings; state.profileRevision = (V.PROFILES as any)[profile].revision;
  if (source.profile !== profile) { state.sheet = {}; state.assets = {}; }
  // Rebase an isolated existing plan for controlled profile/genre variants, without re-planning events.
  for (const group of remotionPlanGroups(script, analysis, state)) {
    for (const beat of group.beats) state.inputKeys[beat.id] = remotionBeatKey(beat, analysis, "", state);
    const key = remotionGroupKey(group.beats, analysis, state);
    for (const scene of state.scenes[group.id] || []) scene.sourceKey = key;
    if ((state.scenes[group.id] || []).some((s: any) => s.id === source.sceneId)) assert.ok(remotionGroupPlanCurrent(group.beats, analysis, state), `Stored plan incompatible: ${group.id}`);
  }
  const behavior = { version: 1 as const, actors: "simple" as const, sceneEffects: "gentle" as const, camera: "gentle" as const };
  const signal = AbortSignal.timeout(12 * 60000), scope = `actions-${id}-${randomUUID()}`, calls: any[] = [], logs: string[] = [];
  const record: any = { id, source, sourceHash, profile, genre, scope, promptRevision: MOTION_SCENE_ACTION_REVISION, replayOfRetainedResponse: replay, configurationVariant: source.profile !== profile || source.genre !== genre, variantNote: "Real source events/narration retained; selected profile/genre/motion enabled only on isolated copy. Not a newly written full script of that genre.", startedAt: new Date().toISOString() };
  await fs.writeFile(path.join(dir, replay ? "replay-run.json" : "run.json"), JSON.stringify(record, null, 2));
  let latest: any;
  const started = Date.now();
  const heartbeat = setInterval(async () => {
    console.log(JSON.stringify({ id, stage: "waiting", elapsedSeconds: (Date.now() - started) / 1000 }));
    const room = getChatPlanningRoom({ provider: "gemini-chat", projectId: `motion-story-${scope}`, workerId: "motion-scene-first" } as any);
    if (room && !room.isClosed()) await room.screenshot({ path: path.join(dir, "live-room.png"), timeout: 5000 }).catch(() => {});
  }, 45000);
  try {
    const result = await runInMotionAiSession(scope, () => buildRemotionScenes(script, analysis, {
      scope, exec: { ...production.input.sceneAiExecution, chromeHeadless: false }, mainExec: { ...production.input.aiExecution, chromeHeadless: false }, onlyScenes: [source.sceneId], review: false, sfx: false, renderBehavior: behavior, signal,
      log: (line) => { if (line) { logs.push(line); console.log(`[${id}] ${line}`); } }, partial: (v) => { latest = v; },
      geometry: { check: async () => { throw new Error("Unexpected runtime QA"); }, measure: async () => { throw new Error("Unexpected runtime geometry"); } },
      still: async () => { throw new Error("Unexpected runtime review"); },
      ai: async (prompt, artifact, exec, aiSignal, log, images) => {
        assert.ok(artifact === C.ARTIFACT || artifact === SHEET.ARTIFACT, `No new planning/director/QA/repair request: ${artifact}`);
        assert.ok(artifact !== C.ARTIFACT || !calls.some((c) => c.artifact === C.ARTIFACT), "Exactly one scene content generation");
        calls.push({ artifact, provider: exec.provider, model: exec.model, startedAt: new Date().toISOString() });
        if (replay) {
          calls[calls.length - 1].providerCalled = false;
          return JSON.parse(artifact === C.ARTIFACT ? priorRaw! : await fs.readFile(path.join(dir, "reference-response.json"), "utf8"));
        }
        await fs.writeFile(path.join(dir, artifact === C.ARTIFACT ? "submitted-prompt.txt" : "reference-prompt.txt"), prompt);
        const raw = await runMotionAi(prompt, artifact, exec, aiSignal, log, images);
        await fs.writeFile(path.join(dir, artifact === C.ARTIFACT ? "raw-response.json" : "reference-response.json"), JSON.stringify(raw, null, 2));
        return raw;
      },
    }), undefined, true, signal);
    record.generationAndSaveSeconds = (Date.now() - started) / 1000;
    await fs.writeFile(path.join(dir, replay ? "replay-result.json" : "result.json"), JSON.stringify(result));
    const scene: any = Object.values(result.gen!.remotion!.scenes).flat().find((s: any) => s.id === source.sceneId);
    assert.equal(scene?.generation?.status, "accepted", scene?.generation?.error);
    assert.equal(scene.generation.promptRevision, MOTION_SCENE_ACTION_REVISION);
    const raw = JSON.parse(await fs.readFile(path.join(dir, "raw-response.json"), "utf8"));
    assert.deepEqual(scene.composition.animations, raw.animations);
    assert.equal(calls.filter((c) => c.artifact === C.ARTIFACT).length, 1);
    const asset = result.gen!.remotion!.assets[scene.composition.assetKey], frames = timed.endFrame - timed.startFrame, duration = frames / original.fps, offset = timed.startFrame / original.fps;
    const spec = { ...original, profileId: profile, motion: true, renderBehavior: behavior, resolvedSettings: { ...original.resolvedSettings, behavior }, duration, assets: { [asset.key]: asset }, scenes: [{ ...timed, composition: scene.composition, startFrame: 0, endFrame: frames }], subtitles: original.subtitles.filter((s: any) => s.end > offset && s.start < offset + duration).map((s: any) => ({ ...s, start: Math.max(0, s.start - offset), end: Math.min(duration, s.end - offset) })) };
    await fs.writeFile(path.join(dir, "candidate-spec.json"), JSON.stringify(spec));
    await fs.writeFile(path.join(dir, "before-render.json"), JSON.stringify({ id, calls, providerCalls: replay ? 0 : calls.length, generationAndSaveSeconds: record.generationAndSaveSeconds, replay, tracks: raw.animations.length }, null, 2));
    const renderStarted = Date.now(), silent = path.join(dir, "silent.mp4"), output = path.join(dir, "scene.mp4");
    await renderRemotionVideo(spec as any, silent, { width: 1920, height: 1080, crf: 23, concurrency: 1, headless: false, signal, onProgress: () => {} });
    const audioSource = production.result.rendered?.fileName && path.resolve("storage/output/motion-video", production.result.rendered.fileName);
    record.originalAudioAvailable = !!audioSource && await fs.access(audioSource).then(() => true, () => false);
    if (record.originalAudioAvailable) ffmpeg(["-i", silent, "-ss", String(offset), "-i", audioSource, "-map", "0:v:0", "-map", "1:a:0", "-t", String(duration), "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-movflags", "+faststart", output]);
    else await fs.copyFile(silent, output);
    ffmpeg(["-i", output, "-vf", "fps=1,scale=640:360,tile=3x2", "-frames:v", "1", path.join(dir, "contact-sheet.png")]);
    const probe = spawnSync("ffprobe", ["-v", "error", "-show_streams", "-of", "json", output], { encoding: "utf8" }); assert.equal(probe.status, 0, probe.stderr);
    const video = JSON.parse(probe.stdout).streams.find((s: any) => s.codec_type === "video");
    assert.equal(Number(video.nb_frames), frames); assert.equal(video.width, 1920); assert.equal(video.height, 1080); assert.equal(video.r_frame_rate, "30/1");
    const app = express(); app.use(express.static(dir)); app.get("/", (_req, res) => res.send('<html><body style="margin:0;background:#111"><video src="/scene.mp4" autoplay muted loop controls style="width:100%;height:100vh"></video></body></html>'));
    const server = app.listen(0, "127.0.0.1"); await new Promise<void>((resolve) => server.once("listening", resolve));
    const browser = await chromium.launch({ executablePath: findNativeChrome(), headless: false });
    try {
      const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
      await page.goto(`http://127.0.0.1:${(server.address() as any).port}/`);
      await page.waitForFunction(() => { const v = document.querySelector("video")!; return v.readyState >= 2 && v.currentTime > 0.5; });
      await page.screenshot({ path: path.join(dir, "playing-chrome.png") });
    } finally { await browser.close(); await new Promise<void>((resolve) => server.close(() => resolve())); }
    Object.assign(record, { technicalStatus: "passed", renderSeconds: (Date.now() - renderStarted) / 1000, frames, tracks: raw.animations.length, output, visibleInstalledChrome: true, qualityStatus: "pending human/agent playback inspection; technical pass does not certify action quality" });
  } catch (error) {
    Object.assign(record, { technicalStatus: "failed", error: String(error) });
    if (latest) await fs.writeFile(path.join(dir, "partial.json"), JSON.stringify(latest));
    console.error(JSON.stringify({ id, error: String(error) }));
  } finally {
    clearInterval(heartbeat);
    if (replay) assert.equal(await fs.readFile(path.join(dir, "raw-response.json"), "utf8"), priorRaw, "Retained first response must remain unchanged");
    assert.equal(createHash("sha256").update(await fs.readFile(source.file)).digest("hex"), sourceHash);
    Object.assign(record, { calls, logs, providerCallsThisRun: replay ? 0 : calls.length, sourceProductionUnchanged: true, endedAt: new Date().toISOString() });
    reports.push(record);
    await fs.writeFile(reportFile, JSON.stringify({ at: new Date().toISOString(), cases: reports, scope: "First-response technical results; profile/genre variants labeled; no automatic quality repair" }, null, 2));
  }
  if (record.error && /quota|hạn mức|captcha|đăng nhập|login|rate.limit/i.test(record.error)) { console.log("STOP: provider needs attention; preserve first-response evidence and do not resend."); break; }
}
console.log(JSON.stringify({ stage: "finished", recorded: reports.length, out }));
process.exit(0);
