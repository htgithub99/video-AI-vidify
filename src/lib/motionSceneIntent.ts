import { MOTION_SCENE_INTENT as I } from "../constants/motionSceneIntent.js";
import type { MotionSceneFormat, MotionSceneView } from "../constants/motionProfiles/framing.js";
import type { MotionBeat } from "../types/motionVideo.js";
import type { MotionRemotionScene } from "../types/motionVisual.js";
export const motionSceneIntentView = (shot?: string): MotionSceneView | undefined => (shot ? I.SHOT_TO_VIEW[shot] : undefined);
export const motionSceneIntentFormat = (visual?: string): MotionSceneFormat | undefined => (visual ? I.VISUAL_TO_FORMAT[visual] : undefined);
export const applyMotionSceneIntent = (scenes: MotionRemotionScene[], beats: MotionBeat[]): { views: number; formats: number } => {
  let views = 0;
  let formats = 0;
  for (const scene of scenes) {
    const owner = beats.find((beat) => scene.fromLineId.startsWith(beat.id)) || beats.find((beat) => beat.id === scene.beatId);
    if (!owner) continue;
    const view = motionSceneIntentView(owner.shot);
    if (!scene.view && view) {
      scene.view = view;
      views++;
    }
    const format = motionSceneIntentFormat(owner.visual);
    if (format && (!scene.format || scene.format === I.ILLUSTRATION)) {
      scene.format = format;
      formats++;
    }
  }
  return { views, formats };
};
