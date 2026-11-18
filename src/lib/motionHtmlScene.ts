import * as RT_MAINTENANCE from "../constants/runtime/maintenance.js";
import { parseJson, stringifyJson } from "./jsonStringify.js";
import type { MotionHtmlFrameInput } from "../types/motionHtmlScene.js";
import type { MotionRemotionScene, MotionRemotionSpec } from "../types/motionVisual.js";
import type { MotionBeat, MotionChapter, MotionStoryAnalysis, MotionStoryScript } from "../types/motionVideo.js";
import type { MotionVisualSettings } from "../types/motionVisual.js";
import { motionVisualBeatGroups } from "./motionScenePacing.js";
import { motionPlanSettings, motionVisualSettingsFor } from "./motionVisual.js";
import { MOTION_HTML } from "../constants/motionHtmlTemplate.js";
import { MOTION_HTML_QUALITY } from "../constants/motionHtmlQuality.js";
import { motionMovementOf } from "./motionDrawStyle.js";
const motionHtmlIdentities = (analysis: MotionStoryAnalysis) => ({
  cast: analysis.cast.map(({ key, name, alias, role, description, look, marks, skin, carries, gender, age }) => ({ key, name, alias, role, description, look, marks, skin, carries, gender, age })),
  places: analysis.places.map(({ key, name, description, interior, time }) => ({ key, name, description, interior, time })),
  groups: analysis.groups?.map(({ key, name, look, origin, skin, outfit, gear, faction }) => ({ key, name, look, origin, skin, outfit, gear, faction })),
  renamed: analysis.renameEntities ? analysis.renameMap : undefined,
});
export const motionHtmlWritingIdentities = (analysis: MotionStoryAnalysis) => ({
  cast: analysis.cast.map(({ key, name, alias, role, gender, age }) => ({ key, name, alias, role, gender, age })),
  places: analysis.places.map(({ key, name }) => ({ key, name })),
  groups: analysis.groups?.map(({ key, name, faction }) => ({ key, name, faction })),
  renamed: analysis.renameEntities ? analysis.renameMap : undefined,
});
export const motionHtmlWritingChapter = (chapter: MotionChapter) => {
  const { events: _events, ...rest } = (chapter.writing || {}) as Record<string, unknown>;
  const writing = Object.fromEntries(Object.entries(rest).filter(([, value]) => value !== "" && value != null));
  return chapter.writing ? { ...chapter, writing } : chapter;
};
export const motionHtmlPlanContext = (beats: MotionBeat[], analysis: MotionStoryAnalysis, settings: MotionVisualSettings, note?: string, sfx = true) => ({
  productionLanguage: RT_MAINTENANCE.EN,
  beats: beats.map(({ id, chapterId, narration, sceneTemplateDraft, utterances, visual, place, cast, time, weather }) => ({ id, chapterId, narration, sceneTemplateDraft, utterances: utterances?.map(({ id, text, speaker, role }) => ({ id, text, speaker, role })), visual, place, cast, time, weather })),
  ...motionHtmlIdentities(analysis),
  settings: motionPlanSettings(settings),
  note,
  sfx,
  genre: analysis.videoGenre,
  storytelling: analysis.storytelling,
});
export const motionHtmlPlanSource = (...args: Parameters<typeof motionHtmlPlanContext>) => stringifyJson(motionHtmlPlanContext(...args));
export const motionHtmlPlanSourceMatches = (stored: string | undefined, source: string): boolean => {
  if (!stored) return false;
  if (stored === source) return true;
  try {
    // Plans from before: one carried the graphics text, and plans before one scene set served every drawing style and
    // layout carried the style and layout in their settings.
    const legacy = parseJson<Record<string, unknown>>(stored);
    if (!legacy || typeof legacy !== typeof {}) return false;
    delete legacy[MOTION_HTML.LEGACY_PLAN_FIELD];
    const settings = legacy.settings as Record<string, unknown> | undefined;
    if (settings && typeof settings === typeof {}) for (const key of MOTION_HTML.VIEW_SETTINGS) delete settings[key];
    return stringifyJson(legacy) === source;
  } catch {
    return false;
  }
};
export const motionHtmlPlanCurrent = (script: MotionStoryScript, analysis: MotionStoryAnalysis): boolean => {
  const state = script.gen?.remotion;
  const settings = motionVisualSettingsFor({ analysis, script });
  return state?.renderer === RT_MAINTENANCE.HTML_CANVAS && script.beats.length > 0 && motionVisualBeatGroups(script, 1001).every((group) => !!state.scenes[group.id]?.length && motionHtmlPlanSourceMatches(state.htmlPlanSources?.[group.id], motionHtmlPlanSource(group.beats, analysis, settings, state.notes?.[group.id] || undefined, state.htmlSfx !== false)));
};
export const usesMotionHtml = (script: MotionStoryScript): boolean => script.gen?.remotion?.renderer === RT_MAINTENANCE.HTML_CANVAS || script.beats.some((beat) => !!beat.sceneTemplateDraft) || !Object.values(script.gen?.remotion?.scenes || {}).some((scenes) => scenes.length);
export const motionHtmlFrame = (spec: MotionRemotionSpec, scene: MotionRemotionScene & { startFrame: number; endFrame: number }, frame: number, width = spec.width, height = spec.height, mode: "preview" | "export" = RT_MAINTENANCE.PREVIEW): MotionHtmlFrameInput => {
  const enabled = (spec.renderBehavior?.actors || (spec.motion ? RT_MAINTENANCE.SIMPLE : RT_MAINTENANCE.FIXED)) === RT_MAINTENANCE.SIMPLE;
  const duration = (scene.endFrame - scene.startFrame) / spec.fps;
  const span = Math.max(1, scene.endFrame - scene.startFrame - 1);
  const local = enabled ? Math.max(0, frame - scene.startFrame) : Math.round(span * MOTION_HTML_QUALITY.KEY_PROGRESS);
  // The chapter title runs on the real clock, so it animates even when the scene itself holds still.
  const titleTime = (frame - scene.startFrame) / spec.fps;
  const titleCard = scene.titleCard && titleTime >= 0 && titleTime < scene.titleCard.seconds ? { ...scene.titleCard, t: titleTime } : undefined;
  // The cut-out style dips to black into a scene that jumps in time (its time card shows a new date) and out of the scene
  // before one; every other cut is straight.
  const dip = (() => {
    if (motionMovementOf(spec) !== "cutout") return 0;
    const at = spec.scenes.findIndex((item) => item.id === scene.id), next = at >= 0 ? spec.scenes[at + 1] : undefined;
    const into = at > 0 && scene.timeLabel ? 1 - titleTime / MOTION_HTML_QUALITY.DIP_SECONDS : 0;
    const out = next?.timeLabel ? 1 - (duration - titleTime) / MOTION_HTML_QUALITY.DIP_SECONDS : 0;
    return Math.min(1, Math.max(0, into, out));
  })();
  return {
    ...(titleCard ? { titleCard } : {}),
    time: local / spec.fps,
    progress: enabled ? Math.min(1, local / span) : MOTION_HTML_QUALITY.KEY_PROGRESS,
    frame: local,
    fps: spec.fps,
    duration,
    width,
    height,
    mode,
    motionEnabled: true,
    cameraEnabled: enabled && spec.renderBehavior?.camera !== RT_MAINTENANCE.FIXED,
    sceneEffectsEnabled: enabled && spec.renderBehavior?.sceneEffects !== RT_MAINTENANCE.OFF,
    seed: scene.html?.seed || scene.id,
    speaking: enabled ? (scene.speaking || []).map((span) => ({ entityId: span.entityId, start: (span.startFrame - scene.startFrame) / spec.fps, end: (span.endFrame - scene.startFrame) / spec.fps })) : [],
    places: scene.places,
    header: scene.places ? !!scene.timeLabel : undefined,
    cues: enabled ? scene.cues : undefined,
    ...(dip > 0 ? { dip } : {}),
    // A still frame (motion off) shows the scene as it opens: its place and time title in full.
    ...(enabled ? {} : { headerTime: MOTION_HTML_QUALITY.TITLE_STILL_SECONDS }),
  };
};
export const motionSceneOnScreen = (items: { scene: MotionRemotionScene; beats: MotionBeat[] }[], analysis: MotionStoryAnalysis): void => {
  let lastPlaces: string[] = [];
  let lastTime = "";
  for (const { scene, beats } of items) {
    const names = [...new Set(beats.map((beat) => analysis.places.find((place) => place.key === beat.place)?.name).filter((name): name is string => !!name))];
    const time = beats.map((beat) => beat.time?.trim() || "").find((value) => (value.match(MOTION_HTML.DATE_PART) || []).length > 0) || "";
    const date = (time.match(MOTION_HTML.DATE_PART) || []).join(" ");
    scene.places = names.filter((name) => !lastPlaces.includes(name));
    scene.timeLabel = date && date !== lastTime ? time : undefined;
    if (names.length) lastPlaces = names;
    if (date) lastTime = date;
  }
};
// Finished scenes drop what was only needed while drawing them (the prompt, the raw answer, the pending submission).
type CompactScene = { html?: { html?: string; prompt?: string; status?: string; thumbnail?: string }; htmlRequest?: { raw?: string; submission?: { pending?: unknown } }; build?: { status?: string } };
export const motionCompactScene = (scene: CompactScene | undefined): void => {
  if (!scene?.html?.html) return;
  if ((scene.html.status !== RT_MAINTENANCE.READY && scene.html.status !== RT_MAINTENANCE.RENDERED) || scene.build?.status !== RT_MAINTENANCE.ACCEPTED) return;
  scene.html.prompt = "";
  if (scene.htmlRequest) delete scene.htmlRequest.raw;
  if (scene.htmlRequest?.submission) delete scene.htmlRequest.submission.pending;
};
export const motionCompactSpecScene = (scene: CompactScene): void => {
  motionCompactScene(scene);
  if (scene.html) delete scene.html.thumbnail;
};
export const motionCompactSceneHtml = (scenes: Record<string, Array<CompactScene> | undefined> | undefined): void => {
  for (const list of Object.values(scenes || {})) for (const scene of list || []) motionCompactScene(scene);
};
