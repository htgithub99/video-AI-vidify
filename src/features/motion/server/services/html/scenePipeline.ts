import { randomUUID } from "node:crypto";
import { setTimeout as delay } from "node:timers/promises";
import { MOTION_HTML, MOTION_HTML_STYLES } from "../../../../../constants/motionHtmlTemplate.js";
import { MOTION_STORY_CONFIG } from "../../../../../constants/motionVideo.js";
import { motionHtmlWritingDirection, motionHtmlPacingDirection, motionHtmlLanguageDirection } from "../../../../../lib/motionHtmlAuthoring.js";
import { motionHtmlSource, motionHtmlPlanContext, motionHtmlPlanSource, motionHtmlPlanCurrent } from "../../../../../lib/motionHtmlScene.js";
import { motionVisualSettingsFor } from "../../../../../lib/motionVisual.js";
import { normalizeMotionRenderBehavior } from "../../../../../lib/motionRenderBehavior.js";
import { motionVisualBeatGroups } from "../../../../../lib/motionScenePacing.js";
import { puppetBeatLines } from "../../../../../lib/motionPuppet.js";
import { motionNarratorCastKey } from "../../../../../lib/motionVoice.js";
import { runMotionAi, prepareMotionSceneRooms, extractJson } from "../motionStoryService.js";
import { motionInputKey } from "../motionFileUtils.js";
import { motionTaskCheckpoint } from "../motionTaskCheckpoint.js";
import { MotionPriorityPool } from "../motionPriorityPool.js";
import { openMotionHtmlRuntime } from "./sceneRuntime.js";
import { motionHtmlStore } from "./sceneStore.js";
import type { RemotionSceneOptions } from "../remotion/scenePipeline.js";
import type { MotionStoryAnalysis, MotionStoryScript, MotionAiExecution } from "../../../../../types/motionVideo.js";
import type { MotionRemotionScene, MotionRemotionState } from "../../../../../types/motionVisual.js";
import type { MotionHtmlRequest } from "../../../../../types/motionHtmlScene.js";

const retainCheckpoint = async (write: () => void, opts: Pick<RemotionSceneOptions, "signal" | "log">) => {
  for (;;) {
    try { write(); return; }
    catch (error) { opts.signal?.throwIfAborted(); opts.log(`Chờ ghi lại dữ liệu đã nhận, giữ nguyên phản hồi AI: ${String((error as Error).message)}`); await delay(2000, undefined, { signal: opts.signal }); }
  }
};

const normalizePlannedHtmlScenes = (scenes: any[], lines: { key: string; text: string; beatId: string }[], beats: { id: string; sceneTemplateDraft?: string }[], totalSeconds: number, pacing?: string): any[] => {
  const targetSeconds = pacing === "few" ? 14 : pacing === "many" ? 6 : 9;
  if (totalSeconds < targetSeconds * 1.3 || lines.length <= 1 || !scenes.length) return scenes;
  const totalChars = Math.max(1, lines.reduce((sum, line) => sum + Math.max(1, line.text.length), 0));
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
            expanded.push({
              ...row,
              fromLineId: lines[chunk.from].key,
              toLineId: lines[chunk.to].key,
              sceneTemplate: draft && draft.trim() ? draft : row.sceneTemplate,
            });
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
    const mergedEvents = [
      ...(Array.isArray(first.soundEvents) ? first.soundEvents.map((ev: any) => ({ ...ev, at: Number(((Number(ev.at) || 0) * firstRatio).toFixed(3)) })) : []),
      ...(Array.isArray(second.soundEvents) ? second.soundEvents.map((ev: any) => ({ ...ev, at: Number((firstRatio + (Number(ev.at) || 0) * (1 - firstRatio)).toFixed(3)) })) : []),
    ];
    const merged = {
      ...first,
      toLineId: second.toLineId,
      purpose: [first.purpose, second.purpose].filter(Boolean).join(" -> "),
      continuityOut: second.continuityOut || first.continuityOut,
      soundEvents: mergedEvents,
    };
    working.splice(bestIndex, 2, merged);
  }
  return working;
};

