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

export enum SceneAssetStatus {
  Pending = "pending",
  Generating = "generating",
  Generated = "generated",
  Validating = "validating",
  Approved = "approved",
  Rejected = "rejected",
  Retrying = "retrying",
  Failed = "failed",
}

export enum QaStatus {
  Passed = "passed",
  Failed = "failed",
  Unavailable = "unavailable",
}

export enum AssetAcceptance {
  Approved = "approved",
  AcceptedWithWarning = "accepted_with_warning",
  Rejected = "rejected",
}

export enum AudioCueType {
  Music = "music",
  SoundEffect = "sfx",
  Ambience = "ambience",
}

export enum AudioCueStatus {
  Planned = "planned",
  Available = "available",
  Approved = "approved",
}

export enum SubtitleMode {
  BurnIn = "burn_in",
  Track = "track",
  Both = "both",
}

export enum QualityMode {
  Economy = "economy",
  Balanced = "balanced",
  Premium = "premium",
}

export enum ManualReviewStatus {
  Pending = "pending",
  Approved = "approved",
  Rejected = "rejected",
}

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
  musicAssetUrl?: string;
}

export interface HookVersion {
  id: string;
  content: string;
  type: string;
  selected: boolean;
  score?: HookScore;
}

export enum FactClaimStatus {
  Verified = "verified",
  Disputed = "disputed",
  Unsupported = "unsupported",
  NeedsScope = "needs_scope",
}

export interface CreativeBrief {
  logline: string;
  centralQuestion: string;
  viewerPromise: string;
  centralMessage: string;
  audience: string;
  narrativePerspective: string;
  primaryCharacter: string;
  conflict: string;
  turningPoint: string;
  resolution: string;
  emotionalArc: string;
  visualMotifs: string[];
  forbiddenDirections: string[];
}

export enum NarrativeBeatType {
  Hook = "hook",
  Setup = "setup",
  Temptation = "temptation",
  Decision = "decision",
  Reward = "reward",
  Escalation = "escalation",
  Reversal = "reversal",
  FalseVictory = "false_victory",
  Collapse = "collapse",
  Payoff = "payoff",
}

export interface CharacterArc {
  initialState: string;
  emotionalLack: string;
  externalGoal: string;
  internalNeed: string;
  temptation: string;
  firstCompromise: string;
  escalatingChoices: string[];
  pointOfNoReturn: string;
  falseVictory: string;
  collapse: string;
  finalCost: string;
  realization: string;
}

export interface NarrativeBeat {
  id: string;
  type: NarrativeBeatType;
  event: string;
  characterStateBefore: string;
  characterStateAfter: string;
  visibleAction: string;
  retentionPurpose: string;
  targetDurationSeconds: number;
  callbackId?: string;
}

export interface CallbackPlan {
  id: string;
  setupBeatId: string;
  payoffBeatId: string;
  motif: string;
  changedMeaning: string;
}

export interface NarrativePlan {
  viewerPromise: string;
  centralQuestion: string;
  protagonist: CharacterArc;
  beats: NarrativeBeat[];
  callbacks: CallbackPlan[];
  endingPayoff: string;
}

export interface ChapterPlan {
  id: string;
  title: string;
  description: string;
  purpose: string;
  requiredBeatIds: string[];
  characterStartState: string;
  characterEndState: string;
  callbackSetupIds: string[];
  callbackPayoffIds: string[];
  forbiddenRepetition: string[];
  handoffToNextChapter: string;
}

export interface FactClaim {
  id: string;
  text: string;
  status: FactClaimStatus;
  sourceTitle: string;
  sourceUrl: string;
  publishedAt: string;
  jurisdiction: string;
  confidence: number;
  safeRewrite: string;
}

export interface FactPack {
  claims: FactClaim[];
}

export interface HookScore {
  retention: number;
  clarity: number;
  emotion: number;
  factualSafety: number;
  weightedTotal: number;
  unsupportedClaim: boolean;
  accepted: boolean;
  reasons: string[];
}

export interface ScriptQualityReport {
  continuityScore: number;
  repetitionScore: number;
  factualityScore: number;
  emotionalArcScore: number;
  conversationalScore: number;
  hookPayoffScore: number;
  durationFit: boolean;
  estimatedDurationSeconds: number;
  blockingErrors: string[];
  warnings: string[];
  suggestedPatches: string[];
  passed: boolean;
}

