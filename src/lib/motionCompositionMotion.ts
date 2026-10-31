import { compositionElements, validateSceneComposition } from "./motionSceneComposition.js";
import { motionAnonymousLayer } from "./motionActorTracks.js";
import { motionSemanticText } from "./motionResourceSemantics.js";
import { motionEffectKind, motionEffectDeclaration } from "./motionEffectIdentity.js";
import { MOTION_COMPOSITION_MOTION } from "../constants/motionCompositionMotion.js";
import type { MotionRemotionEffect, MotionRemotionNode, MotionRemotionProfile, MotionRenderBehavior, MotionSceneAnimation, MotionSceneComposition, MotionVectorAsset } from "../types/motionVisual.js";
const validTrack = (composition: MotionSceneComposition, asset: MotionVectorAsset, nodes: MotionRemotionNode[], cast: Set<string>, track: MotionSceneAnimation): boolean => {
  try {
    validateSceneComposition({ ...composition, unchecked: true, animations: [...composition.animations, track] }, asset, nodes, cast);
    return true;
  } catch {
    return false;
  }
};
export const compositionActorMotion = (composition: MotionSceneComposition, asset: MotionVectorAsset, nodes: MotionRemotionNode[], cast: Set<string>, behavior: MotionRenderBehavior | undefined, _profile: MotionRemotionProfile): { composition: MotionSceneComposition; added: number; removed: number } => {
  if (behavior?.actors === "fixed") return { composition, added: 0, removed: 0 };
  const policy = MOTION_COMPOSITION_MOTION;
  const elements = compositionElements(asset.svg);
  const contains = (parent: string, child: string) => parent === child || !!elements.get(child)?.ancestors.includes(parent);
  const characters = composition.layers.filter((layer) => layer.kind === "character");
  const animations = composition.animations.filter((track) => {
    if (track.channel !== "actor" || track.attribute !== "transform") return true;
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
        const isolated = /(?:^|_)(?:arm|eye|eyelids?|brows?|mouth|breath|chest)(?:_|$)/i.test(track.target) || (!!travel && /(?:^|_)(?:leg|foot|feet|knee)(?:_|$)/i.test(track.target));
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
  let result = removed ? { ...composition, animations } : composition;
  let added = 0;
  if (behavior?.actors !== "simple") return { composition: result, added, removed };
  for (const layer of characters) {
    if (motionAnonymousLayer(layer) || nodes.some((node) => node.id === layer.id && node.representation === "detail") || result.animations.some((track) => track.channel === "actor" && (contains(layer.id, track.target) || contains(track.target, layer.id)))) continue;
    const target = policy.chestSuffixes.map((suffix) => layer.id + suffix).find((id) => elements.has(id) && contains(layer.id, id));
    if (!target || result.animations.some((track) => track.target === target && track.attribute === "transform")) continue;
    const foreignSubject = composition.layers.some((other) => other.id !== layer.id && contains(target, other.id));
    const contactPart = [...elements.keys()].some((id) => contains(target, id) && /(?:^|_)(?:head|neck|hand|arm|pelvis|hip|leg|foot|feet|knee|seat|base)(?:_|$)/i.test(id));
    if (foreignSubject || contactPart) continue;
    const track: MotionSceneAnimation = {
      target,
      channel: "actor",
      attribute: "transform",
      period: policy.breathSeconds,
      keyframes: [
        { at: 0, value: "scale(1 1)" },
        { at: policy.breathSeconds / 2, value: `scale(1 ${policy.breathScale})` },
        { at: policy.breathSeconds, value: "scale(1 1)" },
      ],
    };
    if (!validTrack(result, asset, nodes, cast, track)) continue;
    result = { ...result, animations: [...result.animations, track] };
    added++;
  }
  return { composition: result, added, removed };
};
export const compositionEffectMotion = (composition: MotionSceneComposition, asset: MotionVectorAsset, nodes: MotionRemotionNode[], cast: Set<string>, behavior: MotionRenderBehavior | undefined, _profile: MotionRemotionProfile, effects: MotionRemotionEffect[] = []): { composition: MotionSceneComposition; added: number } => {
  if (behavior?.actors === "fixed" || behavior?.sceneEffects !== "gentle") return { composition, added: 0 };
  const policy = MOTION_COMPOSITION_MOTION;
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
    const period = policy.effectSeconds;
    const tracks: MotionSceneAnimation[] = [
      {
        target: layer.id,
        channel: "effect",
        attribute: "opacity",
        period,
        keyframes: [
          { at: 0, value: opacity },
          { at: period / 2, value: Number((opacity * policy.effectOpacity).toFixed(4)) },
          { at: period, value: opacity },
        ],
      },
    ];
    if (kind === "rain") {
      const dy = Number((asset.height * policy.rainTravel).toFixed(2));
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
      const distance = Number((asset.height * policy.rainTravel * 0.65).toFixed(2));
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
