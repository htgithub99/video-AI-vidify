import * as COMMON_RUNTIME from "../constants/sourceText.js";
import { RUNTIME_VALUES } from "../constants/runtime/values.js";
import { RUNTIME_TEXT as RT_CORE } from "../constants/runtime/core.js";
import { RUNTIME_TEXT as RT_SHARED } from "../constants/runtime/shared.js";
import { MOTION_SCENE_COMPOSITION as C } from "../constants/motionSceneComposition.js";
import { compositionElements } from "./motionSceneComposition.js";
import type { MotionRemotionNode, MotionSceneAnimation, MotionSceneComposition, MotionVectorAsset } from "../types/motionVisual.js";
export const compositionMissingNodes = (composition: MotionSceneComposition, nodes: MotionRemotionNode[]): string[] => nodes.filter((node) => node.kind !== RT_SHARED.LABEL && !composition.layers.some((layer) => layer.id === node.id)).map((node) => node.id);
export const compositionAttachedMotion = (composition: MotionSceneComposition, asset: MotionVectorAsset, nodes: MotionRemotionNode[]) => {
  const elements = compositionElements(asset.svg);
  const held = nodes.filter((node) => node.relation === RUNTIME_VALUES.HELDBY_F9249A57 && node.target && elements.has(node.id));
  const animations = composition.animations.filter((animation) => {
    if (animation.channel !== RT_CORE.ACTOR || animation.attribute !== RT_CORE.TRANSFORM) return true;
    return !held.some((prop) => {
      const owner = composition.layers.find((layer) => layer.id === prop.target || layer.entityId === prop.target)?.id || prop.target!;
      const chain = [animation.target, ...(elements.get(animation.target)?.ancestors || [])];
      const movesOwner = chain.includes(owner);
      return movesOwner && ![prop.id, ...(elements.get(prop.id)?.ancestors || [])].includes(animation.target);
    });
  });
  return { composition: animations.length === composition.animations.length ? composition : { ...composition, animations }, removed: composition.animations.length - animations.length };
};
const compositionClosingTags = (svg: string): string => {
  if (svg.includes(C.GUARD.CLOSE_MARK)) return svg;
  const stack: string[] = [];
  const repaired = svg.replace(C.GUARD.OPEN_TAG, (tag: string, name: string, rest: string) => {
    if (C.GUARD.SELF_CLOSING.test(rest)) return tag;
    if (!rest.trim() && stack.includes(name)) {
      const closed = stack.splice(stack.lastIndexOf(name)).reverse();
      return closed.map(C.GUARD.CLOSE_TAG).join("");
    }
    stack.push(name);
    return tag;
  });
  return repaired + stack.reverse().map(C.GUARD.CLOSE_TAG).join("");
};
export const compositionRepairDraft = (input: Record<string, any>): Record<string, any> => {
  if (typeof input?.svg !== "string") return input;
  const draft: Record<string, any> = { ...input, svg: compositionClosingTags(input.svg.replace(C.GUARD.ESCAPED_TAG, RUNTIME_VALUES.VALUE_DABD3AFF)) };
  if (!Array.isArray(draft.animations)) return draft;
  let elements: ReturnType<typeof compositionElements>;
  try {
    elements = compositionElements(draft.svg);
  } catch {
    return draft;
  }
  const flat = (value: unknown) => String(value).replace(C.GUARD.SEPARATORS, COMMON_RUNTIME.SOURCE_TEXT_SYMBOL_52).trim();
  const numbers = (value: string) => value.match(C.NUMBER)?.map(Number) || [];
  const delta = (base: string, value: unknown, absolute: boolean): string | undefined => {
    const text = flat(value);
    if (text.startsWith(base)) return text.slice(base.length).trim() || C.GUARD.IDENTITY;
    if (!absolute || !C.GUARD.TRANSLATE_START.test(base) || text.replace(C.NUMBER, C.GUARD.SHAPE) !== base.replace(C.NUMBER, C.GUARD.SHAPE)) return undefined;
    const from = numbers(base);
    const to = numbers(text);
    if (to.slice(2).some((value, index) => value !== from[index + 2])) return undefined;
    const scale = base.match(C.GUARD.SCALE);
    const sx = scale ? Number(scale[1]) : 1;
    const sy = scale?.[2] ? Number(scale[2]) : sx;
    if (!sx || !sy) return undefined;
    return C.GUARD.TRANSLATE_VALUE(Number(((to[0] - from[0]) / sx).toFixed(2)), Number(((to[1] - from[1]) / sy).toFixed(2)));
  };
  const animations = draft.animations.map((animation: MotionSceneAnimation) => {
    const base = animation?.attribute === RT_CORE.TRANSFORM ? flat(elements.get(animation.target)?.attributes.transform || "") : "";
    if (!base || !Array.isArray(animation.keyframes)) return animation;
    const absolute = animation.keyframes.some((frame) => flat(frame?.value) === base);
    const values = animation.keyframes.map((frame) => delta(base, frame?.value, absolute));
    if (values.some((value) => value === undefined)) return animation;
    return { ...animation, keyframes: animation.keyframes.map((frame, index) => ({ ...frame, value: values[index]! })) };
  });
  return { ...draft, animations };
};
