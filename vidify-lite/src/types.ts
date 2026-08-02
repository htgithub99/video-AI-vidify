import React from "react";

export enum WizardStep {
  SourceInput = 0,
  Storyboard = 1,
  AssetManager = 2,
  SEOBoost = 3,
  Export = 4,
  IndependentGenerator = 5,
}

export enum ProjectInputType {
  Script = "script",
  Idea = "idea",
}

export enum ProjectKind {
  Container = "container",
  Studio = "studio",
  Auto = "auto",
}

export enum ProjectLanguage {
  VI = "vi",
  EN = "en",
}

export enum HookPosition {
  Start = "start",
  Mid = "mid",
  All = "all",
}

export enum AudioType {
  TTS = "tts",
  Clone = "clone",
  Upload = "upload",
  Generated = "generated",
  Simulated = "simulated",
}

export enum Gender {
  Male = "male",
  Female = "female",
  Neutral = "neutral",
}

export enum AgeGroup {
  Child = "child",
  Teen = "teen",
  Adult = "adult",
  Senior = "senior",
}

export enum AssetsMode {
  UserOnly = "user_only",
  UserFirst = "user_first",
  Mixed = "mixed",
}

export enum ImageGeneratorEngine {
  Imagen = "imagen",
  Veo3 = "veo3",
  Veo3Lite = "veo3-lite",
  Veo3Fast = "veo3-fast",
  Veo3Quality = "veo3-quality",
  LabsSandbox = "labs-sandbox",
}

export enum ImageGenerationMode {
  LabsFlow = "labs-flow",
  GeminiChat = "gemini-chat",
}

export enum GenerateType {
  Image = "image",
  Video = "video",
  Mixed = "mixed",
}

export enum PromptInputMethod {
  Type = "type",
  Paste = "paste",
}

export enum AspectRatio {
  SixteenNine = "16:9",
  NineSixteen = "9:16",
  OneOne = "1:1",
  FourThree = "4:3",
  ThreeFour = "3:4",
}

export type AssetType = "image" | "video";

export type TooltipPosition = "top" | "bottom" | "left" | "right";

export type ButtonVariant = "primary" | "secondary" | "danger" | "ghost" | "outline" | "unstyled";

export interface ProjectInput {
  type: ProjectInputType;
  content: string;
}

export interface ProjectConfig {
  genre: string;
  language: ProjectLanguage;
  duration: string;
  targetDuration?: string;
  rewriteLevel: number;
  similarityReduction: number;
  creativityLevel: number;
  factCheck: boolean;
  audience: string;
  writingStyle: string;
  format?: string;
  splitStrategy?: string;
}

export interface HookVersion {
  id: string;
  content: string;
  type: string;
  selected: boolean;
}

export interface HookConfig {
  type: string;
  duration: number;
  count: number;
  positions: HookPosition;
  versions: HookVersion[];
}

export interface VoiceConfig {
  provider: string;
  audioType: AudioType;
  voiceName?: string;
  gender: Gender;
  age: AgeGroup;
  emotion: string;
  speed: number;
  pitch?: number;
  volume?: number;
  voiceURI?: string;
  previewUrl?: string;
  audioUrl?: string;
  audioBase64?: string;
  uploadedAudioName?: string;
  subtitleFiles?: string[];
  timingLog?: string;
}

export interface VisualConfig {
  source: string;
  style: string;
  quality: string;
  density: number;
  characterConsistency: boolean;
  assetsMode: AssetsMode;
  stylePreset?: string;
  styleBackgroundMode?: BackgroundMode;
  thumbnailBackgroundMode?: BackgroundMode;
  aspectRatio?: string;
  imageQuality?: string;
  characterConsistencyLevel?: string;
  contextConsistencyLevel?: string;
  negativePrompt?: string;
  imageGeneratorEngine?: ImageGeneratorEngine;
  thumbnailCount?: number;
  thumbnailReferenceImage?: string;
  thumbnailReferenceImages?: string[];
  thumbnailReferencePrompt?: string;
  styleReferenceImages?: string[];
  sceneReferenceImages?: string[];
  referenceImage?: string;
  referenceImages?: string[];
  referencePrompt?: string;
  generateType?: GenerateType;
  maxVideoScenes?: number;
  generateCount?: number;
  promptInputMethod?: PromptInputMethod;
  characterImages?: string[];
  characterPrompt?: string;
  characterAnalysis?: string;
  characterExtracted?: boolean;
  characters?: CharacterConfig[];
  chromeHeadless?: boolean;
  generationMode?: ImageGenerationMode;
  geminiChatSpeed?: GeminiChatSpeed;
  batchDelay?: BatchDelayOption;
  videoDuration?: string;
}

export interface CharacterConfig {
  id: string;
  name: string;
  description: string;
  images: string[];
  prompt?: string;
  extracted?: boolean;
}

export interface Chapter {
  id: string;
  title: string;
  scriptSegment: string;
}

export interface StoryboardScene {
  id: string;
  chapterId: string;
  startTime: string;
  endTime: string;
  duration: number;
  script: string;
  subtitle: string;
  prompt: string;
  assetName?: string;
  assetType?: AssetType;
  assetUrl?: string;
  assetUrls?: string[];
  audioUrl?: string;
  audioBase64?: string;
  cameraMotion: string;
  effects?: string;
  transition?: string;
}

export interface ThumbnailItem {
  id: string;
  prompt: string;
  style: string;
  hasText: boolean;
  textText?: string;
  layout?: string;
  typography?: string;
  colorSuggestion?: string;
  subjectFocus?: string;
  imageUrl?: string;
}