export interface AiOperationMetric {
  capability: string;
  provider: string;
  model: string;
  modelVersion: string;
  promptVersion: string;
  estimatedCostUsd: number;
  actualCostUsd: number;
  latencyMs: number;
  inputTokens: number;
  outputTokens: number;
  fallbackIndex: number;
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
  voiceArc?: VoiceArc;
  audioQa?: AudioQualityReport;
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
  styleTextInImageMode?: TextInImageMode;
  thumbnailTextInImageMode?: ThumbnailTextMode;
  imageFocusMode?: ImageFocusMode;
  thumbnailImageFocusMode?: ImageFocusMode;
  aspectRatio?: string;
  imageQuality?: string;
  characterConsistencyLevel?: string;
  contextConsistencyLevel?: string;
  negativePrompt?: string;
  negativeStylePrompt?: string;
  imageGeneratorEngine?: ImageGeneratorEngine;
  thumbnailCount?: number;
  thumbnailReferenceImage?: string;
  thumbnailReferenceImages?: string[];
  thumbnailSceneReferenceImages?: string[];
  thumbnailReferencePrompt?: string;
  thumbnailStyleProfile?: VisualStyleProfile;
  styleReferenceImages?: string[];
  sceneReferenceImages?: string[];
  referenceImage?: string;
  referenceImages?: string[];
  referencePrompt?: string;
  styleFingerprint?: string;
  styleReferenceLocked?: boolean;
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
  qualityMode?: QualityMode;
  batchTabCount?: number;
}

export interface CharacterConfig {
  id: string;
  name: string;
  description: string;
  images: string[];
  prompt?: string;
  extracted?: boolean;
  narrativeRole?: string;
  genderPresentation?: string;
  ageRange?: string;
  ethnicitySkinTone?: string;
  bodyBuild?: string;
  faceShape?: string;
  eyes?: string;
  nose?: string;
  hair?: string;
  signatureClothing?: string;
  accessories?: string;
  colorPalette?: string;
  silhouette?: string;
  timelineStages?: CharacterTimelineStage[];
}

export interface CharacterTimelineStage {
  id: string;
  label: string;
  outfit: string;
  expressionRange: string;
  posture: string;
  visibleCondition: string;
}

export interface VisualLocation {
  id: string;
  name: string;
  visualAnchors: string[];
  geography: string;
  timeProgression: string;
}

export interface VisualProp {
  id: string;
  name: string;
  visualAnchors: string[];
  narrativeFunction: string;
}

export interface Chapter {
  id: string;
  title: string;
  scriptSegment: string;
}

export enum ShotPurpose {
  Setup = "setup",
  Action = "action",
  Reaction = "reaction",
  Punchline = "punchline",
  Reveal = "reveal",
  Callback = "callback",
  Montage = "montage",
  EmotionalHold = "emotional_hold",
}

export interface StoryboardScene {
  id: string;
  chapterId: string;
  startTime: string;
  endTime: string;
  duration: number;
  script: string;
  subtitle: string;
  subtitleCues?: SubtitleCue[];
  prompt: string;
  generationPrompt?: string;
  assetName?: string;
  assetType?: AssetType;
  assetUrl?: string;
  assetUrls?: string[];
  assetStatus?: SceneAssetStatus;
  qaStatus?: QaStatus;
  acceptance?: AssetAcceptance;
  assetError?: string;
  dependencyHash?: string;
  assetRevisionId?: string;
  assetRevisions?: AssetRevision[];
  audioUrl?: string;
  audioBase64?: string;
  cameraMotion: string;
  effects?: string;
  lightingEffect?: string;
  transition?: string;
  characterIds?: string[];
  expectedSubjectCount?: number;
  allowBackgroundPeople?: boolean;
  layout?: "single_frame" | "split_screen" | "collage";
  textAllowed?: boolean;
  narrativeBeatId?: string;
  shotPurpose?: ShotPurpose;
  characterStage?: string;
  locationId?: string;
  propIds?: string[];
  visualIntent?: string;
  visibleAction?: string;
  reaction?: string;
  storyEvidence?: string;
  visualHook?: string;
  characterStateBefore?: string;
  characterStateAfter?: string;
  shotSize?: string;
  cameraAngle?: string;
  composition?: string;
  continuityFrom?: string;
  continuityNotes?: string;
  lighting?: string;
  callbackId?: string;
  textOverlay?: string;
}

