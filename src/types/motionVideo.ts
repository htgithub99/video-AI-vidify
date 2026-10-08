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
  RESULTS = "results",
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
export interface MotionGenSpec {
  style?: MotionGenStyle;
  cast?: Record<string, unknown>;
  locations?: Record<string, unknown>;
}
export interface MotionSpec {
  title?: string;
  aspect?: MotionAspect | string;
  fps?: number;
  look?: string;
  accent?: string;
  letterbox?: boolean;
  subtitleStyle?: string;
  gen?: MotionGenSpec;
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
  mannequin?: boolean;
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
  look?: string;
  gender?: "male" | "female";
}
export interface MotionPlace {
  key: string;
  name: string;
  description: string;
  interior?: boolean;
  time?: string;
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
export interface MotionStoryAnalysis {
  title: string;
  logline: string;
  look: string;
  accent?: string;
  era?: string;
  chapters: MotionChapter[];
  cast: MotionCastMember[];
  places: MotionPlace[];
  facts: MotionFact[];
}
export interface MotionBeat {
  id: string;
  chapterId: string;
  narration: string;
  visual: string;
  place?: string;
  time?: string;
  weather?: string;
  shot?: string;
  cast?: string[];
  action?: string;
  label?: string;
  emphasis?: boolean;
  data?: Record<string, unknown>;
  duration?: number;
  audioFile?: string;
}
export interface MotionGenStyle {
  grade?: string;
  skin?: string;
  gloss?: number;
  palette?: string[];
  notes?: string;
}
export interface MotionGenPreview {
  file?: string;
  issues?: string[];
  score?: number;
  note?: string;
  at?: string;
}
export interface MotionGenState {
  style: MotionGenStyle;
  cast: Record<string, unknown>;
  locations: Record<string, unknown>;
  locationInfo: Record<string, MotionGenPreview & { files?: string[] }>;
  staging: Record<string, unknown>;
  previews: Record<string, MotionGenPreview>;
  failed: string[];
  castPreview?: string;
  updatedAt?: string;
}
export interface MotionStoryScript {
  title: string;
  language: string;
  beats: MotionBeat[];
  gen?: MotionGenState;
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
  SCENES = "scenes",
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