const requestPlan = async (prompt: string, key: string, opts: RemotionSceneOptions, slots: MotionPriorityPool, read: (raw: any) => void, groupIndex = 0) => {
  const store = motionTaskCheckpoint<MotionHtmlRequest>(opts.scope, "html-plan-submission", [key]);
  let attempt = store.read();
  let failures = 0;
  const worker = MOTION_STORY_CONFIG.SCENE_WORKER_IDS[groupIndex % MOTION_STORY_CONFIG.SCENE_WORKER_IDS.length];
  for (;;) {
    opts.signal?.throwIfAborted();
    if (!attempt || attempt.status === "retry_wait") attempt = { id: randomUUID(), attempt: (attempt?.attempt || 0) + 1, status: "running", worker };
    const current = attempt;
    current.worker ||= worker;
    const submission: any = { attempted: false, completed: false, ...current.submission };
    const persist = () => { const { page: _page, ...pending } = submission.pending || {}; current.submission = { attempted: submission.attempted, completed: submission.completed, abandoned: submission.abandoned, ...(submission.pending ? { pending } : {}) }; store.save(current); };
    let journal: ReturnType<typeof setInterval> | undefined, invalidData = false;
    try {
      persist();
      journal = setInterval(() => { try { persist(); } catch (error) { opts.log(`Chờ lưu yêu cầu phân cảnh: ${String(error)}`); } }, 2000);
      if (!opts.ai) await prepareMotionSceneRooms(opts.mainExec || opts.exec, opts.signal, opts.log);
      const exec: MotionAiExecution = { ...(opts.mainExec || opts.exec), role: "draw", worker: current.worker, requestId: current.id, submission, submissionChanged: persist, singleResponse: true, strictProvider: true, allowFallback: false, responseReceived: (raw) => { current.raw = raw; current.status = "received"; submission.completed = true; persist(); } };
      let raw: any;
      if (current.raw !== undefined) { try { raw = extractJson(current.raw); } catch (error) { invalidData = true; throw error; } }
      else raw = await slots.run(0, () => opts.ai ? opts.ai(prompt, MOTION_HTML.PLAN, exec, opts.signal, opts.log) : runMotionAi(prompt, MOTION_HTML.PLAN, exec, opts.signal, opts.log), opts.signal);
      current.raw = JSON.stringify(raw); current.status = "received"; submission.completed = true; persist();
      try { read(raw); } catch (error) { invalidData = true; throw error; }
      return raw;
    } catch (error) {
      if (invalidData || (submission.completed && current.raw === undefined)) { delete current.raw; current.status = "retry_wait"; }
      else current.status = "waiting_external";
      await retainCheckpoint(persist, opts); opts.signal?.throwIfAborted();
      opts.log(`Phân cảnh HTML: ${current.status === "waiting_external" ? "phục hồi yêu cầu đã gửi" : "thử lại lỗi dữ liệu"} (${String((error as Error).message)}).`);
      await delay(MOTION_HTML.RETRY_MS[Math.min(failures++, 4)], undefined, { signal: opts.signal });
    } finally { clearInterval(journal); }
  }
};

