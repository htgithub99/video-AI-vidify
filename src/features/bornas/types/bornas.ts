import type { ReupAiChoice } from "../../reup/types/reup.js";
export type BornasTopic = "world" | "ww" | "ancient" | "medieval" | "eastasia" | "vietnam" | "modern" | "game" | "wildwest";
export type BornasLanguage = "vi" | "en";
export type BornasStepId = "sample" | "script" | "voice" | "assets" | "shots" | "build" | "render";
export type BornasStepStatus = "idle" | "running" | "done" | "waiting" | "error";
export type BornasJobStatus = "running" | "waiting" | "done" | "error" | "cancelled";
export type BornasVideoStatus = "idle" | "running" | "waiting" | "done" | "error";
export interface BornasChannel {
  id: string;
  name: string;
  topic: BornasTopic;
  voiceChannel: string;
  language: BornasLanguage;
  count: number;
  seconds: number;
  review: boolean;
}
export interface BornasAiSettings {
  mainAi: ReupAiChoice;
  visionAi: ReupAiChoice;
  lightAi: ReupAiChoice;
  drawHeadless: boolean;
}
export interface BornasStepState {
  status: BornasStepStatus;
  progress: number;
  message: string;
}
export interface BornasLog {
  at: number;
  text: string;
  level: "info" | "warn" | "error";
  step?: BornasStepId;
  video?: number;
}
export interface BornasSample {
  path: string;
  name: string;
  duration: number;
  width: number;
  height: number;
  key: string;
}
export interface BornasAnalysis {
  key: string;
  transcript: string;
  wordsPerMinute: number;
  shotMedian: number;
  shotCount: number;
  sentenceSeconds: number;
  formula: string;
  narration: string;
  shots: string;
  texts: string;
  art: string;
}
export interface BornasLine {
  text: string;
  screen: string;
  sub: string;
  kind: "tag" | "plate" | "label" | "none";
  idea: string;
  pause: boolean;
}
export interface BornasScript {
  title: string;
  hook: string;
  hero: string;
  series: string;
  lines: BornasLine[];
}
export interface BornasCastPose {
  name: string;
  desc: string;
}
export interface BornasCast {
  id: string;
  desc: string;
  heightM: number;
  poses: BornasCastPose[];
}
export interface BornasAssetPlan {
  cast: BornasCast[];
  items: string[];
  backgrounds: string[];
  newItems: { name: string; desc: string; kind: string; heightM: number }[];
  newBackgrounds: { name: string; desc: string }[];
}
export interface BornasFace {
  l: number;
  r: number;
  t: number;
  b: number;
}
export interface BornasSpriteAnn {
  v: number;
  foot: number;
  pad: number;
  aspect: number;
  face?: BornasFace;
  mouth?: [number, number];
  place: "ground" | "wall" | "table" | "hand" | "icon";
  facing: "l" | "r";
  text: boolean;
  double: boolean;
  cut: boolean;
}
export interface BornasSeat {
  k: string;
  x0: number;
  x1: number;
  y: number;
}
export interface BornasBgAnn {
  v: number;
  ground: [number, number, number];
  person: [number, number, number];
  spots: [number, number, number][];
  walls: [number, number, number][];
  table: [number, number, number] | null;
  water: number | null;
  free: [number, number, number, number][];
  seats?: BornasSeat[];
}
export interface BornasSprite {
  name: string;
  kind: string;
  heightM: number;
  facing: "l" | "r";
  aspect: number;
  desc: string;
  ann?: BornasSpriteAnn;
}
export interface BornasBackground {
  name: string;
  ground: number;
  desc: string;
  ann?: BornasBgAnn;
}
export interface BornasVideo {
  index: number;
  title: string;
  status: BornasVideoStatus;
  stage?: BornasStepId;
  error?: string;
  seconds?: number;
  lineStarts?: number[];
  words?: [number, number][][];
  plan?: BornasAssetPlan;
  sprites?: BornasSprite[];
  backgrounds?: BornasBackground[];
  shotCount?: number;
  checkIssues?: number;
  sheetUrl?: string;
  outputUrl?: string;
  previewUrl?: string;
  outputFile?: string;
  jobDir?: string;
}
export interface BornasJob {
  id: string;
  createdAt: number;
  updatedAt: number;
  status: BornasJobStatus;
  error?: string;
  channel: BornasChannel;
  ai: BornasAiSettings;
  sample: BornasSample;
  analysis?: BornasAnalysis;
  scripts?: BornasScript[];
  videos: BornasVideo[];
  steps: Record<BornasStepId, BornasStepState>;
  logs: BornasLog[];
  warnings: string[];
}
export interface BornasJobSummary {
  id: string;
  channelId: string;
  channelName: string;
  status: BornasJobStatus;
  updatedAt: number;
  videos: Pick<BornasVideo, "index" | "title" | "status" | "seconds" | "outputUrl" | "previewUrl" | "sheetUrl">[];
}
