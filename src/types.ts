import { SOURCE_TEXT_DOWNLOAD_GENERATED_IMAGE_BUTTON_DATA_TEST, SOURCE_TEXT_GENERATED_VIDEO_VIDEO_SRC_GENERATED_VIDEO, SOURCE_TEXT_IMG_VIDEO } from "./constants/sourceText";
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
  Cinematic = "cinematic",
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
}
export enum AgeGroup {
  Adult = "adult",
}
export enum AssetsMode {
  Mixed = "mixed",
}
export enum ImageGeneratorEngine {
  Imagen = "imagen",
  Veo3 = "veo3",
  Veo3Lite = "veo3-lite",
  Veo3Fast = "veo3-fast",
  Veo3Quality = "veo3-quality",
  LabsSandbox = "labs-sandbox",
  GrokImagine = "grok-imagine",
}
export enum ImageGenerationMode {
  LabsFlow = "labs-flow",
  GeminiChat = "gemini-chat",
}
export enum AiPlanningFallbackProvider {
  GeminiChat = "gemini-chat",
  GrokChat = "grok-chat",
  ChatGptUi = "chatgpt-ui",
  ClaudeChat = "claude-chat",
  DeepSeekChat = "deepseek-chat",
  Disabled = "disabled",
}
export enum AiPlanningExecutionMode {
  RoomOnly = "room-only",
  Hybrid = "hybrid",
  ApiOnly = "api-only",
}
export enum AiPlanningChatModel {
  GeminiFlashLite = "gemini-flash-lite",
  GeminiFlash = "gemini-flash",
  GeminiPro = "gemini-pro",
  GeminiArgon = "gemini-argon",
  GeminiThinking = "gemini-thinking",
  GeminiDeepThink = "gemini-deep-think",
  GrokFast = "grok-fast",
  GrokBuild = "grok-build",
  GrokAuto = "grok-auto",
  GrokExpert = "grok-expert",
  GrokHeavy = "grok-heavy",
  ChatGptAuto = "chatgpt-auto",
  ClaudeAuto = "claude-auto",
  DeepSeekAuto = "deepseek-auto",
  DeepSeekStandard = "deepseek-standard",
  DeepSeekThink = "deepseek-think",
  DeepSeekSearch = "deepseek-search",
  DeepSeekThinkSearch = "deepseek-think-search",
  ClaudeFable51 = "claude-fable-5-1",
  ClaudeOpus55 = "claude-opus-5-5",
  ClaudeSonnet55 = "claude-sonnet-5-5",
  ClaudeHaiku55 = "claude-haiku-5-5",
  ClaudeFable5 = "claude-fable-5",
  ClaudeOpus5 = "claude-opus-5",
  ClaudeOpus48 = "claude-opus-4-8",
  ClaudeOpus47 = "claude-opus-4-7",
  ClaudeOpus46 = "claude-opus-4-6",
  ClaudeOpus3 = "claude-3-opus-20240229",
  ClaudeSonnet5 = "claude-sonnet-5",
  ClaudeSonnet46 = "claude-sonnet-4-6",
  ClaudeHaiku45 = "claude-haiku-4-5-20251001",
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
type AssetType = "image" | "video";
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
type CinematicTakeDecision = "use" | "trim" | "cover" | "regenerate_once" | "omit";
export enum AudioCueType {
  Music = "music",
  SoundEffect = "sfx",
  Ambience = "ambience",
}
export enum AudioCueStatus {
  Planned = "planned",
  Approved = "approved",
}
export enum SubtitleMode {
  None = "none",
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
type TooltipPosition = "top" | "bottom" | "left" | "right";
export type ButtonVariant = "primary" | "secondary" | "success" | "info" | "purple" | "amber" | "danger" | "ghost" | "outline" | "unstyled";
interface ProjectInput { type: ProjectInputType; content: string; }
interface ProjectConfig {
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
  subtitleMode?: SubtitleMode;
  filmFormat?: "single" | "series";
  episodeCount?: number;
  seriesBibleRequired?: boolean;
  planningFallbackProvider?: AiPlanningFallbackProvider;
  planningChatModel?: AiPlanningChatModel;
  planningExecutionMode?: AiPlanningExecutionMode;
  planningChromeHeadless?: boolean;
}
export interface HookVersion { id: string; content: string; type: string; selected: boolean; score?: HookScore; }
export enum FactClaimStatus {
  Verified = "verified",
  Disputed = "disputed",
  Unsupported = "unsupported",
  NeedsScope = "needs_scope",
}
export interface CreativeBrief { logline: string; centralQuestion: string; viewerPromise: string; centralMessage: string; audience: string; narrativePerspective: string; primaryCharacter: string; conflict: string; turningPoint: string; resolution: string; emotionalArc: string; visualMotifs: string[]; forbiddenDirections: string[]; }
enum NarrativeBeatType {
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
interface CharacterArc { initialState: string; emotionalLack: string; externalGoal: string; internalNeed: string; temptation: string; firstCompromise: string; escalatingChoices: string[]; pointOfNoReturn: string; falseVictory: string; collapse: string; finalCost: string; realization: string; }
interface NarrativeBeat { id: string; type: NarrativeBeatType; event: string; characterStateBefore: string; characterStateAfter: string; visibleAction: string; retentionPurpose: string; targetDurationSeconds: number; callbackId?: string; }
interface CallbackPlan { id: string; setupBeatId: string; payoffBeatId: string; motif: string; changedMeaning: string; }
interface NarrativePlan { viewerPromise: string; centralQuestion: string; protagonist: CharacterArc; beats: NarrativeBeat[]; callbacks: CallbackPlan[]; endingPayoff: string; }
interface ChapterPlan { id: string; title: string; description: string; purpose: string; requiredBeatIds: string[]; characterStartState: string; characterEndState: string; callbackSetupIds: string[]; callbackPayoffIds: string[]; forbiddenRepetition: string[]; handoffToNextChapter: string; }
export interface FactClaim { id: string; text: string; status: FactClaimStatus; sourceTitle: string; sourceUrl: string; publishedAt: string; jurisdiction: string; confidence: number; safeRewrite: string; }
export interface FactPack { claims: FactClaim[]; }
export interface HookScore { retention: number; clarity: number; emotion: number; factualSafety: number; weightedTotal: number; unsupportedClaim: boolean; accepted: boolean; reasons: string[]; }
export interface ScriptQualityReport { continuityScore: number; repetitionScore: number; factualityScore: number; emotionalArcScore: number; conversationalScore: number; hookPayoffScore: number; durationFit: boolean; estimatedDurationSeconds: number; blockingErrors: string[]; warnings: string[]; suggestedPatches: string[]; passed: boolean; }
interface AiOperationMetric { capability: string; provider: string; model: string; modelVersion: string; promptVersion: string; estimatedCostUsd: number; actualCostUsd: number; latencyMs: number; inputTokens: number; outputTokens: number; fallbackIndex: number; }
interface HookConfig { type: string; duration: number; count: number; positions: HookPosition; versions: HookVersion[]; }
export interface VoiceConfig { provider: string; audioType: AudioType; voiceName?: string; gender: Gender; age: AgeGroup; emotion: string; speed: number; pitch?: number; volume?: number; voiceURI?: string; previewUrl?: string; audioUrl?: string; audioBase64?: string; uploadedAudioName?: string; subtitleFiles?: string[]; timingLog?: string; voiceArc?: VoiceArc; audioQa?: AudioQualityReport; }
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
  referenceImageNames?: string[];
  referenceCharacterNames?: string[];
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
  videoResolution?: string;
  qualityMode?: QualityMode;
  batchTabCount?: number;
  preserveVideoAudio?: boolean;
  flowProjectId?: string;
  planningFallbackProvider?: AiPlanningFallbackProvider;
  planningChatModel?: AiPlanningChatModel;
  planningExecutionMode?: AiPlanningExecutionMode;
  planningChromeHeadless?: boolean;
  preserveAiPromptText?: boolean;
}
export interface CharacterConfig {
  id: string;
  name: string;
  description: string;
  images: string[];
  prompt?: string;
  referenceGenerationPrompt?: string;
  flowCharacterName?: string;
  flowCharacterProjectId?: string;
  flowCharacterProfileVersion?: string;
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
interface CharacterTimelineStage { id: string; label: string; outfit: string; expressionRange: string; posture: string; visibleCondition: string; }
interface VisualLocation { id: string; name: string; visualAnchors: string[]; geography: string; timeProgression: string; }
interface VisualProp { id: string; name: string; visualAnchors: string[]; narrativeFunction: string; }
export interface Chapter { id: string; title: string; scriptSegment: string; }
export enum ShotPurpose {
  Setup = "setup",
  Action = "action",
  Reaction = "reaction",
  Punchline = "punchline",
  Reveal = "reveal",
  Callback = "callback",
  Montage = "montage",
  EmotionalHold = "emotional_hold",
  Obstacle = "obstacle",
  Decision = "decision",
  Escalation = "escalation",
  Reversal = "reversal",
  Climax = "climax",
  Payoff = "payoff",
  Transition = "transition",
}
export interface CinematicEditSegment { segmentId: string; inSeconds: number; outSeconds: number; shotRole: "master" | "coverage" | "reaction" | "insert" | "transition" | "payoff"; storyContribution: string; transition: "cut" | "match_cut" | "cross_dissolve" | "fade_black"; audioBridgeMode: "hard" | "j_cut" | "l_cut" | "ambience"; containsDialogue: boolean; }
export interface StoryboardScene {
  id: string;
  chapterId: string;
  startTime: string;
  endTime: string;
  duration: number;
  _start?: number;
  _end?: number;
  script: string;
  subtitle: string;
  subtitleCues?: SubtitleCue[];
  prompt: string;
  generationPrompt?: string;
  generationPromptProfileVersion?: string;
  assetName?: string;
  assetType?: AssetType;
  assetUrl?: string;
  assetUrls?: string[];
  assetStatus?: SceneAssetStatus;
  qaStatus?: QaStatus;
  acceptance?: AssetAcceptance;
  assetError?: string;
  remoteVideoMediaId?: string;
  remoteVideoMediaIds?: string[];
  remoteVideoSourceUrl?: string;
  remoteVideoExpectedCount?: number;
  remoteVideoDownloadPending?: boolean;
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
  narrativeRole?: string;
  storyQuestion?: string;
  storyChange?: string;
  isFilmIntro?: boolean;
  introTitle?: string;
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
  assetStrategy?: "archival" | "ai_generated";
  archivalSearchQuery?: string;
  archivalRationale?: string;
  archivalSourceUrl?: string;
  archivalLicense?: string;
  sequenceId?: string;
  shotId?: string;
  shotRole?: "master" | "coverage" | "reaction" | "insert" | "transition" | "payoff";
  dialogueMode?: "narration" | "on_screen_dialogue" | "off_screen_dialogue" | "silent_action";
  spokenDialogue?: string;
  speakerCharacterId?: string;
  lipSyncRequired?: boolean;
  characterBlocking?: string;
  eyelineDirection?: string;
  screenDirection?: string;
  actionStartState?: string;
  actionEndState?: string;
  locationState?: string;
  wardrobeState?: string;
  propState?: string;
  soundDesignCues?: string[];
  cinematicBeats?: Array<{
    sourceSceneId: string;
    shotId: string;
    shotRole: "master" | "coverage" | "reaction" | "insert" | "transition" | "payoff";
    shotSize: string;
    cameraAngle: string;
    visibleAction: string;
    reaction: string;
    transition: "hard_cut" | "match_cut" | "motivated_reframe";
    dialogueMode: "narration" | "on_screen_dialogue" | "off_screen_dialogue" | "silent_action";
    spokenDialogue: string;
    speakerCharacterId: string;
    lipSyncRequired: boolean;
    startSecond?: number;
    endSecond?: number;
  }>;
  cinematicContinuityHandoff?: {
    previousClipId: string;
    previousEndState: string;
    requiredOpeningState: string;
    locationLock: string;
    wardrobeLock: string;
    propLock: string;
    screenDirectionLock: string;
    eyelineLock: string;
    lightingLock: string;
  };
  sourceTrimStartSeconds?: number;
  sourceTrimEndSeconds?: number;
  sourceCrop?: string;
  clipQaWarnings?: string[];
  cinematicTakeDecision?: CinematicTakeDecision;
  cinematicTakeDecisionReason?: string;
  cinematicContinuityScore?: number;
  cinematicStoryClarityScore?: number;
  cinematicPerformanceScore?: number;
  cinematicDialogueCoverageScore?: number;
  cinematicDialogueDetected?: boolean;
  cinematicSpeechAnalysisAvailable?: boolean;
  cinematicDetectedSpeechRanges?: Array<[number, number]>;
  cinematicRecognizedTranscript?: string;
  cinematicDialogueCoverageRatio?: number;
  cinematicDialogueTextMatchScore?: number;
  cinematicDialogueMismatch?: boolean;
  cinematicSelectedDuration?: number;
  cinematicSimilarSceneId?: string;
  cinematicVisualSimilarityScore?: number;
  cinematicObservedShotCount?: number;
  cinematicEditSegments?: CinematicEditSegment[];
  cinematicAudioBridgeMode?: "hard" | "j_cut" | "l_cut" | "ambience";
  cinematicSupportShotType?: "none" | "reaction" | "insert" | "environment" | "aftermath";
  cinematicPolicyReview?: { violatesPolicy: boolean; risks: string[]; rationale: string };
}
export interface SubtitleCue { text: string; startOffsetSeconds: number; durationSeconds: number; }
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
export interface AssetRevision { id: string; parentRevisionId?: string; createdAt: string; promptHash: string; assetUrl: string; status: SceneAssetStatus; provider?: string; model?: string; approvedAt?: string; operation?: "generated" | "retry" | "rollback" | "upscale"; }
interface ProjectDependencyHashes { script?: string; storyboard?: string; voice?: string; seo?: string; thumbnails?: string; }
export interface ManualReviewItem { id: string; scope: "scene" | "audio" | "subtitle" | "thumbnail" | "final"; targetId?: string; reason: string; status: ManualReviewStatus; createdAt: string; resolvedAt?: string; note?: string; }
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
  releaseStatus: "technical_complete" | "completed_with_warnings" | "editorially_publishable";
}
export interface FinalMultimodalQualityReport { visualScore: number; cropScore: number; continuityScore: number; pacingScore: number; transitionVarietyScore: number; promiseAlignmentScore: number; audioMixScore: number; subtitleLegibilityScore: number; blockingErrors: string[]; warnings: string[]; passed: boolean; reviewAvailable?: boolean; }
export interface VoiceDirection { emotion: string; speed: number; pauseScale: number; }
export interface VoiceArc { setup: VoiceDirection; descent: VoiceDirection; isolation: VoiceDirection; climax: VoiceDirection; reckoning: VoiceDirection; resolution: VoiceDirection; }
export interface AudioQualityReport { pronunciationScore: number; pauseScore: number; loudnessScore: number; naturalnessScore: number; emotionTransitionScore: number; durationFit: boolean; actualDurationSeconds: number; targetDurationSeconds: number; blockingErrors: string[]; warnings: string[]; passed: boolean; }
export interface SubtitleQualityReport { maxTwoLines: boolean; semanticBreaks: boolean; readingTimeFit: boolean; blockingErrors: string[]; warnings: string[]; passed: boolean; }
export interface EditorQualityReport { approvedAssetsOnly: boolean; intentionalTransitions: boolean; blockingErrors: string[]; warnings: string[]; passed: boolean; }
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
export interface StoryboardQualityReport { continuityScore: number; shotDiversityScore: number; visibleActionScore: number; editabilityScore: number; scriptCoverageScore?: number; pacingCoverageScore?: number; blockingErrors: string[]; warnings: string[]; passed: boolean; }
export interface ImagePromptQualityIssue { sceneId: string; code: string; severity: "blocking" | "warning"; }
export interface ImagePromptQualityReport { totalPrompts: number; validPrompts: number; blockingErrors: ImagePromptQualityIssue[]; warnings: ImagePromptQualityIssue[]; passed: boolean; }
export interface ContentSafetyReport { sensitiveTopic: boolean; trueCase: boolean; minorsInvolved: boolean; sexualExploitationRisk: boolean; victimExploitationRisk: boolean; privacyRisk: boolean; likenessRisk: boolean; copyrightRisk: boolean; requiredDisclosures: string[]; blockingErrors: string[]; warnings: string[]; allowed: boolean; }
export interface PipelineRolloutConfig { releaseChannel: "stable" | "canary"; canaryEnabled: boolean; shadowMode: boolean; qaMode: "advisory"; maxEditorialRepairAttempts: 1; flags: { creativeBrief: boolean; scriptQa: boolean; visualQa: boolean; audioQa: boolean; thumbnailQa: boolean; finalQc: boolean }; }
export interface PipelineBenchmark { totalLatencyMs: number; aiLatencyMs: number; estimatedCostUsd: number; actualCostUsd: number; retryCount: number; rejectCount: number; generatedAt: string; }
export interface AudioCue { id: string; sceneId: string; type: AudioCueType; description: string; emotionalIntent: string; startOffsetSeconds: number; durationSeconds: number; assetUrl?: string; status: AudioCueStatus; }
export interface AudioCueSheet { musicArc: string[]; cues: AudioCue[]; mixTargets: { narrationLufs: number; musicUnderVoiceDb: number; peakDb: number }; }
export interface RenderAudioTrack { id: string; type: AudioCueType; assetUrl: string; startSeconds: number; durationSeconds: number; volumeDb: number; loop?: boolean; fadeInSeconds?: number; fadeOutSeconds?: number; }
export interface PipelineShadowComparison { baselineProjectId?: string; comparedAt: string; sceneCountDelta: number; approvedSceneDelta: number; scriptContinuityDelta: number; hookPayoffDelta: number; durationDeltaSeconds: number; estimatedCostUsd: number; regressions: string[]; improved: boolean; }
export interface ThumbnailQualityReport { anatomyScore: number; characterConsistencyScore: number; focalClarityScore: number; smallSizeLegibilityScore: number; titlePromiseAlignmentScore: number; estimatedCtrScore: number; blockingErrors: string[]; warnings: string[]; passed: boolean; }
export interface SEOMetadata { text: string; searchScore: number; ctrScore: number; compScore: number; seoScore: number; }
export interface SEOPackage { titles: SEOMetadata[]; descriptions: SEOMetadata[]; hashtags: string[]; tags: string[]; }
interface SavedAsset { id: string; name: string; type: string; url: string; sceneId?: string; }
interface ProjectVersion { id: string; timestamp: string; note: string; scriptPreview: string; }
interface SEOConfig { numTitles: number; numDescriptions: number; numHashtags: number; numTags: number; }
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
  cinematicScriptArtifacts?: {
    sourceSignature: string;
    schemaVersion?: string;
    filmPackage?: Record<string, unknown>;
    updatedAt: string;
  };
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
  allowReferenceCleanup?: boolean;
  resetDerivedData?: boolean;
  status?: string;
  activeRunId?: string | null;
  lastRunId?: string;
  generationLogs?: string[];
  generationDiagnostics?: Array<{
    timestamp: string;
    message: string;
    detail?: unknown;
  }>;
  generationCheckpoint?: {
    intent: "new" | "continue" | "render_only";
    phase: string;
    lastSuccessfulPhase?: string;
    completedSceneIds: string[];
    pendingSceneIds: string[];
    failedSceneIds: string[];
    renderJobId?: string | null;
    updatedAt: string;
  };
  renderedVideoUrl?: string;
}
export interface IBaseModalProps { isOpen: boolean; onClose: () => void; title?: string | React.ReactNode; children?: React.ReactNode; maxWidth?: string; }
export interface ITooltipProps { content: string; children: React.ReactNode; position?: TooltipPosition; }
export interface IBaseButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> { variant?: ButtonVariant; isLoading?: boolean; size?: "xs" | "sm" | "md" | "lg"; }
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
  Slow = "2",
  Normal = "3",
  Fast = "5",
  SuperFast = "7",
  HyperFast = "10",
}
export const GEMINI_CHAT_SPEED_TAB_COUNT: Record<GeminiChatSpeed, number> = {
  [GeminiChatSpeed.Slow]: 2,
  [GeminiChatSpeed.Normal]: 3,
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
  Input = 'div.ql-editor[contenteditable="true"]',
  InputTextarea = 'div.ql-editor[contenteditable="true"], div[role="textbox"][contenteditable="true"]',
  ModelPickerButton = 'button[data-test-id="bard-mode-menu-button"], button.input-area-switch',
  ModelMenu = '[data-test-id="gem-mode-menu"]',
  ModelOption = 'gem-menu-item[role="menuitem"][data-test-id^="bard-mode-option-"]',
  ModelLabel = ".label",
  PlusButton = 'button[aria-label*="tải lên" i], button[aria-label*="thêm tệp" i], button[aria-label*="upload" i], button[aria-label*="add files" i], gem-icon-button:has(mat-icon[fonticon="plus"]) button, gem-icon-button[data-test-id="action-menu-button"] button, gem-icon-button[data-test-id="action-menu-button"], button:has(mat-icon[fonticon="add"])',
  PlusMenuOptions = '.cdk-overlay-pane button, mat-action-list button, [role="menuitem"], [role="menuitemcheckbox"], .toolbox-drawer-item-content-wrapper, .mat-mdc-menu-item',
  ActiveGenerateType = 'gem-button[data-test-id="deselect-drawer-item-gem-button"], button, [role="button"], [aria-label], [data-test-id], .input-area-switch',
  SendButton = 'button[aria-label*="Gửi" i], button[aria-label*="Send" i], gem-icon-button.send-button button, div.send-button-container button',
  GenerationBusy = "gem-icon-button.send-button.stop",
  ResponseGenerationBusy = '.model-response-label-announcer[aria-busy="true"], [data-test-id="image-loading-overlay"]:not(.done-generating)',
}
export const GEMINI_CHAT_MEDIA_SELECTORS = {
  image: SOURCE_TEXT_DOWNLOAD_GENERATED_IMAGE_BUTTON_DATA_TEST,
  video: SOURCE_TEXT_GENERATED_VIDEO_VIDEO_SRC_GENERATED_VIDEO,
  all: SOURCE_TEXT_IMG_VIDEO,
} as const;
export enum GeminiChatTextOption {
  CreateVideoVi = "Tạo video",
  CreateImageVi = "Tạo hình ảnh",
}
export enum ImageModelLabel {
  Veo3 = "VEO 3.0 FLUID",
  Imagen = "IMAGEN 3 BATCH",
  LabsSandbox = "GEMINI IMAGES · NANO BANANA 2",
}
export enum BatchDelayOption {
  Default = "default",
  OneSecond = "1s",
  TwoSeconds = "2s",
  ThreeSeconds = "3s",
  Random123 = "random123",
}
