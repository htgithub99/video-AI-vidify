import { MOTION_VISUAL as V } from "../constants/motionVisual.js";
import { PUPPET_STYLE_DEFAULT } from "../constants/motionPuppet.js";
import { motionRenderBehaviorFor } from "./motionRenderBehavior.js";
import type { MotionRenderSpec, MotionRemotionSpec, MotionVisualSettings } from "../types/motionVisual.js";
export const normalizeMotionVisualSettings = (raw?: unknown, packId?: string): MotionVisualSettings => {
  if (raw == null) return { version: 1, mode: "library", engine: "canvas", packId: packId || PUPPET_STYLE_DEFAULT };
  if (typeof raw !== "object" || Array.isArray(raw)) throw new Error(V.INVALID);
  const value = raw as Record<string, unknown>;
  if (value.version !== 1) throw new Error(V.INVALID);
  if (value.mode === "library" && (value.engine == null || value.engine === "canvas")) return { version: 1, mode: "library", engine: "canvas", packId: typeof value.packId === "string" && value.packId ? value.packId : packId || PUPPET_STYLE_DEFAULT };
  if (value.mode === "remotion" && (value.engine == null || value.engine === "remotion") && typeof value.profileId === "string" && Object.hasOwn(V.PROFILES, value.profileId) && (value.componentRevision == null || value.componentRevision === V.COMPONENT_REVISION))
    return { version: 1, mode: "remotion", engine: "remotion", profileId: value.profileId as "history" | "horror" | "explainer", componentRevision: V.COMPONENT_REVISION };
  throw new Error(V.INVALID);
};
export const motionVisualSettingsFor = (input: Record<string, any>): MotionVisualSettings => normalizeMotionVisualSettings(input.visualSettings ?? input.analysis?.visualSettings ?? input.script?.visualSettings, input.stylePreset || input.analysis?.stylePreset);
export const isRemotionSpec = (spec: MotionRenderSpec | null | undefined): spec is MotionRemotionSpec => !!spec && "engine" in spec && spec.engine === "remotion";
export const motionVisualRequest = (input: Record<string, any>): Record<string, unknown> => {
  const visualSettings = motionVisualSettingsFor(input);
  return { visualSettings, stylePreset: visualSettings.mode === "library" ? visualSettings.packId : undefined, ...(visualSettings.mode === "remotion" ? { styleReferences: [] } : {}), ...(input.renderBehavior || typeof input.characterMotion === "boolean" ? { renderBehavior: motionRenderBehaviorFor(input) } : {}) };
};
export const motionVisualCapability = (settings?: MotionVisualSettings): string => (settings?.mode === "remotion" ? [V.CAPABILITY, V.PROFILES[settings.profileId].direction].join("\n") : "");
