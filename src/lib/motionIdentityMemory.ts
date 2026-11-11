import * as RT_MAINTENANCE from "../constants/runtime/maintenance.js";
import { MOTION_SCENE_COMPOSITION as C } from "../constants/motionSceneComposition.js";
import { MOTION_VISUAL as V } from "../constants/motionVisual.js";
import type { MotionRemotionProfile, MotionRemotionScene } from "../types/motionVisual.js";
import { motionHorrorAppearance } from "./motionHorrorIdentity.js";
export const motionStaticAppearance = (value: unknown): string =>
  typeof value === "string"
    ? value
        .split(C.IDENTITY_MEMORY.SEPARATORS)
        .map((part) => part.trim())
        .filter((part) => part && !C.IDENTITY_MEMORY.DYNAMIC.test(part))
        .join(RT_MAINTENANCE.SEMICOLON_SPACE)
        .slice(0, C.LAYER_DESCRIPTION_LIMIT)
    : "";
export const motionIdentityMemory = (scene: MotionRemotionScene, scenes: MotionRemotionScene[], profileId: MotionRemotionProfile): { entityId: string; appearance: string }[] => {
  const wanted = [...new Set<string>(scene.nodes.filter((node) => node.kind === RT_MAINTENANCE.CHARACTER && !node.anonymous && !node.appearanceChanged && node.entityId).map((node) => node.entityId!))];
  const index = scenes.findIndex((other) => other.id === scene.id);
  const candidates = index < 0 ? [...scenes].reverse() : [...scenes.slice(0, index).reverse(), ...scenes.slice(index + 1)];
  let remaining = C.IDENTITY_MEMORY_LIMIT as number;
  return wanted.flatMap((entityId) => {
    for (const other of candidates) {
      const composition = other.composition;
      if (other.id === scene.id || other.build?.status !== RT_MAINTENANCE.ACCEPTED || composition?.profileId !== profileId || composition.profileRevision !== V.PROFILES[profileId].revision) continue;
      const layer = composition.layers.find((item) => item.kind === RT_MAINTENANCE.CHARACTER && item.entityId === entityId);
      if (remaining > 0 && layer) {
        const staticAppearance = motionStaticAppearance(layer.appearance ?? layer.description);
        const appearance = (profileId === RT_MAINTENANCE.HORROR ? motionHorrorAppearance(staticAppearance) : staticAppearance).slice(0, remaining);
        remaining -= appearance.length;
        return appearance ? [{ entityId, appearance }] : [];
      }
    }
    return [];
  });
};
