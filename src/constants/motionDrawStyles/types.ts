export type MotionStyleFamily = "history" | "horror" | "explainer";
export type MotionKitLook = "outline" | "horror" | "sketch" | "stick" | "comic" | "cutout";
export type MotionMovement = "smooth" | "cutout";
export type MotionProportionId = "chibi" | "balanced" | "storybook" | "natural";
export interface MotionDrawStyleSpec {
  family: MotionStyleFamily;
  label: { vi: string; en: string };
  hint: { vi: string; en: string };
  kitLook: MotionKitLook;
  proportion: MotionProportionId;
  movement?: MotionMovement;
  preview: string;
}
