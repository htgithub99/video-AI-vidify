export type MotionKitSkinId = "outline" | "sketch" | "comic" | "horror";
export type MotionKitSkinParams = Record<string, unknown>;
export interface MotionKitSkin {
  id: MotionKitSkinId;
  params: MotionKitSkinParams;
  draw?: Record<string, string>;
}
