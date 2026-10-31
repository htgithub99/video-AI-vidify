import { MOTION_SCENE_COMPOSITION as C } from "../constants/motionSceneComposition.js";
import { MOTION_VISUAL as V } from "../constants/motionVisual.js";
import type { MotionRemotionProfile, MotionRemotionScene } from "../types/motionVisual.js";
export const motionStaticAppearance = (value: unknown): string =>
  typeof value === "string"
    ? value
        .split(C.IDENTITY_MEMORY.SEPARATORS)
        .map((part) => part.trim())
        .filter((part) => part && !C.IDENTITY_MEMORY.DYNAMIC.test(part))
        .join("; ")
        .slice(0, C.LAYER_DESCRIPTION_LIMIT)
    : "";
export const motionIdentityMemory = (scene: MotionRemotionScene, scenes: MotionRemotionScene[], profileId: MotionRemotionProfile): { entityId: string; appearance: string }[] => {
  const wanted = [...new Set(scene.nodes.filter((node) => node.kind === "character" && !node.anonymous && !node.appearanceChanged && node.entityId).map((node) => node.entityId!))];
  const index = scenes.findIndex((other) => other.id === scene.id);
  const candidates = index < 0 ? [...scenes].reverse() : [...scenes.slice(0, index).reverse(), ...scenes.slice(index + 1)];
  let remaining = C.IDENTITY_MEMORY_LIMIT as number;
  return wanted.flatMap((entityId) => {
    for (const other of candidates) {
      const composition = other.composition;
      if (other.id === scene.id || other.build?.status !== "accepted" || composition?.profileId !== profileId || composition.profileRevision !== V.PROFILES[profileId].revision) continue;
      const layer = composition.layers.find((item) => item.kind === "character" && item.entityId === entityId);
      if (remaining > 0 && layer) {
        const appearance = motionStaticAppearance(layer.appearance ?? layer.description).slice(0, remaining);
        remaining -= appearance.length;
        return appearance ? [{ entityId, appearance }] : [];
      }
    }
    return [];
  });
};
