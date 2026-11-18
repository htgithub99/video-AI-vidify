import type { MotionSeoOption } from "../../../types/motionVideo.js";
export type ReupPresetId = "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H";
export type ReupPresetStage = "ready" | "beta" | "later";
export type ReupAspect = "16:9" | "9:16";
export type ReupVertical = "blur" | "crop";
export type ReupLanguage = "vi" | "en" | "ja" | "ko";
export type ReupQuality = "draft" | "standard" | "high" | "ultra";
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
/** Who owns the footage: the user, or someone who licensed it to them (a link or licence note is then required). */
export type ReupRights = "own" | "licensed";
export type ReupCommentaryVoice = "expert" | "storyteller" | "analyst" | "curious" | "wry" | "coach";
export type ReupCommentaryHook = "result" | "question" | "contrast" | "stakes" | "tease";
export type ReupCommentaryEnding = "question" | "lesson" | "reflection" | "next";
/** The commentary of one run: who narrates, how it opens and ends, and the music. Rotated across runs so videos do not share one template. */
export interface ReupStyle {
  voice: ReupCommentaryVoice;
  hook?: ReupCommentaryHook;
  ending: ReupCommentaryEnding;
  music?: string;
}
export type ReupReportLevel = "ok" | "review" | "risk";
export type ReupReportCode = "narration" | "silence" | "padding" | "repeated" | "sourceReused" | "similar" | "titleReused" | "noAngle" | "licensed" | "shortsLicensed" | "bilingual";
/** Upload check against YouTube's reused / inauthentic content rules: measured on the edited video and the run history. */
export interface ReupReport {
  level: ReupReportLevel;
  /** Share of the video carrying the channel's own narration (or the speaker's own words). */
  narrated: number;
  /** Longest stretch of footage with no words of ours (seconds). */
  silentMax: number;
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
/** Choices the screen shows. Everything else follows the video type (ReupPresetRules). */
export interface ReupSettings {
  language: ReupLanguage;
  /** Second narration language (bilingual test, type C). */
  languageAlt: ReupLanguage;
  targetSeconds: number;
  shortsCount: number;
  aspect: ReupAspect;
  /** Voice channels of the Voices tab (shared with Video Motion). */
  voiceChannel: string;
  voiceChannelAlt: string;
  /** Music mood of Video Motion's generated score: auto, a mood, or off. */
  musicMood: string;
  natural: ReupNatural;
  /** Burned-in subtitles: the narration line by line, or the speaker's words lighting up (real-talk clips). */
  subtitles: boolean;
  logo: ReupLogo;
  logoCorner: ReupCorner;
  stopScript: boolean;
  /** The channel's own knowledge or viewpoint, woven into every script (the human input that makes the video ours). */
  angle: string;
  /** Original source link, or licence note for licensed footage (credited in the description). */
  sourceLink: string;
  brandName: string;
  hotline: string;
  cta: string;
  logoFile: string;
  quality: ReupQuality;
  fps: number;
  visionAi: ReupAiChoice;
  scriptAi: ReupAiChoice;
}
/** Editing rules fixed by the video type (not shown on screen). */
export interface ReupPresetRules {
  /** How a landscape source fills a vertical frame. */
  vertical: ReupVertical;
  /** Accent of titles, callouts and karaoke words. */
  brandColor: string;
  /** Narration words per second of the target length (min, max): the narration fills the video instead of silent footage. */
  wordsPerSecond: [number, number];
  hook: boolean;
  teasers: boolean;
  pauseSeconds: number;
  lufs: number;
  titleOverlay: ReupTitleOverlay;
  chapters: boolean;
  kenBurns: boolean;
  captions: boolean;
  beforeAfter: boolean;
  viewfinder: boolean;
  darkLevel: number;
  blurLevel: number;
  fillUnused: boolean;
  hookCutSeconds: number;
  sheetInterval: number;
  /** SEO options the AI writes (title, description, hashtags, tags, score). */
  seoOptions: number;
  /** Draw a thumbnail for each option (long videos and TikTok covers; not Shorts). */
  thumbnail: boolean;
  /** Music moods "auto" rotates through, least recently used first. */
  musicMoods: string[];
  /** Commentary styles this type may use (all when empty). */
  voices: ReupCommentaryVoice[];
  hooks: ReupCommentaryHook[];
  endings: ReupCommentaryEnding[];
}
/** What the pipeline reads: the screen's choices plus the type's rules. */
export type ReupJobSettings = ReupSettings & ReupPresetRules;
export interface ReupMediaItem {
  id: string;
  path: string;
  name: string;
  type: ReupMediaType;
  /** Place on the folder's virtual timeline (photos last PHOTO_SECONDS, clips their own length). */
  start: number;
  end: number;
  width: number;
  height: number;
  hasAudio: boolean;
}
export interface ReupSource {
  path: string;
  /** A video file, or a folder of photos and short clips laid end to end on a virtual timeline. */
  kind: "video" | "folder";
  items?: ReupMediaItem[];
  /** Low-resolution video of the folder's timeline, used for contact sheets, quality and review frames. */
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
export interface ReupSegment {
  id: string;
  start: number;
  end: number;
  what: string;
  tags: string[];
  value: number;
  /** Horizontal place of the main subject, 0 (left) … 1 (right), for subject-aware vertical crops. */
  focusX?: number;
  /** Short factual caption (photo reports). */
  caption?: string;
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
  /** Scene the cue's words are spoken over. */
  segment: string;
  text: string;
}
export interface ReupSection {
  id: string;
  role: ReupSectionRole;
  text: string;
  shots: ReupShot[];
  /** Photo reports: the narration split by the picture it plays over (timed by the voice's own words). */
  cues?: ReupCue[];
  /** Photo reports: a chapter card shown before this section. */
  chapter?: string;
  /** Real-talk clips: a short boxed line shown as this phrase starts. */
  callout?: string;
}
export interface ReupOutputScript {
  id: string;
  kind: ReupOutputKind;
  title: string[];
  sections: ReupSection[];
  /** Narration language of this output (bilingual tests have one output per language). */
  lang?: ReupLanguage;
  /** Real-talk clips: kept speech pieces cut by words; the source's own voice is the narration. */
  speech?: boolean;
  cta?: string;
}
export interface ReupScript {
  outputs: ReupOutputScript[];
}
export interface ReupOutputResult {
  id: string;
  /** Seconds carrying our narration (or the speaker's own words), longest silent stretch, silent filler added, footage repeated. */
  narrated?: number;
  silentMax?: number;
  padding?: number;
  repeated?: boolean;
  /** Where each chapter starts on this output (photo reports), for YouTube chapter lines. */
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
/** Upload package in Video Motion's SEO shape: a few options, each with its own thumbnail drawn from real frames. */
export interface ReupPackage {
  options: MotionSeoOption[];
  /** One thumbnail idea per option (none for Shorts). */
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
  /** Photo reports: where each cue starts inside this voice (seconds). */
  cues?: number[];
  /** Subtitle lines of this narration, timed inside the voice by its own spoken words. */
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
  /** Phrases (ids p1…) the script picks from: a few seconds each, cut at pauses and sentence ends. */
  phrases: { id: string; from: number; to: number; start: number; end: number; text: string }[];
}
export interface ReupJob {
  id: string;
  createdAt: number;
  updatedAt: number;
  preset: ReupPresetId;
  settings: ReupJobSettings;
  rights: ReupRights;
  /** Fingerprint of the source file (or folder) to spot footage reused across runs. */
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
  /** Words of the source's own speech (real-talk clips), from the local speech recogniser. */
  transcript?: ReupTranscript;
  /** ai33 usage estimate (characters sent ≈ credits). */
  credits?: number;
  outputs: ReupOutputResult[];
  package?: ReupPackage;
  packageDir?: string;
  error?: string;
}
