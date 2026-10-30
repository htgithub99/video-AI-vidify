import { RUNTIME_TEXT as RT_CORE } from "../constants/runtime/core.js";
import { MOTION_SCENE_COMPOSITION as C } from "../constants/motionSceneComposition.js";
import type { MotionSceneAnimation, MotionSceneComposition, MotionSceneLayer } from "../types/motionVisual.js";
const cache = new WeakMap<MotionSceneComposition, MotionSceneAnimation[]>();
export const motionAnonymousLayer = (layer?: MotionSceneLayer): boolean => layer?.anonymous === true;
const offsets = (animation: MotionSceneAnimation): { x: number; y: number }[] | undefined => {
  const points = animation.keyframes.map((frame) => String(frame.value).match(C.GUARD.TRANSLATE));
  if (points.some((point) => !point)) return undefined;
  return points.map((point) => ({ x: Number(point![1]), y: Number(point![2] || 0) }));
};
const track = (animation: MotionSceneAnimation, composition: MotionSceneComposition, height: number): MotionSceneAnimation | undefined => {
  if (animation.channel !== RT_CORE.ACTOR || animation.attribute !== RT_CORE.TRANSFORM) return animation;
  const points = offsets(animation);
  if (!points) return animation;
  const layer = composition.layers.find((item) => item.id === animation.target);
  const far = points.reduce((best, point) => (Math.abs(point.x) > Math.abs(best.x) ? point : best), points[0]);
  if (animation.period !== undefined && Math.abs(far.x) > height * C.GUARD.TRAVEL_MIN) {
    const limit = height * C.GUARD.TRAVEL_MAX;
    const x = Number(Math.max(-limit, Math.min(limit, far.x)).toFixed(2));
    return {
      target: animation.target,
      channel: animation.channel,
      attribute: animation.attribute,
      keyframes: [
        { at: 0, value: C.GUARD.IDENTITY },
        { at: C.GUARD.TRAVEL_SECONDS, value: C.GUARD.TRANSLATE_VALUE(x, 0) },
      ],
    };
  }
  return motionAnonymousLayer(layer) && animation.period !== undefined ? undefined : animation;
};
export const motionActorTracks = (composition: MotionSceneComposition, height: number): MotionSceneAnimation[] => {
  const known = cache.get(composition);
  if (known) return known;
  const animations = composition.animations.flatMap((animation) => {
    const next = track(animation, composition, height);
    return next ? [next] : [];
  });
  cache.set(composition, animations);
  return animations;
};
