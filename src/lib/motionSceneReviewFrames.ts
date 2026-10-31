import type { MotionRemotionSpec } from "../types/motionVisual.js";
export const motionSceneReviewSpec = (spec: MotionRemotionSpec): MotionRemotionSpec => {
  const periods = spec.scenes
    .flatMap((scene) => scene.composition?.animations || [])
    .filter((track) => (track.channel === "effect" ? spec.renderBehavior?.sceneEffects !== "off" : spec.renderBehavior?.actors !== "fixed"))
    .map((track) => track.period || track.keyframes.at(-1)?.at || 0);
  const duration = Math.min(8, Math.max(spec.duration, ...periods));
  return { ...spec, duration, scenes: spec.scenes.map((scene) => ({ ...scene, endFrame: Math.ceil(duration * spec.fps) })) };
};
export const motionSceneReviewFrames = (spec: MotionRemotionSpec): number[] => {
  const last = Math.max(0, Math.ceil(spec.duration * spec.fps) - 1);
  const active = spec.scenes.flatMap((scene) => scene.composition?.animations || []).filter((track) => (track.channel === "effect" ? spec.renderBehavior?.sceneEffects !== "off" : spec.renderBehavior?.actors !== "fixed") && track.keyframes.some((key) => key.value !== track.keyframes[0]?.value));
  const period = active.find((track) => track.period)?.period || spec.duration;
  const times = active.length ? [Math.min(period * 0.22, spec.duration * 0.25), Math.min(period * 0.67, spec.duration * 0.7)] : [Math.min(0.5, spec.duration / 2)];
  return [...new Set(times.map((time) => Math.max(0, Math.min(last, Math.round(time * spec.fps)))))];
};
