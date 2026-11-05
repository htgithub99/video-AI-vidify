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
/**
 * One movable SVG group as measured after drawing.
 * `box`/`pivot` use the group's own user space (where appended transforms apply);
 * `canvas` is the same box in canvas pixels (defaults to `box` when the group has no base transform);
 * `flip` marks a mirrored base transform so screen directions stay correct.
 */
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
/** AI-authored motion instruction: semantic levels only, no coordinates. */
export interface MotionClip {
  id?: string;
  op: MotionClipOp;
  target?: string;
  group?: string[];
  amount?: MotionClipLevel;
  speed?: MotionClipSpeed;
  /** Seconds per cycle at full speed. */
  cycle?: number;
  phase?: number | number[];
  /** Id of a travel clip; cycles then follow the travelled distance. */
  couple?: string;
  lag?: number;
  lean?: "forward" | "back";
  bounce?: boolean;
  dir?: "left" | "right" | "up" | "down" | "back" | "cw" | "ccw";
  depth?: number;
  parent?: string;
  /** Emit anchor: "<partId>:<top|bottom|left|right|center>". */
  at?: string;
  particle?: MotionClipParticle;
  density?: MotionClipLevel;
  /** scroll_background: the subject stays put and scroll layers move; otherwise travel from → to (canvas fractions of the foot point). */
  mode?: "scroll_background" | "path";
  from?: { x: number; y: number };
  to?: { x: number; y: number };
  /** Active window as fractions (0..1) of the scene duration. */
  start?: number;
  end?: number;
  /** Screen direction the subject faces; flips swing bias and lean. */
  facing?: "left" | "right";
  /** Side of the part's box it rotates around (limb top, head bottom, wheel center). */
  joint?: MotionClipJoint;
}
export interface MotionClipScript {
  scene: string;
  intent: string;
  temperament?: MotionClipTemperament;
  /** Scene seconds; the renderer overrides it with the real scene length. */
  duration?: number;
  rig: MotionRig;
  clips: MotionClip[];
}
/** AI-directed motion stored on a drawn scene composition. */
export interface MotionSceneMotion extends MotionClipScript {
  revision: number;
  key: string;
}
