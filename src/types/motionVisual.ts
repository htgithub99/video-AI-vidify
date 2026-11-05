import type { MotionSpec } from "./motionVideo.js";
import type { MotionSceneFormat, MotionSceneView } from "../constants/motionProfiles/framing.js";
export type MotionVisualMode = "library" | "remotion";
export type MotionRemotionProfile = "history" | "horror" | "explainer";
export type MotionScenePacing = "few" | "medium" | "many";
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
export type MotionVisualSettings = ({ version: 1; mode: "library"; engine: "canvas"; packId: string } | { version: 1; mode: "remotion"; engine: "remotion"; profileId: MotionRemotionProfile; componentRevision: number }) & { pacing?: MotionScenePacing };
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
  stagingRevision?: number;
  characterRevision?: number;
  characterScale?: number;
  spaceRevision?: number;
  projectionRevision?: number;
  backgroundRevision?: number;
  compositionRevision?: number;
  space?: { revision: number; horizon: number; vanishingPoint: { x: number; y: number }; regions: Record<string, MotionVisualRect> };
}
export interface MotionRemotionNode {
  id: string;
  kind: "character" | "prop" | "label";
  entityId?: string;
  anonymous?: boolean;
  crowd?: { groupKey?: string; faction?: string; appearance?: string; depth: "foreground" | "midground" | "background"; rows?: number; facing?: string; count?: number };
  visibleCount?: number;
  groupKey?: string;
  uses?: { objectId: string; how: string };
  description: string;
  pose: string;
  posture?: string;
  support?: string;
  stance?: import("../constants/motionProfiles/sceneSpec.js").MotionPosture;
  facing?: import("../constants/motionProfiles/sceneSpec.js").MotionFacing;
  distance?: import("../constants/motionProfiles/sceneSpec.js").MotionDepth;
  rides?: string;
  unit?: import("../constants/motionUnits.js").MotionUnit;
  gait?: import("../constants/motionProfiles/sceneSpec.js").MotionGait;
  animal?: import("../constants/motionProfiles/sceneSpec.js").MotionAnimal;
  outfitChange?: boolean;
  representation?: "full" | "bust" | "detail";
  slot: "left" | "center" | "right";
  relation?: "beside" | "behind" | "on" | "inside" | "heldBy";
  target?: string;
  attachmentAnchor?: string;
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
  age?: "child" | "adult" | "senior";
  layoutX?: number;
  layoutY?: number;
  layoutHeight?: number;
  layoutDepth?: number;
  layoutSocket?: string;
  groundTargets?: string[];
}
export interface MotionObjectSheetEntry {
  class: import("../constants/motionObjectClasses.js").MotionObjectClass;
  term: string;
  names: string[];
  svg: string;
  parts: string[];
}
export interface MotionSceneObject {
  id: string;
  class: import("../constants/motionObjectClasses.js").MotionObjectClass;
  description: string;
  term?: string;
  kind?: import("../constants/motionObjectKinds.js").MotionObjectKind;
  owner?: string;
  size?: import("../constants/motionObjectClasses.js").MotionObjectSize;
}
export interface MotionSceneCrop {
  x: number;
  y: number;
  width: number;
  height: number;
}
export interface MotionRemotionScene {
  format?: MotionSceneDesign["format"];
  id: string;
  beatId: string;
  sourceBeatIds?: string[];
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
  view?: MotionSceneView;
  camera?: string;
  lead?: string;
  detailSubject?: import("../constants/motionProfiles/sceneSpec.js").MotionDetailSubject;
  objects?: MotionSceneObject[];
  crop?: MotionSceneCrop;
  qualityNote?: string;
  qualityRedraws?: number;
  focus?: string[];
  layoutRevision?: number;
  sceneRevision?: number;
  continuityKey?: string;
  continuityDraft?: { nodes: MotionRemotionNode[]; resolvedKey: string };
  removedObjects?: string[];
  composition?: MotionSceneComposition;
  build?: { inputKey: string; status: "accepted" | "failed"; review: boolean; error?: string; attempts?: number };
  failStreak?: number;
  deferred?: boolean;
  drawingNote?: string;
  requestKeys?: string[];
  speaking?: { entityId: string; startFrame: number; endFrame: number }[];
}
export interface MotionSceneLayer {
  id: string;
  kind: "background" | "character" | "prop" | "effect";
  entityId?: string;
  anonymous?: boolean;
  description?: string;
  appearance?: string;
  effectKind?: MotionRemotionEffect["kind"] | "highlight" | "wind" | "water";
  sourceId?: string;
}
export interface MotionSceneAnimation {
  target: string;
  channel: "actor" | "effect" | "speech";
  attribute: "transform" | "d" | "opacity";
  period?: number;
  keyframes: { at: number; value: string | number }[];
  source?: "sway";
}
export type MotionMeasuredRect = MotionVisualRect & { local?: MotionVisualRect; flip?: boolean };
export interface MotionSceneComposition {
  /** AI-directed motion clips; when present they replace actor/effect keyframes and code default motion. */
  motion?: import("./motionClip.js").MotionSceneMotion;
  profileId?: MotionRemotionProfile;
  profileRevision?: number;
  unchecked?: boolean;
  geometryRevision?: number;
  revision: number;
  assetKey: string;
  inputKey: string;
  layers: MotionSceneLayer[];
  animations: MotionSceneAnimation[];
  continuityNotes?: string;
  design?: MotionSceneDesign;
}
export interface MotionSceneDesign {
  format?: MotionSceneFormat;
  camera: string;
  cameraMotion?: { mode: "follow" | "push" | "pull" | "hold"; subjectId?: string; focus?: { x: number; y: number } };
  palette?: string[];
  floor?: { horizon: number; outline: { x: number; y: number }[] };
  placements: { id: string; box: { x: number; y: number; width: number; height: number }; depth: number; supportId?: string; contact?: { x: number; y: number }; construction: string }[];
  continuityNotes?: string;
}
export interface MotionRemotionState {
  version: number;
  settings: MotionVisualSettings;
  assets: Record<string, MotionVectorAsset>;
  sheet?: Record<string, MotionObjectSheetEntry>;
  sheetKey?: string;
  scenes: Record<string, MotionRemotionScene[]>;
  inputKeys: Record<string, string>;
  failures: Record<string, string>;
  drafts?: Record<string, unknown[]>;
  /** Per-subject motion notes written by the AI motion director, reused for consistency across scenes. */
  motionBible?: Record<string, string>;
  /** Scene id → motion request key already attempted, so rebuilds never re-ask the director for unchanged scenes. */
  motionTried?: Record<string, string>;
  planRecoveryRevision?: number;
  notes?: Record<string, string>;
  updatedAt?: number;
  profileRevision?: number;
  invalidAssets?: Record<string, { asset: MotionVectorAsset; reason: string }>;
  renderBehavior?: MotionRenderBehavior;
  layoutRevision?: number;
  locations?: Record<string, { environment: string; backgroundKey?: string }>;
  stagingRevision?: number;
  spaceBuildRevision?: number;
  compositionRevision?: number;
  pacingRevision?: number;
  groupingRevision?: number;
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
  fontFamily?: string;
  music?: MotionSpec["music"];
  renderBehavior?: MotionRenderBehavior;
  resolvedSettings?: { layoutRevision: number; effectRevision: number; sceneRevision?: number; behavior: MotionRenderBehavior };
}
export type MotionRenderSpec = MotionSpec | MotionRemotionSpec;
