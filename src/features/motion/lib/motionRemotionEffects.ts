import { RUNTIME_TEXT as RT_SHARED } from "../../../constants/runtime/shared.js";
import { RUNTIME_TEXT as RT_MOTION } from "../constants/runtimeText.js";
import { stringifyJson } from "../../../lib/jsonStringify.js";
import { MOTION_REMOTION_LAYOUT as L } from "../../../constants/motionRemotionLayout.js";
import { MOTION_RENDER_BEHAVIOR as B } from "../../../constants/motionRenderBehavior.js";
import { normalizeMotionRenderBehavior } from "../../../lib/motionRenderBehavior.js";
import { motionCameraFrame } from "../../../lib/motionCamera.js";
import { motionSceneCameraDirection, motionSceneSubjectPoint } from "../../../lib/motionSceneCamera.js";
import { remotionPoint, remotionVisibleRect } from "../../../lib/motionRemotionGeometry.js";
import { remotionObjectIdentity } from "../../../lib/motionRemotionGeometry.js";
import type { MotionRemotionScene, MotionRemotionNode, MotionRemotionPlacedNode, MotionVectorAsset, MotionRemotionTimedScene, MotionRenderBehavior, MotionVisualRect } from "../../../types/motionVisual.js";
export const motionFrameSeconds = (frame: number, fps: number) => Math.max(0, frame) / Math.max(1, fps);
export const motionStableSeed = (value: string): number => {
  let seed = 2166136261;
  for (const c of value) seed = Math.imul(seed ^ c.charCodeAt(0), 16777619);
  return (seed >>> 0) / 4294967296;
};
export const motionActorScale = (behavior: MotionRenderBehavior, seconds: number, id: string, locked = false) => (behavior.actors === RT_SHARED.SIMPLE && !locked ? 1 + B.ACTOR.AMOUNT * (0.5 - 0.5 * Math.cos((seconds * Math.PI * 2) / B.ACTOR.SECONDS + motionStableSeed(id) * Math.PI * 2)) : 1);
export const motionPropAngle = (behavior: MotionRenderBehavior, seconds: number, id: string) => (behavior.sceneEffects === RT_SHARED.GENTLE ? Math.sin(seconds * 0.65 + motionStableSeed(id) * Math.PI * 2) * 0.35 : 0);
export const motionActorLocked = (scene: MotionRemotionScene, node: MotionRemotionNode) => (node.kind === RT_SHARED.CHARACTER ? node.relation === RT_SHARED.ON || node.relation === RT_SHARED.INSIDE : !!node.relation || scene.nodes.some((n) => n.target === node.id));
export const motionNodeFrame = (scene: MotionRemotionTimedScene, node: MotionRemotionPlacedNode, assets: Record<string, MotionVectorAsset>, behavior: MotionRenderBehavior, seconds: number) => {
  const owner = (item: MotionRemotionPlacedNode, seen = new Set<string>()): MotionRemotionPlacedNode | undefined => {
    if (seen.has(item.id)) return;
    seen.add(item.id);
    if (item.kind === RT_SHARED.CHARACTER) return item;
    const target = item.target && ([RT_SHARED.HELDBY, RT_SHARED.INSIDE, RT_SHARED.ON] as string[]).includes(item.relation || "") && scene.nodes.find((candidate) => candidate.id === item.target);
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
  if (scene?.view !== RT_SHARED.DETAIL) return { scale: 1, x: 0, y: 0 };
  const selected = scene.nodes.filter((n) => n.kind !== RT_SHARED.LABEL && scene.focus?.includes(n.id));
  const clues = scene.nodes.filter((n) => n.role === RT_SHARED.DECAL && n.target && selected.some((item) => item.id === n.id || item.id === n.target));
  const focus = clues.length ? scene.nodes.filter((n) => clues.some((clue) => clue.id === n.id || clue.target === n.id)) : selected.length ? selected : scene.nodes.filter((n) => n.kind !== RT_SHARED.LABEL && (n.essential || n.kind === RT_SHARED.CHARACTER || n.role === RT_SHARED.OBJECT || n.role === RT_SHARED.DECAL));
  if (!focus.length) return { scale: 1, x: 0, y: 0 };
  const portrait = !clues.length && selected.length > 0 && focus.every((n) => n.kind === RT_SHARED.CHARACTER);
  const rects = focus.map((n) => {
    const rect = remotionVisibleRect(n, assets[n.assetKey || ""]);
    const marks = clues.filter((clue) => clue.target === n.id);
    if (n.kind === RT_SHARED.CHARACTER && marks.length) {
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
  const key = (item: MotionRemotionTimedScene) => stringifyJson([item.composition?.assetKey || item.id, item.composition?.design?.cameraMotion, item.view || RT_MOTION.WIDE, [...(item.focus || [])].sort()]);
  const shotKey = key(scene);
  let first = index,
    last = index;
  while (first > 0 && scenes[first - 1].endFrame === scenes[first].startFrame && key(scenes[first - 1]) === shotKey) first--;
  while (last < scenes.length - 1 && scenes[last].endFrame === scenes[last + 1].startFrame && key(scenes[last + 1]) === shotKey) last++;
  return { startFrame: scenes[first].startFrame, endFrame: scenes[last].endFrame, id: scenes[first].id };
};
export const motionSceneCameraFrame = (behavior: MotionRenderBehavior, seconds: number, scene: MotionRemotionTimedScene | undefined, width: number, height: number, fps = 30, scenes: MotionRemotionTimedScene[] = [], assets: Record<string, MotionVectorAsset> = {}) => {
  if (behavior.actors === RT_SHARED.FIXED || behavior.camera === RT_SHARED.FIXED) return { scale: 1, x: 0, y: 0, mode: scene?.composition?.design?.cameraMotion?.mode || "hold" };
  const view = remotionSceneView(scene, width, height, assets);
  const range = remotionCameraRange(scene, scenes);
  const selected = (scene?.nodes || []).filter((node) => node.essential || node.kind === RT_SHARED.CHARACTER || scene?.focus?.includes(node.id));
  const protectedRects = scene?.composition
    ? (scene.composition.design?.placements || [])
        .filter((placement) => selected.some((node) => node.id === placement.id))
        .map(({ id, box }) => {
          const asset = assets[scene.composition!.assetKey],
            rect = { x: box.x * width, y: box.y * height, width: box.width * width, height: box.height * height };
          if (!asset || behavior.actors === RT_SHARED.FIXED) return rect;
          const points = [
            [rect.x, rect.y],
            [rect.x + rect.width, rect.y],
            [rect.x, rect.y + rect.height],
            [rect.x + rect.width, rect.y + rect.height],
          ].map(([x, y]) => motionSceneSubjectPoint(scene.composition!, asset, id, { x, y }, Math.max(0, seconds - scene.startFrame / fps)));
          const x = Math.min(...points.map((p) => p.x)),
            y = Math.min(...points.map((p) => p.y));
          return { x, y, width: Math.max(...points.map((p) => p.x)) - x, height: Math.max(...points.map((p) => p.y)) - y };
        })
    : selected.map((node) => {
        const rect = remotionVisibleRect(node, assets[node.assetKey || ""]);
        return { x: rect.x * view.scale + view.x, y: rect.y * view.scale + view.y, width: rect.width * view.scale, height: rect.height * view.scale };
      });
  const asset = scene?.composition && assets[scene.composition.assetKey];
  const direction = scene && asset ? motionSceneCameraDirection(scene, asset, Math.max(0, seconds - scene.startFrame / fps), (scene.endFrame - scene.startFrame) / fps) : { mode: "hold" as const };
  return motionCameraFrame({ enabled: behavior.actors === RT_SHARED.SIMPLE && behavior.camera === RT_SHARED.GENTLE, seconds, start: (range?.startFrame || 0) / fps, end: range ? range.endFrame / fps : 12, width, height, seed: range?.id || scene?.id || "", protectedRects, ...direction });
};
export const remotionSceneEffects = (scene: MotionRemotionScene): NonNullable<MotionRemotionScene["effects"]> => {
  if (scene.effects)
    return scene.effects.map((effect) => {
      if (effect.kind === RT_MOTION.RAIN || effect.kind === RT_MOTION.FOG) return { ...effect, source: undefined, anchor: undefined, region: effect.region && !([RT_SHARED.BACKGROUND, RT_SHARED.CENTER, RT_SHARED.LEFT, RT_SHARED.RIGHT] as string[]).includes(effect.region) ? effect.region : effect.kind === RT_MOTION.RAIN ? RT_MOTION.OUTDOORS : RT_SHARED.FLOOR };
      const anchor = effect.anchor && (L.ANCHORS as readonly string[]).includes(effect.anchor) ? effect.anchor : effect.kind === RT_MOTION.FLAME ? RT_MOTION.FLAME : effect.kind === RT_MOTION.SWAY ? RT_MOTION.PIVOT : RT_SHARED.EMITTER;
      return { ...effect, anchor };
    });
  const effects: NonNullable<MotionRemotionScene["effects"]> = [];
  if (L.RAIN.test(scene.weather || "") || /mưa|\brain\b/i.test(scene.text)) effects.push({ id: RT_MOTION.WEATHER_RAIN, kind: RT_MOTION.RAIN, region: RT_MOTION.OUTDOORS });
  for (const node of scene.nodes) {
    if (/khói|\bsmoke\b/i.test(scene.text) && L.SMOKE.test(node.description) && !/extinguished|cold|unlit/i.test(node.description)) effects.push({ id: `${RT_MOTION.SMOKE}${node.id}`, kind: RT_SHARED.SMOKE, source: node.id, anchor: RT_SHARED.EMITTER, direction: /là đà|sát đất|sát mép|ground/i.test(scene.text) ? RT_SHARED.GROUND : RT_SHARED.UP });
    if (L.LAMP.test(node.description) && /glow|lit|flame|burning/i.test(node.description)) effects.push({ id: `${RT_MOTION.FLAME_2813D5}${node.id}`, kind: RT_MOTION.FLAME, source: node.id, anchor: RT_MOTION.FLAME });
    if (L.STEAM.test(node.description)) effects.push({ id: `${RT_MOTION.STEAM}${node.id}`, kind: RT_SHARED.STEAM, source: node.id, anchor: RT_SHARED.EMITTER });
  }
  return effects;
};
export const remotionEffectGeometry = (scene: MotionRemotionTimedScene, assets: Record<string, MotionVectorAsset>, width: number, height: number, behavior?: MotionRenderBehavior, seconds = 0) => {
  const off = normalizeMotionRenderBehavior(behavior).sceneEffects === RT_SHARED.OFF;
  const bg = assets[scene.backgroundKey || ""];
  return remotionSceneEffects(scene).flatMap((effect) => {
    if (off && !effect.essential) return [];
    const node = scene.nodes.find((n) => n.id === effect.source),
      asset = node?.assetKey ? assets[node.assetKey] : undefined;
    if (effect.source && !node) return [];
    if ((effect.kind === RT_SHARED.SMOKE || effect.kind === RT_SHARED.STEAM || effect.kind === RT_MOTION.FLAME || effect.kind === RT_MOTION.SWAY) && (!node || !asset?.anchors?.[effect.anchor || (effect.kind === RT_MOTION.FLAME ? RT_MOTION.FLAME : effect.kind === RT_MOTION.SWAY ? RT_MOTION.PIVOT : RT_SHARED.EMITTER)])) return [];
    const region: MotionVisualRect | undefined = bg?.regions?.[effect.region || (effect.kind === RT_MOTION.RAIN ? RT_MOTION.OUTDOORS : RT_SHARED.FLOOR)];
    if ((effect.kind === RT_MOTION.RAIN || effect.kind === RT_MOTION.FOG) && !region) return [];
    if (!node && !region) return [];
    const anchor = remotionPoint(asset, effect.anchor || (effect.kind === RT_MOTION.FLAME ? RT_MOTION.FLAME : RT_SHARED.EMITTER));
    let x = node ? node.x + node.width * anchor.x : (region!.x + region!.width * 0.5) * width;
    let y = node ? node.y + node.height * anchor.y : (region!.y + region!.height * 0.5) * height;
    if (node) {
      const frame = motionNodeFrame(scene, node, assets, normalizeMotionRenderBehavior(behavior), seconds);
      y = frame.y + frame.height * anchor.y;
    }
    const sway = node?.kind === RT_SHARED.PROP && !node.relation && !scene.nodes.some((n) => n.target === node.id) && scene.effects?.find((e) => e.kind === RT_MOTION.SWAY && e.source === node.id);
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
        seed: motionStableSeed(`${scene.locationKey || scene.place}${RT_SHARED.SYMBOL_E7AC07}${effect.kind}${RT_SHARED.SYMBOL_E7AC07}${node ? remotionObjectIdentity(node) : effect.region || RT_MOTION.OUTDOORS}`),
      },
    ];
  });
};
