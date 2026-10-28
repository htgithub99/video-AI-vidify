import { RUNTIME_TEXT as RT_SHARED } from "../constants/runtime/shared.js";
import { RUNTIME_TEXT as RT_CORE } from "../constants/runtime/core.js";
import { MOTION_VISUAL as V } from "../constants/motionVisual.js";
import { PUPPET_STYLE_DEFAULT } from "../constants/motionPuppet.js";
import { motionRenderBehaviorFor } from "./motionRenderBehavior.js";
import { MOTION_ILLUSTRATION_PROFILES } from "../constants/motionIllustrationProfiles.js";
import type { MotionRenderSpec, MotionRemotionSpec, MotionVisualSettings } from "../types/motionVisual.js";
export const normalizeMotionVisualSettings = (raw?: unknown, packId?: string): MotionVisualSettings => {
  if (raw == null) return { version: 1, mode: RT_SHARED.LIBRARY, engine: RT_SHARED.CANVAS, packId: packId || PUPPET_STYLE_DEFAULT };
  if (typeof raw !== "object" || Array.isArray(raw)) throw new Error(V.INVALID);
  const value = raw as Record<string, unknown>;
  if (value.pacing != null && !([RT_CORE.FEW, RT_CORE.MEDIUM, RT_CORE.MANY] as string[]).includes(String(value.pacing))) throw new Error(V.INVALID);
  const pacing = value.pacing ? { pacing: value.pacing as "few" | "medium" | "many" } : {};
  if (value.version !== 1) throw new Error(V.INVALID);
  if (value.mode === RT_SHARED.LIBRARY && (value.engine == null || value.engine === RT_SHARED.CANVAS)) return { version: 1, mode: RT_SHARED.LIBRARY, engine: RT_SHARED.CANVAS, packId: typeof value.packId === "string" && value.packId ? value.packId : packId || PUPPET_STYLE_DEFAULT, ...pacing };
  if (value.mode === RT_SHARED.REMOTION && (value.engine == null || value.engine === RT_SHARED.REMOTION) && typeof value.profileId === "string" && Object.hasOwn(V.PROFILES, value.profileId) && (value.componentRevision == null || value.componentRevision === V.COMPONENT_REVISION))
    return { version: 1, mode: RT_SHARED.REMOTION, engine: RT_SHARED.REMOTION, profileId: value.profileId as "history" | "horror" | "explainer", componentRevision: V.COMPONENT_REVISION, ...pacing };
  throw new Error(V.INVALID);
};
export const motionVisualSettingsFor = (input: Record<string, any>): MotionVisualSettings => normalizeMotionVisualSettings(input.visualSettings ?? input.analysis?.visualSettings ?? input.script?.visualSettings, input.stylePreset || input.analysis?.stylePreset);
export const isRemotionSpec = (spec: MotionRenderSpec | null | undefined): spec is MotionRemotionSpec => !!spec && RT_CORE.ENGINE in spec && spec.engine === RT_SHARED.REMOTION;
export const motionVisualRequest = (input: Record<string, any>): Record<string, unknown> => {
  const visualSettings = motionVisualSettingsFor(input);
  return { visualSettings, stylePreset: visualSettings.mode === RT_SHARED.LIBRARY ? visualSettings.packId : undefined, ...(visualSettings.mode === RT_SHARED.REMOTION ? { styleReferences: [] } : {}), ...(input.renderBehavior || typeof input.characterMotion === "boolean" ? { renderBehavior: motionRenderBehaviorFor(input) } : {}) };
};
export const motionVisualCapability = (settings?: MotionVisualSettings): string => (settings?.mode === RT_SHARED.REMOTION ? [V.CAPABILITY, V.PROFILES[settings.profileId].direction, MOTION_ILLUSTRATION_PROFILES[settings.profileId].planning].join(RT_SHARED.SYMBOL_01BA47) : "");