export interface SubtitleCue {
  text: string;
  startOffsetSeconds: number;
  durationSeconds: number;
}

export interface ThumbnailItem {
  id: string;
  prompt: string;
  generationPrompt?: string;
  style: string;
  hasText: boolean;
  textText?: string;
  layout?: string;
  layoutId?: string;
  layoutRationale?: string;
  typography?: string;
  typographyId?: string;
  accentWords?: string[];
  colorSuggestion?: string;
  subjectFocus?: string;
  imageUrl?: string;
  generationStatus?: SceneAssetStatus;
  generationError?: string;
  qa?: ThumbnailQualityReport;
  approved?: boolean;
  qaStatus?: QaStatus;
  acceptance?: AssetAcceptance;
}

export interface AssetRevision {
  id: string;
  parentRevisionId?: string;
  createdAt: string;
  promptHash: string;
  assetUrl: string;
  status: SceneAssetStatus;
  provider?: string;
  model?: string;
  approvedAt?: string;
  operation?: "generated" | "retry" | "rollback" | "upscale";
}

export interface ProjectDependencyHashes {
  script?: string;
  storyboard?: string;
  voice?: string;
  seo?: string;
  thumbnails?: string;
}

export interface ManualReviewItem {
  id: string;
  scope: "scene" | "audio" | "subtitle" | "thumbnail" | "final";
  targetId?: string;
  reason: string;
  status: ManualReviewStatus;
  createdAt: string;
  resolvedAt?: string;
  note?: string;
}

export interface FinalQualityReport {
  visualBlockingErrors: number;
  audioBlockingErrors: number;
  subtitleBlockingErrors: number;
  missingAssets: number;
  continuityScore: number;
  emotionalArcScore: number;
  pacingScore: number;
  promiseAlignmentScore: number;
  blockingErrors: string[];
  warnings: string[];
  publishable: boolean;
}

export interface FinalMultimodalQualityReport {
  visualScore: number;
  cropScore: number;
  continuityScore: number;
  pacingScore: number;
  transitionVarietyScore: number;
  promiseAlignmentScore: number;
  audioMixScore: number;
  subtitleLegibilityScore: number;
  blockingErrors: string[];
  warnings: string[];
  passed: boolean;
  reviewAvailable?: boolean;
}

export interface VoiceDirection {
  emotion: string;
  speed: number;
  pauseScale: number;
}

export interface VoiceArc {
  setup: VoiceDirection;
  descent: VoiceDirection;
  isolation: VoiceDirection;
  climax: VoiceDirection;
  reckoning: VoiceDirection;
  resolution: VoiceDirection;
}

export interface AudioQualityReport {
  pronunciationScore: number;
  pauseScore: number;
  loudnessScore: number;
  naturalnessScore: number;
  emotionTransitionScore: number;
  durationFit: boolean;
  actualDurationSeconds: number;
  targetDurationSeconds: number;
  blockingErrors: string[];
  warnings: string[];
  passed: boolean;
}

export interface SubtitleQualityReport {
  maxTwoLines: boolean;
  semanticBreaks: boolean;
  readingTimeFit: boolean;
  blockingErrors: string[];
  warnings: string[];
  passed: boolean;
}

export interface EditorQualityReport {
  approvedAssetsOnly: boolean;
  intentionalTransitions: boolean;
  blockingErrors: string[];
  warnings: string[];
  passed: boolean;
}

export interface VisualStyleProfile {
  medium: string;
  characterType?: string;
  characterDna: string;
  lineDna: string;
  shapeLanguage?: string;
  colorDna: string;
  colorPhilosophy?: string;
  renderingDna: string;
  lightingStyle?: string;
  texture?: string;
  detailLevel?: string;
  visualComplexity?: string;
  periodCues: string;
  worldRendering: string;
  compositionLanguage?: string;
  facialExpressionLanguage?: string;
  overallMood?: string;
  adaptiveElements: string;
  negativeStylePrompt?: string;
  sampleSpecificContent: string[];
  lockedStyleElements?: string[];
  flexibleElements?: string[];
}

