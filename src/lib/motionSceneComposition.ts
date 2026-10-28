import { MOTION_SCENE_COMPOSITION as C } from "../constants/motionSceneComposition.js";
import { normalizeMotionVector } from "./motionVectorAsset.js";
import { normalizeMotionSceneDesign } from "./motionSceneDesign.js";
import { MOTION_SCENE_DESIGN as D } from "../constants/motionSceneDesign.js";
import type { MotionSceneAnimation, MotionSceneComposition, MotionSceneLayer, MotionRemotionNode, MotionRenderBehavior, MotionVectorAsset } from "../types/motionVisual.js";
type Element = { tag: string; attributes: Record<string, string>; ancestors: string[] };
const attributes = (tag: string) => Object.fromEntries([...tag.matchAll(/([\w:-]+)\s*=\s*("([^"]*)"|'([^']*)')/g)].map((m) => [m[1], m[3] ?? m[4]]));
export const compositionElements = (svg: string): Map<string, Element> => {
  const elements = new Map<string, Element>();
  const stack: (string | undefined)[] = [];
  for (const match of svg.matchAll(/<(\/?)([\w:-]+)\b[^<>]*>/g)) {
    if (match[1]) {
      stack.pop();
      continue;
    }
    const attrs = attributes(match[0]);
    if (attrs.id) {
      if (!C.ID.test(attrs.id) || elements.has(attrs.id)) throw new Error(C.ERROR(attrs.id, C.IDS));
      elements.set(attrs.id, { tag: match[2], attributes: attrs, ancestors: stack.filter((id): id is string => !!id) });
    }
    if (!/\/\s*>$/.test(match[0])) stack.push(attrs.id);
  }
  return elements;
};
const numbers = (value: string | number) => String(value).match(C.NUMBER)?.map(Number) || [];
const structure = (value: string | number) =>
  String(value)
    .replace(C.NUMBER, "#")
    .replace(/[\s,]+/g, "");
const owner = (target: string, elements: Map<string, Element>, layers: MotionSceneLayer[]) => {
  const element = elements.get(target);
  return (
    layers.find((layer) => layer.id === target) ||
    [...(element?.ancestors || [])]
      .reverse()
      .map((id) => layers.find((layer) => layer.id === id))
      .find(Boolean)
  );
};
export const validateSceneComposition = (composition: MotionSceneComposition, asset: MotionVectorAsset, nodes: MotionRemotionNode[] = [], cast?: Set<string>): void => {
  if (
    !composition ||
    !(C.SUPPORTED_REVISIONS as readonly number[]).includes(composition.revision) ||
    !asset ||
    asset.compositionRevision !== composition.revision ||
    composition.assetKey !== asset.key ||
    composition.inputKey !== asset.inputKey ||
    !Array.isArray(composition.layers) ||
    !composition.layers.length ||
    composition.layers.length > C.LAYERS ||
    !Array.isArray(composition.animations) ||
    composition.animations.length > C.ANIMATIONS
  )
    throw new Error(C.ERROR("", C.INVALID));
  const elements = compositionElements(asset.svg);
  if (composition.design) normalizeMotionSceneDesign(composition.design, nodes);
  const ids = new Set<string>();
  for (const layer of composition.layers) {
    if (!layer || !C.ID.test(layer.id) || ids.has(layer.id) || elements.get(layer.id)?.tag !== "g" || !(C.KINDS as readonly string[]).includes(layer.kind) || (layer.kind === "character" && (!layer.entityId || (cast && !cast.has(layer.entityId))))) throw new Error(C.ERROR(layer?.id || "layers", C.IDS));
    ids.add(layer.id);
  }
  if (!composition.layers.some((layer) => layer.kind === "background")) throw new Error(C.ERROR("layers", C.INVALID));
  const missing = nodes.filter((node) => node.kind !== "label" && !composition.layers.some((layer) => layer.id === node.id && (layer.kind === node.kind || (node.kind === "prop" && layer.kind === "effect")) && (node.kind !== "character" || layer.entityId === node.entityId)));
  if (missing.length) throw new Error(C.MISSING(missing.map((node) => node.id)));
  const animated = new Set<string>();
  for (const animation of composition.animations) {
    const element = elements.get(animation.target),
      layer = owner(animation.target, elements, composition.layers);
    const key = `${animation.target}:${animation.attribute}`;
    if (
      !element ||
      !layer ||
      animated.has(key) ||
      !(C.CHANNELS as readonly string[]).includes(animation.channel) ||
      !(C.ATTRIBUTES as readonly string[]).includes(animation.attribute) ||
      !Array.isArray(animation.keyframes) ||
      animation.keyframes.length < 2 ||
      animation.keyframes.length > C.KEYFRAMES ||
      (animation.channel === "effect" ? layer.kind === "character" : layer.kind !== "character") ||
      (animation.channel === "speech" && (!layer.entityId || animation.attribute !== "d" || animation.target === layer.id))
    )
      throw new Error(C.ERROR(animation?.target || "animations", C.MOTION));
    animated.add(key);
    let previous = -1;
    const first = animation.keyframes[0].value;
    for (const frame of animation.keyframes) {
      const value = String(frame.value);
      const valid = animation.attribute === "opacity" ? typeof frame.value === "number" && frame.value >= 0 && frame.value <= 1 : typeof frame.value === "string" && (animation.attribute === "d" ? /^[MmZzLlHhVvCcSsQqTtAaEe\d\s.,+-]+$/.test(value) : /^(?:\s*(?:translate|rotate|scale|matrix|skewX|skewY)\(\s*[-+\d.eE,\s]+\)\s*)+$/.test(value));
      if (!Number.isFinite(frame.at) || frame.at <= previous || frame.at > C.MAX_SECONDS || !valid || structure(frame.value) !== structure(first) || numbers(frame.value).some((n) => !Number.isFinite(n) || Math.abs(n) > 32768)) throw new Error(C.ERROR(animation.target, C.MOTION));
      previous = frame.at;
    }
    if (animation.keyframes[0].at !== 0 || (animation.attribute === "d" && element.tag !== "path") || (animation.period !== undefined && (!Number.isFinite(animation.period) || animation.period < 0.2 || animation.period > C.MAX_SECONDS || animation.period < previous || animation.keyframes.at(-1)!.value !== first))) throw new Error(C.ERROR(animation.target, C.MOTION));
  }
};
export const normalizeSceneComposition = (raw: any, key: string, inputKey: string, description: string, nodes: MotionRemotionNode[], cast: Set<string>, width: number, height: number) => {
  const asset = normalizeMotionVector(raw?.svg, key, inputKey, description, true);
  const viewBox = asset.svg
    .match(/\bviewBox\s*=\s*["']([^"']+)["']/)?.[1]
    .trim()
    .split(/[\s,]+/)
    .map(Number);
  if (!viewBox || viewBox[0] !== 0 || viewBox[1] !== 0 || asset.width !== width || asset.height !== height) throw new Error(C.VIEWBOX);
  const composition: MotionSceneComposition = { revision: C.REVISION, assetKey: key, inputKey, layers: raw?.layers, animations: raw?.animations || [], ...(raw?.design ? { design: normalizeMotionSceneDesign(raw.design, nodes) } : {}), ...(typeof raw?.continuityNotes === "string" ? { continuityNotes: raw.continuityNotes.slice(0, C.CONTINUITY_TEXT_LIMIT) } : {}) };
  validateSceneComposition(composition, asset, nodes, cast);
  return { asset, composition };
};
export const mergeSceneCompositionDraft = (previous: unknown, raw: unknown): Record<string, unknown> => {
  const merged: Record<string, any> = { ...(previous && typeof previous === "object" && !Array.isArray(previous) ? previous : {}), ...(raw && typeof raw === "object" && !Array.isArray(raw) ? Object.fromEntries(Object.entries(raw).filter(([, value]) => value !== undefined)) : {}) };
  if (merged.groupPatches !== undefined) {
    if (previous && typeof previous === "object" && "svg" in previous && typeof previous.svg === "string") merged.svg = previous.svg;
    if (typeof merged.svg !== "string" || !Array.isArray(merged.groupPatches) || merged.groupPatches.length > C.LAYERS) throw new Error(D.PATCH_INVALID);
    const svg: string = merged.svg;
    const spans = new Map<string, { start: number; end: number; tag: string }>();
    const stack: { id?: string; start: number; tag: string }[] = [];
    for (const match of svg.matchAll(/<(\/?)([\w:-]+)\b[^<>]*>/g)) {
      if (match[1]) {
        const open = stack.pop();
        if (open?.id) spans.set(open.id, { start: open.start, end: match.index! + match[0].length, tag: open.tag });
      } else {
        const open = { id: attributes(match[0]).id, start: match.index!, tag: match[2] };
        if (!/\/\s*>$/.test(match[0])) stack.push(open);
        else if (open.id) spans.set(open.id, { start: open.start, end: match.index! + match[0].length, tag: open.tag });
      }
    }
    const replacements: { start: number; end: number; svg: string }[] = [];
    for (const patch of merged.groupPatches) {
      const span = spans.get(patch?.id);
      const root = typeof patch?.svg === "string" && patch.svg.trim().match(/^<g\b[^<>]*>/)?.[0];
      if (!span || span.tag !== "g" || !root || attributes(root).id !== patch.id || replacements.some((old) => span.start < old.end && span.end > old.start)) throw new Error(D.PATCH_INVALID);
      let depth = 0,
        end = 0;
      const fragment = patch.svg.trim();
      for (const token of fragment.matchAll(/<(\/?)[\w:-]+\b[^<>]*>/g)) {
        if (token[1]) depth--;
        else if (!/\/\s*>$/.test(token[0])) depth++;
        if (!depth) {
          end = token.index! + token[0].length;
          break;
        }
      }
      if (end !== fragment.length) throw new Error(D.PATCH_INVALID);
      replacements.push({ ...span, svg: patch.svg.trim() });
    }
    for (const patch of replacements.sort((a, b) => b.start - a.start)) merged.svg = merged.svg.slice(0, patch.start) + patch.svg + merged.svg.slice(patch.end);
    delete merged.groupPatches;
    normalizeMotionVector(merged.svg, "patch", "patch", "", true);
    compositionElements(merged.svg);
  }
  return merged;
};
const interpolate = (animation: MotionSceneAnimation, seconds: number): string => {
  const frames = animation.keyframes;
  const t = animation.period ? Math.max(0, seconds) % animation.period : Math.max(0, seconds);
  const next = frames.findIndex((frame) => frame.at > t);
  if (next < 0) return String(frames.at(-1)!.value);
  if (!next) return String(frames[0].value);
  const a = frames[next - 1],
    b = frames[next];
  const progress = (t - a.at) / (b.at - a.at);
  const ease = progress * progress * (3 - 2 * progress);
  const before = numbers(a.value),
    after = numbers(b.value);
  let i = 0;
  return String(a.value).replace(C.NUMBER, () => {
    const value = before[i] + (after[i] - before[i]) * ease;
    i++;
    return String(Number(value.toFixed(4)));
  });
};
const indices = new WeakMap<MotionVectorAsset, Map<string, Element>>();
export const compositionFrameSvg = (asset: MotionVectorAsset, composition: MotionSceneComposition, seconds: number, behavior: MotionRenderBehavior, speakers: ReadonlySet<string>): string => {
  let elements = indices.get(asset);
  if (!elements) {
    elements = compositionElements(asset.svg);
    indices.set(asset, elements);
  }
  const changes = new Map<string, Record<string, string>>();
  for (const animation of composition.animations) {
    if (animation.channel === "effect" ? behavior.sceneEffects === "off" : behavior.actors === "fixed") continue;
    const layer = owner(animation.target, elements, composition.layers);
    if (animation.channel === "speech" && !speakers.has(layer?.entityId || "")) continue;
    const original = elements.get(animation.target)?.attributes[animation.attribute];
    const value = interpolate(animation, seconds);
    const attrs = changes.get(animation.target) || {};
    attrs[animation.attribute] = animation.attribute === "transform" && original ? `${original} ${value}` : value;
    changes.set(animation.target, attrs);
  }
  if (!changes.size) return asset.svg;
  return asset.svg.replace(/<([\w:-]+)\b[^<>]*>/g, (tag) => {
    const patch = changes.get(attributes(tag).id);
    if (!patch) return tag;
    for (const [name, value] of Object.entries(patch)) {
      const pattern = new RegExp(`\\s${name}\\s*=\\s*(?:"[^"]*"|'[^']*')`);
      tag = pattern.test(tag) ? tag.replace(pattern, ` ${name}="${value}"`) : tag.replace(/\/?\s*>$/, (ending) => ` ${name}="${value}"${ending}`);
    }
    return tag;
  });
};
