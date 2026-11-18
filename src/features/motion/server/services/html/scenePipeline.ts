import { motionSceneScorecard } from "../../../../../lib/motionSceneScorecard.js";
import fs from "node:fs";
import path from "node:path";
import _ from "lodash";
import { motionAnalysisEraYear } from "../../../../../lib/motionEra.js";
import { motionPlanVarietyIssues } from "../../../../../lib/motionPlanVariety.js";
import { MOTION_PLAN_VARIETY } from "../../../../../constants/motionPlanVariety.js";
import * as RT_MAINTENANCE from "../../../../../constants/runtime/maintenance.js";
import { motionAiFallbackPolicy, motionSceneWorkerIds } from "../../../../../lib/motionAiExecution.js";
import { stringifyJson } from "../../../../../lib/jsonStringify.js";
import type { ChatPendingSubmission, ChatPlanningSubmission } from "../../../../../server/services/chatSubmissionRecovery.js";
import { randomUUID } from "node:crypto";
import { AsyncResource } from "node:async_hooks";
import { setTimeout as delay } from "node:timers/promises";
import { MOTION_HTML } from "../../../../../constants/motionHtmlTemplate.js";
import { MOTION_HTML_QUALITY } from "../../../../../constants/motionHtmlQuality.js";
import { motionHtmlRequired } from "../../../../../lib/motionHtmlQuality.js";
import { motionHtmlVisualDirection, motionHtmlPacingDirection, motionHtmlLanguageDirection } from "../../../../../lib/motionHtmlAuthoring.js";
import { motionHtmlPlanContext, motionHtmlPlanSource, motionHtmlPlanCurrent, motionHtmlPlanSourceMatches, motionSceneOnScreen, motionCompactScene } from "../../../../../lib/motionHtmlScene.js";
import { motionPlanSettings, motionSceneCurrent, motionVisualSettingsFor } from "../../../../../lib/motionVisual.js";
import { normalizeMotionRenderBehavior } from "../../../../../lib/motionRenderBehavior.js";
import { motionVisualBeatGroups } from "../../../../../lib/motionScenePacing.js";
import { motionBeatLines } from "../../../../../lib/motionBeatLines.js";
import { motionNarratorCastKey } from "../../../../../lib/motionVoice.js";
import { MOTION_STORY_CONFIG } from "../../../../../constants/motionVideo.js";
import { MOTION_AI_ROLE } from "../../../../../constants/motionAiFallback.js";
import { MOTION_AI_RECOVERY } from "../../../../../constants/motionAiRecovery.js";
import { motionRenameText } from "../../../../../lib/motionRename.js";
import { motionHtmlCastCards, motionHtmlContinuity } from "../../../../../lib/motionHtmlCast.js";
import { motionFigureRenderKey } from "../../../../../lib/motionFigures.js";
import { runMotionAi, prepareMotionContentRooms, prepareMotionSceneRooms, extractJson, motionAiRoutes } from "../motionStoryService.js";
import { motionInputKey } from "../motionFileUtils.js";
import { motionTaskCheckpoint } from "../motionTaskCheckpoint.js";
import { MotionPriorityPool } from "../motionPriorityPool.js";
import { openMotionHtmlRuntime, withMotionThumbnailBrowser } from "./sceneRuntime.js";
import { isLowSpecMode } from "../../../../../server/services/chromeBackupService.js";
import { AI_LOAD } from "../../../../../constants/aiLoad.js";
import { motionHtmlStore } from "./sceneStore.js";
import { motionSceneCastPrompt, motionSceneCastSeed, type MotionCastLooks } from "../../../../../lib/motionSceneBlueprint.js";
import type { MotionCatalogGap } from "../../../../../lib/motionObjectCatalog.js";
import { MOTION_SCENE_BLUEPRINT } from "../../../../../constants/motionSceneBlueprint.js";
import { MOTION_SCENE_SPEC, MOTION_SCENE_SPEC_PROMPT } from "../../../../../constants/motionSceneSpec.js";
import { motionSceneSpecCastLearn, motionSceneSpecFallback, motionSceneSpecFix, motionSceneSpecSplit, motionSceneSpecPage, motionSceneSpecPrompt, motionSceneSpecRead } from "../../../../../lib/motionSceneSpec.js";
import { getMotionWorkDirectory } from "../motionLibraryService.js";
import type { RemotionSceneOptions } from "../remotion/scenePipeline.js";
import type { MotionBeat, MotionStoryAnalysis, MotionStoryScript, MotionAiExecution } from "../../../../../types/motionVideo.js";
import type { MotionRemotionScene, MotionRemotionState, MotionVisualSettings } from "../../../../../types/motionVisual.js";
import type { MotionHtmlRequest } from "../../../../../types/motionHtmlScene.js";
import { motionRepairPlanRows } from "../../../../../lib/motionPlanRepair.js";
import { MOTION_HTML_WRITING } from "../../../../../constants/motionHtmlWriting.js";
import { motionMovementOf, motionProportionOf } from "../../../../../lib/motionDrawStyle.js";
import { MOTION_LAYOUT_WIDE } from "../../../../../constants/motionLayouts/index.js";
type HtmlSubmission = Omit<ChatPlanningSubmission, "pending"> & { pending?: Omit<ChatPendingSubmission, "page"> & { page?: ChatPendingSubmission["page"] } };
const htmlSubmissionSnapshot = (submission: HtmlSubmission, refreshUrl = false): NonNullable<MotionHtmlRequest["submission"]> => {
  const snapshot = { attempted: submission.attempted, completed: submission.completed, abandoned: submission.abandoned };
  if (!submission.pending) return snapshot;
  const { page, ...pending } = submission.pending;
  if (refreshUrl && page && !page.isClosed()) {
    const url = page.url();
    if (new URL(url).origin === new URL(pending.url).origin) pending.url = url;
  }
  return { ...snapshot, pending };
};
const htmlSubmission = (attempt: MotionHtmlRequest, resuming: boolean): HtmlSubmission => ({ attempted: false, completed: false, ...(resuming ? attempt.submission : {}) });
const retainCheckpoint = async (write: () => void, opts: Pick<RemotionSceneOptions, "signal" | "log">) => {
  for (;;) {
    try {
      write();
      return;
    } catch (error) {
      opts.signal?.throwIfAborted();
      opts.log(`${RT_MAINTENANCE.CHO_GHI_LAI_DU_LIEU_DA_NHAN_GIU_NGUYEN_PHAN}${String((error as Error).message)}`);
      await delay(2000, undefined, { signal: opts.signal });
    }
  }
};
const normalizePlannedHtmlScenes = (scenes: any[], lines: { key: string; text: string; beatId: string }[], beats: { id: string; sceneTemplateDraft?: string }[], totalSeconds: number, pacing?: string): any[] => {
  if (beats.length > 0 && scenes.length === beats.length && beats.every((beat) => typeof beat.sceneTemplateDraft === "string" && beat.sceneTemplateDraft.trim().length > 0)) return scenes;
  const targetSeconds = pacing === RT_MAINTENANCE.FEW ? 14 : pacing === RT_MAINTENANCE.MANY ? 6 : 9;
  if (totalSeconds < targetSeconds * 1.3 || lines.length <= 1 || !scenes.length) return scenes;
  const totalChars = Math.max(
    1,
    lines.reduce((sum, line) => sum + Math.max(1, line.text.length), 0),
  );
  const lineSeconds = lines.map((line) => (totalSeconds * Math.max(1, line.text.length)) / totalChars);
  const spanSeconds = (start: number, end: number) => lineSeconds.slice(start, end + 1).reduce((sum, value) => sum + value, 0);
  const targetCount = Math.max(1, Math.round(totalSeconds / targetSeconds));
  const minCount = Math.max(1, Math.floor(targetCount * 0.7));
  const maxCount = Math.max(minCount, Math.ceil(targetCount * 1.3));
  let working = scenes.map((row) => ({ ...row }));
  if (working.length < minCount) {
    const beatDrafts = new Map(beats.map((beat) => [beat.id, beat.sceneTemplateDraft]));
    const expanded: any[] = [];
    for (const row of working) {
      const start = lines.findIndex((line) => line.key === row.fromLineId);
      const end = lines.findIndex((line) => line.key === row.toLineId);
      const duration = spanSeconds(start, end);
      if (end > start && duration >= targetSeconds * 1.65) {
        const chunks: { from: number; to: number }[] = [];
        let chunkStart = start;
        let acc = 0;
        for (let idx = start; idx <= end; idx++) {
          acc += lineSeconds[idx];
          const nextBeatChanges = idx < end && lines[idx + 1].beatId !== lines[idx].beatId;
          if (idx < end && ((acc >= targetSeconds * 0.8 && nextBeatChanges) || acc >= targetSeconds * 1.15)) {
            chunks.push({ from: chunkStart, to: idx });
            chunkStart = idx + 1;
            acc = 0;
          }
        }
        if (chunkStart <= end) chunks.push({ from: chunkStart, to: end });
        if (chunks.length > 1) {
          for (const chunk of chunks) {
            const beatId = lines[chunk.from].beatId;
            const draft = beatDrafts.get(beatId);
            expanded.push({ ...row, fromLineId: lines[chunk.from].key, toLineId: lines[chunk.to].key, sceneTemplate: draft && draft.trim() ? draft : row.sceneTemplate });
          }
          continue;
        }
      }
      expanded.push(row);
    }
    working = expanded;
  }
  while (working.length > maxCount && working.length > 1) {
    let bestIndex = -1;
    let bestCombined = Infinity;
    for (let idx = 0; idx < working.length - 1; idx++) {
      const aStart = lines.findIndex((line) => line.key === working[idx].fromLineId);
      const aEnd = lines.findIndex((line) => line.key === working[idx].toLineId);
      const bStart = lines.findIndex((line) => line.key === working[idx + 1].fromLineId);
      const bEnd = lines.findIndex((line) => line.key === working[idx + 1].toLineId);
      const combined = spanSeconds(aStart, bEnd);
      const aSec = spanSeconds(aStart, aEnd);
      const bSec = spanSeconds(bStart, bEnd);
      if ((aSec < targetSeconds * 0.75 || bSec < targetSeconds * 0.75 || combined <= targetSeconds * 1.45) && combined < bestCombined) {
        bestCombined = combined;
        bestIndex = idx;
      }
    }
    if (bestIndex < 0 || bestCombined > targetSeconds * 1.65) break;
    const first = working[bestIndex];
    const second = working[bestIndex + 1];
    const aStart = lines.findIndex((line) => line.key === first.fromLineId);
    const aEnd = lines.findIndex((line) => line.key === first.toLineId);
    const bStart = lines.findIndex((line) => line.key === second.fromLineId);
    const bEnd = lines.findIndex((line) => line.key === second.toLineId);
    const aSec = Math.max(0.1, spanSeconds(aStart, aEnd));
    const bSec = Math.max(0.1, spanSeconds(bStart, bEnd));
    const totalSec = aSec + bSec;
    const firstRatio = aSec / totalSec;
    const mergedEvents = [...(Array.isArray(first.soundEvents) ? first.soundEvents.map((ev: any) => ({ ...ev, at: Number(((Number(ev.at) || 0) * firstRatio).toFixed(3)) })) : []), ...(Array.isArray(second.soundEvents) ? second.soundEvents.map((ev: any) => ({ ...ev, at: Number((firstRatio + (Number(ev.at) || 0) * (1 - firstRatio)).toFixed(3)) })) : [])];
    const merged = { ...first, toLineId: second.toLineId, purpose: [first.purpose, second.purpose].filter(Boolean).join(RT_MAINTENANCE.ASCII_ARROW_SEPARATOR), continuityOut: second.continuityOut || first.continuityOut, devices: [...new Set([...(first.devices || []), ...(second.devices || [])])].slice(0, MOTION_HTML.DEVICES_MAX), soundEvents: mergedEvents };
    working.splice(bestIndex, 2, merged);
  }
  return working;
};
const canResumeHtmlSubmission = (attempt: MotionHtmlRequest, targetExec?: MotionAiExecution): boolean => {
  const sub = attempt.submission;
  if (!sub?.attempted || sub.completed || sub.abandoned || !attempt.worker) return false;
  if (attempt.provider && targetExec?.provider && attempt.provider !== targetExec.provider) return false;
  if (attempt.model && targetExec?.model && attempt.model !== targetExec.model) return false;
  return true;
};
const requestPlan = async (prompt: string, key: string, opts: RemotionSceneOptions, slots: MotionPriorityPool, read: (raw: any) => void, _groupIndex = 0, priority = 0) => {
  const store = motionTaskCheckpoint<MotionHtmlRequest>(opts.scope, RT_MAINTENANCE.HTML_PLAN_SUBMISSION, [key]);
  let attempt = store.read();
  let failures = 0;
  for (;;) {
    opts.signal?.throwIfAborted();
    const dedicatedPlan = !!opts.planExec?.provider;
    const planExec = dedicatedPlan ? opts.planExec : opts.mainExec?.provider ? opts.mainExec : opts.exec?.provider ? opts.exec : opts.mainExec || opts.exec;
    if (!attempt || attempt.status === RT_MAINTENANCE.RETRY_WAIT) attempt = { id: randomUUID(), attempt: (attempt?.attempt || 0) + 1, status: RT_MAINTENANCE.RUNNING };
    const current = attempt;
    const resuming = canResumeHtmlSubmission(current, planExec);
    const submission = htmlSubmission(current, resuming);
    const worker = resuming ? current.worker : undefined;
    if (!resuming) delete current.worker;
    current.provider = planExec?.provider;
    current.model = planExec?.model;
    const persist = () => {
      current.submission = htmlSubmissionSnapshot(submission);
      store.save(current);
    };
    let journal: ReturnType<typeof setInterval> | undefined,
      invalidData = false;
    try {
      persist();
      journal = setInterval(() => {
        try {
          persist();
        } catch (error) {
          opts.log(`${RT_MAINTENANCE.CHO_LUU_YEU_CAU_PHAN_CANH}${String(error)}`);
        }
      }, 2000);
      if (!opts.ai && !dedicatedPlan) await prepareMotionContentRooms(planExec!, opts.signal, opts.log);
      const exec: MotionAiExecution = {
        ...planExec,
        role: dedicatedPlan ? MOTION_AI_ROLE.PLAN : RT_MAINTENANCE.MAIN,
        worker,
        workerAssigned: (assigned) => {
          current.worker = assigned;
        },
        requestId: current.id,
        submission,
        submissionChanged: persist,
        singleResponse: true,
        ...motionAiFallbackPolicy(planExec),
        responseReceived: (raw) => {
          current.raw = raw;
          current.status = RT_MAINTENANCE.RECEIVED;
          submission.completed = true;
          persist();
        },
      };
      let raw: any;
      if (current.raw !== undefined) {
        try {
          raw = extractJson(current.raw);
        } catch (error) {
          invalidData = true;
          throw error;
        }
      } else raw = await slots.run(priority, () => (opts.ai ? opts.ai(prompt, MOTION_HTML.PLAN, exec, opts.signal, opts.log) : runMotionAi(prompt, MOTION_HTML.PLAN, exec, opts.signal, opts.log)), opts.signal);
      current.raw = stringifyJson(raw);
      current.status = RT_MAINTENANCE.RECEIVED;
      submission.completed = true;
      persist();
      try {
        read(raw);
      } catch (error) {
        invalidData = true;
        throw error;
      }
      return raw;
    } catch (error) {
      if (!invalidData && current.raw === undefined && (error as Record<string, unknown> | null)?.[MOTION_AI_RECOVERY.UNCERTAIN_FLAG]) {
        submission.abandoned = true;
        delete current.worker;
        current.status = RT_MAINTENANCE.RETRY_WAIT;
      } else if (invalidData || (submission.completed && current.raw === undefined)) {
        delete current.raw;
        current.status = RT_MAINTENANCE.RETRY_WAIT;
      } else current.status = RT_MAINTENANCE.WAITING_EXTERNAL;
      await retainCheckpoint(persist, opts);
      opts.signal?.throwIfAborted();
      opts.log(`${RT_MAINTENANCE.PHAN_CANH_HTML}${current.status === RT_MAINTENANCE.WAITING_EXTERNAL ? RT_MAINTENANCE.PHUC_HOI_YEU_CAU_DA_GUI : RT_MAINTENANCE.THU_LAI_LOI_DU_LIEU}${RT_MAINTENANCE.OPEN_PAREN_SPACE}${String((error as Error).message)}${RT_MAINTENANCE.SENTENCE_END}`);
      if (failures >= MOTION_SCENE_BLUEPRINT.TRANSPORT_LIMIT) throw new Error(MOTION_SCENE_BLUEPRINT.PLAN_ERROR(failures, String((error as Error).message).slice(0, 160)));
      await delay(MOTION_HTML.RETRY_MS[Math.min(failures++, 4)], undefined, { signal: opts.signal });
    } finally {
      clearInterval(journal);
    }
  }
};
const motionHtmlVarietyNote = (siblings: MotionRemotionScene[], scene: MotionRemotionScene): string | undefined => {
  const index = siblings.findIndex((entry) => entry.id === scene.id);
  const prev = (index > 0 ? siblings[index - 1] : undefined) as { shot?: unknown; setting?: unknown } | undefined;
  const current = scene as { shot?: unknown; setting?: unknown };
  const norm = (value: unknown) => String(value ?? "").trim().toLowerCase();
  return prev && norm(prev.shot) && norm(prev.shot) === norm(current.shot) && norm(prev.setting) === norm(current.setting) ? MOTION_HTML_QUALITY.VARIETY(norm(current.shot), String(current.setting)) : undefined;
};
const reviewMotionHtmlScene = async (scene: MotionRemotionScene, image: string, target: MotionAiExecution | undefined, dir: string, attempt: number, opts: Pick<RemotionSceneOptions, "exec" | "ai" | "signal" | "log">): Promise<string[]> => {
  const match = /^data:([^;]+);base64,(.+)$/.exec(image || "");
  if (!match || !target?.provider) return [];
  // Chat uploads go through the browser file picker, which cannot open Windows paths over 260 characters;
  // the scene store path is already near that limit, so upload from a short work folder and keep a copy beside the scene.
  const work = getMotionWorkDirectory(`${MOTION_HTML_QUALITY.REVIEW_ARTIFACT}-${randomUUID()}`);
  try {
    const name = `${MOTION_HTML_QUALITY.REVIEW_FILE}${attempt}.${match[1].split("/")[1] || "jpg"}`;
    const file = path.join(work, name);
    const buffer = Buffer.from(match[2], "base64");
    fs.writeFileSync(file, buffer);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, name), buffer);
    const template = scene.sceneTemplate || "";
    const pick = (re: RegExp) => template.match(re)?.[1]?.trim() || "";
    const prompt = MOTION_HTML_QUALITY.REVIEW_PROMPT({ narration: scene.text || "", message: scene.message || "", keyVisual: scene.keyVisual || "", required: pick(MOTION_HTML_QUALITY.REQUIRED_LINE), motion: pick(MOTION_HTML_QUALITY.MOTION_LINE), event: pick(MOTION_HTML_QUALITY.EVENT_LINE) });
    const exec: MotionAiExecution = { ...target, role: RT_MAINTENANCE.DRAW, singleResponse: true, ...motionAiFallbackPolicy(target) };
    const images = [{ name: path.basename(file), mimeType: match[1], path: file }];
    const raw = await (opts.ai ? opts.ai(prompt, MOTION_HTML_QUALITY.REVIEW_ARTIFACT, exec, opts.signal, opts.log, images) : runMotionAi(prompt, MOTION_HTML_QUALITY.REVIEW_ARTIFACT, exec, opts.signal, opts.log, images));
    const json = typeof raw === "string" ? extractJson(raw) : raw;
    if (!json || json.ok !== false) return [];
    return (Array.isArray(json.problems) ? json.problems : []).map((item: unknown) => String(item).trim()).filter(Boolean).slice(0, 5);
  } catch (error) {
    opts.signal?.throwIfAborted();
    opts.log(MOTION_HTML_QUALITY.REVIEW_SKIP_LOG(scene.id, String((error as Error)?.message || error).slice(0, 160)));
    return [];
  } finally {
    void fs.promises.rm(work, { recursive: true, force: true }).catch(() => undefined);
  }
};
const htmlSceneRoute = (exec: MotionAiExecution | undefined, missed: number): MotionAiExecution | undefined => {
  if (!exec?.provider || !motionAiFallbackPolicy(exec).allowFallback) return exec;
  const routes = motionAiRoutes({ ...exec, role: RT_MAINTENANCE.DRAW });
  const route = routes[Math.min(Math.floor(missed / MOTION_HTML.SWITCH_AFTER), routes.length - 1)];
  return route.provider === exec.provider ? exec : { ...exec, provider: route.provider, model: route.model, mode: route.mode };
};
export const generateMotionHtmlScene = async (scene: MotionRemotionScene, settings: { width: number; height: number; seconds: number; profile: string; proportion?: string; movement?: string; scope?: string; language?: string; cast?: string; continuity?: string; kind?: string; shot?: string; castLooks?: MotionCastLooks; variety?: string; year?: number }, opts: Pick<RemotionSceneOptions, "exec" | "ai" | "signal" | "log" | "review"> & { pool?: MotionPriorityPool; priority?: number }, save: () => void = () => undefined): Promise<void> => {
  // One request per scene: the AI returns the scene as a spec (what is where, how it changes); code puts right what is not
  // reasonable and the engine draws every scene with the kit in the chosen style, so the drawing style and the layout's
  // camera are applied when the scene is shown and never need a new request.
  const isMap = settings.kind === MOTION_HTML_WRITING.MAP_KIND;
  const render = { profile: settings.profile, proportion: motionProportionOf({ profileId: settings.profile, proportion: settings.proportion }), layout: MOTION_LAYOUT_WIDE, year: settings.year, scene: { shot: settings.shot, kind: settings.kind, sceneTemplate: scene.sceneTemplate } };
  const required = motionHtmlRequired(scene.sceneTemplate);
  const looks = isMap ? undefined : motionSceneCastPrompt(settings.castLooks, required.map((item) => item.id));
  const context = [settings.cast, looks, settings.continuity, settings.variety].filter(Boolean).join(RT_MAINTENANCE.PARAGRAPH_SEPARATOR) || undefined;
  const frame: [number, number] = [settings.width, settings.height];
  let prompt = motionSceneSpecPrompt(scene, { year: settings.year, map: isMap, cast: context, frame, language: settings.language });
  const key = motionInputKey([MOTION_SCENE_SPEC.VERSION, prompt, settings.width, settings.height, settings.language]);
  const store = motionHtmlStore(settings.scope, scene.id, key);
  const saved = store.read();
  if (!scene.htmlRequest && saved) {
    Object.assign(scene, saved);
    save();
  }
  if (scene.html?.status === RT_MAINTENANCE.READY || scene.html?.status === RT_MAINTENANCE.RENDERED) return;
  const persist = () => {
    store.save(scene);
    save();
  };
  const gaps: MotionCatalogGap[] = [];
  const ctx = { year: settings.year, template: scene.sceneTemplate, map: isMap, castLooks: settings.castLooks, header: scene.timeLabel || undefined, gaps };
  // The still of the key moment, captured with the kit in the base style.
  const capture = (html: string) =>
    withMotionThumbnailBrowser(isLowSpecMode() ? AI_LOAD.THUMBNAIL_IDLE_MS : MOTION_HTML.THUMBNAIL_BROWSER_IDLE_MS, async (browser) => {
      const runtime = await openMotionHtmlRuntime(html, opts.signal, true, browser, render);
      try {
        const progress = MOTION_HTML_QUALITY.KEY_PROGRESS;
        const frame = await runtime.render({ time: progress * settings.seconds, progress, frame: Math.round(progress * settings.seconds * 30), fps: 30, duration: settings.seconds, width: settings.width, height: settings.height, mode: RT_MAINTENANCE.PREVIEW, motionEnabled: true, cameraEnabled: true, sceneEffectsEnabled: true, seed: key, speaking: [] });
        return await runtime.still(frame, MOTION_HTML.THUMBNAIL_STILL);
      } finally {
        await runtime.close();
      }
    });
  const finalize = (html: string, image: string, lines: string[], tries: number, fallback: boolean) => {
    const { issues: warnings, notes } = motionSceneSpecSplit(lines);
    scene.html = {
      version: 1,
      html,
      hash: motionInputKey(html),
      prompt,
      file: store.html(tries, html),
      manifest: store.manifest,
      scope: settings.scope,
      language: settings.language,
      seed: key,
      duration: settings.seconds,
      attempts: tries,
      spec: MOTION_SCENE_SPEC.VERSION,
      engine: MOTION_SCENE_SPEC.ENGINE,
      cast: settings.cast,
      continuity: settings.continuity,
      status: RT_MAINTENANCE.READY,
      thumbnail: image,
      render: motionFigureRenderKey(render),
      ...(warnings.length ? { warnings } : {}),
      ...(notes.length ? { notes } : {}),
      ...(gaps.length ? { gaps: [...gaps] } : {}),
      ...(fallback ? { fallback: true } : {}),
    };
    scene.build = { status: RT_MAINTENANCE.ACCEPTED, inputKey: key, review: false, attempts: tries };
    delete scene.htmlRequest;
    motionCompactScene(scene);
    persist();
  };
  // A scene the AI gave no usable spec for: laid out by code from the plan, so one stubborn scene never blocks the video.
  const acceptFallback = async (tries: number): Promise<boolean> => {
    const spec = motionSceneSpecFallback(scene.sceneTemplate, { shot: settings.shot, kind: settings.kind, frame });
    if (!spec) return false;
    try {
      const warnings = [MOTION_SCENE_SPEC.WARN.FALLBACK, ...motionSceneSpecFix(spec, ctx)];
      const html = motionSceneSpecPage(spec);
      finalize(html, await capture(html), warnings, tries, true);
      opts.log(MOTION_SCENE_SPEC.FALLBACK_LOG(scene.id, tries));
      return true;
    } catch (error) {
      opts.signal?.throwIfAborted();
      opts.log(MOTION_HTML_QUALITY.REVIEW_SKIP_LOG(scene.id, String((error as Error)?.message || error).slice(0, 160)));
      return false;
    }
  };
  let failures = 0,
    execFails = 0,
    transportFails = 0,
    localFails = 0,
    missed = 0,
    qualityTries = 0,
    feedback = "",
    kept: MotionRemotionScene["html"],
    routed = opts.exec?.provider;
  for (;;) {
    opts.signal?.throwIfAborted();
    const target = htmlSceneRoute(opts.exec, missed);
    if (target?.provider !== routed) {
      opts.log(MOTION_HTML.SWITCH_LOG(scene.id, String(routed), String(target?.provider)));
      routed = target?.provider;
    }
    const priorPrompt = scene.htmlRequest?.submission?.pending?.prompt;
    const prior = scene.htmlRequest && ((scene.htmlRequest.submission?.attempted && !scene.htmlRequest.submission.completed && !scene.htmlRequest.submission.abandoned) || !priorPrompt || priorPrompt.includes(prompt)) ? scene.htmlRequest : undefined;
    const attempt = prior && (prior.status === RT_MAINTENANCE.RUNNING || prior.status === RT_MAINTENANCE.RECEIVED || prior.status === RT_MAINTENANCE.WAITING_EXTERNAL) ? prior : { id: randomUUID(), attempt: (scene.htmlRequest?.attempt || 0) + 1, status: RT_MAINTENANCE.RUNNING };
    scene.htmlRequest = attempt;
    attempt.status = RT_MAINTENANCE.RUNNING;
    const resuming = canResumeHtmlSubmission(attempt, target);
    const submission = htmlSubmission(attempt, resuming);
    const worker = resuming ? attempt.worker : undefined;
    if (!resuming) delete attempt.worker;
    attempt.provider = target?.provider;
    attempt.model = target?.model;
    opts.log(`${RT_MAINTENANCE.CANH_HTML}${scene.id}${RT_MAINTENANCE.TAO_TRON_CANH_LUOT}${attempt.attempt}${RT_MAINTENANCE.DOT}`);
    let journal: ReturnType<typeof setInterval> | undefined;
    const journalState = () => {
      attempt.submission = htmlSubmissionSnapshot(submission, true);
      persist();
    };
    try {
      persist();
      const received = (raw: string) => {
        attempt.raw = raw;
        attempt.status = RT_MAINTENANCE.RECEIVED;
        submission.completed = true;
        store.raw(attempt.attempt, raw);
        journalState();
      };
      if (!opts.ai) await prepareMotionSceneRooms(target, opts.signal, opts.log);
      const exec: MotionAiExecution = {
        ...target,
        role: RT_MAINTENANCE.DRAW,
        worker,
        workerAssigned: (assigned) => {
          attempt.worker = assigned;
        },
        requestId: attempt.id,
        urgent: attempt.attempt > 1,
        submission,
        submissionChanged: journalState,
        singleResponse: true,
        ...motionAiFallbackPolicy(target),
        responseReceived: received,
      };
      journal = setInterval(() => {
        try {
          journalState();
        } catch (error) {
          opts.log(`${RT_MAINTENANCE.CHO_LUU_CHECKPOINT_CANH}${scene.id}${RT_MAINTENANCE.COLON_SPACE}${String((error as Error).message)}`);
        }
      }, 2000);
      const ask = [prompt, feedback].filter(Boolean).join(RT_MAINTENANCE.PARAGRAPH_SEPARATOR);
      const request = () => (opts.ai ? opts.ai(ask, MOTION_HTML.ARTIFACT, exec, opts.signal, opts.log) : runMotionAi(ask, MOTION_HTML.ARTIFACT, exec, opts.signal, opts.log));
      const answer = attempt.raw !== undefined ? attempt.raw : opts.pool ? await opts.pool.run((opts.priority ?? 1) - (attempt.attempt > 1 ? 0.5 : 0), request, opts.signal) : await request();
      if (attempt.raw === undefined) received(typeof answer === "string" ? answer : stringifyJson(answer));
      else store.raw(attempt.attempt, attempt.raw);
      clearInterval(journal);
      let parsed: unknown;
      try {
        parsed = typeof answer === "string" ? extractJson(answer) : answer;
      } catch {
        parsed = undefined;
      }
      let spec;
      try {
        spec = motionSceneSpecRead(parsed, frame);
      } catch (error) {
        // Not a spec (code could not repair it): one new answer, then the plan's own layout.
        feedback = MOTION_SCENE_SPEC_PROMPT.REDO(String((error as Error).message));
        throw Object.assign(new Error(String((error as Error).message)), { motionHtmlExecution: true });
      }
      gaps.length = 0;
      const warnings = motionSceneSpecFix(spec, ctx);
      const html = motionSceneSpecPage(spec);
      const image = await capture(html);
      if (opts.review && qualityTries < MOTION_HTML_QUALITY.QUALITY_RETRIES) {
        // The AI looks at the picture; a finding asks for one corrected spec, and if that one fails this scene is kept.
        finalize(html, image, warnings, attempt.attempt, false);
        const problems = await reviewMotionHtmlScene(scene, image, target, path.dirname(store.manifest), attempt.attempt, opts);
        if (problems.length) {
          scene.offMessage = problems;
          qualityTries++;
          opts.log(MOTION_HTML_QUALITY.REVIEW_LOG(scene.id, problems));
          feedback = MOTION_SCENE_SPEC_PROMPT.REVIEW(problems);
          kept = scene.html;
          if (settings.castLooks) motionSceneSpecCastLearn(settings.castLooks, spec);
          scene.htmlRequest = { id: randomUUID(), attempt: attempt.attempt + 1, status: RT_MAINTENANCE.RUNNING };
          continue;
        }
        if (settings.castLooks) motionSceneSpecCastLearn(settings.castLooks, spec);
        return;
      }
      finalize(html, image, warnings, attempt.attempt, false);
      if (settings.castLooks) motionSceneSpecCastLearn(settings.castLooks, spec);
      return;
    } catch (error) {
      clearInterval(journal);
      opts.signal?.throwIfAborted();
      attempt.submission = htmlSubmissionSnapshot(submission, true);
      if (!attempt.raw) missed++;
      const reason = String((error as Error).message);
      attempt.error = reason;
      const failed = error as { motionHtmlExecution?: boolean };
      // An answer that came but could not be stored or shown (disk, browser) is kept and used again: no new AI request.
      const keepAnswer = !!attempt.raw && !failed?.motionHtmlExecution;
      if (keepAnswer ? ++localFails >= MOTION_SCENE_BLUEPRINT.TRANSPORT_LIMIT : !attempt.raw && ++transportFails >= MOTION_SCENE_BLUEPRINT.TRANSPORT_LIMIT) throw new Error(MOTION_SCENE_BLUEPRINT.TRANSPORT_ERROR(scene.id, keepAnswer ? localFails : transportFails, reason.slice(0, 160)));
      if (attempt.raw) transportFails = 0;
      // The corrected spec after a review did not come: the reviewed scene stays.
      if (kept && failed?.motionHtmlExecution) {
        scene.html = kept;
        delete scene.htmlRequest;
        persist();
        return;
      }
      if (failed?.motionHtmlExecution && ++execFails >= MOTION_SCENE_BLUEPRINT.EXEC_LIMIT) {
        if (await acceptFallback(attempt.attempt)) return;
        throw new Error(MOTION_SCENE_BLUEPRINT.EXEC_ERROR(scene.id, execFails, reason.slice(0, 160)));
      }
      const abandoned = !attempt.raw && !!(error as Record<string, unknown> | null)?.[MOTION_AI_RECOVERY.UNCERTAIN_FLAG];
      if (abandoned) {
        attempt.submission = { ...attempt.submission, attempted: true, completed: false, abandoned: true };
        delete attempt.worker;
        attempt.status = RT_MAINTENANCE.RETRY_WAIT;
        if (scene.html) scene.html.status = RT_MAINTENANCE.RETRY_WAIT;
        await retainCheckpoint(persist, opts);
        opts.log(MOTION_HTML.ABANDON_LOG(scene.id));
        await delay(MOTION_HTML.RETRY_MS[Math.min(failures++, MOTION_HTML.RETRY_MS.length - 1)], undefined, { signal: opts.signal });
        continue;
      }
      const unknown = !!attempt.submission?.attempted && !attempt.submission.completed && !attempt.submission.abandoned;
      const external = unknown || /quota|captcha|đăng nhập|login|rate.limit|account.*unavailable/i.test(reason);
      attempt.status = keepAnswer ? RT_MAINTENANCE.RECEIVED : external ? RT_MAINTENANCE.WAITING_EXTERNAL : RT_MAINTENANCE.RETRY_WAIT;
      if (scene.html) {
        scene.html.status = RT_MAINTENANCE.RETRY_WAIT;
        scene.html.error = reason;
      }
      if (!keepAnswer && (!external || failed?.motionHtmlExecution)) delete attempt.raw;
      await retainCheckpoint(persist, opts);
      opts.log(`${RT_MAINTENANCE.CANH_HTML}${scene.id}${RT_MAINTENANCE.COLON_SPACE}${external ? RT_MAINTENANCE.CHO_PHUC_HOI_YEU_CAU_PROVIDER : RT_MAINTENANCE.LOI_THUC_THI_SE_TAO_LAI_TOAN_BO}${RT_MAINTENANCE.OPEN_PAREN_SPACE}${reason}${RT_MAINTENANCE.SENTENCE_END}`);
      await delay(keepAnswer ? MOTION_HTML.LOCAL_RETRY_MS * localFails : MOTION_HTML.RETRY_MS[Math.min(failures++, MOTION_HTML.RETRY_MS.length - 1)], undefined, { signal: opts.signal });
    }
  }
};
const planHtmlBeatGroup = async (group: { id: string; beats: MotionBeat[]; seconds: number; lineCount: number }, groupIndex: number, state: MotionRemotionState, analysis: MotionStoryAnalysis, settings: Extract<MotionVisualSettings, { mode: "remotion" }>, language: string, aspect: string, opts: RemotionSceneOptions, slots: MotionPriorityPool, save: () => void, priority = 0, before: string[] = []): Promise<void> => {
  const lines = group.beats.flatMap((beat) => motionBeatLines(beat, motionNarratorCastKey(analysis)));
  const note = (opts.note ?? state.notes?.[group.id]) || undefined;
  const source = motionHtmlPlanSource(group.beats, analysis, settings, note, opts.sfx !== false);
  const key = motionInputKey(source);
  const stored = state.htmlPlanSources?.[group.id];
  if (state.scenes[group.id]?.length && stored !== source && motionHtmlPlanSourceMatches(stored, source)) {
    state.inputKeys[group.id] = key;
    state.htmlPlanSources[group.id] = source;
  }
  if (!state.scenes[group.id]?.length || state.inputKeys[group.id] !== key) {
    const prompt = [
      RT_MAINTENANCE.PROMPT_3,
      analysis.authoringSettings ? motionHtmlVisualDirection(analysis) : [`${RT_MAINTENANCE.STYLE_2}${MOTION_HTML.BASE_STYLE}`, motionHtmlLanguageDirection(language, { plan: true }), MOTION_HTML.TEMPLATE].filter(Boolean).join(RT_MAINTENANCE.NEWLINE),
      motionHtmlPacingDirection(settings, group.seconds),
      opts.sfx === false ? RT_MAINTENANCE.SOUNDEVENTS_SFX_IS_DISABLED : RT_MAINTENANCE.PROMPT_4,
      MOTION_HTML_WRITING.PLAN_LINES,
      MOTION_HTML_WRITING.READABILITY,
      analysis.era ? MOTION_HTML_WRITING.PERIOD(analysis.era) : undefined,
      // The scenes just before these lines, as far as they are planned (groups plan side by side): kept out of the plan's
      // key so a neighbour's replan never replans this group.
      (() => {
        const previous = before.flatMap((id) => state.scenes[id] || []).slice(-MOTION_HTML.PREVIOUS_SCENES);
        return previous.length ? MOTION_HTML_WRITING.PREVIOUS(previous.map(({ setting, shot, kind, message }) => ({ setting, shot, kind, message }))) : undefined;
      })(),
      stringifyJson((() => {
        const context = motionHtmlPlanContext(group.beats, analysis, settings, note, opts.sfx !== false);
        return { ...context, beats: context.beats.map(({ narration: _narration, utterances: _utterances, sceneTemplateDraft: _draft, ...beat }) => beat), lines: lines.map((line, index) => ({ id: MOTION_HTML_WRITING.LINE_ID(index), beat: line.beatId, text: line.text, utterance: line.utterance })) };
      })()),
    ]
      .filter(Boolean)
      .join(RT_MAINTENANCE.NEWLINE);
    const planStore = motionTaskCheckpoint<any>(opts.scope, RT_MAINTENANCE.HTML_PLAN_RESPONSE, [key]);
    const readPlan = (raw: any) => {
      if (!Array.isArray(raw?.scenes) || !raw.scenes.length) throw new Error(RT_MAINTENANCE.KHONG_DOC_DUOC_DANH_SACH_PHAN_CANH_HTML);
      const lineKey = (id: unknown) => {
        const match = MOTION_HTML_WRITING.LINE_ID_PATTERN.exec(String(id ?? "").trim());
        return match ? lines[Number(match[1]) - 1]?.key ?? id : id;
      };
      raw.scenes = raw.scenes.map((row: any) => (row && typeof row === "object" ? { ...row, fromLineId: lineKey(row.fromLineId), toLineId: lineKey(row.toLineId) } : row));
      raw.scenes = motionRepairPlanRows(raw.scenes, lines.map((line) => line.key)).rows;
      if (!raw.scenes.length) throw new Error(RT_MAINTENANCE.KHONG_ANH_XA_DUOC_PHAN_CANH_VAO_CAC_DONG_LOI);
      let cursor = 0;
      for (const row of raw.scenes) {
        const start = lines.findIndex((line) => line.key === row.fromLineId),
          end = lines.findIndex((line) => line.key === row.toLineId);
        if (start !== cursor || end < start || typeof row.sceneTemplate !== "string" || !row.sceneTemplate.trim()) throw new Error(RT_MAINTENANCE.KHONG_ANH_XA_DUOC_PHAN_CANH_VAO_CAC_DONG_LOI);
        cursor = end + 1;
      }
      if (cursor !== lines.length) throw new Error(RT_MAINTENANCE.PHAN_CANH_CHUA_PHU_HET_CAC_DONG_LOI_DAN_DA);
    };
    const raw = planStore.read() || (await requestPlan(prompt, key, opts, slots, readPlan, groupIndex, priority));
    readPlan(raw);
    // The picture fields are plain text: message and keyVisual a sentence each, devices at most DEVICES_MAX short lines.
    const text = (value: unknown) => (typeof value === "string" && value.trim() ? motionRenameText(value.trim(), analysis) : undefined);
    const normalizedScenes = normalizePlannedHtmlScenes(raw.scenes.map((row: any) => ({ ...row, message: text(row.message), keyVisual: text(row.keyVisual), devices: (Array.isArray(row.devices) ? row.devices : []).map(text).filter(Boolean).slice(0, MOTION_HTML.DEVICES_MAX) })), lines, group.beats, group.seconds, settings.pacing).map((row: any) => (typeof row.sceneTemplate === "string" ? { ...row, sceneTemplate: motionRenameText(row.sceneTemplate, analysis) } : row));
    planStore.save({ ...raw, scenes: normalizedScenes });
    const varietyIssues = motionPlanVarietyIssues(
      normalizedScenes,
      normalizedScenes.map((row: any) => lines.slice(Math.max(0, lines.findIndex((line) => line.key === row.fromLineId)), lines.findIndex((line) => line.key === row.toLineId) + 1).map((line) => line.text).join(MOTION_PLAN_VARIETY.SPACE_ONE)),
    );
    if (varietyIssues.length) opts.log?.(MOTION_PLAN_VARIETY.LOG(group.id, varietyIssues));
    const existingById = new Map((state.scenes[group.id] || []).map((scene) => [scene.id, scene]));
    state.scenes[group.id] = normalizedScenes.map((row: any, index: number) => {
      const id = `${group.id}${RT_MAINTENANCE.HTML_2}${index}`;
      const prev = existingById.get(id);
      const start = lines.findIndex((line) => line.key === row.fromLineId),
        end = lines.findIndex((line) => line.key === row.toLineId);
      return {
        ...(prev?.html && prev.sceneTemplate === row.sceneTemplate ? { html: prev.html, htmlRequest: prev.htmlRequest, build: prev.build } : {}),
        ...row,
        id,
        renderer: RT_MAINTENANCE.HTML_CANVAS,
        beatId: group.id,
        nodes: [],
        text: lines
          .slice(start, end + 1)
          .map((line) => line.text)
          .join(RT_MAINTENANCE.SPACE),
        sourceBeatIds: [...new Set(lines.slice(start, end + 1).map((line) => line.beatId))],
        environment: "",
        sourceKey: key,
        aspect,
        drawingNote: opts.note,
      };
    });
    state.inputKeys[group.id] = key;
    state.htmlPlanSources[group.id] = source;
    (state.notes ||= {})[group.id] = note || "";
    save();
  }
};
export const createMotionHtmlSceneStreamer = (initialAnalysis: MotionStoryAnalysis, initialSettings: MotionVisualSettings, language: string, initialRemotion: MotionRemotionState | undefined, opts: RemotionSceneOptions) => {
  if (initialSettings.mode !== RT_MAINTENANCE.REMOTION) throw new Error(RT_MAINTENANCE.CHUA_CHON_CACH_DUNG_CANH_AI);
  const settings = initialSettings;
  const analysis = initialAnalysis.authoringSettings
    ? {
        ...initialAnalysis,
        authoringSettings: {
          ...initialAnalysis.authoringSettings,
          visualProportion: motionProportionOf(settings),
          language,
          picturePacing: settings.pacing || initialAnalysis.authoringSettings.picturePacing,
          targetPictureSeconds: settings.pacing === RT_MAINTENANCE.FEW ? 14 : settings.pacing === RT_MAINTENANCE.MANY ? 6 : settings.pacing === RT_MAINTENANCE.MEDIUM ? 9 : initialAnalysis.authoringSettings.targetPictureSeconds,
        },
      }
    : initialAnalysis;
  const aspect = opts.aspect || RT_MAINTENANCE.VALUE_16_9;
  const state: MotionRemotionState = structuredClone(initialRemotion || { version: 1, settings, assets: {}, scenes: {}, inputKeys: {}, failures: {} });
  if (state.renderer !== RT_MAINTENANCE.HTML_CANVAS) {
    state.scenes = {};
    state.assets = {};
    state.inputKeys = {};
    state.failures = {};
  }
  state.renderer = RT_MAINTENANCE.HTML_CANVAS;
  state.htmlPlanSources ||= {};
  state.htmlSfx = opts.sfx !== false;
  state.settings = settings;
  state.renderBehavior = normalizeMotionRenderBehavior(opts.renderBehavior, undefined);
  state.eraYear = motionAnalysisEraYear(analysis);
  state.groupingRevision = 1001;
  state.pacingRevision = 1;
  const slots = new MotionPriorityPool(MOTION_STORY_CONFIG.WORKER_IDS.length);
  const groupPromises = new Map<string, Promise<void>>();
  const chapterGroupPromises = new Map<string, Promise<void>[]>();
  let latestOnUpdate: ((remotion: MotionRemotionState) => void) | undefined;
  const save = _.throttle(() => {
    if (opts.signal?.aborted) return;
    state.updatedAt = Date.now();
    latestOnUpdate?.(structuredClone(state));
  }, MOTION_HTML.SAVE_THROTTLE_MS);
  const push = (beats: MotionBeat[], chapterDrafts: Record<string, any> | undefined, allChaptersDone = false, onUpdate?: (remotion: MotionRemotionState) => void) => {
    if (onUpdate) latestOnUpdate = onUpdate;
    if (!beats.length || opts.signal?.aborted) return;
    const groups = motionVisualBeatGroups({ beats, language, visualSettings: settings }, 1001, settings.pacing);
    groups.forEach((group, groupIndex) => {
      const chapterId = group.beats[0]?.chapterId;
      const nextGroupSameChapter = groups[groupIndex + 1]?.beats[0]?.chapterId === chapterId;
      const chapterFinished = !chapterDrafts || !chapterDrafts[chapterId];
      const sealed = allChaptersDone || group.beats.length >= 5 || nextGroupSameChapter || chapterFinished;
      if (!sealed) return;
      const groupTaskKey = `${group.id}${RT_MAINTENANCE.COLON}${group.beats.map((beat) => beat.id).join(RT_MAINTENANCE.COMMA)}`;
      if (groupPromises.has(groupTaskKey)) return;
      const groupTask = planHtmlBeatGroup(group, groupIndex, state, analysis, settings, language, aspect, opts, slots, save, groupIndex * 2, groups.slice(Math.max(0, groupIndex - 2), groupIndex).map((g) => g.id));
      groupTask.catch(() => undefined);
      groupPromises.set(groupTaskKey, groupTask);
      if (chapterId) {
        const list = chapterGroupPromises.get(chapterId) || [];
        list.push(groupTask);
        chapterGroupPromises.set(chapterId, list);
      }
    });
  };
  const waitForChapter = async (chapterId: string): Promise<void> => {
    const tasks = chapterGroupPromises.get(chapterId);
    if (tasks?.length) await Promise.all(tasks);
  };
  const finish = async (script: MotionStoryScript, partial?: RemotionSceneOptions["partial"], progress?: RemotionSceneOptions["progress"]): Promise<MotionStoryScript> => {
    push(script.beats, undefined, true);
    await Promise.all([...groupPromises.values()]);
    state.updatedAt = Date.now();
    const mergedScript = { ...script, visualSettings: settings, gen: { ...(script.gen || { cast: {}, locations: {} }), remotion: state } } as MotionStoryScript;
    return await planMotionHtmlScenes(mergedScript, analysis, { ...opts, partial, progress, slots });
  };
  return { push, waitForChapter, finish, getState: () => state };
};
export const planMotionHtmlScenes = async (script: MotionStoryScript, analysis: MotionStoryAnalysis, opts: RemotionSceneOptions & { slots?: MotionPriorityPool }): Promise<MotionStoryScript> => {
  const settings = motionVisualSettingsFor({ analysis, script });
  if (settings.mode !== RT_MAINTENANCE.REMOTION) throw new Error(RT_MAINTENANCE.CHUA_CHON_CACH_DUNG_CANH_AI);
  if (analysis.authoringSettings)
    analysis = {
      ...analysis,
      authoringSettings: {
        ...analysis.authoringSettings,
        visualProportion: motionProportionOf(settings),
        language: script.language,
        picturePacing: settings.pacing || analysis.authoringSettings.picturePacing,
        targetPictureSeconds: settings.pacing === RT_MAINTENANCE.FEW ? 14 : settings.pacing === RT_MAINTENANCE.MANY ? 6 : settings.pacing === RT_MAINTENANCE.MEDIUM ? 9 : analysis.authoringSettings.targetPictureSeconds,
      },
    };
  const aspect = opts.aspect || RT_MAINTENANCE.VALUE_16_9;
  const checkpoint = motionTaskCheckpoint<MotionRemotionState>(opts.scope, MOTION_HTML.PLAN, [MOTION_HTML.VERSION, motionPlanSettings(settings), aspect, script.beats.map(({ id, chapterId, narration, sceneTemplateDraft }) => ({ id, chapterId, narration, sceneTemplateDraft }))]);
  const carried = checkpoint.read();
  const state: MotionRemotionState = structuredClone((carried && (carried.updatedAt || 0) > (script.gen?.remotion?.updatedAt || 0) ? carried : script.gen?.remotion) || carried || { version: 1, settings, assets: {}, scenes: {}, inputKeys: {}, failures: {} });
  if (state.renderer !== RT_MAINTENANCE.HTML_CANVAS) {
    if (Object.keys(state.scenes).length) motionTaskCheckpoint<MotionRemotionState>(opts.scope, RT_MAINTENANCE.LEGACY_BEFORE_HTML, [state.updatedAt, state.settings]).save(state);
    state.scenes = {};
    state.assets = {};
    state.inputKeys = {};
    state.failures = {};
  }
  state.renderer = RT_MAINTENANCE.HTML_CANVAS;
  state.htmlPlanSources ||= {};
  state.htmlSfx = opts.sfx !== false;
  state.settings = settings;
  state.renderBehavior = normalizeMotionRenderBehavior(opts.renderBehavior ?? script.gen?.renderBehavior, script.gen?.characterMotion);
  state.groupingRevision = 1001;
  state.pacingRevision = 1;
  const result = { ...script, visualSettings: settings, gen: { ...(script.gen || { cast: {}, locations: {} }), remotion: state } } as MotionStoryScript;
  const save = _.throttle(() => {
    if (opts.signal?.aborted) return;
    state.updatedAt = Date.now();
    checkpoint.save(state);
    opts.partial?.(structuredClone(result));
  }, MOTION_HTML.SAVE_THROTTLE_MS);
  const groups = motionVisualBeatGroups(result, 1001, settings.pacing);
  const slots = opts.slots || new MotionPriorityPool(MOTION_STORY_CONFIG.WORKER_IDS.length);
  let done = 0;
  await Promise.all(
    groups.map(async (group, groupIndex) => {
      await planHtmlBeatGroup(group, groupIndex, state, analysis, settings, script.language, aspect, opts, slots, save, groupIndex * 2, groups.slice(Math.max(0, groupIndex - 2), groupIndex).map((g) => g.id));
      done++;
      opts.progress?.(done / groups.length, `${RT_MAINTENANCE.DA_CHIA}${done}${RT_MAINTENANCE.SLASH}${groups.length}${RT_MAINTENANCE.NHOM_LOI_DAN_THANH}${Object.values(state.scenes).flat().length}${RT_MAINTENANCE.PHAN_CANH_HTML_2}`);
      save();
    }),
  );
  const active = new Set(groups.map((group) => group.id));
  for (const id of Object.keys(state.scenes))
    if (!active.has(id)) {
      delete state.scenes[id];
      delete state.inputKeys[id];
      delete state.htmlPlanSources[id];
    }
  opts.signal?.throwIfAborted();
  save();
  return result;
};
const activeHtmlBuilders = new Map<string, (nextScript: MotionStoryScript) => boolean>();
export const enqueueMotionHtmlScenes = (scope: string | undefined, script: MotionStoryScript): boolean => {
  if (!scope) return false;
  const enqueue = activeHtmlBuilders.get(scope);
  return enqueue ? enqueue(script) : false;
};
/** A scene action taken while the scenes are still being built: redraw now, or delete (redrawn once the others are done). */
export type MotionHtmlSceneAction = { kind: "redo" | "delete"; ids: string[]; note?: string; reason: string };
const activeHtmlControls = new Map<string, (action: MotionHtmlSceneAction) => number>();
/** Hands the action to the scene builder running for this production; 0 when no builder is running (or no scene matched). */
export const controlMotionHtmlScenes = (scope: string | undefined, action: MotionHtmlSceneAction): number => (scope && activeHtmlControls.get(scope)?.(action)) || 0;
export const buildMotionHtmlScenes = async (script: MotionStoryScript, analysis: MotionStoryAnalysis, opts: RemotionSceneOptions): Promise<MotionStoryScript> => {
  if (!motionHtmlPlanCurrent(script, analysis)) throw new Error(RT_MAINTENANCE.PHAN_CANH_CHUA_DUOC_CHIA_DAY_DU_HOAC_DA_DOI);
  const result = structuredClone(script);
  const state = result.gen!.remotion!;
  const requested = motionVisualSettingsFor({ analysis, script });
  if (stringifyJson(motionPlanSettings(requested)) === stringifyJson(motionPlanSettings(state.settings))) state.settings = requested;
  const settings = state.settings;
  if (settings.mode !== RT_MAINTENANCE.REMOTION) throw new Error(RT_MAINTENANCE.CHUA_CHON_CACH_DUNG_CANH_AI);
  const aspect = opts.aspect || RT_MAINTENANCE.VALUE_16_9;
  const [width, height] = aspect === RT_MAINTENANCE.VALUE_9_16 ? [720, 1280] : aspect === RT_MAINTENANCE.VALUE_1_1 ? [1000, 1000] : aspect === RT_MAINTENANCE.VALUE_4_5 ? [800, 1000] : [1280, 720];
  state.renderBehavior = normalizeMotionRenderBehavior(opts.renderBehavior ?? script.gen?.renderBehavior, script.gen?.characterMotion);
  state.eraYear = motionAnalysisEraYear(analysis);
  const save = _.throttle(() => {
    if (opts.signal?.aborted) return;
    state.updatedAt = Date.now();
    opts.partial?.(structuredClone(result));
  }, MOTION_HTML.SAVE_THROTTLE_MS);
  const slots = new MotionPriorityPool(motionSceneWorkerIds(opts.exec).length);
  const rebuildKey = opts.rebuildKey || randomUUID();
  const startedScenes = new Map<string, Promise<void>>();
  let totalTasks = 0;
  let done = 0;
  const scheduleFrom = (sourceScript: MotionStoryScript) => {
    if (opts.signal?.aborted) return;
    const groups = motionVisualBeatGroups(sourceScript, 1001, settings.pacing);
    motionSceneOnScreen(groups.flatMap((group) => (state.scenes[group.id] || []).map((scene) => ({ scene, beats: group.beats.filter((beat) => !scene.sourceBeatIds?.length || scene.sourceBeatIds.includes(beat.id)) }))), analysis);
    const tasks = groups
      .flatMap((group, groupIndex) => (state.scenes[group.id] || []).map((scene) => ({ group, groupIndex, scene })))
      .filter(({ group, scene }) => (!opts.onlyBeats?.length || group.beats.some((beat) => opts.onlyBeats!.includes(beat.id))) && (!opts.onlyScenes?.length || opts.onlyScenes.includes(scene.id)) && (!opts.onlyLocations?.length || group.beats.some((beat) => opts.onlyLocations!.includes(beat.place || ""))));
    for (const { group, groupIndex, scene } of tasks) {
      const taskKey = `${scene.id}${RT_MAINTENANCE.COLON}${state.inputKeys[group.id] || ""}`;
      if (startedScenes.has(taskKey)) continue;
      totalTasks++;
      const task = (async () => {
        opts.signal?.throwIfAborted();
        if ((opts.onlyScenes?.includes(scene.id) || opts.restart) && scene.htmlRebuildKey !== rebuildKey) {
          const attempt = scene.html?.attempts || 0;
          delete scene.html;
          scene.htmlRequest = { id: randomUUID(), attempt, status: RT_MAINTENANCE.RETRY_WAIT };
          scene.htmlRebuildKey = rebuildKey;
          save();
        }
        // A scene drawn before the figure table is redrawn: only scenes on the figure table follow "Cách dựng".
        if (scene.html && !motionSceneCurrent(scene.html)) {
          delete scene.html;
          delete scene.htmlRequest;
          delete scene.build;
          delete scene.offMessage;
          save();
        }
        if (opts.note !== undefined) scene.drawingNote = opts.note;
        await drawScene(group, scene, groupIndex + 1);
      })();
      task.catch(() => undefined);
      startedScenes.set(taskKey, task);
      sceneTasks.set(scene.id, task);
    }
  };
  const drawScene = async (group: ReturnType<typeof motionVisualBeatGroups>[number], scene: MotionRemotionScene, priority: number) => {
    scene.aspect = aspect;
    const seconds = Math.max(1, (group.seconds * scene.text.length) / Math.max(1, group.beats.map((beat) => beat.narration).join(RT_MAINTENANCE.SPACE).length));
    const sceneBeats = group.beats.filter((beat) => !scene.sourceBeatIds?.length || scene.sourceBeatIds.includes(beat.id));
    const cast = scene.kind === MOTION_HTML_WRITING.MAP_KIND ? undefined : motionHtmlCastCards(analysis, sceneBeats, scene.sceneTemplate || RT_MAINTENANCE.SPACE) || undefined;
    motionSceneCastSeed((state.castLooks ||= {}), analysis.cast);
    await generateMotionHtmlScene(scene, { width, height, seconds, profile: settings.profileId, proportion: motionProportionOf(settings), movement: motionMovementOf(settings), scope: opts.scope, language: result.language, cast, continuity: motionHtmlContinuity(scene.continuityIn) || undefined, castLooks: (state.castLooks ||= {}), kind: scene.kind, shot: scene.shot, year: state.eraYear, variety: motionHtmlVarietyNote(state.scenes[group.id] || [], scene) }, { ...opts, pool: slots, priority }, save);
    delete state.failures[scene.id];
    done++;
    opts.progress?.(done / Math.max(1, totalTasks), `${RT_MAINTENANCE.DA_DUNG}${done}${RT_MAINTENANCE.SLASH}${totalTasks}${RT_MAINTENANCE.PHAN_CANH_HTML_2}`);
    save();
  };
  // A scene the user redraws or deletes mid-run is drawn again at once, ahead of the scenes not started yet (as a failed
  // scene is): a deleted scene loses its drawing now, a redrawn one keeps it until its new draw begins; either waits for a
  // draw already running for that scene, whose result is then replaced.
  const sceneTasks = new Map<string, Promise<void>>();
  let controlRound = 0;
  const control = (action: MotionHtmlSceneAction): number => {
    if (opts.signal?.aborted) return 0;
    const clear = (scene: MotionRemotionScene) => {
      const attempt = Math.max(scene.html?.attempts || 0, scene.htmlRequest?.attempt || 0) + 1;
      delete scene.html;
      delete scene.build;
      delete scene.offMessage;
      delete scene.htmlRebuildKey;
      scene.htmlRequest = { id: randomUUID(), attempt, status: RT_MAINTENANCE.RETRY_WAIT, ...(action.kind === "delete" ? { error: action.reason } : {}) };
      if (action.note !== undefined) scene.drawingNote = action.note;
    };
    let count = 0;
    motionVisualBeatGroups(result, 1001, settings.pacing).forEach((group) =>
      (state.scenes[group.id] || []).forEach((scene) => {
        if (!action.ids.includes(scene.id)) return;
        count++;
        if (action.kind === "delete") clear(scene);
        else if (action.note !== undefined) scene.drawingNote = action.note;
        const before = sceneTasks.get(scene.id) || Promise.resolve();
        totalTasks++;
        const task = (async () => {
          await before.catch(() => undefined);
          opts.signal?.throwIfAborted();
          clear(scene);
          save();
          await drawScene(group, scene, 0);
        })();
        task.catch(() => undefined);
        startedScenes.set(`${scene.id}${RT_MAINTENANCE.COLON}${action.kind}${RT_MAINTENANCE.COLON}${++controlRound}`, task);
        sceneTasks.set(scene.id, task);
      }),
    );
    if (count) save();
    return count;
  };
  const canRegister = !!opts.scope && !opts.onlyBeats?.length && !opts.onlyScenes?.length && !opts.onlyLocations?.length && !opts.restart;
  const boundControl = AsyncResource.bind(control);
  let boundBuilder: ((nextScript: MotionStoryScript) => boolean) | undefined;
  if (canRegister && opts.scope) {
    activeHtmlControls.set(opts.scope, boundControl);
    activeHtmlBuilders.set(
      opts.scope,
      (boundBuilder = AsyncResource.bind((nextScript: MotionStoryScript) => {
        if (opts.signal?.aborted) return false;
        const nextRemotion = nextScript.gen?.remotion;
        if (!nextRemotion || nextRemotion.renderer !== RT_MAINTENANCE.HTML_CANVAS) return false;
        const beatIndex = new Map(result.beats.map((beat, index) => [beat.id, index]));
        for (const beat of nextScript.beats) {
          const index = beatIndex.get(beat.id);
          if (index === undefined) {
            beatIndex.set(beat.id, result.beats.length);
            result.beats.push(structuredClone(beat));
          } else result.beats[index] = structuredClone(beat);
        }
        for (const [groupId, scenes] of Object.entries(nextRemotion.scenes || {})) {
          const replanned = !!state.scenes[groupId]?.length && !!nextRemotion.inputKeys?.[groupId] && state.inputKeys[groupId] !== nextRemotion.inputKeys[groupId];
          if ((!state.scenes[groupId]?.length || replanned) && scenes?.length) {
            state.scenes[groupId] = structuredClone(scenes);
            if (nextRemotion.inputKeys?.[groupId]) state.inputKeys[groupId] = nextRemotion.inputKeys[groupId];
            if (nextRemotion.htmlPlanSources?.[groupId]) (state.htmlPlanSources ||= {})[groupId] = nextRemotion.htmlPlanSources[groupId];
            if (nextRemotion.notes?.[groupId]) (state.notes ||= {})[groupId] = nextRemotion.notes[groupId];
          }
        }
        scheduleFrom(result);
        save();
        return true;
      })),
    );
  }
  try {
    scheduleFrom(result);
    while (startedScenes.size > 0) {
      const current = [...startedScenes.values()];
      await Promise.all(current);
      if (startedScenes.size === current.length) break;
    }
    opts.signal?.throwIfAborted();
    const built = Object.values(state.scenes).flat().filter((scene) => scene.html?.status === RT_MAINTENANCE.READY || scene.html?.status === RT_MAINTENANCE.RENDERED);
    if (built.length) {
      state.scorecard = motionSceneScorecard(built);
      opts.log(MOTION_SCENE_BLUEPRINT.SUMMARY_LOG({ ...state.scorecard, model: [opts.exec?.provider, opts.exec?.model].filter(Boolean).join("/") || "-" }));
      save();
    }
    return result;
  } finally {
    // Only this run's own entries: an earlier run of the same production finishing must not unregister a later one.
    if (canRegister && opts.scope) {
      if (activeHtmlBuilders.get(opts.scope) === boundBuilder) activeHtmlBuilders.delete(opts.scope);
      if (activeHtmlControls.get(opts.scope) === boundControl) activeHtmlControls.delete(opts.scope);
    }
  }
};