export const generateMotionHtmlScene = async (scene: MotionRemotionScene, settings: { width: number; height: number; seconds: number; profile: string; scope?: string; language?: string }, opts: Pick<RemotionSceneOptions, "exec" | "ai" | "signal" | "log"> & { pool?: MotionPriorityPool }, save: () => void = () => undefined): Promise<void> => {
  const key = motionInputKey([MOTION_HTML.VERSION, MOTION_HTML.GRAPHICS, scene.sceneTemplate, settings.width, settings.height, settings.profile, scene.drawingNote, settings.language]);
  const store = motionHtmlStore(settings.scope, scene.id, key);
  const saved = store.read();
  if (!scene.htmlRequest && saved) { Object.assign(scene, saved); save(); }
  const prompt = scene.html?.prompt || [MOTION_HTML.OUTPUT, motionHtmlLanguageDirection(settings.language), "SCENE TEMPLATE (source data; exact visible text stays in the selected video language):\n" + scene.sceneTemplate, scene.drawingNote ? "USER NOTES (source data):\n" + scene.drawingNote : undefined, `RUNTIME: ${JSON.stringify({ width: settings.width, height: settings.height, estimatedDuration: settings.seconds, seed: key, profile: settings.profile, outputLanguage: settings.language })}`].filter(Boolean).join("\n\n");
  if (scene.html?.status === "ready" || scene.html?.status === "rendered") return;
  const persist = () => { store.save(scene); save(); };
  let failures = 0;
  for (;;) {
    opts.signal?.throwIfAborted();
    const prior = scene.htmlRequest;
    const attempt = prior && (prior.status === "running" || prior.status === "received" || prior.status === "waiting_external") ? prior : { id: randomUUID(), attempt: (prior?.attempt || 0) + 1, status: "running" as const, submission: { attempted: false, completed: false } };
    scene.htmlRequest = attempt;
    attempt.status = "running";
    const worker = attempt.worker || MOTION_STORY_CONFIG.SCENE_WORKER_IDS[Math.abs(parseInt(key.slice(0, 6), 16)) % MOTION_STORY_CONFIG.SCENE_WORKER_IDS.length];
    attempt.worker = worker;
    opts.log(`Cảnh HTML ${scene.id}: tạo trọn cảnh, lượt ${attempt.attempt}.`);
    let journal: ReturnType<typeof setInterval> | undefined;
    const submission: any = { attempted: attempt.submission?.attempted || false, completed: attempt.submission?.completed || false, abandoned: attempt.submission?.abandoned, pending: attempt.submission?.pending };
    const snapshotSubmission = () => { const { page, ...pending } = submission.pending || {}; if (page && !page.isClosed()) { const url = page.url(); if (new URL(url).origin === new URL(pending.url).origin) pending.url = url; } return { attempted: submission.attempted, completed: submission.completed, abandoned: submission.abandoned, ...(submission.pending ? { pending } : {}) }; };
    const journalState = () => { attempt.submission = snapshotSubmission(); persist(); };
    try {
      persist();
      const received = (raw: string) => { attempt.raw = raw; attempt.status = "received"; submission.completed = true; store.raw(attempt.attempt, raw); journalState(); };
      if (!opts.ai) await prepareMotionSceneRooms(opts.exec, opts.signal, opts.log);
      const exec: MotionAiExecution = { ...opts.exec, role: "draw", worker, requestId: attempt.id, submission, submissionChanged: journalState, outputFormat: "html", singleResponse: true, strictProvider: true, allowFallback: false, responseReceived: received };
      journal = setInterval(() => { try { journalState(); } catch (error) { opts.log(`Chờ lưu checkpoint cảnh ${scene.id}: ${String((error as Error).message)}`); } }, 2000);
      const request = () => opts.ai ? opts.ai(prompt, MOTION_HTML.ARTIFACT, exec, opts.signal, opts.log) : runMotionAi(prompt, MOTION_HTML.ARTIFACT, exec, opts.signal, opts.log);
      const raw = attempt.raw ?? (opts.pool ? await opts.pool.run(1, request, opts.signal) : await request());
      if (!attempt.raw) received(typeof raw === "string" ? raw : String(raw));
      clearInterval(journal);
      store.raw(attempt.attempt, attempt.raw!);
      const html = motionHtmlSource(attempt.raw);
      scene.html = { version: 1, html, hash: motionInputKey(html), prompt, file: store.html(attempt.attempt, html), manifest: store.manifest, scope: settings.scope, language: settings.language, seed: key, duration: settings.seconds, attempts: attempt.attempt, status: "received", execution: { ...opts.exec, role: "draw", singleResponse: true, strictProvider: true, allowFallback: false } };
      persist();
      // This is the actual first preview frame, not a frame inspection or a scoring pass.
      const runtime = await openMotionHtmlRuntime(html, opts.signal);
      try {
        const image = await runtime.render({ time: 0, progress: 0, frame: 0, fps: 30, duration: settings.seconds, width: settings.width, height: settings.height, mode: "preview", motionEnabled: true, sceneEffectsEnabled: true, seed: key, speaking: [] });
        scene.html.thumbnail = `data:image/png;base64,${image.toString("base64")}`;
      } finally { await runtime.close(); }
      scene.html.status = "ready";
      delete scene.html.error;
      scene.build = { status: "accepted", inputKey: key, review: false, attempts: attempt.attempt };
      persist();
      return;
    } catch (error) {
      clearInterval(journal);
      opts.signal?.throwIfAborted();
      attempt.submission = snapshotSubmission();
      const reason = String((error as Error).message);
      attempt.error = reason;
      const unknown = !!attempt.submission?.attempted && !attempt.submission.completed && !attempt.submission.abandoned;
      const external = unknown || /quota|captcha|đăng nhập|login|rate.limit|account.*unavailable/i.test(reason);
      attempt.status = external ? "waiting_external" : "retry_wait";
      if (scene.html) { scene.html.status = attempt.raw && !(error as any).motionHtmlExecution ? "received" : "retry_wait"; scene.html.error = reason; }
      if (attempt.raw && !(error as any).motionHtmlExecution) attempt.status = "received";
      else if (!external) { delete attempt.raw; if (scene.html) scene.html.status = "retry_wait"; }
      await retainCheckpoint(persist, opts);
      opts.log(`Cảnh HTML ${scene.id}: ${external ? "chờ phục hồi yêu cầu/provider" : attempt.status === "received" ? "chạy lại phản hồi đã lưu" : "lỗi thực thi, sẽ tạo lại toàn bộ"} (${reason}).`);
      await delay(MOTION_HTML.RETRY_MS[Math.min(failures++, MOTION_HTML.RETRY_MS.length - 1)], undefined, { signal: opts.signal });
    }
  }
};

