import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { MotionJobStatus as S, MotionStoryJobKind as K } from "../src/types/motionVideo.js";
import { motionVoiceSignature } from "../src/lib/motionVoice.js";
import { MOTION_PRODUCTION as P } from "../src/constants/motionProduction.js";
import { MotionProductionStore } from "../src/server/services/motionProductionStore.js";
const root = fs.mkdtempSync(path.join(os.tmpdir(), "motion-production-runner-"));
const prior = process.env.VIDIFY_STORAGE_DIR;
process.env.VIDIFY_STORAGE_DIR = root;
try {
  const { createMotionProductionService } = await import("../src/server/services/motionProductionService.js");
  const jobs = new Map<string, any>();
  const counts: Record<string, number> = {};
  const events: string[] = [];
  let failedScene = true;
  let failedVoice = false;
  let waitRender = false;
  const source = { title: "Test", text: "A village story.", segments: [{ t: 0, text: "A village story." }] };
  const analysis: any = { title: "Test", logline: "Test", cast: [], places: [], chapters: [{ id: "chapter_1", title: "One", targetSeconds: 2 }], facts: [] };
  const script: any = { title: "Test", language: "en", beats: [{ id: "beat_1", chapterId: "chapter_1", narration: "A village story.", visual: "scene" }] };
  const voice = { audioId: "speech.wav", durations: [2], totalSeconds: 2, signature: motionVoiceSignature(script, analysis) };
  const start = (kind: K | string, value: unknown, ms = 4, error?: string) => {
    counts[kind] = (counts[kind] || 0) + 1;
    events.push(kind + ":start");
    const id = kind + "_" + counts[kind];
    const job = { id, kind, status: S.RENDERING, progress: 0, log: [id], startedAt: Date.now() };
    jobs.set(id, job);
    if (ms >= 0)
      setTimeout(() => {
        if (job.status === S.CANCELLED) return;
        Object.assign(job, { status: error ? S.ERROR : S.COMPLETED, result: value, error, progress: 1 });
        events.push(kind + ":end");
      }, ms);
    return { success: true, job: structuredClone(job) };
  };
  const cancel = (id?: string) => {
    const job = id && jobs.get(id);
    if (!job || [S.COMPLETED, S.CANCELLED, S.ERROR].includes(job.status)) return false;
    job.status = S.CANCELLED;
    return true;
  };
  const deps: any = {
    checkMotionMediaTools: async () => {},
    checkMotionProductionVoice: async () => {},
    detectEncoders: async () => ["libx264"],
    analyzeMotionStoryInput: () => start(K.ANALYZE, analysis),
    scriptMotionStoryInput: () => start(K.SCRIPT, script),
    scenesMotionStoryInput: (input: any) => {
      assert.equal(input.autoVoice, false);
      assert.equal(input.previews, false);
      assert.equal(input.review, false);
      assert.equal(input.aiExecution.strictProvider, true);
      const error = failedScene ? "scene root cause" : undefined;
      failedScene = false;
      return start(K.SCENES, structuredClone(script), 35, error);
    },
    voiceMotionStoryInput: () => start(K.VOICE, voice, 8, failedVoice ? "voice root cause" : undefined),
    compileMotionStoryInput: async () => ({ spec: { duration: 2 }, missing: [], voiceStale: false }),
    startMotionVideoRenderInput: (input: any) => {
      assert.equal(input.options.requireAudio, true);
      assert.equal(input.options.audioId, voice.audioId);
      return start("render", { id: "output", videoUrl: "/output.mp4" }, waitRender ? -1 : 5);
    },
    seoMotionStoryInput: () => {
      throw new Error("optional SEO unavailable");
    },
    getStoryJob: (id: string) => structuredClone(jobs.get(id)),
    getMotionJob: (id: string) => structuredClone(jobs.get(id)),
    cancelStoryJob: cancel,
    cancelMotionJob: cancel,
  };
  const directory = path.join(root, "records");
  const service = createMotionProductionService(deps, directory, 1);
  const input = { productionId: "first", source, language: "en", aiReview: false, autoExport: true, aiExecution: { strictProvider: true } };
  const until = async (id: string) => {
    for (let i = 0; i < 500; i++) {
      const state = service.getMotionProduction(id)!;
      if ([S.ERROR, S.CANCELLED, S.COMPLETED].includes(state.status)) return state;
      await delay(2);
    }
    throw new Error("Production did not settle");
  };
  service.startMotionProduction(input);
  assert.equal(service.startMotionProduction(input).id, input.productionId);
  assert.throws(() => service.startMotionProduction({ ...input, fps: 60 }), /cấu hình/);
  const failed = await until(input.productionId);
  assert.match(failed.error!, /scene root cause/);
  assert.ok(events.indexOf(K.VOICE + ":start") < events.indexOf(K.SCENES + ":end"));
  assert.equal((failed.result as any).voice.audioId, voice.audioId);
  assert.ok(failed.progress < 0.6);
  service.resumeMotionProduction(input.productionId);
  const completed = await until(input.productionId);
  assert.equal(completed.status, S.COMPLETED);
  assert.equal(counts[K.ANALYZE], 1);
  assert.equal(counts[K.SCRIPT], 1);
  assert.equal(counts[K.VOICE], 1);
  assert.equal(counts[K.SCENES], 2);
  assert.equal((completed.result as any).rendered.id, "output");
  assert.ok(completed.log.some((line) => line.includes("optional SEO unavailable")));
  const restored = createMotionProductionService(deps, directory, 1);
  assert.deepEqual(restored.getMotionProduction(input.productionId), completed);
  failedVoice = true;
  service.startMotionProduction({ ...input, productionId: "voice_failure" });
  const voiceFailure = await until("voice_failure");
  assert.match(voiceFailure.error!, /voice root cause/);
  assert.doesNotMatch(voiceFailure.error!, /scene root cause/);
  failedVoice = false;
  waitRender = true;
  const renders = counts.render;
  service.startMotionProduction({ ...input, productionId: "stop" });
  for (let i = 0; i < 500 && counts.render === renders; i++) await delay(2);
  assert.equal(service.cancelMotionProduction("stop"), true);
  await delay(10);
  assert.equal(service.getMotionProduction("stop")!.status, S.CANCELLED);
  const before = JSON.stringify(counts);
  service.recoverMotionProductions();
  await delay(15);
  assert.equal(JSON.stringify(counts), before);
  waitRender = false;
  const revised = { ...script, beats: [{ ...script.beats[0], narration: "A longer village story with the same ending." }] };
  let repairWrites = 0;
  let repairScenes = 0;
  let repairVoices = 0;
  let failRepair = true;
  const correction = createMotionProductionService(
    {
      ...deps,
      scriptMotionStoryInput: (body: any) => {
        if (body.durationRepair) {
          assert.equal(body.speechRate, 3.75);
          repairWrites++;
        }
        return start(K.SCRIPT, structuredClone(body.durationRepair ? revised : script));
      },
      scenesMotionStoryInput: (body: any) => {
        repairScenes++;
        return start(K.SCENES, structuredClone(body.script), 5);
      },
      voiceMotionStoryInput: (body: any) => {
        repairVoices++;
        const changed = body.script.beats[0].narration === revised.beats[0].narration;
        const error = changed && failRepair ? "repair voice interrupted" : undefined;
        if (error) failRepair = false;
        return start(K.VOICE, { ...voice, totalSeconds: changed ? 2 : 0.8, signature: motionVoiceSignature(body.script, analysis) }, 12, error);
      },
    },
    path.join(root, "correction"),
    1,
  );
  correction.startMotionProduction({ ...input, productionId: "duration", seo: false });
  const correctionUntil = async () => {
    for (let i = 0; i < 500; i++) {
      const job = correction.getMotionProduction("duration")!;
      if ([S.ERROR, S.COMPLETED].includes(job.status)) return job;
      await delay(2);
    }
    throw new Error("Duration correction did not settle");
  };
  assert.match((await correctionUntil()).error!, /repair voice interrupted/);
  correction.resumeMotionProduction("duration");
  assert.equal((await correctionUntil()).status, S.COMPLETED);
  assert.equal(repairWrites, 1);
  assert.equal(repairScenes, 2);
  assert.equal(repairVoices, 3);
  let advisoryWrites = 0;
  let advisoryScenes = 0;
  let advisoryVoices = 0;
  const advisoryService = createMotionProductionService(
    {
      ...deps,
      scriptMotionStoryInput: () => {
        advisoryWrites++;
        return start(K.SCRIPT, structuredClone(script));
      },
      scenesMotionStoryInput: (body: any) => {
        advisoryScenes++;
        return start(K.SCENES, structuredClone(body.script));
      },
      voiceMotionStoryInput: () => {
        advisoryVoices++;
        return start(K.VOICE, { ...voice, totalSeconds: 1.3 });
      },
    },
    path.join(root, "advisory"),
    1,
  );
  advisoryService.startMotionProduction({ ...input, productionId: "advisory", seo: false });
  for (let i = 0; i < 500 && advisoryService.getMotionProduction("advisory")?.status !== S.COMPLETED; i++) await delay(2);
  const advisoryState = advisoryService.getMotionProduction("advisory")!;
  assert.equal(advisoryState.status, S.COMPLETED);
  assert.ok(advisoryState.log.some((line) => line.includes("timeline")));
  assert.equal(advisoryWrites, 1);
  assert.equal(advisoryScenes, 1);
  assert.equal(advisoryVoices, 1);
  assert.equal((advisoryState.result as any).voice.totalSeconds, 1.3);
  const seoProgress = createMotionProductionService({ ...deps, seoMotionStoryInput: () => start(K.SEO, { options: [], chapters: [{ id: analysis.chapters[0].id, t: 0, title: source.title }] }, 3), scenesMotionStoryInput: (body: any) => start(K.SCENES, structuredClone(body.script), 100) }, path.join(root, "seo-progress"), 1);
  seoProgress.startMotionProduction({ ...input, productionId: "seo-progress" });
  let seoWhileScenes = false;
  for (let i = 0; i < 500; i++) {
    const current = seoProgress.getMotionProduction("seo-progress")!;
    if (current.result?.seo && current.status !== S.COMPLETED) {
      seoWhileScenes = true;
      assert.equal(current.result.seoJobId, undefined);
      assert.ok(current.log.some((line) => line.includes("[Tạo SEO]")));
    }
    if (current.status === S.COMPLETED) break;
    assert.notEqual(current.status, S.ERROR);
    await delay(2);
  }
  assert.ok(seoWhileScenes);
  assert.equal(seoProgress.getMotionProduction("seo-progress")!.status, S.COMPLETED);
  const oldSeoFile = path.join(root, "seo-progress", "seo-progress.json");
  const oldSeoRecord = JSON.parse(fs.readFileSync(oldSeoFile, "utf8"));
  oldSeoRecord.result.seoJobId = oldSeoRecord.steps[P.STAGES.SEO].id;
  fs.writeFileSync(oldSeoFile, JSON.stringify(oldSeoRecord));
  const oldSeoBytes = fs.readFileSync(oldSeoFile, "utf8");
  const oldSeoService = createMotionProductionService(deps, path.join(root, "seo-progress"), 1);
  assert.equal(oldSeoService.getMotionProduction("seo-progress")!.result?.seoJobId, undefined);
  assert.equal(fs.readFileSync(oldSeoFile, "utf8"), oldSeoBytes);
  const originalScript = structuredClone(script);
  const snapshotService = createMotionProductionService({ ...deps, scenesMotionStoryInput: (body: any) => start(K.SCENES, body.script, 5), voiceMotionStoryInput: (body: any) => start(K.VOICE, { ...voice, signature: motionVoiceSignature(body.script, analysis) }) }, path.join(root, "snapshot"), 1);
  snapshotService.startMotionProduction({ ...input, productionId: "snapshot", analysis, script: originalScript, voiceChannel: "selected-profile", seo: false });
  for (let i = 0; i < 500 && snapshotService.getMotionProduction("snapshot")?.status !== S.COMPLETED; i++) await delay(2);
  const savedSnapshot = createMotionProductionService(deps, path.join(root, "snapshot"), 1).getMotionProduction("snapshot");
  assert.equal(savedSnapshot?.status, S.COMPLETED);
  assert.deepEqual(originalScript, script);
  const snapshotFile = path.join(root, "snapshot", "snapshot.json");
  const damaged = JSON.parse(fs.readFileSync(snapshotFile, "utf8"));
  damaged.input.script.title = "Unexpected mutation";
  fs.writeFileSync(snapshotFile, JSON.stringify(damaged));
  const snapshotBytes = fs.readFileSync(snapshotFile, "utf8");
  const damagedService = createMotionProductionService(deps, path.join(root, "snapshot"), 1);
  const damagedState = damagedService.getMotionProduction("snapshot")!;
  assert.equal(damagedState.status, S.ERROR);
  assert.equal(damagedState.error, P.SNAPSHOT_INVALID);
  assert.deepEqual(damagedState.result, damaged.result);
  assert.throws(() => damagedService.startMotionProduction(damaged.input), /Bản lưu/);
  assert.throws(() => damagedService.resumeMotionProduction("snapshot"), /không hợp lệ/);
  damagedService.recoverMotionProductions();
  assert.equal(fs.readFileSync(snapshotFile, "utf8"), snapshotBytes);
  fs.writeFileSync(path.join(root, "snapshot", "broken.json"), "{");
  assert.equal(damagedService.getMotionProduction("broken")!.error, P.SNAPSHOT_INVALID);
  assert.throws(() => damagedService.startMotionProduction({ ...input, productionId: "broken" }), /Bản lưu/);
  let serviceScenes = 0;
  let serviceVoices = 0;
  const serviceDirectory = path.join(root, "service-recovery");
  const serviceDependencies = {
    ...deps,
    scenesMotionStoryInput: (body: any) => start(K.SCENES, structuredClone(body.script), 5, ++serviceScenes === 1 ? "chat_planning_provider_error_response" : undefined),
    voiceMotionStoryInput: () => {
      serviceVoices++;
      return start(K.VOICE, voice, 1);
    },
  };
  const serviceRecovery = createMotionProductionService(serviceDependencies, serviceDirectory, 1, 150);
  serviceRecovery.startMotionProduction({ ...input, productionId: "service", analysis, script, seo: false });
  for (let i = 0; i < 500 && !serviceRecovery.getMotionProduction("service")?.stage?.includes("chờ dịch vụ"); i++) await delay(2);
  assert.match(serviceRecovery.getMotionProduction("service")!.stage!, /chờ dịch vụ/);
  assert.equal(serviceRecovery.getMotionProduction("service")!.status, S.RENDERING);
  assert.equal(serviceRecovery.cancelMotionProduction("service"), true);
  for (let i = 0; i < 500 && fs.existsSync(path.join(serviceDirectory, "service.lock")); i++) await delay(2);
  const beforeRecovery = JSON.parse(fs.readFileSync(path.join(serviceDirectory, "service.json"), "utf8"));
  assert.equal(beforeRecovery.steps[P.STAGES.SCENES].retries, 1);
  assert.ok(beforeRecovery.steps[P.STAGES.SCENES].retryAt > 0);
  const recoveredService = createMotionProductionService(serviceDependencies, serviceDirectory, 1, 150);
  recoveredService.recoverMotionProductions();
  assert.equal(serviceScenes, 1);
  recoveredService.resumeMotionProduction("service");
  for (let i = 0; i < 500 && recoveredService.getMotionProduction("service")?.status !== S.COMPLETED; i++) await delay(2);
  assert.equal(recoveredService.getMotionProduction("service")!.status, S.COMPLETED);
  assert.equal(serviceScenes, 2);
  assert.equal(serviceVoices, 1);
  let exhaustedServices = 0;
  const exhaustedService = createMotionProductionService(
    {
      ...deps,
      scenesMotionStoryInput: () => {
        exhaustedServices++;
        return start(K.SCENES, script, 1, "gemini_model_ui_not_ready");
      },
    },
    path.join(root, "service-exhausted"),
    1,
    1,
  );
  exhaustedService.startMotionProduction({ ...input, productionId: "exhausted-service", analysis, script, seo: false });
  for (let i = 0; i < 500 && exhaustedService.getMotionProduction("exhausted-service")?.status !== S.ERROR; i++) await delay(2);
  assert.match(exhaustedService.getMotionProduction("exhausted-service")!.error!, /gemini_model_ui_not_ready/);
  assert.equal(exhaustedServices, P.SERVICE_RETRIES + 1);
  const store = new MotionProductionStore<any>(path.join(root, "ownership"));
  const owner = store.acquire("run");
  assert.throws(() => new MotionProductionStore<any>(path.join(root, "ownership")).acquire("run"), /tiến trình khác/);
  assert.throws(() => store.save("run", {}, { ...owner, token: "stale" }), /Quyền xử lý/);
  store.release("run", { ...owner, token: "stale" });
  assert.equal(store.owns("run", owner), true);
  store.save("run", { owner, accepted: [1, 2] }, owner);
  store.release("run", owner);
  assert.deepEqual(store.read("run").accepted, [1, 2]);
  fs.writeFileSync(path.join(root, "ownership", "run.lock"), JSON.stringify({ pid: 2147483647, token: "dead", updated: 0 }));
  const takeover = store.acquire("run");
  assert.equal(takeover.pid, process.pid);
  store.release("run", takeover);
  console.log("Production runner: parallel work, targeted resume, idempotency, optional SEO, cancellation, persistence and fencing passed.");
} finally {
  if (prior === undefined) delete process.env.VIDIFY_STORAGE_DIR;
  else process.env.VIDIFY_STORAGE_DIR = prior;
  fs.rmSync(root, { recursive: true, force: true });
}
