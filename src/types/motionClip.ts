export type MotionClipLevel = "small" | "medium" | "large";
export type MotionClipSpeed = "slow" | "medium" | "fast";
export type MotionClipJoint = "top" | "bottom" | "center" | "left" | "right";
export type MotionClipOp = "swing" | "bob" | "spin" | "travel" | "scroll" | "flow" | "emit" | "pulse" | "shake" | "reveal" | "follow";
export type MotionClipParticle = "dust" | "splash" | "spark" | "leaf" | "smoke";
export type MotionClipTemperament = "calm" | "lively" | "tense";
export interface MotionClipBox {
  x: number;
  y: number;
  width: number;
  height: number;
}
export interface MotionRigPart {
  id: string;
  parent?: string;
  joint?: MotionClipJoint;
  pivot?: { x: number; y: number };
  box: MotionClipBox;
  canvas?: MotionClipBox;
  flip?: boolean;
  facing?: "left" | "right";
}
export interface MotionRig {
  width: number;
  height: number;
  facing?: "left" | "right";
  parts: MotionRigPart[];
}
export interface MotionClip {
  id?: string;
  op: MotionClipOp;
  target?: string;
  group?: string[];
  amount?: MotionClipLevel;
  speed?: MotionClipSpeed;
  cycle?: number;
  phase?: number | number[];
  couple?: string;
  lag?: number;
  lean?: "forward" | "back";
  bounce?: boolean;
  dir?: "left" | "right" | "up" | "down" | "back" | "cw" | "ccw";
  depth?: number;
  parent?: string;
  at?: string;
  particle?: MotionClipParticle;
  density?: MotionClipLevel;
  mode?: "scroll_background" | "path";
  from?: { x: number; y: number };
  to?: { x: number; y: number };
  start?: number;
  end?: number;
  facing?: "left" | "right";
  joint?: MotionClipJoint;
}
export interface MotionClipScript {
  scene: string;
  intent: string;
  temperament?: MotionClipTemperament;
  duration?: number;
  rig: MotionRig;
  clips: MotionClip[];
}
export interface MotionSceneMotion extends MotionClipScript {
  revision: number;
  key: string;
}
