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
  gaps?: [number, number][];
  dist?: "near" | "mid" | "far";
  z?: number;
  focal?: boolean;
  fade?: [number, number];
  at?: [number, number];
  burning?: boolean;
  state?: "broken" | "collapsed";
  shape?: "ring";
  bank?: "near" | "far";
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
  groups?: { n: number; color?: string; of?: string }[];
  w?: number;
  h?: number;
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
  frame?: [number, number];
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
  headline?: { lines: string[]; x: number; y: number; size: number; align?: "left" | "center" | "right"; accent?: string; color?: string; tilt?: number };
  header?: string;
  pairs?: [string, string][];
  focus?: string;
}
