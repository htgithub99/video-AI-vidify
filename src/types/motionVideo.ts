export enum MotionQuality {
  DRAFT = "draft",
  STANDARD = "standard",
  HIGH = "high",
  ULTRA = "ultra",
}
export enum MotionAspect {
  LANDSCAPE = "16:9",
  PORTRAIT = "9:16",
  SQUARE = "1:1",
  FOUR_FIVE = "4:5",
}
export enum MotionEncoderPreference {
  AUTO = "auto",
  CPU = "cpu",
  GPU = "gpu",
}
export enum MotionJobStatus {
  QUEUED = "queued",
  PREPARING = "preparing",
  RENDERING = "rendering",
  ENCODING = "encoding",
  COMPLETED = "completed",
  ERROR = "error",
  CANCELLED = "cancelled",
}
export enum MotionWorkspaceTab {
  CREATE = "create",
  LIBRARY = "library",
  REAL = "real",
  DESIGNS = "designs",
  TOON = "toon",
  RESULTS = "results",
}
export enum MotionLibraryCategory {
  CHARACTER = "character",
  VEHICLE = "vehicle",
  NATURE = "nature",
  URBAN = "urban",
  INTERIOR = "interior",
  PROP = "prop",
  ENVIRONMENT = "environment",
  ACTION = "action",
}
export interface MotionCharacterDef {
  id: string;
  name: string;
  tags?: string[];
  builtin?: boolean;
  gender?: "male" | "female";
  age?: "child" | "teen" | "adult" | "elderly";
  build?: "slim" | "normal" | "heavy" | "athletic";
  height?: number;
  hair?: string;
  headwear?: string;
  outfit?: string;
  facial?: string;
  accessories?: string[];
  colors?: Record<string, string>;
  realModel?: string;
  createdAt?: string;
  updatedAt?: string;
}
export interface MotionCatalogItem {
  id: string;
  name: string;
  category?: string;
  tags?: string[];
  params?: Record<string, string>;
  description?: string;
}
export interface MotionCatalog {
  version: string;
  aspects: string[];
  looks: { id: string; name: string }[];
  quality: string[];
  transitions: string[];
  templates: MotionCatalogItem[];
  environments: MotionCatalogItem[];
  assets: MotionCatalogItem[];
  characters: MotionCharacterDef[];
  actions: { id: string; name: string; loop: boolean }[];
}
export interface MotionShot {
  id?: string;
  start: number;
  end: number;
  template: string;
  params?: Record<string, unknown>;
  transition?: { type: string; duration?: number; direction?: string };
  overlays?: Record<string, unknown>[];
}
export type MotionRenderMode = "2d" | "3d" | "real" | "toon";
export type MotionToonStyle = "line" | "flat";
export type MotionRealKind = "model" | "character" | "animation" | "hdri" | "texture";
export interface MotionRealAsset {
  id: string;
  name: string;
  kind: MotionRealKind;
  source: "polyhaven" | "import";
  sourceId?: string;
  license: string;
  author?: string;
  file?: string;
  maps?: { diff?: string; nor?: string; arm?: string };
  thumb?: string;
  bytes: number;
  bind: string[];
  newId?: string;
  base?: string;
  category?: string;
  size?: number;
  yaw?: number;
  clips?: string[];
  actionMap?: Record<string, string>;
  tags?: string[];
  createdAt: string;
}
export interface MotionRealEnvOverride {
  hdri?: string;
  sky?: string;
  ground?: string;
  road?: string | null;
  grass?: number;
  set?: boolean;
  cards?: "none" | "far" | "all";
}
export interface MotionRealManifest {
  version: number;
  items: MotionRealAsset[];
  envs: Record<string, MotionRealEnvOverride>;
}
export interface MotionPolyHavenAsset {
  id: string;
  name: string;
  type: "hdris" | "textures" | "models";
  categories: string[];
  tags: string[];
  thumb: string;
  downloads: number;
  authors: string[];
  installed: boolean;
}
export interface MotionRealJob {
  id: string;
  status: "running" | "completed" | "error" | "cancelled";
  label: string;
  done: number;
  total: number;
  bytes: number;
  error?: string;
  log: string[];
}
export interface MotionSpec {
  title?: string;
  renderMode?: MotionRenderMode;
  toonStyle?: MotionToonStyle;
  aspect?: MotionAspect | string;
  fps?: number;
  look?: string;
  accent?: string;
  letterbox?: boolean;
  subtitleStyle?: string;
  cast?: Record<string, { characterId?: string; overrides?: Partial<MotionCharacterDef> }>;
  shots: MotionShot[];
  subtitles?: { start: number; end: number; text: string }[];
  duration?: number;
  audio?: { id?: string; volume?: number };
}
export interface MotionRenderOptions {
  quality: MotionQuality;
  aspect: MotionAspect | string;
  fps?: number;
  encoder: MotionEncoderPreference;
  title?: string;
  audioId?: string;
  audioVolume?: number;
  sfxId?: string;
  sfxVolume?: number;
  sfx?: { cues: { t: number; kind: string }[]; mood?: string };
  renderMode?: MotionRenderMode;
  toonStyle?: MotionToonStyle;
}
export interface MotionJobState {
  id: string;
  status: MotionJobStatus;
  progress: number;
  stage?: string;
  framesDone: number;
  framesTotal: number;
  fpsRender?: number;
  etaSeconds?: number;
  workers?: number;
  encoder?: string;
  browser?: string;
  error?: string;
  result?: MotionResultItem;
  startedAt: number;
  log: string[];
}
export interface MotionResultItem {
  id: string;
  title: string;
  fileName: string;
  videoUrl: string;
  aspect: string;
  quality: string;
  width: number;
  height: number;
  fps: number;
  durationSeconds: number;
  sizeBytes: number;
  renderSeconds: number;
  encoder: string;
  createdAt: string;
}
export interface MotionAudioItem {
  id: string;
  name: string;
  durationSeconds: number;
  sizeBytes: number;
}
export interface MotionEnvironmentInfo {
  browser: string | null;
  encoders: string[];
  cpus: number;
  freeMemoryMb: number;
  recommendedWorkers: number;
  webgl?: string | null;
  gpu3d?: boolean;
}
export interface MotionStorySegment {
  t: number;
  text: string;
}
export interface MotionStorySource {
  title: string;
  url?: string;
  text: string;
  segments: MotionStorySegment[];
  words: number;
  sourceSeconds: number;
}
export interface MotionCastMember {
  key: string;
  name: string;
  role?: string;
  description?: string;
  characterId: string;
  overrides?: Partial<MotionCharacterDef>;
  suggested?: Partial<MotionCharacterDef>;
}
export interface MotionChapter {
  id: string;
  title: string;
  summary: string;
  from?: number;
  to?: number;
  targetSeconds?: number;
}
export interface MotionFact {
  claim: string;
  status: "ok" | "uncertain" | "wrong";
  note?: string;
}
export interface MotionDesignRequest {
  kind: "asset" | "env";
  id: string;
  name: string;
  brief: string;
  size?: number[];
  use?: string;
}
export interface MotionStoryAnalysis {
  title: string;
  logline: string;
  look: string;
  accent?: string;
  chapters: MotionChapter[];
  cast: MotionCastMember[];
  places: string[];
  facts: MotionFact[];
  design?: MotionDesignRequest[];
  designed?: string[];
}
export interface MotionBeatActor {
  cast: string;
  action?: string;
  then?: string;
  move?: "stay" | "left_to_right" | "right_to_left" | "enter_left" | "enter_right" | "exit_left" | "exit_right" | "toward_center";
  pos?: number;
  lane?: "back" | "mid" | "front" | "fore";
  facing?: "left" | "right";
  hold?: string;
  holdFrom?: number;
  holdUntil?: number;
}
export type MotionParamAnim = Record<string, [number, unknown][]>;
export interface MotionBeatProp {
  asset: string;
  move?: "stay" | "left_to_right" | "right_to_left";
  pos?: number;
  lane?: "back" | "mid" | "front" | "fore";
  scale?: number;
  params?: Record<string, unknown>;
  riders?: string[];
  facing?: "left" | "right";
  anim?: MotionParamAnim;
}
export interface MotionBeatCrowd {
  cast?: string;
  character?: string;
  count: number;
  formation?: "block" | "blocks" | "line" | "column" | "scatter";
  action?: string;
  move?: "stay" | "left_to_right" | "right_to_left" | "advance" | "retreat";
  pos?: number;
  lane?: "back" | "mid" | "front";
  facing?: "left" | "right";
  banners?: boolean;
  bannerColor?: string;
}
export interface MotionBeat {
  id: string;
  chapterId: string;
  narration: string;
  visual: string;
  env?: string;
  time?: string;
  weather?: string;
  shot?: string;
  actors?: MotionBeatActor[];
  props?: MotionBeatProp[];
  crowds?: MotionBeatCrowd[];
  label?: string;
  emphasis?: boolean;
  data?: Record<string, unknown>;
  sceneParams?: Record<string, unknown>;
  sceneAnim?: MotionParamAnim;
  focus?: string;
  shots?: MotionBeatShot[];
  art?: MotionArt;
  duration?: number;
  audioFile?: string;
}
export interface MotionArt {
  prompt: string;
  cast?: string[];
  move?: string;
  focus?: number[];
  fx?: string;
  image?: string;
  failed?: string;
  note?: string;
}
export interface MotionArtCast {
  key: string;
  appearance: string;
  image?: string;
}
export interface MotionArtDirection {
  style: string;
  cast: MotionArtCast[];
  key: string;
}
export interface MotionImageOptions {
  mode?: string;
  engine?: string;
  headless?: boolean;
  review?: boolean;
}
export type MotionBeatShot = Omit<MotionBeat, "id" | "chapterId" | "narration" | "shots" | "duration" | "audioFile" | "emphasis"> & { text: string };
export interface MotionStoryScript {
  title: string;
  language: string;
  beats: MotionBeat[];
  art?: MotionArtDirection;
}
export interface MotionVoiceTrack {
  audioId: string;
  voiceId: string;
  durations: number[];
  totalSeconds: number;
}
export enum MotionStoryLength {
  FULL = "full",
  TEN = "10min",
  FIVE = "5min",
  SHORT = "short",
  ONE = "1min",
}
export enum MotionStoryJobKind {
  ANALYZE = "analyze",
  SCRIPT = "script",
  VOICE = "voice",
  ART = "art",
  DESIGN = "design",
}
export interface MotionAiExecution {
  provider?: string;
  model?: string;
  mode?: string;
  chromeHeadless?: boolean;
}
export interface MotionStoryJobState {
  id: string;
  kind: MotionStoryJobKind;
  status: MotionJobStatus;
  progress: number;
  stage?: string;
  log: string[];
  error?: string;
  result?: unknown;
  startedAt: number;
}
