import { MOTION_REMOTION_LAYOUT as L } from "../../../constants/motionRemotionLayout.js";
import { MOTION_RENDER_BEHAVIOR as B } from "../../../constants/motionRenderBehavior.js";
import { remotionContact, remotionMount, remotionRole, remotionObjectIdentity } from "../../../lib/motionRemotionGeometry.js";
import { remotionSceneEffects, remotionEffectGeometry } from "../../../lib/motionRemotionEffects.js";
import { resolveRemotionContinuity, remotionObjectCatalog } from "./sceneContinuity.js";
import { MOTION_VISUAL as V } from "../../../constants/motionVisual.js";
import { MOTION_REMOTION_PROMPTS as P, MOTION_REMOTION_SCHEMAS } from "../../../constants/motionRemotionPrompts.js";
import { motionVisualSettingsFor } from "../../../lib/motionVisual.js";
import { normalizeMotionVector } from "../../../lib/motionVectorAsset.js";
import { canReuseRemotionCharacter, layoutRemotionNodes, remotionAssetAnchors, remotionSceneReadiness } from "../../../lib/motionRemotion.js";
import { MOTION_PRODUCTION } from "../../../constants/motionProduction.js";
import { puppetBeatLines } from "../../../lib/motionPuppet.js";
import { motionNarratorCastKey } from "../../../lib/motionVoice.js";
import type { MotionAiExecution, MotionAiLog, MotionStoryAnalysis, MotionStoryScript } from "../../../types/motionVideo.js";
import type { MotionAiContractState } from "../../../types/motionAiContract.js";
import type { MotionRemotionScene, MotionRemotionState, MotionVectorAsset, MotionRenderBehavior } from "../../../types/motionVisual.js";
import { normalizeMotionRenderBehavior } from "../../../lib/motionRenderBehavior.js";
import { remotionRegions, remotionRect } from "../../../lib/motionRemotionGeometry.js";
import { runMotionAi, mapMotionAiPool, writeMotionAiDebug, motionCaptchaError } from "../motionStoryService.js";
import { motionInputKey } from "../motionFileUtils.js";
import { motionTaskCheckpoint } from "../motionTaskCheckpoint.js";
import { emptyGen } from "../puppet/genState.js";
import { isTerminalMotionAiError } from "../chatSubmissionRecovery.js";
import { recoverMotionAiContractState, requestMotionAiContract, type MotionAiResponseContract } from "../motionAiContractService.js";
import { compileRemotionStory } from "./storyCompiler.js";
import { renderRemotionStill } from "../motionRemotionRenderService.js";
import { getMotionWorkDirectory } from "../motionLibraryService.js";
import path from "node:path";
import fs from "node:fs";
import { mergeRemotionSceneDraft, remotionScenesFromDraft } from "./sceneContract.js";
import { remotionBeatKey, remotionBeatPlanCurrent } from "./sceneKeys.js";
import { createVectorCutoutInspector } from "./vectorCutoutInspector.js";
export interface RemotionSceneOptions {
  exec: MotionAiExecution;
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
}
export const buildRemotionScenes = async (script: MotionStoryScript, analysis: MotionStoryAnalysis, opts: RemotionSceneOptions): Promise<MotionStoryScript> => {
  const settings = motionVisualSettingsFor({ analysis, script });
  if (settings.mode !== "remotion") throw new Error(V.INVALID);
  const checkpoint = motionTaskCheckpoint<{ state: MotionRemotionState; requests: Record<string, MotionAiContractState> }>(opts.scope, V.PROJECT_FOLDER, [L.SCENE_REVISION, settings, analysis.cast, analysis.places, script.beats, opts.note]);
  const saved = opts.restart ? undefined : checkpoint.read() || motionTaskCheckpoint<{ state: MotionRemotionState; requests: Record<string, MotionAiContractState> }>(opts.scope, V.PROJECT_FOLDER, [settings, analysis.cast, analysis.places, script.beats, opts.note]).read();
  const incoming = script.gen?.remotion;
  const carried = incoming && (!saved?.state || (incoming.updatedAt || 0) > (saved.state.updatedAt || 0)) ? incoming : saved?.state || incoming;
  const state: MotionRemotionState = !opts.restart && carried?.version === V.VERSION && JSON.stringify(carried.settings) === JSON.stringify(settings) ? structuredClone(carried) : { version: V.VERSION, settings, assets: {}, scenes: {}, inputKeys: {}, failures: {} };
  const requests = opts.restart ? {} : saved?.requests || {};
  for (const key of Object.keys(requests)) requests[key] = recoverMotionAiContractState(requests[key], V.RECOVERY_REVISION);
  state.drafts ||= {};
  state.notes ||= {};
  state.renderBehavior = normalizeMotionRenderBehavior(opts.renderBehavior ?? script.gen?.renderBehavior, script.gen?.characterMotion);
  const result: MotionStoryScript = { ...script, visualSettings: settings, gen: { ...(script.gen || emptyGen()), renderBehavior: state.renderBehavior, puppet: undefined, remotion: state, failed: [] } };
  const save = () => {
    opts.signal?.throwIfAborted();
    state.updatedAt = Math.max(Date.now(), (state.updatedAt || 0) + 1);
    result.gen!.failed = Object.keys(state.failures);
    checkpoint.save({ state, requests });
    opts.partial?.(structuredClone(result));
  };
  const cutouts = createVectorCutoutInspector(opts.signal);
  try {
    const profile = V.PROFILES[settings.profileId];
    const styleChanged = (state.profileRevision ?? 0) !== profile.revision;
    let invalidated = false;
    const entityKeys = new Set(Object.values(state.scenes).flatMap((scenes) => scenes.flatMap((scene) => scene.nodes.filter((node) => node.kind !== "label").map((node) => node.assetKey))));
    if (styleChanged && Object.keys(state.assets).length) opts.log(V.LOG_STYLE_REFRESH(profile.vi, Object.keys(state.assets).length));
    for (const [key, cachedAsset] of Object.entries(state.assets)) {
      if (!styleChanged && !entityKeys.has(key) && !/^(?:character|prop):/.test(key)) continue;
      const issue = styleChanged ? V.STYLE_REFRESH_REASON : await cutouts.check(cachedAsset);
      if (!issue) continue;
      (state.invalidAssets ||= {})[key] = { asset: cachedAsset, reason: issue };
      delete state.assets[key];
      for (const scenes of Object.values(state.scenes)) for (const scene of scenes) if (scene.backgroundKey === key || scene.nodes.some((node) => node.assetKey === key)) delete scene.reviewKey;
      if (!styleChanged) opts.log(V.CUTOUT.LOG_INVALIDATED(cachedAsset.description || key, issue));
      invalidated = true;
    }
    const revisionChanged = state.profileRevision !== profile.revision;
    state.profileRevision = profile.revision;
    if (invalidated || revisionChanged) save();
    const ask = async (key: string, artifact: string, prompt: string, assess: MotionAiResponseContract["assess"], images?: Parameters<typeof runMotionAi>[5], repair?: MotionAiResponseContract["repair"], start?: MotionAiResponseContract["start"]) => {
      const contract: MotionAiResponseContract = {
        schema: MOTION_REMOTION_SCHEMAS[artifact],
        attempts: V.REQUEST_ATTEMPTS,
        routeAttempts: V.REQUEST_ATTEMPTS,
        budget: V.REQUEST_BUDGET,
        state: (requests[key] ||= { rejected: 0, errors: [] }),
        checkpoint: (value) => {
          requests[key] = value;
          save();
        },
        assess,
        start,
        repair: repair || ((base, draft, errors) => P.REPAIR(base, draft, errors)),
        rejected: async (raw, value, errors, route, attempt) => {
          opts.log(V.LOG_REJECTED(artifact, errors));
          await writeMotionAiDebug(`${artifact}-${key}-${attempt}`, { stage: artifact, provider: route.provider, model: route.model, errors, response: raw, draft: value });
        },
        failure: (errors) => new Error(P.ERROR(key, errors)),
      };
      return opts.ai ? requestMotionAiContract(prompt, opts.exec, (question) => opts.ai!(question, artifact, opts.exec, opts.signal, opts.log, images), contract, opts.signal) : runMotionAi(prompt, artifact, opts.exec, opts.signal, opts.log, images, 0, contract);
    };
    const pending = new Map<string, Promise<MotionVectorAsset>>();
    const asset = (key: string, context: Record<string, unknown>, required: string[]): Promise<MotionVectorAsset> => {
      const inputKey = motionInputKey([settings, context, required, L.REVISION]);
      if (state.assets[key]?.inputKey === inputKey && (!Array.isArray(context.essentialRegions) || context.essentialRegions.every((region) => !!state.assets[key].regions?.[String(region)])) && required.every((anchor) => state.assets[key].anchors?.[anchor])) return Promise.resolve(state.assets[key]);
      const active = pending.get(key);
      if (active) return active;
      const job = (async () => {
        opts.log(V.LOG_ASSET(String(context.name || key)));
        let candidate = state.assets[key] && (state.assets[key].inputKey === inputKey || context.member || (context.kind !== "background" && state.assets[key].layerRevision === L.REVISION)) ? { ...state.assets[key], inputKey } : undefined;
        const regionsRequired = Array.isArray(context.essentialRegions) ? (context.essentialRegions as string[]) : [];
        const anchorPrompt = () => (candidate ? (regionsRequired.length ? L.META_REPAIR(candidate.svg, candidate.anchors, candidate.regions, required, regionsRequired) : P.ANCHOR_REPAIR(candidate.svg, required, candidate.anchors)) : P.ASSET(context));
        const value = await ask(
          inputKey,
          V.ARTIFACT_ASSET,
          P.ASSET(context),
          async (raw) => {
            let normalized: MotionVectorAsset;
            try {
              normalized = candidate || normalizeMotionVector(raw?.svg, key, inputKey, String(context.description || context.name || ""));
            } catch (error) {
              return { value: raw, errors: [String((error as Error).message)] };
            }
            if (context.kind !== "background") {
              const issue = await cutouts.check(normalized);
              if (issue) return { value: raw, errors: [V.SVG_ERROR(issue)] };
            }
            try {
              normalized.anchors = remotionAssetAnchors({ ...normalized.anchors, ...remotionAssetAnchors(raw?.anchors) });
              normalized.regions = { ...normalized.regions, ...remotionRegions(raw?.regions) };
              const bounds = normalized.bounds || remotionRect(raw?.bounds);
              if (bounds) normalized.bounds = bounds;
              normalized.layerRevision = L.REVISION;
              if (context.state) normalized.stateKey = motionInputKey(context.state);
              candidate = normalized;
              state.assets[key] = normalized;
              remotionAssetAnchors(normalized.anchors, required);
              if (regionsRequired.some((region) => !normalized.regions?.[region])) return { value: normalized, errors: [L.REGIONS_ERROR] };
              return { value: normalized, errors: [] };
            } catch (error) {
              return { value: candidate || raw, errors: [String((error as Error).message)] };
            }
          },
          undefined,
          (base, draft, errors) => (candidate ? anchorPrompt() : P.REPAIR(base, draft, errors)),
          () => (candidate ? anchorPrompt() : P.ASSET(context)),
        );
        state.assets[key] = value;
        save();
        return value;
      })();
      pending.set(key, job);
      return job.finally(() => pending.delete(key));
    };
    opts.log(V.LOG_MODE(settings.mode));
    opts.log(B.LOG(state.renderBehavior.actors, state.renderBehavior.sceneEffects, state.renderBehavior.camera));
    if (state.layoutRevision !== L.REVISION) opts.log(L.LOG_MIGRATE);
    if (!opts.review) opts.log(V.LOG_REVIEW_OFF);
    const beats = script.beats.filter((beat) => (!opts.onlyBeats?.length || opts.onlyBeats.includes(beat.id)) && (!opts.onlyLocations?.length || opts.onlyLocations.includes(beat.place || "")));
    const outdated = beats.filter((beat) => state.scenes[beat.id]?.length && !remotionBeatPlanCurrent(beat, analysis, state, opts.note ?? state.notes![beat.id] ?? ""));
    if (outdated.length) {
      opts.log(L.LOG_REPLAN(outdated.length));
      const retainedLocations = new Set(
        Object.values(state.scenes)
          .flat()
          .filter((scene) => scene.sceneRevision === L.SCENE_REVISION)
          .map((scene) => scene.locationKey || scene.place),
      );
      for (const key of Object.keys(state.locations || {})) if (!retainedLocations.has(key)) delete state.locations![key];
    }
    const characters = new Map<string, Promise<MotionVectorAsset>>();
    const baseCharacter = async (id: string, anchors: string[]) => {
      const member = analysis.cast.find((item) => item.key === id)!;
      const key = `character:${id}:${motionInputKey([member, analysis.era, settings])}`;
      let job = characters.get(key) || (state.assets[key] ? Promise.resolve(state.assets[key]) : undefined);
      if (!job) {
        job = asset(key, { kind: "character", name: member.name, description: member.look || member.description || member.role, member, era: analysis.era, profile: V.PROFILES[settings.profileId].direction, pose: "standing, neutral closed mouth", requiredAnchors: [...new Set(["base", ...anchors])] }, [...new Set(["base", ...anchors])]);
        characters.set(key, job);
      }
      const base = await job;
      if (anchors.every((anchor) => base.anchors?.[anchor])) return base;
      const required = [...new Set(["base", ...Object.keys(base.anchors || {}), ...anchors])];
      return asset(key, { kind: "character", name: member.name, description: member.look || member.description || member.role, member, era: analysis.era, profile: V.PROFILES[settings.profileId].direction, pose: "standing, neutral closed mouth", requiredAnchors: required }, required);
    };
    await mapMotionAiPool(beats, async (beat) => {
      opts.signal?.throwIfAborted();
      const note = opts.note ?? state.notes![beat.id] ?? "";
      const inputKey = remotionBeatKey(beat, analysis, note);
      opts.log(L.LOG_PLAN(script.beats.findIndex((item) => item.id === beat.id) + 1, script.beats.length));
      try {
        if (state.failures[beat.id]) {
          delete state.failures[beat.id];
          save();
        }
        if (!remotionBeatPlanCurrent(beat, analysis, state, note)) {
          const lines = puppetBeatLines(beat, motionNarratorCastKey(analysis));
          const context = {
            profile: V.PROFILES[settings.profileId].direction,
            era: analysis.era,
            beat: { id: beat.id, visual: beat.visual, scenePlan: beat.scenePlan, action: beat.action, time: beat.time, weather: beat.weather, shot: beat.shot },
            objectCatalog: remotionObjectCatalog(analysis, script, beat.place),
            priorFacts: script.beats.slice(Math.max(0, script.beats.indexOf(beat) - 2), script.beats.indexOf(beat)).map((b) => ({ place: b.place, time: b.time, action: b.action, scenePlan: b.scenePlan })),
            lines: lines.map((line) => ({ id: line.key, text: line.text })),
            cast: analysis.cast,
            place: analysis.places.find((item) => item.key === beat.place),
            note,
          };
          const prompt = P.SCENE(context) + "\n" + P.SCENE_POLICY;
          const draft = await ask(
            inputKey,
            V.ARTIFACT_SCENE,
            prompt,
            (raw) => {
              const checked = mergeRemotionSceneDraft(raw, state.drafts![inputKey] || [], lines, new Set(analysis.cast.map((member) => member.key)));
              state.drafts![inputKey] = checked.drafts;
              return checked;
            },
            undefined,
            undefined,
            (base) => (state.drafts![inputKey]?.length ? P.REPAIR(base, { scenes: state.drafts![inputKey] }, requests[inputKey]?.errors || []) : base),
          );
          state.scenes[beat.id] = remotionScenesFromDraft(draft, beat.id, beat.place, lines, inputKey);
          delete state.drafts[inputKey];
          state.inputKeys[beat.id] = remotionBeatKey(beat, analysis);
          state.notes![beat.id] = note;
          save();
        }
      } catch (error) {
        state.failures[beat.id] = String((error as Error).message);
        if (!opts.signal?.aborted) save();
        if (opts.signal?.aborted || motionCaptchaError(error) || (isTerminalMotionAiError(error, opts.signal) && !(error as Record<string, unknown>)?.[MOTION_PRODUCTION.CONTRACT_EXHAUSTED])) throw error;
        opts.log(V.LOG_FAILED(beat.id, state.failures[beat.id]));
      }
    });
    const dependentBeats = resolveRemotionContinuity(result, analysis);
    save();
    const allScenes = script.beats.flatMap((beat) => state.scenes[beat.id] || []);
    const readyScenes = new Set(allScenes.filter((scene) => remotionSceneReadiness(scene, state).preview).map((scene) => scene.id));
    let hydrationBeats = script.beats.filter((beat) => (beats.some((selected) => selected.id === beat.id) || dependentBeats.has(beat.id)) && !state.failures[beat.id]);
    for (let pass = 0; pass < L.CONTINUITY_PASSES && hydrationBeats.length; pass++) {
      const reviewDependents = new Set<string>();
      await mapMotionAiPool(hydrationBeats, async (beat) => {
        opts.signal?.throwIfAborted();
        try {
          const hydrate = async (scene: MotionRemotionScene, repair?: string[]) => {
            opts.log(L.LOG_LAYOUT(allScenes.findIndex((item) => item.id === scene.id) + 1, allScenes.length));
            const location = state.locations![scene.locationKey || scene.place || `unplaced:${beat.id}`];
            const environment = location?.environment || scene.environment;
            const locationScenes = Object.values(state.scenes)
              .flat()
              .filter((s) => (s.locationKey || s.place) === (scene.locationKey || scene.place));
            const exclude = [...new Set(locationScenes.flatMap((s) => s.nodes.map((n) => n.description)))].sort();
            const essentialRegions = [...new Set(locationScenes.flatMap((s) => [...(s.effects || []).filter((e) => e.essential && (e.kind === "rain" || e.kind === "fog")).map((e) => e.region || (e.kind === "rain" ? "outdoors" : "floor")), ...s.nodes.filter((n) => n.mount && n.essential).map((n) => n.mount!)]))];
            const requiredRegions = [...new Set(["floor", "wall", "outdoors", ...locationScenes.flatMap((s) => s.nodes.filter((n) => remotionRole(n) === "fixture").map(remotionMount))])].sort();
            const designKey = `background:${motionInputKey([settings, scene.locationKey || scene.place, environment, opts.aspect || "16:9", requiredRegions, L.REVISION])}`;
            const bgKey = repair ? `${designKey}:${motionInputKey([repair, scene.id])}` : designKey;
            const refresh = repair || scene.backgroundDesignKey !== designKey || !state.assets[scene.backgroundKey || ""] || state.assets[scene.backgroundKey || ""].layerRevision !== L.REVISION || essentialRegions.some((region) => !state.assets[scene.backgroundKey || ""]?.regions?.[region]);
            if (refresh) await asset(bgKey, { name: scene.place || scene.purpose, description: environment, kind: "background", requiredRegions, essentialRegions, profile: V.PROFILES[settings.profileId].direction, era: analysis.era, exclude, aspect: opts.aspect || "16:9", repair }, []);
            if (refresh) scene.backgroundKey = bgKey;
            scene.backgroundDesignKey = designKey;
            scene.aspect = opts.aspect || "16:9";
            if (location) location.backgroundKey = scene.backgroundKey;
            scene.effects = remotionSceneEffects(scene);
            for (const node of scene.nodes) {
              if (node.kind === "label") continue;
              const uses = script.beats.flatMap((b) => state.scenes[b.id] || []).flatMap((otherScene) => otherScene.nodes.filter((other) => other.kind === node.kind && remotionObjectIdentity(other) === remotionObjectIdentity(node) && (node.kind === "character" || node.objectId || otherScene.place === scene.place)).map((other) => ({ scene: otherScene, node: other })));
              const required = [
                ...new Set([
                  "base",
                  ...(node.relation === "heldBy" ? ["grip"] : []),
                  ...(node.kind === "character" && node.relation === "on" ? [remotionContact(node)] : []),
                  ...uses.flatMap((use) =>
                    remotionSceneEffects(use.scene)
                      .filter((e) => e.source === use.node.id)
                      .map((e) => e.anchor || (e.kind === "flame" ? "flame" : e.kind === "sway" ? "pivot" : "emitter")),
                  ),
                  ...uses.flatMap((use) => use.scene.nodes.filter((other) => other.target === use.node.id).flatMap((other) => (other.relation === "on" ? ["surface"] : other.relation === "heldBy" ? ["grip"] : other.relation === "inside" ? ["inside"] : []))),
                ]),
              ].sort();
              if (!repair && node.assetKey && state.assets[node.assetKey] && (!node.state || state.assets[node.assetKey].stateKey === motionInputKey(node.state)) && (!scene.effects.some((e) => e.source === node.id) || state.assets[node.assetKey].layerRevision === L.REVISION) && required.every((anchor) => state.assets[node.assetKey!].anchors?.[anchor])) continue;
              const base = node.kind === "character" ? await baseCharacter(node.entityId!, required) : undefined;
              const member = analysis.cast.find((item) => item.key === node.entityId);
              if (!repair && base && !node.state && canReuseRemotionCharacter(node, member?.look || member?.description || member?.role || "") && required.every((anchor) => base.anchors?.[anchor])) {
                node.assetKey = base.key;
                opts.log(V.LOG_REUSE(member?.name || node.entityId!));
              } else {
                const socket = node.mount && state.assets[scene.backgroundKey!]?.regions?.[node.mount],
                  bg = state.assets[scene.backgroundKey!];
                const targetAspect = socket ? (socket.width * bg.width) / (socket.height * bg.height) : undefined;
                const key = `${node.kind}:${motionInputKey([node.entityId, node.description, node.state, node.pose, node.mount, targetAspect, settings, L.REVISION, repair, repair ? scene.id : undefined])}`;
                await asset(key, { kind: node.kind, name: node.entityId || node.description, description: node.description, state: node.state, pose: node.pose, role: remotionRole(node), mount: node.mount, targetAspect, identity: node.entityId, baseSvg: base?.svg, profile: V.PROFILES[settings.profileId].direction, era: analysis.era, requiredAnchors: required, repair }, required);
                node.assetKey = key;
              }
              save();
            }
            const [w, h] = opts.aspect === "9:16" ? [562.5, 1000] : opts.aspect === "1:1" ? [1000, 1000] : opts.aspect === "4:5" ? [800, 1000] : [1000, 562.5];
            const placed = layoutRemotionNodes(scene.nodes, state.assets, w, h, state.assets[scene.backgroundKey!]);
            const resolved = remotionEffectGeometry({ ...scene, nodes: placed, startFrame: 0, endFrame: 30 }, state.assets, w, h, { ...state.renderBehavior!, sceneEffects: "gentle" });
            for (const effect of scene.effects)
              if (!resolved.some((e) => e.id === effect.id)) {
                opts.log(L.WARNING(scene.id, effect.source || effect.id, effect.essential ? L.REQUIRED_EFFECT : L.OPTIONAL_EFFECT));
                if (effect.essential) throw new Error(L.WARNING(scene.id, effect.source || effect.id, L.EFFECT_ERROR));
              }
            save();
          };
          for (const scene of state.scenes[beat.id]) await hydrate(scene);
          if (opts.review)
            for (let i = 0; i < state.scenes[beat.id].length; i++) {
              let scene = state.scenes[beat.id][i];
              for (let attempt = 0; attempt <= 2; attempt++) {
                const reviewKey = motionInputKey([scene.sourceKey, scene.nodes.map((node) => [node, state.assets[node.assetKey || ""]]), state.assets[scene.backgroundKey || ""], opts.aspect, L.REVISION, L.EFFECT_REVISION, state.renderBehavior, scene.continuityKey]);
                if (scene.reviewKey === reviewKey) break;
                opts.log(V.LOG_REVIEW(script.beats.findIndex((item) => item.id === beat.id) + 1, script.beats.length));
                const one = { ...result, beats: [beat], gen: { ...result.gen!, remotion: { ...state, scenes: { [beat.id]: [scene] } } } };
                const spec = compileRemotionStory(one, analysis, { aspect: opts.aspect, fps: 30, review: true }).spec;
                const file = path.join(getMotionWorkDirectory(motionInputKey([opts.scope, reviewKey])), `${reviewKey}.png`);
                let review: { ok: boolean; issues: string[] };
                try {
                  await (opts.still || renderRemotionStill)(spec, file, 0, opts.signal);
                  review = await ask(`review:${reviewKey}`, V.ARTIFACT_REVIEW, P.REVIEW({ narration: scene.text, purpose: scene.purpose, nodes: scene.nodes }), (raw) => ({ value: raw, errors: typeof raw?.ok === "boolean" && Array.isArray(raw.issues) && raw.issues.every((issue: unknown) => typeof issue === "string") && (raw.ok || raw.issues.length) ? [] : [P.REVIEW_REQUIRED] }), [
                    { name: `${scene.id}.png`, mimeType: "image/png", path: file },
                  ]);
                } finally {
                  fs.rmSync(file, { force: true });
                }
                if (review.ok) {
                  scene.reviewKey = reviewKey;
                  save();
                  break;
                }
                if (attempt === 2) throw new Error(P.ERROR(scene.id, review.issues));
                opts.log(V.LOG_REPAIR(scene.id));
                const lines = puppetBeatLines(beat, motionNarratorCastKey(analysis));
                const from = lines.findIndex((line) => line.key === scene.fromLineId),
                  to = lines.findIndex((line) => line.key === scene.toLineId);
                const context = { profile: V.PROFILES[settings.profileId].direction, era: analysis.era, cast: analysis.cast, lines: lines.slice(from, to + 1).map((line) => ({ id: line.key, text: line.text })), scene, repairIssues: review.issues };
                const draft = await ask(`repair:${reviewKey}`, V.ARTIFACT_SCENE, P.SCENE(context), (raw) => {
                  const checked = mergeRemotionSceneDraft(raw, [], lines.slice(from, to + 1), new Set(analysis.cast.map((member) => member.key)));
                  if (checked.value.scenes.length !== 1) checked.errors.push(P.INVALID_RANGE);
                  return checked;
                });
                const repaired = remotionScenesFromDraft(draft, beat.id, beat.place, lines, scene.sourceKey)[0];
                scene = { ...repaired, id: scene.id, locationKey: scene.locationKey, continuityKey: scene.continuityKey, time: scene.time, weather: scene.weather, layoutRevision: L.REVISION };
                state.scenes[beat.id][i] = scene;
                for (const dependent of resolveRemotionContinuity(result, analysis)) if (dependent !== beat.id) reviewDependents.add(dependent);
                await hydrate(scene, review.issues);
              }
            }
          delete state.failures[beat.id];
          for (const scene of state.scenes[beat.id]) readyScenes.add(scene.id);
          opts.log(V.LOG_READY(readyScenes.size, allScenes.length));
          opts.progress?.(readyScenes.size / Math.max(1, allScenes.length), V.LOG_READY(readyScenes.size, allScenes.length));
          save();
        } catch (error) {
          state.failures[beat.id] = String((error as Error).message);
          if (!opts.signal?.aborted) save();
          if (opts.signal?.aborted || motionCaptchaError(error) || (isTerminalMotionAiError(error, opts.signal) && !(error as Record<string, unknown>)?.[MOTION_PRODUCTION.CONTRACT_EXHAUSTED])) throw error;
          opts.log(V.LOG_FAILED(beat.id, state.failures[beat.id]));
        }
      });
      hydrationBeats = script.beats.filter((beat) => reviewDependents.has(beat.id) && !state.failures[beat.id]);
    }
    for (const beat of hydrationBeats) state.failures[beat.id] = L.CONTINUITY_ERROR;
    save();
    if (Object.keys(state.failures).length)
      throw new Error(
        Object.entries(state.failures)
          .map(([id, error]) => V.LOG_FAILED(id, error))
          .join("\n"),
      );
    return result;
  } finally {
    await cutouts.close();
  }
};
