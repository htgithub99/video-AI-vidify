import * as RT_MAINTENANCE from "../../../constants/runtime/maintenance.js";
import * as COMMON_RUNTIME from "../../../constants/sourceText.js";
import { RUNTIME_TEXT as RT_SHARED } from "../../../constants/runtime/shared.js";
import { RUNTIME_VALUES } from "../../../constants/runtime/values.js";
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
    return (plans?.length ? plans : group.beats.map(() => undefined)).map((scene, index) => {
      const member = group.beats[index] || beat;
      const readiness: ReturnType<typeof remotionSceneReadiness> = scene ? remotionSceneReadiness(scene, state) : {};
      const failure = scene?.build?.status === COMMON_RUNTIME.SOURCE_TEXT_FAILED ? scene.build.error : state?.failures[beat.id];
      const reason = failure || readiness.error || (readiness.missingBackground ? text.missingBackground : readiness.missingAssets?.length ? text.missingAssets(readiness.missingAssets) : "") || (!scene ? text.scenePlanning : "");
      const status = failure ? RT_SHARED.FAILED : readiness.preview ? RT_SHARED.READY : busy ? RT_SHARED.WAITING : RT_MOTION.STOPPED;
      const warnings = scene?.renderer !== RT_MAINTENANCE.HTML_CANVAS && scene?.generation?.status === RUNTIME_VALUES.ACCEPTED_070C160A && scene.generation.warnings?.length ? scene.generation.warnings : undefined;
      return { key: scene?.id || member.id, beatId: member.id, scene, preview: readiness.preview, status, reason, narration: scene?.text || member.narration || "", score: scene?.renderer === RT_MAINTENANCE.HTML_CANVAS ? undefined : scene?.generation?.score, warnings };
    });
  });
  return { entries, ready: entries.filter((entry) => entry.status === RT_SHARED.READY).length, total: entries.length, warned: entries.filter((entry) => entry.warnings).length, failed: entries.filter((entry) => entry.status === RT_SHARED.FAILED).length };
};
