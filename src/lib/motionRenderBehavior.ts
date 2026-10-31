import { RUNTIME_TEXT as RT_SHARED } from "../constants/runtime/shared.js";
import { RUNTIME_TEXT as RT_CORE } from "../constants/runtime/core.js";
import { MOTION_RENDER_BEHAVIOR as B } from "../constants/motionRenderBehavior.js";
import type { MotionRenderBehavior, MotionRenderSpec } from "../types/motionVisual.js";
import type { MotionSpec } from "../types/motionVideo.js";
export const normalizeMotionRenderBehavior = (raw?: unknown, characterMotion = false): MotionRenderBehavior => {
  if (raw == null) return { ...B.DEFAULT, actors: characterMotion ? RT_SHARED.SIMPLE : RT_SHARED.FIXED, sceneEffects: characterMotion ? RT_SHARED.GENTLE : RT_SHARED.OFF, camera: characterMotion ? RT_SHARED.GENTLE : RT_SHARED.FIXED };
  const value = raw as MotionRenderBehavior;
  if (typeof raw !== "object" || Array.isArray(raw) || value.version !== B.VERSION || !([RT_SHARED.FIXED, RT_SHARED.SIMPLE] as string[]).includes(value.actors) || !([RT_SHARED.OFF, RT_SHARED.GENTLE] as string[]).includes(value.sceneEffects) || !([RT_SHARED.FIXED, RT_SHARED.GENTLE] as string[]).includes(value.camera)) throw new Error(B.INVALID);
  return { version: 1, actors: value.actors, sceneEffects: value.actors === RT_SHARED.SIMPLE ? RT_SHARED.GENTLE : RT_SHARED.OFF, camera: value.actors === RT_SHARED.SIMPLE ? RT_SHARED.GENTLE : RT_SHARED.FIXED };
};
export const motionRenderBehaviorFor = (input: Record<string, any>): MotionRenderBehavior =>
  normalizeMotionRenderBehavior(input.renderBehavior ?? input.kit?.renderBehavior ?? input.gen?.renderBehavior ?? input.script?.gen?.renderBehavior, input.characterMotion ?? input.kit?.motion ?? input.gen?.characterMotion ?? input.script?.gen?.characterMotion ?? (input.engine === RT_SHARED.REMOTION ? input.motion : false));
export const applyMotionRenderBehavior = <T extends MotionRenderSpec>(spec: T, behavior: MotionRenderBehavior): T => {
  behavior = normalizeMotionRenderBehavior(behavior);
  if (RT_CORE.ENGINE in spec && spec.engine === RT_SHARED.REMOTION) return { ...spec, renderBehavior: behavior, ...(spec.resolvedSettings ? { resolvedSettings: { ...spec.resolvedSettings, behavior } } : {}), motion: behavior.actors === RT_SHARED.SIMPLE };
  const legacy = spec as MotionSpec;
  return { ...spec, renderBehavior: behavior, ...(legacy.kit ? { kit: { ...legacy.kit, motion: behavior.actors === RT_SHARED.SIMPLE, renderBehavior: behavior } } : {}), ...(legacy.gen ? { gen: { ...legacy.gen, characterMotion: behavior.actors === RT_SHARED.SIMPLE, renderBehavior: behavior } } : {}) };
};
