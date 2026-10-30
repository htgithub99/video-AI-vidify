import { MOTION_REMOTION_LAYOUT as L } from "../../src/constants/motionRemotionLayout.js";
import { MOTION_VISUAL as V } from "../../src/constants/motionVisual.js";
import { remotionObjectIdentity } from "../../src/lib/motionRemotionGeometry.js";
import { normalizeRemotionPlacement } from "../../src/lib/motionRemotion.js";
import { assignRemotionStaging, prepareRemotionScene } from "../../src/lib/motionRemotionStaging.js";
import type { MotionStoryAnalysis, MotionStoryScript } from "../../src/types/motionVideo.js";
import type { MotionRemotionNode, MotionRemotionScene } from "../../src/types/motionVisual.js";
import { motionInputKey } from "../../src/features/motion/server/services/motionFileUtils.js";
import { assignRemotionSpace, normalizeRemotionSpacePose } from "./space.js";
export const remotionObjectCatalog = (analysis: MotionStoryAnalysis, script?: MotionStoryScript, place?: string) => {
  const catalog = new Map(
    (analysis.illustrationNeeds || [])
      .filter((need) => !place || need.place === place)
      .flatMap((need) => need.objects || [])
      .map((object) => [object.identity || object.key, { id: object.identity || object.key, description: object.baseDescription || object.description || object.word, word: object.word, aliases: [] as string[] }]),
  );
  for (const description of new Set((script?.beats || []).filter((beat) => !place || beat.place === place).flatMap((beat) => beat.scenePlan?.requiredProps || []))) {
    const id = `object_${motionInputKey(description.normalize("NFC").trim().toLowerCase()).slice(0, 12)}`;
    const subject = description
      .normalize("NFC")
      .trim()
      .toLowerCase()
      .replace(/^(?:một|hai|chiếc|cái|tấm|bộ)\s+/u, "");
    const matches = [...catalog.values()].filter((item) => item.word && (subject === item.word.toLowerCase() || subject.startsWith(item.word.toLowerCase() + " ")));
    if (matches.length === 1) matches[0].aliases.push(id);
    else if (![...catalog.values()].some((item) => item.description === description)) catalog.set(id, { id, description, word: "", aliases: [] });
  }
  return [...catalog.values()];
};
export const resolveRemotionContinuity = (script: MotionStoryScript, analysis: MotionStoryAnalysis) => {
  const state = script.gen!.remotion!;
  const locations = (state.locations ||= {});
  const ledger = new Map<string, Map<string, MotionRemotionNode>>();
  const objectLocation = new Map<string, string>();
  const changed = new Set<string>();
  const stagedScenes: MotionRemotionScene[] = [];
  let time: string | undefined, weather: string | undefined;
  for (const beat of script.beats) {
    const catalog = remotionObjectCatalog(analysis, script, beat.place);
    time = beat.time || time;
    weather = beat.weather || weather;
    for (const scene of state.scenes[beat.id] || []) {
      const resolvedNodes = scene.nodes;
      const nodeKey = (nodes: MotionRemotionNode[]) => motionInputKey(nodes.map(({ assetKey, ...node }) => node));
      if (!scene.continuityDraft || nodeKey(scene.nodes) !== scene.continuityDraft.resolvedKey) scene.continuityDraft = { nodes: structuredClone(scene.nodes), resolvedKey: "" };
      scene.nodes = normalizeRemotionPlacement(structuredClone(scene.continuityDraft.nodes));
      prepareRemotionScene(scene, state.settings?.mode === "remotion" ? state.settings.profileId : undefined);
      if (state.settings?.mode === "remotion" && state.settings.profileId === "horror") normalizeRemotionSpacePose(scene.nodes);
      for (const node of scene.nodes) {
        const identity = catalog.find((item) => item.id === node.objectId || item.aliases.includes(node.objectId || ""));
        if (identity) node.objectId = identity.id;
      }
      for (const node of scene.nodes) {
        const accepted = resolvedNodes.find((item) => item.id === node.id && item.description === node.description && item.pose === node.pose && item.state === node.state);
        if (accepted?.assetKey) node.assetKey = accepted.assetKey;
        else if (resolvedNodes.some((item) => item.id === node.id)) delete node.assetKey;
      }
      const location = scene.place || `unplaced:${beat.id}`;
      const prior = ledger.get(location) || new Map<string, MotionRemotionNode>();
      const previousNodes = new Map(prior);
      const old = scene.continuityKey;
      if (!scene.continuityKey) {
        if (scene.time) scene.declaredTime ||= scene.time;
        if (scene.weather) scene.declaredWeather ||= scene.weather;
      }
      scene.time = beat.time || scene.declaredTime || time || analysis.places.find((p) => p.key === scene.place)?.time;
      scene.weather = beat.weather || scene.declaredWeather || weather;
      time = scene.time || time;
      weather = scene.weather || weather;
      locations[location] ||= { environment: scene.environment };
      scene.locationKey = location;
      scene.layoutRevision = L.REVISION;
      const removed = new Set(scene.removedObjects || []);
      for (const id of removed) prior.delete(id);
      for (const node of scene.nodes) {
        if (node.kind === "prop" && node.objectId) {
          const oldLocation = objectLocation.get(node.objectId);
          if (oldLocation && oldLocation !== location) ledger.get(oldLocation)?.delete(node.objectId);
          objectLocation.set(node.objectId, location);
        }
        const id = remotionObjectIdentity(node),
          previous = prior.get(id);
        if (previous && !node.stateEvidence && !node.appearanceChanged && node.state !== previous.state) {
          node.state = previous.state;
          node.description = previous.description;
          node.assetKey = previous.assetKey;
        }
        if (previous && !node.stateEvidence && node.kind !== "character") {
          const changedDescription = node.description !== previous.description;
          node.description = previous.description;
          if (previous.assetKey && (!node.assetKey || changedDescription)) node.assetKey = previous.assetKey;
          node.slot = previous.slot;
          if (previous.mount) node.mount ||= previous.mount;
          const target = previous.target && [...prior.values()].find((n) => n.id === previous.target);
          const targetNode = scene.nodes.find((n) => (target ? remotionObjectIdentity(n) === remotionObjectIdentity(target) : n.id === previous.target));
          if (previous.relation && previous.target && (!target || !removed.has(remotionObjectIdentity(target)))) {
            node.target = targetNode?.id || previous.target;
            node.relation = previous.relation;
          }
        }
        prior.set(id, structuredClone(node));
      }
      const inherit = (node: MotionRemotionNode, visiting = new Set<string>()): MotionRemotionNode | undefined => {
        const id = remotionObjectIdentity(node),
          existing = scene.nodes.find((n) => remotionObjectIdentity(n) === id);
        if (existing) return existing;
        if (node.kind === "character" || removed.has(id) || visiting.has(id) || scene.nodes.length >= V.MAX_NODES) return;
        visiting.add(id);
        const inherited = structuredClone(node);
        if (node.target) {
          const original = [...prior.values()].find((n) => n.id === node.target),
            target = original && inherit(original, visiting);
          if (!target) return;
          inherited.target = target.id;
        }
        if (scene.nodes.length >= V.MAX_NODES) return;
        if (scene.nodes.some((n) => n.id === inherited.id)) inherited.id = `carried_${motionInputKey([id, inherited.id]).slice(0, 12)}`;
        scene.nodes.push(inherited);
        return inherited;
      };
      for (const node of prior.values()) if (node.persistent && (scene.view !== "detail" || node.role === "fixture")) inherit(node);
      for (const node of previousNodes.values()) {
        if (node.role !== "decal" || node.relation !== "inside" || !node.target) continue;
        const host = [...previousNodes.values()].find((item) => item.id === node.target);
        const currentHost = host && scene.nodes.find((item) => remotionObjectIdentity(item) === remotionObjectIdentity(host));
        if (host && currentHost && host.state === currentHost.state && !removed.has(remotionObjectIdentity(host))) inherit(node);
      }
      for (const node of scene.nodes)
        if (node.target && !scene.nodes.some((n) => n.id === node.target)) {
          const original = [...prior.values()].find((n) => n.id === node.target),
            target = original && scene.nodes.find((n) => remotionObjectIdentity(n) === remotionObjectIdentity(original));
          if (target) node.target = target.id;
          else if (original?.kind === "prop" && !removed.has(remotionObjectIdentity(original)) && (node.relation === "on" || node.relation === "inside")) {
            const inherited = inherit(original);
            if (inherited) node.target = inherited.id;
          } else if (node.persistent && node.kind !== "character") {
            delete node.target;
            delete node.relation;
          }
        }
      ledger.set(location, prior);
      stagedScenes.push(scene);
      assignRemotionStaging(stagedScenes, analysis.cast);
      if (state.settings?.mode === "remotion" && state.settings.profileId === "horror") assignRemotionSpace(stagedScenes);
      scene.continuityDraft.resolvedKey = nodeKey(scene.nodes);
      scene.continuityKey = motionInputKey([location, scene.time, scene.weather, scene.nodes.map(({ assetKey, ...node }) => node), L.REVISION]);
      if (old && old !== scene.continuityKey) {
        delete scene.reviewKey;
        changed.add(beat.id);
      }
    }
  }
  state.layoutRevision = L.REVISION;
  return changed;
};