export interface VisualBible {
  colorPalette?: string;
  characterSpecs?: string;
  landscapeSpecs?: string;
  lightingMood?: string;
  visualStyle?: string;
  background?: string;
  lineStyle?: string;
  colorMode?: string;
  shading?: string;
  textPolicy?: string;
  styleFingerprint?: string;
  styleReferenceLocked?: boolean;
  styleProfile?: VisualStyleProfile;
  negativeStylePrompt?: string;
  locations?: VisualLocation[];
  props?: VisualProp[];
}

export interface StoryboardQualityReport {
  continuityScore: number;
  shotDiversityScore: number;
  visibleActionScore: number;
  editabilityScore: number;
  scriptCoverageScore?: number;
  pacingCoverageScore?: number;
  blockingErrors: string[];
  warnings: string[];
  passed: boolean;
}

export interface ImagePromptQualityIssue {
  sceneId: string;
  code: string;
  severity: "blocking" | "warning";
}

export interface ImagePromptQualityReport {
  totalPrompts: number;
  validPrompts: number;
  blockingErrors: ImagePromptQualityIssue[];
  warnings: ImagePromptQualityIssue[];
  passed: boolean;
}

export interface ContentSafetyReport {
  sensitiveTopic: boolean;
  trueCase: boolean;
  minorsInvolved: boolean;
  sexualExploitationRisk: boolean;
  victimExploitationRisk: boolean;
  privacyRisk: boolean;
  likenessRisk: boolean;
  copyrightRisk: boolean;
  requiredDisclosures: string[];
  blockingErrors: string[];
  warnings: string[];
  allowed: boolean;
}

export interface PipelineRolloutConfig {
  releaseChannel: "stable" | "canary";
  canaryEnabled: boolean;
  shadowMode: boolean;
  flags: {
    creativeBrief: boolean;
    scriptQa: boolean;
    visualQa: boolean;
    audioQa: boolean;
    thumbnailQa: boolean;
    finalQc: boolean;
  };
}

export interface PipelineBenchmark {
  totalLatencyMs: number;
  aiLatencyMs: number;
  estimatedCostUsd: number;
  actualCostUsd: number;
  retryCount: number;
  rejectCount: number;
  generatedAt: string;
}

export interface AudioCue {
  id: string;
  sceneId: string;
  type: AudioCueType;
  description: string;
  emotionalIntent: string;
  startOffsetSeconds: number;
  durationSeconds: number;
  assetUrl?: string;
  status: AudioCueStatus;
}

export interface AudioCueSheet {
  musicArc: string[];
  cues: AudioCue[];
  mixTargets: {
    narrationLufs: number;
    musicUnderVoiceDb: number;
    peakDb: number;
  };
}

export interface RenderAudioTrack {
  id: string;
  type: AudioCueType;
  assetUrl: string;
  startSeconds: number;
  durationSeconds: number;
  volumeDb: number;
  loop?: boolean;
  fadeInSeconds?: number;
  fadeOutSeconds?: number;
}

export interface PipelineShadowComparison {
  baselineProjectId?: string;
  comparedAt: string;
  sceneCountDelta: number;
  approvedSceneDelta: number;
  scriptContinuityDelta: number;
  hookPayoffDelta: number;
  durationDeltaSeconds: number;
  estimatedCostUsd: number;
  regressions: string[];
  improved: boolean;
}

export interface ThumbnailQualityReport {
  anatomyScore: number;
  characterConsistencyScore: number;
  focalClarityScore: number;
  smallSizeLegibilityScore: number;
  titlePromiseAlignmentScore: number;
  estimatedCtrScore: number;
  blockingErrors: string[];
  warnings: string[];
  passed: boolean;
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
  schemaVersion?: number;
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
  creativeBrief?: CreativeBrief;
  narrativePlan?: NarrativePlan;
  chapterPlans?: ChapterPlan[];
  factPack?: FactPack;
  scriptQa?: ScriptQualityReport;
  subtitleQa?: SubtitleQualityReport;
  editorQa?: EditorQualityReport;
  visualBible?: VisualBible;
  storyboardQa?: StoryboardQualityReport;
  imagePromptQa?: ImagePromptQualityReport;
  contentSafety?: ContentSafetyReport;
  rollout?: PipelineRolloutConfig;
  benchmark?: PipelineBenchmark;
  audioCueSheet?: AudioCueSheet;
  shadowComparison?: PipelineShadowComparison;
  aiMetrics?: AiOperationMetric[];
  dependencyHashes?: ProjectDependencyHashes;
  manualReviewItems?: ManualReviewItem[];
  finalQc?: FinalQualityReport;
  finalMultimodalQa?: FinalMultimodalQualityReport;
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
  allowAudioCleanup?: boolean;
  status?: string;
  activeRunId?: string | null;
  lastRunId?: string;
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
  Minimal = "minimal",
  Preserve = "preserve",
  Transparent = "transparent",
  Solid = "solid",
  White = "white",
  Contextual = "contextual",
  Blurred = "blurred",
  Gradient = "gradient",
  Studio = "studio",
}

