import type { MotionStoryScript } from "../types/motionVideo.js";
import { MOTION_VISUAL as V } from "../constants/motionVisual.js";
import { remotionSceneReadiness } from "./motionRemotion.js";
export const remotionSceneProgress = (script: MotionStoryScript, busy = false, language = "vi") => {
  const text = V.TEXT[language === "en" ? "en" : "vi"];
  const state = script.gen?.remotion;
  const entries = script.beats.flatMap((beat) => {
    const plans = state?.scenes[beat.id];
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
