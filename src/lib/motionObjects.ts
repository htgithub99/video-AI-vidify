import { MOTION_OBJECT_ANIMAL_CLASSES, MOTION_OBJECT_CLASS_MATCH, MOTION_OBJECT_HANDHELD, MOTION_OBJECT_HANDHELD_CLASSES, type MotionObjectClass } from "../constants/motionObjectClasses.js";
import type { MotionRemotionNode, MotionRemotionScene, MotionSceneObject } from "../types/motionVisual.js";
export const motionObjectClassOf = (text: string): MotionObjectClass | undefined => MOTION_OBJECT_CLASS_MATCH.find(([, pattern]) => pattern.test(text))?.[0];
export const motionSceneObjects = (scene: Pick<MotionRemotionScene, "nodes" | "objects">): MotionSceneObject[] => {
  const listed = (scene.objects || []).filter((item) => item && item.id && item.class && item.size !== MOTION_OBJECT_HANDHELD && !MOTION_OBJECT_HANDHELD_CLASSES.includes(item.class));
  const seen = new Set(listed.map((item) => item.id));
  const inferred = scene.nodes
    .filter((node): node is MotionRemotionNode => !seen.has(node.id) && ((node.kind === "character" && !!node.animal) || node.kind === "prop"))
    .flatMap((node) => {
      const kind = node.animal ? motionObjectClassOf(node.animal) : motionObjectClassOf(node.description || "");
      return kind && !MOTION_OBJECT_HANDHELD_CLASSES.includes(kind) && (node.animal || !MOTION_OBJECT_ANIMAL_CLASSES.includes(kind)) ? [{ id: node.id, class: kind, description: node.description || "", ...(node.animal ? { term: node.animal } : {}) }] : [];
    });
  return [...listed, ...inferred];
};
