import { MOTION_VISUAL as V } from "../constants/motionVisual.js";
import { MOTION_REMOTION_PROMPTS as P } from "../constants/motionRemotionPrompts.js";
import { normalizeMotionVector } from "./motionVectorAsset.js";
import { motionVectorCutoutIssue } from "./motionVectorCutout.js";
import type { MotionRemotionNode, MotionRemotionPlacedNode, MotionRemotionSpec, MotionVectorAsset, MotionRemotionScene, MotionRemotionState } from "../types/motionVisual.js";
import { MOTION_REMOTION_LAYOUT as L } from "../constants/motionRemotionLayout.js";
import { remotionRole, remotionMount, remotionContact, remotionPoint } from "./motionRemotionGeometry.js";
import { normalizeMotionRenderBehavior } from "./motionRenderBehavior.js";
import { MOTION_ASPECT_BASE } from "../constants/motionVideo.js";
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
  if (node.relation === "on" && remotionContact(node) !== "base") return false;
  if (node.appearanceChanged || node.poseEssential || V.REQUIRED_POSE.test(node.pose)) return false;
  const original = new Set(appearance.toLowerCase().match(V.APPEARANCE_MARKERS) || []);
  return !(node.description.toLowerCase().match(V.APPEARANCE_MARKERS) || []).some((marker) => !original.has(marker));
};
export const remotionSceneReadiness = (scene: MotionRemotionScene, state?: MotionRemotionState): { preview?: MotionRemotionSpec; missingBackground?: boolean; missingAssets?: string[]; error?: string } => {
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
  nodes.map((node) => {
    if (node.kind !== "prop" || node.relation || node.mount || !L.PORTRAIT.test(node.description) || !L.ON_SUPPORT.test(node.description)) return node;
    const supports = nodes.filter((target) => target.kind === "prop" && remotionRole(target) === "support" && (L.ALTAR.test(node.description) ? L.ALTAR.test(target.description) : true));
    return supports.length === 1 ? { ...node, relation: "on" as const, target: supports[0].id } : node;
  });
export const layoutRemotionNodes = (nodes: MotionRemotionNode[], assets: Record<string, MotionVectorAsset>, width: number, height: number, background?: MotionVectorAsset, fit = 1): MotionRemotionPlacedNode[] => {
  nodes = normalizeRemotionPlacement(nodes);
  const placed = new Map<string, MotionRemotionPlacedNode>(),
    visiting = new Set<string>();
  const floor = background?.regions?.floor;
  const ground = floor ? (floor.y + floor.height * 0.65) * height : height * 0.82;
  const place = (node: MotionRemotionNode): MotionRemotionPlacedNode => {
    const previous = placed.get(node.id);
    if (previous) return previous;
    if (visiting.has(node.id)) throw new Error(L.NODE_ERROR(node.id, "target", P.CYCLIC_TARGET));
    visiting.add(node.id);
    const asset = node.assetKey ? assets[node.assetKey] : undefined;
    if (node.kind !== "label" && !asset) throw new Error(V.SCENES_REQUIRED);
    const bounds = asset?.bounds || { x: 0, y: 0, width: 1, height: 1 };
    const role = remotionRole(node),
      ratio = asset ? asset.width / asset.height : 4;
    const visibleRatio = (ratio * bounds.width) / bounds.height;
    let visibleH = height * (node.kind === "character" ? 0.46 : node.kind === "label" ? 0.06 : role === "fixture" ? 0.68 : role === "support" ? 0.25 : role === "decal" ? 0.045 : L.SMALL.test(node.description) ? 0.12 : L.WIDE.test(node.description) ? 0.13 : 0.18);
    const cap = width * (node.kind === "character" ? 0.24 : role === "fixture" ? 0.32 : role === "support" ? 0.38 : role === "decal" ? 0.32 : 0.22);
    let visibleW = Math.min(cap, visibleH * visibleRatio);
    visibleH = visibleW / visibleRatio;
    let w = visibleW / bounds.width,
      h = visibleH / bounds.height;
    if (role !== "fixture") {
      w *= fit;
      h *= fit;
    }
    const peers = nodes.filter((other) => other.slot === node.slot && !other.relation && other.kind !== "label" && remotionRole(other) !== "fixture");
    const index = peers.findIndex((other) => other.id === node.id);
    const column = node.slot === "left" ? 0.24 : node.slot === "right" ? 0.76 : 0.5;
    let own = remotionPoint(asset, "base");
    let x = width * column - w * own.x + (peers.length > 1 ? (index - (peers.length - 1) / 2) * Math.min(width * 0.18, (width * 0.5) / peers.length) : 0);
    let y = node.kind === "label" ? height * 0.12 : ground - h * own.y;
    let depth = node.kind === "label" ? 100 : role === "fixture" ? 2 : role === "decal" ? 4 : node.kind === "character" ? 10 : 8;
    if ((role === "fixture" || node.mount) && !node.relation) {
      const mount = remotionMount(node);
      const region = background?.regions?.[mount];
      const r = region || (mount === "floor" ? { x: 0.34, y: 0.76, width: 0.32, height: 0.055 } : mount === "pillar" ? { x: 0.1, y: 0.08, width: 0.08, height: 0.74 } : mount === "wall" ? { x: 0.65, y: 0.18, width: 0.2, height: 0.35 } : mount === "ceiling" ? { x: 0.3, y: 0.04, width: 0.4, height: 0.1 } : { x: 0.34, y: 0.12, width: 0.28, height: 0.7 });
      const scale = Math.min(role === "fixture" ? Infinity : 1, (width * r.width) / visibleW, (height * r.height) / visibleH);
      w *= scale;
      h *= scale;
      x = width * (r.x + r.width * 0.5) - w * (bounds.x + bounds.width * 0.5);
      y = height * (r.y + r.height * (mount === "wall" ? 0.5 : 1)) - h * (bounds.y + bounds.height * (mount === "wall" ? 0.5 : 1));
    }
    if (node.target && node.relation) {
      const target = nodes.find((other) => other.id === node.target);
      if (!target) throw new Error(L.NODE_ERROR(node.id, "target", P.INVALID_TARGET));
      const base = place(target),
        targetAsset = target.assetKey ? assets[target.assetKey] : undefined;
      const anchorName = node.relation === "on" ? "surface" : node.relation === "heldBy" ? "grip" : node.relation === "inside" ? "inside" : undefined;
      if (anchorName && !targetAsset?.anchors?.[anchorName]) throw new Error(L.NODE_ERROR(node.id, `${target.id}.${anchorName}`, L.CONTACT_ERROR));
      if (node.relation === "heldBy" || (node.relation === "on" && node.kind !== "character") || node.relation === "inside") {
        const tb = targetAsset?.bounds || { x: 0, y: 0, width: 1, height: 1 };
        const maxW = base.width * tb.width * (node.relation === "heldBy" ? 0.85 : node.relation === "inside" ? 0.72 : L.WIDE.test(node.description) ? 0.86 : 0.42);
        const maxH = node.relation === "heldBy" ? base.height * 0.24 : node.relation === "inside" ? base.height * 0.65 : height * 0.16;
        const scale = Math.min(1, maxW / (w * bounds.width), maxH / (h * bounds.height));
        w *= scale;
        h *= scale;
      }
      if (anchorName) {
        const anchor = targetAsset!.anchors![anchorName];
        own = remotionPoint(asset, node.relation === "inside" ? "inside" : node.relation === "heldBy" ? "grip" : remotionContact(node));
        x = base.x + base.width * anchor.x - w * own.x;
        y = base.y + base.height * anchor.y - h * own.y;
        depth = base.depth + 1;
      } else if (node.relation === "behind") {
        x = base.x + base.width * 0.58 - w * bounds.x;
        y = base.y + base.height - h * remotionPoint(asset, "base").y;
        depth = base.depth - 1;
      } else {
        const tb = targetAsset?.bounds || { x: 0, y: 0, width: 1, height: 1 };
        const left = base.x + base.width * tb.x - w * (bounds.x + bounds.width) - width * 0.025;
        const right = base.x + base.width * (tb.x + tb.width) + width * 0.025 - w * bounds.x;
        x = node.slot === "left" ? left : right;
        if (x < width * 0.03 && right + w * (bounds.x + bounds.width) < width * 0.97) x = right;
        if (x + w > width * 0.97 && left >= width * 0.03) x = left;
        y = base.y + base.height * remotionPoint(targetAsset, "base").y - h * remotionPoint(asset, "base").y;
        depth = base.depth + 1;
      }
    }
    if (role === "decal" && !node.relation && floor) {
      x = width * (floor.x + floor.width * 0.5) - w * 0.5;
      y = ground - h * 0.7;
    }
    const result = { ...node, role, x, y, width: w, height: h, depth };
    visiting.delete(node.id);
    placed.set(node.id, result);
    return result;
  };
  const result = nodes.map(place).sort((a, b) => a.depth - b.depth);
  if (!result.length) return result;
  const fits = result.every((n) => n.x >= 0 && n.y >= 0 && n.x + n.width <= width + 0.5 && n.y + n.height <= height * 0.9 + 0.5);
  if (fits) return result;
  if (fit > 0.3) return layoutRemotionNodes(nodes, assets, width, height, background, fit * 0.8);
  throw new Error(
    result
      .filter((n) => n.x < 0 || n.y < 0 || n.x + n.width > width + 0.5 || n.y + n.height > height * 0.9 + 0.5)
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
    const normalized = normalizeMotionVector(asset?.svg, key, asset?.inputKey, asset?.description);
    if (normalized.width !== asset.width || normalized.height !== asset.height) throw new Error(V.INVALID_SPEC);
    remotionAssetAnchors(asset.anchors);
    if (asset.bounds && (!Number.isFinite(asset.bounds.x) || !Number.isFinite(asset.bounds.y) || !Number.isFinite(asset.bounds.width) || !Number.isFinite(asset.bounds.height) || asset.bounds.width <= 0 || asset.bounds.height <= 0)) throw new Error(V.INVALID_SPEC);
  }
  let end = 0;
  const ids = new Set<string>();
  for (const scene of spec.scenes) {
    if (!scene.id || ids.has(scene.id) || scene.startFrame !== end || !Number.isInteger(scene.endFrame) || scene.endFrame <= scene.startFrame || !Array.isArray(scene.nodes) || scene.nodes.length > V.MAX_NODES || (scene.backgroundKey && !spec.assets[scene.backgroundKey])) throw new Error(V.INVALID_SPEC);
    ids.add(scene.id);
    if (scene.effects && (!Array.isArray(scene.effects) || scene.effects.some((effect) => !effect || !effect.id || !(L.EFFECTS as readonly string[]).includes(effect.kind) || (effect.intensity !== undefined && (!Number.isFinite(effect.intensity) || effect.intensity < 0 || effect.intensity > 1))))) throw new Error(V.INVALID_SPEC);
    for (const node of scene.nodes) {
      if (![node.x, node.y, node.width, node.height, node.depth].every(Number.isFinite) || node.x < 0 || node.y < 0 || node.width <= 0 || node.height <= 0 || node.x + node.width > spec.width + 1 || node.y + node.height > spec.height + 1 || (node.kind !== "label" && (!node.assetKey || !spec.assets[node.assetKey]))) throw new Error(V.INVALID_SPEC);
      const issue = node.kind !== "label" && motionVectorCutoutIssue(spec.assets[node.assetKey!].svg);
      if (issue) throw new Error(V.SVG_ERROR(`${node.description || node.id}: ${issue}`));
    }
    end = scene.endFrame;
  }
  if (end !== Math.ceil(spec.duration * spec.fps)) throw new Error(V.INVALID_SPEC);
  normalizeMotionRenderBehavior(spec.renderBehavior, spec.motion);
  return spec;
};
