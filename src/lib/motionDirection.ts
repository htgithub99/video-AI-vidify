import * as MR from "../constants/motionRuntime.js";
import { MOTION_GEN_PREAMBLE } from "../constants/motionGenPrompts.js";
import type { MotionStoryAnalysis } from "../types/motionVideo.js";
import { creativeBlueprintPrompt } from "./motionCreativeBlueprint.js";
import { videoDnaPrompt } from "./motionVideoDna.js";
type MotionDirection = Pick<MotionStoryAnalysis, "videoDna" | "creativeBlueprint">;
export const planningPrompt = (analysis?: MotionDirection | null): string => (analysis?.videoDna ? videoDnaPrompt(analysis.videoDna) : creativeBlueprintPrompt(analysis?.creativeBlueprint));
export const productionPreamble = (analysis: MotionDirection | null | undefined, part: "story" | "visual" | "none"): string => {
  const focus = part === MR.MOTION_TEXT_VISUAL ? MR.MOTION_TEXT_APPLY_ITS_VISUAL_DESIGN_AND_PRODUCTION_PRINCIPLES : part === MR.MOTION_TEXT_STORY ? MR.MOTION_TEXT_APPLY_ITS_NARRATION_STRUCTURE_AND_WRITING_PRINCIPLES : "";
  return MR.MOTION_TEMPLATE_SYMBOL_72(MOTION_GEN_PREAMBLE, planningPrompt(analysis), focus);
};
