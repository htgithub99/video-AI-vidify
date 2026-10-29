import { RUNTIME_TEXT as RT_SHARED } from "../../../constants/runtime/shared.js";
import { RUNTIME_TEXT as RT_SERVER } from "../../../constants/runtime/server.js";
import { stringifyJson } from "../../../lib/jsonStringify.js";
import { MOTION_VISUAL as V } from "../../../constants/motionVisual.js";
import { MOTION_REMOTION_LAYOUT as L } from "../../../constants/motionRemotionLayout.js";
import type { MotionBeat, MotionStoryAnalysis, MotionStoryScript } from "../../../types/motionVideo.js";
import type { MotionRemotionState, MotionRemotionScene } from "../../../types/motionVisual.js";
import { motionInputKey } from "../motionFileUtils.js";
import { MOTION_SCENE_COMPOSITION as C } from "../../../constants/motionSceneComposition.js";
import { validateSceneComposition, motionCompositionMissingChannels } from "../../../lib/motionSceneComposition.js";
import { motionVisualBeatGroups } from "../../../lib/motionScenePacing.js";
import { MOTION_SCENE_PACING as PACING } from "../../../constants/motionScenePacing.js";
import { puppetBeatLines } from "../../../lib/motionPuppet.js";
import { motionNarratorCastKey } from "../../../lib/motionVoice.js";
const normalized = (value: unknown): unknown =>
  typeof value === "string"
    ? value.normalize(RT_SHARED.NFC).trim().replace(/\s+/gu, RT_SHARED.SYMBOL_36A9E7)
    : Array.isArray(value)
      ? value.map(normalized)
      : value && typeof value === "object"
        ? Object.fromEntries(
            Object.entries(value)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([key, item]) => [key, normalized(item)]),
          )
        : value;
const castFor = (beat: MotionBeat, analysis: MotionStoryAnalysis) => {
  const keys = new Set([...(beat.cast || []), ...(beat.utterances || []).map((line) => line.speaker)]);
  return analysis.cast.filter((member) => keys.has(member.key) || [member.name, member.alias].some((name) => name && beat.narration.includes(name))).sort((a, b) => a.key.localeCompare(b.key));
};
const legacyBeatKey = (beat: MotionBeat, analysis: MotionStoryAnalysis, note: string = "") => motionInputKey([V.VERSION, L.SCENE_REVISION, analysis.visualSettings, analysis.visualSettings?.mode === RT_SHARED.REMOTION ? V.PROFILES[analysis.visualSettings.profileId].revision : undefined, analysis.era, analysis.cast, analysis.places, beat, note]);
export const remotionBeatKey = (beat: MotionBeat, analysis: MotionStoryAnalysis, note: string = "") =>
  motionInputKey(
    normalized([
      V.VERSION,
      L.SCENE_REVISION,
      analysis.visualSettings,
      analysis.visualSettings?.mode === RT_SHARED.REMOTION ? V.PROFILES[analysis.visualSettings.profileId].revision : undefined,
      analysis.era,
      castFor(beat, analysis),
      analysis.places.find((place) => place.key === beat.place),
      {
        id: beat.id,
        chapterId: beat.chapterId,
        narration: beat.narration,
        utterances: beat.utterances?.map(({ text, speaker, role }) => ({ text, speaker, role })),
        visual: beat.visual,
        cast: [...(beat.cast || [])].sort(),
        place: beat.place,
        scenePlan: beat.scenePlan,
        action: beat.action,
        time: beat.time,
        weather: beat.weather,
        shot: beat.shot,
        sceneMood: beat.sceneMood,
        data: beat.data,
        hud: beat.hud,
      },
      note,
    ]),
  );
export const remotionBeatPlanCurrent = (beat: MotionBeat, analysis: MotionStoryAnalysis, state?: MotionRemotionState, note = state?.notes?.[beat.id] || "") =>
  !!state?.scenes[beat.id]?.length && [remotionBeatKey(beat, analysis), legacyBeatKey(beat, analysis)].includes(state.inputKeys[beat.id]) && state.scenes[beat.id].every((scene) => scene.sceneRevision === L.SCENE_REVISION && [remotionBeatKey(beat, analysis, note), legacyBeatKey(beat, analysis, note)].includes(scene.sourceKey!));
