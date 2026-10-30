import * as COMMON_RUNTIME from "../../../constants/sourceText.js";
import { RUNTIME_TEXT as RT_SHARED } from "../../../constants/runtime/shared.js";
import { RUNTIME_TEXT as RT_MOTION } from "../constants/runtimeText.js";
import type { MotionStoryScript } from "../../../types/motionVideo.js";
import { MOTION_VISUAL as V } from "../../../constants/motionVisual.js";
import { remotionSceneReadiness } from "../../../lib/motionRemotion.js";
import { motionVisualBeatGroups } from "../../../lib/motionScenePacing.js";
import { MOTION_SCENE_PACING as PACING } from "../../../constants/motionScenePacing.js";
export const remotionSceneProgress = (script: MotionStoryScript, busy = false, language: string = RT_SHARED.VI) => {
  const text = V.TEXT[language === RT_SHARED.EN ? RT_SHARED.EN : RT_SHARED.VI];
  const state = script.gen?.remotion;
  const groups = state?.pacingRevision === PACING.REVISION ? motionVisualBeatGroups(script, state.groupingRevision) : script.beats.map((beat) => ({ id: beat.id, beats: [beat] }));
  const entries = groups.flatMap((group) => {
    const beat = group.beats[0];
    const stored = state?.scenes[beat.id];
    const covered = new Set(stored?.flatMap((scene) => scene.sourceBeatIds || [scene.beatId]));
    const plans = group.beats.every((member) => covered.has(member.id)) ? stored : undefined;
    return (plans?.length ? plans : [undefined]).map((scene) => {
      const readiness: ReturnType<typeof remotionSceneReadiness> = scene ? remotionSceneReadiness(scene, state) : {};
      const failure = scene?.build?.status === COMMON_RUNTIME.SOURCE_TEXT_FAILED ? scene.build.error : state?.failures[beat.id];
      const reason = failure || readiness.error || (readiness.missingBackground ? text.missingBackground : readiness.missingAssets?.length ? text.missingAssets(readiness.missingAssets) : "") || (!scene ? text.scenePlanning : "");
      const status = failure ? RT_SHARED.FAILED : readiness.preview ? RT_SHARED.READY : busy ? RT_SHARED.WAITING : RT_MOTION.STOPPED;
      return { key: scene?.id || beat.id, beatId: beat.id, scene, preview: readiness.preview, status, reason, narration: scene?.text || beat.narration || "" };
    });
  });
  return { entries, ready: entries.filter((entry) => entry.status === RT_SHARED.READY).length, total: entries.length };
};
