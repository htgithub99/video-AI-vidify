export interface PuppetCatalog {
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
}
export interface PuppetStylePack {
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
}
export interface PuppetCharacter extends PuppetCatalog {
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
  key: string;
  kind: string;
  x: number;
  y: number;
  seatY?: number;
  groundY?: number;
  face?: string;
  label: string;
}
export interface PuppetSet extends PuppetCatalog {
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
  uses: number;
  updatedAt: string;
}
export interface PuppetProp extends PuppetCatalog {
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
  id: string;
  type: "set_piece";
  styleId: string;
  key: string;
  name: string;
  desc: string;
  kind: string;
  environment?: string;
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
  base: string;
  pieces: { slot: string; piece: string }[];
  mirror: boolean;
}
export type PuppetAsset = PuppetStylePack | PuppetCharacter | PuppetSet | PuppetProp | PuppetSeries | PuppetPiece | PuppetBase;
export interface PuppetActorState {
  char: string;
  action: string;
  posture?: string;
  gesture?: string;
  support?: string;
  target?: string;
}
export interface PuppetFrameItem {
  prop: string;
  propAt?: string | null;
  propMount?: string;
  propX?: number;
  propY?: number;
  propH?: number;
  propRot?: number;
}
export interface PuppetFrameActor {
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
  key: string;
  name: string;
  desc: string;
  interior: boolean;
  time: string;
  sceneFeatures?: string[];
}
export interface PuppetObject {
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
  focus: string;
  who: string[];
  place?: string;
  object?: PuppetObject | null;
  objects?: PuppetObject[];
  states?: PuppetActorState[];
  action: string;
  emotion: string;
  light?: string | null;
  overlays: string[];
}
export interface PuppetGen {
  version: number;
  styleId: string;
  characters: Record<string, string>;
  sets: Record<string, string>;
  props: Record<string, string>;
  places: Record<string, PuppetPlace>;
  frames: Record<string, PuppetFrame>;
  reads?: Record<string, PuppetRead>;
  seriesId?: string;
  ghosts?: string[];
  sheet?: { t: number; text: string; file: string }[];
  report?: { frames: number; characters: number; sets: number; props: number; missing: number };
}
export interface PuppetKitSpec {
  style: Pick<PuppetStylePack, "body" | "face" | "line" | "vignette">;
  characters: Record<string, Pick<PuppetCharacter, "height" | "colors" | "head" | "body" | "sprites"> & { ghost?: boolean }>;
  sets: Record<string, Pick<PuppetSet, "svg" | "floorY" | "lights" | "time" | "variants"> & { wallY?: number }>;
  props: Record<string, Pick<PuppetProp, "svg" | "base" | "size">>;
  motion: boolean;
}