export const planMotionHtmlScenes = async (script: MotionStoryScript, analysis: MotionStoryAnalysis, opts: RemotionSceneOptions): Promise<MotionStoryScript> => {
  const settings = motionVisualSettingsFor({ analysis, script });
  if (settings.mode !== "remotion") throw new Error("Chưa chọn cách dựng cảnh AI.");
  if (analysis.authoringSettings) analysis = { ...analysis, authoringSettings: { ...analysis.authoringSettings, visualProfile: settings.profileId, language: script.language, picturePacing: settings.pacing || analysis.authoringSettings.picturePacing, targetPictureSeconds: settings.pacing === "few" ? 14 : settings.pacing === "many" ? 6 : settings.pacing === "medium" ? 9 : analysis.authoringSettings.targetPictureSeconds } };
  const aspect = opts.aspect || "16:9";
  const checkpoint = motionTaskCheckpoint<MotionRemotionState>(opts.scope, MOTION_HTML.PLAN, [MOTION_HTML.VERSION, settings, aspect, script.beats.map(({ id, chapterId, narration, sceneTemplateDraft }) => ({ id, chapterId, narration, sceneTemplateDraft }))]);
  const carried = checkpoint.read();
  const state: MotionRemotionState = structuredClone((carried && (carried.updatedAt || 0) > (script.gen?.remotion?.updatedAt || 0) ? carried : script.gen?.remotion) || carried || { version: 1, settings, assets: {}, scenes: {}, inputKeys: {}, failures: {} });
  if (state.renderer !== "html-canvas") {
    if (Object.keys(state.scenes).length) motionTaskCheckpoint<MotionRemotionState>(opts.scope, "legacy-before-html", [state.updatedAt, state.settings]).save(state);
    state.scenes = {}; state.assets = {}; state.inputKeys = {}; state.failures = {};
  }
  state.renderer = "html-canvas";
  state.htmlPlanSources ||= {};
  state.htmlSfx = opts.sfx !== false;
  state.settings = settings;
  state.renderBehavior = normalizeMotionRenderBehavior(opts.renderBehavior ?? script.gen?.renderBehavior, script.gen?.characterMotion);
  state.groupingRevision = 1001;
  state.pacingRevision = 1;
  const result = { ...script, visualSettings: settings, gen: { ...(script.gen || { cast: {}, locations: {} }), remotion: state } } as MotionStoryScript;
  const save = () => { opts.signal?.throwIfAborted(); state.updatedAt = Date.now(); checkpoint.save(state); opts.partial?.(structuredClone(result)); };
  const groups = motionVisualBeatGroups(result, 1001, settings.pacing);
  const slots = new MotionPriorityPool(MOTION_HTML.WORKERS);
  let done = 0;
  await Promise.all(groups.map(async (group, groupIndex) => {
    const lines = group.beats.flatMap((beat) => puppetBeatLines(beat, motionNarratorCastKey(analysis)));
    const note = (opts.note ?? state.notes?.[group.id]) || undefined;
    const source = motionHtmlPlanSource(group.beats, analysis, settings, note, opts.sfx !== false);
    const key = motionInputKey(source);
    if (!state.scenes[group.id]?.length || state.inputKeys[group.id] !== key) {
      const prompt = ["Plan the supplied consecutive speech lines into complete animated Canvas scenes. Return JSON {scenes:[{id,fromLineId,toLineId,purpose,sceneTemplate,continuityIn,continuityOut,soundEvents:[]}]}. sceneTemplate is the fully written sections 0–4 from the supplied template. Cover lines once in order; each scene can cover several beats. Use real supplied line IDs. No nodes, geometry, SVG, frame/rig references or drawing code. Keep identities and source events; exact labels come from the source. Static scenes can remain static.", analysis.authoringSettings ? motionHtmlWritingDirection(analysis) : `STYLE: ${MOTION_HTML_STYLES[settings.profileId]}\n${motionHtmlLanguageDirection(script.language)}\n${MOTION_HTML.TEMPLATE}`, motionHtmlPacingDirection(settings, group.seconds), opts.sfx === false ? "soundEvents=[]; SFX is disabled." : "In the same response supply source-supported soundEvents [{id,kind,layer,at,duration,description,source,actor?}]. at is scene progress 0..1; layer=ambience|action|character|accent; source=visible|offscreen. Optional utterance/edge anchors refer to supplied audio IDs. Coordinate event timing with section 3. No later sound-director call.", JSON.stringify({ ...motionHtmlPlanContext(group.beats, analysis, settings, note, opts.sfx !== false), lines: lines.map((line) => ({ id: line.key, text: line.text, utterance: line.utterance })) })].filter(Boolean).join("\n");
      const planStore = motionTaskCheckpoint<any>(opts.scope, "html-plan-response", [key]);
      const readPlan = (raw: any) => {
        if (!Array.isArray(raw?.scenes) || !raw.scenes.length) throw new Error("Không đọc được danh sách phân cảnh HTML.");
        let cursor = 0;
        for (const row of raw.scenes) {
          const start = lines.findIndex((line) => line.key === row.fromLineId), end = lines.findIndex((line) => line.key === row.toLineId);
          if (start !== cursor || end < start || typeof row.sceneTemplate !== "string" || !row.sceneTemplate.trim()) throw new Error("Không ánh xạ được phân cảnh vào các dòng lời dẫn đã gửi.");
          cursor = end + 1;
        }
        if (cursor !== lines.length) throw new Error("Phân cảnh chưa phủ hết các dòng lời dẫn đã gửi.");
      };
      const raw = planStore.read() || await requestPlan(prompt, key, opts, slots, readPlan, groupIndex);
      readPlan(raw);
      const normalizedScenes = normalizePlannedHtmlScenes(raw.scenes, lines, group.beats, group.seconds, settings.pacing);
      planStore.save({ ...raw, scenes: normalizedScenes });
      state.scenes[group.id] = normalizedScenes.map((row: any, index: number) => {
        const start = lines.findIndex((line) => line.key === row.fromLineId), end = lines.findIndex((line) => line.key === row.toLineId);
        return { ...row, id: `${group.id}:html:${index}`, renderer: "html-canvas", beatId: group.id, nodes: [], text: lines.slice(start, end + 1).map((line) => line.text).join(" "), sourceBeatIds: [...new Set(lines.slice(start, end + 1).map((line) => line.beatId))], environment: "", sourceKey: key, aspect, drawingNote: opts.note };
      });
      state.inputKeys[group.id] = key;
      state.htmlPlanSources[group.id] = source;
      (state.notes ||= {})[group.id] = note || "";
      save();
    }
    done++; opts.progress?.(done / groups.length, `Đã chia ${done}/${groups.length} nhóm lời dẫn thành ${Object.values(state.scenes).flat().length} phân cảnh HTML.`); save();
  }));
  const active = new Set(groups.map((group) => group.id));
  for (const id of Object.keys(state.scenes)) if (!active.has(id)) { delete state.scenes[id]; delete state.inputKeys[id]; delete state.htmlPlanSources[id]; }
  save();
  return result;
};

