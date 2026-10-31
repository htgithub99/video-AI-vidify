export type MotionIllustrationStage = "planning" | "design" | "drawing" | "review";
export type MotionIllustrationProfile = Record<MotionIllustrationStage, string> & { grammar: string; storyContract: string; identity: string; closeUps: string; text: string; motion: string; anatomy: string; staging: string };
