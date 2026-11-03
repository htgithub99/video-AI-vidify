import { HISTORY_EXPLAINER_CHARACTER_FRAME, HISTORY_EXPLAINER_POSE_FRAMES } from "./history-explainer.js";
import { HORROR_CHARACTER_FRAME, HORROR_POSE_FRAMES } from "./horror.js";
import type { MotionFramePoseSet } from "./poses.js";
import type { MotionRemotionProfile } from "../../../types/motionVisual.js";
export const MOTION_CHARACTER_FRAMES: Record<MotionRemotionProfile, string> = { history: HISTORY_EXPLAINER_CHARACTER_FRAME, explainer: HISTORY_EXPLAINER_CHARACTER_FRAME, horror: HORROR_CHARACTER_FRAME };
export const MOTION_CHARACTER_POSE_FRAMES: Record<MotionRemotionProfile, MotionFramePoseSet> = { history: HISTORY_EXPLAINER_POSE_FRAMES, explainer: HISTORY_EXPLAINER_POSE_FRAMES, horror: HORROR_POSE_FRAMES };
