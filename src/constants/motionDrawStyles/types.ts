export type MotionStyleFamily = "history" | "horror" | "explainer";
export type MotionKitLook = "outline" | "horror" | "sketch" | "comic";
export type MotionProportionId = "chibi" | "balanced" | "storybook";
export interface MotionDrawStyleSpec {
  family: MotionStyleFamily;
  label: { vi: string; en: string };
  hint: { vi: string; en: string };
  planner: string;
  title?: string;
  look?: string;
  kitLookLine?: string;
  kitLook: MotionKitLook;
  figure: MotionStyleFamily;
  proportion: MotionProportionId;
  layout?: import("../motionLayouts/index.js").MotionLayoutId;
  preview: string;
}
