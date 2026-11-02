import { MOTION_CAMERA } from "./motionCamera.js";
import type { MotionRemotionProfile } from "../types/motionVisual.js";
export type MotionProfileCameraMode = "follow" | "push" | "pull" | "hold";
export interface MotionProfileCamera { MAX_ZOOM: number; SPEED: number; MIN_ZOOM: number; TRACK: number; RAMP: number; SMOOTH: number; FOLLOW_SPEED: number; PART_WEIGHT: number; HOLD_SUBJECT: MotionProfileCameraMode }
export interface MotionProfileMotion { freeParts?: RegExp; breathScale: number; headSuffixes: readonly string[]; headBob: number; bodyFallback: boolean; minRotate: number; effectOpacity: number; effectTravel: number; effectSeconds?: number; prompt: string; camera: MotionProfileCamera }
const ORIGINAL: MotionProfileMotion = {
  breathScale: 1.006,
  headSuffixes: [],
  headBob: 0,
  bodyFallback: false,
  minRotate: 0,
  effectOpacity: 0.9,
  effectTravel: 0.008,
  prompt: "",
  camera: { MAX_ZOOM: MOTION_CAMERA.MAX_ZOOM, SPEED: MOTION_CAMERA.SPEED, MIN_ZOOM: 0, TRACK: 0, RAMP: 0, SMOOTH: 1, FOLLOW_SPEED: MOTION_CAMERA.FOLLOW_SPEED, PART_WEIGHT: 0, HOLD_SUBJECT: "hold" },
};
const LIVELY: MotionProfileMotion = {
  freeParts: /(?:^|_)(?:head|neck|hands?|cloak|cape|mantle|scarf|sash|veil|hair|ponytail|braid|beard|mane|tail|crest|plume|feathers?|ribbon|flag|banner|sleeves?|wings?|ears?|torso|upper|weapon|spear|sword|staff|whip|reins|fan)(?:_|$)/i,
  breathScale: 1.02,
  headSuffixes: ["_head"],
  headBob: 0.007,
  bodyFallback: true,
  minRotate: 6,
  effectOpacity: 0.6,
  effectTravel: 0.03,
  effectSeconds: 3.6,
  prompt:
    "MOTION IN THIS STYLE: every character who speaks, reacts or acts in this picture gets at least one actor track on a BODY part first: a head nod or turn of 4-7 degrees, or a gesturing arm or hand of 8-15 degrees around its shoulder or elbow; cloth, hair, tails, plumes and flags are secondary and swing 8-14 degrees. A breathing chest scales about 2%. Smoke, dust, ripples and flames drift about 3-5% of the canvas width per loop of 3-4 seconds. Rotate each part around its own joint or attachment point in that element's coordinates so it stays attached. Give every moving part its own group id inside the character using these exact suffixes: <layer>_head, <layer>_torso, <layer>_arm_left, <layer>_arm_right, <layer>_hand_right, <layer>_cloak, <layer>_hair, <layer>_tail. Keep garment bases, feet and seated bodies still. Loops stay readable on a phone screen; a track nobody can see is not motion.",
  camera: { MAX_ZOOM: 0.09, SPEED: 0.011, MIN_ZOOM: 0.035, TRACK: 1, RAMP: 0.35, SMOOTH: 0.07, FOLLOW_SPEED: 0.006, PART_WEIGHT: 0.4, HOLD_SUBJECT: "follow" },
};
export const MOTION_PROFILE_MOTION: Record<MotionRemotionProfile, MotionProfileMotion> = { history: LIVELY, explainer: LIVELY, horror: ORIGINAL };
