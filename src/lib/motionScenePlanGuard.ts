import { MOTION_SCENE_PLAN_GUARD as G } from "../constants/motionScenePlanGuard.js";
import { MOTION_ANIMALS, MOTION_POSTURES, MOTION_SCENE_SPEC as SPEC, type MotionAnimal, type MotionPosture } from "../constants/motionProfiles/sceneSpec.js";
import { MOTION_SCENE_VIEWS } from "../constants/motionProfiles/framing.js";
import type { MotionRemotionNode, MotionRemotionScene } from "../types/motionVisual.js";
import { motionSceneObjects } from "./motionObjects.js";
import { MOTION_OBJECT_ANIMAL_CLASSES, MOTION_OBJECT_HANDHELD, MOTION_OBJECT_HANDHELD_CLASSES } from "../constants/motionObjectClasses.js";
import type { MotionSceneObject } from "../types/motionVisual.js";
export const motionNodeStance = (node: Pick<MotionRemotionNode, "posture" | "pose" | "support" | "description">): MotionPosture => {
  const text = [node.posture, node.pose, node.support].filter(Boolean).join(" ");
  for (const [stance, pattern] of SPEC.POSTURE_MATCH) if (pattern.test(text)) return stance;
  return G.STAND;
};
export const motionNodeAnimal = (node: Pick<MotionRemotionNode, "kind" | "entityId" | "description" | "anonymous">, cast: ReadonlySet<string>): MotionAnimal | undefined => {
  if (node.kind === G.CHARACTER && node.entityId && cast.has(node.entityId)) return undefined;
  if (node.kind !== G.CHARACTER && node.kind !== "prop") return undefined;
  const text = node.kind === G.CHARACTER ? (node.description || "").match(G.WORDS)?.slice(0, G.HEAD_WORDS).join(" ") || "" : node.description || "";
  if (node.kind === G.CHARACTER && G.PERSON.test(node.description || "")) return undefined;
  for (const [animal, pattern] of SPEC.ANIMAL_MATCH) if (pattern.test(text)) return animal;
  return undefined;
};
export const motionStripClothing = (description: string): string => {
  const next = description.replace(G.CLOTHING_PHRASE, "").replace(G.CLOTHING_CLAUSE, "").replace(G.CLOTHING_VI, "").replace(G.SPACES, " ").replace(G.LEAD_COMMA, "").trim();
  return next.length >= 3 ? next : description;
};
export const motionObjectAnimal = (item: Pick<MotionSceneObject, "class" | "term" | "description">): MotionAnimal | undefined => {
  const fixed = G.CLASS_ANIMAL[item.class];
  if (fixed) return fixed;
  if (!MOTION_OBJECT_ANIMAL_CLASSES.includes(item.class)) return undefined;
  const text = `${item.term || ""} ${item.description || ""}`;
  for (const [animal, pattern] of SPEC.ANIMAL_MATCH) if (pattern.test(text)) return animal;
  return undefined;
};
export const motionScenePlanGuard = (scenes: MotionRemotionScene[], opts: { cast: ReadonlySet<string>; lineText: (scene: MotionRemotionScene) => string; outfit: RegExp }): { stripped: number; details: number; animals: number; guessed: number; bodies: number; objects: number } => {
  let stripped = 0,
    details = 0,
    animals = 0,
    guessed = 0,
    bodies = 0,
    objectNodes = 0;
  for (const scene of scenes) {
    const narration = opts.lineText(scene);
    const outfitTold = opts.outfit.test(narration);
    for (const item of scene.objects || []) {
      if (!item?.id || scene.nodes.some((node) => node.id === item.id) || item.size === MOTION_OBJECT_HANDHELD || MOTION_OBJECT_HANDHELD_CLASSES.includes(item.class)) continue;
      const animal = motionObjectAnimal(item);
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
    const riders = scene.nodes.filter((node) => node.kind === G.CHARACTER && !node.animal && node.stance === G.MOUNTED);
    const mounts = scene.nodes.filter((node) => !!node.animal);
    for (const node of riders) if (!node.rides || !mounts.some((mount) => mount.id === node.rides)) {
      const mount = mounts.find((item) => item.id === node.uses?.objectId) || mounts.find((item) => item.animal === G.HORSE) || mounts[0];
      if (mount) node.rides = mount.id;
      else delete node.rides;
    }
    for (const node of scene.nodes) if (node.rides && node.stance !== G.MOUNTED) delete node.rides;
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
  return { stripped, details, animals, guessed, bodies, objects: objectNodes };
};
