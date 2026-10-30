import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { MotionJobStatus as S, MotionStoryJobKind as K } from "../src/types/motionVideo.js";
import { motionVoiceSignature } from "../src/lib/motionVoice.js";
import { MOTION_PRODUCTION as P } from "../src/constants/motionProduction.js";
import { MotionProductionStore } from "../src/features/motion/server/services/motionProductionStore.js";
import { remotionBeatKey } from "../src/features/motion/server/services/remotion/sceneKeys.js";
import { MOTION_REMOTION_LAYOUT as L } from "../src/constants/motionRemotionLayout.js";
import { MOTION_VISUAL as V } from "../src/constants/motionVisual.js";
import { seoScriptKey } from "../src/features/motion/server/services/motionSeoService.js";
const root = fs.mkdtempSync(path.join(os.tmpdir(), "motion-production-runner-"));
const prior = process.env.VIDIFY_STORAGE_DIR;
process.env.VIDIFY_STORAGE_DIR = root;
try {
  const { createMotionProductionService } = await import("../src/features/motion/server/services/motionProductionService.js");
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
    recoverMotionIllustrationPlan: async (analysis: any) => ({ analysis }),
    checkRemotionRuntime: async () => {
      throw new Error("Legacy library must not initialize Remotion");
    },
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
      assert.deepEqual(input.mainAiExecution, input.aiExecution.provider === "scene-provider" ? { provider: "content-provider", model: "content-model", strictProvider: true } : input.aiExecution);
      const error = failedScene ? "scene root cause" : undefined;
      failedScene = false;
      return start(K.SCENES, structuredClone(script), 35, error);
    },
    voiceMotionStoryInput: (body: any) => {
      assert.equal(body.aiExecution.provider, "content-provider");
      assert.equal(body.aiExecution.model, "content-model");
      return start(K.VOICE, voice, 8, failedVoice ? "voice root cause" : undefined);
    },
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
  const input = { productionId: "first", source, language: "en", aiReview: false, autoExport: true, aiExecution: { provider: "content-provider", model: "content-model", strictProvider: true }, sceneAiExecution: { provider: "scene-provider", model: "scene-model", strictProvider: true } };
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
  let remotionPreflight = 0;
  let remotionScenes = 0;
  let remotionTargetSeconds = 2;
  let remotionFailed = false;
  let remotionCompiles = 0;
  const remotionSettings = { version: 1, mode: "remotion", engine: "remotion", profileId: "history", componentRevision: 1 };
  const remotionService = createMotionProductionService(
    {
      ...deps,
      analyzeMotionStoryInput: () => start(K.ANALYZE, { ...analysis, chapters: analysis.chapters.map((chapter: any) => ({ ...chapter, targetSeconds: remotionTargetSeconds })) }),
      scriptMotionStoryInput: () => start(K.SCRIPT, { ...script, beats: script.beats.map((beat: any) => ({ ...beat, narration: remotionTargetSeconds === 2 ? beat.narration : Array(30).fill(beat.narration).join(" ") })) }),
      voiceMotionStoryInput: (body: any) => start(K.VOICE, { ...voice, signature: motionVoiceSignature(body.script, body.analysis) }),
      checkRemotionRuntime: async () => {
        remotionPreflight++;
      },
      recoverMotionIllustrationPlan: async () => {
        throw new Error("Remotion must not check library coverage");
      },
      scenesMotionStoryInput: (body: any) => {
        assert.deepEqual(body.visualSettings, remotionSettings);
        assert.equal(body.stylePreset, undefined);
        assert.equal(body.analysis.stylePreset, undefined);
        remotionScenes++;
        const beat = body.script.beats[0];
        const key = remotionBeatKey(beat, body.analysis);
        return start(
          K.SCENES,
          {
            ...body.script,
            visualSettings: remotionSettings,
            gen: { ...body.script.gen, remotion: { settings: remotionSettings, profileRevision: V.PROFILES.history.revision, layoutRevision: L.REVISION, scenes: { [beat.id]: [{ id: "failed-scene", sourceKey: key, sceneRevision: L.SCENE_REVISION, ...(remotionFailed ? { build: { status: "failed", attempts: 2 } } : {}) }] }, inputKeys: { [beat.id]: key } } },
          },
          2,
        );
      },
      compileMotionStoryInput: async (body: any) => {
        remotionCompiles++;
        assert.deepEqual(body.visualSettings, remotionSettings);
        return { spec: { engine: "remotion", duration: 2, fps: 24 }, missing: [], voiceStale: false };
      },
    } as any,
    path.join(root, "remotion"),
    1,
  );
  remotionService.startMotionProduction({ ...input, productionId: "remotion", visualSettings: remotionSettings, stylePreset: "must-be-cleared", fps: 24, encoder: "cpu" });
  for (let i = 0; i < 500 && ![S.COMPLETED, S.ERROR].includes(remotionService.getMotionProduction("remotion")!.status); i++) await delay(2);
  const remotionJob = remotionService.getMotionProduction("remotion")!;
  assert.equal(remotionJob.status, S.COMPLETED, remotionJob.error);
  assert.equal(remotionPreflight, 1);
  assert.equal((remotionJob.result as any).compiled.spec.engine, "remotion");
  const remotionRestored = createMotionProductionService(deps, path.join(root, "remotion"), 1);
  assert.deepEqual(remotionRestored.getMotionProduction("remotion"), remotionJob);
  const oldFile = path.join(root, "remotion", "remotion.json");
  const oldRecord = JSON.parse(fs.readFileSync(oldFile, "utf8"));
  delete oldRecord.result.script.gen.remotion.scenes.beat_1[0].sceneRevision;
  oldRecord.job.status = S.ERROR;
  const countsBeforeMigration = { ...counts };
  fs.writeFileSync(oldFile, JSON.stringify(oldRecord));
  remotionService.resumeMotionProduction("remotion");
  for (let i = 0; i < 500 && ![S.COMPLETED, S.ERROR].includes(remotionService.getMotionProduction("remotion")!.status); i++) await delay(2);
  const migratedJob = remotionService.getMotionProduction("remotion")!;
  assert.equal(migratedJob.status, S.COMPLETED, migratedJob.error);
  assert.equal(remotionScenes, 2);
  assert.equal(counts[K.ANALYZE], countsBeforeMigration[K.ANALYZE]);
  assert.equal(counts[K.SCRIPT], countsBeforeMigration[K.SCRIPT]);
  assert.equal(counts[K.VOICE], countsBeforeMigration[K.VOICE]);
  assert.equal(counts.render, countsBeforeMigration.render + 1);
  remotionTargetSeconds = 100;
  const durationCounts = { ...counts };
  remotionService.startMotionProduction({ ...input, productionId: "remotion-duration-advisory", visualSettings: remotionSettings, seo: false });
  for (let i = 0; i < 500 && ![S.COMPLETED, S.ERROR].includes(remotionService.getMotionProduction("remotion-duration-advisory")!.status); i++) await delay(2);
  const remotionDurationJob = remotionService.getMotionProduction("remotion-duration-advisory")!;
  assert.equal(remotionDurationJob.status, S.COMPLETED, remotionDurationJob.error);
  assert.equal(counts[K.SCRIPT], durationCounts[K.SCRIPT] + 1);
  assert.equal(counts[K.VOICE], durationCounts[K.VOICE] + 1);
  assert.equal(counts[K.SCENES], durationCounts[K.SCENES] + 1);
  assert.ok(remotionDurationJob.log.some((line) => line.includes("timeline") && line.includes("100")));
  remotionTargetSeconds = 2;
  remotionFailed = true;
  const beforePartial = { ...counts };
  const beforePartialCompiles = remotionCompiles;
  const beforePartialScenes = remotionScenes;
  remotionService.startMotionProduction({ ...input, productionId: "remotion-partial", visualSettings: remotionSettings, seo: false });
  const settlePartial = async () => {
    for (let i = 0; i < 500; i++) {
      const state = remotionService.getMotionProduction("remotion-partial")!;
      if ([S.ERROR, S.COMPLETED].includes(state.status)) return state;
      await delay(2);
    }
    throw new Error("Partial production did not settle");
  };
  const partial = await settlePartial();
  assert.equal(partial.status, S.ERROR);
  assert.match(partial.error!, /Chưa đủ hình/);
  assert.ok((partial.result as any).voice.audioId);
  assert.equal(partial.stepStates?.[P.STAGES.SCENES]?.status, S.ERROR);
  assert.equal(remotionCompiles, beforePartialCompiles);
  assert.equal(counts.render, beforePartial.render);
  const afterPartial = { ...counts };
  remotionFailed = false;
  remotionService.resumeMotionProduction("remotion-partial");
  assert.equal((await settlePartial()).status, S.COMPLETED);
  assert.equal(remotionScenes, beforePartialScenes + 2);
  assert.equal(counts[K.ANALYZE], afterPartial[K.ANALYZE]);
  assert.equal(counts[K.SCRIPT], afterPartial[K.SCRIPT]);
  assert.equal(counts[K.VOICE], afterPartial[K.VOICE]);
  assert.equal(remotionCompiles, beforePartialCompiles + 1);
  assert.equal(counts.render, beforePartial.render + 1);
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
  let draftRepairWrites = 0;
  let draftRepairScenes = 0;
  const draftRepairService = createMotionProductionService(
    {
      ...deps,
      scriptMotionStoryInput: (body: any) => {
        if (!body.durationRepair) return start(K.SCRIPT, structuredClone(script));
        const interrupted = ++draftRepairWrites === 1;
        return start(K.SCRIPT, interrupted ? { ...structuredClone(script), chapterDrafts: { chapter_1: { inputKey: "duration", rows: script.beats, pending: [{ id: "beat_1", fields: ["narration"] }] } } } : structuredClone(revised), 5, interrupted ? "duration script interrupted" : undefined);
      },
      scenesMotionStoryInput: (body: any) => {
        draftRepairScenes++;
        return start(K.SCENES, structuredClone(body.script));
      },
      voiceMotionStoryInput: (body: any) => start(K.VOICE, { ...voice, totalSeconds: body.script.beats[0].narration === revised.beats[0].narration ? 2 : 0.8, signature: motionVoiceSignature(body.script, analysis) }),
    },
    path.join(root, "duration-draft"),
    1,
  );
  const settleDraftRepair = async () => {
    for (let i = 0; i < 500; i++) {
      const state = draftRepairService.getMotionProduction("duration-draft")!;
      if ([S.ERROR, S.COMPLETED].includes(state.status)) return state;
      await delay(2);
    }
    throw new Error("Duration draft did not settle");
  };
  draftRepairService.startMotionProduction({ ...input, productionId: "duration-draft", seo: false });
  const interruptedDraft = await settleDraftRepair();
  assert.match(interruptedDraft.error!, /duration script interrupted/);
  assert.ok((interruptedDraft.result as any).script.chapterDrafts.chapter_1);
  draftRepairService.resumeMotionProduction("duration-draft");
  assert.equal((await settleDraftRepair()).status, S.COMPLETED);
  assert.equal(draftRepairWrites, 2);
  assert.equal(draftRepairScenes, 2);
  const minuteAnalysis = { ...analysis, chapters: [{ ...analysis.chapters[0], targetSeconds: 60 }] };
  let minuteWrites = 0;
  let minuteVoices = 0;
  const minuteScenes: string[] = [];
  const minuteService = createMotionProductionService(
    {
      ...deps,
      analyzeMotionStoryInput: () => start(K.ANALYZE, minuteAnalysis),
      scriptMotionStoryInput: (body: any) => {
        if (body.durationRepair) minuteWrites++;
        return start(K.SCRIPT, { ...script, beats: [{ ...script.beats[0], narration: `Duration revision ${minuteWrites}. ` + "A village story. ".repeat(30).trim() }] });
      },
      voiceMotionStoryInput: (body: any) => {
        minuteVoices++;
        return start(K.VOICE, { ...voice, totalSeconds: [120, 76][minuteWrites], signature: motionVoiceSignature(body.script, minuteAnalysis) });
      },
      scenesMotionStoryInput: (body: any) => {
        minuteScenes.push(body.script.beats[0].narration);
        return start(K.SCENES, structuredClone(body.script));
      },
    },
    path.join(root, "minute-duration"),
    1,
  );
  minuteService.startMotionProduction({ ...input, productionId: "minute-duration", seo: false });
  let minuteState;
  for (let i = 0; i < 500; i++) {
    minuteState = minuteService.getMotionProduction("minute-duration")!;
    if ([S.ERROR, S.COMPLETED].includes(minuteState.status)) break;
    await delay(2);
  }
  assert.equal(minuteState?.status, S.COMPLETED, minuteState?.error);
  assert.equal(minuteWrites, 1);
  assert.equal(minuteVoices, 2);
  assert.deepEqual(
    minuteScenes.map((text) => text.split(". ")[0]),
    ["Duration revision 0", "Duration revision 1"],
  );
  assert.ok(minuteState?.log.some((line) => line.includes("76") && line.includes("60")));
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
  const seoPack = { options: [{ title: "A village story", description: "A story.", hashtags: [], tags: [], seoScore: 90 }], chapters: [{ id: analysis.chapters[0].id, t: 0, title: source.title }], scriptKey: seoScriptKey(script), timingFrom: "estimate" };
  const seoProgress = createMotionProductionService({ ...deps, seoMotionStoryInput: () => start(K.SEO, seoPack, 40), scenesMotionStoryInput: (body: any) => start(K.SCENES, structuredClone(body.script), 100) }, path.join(root, "seo-progress"), 1);
  seoProgress.startMotionProduction({ ...input, productionId: "seo-progress" });
  let seoWhileScenes = false;
  let seoRunningState = false;
  for (let i = 0; i < 500; i++) {
    const current = seoProgress.getMotionProduction("seo-progress")!;
    if (current.stepStates?.[P.STAGES.SEO]?.status === S.RENDERING) seoRunningState = true;
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
  assert.ok(seoRunningState, "SEO background status must be published while scenes are running");
  assert.equal(seoProgress.getMotionProduction("seo-progress")!.stepStates?.[P.STAGES.SEO]?.status, S.COMPLETED);
  assert.equal(seoProgress.getMotionProduction("seo-progress")!.status, S.COMPLETED);
  const oldSeoFile = path.join(root, "seo-progress", "seo-progress.json");
  const oldSeoRecord = JSON.parse(fs.readFileSync(oldSeoFile, "utf8"));
  oldSeoRecord.result.seoJobId = oldSeoRecord.steps[P.STAGES.SEO].id;
  fs.writeFileSync(oldSeoFile, JSON.stringify(oldSeoRecord));
  const oldSeoBytes = fs.readFileSync(oldSeoFile, "utf8");
  const oldSeoService = createMotionProductionService(deps, path.join(root, "seo-progress"), 1);
  assert.equal(oldSeoService.getMotionProduction("seo-progress")!.result?.seoJobId, undefined);
  assert.equal(fs.readFileSync(oldSeoFile, "utf8"), oldSeoBytes);
  let seoAttempts = 0;
  let seoScenario: "recover" | "fail" | "hang" | "pass" = "recover";
  const seoDirectory = path.join(root, "seo-recovery");
  const seoRecovery = createMotionProductionService(
    {
      ...deps,
      scenesMotionStoryInput: (body: any) => start(K.SCENES, structuredClone(body.script), 12),
      seoMotionStoryInput: () => {
        seoAttempts++;
        const response = start(K.SEO, seoPack, seoScenario === "hang" ? -1 : 2, seoScenario === "fail" || (seoScenario === "recover" && seoAttempts === 2) ? "seo service interrupted" : undefined);
        if (seoScenario === "recover" && seoAttempts === 1) cancel(response.job.id);
        return response;
      },
    },
    seoDirectory,
    1,
    1,
    20,
  );
  const seoUntil = async (id: string) => {
    for (let i = 0; i < 500; i++) {
      const state = seoRecovery.getMotionProduction(id)!;
      if ([S.ERROR, S.CANCELLED, S.COMPLETED].includes(state.status)) return state;
      await delay(2);
    }
    throw new Error("SEO recovery did not settle");
  };
  seoRecovery.startMotionProduction({ ...input, productionId: "seo-recover" });
  const seoRecovered = await seoUntil("seo-recover");
  assert.equal(seoRecovered.status, S.COMPLETED, seoRecovered.error);
  assert.equal(seoAttempts, 3);
  assert.equal(seoRecovered.result?.seo?.timingFrom, "voice");
  assert.equal(seoRecovered.result?.seoJobId, undefined);
  assert.equal(seoRecovered.log.filter((line) => line.includes("phục hồi riêng SEO")).length, 2);
  const seoCounts = { ...counts };
  seoRecovery.resumeMotionProduction("seo-recover");
  await delay(5);
  assert.deepEqual(counts, seoCounts);
  seoScenario = "fail";
  seoAttempts = 0;
  seoRecovery.startMotionProduction({ ...input, productionId: "seo-exhausted" });
  const seoFailed = await seoUntil("seo-exhausted");
  assert.equal(seoFailed.status, S.COMPLETED);
  assert.equal(seoAttempts, P.SEO_RETRIES + 1);
  assert.equal(seoFailed.result?.seo, undefined);
  assert.ok(seoFailed.log.some((line) => line.includes(P.SEO_EXHAUSTED)));
  const failedSeoFile = path.join(seoDirectory, "seo-exhausted.json");
  const legacySeo = JSON.parse(fs.readFileSync(failedSeoFile, "utf8"));
  legacySeo.steps[P.STAGES.SEO].done = true;
  fs.writeFileSync(failedSeoFile, JSON.stringify(legacySeo));
  seoScenario = "pass";
  const beforeSeoResume = { ...counts };
  const renderedBeforeSeoResume = structuredClone(seoFailed.result?.rendered);
  seoRecovery.resumeMotionProduction("seo-exhausted");
  const seoOnly = await seoUntil("seo-exhausted");
  assert.equal(seoOnly.status, S.COMPLETED, seoOnly.error);
  assert.equal(seoOnly.result?.seo?.options.length, 1);
  assert.equal(seoAttempts, P.SEO_RETRIES + 2);
  for (const kind of [K.ANALYZE, K.SCRIPT, K.SCENES, K.VOICE, "render"]) assert.equal(counts[kind], beforeSeoResume[kind]);
  assert.deepEqual(seoOnly.result?.rendered, renderedBeforeSeoResume);
  seoScenario = "hang";
  seoAttempts = 0;
  seoRecovery.startMotionProduction({ ...input, productionId: "seo-timeout" });
  const timedSeo = await seoUntil("seo-timeout");
  assert.equal(timedSeo.status, S.COMPLETED);
  assert.equal(seoAttempts, 1);
  assert.equal(timedSeo.result?.seoJobId, undefined);
  assert.ok(timedSeo.log.some((line) => line.includes(P.SEO_PENDING)));
  const timedRecord = JSON.parse(fs.readFileSync(path.join(seoDirectory, "seo-timeout.json"), "utf8"));
  assert.equal(timedRecord.steps[P.STAGES.SEO].done, undefined);
  assert.equal(jobs.get(timedRecord.steps[P.STAGES.SEO].id).status, S.CANCELLED);
  seoScenario = "pass";
  seoRecovery.resumeMotionProduction("seo-timeout");
  assert.equal((await seoUntil("seo-timeout")).result?.seo?.options.length, 1);
  seoScenario = "hang";
  seoAttempts = 0;
  seoRecovery.startMotionProduction({ ...input, productionId: "seo-stop" });
  for (let i = 0; i < 500 && !seoAttempts; i++) await delay(2);
  assert.equal(seoRecovery.cancelMotionProduction("seo-stop"), true);
  await delay(25);
  assert.equal(seoRecovery.getMotionProduction("seo-stop")?.status, S.CANCELLED);
  assert.equal(seoAttempts, 1);
  seoRecovery.recoverMotionProductions();
  await delay(5);
  assert.equal(seoAttempts, 1);
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
  let singleVoiceCalls = 0;
  let singleSceneCalls = 0;
  const singleService = createMotionProductionService(
    {
      ...deps,
      scenesMotionStoryInput: (body: any) => {
        assert.equal(body.script.voiceSettings.multiVoice, false);
        return start(K.SCENES, structuredClone(body.script), 10, ++singleSceneCalls === 1 ? "scene root cause" : undefined);
      },
      voiceMotionStoryInput: (body: any) => {
        singleVoiceCalls++;
        assert.equal(body.script.voiceSettings.multiVoice, false, "Production must apply narrator-only mode before starting audio");
        return start(K.VOICE, { ...voice, signature: motionVoiceSignature(body.script, body.analysis) }, 1);
      },
      compileMotionStoryInput: async (body: any) => {
        assert.equal(body.script.voiceSettings.multiVoice, false);
        assert.equal(body.voiceTrack.signature, motionVoiceSignature(body.script, body.analysis));
        return { spec: { duration: 2 }, missing: [], voiceStale: false };
      },
    },
    path.join(root, "single-voice"),
    1,
  );
  singleService.startMotionProduction({ ...input, productionId: "single-voice", analysis, multiVoice: false, seo: false, autoExport: false });
  for (let i = 0; i < 500 && singleService.getMotionProduction("single-voice")?.status !== S.ERROR; i++) await delay(2);
  assert.equal(singleService.getMotionProduction("single-voice")!.status, S.ERROR);
  singleService.resumeMotionProduction("single-voice");
  for (let i = 0; i < 500 && singleService.getMotionProduction("single-voice")?.status !== S.COMPLETED; i++) await delay(2);
  assert.equal(singleService.getMotionProduction("single-voice")!.status, S.COMPLETED, "Saved production resumes with its selected voice mode");
  assert.equal(singleVoiceCalls, 1, "Scene recovery preserves the valid narrator-only voice track");
  assert.equal(singleSceneCalls, 2);
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
  process.stdout.write("Production runner: parallel work, targeted resume, idempotency, optional SEO, cancellation, persistence and fencing passed.\n");
} finally {
  if (prior === undefined) delete process.env.VIDIFY_STORAGE_DIR;
  else process.env.VIDIFY_STORAGE_DIR = prior;
  fs.rmSync(root, { recursive: true, force: true });
}
