import * as COMMON_RUNTIME from "../../../../../constants/sourceText.js";
import { RUNTIME_VALUES } from "../../../../../constants/runtime/values.js";
import { RUNTIME_TEXT as RT_SHARED } from "../../../../../constants/runtime/shared.js";
import { RUNTIME_TEXT as RT_SERVER } from "../../../../../constants/runtime/server.js";
import { stringifyJson } from "../../../../../lib/jsonStringify.js";
import fs from "node:fs";
import path from "node:path";
import { MOTION_VISUAL as V } from "../../../../../constants/motionVisual.js";
import { MOTION_REMOTION_LAYOUT as L } from "../../../../../constants/motionRemotionLayout.js";
import { MOTION_REMOTION_PROMPTS as P, MOTION_REMOTION_SCHEMAS } from "../../../../../constants/motionRemotionPrompts.js";
import { MOTION_SCENE_COMPOSITION as C } from "../../../../../constants/motionSceneComposition.js";
import { MOTION_QA as Q } from "../../../../../constants/motionQa.js";
import { motionVisualCheckBlocks } from "../../../../../lib/motionQa.js";
import { motionIllustrationDirection, motionCompositionReference } from "../../../../../lib/motionIllustrationProfile.js";
import { MOTION_ILLUSTRATION_PROFILES, MOTION_ILLUSTRATION_COMMON } from "../../../../../constants/motionIllustrationProfiles.js";
import { MOTION_PRODUCTION } from "../../../../../constants/motionProduction.js";
import { MOTION_AI_ROLE } from "../../../../../constants/motionAiFallback.js";
import { motionVisualSettingsFor } from "../../../../../lib/motionVisual.js";
import { normalizeMotionRenderBehavior } from "../../../../../lib/motionRenderBehavior.js";
import { compositionActorMotion, compositionAttachedMotion, compositionMissingNodes, compositionRepairDraft } from "../../../../../lib/motionHorrorComposition.js";
import { normalizeFirstSceneComposition, failedSceneComposition, mergeSceneCompositionDraft, motionCompositionMissingChannels } from "../../../../../lib/motionSceneComposition.js";
import { repairMotionSvgMarkup } from "../../../../../lib/motionVectorAsset.js";
import { createCompositionGeometryInspector } from "./compositionGeometryInspector.js";
import { remotionSceneReadiness } from "../../../../../lib/motionRemotion.js";
import { puppetBeatLines } from "../../../../../lib/motionPuppet.js";
import { motionNarratorCastKey } from "../../../../../lib/motionVoice.js";
import { motionCastIdentity, motionSceneStaging } from "../../../../../lib/motionCastIdentity.js";
import { motionIdentityReferences, motionPlaceReference } from "../../../../../lib/motionIdentityReference.js";
import { motionStoryEventLedger } from "../../../../../lib/motionStoryContinuity.js";
import { runMotionAi, motionAiRoutes, mapMotionAiPool, prepareMotionSceneRooms, writeMotionAiDebug, motionCaptchaError } from "../motionStoryService.js";
import { recoverMotionAiContractState, requestMotionAiContract, type MotionAiResponseContract } from "../motionAiContractService.js";
import { isTerminalMotionAiError } from "../../../../../server/services/chatSubmissionRecovery.js";
import { motionInputKey } from "../motionFileUtils.js";
import { motionTaskCheckpoint } from "../motionTaskCheckpoint.js";
import { emptyGen } from "../puppet/genState.js";
import { mergeRemotionSceneDraft, remotionScenesFromDraft } from "./sceneContract.js";
import { remotionBeatKey, remotionGroupKey, remotionGroupPlanCurrent, remotionCompositionKey, remotionPlanGroups } from "./sceneKeys.js";
import { motionScenePacingRule, motionScenePacing, motionScenePacingCount } from "../../../../../lib/motionScenePacing.js";
import { MOTION_SCENE_PACING as PACING } from "../../../../../constants/motionScenePacing.js";
import { renderRemotionStill } from "../motionRemotionRenderService.js";
import { getMotionWorkDirectory } from "../motionLibraryService.js";
import { directMotionSound } from "../motionSoundDirectionService.js";
import { MOTION_SOUND_CONFIG } from "../../../../../constants/motionSound.js";
import { MOTION_STORY_CONFIG } from "../../../../../constants/motionVideo.js";
import { MotionAiWorkerPool } from "../motionAiWorkerPool.js";
import type { MotionAiExecution, MotionAiLog, MotionStoryAnalysis, MotionStoryScript } from "../../../../../types/motionVideo.js";
import type { MotionAiContractState } from "../../../../../types/motionAiContract.js";
import type { MotionRemotionState, MotionRenderBehavior } from "../../../../../types/motionVisual.js";
export interface RemotionSceneOptions {
  exec: MotionAiExecution;
  mainExec?: MotionAiExecution;
  signal?: AbortSignal;
  log: MotionAiLog;
  progress?: (value: number, stage: string) => void;
  partial?: (script: MotionStoryScript) => void;
  scope?: string;
  aspect?: string;
  renderBehavior?: MotionRenderBehavior;
  review?: boolean;
  sfx?: boolean;
  restart?: boolean;
  onlyBeats?: string[];
  onlyScenes?: string[];
  onlyLocations?: string[];
  note?: string;
  ai?: typeof runMotionAi;
  still?: typeof renderRemotionStill;
  geometry?: { check: ReturnType<typeof createCompositionGeometryInspector>["check"]; close?: () => Promise<void> };
}
export const buildRemotionScenes = async (script: MotionStoryScript, analysis: MotionStoryAnalysis, opts: RemotionSceneOptions): Promise<MotionStoryScript> => {
  const settings = motionVisualSettingsFor({ analysis, script });
  if (settings.mode !== RT_SHARED.REMOTION) throw new Error(V.INVALID);
  const geometry = opts.geometry || createCompositionGeometryInspector(opts.signal);
  try {
    const profileRevision = V.PROFILES[settings.profileId].revision;
    const aspect = opts.aspect || RT_SHARED.VALUE_16_9;
    const [width, height] = aspect === RT_SERVER.VALUE_9_16 ? [720, 1280] : aspect === RT_SERVER.VALUE_1_1 ? [1000, 1000] : aspect === RT_SERVER.VALUE_4_5 ? [800, 1000] : [1280, 720];
    type Checkpoint = { state: MotionRemotionState; requests: Record<string, MotionAiContractState>; compositions?: Record<string, unknown> };
    const checkpoint = motionTaskCheckpoint<Checkpoint>(opts.scope, V.PROJECT_FOLDER, [PACING.REVISION, C.REVISION, profileRevision, settings, aspect]);
    const saved = opts.restart ? undefined : checkpoint.read() || motionTaskCheckpoint<Checkpoint>(opts.scope, V.PROJECT_FOLDER, [PACING.REVISION, C.REVISION, profileRevision, settings, analysis.cast, analysis.places, script.beats, aspect, opts.note]).read();
    const incoming = script.gen?.remotion;
    const carried = incoming && (!saved?.state || (incoming.updatedAt || 0) > (saved.state.updatedAt || 0)) ? incoming : saved?.state || incoming;
    const state: MotionRemotionState = !opts.restart && carried?.version === V.VERSION && stringifyJson(carried.settings) === stringifyJson(settings) ? structuredClone(carried) : { version: V.VERSION, settings, assets: {}, scenes: {}, inputKeys: {}, failures: {} };
    const requests = opts.restart ? {} : saved?.requests || {};
    const compositions: Record<string, unknown> = opts.restart ? {} : saved?.compositions || {};
    for (const key of Object.keys(requests)) requests[key] = recoverMotionAiContractState(requests[key], `${V.RECOVERY_REVISION}${RT_SHARED.SYMBOL_E7AC07}${C.REVISION}${RT_SHARED.SYMBOL_E7AC07}${profileRevision}`);
    state.notes ||= {};
    state.drafts ||= {};
    if (state.planRecoveryRevision !== P.PLAN_RECOVERY_REVISION) {
      state.drafts = {};
      for (const key of Object.keys(requests)) if (key.startsWith(RT_SERVER.PLAN)) delete requests[key];
      state.planRecoveryRevision = P.PLAN_RECOVERY_REVISION;
    }
    state.renderBehavior = normalizeMotionRenderBehavior(opts.renderBehavior ?? script.gen?.renderBehavior, script.gen?.characterMotion);
    const result: MotionStoryScript = { ...script, visualSettings: settings, gen: { ...(script.gen || emptyGen()), renderBehavior: state.renderBehavior, puppet: undefined, remotion: state, failed: [] } };
    const save = () => {
      opts.signal?.throwIfAborted();
      state.updatedAt = Math.max(Date.now(), (state.updatedAt || 0) + 1);
      result.gen!.failed = [
        ...new Set([
          ...Object.keys(state.failures),
          ...Object.values(state.scenes)
            .flat()
            .filter((scene) => scene.build?.status === COMMON_RUNTIME.SOURCE_TEXT_FAILED)
            .map((scene) => scene.id),
        ]),
      ];
      checkpoint.save({ state, requests, compositions });
      opts.partial?.(structuredClone(result));
    };
    const ask = async (key: string, artifact: string, prompt: string, assess: MotionAiResponseContract["assess"], images?: Parameters<typeof runMotionAi>[5], context?: unknown, budget?: { remaining: number }) => {
      const drawing = artifact === C.ARTIFACT;
      const single = drawing && !opts.review;
      const selectedExec = drawing ? opts.exec : opts.mainExec || opts.exec;
      if (drawing && !opts.ai) await prepareMotionSceneRooms(selectedExec, opts.signal, opts.log);
      const exec = { ...selectedExec, role: drawing ? MOTION_AI_ROLE.DRAW : MOTION_AI_ROLE.MAIN, ...(single ? { singleResponse: true, ...(selectedExec.allowFallback === true ? {} : { strictProvider: true }) } : {}) };
      if (single) requests[key] = { rejected: 0, errors: [] };
      const contract: MotionAiResponseContract = {
        schema: MOTION_REMOTION_SCHEMAS[artifact],
        attempts: single ? C.GUARD.ATTEMPTS : exec.strictProvider ? V.REQUEST_BUDGET : V.REQUEST_ATTEMPTS,
        routeAttempts: single ? C.GUARD.ATTEMPTS : exec.strictProvider ? V.REQUEST_BUDGET : V.REQUEST_ATTEMPTS,
        budget: single ? C.GUARD.ATTEMPTS * motionAiRoutes(exec).length : V.REQUEST_BUDGET,
        state: (requests[key] ||= { rejected: 0, errors: [] }),
        checkpoint: (value) => {
          requests[key] = value;
          save();
        },
        assess,
        beforeAttempt: budget
          ? () => {
              if (budget.remaining <= 0) throw Object.assign(new Error(C.REVIEW_LIMIT), { [MOTION_PRODUCTION.CONTRACT_EXHAUSTED]: true });
              budget.remaining--;
            }
          : undefined,
        start: !single && artifact === C.ARTIFACT && compositions[key] && requests[key]?.errors.length ? () => C.REPAIR(context, compositions[key], requests[key].errors) : undefined,
        repair: (_base, draft, errors) => (artifact === C.ARTIFACT ? C.REPAIR(context, draft, errors) : P.REPAIR(context, draft, errors)),
        rejected: async (raw, draft, errors, route, attempt) => {
          opts.log(V.LOG_REJECTED(artifact, errors));
          await writeMotionAiDebug(`${artifact}${RT_SHARED.SYMBOL_3973E0}${key}${RT_SHARED.SYMBOL_3973E0}${attempt}`, { stage: artifact, provider: route.provider, model: route.model, errors, response: raw, draft });
        },
        failure: (errors) => new Error(P.ERROR(key, errors)),
      };
      return opts.ai ? requestMotionAiContract(prompt, exec, (question) => opts.ai!(question, artifact, exec, opts.signal, opts.log, images), contract, opts.signal) : runMotionAi(prompt, artifact, exec, opts.signal, opts.log, images, 0, contract);
    };
    const fatal = (error: unknown) => opts.signal?.aborted || motionCaptchaError(error) || (isTerminalMotionAiError(error, opts.signal) && !(error as Record<string, unknown>)?.[MOTION_PRODUCTION.CONTRACT_EXHAUSTED]);
    const selectedSceneOwners = opts.onlyScenes?.length
      ? new Set(
          Object.values(state.scenes)
            .flat()
            .filter((scene) => opts.onlyScenes!.includes(scene.id))
            .map((scene) => scene.beatId),
        )
      : undefined;
    const beats = script.beats.filter((beat) => (!selectedSceneOwners || selectedSceneOwners.has(beat.id)) && (!opts.onlyBeats?.length || opts.onlyBeats.includes(beat.id)) && (!opts.onlyLocations?.length || opts.onlyLocations.includes(beat.place || "")));
    if (state.groupingRevision === undefined && !Object.values(state.scenes).some((scenes) => scenes?.length)) state.groupingRevision = PACING.GROUPING;
    const planGroups = remotionPlanGroups(script, analysis, state);
    const selectedIds = new Set(beats.map((beat) => beat.id));
    const selectedGroups = planGroups.filter((group) => group.beats.some((beat) => selectedIds.has(beat.id)));
    state.pacingRevision = PACING.REVISION;
    const cast = new Set(analysis.cast.map((member) => member.key));
    opts.log(V.LOG_MODE(settings.mode));
    opts.log(C.LOG);
    opts.log(C.LOG_SINGLE);
    if (!opts.review) opts.log(V.LOG_REVIEW_OFF);
    opts.log(PACING.LOG(planGroups.length, script.beats.length, PACING.TEXT.vi[motionScenePacing(settings)]));
    const planGroup = async (group: (typeof selectedGroups)[number]) => {
      const beat = group.beats[0];
      opts.signal?.throwIfAborted();
      const note =
        opts.note ??
        group.beats
          .map((member) => state.notes![member.id] || "")
          .filter(Boolean)
          .filter((value, index, values) => values.indexOf(value) === index)
          .join(RT_SHARED.SYMBOL_01BA47);
      const inputKey = remotionGroupKey(group.beats, analysis, state, opts.note);
      opts.log(L.LOG_PLAN(planGroups.indexOf(group) + 1, planGroups.length));
      try {
        for (const member of group.beats) delete state.failures[member.id];
        if (!remotionGroupPlanCurrent(group.beats, analysis, state, opts.onlyScenes?.length ? undefined : opts.note)) {
          const lines = group.beats.flatMap((member) => puppetBeatLines(member, motionNarratorCastKey(analysis)));
          const groupPlaces = [...new Set(group.beats.map((member) => member.place).filter((place): place is string => !!place))];
          const direction = motionIllustrationDirection(settings.profileId, RT_SERVER.PLANNING);
          const context = {
            profile: settings.profileId,
            artDirection: { id: direction.id, revision: direction.revision, rules: direction.rules, staging: MOTION_ILLUSTRATION_PROFILES[settings.profileId].staging || MOTION_ILLUSTRATION_COMMON.STAGING },
            era: analysis.era,
            beat: { id: beat.id, shot: beat.shot },
            beats: group.beats.map((member) => ({ id: member.id, ...(groupPlaces.length > 1 ? { place: member.place } : {}), scenePlan: member.scenePlan && { subject: member.scenePlan.subject, composition: member.scenePlan.composition, spatialRelations: member.scenePlan.spatialRelations, requiredProps: member.scenePlan.requiredProps, continuity: member.scenePlan.continuity }, action: member.action, time: member.time, weather: member.weather })),
            pacing: motionScenePacingRule(settings, group.seconds, groupPlaces.length),
            lines: lines.map((line) => ({ id: line.key, text: line.text })),
            cast: analysis.cast.map(({ key, name, alias, role, appearanceOf }) => ({ key, name, alias, role, appearanceOf })),
            place: analysis.places.find((place) => place.key === beat.place),
            ...(groupPlaces.length > 1 ? { places: analysis.places.filter((place) => groupPlaces.includes(place.key)) } : {}),
            priorFacts: motionStoryEventLedger(script.beats.slice(0, script.beats.indexOf(beat))),
            note,
          };
          const draft = await ask(
            `${RT_SERVER.PLAN}${inputKey}`,
            V.ARTIFACT_SCENE,
            P.SCENE(context) + RT_SHARED.SYMBOL_01BA47 + C.PLAN_POLICY,
            (raw) => {
              const checked = mergeRemotionSceneDraft(raw, state.drafts![inputKey] || [], lines, cast);
              state.drafts![inputKey] = checked.drafts;
              return checked;
            },
            undefined,
            context,
          );
          state.scenes[beat.id] = remotionScenesFromDraft(draft, beat.id, beat.place, lines, inputKey);
          for (const scene of state.scenes[beat.id]) {
            const from = lines.findIndex((line) => line.key === scene.fromLineId),
              to = lines.findIndex((line) => line.key === scene.toLineId);
            scene.sourceBeatIds = [...new Set(lines.slice(from, to + 1).map((line) => line.beatId))];
            if (groupPlaces.length > 1) {
              const weight = new Map<string, number>();
              for (const line of lines.slice(from, to + 1)) {
                const place = group.beats.find((member) => member.id === line.beatId)?.place;
                if (place) weight.set(place, (weight.get(place) || 0) + 1);
              }
              const dominant = [...weight.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
              if (dominant) scene.place = dominant;
            }
          }
          const suggested = motionScenePacingCount(settings, group.seconds);
          if (state.scenes[beat.id].length > Math.ceil(suggested * PACING.OVER_RATIO)) opts.log(PACING.OVER_LOG(planGroups.indexOf(group) + 1, state.scenes[beat.id].length, suggested, PACING.TEXT.vi[motionScenePacing(settings)]));
          for (const member of group.beats) {
            state.inputKeys[member.id] = remotionBeatKey(member, analysis, undefined, state);
            if (opts.note !== undefined) state.notes![member.id] = opts.note;
            if (member.id !== group.id) delete state.scenes[member.id];
          }
          delete state.drafts[inputKey];
          save();
        }
      } catch (error) {
        state.failures[beat.id] = String((error as Error).message);
        if (!opts.signal?.aborted) save();
        if (fatal(error)) throw error;
        opts.log(V.LOG_FAILED(beat.id, state.failures[beat.id]));
      }
    };
    let allScenes = planGroups.flatMap((group) => state.scenes[group.id] || []);
    const selected = new Set(selectedGroups.map((group) => group.id));
    const groups = new Map<string, typeof allScenes>();
    for (const scene of allScenes) {
      const location = scene.locationKey || scene.place || scene.beatId;
      groups.set(location, [...(groups.get(location) || []), scene]);
    }
    const ready = new Set(allScenes.filter((scene) => scene.build?.status !== COMMON_RUNTIME.SOURCE_TEXT_FAILED && scene.composition && scene.aspect === aspect && remotionSceneReadiness(scene, state).preview).map((scene) => scene.id));
    const legacyPreviousKeys = new Map<string, string | undefined>();
    for (const scenes of groups.values()) {
      let previousKey: string | undefined;
      for (const scene of scenes) {
        legacyPreviousKeys.set(scene.id, previousKey);
        if (scene.composition && state.assets[scene.composition.assetKey]) previousKey = scene.composition.inputKey;
      }
    }
    const processed = new Set<string>();
    const planned = new Set<string>();
    const readyCount = () => allScenes.filter((scene) => ready.has(scene.id) && scene.build?.status !== COMMON_RUNTIME.SOURCE_TEXT_FAILED).length;
    const progressTotal = () => Math.max(1, allScenes.length + selectedGroups.length - planned.size);
    const drawScene = async (scene: (typeof allScenes)[number], previous?: (typeof allScenes)[number], retry = false) => {
      if (!selected.has(scene.beatId) || (opts.onlyScenes?.length && !opts.onlyScenes.includes(scene.id))) return;
      opts.signal?.throwIfAborted();
      const beat = script.beats.find((beat) => beat.id === scene.beatId)!;
      const previousAsset = previous?.composition && state.assets[previous.composition.assetKey];
      if (opts.onlyScenes?.includes(scene.id) && opts.note !== undefined) scene.drawingNote = opts.note;
      const inputKey = remotionCompositionKey(scene, analysis, width, height, scene.drawingNote ?? state.notes![beat.id], state);
      const legacyInputKey = motionInputKey([C.REVISION, scene.sourceKey, scene.purpose, scene.environment, scene.nodes, scene.text, settings, V.PROFILES[settings.profileId].revision, width, height, state.notes![beat.id], legacyPreviousKeys.get(scene.id)]);
      const key = `${RT_SERVER.COMPOSITION}${inputKey}${COMMON_RUNTIME.SOURCE_TEXT_SYMBOL_16}${scene.id}`;
      const targeted = !!opts.onlyScenes?.includes(scene.id) && !retry;
      const attempts = targeted || scene.build?.inputKey !== inputKey ? 0 : (scene.build?.attempts ?? (scene.build?.status === COMMON_RUNTIME.SOURCE_TEXT_FAILED ? 1 : 0));
      let drawingRequested = false;
      const requestBudget = opts.review ? { remaining: C.REVIEW_REQUESTS } : undefined;
      const request: typeof ask = async (requestKey, artifact, prompt, assess, images, context) => {
        scene.requestKeys ||= [];
        if (!scene.requestKeys.includes(requestKey)) scene.requestKeys.push(requestKey);
        return ask(requestKey, artifact, prompt, assess, images, context, requestBudget);
      };
      opts.log(C.LOG_DRAW(allScenes.indexOf(scene) + 1, allScenes.length, scene.purpose));
      try {
        if (targeted || retry) {
          for (const requestKey of scene.requestKeys || []) {
            delete requests[requestKey];
            delete compositions[requestKey];
          }
          scene.requestKeys = [];
          delete scene.reviewKey;
          delete compositions[key];
          delete requests[key];
        }
        const existingReady = remotionSceneReadiness(scene, state).preview;
        if (!retry && !targeted && scene.build?.status === COMMON_RUNTIME.SOURCE_TEXT_FAILED && scene.build.inputKey === inputKey && existingReady) {
          processed.add(scene.id);
          return;
        }
        if (opts.review && !targeted && !existingReady && scene.composition && state.assets[scene.composition.assetKey]) compositions[key] ||= { svg: state.assets[scene.composition.assetKey].svg, layers: scene.composition.layers, animations: scene.composition.animations, design: scene.composition.design, continuityNotes: scene.composition.continuityNotes };
        if (targeted || retry || ![inputKey, legacyInputKey].includes(scene.composition?.inputKey || "") || !existingReady) {
          const identityReferences = motionIdentityReferences(scene, allScenes, state.assets);
          const speakers = [...new Set(script.beats.filter((member) => (scene.sourceBeatIds || [scene.beatId]).includes(member.id)).flatMap((member) => member.utterances?.filter((line) => line.role === RT_SERVER.DIALOGUE).map((line) => line.speaker) || []))] as string[];
          const context = {
            width,
            height,
            viewBox: `${RT_SHARED.VALUE_0_0}${width}${RT_SHARED.SYMBOL_36A9E7}${height}`,
            profile: V.PROFILES[settings.profileId].direction,
            artDirection: motionIllustrationDirection(settings.profileId, RT_SHARED.DRAWING),
            drawingReference: motionCompositionReference(settings.profileId, previous?.composition?.design),
            renderBehavior: state.renderBehavior,
            era: analysis.era,
            place: analysis.places.find((place) => place.key === (scene.place || beat.place)),
            scene: { purpose: scene.purpose, text: scene.text, environment: scene.environment, time: scene.time || beat.time, weather: scene.weather || beat.weather, view: scene.view, nodes: scene.nodes },
            cast: motionCastIdentity(analysis.cast, settings.profileId, analysis.era).filter((member) => scene.nodes.some((node) => node.entityId === member.key)),
            dialogueSpeakers: speakers,
            staging: motionSceneStaging(scene.nodes, motionNarratorCastKey(analysis), speakers),
            groups: scene.nodes.some((node) => node.anonymous) ? analysis.groups : undefined,
            previousShot: allScenes[allScenes.indexOf(scene) - 1] ? { view: allScenes[allScenes.indexOf(scene) - 1].view, purpose: allScenes[allScenes.indexOf(scene) - 1].purpose } : undefined,
            continuity: previousAsset ? { text: previous.text, layers: previous.composition!.layers, design: previous.composition!.design, notes: previous.composition!.continuityNotes, placeSvg: motionPlaceReference(previousAsset, previous.composition!) } : undefined,
            identityReferences: identityReferences.length ? identityReferences : undefined,
            note: scene.drawingNote ?? state.notes![beat.id],
          };
          const assess = (raw: unknown) => {
            try {
              const merged = mergeSceneCompositionDraft(compositions[key], raw);
              const draft = compositionRepairDraft(merged);
              compositions[key] = draft;
              const built = normalizeFirstSceneComposition(draft, key, inputKey, scene.purpose, scene.nodes, cast, width, height);
              if (typeof draft.svg === "string" && repairMotionSvgMarkup(draft.svg) !== draft.svg) opts.log(C.LOG_LOCAL_REPAIR(allScenes.indexOf(scene) + 1, allScenes.length));
              const absent = compositionMissingNodes(built.composition, scene.nodes);
              if (absent.length) opts.log(C.MISSING_ADVISORY(absent));
              built.composition.geometryRevision = C.GEOMETRY_REVISION;
              return { value: built, errors: [] };
            } catch (error) {
              return { value: compositions[key] || raw, errors: [String((error as Error).message)] };
            }
          };
          const recovered = compositions[key] && (await assess(compositions[key]));
          if (recovered?.errors.length) (requests[key] ||= { rejected: 0, errors: [] }).errors = recovered.errors;
          drawingRequested = !(recovered && !recovered.errors.length);
          const built = !drawingRequested ? recovered!.value : await request(key, C.ARTIFACT, C.PROMPT(context), assess, undefined, context);
          state.assets[key] = built.asset;
          delete compositions[key];
          scene.composition = built.composition;
          scene.aspect = aspect;
          save();
        }
        if (scene.composition) {
          if (!opts.review) scene.composition.unchecked = true;
          scene.composition.inputKey = inputKey;
          scene.composition.geometryRevision = C.GEOMETRY_REVISION;
          state.assets[scene.composition.assetKey].inputKey = inputKey;
        }
        const ensureActorMotion = () => {
          if (!scene.composition) return;
          const reviewed = !!scene.reviewKey && scene.reviewKey === motionInputKey([scene.composition, scene.text, settings]);
          const attached = compositionAttachedMotion(scene.composition, state.assets[scene.composition.assetKey], scene.nodes);
          scene.composition = attached.composition;
          if (attached.removed) opts.log(C.GUARD.LOG_ATTACHMENT(scene.id, attached.removed));
          const result = compositionActorMotion(scene.composition, state.assets[scene.composition.assetKey], scene.nodes, cast, state.renderBehavior);
          if (!result.added && !attached.removed) return;
          scene.composition = result.composition;
          if (reviewed) scene.reviewKey = motionInputKey([scene.composition, scene.text, settings]);
          if (result.added) opts.log(C.GUARD.LOG_MOTION(scene.id, result.added));
          save();
        };
        ensureActorMotion();
        if (opts.review) {
          for (let attempt = 0; attempt < C.REVIEW_PASSES; attempt++) {
            const reviewKey = motionInputKey([scene.composition, scene.text, settings]);
            if (scene.reviewKey === reviewKey) break;
            const spec = remotionSceneReadiness(scene, state).preview;
            if (!spec) throw new Error(V.INVALID_SPEC);
            const file = path.join(getMotionWorkDirectory(motionInputKey([opts.scope, reviewKey])), `${reviewKey}${RT_SERVER.PNG_B98B80}`);
            opts.log(V.LOG_REVIEW(allScenes.indexOf(scene) + 1, allScenes.length));
            let review: { ok: boolean; issues: string[]; checks?: { ok?: boolean; category?: string; evidence?: string; problem?: string }[] };
            try {
              try {
                const issues = await geometry.check(state.assets[scene.composition!.assetKey], scene.composition!);
                if (issues.length) opts.log(C.GEOMETRY_ADVISORY(issues));
              } catch (error) {
                if (opts.signal?.aborted) throw error;
                opts.log(Q.REVIEW_UNAVAILABLE(String((error as Error).message)));
              }
              await (opts.still || renderRemotionStill)(spec, file, 0, opts.signal);
              review = await request(
                `${RT_SERVER.REVIEW_E375B5}${reviewKey}`,
                V.ARTIFACT_REVIEW,
                P.REVIEW({ narration: scene.text, nodes: scene.nodes, design: scene.composition!.design, profile: V.PROFILES[settings.profileId].direction, artDirection: motionIllustrationDirection(settings.profileId, RT_SHARED.REVIEW) }),
                (raw) => ({ value: raw, errors: typeof raw?.ok === "boolean" && Array.isArray(raw.issues) && raw.issues.every((issue: unknown) => typeof issue === "string") && (raw.ok || raw.issues.length) ? [] : [P.REVIEW_REQUIRED] }),
                [{ name: `${scene.id}${RT_SERVER.PNG_B98B80}`, mimeType: RT_SERVER.IMAGE_PNG, path: file }],
              );
            } catch (error) {
              if (opts.signal?.aborted || motionCaptchaError(error)) throw error;
              opts.log(Q.REVIEW_UNAVAILABLE(String((error as Error).message)));
              break;
            } finally {
              fs.rmSync(file, { force: true });
            }
            if (!review.ok) {
              const checks = Array.isArray(review.checks) ? review.checks.filter((check) => check && typeof check === "object") : [];
              const blocking = checks.filter((check) => check.ok !== true && motionVisualCheckBlocks({ ...check, ok: false }) && typeof check.evidence === "string" && check.evidence.trim() && typeof check.problem === "string" && check.problem.trim());
              const issues = blocking.map((check) => check.problem!);
              const advisory = [
                ...review.issues.filter((issue) => !issues.includes(issue)),
                ...checks
                  .filter((check) => !blocking.includes(check))
                  .map((check) => check.problem || check.category || "")
                  .filter(Boolean),
              ];
              if (advisory.length) opts.log(Q.REVIEW_ADVISORY(allScenes.indexOf(scene), [...new Set(advisory)].join(RT_SHARED.SYMBOL_0A2D3F)));
              review = { ...review, ok: !blocking.length, issues };
            }
            if (review.ok) {
              scene.reviewKey = reviewKey;
              save();
              break;
            }
            if (attempt === C.REVIEW_PASSES - 1) throw new Error(P.ERROR(scene.id, review.issues));
            const repairKey = `${key}${RT_SERVER.REPAIR}${reviewKey}`;
            opts.log(V.LOG_REPAIR(scene.id));
            compositions[repairKey] ||= { svg: state.assets[scene.composition!.assetKey].svg, layers: scene.composition!.layers, animations: scene.composition!.animations, design: scene.composition!.design, continuityNotes: scene.composition!.continuityNotes };
            const repairContext = {
              width,
              height,
              viewBox: `${RT_SHARED.VALUE_0_0}${width}${RT_SHARED.SYMBOL_36A9E7}${height}`,
              narration: scene.text,
              scene: { nodes: scene.nodes, environment: scene.environment },
              renderBehavior: state.renderBehavior,
              profile: V.PROFILES[settings.profileId].direction,
              artDirection: motionIllustrationDirection(settings.profileId, RT_SHARED.DRAWING),
              repairOnly: review.issues,
            };
            const fixed = await request(
              repairKey,
              C.ARTIFACT,
              C.REPAIR(repairContext, compositions[repairKey], review.issues),
              (raw) => {
                try {
                  const draft = mergeSceneCompositionDraft(compositions[repairKey], raw);
                  compositions[repairKey] = draft;
                  const built = normalizeFirstSceneComposition(draft, repairKey, repairKey, scene.purpose, scene.nodes, cast, width, height);
                  return { value: built, errors: [] };
                } catch (error) {
                  return { value: compositions[repairKey], errors: [String((error as Error).message)] };
                }
              },
              undefined,
              repairContext,
            );
            state.assets[repairKey] = fixed.asset;
            delete compositions[repairKey];
            scene.composition = { ...fixed.composition, inputKey, geometryRevision: C.GEOMETRY_REVISION };
            state.assets[repairKey].inputKey = inputKey;
            save();
          }
        }
        ensureActorMotion();
        const remainingChannels = motionCompositionMissingChannels(scene, state.renderBehavior);
        if (remainingChannels.length)
          opts.log(
            PACING.MOTION_LOG(
              scene.id,
              remainingChannels.map((channel) => PACING.CHANNELS[channel]),
            ),
          );
        ready.add(scene.id);
        scene.build = { inputKey, status: RUNTIME_VALUES.ACCEPTED_070C160A, review: !!opts.review && scene.reviewKey === motionInputKey([scene.composition, scene.text, settings]), attempts: attempts + (drawingRequested ? 1 : 0) };
        processed.add(scene.id);
        save();
        const message = V.LOG_READY(readyCount(), allScenes.length) + P.LOG_PENDING_PLANS(selectedGroups.length - planned.size);
        opts.log(message);
        if (!retry) opts.progress?.((0.9 * processed.size) / progressTotal(), message);
      } catch (error) {
        if (opts.signal?.aborted || motionCaptchaError(error)) throw error;
        ready.delete(scene.id);
        const reason = String((error as Error).message);
        if (scene.aspect !== aspect || !remotionSceneReadiness(scene, state).preview) {
          const failed = failedSceneComposition(key, inputKey, width, height);
          state.assets[key] = failed.asset;
          scene.composition = failed.composition;
          scene.aspect = aspect;
        }
        scene.build = { inputKey, status: COMMON_RUNTIME.SOURCE_TEXT_FAILED, review: !!opts.review, error: reason, attempts: attempts + 1 };
        processed.add(scene.id);
        save();
        opts.log(C.LOG_CONTINUE(scene.id, reason));
        if (!retry) opts.progress?.((0.9 * processed.size) / progressTotal(), C.PROGRESS_CONTINUE(allScenes.indexOf(scene) + 1, allScenes.length));
      }
    };
    const drawingSlots = new MotionAiWorkerPool(MOTION_STORY_CONFIG.SCENE_WORKER_IDS);
    const draw = async (scene: (typeof allScenes)[number], anchor?: (typeof allScenes)[number], retry = false) => {
      const slot = await drawingSlots.acquire(opts.signal);
      try {
        await drawScene(scene, anchor, retry);
      } finally {
        slot.release();
      }
    };
    const anchors = new Map<string, Promise<(typeof allScenes)[number] | undefined>>();
    const drawing: Promise<void>[] = [];
    let drawingFailure: { error: unknown } | undefined;
    await mapMotionAiPool(
      selectedGroups,
      async (group) => {
        await planGroup(group);
        planned.add(group.id);
        allScenes = planGroups.flatMap((group) => state.scenes[group.id] || []);
        if (state.failures[group.id]) return;
        const candidates = (state.scenes[group.id] || []).filter((scene) => !opts.onlyScenes?.length || opts.onlyScenes.includes(scene.id));
        if (!candidates.length) return;
        const location = candidates[0].locationKey || candidates[0].place || group.id;
        if (!anchors.has(location)) {
          const existing = allScenes.find((scene) => (scene.locationKey || scene.place || scene.beatId) === location && !opts.onlyScenes?.includes(scene.id) && scene.build?.status !== COMMON_RUNTIME.SOURCE_TEXT_FAILED && scene.composition && scene.aspect === aspect && remotionSceneReadiness(scene, state).preview);
          anchors.set(
            location,
            existing
              ? Promise.resolve(existing)
              : (async () => {
                  const first = candidates.shift()!;
                  await draw(first);
                  return first.build?.status !== COMMON_RUNTIME.SOURCE_TEXT_FAILED && first.composition ? first : undefined;
                })(),
          );
        }
        const anchorReady = anchors.get(location)!;
        drawing.push(
          (async () => {
            const anchor = await anchorReady;
            const results = await Promise.allSettled(candidates.map((scene) => draw(scene, anchor)));
            const failure = results.find((entry) => entry.status === COMMON_RUNTIME.SOURCE_TEXT_REJECTED);
            if (failure?.status === COMMON_RUNTIME.SOURCE_TEXT_REJECTED) throw failure.reason;
          })().catch((error: unknown) => {
            drawingFailure ??= { error };
          }),
        );
      },
      MOTION_STORY_CONFIG.SCENE_WORKER_IDS.length,
      MOTION_AI_ROLE.DRAW,
    );
    await Promise.all(drawing);
    if (drawingFailure) throw drawingFailure.error;
    const failed = allScenes.filter((scene) => selected.has(scene.beatId) && (!opts.onlyScenes?.length || opts.onlyScenes.includes(scene.id)) && scene.build?.status === COMMON_RUNTIME.SOURCE_TEXT_FAILED && (scene.build.attempts ?? 1) < C.DRAW_ATTEMPTS);
    if (failed.length) {
      opts.log(C.LOG_RECOVERY(failed.length));
      let retried = 0;
      const retries = await Promise.allSettled(
        failed.map(async (scene, index) => {
          const location = scene.locationKey || scene.place || scene.beatId;
          const anchor = allScenes.find((candidate) => candidate.id !== scene.id && (candidate.locationKey || candidate.place || candidate.beatId) === location && candidate.build?.status === RUNTIME_VALUES.ACCEPTED_070C160A && candidate.composition && candidate.aspect === aspect && remotionSceneReadiness(candidate, state).preview);
          opts.log(C.LOG_RETRY(index + 1, failed.length, allScenes.indexOf(scene) + 1, allScenes.length));
          await draw(scene, anchor, true);
          retried++;
          opts.progress?.(0.9 + (0.1 * retried) / failed.length, C.LOG_SUMMARY(readyCount(), allScenes.length));
        }),
      );
      const interrupted = retries.find((entry) => entry.status === COMMON_RUNTIME.SOURCE_TEXT_REJECTED);
      if (interrupted?.status === COMMON_RUNTIME.SOURCE_TEXT_REJECTED) throw interrupted.reason;
    }
    opts.log(C.LOG_SUMMARY(readyCount(), allScenes.length));
    opts.progress?.(1, C.LOG_SUMMARY(readyCount(), allScenes.length));
    state.compositionRevision = C.REVISION;
    state.profileRevision = V.PROFILES[settings.profileId].revision;
    if (!Object.keys(state.failures).length && planGroups.every((group) => remotionGroupPlanCurrent(group.beats, analysis, state))) {
      for (const group of planGroups) {
        const key = remotionGroupKey(group.beats, analysis, state);
        for (const beat of group.beats) state.inputKeys[beat.id] = remotionBeatKey(beat, analysis, undefined, state);
        for (const scene of state.scenes[group.id] || []) scene.sourceKey = key;
      }
      const owners = new Set(planGroups.map((group) => group.id));
      for (const key of Object.keys(state.scenes)) if (!owners.has(key)) delete state.scenes[key];
      const used = new Set(allScenes.flatMap((scene) => (scene.composition ? [scene.composition.assetKey] : [scene.backgroundKey, ...scene.nodes.map((node) => node.assetKey)])).filter(Boolean));
      state.assets = Object.fromEntries(Object.entries(state.assets).filter(([key]) => used.has(key)));
    }
    save();
    if (Object.keys(state.failures).length)
      throw new Error(
        Object.entries(state.failures)
          .map(([id, reason]) => V.LOG_FAILED(id, reason))
          .join(RT_SHARED.SYMBOL_01BA47),
      );
    if (opts.sfx === true) {
      try {
        await directMotionSound(result, analysis, { exec: opts.mainExec || opts.exec, signal: opts.signal, log: opts.log, ai: opts.ai, onAccepted: save });
        result.gen!.soundPlanVersion = MOTION_SOUND_CONFIG.VERSION;
        save();
      } catch (error) {
        if (opts.signal?.aborted || motionCaptchaError(error)) throw error;
        opts.log(MOTION_SOUND_CONFIG.SKIPPED);
      }
    }
    return result;
  } finally {
    await geometry.close?.();
  }
};
