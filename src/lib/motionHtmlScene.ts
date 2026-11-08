import * as RT_MAINTENANCE from "../constants/runtime/maintenance.js";
import type { MotionHtmlFrameInput } from "../types/motionHtmlScene.js";
import type { MotionRemotionScene, MotionRemotionSpec } from "../types/motionVisual.js";
import type { MotionBeat, MotionStoryAnalysis, MotionStoryScript } from "../types/motionVideo.js";
import type { MotionVisualSettings } from "../types/motionVisual.js";
import { motionVisualBeatGroups } from "./motionScenePacing.js";
import { motionVisualSettingsFor } from "./motionVisual.js";
import { MOTION_HTML } from "../constants/motionHtmlTemplate.js";
export const motionHtmlIdentities = (analysis: MotionStoryAnalysis) => ({
  cast: analysis.cast.map(({ key, name, alias, role, description, look, marks, skin, carries, gender, age }) => ({ key, name, alias, role, description, look, marks, skin, carries, gender, age })),
  places: analysis.places.map(({ key, name, description, interior, time }) => ({ key, name, description, interior, time })),
  groups: analysis.groups?.map(({ key, name, look, origin, skin, outfit, gear, faction }) => ({ key, name, look, origin, skin, outfit, gear, faction })),
  renamed: analysis.renameEntities ? analysis.renameMap : undefined,
});
export const motionHtmlPlanContext = (beats: MotionBeat[], analysis: MotionStoryAnalysis, settings: MotionVisualSettings, note?: string, sfx = true) => ({
  productionLanguage: RT_MAINTENANCE.EN,
  graphics: MOTION_HTML.GRAPHICS,
  beats: beats.map(({ id, chapterId, narration, sceneTemplateDraft, utterances, visual, place, cast, time, weather }) => ({ id, chapterId, narration, sceneTemplateDraft, utterances: utterances?.map(({ id, text, speaker, role }) => ({ id, text, speaker, role })), visual, place, cast, time, weather })),
  ...motionHtmlIdentities(analysis),
  settings,
  note,
  sfx,
  genre: analysis.videoGenre,
  storytelling: analysis.storytelling,
});
export const motionHtmlPlanSource = (...args: Parameters<typeof motionHtmlPlanContext>) => JSON.stringify(motionHtmlPlanContext(...args));
export const motionHtmlPlanCurrent = (script: MotionStoryScript, analysis: MotionStoryAnalysis): boolean => {
  const state = script.gen?.remotion;
  const settings = motionVisualSettingsFor({ analysis, script });
  return state?.renderer === RT_MAINTENANCE.HTML_CANVAS && script.beats.length > 0 && motionVisualBeatGroups(script, 1001).every((group) => !!state.scenes[group.id]?.length && state.htmlPlanSources?.[group.id] === motionHtmlPlanSource(group.beats, analysis, settings, state.notes?.[group.id] || undefined, state.htmlSfx !== false));
};
export const usesMotionHtml = (script: MotionStoryScript): boolean => script.gen?.remotion?.renderer === RT_MAINTENANCE.HTML_CANVAS || script.beats.some((beat) => !!beat.sceneTemplateDraft) || !Object.values(script.gen?.remotion?.scenes || {}).some((scenes) => scenes.length);
export const motionHtmlSource = (raw: unknown): string =>
  typeof raw === "string"
    ? raw
        .trim()
        .replace(/^```(?:html)?\s*\r?\n/i, "")
        .replace(/\r?\n```\s*$/, "")
    : String(raw ?? "");
export const motionHtmlFrame = (spec: MotionRemotionSpec, scene: MotionRemotionScene & { startFrame: number; endFrame: number }, frame: number, width = spec.width, height = spec.height, mode: "preview" | "export" = RT_MAINTENANCE.PREVIEW): MotionHtmlFrameInput => {
  const enabled = (spec.renderBehavior?.actors || (spec.motion ? RT_MAINTENANCE.SIMPLE : RT_MAINTENANCE.FIXED)) === RT_MAINTENANCE.SIMPLE;
  const duration = (scene.endFrame - scene.startFrame) / spec.fps;
  const local = enabled ? Math.max(0, frame - scene.startFrame) : 0;
  return {
    time: local / spec.fps,
    progress: enabled ? Math.min(1, local / Math.max(1, scene.endFrame - scene.startFrame - 1)) : 0,
    frame: local,
    fps: spec.fps,
    duration,
    width,
    height,
    mode,
    motionEnabled: enabled,
    sceneEffectsEnabled: enabled && spec.renderBehavior?.sceneEffects !== RT_MAINTENANCE.OFF,
    seed: scene.html?.seed || scene.id,
    speaking: enabled ? (scene.speaking || []).map((span) => ({ entityId: span.entityId, start: (span.startFrame - scene.startFrame) / spec.fps, end: (span.endFrame - scene.startFrame) / spec.fps })) : [],
  };
};
