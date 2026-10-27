import type { MOTION_RESOURCE_SEMANTICS } from "../constants/motionResourceSemantics.js";
export type MotionLocationFamily = (typeof MOTION_RESOURCE_SEMANTICS.PLACES)[number][1];
export interface PuppetCatalog {
  libraryVersion?: number;
  semanticVersion?: number;
  locationFamily?: MotionLocationFamily;
  illustrationVersion?: number;
  aliasOf?: string;
  originalName?: string;
  originalDesc?: string;
  catalogVersion?: number;
  catalogStatus?: string;
  category?: string;
  objectType?: string;
  requirements?: string[];
}
export interface PuppetStyleBody {
  head: number;
  headW: number;
  bodyW: number;
  legs: number;
  overlap: number;
  limb: string;
  limbW: number;
  armLen: number;
  hand: number;
  shape: string;
  idleArms: string;
  limbOutline: boolean;
}
export interface PuppetStyleFace {
  fill: string;
  eyes: string;
  eyeW: number;
  eyeH: number;
  eyeGap: number;
  eyeY: number;
  eyeColor: string;
  mouth: string;
  mouthW: number;
  mouthH: number;
  mouthY: number;
  brows: boolean;
  mouthRest: string;
  nose?: boolean;
}
export interface PuppetStylePack {
  illustrationVersion?: number;
  id: string;
  type: "style_pack";
  name: string;
  source: "preset" | "reference" | "design";
  preset?: string;
  fingerprint?: string;
  designKey?: string;
  description: string;
  body: PuppetStyleBody;
  face: PuppetStyleFace;
  line: { width: number; color: string };
  vignette: number;
  palette: string[];
  sets: string;
  characters: string;
  framing: string;
  detail: string;
  gradients: boolean;
  procedural?: boolean;
  bodyColors?: string[];
  refs?: string[];
  refKinds?: Record<string, string[]>;
  refsKey?: string;
  updatedAt: string;
}
export interface PuppetViews {
  front?: string;
  side?: string;
  back?: string;
}
export interface PuppetSprite {
  svg: string;
  w: number;
  h: number;
  anchor: number[];
  rig?: { headW: number; headH: number; headCy: number; bodyH: number; bodyW: number };
  bodyOnly?: boolean;
}
export interface PuppetCharacter extends PuppetCatalog {
  humanGhostVersion?: number;
  id: string;
  type: "character_kit";
  styleId: string;
  archetype?: string;
  group?: string;
  gender?: string;
  age?: string;
  name: string;
  role?: string;
  desc: string;
  tags: string[];
  story?: string;
  height: number;
  colors: { body?: string; sleeve?: string; skin?: string; hair?: string; face?: string };
  head: PuppetViews;
  body: PuppetViews;
  sprites: Record<string, PuppetSprite>;
  uses: number;
  updatedAt: string;
}
export interface PuppetLight {
  x: number;
  y: number;
  color: string;
  kind: string;
}
export interface PuppetSpot {
  scale?: number;
  areas?: string[];
  key: string;
  kind: string;
  x: number;
  y: number;
  seatY?: number;
  groundY?: number;
  fixture?: string;
  relation?: string;
  bounds?: [number, number, number, number];
  face?: string;
  label: string;
}
export interface PuppetBlocking {
  variant?: string;
  kind: string;
  roles: Record<string, string>;
}
export interface PuppetComposition extends PuppetBlocking {
  contacts?: PuppetContact[];
  key: string;
}
export interface PuppetContact {
  actor: string;
  target: string;
  point: string;
  targetPoint: string;
  mode: string;
}
export interface PuppetSet extends PuppetCatalog {
  framingBounds?: [number, number, number, number][];
  features?: string[];
  recipe?: { version: number; decompositionVersion?: number; baseId: string; pieces: { token: string; assetId: string }[] };
  fixtures?: PuppetFixture[];
  fixtureStates?: Record<string, string>;
  compositions?: PuppetComposition[];
  id: string;
  type: "set" | "establishing";
  styleId: string;
  group?: string;
  name: string;
  desc: string;
  tags: string[];
  interior: boolean;
  time: string;
  svg: string;
  floorY: number;
  horizonY?: number;
  spots?: PuppetSpot[];
  plan?: PuppetSetPlan;
  lights: PuppetLight[];
  variants?: Record<string, string>;
  placementVersion?: number;
  replaces?: string[];
  sceneCondition?: string;
  uses: number;
  updatedAt: string;
}
export interface PuppetFixture {
  key: string;
  layer: string;
  states: Record<string, string>;
}
export interface PuppetProp extends PuppetCatalog {
  surface?: { bounds: [number, number, number, number]; maxRatio: number };
  grip?: [number, number];
  attachment?: string;
  emitter?: [number, number];
  id: string;
  type: "prop";
  styleId: string;
  key: string;
  name: string;
  desc: string;
  tags: string[];
  svg: string;
  base: number[];
  height: number;
  size?: number;
  mount?: string;
  uses: number;
  updatedAt: string;
}
export interface PuppetSeries {
  id: string;
  type: "series";
  styleId: string;
  name: string;
  characters: Record<string, string>;
  sets: Record<string, string>;
  props: Record<string, string>;
  updatedAt: string;
}
export interface PuppetPieceLight {
  x: number;
  y: number;
  kind: string;
}
export interface PuppetPiece extends PuppetCatalog {
  stateKey?: string;
  states?: Record<string, { svg: string; night?: string }>;
  placementSurface?: "water";
  recipeSvg?: string;
  recipeOnly?: boolean;
  compositions?: PuppetComposition[];
  id: string;
  type: "set_piece";
  styleId: string;
  key: string;
  name: string;
  desc: string;
  kind: string;
  environment?: string;
  allowedEnvironments?: ("interior" | "exterior")[];
  slots: string[];
  svg: string;
  night?: string;
  box: number[];
  anchor: number[];
  native?: { hz: number; fy: number };
  size?: number;
  front?: boolean;
  spots: PuppetSpot[];
  lights: PuppetPieceLight[];
  tags: string[];
  source: string;
  uses: number;
  updatedAt: string;
}
export interface PuppetBase extends PuppetCatalog {
  regions?: Record<string, { bounds: [number, number, number, number] }>;
  adaptableLocationFamilies?: MotionLocationFamily[];
  recipeTemplate?: string;
  recipeOnly?: boolean;
  decomposition?: string;
  id: string;
  type: "set_base";
  styleId: string;
  key: string;
  family: string;
  desc: string;
  svg: string;
  night?: string;
  horizonY: number;
  floorY: number;
  interior: boolean;
  tags: string[];
  uses: number;
  updatedAt: string;
}
export interface PuppetSetPlan {
  version?: number;
  baseId?: string;
  base: string;
  pieces: { slot: string; piece: string; assetId?: string }[];
  mirror: boolean;
}
export type PuppetAsset = PuppetStylePack | PuppetCharacter | PuppetSet | PuppetProp | PuppetSeries | PuppetPiece | PuppetBase;
export interface PuppetAppearance {
  evidence: string;
  face?: "white" | "gray" | "black" | "red" | "blue" | "green";
  clothes?: PuppetAppearance["face"];
  hair?: PuppetAppearance["face"];
  body?: PuppetAppearance["face"];
  form?: "human" | "revealed";
}
export interface PuppetActorState {
  appearance?: PuppetAppearance;
  essential?: boolean;
  eyes?: { state: "open" | "closed"; evidence: string };
  placement?: { relation: "at" | "beside" | "behind" | "between"; anchor?: string; targets?: string[]; evidence: string };
  transition?: boolean;
  char: string;
  action: string;
  posture?: string;
  gesture?: string;
  support?: string;
  target?: string;
}
export interface PuppetFrameItem {
  propDepthY?: number;
  propParent?: string;
  propSupport?: string;
  prop: string;
  propAt?: string | null;
  propMount?: string;
  propX?: number;
  propY?: number;
  propH?: number;
  propRot?: number;
}
export interface PuppetFrameActor {
  appearance?: PuppetAppearance;
  look?: string;
  char: string;
  pose: string;
  gesture?: string;
  expr: string;
  face: string;
  x?: number;
  y?: number;
  k?: number;
  spot?: string;
  support?: string;
  target?: string;
  hold?: string;
  wear?: string[];
  removeWear?: string[];
  depth?: string;
  sil?: boolean;
  trail?: boolean;
}
export interface PuppetFrame {
  propDepthY?: number;
  propParent?: string;
  choiceId?: string;
  layoutLocked?: boolean;
  contacts?: PuppetContact[];
  propSupport?: string;
  effectTarget?: string;
  effectMode?: string;
  blocking?: PuppetBlocking;
  effectSource?: string;
  shot: string;
  set?: string;
  light?: string | null;
  actors: PuppetFrameActor[];
  items?: PuppetFrameItem[];
  prop?: string | null;
  propMount?: string;
  propX?: number;
  propY?: number;
  propH?: number;
  propRot?: number;
  propAt?: string | null;
  form?: string;
  anchor?: string;
  smokeX?: number;
  smokeY?: number;
  inset?: string;
  set2?: string;
  light2?: string;
  overlays?: string[];
  camera?: { move: string };
  speaker?: string | null;
  shot2?: PuppetFrame | null;
  why?: string;
}
export interface PuppetPlace {
  locationFamily?: MotionLocationFamily;
  fixtureStates?: Record<string, string>;
  visualBase?: string;
  key: string;
  name: string;
  desc: string;
  interior: boolean;
  time: string;
  sceneFeatures?: string[];
  sceneCondition?: string;
  basePlace?: string;
}
export interface PuppetObject {
  essential?: boolean;
  ownershipEvidence?: string;
  placement?: { anchor: string; evidence: string };
  catalogKey?: string;
  support?: string;
  attachment?: string;
  transition?: boolean;
  baseOwner?: string;
  baseMount?: string;
  physicalState?: string;
  baseDescription?: string;
  baseRequirements?: string[];
  identity?: string;
  state?: string;
  word: string;
  key: string;
  size: number;
  mount: string;
  rotation?: number;
  type: string;
  note: string;
  owner?: string;
  category?: string;
  description?: string;
  requirements?: string[];
}
export interface PuppetRead {
  sceneConditionDeclared?: string | null;
  fixtureStates?: Record<string, string>;
  visual?: PuppetVisualContract;
  effectTarget?: string;
  effectMode?: string;
  blocking?: PuppetBlocking;
  effectSource?: string;
  focus: string;
  who: string[];
  place?: string;
  sceneCondition?: string;
  object?: PuppetObject | null;
  objects?: PuppetObject[];
  states?: PuppetActorState[];
  action: string;
  emotion: string;
  light?: string | null;
  overlays: string[];
}
export interface PuppetGen {
  readNormalizationVersion?: number;
  readDrafts?: Record<string, PuppetReadDraft>;
  selectionVersion?: number;
  sceneSelections?: Record<string, PuppetSceneSelection>;
  illustrationVersion?: number;
  pack?: PuppetPackSnapshot;
  storyboard?: PuppetStoryboard;
  narratorKey?: string;
  visualInputKey?: string;
  visualContractVersion?: number;
  visualIssues?: Record<string, string>;
  blockingVersion?: number;
  effectsVersion?: number;
  version: number;
  styleId: string;
  characters: Record<string, string>;
  sets: Record<string, string>;
  placementKeys?: Record<string, string>;
  props: Record<string, string>;
  places: Record<string, PuppetPlace>;
  frames: Record<string, PuppetFrame>;
  reads?: Record<string, PuppetRead>;
  seriesId?: string;
  ghosts?: string[];
  sheet?: { t: number; text: string; file: string; lines?: string[] }[];
  report?: { frames: number; characters: number; sets: number; props: number; missing: number };
}
export interface PuppetAssetPreview {
  type: "location" | "beat" | "character" | "prop";
  id: string;
  title: string;
  imageUrl: string;
  description?: string;
  narration?: string;
  beats?: string[];
  extension?: string;
}
export interface PuppetReadDraft {
  rows: { i: number; [key: string]: any }[];
  state: import("./motionAiContract.js").MotionAiContractState;
}
export interface PuppetSceneSelection {
  version: number;
  choiceId: string;
  candidateIds: string[];
  source: "ai" | "deterministic";
  inputKey: string;
  frameKey: string;
  bindings: { styleId: string; setId: string; characters: Record<string, string>; props: Record<string, string> };
  evidence: { line: string; text: string };
  preview?: string;
}
export interface PuppetPackSnapshot {
  version: number;
  policy: string;
  styleId: string;
  fingerprint: string;
  assets: Record<string, PuppetAsset>;
  assemblies: Record<string, string[]>;
}
export interface PuppetVisualSource {
  line: string;
  from: number;
  to: number;
}
export interface PuppetVisualUnit {
  read?: Record<string, any>;
  key: string;
  scene: string;
  purpose: string;
  show: string;
  sources: PuppetVisualSource[];
}
export interface PuppetStoryboard {
  groups?: { key: string; lines: string[]; offset: number }[];
  repairStates?: Record<string, { rejected: number; errors: string[] }>;
  profileKey?: string;
  drafts?: Record<string, { id: string; value: Record<string, any> }[]>;
  version: number;
  inputKey: string;
  units: PuppetVisualUnit[];
}
export interface PuppetVisualContract {
  scene: string;
  timeline: string;
  evidence: string[];
  fixtures: { key: string; state: string }[];
}
export interface PuppetKitSpec {
  renderBehavior?: import("./motionVisual.js").MotionRenderBehavior;
  style: Pick<PuppetStylePack, "body" | "face" | "line" | "vignette"> & { atmosphere?: typeof import("../constants/motionAppearance.js").MOTION_APPEARANCE.PROFILE };
  characters: Record<string, Pick<PuppetCharacter, "height" | "colors" | "head" | "body" | "sprites"> & { ghost?: boolean; looks?: Record<string, Pick<PuppetCharacter, "height" | "colors" | "head" | "body" | "sprites">> }>;
  sets: Record<string, Pick<PuppetSet, "svg" | "floorY" | "lights" | "time" | "variants" | "framingBounds"> & { wallY?: number }>;
  props: Record<string, Pick<PuppetProp, "svg" | "base" | "size" | "emitter" | "grip" | "attachment"> & { restRotation?: number; bodyCover?: boolean }>;
  motion: boolean;
}
