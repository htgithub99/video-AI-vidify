import { RUNTIME_TEXT as RT_SHARED } from "../constants/runtime/shared.js";
import { RUNTIME_TEXT as RT_CORE } from "../constants/runtime/core.js";
import { MOTION_VISUAL as V } from "../constants/motionVisual.js";
import { motionRenderBehaviorFor } from "./motionRenderBehavior.js";
import { MOTION_SCENE_PACING } from "../constants/motionScenePacing.js";
import { motionVideoGenre } from "../constants/motionGenre.js";
import { MOTION_ILLUSTRATION_PROFILES } from "../constants/motionIllustrationProfiles.js";
import type { MotionRemotionProfile, MotionRenderSpec, MotionRemotionSpec, MotionScenePacing, MotionVisualSettings } from "../types/motionVisual.js";
export const normalizeMotionVisualSettings = (raw?: unknown): MotionVisualSettings => {
  const base = (profileId: MotionRemotionProfile, figureKit: boolean, pacing: { pacing?: MotionScenePacing }): MotionVisualSettings => ({ version: 1, mode: RT_SHARED.REMOTION, engine: RT_SHARED.REMOTION, profileId, componentRevision: V.COMPONENT_REVISION, ...(figureKit ? { figureKit: true } : {}), ...pacing });
  if (raw == null) return base(RT_SHARED.HISTORY, false, {});
  if (typeof raw !== "object" || Array.isArray(raw)) throw new Error(V.INVALID);
  const value = raw as Record<string, unknown>;
  if (value.pacing != null && !([RT_CORE.FEW, RT_CORE.MEDIUM, RT_CORE.MANY] as string[]).includes(String(value.pacing))) throw new Error(V.INVALID);
  const pacing = value.pacing ? { pacing: value.pacing as MotionScenePacing } : {};
  if (value.version !== 1) throw new Error(V.INVALID);
  if (value.mode === V.LEGACY_LIBRARY) return base(V.LEGACY_LIBRARY_PROFILE, true, pacing);
  if (value.mode === RT_SHARED.REMOTION && (value.engine == null || value.engine === RT_SHARED.REMOTION) && typeof value.profileId === "string" && Object.hasOwn(V.PROFILES, value.profileId) && (value.componentRevision == null || value.componentRevision === V.COMPONENT_REVISION))
    return base(value.profileId as MotionRemotionProfile, value.figureKit === true, pacing);
  throw new Error(V.INVALID);
};
export const motionVisualSettingsFor = (input: Record<string, any>): MotionVisualSettings => {
  const settings = normalizeMotionVisualSettings(input.visualSettings ?? input.analysis?.visualSettings ?? input.script?.visualSettings);
  const genre = input.videoGenre ?? input.analysis?.videoGenre;
  if (settings.pacing || genre == null) return settings;
  const pacing = MOTION_SCENE_PACING.GENRE_DEFAULT[motionVideoGenre(genre)];
  return pacing ? { ...settings, pacing } : settings;
};
export const motionPlanSettings = (settings: MotionVisualSettings): MotionVisualSettings => ({ ...settings, figureKit: undefined });
export const motionSceneKitMatches = (artifact: { figureKit?: boolean } | undefined, settings: MotionVisualSettings): boolean => (artifact?.figureKit === true) === (settings.figureKit === true);
export const isRemotionSpec = (spec: MotionRenderSpec | null | undefined): spec is MotionRemotionSpec => !!spec && RT_CORE.ENGINE in spec && spec.engine === RT_SHARED.REMOTION;
export const motionVisualRequest = (input: Record<string, any>): Record<string, unknown> => {
  const visualSettings = motionVisualSettingsFor(input);
  return { visualSettings, stylePreset: undefined, styleReferences: [], ...(input.renderBehavior || typeof input.characterMotion === "boolean" ? { renderBehavior: motionRenderBehaviorFor(input) } : {}) };
};
export const motionVisualCapability = (settings?: MotionVisualSettings): string => (settings ? [V.CAPABILITY, V.PROFILES[settings.profileId].direction, MOTION_ILLUSTRATION_PROFILES[settings.profileId].planning].join(RT_SHARED.SYMBOL_01BA47) : "");
