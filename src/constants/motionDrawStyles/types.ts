export type MotionStyleFamily = "history" | "horror" | "explainer";
export type MotionKitLook = "outline" | "horror" | "sketch" | "stick" | "comic" | "cutout";
// How the figures move when the video is shown: smooth (joint-by-joint, the camera follows the layout) or cutout (each
// pose a held picture that snaps, walking in hops, the camera holding, panning evenly and pushing in on the narration).
export type MotionMovement = "smooth" | "cutout";
export type MotionProportionId = "chibi" | "balanced" | "storybook" | "natural";
export interface MotionDrawStyleSpec {
  family: MotionStyleFamily;
  label: { vi: string; en: string };
  hint: { vi: string; en: string };
  kitLook: MotionKitLook;
  proportion: MotionProportionId;
  layout?: import("../motionLayouts/index.js").MotionLayoutId;
  movement?: MotionMovement;
  preview: string;
}
