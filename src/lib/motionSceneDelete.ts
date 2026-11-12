import type { MotionStoryScript } from "../types/motionVideo.js";
import { MOTION_VISUAL } from "../constants/motionVisual.js";
export const motionDeleteScenes = (script: MotionStoryScript, ids: readonly string[] | undefined, reason: string, newId: () => string): { script: MotionStoryScript; count: number } => {
  const remotion = script.gen?.remotion;
  if (!remotion) return { script, count: 0 };
  const pick = ids?.length ? new Set(ids) : undefined;
  const removed = new Set<string>();
  let count = 0;
  const scenes = Object.fromEntries(
    Object.entries(remotion.scenes || {}).map(([group, list]) => [
      group,
      (list || []).map((scene) => {
        if ((pick && !pick.has(scene.id)) || (!scene.html && !scene.build && (!scene.htmlRequest || scene.htmlRequest.error === reason))) return scene;
        removed.add(scene.id);
        removed.add(group);
        count++;
        const { html, build, htmlRebuildKey, ...rest } = scene;
        return { ...rest, htmlRequest: { id: newId(), attempt: Math.max(html?.attempts || 0, scene.htmlRequest?.attempt || 0) + 1, status: MOTION_VISUAL.DELETED_STATUS, error: reason } };
      }),
    ]),
  ) as typeof remotion.scenes;
  if (!count) return { script, count };
  const failures = Object.fromEntries(Object.entries(remotion.failures || {}).filter(([key]) => !removed.has(key)));
  const failed = (script.gen?.failed || []).filter((id) => !removed.has(id));
  return { script: { ...script, gen: { ...script.gen!, failed, remotion: { ...remotion, scenes, failures } } }, count };
};
