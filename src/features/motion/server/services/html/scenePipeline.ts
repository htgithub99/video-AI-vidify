import * as RT_MAINTENANCE from "../../../../../constants/runtime/maintenance.js";
import { motionAiFallbackPolicy, motionSceneWorkerIds } from "../../../../../lib/motionAiExecution.js";
import { stringifyJson } from "../../../../../lib/jsonStringify.js";
import type { ChatPendingSubmission, ChatPlanningSubmission } from "../../../../../server/services/chatSubmissionRecovery.js";
import { randomUUID } from "node:crypto";
import { AsyncResource } from "node:async_hooks";
import { setTimeout as delay } from "node:timers/promises";
import { MOTION_HTML, MOTION_HTML_STYLES } from "../../../../../constants/motionHtmlTemplate.js";
import { motionHtmlWritingDirection, motionHtmlPacingDirection, motionHtmlLanguageDirection } from "../../../../../lib/motionHtmlAuthoring.js";
import { motionHtmlSource, motionHtmlPlanContext, motionHtmlPlanSource, motionHtmlPlanCurrent, motionHtmlPlanSourceMatches } from "../../../../../lib/motionHtmlScene.js";
import { motionVisualSettingsFor } from "../../../../../lib/motionVisual.js";
import { normalizeMotionRenderBehavior } from "../../../../../lib/motionRenderBehavior.js";
import { motionVisualBeatGroups } from "../../../../../lib/motionScenePacing.js";
import { puppetBeatLines } from "../../../../../lib/motionPuppet.js";
import { motionNarratorCastKey } from "../../../../../lib/motionVoice.js";
import { MOTION_STORY_CONFIG } from "../../../../../constants/motionVideo.js";
import { MOTION_AI_RECOVERY } from "../../../../../constants/motionAiRecovery.js";
import { motionRenameText } from "../../../../../lib/motionRename.js";
import { motionHtmlCastCards, motionHtmlContinuity } from "../../../../../lib/motionHtmlCast.js";
import { motionHtmlFigureDoc } from "../../../../../lib/motionHtmlFigure.js";
import { runMotionAi, prepareMotionContentRooms, prepareMotionSceneRooms, extractJson, motionAiRoutes } from "../motionStoryService.js";
import { motionInputKey } from "../motionFileUtils.js";
import { motionTaskCheckpoint } from "../motionTaskCheckpoint.js";
import { MotionPriorityPool } from "../motionPriorityPool.js";
import { openMotionHtmlRuntime } from "./sceneRuntime.js";
import { motionHtmlStore } from "./sceneStore.js";
import type { RemotionSceneOptions } from "../remotion/scenePipeline.js";
import type { MotionBeat, MotionStoryAnalysis, MotionStoryScript, MotionAiExecution } from "../../../../../types/motionVideo.js";
import type { MotionRemotionScene, MotionRemotionState, MotionVisualSettings } from "../../../../../types/motionVisual.js";
import type { MotionHtmlRequest } from "../../../../../types/motionHtmlScene.js";
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
    const merged = { ...first, toLineId: second.toLineId, purpose: [first.purpose, second.purpose].filter(Boolean).join(RT_MAINTENANCE.ASCII_ARROW_SEPARATOR), continuityOut: second.continuityOut || first.continuityOut, soundEvents: mergedEvents };
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
    const planExec = opts.mainExec?.provider ? opts.mainExec : opts.exec?.provider ? opts.exec : opts.mainExec || opts.exec;
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
      if (!opts.ai) await prepareMotionContentRooms(planExec, opts.signal, opts.log);
      const exec: MotionAiExecution = {
        ...planExec,
        role: RT_MAINTENANCE.MAIN,
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
      await delay(MOTION_HTML.RETRY_MS[Math.min(failures++, 4)], undefined, { signal: opts.signal });
    } finally {
      clearInterval(journal);
    }
  }
};
const htmlSceneRoute = (exec: MotionAiExecution | undefined, missed: number): MotionAiExecution | undefined => {
  if (!exec?.provider || !motionAiFallbackPolicy(exec).allowFallback) return exec;
  const routes = motionAiRoutes({ ...exec, role: RT_MAINTENANCE.DRAW });
  const route = routes[Math.min(Math.floor(missed / MOTION_HTML.SWITCH_AFTER), routes.length - 1)];
  return route.provider === exec.provider ? exec : { ...exec, provider: route.provider, model: route.model, mode: route.mode };
};
export const generateMotionHtmlScene = async (scene: MotionRemotionScene, settings: { width: number; height: number; seconds: number; profile: string; scope?: string; language?: string; cast?: string; continuity?: string }, opts: Pick<RemotionSceneOptions, "exec" | "ai" | "signal" | "log"> & { pool?: MotionPriorityPool; priority?: number }, save: () => void = () => undefined): Promise<void> => {
  const graphics = MOTION_HTML.PROFILE_GRAPHICS[settings.profile] || MOTION_HTML.GRAPHICS;
  const key = motionInputKey([MOTION_HTML.VERSION, graphics, motionHtmlFigureDoc(settings.profile), scene.sceneTemplate, settings.width, settings.height, settings.profile, scene.drawingNote, settings.language, settings.cast, settings.continuity]);
  const store = motionHtmlStore(settings.scope, scene.id, key);
  const saved = store.read();
  if (!scene.htmlRequest && saved) {
    Object.assign(scene, saved);
    save();
  }
  if (scene.html?.status === RT_MAINTENANCE.READY || scene.html?.status === RT_MAINTENANCE.RENDERED) return;
  const prompt = [
    MOTION_HTML.OUTPUT,
    graphics,
    motionHtmlFigureDoc(settings.profile),
    motionHtmlLanguageDirection(settings.language, { codeOnly: true }),
    settings.cast,
    settings.continuity,
    MOTION_HTML.SCENE_LABEL + scene.sceneTemplate,
    scene.drawingNote ? RT_MAINTENANCE.USER_NOTES_SOURCE_DATA + scene.drawingNote : undefined,
    `${RT_MAINTENANCE.RUNTIME}${stringifyJson({ width: settings.width, height: settings.height, estimatedDuration: Number(settings.seconds.toFixed(1)), profile: settings.profile })}`,
  ]
    .filter(Boolean)
    .join(RT_MAINTENANCE.PARAGRAPH_SEPARATOR);
  const persist = () => {
    store.save(scene);
    save();
  };
  let failures = 0,
    missed = 0,
    routed = opts.exec?.provider;
  for (;;) {
    opts.signal?.throwIfAborted();
    const target = htmlSceneRoute(opts.exec, missed);
    if (target?.provider !== routed) {
      opts.log(MOTION_HTML.SWITCH_LOG(scene.id, String(routed), String(target?.provider)));
      routed = target?.provider;
    }
    const priorPrompt = scene.htmlRequest?.submission?.pending?.prompt;
    const prior = scene.htmlRequest && ((scene.htmlRequest.submission?.attempted && !scene.htmlRequest.submission.completed && !scene.htmlRequest.submission.abandoned) || !priorPrompt || (priorPrompt.startsWith(MOTION_HTML.OUTPUT) && priorPrompt.includes(graphics))) ? scene.htmlRequest : undefined;
    const attempt = prior && (prior.status === RT_MAINTENANCE.RUNNING || prior.status === RT_MAINTENANCE.RECEIVED || prior.status === RT_MAINTENANCE.WAITING_EXTERNAL) ? prior : { id: randomUUID(), attempt: (scene.htmlRequest?.attempt || 0) + 1, status: RT_MAINTENANCE.RUNNING, submission: { attempted: false, completed: false } };
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
        submission,
        submissionChanged: journalState,
        outputFormat: RT_MAINTENANCE.HTML,
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
      const request = () => (opts.ai ? opts.ai(prompt, MOTION_HTML.ARTIFACT, exec, opts.signal, opts.log) : runMotionAi(prompt, MOTION_HTML.ARTIFACT, exec, opts.signal, opts.log));
      const raw = attempt.raw ?? (opts.pool ? await opts.pool.run(opts.priority ?? 1, request, opts.signal) : await request());
      if (!attempt.raw) received(typeof raw === "string" ? raw : String(raw));
      clearInterval(journal);
      store.raw(attempt.attempt, attempt.raw!);
      const html = motionHtmlSource(attempt.raw);
      scene.html = {
        version: 1,
        html,
        hash: motionInputKey(html),
        prompt,
        file: store.html(attempt.attempt, html),
        manifest: store.manifest,
        scope: settings.scope,
        language: settings.language,
        seed: key,
        duration: settings.seconds,
        attempts: attempt.attempt,
        status: RT_MAINTENANCE.RECEIVED,
        execution: { ...target, role: RT_MAINTENANCE.DRAW, singleResponse: true, ...motionAiFallbackPolicy(target) },
      };
      persist();
      const runtime = await openMotionHtmlRuntime(html, opts.signal);
      try {
        const image = await runtime.render({ time: 0, progress: 0, frame: 0, fps: 30, duration: settings.seconds, width: settings.width, height: settings.height, mode: RT_MAINTENANCE.PREVIEW, motionEnabled: true, sceneEffectsEnabled: true, seed: key, speaking: [] });
        scene.html.thumbnail = `${RT_MAINTENANCE.DATA_IMAGE_PNG_BASE64}${image.toString(RT_MAINTENANCE.BASE64)}`;
      } finally {
        await runtime.close();
      }
      scene.html.status = RT_MAINTENANCE.READY;
      delete scene.html.error;
      scene.build = { status: RT_MAINTENANCE.ACCEPTED, inputKey: key, review: false, attempts: attempt.attempt };
      persist();
      return;
    } catch (error) {
      clearInterval(journal);
      opts.signal?.throwIfAborted();
      attempt.submission = htmlSubmissionSnapshot(submission, true);
      if (!attempt.raw) missed++;
      const reason = String((error as Error).message);
      attempt.error = reason;
      const abandoned = !attempt.raw && !!(error as Record<string, unknown> | null)?.[MOTION_AI_RECOVERY.UNCERTAIN_FLAG];
      if (abandoned) {
        attempt.submission = { ...attempt.submission, attempted: true, completed: false, abandoned: true };
        delete attempt.worker;
        attempt.status = RT_MAINTENANCE.RETRY_WAIT;
        if (scene.html) scene.html.status = RT_MAINTENANCE.RETRY_WAIT;
        await retainCheckpoint(persist, opts);
        opts.log(MOTION_HTML.ABANDON_LOG(scene.id));
        await delay(MOTION_HTML.RETRY_MS[0], undefined, { signal: opts.signal });
        continue;
      }
      const unknown = !!attempt.submission?.attempted && !attempt.submission.completed && !attempt.submission.abandoned;
      const external = unknown || /quota|captcha|đăng nhập|login|rate.limit|account.*unavailable/i.test(reason);
      attempt.status = external ? RT_MAINTENANCE.WAITING_EXTERNAL : RT_MAINTENANCE.RETRY_WAIT;
      if (scene.html) {
        scene.html.status = attempt.raw && !(error as any).motionHtmlExecution ? RT_MAINTENANCE.RECEIVED : RT_MAINTENANCE.RETRY_WAIT;
        scene.html.error = reason;
      }
      if (attempt.raw && !(error as any).motionHtmlExecution) attempt.status = RT_MAINTENANCE.RECEIVED;
      else if (!external) {
        delete attempt.raw;
        if (scene.html) scene.html.status = RT_MAINTENANCE.RETRY_WAIT;
      }
      await retainCheckpoint(persist, opts);
      opts.log(`${RT_MAINTENANCE.CANH_HTML}${scene.id}${RT_MAINTENANCE.COLON_SPACE}${external ? RT_MAINTENANCE.CHO_PHUC_HOI_YEU_CAU_PROVIDER : attempt.status === RT_MAINTENANCE.RECEIVED ? RT_MAINTENANCE.CHAY_LAI_PHAN_HOI_DA_LUU : RT_MAINTENANCE.LOI_THUC_THI_SE_TAO_LAI_TOAN_BO}${RT_MAINTENANCE.OPEN_PAREN_SPACE}${reason}${RT_MAINTENANCE.SENTENCE_END}`);
      await delay(MOTION_HTML.RETRY_MS[Math.min(failures++, MOTION_HTML.RETRY_MS.length - 1)], undefined, { signal: opts.signal });
    }
  }
};
const planHtmlBeatGroup = async (group: { id: string; beats: MotionBeat[]; seconds: number; lineCount: number }, groupIndex: number, state: MotionRemotionState, analysis: MotionStoryAnalysis, settings: Extract<MotionVisualSettings, { mode: "remotion" }>, language: string, aspect: string, opts: RemotionSceneOptions, slots: MotionPriorityPool, save: () => void, priority = 0): Promise<void> => {
  const lines = group.beats.flatMap((beat) => puppetBeatLines(beat, motionNarratorCastKey(analysis)));
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
      analysis.authoringSettings ? motionHtmlWritingDirection(analysis) : `${RT_MAINTENANCE.STYLE_2}${MOTION_HTML_STYLES[settings.profileId]}${RT_MAINTENANCE.NEWLINE}${motionHtmlLanguageDirection(language)}${RT_MAINTENANCE.NEWLINE}${MOTION_HTML.TEMPLATE}`,
      motionHtmlPacingDirection(settings, group.seconds),
      opts.sfx === false ? RT_MAINTENANCE.SOUNDEVENTS_SFX_IS_DISABLED : RT_MAINTENANCE.PROMPT_4,
      stringifyJson({ ...motionHtmlPlanContext(group.beats, analysis, settings, note, opts.sfx !== false), lines: lines.map((line) => ({ id: line.key, text: line.text, utterance: line.utterance })) }),
    ]
      .filter(Boolean)
      .join(RT_MAINTENANCE.NEWLINE);
    const planStore = motionTaskCheckpoint<any>(opts.scope, RT_MAINTENANCE.HTML_PLAN_RESPONSE, [key]);
    const readPlan = (raw: any) => {
      if (!Array.isArray(raw?.scenes) || !raw.scenes.length) throw new Error(RT_MAINTENANCE.KHONG_DOC_DUOC_DANH_SACH_PHAN_CANH_HTML);
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
    const normalizedScenes = normalizePlannedHtmlScenes(raw.scenes, lines, group.beats, group.seconds, settings.pacing).map((row: any) => (typeof row.sceneTemplate === "string" ? { ...row, sceneTemplate: motionRenameText(row.sceneTemplate, analysis) } : row));
    planStore.save({ ...raw, scenes: normalizedScenes });
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
          visualProfile: settings.profileId,
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
  state.groupingRevision = 1001;
  state.pacingRevision = 1;
  const slots = new MotionPriorityPool(MOTION_STORY_CONFIG.WORKER_IDS.length);
  const groupPromises = new Map<string, Promise<void>>();
  const chapterGroupPromises = new Map<string, Promise<void>[]>();
  let latestOnUpdate: ((remotion: MotionRemotionState) => void) | undefined;
  const save = () => {
    if (opts.signal?.aborted) return;
    state.updatedAt = Date.now();
    latestOnUpdate?.(structuredClone(state));
  };
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
      const groupTask = planHtmlBeatGroup(group, groupIndex, state, analysis, settings, language, aspect, opts, slots, save, groupIndex * 2);
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
        visualProfile: settings.profileId,
        language: script.language,
        picturePacing: settings.pacing || analysis.authoringSettings.picturePacing,
        targetPictureSeconds: settings.pacing === RT_MAINTENANCE.FEW ? 14 : settings.pacing === RT_MAINTENANCE.MANY ? 6 : settings.pacing === RT_MAINTENANCE.MEDIUM ? 9 : analysis.authoringSettings.targetPictureSeconds,
      },
    };
  const aspect = opts.aspect || RT_MAINTENANCE.VALUE_16_9;
  const checkpoint = motionTaskCheckpoint<MotionRemotionState>(opts.scope, MOTION_HTML.PLAN, [MOTION_HTML.VERSION, settings, aspect, script.beats.map(({ id, chapterId, narration, sceneTemplateDraft }) => ({ id, chapterId, narration, sceneTemplateDraft }))]);
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
  const save = () => {
    if (opts.signal?.aborted) return;
    state.updatedAt = Date.now();
    checkpoint.save(state);
    opts.partial?.(structuredClone(result));
  };
  const groups = motionVisualBeatGroups(result, 1001, settings.pacing);
  const slots = opts.slots || new MotionPriorityPool(MOTION_STORY_CONFIG.WORKER_IDS.length);
  let done = 0;
  await Promise.all(
    groups.map(async (group, groupIndex) => {
      await planHtmlBeatGroup(group, groupIndex, state, analysis, settings, script.language, aspect, opts, slots, save, groupIndex * 2);
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
export const buildMotionHtmlScenes = async (script: MotionStoryScript, analysis: MotionStoryAnalysis, opts: RemotionSceneOptions): Promise<MotionStoryScript> => {
  if (!motionHtmlPlanCurrent(script, analysis)) throw new Error(RT_MAINTENANCE.PHAN_CANH_CHUA_DUOC_CHIA_DAY_DU_HOAC_DA_DOI);
  const result = structuredClone(script);
  const state = result.gen!.remotion!;
  const settings = state.settings;
  if (settings.mode !== RT_MAINTENANCE.REMOTION) throw new Error(RT_MAINTENANCE.CHUA_CHON_CACH_DUNG_CANH_AI);
  const aspect = opts.aspect || RT_MAINTENANCE.VALUE_16_9;
  const [width, height] = aspect === RT_MAINTENANCE.VALUE_9_16 ? [720, 1280] : aspect === RT_MAINTENANCE.VALUE_1_1 ? [1000, 1000] : aspect === RT_MAINTENANCE.VALUE_4_5 ? [800, 1000] : [1280, 720];
  state.renderBehavior = normalizeMotionRenderBehavior(opts.renderBehavior ?? script.gen?.renderBehavior, script.gen?.characterMotion);
  const save = () => {
    if (opts.signal?.aborted) return;
    state.updatedAt = Date.now();
    opts.partial?.(structuredClone(result));
  };
  const slots = new MotionPriorityPool(motionSceneWorkerIds(opts.exec).length);
  const rebuildKey = opts.rebuildKey || randomUUID();
  const startedScenes = new Map<string, Promise<void>>();
  let totalTasks = 0;
  let done = 0;
  const scheduleFrom = (sourceScript: MotionStoryScript) => {
    if (opts.signal?.aborted) return;
    const groups = motionVisualBeatGroups(sourceScript, 1001, settings.pacing);
    const tasks = groups
      .flatMap((group, groupIndex) => (state.scenes[group.id] || []).map((scene) => ({ group, groupIndex, scene })))
      .filter(({ group, scene }) => (!opts.onlyBeats?.length || group.beats.some((beat) => opts.onlyBeats!.includes(beat.id))) && (!opts.onlyScenes?.length || opts.onlyScenes.includes(scene.id)) && (!opts.onlyLocations?.length || group.beats.some((beat) => opts.onlyLocations!.includes(beat.place || ""))));
    for (const { group, groupIndex, scene } of tasks) {
      if (startedScenes.has(scene.id)) continue;
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
        if (opts.note !== undefined) scene.drawingNote = opts.note;
        scene.aspect = aspect;
        const seconds = Math.max(1, (group.seconds * scene.text.length) / Math.max(1, group.beats.map((beat) => beat.narration).join(RT_MAINTENANCE.SPACE).length));
        const sceneBeats = group.beats.filter((beat) => !scene.sourceBeatIds?.length || scene.sourceBeatIds.includes(beat.id));
        const cast = motionHtmlCastCards(analysis, sceneBeats, scene.sceneTemplate || RT_MAINTENANCE.SPACE) || undefined;
        await generateMotionHtmlScene(scene, { width, height, seconds, profile: settings.profileId, scope: opts.scope, language: result.language, cast, continuity: motionHtmlContinuity(scene.continuityIn) || undefined }, { ...opts, pool: slots, priority: groupIndex + 1 }, save);
        delete state.failures[scene.id];
        done++;
        opts.progress?.(done / Math.max(1, totalTasks), `${RT_MAINTENANCE.DA_DUNG}${done}${RT_MAINTENANCE.SLASH}${totalTasks}${RT_MAINTENANCE.PHAN_CANH_HTML_2}`);
        save();
      })();
      task.catch(() => undefined);
      startedScenes.set(scene.id, task);
    }
  };
  const canRegister = !!opts.scope && !opts.onlyBeats?.length && !opts.onlyScenes?.length && !opts.onlyLocations?.length && !opts.restart;
  if (canRegister && opts.scope) {
    activeHtmlBuilders.set(
      opts.scope,
      AsyncResource.bind((nextScript: MotionStoryScript) => {
        if (opts.signal?.aborted) return false;
        const nextRemotion = nextScript.gen?.remotion;
        if (!nextRemotion || nextRemotion.renderer !== RT_MAINTENANCE.HTML_CANVAS) return false;
        const existingIds = new Set(result.beats.map((beat) => beat.id));
        for (const beat of nextScript.beats) {
          if (!existingIds.has(beat.id)) {
            result.beats.push(structuredClone(beat));
            existingIds.add(beat.id);
          }
        }
        for (const [groupId, scenes] of Object.entries(nextRemotion.scenes || {})) {
          if (!state.scenes[groupId]?.length && scenes?.length) {
            state.scenes[groupId] = structuredClone(scenes);
            if (nextRemotion.inputKeys?.[groupId]) state.inputKeys[groupId] = nextRemotion.inputKeys[groupId];
            if (nextRemotion.htmlPlanSources?.[groupId]) (state.htmlPlanSources ||= {})[groupId] = nextRemotion.htmlPlanSources[groupId];
            if (nextRemotion.notes?.[groupId]) (state.notes ||= {})[groupId] = nextRemotion.notes[groupId];
          }
        }
        scheduleFrom(result);
        save();
        return true;
      }),
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
    return result;
  } finally {
    if (canRegister && opts.scope) activeHtmlBuilders.delete(opts.scope);
  }
};
