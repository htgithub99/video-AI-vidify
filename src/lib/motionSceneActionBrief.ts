import { MOTION_SCENE_ACTION as A, MOTION_SCENE_ACTION_REVISION } from "../constants/motionSceneAction.js";
import { stringifyJson } from "./jsonStringify.js";
import type { MotionSceneBriefContext } from "./motionSceneBrief.js";
import type { MotionBeat } from "../types/motionVideo.js";
import type { MotionRemotionScene } from "../types/motionVisual.js";
export interface MotionWrittenSceneIntent { beatId: string; narration: string; motionIntent: string }
/** Select source records only: no motion classification, body-part selection or prose rewriting. */
export const motionWrittenSceneIntents = (scene: Pick<MotionRemotionScene, "beatId" | "sourceBeatIds">, beats: MotionBeat[]): MotionWrittenSceneIntent[] => {
  const ids = new Set(scene.sourceBeatIds?.length ? scene.sourceBeatIds : [scene.beatId]);
  return beats.filter((beat) => ids.has(beat.id) && typeof beat.motionIntent === "string" && beat.motionIntent.trim()).map((beat) => ({ beatId: beat.id, narration: beat.narration, motionIntent: beat.motionIntent! }));
};
export const motionSceneActionLines = (context: MotionSceneBriefContext): string[] => {
  if ((context.renderBehavior as { actors?: string } | undefined)?.actors !== "simple") return [A.OFF];
  return [
    `${A.HEADER} (policy ${MOTION_SCENE_ACTION_REVISION})`,
    context.sourceMotionIntents?.length || context.sceneMotionIntent || context.sceneActionPlan ? A.SOURCE : A.LEGACY,
    ...(context.sourceMotionIntents?.length ? [stringifyJson(context.sourceMotionIntents)] : []),
    ...(context.sceneMotionIntent ? [A.SCENE_INTENT, context.sceneMotionIntent] : []),
    ...(context.sceneActionPlan ? [A.SCENE_PLAN, stringifyJson(context.sceneActionPlan)] : []),
    A.DELTAS,
  ];
};