export interface SEOMetadata {
  text: string;
  searchScore: number;
  ctrScore: number;
  compScore: number;
  seoScore: number;
}

export interface SEOPackage {
  titles: SEOMetadata[];
  descriptions: SEOMetadata[];
  hashtags: string[];
  tags: string[];
}

export interface SavedAsset {
  id: string;
  name: string;
  type: string;
  url: string;
  sceneId?: string;
}

export interface ProjectVersion {
  id: string;
  timestamp: string;
  note: string;
  scriptPreview: string;
}

export interface SEOConfig {
  numTitles: number;
  numDescriptions: number;
  numHashtags: number;
  numTags: number;
}

export interface VideoProject {
  id: string;
  parentId?: string;
  projectKind?: ProjectKind;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  input: ProjectInput;
  config: ProjectConfig;
  hookConfig: HookConfig;
  voiceConfig: VoiceConfig;
  visualConfig: VisualConfig;
  seoConfig?: SEOConfig;
  output?: {
    audioBase64?: string;
  };

  scriptRewritten?: string;
  factCheckNotes?: string;
  chapters?: Chapter[];
  storyboard?: StoryboardScene[];
  thumbnails?: ThumbnailItem[];
  seo?: SEOPackage;
  assets?: SavedAsset[];

  creditsUsed: number;
  currentStep?: WizardStep;
  versionHistory?: ProjectVersion[];
  allowBulkDeleteImages?: boolean;
  isRecreatingStoryboard?: boolean;
  status?: string;
  generationLogs?: string[];
  renderedVideoUrl?: string;
}

export interface PipelineWizardProps {
  theme?: string;
  currentLang?: string;
  project: VideoProject;
  setProject: (p: VideoProject) => void;
  onSaveProject: (p: VideoProject) => Promise<void> | void;
  onBackToDashboard: () => void;
  costTracker?: unknown;
  setCostTracker?: unknown;
  credits?: unknown;
  setCredits?: unknown;
}

export interface IBaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string | React.ReactNode;
  children?: React.ReactNode;
  maxWidth?: string;
}

export interface ITooltipProps {
  content: string;
  children: React.ReactNode;
  position?: TooltipPosition;
}

export interface IBaseButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  isLoading?: boolean;
  size?: "xs" | "sm" | "md" | "lg";
}

export interface Voice {
  voiceURI: string;
  name: string;
  lang: string;
  localService: boolean;
  default: boolean;
  gender?: string;
  [key: string]: unknown;
}

export enum BackgroundMode {
  Auto = "auto",
  Preserve = "preserve",
  Transparent = "transparent",
  Solid = "solid",
  Contextual = "contextual",
  Blurred = "blurred",
  Gradient = "gradient",
  Studio = "studio",
}

export enum GeminiChatSpeed {
  Slow = "1",
  Normal = "3",
  Fast = "5",
  SuperFast = "7",
  HyperFast = "10",
}

export const GEMINI_CHAT_SPEED_TAB_COUNT: Record<GeminiChatSpeed, number> = {
  [GeminiChatSpeed.Slow]: 1,
  [GeminiChatSpeed.Normal]: 4,
  [GeminiChatSpeed.Fast]: 5,
  [GeminiChatSpeed.SuperFast]: 7,
  [GeminiChatSpeed.HyperFast]: 10,
};

export enum GeminiChatModelName {
  Pro = "Pro",
  Flash = "Flash",
  FlashLite = "Flash-Lite",
}

export enum GeminiChatSelector {
  Input = 'div.ql-editor[contenteditable="true"]',
  InputTextarea = 'div.ql-editor[contenteditable="true"], div[role="textbox"][contenteditable="true"]',
  ModelPickerButton = 'button[data-test-id="bard-mode-menu-button"], button.input-area-switch',
  PlusButton = 'button[aria-label*="tải lên" i], button[aria-label*="công cụ" i], gem-icon-button:has(mat-icon[fonticon="plus"]) button',
  MenuOptions = '.cdk-overlay-pane button, mat-menu button, [role="menuitem"]',
  PlusMenuOptions = '.cdk-overlay-pane button, mat-action-list button, [role="menuitem"], .toolbox-drawer-item-content-wrapper',
  SendButton = 'button[aria-label*="Gửi" i], button[aria-label*="Send" i], gem-icon-button.send-button button, div.send-button-container button',
}

export const GEMINI_CHAT_MEDIA_SELECTORS = {
  image: 'download-generated-image-button img, .attachment-container.generated-images img, model-response img.loaded, model-response img[src]',
  video: 'generated-video video[src], generated-video source[src], model-response video[src], model-response video source[src]',
  all: 'img, video',
} as const;

export enum GeminiChatTextOption {
  CreateVideoVi = "Tạo video",
  CreateImageVi = "Tạo hình ảnh",
  CreateVideoRegexStr = "Tạo video|Create video|Generate video|video",
  CreateImageRegexStr = "Tạo hình ảnh|Create image|Generate image|image",
}

export enum ImageModelLabel {
  Veo3 = "VEO 3.0 FLUID",
  Imagen = "IMAGEN 3 BATCH",
  LabsSandbox = "LABS SANDBOX",
}

export enum BatchDelayOption {
  Default = "default",
  OneSecond = "1s",
  TwoSeconds = "2s",
  ThreeSeconds = "3s",
  Random123 = "random123",
}