export enum TextInImageMode {
  Auto = "auto",
  NoText = "no_text",
  Minimal = "minimal",
  Moderate = "moderate",
  Abundant = "abundant",
}

export enum ThumbnailTextMode {
  Headline = "headline",
  NoText = "no_text",
}

export enum StyleReferencePurpose {
  Scene = "scene",
  Thumbnail = "thumbnail",
}

export enum ImageFocusMode {
  Default = "default",
  Portrait = "portrait",
  Action = "action",
  Landscape = "landscape",
  Conceptual = "conceptual",
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
  Pro = "3.1 Pro",
  Flash = "3.7 Flash",
  FlashLite = "3.5 Flash-Lite",
}

export enum GeminiChatSelector {
  Response = "model-response",
  Input = "div.ql-editor[contenteditable=\"true\"]",
  InputTextarea = "div.ql-editor[contenteditable=\"true\"], div[role=\"textbox\"][contenteditable=\"true\"]",
  ModelPickerButton = "button[data-test-id=\"bard-mode-menu-button\"], button.input-area-switch",
  ModelMenu = "[data-test-id=\"gem-mode-menu\"]",
  ModelOption = "gem-menu-item[role=\"menuitem\"][data-test-id^=\"bard-mode-option-\"]",
  ModelLabel = ".label",
  PlusButton = "button[aria-label*=\"tải lên\" i], button[aria-label*=\"thêm tệp\" i], button[aria-label*=\"upload\" i], button[aria-label*=\"add files\" i], gem-icon-button:has(mat-icon[fonticon=\"plus\"]) button, gem-icon-button[data-test-id=\"action-menu-button\"] button, gem-icon-button[data-test-id=\"action-menu-button\"], button:has(mat-icon[fonticon=\"add\"])",
  MenuOptions = ".cdk-overlay-pane button, mat-menu button, [role=\"menuitem\"]",
  PlusMenuOptions = ".cdk-overlay-pane button, mat-action-list button, [role=\"menuitem\"], .toolbox-drawer-item-content-wrapper, .mat-mdc-menu-item",
  ActiveGenerateType = "gem-button[data-test-id=\"deselect-drawer-item-gem-button\"], button, [role=\"button\"], [aria-label], [data-test-id], .input-area-switch",
  SendButton = "button[aria-label*=\"Gửi\" i], button[aria-label*=\"Send\" i], gem-icon-button.send-button button, div.send-button-container button",
  GenerationBusy = "gem-icon-button.send-button.stop",
  ResponseGenerationBusy = ".model-response-label-announcer[aria-busy=\"true\"], [data-test-id=\"image-loading-overlay\"]:not(.done-generating)",
}

export const GEMINI_CHAT_MEDIA_SELECTORS = {
  image: "download-generated-image-button, [data-test-id=\"download-generated-image-button\"], generated-image single-image img.image.loaded[src], generated-image img[src], .attachment-container.generated-images img[src], model-response img[src^=\"blob:\"], model-response img[src*=\"googleusercontent\"], model-response img.image[src], model-response img:not(.gb_X):not(.sparkle-image):not(.mavatar-image):not(.user-icon)",
  video: "generated-video video[src], generated-video source[src], model-response video[src], model-response video source[src], model-response video, generated-video video",
  all: "img, video",
} as const;

export enum GeminiChatTextOption {
  CreateVideoVi = "Tạo video",
  CreateImageVi = "Tạo hình ảnh",
  CreateVideoRegexStr = "Tạo video|Video|Create video|Generate video",
  CreateImageRegexStr = "Tạo hình ảnh|Tạo ảnh|Vẽ hình ảnh|Create (?:an )?image|Generate (?:an )?image|Create images|Generate images",
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
