import { compositionElements, validateSceneComposition } from "./motionSceneComposition.js";
import { motionAnonymousLayer } from "./motionActorTracks.js";
import { motionSemanticText } from "./motionResourceSemantics.js";
import { motionEffectKind, motionEffectDeclaration } from "./motionEffectIdentity.js";
import { MOTION_COMPOSITION_MOTION } from "../constants/motionCompositionMotion.js";
import { MOTION_PROFILE_MOTION } from "../constants/motionProfileMotion.js";
import type { MotionMeasuredRect, MotionRemotionEffect, MotionRemotionNode, MotionRemotionProfile, MotionRenderBehavior, MotionSceneAnimation, MotionSceneComposition, MotionVectorAsset } from "../types/motionVisual.js";
import { motionNodeAnimalOf, motionNodeStanceOf } from "./motionScenePoses.js";
const validTrack = (composition: MotionSceneComposition, asset: MotionVectorAsset, nodes: MotionRemotionNode[], cast: Set<string>, track: MotionSceneAnimation): boolean => {
  try {
    validateSceneComposition({ ...composition, unchecked: true, animations: [...composition.animations, track] }, asset, nodes, cast);
    return true;
  } catch {
    return false;
  }
};
const boostRotation = (track: MotionSceneAnimation, minRotate: number): MotionSceneAnimation | undefined => {
  if (!minRotate || track.channel !== "actor" || track.attribute !== "transform") return undefined;
  const values = track.keyframes.map((frame) => String(frame.value));
  const angles = values.flatMap((value) => [...value.matchAll(MOTION_COMPOSITION_MOTION.ROTATE)].map((match) => Math.abs(Number(match[1]))));
  if (!angles.length || values.some((value) => !/^\s*rotate\([^)]*\)\s*$/.test(value))) return undefined;
  const peak = Math.max(...angles);
  if (!(peak > 0) || peak >= minRotate) return undefined;
  const factor = minRotate / peak;
  return { ...track, keyframes: track.keyframes.map((frame) => ({ ...frame, value: String(frame.value).replace(MOTION_COMPOSITION_MOTION.ROTATE, (_match, angle: string, rest: string) => `rotate(${Number((Number(angle) * factor).toFixed(2))}${rest})`) })) };
};
export const compositionActorMotion = (composition: MotionSceneComposition, asset: MotionVectorAsset, nodes: MotionRemotionNode[], cast: Set<string>, behavior: MotionRenderBehavior | undefined, profile: MotionRemotionProfile, boxes?: Record<string, MotionMeasuredRect | null>): { composition: MotionSceneComposition; added: number; removed: number; boosted: number; swayed: number } => {
  if (behavior?.actors === "fixed") return { composition, added: 0, removed: 0, boosted: 0, swayed: 0 };
  const policy = MOTION_COMPOSITION_MOTION;
  const style = MOTION_PROFILE_MOTION[profile];
  const elements = compositionElements(asset.svg);
  const contains = (parent: string, child: string) => parent === child || !!elements.get(child)?.ancestors.includes(parent);
  const characters = composition.layers.filter((layer) => layer.kind === "character");
  const animations = composition.animations.filter((track) => {
    if (track.channel !== "actor" || track.attribute !== "transform" || track.source === "sway") return true;
    return !characters.some((layer) => {
      if (!contains(track.target, layer.id) && !contains(layer.id, track.target)) return false;
      const node = nodes.find((item) => item.id === layer.id || (!!layer.entityId && item.entityId === layer.entityId));
      const travel = node && /\b(?:walking|running|walk|run|di bo|chay)\b/.test(motionSemanticText([node.posture, node.pose].join(" ")));
      const airborne = node && /\b(?:flying|hovering|floating in air|levitating|bay|lo lung|lo lung tren khong)\b/.test(motionSemanticText([node.posture, node.pose].join(" "))) && (!node.support || /^(?:air|none|khong khi)$/.test(motionSemanticText(node.support))) && node.relation !== "on" && node.relation !== "inside";
      if (airborne) return false;
      const local = track.target !== layer.id && contains(layer.id, track.target);
      if (local) {
        const descendants = [...elements.keys()].filter((id) => contains(track.target, id));
        const contact = descendants.some((id) => /(?:^|_)(?:pelvis|hip|leg|foot|feet|knee|seat|base)(?:_|$)/i.test(id));
        const isolated = /(?:^|_)(?:arm|eye|eyelids?|brows?|mouth|breath|chest)(?:_|$)/i.test(track.target) || !!style.freeParts?.test(track.target) || (!!travel && /(?:^|_)(?:leg|foot|feet|knee)(?:_|$)/i.test(track.target));
        const chestHasAttachments = /(?:^|_)(?:breath|chest)(?:_|$)/i.test(track.target) && descendants.some((id) => /(?:^|_)(?:head|neck|hand|arm)(?:_|$)/i.test(id));
        const foreign = composition.layers.some((other) => other.id !== layer.id && other.kind === "character" && contains(track.target, other.id));
        if (isolated && (!contact || travel) && !foreign && !chestHasAttachments) return false;
        return true;
      }
      const supported = node && (/\b(?:seated|sitting|kneel\w*|lying|reclin\w*|riding|mounted|crouch\w*|ngoi|quy|nam|cuoi)\b/.test(motionSemanticText([node.posture, node.pose].join(" "))) || node.relation === "on" || node.relation === "inside" || (!!node.support && !/^(?:floor|ground|earth|san|dat)$/.test(motionSemanticText(node.support))));
      return !travel || !!supported || track.period !== undefined || !track.keyframes.every((frame) => /^translate\(\s*[-+\d.eE]+(?:[\s,]+0(?:\.0+)?)?\s*\)$/.test(String(frame.value)));
    });
  });
  const removed = composition.animations.length - animations.length;
  let boosted = 0;
  const lively = animations.map((track) => {
    const next = boostRotation(track, style.minRotate);
    if (next) boosted++;
    return next || track;
  });
  let result = removed || boosted ? { ...composition, animations: lively } : composition;
  let added = 0;
  if (behavior?.actors !== "simple") return { composition: result, added, removed, boosted, swayed: 0 };
  const inside = (layerId: string) => [...elements.keys()].filter((id) => id !== layerId && contains(layerId, id) && !composition.layers.some((other) => other.id !== layerId && other.kind !== "background" && contains(layerId, other.id) && contains(other.id, id)));
  for (const layer of characters) {
    if (motionAnonymousLayer(layer) || nodes.some((node) => node.id === layer.id && node.representation === "detail")) continue;
    const parts = inside(layer.id);
    const bodyMoving = result.animations.some((track) => track.channel === "actor" && track.attribute === "transform" && (track.target === layer.id || (contains(layer.id, track.target) && policy.BODY_PART.test(track.target))));
    const anyMoving = result.animations.some((track) => track.channel === "actor" && (contains(layer.id, track.target) || contains(track.target, layer.id)));
    if (bodyMoving || (anyMoving && !style.bodyFallback)) continue;
    const exactChest = policy.chestSuffixes.map((suffix) => layer.id + suffix).find((id) => elements.has(id) && contains(layer.id, id));
    const exactHead = style.headSuffixes.map((suffix) => layer.id + suffix).find((id) => elements.has(id) && contains(layer.id, id));
    const chestCandidate = exactChest || (style.bodyFallback ? parts.find((id) => policy.CHEST_PART.test(id) && !parts.some((child) => child !== id && contains(id, child) && policy.ATTACHED_TO_CHEST.test(child))) : undefined);
    const headCandidate = exactHead || (style.bodyFallback && style.headBob ? parts.find((id) => policy.HEAD_PART.test(id)) : undefined);
    const usable = (candidate: string | undefined, isChest: boolean): boolean =>
      !!candidate &&
      !result.animations.some((track) => track.target === candidate && track.attribute === "transform") &&
      !composition.layers.some((other) => other.id !== layer.id && contains(candidate, other.id)) &&
      ![...elements.keys()].some((id) => contains(candidate, id) && (isChest ? /(?:^|_)(?:head|neck|hand|arm|pelvis|hip|leg|foot|feet|knee|seat|base)(?:_|$)/i : policy.CONTACT_PART).test(id));
    const chest = usable(chestCandidate, true) ? chestCandidate : undefined;
    const head = chest ? undefined : usable(headCandidate, false) ? headCandidate : undefined;
    const target = chest || head;
    if (!target) continue;
    const bob = Number((asset.height * style.headBob).toFixed(2));
    const track: MotionSceneAnimation = {
      target,
      channel: "actor",
      attribute: "transform",
      period: policy.breathSeconds,
      keyframes: chest
        ? [
            { at: 0, value: "scale(1 1)" },
            { at: policy.breathSeconds / 2, value: `scale(1 ${style.breathScale})` },
            { at: policy.breathSeconds, value: "scale(1 1)" },
          ]
        : [
            { at: 0, value: "translate(0 0)" },
            { at: policy.breathSeconds / 2, value: `translate(0 ${-bob})` },
            { at: policy.breathSeconds, value: "translate(0 0)" },
          ],
    };
    if ((!chest && !bob) || !validTrack(result, asset, nodes, cast, track)) continue;
    result = { ...result, animations: [...result.animations, track] };
    added++;
  }
  const sway = motionCompositionSway(result, asset, nodes, cast, profile, boxes);
  return { composition: sway.composition, added, removed, boosted, swayed: sway.added };
};
const rockTrack = (target: string, cx: number, cy: number, degrees: number, seconds: number): MotionSceneAnimation => {
  const at = (value: number) => `rotate(${Number(value.toFixed(2))} ${Number(cx.toFixed(2))} ${Number(cy.toFixed(2))})`;
  return { target, channel: "actor", attribute: "transform", period: seconds, source: "sway", keyframes: [{ at: 0, value: at(0) }, { at: seconds / 4, value: at(degrees) }, { at: seconds / 2, value: at(0) }, { at: (3 * seconds) / 4, value: at(-degrees) }, { at: seconds, value: at(0) }] };
};
export const motionCompositionSway = (composition: MotionSceneComposition, asset: MotionVectorAsset, nodes: MotionRemotionNode[], cast: Set<string>, profile: MotionRemotionProfile, boxes?: Record<string, MotionMeasuredRect | null>): { composition: MotionSceneComposition; added: number } => {
  const style = MOTION_PROFILE_MOTION[profile];
  if (!boxes) return { composition, added: 0 };
  const policy = MOTION_COMPOSITION_MOTION;
  let elements: ReturnType<typeof compositionElements>;
  try {
    elements = compositionElements(asset.svg);
  } catch {
    return { composition, added: 0 };
  }
  const contains = (parent: string, child: string) => parent === child || !!elements.get(child)?.ancestors.includes(parent);
  let result = composition;
  let added = 0;
  const has = (target: string) => result.animations.some((track) => track.target === target && track.attribute === "transform");
  composition.layers.forEach((layer, index) => {
    const node = nodes.find((item) => item.id === layer.id);
    const box = boxes[layer.id];
    if (!node || !box?.local || !elements.has(layer.id)) return;
    const animal = motionNodeAnimalOf(node, cast);
    const seconds = (animal ? style.animal.seconds : style.sway.seconds) + index * style.sway.stride;
    if (layer.kind === "character" && !animal) {
      if (!style.sway.degrees || box.height > style.sway.maxHeight || policy.SWAY_SKIP.includes(motionNodeStanceOf(node)) || has(layer.id)) return;
      if (result.animations.some((track) => track.channel === "actor" && contains(layer.id, track.target) && policy.BODY_PART.test(track.target)) && box.height > style.sway.maxHeight) return;
      result = { ...result, animations: [...result.animations, rockTrack(layer.id, box.local.x + box.local.width / 2, box.local.y + box.local.height, style.sway.degrees, seconds)] };
      added++;
      return;
    }
    if (!animal || result.animations.some((track) => track.channel === "actor" && contains(layer.id, track.target))) return;
    const parts = [...elements.keys()].filter((id) => id !== layer.id && contains(layer.id, id));
    const center = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
    const tracks: MotionSceneAnimation[] = [];
    for (const [pattern, degrees] of [
      [policy.ANIMAL_TAIL, style.animal.tail],
      [policy.ANIMAL_HEAD, style.animal.head],
    ] as const) {
      const part = parts.find((id) => pattern.test(id) && !parts.some((other) => other !== id && pattern.test(other) && elements.get(id)?.ancestors.includes(other)));
      const partBox = part ? boxes[part] : undefined;
      if (!degrees || !part || !partBox?.local) continue;
      const nearLeft = Math.abs(partBox.x - center.x) < Math.abs(partBox.x + partBox.width - center.x);
      const pivotX = partBox.local.x + (nearLeft ? 0 : partBox.local.width);
      const pivotY = pattern === policy.ANIMAL_TAIL ? partBox.local.y : partBox.local.y + partBox.local.height;
      tracks.push(rockTrack(part, pivotX, pivotY, degrees, seconds));
    }
    if (!tracks.length && style.animal.rock) tracks.push(rockTrack(layer.id, box.local.x + box.local.width / 2, box.local.y + box.local.height, style.animal.rock, seconds));
    for (const track of tracks) {
      if (has(track.target)) continue;
      result = { ...result, animations: [...result.animations, track] };
      added++;
    }
  });
  return { composition: result, added };
};
export const compositionEffectMotion = (composition: MotionSceneComposition, asset: MotionVectorAsset, nodes: MotionRemotionNode[], cast: Set<string>, behavior: MotionRenderBehavior | undefined, profile: MotionRemotionProfile, effects: MotionRemotionEffect[] = []): { composition: MotionSceneComposition; added: number } => {
  if (behavior?.actors === "fixed" || behavior?.sceneEffects !== "gentle") return { composition, added: 0 };
  const policy = MOTION_COMPOSITION_MOTION;
  const style = MOTION_PROFILE_MOTION[profile];
  const elements = compositionElements(asset.svg);
  const contains = (parent: string, child: string) => parent === child || !!elements.get(child)?.ancestors.includes(parent);
  let result = composition;
  let added = 0;
  for (const layer of composition.layers) {
    if (layer.kind !== "effect" || !elements.has(layer.id)) continue;
    if (result.animations.some((track) => track.channel === "effect" && (contains(layer.id, track.target) || contains(track.target, layer.id)) && track.keyframes.some((frame) => frame.value !== track.keyframes[0].value))) continue;
    if (composition.layers.some((subject) => subject.kind !== "effect" && contains(layer.id, subject.id))) continue;
    const declared = motionEffectDeclaration(layer, effects);
    const kind = declared?.kind || motionEffectKind(layer);
    if (!kind || kind === "sway" || kind === "highlight" || kind === "wind" || kind === "water") continue;
    result = { ...result, animations: result.animations.filter((track) => !(track.channel === "effect" && track.target === layer.id && track.keyframes.every((frame) => frame.value === track.keyframes[0].value))) };
    const base = elements.get(layer.id)!.attributes;
    const opacity = base.opacity === undefined ? 1 : Number(base.opacity);
    if (!Number.isFinite(opacity) || opacity <= 0 || opacity > 1) continue;
    const period = style.effectSeconds ?? policy.effectSeconds;
    const tracks: MotionSceneAnimation[] = [
      {
        target: layer.id,
        channel: "effect",
        attribute: "opacity",
        period,
        keyframes: [
          { at: 0, value: opacity },
          { at: period / 2, value: Number((opacity * style.effectOpacity).toFixed(4)) },
          { at: period, value: opacity },
        ],
      },
    ];
    if (kind === "rain") {
      const dy = Number((asset.height * style.effectTravel).toFixed(2));
      tracks[0].keyframes = [
        { at: 0, value: opacity },
        { at: period * 0.1, value: opacity },
        { at: period * 0.85, value: opacity },
        { at: period * 0.95, value: 0 },
        { at: period, value: opacity },
      ];
      tracks.push({
        target: layer.id,
        channel: "effect",
        attribute: "transform",
        period,
        keyframes: [
          { at: 0, value: "translate(0 0)" },
          { at: period * 0.95, value: `translate(${-dy / 4} ${dy})` },
          { at: period, value: "translate(0 0)" },
        ],
      });
    } else if (kind === "smoke" || kind === "steam" || kind === "fog") {
      const distance = Number((asset.height * style.effectTravel * 0.65).toFixed(2));
      const dx = declared?.direction === "left" ? -distance : declared?.direction === "right" ? distance : 0;
      const dy = dx || declared?.direction === "ground" ? 0 : -distance;
      tracks.push({
        target: layer.id,
        channel: "effect",
        attribute: "transform",
        period,
        keyframes: [
          { at: 0, value: "translate(0 0)" },
          { at: period / 2, value: `translate(${dx} ${dy})` },
          { at: period, value: "translate(0 0)" },
        ],
      });
    }
    let accepted = false;
    for (const track of tracks) {
      if (result.animations.some((existing) => existing.target === track.target && existing.attribute === track.attribute) || !validTrack(result, asset, nodes, cast, track)) continue;
      result = { ...result, animations: [...result.animations, track] };
      accepted = true;
    }
    if (accepted) added++;
  }
  return { composition: result, added };
};
