import { MOTION_VISUAL as V } from "../constants/motionVisual.js";
import { MOTION_REMOTION_PROMPTS as P } from "../constants/motionRemotionPrompts.js";
import { normalizeMotionVector } from "./motionVectorAsset.js";
import { motionVectorCutoutIssue } from "./motionVectorCutout.js";
import type { MotionRemotionNode, MotionRemotionPlacedNode, MotionRemotionSpec, MotionVectorAsset, MotionRemotionScene, MotionRemotionState } from "../types/motionVisual.js";
import { MOTION_REMOTION_LAYOUT as L } from "../constants/motionRemotionLayout.js";
import { remotionRole, remotionSubject, remotionMount, remotionMountRegion, remotionContact, remotionPoint, remotionRect, remotionNodeFitsFrame, remotionVisibleRect } from "./motionRemotionGeometry.js";
import { MOTION_REMOTION_STAGING as S } from "../constants/motionRemotionStaging.js";
import { normalizeRemotionRelations, remotionIdentityDescription } from "./motionRemotionStaging.js";
import { separateRemotionSubjects } from "./motionRemotionVisibility.js";
import { normalizeMotionRenderBehavior } from "./motionRenderBehavior.js";
import { MOTION_ASPECT_BASE } from "../constants/motionVideo.js";
import { MOTION_REMOTION_SPACE as SPACE } from "../constants/motionRemotionSpace.js";
import { validateSceneComposition } from "./motionSceneComposition.js";
export const remotionAssetAnchors = (raw: unknown, required: string[] = []): MotionVectorAsset["anchors"] => {
  const value = raw && typeof raw === "object" ? (raw as Record<string, any>) : {};
  const entries = Object.entries(value)
    .map(([key, point]) => [key, { x: typeof point?.x === "string" && point.x.trim() ? Number(point.x) : point?.x, y: typeof point?.y === "string" && point.y.trim() ? Number(point.y) : point?.y }] as const)
    .filter(([key, point]) => (L.ANCHORS as readonly string[]).includes(key) && Number.isFinite(point.x) && Number.isFinite(point.y) && point.x >= 0 && point.x <= 1 && point.y >= 0 && point.y <= 1);
  const anchors = Object.fromEntries(entries);
  const missing = required.filter((key) => !anchors[key]);
  if (missing.length) throw new Error(V.ANCHORS_MISSING(missing));
  return anchors;
};
export const canReuseRemotionCharacter = (node: MotionRemotionNode, appearance: string): boolean => {
  appearance = remotionIdentityDescription(appearance);
  if (node.relation === "on" && remotionContact(node) !== "base") return false;
  if (node.appearanceChanged || node.poseEssential || V.REQUIRED_POSE.test(node.pose)) return false;
  const changes = new Set(appearance.toLowerCase().match(S.VISIBLE_CHANGE) || []);
  if ((node.description.toLowerCase().match(S.VISIBLE_CHANGE) || []).some((marker) => !changes.has(marker))) return false;
  const original = new Set(appearance.toLowerCase().match(V.APPEARANCE_MARKERS) || []);
  return !(node.description.toLowerCase().match(V.APPEARANCE_MARKERS) || []).some((marker) => !original.has(marker));
};
export const remotionSceneReadiness = (scene: MotionRemotionScene, state?: MotionRemotionState): { preview?: MotionRemotionSpec; missingBackground?: boolean; missingAssets?: string[]; error?: string } => {
  if (scene.composition) {
    const asset = state?.assets[scene.composition.assetKey];
    if (!state || state.settings.mode !== "remotion" || !asset) return { missingBackground: true };
    try {
      validateSceneComposition(scene.composition, asset, scene.nodes);
      const aspect = scene.aspect || "16:9";
      const { w: width, h: height } = MOTION_ASPECT_BASE[aspect] || MOTION_ASPECT_BASE["16:9"];
      return {
        preview: {
          engine: "remotion",
          version: V.VERSION,
          title: scene.purpose,
          aspect,
          fps: 30,
          duration: 1,
          width,
          height,
          motion: state.renderBehavior?.actors === "simple",
          renderBehavior: state.renderBehavior,
          profileId: state.settings.profileId,
          assets: { [asset.key]: asset },
          scenes: [{ ...scene, nodes: scene.nodes.map((node, depth) => ({ ...node, x: 0, y: 0, width, height, depth })), startFrame: 0, endFrame: 30 }],
          subtitles: [],
        },
      };
    } catch (error) {
      return { error: String((error as Error).message) };
    }
  }
  if (!state || state.settings.mode !== "remotion" || !scene.backgroundKey || !state.assets[scene.backgroundKey]) return { missingBackground: true };
  const missing = scene.nodes.filter((node) => node.kind !== "label" && (!node.assetKey || !state.assets[node.assetKey]));
  if (missing.length) return { missingAssets: missing.map((node) => node.description || node.entityId || node.id) };
  try {
    for (const node of scene.nodes) {
      const issue = node.kind !== "label" && motionVectorCutoutIssue(state.assets[node.assetKey!].svg);
      if (issue) throw new Error(V.SVG_ERROR(`${node.description || node.id}: ${issue}`));
    }
    const aspect = scene.aspect || "16:9";
    const { w: width, h: height } = MOTION_ASPECT_BASE[aspect] || MOTION_ASPECT_BASE["16:9"];
    const nodes = layoutRemotionNodes(scene.nodes, state.assets, width, height, state.assets[scene.backgroundKey!]);
    const used = new Set([scene.backgroundKey, ...nodes.map((node) => node.assetKey)]);
    return {
      preview: {
        engine: "remotion",
        version: V.VERSION,
        title: scene.purpose,
        aspect,
        fps: 30,
        duration: 1,
        width,
        height,
        motion: state.renderBehavior?.actors === "simple",
        renderBehavior: state.renderBehavior,
        profileId: state.settings.profileId,
        assets: Object.fromEntries(Object.entries(state.assets).filter(([key]) => used.has(key))),
        scenes: [{ ...scene, nodes, startFrame: 0, endFrame: 30 }],
        subtitles: [],
      },
    };
  } catch (error) {
    return { error: String((error as Error).message) };
  }
};
export const remotionScenePreview = (scene: MotionRemotionScene, state?: MotionRemotionState): MotionRemotionSpec | undefined => remotionSceneReadiness(scene, state).preview;
export const normalizeRemotionPlacement = (nodes: MotionRemotionNode[]): MotionRemotionNode[] =>
  normalizeRemotionRelations(nodes).map((node) => {
    if (node.kind !== "prop" || node.relation || node.mount || !L.PORTRAIT.test(node.description) || !L.ON_SUPPORT.test(node.description)) return node;
    const supports = nodes.filter((target) => target.kind === "prop" && remotionRole(target) === "support" && (L.ALTAR.test(node.description) ? L.ALTAR.test(target.description) : true));
    return supports.length === 1 ? { ...node, relation: "on" as const, target: supports[0].id } : node;
  });
