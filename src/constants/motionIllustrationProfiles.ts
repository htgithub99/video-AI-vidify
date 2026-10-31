import type { MotionRemotionProfile } from "../types/motionVisual.js";
import type { MotionIllustrationProfile } from "./motionProfiles/types.js";
import { HORROR_ART_DIRECTION } from "./motionProfiles/horror/artDirection.js";
import { HISTORY_ART_DIRECTION } from "./motionProfiles/history/artDirection.js";
import { EXPLAINER_ART_DIRECTION } from "./motionProfiles/explainer/artDirection.js";
export type { MotionIllustrationStage } from "./motionProfiles/types.js";
export const MOTION_ILLUSTRATION_PROFILES: Record<MotionRemotionProfile, MotionIllustrationProfile> = { horror: HORROR_ART_DIRECTION, history: HISTORY_ART_DIRECTION, explainer: EXPLAINER_ART_DIRECTION };
