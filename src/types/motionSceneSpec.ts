// A scene as the AI describes it (frame pixels 1280×720, keyframes over progress 0..1); the engine draws it with the kit.
export type MotionSpecFn = "person" | "animal" | "vehicle" | "building" | "prop" | "tree" | "wall" | "bridge" | "sticker";
export type MotionSpecLook = Record<string, unknown>;
export interface MotionSpecKey extends MotionSpecLook {
  at: number;
  x?: number;
  y?: number;
  h?: number;
  facing?: number;
}
export interface MotionSpecGroup {
  count: number;
  width?: number;
  rows?: number;
  depth?: number;
}
export interface MotionSpecItem {
  id: string;
  fn: MotionSpecFn;
  kind?: string;
  x?: number;
  y?: number;
  h?: number;
  w?: number;
  facing?: number;
  look?: MotionSpecLook;
  keys?: MotionSpecKey[];
  group?: MotionSpecGroup;
  mount?: string;
  mountLook?: MotionSpecLook;
  on?: string;
  from?: number;
  to?: number;
  // Open stretches of a wall, a palisade or a wagon fort ([x0, x1] pairs).
  gaps?: [number, number][];
  // A thing in the air: how far it is (near, mid, far), its size follows.
  dist?: "near" | "mid" | "far";
  z?: number;
  focal?: boolean;
  fade?: [number, number];
  at?: [number, number];
  burning?: boolean;
  heldBy?: string;
  hand?: "front" | "back";
  code?: string;
}
export interface MotionSpecEffect {
  kind: string;
  x: number;
  y: number;
  r: number;
  at?: [number, number];
  facing?: number;
}
export interface MotionSpecDevice {
  kind: "thought" | "inset" | "emote" | "count" | "time" | "sound" | "speed" | "impact" | "spotlight";
  of?: string;
  x?: number;
  y?: number;
  r?: number;
  at?: [number, number];
  sign?: string;
  part?: "hand" | "head" | "body";
  zoom?: number;
  facing?: number;
  body?: "sun" | "moon";
  groups?: { n: number; color?: string }[];
  w?: number;
  h?: number;
  // A thought bubble's picture: a few library things drawn small inside it.
  items?: MotionSpecItem[];
}
export interface MotionSpecMap {
  paper?: string;
  land?: [number, number][][];
  water?: [number, number][][];
  rivers?: [number, number][][];
  places?: { name: string; type?: "city" | "river" | "sea" | "region" | "mountain"; x: number; y: number; big?: boolean }[];
  forces?: { id: string; side: string; color?: string; x: number; y: number; keys?: { at: number; x: number; y: number }[]; size?: number }[];
  arrows?: { from: [number, number]; to: [number, number]; color?: string; at?: [number, number]; curve?: number }[];
}
export interface MotionSceneSpec {
  version: 1;
  // Frame size in pixels when it is not 1280×720 (a portrait thumbnail).
  frame?: [number, number];
  // The master frame's target height of the focal person, as a share of the measured frame side (motionMasterTarget).
  master?: number;
  horizon: number;
  time: "day" | "dawn" | "dusk" | "night";
  ground: "dirt" | "grass" | "sand" | "snow" | "mud" | "stone";
  ridge?: "none" | "low" | "hills";
  interior?: { wall: string; floor: string } | null;
  sky?: { clouds?: number; birds?: boolean; sun?: boolean; sunX?: number };
  water?: { kind: string; y: number; h: number }[];
  scatter?: { kind: string; count: number; area?: [number, number, number, number] }[];
  haze?: { kind: "dust" | "smoke" | "mist"; amount: number; at?: [number, number]; frontOf?: number };
  effects?: MotionSpecEffect[];
  items: MotionSpecItem[];
  devices?: MotionSpecDevice[];
  map?: MotionSpecMap | null;
  // A thumbnail's headline (the only text a thumbnail has).
  headline?: { lines: string[]; x: number; y: number; size: number; align?: "left" | "center" | "right"; accent?: string; color?: string; tilt?: number };
  // The time header (date part only), filled by code from the plan.
  header?: string;
  // Who acts on whom (the plan's INTERACT pairs, as mark ids): they may stand close.
  pairs?: [string, string][];
  // The focal item's id (code keeps exactly one).
  focus?: string;
}