export const layoutRemotionNodes = (nodes: MotionRemotionNode[], assets: Record<string, MotionVectorAsset>, width: number, height: number, background?: MotionVectorAsset, fit = 1): MotionRemotionPlacedNode[] => {
  if (background?.space) assets = Object.fromEntries(Object.entries(assets).map(([key, asset]) => [key, asset.bounds ? { ...asset, anchors: { ...asset.anchors, base: { x: asset.bounds.x + asset.bounds.width * 0.5, y: asset.bounds.y + asset.bounds.height } } } : asset]));
  nodes = normalizeRemotionPlacement(nodes);
  const placed = new Map<string, MotionRemotionPlacedNode>(),
    visiting = new Set<string>();
  const floor = background?.regions?.floor;
  const ground = Math.min(floor ? floor.y + floor.height * 0.65 : 0.82, L.GROUND_BOTTOM) * height;
  const place = (node: MotionRemotionNode): MotionRemotionPlacedNode => {
    const previous = placed.get(node.id);
    if (previous) return previous;
    if (visiting.has(node.id)) throw new Error(L.NODE_ERROR(node.id, "target", P.CYCLIC_TARGET));
    visiting.add(node.id);
    const asset = node.assetKey ? assets[node.assetKey] : undefined;
    if (node.kind !== "label" && !asset) throw new Error(V.SCENES_REQUIRED);
    if (asset?.bounds && !remotionRect(asset.bounds)) throw new Error(L.NODE_ERROR(node.id, "bounds", L.GEOMETRY_ERROR));
    const bounds = asset?.bounds || { x: 0, y: 0, width: 1, height: 1 };
    const role = remotionRole(node),
      ratio = asset ? asset.width / asset.height : 4;
    const visibleRatio = (ratio * bounds.width) / bounds.height;
    const crowd = node.kind === "prop" && S.CROWD.test(node.description);
    let visibleH = height * (node.kind === "character" ? S.CHARACTER_HEIGHT[node.age || "adult"] : node.kind === "label" ? 0.06 : crowd ? 0.29 : role === "fixture" ? 0.68 : S.MAT.test(node.description) ? 0.055 : role === "support" ? 0.25 : role === "decal" ? 0.045 : L.SMALL.test(node.description) ? 0.12 : L.WIDE.test(node.description) ? 0.13 : 0.18);
    if (background?.space && node.layoutHeight) visibleH = height * node.layoutHeight;
    if (node.kind === "character") visibleH *= asset?.characterScale || 1;
    const cap = width * (node.kind === "character" ? (0.24 * S.CHARACTER_HEIGHT[node.age || "adult"]) / S.CHARACTER_HEIGHT.adult : crowd ? 0.65 : background?.space && S.COFFIN.test(remotionSubject(node)) ? 0.34 : role === "fixture" ? 0.32 : role === "support" ? 0.38 : role === "decal" ? 0.32 : 0.22);
    let visibleW = Math.min(cap, visibleH * visibleRatio);
    visibleH = visibleW / visibleRatio;
    const physical = node.kind === "prop" && (S.LOW_SEAT.test(remotionSubject(node)) ? S.LOW_SEAT_SIZE : S.COFFIN.test(remotionSubject(node)) ? S.COFFIN_SIZE : undefined);
    if (physical && !background?.space) {
      const adultHeight = height * S.CHARACTER_HEIGHT.adult;
      visibleW = Math.min(adultHeight * physical.width, adultHeight * physical.height * visibleRatio);
      visibleH = visibleW / visibleRatio;
    }
    if (node.kind === "prop" && role === "object" && S.SMALL.test(remotionSubject(node))) {
      const adultHeight = height * S.CHARACTER_HEIGHT.adult;
      const smallScale = Math.min(1, (adultHeight * S.SMALL_SIZE.width) / visibleW, (adultHeight * S.SMALL_SIZE.height) / visibleH);
      visibleW *= smallScale;
      visibleH *= smallScale;
    }
    let w = visibleW / bounds.width,
      h = visibleH / bounds.height;
    if (background?.space && node.kind === "prop" && S.MAT.test(remotionSubject(node))) {
      w = (width * SPACE.MAT_WIDTH) / bounds.width;
      h = (height * SPACE.MAT_HEIGHT) / bounds.height;
    }
    if (role !== "fixture") {
      w *= fit;
      h *= fit;
    }
    const peers = nodes.filter((other) => other.slot === node.slot && !other.relation && other.kind === node.kind && node.kind === "character").sort((a, b) => (a.entityId || a.id).localeCompare(b.entityId || b.id));
    const index = peers.findIndex((other) => other.id === node.id);
    const column = node.layoutX ?? (node.slot === "left" ? 0.24 : node.slot === "right" ? 0.76 : 0.5);
    const nodeGround = background?.space && node.layoutY ? node.layoutY * height : ground;
    const peerOffset = node.layoutX === undefined && peers.length > 1 ? (index - (peers.length - 1) / 2) * Math.min(width * 0.18, (width * 0.5) / peers.length) : 0;
    let own = remotionPoint(asset, "base");
    let x = width * column - w * own.x + peerOffset;
    let y = node.kind === "label" ? height * 0.12 : nodeGround - h * own.y;
    let depth = node.kind === "label" ? 100 : role === "fixture" ? (remotionMount(node) === "floor" ? 0 : 6) : role === "decal" ? 2 : crowd ? 3 : node.kind === "character" ? 10 : 8;
    if (background?.space && node.layoutDepth !== undefined && role !== "fixture") depth = node.layoutDepth;
    if ((role === "fixture" || node.mount) && !node.relation) {
      const mount = remotionMount(node);
      const r = remotionMountRegion(node, background);
      const floorObject = mount === "floor" && role !== "fixture";
      const scale = floorObject ? 1 : Math.min(role === "fixture" ? Infinity : 1, (width * r.width) / visibleW, (height * r.height) / visibleH);
      w *= scale;
      h *= scale;
      x = floorObject ? width * column - w * own.x : width * (r.x + r.width * 0.5) - w * (bounds.x + bounds.width * 0.5);
      y = mount === "floor" && role !== "fixture" ? nodeGround - h * own.y : height * (r.y + r.height * (mount === "wall" ? 0.5 : 1)) - h * (bounds.y + bounds.height * (mount === "wall" ? 0.5 : 1));
      if (background?.space && role === "fixture" && S.ARCHITECTURE.test(remotionSubject(node))) {
        w = (width * r.width) / bounds.width;
        h = (height * r.height) / bounds.height;
        x = width * r.x - w * bounds.x;
        y = height * r.y - h * bounds.y;
      }
    }
    if (node.target && node.relation) {
      const target = nodes.find((other) => other.id === node.target);
      if (!target) throw new Error(L.NODE_ERROR(node.id, "target", P.INVALID_TARGET));
      const base = place(target),
        targetAsset = target.assetKey ? assets[target.assetKey] : undefined;
      const architecture = remotionRole(target) === "fixture" && S.ARCHITECTURE.test(target.description);
      const distant = architecture && S.GATE.test(target.description) && S.DISTANT.test(target.description) && background?.regions?.outdoors && background.regions.outdoors.width < 0.8;
      if (distant && node.kind === "character") {
        const tb = targetAsset?.bounds || { x: 0, y: 0, width: 1, height: 1 };
        const scale = Math.min(1, (base.height * tb.height * 0.95) / (h * bounds.height));
        w *= scale;
        h *= scale;
      }
      const anchorName = node.attachmentAnchor && (L.ANCHORS as readonly string[]).includes(node.attachmentAnchor) ? node.attachmentAnchor : node.relation === "on" ? "surface" : node.relation === "heldBy" ? "grip" : node.relation === "inside" ? "inside" : undefined;
      const targetAnchor = anchorName ? targetAsset?.anchors?.[anchorName] || (anchorName === "surface" && S.MAT.test(target.description) ? remotionPoint(targetAsset, "surface") : undefined) : undefined;
      if (anchorName && !targetAnchor) throw new Error(L.NODE_ERROR(node.id, `${target.id}.${anchorName}`, L.CONTACT_ERROR));
      if (node.relation === "heldBy" || (node.relation === "on" && node.kind !== "character") || node.relation === "inside") {
        const tb = targetAsset?.bounds || { x: 0, y: 0, width: 1, height: 1 };
        const siblings = nodes.filter((n) => n.kind === "prop" && n.relation === "on" && n.target === target.id).length;
        const maxW = base.width * tb.width * (node.relation === "heldBy" ? 0.85 : node.relation === "inside" ? 0.72 : Math.min(L.WIDE.test(node.description) ? 0.86 : 0.42, siblings > 1 ? 0.85 / siblings : 1));
        const maxH = node.relation === "heldBy" ? base.height * 0.24 : node.relation === "inside" ? base.height * 0.65 : height * 0.16;
        const scale = Math.min(1, maxW / (w * bounds.width), maxH / (h * bounds.height));
        w *= scale;
        h *= scale;
      }
      if (anchorName) {
        const anchor = targetAnchor!;
        own = remotionPoint(asset, node.relation === "inside" && !(architecture && node.kind === "character") ? "inside" : node.relation === "heldBy" ? "grip" : remotionContact(node));
        if (role === "decal" && !architecture && (target.kind === "character" || node.relation === "inside" || (node.relation === "on" && S.SURFACE_CONTAINER.test(remotionSubject(target))))) {
          const markScale = Math.min(1, (base.height * (targetAsset?.bounds?.height || 1) * (node.attachmentAnchor === "wrist" ? S.WRIST_MARK_HEIGHT : S.SURFACE_MARK_HEIGHT)) / (bounds.height * h));
          w *= markScale;
          h *= markScale;
          own = { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 };
        }
        x = base.x + base.width * anchor.x - w * own.x;
        y = base.y + base.height * anchor.y - h * own.y;
        if (background?.space && node.kind === "character" && node.relation === "on" && S.MAT.test(remotionSubject(target)) && node.layoutX !== undefined) x = width * node.layoutX - w * remotionPoint(asset, "base").x;
        if (node.relation === "on" && node.kind === "prop") {
          const siblings = nodes.filter((n) => n.kind === "prop" && n.relation === "on" && n.target === target.id).sort((a, b) => a.id.localeCompare(b.id));
          const tb = targetAsset?.bounds || { x: 0, y: 0, width: 1, height: 1 };
          if (siblings.length > 1) x += (siblings.findIndex((n) => n.id === node.id) - (siblings.length - 1) / 2) * Math.min(base.width * tb.width * 0.45, (base.width * tb.width * 0.85) / siblings.length);
        }
        if (architecture && node.kind === "character" && node.relation === "inside") y = ground - h * remotionPoint(asset, "base").y;
        depth = base.depth + 1;
        if (background?.space && node.kind === "character" && node.relation === "on") depth = Math.max(depth, node.layoutDepth ?? depth);
        if (node.kind === "character" && architecture) depth = 10;
      } else if (node.relation === "behind") {
        x = base.x + base.width * 0.58 - w * bounds.x;
        y = (node.kind === "character" || architecture ? ground : base.y + base.height * remotionPoint(targetAsset, "base").y) - h * remotionPoint(asset, "base").y;
        depth = base.depth - 1;
        if (node.kind === "character" && architecture && (S.CLOSED.test(target.description) || (S.DOOR.test(target.description) && !S.GATE.test(target.description)))) {
          const rect = remotionVisibleRect(base, targetAsset);
          const left = rect.x - w * (bounds.x + bounds.width) - width * 0.025,
            right = rect.x + rect.width + width * 0.025 - w * bounds.x;
          x = node.slot === "left" ? left : right;
          if (x + w * bounds.x < width * 0.03) x = right;
          if (x + w * (bounds.x + bounds.width) > width * 0.97) x = left;
        }
      } else {
        const tb = targetAsset?.bounds || { x: 0, y: 0, width: 1, height: 1 };
        const left = base.x + base.width * tb.x - w * (bounds.x + bounds.width) - width * 0.025;
        const right = base.x + base.width * (tb.x + tb.width) + width * 0.025 - w * bounds.x;
        x = node.slot === "left" ? left : right;
        if (x + w * bounds.x < width * 0.03 && right + w * (bounds.x + bounds.width) < width * 0.97) x = right;
        if (x + w * (bounds.x + bounds.width) > width * 0.97 && left + w * bounds.x >= width * 0.03) x = left;
        y = (node.kind === "character" || architecture ? ground : base.y + base.height * remotionPoint(targetAsset, "base").y) - h * remotionPoint(asset, "base").y;
        depth = base.depth + 1;
        if (node.kind === "character") depth = Math.max(10, depth);
      }
      if (distant && node.kind === "character") y = base.y + base.height * remotionPoint(targetAsset, "base").y - h * remotionPoint(asset, "base").y;
      if (background?.space && node.relation === "behind" && role === "support" && node.layoutY !== undefined) {
        y = nodeGround - h * remotionPoint(asset, "base").y;
        depth = node.layoutDepth ?? depth;
      }
      if (background?.space && node.kind === "character" && node.layoutX !== undefined && (node.relation === "beside" || (node.relation === "behind" && target.kind === "character"))) {
        x = width * node.layoutX - w * remotionPoint(asset, "base").x;
        y = nodeGround - h * remotionPoint(asset, "base").y;
        depth = node.layoutDepth ?? depth;
      }
    }
    if (role === "decal" && !node.relation && floor) {
      x = width * (floor.x + floor.width * 0.5) - w * 0.5;
      y = nodeGround - h * 0.7;
    }
    const result = { ...node, role, x, y, width: w, height: h, depth };
    visiting.delete(node.id);
    placed.set(node.id, result);
    return result;
  };
  const result = separateRemotionSubjects(
    nodes.map(place).sort((a, b) => a.depth - b.depth),
    assets,
    width,
    height,
    !!background?.space,
  );
  for (const node of result) {
    const targets = result.filter((n) => node.groundTargets?.includes(n.id));
    if (!targets.length) continue;
    const points = targets.map((n) => n.x + n.width * remotionPoint(assets[n.assetKey || ""], "base").x);
    const bounds = assets[node.assetKey || ""]?.bounds || { x: 0, y: 0, width: 1, height: 1 };
    const center = (Math.min(...points) + Math.max(...points)) / 2;
    node.width = Math.max(node.width, Math.min(width * 0.9, Math.max(...points) - Math.min(...points) + width * 0.05) / bounds.width);
    node.x = Math.max(width * 0.02 - node.width * bounds.x, Math.min(width * 0.98 - node.width * (bounds.x + bounds.width), center - node.width * (bounds.x + bounds.width / 2)));
  }
  if (!result.length) return result;
  if (background?.space) {
    const root = (node: MotionRemotionPlacedNode, seen = new Set<string>()): string => {
      if (!node.target || !["on", "inside", "heldBy"].includes(node.relation || "") || seen.has(node.id)) return node.id;
      seen.add(node.id);
      const parent = result.find((item) => item.id === node.target);
      return parent ? root(parent, seen) : node.id;
    };
    for (const id of new Set(result.map((node) => root(node)))) {
      const group = result.filter((node) => root(node) === id && remotionRole(node) !== "fixture");
      if (!group.length) continue;
      const rects = group.map((node) => remotionVisibleRect(node, assets[node.assetKey || ""]));
      const left = Math.min(...rects.map((rect) => rect.x)),
        right = Math.max(...rects.map((rect) => rect.x + rect.width));
      const dx = left < 0 ? -left : right > width ? width - right : 0;
      if (right - left <= width) for (const node of group) node.x += dx;
    }
  }
  const fits = result.every((n) => remotionNodeFitsFrame(n, n.kind === "label" ? undefined : assets[n.assetKey!], width, height));
  if (fits) return result;
  if (!background?.space && fit > 0.3) return layoutRemotionNodes(nodes, assets, width, height, background, fit * 0.8);
  throw new Error(
    result
      .filter((n) => !remotionNodeFitsFrame(n, n.kind === "label" ? undefined : assets[n.assetKey!], width, height))
      .map((n) => L.NODE_ERROR(n.id, "bounds", L.GEOMETRY_ERROR))
      .join("; ") || P.LAYOUT,
  );
};
export const validateRemotionSpec = (raw: unknown): MotionRemotionSpec => {
  const spec = raw as MotionRemotionSpec;

  if (
    !spec ||
    spec.engine !== "remotion" ||
    spec.version !== V.VERSION ||
    !Object.hasOwn(V.PROFILES, spec.profileId) ||
    !Number.isInteger(spec.fps) ||
    spec.fps < 1 ||
    spec.fps > 60 ||
    !Number.isFinite(spec.duration) ||
    spec.duration <= 0 ||
    spec.duration > 86400 ||
    ![spec.width, spec.height].every((value) => Number.isFinite(value) && value >= 64 && value <= 8192) ||
    !Array.isArray(spec.scenes) ||
    !spec.scenes.length ||
    spec.scenes.length > V.MAX_SCENES ||
    !spec.assets ||
    Object.keys(spec.assets).length > V.MAX_ASSETS ||
    !Array.isArray(spec.subtitles)
  )
    throw new Error(V.INVALID_SPEC);
  for (const [key, asset] of Object.entries(spec.assets)) {
    const normalized = normalizeMotionVector(asset?.svg, key, asset?.inputKey, asset?.description, asset?.compositionRevision !== undefined);
    if (normalized.width !== asset.width || normalized.height !== asset.height) throw new Error(V.INVALID_SPEC);
    remotionAssetAnchors(asset.anchors);
    if (asset.bounds && !remotionRect(asset.bounds)) throw new Error(V.INVALID_SPEC);
  }
  let end = 0;
  const ids = new Set<string>();
  for (const scene of spec.scenes) {
    if (!scene.id || ids.has(scene.id) || scene.startFrame !== end || !Number.isInteger(scene.endFrame) || scene.endFrame <= scene.startFrame || !Array.isArray(scene.nodes) || scene.nodes.length > V.MAX_NODES || (scene.backgroundKey && !spec.assets[scene.backgroundKey])) throw new Error(V.INVALID_SPEC);
    ids.add(scene.id);
    if (scene.composition) {
      validateSceneComposition(scene.composition, spec.assets[scene.composition.assetKey], scene.nodes);
      if (scene.speaking && (!Array.isArray(scene.speaking) || scene.speaking.some((span) => !span.entityId || !Number.isInteger(span.startFrame) || !Number.isInteger(span.endFrame) || span.endFrame <= span.startFrame))) throw new Error(V.INVALID_SPEC);
      end = scene.endFrame;
      continue;
    }
    if (scene.effects && (!Array.isArray(scene.effects) || scene.effects.some((effect) => !effect || !effect.id || !(L.EFFECTS as readonly string[]).includes(effect.kind) || (effect.intensity !== undefined && (!Number.isFinite(effect.intensity) || effect.intensity < 0 || effect.intensity > 1))))) throw new Error(V.INVALID_SPEC);
    for (const node of scene.nodes) {
      if (!Number.isFinite(node.depth) || (node.kind !== "label" && (!node.assetKey || !spec.assets[node.assetKey])) || !remotionNodeFitsFrame(node, node.kind === "label" ? undefined : spec.assets[node.assetKey!], spec.width, spec.height)) throw new Error(V.INVALID_SPEC);
      const issue = node.kind !== "label" && motionVectorCutoutIssue(spec.assets[node.assetKey!].svg);
      if (issue) throw new Error(V.SVG_ERROR(`${node.description || node.id}: ${issue}`));
    }
    end = scene.endFrame;
  }
  if (end !== Math.ceil(spec.duration * spec.fps)) throw new Error(V.INVALID_SPEC);
  normalizeMotionRenderBehavior(spec.renderBehavior, spec.motion);
  return spec;
};
