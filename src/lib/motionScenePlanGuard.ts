import * as RT_MAINTENANCE from "../constants/runtime/maintenance.js";
import { MOTION_SCENE_PLAN_GUARD as G } from "../constants/motionScenePlanGuard.js";
import { MOTION_ANIMALS, MOTION_POSTURES, MOTION_SCENE_SPEC as SPEC, type MotionAnimal, type MotionPosture } from "../constants/motionProfiles/sceneSpec.js";
import { MOTION_SCENE_VIEWS } from "../constants/motionProfiles/framing.js";
import type { MotionRemotionNode, MotionRemotionScene } from "../types/motionVisual.js";
import { motionSceneObjects } from "./motionObjects.js";
import { motionNodeUnit } from "./motionUnits.js";
import { MOTION_UNIT_VISIBLE } from "../constants/motionUnits.js";
import { MOTION_OBJECT_ANIMAL_CLASSES, MOTION_OBJECT_HANDHELD, MOTION_OBJECT_HANDHELD_CLASSES } from "../constants/motionObjectClasses.js";
import { MOTION_OBJECT_KIND_CLASS, MOTION_OBJECT_KIND_MATCH } from "../constants/motionObjectKinds.js";
import { motionObjectKind } from "./motionObjectKinds.js";
import type { MotionSceneObject } from "../types/motionVisual.js";
export const motionNodeStance = (node: Pick<MotionRemotionNode, "posture" | "pose" | "support" | "description">): MotionPosture => {
  const text = [node.posture, node.pose, node.support].filter(Boolean).join(RT_MAINTENANCE.SPACE);
  for (const [stance, pattern] of SPEC.POSTURE_MATCH) if (pattern.test(text)) return stance;
  return G.STAND;
};
export const motionNodeAnimal = (node: Pick<MotionRemotionNode, "kind" | "entityId" | "description" | "anonymous">, cast: ReadonlySet<string>): MotionAnimal | undefined => {
  if (node.kind === G.CHARACTER && node.entityId && cast.has(node.entityId)) return undefined;
  if (node.kind !== G.CHARACTER && node.kind !== RT_MAINTENANCE.PROP) return undefined;
  const text = node.kind === G.CHARACTER ? (node.description || "").match(G.WORDS)?.slice(0, G.HEAD_WORDS).join(RT_MAINTENANCE.SPACE) || "" : node.description || "";
  if (node.kind === G.CHARACTER && G.PERSON.test(node.description || "")) return undefined;
  for (const [animal, pattern] of SPEC.ANIMAL_MATCH) if (pattern.test(text)) return animal;
  return undefined;
};
export const motionStripClothing = (description: string): string => {
  const next = description.replace(G.CLOTHING_PHRASE, "").replace(G.CLOTHING_CLAUSE, "").replace(G.CLOTHING_VI, "").replace(G.SPACES, RT_MAINTENANCE.SPACE).replace(G.LEAD_COMMA, "").trim();
  return next.length >= 3 ? next : description;
};
export const motionObjectAnimal = (item: Pick<MotionSceneObject, "class" | "term" | "description">): MotionAnimal | undefined => {
  if (!MOTION_OBJECT_ANIMAL_CLASSES.includes(item.class)) return undefined;
  for (const text of [item.term || "", item.description || ""]) for (const [animal, pattern] of SPEC.ANIMAL_MATCH) if (pattern.test(text)) return animal;
  return G.CLASS_ANIMAL[item.class];
};
const motionMergeNode = (scene: MotionRemotionScene, from: string, to: string): void => {
  scene.nodes = scene.nodes.filter((node) => node.id !== from);
  for (const node of scene.nodes) {
    if (node.rides === from) node.rides = to;
    if (node.uses?.objectId === from) node.uses = { ...node.uses, objectId: to };
    if (node.target === from) node.target = to;
  }
  if (scene.objects) {
    const kept = scene.objects.some((item) => item.id === to);
    scene.objects = scene.objects.flatMap((item) => (item.id !== from ? [item] : kept ? [] : [{ ...item, id: to }]));
  }
  if (scene.actionPlan?.subjects) {
    const seen = new Set<string>();
    scene.actionPlan.subjects = scene.actionPlan.subjects.flatMap((subject) => {
      const nodeId = subject.nodeId === from ? to : subject.nodeId;
      if (seen.has(nodeId)) return [];
      seen.add(nodeId);
      return [{ ...subject, nodeId }];
    });
  }
  if (scene.lead === from) scene.lead = to;
};
const motionNodeOwns = (node: MotionRemotionNode, ownerId: string): boolean => [node.entityId, node.id].some((key) => !!key && (ownerId === key || ownerId.startsWith(key + G.ID_JOIN)));
const motionHandWeapon = (term: string): string | undefined => MOTION_OBJECT_KIND_MATCH.find(([kind, pattern]) => MOTION_OBJECT_KIND_CLASS[kind] === G.HAND_WEAPON && G.BLADE_KINDS.includes(kind) && pattern.test(term))?.[0];
export const motionScenePlanGuard = (scenes: MotionRemotionScene[], opts: { cast: ReadonlySet<string>; lineText: (scene: MotionRemotionScene) => string; outfit: RegExp; carries?: (entityId: string) => string[] }): { stripped: number; details: number; animals: number; guessed: number; bodies: number; objects: number; merged: number; saddled: number; carried: number } => {
  let stripped = 0,
    details = 0,
    animals = 0,
    guessed = 0,
    bodies = 0,
    objectNodes = 0,
    merged = 0,
    saddled = 0,
    carried = 0;
  for (const scene of scenes) {
    const narration = opts.lineText(scene);
    const outfitTold = opts.outfit.test(narration);
    for (const item of [...(scene.objects || [])]) {
      if (!item?.id || scene.nodes.some((node) => node.id === item.id) || item.size === MOTION_OBJECT_HANDHELD || MOTION_OBJECT_HANDHELD_CLASSES.includes(item.class)) continue;
      const animal = motionObjectAnimal(item);
      const rider = animal && item.owner ? scene.nodes.find((node) => node.kind === G.CHARACTER && (node.entityId === item.owner || node.id === item.owner)) : undefined;
      const ridden = rider && scene.nodes.find((node) => node.id === (rider.rides || rider.uses?.objectId) && (node.animal || motionNodeAnimal(node, opts.cast)) === animal);
      if (ridden) {
        motionMergeNode(scene, item.id, ridden.id);
        merged++;
        continue;
      }
      const user = scene.nodes.find((node) => node.uses?.objectId === item.id);
      scene.nodes.push({ id: item.id, kind: G.PROP, description: item.description || item.term || item.class, pose: G.OBJECT_POSE, slot: user?.slot || G.CENTER, evidence: user?.evidence || item.description || item.class, ...(animal ? { animal } : {}) } as MotionRemotionNode);
      objectNodes++;
    }
    for (const node of scene.nodes) {
      const castMember = !!node.entityId && opts.cast.has(node.entityId);
      if (castMember) delete node.animal;
      if (node.animal && !(MOTION_ANIMALS as readonly string[]).includes(node.animal)) delete node.animal;
      const animal = node.animal || motionNodeAnimal(node, opts.cast);
      if (animal) {
        if (!node.animal) animals++;
        node.animal = animal;
      }
      if (node.kind === G.CHARACTER && !node.animal) {
        if (!node.stance || !(MOTION_POSTURES as readonly string[]).includes(node.stance)) {
          node.stance = motionNodeStance(node);
          guessed++;
        }
        if (node.stance === G.BACK) node.facing = G.BACK_FACING;
      }
      if (node.kind === G.CHARACTER && node.entityId && opts.cast.has(node.entityId) && !(node.outfitChange && outfitTold)) {
        const next = motionStripClothing(node.description);
        if (next !== node.description) {
          node.description = next;
          stripped++;
        }
      }
    }
    for (const node of scene.nodes) {
      if (node.kind !== G.CHARACTER || node.animal || node.stance === G.MOUNTED || !G.SADDLE.test([node.pose, node.posture, node.support, node.description].filter(Boolean).join(RT_MAINTENANCE.SPACE))) continue;
      const free = scene.nodes.find((item) => item.animal === G.HORSE && !scene.nodes.some((other) => other.rides === item.id || (other !== node && other.kind === G.CHARACTER && motionNodeOwns(other, item.id))) && !(scene.objects || []).some((entry) => entry.id === item.id && !!entry.owner && entry.owner !== node.entityId && entry.owner !== node.id));
      const mountId = free?.id || node.id + G.ID_JOIN + G.MOUNT_SUFFIX;
      if (!free) scene.nodes.push({ id: mountId, kind: G.PROP, description: G.SADDLE_MOUNT, pose: G.OBJECT_POSE, slot: node.slot || G.CENTER, evidence: node.evidence || node.description, animal: G.HORSE, ...(node.distance ? { distance: node.distance } : {}) } as MotionRemotionNode);
      node.stance = G.MOUNTED;
      node.rides = mountId;
      saddled++;
    }
    const riders = scene.nodes.filter((node) => node.kind === G.CHARACTER && !node.animal && node.stance === G.MOUNTED);
    const mounts = scene.nodes.filter((node) => !!node.animal);
    for (const node of riders)
      if (!node.rides || !mounts.some((mount) => mount.id === node.rides)) {
        const mount = mounts.find((item) => item.id === node.uses?.objectId) || mounts.find((item) => item.animal === G.HORSE) || mounts[0];
        if (mount) node.rides = mount.id;
        else delete node.rides;
      }
    for (const node of scene.nodes) if (node.rides && node.stance !== G.MOUNTED) delete node.rides;
    for (const rider of scene.nodes.filter((node) => node.kind === G.CHARACTER && !node.animal && node.rides)) {
      const mount = scene.nodes.find((node) => node.id === rider.rides);
      if (!mount?.animal) continue;
      const extras = scene.nodes.filter((node) => node !== mount && node.animal === mount.animal && !scene.nodes.some((other) => other !== rider && (other.rides === node.id || other.uses?.objectId === node.id)) && (motionNodeOwns(rider, node.id) || (scene.objects || []).some((item) => item.id === node.id && !!item.owner && (item.owner === rider.entityId || item.owner === rider.id))));
      for (const extra of extras) {
        motionMergeNode(scene, extra.id, mount.id);
        merged++;
      }
    }
    for (const holder of scene.nodes.filter((node) => node.kind === G.CHARACTER && node.entityId && opts.cast.has(node.entityId))) {
      const own = (opts.carries?.(holder.entityId!) || []).map((term) => ({ term, kind: motionHandWeapon(term) })).filter((entry) => entry.kind);
      if (!own.length) continue;
      const props = scene.nodes.filter((node) => node.kind === G.PROP && !node.animal && motionNodeOwns(holder, node.id) && !(scene.objects || []).some((item) => item.id === node.id)).map((node) => ({ id: node.id, class: G.HAND_WEAPON, description: node.description, owner: holder.entityId }) as MotionSceneObject);
      for (const item of [...(scene.objects || []), ...props]) {
        const kind = motionObjectKind(item);
        if (!kind || !G.BLADE_KINDS.includes(kind) || own.some((entry) => entry.kind === kind)) continue;
        if (!(item.owner === holder.entityId || item.owner === holder.id || motionNodeOwns(holder, item.id))) continue;
        if (MOTION_OBJECT_KIND_MATCH.some(([match, pattern]) => match === kind && pattern.test(narration))) continue;
        item.term = own[0].term;
        item.description = own[0].term;
        delete item.kind;
        const node = scene.nodes.find((entry) => entry.id === item.id);
        if (node) node.description = own[0].term;
        carried++;
      }
    }
    for (const node of scene.nodes) {
      const unit = motionNodeUnit(node, scene);
      if (!unit) {
        delete node.unit;
        continue;
      }
      node.unit = unit;
      const cap = MOTION_UNIT_VISIBLE[scene.view || G.WIDE] || G.VISIBLE_MIN;
      if (node.crowd) node.visibleCount = Math.max(1, Math.min(node.visibleCount || cap, cap));
    }
    const people = scene.nodes.filter((node) => node.kind === G.CHARACTER && !node.anonymous && !node.animal);
    if (scene.view && !(MOTION_SCENE_VIEWS as readonly string[]).includes(scene.view)) scene.view = people.length ? G.CLOSE : G.DETAIL;
    if (scene.view === G.DETAIL) {
      const figures = scene.nodes.filter((node) => node.kind === G.CHARACTER && !node.animal);
      const things = scene.nodes.filter((node) => node.kind !== G.CHARACTER || !!node.animal);
      if (figures.length && scene.detailSubject === G.FACE) {
        scene.view = G.CLOSE;
        for (const node of figures) node.representation = G.BUST;
      } else if (figures.length && (!things.length || scene.detailSubject === G.BODY_PART)) {
        scene.view = G.MEDIUM;
        for (const node of figures) node.representation = G.FULL;
        bodies++;
      } else if (!scene.detailSubject || scene.detailSubject === G.FACE || scene.detailSubject === G.BODY_PART) scene.detailSubject = figures.length ? G.HANDS_WITH_OBJECT : G.OBJECT;
    }
    if (scene.view === G.DETAIL) for (const node of scene.nodes) if (node.kind === G.CHARACTER && !node.animal) node.representation = G.DETAIL;
    if (G.CLOSE_VIEWS.includes(scene.view || "") && !people.length) {
      scene.view = G.DETAIL;
      scene.detailSubject ||= G.OBJECT;
      details++;
    }
    if (scene.view !== G.DETAIL) delete scene.detailSubject;
    for (const node of scene.nodes) {
      if (node.crowd && !node.visibleCount) node.visibleCount = Math.max(G.VISIBLE_MIN, Math.min(node.crowd.count || G.VISIBLE_BY_VIEW[scene.view || G.WIDE] || G.VISIBLE_MIN, G.VISIBLE_BY_VIEW[scene.view || G.WIDE] || G.VISIBLE_MIN));
      if (node.kind === G.CHARACTER && node.representation === G.DETAIL && G.OWN_EYES.test(node.description)) node.description = node.description.replace(G.OWN_EYES_POSSESSIVE, G.OWN_EYES_FIX);
    }
    if (scene.view === G.DETAIL && (!scene.camera || G.OWN_EYES.test(scene.camera))) scene.camera = G.DETAIL_CAMERA;
    if (G.CLOSE_VIEWS.includes(scene.view || "") && !scene.lead) scene.lead = (people.find((node) => node.entityId && opts.cast.has(node.entityId)) || people[0])?.id;
    const objects = motionSceneObjects(scene);
    if (objects.length) scene.objects = objects;
  }
  return { stripped, details, animals, guessed, bodies, objects: objectNodes, merged, saddled, carried };
};
