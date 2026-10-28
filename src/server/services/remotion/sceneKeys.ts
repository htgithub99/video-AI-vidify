import { MOTION_VISUAL as V } from "../../../constants/motionVisual.js";
import { MOTION_REMOTION_LAYOUT as L } from "../../../constants/motionRemotionLayout.js";
import type { MotionBeat, MotionStoryAnalysis, MotionStoryScript } from "../../../types/motionVideo.js";
import type { MotionRemotionState } from "../../../types/motionVisual.js";
import { motionInputKey } from "../motionFileUtils.js";
import { MOTION_SCENE_COMPOSITION as C } from "../../../constants/motionSceneComposition.js";
import { validateSceneComposition } from "../../../lib/motionSceneComposition.js";
import { motionVisualBeatGroups } from "../../../lib/motionScenePacing.js";
import { MOTION_SCENE_PACING as PACING } from "../../../constants/motionScenePacing.js";
import { puppetBeatLines } from "../../../lib/motionPuppet.js";
import { motionNarratorCastKey } from "../../../lib/motionVoice.js";
export const remotionBeatKey = (beat: MotionBeat, analysis: MotionStoryAnalysis, note = "") => motionInputKey([V.VERSION, L.SCENE_REVISION, analysis.visualSettings, analysis.visualSettings?.mode === "remotion" ? V.PROFILES[analysis.visualSettings.profileId].revision : undefined, analysis.era, analysis.cast, analysis.places, beat, note]);
export const remotionBeatPlanCurrent = (beat: MotionBeat, analysis: MotionStoryAnalysis, state?: MotionRemotionState, note = state?.notes?.[beat.id] || "") =>
  !!state?.scenes[beat.id]?.length && state.inputKeys[beat.id] === remotionBeatKey(beat, analysis) && state.scenes[beat.id].every((scene) => scene.sceneRevision === L.SCENE_REVISION && scene.sourceKey === remotionBeatKey(beat, analysis, note));
export const remotionGroupKey = (beats: MotionBeat[], analysis: MotionStoryAnalysis, state?: MotionRemotionState, note?: string) => motionInputKey([PACING.REVISION, beats.map((beat) => remotionBeatKey(beat, analysis, note ?? state?.notes?.[beat.id] ?? ""))]);
export const remotionGroupPlanCurrent = (beats: MotionBeat[], analysis: MotionStoryAnalysis, state?: MotionRemotionState, note?: string) => {
  const scenes = state?.scenes[beats[0]?.id];
  if (!scenes?.length || !beats.every((beat) => state?.inputKeys[beat.id] === remotionBeatKey(beat, analysis))) return false;
  const key = remotionGroupKey(beats, analysis, state, note);
  const lines = beats.flatMap((beat) => puppetBeatLines(beat, motionNarratorCastKey(analysis)));
  let cursor = 0;
  for (const scene of scenes) {
    const from = lines.findIndex((line) => line.key === scene.fromLineId),
      to = lines.findIndex((line) => line.key === scene.toLineId);
    if (from !== cursor || to < from || scene.sceneRevision !== L.SCENE_REVISION || scene.sourceKey !== key) return false;
    cursor = to + 1;
  }
  return cursor === lines.length;
};
export const remotionStoryPlanCurrent = (script: MotionStoryScript, analysis: MotionStoryAnalysis) =>
  script.beats.length > 0 && (script.gen?.remotion?.pacingRevision === PACING.REVISION ? motionVisualBeatGroups(script).every((group) => remotionGroupPlanCurrent(group.beats, analysis, script.gen?.remotion)) : script.beats.every((beat) => remotionBeatPlanCurrent(beat, analysis, script.gen?.remotion)));
export const remotionStoryBuildCurrent = (script: MotionStoryScript, analysis: MotionStoryAnalysis) => {
  const state = script.gen?.remotion;
  if (state?.compositionRevision === C.REVISION && state.settings.mode === "remotion") {
    if (state.profileRevision !== V.PROFILES[state.settings.profileId].revision || !remotionStoryPlanCurrent(script, analysis)) return false;
    try {
      for (const beat of script.beats)
        for (const scene of state.scenes[beat.id] || []) {
          if (!scene.composition) return false;
          validateSceneComposition(scene.composition, state.assets[scene.composition.assetKey], scene.nodes, new Set(analysis.cast.map((member) => member.key)));
        }
      return true;
    } catch {
      return false;
    }
  }
  return false;
};