export const buildMotionHtmlScenes = async (script: MotionStoryScript, analysis: MotionStoryAnalysis, opts: RemotionSceneOptions): Promise<MotionStoryScript> => {
  if (!motionHtmlPlanCurrent(script, analysis)) throw new Error("Phân cảnh chưa được chia đầy đủ hoặc đã đổi nội dung/cấu hình. Hoàn tất bước viết kịch bản và phân cảnh trước khi dựng cảnh.");
  const result = structuredClone(script);
  const state = result.gen!.remotion!;
  const settings = state.settings;
  if (settings.mode !== "remotion") throw new Error("Chưa chọn cách dựng cảnh AI.");
  const aspect = opts.aspect || "16:9";
  const [width, height] = aspect === "9:16" ? [720, 1280] : aspect === "1:1" ? [1000, 1000] : aspect === "4:5" ? [800, 1000] : [1280, 720];
  state.renderBehavior = normalizeMotionRenderBehavior(opts.renderBehavior ?? script.gen?.renderBehavior, script.gen?.characterMotion);
  const save = () => { opts.signal?.throwIfAborted(); state.updatedAt = Date.now(); opts.partial?.(structuredClone(result)); };
  const groups = motionVisualBeatGroups(result, 1001, settings.pacing);
  const tasks = groups.flatMap((group) => (state.scenes[group.id] || []).map((scene) => ({ group, scene }))).filter(({ group, scene }) =>
    (!opts.onlyBeats?.length || group.beats.some((beat) => opts.onlyBeats!.includes(beat.id))) &&
    (!opts.onlyScenes?.length || opts.onlyScenes.includes(scene.id)) &&
    (!opts.onlyLocations?.length || group.beats.some((beat) => opts.onlyLocations!.includes(beat.place || ""))));
  const slots = new MotionPriorityPool(MOTION_HTML.WORKERS);
  const rebuildKey = opts.rebuildKey || randomUUID();
  let done = 0;
  await Promise.all(tasks.map(async ({ group, scene }) => {
    if ((opts.onlyScenes?.includes(scene.id) || opts.restart) && scene.htmlRebuildKey !== rebuildKey) { const attempt = scene.html?.attempts || 0; delete scene.html; scene.htmlRequest = { id: randomUUID(), attempt, status: "retry_wait" }; scene.htmlRebuildKey = rebuildKey; save(); }
    if (opts.note !== undefined) scene.drawingNote = opts.note;
    scene.aspect = aspect;
    const seconds = Math.max(1, group.seconds * scene.text.length / Math.max(1, group.beats.map((beat) => beat.narration).join(" ").length));
    await generateMotionHtmlScene(scene, { width, height, seconds, profile: settings.profileId, scope: opts.scope, language: script.language }, { ...opts, pool: slots }, save);
    delete state.failures[scene.id];
    done++; opts.progress?.(done / Math.max(1, tasks.length), `Đã dựng ${done}/${tasks.length} phân cảnh HTML.`); save();
  }));
  return result;
};
