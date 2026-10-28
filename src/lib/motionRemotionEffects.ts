import { MOTION_REMOTION_LAYOUT as L } from "../constants/motionRemotionLayout.js";
import { MOTION_RENDER_BEHAVIOR as B } from "../constants/motionRenderBehavior.js";
import { normalizeMotionRenderBehavior } from "./motionRenderBehavior.js";
import { remotionPoint, remotionVisibleRect } from "./motionRemotionGeometry.js";
import { remotionObjectIdentity } from "./motionRemotionGeometry.js";
import type { MotionRemotionScene, MotionRemotionNode, MotionRemotionPlacedNode, MotionVectorAsset, MotionRemotionTimedScene, MotionRenderBehavior, MotionVisualRect } from "../types/motionVisual.js";
export const motionFrameSeconds = (frame: number, fps: number) => Math.max(0, frame) / Math.max(1, fps);
export const motionStableSeed = (value: string): number => {
  let seed = 2166136261;
  for (const c of value) seed = Math.imul(seed ^ c.charCodeAt(0), 16777619);
  return (seed >>> 0) / 4294967296;
};
export const motionCameraScale = (behavior: MotionRenderBehavior, seconds: number) => (behavior.camera === "gentle" ? 1 + B.CAMERA.AMOUNT * Math.min(1, Math.max(0, seconds) / B.CAMERA.SECONDS) : 1);
export const motionActorScale = (behavior: MotionRenderBehavior, seconds: number, id: string, locked = false) => (behavior.actors === "simple" && !locked ? 1 + B.ACTOR.AMOUNT * (0.5 - 0.5 * Math.cos((seconds * Math.PI * 2) / B.ACTOR.SECONDS + motionStableSeed(id) * Math.PI * 2)) : 1);
export const motionPropAngle = (behavior: MotionRenderBehavior, seconds: number, id: string) => (behavior.sceneEffects === "gentle" ? Math.sin(seconds * 0.65 + motionStableSeed(id) * Math.PI * 2) * 0.35 : 0);
export const motionActorLocked = (scene: MotionRemotionScene, node: MotionRemotionNode) => (node.kind === "character" ? node.relation === "on" || node.relation === "inside" : !!node.relation || scene.nodes.some((n) => n.target === node.id));
export const motionNodeFrame = (scene: MotionRemotionTimedScene, node: MotionRemotionPlacedNode, assets: Record<string, MotionVectorAsset>, behavior: MotionRenderBehavior, seconds: number) => {
  const owner = (item: MotionRemotionPlacedNode, seen = new Set<string>()): MotionRemotionPlacedNode | undefined => {
    if (seen.has(item.id)) return;
    seen.add(item.id);
    if (item.kind === "character") return item;
    const target = item.target && ["heldBy", "inside", "on"].includes(item.relation || "") && scene.nodes.find((candidate) => candidate.id === item.target);
    return target ? owner(target, seen) : undefined;
  };
  const actor = owner(node);
  if (!actor) return { y: node.y, height: node.height };
  const asset = assets[actor.assetKey || ""],
    pivot = asset?.anchors?.pivot || asset?.anchors?.base || { x: 0.5, y: 1 };
  const py = actor.y + actor.height * pivot.y;
  const scale = motionActorScale(behavior, seconds, actor.entityId || actor.id, motionActorLocked(scene, actor));
  return { y: py + (node.y - py) * scale, height: node.height * scale };
};
export const remotionSceneView = (scene: MotionRemotionTimedScene | undefined, width: number, height: number, assets: Record<string, MotionVectorAsset> = {}) => {
  if (scene?.composition) return { scale: 1, x: 0, y: 0 };
  if (scene?.view !== "detail") return { scale: 1, x: 0, y: 0 };
  const selected = scene.nodes.filter((n) => n.kind !== "label" && scene.focus?.includes(n.id));
  const clues = scene.nodes.filter((n) => n.role === "decal" && n.target && selected.some((item) => item.id === n.id || item.id === n.target));
  const focus = clues.length ? scene.nodes.filter((n) => clues.some((clue) => clue.id === n.id || clue.target === n.id)) : selected.length ? selected : scene.nodes.filter((n) => n.kind !== "label" && (n.essential || n.kind === "character" || n.role === "object" || n.role === "decal"));
  if (!focus.length) return { scale: 1, x: 0, y: 0 };
  const portrait = !clues.length && selected.length > 0 && focus.every((n) => n.kind === "character");
  const rects = focus.map((n) => {
    const rect = remotionVisibleRect(n, assets[n.assetKey || ""]);
    const marks = clues.filter((clue) => clue.target === n.id);
    if (n.kind === "character" && marks.length) {
      const markRects = marks.map((mark) => remotionVisibleRect(mark, assets[mark.assetKey || ""]));
      const cx = markRects.reduce((sum, mark) => sum + mark.x + mark.width / 2, 0) / markRects.length;
      const cy = markRects.reduce((sum, mark) => sum + mark.y + mark.height / 2, 0) / markRects.length;
      return { x: cx - (rect.width * B.CAMERA.DETAIL_ATTACHMENT_WIDTH) / 2, y: cy - (rect.height * B.CAMERA.DETAIL_ATTACHMENT_HEIGHT) / 2, width: rect.width * B.CAMERA.DETAIL_ATTACHMENT_WIDTH, height: rect.height * B.CAMERA.DETAIL_ATTACHMENT_HEIGHT };
    }
    return portrait ? { ...rect, height: rect.height * B.CAMERA.DETAIL_CHARACTER_HEIGHT } : rect;
  });
  const left = Math.min(...rects.map((n) => n.x)),
    right = Math.max(...rects.map((n) => n.x + n.width)),
    top = Math.min(...rects.map((n) => n.y)),
    bottom = Math.max(...rects.map((n) => n.y + n.height));
  const scale = Math.max(1, Math.min(clues.length ? B.CAMERA.DETAIL_CLUE_SCALE : portrait ? B.CAMERA.DETAIL_CHARACTER_SCALE : 1.8, (width * 0.82) / Math.max(1, right - left), (height * 0.7) / Math.max(1, bottom - top)));
  const x = Math.max(Math.max(width - width * scale, -left * scale), Math.min(Math.min(0, width - right * scale), width * 0.5 - (left + right) * 0.5 * scale)),
    y = Math.max(Math.max(height - height * scale, -top * scale), Math.min(Math.min(0, height - bottom * scale), height * 0.43 - (top + bottom) * 0.5 * scale));
  return { scale, x, y };
};
export const remotionCameraRange = (scene: MotionRemotionTimedScene | undefined, scenes: MotionRemotionTimedScene[]) => {
  const index = scene ? scenes.indexOf(scene) : -1;
  if (!scene || index < 0) return scene;
  const key = (item: MotionRemotionTimedScene) => JSON.stringify([item.locationKey || item.place || item.id, item.view || "wide", [...(item.focus || [])].sort()]);
  const shotKey = key(scene);
  let first = index,
    last = index;
  while (first > 0 && scenes[first - 1].endFrame === scenes[first].startFrame && key(scenes[first - 1]) === shotKey) first--;
  while (last < scenes.length - 1 && scenes[last].endFrame === scenes[last + 1].startFrame && key(scenes[last + 1]) === shotKey) last++;
  return { startFrame: scenes[first].startFrame, endFrame: scenes[last].endFrame };
};
export const motionSceneCameraScale = (behavior: MotionRenderBehavior, seconds: number, scene: MotionRemotionTimedScene | undefined, width: number, height: number, fps = 30, scenes: MotionRemotionTimedScene[] = [], assets: Record<string, MotionVectorAsset> = {}) => {
  const view = remotionSceneView(scene, width, height, assets);
  const range = remotionCameraRange(scene, scenes);
  const localSeconds = Math.max(0, seconds - (range?.startFrame || 0) / fps);
  const duration = range ? (range.endFrame - range.startFrame) / fps : B.CAMERA.SECONDS;
  let scale = motionCameraScale(behavior, (localSeconds * B.CAMERA.SECONDS) / Math.max(B.CAMERA.SECONDS, duration));
  if (scene?.composition) return scale;
  for (const node of scene?.nodes || []) {
    if (!node.essential && node.kind !== "character") continue;
    const rect = remotionVisibleRect(node, assets[node.assetKey || ""]);
    const left = rect.x * view.scale + view.x,
      right = (rect.x + rect.width) * view.scale + view.x,
      top = rect.y * view.scale + view.y,
      bottom = (rect.y + rect.height) * view.scale + view.y;
    for (const limit of [width / (width - 2 * left), width / (2 * right - width), height / (height - 2 * top), height / (2 * bottom - height)]) if (Number.isFinite(limit) && limit > 0) scale = Math.min(scale, Math.max(1, limit));
  }
  return scale;
};
export const remotionSceneEffects = (scene: MotionRemotionScene): NonNullable<MotionRemotionScene["effects"]> => {
  if (scene.effects)
    return scene.effects.map((effect) => {
      if (effect.kind === "rain" || effect.kind === "fog") return { ...effect, source: undefined, anchor: undefined, region: effect.region && !["background", "center", "left", "right"].includes(effect.region) ? effect.region : effect.kind === "rain" ? "outdoors" : "floor" };
      const anchor = effect.anchor && (L.ANCHORS as readonly string[]).includes(effect.anchor) ? effect.anchor : effect.kind === "flame" ? "flame" : effect.kind === "sway" ? "pivot" : "emitter";
      return { ...effect, anchor };
    });
  const effects: NonNullable<MotionRemotionScene["effects"]> = [];
  if (L.RAIN.test(scene.weather || "") || /mưa|\brain\b/i.test(scene.text)) effects.push({ id: "weather-rain", kind: "rain", region: "outdoors" });
  for (const node of scene.nodes) {
    if (/khói|\bsmoke\b/i.test(scene.text) && L.SMOKE.test(node.description) && !/extinguished|cold|unlit/i.test(node.description)) effects.push({ id: `smoke-${node.id}`, kind: "smoke", source: node.id, anchor: "emitter", direction: /là đà|sát đất|sát mép|ground/i.test(scene.text) ? "ground" : "up" });
    if (L.LAMP.test(node.description) && /glow|lit|flame|burning/i.test(node.description)) effects.push({ id: `flame-${node.id}`, kind: "flame", source: node.id, anchor: "flame" });
    if (L.STEAM.test(node.description)) effects.push({ id: `steam-${node.id}`, kind: "steam", source: node.id, anchor: "emitter" });
  }
  return effects;
};
export const remotionEffectGeometry = (scene: MotionRemotionTimedScene, assets: Record<string, MotionVectorAsset>, width: number, height: number, behavior?: MotionRenderBehavior, seconds = 0) => {
  const off = normalizeMotionRenderBehavior(behavior).sceneEffects === "off";
  const bg = assets[scene.backgroundKey || ""];
  return remotionSceneEffects(scene).flatMap((effect) => {
    if (off && !effect.essential) return [];
    const node = scene.nodes.find((n) => n.id === effect.source),
      asset = node?.assetKey ? assets[node.assetKey] : undefined;
    if (effect.source && !node) return [];
    if ((effect.kind === "smoke" || effect.kind === "steam" || effect.kind === "flame" || effect.kind === "sway") && (!node || !asset?.anchors?.[effect.anchor || (effect.kind === "flame" ? "flame" : effect.kind === "sway" ? "pivot" : "emitter")])) return [];
    const region: MotionVisualRect | undefined = bg?.regions?.[effect.region || (effect.kind === "rain" ? "outdoors" : "floor")];
    if ((effect.kind === "rain" || effect.kind === "fog") && !region) return [];
    if (!node && !region) return [];
    const anchor = remotionPoint(asset, effect.anchor || (effect.kind === "flame" ? "flame" : "emitter"));
    let x = node ? node.x + node.width * anchor.x : (region!.x + region!.width * 0.5) * width;
    let y = node ? node.y + node.height * anchor.y : (region!.y + region!.height * 0.5) * height;
    if (node) {
      const frame = motionNodeFrame(scene, node, assets, normalizeMotionRenderBehavior(behavior), seconds);
      y = frame.y + frame.height * anchor.y;
    }
    const sway = node?.kind === "prop" && !node.relation && !scene.nodes.some((n) => n.target === node.id) && scene.effects?.find((e) => e.kind === "sway" && e.source === node.id);
    if (sway && asset?.anchors?.pivot) {
      const pivot = asset.anchors.pivot,
        px = node!.x + node!.width * pivot.x,
        py = node!.y + node!.height * pivot.y,
        angle = (motionPropAngle(normalizeMotionRenderBehavior(behavior), seconds, remotionObjectIdentity(node!)) * Math.PI) / 180,
        dx = x - px,
        dy = y - py;
      x = px + dx * Math.cos(angle) - dy * Math.sin(angle);
      y = py + dx * Math.sin(angle) + dy * Math.cos(angle);
    }
    return [
      {
        ...effect,
        static: off,
        x,
        y,
        width: node?.width || region!.width * width,
        height: node?.height || region!.height * height,
        region: region ? { x: region.x * width, y: region.y * height, width: region.width * width, height: region.height * height } : undefined,
        intensity: Math.max(0.1, Math.min(1, effect.intensity ?? 0.5)),
        seed: motionStableSeed(`${scene.locationKey || scene.place}:${effect.kind}:${node ? remotionObjectIdentity(node) : effect.region || "outdoors"}`),
      },
    ];
  });
};
