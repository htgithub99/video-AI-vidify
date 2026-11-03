import { MOTION_SCENE_PLAN_GUARD as G } from "../constants/motionScenePlanGuard.js";
import { MOTION_SCENE_SPEC as SPEC, type MotionAnimal, type MotionPosture } from "../constants/motionProfiles/sceneSpec.js";
import { MOTION_SCENE_VIEWS } from "../constants/motionProfiles/framing.js";
import type { MotionRemotionNode, MotionRemotionScene } from "../types/motionVisual.js";
import { motionSceneObjects } from "./motionObjects.js";
export const motionNodeStance = (node: Pick<MotionRemotionNode, "posture" | "pose" | "support" | "description">): MotionPosture => {
  for (const text of [[node.posture, node.pose, node.support].filter(Boolean).join(" "), (node.description || "").split(G.STANCE_CUT)[0]]) for (const [stance, pattern] of SPEC.POSTURE_MATCH) if (pattern.test(text)) return stance;
  return "stand";
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
export const motionScenePlanGuard = (scenes: MotionRemotionScene[], opts: { cast: ReadonlySet<string>; lineText: (scene: MotionRemotionScene) => string; outfit: RegExp }): { stripped: number; details: number; animals: number } => {
  let stripped = 0,
    details = 0,
    animals = 0;
  for (const scene of scenes) {
    const narration = opts.lineText(scene);
    const outfitTold = opts.outfit.test(narration);
    for (const node of scene.nodes) {
      if (node.kind === G.CHARACTER) node.stance = motionNodeStance(node);
      const animal = motionNodeAnimal(node, opts.cast);
      if (animal) {
        node.animal = animal;
        animals++;
      }
      if (node.kind === G.CHARACTER && node.entityId && opts.cast.has(node.entityId) && !(node.outfitChange && outfitTold)) {
        const next = motionStripClothing(node.description);
        if (next !== node.description) {
          node.description = next;
          stripped++;
        }
      }
    }
    const people = scene.nodes.filter((node) => node.kind === G.CHARACTER && !node.anonymous && !node.animal);
    if (scene.view && !(MOTION_SCENE_VIEWS as readonly string[]).includes(scene.view)) scene.view = people.length ? G.CLOSE : G.DETAIL;
    if (scene.view === G.DETAIL) for (const node of scene.nodes) if (node.kind === G.CHARACTER && !node.animal) node.representation = G.DETAIL;
    if (G.CLOSE_VIEWS.includes(scene.view || "") && !people.length) {
      scene.view = G.DETAIL;
      details++;
    }
    for (const node of scene.nodes) {
      if (node.crowd && !node.visibleCount) node.visibleCount = Math.max(G.VISIBLE_MIN, Math.min(node.crowd.count || G.VISIBLE_BY_VIEW[scene.view || G.WIDE] || G.VISIBLE_MIN, G.VISIBLE_BY_VIEW[scene.view || G.WIDE] || G.VISIBLE_MIN));
      if (node.kind === G.CHARACTER && node.representation === G.DETAIL && G.OWN_EYES.test(node.description)) node.description = node.description.replace(G.OWN_EYES_POSSESSIVE, G.OWN_EYES_FIX);
    }
    if (scene.view === G.DETAIL && (!scene.camera || G.OWN_EYES.test(scene.camera))) scene.camera = G.DETAIL_CAMERA;
    if (G.CLOSE_VIEWS.includes(scene.view || "") && !scene.lead) scene.lead = (people.find((node) => node.entityId && opts.cast.has(node.entityId)) || people[0])?.id;
    const objects = motionSceneObjects(scene);
    if (objects.length) scene.objects = objects;
  }
  return { stripped, details, animals };
};
