import type { MotionRemotionProfile } from "../types/motionVisual.js";
import { MOTION_HISTORY_CRAFT_EXAMPLE, MOTION_EXPLAINER_CRAFT_EXAMPLE } from "./motionCompositionStyleExamples.js";
import { MOTION_HORROR_CRAFT_EXAMPLE } from "./motionHorrorCraftExample.js";
import { MOTION_ILLUSTRATION_COMMON } from "./motionIllustrationProfiles.js";
export const MOTION_COMPOSITION_EXAMPLES: Record<MotionRemotionProfile, string> = { history: MOTION_ILLUSTRATION_COMMON.REFERENCE + "\n" + MOTION_HISTORY_CRAFT_EXAMPLE, explainer: MOTION_ILLUSTRATION_COMMON.REFERENCE + "\n" + MOTION_EXPLAINER_CRAFT_EXAMPLE, horror: MOTION_ILLUSTRATION_COMMON.REFERENCE + "\n" + MOTION_HORROR_CRAFT_EXAMPLE } as const;
