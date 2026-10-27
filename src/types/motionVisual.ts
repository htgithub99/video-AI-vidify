import type { MotionSpec } from "./motionVideo.js";
export type MotionVisualMode = "library" | "remotion";
export type MotionRemotionProfile = "history" | "horror" | "explainer";
export interface MotionRenderBehavior {
  version: 1;
  actors: "fixed" | "simple";
  sceneEffects: "off" | "gentle";
  camera: "fixed" | "gentle";
}
export interface MotionVisualRect {
  x: number;
  y: number;
  width: number;
  height: number;
}
export type MotionRemotionRole = "fixture" | "support" | "object" | "decal";
export interface MotionRemotionEffect {
  id: string;
  kind: "rain" | "smoke" | "steam" | "flame" | "fog" | "sway";
  source?: string;
  anchor?: string;
  region?: string;
  essential?: boolean;
  direction?: "up" | "ground" | "left" | "right";
  intensity?: number;
}
export type MotionVisualSettings = { version: 1; mode: "library"; engine: "canvas"; packId: string } | { version: 1; mode: "remotion"; engine: "remotion"; profileId: MotionRemotionProfile; componentRevision: number };
export interface MotionVectorAsset {
  key: string;
  inputKey: string;
  svg: string;
  width: number;
  height: number;
  description: string;
  anchors?: Record<string, { x: number; y: number }>;
  regions?: Record<string, MotionVisualRect>;
  bounds?: MotionVisualRect;
  layerRevision?: number;
  stateKey?: string;
}
export interface MotionRemotionNode {
  id: string;
  kind: "character" | "prop" | "label";
  entityId?: string;
  description: string;
  pose: string;
  slot: "left" | "center" | "right";
  relation?: "beside" | "behind" | "on" | "inside" | "heldBy";
  target?: string;
  evidence: string;
  essential?: boolean;
  appearanceChanged?: boolean;
  poseEssential?: boolean;
  assetKey?: string;
  role?: MotionRemotionRole;
  mount?: string;
  contact?: "base" | "seat" | "body";
  objectId?: string;
  state?: string;
  stateEvidence?: string;
  persistent?: boolean;
}
export interface MotionRemotionScene {
  id: string;
  beatId: string;
  fromLineId: string;
  toLineId: string;
  purpose: string;
  text: string;
  place?: string;
  environment: string;
  nodes: MotionRemotionNode[];
  aspect?: string;
  backgroundKey?: string;
  backgroundDesignKey?: string;
  sourceKey: string;
  reviewKey?: string;
  effects?: MotionRemotionEffect[];
  time?: string;
  weather?: string;
  declaredTime?: string;
  declaredWeather?: string;
  locationKey?: string;
  view?: "wide" | "detail";
  focus?: string[];
  layoutRevision?: number;
  sceneRevision?: number;
  continuityKey?: string;
  continuityDraft?: { nodes: MotionRemotionNode[]; resolvedKey: string };
  removedObjects?: string[];
}
export interface MotionRemotionState {
  version: number;
  settings: MotionVisualSettings;
  assets: Record<string, MotionVectorAsset>;
  scenes: Record<string, MotionRemotionScene[]>;
  inputKeys: Record<string, string>;
  failures: Record<string, string>;
  drafts?: Record<string, unknown[]>;
  notes?: Record<string, string>;
  updatedAt?: number;
  profileRevision?: number;
  invalidAssets?: Record<string, { asset: MotionVectorAsset; reason: string }>;
  renderBehavior?: MotionRenderBehavior;
  layoutRevision?: number;
  locations?: Record<string, { environment: string; backgroundKey?: string }>;
}
export interface MotionRemotionPlacedNode extends MotionRemotionNode {
  x: number;
  y: number;
  width: number;
  height: number;
  depth: number;
}
export interface MotionRemotionTimedScene extends Omit<MotionRemotionScene, "nodes"> {
  startFrame: number;
  endFrame: number;
  nodes: MotionRemotionPlacedNode[];
}
export interface MotionRemotionSpec {
  engine: "remotion";
  version: number;
  title: string;
  aspect: string;
  fps: number;
  duration: number;
  width: number;
  height: number;
  motion: boolean;
  profileId: MotionRemotionProfile;
  assets: Record<string, MotionVectorAsset>;
  scenes: MotionRemotionTimedScene[];
  subtitles: NonNullable<MotionSpec["subtitles"]>;
  music?: MotionSpec["music"];
  renderBehavior?: MotionRenderBehavior;
  resolvedSettings?: { layoutRevision: number; effectRevision: number; sceneRevision?: number; behavior: MotionRenderBehavior };
}
export type MotionRenderSpec = MotionSpec | MotionRemotionSpec;
