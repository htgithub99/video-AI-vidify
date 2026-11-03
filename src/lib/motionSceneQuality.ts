import { MOTION_SCENE_QUALITY as Q } from "../constants/motionSceneQuality.js";
import { MOTION_SCENE_SPEC as SPEC } from "../constants/motionProfiles/sceneSpec.js";
import type { MotionProfileScene, MotionShotSize } from "../constants/motionProfiles/sceneSpec.js";
import { compositionElements } from "./motionSceneComposition.js";
import { motionLayerSvg } from "./motionIdentityReference.js";
import { motionNodeAnimalOf, motionNodeStanceOf } from "./motionScenePoses.js";
import type { MotionRemotionEffect, MotionRemotionNode, MotionSceneComposition, MotionSceneObject, MotionVisualRect } from "../types/motionVisual.js";
import { MOTION_OBJECT_CLASS_PARTS, MOTION_OBJECT_PART_CHECK_CLASSES } from "../constants/motionObjectClasses.js";
import { MOTION_CHARACTER_FRAMES } from "../constants/motionProfiles/characterFrames/index.js";
import type { MotionRemotionProfile } from "../types/motionVisual.js";
type ShapeElement = { tag: string; attributes: Record<string, string> };
const shapeSignature = (element: ShapeElement | undefined): number[] | undefined => {
  if (!element) return undefined;
  if (element.tag !== Q.PATH_TAG) {
    const rx = Number(element.attributes.rx ?? element.attributes.r),
      ry = Number(element.attributes.ry ?? element.attributes.r);
    return rx > 0 && ry > 0 ? [ry / rx] : undefined;
  }
  const values = (element.attributes.d || "").match(Q.NUMBER)?.map(Number) || [];
  if (values.length < 4 || values.length % 2) return undefined;
  const xs = values.filter((_, index) => index % 2 === 0),
    ys = values.filter((_, index) => index % 2 === 1);
  const width = Math.max(...xs) - Math.min(...xs);
  if (!(width > 0)) return undefined;
  return values.map((value, index) => (value - Math.min(...(index % 2 ? ys : xs))) / width);
};
const frameSignatures = new Map<MotionRemotionProfile, number[] | undefined>();
const frameSignature = (profile: MotionRemotionProfile): number[] | undefined => {
  if (!frameSignatures.has(profile)) {
    let element: ShapeElement | undefined;
    try {
      element = compositionElements(MOTION_CHARACTER_FRAMES[profile]).get(Q.HEAD_BASE_FRAME_ID);
    } catch {
      element = undefined;
    }
    frameSignatures.set(profile, shapeSignature(element));
  }
  return frameSignatures.get(profile);
};
export const motionHeadShapeMatches = (svg: string, nodeId: string, profile: MotionRemotionProfile): boolean | undefined => {
  const expected = frameSignature(profile);
  if (!expected) return undefined;
  let elements: ReturnType<typeof compositionElements>;
  try {
    elements = compositionElements(svg);
  } catch {
    return undefined;
  }
  const bases = [...elements.entries()].filter(([id, element]) => element.ancestors.includes(nodeId) && Q.HEAD_BASE.test(id));
  if (!bases.length) return undefined;
  return bases.some(([, element]) => {
    const found = shapeSignature(element);
    return !!found && found.length === expected.length && found.every((value, index) => Math.abs(value - expected[index]) <= Q.HEAD_SHAPE_TOLERANCE);
  });
};
export const motionLayerPart = (svg: string, layerId: string, pattern: RegExp): string | undefined => {
  let elements: ReturnType<typeof compositionElements>;
  try {
    elements = compositionElements(svg);
  } catch {
    return undefined;
  }
  return [...elements.entries()]
    .filter(([id, element]) => id !== layerId && element.ancestors.includes(layerId) && pattern.test(id))
    .sort((a, b) => a[1].ancestors.length - b[1].ancestors.length)[0]?.[0];
};
export const motionLayerParts = (svg: string, layerId: string | undefined, pattern: RegExp): string[] => {
  let elements: ReturnType<typeof compositionElements>;
  try {
    elements = compositionElements(svg);
  } catch {
    return [];
  }
  return [...elements.entries()].filter(([id, element]) => (!layerId || element.ancestors.includes(layerId)) && pattern.test(id) && !element.ancestors.slice(layerId ? element.ancestors.indexOf(layerId) + 1 : 0).some((ancestor) => pattern.test(ancestor))).map(([id]) => id);
};
const union = (rects: (MotionVisualRect | null | undefined)[]): MotionVisualRect | undefined => {
  const list = rects.filter((rect): rect is MotionVisualRect => !!rect && rect.width > 0 && rect.height > 0);
  if (!list.length) return undefined;
  const x = Math.min(...list.map((rect) => rect.x)),
    y = Math.min(...list.map((rect) => rect.y));
  return { x, y, width: Math.max(...list.map((rect) => rect.x + rect.width)) - x, height: Math.max(...list.map((rect) => rect.y + rect.height)) - y };
};
const cutByEdge = (rect: MotionVisualRect | undefined): boolean => {
  if (!rect || !(rect.width > 0) || !(rect.height > 0)) return false;
  const visible = (Math.max(0, Math.min(1, rect.x + rect.width) - Math.max(0, rect.x)) * Math.max(0, Math.min(1, rect.y + rect.height) - Math.max(0, rect.y))) / (rect.width * rect.height);
  const outside = rect.x < -Q.EDGE || rect.y < -Q.EDGE || rect.x + rect.width > 1 + Q.EDGE || rect.y + rect.height > 1 + Q.EDGE;
  return outside && visible > Q.CUT_VISIBLE;
};
const identityParts = (svg: string, nodeId: string, spec: MotionProfileScene): string[] => motionLayerParts(svg, nodeId, spec.identityParts).filter((id) => !Q.ANIMAL_PART.test(id));
export const motionLayerFix = (svg: string, composition: MotionSceneComposition, nodes: MotionRemotionNode[], effects: MotionRemotionEffect[] | undefined, spec: MotionProfileScene): { svg: string; moved: number; opacity: number } => {
  let elements: ReturnType<typeof compositionElements>;
  try {
    elements = compositionElements(svg);
  } catch {
    return { svg, moved: 0, opacity: 0 };
  }
  const characters = composition.layers.filter((layer) => layer.kind === "character" && elements.has(layer.id));
  let next = svg;
  let moved = 0;
  const parentOf = (id: string) => elements.get(id)?.ancestors.at(-1);
  const firstCharacter = characters.map((layer) => ({ layer, index: next.indexOf(motionLayerSvg(next, layer.id) || "\u0000") })).filter((entry) => entry.index >= 0).sort((a, b) => a.index - b.index)[0];
  if (firstCharacter) {
    const atmospheric = composition.layers.filter((layer) => {
      if (layer.kind !== "effect" || !elements.has(layer.id)) return false;
      const declared = effects?.find((effect) => effect.id === layer.id);
      if (declared) return Q.EFFECT_KINDS_BACK.includes(declared.kind);
      return Q.EFFECT_ID.test(layer.id) && !Q.EFFECT_FRONT.test(layer.id);
    });
    for (const layer of atmospheric) {
      const part = motionLayerSvg(next, layer.id);
      const anchor = motionLayerSvg(next, firstCharacter.layer.id);
      if (!part || !anchor) continue;
      if (parentOf(layer.id) !== parentOf(firstCharacter.layer.id)) continue;
      if (next.indexOf(part) < next.indexOf(anchor)) continue;
      next = next.replace(part, "");
      next = next.replace(anchor, part + anchor);
      moved++;
    }
  }
  let opacity = 0;
  for (const layer of characters) {
    const node = nodes.find((item) => item.id === layer.id || (!!layer.entityId && item.entityId === layer.entityId));
    if (spec.ghostOpacity && node && SPEC.GHOST.test(`${node.description} ${node.entityId || ""}`)) continue;
    const part = motionLayerSvg(next, layer.id);
    if (!part) continue;
    let changed = false;
    const fixed = part.replace(Q.G_OPACITY, (tag: string, _quote: string, value: string) => {
      if (Number(value) >= Q.CHARACTER_MIN_OPACITY) return tag;
      changed = true;
      return tag.replace(Q.OPACITY_ATTR, (_match: string, head: string, quote: string) => `${head}${quote}1${quote}`);
    });
    if (changed) {
      next = next.replace(part, fixed);
      opacity++;
    }
  }
  return { svg: next, moved, opacity };
};
export const motionQualityIds = (svg: string, composition: MotionSceneComposition, nodes: MotionRemotionNode[], spec: MotionProfileScene, cast: ReadonlySet<string>, view?: string): string[] => {
  const ids = new Set<string>();
  for (const node of nodes) {
    if (!composition.layers.some((layer) => layer.id === node.id)) continue;
    if (node.kind === "character" || motionNodeAnimalOf(node, cast)) ids.add(node.id);
    if (motionNodeAnimalOf(node, cast)) for (const part of [motionLayerPart(svg, node.id, Q.ANIMAL_TAIL), motionLayerPart(svg, node.id, Q.ANIMAL_HEAD)]) if (part) ids.add(part);
    if (node.kind === "character") {
      const head = motionLayerPart(svg, node.id, spec.headPart);
      if (head) ids.add(head);
      if (node.anonymous && !node.crowd) for (const sub of motionLayerParts(svg, node.id, Q.SUB_PERSON)) {
        ids.add(sub);
        const subHead = motionLayerPart(svg, sub, spec.headPart);
        if (subHead) ids.add(subHead);
      }
      if (!motionNodeAnimalOf(node, cast) && spec.legs === "required" && Q.LEG_VIEWS.includes(view || "")) {
        for (const part of [...motionLayerParts(svg, node.id, Q.LEG_PART), ...motionLayerParts(svg, node.id, Q.TORSO_PART)]) ids.add(part);
        if (node.relation === Q.ON && node.target && composition.layers.some((layer) => layer.id === node.target)) ids.add(node.target);
      }
      if (!motionNodeAnimalOf(node, cast) && spec.hatWidth && Q.FRAME_VIEWS.includes(view || "")) for (const part of motionLayerParts(svg, node.id, Q.HEAD_BASE)) ids.add(part);
      if (Q.FRAME_VIEWS.includes(view || "") && !motionNodeAnimalOf(node, cast)) for (const part of [...identityParts(svg, node.id, spec), ...motionLayerParts(svg, node.id, Q.HAND_PART)]) ids.add(part);
    }
    if (view === Q.DETAIL && node.kind !== "label") for (const part of [...motionLayerParts(svg, node.id, Q.HAND_PART), ...motionLayerParts(svg, node.id, Q.ARM_PART)]) ids.add(part);
  }
  return [...ids];
};
export const motionSceneQualityIssues = (svg: string, nodes: MotionRemotionNode[], view: string | undefined, measured: Record<string, MotionVisualRect | null>, spec: MotionProfileScene, cast: ReadonlySet<string>, names: (node: MotionRemotionNode) => string, aspect: number, extra: { marks?: (node: MotionRemotionNode) => string[]; objects?: MotionSceneObject[]; profile?: MotionRemotionProfile } = {}): string[] => {
  const issues: string[] = [];
  const people = nodes.filter((node) => node.kind === "character" && !motionNodeAnimalOf(node, cast) && measured[node.id]);
  const defaultHorse = nodes.find((node) => motionNodeAnimalOf(node, cast) === "horse" && measured[node.id]);
  for (const node of people) {
    const box = measured[node.id]!;
    const stance = motionNodeStanceOf(node);
    const lowBody = (id: string, body: MotionVisualRect): boolean | undefined => {
      const headId = motionLayerPart(svg, id, spec.headPart);
      const headBox = headId ? measured[headId] : undefined;
      return headBox && body.height > 0 ? headBox.height / body.height >= spec.standingHeadRatio * Q.LOW_POSTURE_MARGIN : undefined;
    };
    const subs = node.anonymous && !node.crowd ? motionLayerParts(svg, node.id, Q.SUB_PERSON).map((sub) => (measured[sub] ? lowBody(sub, measured[sub]!) : undefined)).filter((entry): entry is boolean => entry !== undefined) : [];
    const lowDrawn = subs.length ? subs.filter(Boolean).length * 2 >= subs.length : lowBody(node.id, box);
    const upright = Q.LOW_REL_VIEWS.includes(view || "") && !node.crowd && node.representation !== "bust" && spec.lowPostures.includes(stance) ? people.filter((other) => other !== node && !other.crowd && other.representation !== "bust" && other.representation !== "detail" && Q.UPRIGHT_STANCES.includes(motionNodeStanceOf(other)) && measured[other.id]!.height > 0) : [];
    const tallest = subs.length ? Math.max(...motionLayerParts(svg, node.id, Q.SUB_PERSON).map((sub) => measured[sub]?.height || 0)) : box.height;
    const relativeHigh = upright.length > 0 && tallest > Q.LOW_REL_RATIO * Math.min(...upright.map((other) => measured[other.id]!.height));
    if (spec.lowPostures.includes(stance) && (lowDrawn === false || relativeHigh) && node.representation !== "bust") issues.push(Q.ISSUE.LOW(names(node), stance));
    if (stance === "lie" && box.height > 0 && (box.width * aspect) / box.height < Q.LIE_ASPECT) issues.push(Q.ISSUE.LIE(names(node)));
    const horse = (node.rides && nodes.find((item) => item.id === node.rides && measured[item.id])) || defaultHorse;
    if (stance === Q.MOUNTED && horse) {
      const mount = measured[horse.id]!;
      const overlap = Math.max(0, Math.min(box.x + box.width, mount.x + mount.width) - Math.max(box.x, mount.x)) / Math.max(1e-6, box.width);
      if (overlap < Q.MOUNT_OVERLAP || box.y + box.height > mount.y + mount.height - Q.MOUNT_BOTTOM * mount.height) issues.push(Q.ISSUE.MOUNT(names(node)));
    }
  }
  const frame = Q.FRAME_VIEWS.includes(view || "") ? spec.shotSizes[view as MotionShotSize] : undefined;
  if (frame) {
    const heads = new Map(people.map((node) => [node.id, union(identityParts(svg, node.id, spec).map((id) => measured[id]))] as const));
    for (const node of people) {
      if (cutByEdge(heads.get(node.id))) issues.push(Q.ISSUE.CUT_HEAD(names(node)));
      if (motionLayerParts(svg, node.id, Q.HAND_PART).some((id) => cutByEdge(measured[id] || undefined))) issues.push(Q.ISSUE.CUT_HAND(names(node)));
    }
    const single = people.filter((node) => !node.anonymous && !node.crowd && node.representation !== "detail" && heads.get(node.id));
    const main = single.find((node) => node.entityId && cast.has(node.entityId)) || single[0];
    const head = main && heads.get(main.id);
    if (main && head && Q.SIZE_VIEWS.includes(view!)) {
      if (head.height > frame.head[1]) issues.push(Q.ISSUE.TIGHT(names(main), view!, head.height, frame.head[1]));
      else if (head.height < frame.head[0]) issues.push(Q.ISSUE.LOOSE(names(main), view!, head.height, frame.head[0]));
    }
    for (const node of single) {
      const top = heads.get(node.id);
      if (top && top.y >= -Q.EDGE && top.y < frame.top) issues.push(Q.ISSUE.TOP(names(node)));
    }
  }
  for (const node of people) {
    const wanted = node.visibleCount || 0;
    if (!(node.anonymous || node.crowd) || wanted < Q.CROWD_MIN) continue;
    const drawn = motionLayerParts(svg, node.id, spec.headPart).length;
    if (drawn < Math.max(Q.CROWD_MIN, Math.ceil(wanted * Q.CROWD_SHARE))) issues.push(Q.ISSUE.CROWD(node.id, drawn, wanted));
  }
  for (const node of people) {
    const marks = extra.marks?.(node) || [];
    if (!marks.length || node.anonymous || node.representation === "detail") continue;
    const drawn = motionLayerParts(svg, node.id, Q.MARK_PART).length;
    if (drawn < marks.length) issues.push(Q.ISSUE.MARKS(names(node), marks.slice(drawn)));
  }
  if (view === Q.DETAIL) {
    const handish = nodes.filter((node) => node.kind !== "label").flatMap((node) => [...motionLayerParts(svg, node.id, Q.HAND_PART), ...motionLayerParts(svg, node.id, Q.ARM_PART)]);
    if (handish.some((id) => measured[id] && measured[id]!.y + measured[id]!.height > Q.BOTTOM_EDGE)) issues.push(Q.ISSUE.OWN_EYES);
  }
  for (const node of people) {
    if (node.relation !== Q.BESIDE || !node.target) continue;
    const other = people.find((candidate) => candidate.id === node.target);
    if (!other || node.representation !== "full" || other.representation !== "full") continue;
    const a = measured[node.id]!.height,
      b = measured[other.id]!.height;
    if (a > 0 && b > 0 && Math.abs(a - b) / Math.max(a, b) > Q.SCALE_GAP) issues.push(Q.ISSUE.SCALE(names(node), names(other)));
  }
  for (const item of extra.objects || []) {
    if (!MOTION_OBJECT_PART_CHECK_CLASSES.includes(item.class) || !nodes.some((node) => node.id === item.id) || !motionLayerSvg(svg, item.id)) continue;
    const missing = (MOTION_OBJECT_CLASS_PARTS[item.class] || []).filter((entry) => !motionLayerParts(svg, item.id, entry.match).length);
    if (missing.length) issues.push(Q.ISSUE.OBJECT_PARTS(item.id, missing.map((entry) => entry.name)));
  }
  const singles = people.filter((node) => !node.anonymous && !node.crowd && node.representation !== "detail" && node.representation !== "bust");
  if (spec.legs === "required" && Q.LEG_VIEWS.includes(view || ""))
    for (const node of singles) {
      if (Q.LEG_SKIP_STANCES.includes(motionNodeStanceOf(node)) || Q.LEG_HIDDEN_RELATIONS.includes(node.relation || "") || node.uses) continue;
      const stance = motionNodeStanceOf(node);
      const legs = union(motionLayerParts(svg, node.id, Q.LEG_PART).map((id) => measured[id]));
      if (!legs) {
        issues.push(Q.ISSUE.LEGS_MISSING(names(node)));
        continue;
      }
      if (legs.y + legs.height > Q.BOTTOM_EDGE && legs.y < Q.BOTTOM_EDGE) issues.push(Q.ISSUE.LEGS_CUT(names(node)));
      const torso = union(motionLayerParts(svg, node.id, Q.TORSO_PART).map((id) => measured[id]));
      if (torso && Q.STILL_STANCES.includes(stance) && legs.width > torso.width * Q.LEG_STRAY_RATIO) issues.push(Q.ISSUE.LEGS_STRAY(names(node)));
      const support = node.relation === Q.ON && node.target ? measured[node.target] : undefined;
      const feet = legs.y + legs.height;
      if (support && Q.GROUNDED_STANCES.includes(stance) && (feet < support.y - Q.ON_MARGIN || feet > support.y + support.height + Q.ON_MARGIN)) issues.push(Q.ISSUE.FEET_OFF(names(node), node.target!));
      const partner = node.relation === Q.BESIDE && node.target ? singles.find((other) => other.id === node.target) : undefined;
      if (partner && Q.UPRIGHT_STANCES.includes(stance) && Q.UPRIGHT_STANCES.includes(motionNodeStanceOf(partner))) {
        const other = union(motionLayerParts(svg, partner.id, Q.LEG_PART).map((id) => measured[id]));
        const tall = Math.max(measured[node.id]!.height, measured[partner.id]!.height);
        if (other && Math.abs(feet - (other.y + other.height)) > tall * Q.FEET_GAP) issues.push(Q.ISSUE.FEET_FLOAT(names(node), names(partner)));
      }
    }
  if (spec.legs === "forbidden") for (const node of people) if (motionLayerParts(svg, node.id, Q.LEG_PART).length) issues.push(Q.ISSUE.LEGS_ADDED(names(node)));
  const named = people.filter((node) => node.entityId && cast.has(node.entityId) && node.representation !== "detail");
  if (extra.profile) for (const node of named) if (motionHeadShapeMatches(svg, node.id, extra.profile) === false) issues.push(Q.ISSUE.HEAD_SHAPE(names(node)));
  if (spec.hatWidth && Q.FRAME_VIEWS.includes(view || ""))
    for (const node of named) {
      const headId = motionLayerPart(svg, node.id, spec.headPart);
      const head = headId ? measured[headId] : undefined;
      const base = union(motionLayerParts(svg, node.id, Q.HEAD_BASE).map((id) => measured[id]));
      if (head && base && base.width > 0 && head.width > base.width * spec.hatWidth) issues.push(Q.ISSUE.HEAD_WIDE(names(node)));
    }
  if (view === "medium" && named.length && named.length <= Q.MEDIUM_MAX_NAMED) for (const node of named) if (measured[node.id]!.height < Q.MEDIUM_MIN_HEIGHT) issues.push(Q.ISSUE.SMALL(names(node)));
  return [...new Set(issues)];
};
