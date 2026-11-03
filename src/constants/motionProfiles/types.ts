import type { MotionSceneFormat, MotionSceneView } from "./framing.js";
export type MotionIllustrationStage = "planning" | "design" | "drawing" | "review";
export interface MotionIllustrationBrief {
  frame: string;
  rules: readonly string[];
  skin: string;
}
export type MotionIllustrationProfile = Record<MotionIllustrationStage, string> & { brief: MotionIllustrationBrief; grammar: string; storyContract: string; identity: string; closeUps: string; text: string; motion: string; anatomy: string; staging: string; hardRules: readonly string[]; framing?: Partial<Record<MotionSceneView, string>>; devices?: Partial<Record<MotionSceneFormat, string>> };
