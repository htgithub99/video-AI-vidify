import type { MotionSeoOption } from "../../../types/motionVideo.js";
export type ReupPresetId = "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H";
export type ReupPresetStage = "ready" | "beta" | "later";
export type ReupAspect = "16:9" | "9:16";
export type ReupVertical = "blur" | "crop";
export type ReupLanguage = "vi" | "en" | "ja" | "ko";
export type ReupQuality = "auto" | "draft" | "standard" | "high" | "ultra";
export type ReupHighlights = "off" | "few" | "normal";
export type ReupEncoder = "auto" | "gpu" | "cpu";
export type ReupValueBeat = "why" | "tip" | "compare" | "view";
export type ReupMusicZoneKind = "hook" | "gap" | "sting" | "ending" | "bed";
export type ReupNatural = "keep" | "low" | "off";
export type ReupTitleOverlay = "off" | "hook" | "fixed";
export type ReupLogo = "off" | "crop" | "blur";
export type ReupCorner = "tl" | "tr" | "bl" | "br";
export type ReupOutputKind = "long" | "short";
export type ReupSectionRole = "hook" | "body" | "teaser" | "ending";
export type ReupMediaType = "photo" | "clip";
export type ReupStepId = "source" | "scenes" | "script" | "voice" | "build" | "package";
export type ReupStepStatus = "idle" | "running" | "done" | "error" | "waiting";
export type ReupJobStatus = "running" | "waiting-script" | "done" | "error" | "cancelled";
export type ReupThumbLayout = "hero" | "split" | "circle";
export type ReupRights = "own" | "licensed";
export type ReupCommentaryVoice = "expert" | "storyteller" | "analyst" | "curious" | "wry" | "coach";
export type ReupCommentaryHook = "result" | "question" | "contrast" | "stakes" | "tease";
export type ReupCommentaryEnding = "question" | "lesson" | "reflection" | "next";
export type ReupCommentaryShape = "byStep" | "byProblem" | "bySkill" | "byChange";
export interface ReupStyle {
  voice: ReupCommentaryVoice;
  hook?: ReupCommentaryHook;
  ending: ReupCommentaryEnding;
  shape?: ReupCommentaryShape;
  track?: string;
}
export type ReupMusicChoice = "off" | "library";
export type ReupReportLevel = "ok" | "review" | "risk";
export type ReupReportCode = "narration" | "silence" | "padding" | "repeated" | "sourceReused" | "similar" | "titleReused" | "noAngle" | "licensed" | "shortsLicensed" | "bilingual" | "naturalOff" | "coverage" | "describes" | "extended" | "rewritten" | "overlap";
export type ReupScoreGap = "coverage" | "value" | "highlights" | "silence" | "shot" | "source" | "similar" | "angle";
export interface ReupReport {
  level: ReupReportLevel;
  narrated: number;
  silentMax: number;
  score: number;
  gaps: ReupScoreGap[];
  notes: { code: ReupReportCode; level: ReupReportLevel; value?: string }[];
}
export interface ReupAiChoice {
  provider: string;
  model: string;
  mode: string;
  chromeHeadless: boolean;
  allowFallback: boolean;
  multiRoom: boolean;
}
export interface ReupSettings {
  language: ReupLanguage;
  languageAlt: ReupLanguage;
  targetSeconds: number;
  shortsCount: number;
  aspect: ReupAspect;
  voiceChannel: string;
  voiceChannelAlt: string;
  music: ReupMusicChoice;
  natural: ReupNatural;
  subtitles: boolean;
  logo: ReupLogo;
  logoCorner: ReupCorner;
  stopScript: boolean;
  angle: string;
  sourceLink: string;
  brandName: string;
  hotline: string;
  cta: string;
  logoFile: string;
  quality: ReupQuality;
  encoder: ReupEncoder;
  highlights: ReupHighlights;
  fps: number;
  visionAi: ReupAiChoice;
  scriptAi: ReupAiChoice;
}
export interface ReupPresetRules {
  vertical: ReupVertical;
  brandColor: string;
  wordsPerSecond: [number, number];
  hook: boolean;
  teasers: boolean;
  pauseSeconds: number;
  lufs: number;
  titleOverlay: ReupTitleOverlay;
  markEvery: number;
  markMax: number;
  markSeconds: number;
  musicMode: "zones" | "bed" | "chapters" | "gaps";
  narratedMin: number;
  kenBurns: boolean;
  captions: boolean;
  beforeAfter: boolean;
  viewfinder: boolean;
  darkLevel: number;
  blurLevel: number;
  fillUnused: boolean;
  hookCutSeconds: number;
  sheetInterval: number;
  seoOptions: number;
  thumbnail: boolean;
  voices: ReupCommentaryVoice[];
  hooks: ReupCommentaryHook[];
  endings: ReupCommentaryEnding[];
  shapes: ReupCommentaryShape[];
  keepTalk: boolean;
}
export type ReupJobSettings = ReupSettings & ReupPresetRules;
export interface ReupMediaItem {
  id: string;
  path: string;
  name: string;
  type: ReupMediaType;
  start: number;
  end: number;
  width: number;
  height: number;
  hasAudio: boolean;
}
export interface ReupSource {
  path: string;
  kind: "video" | "folder";
  items?: ReupMediaItem[];
  proxy?: string;
  name: string;
  duration: number;
  width: number;
  height: number;
  fps: number;
  hasAudio: boolean;
  sizeBytes: number;
}
export interface ReupSheet {
  index: number;
  file: string;
  url: string;
  start: number;
  interval: number;
  count: number;
  cols: number;
  rows: number;
}
export interface ReupBadRange {
  start: number;
  end: number;
  reason: "dark" | "blur";
}
export interface ReupMoment {
  id: string;
  t: number;
  what: string;
  pull: number;
}
export interface ReupSegment {
  id: string;
  start: number;
  end: number;
  what: string;
  tags: string[];
  value: number;
  focusX?: number;
  caption?: string;
  moments?: ReupMoment[];
}
export interface ReupSceneMap {
  summary: string;
  segments: ReupSegment[];
  hook: string[];
  ending: string;
  thumbnails: number[];
}
export interface ReupShot {
  start: number;
  end: number;
}
export interface ReupCue {
  segment: string;
  moment?: string;
  text: string;
  textAlt?: string;
  value?: ReupValueBeat;
}
export interface ReupMark {
  cue: number;
  label: string;
  title: string;
  sub?: string;
}
export interface ReupSection {
  id: string;
  role: ReupSectionRole;
  text: string;
  shots: ReupShot[];
  cues?: ReupCue[];
  chapter?: string;
  callout?: string;
  mark?: ReupMark;
}
export interface ReupOutputScript {
  id: string;
  kind: ReupOutputKind;
  title: string[];
  sections: ReupSection[];
  lang?: ReupLanguage;
  speech?: boolean;
  cta?: string;
}
export interface ReupScriptRevision {
  words?: [number, number];
  rewritten?: number;
  valued?: number;
}
export interface ReupScript {
  outputs: ReupOutputScript[];
  revision?: ReupScriptRevision;
}
export interface ReupTrack {
  name: string;
  file: string;
  preset: ReupPresetId;
}
export interface ReupOutputResult {
  id: string;
  narrated?: number;
  voiced?: number;
  highlights?: number;
  longestShot?: number;
  sourceShare?: number;
  silentMax?: number;
  padding?: number;
  repeated?: boolean;
  talk?: number;
  spans?: [number, number][];
  chapters?: { t: number; title: string }[];
  file: string;
  url: string;
  duration: number;
  width: number;
  height: number;
}
export interface ReupFrame {
  time: number;
  url: string;
}
export interface ReupThumbIdea {
  layout: ReupThumbLayout;
  frames: number[];
  lines: string[];
}
export interface ReupPackage {
  options: MotionSeoOption[];
  thumbs: ReupThumbIdea[];
  frames: ReupFrame[];
  pinned: string;
  aiDisclosure: boolean;
}
export interface ReupStepState {
  status: ReupStepStatus;
  progress: number;
  message: string;
}
export interface ReupLog {
  at: number;
  text: string;
  level: "info" | "warn" | "error";
  step?: ReupStepId;
}
export interface ReupVoice {
  file: string;
  seconds: number;
  voice: string;
  cues?: number[];
  gaps?: number;
  subs?: ReupSubLine[];
}
export interface ReupSubLine {
  text: string;
  start: number;
  end: number;
}
export interface ReupWord {
  w: string;
  s: number;
  e: number;
}
export interface ReupTranscript {
  text: string;
  words: ReupWord[];
  phrases: { id: string; from: number; to: number; start: number; end: number; text: string }[];
}
export interface ReupJob {
  id: string;
  createdAt: number;
  updatedAt: number;
  preset: ReupPresetId;
  settings: ReupJobSettings;
  rights: ReupRights;
  fingerprint?: string;
  style?: ReupStyle;
  report?: ReupReport;
  source: ReupSource;
  status: ReupJobStatus;
  steps: Record<ReupStepId, ReupStepState>;
  logs: ReupLog[];
  sheets: ReupSheet[];
  bad: ReupBadRange[];
  sceneMap?: ReupSceneMap;
  script?: ReupScript;
  warnings: string[];
  voices?: Record<string, ReupVoice>;
  transcript?: ReupTranscript;
  credits?: number;
  outputs: ReupOutputResult[];
  package?: ReupPackage;
  packageDir?: string;
  error?: string;
}
