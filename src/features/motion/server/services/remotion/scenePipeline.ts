import * as RT_MAINTENANCE from "../../../../../constants/runtime/maintenance.js";
import { motionSceneLocation, motionScenesByLocation } from "../../../../../lib/motionSceneReferences.js";
import { usesMotionHtml } from "../../../../../lib/motionHtmlScene.js";
import { buildMotionHtmlScenes } from "../html/scenePipeline.js";
import * as COMMON_RUNTIME from "../../../../../constants/sourceText.js";
import { RUNTIME_VALUES } from "../../../../../constants/runtime/values.js";
import { RUNTIME_TEXT as RT_SHARED } from "../../../../../constants/runtime/shared.js";
import { motionAiFallbackPolicy, motionSceneWorkerIds } from "../../../../../lib/motionAiExecution.js";
import { RUNTIME_TEXT as RT_SERVER } from "../../../../../constants/runtime/server.js";
import { stringifyJson } from "../../../../../lib/jsonStringify.js";
import { MOTION_VISUAL as V } from "../../../../../constants/motionVisual.js";
import { MOTION_REMOTION_LAYOUT as L } from "../../../../../constants/motionRemotionLayout.js";
import { MOTION_REMOTION_PROMPTS as P, MOTION_REMOTION_SCHEMAS } from "../../../../../constants/motionRemotionPrompts.js";
import { MOTION_SCENE_COMPOSITION as C } from "../../../../../constants/motionSceneComposition.js";
import { motionIllustrationDirection } from "../../../../../lib/motionIllustrationProfile.js";
import { motionGenreSpec, motionVideoGenre } from "../../../../../constants/motionGenre.js";
import { motionGenreWritingPlan } from "../../../../../lib/motionGenres/autofix.js";
import { applyMotionSceneIntent } from "../../../../../lib/motionSceneIntent.js";
import { MOTION_SCENE_INTENT } from "../../../../../constants/motionSceneIntent.js";
import { MOTION_ILLUSTRATION_PROFILES } from "../../../../../constants/motionIllustrationProfiles.js";
import { MOTION_PRODUCTION } from "../../../../../constants/motionProduction.js";
import { MOTION_AI_ROLE } from "../../../../../constants/motionAiFallback.js";
import { motionVisualSettingsFor } from "../../../../../lib/motionVisual.js";
import { normalizeMotionRenderBehavior } from "../../../../../lib/motionRenderBehavior.js";
import { normalizeSceneComposition } from "../../../../../lib/motionSceneComposition.js";
import { remotionSceneReadiness } from "../../../../../lib/motionRemotion.js";
import { motionBeatLines } from "../../../../../lib/motionBeatLines.js";
import { motionNarratorCastKey } from "../../../../../lib/motionVoice.js";
import { motionCastIdentity } from "../../../../../lib/motionCastIdentity.js";
import { motionIdentityReferences } from "../../../../../lib/motionIdentityReference.js";
import { motionScenePlanGuard } from "../../../../../lib/motionScenePlanGuard.js";
import { motionAnimalFrames, motionPoseNotes } from "../../../../../lib/motionScenePoses.js";
import { MOTION_SCENE_PLAN_GUARD } from "../../../../../constants/motionScenePlanGuard.js";
import { motionLanguage } from "../../../../../lib/motionLanguage.js";
import { motionStoryEventLedger } from "../../../../../lib/motionStoryContinuity.js";
import { runMotionAi, prepareMotionSceneRooms, writeMotionAiDebug, motionCaptchaError } from "../motionStoryService.js";
import { recoverMotionAiContractState, requestMotionAiContract, type MotionAiResponseContract } from "../motionAiContractService.js";
import { isTerminalMotionAiError } from "../../../../../server/services/chatSubmissionRecovery.js";
import { motionInputKey } from "../motionFileUtils.js";
import { motionTaskCheckpoint } from "../motionTaskCheckpoint.js";
import { emptyGen } from "../motionGenState.js";
import { mergeRemotionSceneDraft, remotionScenesFromDraft } from "./sceneContract.js";
import { remotionBeatKey, remotionGroupKey, remotionGroupPlanCurrent, remotionCompositionKey, remotionPlanGroups } from "./sceneKeys.js";
import { motionScenePacingRule, motionScenePacing, motionScenePacingCount } from "../../../../../lib/motionScenePacing.js";
import { MOTION_SCENE_PACING as PACING } from "../../../../../constants/motionScenePacing.js";
import { directMotionSound } from "../motionSoundDirectionService.js";
import { MOTION_SOUND_CONFIG } from "../../../../../constants/motionSound.js";
import { MotionPriorityPool } from "../motionPriorityPool.js";
import type { MotionAiExecution, MotionAiLog, MotionStoryAnalysis, MotionStoryScript } from "../../../../../types/motionVideo.js";
import type { MotionAiContractState } from "../../../../../types/motionAiContract.js";
import type { MotionObjectSheetEntry, MotionRemotionNode, MotionRemotionScene, MotionRemotionState, MotionRenderBehavior } from "../../../../../types/motionVisual.js";
import { sceneDrawSeconds } from "./sceneDrawTiming.js";
import { motionSceneSheets } from "../../../../../lib/motionObjectSheet.js";
import { MOTION_SCENE_ACTION_REVISION } from "../../../../../constants/motionSceneAction.js";
import { motionWrittenSceneIntents } from "../../../../../lib/motionSceneActionBrief.js";
import { MOTION_OBJECT_SHEET as SHEET } from "../../../../../constants/motionObjectSheet.js";
import { MOTION_SCENE_SCORE as SCORE } from "../../../../../constants/motionSceneScore.js";
import { scoreMotionScene, type MotionSceneScore } from "../../../../../lib/motionSceneScore.js";
import { motionScenePictureIssues } from "../../../../../lib/motionScenePicture.js";
import { motionSheetAssess, motionSheetCandidates, motionSheetPrompt } from "./sceneSheet.js";
type SceneBuild = ReturnType<typeof normalizeSceneComposition>;
const SCHEDULE = {
  PRIORITY: { ANCHOR: 0, PLAN: 1, SCENE: 2 },
  INDEPENDENT_FORMATS: [RT_MAINTENANCE.CARD, RT_MAINTENANCE.DIAGRAM, RT_MAINTENANCE.MAP, RT_MAINTENANCE.TIMELINE, RT_MAINTENANCE.PROCESS, RT_MAINTENANCE.COMPARISON] as readonly string[],
  DETAIL_VIEW: RT_MAINTENANCE.DETAIL,
  LOG_UTILIZATION: (percent: number, rooms: number) => `${RT_MAINTENANCE.DUNG_CANH}${rooms}${RT_MAINTENANCE.ROOM_BAN_TRUNG_BINH}${percent}${RT_MAINTENANCE.THOI_GIAN}`,
} as const;
const SCORE_BEST_SUFFIX = RT_MAINTENANCE.BEST;
const clearLegacySceneFlags = (scene: MotionRemotionScene, state: MotionRemotionState) => {
  delete scene.reviewKey;
  delete scene.crop;
  delete scene.focus;
  delete scene.qualityNote;
  delete scene.qualityRedraws;
  delete scene.failStreak;
  delete scene.deferred;
  if (state.motionTried) delete state.motionTried[scene.id];
};
const drawingNodes = (nodes: MotionRemotionScene["nodes"]) => nodes.map((node) => Object.fromEntries(Object.entries(node).filter(([key]) => !C.DRAW_NODE_OMIT.includes(key))));
const establishingScene = (scene: MotionRemotionScene) => (!scene.view || (ESTABLISHING_VIEWS as readonly string[]).includes(scene.view)) && !scene.nodes.some((node) => ([RT_MAINTENANCE.BUST, RT_MAINTENANCE.DETAIL] as string[]).includes(node.representation || ""));
const ESTABLISHING_VIEWS = [RT_MAINTENANCE.WIDE, RT_MAINTENANCE.ESTABLISHING] as const;
export interface RemotionSceneOptions {
  retryFailed?: boolean;
  exec: MotionAiExecution;
  mainExec?: MotionAiExecution;
  planExec?: MotionAiExecution;
  signal?: AbortSignal;
  log: MotionAiLog;
  progress?: (value: number, stage: string) => void;
  partial?: (script: MotionStoryScript) => void;
  scope?: string;
  aspect?: string;
  renderBehavior?: MotionRenderBehavior;
  sfx?: boolean;
  sheetCarry?: boolean;
  restart?: boolean;
  rebuildKey?: string;
  onlyBeats?: string[];
  onlyScenes?: string[];
  onlyLocations?: string[];
  note?: string;
  ai?: typeof runMotionAi;
}
export const buildRemotionScenes = async (script: MotionStoryScript, analysis: MotionStoryAnalysis, opts: RemotionSceneOptions): Promise<MotionStoryScript> => {
  if (usesMotionHtml(script)) return buildMotionHtmlScenes(script, analysis, opts);
  const settings = motionVisualSettingsFor({ analysis, script });
  if (settings.mode !== RT_SHARED.REMOTION) throw new Error(V.INVALID);
  {
    const profileRevision = V.PROFILES[settings.profileId].revision;
    const aspect = opts.aspect || RT_SHARED.VALUE_16_9;
    const [width, height] = aspect === RT_SERVER.VALUE_9_16 ? [720, 1280] : aspect === RT_SERVER.VALUE_1_1 ? [1000, 1000] : aspect === RT_SERVER.VALUE_4_5 ? [800, 1000] : [1280, 720];
    type Checkpoint = { state: MotionRemotionState; requests: Record<string, MotionAiContractState>; compositions?: Record<string, unknown> };
    const checkpoint = motionTaskCheckpoint<Checkpoint>(opts.scope, V.PROJECT_FOLDER, [PACING.REVISION, C.REVISION, profileRevision, settings, aspect]);
    const saved = checkpoint.read() || motionTaskCheckpoint<Checkpoint>(opts.scope, V.PROJECT_FOLDER, [PACING.REVISION, C.REVISION, profileRevision, settings, analysis.cast, analysis.places, script.beats, aspect, opts.note]).read();
    const incoming = script.gen?.remotion;
    const carried = incoming && (!saved?.state || (incoming.updatedAt || 0) > (saved.state.updatedAt || 0)) ? incoming : saved?.state || incoming;
    const state: MotionRemotionState = carried?.version === V.VERSION && stringifyJson(carried.settings) === stringifyJson(settings) ? structuredClone(carried) : { version: V.VERSION, settings, assets: {}, scenes: {}, inputKeys: {}, failures: {} };
    const requests = saved?.requests || {};
    const compositions: Record<string, unknown> = saved?.compositions || {};
    for (const key of Object.keys(requests)) requests[key] = recoverMotionAiContractState(requests[key], `${V.RECOVERY_REVISION}${RT_SHARED.SYMBOL_E7AC07}${C.REVISION}${RT_SHARED.SYMBOL_E7AC07}${profileRevision}`);
    state.notes ||= {};
    state.drafts ||= {};
    if (state.planRecoveryRevision !== P.PLAN_RECOVERY_REVISION) {
      state.drafts = {};
      for (const key of Object.keys(requests)) if (key.startsWith(RT_SERVER.PLAN)) delete requests[key];
      state.planRecoveryRevision = P.PLAN_RECOVERY_REVISION;
    }
    state.renderBehavior = normalizeMotionRenderBehavior(opts.renderBehavior ?? script.gen?.renderBehavior, script.gen?.characterMotion);
    const result: MotionStoryScript = { ...script, visualSettings: settings, gen: { ...(script.gen || emptyGen()), renderBehavior: state.renderBehavior, remotion: state, failed: [] } };
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
    const ask = async (key: string, artifact: string, prompt: string, assess: MotionAiResponseContract["assess"], images?: Parameters<typeof runMotionAi>[5], context?: unknown, rewrite?: MotionAiResponseContract["repair"], resumeNote?: string) => {
      const drawing = artifact === C.ARTIFACT;
      const sceneRoom = drawing || artifact === V.ARTIFACT_SCENE;
      const selectedExec = drawing ? opts.exec : opts.mainExec || opts.exec;
      if (sceneRoom && !opts.ai) await prepareMotionSceneRooms(opts.exec, opts.signal, opts.log);
      const exec = { ...selectedExec, role: sceneRoom ? MOTION_AI_ROLE.DRAW : MOTION_AI_ROLE.MAIN, ...(drawing ? { singleResponse: true, ...motionAiFallbackPolicy(selectedExec) } : {}) };
      const contract: MotionAiResponseContract = {
        schema: MOTION_REMOTION_SCHEMAS[artifact],
        attempts: drawing ? SCORE.ATTEMPTS : exec.strictProvider ? V.REQUEST_BUDGET : V.REQUEST_ATTEMPTS,
        routeAttempts: drawing ? SCORE.ATTEMPTS : exec.strictProvider ? V.REQUEST_BUDGET : V.REQUEST_ATTEMPTS,
        budget: drawing ? SCORE.ATTEMPTS : V.REQUEST_BUDGET,
        state: (requests[key] ||= { rejected: 0, errors: [] }),
        checkpoint: (value) => {
          requests[key] = value;
          save();
        },
        assess,
        ...(resumeNote ? { start: (base: string) => base + RT_SHARED.SYMBOL_01BA47 + resumeNote } : {}),
        repair: (base, draft, errors) => (rewrite ? rewrite(base, draft, errors) : artifact === SHEET.ARTIFACT ? SHEET.REPAIR(errors) : P.REPAIR(context, draft, errors)),
        rejected: async (raw, draft, errors, route, attempt) => {
          opts.log(drawing ? C.LOG_TECHNICAL_ERROR(errors) : V.LOG_REJECTED(artifact, errors));
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
    const scoreOf = (built: SceneBuild, scene: MotionRemotionScene): MotionSceneScore =>
      scoreMotionScene({ svg: built.asset.svg, layers: built.composition.layers, animations: built.composition.animations, nodes: scene.nodes, actionPlan: scene.actionPlan, duration: built.composition.duration, width, height, motion: state.renderBehavior?.actors === RT_SHARED.SIMPLE, picture: motionScenePictureIssues(built.asset.svg, scene, settings.profileId, analysis.cast, width, height) });
    opts.log(V.LOG_MODE(settings.mode));
    opts.log(C.LOG);
    opts.log(C.LOG_ONE_PASS);
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
          const lines = group.beats.flatMap((member) => motionBeatLines(member, motionNarratorCastKey(analysis)));
          const groupPlaces = [...new Set(group.beats.map((member) => member.place).filter((place): place is string => !!place))];
          const direction = motionIllustrationDirection(settings.profileId, RT_SERVER.PLANNING);
          const context = {
            profile: settings.profileId,
            artDirection: { id: direction.id, revision: direction.revision, rules: direction.rules, views: direction.views, staging: MOTION_ILLUSTRATION_PROFILES[settings.profileId].staging, ...(group.beats.some((member) => member.motionIntent) ? { construction: MOTION_ILLUSTRATION_PROFILES[settings.profileId].brief.frame } : {}) },
            era: analysis.era,
            genre: motionVideoGenre(analysis.videoGenre),
            genreGrammar: motionGenreSpec(analysis.videoGenre).GRAMMAR.rule,
            ...(motionGenreWritingPlan(analysis) ? { writingPlan: motionGenreWritingPlan(analysis) } : {}),
            beat: { id: beat.id, shot: beat.shot },
            beats: group.beats.map((member) => ({
              id: member.id,
              shot: member.shot,
              visual: member.visual,
              subject: member.subject,
              frame: member.frame,
              cast: member.cast,
              ...(groupPlaces.length > 1 ? { place: member.place } : {}),
              scenePlan: member.scenePlan && { subject: member.scenePlan.subject, composition: member.scenePlan.composition, spatialRelations: member.scenePlan.spatialRelations, requiredProps: member.scenePlan.requiredProps, continuity: member.scenePlan.continuity },
              action: member.action,
              motionIntent: member.motionIntent,
              time: member.time,
              weather: member.weather,
            })),
            pacing: motionScenePacingRule(settings, group.seconds, groupPlaces.length),
            lines: lines.map((line) => ({ id: line.key, text: line.text })),
            cast: analysis.cast.map(({ key, name, alias, role, appearanceOf }) => ({ key, name, alias, role, appearanceOf })),
            groups: analysis.groups,
            place: analysis.places.find((place) => place.key === beat.place),
            ...(groupPlaces.length > 1 ? { places: analysis.places.filter((place) => groupPlaces.includes(place.key)) } : {}),
            priorFacts: motionStoryEventLedger(script.beats.slice(0, script.beats.indexOf(beat))),
            note,
          };
          const draft = await ask(
            `${RT_SERVER.PLAN}${inputKey}`,
            V.ARTIFACT_SCENE,
            P.SCENE(context) + RT_SHARED.SYMBOL_01BA47 + C.PLAN_POLICY + (group.beats.some((member) => member.motionIntent) ? RT_MAINTENANCE.NEWLINE + P.SCENE_MOTION : ""),
            (raw) => {
              const checked = mergeRemotionSceneDraft(raw, state.drafts![inputKey] || [], lines, cast, true);
              if (group.beats.some((member) => member.motionIntent)) {
                for (const row of checked.drafts as { fromLineId?: string; actionPlan?: MotionRemotionScene["actionPlan"]; nodes?: MotionRemotionNode[] }[]) {
                  if (!row.actionPlan) checked.errors.push(`${RT_MAINTENANCE.SCENES_2}${row.fromLineId}${RT_MAINTENANCE.ACTIONPLAN_RETURN_THE_SCENE_S_AI_AUTHORED_ACTION_PLAN_WITH}`);
                  else
                    for (const subject of Array.isArray(row.actionPlan.subjects) ? row.actionPlan.subjects : []) {
                      if (!row.nodes?.some((node) => node.id === subject?.nodeId)) checked.errors.push(`${RT_MAINTENANCE.SCENES_2}${row.fromLineId}${RT_MAINTENANCE.ACTIONPLAN_SUBJECTS_NODEID}${subject?.nodeId}${RT_MAINTENANCE.MUST_REFERENCE_A_SCENE_NODE}`);
                    }
                }
              }
              state.drafts![inputKey] = checked.drafts;
              return checked;
            },
            undefined,
            context,
          );
          state.scenes[beat.id] = remotionScenesFromDraft(draft, beat.id, beat.place, lines, inputKey);
          const intent = applyMotionSceneIntent(state.scenes[beat.id], group.beats);
          if (intent.views || intent.formats) opts.log(MOTION_SCENE_INTENT.LOG(intent.views, intent.formats));
          const guard = motionScenePlanGuard(state.scenes[beat.id], {
            cast,
            carries: (entityId) => analysis.cast.find((member) => member.key === entityId)?.carries || [],
            outfit: motionLanguage(script.language).markers.outfit,
            lineText: (scene) => {
              const from = lines.findIndex((line) => line.key === scene.fromLineId),
                to = lines.findIndex((line) => line.key === scene.toLineId);
              return lines
                .slice(Math.max(0, from), to < 0 ? undefined : to + 1)
                .map((line) => line.text)
                .join(RT_SHARED.SYMBOL_36A9E7);
            },
          });
          if (guard.stripped || guard.details || guard.animals || guard.guessed || guard.bodies || guard.objects) opts.log(MOTION_SCENE_PLAN_GUARD.LOG(guard.stripped, guard.details, guard.animals, guard.guessed, guard.bodies, guard.objects));
          if (guard.merged || guard.saddled || guard.carried) opts.log(MOTION_SCENE_PLAN_GUARD.LOG_FIX(guard.merged, guard.saddled, guard.carried));
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
    const progressTotal = () => Math.max(1, allScenes.filter((scene) => selected.has(scene.beatId) && (!opts.onlyScenes?.length || opts.onlyScenes.includes(scene.id))).length + selectedGroups.length - planned.size);
    const stepProgress = (message: string) => opts.progress?.(processed.size / progressTotal(), message);
    const drawScene = async (scene: (typeof allScenes)[number], previous?: (typeof allScenes)[number]) => {
      if (previous && motionSceneLocation(previous) !== motionSceneLocation(scene)) previous = undefined;
      if (!selected.has(scene.beatId) || (opts.onlyScenes?.length && !opts.onlyScenes.includes(scene.id))) return;
      opts.signal?.throwIfAborted();
      const beat = script.beats.find((beat) => beat.id === scene.beatId)!;
      const previousAsset = previous?.composition && state.assets[previous.composition.assetKey];
      if (opts.onlyScenes?.includes(scene.id) && opts.note !== undefined) scene.drawingNote = opts.note;
      const sourceMotionIntents = motionWrittenSceneIntents(scene, script.beats);
      if (sourceMotionIntents.length) scene.writtenMotionKey = motionInputKey(sourceMotionIntents);
      else delete scene.writtenMotionKey;
      const inputKey = remotionCompositionKey(scene, analysis, width, height, scene.drawingNote ?? state.notes![beat.id], state);
      const legacyInputKey = motionInputKey([C.REVISION, scene.sourceKey, scene.purpose, scene.environment, scene.nodes, scene.text, settings, V.PROFILES[settings.profileId].revision, width, height, state.notes![beat.id], legacyPreviousKeys.get(scene.id)]);
      const targeted = !!opts.onlyScenes?.includes(scene.id) || (opts.retryFailed === true && scene.build?.status === RT_MAINTENANCE.FAILED);
      const oldKey = `${RT_SERVER.COMPOSITION}${inputKey}${COMMON_RUNTIME.SOURCE_TEXT_SYMBOL_16}${scene.id}`;
      const priorGeneration = !targeted && scene.generation?.inputKey === inputKey ? scene.generation : undefined;
      const key = priorGeneration ? priorGeneration.requestKey || oldKey : `${oldKey}${RT_MAINTENANCE.ACTION_2}${MOTION_SCENE_ACTION_REVISION}`;
      const existingReady = !!scene.composition && !!remotionSceneReadiness(scene, state).preview;
      if (!targeted && existingReady && scene.build?.status !== RT_MAINTENANCE.FAILED && [inputKey, legacyInputKey].includes(scene.composition!.inputKey)) {
        const asset = state.assets[scene.composition!.assetKey];
        if (scene.composition!.inputKey !== inputKey && asset) {
          scene.composition = { ...scene.composition!, inputKey };
          state.assets[scene.composition.assetKey] = { ...asset, inputKey };
          if (scene.build) scene.build = { ...scene.build, inputKey };
        }
        ready.add(scene.id);
        processed.add(scene.id);
        opts.log(C.LOG_REUSED(allScenes.indexOf(scene) + 1, allScenes.length));
        stepProgress(C.LOG_REUSED(allScenes.indexOf(scene) + 1, allScenes.length));
        return;
      }
      const generation = scene.generation;
      const index = allScenes.indexOf(scene) + 1;
      const resumable = !targeted && generation?.inputKey === inputKey;
      if (resumable && generation!.status !== RT_MAINTENANCE.ACCEPTED) {
        const prior = requests[key] || { rejected: 0, errors: [] };
        const spent = Math.max(prior.rejected || 0, generation!.attempts || 0) + (generation!.status === RT_MAINTENANCE.RUNNING ? 1 : 0);
        requests[key] = { ...prior, rejected: Math.min(SCORE.ATTEMPTS, spent), errors: prior.errors?.length ? prior.errors : [generation!.error || C.GENERATION_INTERRUPTED] };
      }
      const used = () => (targeted && !requests[key] ? 0 : requests[key]?.rejected || 0);
      const restore = (raw: unknown) => {
        try {
          const built = normalizeSceneComposition(raw, key, inputKey, scene.purpose, scene.nodes, cast, width, height, true);
          built.composition.duration = sceneDrawSeconds(scene, result);
          return { value: built, score: scoreOf(built, scene) };
        } catch {
          return undefined;
        }
      };
      const accept = (built: SceneBuild, score: MotionSceneScore, attempts: number, restored = false) => {
        state.assets[key] = built.asset;
        scene.composition = { ...built.composition, profileId: settings.profileId, profileRevision };
        scene.aspect = aspect;
        scene.generation = { revision: 1, inputKey, promptRevision: MOTION_SCENE_ACTION_REVISION, requestKey: key, status: RT_MAINTENANCE.ACCEPTED, attempts, score: score.score, ...(score.passed ? {} : { warnings: score.issues }) };
        scene.build = { inputKey, status: RT_MAINTENANCE.ACCEPTED, review: false, attempts };
        clearLegacySceneFlags(scene, state);
        ready.add(scene.id);
        processed.add(scene.id);
        save();
        const line = restored ? C.LOG_RESTORED(index, allScenes.length) : score.passed ? C.LOG_COMPLETE(index, allScenes.length, built.composition.animations.length) : SCORE.LOG_KEEP_BEST(index, allScenes.length, score.score, attempts);
        opts.log(line);
        stepProgress(line);
      };
      const saved = resumable && compositions[key] ? restore(compositions[key]) : undefined;
      if (saved && (generation!.status !== RT_MAINTENANCE.RUNNING || saved.score.passed || used() >= SCORE.ATTEMPTS)) {
        accept(saved.value, saved.score, Math.max(1, used()), true);
        return;
      }
      if (resumable && generation!.status !== RT_MAINTENANCE.ACCEPTED && used() >= SCORE.ATTEMPTS) {
        scene.generation = { ...generation!, status: RT_MAINTENANCE.FAILED, error: generation!.error || C.GENERATION_INTERRUPTED };
        scene.build = { inputKey, status: RT_MAINTENANCE.FAILED, review: false, attempts: used(), error: scene.generation.error };
        processed.add(scene.id);
        ready.delete(scene.id);
        save();
        opts.log(C.LOG_ONCE_FAILED(index, allScenes.length, scene.build.error!));
        return;
      }
      const snapshot = { composition: scene.composition, crop: scene.crop, focus: scene.focus, aspect: scene.aspect };
      if (targeted) {
        delete compositions[key];
        delete requests[key];
      }
      const generationInfo = { revision: 1 as const, inputKey, promptRevision: MOTION_SCENE_ACTION_REVISION, requestKey: key };
      scene.generation = { ...generationInfo, status: RT_MAINTENANCE.RUNNING, attempts: used() };
      scene.requestKeys = [...new Set([...(scene.requestKeys || []), key])];
      save();
      opts.log(C.LOG_DRAW(allScenes.indexOf(scene) + 1, allScenes.length, scene.purpose));
      try {
        const identity = motionIdentityReferences(scene, allScenes, settings.profileId, state.assets, analysis.cast);
        const speakers = [...new Set(script.beats.filter((member) => (scene.sourceBeatIds || [scene.beatId]).includes(member.id)).flatMap((member) => member.utterances?.filter((line) => line.role === RT_SERVER.DIALOGUE).map((line) => line.speaker) || []))] as string[];
        const seconds = sceneDrawSeconds(scene, result);
        const context = {
          width,
          height,
          viewBox: `${RT_MAINTENANCE.VALUE_0_0}${width}${RT_MAINTENANCE.SPACE}${height}`,
          seconds,
          sourceMotionIntents,
          sceneMotionIntent: scene.motionIntent,
          sceneActionPlan: scene.actionPlan,
          profile: V.PROFILES[settings.profileId].direction,
          artDirection: motionIllustrationDirection(settings.profileId, RT_SHARED.DRAWING, { view: scene.view, format: scene.format }),
          renderBehavior: state.renderBehavior,
          era: analysis.era,
          place: analysis.places.find((place) => place.key === (scene.place || beat.place)),
          scene: {
            purpose: scene.purpose,
            text: scene.text,
            format: scene.format,
            effects: scene.effects,
            environment: scene.environment,
            time: scene.time || beat.time,
            weather: scene.weather || beat.weather,
            view: scene.view,
            camera: scene.camera,
            lead: scene.lead,
            detailSubject: scene.detailSubject,
            objects: scene.objects,
            nodes: drawingNodes(scene.nodes).map((node) => (node.entityId && identity.changed.includes(String(node.entityId)) ? { ...node, appearanceChanged: true } : node)) as MotionRemotionNode[],
          },
          cast: motionCastIdentity(analysis.cast).filter((member) => scene.nodes.some((node) => node.entityId === member.key)),
          dialogueSpeakers: speakers,
          groups: scene.nodes.some((node) => node.anonymous || node.crowd) ? analysis.groups : undefined,
          placeNotes: previousAsset && previous.composition?.profileId === settings.profileId ? previous.composition.continuityNotes : undefined,
          genreLine: motionGenreSpec(analysis.videoGenre).GRAMMAR.picture,
          poseNotes: motionPoseNotes(settings.profileId, scene.nodes, scene.view, cast),
          animalFrames: motionAnimalFrames(settings.profileId, scene.nodes, cast),
          sheets: motionSceneSheets(state, scene),
          note: scene.drawingNote ?? state.notes![beat.id],
        };
        const bestKey = key + SCORE_BEST_SUFFIX;
        let best = saved && compositions[bestKey] ? restore(compositions[bestKey]) || saved : saved;
        let lastIssues: string[] = best?.score.issues || [];
        const assess = (raw: unknown) => {
          compositions[key] = raw;
          try {
            const built = normalizeSceneComposition(raw, key, inputKey, scene.purpose, scene.nodes, cast, width, height, true);
            built.composition.duration = seconds;
            const score = scoreOf(built, scene);
            const attempt = used() + 1;
            if (!best || score.score > best.score.score) {
              best = { value: built, score };
              compositions[bestKey] = raw;
            }
            if (score.passed) return { value: built, errors: [] };
            lastIssues = score.issues;
            opts.log(attempt < SCORE.ATTEMPTS ? SCORE.LOG_RETRY(index, allScenes.length, attempt, score.score, attempt === 1 ? SCORE.MODE_REWRITE : SCORE.MODE_FRESH) : SCORE.LOG_SCORE(index, allScenes.length, attempt, score.score));
            return { value: built, errors: score.issues };
          } catch (error) {
            lastIssues = [String((error as Error).message)];
            return { value: raw, errors: lastIssues };
          }
        };
        const firstPrompt = C.PROMPT(context) + RT_SHARED.SYMBOL_01BA47 + SCORE.CHECKLIST;
        const rewrite = (_base: string, _draft: unknown, errors: string[]) => firstPrompt + RT_SHARED.SYMBOL_01BA47 + (used() <= 1 ? SCORE.REWRITE(errors, best?.score.score ?? 0) : SCORE.FRESH(errors));
        let built: SceneBuild | undefined;
        try {
          built = used() >= 1 && lastIssues.length ? await ask(key, C.ARTIFACT, firstPrompt, assess, undefined, context, rewrite, SCORE.FRESH(lastIssues)) : await ask(key, C.ARTIFACT, firstPrompt, assess, undefined, context, rewrite);
        } catch (error) {
          if (!best || fatal(error)) throw error;
        }
        if (built) accept(built, scoreOf(built, scene), used() + 1);
        else accept(best!.value, best!.score, used());
      } catch (error) {
        const reason = String((error as Error).message);
        scene.generation = { ...generationInfo, status: RT_MAINTENANCE.FAILED, error: reason, attempts: used() };
        scene.build = { inputKey, status: RT_MAINTENANCE.FAILED, review: false, attempts: used(), error: reason };
        scene.composition = snapshot.composition;
        scene.crop = snapshot.crop;
        scene.focus = snapshot.focus;
        scene.aspect = snapshot.aspect;
        ready.delete(scene.id);
        processed.add(scene.id);
        if (!opts.signal?.aborted) save();
        if (fatal(error)) throw error;
        opts.log(C.LOG_ONCE_FAILED(allScenes.indexOf(scene) + 1, allScenes.length, reason));
        stepProgress(C.LOG_ONCE_FAILED(allScenes.indexOf(scene) + 1, allScenes.length, reason));
      }
    };
    if (!opts.sheetCarry) state.sheetRequests = 0;
    let sheetPending: Promise<void> | undefined;
    const ensureSheet = async () => {
      if (sheetPending) return sheetPending;
      const sheetRequests = state.sheetRequests || 0;
      if (sheetRequests >= SHEET.MAX_REQUESTS) return;
      const items = motionSheetCandidates(state, allScenes, settings.profileId);
      if (!items.length) {
        if (!sheetRequests) opts.log(SHEET.LOG_SKIP);
        return;
      }
      state.sheetRequests = sheetRequests + 1;
      sheetPending = (async () => {
        opts.log(
          SHEET.LOG_GATHER(
            items.length,
            items.map((item) => item.key),
          ),
        );
        const key = `${SHEET.ARTIFACT}${RT_SHARED.SYMBOL_3973E0}${state.sheetRequests}${RT_SHARED.SYMBOL_3973E0}${motionInputKey(items.map((item) => item.key))}`;
        try {
          const accepted = (await ask(key, SHEET.ARTIFACT, motionSheetPrompt(items, analysis.era, settings.profileId), (raw) => motionSheetAssess(raw, items))) as Record<string, MotionObjectSheetEntry>;
          state.sheet = { ...(state.sheet || {}), ...accepted };
          opts.log(SHEET.LOG_DONE(Object.keys(accepted).length, items.length));
          save();
        } catch (error) {
          if (fatal(error)) throw error;
          opts.log(SHEET.LOG_FAILED(String((error as Error).message)));
        } finally {
          sheetPending = undefined;
        }
      })();
      sheetPending.catch(() => undefined);
      return sheetPending;
    };
    const sound: Promise<unknown> =
      opts.sfx === true
        ? directMotionSound(result, analysis, { exec: opts.mainExec || opts.exec, signal: opts.signal, log: opts.log, ai: opts.ai, onAccepted: save }).then(
            () => {
              result.gen!.soundPlanVersion = MOTION_SOUND_CONFIG.VERSION;
              save();
              return undefined;
            },
            (error: unknown) => {
              if (opts.signal?.aborted || motionCaptchaError(error)) return error;
              opts.log(MOTION_SOUND_CONFIG.SKIPPED);
              return undefined;
            },
          )
        : Promise.resolve(undefined);
    const slots = new MotionPriorityPool(motionSceneWorkerIds(opts.exec).length);
    const timeline = new Map(planGroups.map((group, order) => [group.id, order]));
    const tasks: Promise<void>[] = [];
    let failure: { error: unknown } | undefined;
    const track = (work: Promise<void>) =>
      tasks.push(
        work.catch((error: unknown) => {
          failure ??= { error };
        }),
      );
    const draw = async (scene: (typeof allScenes)[number], priority: number, anchor?: (typeof allScenes)[number]) => {
      if (sheetPending && motionSheetCandidates(state, [scene], settings.profileId).length) await sheetPending;
      await slots.run(priority + (timeline.get(scene.beatId) || 0) / (planGroups.length + 1), () => drawScene(scene, anchor), opts.signal);
    };
    const anchors = new Map<string, Promise<(typeof allScenes)[number] | undefined>>();
    const anchorFor = (location: string, locationScenes: (typeof allScenes)[number][]) => {
      if (anchors.has(location)) return anchors.get(location)!;
      const usable = allScenes.filter((scene) => motionSceneLocation(scene) === location && !opts.onlyScenes?.includes(scene.id) && scene.build?.status !== COMMON_RUNTIME.SOURCE_TEXT_FAILED && scene.composition?.profileId === settings.profileId && scene.composition.profileRevision === profileRevision && scene.aspect === aspect && remotionSceneReadiness(scene, state).preview);
      const existing = usable.find(establishingScene) || usable[0];
      const promise = existing
        ? Promise.resolve(existing)
        : (async () => {
            for (const candidate of [...locationScenes].sort((a, b) => Number(establishingScene(b)) - Number(establishingScene(a)))) {
              locationScenes.splice(locationScenes.indexOf(candidate), 1);
              await draw(candidate, SCHEDULE.PRIORITY.ANCHOR);
              if (candidate.build?.status !== COMMON_RUNTIME.SOURCE_TEXT_FAILED && candidate.composition) return candidate;
            }
            return undefined;
          })();
      promise.catch(() => undefined);
      anchors.set(location, promise);
      return promise;
    };
    const scheduleGroup = (group: (typeof selectedGroups)[number]) => {
      allScenes = planGroups.flatMap((member) => state.scenes[member.id] || []);
      if (state.failures[group.id]) return;
      track(ensureSheet() || Promise.resolve());
      const candidates = (state.scenes[group.id] || []).filter((scene) => !opts.onlyScenes?.length || opts.onlyScenes.includes(scene.id));
      for (const [location, locationScenes] of motionScenesByLocation(candidates)) {
        const independent = locationScenes.filter((scene) => SCHEDULE.INDEPENDENT_FORMATS.includes(scene.format || "") || scene.view === SCHEDULE.DETAIL_VIEW);
        for (const scene of independent) {
          locationScenes.splice(locationScenes.indexOf(scene), 1);
          track(draw(scene, SCHEDULE.PRIORITY.SCENE));
        }
        if (!locationScenes.length) continue;
        const anchorReady = anchorFor(location, locationScenes);
        track(
          (async () => {
            const anchor = await anchorReady;
            await Promise.all(locationScenes.map((scene) => draw(scene, SCHEDULE.PRIORITY.SCENE, anchor)));
          })(),
        );
      }
    };
    for (const group of selectedGroups)
      track(
        (async () => {
          if (remotionGroupPlanCurrent(group.beats, analysis, state, opts.onlyScenes?.length ? undefined : opts.note)) await planGroup(group);
          else await slots.run(SCHEDULE.PRIORITY.PLAN + (timeline.get(group.id) || 0) / (planGroups.length + 1), () => planGroup(group), opts.signal);
          planned.add(group.id);
          scheduleGroup(group);
        })(),
      );
    for (let settled = 0; settled < tasks.length; ) {
      const batch = tasks.length;
      await Promise.all(tasks.slice(settled, batch));
      settled = batch;
    }
    if (sheetPending) await sheetPending;
    opts.log(SCHEDULE.LOG_UTILIZATION(Math.round(slots.utilization() * 100), slots.size));
    if (failure) {
      await sound;
      throw failure.error;
    }
    const scopedScenes = () => allScenes.filter((scene) => selected.has(scene.beatId) && (!opts.onlyScenes?.length || opts.onlyScenes.includes(scene.id)));
    const requireDrawings = () => {
      const missing = scopedScenes()
        .filter((scene) => scene.build?.status !== RUNTIME_VALUES.ACCEPTED_070C160A || !remotionSceneReadiness(scene, state).preview)
        .map((scene) => scene.id);
      if (missing.length) {
        save();
        throw new Error(C.INCOMPLETE(missing));
      }
      if (Object.keys(state.failures).length)
        throw new Error(
          Object.entries(state.failures)
            .map(([id, reason]) => V.LOG_FAILED(id, reason))
            .join(RT_SHARED.SYMBOL_01BA47),
        );
    };
    try {
      requireDrawings();
    } catch (error) {
      await sound;
      throw error;
    }
    const scoped = scopedScenes(),
      complete = scoped.filter((scene) => ready.has(scene.id) && scene.build?.status !== RT_MAINTENANCE.FAILED).length;
    const summary = C.LOG_COMPLETE_SUMMARY(complete, scoped.length);
    opts.log(summary);
    opts.progress?.(complete / Math.max(1, scoped.length), summary);
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
    const soundError = await sound;
    if (soundError) throw soundError;
    return result;
  }
};
