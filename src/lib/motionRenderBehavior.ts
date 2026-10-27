import { MOTION_RENDER_BEHAVIOR as B } from "../constants/motionRenderBehavior.js";
import type { MotionRenderBehavior, MotionRenderSpec } from "../types/motionVisual.js";
import type { MotionSpec } from "../types/motionVideo.js";
export const normalizeMotionRenderBehavior = (raw?: unknown, characterMotion = false): MotionRenderBehavior => {
  if (raw == null) return { ...B.DEFAULT, actors: characterMotion ? "simple" : "fixed" };
  const value = raw as MotionRenderBehavior;
  if (typeof raw !== "object" || Array.isArray(raw) || value.version !== B.VERSION || !["fixed", "simple"].includes(value.actors) || !["off", "gentle"].includes(value.sceneEffects) || !["fixed", "gentle"].includes(value.camera)) throw new Error(B.INVALID);
  return { version: 1, actors: value.actors, sceneEffects: value.sceneEffects, camera: value.camera };
};
export const motionRenderBehaviorFor = (input: Record<string, any>): MotionRenderBehavior =>
  normalizeMotionRenderBehavior(input.renderBehavior ?? input.kit?.renderBehavior ?? input.gen?.renderBehavior ?? input.script?.gen?.renderBehavior, input.characterMotion ?? input.kit?.motion ?? input.gen?.characterMotion ?? input.script?.gen?.characterMotion ?? (input.engine === "remotion" ? input.motion : false));
export const applyMotionRenderBehavior = <T extends MotionRenderSpec>(spec: T, behavior: MotionRenderBehavior): T => {
  if ("engine" in spec && spec.engine === "remotion") return { ...spec, renderBehavior: behavior, ...(spec.resolvedSettings ? { resolvedSettings: { ...spec.resolvedSettings, behavior } } : {}), motion: behavior.actors === "simple" };
  const legacy = spec as MotionSpec;
  return { ...spec, renderBehavior: behavior, ...(legacy.kit ? { kit: { ...legacy.kit, motion: behavior.actors === "simple", renderBehavior: behavior } } : {}), ...(legacy.gen ? { gen: { ...legacy.gen, characterMotion: behavior.actors === "simple", renderBehavior: behavior } } : {}) };
};
