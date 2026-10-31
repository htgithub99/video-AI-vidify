import type { MotionRemotionScene } from "../types/motionVisual.js";
export const motionSceneLocation = (scene: Pick<MotionRemotionScene, "locationKey" | "place" | "beatId">) => scene.locationKey || scene.place || scene.beatId;
export const motionScenesByLocation = <T extends Pick<MotionRemotionScene, "locationKey" | "place" | "beatId">>(scenes: T[]) => {
  const groups = new Map<string, T[]>();
  for (const scene of scenes) {
    const key = motionSceneLocation(scene);
    const group = groups.get(key) || [];
    group.push(scene);
    groups.set(key, group);
  }
  return groups;
};