export const remotionGroupKey = (beats: MotionBeat[], analysis: MotionStoryAnalysis, state?: MotionRemotionState, note?: string) => motionInputKey([PACING.REVISION, beats.map((beat) => remotionBeatKey(beat, analysis, note ?? state?.notes?.[beat.id] ?? ""))]);
export const remotionGroupPlanCurrent = (beats: MotionBeat[], analysis: MotionStoryAnalysis, state?: MotionRemotionState, note?: string) => {
  const scenes = state?.scenes[beats[0]?.id];
  if (!scenes?.length || !beats.every((beat) => [remotionBeatKey(beat, analysis), legacyBeatKey(beat, analysis)].includes(state?.inputKeys[beat.id] || ""))) return false;
  const keys = [remotionGroupKey(beats, analysis, state, note), motionInputKey([PACING.REVISION, beats.map((beat) => legacyBeatKey(beat, analysis, note ?? state?.notes?.[beat.id] ?? ""))])];
  const lines = beats.flatMap((beat) => puppetBeatLines(beat, motionNarratorCastKey(analysis)));
  let cursor = 0;
  for (const scene of scenes) {
    const from = lines.findIndex((line) => line.key === scene.fromLineId),
      to = lines.findIndex((line) => line.key === scene.toLineId);
    if (from !== cursor || to < from || scene.sceneRevision !== L.SCENE_REVISION || !keys.includes(scene.sourceKey!)) return false;
    cursor = to + 1;
  }
  return cursor === lines.length;
};
export const remotionStoryPlanCurrent = (script: MotionStoryScript, analysis: MotionStoryAnalysis) =>
  script.beats.length > 0 && (script.gen?.remotion?.pacingRevision === PACING.REVISION ? motionVisualBeatGroups(script).every((group) => remotionGroupPlanCurrent(group.beats, analysis, script.gen?.remotion)) : script.beats.every((beat) => remotionBeatPlanCurrent(beat, analysis, script.gen?.remotion)));
export const remotionCompositionKey = (scene: MotionRemotionScene, analysis: MotionStoryAnalysis, width: number, height: number, note?: string) =>
  motionInputKey(
    normalized([
      C.REVISION,
      scene.purpose,
      scene.environment,
      scene.nodes.map(({ evidence, assetKey, ...node }) => node),
      scene.text,
      scene.time,
      scene.weather,
      scene.view,
      scene.effects,
      analysis.visualSettings,
      analysis.visualSettings?.mode === RT_SHARED.REMOTION ? V.PROFILES[analysis.visualSettings.profileId].revision : undefined,
      analysis.era,
      analysis.places.find((place) => place.key === scene.place),
      analysis.cast.filter((member) => scene.nodes.some((node) => node.entityId === member.key)).sort((a, b) => a.key.localeCompare(b.key)),
      width,
      height,
      note,
    ]),
  );
export const remotionStoryBuildStatus = (script: MotionStoryScript, analysis: MotionStoryAnalysis): "ready" | "pending" | "outdated" | "invalid" => {
  const state = script.gen?.remotion;
  if (!state) return RT_SERVER.PENDING;
  if (
    state.settings.mode !== RT_SHARED.REMOTION ||
    stringifyJson(normalized(state.settings)) !== stringifyJson(normalized(analysis.visualSettings || script.visualSettings || state.settings)) ||
    state.version !== V.VERSION ||
    (state.compositionRevision !== undefined && state.compositionRevision !== C.REVISION) ||
    (state.profileRevision !== undefined && state.profileRevision !== V.PROFILES[state.settings.profileId].revision) ||
    (state.pacingRevision !== undefined && state.pacingRevision !== PACING.REVISION)
  )
    return RT_SERVER.OUTDATED;
  let pending = !script.beats.length;
  const groups = state.pacingRevision === PACING.REVISION ? motionVisualBeatGroups(script).map((group) => group.beats) : script.beats.map((beat) => [beat]);
  for (const beats of groups) {
    if (!state.scenes[beats[0].id]?.length) {
      pending = true;
      continue;
    }
    if (!(state.pacingRevision === PACING.REVISION ? remotionGroupPlanCurrent(beats, analysis, state) : remotionBeatPlanCurrent(beats[0], analysis, state))) return RT_SERVER.OUTDATED;
    try {
      for (const scene of state.scenes[beats[0].id] || []) {
        if (!scene.composition) {
          pending = true;
          continue;
        }
        validateSceneComposition(scene.composition, state.assets[scene.composition.assetKey], scene.nodes, new Set(analysis.cast.map((member) => member.key)));
        if (!scene.composition.unchecked && scene.build?.status !== "failed" && (scene.composition.geometryRevision !== C.GEOMETRY_REVISION || motionCompositionMissingChannels(scene, script.gen?.renderBehavior || state.renderBehavior).length)) pending = true;
      }
    } catch {
      return RT_SERVER.INVALID;
    }
  }
  return Object.keys(state.failures).length ? RT_SERVER.INVALID : pending ? RT_SERVER.PENDING : RT_SHARED.READY;
};
export const remotionStoryBuildCurrent = (script: MotionStoryScript, analysis: MotionStoryAnalysis) => remotionStoryBuildStatus(script, analysis) === RT_SHARED.READY;
