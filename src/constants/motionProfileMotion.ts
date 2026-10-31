import { MOTION_CAMERA } from "./motionCamera.js";
import type { MotionRemotionProfile } from "../types/motionVisual.js";
export type MotionProfileCameraMode = "follow" | "push" | "pull" | "hold";
export interface MotionProfileCamera { MAX_ZOOM: number; SPEED: number; MIN_ZOOM: number; TRACK: number; RAMP: number; SMOOTH: number; FOLLOW_SPEED: number; PART_WEIGHT: number; HOLD_SUBJECT: MotionProfileCameraMode }
export interface MotionProfileMotion { freeParts?: RegExp; breathScale: number; headSuffixes: readonly string[]; headBob: number; effectOpacity: number; effectTravel: number; prompt: string; camera: MotionProfileCamera }
const ORIGINAL: MotionProfileMotion = {
  breathScale: 1.006,
  headSuffixes: [],
  headBob: 0,
  effectOpacity: 0.9,
  effectTravel: 0.008,
  prompt: "",
  camera: { MAX_ZOOM: MOTION_CAMERA.MAX_ZOOM, SPEED: MOTION_CAMERA.SPEED, MIN_ZOOM: 0, TRACK: 0, RAMP: 0, SMOOTH: 1, FOLLOW_SPEED: MOTION_CAMERA.FOLLOW_SPEED, PART_WEIGHT: 0, HOLD_SUBJECT: "hold" },
};
const LIVELY: MotionProfileMotion = {
  freeParts: /(?:^|_)(?:head|neck|hands?|cloak|cape|mantle|scarf|sash|veil|hair|ponytail|braid|beard|mane|tail|crest|plume|feathers?|ribbon|flag|banner|sleeves?|wings?|ears?|torso|upper|weapon|spear|sword|staff|whip|reins|fan)(?:_|$)/i,
  breathScale: 1.016,
  headSuffixes: ["_head"],
  headBob: 0.004,
  effectOpacity: 0.72,
  effectTravel: 0.02,
  prompt:
    "MOTION AMPLITUDE IN THIS STYLE: loops must stay readable on a phone screen. Cloth, hair, tails, plumes and flags swing about 6-12 degrees; a gesturing arm or hand 8-15 degrees; a head nod or turn 3-6 degrees; a breathing chest scales about 1.5-2.5%; smoke, dust, ripples and flames drift about 2-4% of the canvas width per loop. Rotate each part around its own joint or attachment point in that element's coordinates so it stays attached. Give moving parts their own group ids inside the character (for example <layer>_head, <layer>_arm_right, <layer>_cloak, <layer>_tail) and animate those parts; keep garment bases, feet and seated bodies still.",
  camera: { MAX_ZOOM: 0.09, SPEED: 0.011, MIN_ZOOM: 0.035, TRACK: 1, RAMP: 0.35, SMOOTH: 0.07, FOLLOW_SPEED: 0.006, PART_WEIGHT: 0.4, HOLD_SUBJECT: "follow" },
};
export const MOTION_PROFILE_MOTION: Record<MotionRemotionProfile, MotionProfileMotion> = { history: LIVELY, explainer: LIVELY, horror: ORIGINAL };
