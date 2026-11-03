import type { MotionRemotionProfile } from "../../types/motionVisual.js";
import type { MotionProfileScene } from "./sceneSpec.js";
import { HISTORY_SCENE } from "./history/scene.js";
import { EXPLAINER_SCENE } from "./explainer/scene.js";
import { HORROR_SCENE } from "./horror/scene.js";
export const MOTION_PROFILE_SCENES: Record<MotionRemotionProfile, MotionProfileScene> = { history: HISTORY_SCENE, explainer: EXPLAINER_SCENE, horror: HORROR_SCENE };
