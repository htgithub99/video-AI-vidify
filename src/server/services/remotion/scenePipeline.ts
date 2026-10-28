import { RUNTIME_TEXT as RT_SHARED } from "../../../constants/runtime/shared.js";
import { RUNTIME_TEXT as RT_SERVER } from "../../../constants/runtime/server.js";
import { stringifyJson } from "../../../lib/jsonStringify.js";
import fs from "node:fs";
import path from "node:path";
import { MOTION_VISUAL as V } from "../../../constants/motionVisual.js";
import { MOTION_REMOTION_LAYOUT as L } from "../../../constants/motionRemotionLayout.js";
import { MOTION_REMOTION_PROMPTS as P, MOTION_REMOTION_SCHEMAS } from "../../../constants/motionRemotionPrompts.js";
import { MOTION_SCENE_COMPOSITION as C } from "../../../constants/motionSceneComposition.js";
import { MOTION_SCENE_DESIGN as D } from "../../../constants/motionSceneDesign.js";
import { MOTION_QA as Q } from "../../../constants/motionQa.js";
import { motionVisualCheckBlocks } from "../../../lib/motionQa.js";
import { motionIllustrationDirection, motionCompositionReference } from "../../../lib/motionIllustrationProfile.js";
import { normalizeMotionSceneDesign } from "../../../lib/motionSceneDesign.js";
import { MOTION_PRODUCTION } from "../../../constants/motionProduction.js";
import { MOTION_AI_ROLE } from "../../../constants/motionAiFallback.js";
import { motionVisualSettingsFor } from "../../../lib/motionVisual.js";
import { normalizeMotionRenderBehavior } from "../../../lib/motionRenderBehavior.js";
import { normalizeSceneComposition, mergeSceneCompositionDraft, motionCompositionMissingChannels } from "../../../lib/motionSceneComposition.js";
import { createCompositionGeometryInspector, MotionCompositionMeasurementError } from "./compositionGeometryInspector.js";
import { remotionSceneReadiness } from "../../../lib/motionRemotion.js";
import { puppetBeatLines } from "../../../lib/motionPuppet.js";
import { motionNarratorCastKey } from "../../../lib/motionVoice.js";
import { motionStoryEventLedger } from "../../../lib/motionStoryContinuity.js";
import { runMotionAi, mapMotionAiPool, writeMotionAiDebug, motionCaptchaError } from "../motionStoryService.js";
import { recoverMotionAiContractState, requestMotionAiContract, type MotionAiResponseContract } from "../motionAiContractService.js";
import { isTerminalMotionAiError } from "../chatSubmissionRecovery.js";
import { motionInputKey } from "../motionFileUtils.js";
import { motionTaskCheckpoint } from "../motionTaskCheckpoint.js";
import { emptyGen } from "../puppet/genState.js";
import { mergeRemotionSceneDraft, remotionScenesFromDraft } from "./sceneContract.js";
import { remotionBeatKey, remotionGroupKey, remotionGroupPlanCurrent, remotionCompositionKey } from "./sceneKeys.js";
import { motionVisualBeatGroups, motionScenePacingRule, motionScenePacing } from "../../../lib/motionScenePacing.js";
import { MOTION_SCENE_PACING as PACING } from "../../../constants/motionScenePacing.js";
import { renderRemotionStill } from "../motionRemotionRenderService.js";
import { getMotionWorkDirectory } from "../motionLibraryService.js";
import type { MotionAiExecution, MotionAiLog, MotionStoryAnalysis, MotionStoryScript } from "../../../types/motionVideo.js";
import type { MotionAiContractState } from "../../../types/motionAiContract.js";
import type { MotionRemotionState, MotionRenderBehavior, MotionSceneDesign } from "../../../types/motionVisual.js";
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
  restart?: boolean;
  onlyBeats?: string[];
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
    type Checkpoint = { state: MotionRemotionState; requests: Record<string, MotionAiContractState>; compositions?: Record<string, unknown>; designs?: Record<string, MotionSceneDesign> };
    const checkpoint = motionTaskCheckpoint<Checkpoint>(opts.scope, V.PROJECT_FOLDER, [PACING.REVISION, C.REVISION, profileRevision, settings, aspect]);
    const saved = opts.restart ? undefined : checkpoint.read() || motionTaskCheckpoint<Checkpoint>(opts.scope, V.PROJECT_FOLDER, [PACING.REVISION, C.REVISION, profileRevision, settings, analysis.cast, analysis.places, script.beats, aspect, opts.note]).read();
    const incoming = script.gen?.remotion;
    const carried = incoming && (!saved?.state || (incoming.updatedAt || 0) > (saved.state.updatedAt || 0)) ? incoming : saved?.state || incoming;
    const state: MotionRemotionState = !opts.restart && carried?.version === V.VERSION && stringifyJson(carried.settings) === stringifyJson(settings) ? structuredClone(carried) : { version: V.VERSION, settings, assets: {}, scenes: {}, inputKeys: {}, failures: {} };
    const requests = opts.restart ? {} : saved?.requests || {};
    const compositions: Record<string, unknown> = opts.restart ? {} : saved?.compositions || {};
    const designs: Record<string, MotionSceneDesign> = opts.restart ? {} : saved?.designs || {};
    for (const key of Object.keys(requests)) requests[key] = recoverMotionAiContractState(requests[key], `${V.RECOVERY_REVISION}${RT_SHARED.SYMBOL_E7AC07}${C.REVISION}${RT_SHARED.SYMBOL_E7AC07}${profileRevision}`);
    state.notes ||= {};
    state.drafts ||= {};
    state.renderBehavior = normalizeMotionRenderBehavior(opts.renderBehavior ?? script.gen?.renderBehavior, script.gen?.characterMotion);
    const result: MotionStoryScript = { ...script, visualSettings: settings, gen: { ...(script.gen || emptyGen()), renderBehavior: state.renderBehavior, puppet: undefined, remotion: state, failed: [] } };
    const save = () => {
      opts.signal?.throwIfAborted();
      state.updatedAt = Math.max(Date.now(), (state.updatedAt || 0) + 1);
      result.gen!.failed = Object.keys(state.failures);
      checkpoint.save({ state, requests, compositions, designs });
      opts.partial?.(structuredClone(result));
    };
    const ask = async (key: string, artifact: string, prompt: string, assess: MotionAiResponseContract["assess"], images?: Parameters<typeof runMotionAi>[5]) => {
      const drawing = artifact === C.ARTIFACT || artifact === D.ARTIFACT;
      const exec = { ...(drawing ? opts.exec : opts.mainExec || opts.exec), role: drawing ? MOTION_AI_ROLE.DRAW : MOTION_AI_ROLE.MAIN };
      const contract: MotionAiResponseContract = {
        schema: MOTION_REMOTION_SCHEMAS[artifact],
        attempts: exec.strictProvider ? V.REQUEST_BUDGET : V.REQUEST_ATTEMPTS,
        routeAttempts: exec.strictProvider ? V.REQUEST_BUDGET : V.REQUEST_ATTEMPTS,
        budget: V.REQUEST_BUDGET,
        state: (requests[key] ||= { rejected: 0, errors: [] }),
        checkpoint: (value) => {
          requests[key] = value;
          save();
        },
        assess,
        start: artifact === C.ARTIFACT && compositions[key] && requests[key]?.errors.length ? (base) => C.REPAIR(base, compositions[key], requests[key].errors) : undefined,
        repair: (base, draft, errors) => (artifact === C.ARTIFACT ? C.REPAIR(base, draft, errors) : P.REPAIR(base, draft, errors)),
        rejected: async (raw, draft, errors, route, attempt) => {
          opts.log(V.LOG_REJECTED(artifact, errors));
          await writeMotionAiDebug(`${artifact}${RT_SHARED.SYMBOL_3973E0}${key}${RT_SHARED.SYMBOL_3973E0}${attempt}`, { stage: artifact, provider: route.provider, model: route.model, errors, response: raw, draft });
        },
        failure: (errors) => new Error(P.ERROR(key, errors)),
      };
      return opts.ai ? requestMotionAiContract(prompt, exec, (question) => opts.ai!(question, artifact, exec, opts.signal, opts.log, images), contract, opts.signal) : runMotionAi(prompt, artifact, exec, opts.signal, opts.log, images, 0, contract);
    };
    const fatal = (error: unknown) => error instanceof MotionCompositionMeasurementError || opts.signal?.aborted || motionCaptchaError(error) || (isTerminalMotionAiError(error, opts.signal) && !(error as Record<string, unknown>)?.[MOTION_PRODUCTION.CONTRACT_EXHAUSTED]);
    const beats = script.beats.filter((beat) => (!opts.onlyBeats?.length || opts.onlyBeats.includes(beat.id)) && (!opts.onlyLocations?.length || opts.onlyLocations.includes(beat.place || "")));
    const planGroups = motionVisualBeatGroups(script);
    const selectedIds = new Set(beats.map((beat) => beat.id));
    const selectedGroups = planGroups.filter((group) => group.beats.some((beat) => selectedIds.has(beat.id)));
    state.pacingRevision = PACING.REVISION;
    const cast = new Set(analysis.cast.map((member) => member.key));
    opts.log(V.LOG_MODE(settings.mode));
    opts.log(C.LOG);
    if (!opts.review) opts.log(V.LOG_REVIEW_OFF);
    opts.log(PACING.LOG(planGroups.length, script.beats.length, PACING.TEXT.vi[motionScenePacing(settings)]));
    await mapMotionAiPool(selectedGroups, async (group) => {
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
        if (!remotionGroupPlanCurrent(group.beats, analysis, state, opts.note)) {
          const lines = group.beats.flatMap((member) => puppetBeatLines(member, motionNarratorCastKey(analysis)));
          const context = {
            profile: V.PROFILES[settings.profileId].direction,
            artDirection: motionIllustrationDirection(settings.profileId, RT_SERVER.PLANNING),
            era: analysis.era,
            beat: { id: beat.id, scenePlan: beat.scenePlan, action: beat.action, time: beat.time, weather: beat.weather, shot: beat.shot },
            beats: group.beats.map((member) => ({ id: member.id, scenePlan: member.scenePlan, action: member.action, time: member.time, weather: member.weather })),
            pacing: motionScenePacingRule(settings, group.seconds),
            lines: lines.map((line) => ({ id: line.key, text: line.text })),
            cast: analysis.cast,
            place: analysis.places.find((place) => place.key === beat.place),
            priorFacts: motionStoryEventLedger(script.beats.slice(0, script.beats.indexOf(beat))),
            note,
          };
          const draft = await ask(`${RT_SERVER.PLAN}${inputKey}`, V.ARTIFACT_SCENE, P.SCENE(context) + RT_SHARED.SYMBOL_01BA47 + C.PLAN_POLICY, (raw) => {
            const checked = mergeRemotionSceneDraft(raw, state.drafts![inputKey] || [], lines, cast);
            state.drafts![inputKey] = checked.drafts;
            return checked;
          });
          state.scenes[beat.id] = remotionScenesFromDraft(draft, beat.id, beat.place, lines, inputKey);
          for (const scene of state.scenes[beat.id]) {
            const from = lines.findIndex((line) => line.key === scene.fromLineId),
              to = lines.findIndex((line) => line.key === scene.toLineId);
            scene.sourceBeatIds = [...new Set(lines.slice(from, to + 1).map((line) => line.beatId))];
          }
          for (const member of group.beats) {
            state.inputKeys[member.id] = remotionBeatKey(member, analysis);
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
    });
    const allScenes = planGroups.flatMap((group) => state.scenes[group.id] || []);
    const selected = new Set(selectedGroups.filter((group) => !state.failures[group.id]).map((group) => group.id));
    const groups = new Map<string, typeof allScenes>();
    for (const scene of allScenes) {
      const location = scene.locationKey || scene.place || scene.beatId;
      groups.set(location, [...(groups.get(location) || []), scene]);
    }
    const ready = new Set(allScenes.filter((scene) => scene.composition && scene.aspect === aspect && remotionSceneReadiness(scene, state).preview).map((scene) => scene.id));
    const originalCompositionKeys = new Map(allScenes.map((scene) => [scene.id, scene.composition?.inputKey]));
    const sceneFailures = new Map<string, string>();
    await mapMotionAiPool([...groups.values()], async (scenes) => {
      for (let index = 0; index < scenes.length; index++) {
        const scene = scenes[index];
        if (!selected.has(scene.beatId)) continue;
        opts.signal?.throwIfAborted();
        const beat = script.beats.find((beat) => beat.id === scene.beatId)!;
        const previous = scenes
          .slice(0, index)
          .reverse()
          .find((other) => other.composition && state.assets[other.composition.assetKey]);
        const previousAsset = previous?.composition && state.assets[previous.composition.assetKey];
        const inputKey = remotionCompositionKey(scene, analysis, width, height, state.notes![beat.id]);
        const legacyInputKey = motionInputKey([C.REVISION, scene.sourceKey, scene.purpose, scene.environment, scene.nodes, scene.text, settings, V.PROFILES[settings.profileId].revision, width, height, state.notes![beat.id], previous && originalCompositionKeys.get(previous.id)]);
        const key = `${RT_SERVER.COMPOSITION}${inputKey}`;
        opts.log(C.LOG_DRAW(allScenes.indexOf(scene) + 1, allScenes.length, scene.purpose));
        try {
          const existingReady = remotionSceneReadiness(scene, state).preview;
          const existingGeometryErrors = existingReady && scene.composition && scene.composition.geometryRevision !== C.GEOMETRY_REVISION ? await geometry.check(state.assets[scene.composition.assetKey], scene.composition) : [];
          if (![inputKey, legacyInputKey].includes(scene.composition?.inputKey || "") || !existingReady || existingGeometryErrors.length) {
            const designKey = `${RT_SERVER.DESIGN}${inputKey}`;
            if (existingGeometryErrors.length && scene.composition?.design) {
              designs[designKey] = scene.composition.design;
              compositions[key] ||= { svg: state.assets[scene.composition.assetKey].svg, layers: scene.composition.layers, animations: scene.composition.animations, design: scene.composition.design, continuityNotes: scene.composition.continuityNotes };
            }
            if (!designs[designKey]) {
              opts.log(D.LOG(allScenes.indexOf(scene) + 1, allScenes.length));
              designs[designKey] = await ask(
                designKey,
                D.ARTIFACT,
                D.PROMPT({
                  aspect,
                  profile: V.PROFILES[settings.profileId].direction,
                  artDirection: motionIllustrationDirection(settings.profileId, RT_SERVER.DESIGN_A77DE8),
                  era: analysis.era,
                  purpose: scene.purpose,
                  text: scene.text,
                  environment: scene.environment,
                  nodes: scene.nodes,
                  cast: analysis.cast.filter((member) => scene.nodes.some((node) => node.entityId === member.key)),
                  continuity: previous?.composition ? { design: previous.composition.design, notes: previous.composition.continuityNotes, layers: previous.composition.layers } : undefined,
                  note: state.notes![beat.id],
                }),
                (raw) => {
                  const draft = (compositions[designKey] = { ...((compositions[designKey] as Record<string, unknown>) || {}), ...raw });
                  try {
                    return { value: normalizeMotionSceneDesign(draft, scene.nodes), errors: [] };
                  } catch (error) {
                    return { value: draft, errors: [String((error as Error).message)] };
                  }
                },
              );
              delete compositions[designKey];
              save();
            }
            const continuitySvg = previousAsset && previousAsset.svg.length <= C.CONTINUITY_SVG_LIMIT ? previousAsset.svg : undefined;
            const context = {
              width,
              height,
              viewBox: `${RT_SHARED.VALUE_0_0}${width}${RT_SHARED.SYMBOL_36A9E7}${height}`,
              profile: V.PROFILES[settings.profileId].direction,
              artDirection: motionIllustrationDirection(settings.profileId, RT_SHARED.DRAWING),
              drawingReference: continuitySvg && previous?.composition?.design?.format === designs[designKey].format ? undefined : motionCompositionReference(settings.profileId, designs[designKey]),
              design: designs[designKey],
              era: analysis.era,
              place: analysis.places.find((place) => place.key === beat.place),
              scene: { purpose: scene.purpose, text: scene.text, environment: scene.environment, time: scene.time || beat.time, weather: scene.weather || beat.weather, view: scene.view, nodes: scene.nodes },
              cast: analysis.cast.filter((member) => scene.nodes.some((node) => node.entityId === member.key)),
              dialogueSpeakers: [...new Set(script.beats.filter((member) => (scene.sourceBeatIds || [scene.beatId]).includes(member.id)).flatMap((member) => member.utterances?.filter((line) => line.role === RT_SERVER.DIALOGUE).map((line) => line.speaker) || []))] as string[],
              continuity: previousAsset ? { text: previous.text, layers: previous.composition!.layers, design: previous.composition!.design, notes: previous.composition!.continuityNotes, svg: continuitySvg } : undefined,
              note: state.notes![beat.id],
            };
            const assess = async (raw: unknown) => {
              try {
                const draft = mergeSceneCompositionDraft(compositions[key], raw);
                compositions[key] = draft;
                const built = normalizeSceneComposition({ ...draft, design: designs[designKey] }, key, inputKey, scene.purpose, scene.nodes, cast, width, height);
                const errors = await geometry.check(built.asset, built.composition);
                if (errors.length) return { value: draft, errors };
                built.composition.geometryRevision = C.GEOMETRY_REVISION;
                return { value: built, errors: [] };
              } catch (error) {
                if (error instanceof MotionCompositionMeasurementError) throw error;
                return { value: compositions[key] || raw, errors: [String((error as Error).message)] };
              }
            };
            const recovered = compositions[key] && (await assess(compositions[key]));
            if (recovered?.errors.length) (requests[key] ||= { rejected: 0, errors: [] }).errors = recovered.errors;
            const built = recovered && !recovered.errors.length ? recovered.value : await ask(key, C.ARTIFACT, C.PROMPT(context), assess);
            state.assets[key] = built.asset;
            delete compositions[key];
            scene.composition = built.composition;
            scene.aspect = aspect;
            save();
          }
          if (scene.composition) {
            scene.composition.inputKey = inputKey;
            scene.composition.geometryRevision = C.GEOMETRY_REVISION;
            state.assets[scene.composition.assetKey].inputKey = inputKey;
          }
          const missingChannels = motionCompositionMissingChannels(scene, state.renderBehavior);
          if (missingChannels.length) {
            const composition = scene.composition!;
            const asset = state.assets[composition.assetKey];
            const motionKey = `${RT_SERVER.MOTION}${motionInputKey([asset.svg, composition.animations, missingChannels])}`;
            opts.log(C.LOG_MOTION_PATCH(scene.id));
            const patched = await ask(motionKey, C.ARTIFACT, C.REPAIR(C.PROMPT({ profile: V.PROFILES[settings.profileId].direction, scene: { nodes: scene.nodes, text: scene.text }, renderBehavior: state.renderBehavior }), { svg: asset.svg, layers: composition.layers, animations: composition.animations, design: composition.design }, [C.MOTION_REQUIRED(missingChannels)]), (raw) => {
              try {
                const incoming = Array.isArray(raw?.animations) ? raw.animations.filter((animation: Record<string, unknown>) => missingChannels.includes(animation?.channel as "actor" | "effect")) : [];
                const animations = [...composition.animations, ...incoming];
                const built = normalizeSceneComposition({ svg: asset.svg, layers: composition.layers, design: composition.design, continuityNotes: composition.continuityNotes, animations }, asset.key, inputKey, scene.purpose, scene.nodes, cast, width, height);
                const missing = motionCompositionMissingChannels({ ...scene, composition: built.composition }, state.renderBehavior);
                return missing.length ? { value: { svg: asset.svg, layers: composition.layers, design: composition.design, animations }, errors: [C.MOTION_REQUIRED(missing)] } : { value: built, errors: [] };
              } catch (error) {
                return { value: { animations: raw?.animations }, errors: [String((error as Error).message)] };
              }
            });
            scene.composition = { ...patched.composition, geometryRevision: C.GEOMETRY_REVISION };
            save();
          }
          if (opts.review) {
            for (let attempt = 0; attempt < 3; attempt++) {
              const reviewKey = motionInputKey([scene.composition, scene.text, settings]);
              if (scene.reviewKey === reviewKey) break;
              const spec = remotionSceneReadiness(scene, state).preview;
              if (!spec) throw new Error(V.INVALID_SPEC);
              const file = path.join(getMotionWorkDirectory(motionInputKey([opts.scope, reviewKey])), `${reviewKey}${RT_SERVER.PNG_B98B80}`);
              opts.log(V.LOG_REVIEW(allScenes.indexOf(scene) + 1, allScenes.length));
              let review: { ok: boolean; issues: string[]; checks?: { ok?: boolean; category?: string; evidence?: string; problem?: string }[] };
              try {
                await (opts.still || renderRemotionStill)(spec, file, 0, opts.signal);
                review = await ask(
                  `${RT_SERVER.REVIEW_E375B5}${reviewKey}`,
                  V.ARTIFACT_REVIEW,
                  P.REVIEW({ narration: scene.text, nodes: scene.nodes, design: scene.composition!.design, profile: V.PROFILES[settings.profileId].direction, artDirection: motionIllustrationDirection(settings.profileId, RT_SHARED.REVIEW) }),
                  (raw) => ({ value: raw, errors: typeof raw?.ok === "boolean" && Array.isArray(raw.issues) && raw.issues.every((issue: unknown) => typeof issue === "string") && (raw.ok || raw.issues.length) ? [] : [P.REVIEW_REQUIRED] }),
                  [{ name: `${scene.id}${RT_SERVER.PNG_B98B80}`, mimeType: RT_SERVER.IMAGE_PNG, path: file }],
                );
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
              if (attempt === 2) throw new Error(P.ERROR(scene.id, review.issues));
              const repairKey = `${key}${RT_SERVER.REPAIR}${reviewKey}`;
              opts.log(V.LOG_REPAIR(scene.id));
              compositions[repairKey] ||= { svg: state.assets[scene.composition!.assetKey].svg, layers: scene.composition!.layers, animations: scene.composition!.animations, design: scene.composition!.design, continuityNotes: scene.composition!.continuityNotes };
              const fixed = await ask(
                repairKey,
                C.ARTIFACT,
                C.PROMPT({ width, height, narration: scene.text, nodes: scene.nodes, design: scene.composition!.design, profile: V.PROFILES[settings.profileId].direction, artDirection: motionIllustrationDirection(settings.profileId, RT_SHARED.DRAWING), acceptedScene: { ...scene.composition, svg: state.assets[scene.composition!.assetKey].svg }, repairOnly: review.issues }),
                async (raw) => {
                  try {
                    const draft = mergeSceneCompositionDraft(compositions[repairKey], raw);
                    compositions[repairKey] = draft;
                    const built = normalizeSceneComposition(draft, repairKey, repairKey, scene.purpose, scene.nodes, cast, width, height);
                    const errors = await geometry.check(built.asset, built.composition);
                    if (errors.length) return { value: draft, errors };
                    const missing = motionCompositionMissingChannels({ ...scene, composition: built.composition }, state.renderBehavior);
                    return { value: built, errors: missing.length ? [C.MOTION_REQUIRED(missing)] : [] };
                  } catch (error) {
                    if (error instanceof MotionCompositionMeasurementError) throw error;
                    return { value: compositions[repairKey], errors: [String((error as Error).message)] };
                  }
                },
              );
              state.assets[repairKey] = fixed.asset;
              delete compositions[repairKey];
              scene.composition = { ...fixed.composition, inputKey, geometryRevision: C.GEOMETRY_REVISION };
              state.assets[repairKey].inputKey = inputKey;
              save();
            }
          }
          const remainingChannels = motionCompositionMissingChannels(scene, state.renderBehavior);
          if (remainingChannels.length) throw new Error(C.MOTION_PENDING(scene.id, remainingChannels));
          ready.add(scene.id);
          sceneFailures.delete(scene.id);
          if (!allScenes.some((other) => other.beatId === beat.id && sceneFailures.has(other.id))) delete state.failures[beat.id];
          save();
          opts.log(V.LOG_READY(ready.size, allScenes.length));
          opts.progress?.(ready.size / Math.max(1, allScenes.length), V.LOG_READY(ready.size, allScenes.length));
        } catch (error) {
          ready.delete(scene.id);
          state.failures[beat.id] = String((error as Error).message);
          sceneFailures.set(scene.id, state.failures[beat.id]);
          if (!opts.signal?.aborted) save();
          if (fatal(error)) throw error;
          opts.log(V.LOG_FAILED(scene.id, state.failures[beat.id]));
        }
      }
    });
    state.compositionRevision = C.REVISION;
    state.profileRevision = V.PROFILES[settings.profileId].revision;
    if (!Object.keys(state.failures).length && planGroups.every((group) => remotionGroupPlanCurrent(group.beats, analysis, state))) {
      for (const group of planGroups) {
        const key = remotionGroupKey(group.beats, analysis, state);
        for (const beat of group.beats) state.inputKeys[beat.id] = remotionBeatKey(beat, analysis);
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
    return result;
  } finally {
    await geometry.close?.();
  }
};
