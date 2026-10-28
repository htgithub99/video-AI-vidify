import type { MotionStoryScript } from "../types/motionVideo.js";
import { MOTION_VISUAL as V } from "../constants/motionVisual.js";
import { remotionSceneReadiness } from "./motionRemotion.js";
import { motionVisualBeatGroups } from "./motionScenePacing.js";
import { MOTION_SCENE_PACING as PACING } from "../constants/motionScenePacing.js";
export const remotionSceneProgress = (script: MotionStoryScript, busy = false, language = "vi") => {
  const text = V.TEXT[language === "en" ? "en" : "vi"];
  const state = script.gen?.remotion;
  const groups = state?.pacingRevision === PACING.REVISION ? motionVisualBeatGroups(script) : script.beats.map((beat) => ({ id: beat.id, beats: [beat] }));
  const entries = groups.flatMap((group) => {
    const beat = group.beats[0];
    const stored = state?.scenes[beat.id];
    const covered = new Set(stored?.flatMap((scene) => scene.sourceBeatIds || [scene.beatId]));
    const plans = group.beats.every((member) => covered.has(member.id)) ? stored : undefined;
    return (plans?.length ? plans : [undefined]).map((scene) => {
      const readiness: ReturnType<typeof remotionSceneReadiness> = scene ? remotionSceneReadiness(scene, state) : {};
      const failure = state?.failures[beat.id];
      const reason = readiness.error || (readiness.missingBackground ? text.missingBackground : readiness.missingAssets?.length ? text.missingAssets(readiness.missingAssets) : "") || failure || (!scene ? text.scenePlanning : "");
      const status = readiness.preview ? "ready" : failure ? "failed" : busy ? "waiting" : "stopped";
      return { key: scene?.id || beat.id, beatId: beat.id, scene, preview: readiness.preview, status, reason, narration: scene?.text || beat.narration || "" };
    });
  });
  return { entries, ready: entries.filter((entry) => !!entry.preview).length, total: entries.length };
};
