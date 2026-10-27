import { MOTION_VISUAL as V } from "../../../constants/motionVisual.js";
import { MOTION_REMOTION_LAYOUT as L } from "../../../constants/motionRemotionLayout.js";
import type { MotionBeat, MotionStoryAnalysis, MotionStoryScript } from "../../../types/motionVideo.js";
import type { MotionRemotionState } from "../../../types/motionVisual.js";
import { motionInputKey } from "../motionFileUtils.js";
export const remotionBeatKey = (beat: MotionBeat, analysis: MotionStoryAnalysis, note = "") => motionInputKey([V.VERSION, L.SCENE_REVISION, analysis.visualSettings, analysis.era, analysis.cast, analysis.places, beat, note]);
export const remotionBeatPlanCurrent = (beat: MotionBeat, analysis: MotionStoryAnalysis, state?: MotionRemotionState, note = state?.notes?.[beat.id] || "") =>
  !!state?.scenes[beat.id]?.length && state.inputKeys[beat.id] === remotionBeatKey(beat, analysis) && state.scenes[beat.id].every((scene) => scene.sceneRevision === L.SCENE_REVISION && scene.sourceKey === remotionBeatKey(beat, analysis, note));
export const remotionStoryPlanCurrent = (script: MotionStoryScript, analysis: MotionStoryAnalysis) => script.beats.length > 0 && script.beats.every((beat) => remotionBeatPlanCurrent(beat, analysis, script.gen?.remotion));
export const remotionStoryBuildCurrent = (script: MotionStoryScript, analysis: MotionStoryAnalysis) => {
  const state = script.gen?.remotion;
  return !!state && state.settings.mode === "remotion" && state.profileRevision === V.PROFILES[state.settings.profileId].revision && state.layoutRevision === L.REVISION && remotionStoryPlanCurrent(script, analysis);
};
