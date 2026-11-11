import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { motionVoiceSignature } from "../src/lib/motionVoice.ts";
import { remotionBeatKey } from "../src/features/motion/server/services/remotion/sceneKeys.ts";
import { MOTION_REMOTION_LAYOUT as L } from "../src/constants/motionRemotionLayout.ts";
import { MOTION_VISUAL as V } from "../src/constants/motionVisual.ts";
import { MOTION_PRODUCTION as P } from "../src/constants/motionProduction.ts";
import { MOTION_VOICE } from "../src/constants/motionVoice.ts";
import { MotionProductionStore } from "../src/features/motion/server/services/motionProductionStore.ts";
const root = fs.mkdtempSync(path.join(os.tmpdir(), "motion-settings-audit-"));
const priorStorage = process.env.VIDIFY_STORAGE_DIR;
const priorData = process.env.APP_DATA_DIR;
process.env.VIDIFY_STORAGE_DIR = root;
delete process.env.APP_DATA_DIR;
const records: any[] = [];
try {
  const { createMotionProductionService } = await import("../src/features/motion/server/services/motionProductionService.ts");
  const jobs = new Map<string, any>();
  const calls: { stage: string; input: any }[] = [];
  let failScene = false;
  const start = (kind: string, result: any, error?: string) => {
    const id = `${kind}-${jobs.size}`;
    jobs.set(id, { id, kind, status: error ? "error" : "completed", progress: 1, log: [], startedAt: Date.now(), result, error });
    return { success: true, job: structuredClone(jobs.get(id)) };
  };
  const record = (stage: string, input: any) => calls.push({ stage, input: structuredClone(input) });
  const directory = path.join(root, "records");
  const service = createMotionProductionService({
    checkRemotionRuntime: async () => {}, checkMotionMediaTools: async () => {}, checkMotionProductionVoice: async () => {}, detectEncoders: async () => ["libx264"],
    recoverMotionIllustrationPlan: async (analysis: any) => ({ analysis }),
    analyzeMotionStoryInput: ((body: any) => {
      record("analyze", body);
      return start("analyze", { title: "Settings audit", logline: "Settings audit", language: body.language, storytelling: body.storytelling, videoGenre: body.videoGenre, visualSettings: body.visualSettings, cast: [], places: [], chapters: [{ id: "c1", title: "One", targetSeconds: 3 }], facts: [] });
    }) as any,
    scriptMotionStoryInput: ((body: any) => {
      record("script", body);
      return start("script", { title: "Settings audit", language: body.language, visualSettings: body.visualSettings, beats: [{ id: "b1", chapterId: "c1", narration: "A messenger walks across the courtyard.", visual: "scene", motionIntent: "Takes two complete steps with alternating planted feet." }] });
    }) as any,
    scenesMotionStoryInput: ((body: any) => {
      record("scenes", body);
      const beat = body.script.beats[0];
      const settings = body.visualSettings;
      const key = remotionBeatKey(beat, body.analysis);
      const gen = settings.mode === "remotion" ? { remotion: { settings, profileRevision: V.PROFILES[settings.profileId as keyof typeof V.PROFILES].revision, layoutRevision: L.REVISION, scenes: { [beat.id]: [{ id: "audit-scene", sourceKey: key, sceneRevision: L.SCENE_REVISION }] }, inputKeys: { [beat.id]: key } } } : { cast: {}, locations: {}, staging: {}, failed: [] };
      return start("scenes", { ...body.script, gen }, failScene ? "audit scene transport failure" : undefined);
    }) as any,
    voiceMotionStoryInput: ((body: any) => {
      record("voice", body);
      return start("voice", { asr: { version: MOTION_VOICE.ASR.VERSION, checked: body.asrCheck === true }, provider: "vieneu", audioId: "audit.wav", durations: [3], totalSeconds: 3, signature: motionVoiceSignature(body.script, body.analysis) });
    }) as any,
    compileMotionStoryInput: (async (body: any) => {
      record("compile", body);
      return { spec: { engine: body.visualSettings.mode === "remotion" ? "remotion" : "canvas", title: "Settings audit", duration: 3, fps: body.fps, aspect: body.aspect, scenes: [], subtitles: body.subtitles ? [{ start: 0, end: 3, text: "Audit" }] : [] }, missing: [], voiceStale: false, audioPreviewId: "audit-mix.wav", sfxId: "audit-sfx.wav" };
    }) as any,
    startMotionVideoRenderInput: ((body: any) => { record("render", body); return start("render", { id: "audit-output", videoUrl: "/audit.mp4", aspect: body.options.aspect, quality: body.options.quality, fps: body.options.fps, durationSeconds: body.spec.duration, resolvedSettings: { subtitles: !!body.spec.subtitles?.length } }); }) as any,
    getStoryJob: ((id: string) => structuredClone(jobs.get(id))) as any,
    getMotionJob: ((id: string) => structuredClone(jobs.get(id))) as any,
    cancelStoryJob: () => false, cancelMotionJob: () => false,
  }, directory, 1);
  const settle = async (id: string) => {
    for (let i = 0; i < 1000; i++) { const state = service.getMotionProduction(id)!; if (["completed", "error", "cancelled"].includes(state.status)) return state; await delay(2); }
    throw new Error("Settings runner did not settle");
  };
  let index = 0;
  for (const profileId of ["history", "horror", "explainer", "library"]) for (const videoGenre of ["pov", "witness", "chronicle", "verdict"]) {
    const enabled = index % 2 === 0;
    const visualSettings = profileId === "library" ? { version: 1, mode: "library", engine: "canvas", packId: "minimal_mask", pacing: "few" } : { version: 1, mode: "remotion", engine: "remotion", profileId, componentRevision: 1, pacing: ["few", "medium", "many"][index % 3] };
    const input = { productionId: `matrix-${index++}`, source: { title: "Audit", text: "A messenger walks.", segments: [{ t: 0, text: "A messenger walks." }] }, visualSettings, language: enabled ? "en" : "vi", length: "12min", parts: 1, storytelling: enabled ? "lively" : "plain", renameEntities: enabled, characterMotion: enabled, asrCheck: enabled, sfx: enabled, sfxVolume: .27, subtitles: enabled, quality: "high", fps: 24, aspect: "9:16", encoder: "cpu", musicMood: enabled ? "off" : "warm", musicVolume: .19, autoExport: enabled, clearGeminiChatsBeforeExport: enabled, multiVoice: enabled, voiceChannel: "audit-channel@123", aiExecution: { provider: "gemini-chat", model: "gemini-flash", mode: "room-only", chromeHeadless: false, allowFallback: false }, sceneAiExecution: { provider: "chatgpt-ui", model: "chatgpt-auto", mode: "room-only", chromeHeadless: true, allowFallback: true }, aiReview: false, seo: false };
    const begin = calls.length;
    service.startMotionProduction(input);
    const final = await settle(input.productionId);
    assert.equal(final.status, "completed", final.error);
    const current = calls.slice(begin);
    for (const stage of ["analyze", "script", "scenes", "voice", "compile"]) {
      const body = current.find((c) => c.stage === stage)!.input;
      for (const key of ["language", "length", "parts", "storytelling", "renameEntities", "characterMotion", "asrCheck", "sfx", "sfxVolume", "subtitles", "fps", "aspect", "multiVoice", "voiceChannel", "clearGeminiChatsBeforeExport"]) assert.deepEqual(body[key], (input as any)[key], `${input.productionId}/${stage}/${key}`);
      assert.deepEqual(body.visualSettings, visualSettings);
      assert.equal(body.renderBehavior.actors, enabled ? "simple" : "fixed");
      assert.deepEqual(body.aiExecution, stage === "scenes" ? input.sceneAiExecution : input.aiExecution);
    }
    const sceneBody = current.find((c) => c.stage === "scenes")!.input;
    assert.deepEqual(sceneBody.mainAiExecution, input.aiExecution); assert.equal(sceneBody.autoVoice, false);
    assert.equal(current.some((c) => c.stage === "render"), enabled);
    if (enabled) {
      const options = current.find((c) => c.stage === "render")!.input.options;
      for (const key of ["quality", "aspect", "fps", "encoder", "sfxVolume", "clearGeminiChatsBeforeExport"]) assert.deepEqual(options[key], (input as any)[key]);
      assert.equal(options.music.mood, input.musicMood); assert.equal(options.music.volume, input.musicVolume); assert.equal(options.requireAudio, true);
    }
    records.push({ id: input.productionId, profileId, videoGenre, enabled, stages: current.map((c) => c.stage), status: final.status });
  }
  const saved = new MotionProductionStore<any>(directory).read("matrix-0")!;
  const analyzeOnly = { ...saved.input, productionId: "analyze-only", analyzeOnly: true };
  const beforeAnalyzeOnly = calls.length;
  service.startMotionProduction(analyzeOnly); assert.equal((await settle(analyzeOnly.productionId)).status, "completed"); assert.deepEqual(calls.slice(beforeAnalyzeOnly).map((c) => c.stage), ["analyze"]);
  const gpu = { ...saved.input, productionId: "unsupported-gpu", encoder: "gpu" };
  service.startMotionProduction(gpu); assert.equal((await settle(gpu.productionId)).status, "error");
  failScene = true;
  const resumable = { ...saved.input, productionId: "resume-settings", clearGeminiChatsBeforeExport: false };
  service.startMotionProduction(resumable); assert.equal((await settle(resumable.productionId)).status, "error"); failScene = false;
  const beforeResume = calls.length;
  service.resumeMotionProduction(resumable.productionId, true);
  assert.equal((await settle(resumable.productionId)).status, "completed");
  const resumed = new MotionProductionStore<any>(directory).read(resumable.productionId)!;
  assert.equal(resumed.input.clearGeminiChatsBeforeExport, true);
  for (const [key, value] of Object.entries(resumable)) if (key !== "clearGeminiChatsBeforeExport") assert.deepEqual(resumed.input[key], value);
  assert.equal(calls.slice(beforeResume).some((c) => c.stage === "analyze" || c.stage === "script" || c.stage === "voice"), false);
  const voiceRecheckRecord = new MotionProductionStore<any>(directory).read("matrix-12")!;
  voiceRecheckRecord.result.voice.asr.checked = false;
  voiceRecheckRecord.result.script.voiceTrack.asr.checked = false;
  const recheckStore = new MotionProductionStore<any>(directory);
  const recheckOwner = recheckStore.acquire("matrix-12");
  try { recheckStore.save("matrix-12", voiceRecheckRecord, recheckOwner); }
  finally { recheckStore.release("matrix-12", recheckOwner); }
  const beforeVoiceRecheck = calls.length;
  service.resumeMotionProduction("matrix-12");
  assert.equal((await settle("matrix-12")).status, "completed");
  assert.deepEqual(calls.slice(beforeVoiceRecheck).map((c) => c.stage), ["voice", "compile", "render"], "Resume rechecks unverified audio without reauthoring script or scenes");
  const output = { at: new Date().toISOString(), scope: "Actual backend runner with injected AI/media dependencies; temp production store; no live AI/TTS/render", matrix: records, analyzeOnly: "analyze only", remotionGpu: "rejected", resume: "saved input retained, only clear-chat updated; completed stages reused", resumeStages: calls.slice(beforeResume, beforeVoiceRecheck).map((c) => c.stage), voiceRecheckStages: calls.slice(beforeVoiceRecheck).map((c) => c.stage), stageNames: P.STAGES };
  const out = path.resolve("scratch/motion-settings-fixes-20261106"); fs.mkdirSync(out, { recursive: true }); fs.writeFileSync(path.join(out, "runner-verification.json"), JSON.stringify(output, null, 2));
  process.stdout.write(JSON.stringify(output, null, 2) + "\n");
} finally {
  if (priorStorage === undefined) delete process.env.VIDIFY_STORAGE_DIR; else process.env.VIDIFY_STORAGE_DIR = priorStorage;
  if (priorData === undefined) delete process.env.APP_DATA_DIR; else process.env.APP_DATA_DIR = priorData;
  const resolved = path.resolve(root); assert.ok(resolved.startsWith(path.resolve(os.tmpdir()) + path.sep)); fs.rmSync(resolved, { recursive: true, force: true });
}
