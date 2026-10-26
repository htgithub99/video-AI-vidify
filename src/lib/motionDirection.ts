import { MOTION_REFERENCE_PROMPTS } from "../constants/motionReference.js";
import * as MR from "../constants/motionRuntime.js";
import { MOTION_GEN_PREAMBLE, MOTION_GEN_STORY_PREAMBLE } from "../constants/motionGenPrompts.js";
import type { MotionStoryAnalysis } from "../types/motionVideo.js";
import { creativeBlueprintPrompt } from "./motionCreativeBlueprint.js";
import { videoDnaPrompt } from "./motionVideoDna.js";
import { MOTION_PROMPT as P } from "../constants/motionPrompt.js";
type MotionDirection = Pick<MotionStoryAnalysis, "videoDna" | "creativeBlueprint" | "referenceStyle" | "characterMotion">;
export const planningPrompt = (analysis?: MotionDirection | null): string => (analysis?.videoDna ? videoDnaPrompt(analysis.videoDna) : creativeBlueprintPrompt(analysis?.creativeBlueprint));
export const productionPreamble = (analysis: MotionDirection | null | undefined, part: "story" | "visual" | "none", withKit = true): string => {
  const focus = part === MR.MOTION_TEXT_VISUAL ? MR.MOTION_TEXT_APPLY_ITS_VISUAL_DESIGN_AND_PRODUCTION_PRINCIPLES : part === MR.MOTION_TEXT_STORY ? MR.MOTION_TEXT_APPLY_ITS_NARRATION_STRUCTURE_AND_WRITING_PRINCIPLES : MR.MOTION_TEXT_EMPTY;
  return MR.MOTION_TEMPLATE_SYMBOL_72(
    part === MR.MOTION_TEXT_STORY ? MOTION_GEN_STORY_PREAMBLE : MOTION_GEN_PREAMBLE,
    part === MR.MOTION_TEXT_STORY ? storyDirectionPrompt(analysis) : planningPrompt(analysis),
    [focus, part === MR.MOTION_TEXT_STORY ? MR.MOTION_TEXT_EMPTY : analysis?.characterMotion ? MOTION_REFERENCE_PROMPTS.MOTION_ON : MOTION_REFERENCE_PROMPTS.MOTION_OFF, withKit && analysis?.referenceStyle ? MOTION_REFERENCE_PROMPTS.PROFILE(analysis.referenceStyle) : MR.MOTION_TEXT_EMPTY].filter(Boolean).join(MR.MOTION_TEXT_SYMBOL_27),
  );
};
export const storyDirectionPrompt = (analysis?: MotionDirection | null): string => {
  const dna = analysis?.videoDna || analysis?.creativeBlueprint;
  if (!dna) return "";
  return P.STORY_DIRECTION + JSON.stringify({ intent: dna.intent, audience: dna.audience, narrative: dna.narrative, creativeProfile: { role: dna.creativeProfile?.role, writingPrinciples: dna.creativeProfile?.writingPrinciples, strengths: dna.creativeProfile?.strengths }, mustPreserve: dna.mustPreserve, mustVary: dna.mustVary, mustNotCopy: dna.mustNotCopy, ...(analysis?.videoDna ? { audienceProfile: analysis.videoDna.audienceProfile, narrativeDna: analysis.videoDna.narrativeDna, format: analysis.videoDna.format, era: analysis.videoDna.era, narration: analysis.videoDna.audioText?.narration } : {}) });
};
