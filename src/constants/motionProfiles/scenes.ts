import type { MotionRemotionProfile } from "../../types/motionVisual.js";
import type { MotionProfileScene } from "./sceneSpec.js";
import { HISTORY_SCENE } from "./history/scene.js";
import { EXPLAINER_SCENE } from "./explainer/scene.js";
import { HORROR_SCENE } from "./horror/scene.js";
import { motionStyleRecord } from "../motionDrawStyles/index.js";
export const MOTION_PROFILE_SCENES: Record<MotionRemotionProfile, MotionProfileScene> = motionStyleRecord({ history: HISTORY_SCENE, explainer: EXPLAINER_SCENE, horror: HORROR_SCENE });
